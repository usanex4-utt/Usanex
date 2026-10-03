from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database.database import Base, engine
from .database import models  # noqa: F401
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
# PROJECT PATHS
# =========================================================

# server.py:
# Usanex/backend/server.py
#
# parent      = Usanex/backend
# parent.parent = Usanex

PROJECT_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# DATABASE
# =========================================================

print("[Usanex] Creating missing database tables...")

try:
    Base.metadata.create_all(bind=engine)

    print("[Usanex] Database tables ready.")

except Exception as e:
    print(
        "[Usanex] Database table creation ERROR:",
        str(e),
    )


# =========================================================
# DATABASE MIGRATIONS
# =========================================================

try:
    print("[Usanex Migration] Starting migrations...")

    run_migrations()

    print("[Usanex Migration] Completed successfully.")

except Exception as e:
    print(
        "[Usanex Migration] ERROR:",
        str(e),
    )


# =========================================================
# FRONTEND STATIC FILES
# =========================================================

# Actual structure:
#
# Usanex/
# ├── backend/
# │   └── server.py
# │
# └── frontend/
#     └── static/
#         ├── css/
#         │   └── register.css
#         │
#         └── js/
#             └── register.js

STATIC_DIR = (
    PROJECT_DIR
    / "frontend"
    / "static"
)


print(
    f"[Usanex] Static directory: {STATIC_DIR}"
)


if STATIC_DIR.exists():

    app.mount(
        "/static",
        StaticFiles(
            directory=str(STATIC_DIR)
        ),
        name="static",
    )

    print(
        "[Usanex] Static files mounted successfully."
    )

else:

    print(
        "[Usanex] WARNING: Static directory NOT FOUND!"
    )

    print(
        f"[Usanex] Expected path: {STATIC_DIR}"
    )


# =========================================================
# ROOT / HEALTH
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

    print(
        "[Usanex] Auth router loaded successfully."
    )

except Exception as e:

    print(
        "[Usanex] Auth router ERROR:",
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

    print(
        "[Usanex] Pages router loaded successfully."
    )

except Exception as e:

    print(
        "[Usanex] Pages router ERROR:",
        str(e),
    )
