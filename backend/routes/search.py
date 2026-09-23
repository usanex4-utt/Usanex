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
# - rejected
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

    Every returned user contains the connection status
    relative to the currently logged-in user.

    Possible statuses:
        self
        none
        pending_sent
        pending_received
        connected
        rejected
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

    search_pattern = f"%{search_text}%"

    # =====================================================
    # FIND USERS
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

    result_users = []

    # =====================================================
    # BUILD RESULT
    # =====================================================

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
        # DEFAULT VALUES
        # =================================================

        connection_status = "none"

        is_connected = False
        request_sent = False
        request_received = False

        # =================================================
        # STEP 1
        # CHECK REAL CONNECTION
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
            .order_by(
                UserConnection.id.desc()
            )
            .first()
        )

        if connection is not None:

            is_connected = True
            connection_status = "connected"

        else:

            # =============================================
            # STEP 2
            # CHECK CURRENT USER'S LATEST REQUEST
            # =============================================

            outgoing_request = (
                db.query(ConnectionRequest)
                .filter(
                    ConnectionRequest.sender_id
                    == current_user.id,

                    ConnectionRequest.receiver_id
                    == user.id,
                )
                .order_by(
                    ConnectionRequest.id.desc()
                )
                .first()
            )

            # =============================================
            # STEP 3
            # CHECK OTHER USER'S LATEST REQUEST
            # =============================================

            incoming_request = (
                db.query(ConnectionRequest)
                .filter(
                    ConnectionRequest.sender_id
                    == user.id,

                    ConnectionRequest.receiver_id
                    == current_user.id,
                )
                .order_by(
                    ConnectionRequest.id.desc()
                )
                .first()
            )

            # =================================================
            # PRIORITY:
            #
            # pending incoming/outgoing
            # > rejected
            # > none
            #
            # This prevents an old rejected request from
            # overriding a new active request.
            # =================================================

            if (
                outgoing_request is not None
                and outgoing_request.status == "pending"
            ):

                request_sent = True
                connection_status = "pending_sent"

            elif (
                incoming_request is not None
                and incoming_request.status == "pending"
            ):

                request_received = True
                connection_status = "pending_received"

            else:

                # =============================================
                # CHECK LATEST REJECTION
                #
                # If either side has a latest rejected request,
                # Search will show Rejected.
                # =============================================

                rejected_request = None

                candidates = []

                if (
                    outgoing_request is not None
                    and outgoing_request.status == "rejected"
                ):
                    candidates.append(
                        outgoing_request
                    )

                if (
                    incoming_request is not None
                    and incoming_request.status == "rejected"
                ):
                    candidates.append(
                        incoming_request
                    )

                if candidates:

                    rejected_request = max(
                        candidates,
                        key=lambda item: item.id,
                    )

                if rejected_request is not None:

                    connection_status = "rejected"

                else:

                    connection_status = "none"

        # =====================================================
        # APPEND USER
        # =====================================================

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
