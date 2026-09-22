from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse


router = APIRouter()


# Project root:
# Usanex/
# ├── backend/
# └── frontend/
BASE_DIR = Path(__file__).resolve().parents[2]

TEMPLATES_DIR = (
    BASE_DIR
    / "frontend"
    / "templates"
)


@router.get("/login")
def login_page():
    return FileResponse(
        TEMPLATES_DIR / "login.html"
    )


@router.get("/register")
def register_page():
    return FileResponse(
        TEMPLATES_DIR / "register.html"
    )


@router.get("/home")
def home_page():
    return FileResponse(
        TEMPLATES_DIR / "home.html"
    )
