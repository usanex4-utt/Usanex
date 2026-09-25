from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    Post,
    User,
    UserConnection,
    UserFollow,
)
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/profile",
    tags=["profile"],
)


# =========================================================
# CONNECTION CHECK
# =========================================================

def is_connected(
    db: Session,
    user_one_id: int,
    user_two_id: int,
) -> bool:
    connection = (
        db.query(UserConnection)
        .filter(
            UserConnection.status == "connected",
            or_(
                (
                    UserConnection.user_one_id == user_one_id
                )
                & (
                    UserConnection.user_two_id == user_two_id
                ),
                (
                    UserConnection.user_one_id == user_two_id
                )
                & (
                    UserConnection.user_two_id == user_one_id
                ),
            ),
        )
        .first()
    )

    return connection is not None


# =========================================================
# CONNECTED COUNT
# =========================================================

def get_connected_count(
    db: Session,
    user_id: int,
) -> int:

    rows = (
        db.query(
            UserConnection.user_one_id,
            UserConnection.user_two_id,
        )
        .filter(
            UserConnection.status == "connected",
            or_(
                UserConnection.user_one_id == user_id,
                UserConnection.user_two_id == user_id,
            ),
        )
        .all()
    )

    connected_user_ids = set()

    for row in rows:
        if row.user_one_id == user_id:
            connected_user_ids.add(row.user_two_id)
        elif row.user_two_id == user_id:
            connected_user_ids.add(row.user_one_id)

    return len(connected_user_ids)


# =========================================================
# PROFILE
# =========================================================

@router.get("/{user_id}")
def get_profile(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # CURRENT USER
    # -----------------------------------------------------

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    # -----------------------------------------------------
    # TARGET USER
    # -----------------------------------------------------

    target_user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if target_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # -----------------------------------------------------
    # SELF PROFILE
    # -----------------------------------------------------

    is_self = (
        current_user.id == target_user.id
    )

    # -----------------------------------------------------
    # CONNECTION ACCESS
    # -----------------------------------------------------

    connected = False

    if not is_self:
        connected = is_connected(
            db=db,
            user_one_id=current_user.id,
            user_two_id=target_user.id,
        )

        # Only self or connected users can open profile
        if not connected:
            raise HTTPException(
                status_code=403,
                detail="Profile available only to connected users",
            )

    # =====================================================
    # FOLLOWERS
    # =====================================================

    followers_count = (
        db.query(func.count(UserFollow.id))
        .filter(
            UserFollow.following_id == target_user.id
        )
        .scalar()
        or 0
    )

    # =====================================================
    # FOLLOWING
    # =====================================================

    following_count = (
        db.query(func.count(UserFollow.id))
        .filter(
            UserFollow.follower_id == target_user.id
        )
        .scalar()
        or 0
    )

    # =====================================================
    # CONNECTED
    # =====================================================

    connected_count = get_connected_count(
        db=db,
        user_id=target_user.id,
    )

    # =====================================================
    # TOTAL POSTS
    # =====================================================

    posts_count = (
        db.query(func.count(Post.id))
        .filter(
            Post.user_id == target_user.id
        )
        .scalar()
        or 0
    )

    # =====================================================
    # ALL CONTENT
    # =====================================================
    #
    # One unified posts table.
    #
    # Reels:
    #     media_type = reel
    #     media_type = video
    #
    # Photos:
    #     media_type = photo
    #
    # =====================================================

    posts = (
        db.query(Post)
        .filter(
            Post.user_id == target_user.id
        )
        .order_by(
            Post.created_at.desc(),
            Post.id.desc(),
        )
        .all()
    )

    content = []

    for post in posts:

        content.append(
            {
                "id": post.id,
                "content": post.content,
                "media_url": post.media_url,
                "media_type": post.media_type,
                "created_at": (
                    post.created_at.isoformat()
                    if post.created_at
                    else None
                ),
            }
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "user": {
            "id": target_user.id,
            "user_id": target_user.user_id,
            "username": target_user.username,
            "name": target_user.name,
            "profile_photo": target_user.profile_photo,
            "bio": target_user.bio,
        },

        "relationship": {
            "is_self": is_self,
            "is_connected": connected if not is_self else True,
        },

        "stats": {
            "followers": followers_count,
            "connected": connected_count,
            "following": following_count,
            "posts": posts_count,
        },

        "content": content,
    }
