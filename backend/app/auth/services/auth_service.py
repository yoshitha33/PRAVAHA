from app.auth.exceptions import InvalidCredentialsError, UserAlreadyExistsError
from app.auth.repositories.user_repository import UserRepository
from app.auth.security import create_access_token, hash_password, verify_password
from app.models.user import UserPublic
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def register(self, payload: RegisterRequest) -> AuthResponse:
        existing_user = await self.user_repository.find_by_email(payload.email)
        if existing_user is not None:
            raise UserAlreadyExistsError()

        hashed_password = hash_password(payload.password.get_secret_value())
        user = await self.user_repository.create_user(
            email=payload.email,
            password_hash=hashed_password,
            full_name=payload.full_name,
        )
        token, expires_at = create_access_token(user.email)
        return AuthResponse(
            user=UserPublic.from_user(user),
            token=TokenResponse(access_token=token, expires_at=expires_at),
        )

    async def login(self, payload: LoginRequest) -> AuthResponse:
        user = await self.user_repository.find_by_email(payload.email)
        if user is None:
            raise InvalidCredentialsError()

        if not verify_password(payload.password.get_secret_value(), user.hashed_password):
            raise InvalidCredentialsError()

        token, expires_at = create_access_token(user.email)
        return AuthResponse(
            user=UserPublic.from_user(user),
            token=TokenResponse(access_token=token, expires_at=expires_at),
        )
