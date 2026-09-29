
"""
USANEX REELS API
================

Production-style API layer for:

- Reel feed
- Personalized recommendation feed
- Reel upload metadata
- Watch analytics
- 1 / 2 / 3 star rating
- Save
- Download tracking
- Share tracking
- Interested / Not interested
- Comments
- Reports
- My Profile -> My Reels
- Reel details

Important:
Business logic remains inside:
    services/reel_ai.py
    services/reel_analytics.py
    services/reel_recommendation.py

This file is only the HTTP/API layer.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    UploadFile,
    File,
    Form,
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


# =========================================================
# TIME
# =========================================================

def utc_now() -> datetime:
    """
    Database uses naive UTC datetimes.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


# =========================================================
# AUTHENTICATION
# =========================================================

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the currently authenticated user from the
    same HTTP-only session cookie used by auth.py.
    """

    session_token = request.cookies.get("usanex_session")

    if not session_token:
        # Compatibility fallback.
        session_token = request.cookies.get("session_token")

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token == session_token
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
        "thumbnail_url": reel.thumbnail_url,

        "duration": float(
            reel.duration or 0
        ),

        "file_size": reel.file_size,

        "caption": reel.caption,
        "hashtags": reel.hashtags,
        "language": reel.language,

        "category": reel.category,

        "visibility": reel.visibility,

        "views_count": int(
            reel.views_count or 0
        ),

        "unique_views_count": int(
            reel.unique_views_count or 0
        ),

        "completed_views_count": int(
            reel.completed_views_count or 0
        ),

        "replay_count": int(
            reel.replay_count or 0
        ),

        "share_count": int(
            reel.share_count or 0
        ),

        "save_count": int(
            reel.save_count or 0
        ),

        "download_count": int(
            reel.download_count or 0
        ),

        "comment_count": int(
            reel.comment_count or 0
        ),

        "one_star_count": int(
            reel.one_star_count or 0
        ),

        "two_star_count": int(
            reel.two_star_count or 0
        ),

        "three_star_count": int(
            reel.three_star_count or 0
        ),

        "interested_count": int(
            reel.interested_count or 0
        ),

        "not_interested_count": int(
            reel.not_interested_count or 0
        ),

        "ai_processed": bool(
            reel.ai_processed
        ),

        "ai_processing_status":
            reel.ai_processing_status,

        "ai_category":
            reel.ai_category,

        "ai_confidence":
            reel.ai_confidence,

        "created_at":
            reel.created_at.isoformat()
            if reel.created_at
            else None,

        "updated_at":
            reel.updated_at.isoformat()
            if reel.updated_at
            else None,

        "creator":
            serialize_user(creator)
            if creator
            else None,
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
# HEALTH
# =========================================================

@router.get("/health")
def reels_health():

    return {
        "success": True,
        "service": "reels",
        "status": "online",
    }


# =========================================================
# GET PERSONALIZED FEED
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
    current_user: User = Depends(get_current_user),
):
    """
    Personalized Reels feed.

    Recommendation service is preferred.

    If recommendation service is temporarily unavailable,
    a safe database fallback is used.
    """

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

            if result is not None:

                if isinstance(result, dict):

                    return {
                        "success": True,
                        **result,
                    }

                if isinstance(result, list):

                    reels = []

                    for item in result:

                        if isinstance(item, Reel):

                            creator = (
                                db.query(User)
                                .filter(
                                    User.id
                                    == item.user_id
                                )
                                .first()
                            )

                            reels.append(
                                serialize_reel(
                                    item,
                                    creator,
                                )
                            )

                    return {
                        "success": True,
                        "reels": reels,
                        "count": len(reels),
                    }

    except Exception:
        """
        Recommendation failure must not break
        the complete Reels page.
        """

        db.rollback()

    # -----------------------------------------------------
    # SAFE FALLBACK
    # -----------------------------------------------------

    query = (
        db.query(Reel)
        .filter(
            Reel.visibility == "public"
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

        creator = (
            db.query(User)
            .filter(
                User.id == reel.user_id
            )
            .first()
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
        "next_cursor": next_cursor,
        "source": "fallback",
    }


# =========================================================
# GET SINGLE REEL
# =========================================================

@router.get("/{reel_id}")
def get_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

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

    creator = (
        db.query(User)
        .filter(
            User.id == reel.user_id
        )
        .first()
    )

    return {
        "success": True,
        "reel": serialize_reel(
            reel,
            creator,
        ),
    }


# =========================================================
# RECORD WATCH EVENT
# =========================================================

@router.post("/{reel_id}/watch")
def watch_reel(
    reel_id: int,
    payload: WatchEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        result = record_reel_view(
            db=db,
            user_id=current_user.id,
            reel_id=reel_id,
            watch_time=payload.watch_time,
            watch_percentage=payload.watch_percentage,
            session_id=payload.session_id,
            feed_position=payload.feed_position,
            source=payload.source,
            completed=payload.completed,
            replayed=payload.replayed,
        )

        return {
            "success": True,
            "data": result,
        }

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
# RATE 1 / 2 / 3 STAR
# =========================================================

@router.post("/{reel_id}/rating")
def rate_reel(
    reel_id: int,
    payload: RatingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        result = set_reel_rating(
            db=db,
            user_id=current_user.id,
            reel_id=reel_id,
            rating=payload.rating,
        )

        return {
            "success": True,
            "data": result,
        }

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
# SAVE REEL
# =========================================================

@router.post("/{reel_id}/save")
def save_reel_route(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        result = save_reel(
            db=db,
            user_id=current_user.id,
            reel_id=reel_id,
        )

        return {
            "success": True,
            "data": result,
        }

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
# DOWNLOAD
# =========================================================

@router.post("/{reel_id}/download")
def download_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        result = record_download(
            db=db,
            user_id=current_user.id,
            reel_id=reel_id,
        )

        return {
            "success": True,
            "data": result,
        }

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
    current_user: User = Depends(get_current_user),
):

    try:

        result = record_share(
            db=db,
            user_id=current_user.id,
            reel_id=reel_id,
            share_type=payload.share_type,
        )

        return {
            "success": True,
            "data": result,
        }

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
    current_user: User = Depends(get_current_user),
):

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

    reel.interested_count = (
        reel.interested_count or 0
    ) + 1

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
    current_user: User = Depends(get_current_user),
):

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

    reel.not_interested_count = (
        reel.not_interested_count or 0
    ) + 1

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
    current_user: User = Depends(get_current_user),
):

    content = payload.content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Comment cannot be empty",
        )

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

    db.commit()
    db.refresh(comment)

    return {
        "success": True,
        "comment": {
            "id": comment.id,
            "user_id": comment.user_id,
            "reel_id": comment.reel_id,
            "content": comment.content,
            "created_at":
                comment.created_at.isoformat(),
            "user": serialize_user(
                current_user
            ),
        },
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
    current_user: User = Depends(get_current_user),
):

    reel_exists = (
        db.query(Reel.id)
        .filter(
            Reel.id == reel_id
        )
        .first()
    )

    if not reel_exists:
        raise HTTPException(
            status_code=404,
            detail="Reel not found",
        )

    comments = (
        db.query(ReelComment)
        .filter(
            ReelComment.reel_id == reel_id,
            ReelComment.is_deleted.is_(False),
        )
        .order_by(
            ReelComment.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    response = []

    for comment in comments:

        user = (
            db.query(User)
            .filter(
                User.id == comment.user_id
            )
            .first()
        )

        response.append(
            {
                "id": comment.id,
                "user_id": comment.user_id,
                "content": comment.content,
                "created_at":
                    comment.created_at.isoformat(),
                "user":
                    serialize_user(user),
            }
        )

    return {
        "success": True,
        "comments": response,
        "count": len(response),
    }


# =========================================================
# REPORT REEL
# =========================================================

@router.post("/{reel_id}/report")
def report_reel(
    reel_id: int,
    payload: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

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
    db.commit()

    return {
        "success": True,
        "message": "Reel reported successfully",
    }


# =========================================================
# MY PROFILE -> MY REELS
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
    current_user: User = Depends(get_current_user),
):

    reels_db = (
        db.query(Reel)
        .filter(
            Reel.user_id == current_user.id
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
        "owner": serialize_user(
            current_user
        ),
    }


# =========================================================
# MY SAVED REELS
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
    current_user: User = Depends(get_current_user),
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
                Reel.id == row.reel_id
            )
            .first()
        )

        if reel is None:
            continue

        creator = (
            db.query(User)
            .filter(
                User.id == reel.user_id
            )
            .first()
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
# DELETE OWN REEL
# =========================================================

@router.delete("/{reel_id}")
def delete_my_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

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

    if reel.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can delete only your own reel",
        )

    # Soft-delete through visibility instead of
    # physically deleting analytics/history.
    reel.visibility = "deleted"

    db.commit()

    return {
        "success": True,
        "message": "Reel deleted",
    }
