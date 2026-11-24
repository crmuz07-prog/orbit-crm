"""Alembic environment: uses the app's engine settings and ORM metadata."""

from alembic import context
from sqlalchemy import Connection

import app.models  # noqa: F401 — registers every model on Base.metadata
from app.core.db import Base, engine

target_metadata = Base.metadata


def run(connection: Connection) -> None:
    # SQLite cannot ALTER most things in place; batch mode recreates tables when needed.
    context.configure(connection=connection, target_metadata=target_metadata, render_as_batch=connection.dialect.name == "sqlite")
    with context.begin_transaction():
        context.run_migrations()


connection = context.config.attributes.get("connection")
if connection is not None:
    run(connection)
else:
    with engine.connect() as conn:
        run(conn)
