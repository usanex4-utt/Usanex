import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User, UserSession
from ..services.auth_service import (
    generate_user_id,
    generate_username,
    hash_password,
    verify_password,
)
from ..services.otp_service import (
    create_otp,
    verify_otp,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# =========================================================
# SESSION SETTINGS
# =========================================================

SESSION_COOKIE_NAME = "usanex_session"

SESSION_DURATION_DAYS = 30

SESSION_DURATION_SECONDS = (
    SESSION_DURATION_DAYS * 24 * 60 * 60
)


# =========================================================
# SESSION HELPERS
# =========================================================

def create_user_session(
    db: Session,
    user_id: int,
) -> str:

    session_token = secrets.token_urlsafe(48)

    now = datetime.now(timezone.utc)

    expires_at = (
        now
        + timedelta(
            days=SESSION_DURATION_DAYS
        )
    )

    new_session = UserSession(
        session_token=session_token,
        user_id=user_id,
        expires_at=expires_at,
        created_at=now,
    )

    db.add(new_session)
    db.commit()

    return session_token


def get_valid_session(
    db: Session,
    session_token: str | None,
):

    if not session_token:
        return None

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token
            == session_token
        )
        .first()
    )

    if session is None:
        return None

    expires_at = session.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    now = datetime.now(timezone.utc)

    if now >= expires_at:

        db.delete(session)
        db.commit()

        return None

    return session


def get_current_user_from_request(
    request: Request,
    db: Session,
):

    session_token = request.cookies.get(
        SESSION_COOKIE_NAME
    )

    session = get_valid_session(
        db=db,
        session_token=session_token,
    )

    if session is None:
        return None

    user = (
        db.query(User)
        .filter(
            User.id == session.user_id
        )
        .first()
    )

    if user is None:

        db.delete(session)
        db.commit()

        return None

    return user


# =========================================================
# REGISTER
# =========================================================

class RegisterOTPRequest(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    mobile: str = Field(
        min_length=5,
        max_length=20,
    )

    password: str = Field(
        min_length=6,
        max_length=128,
    )


@router.post("/register/send-otp")
def register_send_otp(
    request: RegisterOTPRequest,
    db: Session = Depends(get_db),
):

    name = request.name.strip()
    mobile = request.mobile.strip()
    password = request.password

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name is required",
        )

    if not mobile:

        raise HTTPException(
            status_code=400,
            detail="Mobile number is required",
        )

    if not password:

        raise HTTPException(
            status_code=400,
            detail="Password is required",
        )

    existing_user = (
        db.query(User)
        .filter(
            User.mobile == mobile
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="Mobile number is already registered",
        )

    otp = create_otp(
        db=db,
        identifier=mobile,
        purpose="register",
    )

    return {
        "success": True,
        "message": "OTP generated successfully",
        "development_otp": otp,
    }


class RegisterVerifyRequest(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    mobile: str = Field(
        min_length=5,
        max_length=20,
    )

    password: str = Field(
        min_length=6,
        max_length=128,
    )

    otp: str = Field(
        min_length=6,
        max_length=6,
    )


@router.post("/register/verify")
def register_verify(
    request: RegisterVerifyRequest,
    db: Session = Depends(get_db),
):

    name = request.name.strip()
    mobile = request.mobile.strip()
    password = request.password
    otp = request.otp.strip()

    existing_user = (
        db.query(User)
        .filter(
            User.mobile == mobile
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="Mobile number is already registered",
        )

    verified = verify_otp(
        db=db,
        identifier=mobile,
        otp=otp,
        purpose="register",
    )

    if not verified:

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP",
        )

    username = generate_username(
        name=name,
        db=db,
    )

    while True:

        user_id = generate_user_id()

        existing_user_id = (
            db.query(User)
            .filter(
                User.user_id == user_id
            )
            .first()
        )

        if existing_user_id is None:
            break

    new_user = User(
        username=username,
        user_id=user_id,
        name=name,
        mobile=mobile,
        password_hash=hash_password(
            password
        ),
        profile_photo=None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Account created successfully",
        "user": {
            "username": new_user.username,
            "user_id": new_user.user_id,
            "name": new_user.name,
            "mobile": new_user.mobile,
        },
    }


# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):

    identifier: str = Field(
        min_length=1,
        max_length=100,
    )

    password: str = Field(
        min_length=1,
        max_length=128,
    )


@router.post("/login")
def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):

    identifier = request.identifier.strip()
    password = request.password

    user = (
        db.query(User)
        .filter(
            (User.username == identifier)
            | (User.mobile == identifier)
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid username/mobile or password",
        )

    password_valid = verify_password(
        password=password,
        password_hash=user.password_hash,
    )

    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid username/mobile or password",
        )

    # -----------------------------------------------------
    # CREATE SECURE SESSION
    # -----------------------------------------------------

    session_token = create_user_session(
        db=db,
        user_id=user.id,
    )

    # -----------------------------------------------------
    # HTTP-ONLY COOKIE
    # -----------------------------------------------------

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        max_age=SESSION_DURATION_SECONDS,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "username": user.username,
            "user_id": user.user_id,
            "name": user.name,
            "mobile": user.mobile,
            "profile_photo": user.profile_photo,
        },
    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get("/me")
def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):

    user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    return {
        "success": True,
        "user": {
            "username": user.username,
            "user_id": user.user_id,
            "name": user.name,
            "mobile": user.mobile,
            "profile_photo": user.profile_photo,
        },
    }


# =========================================================
# LOGOUT
# =========================================================

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):

    session_token = request.cookies.get(
        SESSION_COOKIE_NAME
    )

    if session_token:

        session = (
            db.query(UserSession)
            .filter(
                UserSession.session_token
                == session_token
            )
            .first()
        )

        if session:

            db.delete(session)
            db.commit()

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )

    return {
        "success": True,
        "message": "Logged out successfully",
    }


# =========================================================
# FORGOT PASSWORD - SEND OTP
# =========================================================

class ForgotPasswordOTPRequest(BaseModel):

    identifier: str = Field(
        min_length=1,
        max_length=100,
    )


@router.post("/forgot-password/send-otp")
def forgot_password_send_otp(
    request: ForgotPasswordOTPRequest,
    db: Session = Depends(get_db),
):

    identifier = request.identifier.strip()

    if not identifier:

        raise HTTPException(
            status_code=400,
            detail="Username or mobile is required",
        )

    user = (
        db.query(User)
        .filter(
            (User.username == identifier)
            | (User.mobile == identifier)
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    otp = create_otp(
        db=db,
        identifier=identifier,
        purpose="forgot_password",
    )

    return {
        "success": True,
        "message": "Password reset OTP generated successfully",
        "development_otp": otp,
    }


# =========================================================
# FORGOT PASSWORD - RESET
# =========================================================

class ForgotPasswordResetRequest(BaseModel):

    identifier: str = Field(
        min_length=1,
        max_length=100,
    )

    otp: str = Field(
        min_length=6,
        max_length=6,
    )

    new_password: str = Field(
        min_length=6,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=6,
        max_length=128,
    )


@router.post("/forgot-password/reset")
def forgot_password_reset(
    request: ForgotPasswordResetRequest,
    db: Session = Depends(get_db),
):

    identifier = request.identifier.strip()
    otp = request.otp.strip()
    new_password = request.new_password
    confirm_password = request.confirm_password

    # -----------------------------------------------------
    # PASSWORD MATCH
    # -----------------------------------------------------

    if new_password != confirm_password:

        raise HTTPException(
            status_code=400,
            detail="Passwords do not match",
        )

    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            (User.username == identifier)
            | (User.mobile == identifier)
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    # -----------------------------------------------------
    # VERIFY OTP
    # -----------------------------------------------------

    verified = verify_otp(
        db=db,
        identifier=identifier,
        otp=otp,
        purpose="forgot_password",
    )

    if not verified:

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP",
        )

    # -----------------------------------------------------
    # UPDATE PASSWORD
    # -----------------------------------------------------

    user.password_hash = hash_password(
        new_password
    )

    # -----------------------------------------------------
    # INVALIDATE OLD SESSIONS
    # -----------------------------------------------------

    db.query(UserSession).filter(
        UserSession.user_id == user.id
    ).delete(
        synchronize_session=False
    )

    db.commit()

    return {
        "success": True,
        "message": "Password reset successfully",
    }
