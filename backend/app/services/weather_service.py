from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, status

from app.config.settings import get_settings
from app.schemas.weather import WeatherCondition, WeatherLocation, WeatherResponse


settings = get_settings()


class WeatherService:
    def __init__(self) -> None:
        self.base_url = settings.openweather_base_url
        self.api_key = settings.openweather_api_key
        self.default_city = settings.openweather_default_city
        self.units = settings.openweather_units

    def _build_params(
        self,
        city: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> dict[str, str | float]:
        params: dict[str, str | float] = {
            "appid": self.api_key,
            "units": self.units,
        }

        if latitude is not None and longitude is not None:
            params["lat"] = latitude
            params["lon"] = longitude
        else:
            params["q"] = (city or self.default_city).strip()

        return params

    async def get_current_weather(
        self,
        city: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> WeatherResponse:
        if not self.api_key or self.api_key == "replace-with-your-openweather-key":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenWeather API key is not configured.",
            )

        params = self._build_params(city=city, latitude=latitude, longitude=longitude)

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            detail = "Unable to fetch weather data from OpenWeather."
            if exc.response is not None:
                api_message = exc.response.json().get("message") if exc.response.content else None
                if api_message:
                    detail = f"OpenWeather error: {api_message}"
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Weather service is temporarily unavailable.",
            ) from exc

        weather_items = payload.get("weather", [])
        conditions = [
            WeatherCondition(
                id=item.get("id", 0),
                main=item.get("main", ""),
                description=item.get("description", ""),
                icon=item.get("icon", ""),
            )
            for item in weather_items
        ]

        coord = payload.get("coord", {})
        sys_info = payload.get("sys", {})
        main_info = payload.get("main", {})
        wind_info = payload.get("wind", {})
        cloud_info = payload.get("clouds", {})

        return WeatherResponse(
            location=WeatherLocation(
                city=payload.get("name", city or self.default_city),
                country=sys_info.get("country"),
                latitude=coord.get("lat", latitude or 0.0),
                longitude=coord.get("lon", longitude or 0.0),
            ),
            timestamp=datetime.now(timezone.utc),
            temperature=float(main_info.get("temp", 0.0)),
            feels_like=float(main_info.get("feels_like", 0.0)),
            humidity=int(main_info.get("humidity", 0)),
            pressure=int(main_info.get("pressure", 0)),
            visibility=payload.get("visibility"),
            wind_speed=wind_info.get("speed"),
            cloud_cover=cloud_info.get("all"),
            conditions=conditions,
        )
