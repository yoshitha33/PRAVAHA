from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel

from app.services.yolo_service import YOLODetectionService

router = APIRouter(tags=["detection"])
yolo_service = YOLODetectionService()


class DetectionResponse(BaseModel):
    cars: int
    bikes: int
    bus: int
    truck: int
    density: str
    total_vehicles: int


@router.post("/detect", response_model=DetectionResponse)
async def run_vehicle_detection(file: UploadFile | None = File(default=None)) -> DetectionResponse:
    image_bytes: bytes | None = None

    if file is not None:
        image_bytes = await file.read()

    result = yolo_service.detect_vehicles(image_bytes=image_bytes)

    return DetectionResponse(
        cars=result["cars"],
        bikes=result["bikes"],
        bus=result["bus"],
        truck=result["truck"],
        density=result["density"],
        total_vehicles=result["total_vehicles"],
    )
