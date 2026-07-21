from fastapi import APIRouter, Depends, Query

from app.common.dependencies import get_weather_service
from app.schemas.weather import WeatherResponse
from app.services.weather_service import WeatherService


router = APIRouter(tags=["weather"])


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    city: str | None = Query(default=None, description="City name"),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    weather_service: WeatherService = Depends(get_weather_service),
) -> WeatherResponse:
    return await weather_service.get_current_weather(
        city=city,
        latitude=latitude,
        longitude=longitude,
    )
