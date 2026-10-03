import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# =========================================================
# DATABASE URL
# =========================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set"
    )


# =========================================================
# POSTGRESQL / RENDER COMPATIBILITY
# =========================================================

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1,
    )

elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )


# =========================================================
# SQLALCHEMY ENGINE
# =========================================================

engine = create_engine(
    DATABASE_URL,

    # Check connection before using it.
    # Important for Render PostgreSQL.
    pool_pre_ping=True,

    # Recycle old connections periodically.
    pool_recycle=1800,

    # PostgreSQL connection pool.
    pool_size=5,
    max_overflow=10,

    # Don't wait forever for a connection.
    pool_timeout=30,

    # Useful for debugging connection problems.
    connect_args={
        "connect_timeout": 10,
    },
)


# =========================================================
# SESSION FACTORY
# =========================================================

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# =========================================================
# DECLARATIVE BASE
# =========================================================

Base = declarative_base()


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():
    """
    Create a database session for one request
    and always close it afterwards.
    """

    db = SessionLocal()

    try:
        yield db

    except Exception:
        # Rollback unfinished transaction
        # if an API request fails.
        db.rollback()
        raise

    finally:
        db.close()
