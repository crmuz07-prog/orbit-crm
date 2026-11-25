"""The visitor's address behind Render's proxy — the part a client cannot forge."""

from fastapi import Request


def client_ip(request: Request) -> str:
    """The edge's own header first (Cloudflare overwrites it, so a client cannot set it); else the last X-Forwarded-For
    hop, which our proxy added — earlier hops are whatever the client sent."""
    for header in ("cf-connecting-ip", "true-client-ip"):
        if value := request.headers.get(header):
            return value.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"
