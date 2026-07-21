class ApplicationError(Exception):
    """Base application error."""


class PredictionInputError(ApplicationError):
    """Raised when prediction input cannot be validated or transformed."""

