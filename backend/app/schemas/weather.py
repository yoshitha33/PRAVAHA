from datetime import datetime

from pydantic import BaseModel, Field


class WeatherRequest(BaseModel):
    city: str | None = Field(default=None, description="City name to fetch weather for")
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class WeatherCondition(BaseModel):
    id: int
    main: str
    description: str
    icon: str


class WeatherLocation(BaseModel):
    city: str
    country: str | None = None
    latitude: float
    longitude: float


class WeatherResponse(BaseModel):
    location: WeatherLocation
    timestamp: datetime
    temperature: float
    feels_like: float
    humidity: int
    pressure: int
    visibility: int | None = None
    wind_speed: float | None = None
    cloud_cover: int | None = None
    conditions: list[WeatherCondition]
