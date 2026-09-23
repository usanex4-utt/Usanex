from datetime import datetime, timedelta, timezone
import secrets
import string

from argon2 import PasswordHasher

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    ConnectionRequest,
    ConnectionVerification,
    User,
)
from .auth import get_current_user_from_request


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/connections",
    tags=["Connections"],
)


# =========================================================
# SECURITY SETTINGS
# =========================================================

VERIFICATION_CODE_LENGTH = 6

VERIFICATION_EXPIRY_MINUTES = 10

MAX_VERIFICATION_ATTEMPTS = 5

verification_hasher = PasswordHasher()


# =========================================================
# REQUEST MODEL
# =========================================================

class ConnectionRequestCreate(BaseModel):
    user_id: str


# =========================================================
# AUTHENTICATED USER
# =========================================================

def get_authenticated_user(
    request: Request,
    db: Session,
):
    user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    return user


# =========================================================
# GENERATE VERIFICATION CODE
# =========================================================

def generate_verification_code():
    return "".join(
        secrets.choice(
            string.digits
        )
        for _ in range(
            VERIFICATION_CODE_LENGTH
        )
    )


# =========================================================
# CREATE VERIFICATION CODE
# =========================================================

def create_verification_code(
    db: Session,
    connection_request: ConnectionRequest,
):
    """
    Creates a short-lived verification code.

    Only the Argon2 hash is stored
    in the database.
    """

    # Remove old pending codes
    db.query(
        ConnectionVerification
    ).filter(
        ConnectionVerification.connection_request_id
        == connection_request.id,

        ConnectionVerification.status
        == "pending",
    ).delete(
        synchronize_session=False
    )


    # Generate new code
    code = generate_verification_code()


    # Hash code
    code_hash = verification_hasher.hash(
        code
    )


    # Current time
    now = datetime.now(
        timezone.utc
    )


    # Expiry time
    expires_at = (
        now
        + timedelta(
            minutes=VERIFICATION_EXPIRY_MINUTES
        )
    )


    # Create database record
    verification = ConnectionVerification(
        connection_request_id=
            connection_request.id,

        requester_id=
            connection_request.sender_id,

        receiver_id=
            connection_request.receiver_id,

        code_hash=
            code_hash,

        expires_at=
            expires_at,

        attempts=0,

        status="pending",

        created_at=
            now,

        verified_at=None,
    )


    db.add(
        verification
    )

    db.commit()

    db.refresh(
        verification
    )


    return (
        verification,
        code
    )


# =========================================================
# SEND CONNECTION REQUEST
# =========================================================

@router.post("/request")
def send_connection_request(
    payload: ConnectionRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_authenticated_user(
        request=request,
        db=db,
    )


    target_user_id = (
        payload.user_id.strip()
    )


    if not target_user_id:

        raise HTTPException(
            status_code=400,
            detail="User ID is required",
        )


    # Find target user
    target_user = (
        db.query(User)
        .filter(
            User.user_id ==
            target_user_id
        )
        .first()
    )


    if target_user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    # Prevent self request
    if (
        target_user.id
        == current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail="You cannot send a request to yourself",
        )


    # Check existing request
    existing_request = (
        db.query(
            ConnectionRequest
        )
        .filter(
            ConnectionRequest.sender_id
            == current_user.id,

            ConnectionRequest.receiver_id
            == target_user.id,
        )
        .order_by(
            ConnectionRequest.id.desc()
        )
        .first()
    )


    if existing_request is not None:

        # Already pending
        if (
            existing_request.status
            == "pending"
        ):

            raise HTTPException(
                status_code=409,
                detail="Connection request already pending",
            )


        # Already accepted
        if (
            existing_request.status
            == "accepted"
        ):

            raise HTTPException(
                status_code=409,
                detail="You are already connected",
            )


        # Previous request rejected
        if (
            existing_request.status
            == "rejected"
        ):

            db.delete(
                existing_request
            )

            db.commit()


    # Check reverse request
    reverse_request = (
        db.query(
            ConnectionRequest
        )
        .filter(
            ConnectionRequest.sender_id
            == target_user.id,

            ConnectionRequest.receiver_id
            == current_user.id,

            ConnectionRequest.status
            == "pending",
        )
        .first()
    )


    if reverse_request is not None:

        raise HTTPException(
            status_code=409,
            detail="This user has already sent you a request",
        )


    # Current time
    now = datetime.now(
        timezone.utc
    )


    # Create request
    new_request = ConnectionRequest(
        sender_id=
            current_user.id,

        receiver_id=
            target_user.id,

        status="pending",

        created_at=
            now,

        updated_at=
            now,
    )


    db.add(
        new_request
    )

    db.commit()

    db.refresh(
        new_request
    )


    return {
        "success": True,

        "message":
            "Connection request sent",

        "request": {
            "id":
                new_request.id,

            "status":
                new_request.status,

            "receiver_user_id":
                target_user.user_id,

            "receiver_username":
                target_user.username,
        },
    }


# =========================================================
# GET INCOMING CONNECTION REQUESTS
# =========================================================

@router.get("/requests")
def get_connection_requests(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_authenticated_user(
        request=request,
        db=db,
    )


    requests = (
        db.query(
            ConnectionRequest
        )
        .filter(
            ConnectionRequest.receiver_id
            == current_user.id,

            ConnectionRequest.status
            == "pending",
        )
        .order_by(
            ConnectionRequest.id.desc()
        )
        .all()
    )


    result = []


    for connection_request in requests:

        sender = (
            db.query(User)
            .filter(
                User.id
                == connection_request.sender_id
            )
            .first()
        )


        if sender is None:
            continue


        result.append(
            {
                "id":
                    connection_request.id,

                "status":
                    connection_request.status,

                "created_at":
                    (
                        connection_request.created_at.isoformat()
                        if connection_request.created_at
                        else None
                    ),

                "sender": {
                    "user_id":
                        sender.user_id,

                    "username":
                        sender.username,

                    "name":
                        sender.name,

                    "profile_photo":
                        sender.profile_photo,
                },
            }
        )


    return {
        "success": True,

        "count":
            len(result),

        "requests":
            result,
    }


# =========================================================
# ACCEPT CONNECTION REQUEST
# =========================================================

@router.post(
    "/request/{request_id}/accept"
)
def accept_connection_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_authenticated_user(
        request=request,
        db=db,
    )


    # Find pending request
    connection_request = (
        db.query(
            ConnectionRequest
        )
        .filter(
            ConnectionRequest.id
            == request_id,

            ConnectionRequest.receiver_id
            == current_user.id,

            ConnectionRequest.status
            == "pending",
        )
        .first()
    )


    if connection_request is None:

        raise HTTPException(
            status_code=404,
            detail="Pending connection request not found",
        )


    # Find sender
    sender = (
        db.query(User)
        .filter(
            User.id
            == connection_request.sender_id
        )
        .first()
    )


    if sender is None:

        raise HTTPException(
            status_code=404,
            detail="Request sender not found",
        )


    # Current time
    now = datetime.now(
        timezone.utc
    )


    # Mark request accepted
    connection_request.status = (
        "accepted"
    )

    connection_request.updated_at = (
        now
    )


    db.commit()


    # Create verification code
    verification, verification_code = (
        create_verification_code(
            db=db,
            connection_request=
                connection_request,
        )
    )


    return {
        "success": True,

        "message":
            "Connection request accepted. Verification code created.",

        "connection": {
            "request_id":
                connection_request.id,

            "status":
                connection_request.status,

            "user_id":
                sender.user_id,

            "username":
                sender.username,

            "name":
                sender.name,

            "profile_photo":
                sender.profile_photo,
        },

        "verification": {
            "verification_id":
                verification.id,

            "status":
                verification.status,

            "expires_in_minutes":
                VERIFICATION_EXPIRY_MINUTES,
        },
    }


# =========================================================
# REJECT CONNECTION REQUEST
# =========================================================

@router.post(
    "/request/{request_id}/reject"
)
def reject_connection_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_authenticated_user(
        request=request,
        db=db,
    )


    # Find pending request
    connection_request = (
        db.query(
            ConnectionRequest
        )
        .filter(
            ConnectionRequest.id
            == request_id,

            ConnectionRequest.receiver_id
            == current_user.id,

            ConnectionRequest.status
            == "pending",
        )
        .first()
    )


    if connection_request is None:

        raise HTTPException(
            status_code=404,
            detail="Pending connection request not found",
        )


    # Find sender
    sender = (
        db.query(User)
        .filter(
            User.id
            == connection_request.sender_id
        )
        .first()
    )


    if sender is None:

        raise HTTPException(
            status_code=404,
            detail="Request sender not found",
        )


    # Current time
    now = datetime.now(
        timezone.utc
    )


    # Mark rejected
    connection_request.status = (
        "rejected"
    )

    connection_request.updated_at = (
        now
    )


    db.commit()

    db.refresh(
        connection_request
    )


    return {
        "success": True,

        "message":
            "Connection request rejected",

        "request": {
            "request_id":
                connection_request.id,

            "status":
                connection_request.status,

            "user_id":
                sender.user_id,

            "username":
                sender.username,

            "name":
                sender.name,
        },
    }
