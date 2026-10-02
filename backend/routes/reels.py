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
    ReelAIFeature,
    ReelComment,
    ReelReport,
    ReelSave,
    ReelDownload,
    ReelShare,
    ReelRating,
    ReelInteraction,
    UserReelHistory,
    UserReelInterest,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/reels",
    tags=["Reels"],
)


# =========================================================
# CONSTANTS
# =========================================================

DEFAULT_FEED_LIMIT = 10
MAX_FEED_LIMIT = 50

MAX_REEL_LIST_LIMIT = 100

MAX_COMMENT_LENGTH = 2000
MAX_REPORT_DESCRIPTION = 2000

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
# CLOUDINARY
# =========================================================

def configure_cloudinary() -> bool:

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


CLOUDINARY_CONFIGURED = (
    configure_cloudinary()
)


def cloudinary_ready() -> bool:

    global CLOUDINARY_CONFIGURED

    CLOUDINARY_CONFIGURED = (
        configure_cloudinary()
    )

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
# AUTH
# =========================================================

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:

    token = request.cookies.get(
        "usanex_session"
    )

    if not token:

        token = request.cookies.get(
            "session_token"
        )

    if not token:

        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token
            == token
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

        expires_at = (
            expires_at.replace(
                tzinfo=None
            )
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
            User.id
            == session.user_id
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

        "cloudinary_public_id":
            getattr(
                reel,
                "cloudinary_public_id",
                None,
            ),

        "duration":
            float(reel.duration or 0),

        "file_size":
            int(reel.file_size or 0),

        "caption":
            reel.caption,

        "hashtags":
            reel.hashtags,

        "language":
            reel.language,

        "category":
            reel.category,

        "visibility":
            reel.visibility,

        "status":
            reel.status,

        "views_count":
            int(reel.views_count or 0),

        "unique_views_count":
            int(
                reel.unique_views_count
                or 0
            ),

        "completed_views_count":
            int(
                reel.completed_views_count
                or 0
            ),

        "replay_count":
            int(
                reel.replay_count
                or 0
            ),

        "share_count":
            int(
                reel.share_count
                or 0
            ),

        "save_count":
            int(
                reel.save_count
                or 0
            ),

        "download_count":
            int(
                reel.download_count
                or 0
            ),

        "comment_count":
            int(
                reel.comment_count
                or 0
            ),

        "one_star_count":
            int(
                reel.one_star_count
                or 0
            ),

        "two_star_count":
            int(
                reel.two_star_count
                or 0
            ),

        "three_star_count":
            int(
                reel.three_star_count
                or 0
            ),

        "interested_count":
            int(
                reel.interested_count
                or 0
            ),

        "not_interested_count":
            int(
                reel.not_interested_count
                or 0
            ),

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
            (
                reel.created_at.isoformat()
                if reel.created_at
                else None
            ),

        "updated_at":
            (
                reel.updated_at.isoformat()
                if reel.updated_at
                else None
            ),

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

    db.flush()

    return interaction


# =========================================================
# UPDATE USER REEL HISTORY
# =========================================================

def update_reel_history(
    db: Session,
    user_id: int,
    reel: Reel,
    watch_time: float,
    watch_percentage: float,
    completed: bool,
    replay_count: int,
):

    history = (
        db.query(UserReelHistory)
        .filter(
            UserReelHistory.user_id
            == user_id,

            UserReelHistory.reel_id
            == reel.id,
        )
        .first()
    )

    now = utc_now()

    if history is None:

        history = UserReelHistory(

            user_id=user_id,

            reel_id=reel.id,

            first_seen_at=now,

            last_seen_at=now,

            times_seen=1,

            total_watch_time=watch_time,

            max_watch_percentage=watch_percentage,

            completed_count=(
                1 if completed else 0
            ),

            replay_count=replay_count,
        )

        db.add(history)

    else:

        history.last_seen_at = now

        history.times_seen = (
            history.times_seen or 0
        ) + 1

        history.total_watch_time = (
            history.total_watch_time or 0
        ) + watch_time

        history.max_watch_percentage = max(
            history.max_watch_percentage or 0,
            watch_percentage,
        )

        if completed:

            history.completed_count = (
                history.completed_count or 0
            ) + 1

        history.replay_count = (
            history.replay_count or 0
        ) + replay_count


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
def reels_health():

    return {

        "success": True,

        "service": "reels",

        "status": "online",

        "storage": "cloudinary",

        "cloudinary_configured":
            cloudinary_ready(),
    }


# =========================================================
# FEED
# =========================================================

@router.get("/feed")
def get_reels_feed(

    limit: int = Query(
        DEFAULT_FEED_LIMIT,
        ge=1,
        le=MAX_FEED_LIMIT,
    ),

    cursor: Optional[int] = Query(
        default=None,
        ge=1,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    query = (
        db.query(Reel)
        .filter(
            Reel.visibility == "public",

            Reel.status == "published",

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

    reels = []

    for reel in reels_db:

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

    next_cursor = (
        reels_db[-1].id
        if reels_db
        else None
    )

    return {

        "success": True,

        "reels": reels,

        "count": len(reels),

        "next_cursor":
            next_cursor,
    }


# =========================================================
# MY REELS
# =========================================================

@router.get("/me/list")
def get_my_reels(

    limit: int = Query(
        50,
        ge=1,
        le=MAX_REEL_LIST_LIMIT,
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

    return {

        "success": True,

        "reels": [

            serialize_reel(
                reel,
                current_user,
            )

            for reel in reels_db
        ],

        "count":
            len(reels_db),

        "owner":
            serialize_user(
                current_user
            ),
    }


# =========================================================
# USER REELS
# =========================================================

@router.get("/user/{user_id}/list")
def get_user_reels(

    user_id: str,

    limit: int = Query(
        50,
        ge=1,
        le=MAX_REEL_LIST_LIMIT,
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

    profile_user = (
        db.query(User)
        .filter(
            User.user_id
            == user_id
        )
        .first()
    )

    if profile_user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    reels_db = (
        db.query(Reel)
        .filter(
            Reel.user_id
            == profile_user.id,

            Reel.status
            == "published",

            Reel.visibility
            == "public",

            Reel.is_safe.is_(True),
        )
        .order_by(
            Reel.created_at.desc(),
            Reel.id.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {

        "success": True,

        "reels": [

            serialize_reel(
                reel,
                profile_user,
            )

            for reel in reels_db
        ],

        "count":
            len(reels_db),

        "owner":
            serialize_user(
                profile_user
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
        le=MAX_REEL_LIST_LIMIT,
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

        "count":
            len(reels),
    }


# =========================================================
# UPLOAD REEL
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

    if not cloudinary_ready():

        raise HTTPException(
            status_code=503,
            detail="Cloudinary is not configured",
        )

    filename = (
        video.filename
        or "video.mp4"
    )

    extension = Path(
        filename
    ).suffix.lower()

    content_type = (
        video.content_type
        or ""
    ).lower()

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

                if total_size > MAX_VIDEO_SIZE:

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "Video size exceeds "
                            "2 GB limit"
                        ),
                    )

                temp_file.write(chunk)

        public_id = (
            "reel_"
            + uuid.uuid4().hex
        )

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

        thumbnail_url = None

        if cloudinary_public_id:

            try:

                thumbnail_result = (
                    cloudinary.utils.cloudinary_url(
                        cloudinary_public_id,
                        resource_type="video",
                        secure=True,
                        format="jpg",
                    )
                )

                thumbnail_url = (
                    thumbnail_result[0]
                    if isinstance(
                        thumbnail_result,
                        tuple,
                    )
                    else thumbnail_result
                )

            except Exception:

                thumbnail_url = None

        now = utc_now()

        reel = Reel(

            user_id=current_user.id,

            video_url=video_url,

            thumbnail_url=thumbnail_url,

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

            views_count=0,

            unique_views_count=0,

            completed_views_count=0,

            replay_count=0,

            share_count=0,

            save_count=0,

            download_count=0,

            comment_count=0,

            one_star_count=0,

            two_star_count=0,

            three_star_count=0,

            interested_count=0,

            not_interested_count=0,

            ai_processed=False,

            ai_processing_status="pending",

            is_safe=True,

            created_at=now,

            updated_at=now,
        )

        # -------------------------------------------------
        # Cloudinary public ID
        # -------------------------------------------------

        if hasattr(
            Reel,
            "cloudinary_public_id",
        ):

            reel.cloudinary_public_id = (
                cloudinary_public_id
            )

        db.add(reel)

        db.commit()

        db.refresh(reel)

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
                    current_user,
                ),
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as exc:

        db.rollback()

        # -------------------------------------------------
        # If DB save failed after Cloudinary upload,
        # try deleting uploaded video.
        # -------------------------------------------------

        try:

            if (
                "cloudinary_public_id"
                in locals()
                and cloudinary_public_id
            ):

                cloudinary.uploader.destroy(
                    cloudinary_public_id,
                    resource_type="video",
                )

        except Exception:

            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "Reel upload failed: "
                + str(exc)
            ),
        )

    finally:

        if (
            temp_path
            and
            os.path.exists(temp_path)
        ):

            try:

                os.remove(temp_path)

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

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    # -----------------------------------------------------
    # Check existing user history
    # -----------------------------------------------------

    history = (
        db.query(UserReelHistory)
        .filter(
            UserReelHistory.user_id
            == current_user.id,

            UserReelHistory.reel_id
            == reel_id,
        )
        .first()
    )

    is_unique_view = (
        history is None
    )

    # -----------------------------------------------------
    # Total views
    # -----------------------------------------------------

    reel.views_count = (
        reel.views_count or 0
    ) + 1

    # -----------------------------------------------------
    # Unique views
    # -----------------------------------------------------

    if is_unique_view:

        reel.unique_views_count = (
            reel.unique_views_count or 0
        ) + 1

    # -----------------------------------------------------
    # Completed
    # -----------------------------------------------------

    if payload.completed:

        reel.completed_views_count = (
            reel.completed_views_count or 0
        ) + 1

    # -----------------------------------------------------
    # Replay
    # -----------------------------------------------------

    replay_increment = 0

    if payload.replayed:

        replay_increment = max(
            1,
            payload.replay_count,
        )

        reel.replay_count = (
            reel.replay_count or 0
        ) + replay_increment

    # -----------------------------------------------------
    # History
    # -----------------------------------------------------

    update_reel_history(

        db,

        user_id=current_user.id,

        reel=reel,

        watch_time=payload.watch_time,

        watch_percentage=(
            payload.watch_percentage
        ),

        completed=payload.completed,

        replay_count=replay_increment,
    )

    # -----------------------------------------------------
    # Interaction
    # -----------------------------------------------------

    interaction = create_interaction(

        db,

        user_id=current_user.id,

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

        session_id=payload.session_id,

        feed_position=payload.feed_position,

        source=payload.source,

        watch_time=payload.watch_time,

        watch_percentage=(
            payload.watch_percentage
        ),

        completed=payload.completed,

        replayed=payload.replayed,

        replay_count=replay_increment,
    )

    db.commit()

    return {

        "success": True,

        "interaction_id":
            interaction.id,

        "is_unique_view":
            is_unique_view,

        "views_count":
            reel.views_count,

        "unique_views_count":
            reel.unique_views_count,

        "completed_views_count":
            reel.completed_views_count,

        "replay_count":
            reel.replay_count,
    }


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

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    existing = (
        db.query(ReelRating)
        .filter(
            ReelRating.user_id
            == current_user.id,

            ReelRating.reel_id
            == reel_id,
        )
        .first()
    )

    if existing:

        old_rating = existing.rating

        if old_rating == 1:

            reel.one_star_count = max(
                0,
                (reel.one_star_count or 0)
                - 1,
            )

        elif old_rating == 2:

            reel.two_star_count = max(
                0,
                (reel.two_star_count or 0)
                - 1,
            )

        elif old_rating == 3:

            reel.three_star_count = max(
                0,
                (reel.three_star_count or 0)
                - 1,
            )

        existing.rating = payload.rating

        existing.updated_at = utc_now()

    else:

        existing = ReelRating(

            user_id=current_user.id,

            reel_id=reel_id,

            rating=payload.rating,

            created_at=utc_now(),

            updated_at=utc_now(),
        )

        db.add(existing)

    if payload.rating == 1:

        reel.one_star_count = (
            reel.one_star_count or 0
        ) + 1

    elif payload.rating == 2:

        reel.two_star_count = (
            reel.two_star_count or 0
        ) + 1

    elif payload.rating == 3:

        reel.three_star_count = (
            reel.three_star_count or 0
        ) + 1

    interaction = create_interaction(

        db,

        user_id=current_user.id,

        reel=reel,

        event_type="star",

        star_rating=payload.rating,
    )

    db.commit()

    return {

        "success": True,

        "rating":
            payload.rating,

        "one_star_count":
            reel.one_star_count,

        "two_star_count":
            reel.two_star_count,

        "three_star_count":
            reel.three_star_count,

        "interaction_id":
            interaction.id,
    }


# =========================================================
# SAVE
# =========================================================

@router.post("/{reel_id}/save")
def save_reel(

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

    existing = (
        db.query(ReelSave)
        .filter(
            ReelSave.user_id
            == current_user.id,

            ReelSave.reel_id
            == reel_id,
        )
        .first()
    )

    if existing:

        return {

            "success": True,

            "saved": True,

            "save_count":
                reel.save_count,
        }

    row = ReelSave(

        user_id=current_user.id,

        reel_id=reel_id,

        created_at=utc_now(),
    )

    db.add(row)

    reel.save_count = (
        reel.save_count or 0
    ) + 1

    interaction = create_interaction(

        db,

        user_id=current_user.id,

        reel=reel,

        event_type="save",

        saved=True,
    )

    db.commit()

    return {

        "success": True,

        "saved": True,

        "save_count":
            reel.save_count,

        "interaction_id":
            interaction.id,
    }


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

            "save_count":
                reel.save_count,
        }

    db.delete(saved)

    reel.save_count = max(
        0,
        (reel.save_count or 0)
        - 1,
    )

    create_interaction(

        db,

        user_id=current_user.id,

        reel=reel,

        event_type="unsave",
    )

    db.commit()

    return {

        "success": True,

        "saved": False,

        "save_count":
            reel.save_count,
    }


# =========================================================
# SAVED STATUS
# =========================================================

@router.get("/{reel_id}/saved")
def saved_status(

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

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    download = ReelDownload(

        user_id=current_user.id,

        reel_id=reel_id,

        created_at=utc_now(),
    )

    db.add(download)

    reel.download_count = (
        reel.download_count or 0
    ) + 1

    interaction = create_interaction(

        db,

        user_id=current_user.id,

        reel=reel,

        event_type="download",

        downloaded=True,
    )

    db.commit()

    return {

        "success": True,

        "download_count":
            reel.download_count,

        "video_url":
            reel.video_url,

        "interaction_id":
            interaction.id,
    }


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

    reel = get_reel_or_404(
        db,
        reel_id,
    )

    share = ReelShare(

        user_id=current_user.id,

        reel_id=reel_id,

        share_type=payload.share_type,

        created_at=utc_now(),
    )

    db.add(share)

    reel.share_count = (
        reel.share_count or 0
    ) + 1

    interaction = create_interaction(

        db,

        user_id=current_user.id,

        reel=reel,

        event_type="share",

        shared=True,
    )

    db.commit()

    return {

        "success": True,

        "share_count":
            reel.share_count,

        "interaction_id":
            interaction.id,
    }


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

        user_id=current_user.id,

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

        user_id=current_user.id,

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
# ADD COMMENT
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

        user_id=current_user.id,

        reel_id=reel_id,

        content=content,

        is_deleted=False,

        created_at=utc_now(),
    )

    db.add(comment)

    reel.comment_count = (
        reel.comment_count or 0
    ) + 1

    interaction = create_interaction(

        db,

        user_id=current_user.id,

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


# =========================================================
# GET COMMENTS
# =========================================================

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

        "comments": response,

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

        user_id=current_user.id,

        reel_id=reel_id,

        reason=payload.reason.strip(),

        description=(
            payload.description.strip()
            if payload.description
            else None
        ),

        created_at=utc_now(),
    )

    db.add(report)

    create_interaction(

        db,

        user_id=current_user.id,

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

    # -----------------------------------------------------
    # Cloudinary delete
    # -----------------------------------------------------

    cloudinary_public_id = getattr(
        reel,
        "cloudinary_public_id",
        None,
    )

    if (
        cloudinary_public_id
        and cloudinary_ready()
    ):

        try:

            cloudinary.uploader.destroy(
                cloudinary_public_id,
                resource_type="video",
            )

        except Exception:

            # Don't expose internal
            # Cloudinary error to user.
            pass

    # -----------------------------------------------------
    # Soft delete database record
    # -----------------------------------------------------

    reel.visibility = "deleted"

    reel.status = "deleted"

    reel.updated_at = utc_now()

    db.commit()

    return {

        "success": True,

        "message":
            "Reel deleted successfully",
    }
