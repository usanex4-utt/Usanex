from datetime import datetime, timedelta, timezone
import secrets
import string

from argon2 import PasswordHasher

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    ConnectionNotification,
    ConnectionRequest,
    ConnectionVerification,
    User,
)
from ..services.connection_security import (
    decrypt_code,
    encrypt_code,
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
        secrets.choice(string.digits)
        for _ in range(
            VERIFICATION_CODE_LENGTH
        )
    )


# =========================================================
# CREATE VERIFICATION
# =========================================================

def create_verification(
    db: Session,
    connection_request: ConnectionRequest,
):
    # Remove old pending verification
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


    # Generate verification code
    code = generate_verification_code()


    # Hash code
    code_hash = verification_hasher.hash(
        code
    )


    # Current time
    now = datetime.now(
        timezone.utc
    )


    # Expiry
    expires_at = (
        now
        + timedelta(
            minutes=VERIFICATION_EXPIRY_MINUTES
        )
    )


    # Create verification record
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

    db.flush()


    # Encrypt code for notification storage
    encrypted_code = encrypt_code(
        code
    )


    # Create notification for requester
    notification = ConnectionNotification(
        receiver_id=
            connection_request.sender_id,

        sender_id=
            connection_request.receiver_id,

        connection_request_id=
            connection_request.id,

        verification_id=
            verification.id,

        notification_type=
            "connection_verification",

        encrypted_code=
            encrypted_code,

        is_read=0,

        created_at=
            now,
    )


    db.add(
        notification
    )

    db.commit()


    db.refresh(
        verification
    )

    db.refresh(
        notification
    )


    return (
        verification,
        notification,
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


    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot send a request to yourself",
        )


    existing_request = (
        db.query(ConnectionRequest)
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

        if existing_request.status == "pending":
            raise HTTPException(
                status_code=409,
                detail="Connection request already pending",
            )


        if existing_request.status == "accepted":
            raise HTTPException(
                status_code=409,
                detail="You are already connected",
            )


        if existing_request.status == "rejected":

            db.delete(
                existing_request
            )

            db.commit()


    # Check reverse request
    reverse_request = (
        db.query(ConnectionRequest)
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


    now = datetime.now(
        timezone.utc
    )


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
        db.query(ConnectionRequest)
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


    connection_request = (
        db.query(ConnectionRequest)
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


    now = datetime.now(
        timezone.utc
    )


    connection_request.status = "accepted"

    connection_request.updated_at = now


    db.commit()


    # Create verification
    verification, notification = (
        create_verification(
            db=db,
            connection_request=
                connection_request,
        )
    )


    return {
        "success": True,

        "message":
            "Connection accepted. Verification notification created.",

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

        "notification": {
            "notification_id":
                notification.id,

            "type":
                notification.notification_type,
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


    connection_request = (
        db.query(ConnectionRequest)
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


    now = datetime.now(
        timezone.utc
    )


    connection_request.status = "rejected"

    connection_request.updated_at = now


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


# =========================================================
# GET MY VERIFICATION NOTIFICATIONS
# =========================================================

@router.get("/notifications")
def get_connection_notifications(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_authenticated_user(
        request=request,
        db=db,
    )


    notifications = (
        db.query(ConnectionNotification)
        .filter(
            ConnectionNotification.receiver_id
            == current_user.id,

            ConnectionNotification.notification_type
            == "connection_verification",
        )
        .order_by(
            ConnectionNotification.id.desc()
        )
        .all()
    )


    result = []


    for notification in notifications:

        sender = (
            db.query(User)
            .filter(
                User.id
                == notification.sender_id
            )
            .first()
        )


        if sender is None:
            continue


        verification = None


        if notification.verification_id:
            verification = (
                db.query(
                    ConnectionVerification
                )
                .filter(
                    ConnectionVerification.id
                    == notification.verification_id
                )
                .first()
            )


        # Expiry status
        is_expired = False


        if verification is not None:

            expires_at = (
                verification.expires_at
            )


            if expires_at.tzinfo is None:
                expires_at = (
                    expires_at.replace(
                        tzinfo=timezone.utc
                    )
                )


            if (
                datetime.now(timezone.utc)
                >= expires_at
            ):
                is_expired = True


        # Decrypt only for authenticated owner
        verification_code = None


        if (
            notification.encrypted_code
            and not is_expired
        ):

            try:

                verification_code = (
                    decrypt_code(
                        notification.encrypted_code
                    )
                )

            except ValueError:

                verification_code = None


        result.append(
            {
                "notification_id":
                    notification.id,

                "type":
                    notification.notification_type,

                "is_read":
                    bool(notification.is_read),

                "created_at":
                    (
                        notification.created_at.isoformat()
                        if notification.created_at
                        else None
                    ),

                "verification": {
                    "verification_id":
                        (
                            verification.id
                            if verification
                            else None
                        ),

                    "status":
                        (
                            verification.status
                            if verification
                            else "unknown"
                        ),

                    "is_expired":
                        is_expired,

                    "expires_at":
                        (
                            verification.expires_at.isoformat()
                            if verification
                            and verification.expires_at
                            else None
                        ),

                    "code":
                        verification_code,
                },

                "user": {
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

        "notifications":
            result,
    }


# =========================================================
# MARK NOTIFICATION AS READ
# =========================================================

@router.post(
    "/notifications/{notification_id}/read"
)
def mark_notification_read(
    notification_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_authenticated_user(
        request=request,
        db=db,
    )


    notification = (
        db.query(ConnectionNotification)
        .filter(
            ConnectionNotification.id
            == notification_id,

            ConnectionNotification.receiver_id
            == current_user.id,
        )
        .first()
    )


    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )


    notification.is_read = 1

    db.commit()


    return {
        "success": True,

        "message":
            "Notification marked as read",
    }
