from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    UploadFile,
    File,
)
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from pathlib import Path
from uuid import uuid4
import shutil

from ..database.database import get_db
from ..database.models import (
    Post,
    User,
    UserConnection,
    UserFollow,
)
from .auth import get_current_user_from_request


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/profile",
    tags=["profile"],
)


# =========================================================
# PROFILE UPLOAD DIRECTORY
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = (
    BASE_DIR
    / "frontend"
    / "static"
    / "uploads"
    / "profile"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# ALLOWED IMAGE TYPES
# =========================================================

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


MAX_PROFILE_PHOTO_SIZE = 10 * 1024 * 1024


# =========================================================
# UPDATE PROFILE REQUEST
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
# CLEAN OPTIONAL TEXT
# =========================================================

def clean_optional_text(value):

    if value is None:
        return None

    value = str(value).strip()

    if value == "":
        return None

    return value


# =========================================================
# CONNECTION CHECK
# =========================================================

def is_connected(
    db: Session,
    user_one_id: int,
    user_two_id: int,
) -> bool:

    if user_one_id == user_two_id:
        return True

    connection = (
        db.query(UserConnection.id)
        .filter(
            UserConnection.status == "connected",
            or_(
                (
                    UserConnection.user_one_id
                    == user_one_id
                )
                & (
                    UserConnection.user_two_id
                    == user_two_id
                ),
                (
                    UserConnection.user_one_id
                    == user_two_id
                )
                & (
                    UserConnection.user_two_id
                    == user_one_id
                ),
            ),
        )
        .first()
    )

    return connection is not None


# =========================================================
# CONNECTED USER IDS
# =========================================================

def get_connected_user_ids(
    db: Session,
    user_id: int,
):

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

    connected_ids = set()

    for row in rows:

        if row.user_one_id == user_id:

            if row.user_two_id != user_id:
                connected_ids.add(row.user_two_id)

        elif row.user_two_id == user_id:

            if row.user_one_id != user_id:
                connected_ids.add(row.user_one_id)

    return connected_ids


# =========================================================
# CONNECTED COUNT
# =========================================================

def get_connected_count(
    db: Session,
    user_id: int,
) -> int:

    return len(
        get_connected_user_ids(
            db,
            user_id,
        )
    )


# =========================================================
# FOLLOWERS COUNT
# =========================================================

def get_followers_count(
    db: Session,
    user_id: int,
) -> int:

    count = (
        db.query(func.count(UserFollow.id))
        .filter(
            UserFollow.following_id == user_id
        )
        .scalar()
    )

    return int(count or 0)


# =========================================================
# FOLLOWING COUNT
# =========================================================

def get_following_count(
    db: Session,
    user_id: int,
) -> int:

    count = (
        db.query(func.count(UserFollow.id))
        .filter(
            UserFollow.follower_id == user_id
        )
        .scalar()
    )

    return int(count or 0)


# =========================================================
# USER POSTS
# =========================================================

def get_user_posts(
    db: Session,
    user_id: int,
):

    return (
        db.query(Post)
        .filter(
            Post.user_id == user_id
        )
        .order_by(
            Post.created_at.desc(),
            Post.id.desc(),
        )
        .all()
    )


# =========================================================
# PROFILE RESPONSE
# =========================================================

def build_profile_response(
    db: Session,
    current_user: User,
    target_user: User,
    is_self: bool,
):

    connected = is_connected(
        db=db,
        user_one_id=current_user.id,
        user_two_id=target_user.id,
    )

    followers_count = get_followers_count(
        db,
        target_user.id,
    )

    following_count = get_following_count(
        db,
        target_user.id,
    )

    connected_count = get_connected_count(
        db,
        target_user.id,
    )

    posts = get_user_posts(
        db,
        target_user.id,
    )

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
            "is_connected": connected,
        },

        "stats": {
            "followers": followers_count,
            "connected": connected_count,
            "following": following_count,
            "posts": len(posts),
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

    name = data.name.strip()

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty",
        )

    current_user.name = name

    current_user.bio = clean_optional_text(
        data.bio
    )

    current_user.website = clean_optional_text(
        data.website
    )

    current_user.instagram = clean_optional_text(
        data.instagram
    )

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
# UPLOAD / CHANGE PROFILE PHOTO
# =========================================================

@router.post("/me/photo")
async def upload_profile_photo(
    request: Request,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):

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
    # CHECK FILE TYPE
    # =====================================================

    content_type = (
        photo.content_type or ""
    ).lower()


    if content_type not in ALLOWED_IMAGE_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG, WEBP or GIF "
                "images are allowed."
            ),
        )


    # =====================================================
    # READ FILE
    # =====================================================

    file_data = await photo.read()


    if not file_data:

        raise HTTPException(
            status_code=400,
            detail="Empty image file.",
        )


    # =====================================================
    # SIZE CHECK
    # =====================================================

    if len(file_data) > MAX_PROFILE_PHOTO_SIZE:

        raise HTTPException(
            status_code=400,
            detail="Profile photo must be 10 MB or smaller.",
        )


    # =====================================================
    # EXTENSION
    # =====================================================

    extension = ALLOWED_IMAGE_TYPES[
        content_type
    ]


    # =====================================================
    # UNIQUE FILE NAME
    # =====================================================

    filename = (
        f"user_{current_user.id}_"
        f"{uuid4().hex}"
        f"{extension}"
    )


    file_path = (
        UPLOAD_DIR /
        filename
    )


    # =====================================================
    # SAVE FILE
    # =====================================================

    try:

        with open(
            file_path,
            "wb",
        ) as file:

            file.write(file_data)

    except Exception as error:

        print(
            "Profile photo save error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save profile photo.",
        )


    # =====================================================
    # DELETE OLD LOCAL PHOTO
    # =====================================================

    old_photo = (
        current_user.profile_photo
        or ""
    )


    if old_photo.startswith(
        "/static/uploads/profile/"
    ):

        old_filename = Path(
            old_photo
        ).name

        old_file_path = (
            UPLOAD_DIR /
            old_filename
        )

        try:

            if (
                old_file_path.exists()
                and
                old_file_path != file_path
            ):

                old_file_path.unlink()

        except Exception as error:

            print(
                "Old profile photo delete error:",
                error,
            )


    # =====================================================
    # DATABASE URL
    # =====================================================

    photo_url = (
        "/static/uploads/profile/"
        + filename
    )


    current_user.profile_photo = photo_url

    db.add(current_user)

    db.commit()

    db.refresh(current_user)


    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "message": "Profile photo updated successfully",

        "profile_photo": photo_url,

        "user": {
            "id": current_user.id,
            "user_id": current_user.user_id,
            "username": current_user.username,
            "name": current_user.name,
            "profile_photo": current_user.profile_photo,
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

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:

        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )


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


    is_self = (
        current_user.id
        == target_user.id
    )


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
                    "This profile is available "
                    "only to connected users."
                ),
            )


    return build_profile_response(
        db=db,
        current_user=current_user,
        target_user=target_user,
        is_self=is_self,
    )
