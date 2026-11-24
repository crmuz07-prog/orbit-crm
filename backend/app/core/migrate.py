"""Runs Alembic migrations on boot (replaces `create_all`, which never alters existing tables)."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.engine import Connection, Engine

BACKEND_DIR = Path(__file__).resolve().parents[2]
BASELINE = "0001"


def alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    return config


def _upgrade(connection: Connection) -> None:
    config = alembic_config()
    config.attributes["connection"] = connection
    tables = set(inspect(connection).get_table_names())
    # Databases created by the old create_all() already hold the baseline schema.
    if "workspaces" in tables and "alembic_version" not in tables:
        command.stamp(config, BASELINE)
    command.upgrade(config, "head")


def migrate(engine: Engine) -> None:
    with engine.connect() as connection:
        sqlite = connection.dialect.name == "sqlite"
        # SQLite batch mode rebuilds a table by dropping the old one; with foreign keys on, that
        # cascades and wipes child rows (e.g. memberships). The pragma only works outside a transaction.
        if sqlite:
            connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
            connection.commit()
        try:
            with connection.begin():
                _upgrade(connection)
        finally:
            if sqlite:
                connection.exec_driver_sql("PRAGMA foreign_keys=ON")
                connection.commit()
