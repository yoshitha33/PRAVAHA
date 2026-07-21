from fastapi import Request

from app.auth.repositories.user_repository import UserRepository
from app.auth.services.auth_service import AuthService
from app.services.prediction_service import TrafficPredictionService
from app.services.weather_service import WeatherService


def get_user_repository() -> UserRepository:
    return UserRepository()


def get_auth_service() -> AuthService:
    return AuthService(get_user_repository())


def get_weather_service() -> WeatherService:
    return WeatherService()


def get_prediction_service(request: Request) -> TrafficPredictionService:
    prediction_service = getattr(request.app.state, "prediction_service", None)
    if prediction_service is None:
        raise RuntimeError("Traffic prediction service has not been initialized.")
    return prediction_service
