"""deals in so'm (UZS) by default

Revision ID: 0009
Revises: 0008
Create Date: 2026-11-24 18:00:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # The CRM is sold in Uzbekistan: deals created with the old USD default become so'm (amounts unchanged).
    op.execute("UPDATE deals SET currency = 'UZS' WHERE currency = 'USD'")


def downgrade() -> None:
    op.execute("UPDATE deals SET currency = 'USD' WHERE currency = 'UZS'")
