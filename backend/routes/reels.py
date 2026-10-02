"""
USANEX REELS API
Cloudinary Video Storage Version
"""

from __future__ import annotations

import os
import uuid
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import cloudinary
import cloudinary.uploader

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import (
    User,
    UserSession,
    Reel,
    ReelComment,
    ReelReport,
    ReelSave,
    ReelInteraction,
)

from ..services.reel_analytics import (
    record_reel_view,
    set_reel_rating,
    save_reel,
    record_download,
    record_share,
)

from ..services import reel_recommendation


router = APIRouter(
    prefix="/api/reels",
    tags=["Reels"],
)


# =========================================================
# CONSTANTS
# =========================================================

MAX_FEED_LIMIT = 50
DEFAULT_FEED_LIMIT = 10

MAX_COMMENT_LENGTH = 2000
MAX_REPORT_DESCRIPTION = 2000

# Cloudinary can handle much larger videos.
# Application limit: 2 GB.
MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
}

ALLOWED_VIDEO_EXTENSIONS = {
    ".mp4",
    ".webm",
    ".mov",
    ".mkv",
}


# =========================================================
# CLOUDINARY CONFIGURATION
# =========================================================

def configure_cloudinary() -> bool:
    """
    Configure Cloudinary from Render environment variables.

    Supported:

    1. CLOUDINARY_URL

       cloudinary://API_KEY:API_SECRET@CLOUD_NAME

    OR

    2. Separate variables:

       CLOUDINARY_CLOUD_NAME
       CLOUDINARY_API_KEY
       CLOUDINARY_API_SECRET
    """

    cloudinary_url = os.getenv(
        "CLOUDINARY_URL"
    )

    cloud_name = os.getenv(
        "CLOUDINARY_CLOUD_NAME"
    )

    api_key = os.getenv(
        "CLOUDINARY_API_KEY"
    )

    api_secret = os.getenv(
        "CLOUDINARY_API_SECRET"
    )

    # -----------------------------------------------------
    # METHOD 1: CLOUDINARY_URL
    # -----------------------------------------------------

    if cloudinary_url:

        try:

            cloudinary.config(
                cloudinary_url=cloudinary_url,
                secure=True,
            )

            config = cloudinary.config()

            if (
                config.cloud_name
                and config.api_key
                and config.api_secret
            ):
                return True

        except Exception:
            pass

    # -----------------------------------------------------
    # METHOD 2: SEPARATE VARIABLES
    # -----------------------------------------------------

    if (
        cloud_name
        and api_key
        and api_secret
    ):

        try:

            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True,
            )

            return True

        except Exception:
            pass

    return False


CLOUDINARY_CONFIGURED = configure_cloudinary()


def cloudinary_ready() -> bool:
    """
    Re-check configuration dynamically.

    This is useful on Render after environment
    variable changes/redeploys.
    """

    global CLOUDINARY_CONFIGURED

    CLOUDINARY_CONFIGURED = configure_cloudinary()

    return CLOUDINARY_CONFIGURED


# =========================================================
# TIME
# =========================================================

def utc_now() -> datetime:

    return datetime.now(
        timezone.utc
    ).replace(
        tzinfo=None
    )


# =========================================================
# AUTHENTICATION
# =========================================================

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:

    session_token = request.cookies.get(
        "usanex_session"
    )

    if not session_token:

        session_token = request.cookies.get(
            "session_token"
        )

    if not session_token:

        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token
            == session_token
        )
        .first()
    )

    if session is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid session",
        )

    expires_at = session.expires_at

    if expires_at.tzinfo is not None:

        expires_at = expires_at.replace(
            tzinfo=None
        )

    if utc_now() >= expires_at:

        db.delete(session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Session expired",
        )

    user = (
        db.query(User)
        .filter(
            User.id == session.user_id
        )
        .first()
    )

    if user is None:

        db.delete(session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user


# =========================================================
# SERIALIZATION
# =========================================================

def serialize_user(
    user: Optional[User],
) -> Optional[dict[str, Any]]:

    if user is None:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "user_id": user.user_id,
        "name": user.name,
        "profile_photo": user.profile_photo,
    }


def serialize_reel(
    reel: Reel,
    creator: Optional[User] = None,
) -> dict[str, Any]:

    return {

        "id": reel.id,

        "user_id": reel.user_id,

        "video_url": reel.video_url,

        "thumbnail_url":
            reel.thumbnail_url,

        "duration": float(
            reel.duration or 0
        ),

        "file_size": reel.file_size,

        "caption": reel.caption,

        "hashtags": reel.hashtags,

        "language": reel.language,

        "category": reel.category,

        "visibility":
            reel.visibility,

        "status":
            reel.status,

        "views_count":
            int(reel.views_count or 0),

        "unique_views_count":
            int(reel.unique_views_count or 0),

        "completed_views_count":
            int(reel.completed_views_count or 0),

        "replay_count":
            int(reel.replay_count or 0),

        "share_count":
            int(reel.share_count or 0),

        "save_count":
            int(reel.save_count or 0),

        "download_count":
            int(reel.download_count or 0),

        "comment_count":
            int(reel.comment_count or 0),

        "one_star_count":
            int(reel.one_star_count or 0),

        "two_star_count":
            int(reel.two_star_count or 0),

        "three_star_count":
            int(reel.three_star_count or 0),

        "interested_count":
            int(reel.interested_count or 0),

        "not_interested_count":
            int(reel.not_interested_count or 0),

        "ai_processed":
            bool(reel.ai_processed),

        "ai_processing_status":
            reel.ai_processing_status,

        "ai_category":
            reel.ai_category,

        "ai_confidence":
            reel.ai_confidence,

        "is_safe":
            bool(reel.is_safe),

        "created_at":
            reel.created_at.isoformat()
            if reel.created_at
            else None,

        "updated_at":
            reel.updated_at.isoformat()
            if reel.updated_at
            else None,

        "creator":
            serialize_user(creator),
    }


# =========================================================
# REQUEST MODELS
# =========================================================

class WatchEventRequest(BaseModel):

    watch_time: float = Field(
        default=0,
        ge=0,
        le=86400,
    )

    watch_percentage: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    completed: bool = False

    replayed: bool = False

    replay_count: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    session_id: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    feed_position: Optional[int] = Field(
        default=None,
        ge=0,
        le=10000,
    )

    source: Optional[str] = Field(
        default=None,
        max_length=50,
    )


class RatingRequest(BaseModel):

    rating: int = Field(
        ge=1,
        le=3,
    )


class ShareRequest(BaseModel):

    share_type: Optional[str] = Field(
        default=None,
        max_length=50,
    )


class CommentRequest(BaseModel):

    content: str = Field(
        min_length=1,
        max_length=MAX_COMMENT_LENGTH,
    )


class ReportRequest(BaseModel):

    reason: str = Field(
        min_length=1,
        max_length=100,
    )

    description: Optional[str] = Field(
        default=None,
        max_length=MAX_REPORT_DESCRIPTION,
    )


# =========================================================
# HELPERS
# =========================================================

def get_reel_or_404(
    db: Session,
    reel_id: int,
) -> Reel:

    reel = (
        db.query(Reel)
        .filter(
            Reel.id == reel_id
        )
        .first()
    )

    if reel is None:

        raise HTTPException(
            status_code=404,
            detail="Reel not found",
        )

    return reel


def get_creator(
    db: Session,
    user_id: int,
) -> Optional[User]:

    return (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


def create_interaction(
    db: Session,
    *,
    user_id: int,
    reel: Reel,
    event_type: str,
    session_id: Optional[str] = None,
    feed_position: Optional[int] = None,
    source: Optional[str] = None,
    watch_time: float = 0,
    watch_percentage: float = 0,
    completed: bool = False,
    replayed: bool = False,
    replay_count: int = 0,
    star_rating: int = 0,
    interested: bool = False,
    not_interested: bool = False,
    saved: bool = False,
    downloaded: bool = False,
    shared: bool = False,
    commented: bool = False,
    muted: bool = False,
) -> ReelInteraction:

    now = utc_now()

    interaction = ReelInteraction(

        user_id=user_id,

        reel_id=reel.id,

        creator_id=reel.user_id,

        session_id=session_id,

        feed_position=feed_position,

        source=source,

        event_type=event_type,

        watch_time=watch_time,

        watch_percentage=watch_percentage,

        completed=completed,

        replayed=replayed,

        replay_count=replay_count,

        star_rating=star_rating,

        interested=interested,

        not_interested=not_interested,

        saved=saved,

        downloaded=downloaded,

        shared=shared,

        commented=commented,

        muted=muted,

        created_at=now,

        updated_at=now,
    )

    db.add(interaction)

    return interaction


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
def reels_health():

    configured = cloudinary_ready()

    return {

        "success": True,

        "service": "reels",

        "status": "online",

        "storage": "cloudinary",

        "cloudinary_configured":
            configured,

    }


# =========================================================
# FEED
# =========================================================

@router.get("/feed")
def get_reels_feed(

    request: Request,

    limit: int = Query(
        DEFAULT_FEED_LIMIT,
        ge=1,
        le=MAX_FEED_LIMIT,
    ),

    cursor: Optional[int] = Query(
        default=None,
        ge=0,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    try:

        recommendation_function = getattr(
            reel_recommendation,
            "get_recommended_reels",
            None,
        )

        if recommendation_function:

            try:

                result = recommendation_function(

                    db=db,

                    user_id=current_user.id,

                    limit=limit,

                    cursor=cursor,
                )

            except TypeError:

                result = recommendation_function(

                    db=db,

                    user_id=current_user.id,

                    limit=limit,
                )

            if isinstance(
                result,
                dict,
            ):

                return {
                    "success": True,
                    **result,
                }

            if isinstance(
                result,
                list,
            ):

                response_reels = []

                for item in result:

                    if isinstance(
                        item,
                        Reel,
                    ):

                        creator = get_creator(
                            db,
                            item.user_id,
                        )

                        response_reels.append(
                            serialize_reel(
                                item,
                                creator,
                            )
                        )

                return {

                    "success": True,

                    "reels":
                        response_reels,

                    "count":
                        len(response_reels),

                    "source":
                        "recommendation",
                }

    except Exception:

        db.rollback()

    # FALLBACK

    query = (
        db.query(Reel)
        .filter(

            Reel.visibility
            == "public",

            Reel.status
            == "published",

            Reel.is_safe.is_(True),
        )
    )

    if cursor:

        query = query.filter(
            Reel.id < cursor
        )

    reels_db = (

        query

        .order_by(

            Reel.created_at.desc(),

            Reel.id.desc(),
        )

        .limit(limit)

        .all()
    )

    response_reels = []

    for reel in reels_db:

        creator = get_creator(
            db,
            reel.user_id,
        )

        response_reels.append(
            serialize_reel(
                reel,
                creator,
            )
        )

    next_cursor = (

        reels_db[-1].id
        if reels_db
        else None
    )

    return {

        "success": True,

        "reels":
            response_reels,

        "count":
            len(response_reels),

        "next_cursor":
            next_cursor,

        "source":
            "fallback",
    }


# =========================================================
# MY REELS
# =========================================================

@router.get("/me/list")
def get_my_reels(

    limit: int = Query(
        50,
        ge=1,
        le=100,
    ),

    offset: int = Query(
        0,
        ge=0,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    reels_db = (

        db.query(Reel)

        .filter(
            Reel.user_id
            == current_user.id
        )

        .order_by(

            Reel.created_at.desc(),

            Reel.id.desc(),
        )

        .offset(offset)

        .limit(limit)

        .all()
    )

    reels = [

        serialize_reel(
            reel,
            current_user,
        )

        for reel in reels_db
    ]

    return {

        "success": True,

        "reels": reels,

        "count": len(reels),

        "owner":
            serialize_user(
                current_user
            ),
    }


# =========================================================
# SAVED REELS
# =========================================================

@router.get("/me/saved")
def get_saved_reels(

    limit: int = Query(
        50,
        ge=1,
        le=100,
    ),

    offset: int = Query(
        0,
        ge=0,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    rows = (

        db.query(ReelSave)

        .filter(
            ReelSave.user_id
            == current_user.id
        )

        .order_by(
            ReelSave.created_at.desc()
        )

        .offset(offset)

        .limit(limit)

        .all()
    )

    reels = []

    for row in rows:

        reel = (

            db.query(Reel)

            .filter(
                Reel.id
                == row.reel_id
            )

            .first()
        )

        if reel is None:
            continue

        creator = get_creator(
            db,
            reel.user_id,
        )

        reels.append(
            serialize_reel(
                reel,
                creator,
            )
        )

    return {

        "success": True,

        "reels": reels,

        "count": len(reels),
    }


# =========================================================
# CLOUDINARY VIDEO UPLOAD
# =========================================================

@router.post("/upload")
async def upload_reel(

    video: UploadFile = File(...),

    caption: Optional[str] = Form(
        default=None
    ),

    hashtags: Optional[str] = Form(
        default=None
    ),

    language: Optional[str] = Form(
        default=None
    ),

    category: Optional[str] = Form(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    # -----------------------------------------------------
    # CLOUDINARY CHECK
    # -----------------------------------------------------

    if not cloudinary_ready():

        raise HTTPException(

            status_code=503,

            detail=(
                "Cloudinary is not configured. "
                "Please check Render environment variables."
            ),
        )

    # -----------------------------------------------------
    # FILE VALIDATION
    # -----------------------------------------------------

    content_type = (
        video.content_type
        or ""
    ).lower()

    extension = Path(
        video.filename or ""
    ).suffix.lower()

    if (

        content_type
        not in ALLOWED_VIDEO_TYPES

        and

        extension
        not in ALLOWED_VIDEO_EXTENSIONS

    ):

        raise HTTPException(

            status_code=400,

            detail="Unsupported video format",
        )

    # -----------------------------------------------------
    # TEMPORARY FILE
    # -----------------------------------------------------

    temp_path = None

    total_size = 0

    try:

        suffix = (
            extension
            if extension
            else ".mp4"
        )

        with tempfile.NamedTemporaryFile(

            delete=False,

            suffix=suffix,
        ) as temp_file:

            temp_path = temp_file.name

            while True:

                chunk = await video.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                total_size += len(chunk)

                if (
                    total_size
                    > MAX_VIDEO_SIZE
                ):

                    raise HTTPException(

                        status_code=413,

                        detail=(
                            "Video size exceeds "
                            "2 GB limit"
                        ),
                    )

                temp_file.write(chunk)

        # -------------------------------------------------
        # CLOUDINARY PUBLIC ID
        # -------------------------------------------------

        public_id = (

            "reel_"
            + uuid.uuid4().hex
        )

        # -------------------------------------------------
        # CLOUDINARY UPLOAD
        # -------------------------------------------------

        upload_result = (

            cloudinary.uploader.upload_large(

                temp_path,

                resource_type="video",

                folder="usanex/reels",

                public_id=public_id,

                overwrite=False,

                chunk_size=20_000_000,

            )
        )

        video_url = (
            upload_result.get(
                "secure_url"
            )
        )

        if not video_url:

            raise RuntimeError(
                "Cloudinary did not return video URL"
            )

        # Cloudinary metadata

        cloudinary_public_id = (
            upload_result.get(
                "public_id"
            )
        )

        duration = float(
            upload_result.get(
                "duration"
            )
            or 0
        )

        # -------------------------------------------------
        # DATABASE
        # -------------------------------------------------

        now = utc_now()

        reel = Reel(

            user_id=current_user.id,

            video_url=video_url,

            thumbnail_url=None,

            duration=duration,

            file_size=total_size,

            caption=(

                caption.strip()

                if caption

                else None
            ),

            hashtags=(

                hashtags.strip()

                if hashtags

                else None
            ),

            language=(

                language.strip()

                if language

                else None
            ),

            category=(

                category.strip()

                if category

                else "reels"
            ),

            visibility="public",

            status="published",

            ai_processed=False,

            ai_processing_status="pending",

            is_safe=True,

            created_at=now,

            updated_at=now,
        )

        db.add(reel)

        db.commit()

        db.refresh(reel)

        creator = get_creator(

            db,

            current_user.id,
        )

        return {

            "success": True,

            "message":
                "Reel uploaded successfully",

            "storage":
                "cloudinary",

            "cloudinary_public_id":
                cloudinary_public_id,

            "reel":
                serialize_reel(
                    reel,
                    creator,
                ),
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as exc:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail=(
                "Cloudinary upload failed: "
                + str(exc)
            ),
        )

    finally:

        # -------------------------------------------------
        # DELETE TEMP FILE
        # -------------------------------------------------

        if (
            temp_path
            and
            os.path.exists(temp_path)
        ):

            try:

                os.remove(
                    temp_path
                )

            except Exception:

                pass

        await video.close()


# =========================================================
# SINGLE REEL
# =========================================================

@router.get("/{reel_id}")
def get_reel(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    creator = get_creator(
        db,
        reel.user_id,
    )

    return {

        "success": True,

        "reel":
            serialize_reel(
                reel,
                creator,
            ),
    }


# =========================================================
# WATCH
# =========================================================

@router.post("/{reel_id}/watch")
def watch_reel(

    reel_id: int,

    payload: WatchEventRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    try:

        reel = get_reel_or_404(
            db,
            reel_id,
        )

        result = record_reel_view(

            db=db,

            user_id=current_user.id,

            reel_id=reel_id,

            watch_time=
                payload.watch_time,

            watch_percentage=
                payload.watch_percentage,

            session_id=
                payload.session_id,

            feed_position=
                payload.feed_position,

            source=
                payload.source,

            completed=
                payload.completed,

            replayed=
                payload.replayed,
        )

        interaction = create_interaction(

            db,

            user_id=
                current_user.id,

            reel=reel,

            event_type=(

                "replay"

                if payload.replayed

                else (

                    "complete"

                    if payload.completed

                    else "watch"
                )
            ),

            session_id=
                payload.session_id,

            feed_position=
                payload.feed_position,

            source=
                payload.source,

            watch_time=
                payload.watch_time,

            watch_percentage=
                payload.watch_percentage,

            completed=
                payload.completed,

            replayed=
                payload.replayed,

            replay_count=
                payload.replay_count,
        )

        db.commit()

        return {

            "success": True,

            "data": result,

            "interaction_id":
                interaction.id,
        }

    except HTTPException:

        db.rollback()

        raise

    except ValueError as exc:

        db.rollback()

        raise HTTPException(

            status_code=404,

            detail=str(exc),
        )

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Unable to record reel watch",
        )


# =========================================================
# RATING
# =========================================================

@router.post("/{reel_id}/rating")
def rate_reel(

    reel_id: int,

    payload: RatingRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    try:

        reel = get_reel_or_404(
            db,
            reel_id,
        )

        result = set_reel_rating(

            db=db,

            user_id=
                current_user.id,

            reel_id=
                reel_id,

            rating=
                payload.rating,
        )

        interaction = create_interaction(

            db,

            user_id=
                current_user.id,

            reel=reel,

            event_type="star",

            star_rating=
                payload.rating,
        )

        db.commit()

        return {

            "success": True,

            "data": result,

            "interaction_id":
                interaction.id,
        }

    except HTTPException:

        db.rollback()

        raise

    except ValueError as exc:

        db.rollback()

        raise HTTPException(

            status_code=400,

            detail=str(exc),
        )

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Unable to save rating",
        )


# =========================================================
# SAVE
# =========================================================

@router.post("/{reel_id}/save")
def save_reel_route(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    try:

        reel = get_reel_or_404(
            db,
            reel_id,
        )

        result = save_reel(

            db=db,

            user_id=
                current_user.id,

            reel_id=
                reel_id,
        )

        interaction = create_interaction(

            db,

            user_id=
                current_user.id,

            reel=reel,

            event_type="save",

            saved=True,
        )

        db.commit()

        return {

            "success": True,

            "data": result,

            "interaction_id":
                interaction.id,
        }

    except HTTPException:

        db.rollback()

        raise

    except ValueError as exc:

        db.rollback()

        raise HTTPException(

            status_code=404,

            detail=str(exc),
        )

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Unable to save reel",
        )


# =========================================================
# UNSAVE
# =========================================================

@router.delete("/{reel_id}/save")
def unsave_reel(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    saved = (

        db.query(ReelSave)

        .filter(

            ReelSave.user_id
            == current_user.id,

            ReelSave.reel_id
            == reel_id,
        )

        .first()
    )

    if saved is None:

        return {

            "success": True,

            "saved": False,

            "message":
                "Reel was not saved",
        }

    db.delete(saved)

    if reel.save_count:

        reel.save_count -= 1

    create_interaction(

        db,

        user_id=
            current_user.id,

        reel=reel,

        event_type="unsave",

        saved=False,
    )

    db.commit()

    return {

        "success": True,

        "saved": False,

        "save_count":
            reel.save_count,
    }


# =========================================================
# DOWNLOAD
# =========================================================

@router.post("/{reel_id}/download")
def download_reel(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    try:

        reel = get_reel_or_404(
            db,
            reel_id,
        )

        result = record_download(

            db=db,

            user_id=
                current_user.id,

            reel_id=
                reel_id,
        )

        create_interaction(

            db,

            user_id=
                current_user.id,

            reel=reel,

            event_type="download",

            downloaded=True,
        )

        db.commit()

        return {

            "success": True,

            "data": result,
        }

    except HTTPException:

        db.rollback()

        raise

    except ValueError as exc:

        db.rollback()

        raise HTTPException(

            status_code=404,

            detail=str(exc),
        )

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Unable to record download",
        )


# =========================================================
# SHARE
# =========================================================

@router.post("/{reel_id}/share")
def share_reel(

    reel_id: int,

    payload: ShareRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    try:

        reel = get_reel_or_404(
            db,
            reel_id,
        )

        result = record_share(

            db=db,

            user_id=
                current_user.id,

            reel_id=
                reel_id,

            share_type=
                payload.share_type,
        )

        create_interaction(

            db,

            user_id=
                current_user.id,

            reel=reel,

            event_type="share",

            shared=True,
        )

        db.commit()

        return {

            "success": True,

            "data": result,
        }

    except HTTPException:

        db.rollback()

        raise

    except ValueError as exc:

        db.rollback()

        raise HTTPException(

            status_code=404,

            detail=str(exc),
        )

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Unable to record share",
        )


# =========================================================
# INTERESTED
# =========================================================

@router.post("/{reel_id}/interested")
def mark_interested(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    previous = (

        db.query(ReelInteraction)

        .filter(

            ReelInteraction.user_id
            == current_user.id,

            ReelInteraction.reel_id
            == reel_id,

            ReelInteraction.interested
            .is_(True),
        )

        .first()
    )

    if previous:

        return {

            "success": True,

            "interested": True,

            "interested_count":
                reel.interested_count,
        }

    reel.interested_count = (

        reel.interested_count or 0

    ) + 1

    create_interaction(

        db,

        user_id=
            current_user.id,

        reel=reel,

        event_type="interested",

        interested=True,
    )

    db.commit()

    return {

        "success": True,

        "interested": True,

        "interested_count":
            reel.interested_count,
    }


# =========================================================
# NOT INTERESTED
# =========================================================

@router.post("/{reel_id}/not-interested")
def mark_not_interested(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    previous = (

        db.query(ReelInteraction)

        .filter(

            ReelInteraction.user_id
            == current_user.id,

            ReelInteraction.reel_id
            == reel_id,

            ReelInteraction.not_interested
            .is_(True),
        )

        .first()
    )

    if previous:

        return {

            "success": True,

            "not_interested": True,

            "not_interested_count":
                reel.not_interested_count,
        }

    reel.not_interested_count = (

        reel.not_interested_count or 0

    ) + 1

    create_interaction(

        db,

        user_id=
            current_user.id,

        reel=reel,

        event_type="not_interested",

        not_interested=True,
    )

    db.commit()

    return {

        "success": True,

        "not_interested": True,

        "not_interested_count":
            reel.not_interested_count,
    }


# =========================================================
# COMMENTS
# =========================================================

@router.post("/{reel_id}/comments")
def add_comment(

    reel_id: int,

    payload: CommentRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    content = payload.content.strip()

    if not content:

        raise HTTPException(

            status_code=400,

            detail="Comment cannot be empty",
        )

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    comment = ReelComment(

        user_id=
            current_user.id,

        reel_id=
            reel_id,

        content=
            content,

        is_deleted=False,

        created_at=
            utc_now(),
    )

    db.add(comment)

    reel.comment_count = (

        reel.comment_count or 0

    ) + 1

    interaction = create_interaction(

        db,

        user_id=
            current_user.id,

        reel=reel,

        event_type="comment",

        commented=True,
    )

    db.commit()

    db.refresh(comment)

    return {

        "success": True,

        "comment": {

            "id":
                comment.id,

            "user_id":
                comment.user_id,

            "reel_id":
                comment.reel_id,

            "content":
                comment.content,

            "created_at":
                comment.created_at.isoformat(),

            "user":
                serialize_user(
                    current_user
                ),
        },

        "interaction_id":
            interaction.id,
    }


@router.get("/{reel_id}/comments")
def get_comments(

    reel_id: int,

    limit: int = Query(
        50,
        ge=1,
        le=100,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    get_reel_or_404(
        db,
        reel_id,
    )

    comments = (

        db.query(ReelComment)

        .filter(

            ReelComment.reel_id
            == reel_id,

            ReelComment.is_deleted
            .is_(False),
        )

        .order_by(
            ReelComment.created_at.desc()
        )

        .limit(limit)

        .all()
    )

    response = []

    for comment in comments:

        user = get_creator(

            db,

            comment.user_id,
        )

        response.append({

            "id":
                comment.id,

            "user_id":
                comment.user_id,

            "content":
                comment.content,

            "created_at":
                comment.created_at.isoformat(),

            "user":
                serialize_user(user),
        })

    return {

        "success": True,

        "comments":
            response,

        "count":
            len(response),
    }


# =========================================================
# REPORT
# =========================================================

@router.post("/{reel_id}/report")
def report_reel(

    reel_id: int,

    payload: ReportRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    report = ReelReport(

        user_id=
            current_user.id,

        reel_id=
            reel_id,

        reason=
            payload.reason.strip(),

        description=(

            payload.description.strip()

            if payload.description

            else None
        ),

        created_at=
            utc_now(),
    )

    db.add(report)

    create_interaction(

        db,

        user_id=
            current_user.id,

        reel=reel,

        event_type="report",
    )

    db.commit()

    return {

        "success": True,

        "message":
            "Reel reported successfully",
    }


# =========================================================
# SAVED STATUS
# =========================================================

@router.get("/{reel_id}/saved")
def get_saved_status(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    get_reel_or_404(
        db,
        reel_id,
    )

    saved = (

        db.query(ReelSave)

        .filter(

            ReelSave.user_id
            == current_user.id,

            ReelSave.reel_id
            == reel_id,
        )

        .first()
    )

    return {

        "success": True,

        "saved":
            saved is not None,
    }


# =========================================================
# DELETE OWN REEL
# =========================================================

@router.delete("/{reel_id}")
def delete_my_reel(

    reel_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    reel = get_reel_or_404(

        db,

        reel_id,
    )

    if reel.user_id != current_user.id:

        raise HTTPException(

            status_code=403,

            detail=(
                "You can delete only "
                "your own reel"
            ),
        )

    reel.visibility = "deleted"

    reel.status = "deleted"

    reel.updated_at = utc_now()

    db.commit()

    return {

        "success": True,

        "message":
            "Reel deleted",
    }
