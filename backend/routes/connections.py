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
            db.delete(existing_request)
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
    db.refresh(new_request)


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
