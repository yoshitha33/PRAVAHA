from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config.settings import get_settings


settings = get_settings()
client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.mongo_uri)


async def close_mongo_connection() -> None:
    global client
    if client is not None:
        client.close()
        client = None


def get_database() -> AsyncIOMotorDatabase:
    if client is None:
        raise RuntimeError("MongoDB client is not initialized.")
    return client[settings.mongo_database]
