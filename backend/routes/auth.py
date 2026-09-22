from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User
from ..services.auth_service import (
    generate_user_id,
    generate_username,
    hash_password,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


class RegisterRequest(BaseModel):
    name: str
    mobile: str
    password: str


@router.post("/register")
def register(
    request: RegisterRequest,
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

    existing_mobile = (
        db.query(User)
        .filter(User.mobile == mobile)
        .first()
    )

    if existing_mobile:
        raise HTTPException(
            status_code=409,
            detail="Mobile number is already registered",
        )

    username = generate_username(name, db)

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
