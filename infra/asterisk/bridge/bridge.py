"""Asterisk → Orbit bridge.

Listens to AMI for the dialplan's `UserEvent(OrbitCall …)` and `DialEnd`, converts them to Orbit's generic
telephony event, signs it with HMAC-SHA256 and POSTs it to the workspace webhook. Also serves call recordings.
"""

import asyncio
import functools
import hashlib
import hmac
import http.server
import json
import logging
import os
import threading
import time
import urllib.request
from pathlib import Path

import ami

log = logging.getLogger("orbit-bridge")
env = os.environ.get

WEBHOOK_URL = env("ORBIT_WEBHOOK_URL", "")
SECRET = env("ORBIT_SIGNING_SECRET", "")
RECORDINGS = Path(env("RECORDINGS_DIR", "/recordings"))
RECORDINGS_BASE_URL = env("RECORDINGS_BASE_URL", "http://localhost:8090").rstrip("/")

# Asterisk DIALSTATUS → Orbit provider status
DIAL_STATUS = {"ANSWER": "answered", "NOANSWER": "no_answer", "CANCEL": "no_answer", "BUSY": "busy", "CONGESTION": "failed", "CHANUNAVAIL": "failed"}


# ───────────── Delivery ─────────────

def sign(body: bytes) -> str:
    return "sha256=" + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()


def deliver(event: dict[str, object], attempts: int = 4) -> None:
    """POST with exponential back-off; Orbit is idempotent per call_id, so retries are safe."""
    body = json.dumps(event).encode()
    request = urllib.request.Request(WEBHOOK_URL, data=body, method="POST", headers={"Content-Type": "application/json", "X-Orbit-Signature": sign(body)})
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                log.info("→ %s %s (%s)", event["event"], event["call_id"], response.status)
                return
        except Exception as exc:  # noqa: BLE001 — log and retry any delivery failure
            log.warning("delivery failed (%s), attempt %d/%d", exc, attempt + 1, attempts)
            time.sleep(2**attempt)


# ───────────── Call state ─────────────

def recording_url(call_id: str) -> str | None:
    """MixMonitor finishes writing just after hang-up; wait until the file size is stable."""
    path, last = RECORDINGS / f"{call_id}.wav", -1
    for _ in range(10):
        size = path.stat().st_size if path.exists() else -1
        if size > 44 and size == last:
            return f"{RECORDINGS_BASE_URL}/{path.name}"
        last = size
        time.sleep(0.5)
    return None


def as_int(value: str | None) -> int | None:
    return int(value) if value and value.isdigit() else None


def ended_fields(msg: ami.Message) -> dict[str, object]:
    answered_at, ended_at = as_int(msg.get("Orbit-Answered-At")), as_int(msg.get("Orbit-Ended-At"))
    duration = as_int(msg.get("Orbit-Answeredtime"))
    if duration is None and answered_at and ended_at:
        duration = ended_at - answered_at
    dialstatus = msg.get("Orbit-Dialstatus", "")
    status = DIAL_STATUS.get(dialstatus) or ("answered" if answered_at else "no_answer")
    return {"duration": duration or 0, "status": status}


class Calls:
    """Remembers who is on each call so later events (answered / ended) can be completed."""

    def __init__(self) -> None:
        self.active: dict[str, dict[str, object]] = {}

    def started(self, msg: ami.Message) -> dict[str, object]:
        call_id = msg["Orbit-Call"]
        self.active[call_id] = {"call_id": call_id, "direction": msg["Orbit-Direction"], "from": msg["Orbit-From"], "to": msg["Orbit-To"]}
        return {**self.active[call_id], "event": "call.ringing"}

    def answered(self, call_id: str) -> dict[str, object] | None:
        base = self.active.get(call_id)
        return {**base, "event": "call.answered"} if base else None

    def ended(self, msg: ami.Message) -> dict[str, object] | None:
        base = self.active.pop(msg["Orbit-Call"], None)
        if base is None:
            return None
        fields = ended_fields(msg)
        event = "call.ended" if fields["status"] == "answered" else "call.missed"
        return {**base, **fields, "event": event, "recording_url": recording_url(str(base["call_id"]))}


def translate(calls: Calls, msg: ami.Message) -> dict[str, object] | None:
    if msg.get("Event") == "DialEnd" and msg.get("DialStatus") == "ANSWER":
        return calls.answered(msg.get("Uniqueid", ""))
    if msg.get("Event") != "UserEvent" or msg.get("UserEvent") != "OrbitCall":
        return None
    kind = msg.get("Orbit-Event")
    if kind == "call.ringing":
        return calls.started(msg)
    if kind == "call.answered":
        return calls.answered(msg.get("Orbit-Call", ""))
    return calls.ended(msg) if kind == "call.ended" else None


# ───────────── Runtime ─────────────

async def listen(calls: Calls) -> None:
    reader, writer = await ami.connect(env("AMI_HOST", "asterisk"), int(env("AMI_PORT", "5038")), env("AMI_USER", "orbit"), env("AMI_SECRET", ""))
    log.info("connected to AMI")
    try:
        await relay(calls, reader)
    finally:
        writer.close()


async def relay(calls: Calls, reader: asyncio.StreamReader) -> None:
    async for msg in ami.messages(reader):
        if msg.get("Response") == "Error":
            raise ConnectionError(msg.get("Message", "AMI login failed"))
        # translate() may wait for the recording file, so it runs off the event loop.
        event = await asyncio.to_thread(translate, calls, msg)
        if event:
            asyncio.get_running_loop().run_in_executor(None, deliver, event)


async def run_forever() -> None:
    calls, delay = Calls(), 1
    while True:
        try:
            await listen(calls)
        except (OSError, ConnectionError) as exc:
            log.warning("AMI unavailable (%s); retrying in %ss", exc, delay)
        await asyncio.sleep(delay)
        delay = min(delay * 2, 30)


def serve_recordings() -> None:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RECORDINGS))
    server = http.server.ThreadingHTTPServer(("0.0.0.0", int(env("RECORDINGS_PORT", "8090"))), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    if not WEBHOOK_URL or not SECRET:
        raise SystemExit("ORBIT_WEBHOOK_URL and ORBIT_SIGNING_SECRET are required — run `make pbx-env`")
    serve_recordings()
    asyncio.run(run_forever())
