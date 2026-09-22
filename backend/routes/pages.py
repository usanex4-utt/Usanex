from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse


router = APIRouter()


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

TEMPLATES_DIR = (
    BASE_DIR
    / "frontend"
    / "templates"
)


# =========================================================
# LOGIN
# =========================================================

@router.get("/login")
def login_page():
    return FileResponse(
        TEMPLATES_DIR / "login.html"
    )


# =========================================================
# REGISTER
# =========================================================

@router.get("/register")
def register_page():
    return FileResponse(
        TEMPLATES_DIR / "register.html"
    )


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.get("/forgot-password")
def forgot_password_page():
    return FileResponse(
        TEMPLATES_DIR / "forgot-password.html"
    )


# =========================================================
# HOME
# =========================================================

@router.get("/home")
def home_page():
    return FileResponse(
        TEMPLATES_DIR / "home.html"
    )
