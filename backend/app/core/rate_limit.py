"""Per-IP sliding-window limits for endpoints anyone can call without signing in (sign-in, recovery, verification).

In memory: the API runs as one process; a second instance would need a shared store (Redis) instead.
"""

import threading
import time
from collections import defaultdict, deque
from collections.abc import Callable

from fastapi import Request

from app.core.client_ip import client_ip
from app.core.config import get_settings
from app.core.errors import TooManyRequests

_hits: dict[str, deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def hit(key: str, limit: int, window: float, now: float | None = None) -> bool:
    """Records one request; False when `key` already made `limit` requests in the last `window` seconds."""
    now = time.monotonic() if now is None else now
    with _lock:
        recent = _hits[key]
        while recent and recent[0] <= now - window:
            recent.popleft()
        if len(recent) >= limit:
            return False
        recent.append(now)
        return True


def rate_limit(bucket: str, limit: int, window: float) -> Callable[[Request], None]:
    """FastAPI dependency: `Depends(rate_limit("recovery", 10, 900))`."""
    def guard(request: Request) -> None:
        if get_settings().rate_limit_enabled and not hit(f"{bucket}:{client_ip(request)}", limit, window):
            raise TooManyRequests("Too many requests, try again later", "too_many_requests")
    return guard


def reset() -> None:
    with _lock:
        _hits.clear()
