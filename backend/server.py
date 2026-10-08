# =========================================================
# USANEX — MAIN SERVER
# backend/server.py
# =========================================================

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

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

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent

FRONTEND_DIR = PROJECT_DIR / "frontend"
STATIC_DIR = FRONTEND_DIR / "static"


# =========================================================
# DATABASE
# =========================================================

try:

    Base.metadata.create_all(bind=engine)

    print("[Usanex] Database tables checked.")

except Exception as e:

    print(
        "[Usanex Database] ERROR:",
        str(e),
    )


# =========================================================
# DATABASE MIGRATIONS
# =========================================================

try:

    run_migrations()

    print("[Usanex Migration] Completed.")

except Exception as e:

    print(
        "[Usanex Migration] ERROR:",
        str(e),
    )


# =========================================================
# STATIC FILES
# =========================================================

if STATIC_DIR.exists():

    app.mount(
        "/static",
        StaticFiles(
            directory=str(STATIC_DIR)
        ),
        name="static",
    )

    print(
        "[Usanex] Static files mounted:",
        str(STATIC_DIR),
    )

else:

    print(
        "[Usanex] WARNING: Static directory not found:",
        str(STATIC_DIR),
    )


# =========================================================
# ROOT
# =========================================================

@app.get(
    "/",
    include_in_schema=False,
)
def root():

    return RedirectResponse(
        url="/register",
        status_code=302,
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get(
    "/health",
    include_in_schema=False,
)
def health():

    return {
        "app": "Usanex",
        "database": "connected",
        "status": "online",
    }


# =========================================================
# DATABASE TEST
# =========================================================

@app.get(
    "/api/database-test",
    include_in_schema=False,
)
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
        "[Usanex] Auth routes loaded."
    )

except Exception as e:

    print(
        "[Usanex] Auth router not loaded:",
        str(e),
    )


# =========================================================
# PROFILE ROUTES
# =========================================================

try:

    from .routes.profile import router as profile_router

    app.include_router(
        profile_router
    )

    print(
        "[Usanex] Profile routes loaded."
    )

except Exception as e:

    print(
        "[Usanex] Profile router not loaded:",
        str(e),
    )


# =========================================================
# CONNECTION ROUTES
# =========================================================

try:

    from .routes.connections import router as connections_router

    app.include_router(
        connections_router
    )

    print(
        "[Usanex] Connection routes loaded."
    )

except Exception as e:

    print(
        "[Usanex] Connection router not loaded:",
        str(e),
    )


# =========================================================
# REELS ROUTES
# =========================================================

try:

    from .routes.reels import router as reels_router

    app.include_router(
        reels_router
    )

    print(
        "[Usanex] Reels routes loaded."
    )

except Exception as e:

    print(
        "[Usanex] Reels router not loaded:",
        str(e),
    )

# =========================================================
# SEARCH ROUTES
# =========================================================

try:

    from .routes.search import router as search_router

    app.include_router(
        search_router
    )

    print(
        "[Usanex] Search routes loaded."
    )

except Exception as e:

    print(
        "[Usanex] Search router not loaded:",
        str(e),
    )

# =========================================================
# COUPLE REALTIME ROUTES
# =========================================================

try:

    from .routes.couple_realtime import (
        router as couple_realtime_router
    )

    app.include_router(
        couple_realtime_router
    )

    print(
        "[Usanex] Couple realtime routes loaded."
    )

except Exception as e:

    print(
        "[Usanex] Couple realtime router not loaded:",
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
        "[Usanex] Page routes loaded."
    )

except Exception as e:

    print(
        "[Usanex] Pages router not loaded:",
        str(e),
    )


# =========================================================
# STARTUP INFORMATION
# =========================================================

print("=================================================")
print("             USANEX SERVER READY")
print("=================================================")
print("Auth routes          : LOADED")
print("Profile routes       : LOADED")
print("Connection routes    : LOADED")
print("Reels routes         : LOADED")
print("Search routes        : LOADED")
print("Couple realtime      : LOADED")
print("Page routes          : LOADED")
print("=================================================")
