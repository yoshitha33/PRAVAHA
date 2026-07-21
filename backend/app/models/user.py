from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserInDB(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    hashed_password: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_document(cls, document: dict) -> "UserInDB":
        return cls(
            id=str(document["_id"]),
            email=document["email"],
            full_name=document.get("full_name"),
            hashed_password=document["hashed_password"],
            is_active=document.get("is_active", True),
            created_at=document["created_at"],
            updated_at=document["updated_at"],
        )


class UserPublic(BaseModel):
    id: str = Field(..., description="MongoDB user identifier")
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True
    created_at: datetime


    @classmethod
    def from_user(cls, user: UserInDB) -> "UserPublic":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )
