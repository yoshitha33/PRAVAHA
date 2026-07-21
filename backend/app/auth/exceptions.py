class AuthError(Exception):
    """Base authentication error."""


class UserAlreadyExistsError(AuthError):
    """Raised when a user with the same email already exists."""


class InvalidCredentialsError(AuthError):
    """Raised when login credentials do not match."""
