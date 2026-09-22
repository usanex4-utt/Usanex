from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from ..database.database import get_db
from .auth import get_current_user_from_request


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
# HOME - PROTECTED
# =========================================================

@router.get("/home")
def home_page(
    request: Request,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # CHECK LOGIN SESSION
    # -----------------------------------------------------

    user = get_current_user_from_request(
        request=request,
        db=db,
    )

    # -----------------------------------------------------
    # NO VALID SESSION
    # -----------------------------------------------------

    if user is None:

        return RedirectResponse(
            url="/login",
            status_code=307,
        )

    # -----------------------------------------------------
    # VALID SESSION
    # -----------------------------------------------------

    return FileResponse(
        TEMPLATES_DIR / "home.html"
    )
