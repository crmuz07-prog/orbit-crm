"""Minimal asyncio client for the Asterisk Manager Interface (AMI)."""

import asyncio
from collections.abc import AsyncIterator

Message = dict[str, str]


def parse(block: str) -> Message:
    message: Message = {}
    for line in block.split("\r\n"):
        key, sep, value = line.partition(":")
        if sep:
            message[key.strip()] = value.strip()
    return message


async def messages(reader: asyncio.StreamReader) -> AsyncIterator[Message]:
    buffer = ""
    while chunk := await reader.read(4096):
        buffer += chunk.decode(errors="replace")
        while "\r\n\r\n" in buffer:
            block, buffer = buffer.split("\r\n\r\n", 1)
            yield parse(block)


async def connect(host: str, port: int, user: str, secret: str) -> tuple[asyncio.StreamReader, asyncio.StreamWriter]:
    """Returns the writer too: the caller must keep it alive, or the socket is closed when it is collected."""
    reader, writer = await asyncio.open_connection(host, port)
    await reader.readline()  # banner: "Asterisk Call Manager/x.y"
    writer.write(f"Action: Login\r\nUsername: {user}\r\nSecret: {secret}\r\nEvents: call,user\r\n\r\n".encode())
    await writer.drain()
    return reader, writer
