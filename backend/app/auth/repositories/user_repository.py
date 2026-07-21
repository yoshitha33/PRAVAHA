from datetime import datetime, timezone

from app.config.settings import get_settings
from app.database.mongodb import get_database
from app.models.user import UserInDB


settings = get_settings()


class UserRepository:
    def __init__(self, collection_name: str = "users") -> None:
        self.collection_name = collection_name

    @property
    def collection(self):
        return get_database()[self.collection_name]

    async def find_by_email(self, email: str) -> UserInDB | None:
        normalized_email = email.strip().lower()
        document = await self.collection.find_one({"email": normalized_email})
        if document is None:
            return None
        return UserInDB.from_document(document)

    async def create_user(self, email: str, password_hash: str, full_name: str | None = None) -> UserInDB:
        now = datetime.now(timezone.utc)
        normalized_email = email.strip().lower()
        document = {
            "email": normalized_email,
            "full_name": full_name.strip() if full_name else None,
            "hashed_password": password_hash,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return UserInDB.from_document(document)
