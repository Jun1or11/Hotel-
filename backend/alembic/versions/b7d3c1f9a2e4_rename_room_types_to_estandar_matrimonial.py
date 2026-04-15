"""rename room types to estandar/matrimonial

Revision ID: b7d3c1f9a2e4
Revises: 9a2c1e3d4f5b
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b7d3c1f9a2e4"
down_revision: Union[str, None] = "9a2c1e3d4f5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert enum to VARCHAR temporarily to remap values safely.
    op.execute("ALTER TABLE habitaciones MODIFY COLUMN tipo VARCHAR(20) NOT NULL")
    op.execute("UPDATE habitaciones SET tipo = 'estandar' WHERE tipo = 'comun'")
    op.execute("UPDATE habitaciones SET tipo = 'matrimonial' WHERE tipo = 'premium'")
    op.execute(
        "ALTER TABLE habitaciones MODIFY COLUMN tipo ENUM('estandar','matrimonial','familiar','suite') NOT NULL"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE habitaciones MODIFY COLUMN tipo VARCHAR(20) NOT NULL")
    op.execute("UPDATE habitaciones SET tipo = 'comun' WHERE tipo = 'estandar'")
    op.execute("UPDATE habitaciones SET tipo = 'premium' WHERE tipo = 'matrimonial'")
    op.execute(
        "ALTER TABLE habitaciones MODIFY COLUMN tipo ENUM('comun','premium','familiar','suite') NOT NULL"
    )
