class DomainError(Exception):
    """Business-rule error. `code` is stable and translated by the UI; `detail` is an English fallback."""

    status_code = 400

    def __init__(self, detail: str, code: str = "error") -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code


class NotFound(DomainError):
    status_code = 404


class Conflict(DomainError):
    status_code = 409


class Unauthorized(DomainError):
    status_code = 401


class Forbidden(DomainError):
    status_code = 403


class TooManyRequests(DomainError):
    status_code = 429
