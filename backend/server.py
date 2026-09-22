from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .database.database import Base, engine
from .database import models
from .routes.auth import router as auth_router
from .routes.pages import router as pages_router


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[1]

STATIC_DIR = BASE_DIR / "frontend" / "static"


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
# STATIC FILES
# =========================================================

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)

app.include_router(pages_router)


# =========================================================
# DATABASE
# =========================================================

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


# =========================================================
# ROOT
# =========================================================

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(
        url="/login",
        status_code=307,
    )


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(
                text("SELECT 1")
            )

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception as exc:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(exc),
        }
