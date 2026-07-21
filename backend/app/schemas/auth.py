from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, SecretStr

from app.models.user import UserPublic


class RegisterRequest(BaseModel):
    email: EmailStr
    password: SecretStr = Field(min_length=8)
    full_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: SecretStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime


class AuthResponse(BaseModel):
    user: UserPublic
    token: TokenResponse
