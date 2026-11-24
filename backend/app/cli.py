"""Operator commands. Usage: python -m app.cli create-superadmin you@company.com"""

import getpass
import sys

from app.core.db import SessionLocal, engine
from app.core.migrate import migrate
from app.services.admin import ensure_superadmin


def create_superadmin(email: str) -> None:
    password = getpass.getpass("Superadmin password (min 8 characters): ")
    if len(password) < 8 or password != getpass.getpass("Repeat password: "):
        raise SystemExit("Passwords must match and be at least 8 characters.")
    migrate(engine)
    with SessionLocal() as db:
        ensure_superadmin(db, email, password)
    print(f"✓ {email} is a superadmin")


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] != "create-superadmin":
        raise SystemExit(__doc__)
    create_superadmin(sys.argv[2])
