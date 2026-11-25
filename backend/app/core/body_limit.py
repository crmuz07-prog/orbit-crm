"""Caps request bodies before anything reads them: a huge or endless upload must not tie up memory or a worker."""

from starlette.types import ASGIApp, Message, Receive, Scope, Send

DEFAULT_LIMIT = 1 * 1024 * 1024
# Excel imports travel as base64 JSON: a 5 MB workbook is ~6.7 MB on the wire.
LARGE_LIMIT = 8 * 1024 * 1024
LARGE_PREFIXES = ("/api/import",)


class BodyTooLarge(Exception):
    pass


def limit_for(path: str) -> int:
    return LARGE_LIMIT if path.startswith(LARGE_PREFIXES) else DEFAULT_LIMIT


async def _reject(send: Send) -> None:
    body = b'{"detail":"Request body is too large","code":"payload_too_large"}'
    await send({"type": "http.response.start", "status": 413, "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]})
    await send({"type": "http.response.body", "body": body})


class BodyLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        limit = limit_for(scope["path"])
        declared = dict(scope["headers"]).get(b"content-length")
        if declared is not None and declared.isdigit() and int(declared) > limit:
            await _reject(send)
            return
        received, started, rejected = 0, False, False

        # Chunked uploads have no Content-Length, so the bytes are counted as they arrive. The 413 is sent right here:
        # FastAPI turns errors raised while reading a body into its own 400, so its later response is dropped.
        async def counted() -> Message:
            nonlocal received, rejected
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > limit and not rejected:
                    rejected = True
                    if not started:
                        await _reject(send)
                    raise BodyTooLarge
            return message

        async def tracked(message: Message) -> None:
            nonlocal started
            if rejected:
                return
            started = started or message["type"] == "http.response.start"
            await send(message)

        try:
            await self.app(scope, counted, tracked)
        except BodyTooLarge:
            pass
