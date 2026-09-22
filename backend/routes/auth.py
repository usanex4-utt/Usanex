from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User
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
# REGISTER - SEND OTP
# =========================================================

class RegisterOTPRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    mobile: str = Field(min_length=5, max_length=20)
    password: str = Field(min_length=6, max_length=128)


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
        .filter(User.mobile == mobile)
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

        # DEVELOPMENT ONLY
        # Remove this before production SMS integration.
        "development_otp": otp,
    }


# =========================================================
# REGISTER - VERIFY OTP
# =========================================================

class RegisterVerifyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    mobile: str = Field(min_length=5, max_length=20)
    password: str = Field(min_length=6, max_length=128)
    otp: str = Field(min_length=6, max_length=6)


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
        .filter(User.mobile == mobile)
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
            .filter(User.user_id == user_id)
            .first()
        )

        if existing_user_id is None:
            break

    new_user = User(
        username=username,
        user_id=user_id,
        name=name,
        mobile=mobile,
        password_hash=hash_password(password),
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
