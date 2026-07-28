from fastapi import APIRouter, Depends, status

from app.common.dependencies import get_prediction_service
from app.schemas.prediction import TrafficPredictionRequest, TrafficPredictionResponse
from app.services.prediction_service import TrafficPredictionService


router = APIRouter(tags=["prediction"])


@router.post(
    "/predict",
    response_model=TrafficPredictionResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_200_OK,
    summary="Predict traffic congestion",
    description="Accepts a single traffic record and returns the predicted congestion class.",
)
async def predict_congestion(
    payload: TrafficPredictionRequest,
    prediction_service: TrafficPredictionService = Depends(get_prediction_service),
) -> TrafficPredictionResponse:
    # Keep the route thin and push all transformation and inference into the service layer.
    return prediction_service.predict(payload)
