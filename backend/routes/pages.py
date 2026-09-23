from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from ..database.database import get_db
from .auth import get_current_user_from_request


router = APIRouter(
    tags=["Pages"],
)


# =========================================================
# TEMPLATE DIRECTORY
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

TEMPLATES_DIR = (
    BASE_DIR
    / "frontend"
    / "templates"
)


templates = Jinja2Templates(
    directory=str(TEMPLATES_DIR)
)


# =========================================================
# LOGIN
# =========================================================

@router.get(
    "/login",
    include_in_schema=False,
)
def login_page(
    request: Request,
):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={},
    )


# =========================================================
# REGISTER
# =========================================================

@router.get(
    "/register",
    include_in_schema=False,
)
def register_page(
    request: Request,
):
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={},
    )


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.get(
    "/forgot-password",
    include_in_schema=False,
)
def forgot_password_page(
    request: Request,
):
    return templates.TemplateResponse(
        request=request,
        name="forgot-password.html",
        context={},
    )


# =========================================================
# HOME
# =========================================================

@router.get(
    "/home",
    include_in_schema=False,
)
def home_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=307,
        )


    return templates.TemplateResponse(
        request=request,
        name="home.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# SEARCH
# =========================================================

@router.get(
    "/search",
    include_in_schema=False,
)
def search_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=307,
        )


    return templates.TemplateResponse(
        request=request,
        name="search.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# NOTIFICATIONS
# =========================================================

@router.get(
    "/notifications",
    include_in_schema=False,
)
def notifications_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=307,
        )


    return templates.TemplateResponse(
        request=request,
        name="notifications.html",
        context={
            "user": current_user,
        },
    )
