"""task result

Revision ID: 0010
Revises: 0009
Create Date: 2026-11-24 20:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # What came of a completed task; existing tasks simply have none.
    with op.batch_alter_table("activities") as batch_op:
        batch_op.add_column(sa.Column("result", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("activities") as batch_op:
        batch_op.drop_column("result")
