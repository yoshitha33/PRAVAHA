import io
import os
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"
CUSTOM_MODEL_PATH = MODEL_DIR / "yolo_traffic.pt"
ALT_MODEL_PATH = MODEL_DIR / "best.pt"

# COCO class IDs for vehicles
# 2 = car, 3 = motorcycle, 5 = bus, 7 = truck, 1 = bicycle
VEHICLE_CLASS_MAP: dict[int, str] = {
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# How many frames to sample per second of video (keeps inference fast)
FRAMES_PER_SECOND_SAMPLE = 2
# Maximum frames to process regardless of video length
MAX_FRAMES = 120


def _classify(cls_id: int, model_names: dict[int, str]) -> str | None:
    """
    Return the canonical vehicle category for a detected class id.
    Supports both COCO pre-trained IDs and custom-trained models whose
    class names match the COCO label strings.
    Returns None if the detection is not a vehicle.
    """
    # Try by COCO numeric id first
    if cls_id in VEHICLE_CLASS_MAP:
        return VEHICLE_CLASS_MAP[cls_id]

    # Fallback: use the model's own class name string
    label = model_names.get(cls_id, "").lower()
    for vehicle in ("car", "bus", "truck", "motorcycle", "bicycle"):
        if vehicle in label:
            return vehicle
    return None


def _aggregate(category: str, counts: dict[str, int]) -> None:
    """Increment the right bucket in counts dict."""
    if category in ("car",):
        counts["car"] += 1
    elif category in ("motorcycle", "bicycle"):
        counts["motorcycle"] += 1
    elif category == "bus":
        counts["bus"] += 1
    elif category == "truck":
        counts["truck"] += 1


def _density(total: int) -> str:
    if total > 50:
        return "High"
    if total > 20:
        return "Medium"
    return "Low"


class YOLODetectionService:
    def __init__(self) -> None:
        self.model: Any = None
        self._load_model()

    # ------------------------------------------------------------------
    # Model loading
    # ------------------------------------------------------------------

    def _load_model(self) -> None:
        """Load custom weights if available, otherwise fall back to yolov8n.pt."""
        try:
            from ultralytics import YOLO  # type: ignore

            if CUSTOM_MODEL_PATH.exists():
                print(f"Loading custom YOLO model from {CUSTOM_MODEL_PATH} …")
                self.model = YOLO(str(CUSTOM_MODEL_PATH))
            elif ALT_MODEL_PATH.exists():
                print(f"Loading custom YOLO model from {ALT_MODEL_PATH} …")
                self.model = YOLO(str(ALT_MODEL_PATH))
            else:
                print("No custom model found — using default yolov8n.pt.")
                self.model = YOLO("yolov8n.pt")

            print("YOLO model loaded successfully.")
        except Exception as exc:
            print(f"YOLO initialization failed: {exc}")
            self.model = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def detect_from_image_bytes(self, image_bytes: bytes) -> dict[str, Any]:
        """Run inference on a single in-memory image."""
        counts = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}

        if self.model is None or not image_bytes:
            return self._build_result(counts, source_type="image")

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            results = self.model.predict(source=image, conf=0.45, verbose=False)
            self._process_results(results, counts)
        except Exception as exc:
            print(f"Image inference error: {exc}")

        return self._build_result(counts, source_type="image")

    def detect_from_video_bytes(self, video_bytes: bytes, content_type: str = "video/mp4") -> dict[str, Any]:
        """
        Run inference on a video by sampling frames.
        Returns aggregated counts across all sampled frames.
        """
        counts = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}

        if self.model is None or not video_bytes:
            return self._build_result(counts, source_type="video")

        # Determine file extension from MIME type
        ext_map = {
            "video/mp4": ".mp4",
            "video/x-msvideo": ".avi",
            "video/quicktime": ".mov",
            "video/x-matroska": ".mkv",
            "video/webm": ".webm",
        }
        suffix = ext_map.get(content_type, ".mp4")

        tmp_path: str | None = None
        try:
            import cv2  # type: ignore

            # Write bytes to a temp file so OpenCV can open it
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(video_bytes)
                tmp_path = tmp.name

            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                print("Could not open video file.")
                return self._build_result(counts, source_type="video")

            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frame_interval = max(1, int(fps / FRAMES_PER_SECOND_SAMPLE))
            total_frames_in_video = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            frame_idx = 0
            sampled = 0

            while sampled < MAX_FRAMES:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % frame_interval == 0:
                    # Convert BGR → RGB PIL image
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(rgb)
                    results = self.model.predict(source=pil_img, conf=0.45, verbose=False)
                    self._process_results(results, counts)
                    sampled += 1

                frame_idx += 1

            cap.release()
            print(
                f"Video processed: {total_frames_in_video} total frames, "
                f"{sampled} sampled, interval={frame_interval}."
            )

        except Exception as exc:
            print(f"Video inference error: {exc}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

        return self._build_result(counts, source_type="video")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _process_results(self, results: Any, counts: dict[str, int]) -> None:
        """Extract vehicle detections from YOLO results and update counts."""
        if not results:
            return
        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                if confidence < 0.45:
                    continue
                category = _classify(cls_id, self.model.names)
                if category is not None:
                    _aggregate(category, counts)

    @staticmethod
    def _build_result(counts: dict[str, int], source_type: str) -> dict[str, Any]:
        total = sum(counts.values())
        return {
            "vehicle_counts": {
                "car": counts["car"],
                "motorcycle": counts["motorcycle"],
                "bus": counts["bus"],
                "truck": counts["truck"],
            },
            "total_vehicles": total,
            "traffic_density": _density(total),
            "source_type": source_type,
        }

    # ------------------------------------------------------------------
    # Legacy compat (kept so nothing else breaks if it calls detect_vehicles)
    # ------------------------------------------------------------------

    def detect_vehicles(self, image_bytes: bytes | None = None) -> dict[str, Any]:
        """Backward-compatible wrapper — delegates to detect_from_image_bytes."""
        if image_bytes and len(image_bytes) > 0:
            result = self.detect_from_image_bytes(image_bytes)
        else:
            # Demo / no-file mode
            result = self._build_result(
                {"car": 63, "motorcycle": 44, "bus": 7, "truck": 5},
                source_type="demo",
            )

        # Old callers expect flat keys: cars, bikes, bus, truck, density, total_vehicles
        vc = result["vehicle_counts"]
        return {
            "cars": vc["car"],
            "bikes": vc["motorcycle"],
            "bus": vc["bus"],
            "truck": vc["truck"],
            "density": result["traffic_density"],
            "total_vehicles": result["total_vehicles"],
        }
