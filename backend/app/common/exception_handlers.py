from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.auth.exceptions import InvalidCredentialsError, UserAlreadyExistsError
from app.common.exceptions import PredictionInputError


async def user_already_exists_handler(_: Request, __: UserAlreadyExistsError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "A user with this email already exists."},
    )


async def invalid_credentials_handler(_: Request, __: InvalidCredentialsError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Invalid email or password."},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(UserAlreadyExistsError, user_already_exists_handler)
    app.add_exception_handler(InvalidCredentialsError, invalid_credentials_handler)
    app.add_exception_handler(PredictionInputError, prediction_input_handler)


async def prediction_input_handler(_: Request, exc: PredictionInputError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)},
    )
