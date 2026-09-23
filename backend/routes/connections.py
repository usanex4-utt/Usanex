from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import ConnectionRequest, User
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/connections",
    tags=["Connections"],
)


class ConnectionRequestCreate(BaseModel):
    user_id: str


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
# SEND CONNECTION REQUEST
# =========================================================

@router.post("/request")
def send_connection_request(
    payload: ConnectionRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Send a connection/follow request
    to another Usanex user.
    """

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


    now = datetime.now(timezone.utc)

    new_request = ConnectionRequest(
        sender_id=current_user.id,
        receiver_id=target_user.id,
        status="pending",
        created_at=now,
        updated_at=now,
    )

    db.add(new_request)

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
    """
    Get pending connection requests
    received by the currently logged-in user.
    """

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

@router.post("/request/{request_id}/accept")
def accept_connection_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Accept a pending connection request.
    Only the receiver can accept it.
    """

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


    now = datetime.now(timezone.utc)

    connection_request.status =
        "accepted"

    connection_request.updated_at =
        now


    db.commit()

    db.refresh(
        connection_request
    )


    return {
        "success": True,
        "message": "Connection request accepted",
        "connection": {
            "request_id": connection_request.id,
            "status": connection_request.status,
            "user_id": sender.user_id,
            "username": sender.username,
            "name": sender.name,
            "profile_photo": sender.profile_photo,
        },
    }


# =========================================================
# REJECT CONNECTION REQUEST
# =========================================================

@router.post("/request/{request_id}/reject")
def reject_connection_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Reject a pending connection request.
    Only the receiver can reject it.
    """

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


    now = datetime.now(timezone.utc)

    connection_request.status =
        "rejected"

    connection_request.updated_at =
        now


    db.commit()

    db.refresh(
        connection_request
    )


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
