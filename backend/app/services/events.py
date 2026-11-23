"""In-process pub/sub for real-time events (Server-Sent Events).

Single-process by design; for several API workers replace the broker with Redis pub/sub.
"""

import asyncio
from collections import defaultdict
from collections.abc import AsyncIterator
from typing import Any

HEARTBEAT_SECONDS = 15


class EventBroker:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[dict[str, Any]]]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def publish(self, workspace_id: str, event: dict[str, Any]) -> None:
        """Thread-safe: callable from sync endpoints running in the thread pool."""
        if self._loop is None:
            return
        for queue in list(self._subscribers[workspace_id]):
            self._loop.call_soon_threadsafe(self._offer, queue, event)

    @staticmethod
    def _offer(queue: asyncio.Queue[dict[str, Any]], event: dict[str, Any]) -> None:
        if not queue.full():
            queue.put_nowait(event)

    async def subscribe(self, workspace_id: str) -> AsyncIterator[dict[str, Any] | None]:
        """Yields events, or None as a heartbeat when nothing happened for a while."""
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=100)
        self._subscribers[workspace_id].add(queue)
        try:
            while True:
                try:
                    yield await asyncio.wait_for(queue.get(), HEARTBEAT_SECONDS)
                except TimeoutError:
                    yield None
        finally:
            self._subscribers[workspace_id].discard(queue)


broker = EventBroker()
