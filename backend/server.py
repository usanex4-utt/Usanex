from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database.database import Base, engine

# IMPORTANT:
# Models import hone chahiye.
from .database import models  # noqa: F401

# Migration
from .database.migrate import run_migrations


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Usanex",
    description="Usanex social communication platform",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

# ---------------------------------------------------------
# STEP 1
# Create completely new tables if they don't exist.
# ---------------------------------------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# STEP 2
# Existing tables me jo columns missing hain,
# unko safely add karo.
# ---------------------------------------------------------

try:
    run_migrations()

except Exception as e:
    print(
        "[Usanex Migration] ERROR:",
        str(e),
    )


# =========================================================
# FRONTEND STATIC FILES
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

STATIC_DIR = (
    BASE_DIR
    / "frontend"
    / "static"
)

if STATIC_DIR.exists():
    app.mount(
        "/static",
        StaticFiles(
            directory=str(STATIC_DIR)
        ),
        name="static",
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def root():
    return {
        "app": "Usanex",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "app": "Usanex",
        "database": "connected",
        "status": "online",
    }


# =========================================================
# DATABASE TEST
# =========================================================

@app.get("/api/database-test")
def database_test():

    try:

        from sqlalchemy import text

        with engine.connect() as connection:

            result = connection.execute(
                text("SELECT 1")
            )

            value = result.scalar()

        return {
            "status": "success",
            "database": "connected",
            "result": value,
        }

    except Exception as e:

        return {
            "status": "error",
            "database": "connection_failed",
            "error": str(e),
        }


# =========================================================
# AUTH ROUTES
# =========================================================

try:

    from .routes.auth import router as auth_router

    app.include_router(
        auth_router
    )

except ImportError as e:

    print(
        "[Usanex] Auth router not loaded:",
        str(e),
    )


# =========================================================
# PAGE ROUTES
# =========================================================

try:

    from .routes.pages import router as pages_router

    app.include_router(
        pages_router
    )

except ImportError as e:

    print(
        "[Usanex] Pages router not loaded:",
        str(e),
    )
