from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    User,
    UserConnection,
    UserConnectionCategory,
)
from .auth import get_current_user_from_request


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


# =========================================================
# HELPERS
# =========================================================

def normalize_category(category):
    """
    Only personal Friend / Family categories are supported.
    Couple is intentionally not handled here.
    """

    if category is None:
        return None

    value = str(category).strip().lower()

    if value in {"friend", "friends"}:
        return "friend"

    if value in {"family", "families"}:
        return "family"

    return None


def check_connection(
    db: Session,
    current_user_id: int,
    target_user_id: int,
):
    """
    Check whether two users have an actual connection.

    UserConnection stores the two users as:
        user_one_id
        user_two_id

    Order does not matter.
    """

    if current_user_id == target_user_id:
        return True

    connection = (
        db.query(UserConnection)
        .filter(
            UserConnection.status == "connected",
            (
                (
                    (UserConnection.user_one_id == current_user_id)
                    &
                    (UserConnection.user_two_id == target_user_id)
                )
                |
                (
                    (UserConnection.user_one_id == target_user_id)
                    &
                    (UserConnection.user_two_id == current_user_id)
                )
            ),
        )
        .first()
    )

    return connection is not None


def get_personal_category(
    db: Session,
    current_user_id: int,
    target_user_id: int,
):
    """
    Get the category assigned by the CURRENT user.

    Example:

        A -> B = friend
        B -> A = family

    These are independent records.
    """

    if current_user_id == target_user_id:
        return None

    category_record = (
        db.query(UserConnectionCategory)
        .filter(
            UserConnectionCategory.user_id == current_user_id,
            UserConnectionCategory.connected_user_id == target_user_id,
        )
        .first()
    )

    if category_record is None:
        return None

    return normalize_category(category_record.category)


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

    Authentication:
        HTTP-only usanex_session cookie

    Private authentication information is never returned.
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
            detail="Authentication required.",
        )

    # -----------------------------------------------------
    # TARGET USER
    # -----------------------------------------------------

    target_user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if target_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # -----------------------------------------------------
    # SELF / CONNECTION
    # -----------------------------------------------------

    is_self = (
        current_user.id == target_user.id
    )

    is_connected = check_connection(
        db=db,
        current_user_id=current_user.id,
        target_user_id=target_user.id,
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
    # PERSONAL CATEGORY
    # -----------------------------------------------------

    personal_category = None

    if is_connected and not is_self:
        personal_category = get_personal_category(
            db=db,
            current_user_id=current_user.id,
            target_user_id=target_user.id,
        )

    # -----------------------------------------------------
    # BIO
    #
    # Current User model may not have a bio column yet.
    # getattr() safely returns None if it doesn't exist.
    # -----------------------------------------------------

    bio = getattr(
        target_user,
        "bio",
        None,
    )

    # -----------------------------------------------------
    # RESPONSE
    #
    # IMPORTANT:
    # Do NOT return:
    # - password_hash
    # - mobile
    # - session information
    # - OTP information
    # -----------------------------------------------------

    return {
        "ok": True,

        "profile": {
            "user_id": target_user.user_id,

            "username": getattr(
                target_user,
                "username",
                None,
            ),

            "name": getattr(
                target_user,
                "name",
                None,
            ),

            "profile_photo": getattr(
                target_user,
                "profile_photo",
                None,
            ),

            "bio": bio,

            "is_self": is_self,

            "is_connected": is_connected,

            "connection_status": connection_status,

            # Personal category of the CURRENT user
            # toward this connected user.
            "personal_category": personal_category,

            # Compatibility fields for frontend.
            "category": personal_category,

            "connection_category": personal_category,
        },
    }
