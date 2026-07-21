import io
from pathlib import Path
from typing import Any

from PIL import Image

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"
CUSTOM_MODEL_PATH = MODEL_DIR / "yolo_traffic.pt"
ALT_MODEL_PATH = MODEL_DIR / "best.pt"


class YOLODetectionService:
    def __init__(self) -> None:
        self.model: Any = None
        self._load_model()

    def _load_model(self) -> None:
        """Loads custom trained YOLOv8 model weights if available, else defaults to yolov8n.pt."""
        try:
            from ultralytics import YOLO  # type: ignore

            if CUSTOM_MODEL_PATH.exists():
                print(f"Loading custom trained YOLO model from {CUSTOM_MODEL_PATH}...")
                self.model = YOLO(str(CUSTOM_MODEL_PATH))
            elif ALT_MODEL_PATH.exists():
                print(f"Loading custom trained YOLO model from {ALT_MODEL_PATH}...")
                self.model = YOLO(str(ALT_MODEL_PATH))
            else:
                print("No custom yolo_traffic.pt found in backend/models/. Loading default yolov8n.pt...")
                self.model = YOLO("yolov8n.pt")

            print("Successfully loaded YOLO model weights.")
        except Exception as exc:
            print(f"YOLOv8 initialization notice: {exc}")
            self.model = None

    def detect_vehicles(self, image_bytes: bytes | None = None) -> dict[str, Any]:
        """Runs YOLO object detection on image bytes with strict confidence & vehicle filtering."""
        cars = 0
        bikes = 0
        bus = 0
        truck = 0
        is_user_uploaded_file = image_bytes is not None and len(image_bytes) > 0

        if self.model is not None and is_user_uploaded_file:
            try:
                # Open uploaded image from bytes
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                
                # Run prediction with conf >= 0.45
                results = self.model.predict(
                    source=image,
                    conf=0.45,
                    verbose=False,
                )

                if results and len(results) > 0:
                    boxes = results[0].boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        confidence = float(box.conf[0].item())

                        if confidence < 0.45:
                            continue

                        # COCO or custom trained class IDs: 2=car, 3=motorcycle, 5=bus, 7=truck
                        if cls_id in (0, 2):  # Car / custom vehicle
                            cars += 1
                        elif cls_id in (1, 3):  # Bike / motorcycle
                            bikes += 1
                        elif cls_id in (2, 5):  # Bus
                            bus += 1
                        elif cls_id in (3, 7):  # Truck / Heavy vehicle
                            truck += 1

            except Exception as exc:
                print(f"Error during YOLO inference: {exc}")

        # ONLY use sample count if NO file was uploaded at all (demo mode)
        if not is_user_uploaded_file:
            cars = 63
            bikes = 44
            bus = 7
            truck = 5

        total_vehicles = cars + bikes + bus + truck
        if total_vehicles > 50:
            density = "High"
        elif total_vehicles > 20:
            density = "Medium"
        else:
            density = "Low"

        return {
            "cars": cars,
            "bikes": bikes,
            "bus": bus,
            "truck": truck,
            "density": density,
            "total_vehicles": total_vehicles,
        }
