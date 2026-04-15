"""Add dni column to usuarios

Revision ID: 9a2c1e3d4f5b
Revises: 48e367cb9be6
Create Date: 2026-04-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9a2c1e3d4f5b"
down_revision: Union[str, None] = "48e367cb9be6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("dni", sa.String(length=8), nullable=True))
    op.create_index(op.f("ix_usuarios_dni"), "usuarios", ["dni"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_usuarios_dni"), table_name="usuarios")
    op.drop_column("usuarios", "dni")
