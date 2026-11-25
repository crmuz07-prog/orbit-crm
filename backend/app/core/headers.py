"""Security headers on every API response."""

from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from app.core.config import get_settings

HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    # JSON only: nothing here may run as a page, frame or plugin.
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}


async def security_headers(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    response = await call_next(request)
    for name, value in HEADERS.items():
        response.headers.setdefault(name, value)
    # Personal data must not stay in shared or browser caches (the event stream sets its own no-cache).
    response.headers.setdefault("Cache-Control", "no-store")
    if get_settings().is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
    return response
