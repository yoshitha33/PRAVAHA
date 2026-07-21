from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PRAVAHA API"
    app_version: str = "0.1.0"
    app_description: str = "FastAPI backend for PRAVAHA traffic prediction."
    api_prefix: str = "/api/v1"
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_database: str = "pravaha"
    jwt_secret_key: str = "change-this-secret-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    bcrypt_rounds: int = 12
    openweather_api_key: str = "replace-with-your-openweather-key"
    openweather_base_url: str = "https://api.openweathermap.org/data/2.5/weather"
    openweather_units: str = "metric"
    openweather_default_city: str = "Bengaluru"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
