from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
)
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    User,
    UserFollow,
    ConnectionRequest,
    UserConnection,
)
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


def get_connection_status(
    db: Session,
    current_user_id: int,
    target_user_id: int,
):
    """
    Return relationship status between current user and target user.

    Possible values:
    - connected
    - following
    - requested
    - request
    - rejected
    - none
    """

    # Connected?
    connection = (
        db.query(UserConnection)
        .filter(
            UserConnection.status == "connected",
            or_(
                (
                    UserConnection.user_one_id
                    == current_user_id
                )
                & (
                    UserConnection.user_two_id
                    == target_user_id
                ),
                (
                    UserConnection.user_one_id
                    == target_user_id
                )
                & (
                    UserConnection.user_two_id
                    == current_user_id
                ),
            ),
        )
        .first()
    )

    if connection is not None:
        return "connected"

    # Current user follows target?
    following = (
        db.query(UserFollow)
        .filter(
            UserFollow.follower_id
            == current_user_id,
            UserFollow.following_id
            == target_user_id,
        )
        .first()
    )

    if following is not None:
        return "following"

    # Pending / previous connection request
    request_row = (
        db.query(ConnectionRequest)
        .filter(
            or_(
                (
                    ConnectionRequest.sender_id
                    == current_user_id
                )
                & (
                    ConnectionRequest.receiver_id
                    == target_user_id
                ),
                (
                    ConnectionRequest.sender_id
                    == target_user_id
                )
                & (
                    ConnectionRequest.receiver_id
                    == current_user_id
                ),
            )
        )
        .order_by(
            ConnectionRequest.id.desc()
        )
        .first()
    )

    if request_row is not None:

        if (
            request_row.status == "pending"
            and request_row.sender_id
            == current_user_id
        ):
            return "requested"

        if (
            request_row.status == "pending"
            and request_row.receiver_id
            == current_user_id
        ):
            return "request"

        if request_row.status == "rejected":
            return "rejected"

    return "none"


@router.get("/people")
def get_people(
    request: Request,
    limit: int = Query(
        default=20,
        ge=1,
        le=50,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
):
    """
    Get users for the People/Home list.

    Current logged-in user is excluded.
    """

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    users = (
        db.query(User)
        .filter(
            User.id != current_user.id
        )
        .order_by(
            User.id.desc()
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []

    for user in users:
        status = get_connection_status(
            db=db,
            current_user_id=current_user.id,
            target_user_id=user.id,
        )

        result.append(
            {
                "id": user.id,
                "username": user.username,
                "user_id": user.user_id,
                "name": user.name,
                "profile_photo": user.profile_photo,
                "bio": user.bio,
                "connection_status": status,
            }
        )

    return {
        "success": True,
        "users": result,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "count": len(result),
        },
    }
