
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    User,
    UserConnection,
    UserConnectionCategory,
)
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


# =========================================================
# HELPERS
# =========================================================

def get_target_user(
    db: Session,
    user_id: str,
):
    user_id = user_id.strip()

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required",
        )

    user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


def check_connection(
    db: Session,
    current_user: User,
    target_user: User,
):
    """
    Check whether current user and target user
    are connected.

    Connection is shared.
    Personal Friend/Family category is separate.
    """

    if current_user.id == target_user.id:
        return True

    connection = (
        db.query(UserConnection)
        .filter(
            (
                (UserConnection.user_id == current_user.id)
                & (
                    UserConnection.connected_user_id
                    == target_user.id
                )
            )
            |
            (
                (UserConnection.user_id == target_user.id)
                & (
                    UserConnection.connected_user_id
                    == current_user.id
                )
            )
        )
        .first()
    )

    return connection is not None


def get_personal_category(
    db: Session,
    current_user: User,
    target_user: User,
):
    """
    Category belongs ONLY to current user.

    Example:
    A -> B = friend
    B -> A = family

    They are independent.
    """

    if current_user.id == target_user.id:
        return None

    category = (
        db.query(UserConnectionCategory)
        .filter(
            UserConnectionCategory.user_id
            == current_user.id,
            UserConnectionCategory.connected_user_id
            == target_user.id,
        )
        .first()
    )

    if category is None:
        return None

    if category.category not in {
        "friend",
        "family",
    }:
        return None

    return category.category


# =========================================================
# GET OTHER USER PROFILE
# =========================================================

@router.get("/{user_id}")
def get_profile(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Get another user's profile.

    URL:
        /api/profile/{user_id}

    Authentication:
        HTTP-only usanex_session cookie

    This endpoint does NOT expose password,
    mobile number, session token or other
    private authentication information.
    """

    # -----------------------------------------------------
    # CURRENT LOGGED-IN USER
    # -----------------------------------------------------

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    # -----------------------------------------------------
    # TARGET USER
    # -----------------------------------------------------

    target_user = get_target_user(
        db=db,
        user_id=user_id,
    )

    # -----------------------------------------------------
    # OWN PROFILE
    # -----------------------------------------------------

    is_self = (
        current_user.id
        == target_user.id
    )

    # -----------------------------------------------------
    # CONNECTION
    # -----------------------------------------------------

    is_connected = check_connection(
        db=db,
        current_user=current_user,
        target_user=target_user,
    )

    # -----------------------------------------------------
    # PERSONAL CATEGORY
    # -----------------------------------------------------

    personal_category = (
        get_personal_category(
            db=db,
            current_user=current_user,
            target_user=target_user,
        )
        if not is_self
        else None
    )

    # -----------------------------------------------------
    # CONNECTION STATUS
    # -----------------------------------------------------

    if is_self:

        connection_status = "self"

    elif is_connected:

        connection_status = "connected"

    else:

        connection_status = "not_connected"

    # -----------------------------------------------------
    # PROFILE RESPONSE
    # -----------------------------------------------------

    return {
        "ok": True,

        "profile": {
            "user_id": target_user.user_id,
            "username": target_user.username,
            "name": target_user.name,

            "profile_photo": (
                target_user.profile_photo
            ),

            # Bio is returned only if the current
            # User model has this attribute.
            "bio": (
                getattr(
                    target_user,
                    "bio",
                    None,
                )
            ),

            "is_self": is_self,

            "is_connected": is_connected,

            "connection_status": (
                connection_status
            ),

            # Current user's own classification
            # of this connected person.
            "personal_category": (
                personal_category
            ),

            "category": (
                personal_category
            ),

            "connection_category": (
                personal_category
            ),
        },
    }
