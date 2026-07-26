from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.yolo_service import YOLODetectionService

router = APIRouter(tags=["detection"])

# Single shared instance — model weights are loaded once at startup
yolo_service = YOLODetectionService()

# MIME types accepted for each category
IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}

VIDEO_CONTENT_TYPES = {
    "video/mp4",
    "video/x-msvideo",   # .avi
    "video/quicktime",   # .mov
    "video/x-matroska",  # .mkv
    "video/webm",
}


class VehicleCounts(BaseModel):
    car: int
    motorcycle: int
    bus: int
    truck: int


class DetectionResponse(BaseModel):
    vehicle_counts: VehicleCounts
    total_vehicles: int
    traffic_density: str   # "Low" | "Medium" | "High"
    source_type: str       # "image" | "video"


@router.post("/detect", response_model=DetectionResponse)
async def run_vehicle_detection(
    file: UploadFile = File(..., description="Image (JPEG/PNG/WEBP) or video (MP4/AVI/MOV/MKV/WEBM)"),
) -> DetectionResponse:
    """
    Detect and count vehicles in an uploaded image or video.

    - **Image**: single-frame inference, returns counts immediately.
    - **Video**: frames are sampled at 2 fps (up to 120 frames) and counts
      are aggregated across all sampled frames.

    Returns per-vehicle counts, total count, and a traffic density label.
    """
    content_type = (file.content_type or "").lower()

    # Normalise common browser quirks (e.g. "image/jpg" → "image/jpeg")
    if content_type == "image/jpg":
        content_type = "image/jpeg"

    if content_type not in IMAGE_CONTENT_TYPES and content_type not in VIDEO_CONTENT_TYPES:
        # Last-resort: sniff from filename extension
        filename = (file.filename or "").lower()
        if filename.endswith((".jpg", ".jpeg")):
            content_type = "image/jpeg"
        elif filename.endswith(".png"):
            content_type = "image/png"
        elif filename.endswith(".webp"):
            content_type = "image/webp"
        elif filename.endswith(".mp4"):
            content_type = "video/mp4"
        elif filename.endswith(".avi"):
            content_type = "video/x-msvideo"
        elif filename.endswith(".mov"):
            content_type = "video/quicktime"
        elif filename.endswith(".mkv"):
            content_type = "video/x-matroska"
        elif filename.endswith(".webm"):
            content_type = "video/webm"
        else:
            raise HTTPException(
                status_code=415,
                detail=(
                    "Unsupported file type. "
                    "Upload a JPEG / PNG / WEBP image or an MP4 / AVI / MOV / MKV / WEBM video."
                ),
            )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if content_type in IMAGE_CONTENT_TYPES:
        result = yolo_service.detect_from_image_bytes(file_bytes)
    else:
        result = yolo_service.detect_from_video_bytes(file_bytes, content_type=content_type)

    vc = result["vehicle_counts"]
    return DetectionResponse(
        vehicle_counts=VehicleCounts(
            car=vc["car"],
            motorcycle=vc["motorcycle"],
            bus=vc["bus"],
            truck=vc["truck"],
        ),
        total_vehicles=result["total_vehicles"],
        traffic_density=result["traffic_density"],
        source_type=result["source_type"],
    )
