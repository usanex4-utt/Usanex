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

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="home.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# REELS
# =========================================================

@router.get(
    "/reels",
    include_in_schema=False,
)
def reels_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="reels.html",
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

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
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

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="notifications.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# CHAT
# =========================================================

@router.get(
    "/chat",
    include_in_schema=False,
)
def chat_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="chat.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# COUPLE CHAT
# =========================================================

@router.get(
    "/couple-chat",
    include_in_schema=False,
)
def couple_chat_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="couple-chat.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# MY PROFILE
# =========================================================

@router.get(
    "/my-profile",
    include_in_schema=False,
)
def my_profile_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="my-profile.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# OTHER USER PROFILE
# =========================================================

@router.get(
    "/profile",
    include_in_schema=False,
)
def profile_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="profile.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# MEDIA UPLOAD
# =========================================================

@router.get(
    "/media-upload",
    include_in_schema=False,
)
def media_upload_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="media-upload.html",
        context={
            "user": current_user,
        },
    )


# =========================================================
# REEL UPLOAD
# =========================================================

@router.get(
    "/reel-upload",
    include_in_schema=False,
)
def reel_upload_page(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = require_login(
        request=request,
        db=db,
    )

    if current_user is None:

        return RedirectResponse(
            url="/login",
            status_code=303,
        )

    return templates.TemplateResponse(
        request=request,
        name="reel-upload.html",
        context={
            "user": current_user,
        },
    )
