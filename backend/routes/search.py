from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    User,
    ConnectionRequest,
    UserConnection,
)
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)


# =========================================================
# SEARCH PEOPLE
#
# Search by:
# - Name
# - Username
# - User ID
# - Mobile Number
#
# Connection status:
# - self
# - none
# - pending_sent
# - pending_received
# - connected
# =========================================================

@router.get("/people")
def search_people(
    request: Request,
    q: str = Query(
        default="",
        min_length=1,
        max_length=100,
    ),
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
    Search Usanex users.

    Search fields:
        - name
        - username
        - user_id
        - mobile

    Every returned user also contains their real
    connection status with the logged-in user.
    """

    # =====================================================
    # CURRENT USER
    # =====================================================

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    # =====================================================
    # CLEAN SEARCH TEXT
    # =====================================================

    search_text = q.strip()

    if not search_text:
        return {
            "success": True,
            "users": [],
            "pagination": {
                "limit": limit,
                "offset": offset,
                "count": 0,
            },
        }

    # =====================================================
    # SEARCH PATTERN
    # =====================================================

    search_pattern = f"%{search_text}%"

    # =====================================================
    # FIND USERS
    #
    # We intentionally search ALL users matching the query.
    # Current user's own account is also allowed here so the
    # frontend can show "You".
    # =====================================================

    users = (
        db.query(User)
        .filter(
            or_(
                User.name.ilike(search_pattern),
                User.username.ilike(search_pattern),
                User.mobile.ilike(search_pattern),
                User.user_id.ilike(search_pattern),
            )
        )
        .order_by(
            User.id.desc()
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    # =====================================================
    # BUILD RESULT
    # =====================================================

    result_users = []

    for user in users:

        # =================================================
        # OWN ACCOUNT
        # =================================================

        if user.id == current_user.id:

            result_users.append(
                {
                    "username": user.username,
                    "user_id": user.user_id,
                    "name": user.name,
                    "profile_photo": user.profile_photo,

                    "connection_status": "self",

                    "is_self": True,
                    "is_connected": False,
                    "request_sent": False,
                    "request_received": False,
                }
            )

            continue

        # =================================================
        # DEFAULT STATUS
        # =================================================

        connection_status = "none"

        is_connected = False
        request_sent = False
        request_received = False

        # =================================================
        # CHECK EXISTING CONNECTION
        #
        # user_one/user_two order can be either direction,
        # therefore both combinations are checked.
        # =================================================

        connection = (
            db.query(UserConnection)
            .filter(
                UserConnection.status == "connected",
                or_(
                    (
                        UserConnection.user_one_id
                        == current_user.id
                    )
                    & (
                        UserConnection.user_two_id
                        == user.id
                    ),
                    (
                        UserConnection.user_one_id
                        == user.id
                    )
                    & (
                        UserConnection.user_two_id
                        == current_user.id
                    ),
                ),
            )
            .first()
        )

        if connection is not None:

            is_connected = True
            connection_status = "connected"

        else:

            # =============================================
            # CHECK REQUEST SENT BY CURRENT USER
            # =============================================

            sent_request = (
                db.query(ConnectionRequest)
                .filter(
                    ConnectionRequest.sender_id
                    == current_user.id,

                    ConnectionRequest.receiver_id
                    == user.id,

                    ConnectionRequest.status
                    == "pending",
                )
                .order_by(
                    ConnectionRequest.id.desc()
                )
                .first()
            )

            if sent_request is not None:

                request_sent = True
                connection_status = "pending_sent"

            else:

                # =========================================
                # CHECK REQUEST RECEIVED FROM THIS USER
                # =========================================

                received_request = (
                    db.query(ConnectionRequest)
                    .filter(
                        ConnectionRequest.sender_id
                        == user.id,

                        ConnectionRequest.receiver_id
                        == current_user.id,

                        ConnectionRequest.status
                        == "pending",
                    )
                    .order_by(
                        ConnectionRequest.id.desc()
                    )
                    .first()
                )

                if received_request is not None:

                    request_received = True
                    connection_status = (
                        "pending_received"
                    )

        # =================================================
        # APPEND USER
        # =================================================

        result_users.append(
            {
                "username": user.username,
                "user_id": user.user_id,
                "name": user.name,
                "profile_photo": user.profile_photo,

                "connection_status":
                    connection_status,

                "is_self":
                    False,

                "is_connected":
                    is_connected,

                "request_sent":
                    request_sent,

                "request_received":
                    request_received,
            }
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "users": result_users,

        "pagination": {
            "limit": limit,
            "offset": offset,
            "count": len(result_users),
        },
    }
