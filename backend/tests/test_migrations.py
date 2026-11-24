from sqlalchemy import inspect

from app.core.db import Base, make_engine
from app.core.migrate import migrate
import app.models  # noqa: F401


def test_migrations_build_the_full_schema(tmp_path) -> None:  # type: ignore[no-untyped-def]
    engine = make_engine(f"sqlite:///{tmp_path / 'fresh.db'}")
    migrate(engine)
    tables = set(inspect(engine).get_table_names())
    assert set(Base.metadata.tables) <= tables and "alembic_version" in tables
    migrate(engine)  # idempotent on an up-to-date database


def test_sqlite_table_rebuilds_keep_child_rows(tmp_path) -> None:  # type: ignore[no-untyped-def]
    from alembic import command
    from sqlalchemy import text

    from app.core.migrate import alembic_config

    engine = make_engine(f"sqlite:///{tmp_path / 'old.db'}")
    config = alembic_config()
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "0002")
        connection.execute(text("INSERT INTO workspaces (id, name, is_demo, created_at, updated_at) VALUES ('w', 'W', 0, '2026-01-01', '2026-01-01')"))
        connection.execute(text("INSERT INTO users (id, email, full_name, password_hash, created_at, updated_at) VALUES ('u', 'a@b.com', 'A', 'x', '2026-01-01', '2026-01-01')"))
        connection.execute(text("INSERT INTO memberships (workspace_id, user_id, role, created_at, updated_at) VALUES ('w', 'u', 'owner', '2026-01-01', '2026-01-01')"))
    migrate(engine)  # 0003 rebuilds `users` in batch mode
    with engine.connect() as connection:
        assert connection.execute(text("SELECT count(*) FROM memberships")).scalar() == 1
