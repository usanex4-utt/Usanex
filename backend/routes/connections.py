from datetime import datetime, timedelta, timezone
import secrets
import string

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    ConnectionNotification,
    ConnectionRequest,
    ConnectionVerification,
    User,
    UserConnection,
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
VERIFICATION_EXPIRY_HOURS = 24
MAX_VERIFICATION_ATTEMPTS = 5

verification_hasher = PasswordHasher()


# =========================================================
# REQUEST MODELS
# =========================================================

class ConnectionRequestCreate(BaseModel):
    user_id: str


class ConnectionVerifyRequest(BaseModel):
    verification_id: int
    code: str


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
        for _ in range(VERIFICATION_CODE_LENGTH)
    )


# =========================================================
# CREATE VERIFICATION
# =========================================================

def create_verification(
    db: Session,
    connection_request: ConnectionRequest,
):
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

    code = generate_verification_code()

    code_hash = verification_hasher.hash(
        code
    )

    now = datetime.now(
        timezone.utc
    )

    expires_at = (
        now
        + timedelta(
            hours=VERIFICATION_EXPIRY_HOURS
        )
    )

    verification = ConnectionVerification(
        connection_request_id=connection_request.id,
        requester_id=connection_request.sender_id,
        receiver_id=connection_request.receiver_id,
        code_hash=code_hash,
        expires_at=expires_at,
        attempts=0,
        status="pending",
        created_at=now,
        verified_at=None,
    )

    db.add(
        verification
    )

    db.flush()

    encrypted_code = encrypt_code(
        code
    )

    notification = ConnectionNotification(
        receiver_id=connection_request.sender_id,
        sender_id=connection_request.receiver_id,
        connection_request_id=connection_request.id,
        verification_id=verification.id,
        notification_type="connection_verification",
        encrypted_code=encrypted_code,
        is_read=0,
        created_at=now,
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

    return verification, notification


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

    target_user_id = payload.user_id.strip()

    if not target_user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required",
        )

    target_user = (
        db.query(User)
        .filter(
            User.user_id == target_user_id
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

    existing_connection = (
        db.query(UserConnection)
        .filter(
            (
                (
                    UserConnection.user_one_id
                    == current_user.id
                )
                &
                (
                    UserConnection.user_two_id
                    == target_user.id
                )
            )
            |
            (
                (
                    UserConnection.user_one_id
                    == target_user.id
                )
                &
                (
                    UserConnection.user_two_id
                    == current_user.id
                )
            )
        )
        .first()
    )

    if existing_connection is not None:
        raise HTTPException(
            status_code=409,
            detail="You are already connected",
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
        sender_id=current_user.id,
        receiver_id=target_user.id,
        status="pending",
        created_at=now,
        updated_at=now,
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
        "message": "Connection request sent",
        "request": {
            "id": new_request.id,
            "status": new_request.status,
            "receiver_user_id": target_user.user_id,
            "receiver_username": target_user.username,
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
                "id": connection_request.id,
                "status": connection_request.status,
                "created_at": (
                    connection_request.created_at.isoformat()
                    if connection_request.created_at
                    else None
                ),
                "sender": {
                    "user_id": sender.user_id,
                    "username": sender.username,
                    "name": sender.name,
                    "profile_photo": sender.profile_photo,
                },
            }
        )

    return {
        "success": True,
        "count": len(result),
        "requests": result,
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
            ConnectionRequest.id == request_id,
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

    verification, notification = (
        create_verification(
            db=db,
            connection_request=connection_request,
        )
    )

    return {
        "success": True,
        "message": (
            "Connection accepted. "
            "Verification code created."
        ),
        "connection": {
            "request_id": connection_request.id,
            "status": connection_request.status,
            "user_id": sender.user_id,
            "username": sender.username,
            "name": sender.name,
            "profile_photo": sender.profile_photo,
        },
        "verification": {
            "verification_id": verification.id,
            "status": verification.status,
            "expires_in_hours": VERIFICATION_EXPIRY_HOURS,
        },
        "notification": {
            "notification_id": notification.id,
            "type": notification.notification_type,
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
            ConnectionRequest.id == request_id,
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

    return {
        "success": True,
        "message": "Connection request rejected",
        "request": {
            "request_id": connection_request.id,
            "status": connection_request.status,
            "user_id": sender.user_id,
            "username": sender.username,
            "name": sender.name,
        },
    }


# =========================================================
# GET VERIFICATION NOTIFICATIONS
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

        is_expired = False

        if verification is not None:

            expires_at = verification.expires_at

            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(
                    tzinfo=timezone.utc
                )

            if datetime.now(
                timezone.utc
            ) >= expires_at:
                is_expired = True

        verification_code = None

        if (
            notification.encrypted_code
            and not is_expired
            and verification is not None
            and verification.status == "pending"
        ):
            try:
                verification_code = decrypt_code(
                    notification.encrypted_code
                )
            except ValueError:
                verification_code = None

        result.append(
            {
                "notification_id": notification.id,
                "type": notification.notification_type,
                "is_read": bool(notification.is_read),
                "created_at": (
                    notification.created_at.isoformat()
                    if notification.created_at
                    else None
                ),
                "verification": {
                    "verification_id": (
                        verification.id
                        if verification
                        else None
                    ),
                    "status": (
                        verification.status
                        if verification
                        else "unknown"
                    ),
                    "is_expired": is_expired,
                    "expires_at": (
                        verification.expires_at.isoformat()
                        if verification
                        and verification.expires_at
                        else None
                    ),
                    "code": verification_code,
                },
                "user": {
                    "user_id": sender.user_id,
                    "username": sender.username,
                    "name": sender.name,
                    "profile_photo": sender.profile_photo,
                },
            }
        )

    return {
        "success": True,
        "count": len(result),
        "notifications": result,
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
        "message": "Notification marked as read",
    }


# =========================================================
# VERIFY CONNECTION CODE
# =========================================================

@router.post("/verify")
def verify_connection_code(
    payload: ConnectionVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_authenticated_user(
        request=request,
        db=db,
    )

    code = payload.code.strip()

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Verification code is required",
        )

    if len(code) != VERIFICATION_CODE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code",
        )

    verification = (
        db.query(ConnectionVerification)
        .filter(
            ConnectionVerification.id
            == payload.verification_id,
            ConnectionVerification.requester_id
            == current_user.id,
        )
        .first()
    )

    if verification is None:
        raise HTTPException(
            status_code=404,
            detail="Verification not found",
        )

    if verification.status == "verified":
        raise HTTPException(
            status_code=409,
            detail="This verification has already been completed",
        )

    if verification.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Verification is no longer active",
        )

    expires_at = verification.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    now = datetime.now(
        timezone.utc
    )

    if now >= expires_at:

        verification.status = "expired"

        db.commit()

        raise HTTPException(
            status_code=410,
            detail="Verification code has expired",
        )

    if verification.attempts >= MAX_VERIFICATION_ATTEMPTS:

        verification.status = "blocked"

        db.commit()

        raise HTTPException(
            status_code=429,
            detail="Maximum verification attempts exceeded",
        )

    verification.attempts += 1

    try:

        valid = verification_hasher.verify(
            verification.code_hash,
            code,
        )

    except VerifyMismatchError:

        valid = False

    if not valid:

        if (
            verification.attempts
            >= MAX_VERIFICATION_ATTEMPTS
        ):
            verification.status = "blocked"

        db.commit()

        remaining = max(
            0,
            MAX_VERIFICATION_ATTEMPTS
            - verification.attempts,
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid verification code. "
                f"Attempts remaining: {remaining}"
            ),
        )

    connection_request = (
        db.query(ConnectionRequest)
        .filter(
            ConnectionRequest.id
            == verification.connection_request_id,
            ConnectionRequest.sender_id
            == verification.requester_id,
            ConnectionRequest.receiver_id
            == verification.receiver_id,
            ConnectionRequest.status
            == "accepted",
        )
        .first()
    )

    if connection_request is None:
        raise HTTPException(
            status_code=404,
            detail="Connection request not found",
        )

    existing_connection = (
        db.query(UserConnection)
        .filter(
            (
                (
                    UserConnection.user_one_id
                    == verification.requester_id
                )
                &
                (
                    UserConnection.user_two_id
                    == verification.receiver_id
                )
            )
            |
            (
                (
                    UserConnection.user_one_id
                    == verification.receiver_id
                )
                &
                (
                    UserConnection.user_two_id
                    == verification.requester_id
                )
            )
        )
        .first()
    )

    if existing_connection is not None:

        verification.status = "verified"
        verification.verified_at = now

        db.commit()

        return {
            "success": True,
            "message": "You are already connected",
            "connection": {
                "id": existing_connection.id,
                "status": existing_connection.status,
            },
        }

    new_connection = UserConnection(
        user_one_id=verification.requester_id,
        user_two_id=verification.receiver_id,
        status="connected",
        created_at=now,
        updated_at=now,
    )

    db.add(
        new_connection
    )

    verification.status = "verified"
    verification.verified_at = now

    notification = (
        db.query(ConnectionNotification)
        .filter(
            ConnectionNotification.verification_id
            == verification.id,
            ConnectionNotification.receiver_id
            == current_user.id,
        )
        .first()
    )

    if notification is not None:
        notification.is_read = 1

    db.commit()

    db.refresh(
        new_connection
    )

    connected_user = (
        db.query(User)
        .filter(
            User.id
            == verification.receiver_id
        )
        .first()
    )

    return {
        "success": True,
        "message": "Connection verified successfully",
        "connection": {
            "id": new_connection.id,
            "status": new_connection.status,
            "user_id": (
                connected_user.user_id
                if connected_user
                else None
            ),
            "username": (
                connected_user.username
                if connected_user
                else None
            ),
            "name": (
                connected_user.name
                if connected_user
                else None
            ),
            "profile_photo": (
                connected_user.profile_photo
                if connected_user
                else None
            ),
        },
    }
