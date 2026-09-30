"""sync reels schema"""
revision = "001_reels_schema"
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Add only the columns missing from the existing reels table.
    op.add_column(
        "reels",
        sa.Column("duration", sa.Float(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("file_size", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("hashtags", sa.Text(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("category", sa.String(100), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("language", sa.String(50), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("visibility", sa.String(30), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("ai_category", sa.String(100), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("ai_confidence", sa.Float(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("ai_processed", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("ai_processing_status", sa.String(50), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("completed_views_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("unique_views_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("interested_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("not_interested_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("replay_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("save_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("share_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("download_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("comment_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("one_star_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("two_star_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("three_star_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reels",
        sa.Column("is_safe", sa.Boolean(), nullable=True),
    )


def downgrade() -> None:
    columns = [
        "duration",
        "file_size",
        "hashtags",
        "category",
        "language",
        "visibility",
        "ai_category",
        "ai_confidence",
        "ai_processed",
        "ai_processing_status",
        "completed_views_count",
        "unique_views_count",
        "interested_count",
        "not_interested_count",
        "replay_count",
        "save_count",
        "share_count",
        "download_count",
        "comment_count",
        "one_star_count",
        "two_star_count",
        "three_star_count",
        "is_safe",
    ]

    for column in reversed(columns):
        op.drop_column("reels", column)
