# =========================================================
# USANEX — PAGE ROUTES
# backend/routes/pages.py
# =========================================================

from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from ..database.database import get_db
from .auth import get_current_user_from_request


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    tags=["Pages"],
)


# =========================================================
# PROJECT PATHS
# =========================================================

PROJECT_DIR = Path(__file__).resolve().parents[2]

FRONTEND_DIR = PROJECT_DIR / "frontend"

TEMPLATES_DIR = FRONTEND_DIR / "templates"

STATIC_DIR = FRONTEND_DIR / "static"


# =========================================================
# DEBUG PATH INFORMATION
# =========================================================

print(
    f"[Usanex Pages] Project directory: {PROJECT_DIR}"
)

print(
    f"[Usanex Pages] Templates directory: {TEMPLATES_DIR}"
)

print(
    f"[Usanex Pages] Static directory: {STATIC_DIR}"
)


if not TEMPLATES_DIR.exists():

    print(
        "[Usanex Pages] WARNING: Templates directory not found!"
    )

    print(
        f"[Usanex Pages] Expected: {TEMPLATES_DIR}"
    )


if not STATIC_DIR.exists():

    print(
        "[Usanex Pages] WARNING: Static directory not found!"
    )

    print(
        f"[Usanex Pages] Expected: {STATIC_DIR}"
    )


# =========================================================
# TEMPLATES
# =========================================================

templates = Jinja2Templates(
    directory=str(TEMPLATES_DIR)
)


# =========================================================
# AUTH HELPER
# =========================================================

def require_login(
    request: Request,
    db: Session,
):

    user = get_current_user_from_request(
        request=request,
        db=db,
    )

    return user


# =========================================================
# LOGIN
# =========================================================

@router.get(
    "/login",
    include_in_schema
