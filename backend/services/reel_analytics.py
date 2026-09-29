
"""
USANEX - REEL ANALYTICS ENGINE
================================

Production-style analytics service for Reels.

Responsibilities:
- Record reel viewing behaviour
- Calculate watch/completion signals
- Maintain 1/2/3-star analytics
- Maintain save/download/share analytics
- Maintain interested/not-interested signals
- Maintain creator/reel performance
- Maintain broad area analytics
- Update user interest signals
- Generate recommendation features
- Keep analytics processing separate from API routes

Important:
- No exact GPS/address is stored here.
- Only broad country/state/city analytics are supported.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database.models import (
    Reel,
    ReelInteraction,
    ReelRating,
    ReelSave,
    ReelDownload,
    ReelShare,
    ReelComment,
    ReelAnalytics,
    ReelAreaAnalytics,
    UserReelInterest,
    UserReelHistory,
    UserInterestProfile,
    ReelAIFeature,
)


# =========================================================
# CONSTANTS
# =========================================================

MIN_COMPLETION = 0.0
MAX_COMPLETION = 100.0

MIN_STAR = 0
MAX_STAR = 3

DEFAULT_WATCH_WEIGHT = 1.0

# Behaviour weights.
# These are analytics/recommendation signals, not final AI
# model weights.
WATCH_WEIGHT = 1.0
COMPLETION_WEIGHT = 2.0
REPLAY_WEIGHT = 2.5
ONE_STAR_WEIGHT = -1.0
TWO_STAR_WEIGHT = 1.0
THREE_STAR_WEIGHT = 3.0
SAVE_WEIGHT = 4.0
DOWNLOAD_WEIGHT = 3.5
SHARE_WEIGHT = 4.0
INTEREST_WEIGHT = 3.0
NOT_INTEREST_WEIGHT = -5.0


# =========================================================
# BASIC HELPERS
# =========================================================

def utc_now() -> datetime:
    return datetime.utcnow()


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default

        number = float(value)

        if number != number:
            return default

        return number

    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# =========================================================
# WATCH DATA NORMALIZATION
# =========================================================

def normalize_watch_percentage(
    watch_percentage: float,
) -> float:
    """
    Normalize watch percentage into 0-100.
    """

    return clamp(
        safe_float(watch_percentage),
        MIN_COMPLETION,
        MAX_COMPLETION,
    )


def calculate_completion(
    watch_percentage: float,
    completed: bool = False,
) -> bool:
    """
    A reel is considered completed if:
    - frontend explicitly reports completed
    OR
    - watch percentage >= 90%
    """

    percentage = normalize_watch_percentage(
        watch_percentage
    )

    return bool(
        completed or percentage >= 90.0
    )


# =========================================================
# REEL ANALYTICS CREATION
# =========================================================

def get_or_create_reel_analytics(
    db: Session,
    reel_id: int,
) -> ReelAnalytics:

    analytics = (
        db.query(ReelAnalytics)
        .filter(
            ReelAnalytics.reel_id == reel_id
        )
        .first()
    )

    if analytics:
        return analytics

    analytics = ReelAnalytics(
        reel_id=reel_id,
        view_count=0,
        unique_viewers=0,
        total_watch_seconds=0,
        average_watch_seconds=0,
        average_completion=0,
        replay_count=0,
        one_star_count=0,
        two_star_count=0,
        three_star_count=0,
        save_count=0,
        download_count=0,
        share_count=0,
        interested_count=0,
        not_interested_count=0,
        comment_count=0,
        updated_at=utc_now(),
    )

    db.add(analytics)
    db.flush()

    return analytics


# =========================================================
# USER REEL HISTORY
# =========================================================

def update_user_reel_history(
    db: Session,
    user_id: int,
    reel_id: int,
    watch_time: float,
    watch_percentage: float,
    completed: bool,
    replayed: bool,
) -> UserReelHistory:

    now = utc_now()

    history = (
        db.query(UserReelHistory)
        .filter(
            UserReelHistory.user_id == user_id,
            UserReelHistory.reel_id == reel_id,
        )
        .first()
    )

    if history is None:

        history = UserReelHistory(
            user_id=user_id,
            reel_id=reel_id,
            first_seen_at=now,
            last_seen_at=now,
            times_seen=1,
            total_watch_time=max(0.0, watch_time),
            max_watch_percentage=watch_percentage,
            completed_count=1 if completed else 0,
            replay_count=1 if replayed else 0,
        )

        db.add(history)

    else:

        history.last_seen_at = now

        history.times_seen += 1

        history.total_watch_time += max(
            0.0,
            watch_time,
        )

        history.max_watch_percentage = max(
            history.max_watch_percentage,
            watch_percentage,
        )

        if completed:
            history.completed_count += 1

        if replayed:
            history.replay_count += 1

    db.flush()

    return history


# =========================================================
# USER INTEREST PROFILE
# =========================================================

def get_or_create_interest_profile(
    db: Session,
    user_id: int,
) -> UserInterestProfile:

    profile = (
        db.query(UserInterestProfile)
        .filter(
            UserInterestProfile.user_id == user_id
        )
        .first()
    )

    if profile:
        return profile

    profile = UserInterestProfile(
        user_id=user_id,
        topic_scores="{}",
        category_scores="{}",
        creator_scores="{}",
        language_scores="{}",
        total_reels_watched=0,
        total_watch_seconds=0,
        average_completion=0,
        last_updated=utc_now(),
    )

    db.add(profile)
    db.flush()

    return profile


# =========================================================
# CATEGORY INTEREST
# =========================================================

def update_category_interest(
    db: Session,
    user_id: int,
    category: Optional[str],
    watch_time: float,
    watch_percentage: float,
    star_rating: int = 0,
    saved: bool = False,
    downloaded: bool = False,
    shared: bool = False,
    interested: bool = False,
    not_interested: bool = False,
    replayed: bool = False,
) -> Optional[UserReelInterest]:

    if not category:
        return None

    category = category.strip().lower()

    if not category:
        return None

    record = (
        db.query(UserReelInterest)
        .filter(
            UserReelInterest.user_id == user_id,
            UserReelInterest.category == category,
            UserReelInterest.subcategory.is_(None),
        )
        .first()
    )

    if record is None:

        record = UserReelInterest(
            user_id=user_id,
            category=category,
            subcategory=None,
            interest_score=0,
            positive_score=0,
            negative_score=0,
            videos_seen=0,
            videos_completed=0,
            total_watch_time=0,
            average_watch_percentage=0,
            total_replays=0,
            total_saves=0,
            total_shares=0,
            total_downloads=0,
            total_one_star=0,
            total_two_star=0,
            total_three_star=0,
            last_updated=utc_now(),
        )

        db.add(record)

    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    record.videos_seen += 1

    record.total_watch_time += max(
        0.0,
        watch_time,
    )

    previous_seen = max(
        0,
        record.videos_seen - 1,
    )

    if previous_seen == 0:
        record.average_watch_percentage = (
            watch_percentage
        )
    else:
        record.average_watch_percentage = (
            (
                record.average_watch_percentage
                * previous_seen
            )
            + watch_percentage
        ) / record.videos_seen

    if watch_percentage >= 90:
        record.videos_completed += 1

    if replayed:
        record.total_replays += 1

    if saved:
        record.total_saves += 1

    if shared:
        record.total_shares += 1

    if downloaded:
        record.total_downloads += 1

    # -----------------------------------------------------
    # Star signals
    # -----------------------------------------------------

    if star_rating == 1:
        record.total_one_star += 1

    elif star_rating == 2:
        record.total_two_star += 1

    elif star_rating == 3:
        record.total_three_star += 1

    # -----------------------------------------------------
    # Positive / negative score
    # -----------------------------------------------------

    positive = 0.0
    negative = 0.0

    positive += (
        watch_percentage / 100.0
        * WATCH_WEIGHT
    )

    positive += (
        watch_percentage / 100.0
        * COMPLETION_WEIGHT
    )

    if star_rating == 2:
        positive += TWO_STAR_WEIGHT

    elif star_rating == 3:
        positive += THREE_STAR_WEIGHT

    elif star_rating == 1:
        negative += abs(ONE_STAR_WEIGHT)

    if replayed:
        positive += REPLAY_WEIGHT

    if saved:
        positive += SAVE_WEIGHT

    if downloaded:
        positive += DOWNLOAD_WEIGHT

    if shared:
        positive += SHARE_WEIGHT

    if interested:
        positive += INTEREST_WEIGHT

    if not_interested:
        negative += abs(
            NOT_INTEREST_WEIGHT
        )

    record.positive_score += positive
    record.negative_score += negative

    record.interest_score = (
        record.positive_score
        - record.negative_score
    )

    record.last_updated = utc_now()

    db.flush()

    return record


# =========================================================
# REEL AI FEATURE SIGNAL
# =========================================================

def get_reel_ai_features(
    db: Session,
    reel_id: int,
) -> Optional[ReelAIFeature]:

    return (
        db.query(ReelAIFeature)
        .filter(
            ReelAIFeature.reel_id == reel_id
        )
        .first()
    )


# =========================================================
# RECORD VIEW
# =========================================================

def record_reel_view(
    db: Session,
    user_id: int,
    reel_id: int,
    watch_time: float,
    watch_percentage: float,
    session_id: Optional[str] = None,
    feed_position: Optional[int] = None,
    source: Optional[str] = None,
    completed: bool = False,
    replayed: bool = False,
) -> Dict[str, Any]:

    reel = (
        db.query(Reel)
        .filter(
            Reel.id == reel_id
        )
        .first()
    )

    if reel is None:
        raise ValueError(
            "Reel not found"
        )

    now = utc_now()

    watch_time = max(
        0.0,
        safe_float(watch_time),
    )

    watch_percentage = normalize_watch_percentage(
        watch_percentage
    )

    completed = calculate_completion(
        watch_percentage,
        completed,
    )

    # -----------------------------------------------------
    # Create interaction event
    # -----------------------------------------------------

    interaction = ReelInteraction(
        user_id=user_id,
        reel_id=reel_id,
        watch_time=watch_time,
        watch_percentage=watch_percentage,
        completed=completed,
        replayed=replayed,
        star_rating=0,
        interested=False,
        not_interested=False,
        saved=False,
        downloaded=False,
        shared=False,
        commented=False,
        session_id=session_id,
        feed_position=feed_position,
        source=source,
        created_at=now,
        updated_at=now,
    )

    db.add(interaction)

    # -----------------------------------------------------
    # History
    # -----------------------------------------------------

    update_user_reel_history(
        db=db,
        user_id=user_id,
        reel_id=reel_id,
        watch_time=watch_time,
        watch_percentage=watch_percentage,
        completed=completed,
        replayed=replayed,
    )

    # -----------------------------------------------------
    # Reel counters
    # -----------------------------------------------------

    reel.views_count += 1

    if completed:
        reel.completed_views_count += 1

    if replayed:
        reel.replay_count += 1

    # -----------------------------------------------------
    # Aggregate analytics
    # -----------------------------------------------------

    analytics = get_or_create_reel_analytics(
        db=db,
        reel_id=reel_id,
    )

    analytics.view_count += 1

    analytics.total_watch_seconds += watch_time

    analytics.average_watch_seconds = (
        analytics.total_watch_seconds
        / max(1, analytics.view_count)
    )

    old_views = max(
        0,
        analytics.view_count - 1,
    )

    analytics.average_completion = (
        (
            analytics.average_completion
            * old_views
        )
        + watch_percentage
    ) / analytics.view_count

    if replayed:
        analytics.replay_count += 1

    analytics.updated_at = now

    # -----------------------------------------------------
    # User interest
    # -----------------------------------------------------

    update_category_interest(
        db=db,
        user_id=user_id,
        category=reel.category,
        watch_time=watch_time,
        watch_percentage=watch_percentage,
        replayed=replayed,
    )

    # -----------------------------------------------------
    # User global profile
    # -----------------------------------------------------

    profile = get_or_create_interest_profile(
        db=db,
        user_id=user_id,
    )

    previous_total = (
        profile.total_reels_watched
    )

    profile.total_reels_watched += 1

    profile.total_watch_seconds += watch_time

    profile.average_completion = (
        (
            profile.average_completion
            * previous_total
        )
        + watch_percentage
    ) / max(
        1,
        profile.total_reels_watched,
    )

    profile.last_updated = now

    db.commit()

    return {
        "success": True,
        "reel_id": reel_id,
        "watch_time": watch_time,
        "watch_percentage": watch_percentage,
        "completed": completed,
        "replayed": replayed,
    }


# =========================================================
# STAR RATING
# =========================================================

def set_reel_rating(
    db: Session,
    user_id: int,
    reel_id: int,
    rating: int,
) -> Dict[str, Any]:

    rating = safe_int(rating)

    if rating < 1 or rating > 3:
        raise ValueError(
            "Rating must be 1, 2 or 3"
        )

    reel = (
        db.query(Reel)
        .filter(
            Reel.id == reel_id
        )
        .first()
    )

    if reel is None:
        raise ValueError(
            "Reel not found"
        )

    now = utc_now()

    existing = (
        db.query(ReelRating)
        .filter(
            ReelRating.user_id == user_id,
            ReelRating.reel_id == reel_id,
        )
        .first()
    )

    old_rating = (
        existing.rating
        if existing
        else 0
    )

    # -----------------------------------------------------
    # Update current rating
    # -----------------------------------------------------

    if existing:

        existing.rating = rating
        existing.updated_at = now

    else:

        existing = ReelRating(
            user_id=user_id,
            reel_id=reel_id,
            rating=rating,
            created_at=now,
            updated_at=now,
        )

        db.add(existing)

    # -----------------------------------------------------
    # Update reel counters
    # -----------------------------------------------------

    if old_rating == 1:
        reel.one_star_count = max(
            0,
            reel.one_star_count - 1,
        )

    elif old_rating == 2:
        reel.two_star_count = max(
            0,
            reel.two_star_count - 1,
        )

    elif old_rating == 3:
        reel.three_star_count = max(
            0,
            reel.three_star_count - 1,
        )

    if rating == 1:
        reel.one_star_count += 1

    elif rating == 2:
        reel.two_star_count += 1

    elif rating == 3:
        reel.three_star_count += 1

    # -----------------------------------------------------
    # Analytics
    # -----------------------------------------------------

    analytics = get_or_create_reel_analytics(
        db=db,
        reel_id=reel_id,
    )

    if old_rating == 1:
        analytics.one_star_count = max(
            0,
            analytics.one_star_count - 1,
        )

    elif old_rating == 2:
        analytics.two_star_count = max(
            0,
            analytics.two_star_count - 1,
        )

    elif old_rating == 3:
        analytics.three_star_count = max(
            0,
            analytics.three_star_count - 1,
        )

    if rating == 1:
        analytics.one_star_count += 1

    elif rating == 2:
        analytics.two_star_count += 1

    elif rating == 3:
        analytics.three_star_count += 1

    analytics.updated_at = now

    db.commit()

    return {
        "success": True,
        "reel_id": reel_id,
        "rating": rating,
        "previous_rating": old_rating,
    }


# =========================================================
# SAVE REEL
# =========================================================

def save_reel(
    db: Session,
    user_id: int,
    reel_id: int,
) -> Dict[str, Any]:

    reel = (
        db.query(Reel)
        .filter(Reel.id == reel_id)
        .first()
    )

    if reel is None:
        raise ValueError(
            "Reel not found"
        )

    existing = (
        db.query(ReelSave)
        .filter(
            ReelSave.user_id == user_id,
            ReelSave.reel_id == reel_id,
        )
        .first()
    )

    if existing:
        return {
            "success": True,
            "saved": True,
            "already_saved": True,
        }

    db.add(
        ReelSave(
            user_id=user_id,
            reel_id=reel_id,
            created_at=utc_now(),
        )
    )

    reel.save_count += 1

    analytics = get_or_create_reel_analytics(
        db,
        reel_id,
    )

    analytics.save_count += 1
    analytics.updated_at = utc_now()

    db.commit()

    return {
        "success": True,
        "saved": True,
        "already_saved": False,
    }


# =========================================================
# DOWNLOAD REEL
# =========================================================

def record_download(
    db: Session,
    user_id: int,
    reel_id: int,
) -> Dict[str, Any]:

    reel = (
        db.query(Reel)
        .filter(Reel.id == reel_id)
        .first()
    )

    if reel is None:
        raise ValueError(
            "Reel not found"
        )

    db.add(
        ReelDownload(
            user_id=user_id,
            reel_id=reel_id,
            created_at=utc_now(),
        )
    )

    reel.download_count += 1

    analytics = get_or_create_reel_analytics(
        db,
        reel_id,
    )

    analytics.download_count += 1
    analytics.updated_at = utc_now()

    db.commit()

    return {
        "success": True,
        "downloaded": True,
    }


# =========================================================
# SHARE REEL
# =========================================================

def record_share(
    db: Session,
    user_id: int,
    reel_id: int,
    share_type: Optional[str] = None,
) -> Dict[str, Any]:

    reel = (
        db.query(Reel)
        .filter(Reel.id == reel_id)
        .first()
    )

    if reel is None:
        raise ValueError(
            "Reel not found"
        )

    db.add(
        ReelShare(
            user_id=user_id,
            reel_id=reel_id,
            share_type=share_type,
            created_at=utc_now(),
        )
    )

    reel.share_count += 1

    analytics = get_or_create_reel_analytics(
        db,
        reel_id,
    )

    analytics.share_count += 1
    analytics.updated_at = utc_now()

    db.commit()

    return {
        "success": True,
        "shared": True,
    }


# =========================================================
# INTEREST / NOT INTERESTED
# =========================================================

def set_interest(
    db: Session,
    user_id: int,
    reel_id: int,
    interested: bool,
) -> Dict[str, Any]:

    reel = (
        db.query(Reel)
        .filter(Reel.id == reel_id)
        .first()
    )

    if reel is None:
        raise ValueError(
            "Reel not found"
        )

    now = utc_now()

    interaction = (
        db.query(ReelInteraction)
        .filter(
            ReelInteraction.user_id == user_id,
            ReelInteraction.reel_id == reel_id,
        )
        .order_by(
            ReelInteraction.created_at.desc()
        )
        .first()
    )

    if interaction is None:

        interaction = ReelInteraction(
            user_id=user_id,
            reel_id=reel_id,
            watch_time=0,
            watch_percentage=0,
            completed=False,
            replayed=False,
            star_rating=0,
            created_at=now,
            updated_at=now,
        )

        db.add(interaction)

    old_interested = bool(
        interaction.interested
    )

    old_not_interested = bool(
        interaction.not_interested
    )

    interaction.interested = bool(
        interested
    )

    interaction.not_interested = not bool(
        interested
    )

    interaction.updated_at = now

    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    if old_interested:
        reel.interested_count = max(
            0,
            reel.interested_count - 1,
        )

    if old_not_interested:
        reel.not_interested_count = max(
            0,
            reel.not_interested_count - 1,
        )

    if interested:
        reel.interested_count += 1
    else:
        reel.not_interested_count += 1

    # -----------------------------------------------------
    # Analytics
    # -----------------------------------------------------

    analytics = get_or_create_reel_analytics(
        db,
        reel_id,
    )

    if old_interested:
        analytics.interested_count = max(
            0,
            analytics.interested_count - 1,
        )

    if old_not_interested:
        analytics.not_interested_count = max(
            0,
            analytics.not_interested_count - 1,
        )

    if interested:
        analytics.interested_count += 1
    else:
        analytics.not_interested_count += 1

    analytics.updated_at = now

    # -----------------------------------------------------
    # User category learning
    # -----------------------------------------------------

    update_category_interest(
        db=db,
        user_id=user_id,
        category=reel.category,
        watch_time=0,
        watch_percentage=0,
        interested=interested,
        not_interested=not interested,
    )

    db.commit()

    return {
        "success": True,
        "interested": interested,
        "not_interested": not interested,
    }


# =========================================================
# REEL PERFORMANCE SCORE
# =========================================================

def calculate_reel_performance_score(
    analytics: ReelAnalytics,
) -> float:

    views = max(
        1,
        analytics.view_count,
    )

    completion_score = (
        analytics.average_completion
        / 100.0
    )

    replay_rate = (
        analytics.replay_count
        / views
    )

    save_rate = (
        analytics.save_count
        / views
    )

    share_rate = (
        analytics.share_count
        / views
    )

    download_rate = (
        analytics.download_count
        / views
    )

    interest_rate = (
        analytics.interested_count
        / views
    )

    negative_rate = (
        analytics.not_interested_count
        / views
    )

    rating_total = (
        analytics.one_star_count
        + analytics.two_star_count
        + analytics.three_star_count
    )

    if rating_total:
        rating_score = (
            (
                analytics.one_star_count * 1
            )
            + (
                analytics.two_star_count * 2
            )
            + (
                analytics.three_star_count * 3
            )
        ) / (
            rating_total * 3
        )
    else:
        rating_score = 0.0

    score = (
        completion_score * 0.30
        + replay_rate * 0.15
        + save_rate * 0.15
        + share_rate * 0.15
        + download_rate * 0.05
        + interest_rate * 0.10
        + rating_score * 0.10
        - negative_rate * 0.20
    )

    return round(
        max(0.0, score),
        6,
    )


# =========================================================
# REEL ANALYTICS SNAPSHOT
# =========================================================

def get_reel_analytics(
    db: Session,
    reel_id: int,
) -> Dict[str, Any]:

    reel = (
        db.query(Reel)
        .filter(
            Reel.id == reel_id
        )
        .first()
    )

    if reel is None:
        raise ValueError(
            "Reel not found"
        )

    analytics = get_or_create_reel_analytics(
        db,
        reel_id,
    )

    performance_score = (
        calculate_reel_performance_score(
            analytics
        )
    )

    return {
        "reel_id": reel_id,

        "views": analytics.view_count,
        "unique_viewers": analytics.unique_viewers,

        "total_watch_seconds": (
            analytics.total_watch_seconds
        ),

        "average_watch_seconds": (
            analytics.average_watch_seconds
        ),

        "average_completion": (
            analytics.average_completion
        ),

        "replays": analytics.replay_count,

        "one_star": (
            analytics.one_star_count
        ),

        "two_star": (
            analytics.two_star_count
        ),

        "three_star": (
            analytics.three_star_count
        ),

        "saves": analytics.save_count,
        "downloads": analytics.download_count,
        "shares": analytics.share_count,

        "interested": (
            analytics.interested_count
        ),

        "not_interested": (
            analytics.not_interested_count
        ),

        "comments": analytics.comment_count,

        "performance_score": (
            performance_score
        ),
    }


# =========================================================
# USER INTEREST SUMMARY
# =========================================================

def get_user_interest_summary(
    db: Session,
    user_id: int,
) -> Dict[str, Any]:

    interests = (
        db.query(UserReelInterest)
        .filter(
            UserReelInterest.user_id == user_id
        )
        .order_by(
            UserReelInterest.interest_score.desc()
        )
        .limit(100)
        .all()
    )

    return {
        "user_id": user_id,
        "categories": [
            {
                "category": item.category,
                "subcategory": item.subcategory,
                "interest_score": item.interest_score,
                "positive_score": item.positive_score,
                "negative_score": item.negative_score,
                "videos_seen": item.videos_seen,
                "videos_completed": item.videos_completed,
                "average_watch_percentage": (
                    item.average_watch_percentage
                ),
                "replays": item.total_replays,
                "saves": item.total_saves,
                "shares": item.total_shares,
                "downloads": item.total_downloads,
                "one_star": item.total_one_star,
                "two_star": item.total_two_star,
                "three_star": item.total_three_star,
            }
            for item in interests
        ],
    }


# =========================================================
# USER REEL HISTORY CHECK
# =========================================================

def has_user_seen_reel(
    db: Session,
    user_id: int,
    reel_id: int,
) -> bool:

    return (
        db.query(UserReelHistory.id)
        .filter(
            UserReelHistory.user_id == user_id,
            UserReelHistory.reel_id == reel_id,
        )
        .first()
        is not None
    )


# =========================================================
# RECENTLY SEEN REELS
# =========================================================

def get_recently_seen_reel_ids(
    db: Session,
    user_id: int,
    limit: int = 100,
) -> list[int]:

    limit = max(
        1,
        min(limit, 1000),
    )

    rows = (
        db.query(
            UserReelHistory.reel_id
        )
        .filter(
            UserReelHistory.user_id == user_id
        )
        .order_by(
            UserReelHistory.last_seen_at.desc()
        )
        .limit(limit)
        .all()
    )

    return [
        row[0]
        for row in rows
    ]


# =========================================================
# RECOMMENDATION SIGNALS
# =========================================================

def build_user_recommendation_signals(
    db: Session,
    user_id: int,
) -> Dict[str, Any]:

    profile = get_or_create_interest_profile(
        db,
        user_id,
    )

    interests = (
        db.query(UserReelInterest)
        .filter(
            UserReelInterest.user_id == user_id
        )
        .order_by(
            UserReelInterest.interest_score.desc()
        )
        .limit(20)
        .all()
    )

    seen_ids = get_recently_seen_reel_ids(
        db,
        user_id,
        limit=200,
    )

    return {
        "user_id": user_id,

        "total_reels_watched": (
            profile.total_reels_watched
        ),

        "total_watch_seconds": (
            profile.total_watch_seconds
        ),

        "average_completion": (
            profile.average_completion
        ),

        "top_categories": [
            {
                "category": item.category,
                "interest_score": item.interest_score,
            }
            for item in interests
        ],

        "recently_seen_reels": seen_ids,
    }


# =========================================================
# CREATOR PERFORMANCE
# =========================================================

def get_creator_reel_performance(
    db: Session,
    creator_id: int,
) -> Dict[str, Any]:

    reels = (
        db.query(Reel)
        .filter(
            Reel.user_id == creator_id
        )
        .all()
    )

    if not reels:
        return {
            "creator_id": creator_id,
            "reels": 0,
            "views": 0,
            "watch_seconds": 0,
            "average_completion": 0,
            "saves": 0,
            "shares": 0,
            "downloads": 0,
        }

    reel_ids = [
        reel.id
        for reel in reels
    ]

    analytics = (
        db.query(ReelAnalytics)
        .filter(
            ReelAnalytics.reel_id.in_(
                reel_ids
            )
        )
        .all()
    )

    views = sum(
        item.view_count
        for item in analytics
    )

    watch_seconds = sum(
        item.total_watch_seconds
        for item in analytics
    )

    saves = sum(
        item.save_count
        for item in analytics
    )

    shares = sum(
        item.share_count
        for item in analytics
    )

    downloads = sum(
        item.download_count
        for item in analytics
    )

    if analytics:
        average_completion = sum(
            item.average_completion
            for item in analytics
        ) / len(analytics)
    else:
        average_completion = 0

    return {
        "creator_id": creator_id,
        "reels": len(reels),
        "views": views,
        "watch_seconds": watch_seconds,
        "average_completion": (
            average_completion
        ),
        "saves": saves,
        "shares": shares,
        "downloads": downloads,
    }


# =========================================================
# TRANSACTION SAFE FLUSH
# =========================================================

def flush_analytics(
    db: Session,
) -> None:
    """
    Useful when API route wants to continue using
    the same transaction.
    """

    db.flush()


# =========================================================
# TRANSACTION SAFE ROLLBACK
# =========================================================

def rollback_analytics(
    db: Session,
) -> None:

    db.rollback()
