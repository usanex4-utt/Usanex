from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
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
# REQUEST MODEL — EDIT PROFILE
# =========================================================

class UpdateProfileRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    bio: str | None = Field(
        default=None,
        max_length=500,
    )

    website: str | None = Field(
        default=None,
        max_length=500,
    )

    instagram: str | None = Field(
        default=None,
        max_length=500,
    )

    social_link: str | None = Field(
        default=None,
        max_length=500,
    )


# =========================================================
# TEXT CLEANER
# =========================================================

def clean_optional_text(value):
    if value is None:
        return None

    value = str(value).strip()

    return value if value else None


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
            connected_user_ids.add(
                row.user_two_id
            )

        elif row.user_two_id == user_id:
            connected_user_ids.add(
                row.user_one_id
            )

    return len(connected_user_ids)


# =========================================================
# PROFILE DATA BUILDER
# =========================================================

def build_profile_response(
    db: Session,
    current_user: User,
    target_user: User,
    is_self: bool,
):

    connected = False

    if not is_self:
        connected = is_connected(
            db=db,
            user_one_id=current_user.id,
            user_two_id=target_user.id,
        )

    # -----------------------------------------------------
    # FOLLOWERS
    # -----------------------------------------------------

    followers_count = (
        db.query(func.count(UserFollow.id))
        .filter(
            UserFollow.following_id == target_user.id
        )
        .scalar()
        or 0
    )

    # -----------------------------------------------------
    # FOLLOWING
    # -----------------------------------------------------

    following_count = (
        db.query(func.count(UserFollow.id))
        .filter(
            UserFollow.follower_id == target_user.id
        )
        .scalar()
        or 0
    )

    # -----------------------------------------------------
    # CONNECTED
    # -----------------------------------------------------

    connected_count = get_connected_count(
        db=db,
        user_id=target_user.id,
    )

    # -----------------------------------------------------
    # PUBLIC POSTS
    # -----------------------------------------------------
    #
    # Unified Posts system:
    #
    # reel / video  -> Reels
    # photo / image -> Photos
    #
    # Posts count includes all public posts.
    #
    # -----------------------------------------------------

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

    posts_count = len(posts)

    content = []

    for post in posts:

        content.append(
            {
                "id": post.id,

                "content": post.content,

                "media_url": post.media_url,

                "media_type": post.media_type,

                "views": getattr(
                    post,
                    "views",
                    0,
                ) or 0,

                "created_at": (
                    post.created_at.isoformat()
                    if post.created_at
                    else None
                ),
            }
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "success": True,

        "user": {
            "id": target_user.id,

            "user_id": target_user.user_id,

            "username": target_user.username,

            "name": target_user.name,

            "profile_photo": target_user.profile_photo,

            "bio": target_user.bio,

            "website": target_user.website,

            "instagram": target_user.instagram,

            "social_link": target_user.social_link,
        },

        "relationship": {
            "is_self": is_self,

            "is_connected": (
                True
                if is_self
                else connected
            ),
        },

        "stats": {
            "followers": followers_count,

            "connected": connected_count,

            "following": following_count,

            "posts": posts_count,
        },

        "content": content,
    }


# =========================================================
# MY PROFILE
# =========================================================

@router.get("/me")
def get_my_profile(
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    return build_profile_response(
        db=db,
        current_user=current_user,
        target_user=current_user,
        is_self=True,
    )


# =========================================================
# UPDATE MY PROFILE
# =========================================================

@router.put("/me")
def update_my_profile(
    data: UpdateProfileRequest,
    request: Request,
    db: Session = Depends(get_db),
):

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
    # NAME
    # -----------------------------------------------------

    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty",
        )

    current_user.name = name

    # -----------------------------------------------------
    # BIO
    # -----------------------------------------------------

    current_user.bio = clean_optional_text(
        data.bio
    )

    # -----------------------------------------------------
    # WEBSITE
    # -----------------------------------------------------

    current_user.website = clean_optional_text(
        data.website
    )

    # -----------------------------------------------------
    # INSTAGRAM
    # -----------------------------------------------------

    current_user.instagram = clean_optional_text(
        data.instagram
    )

    # -----------------------------------------------------
    # SOCIAL LINK
    # -----------------------------------------------------

    current_user.social_link = clean_optional_text(
        data.social_link
    )

    db.add(current_user)

    db.commit()

    db.refresh(current_user)

    return {
        "success": True,

        "message": "Profile updated successfully",

        "user": {
            "id": current_user.id,

            "user_id": current_user.user_id,

            "username": current_user.username,

            "name": current_user.name,

            "profile_photo": current_user.profile_photo,

            "bio": current_user.bio,

            "website": current_user.website,

            "instagram": current_user.instagram,

            "social_link": current_user.social_link,
        },
    }


# =========================================================
# OTHER USER PROFILE
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
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if target_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # -----------------------------------------------------
    # SELF
    # -----------------------------------------------------

    is_self = (
        current_user.id
        == target_user.id
    )

    # -----------------------------------------------------
    # CONNECTION ACCESS
    # -----------------------------------------------------

    if not is_self:

        connected = is_connected(
            db=db,
            user_one_id=current_user.id,
            user_two_id=target_user.id,
        )

        if not connected:

            raise HTTPException(
                status_code=403,
                detail=(
                    "Profile available only "
                    "to connected users"
                ),
            )

    # -----------------------------------------------------
    # RETURN PROFILE
    # -----------------------------------------------------

    return build_profile_response(
        db=db,
        current_user=current_user,
        target_user=target_user,
        is_self=is_self,
    )
