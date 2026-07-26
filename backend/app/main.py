from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.detect import router as detect_router
from app.api.v1.events import router as events_router
from app.api.v1.health import router as health_router
from app.api.v1.route import router as route_router
from app.api.v1.road_status import router as road_status_router
from app.api.v1.weather import router as weather_router
from app.api.v1.websocket import router as websocket_router
from app.api.predict import router as prediction_router
from app.common.exception_handlers import register_exception_handlers
from app.config.settings import get_settings
from app.database.mongodb import close_mongo_connection, connect_to_mongo
from app.services.prediction_service import TrafficPredictionService

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Register CORS Middleware to allow requests from the React Native Expo web portal
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


@app.on_event("startup")
async def startup_event() -> None:
    await connect_to_mongo()
    # Load the traffic prediction artifacts once and reuse them for the app lifetime.
    app.state.prediction_service = TrafficPredictionService.load_from_disk()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await close_mongo_connection()


app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(weather_router, prefix=settings.api_prefix)
app.include_router(route_router, prefix=settings.api_prefix)
app.include_router(road_status_router, prefix=settings.api_prefix)
app.include_router(detect_router, prefix=settings.api_prefix)
app.include_router(events_router, prefix=settings.api_prefix)
app.include_router(websocket_router)
app.include_router(prediction_router, prefix=settings.api_prefix)
