# backend/services/reel_recommendation.py

"""
USANEX - REEL RECOMMENDATION ENGINE

Production-style personalized recommendation service.

Signals used:
    - Watch time
    - Completion percentage
    - Replay
    - 1 / 2 / 3 star rating
    - Save
    - Download
    - Share
    - Interested
    - Not interested
    - Category preference
    - Subcategory preference
    - Creator preference
    - Language preference
    - Reel popularity
    - Reel freshness
    - Exploration
    - Watch history
    - Creator diversity

Architecture:

    User behaviour
          ↓
    Interest profile
          ↓
    Candidate generation
          ↓
    Feature scoring
          ↓
    Ranking
          ↓
    Diversity / exploration
          ↓
    Final reels
"""

from __future__ import annotations

import json
import math
import random
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from ..database.models import (
    Reel,
    ReelAIFeature,
    ReelAnalytics,
    ReelRecommendationLog,
    UserReelHistory,
    UserReelInterest,
)


# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_REEL_LIMIT = 10

MAX_CANDIDATES = 250

HISTORY_LOOKBACK_DAYS = 90

FRESHNESS_HALF_LIFE_HOURS = 72.0

MIN_EXPLORATION_RATIO = 0.10

MAX_SAME_CREATOR_IN_BATCH = 2

PROFILE_WEIGHT = 0.34
CONTENT_WEIGHT = 0.22
BEHAVIOUR_WEIGHT = 0.18
POPULARITY_WEIGHT = 0.10
FRESHNESS_WEIGHT = 0.07
EXPLORATION_WEIGHT = 0.09


# ============================================================
# SAFE HELPERS
# ============================================================

def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default

        number = float(value)

        if not math.isfinite(number):
            return default

        return number

    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default

        return int(value)

    except (TypeError, ValueError):
        return default


def _clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 1.0,
) -> float:
    return max(minimum, min(maximum, value))


def _normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""

    return value.strip().lower()


def _parse_json_dict(value: Optional[str]) -> Dict[str, float]:
    """
    Safely parse serialized score dictionaries.

    Example:
        '{"comedy": 8.2, "education": 4.5}'
    """

    if not value:
        return {}

    try:
        data = json.loads(value)

        if not isinstance(data, dict):
            return {}

        result: Dict[str, float] = {}

        for key, score in data.items():
            if key is None:
                continue

            result[str(key).lower()] = _safe_float(score)

        return result

    except (TypeError, ValueError, json.JSONDecodeError):
        return {}


def _parse_json_list(value: Optional[str]) -> List[str]:
    """
    Parse AI keyword/topic lists.

    Supports:
        ["football", "sports"]

    and also simple comma-separated text.
    """

    if not value:
        return []

    try:
        data = json.loads(value)

        if isinstance(data, list):
            return [
                str(item).strip().lower()
                for item in data
                if str(item).strip()
            ]

    except (TypeError, ValueError, json.JSONDecodeError):
        pass

    return [
        item.strip().lower()
        for item in value.split(",")
        if item.strip()
    ]


def _tokenize(value: Optional[str]) -> Set[str]:
    if not value:
        return set()

    separators = [
        ",",
        "|",
        "/",
        "#",
        ".",
        ":",
        ";",
        "\n",
        "\t",
    ]

    text = value.lower()

    for separator in separators:
        text = text.replace(separator, " ")

    return {
        token.strip()
        for token in text.split()
        if len(token.strip()) >= 2
    }


def _now() -> datetime:
    return datetime.utcnow()


# ============================================================
# RECOMMENDATION ENGINE
# ============================================================

class ReelRecommendationEngine:
    """
    Personalized reel recommendation engine.

    This class does NOT modify the database schema.

    It only reads the existing models and creates
    ReelRecommendationLog records.
    """

    def __init__(self, db: Session):
        self.db = db

    # ========================================================
    # PUBLIC API
    # ========================================================

    def get_recommendations(
        self,
        user_id: int,
        limit: int = DEFAULT_REEL_LIMIT,
        session_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Main recommendation function.

        Returns ranked personalized reels.
        """

        limit = max(1, min(int(limit), 50))

        history = self._load_history(user_id)

        profile = self._load_interest_profile(user_id)

        candidates = self._generate_candidates(
            user_id=user_id,
            profile=profile,
            history=history,
            limit=MAX_CANDIDATES,
        )

        if not candidates:
            return []

        scored = []

        for reel, ai_feature, analytics in candidates:
            score_data = self._score_reel(
                user_id=user_id,
                reel=reel,
                ai_feature=ai_feature,
                analytics=analytics,
                profile=profile,
                history=history,
            )

            scored.append(
                (
                    reel,
                    ai_feature,
                    analytics,
                    score_data,
                )
            )

        scored.sort(
            key=lambda item: item[3]["final_score"],
            reverse=True,
        )

        selected = self._apply_diversity(
            scored=scored,
            limit=limit,
        )

        results = []

        for position, item in enumerate(selected, start=1):
            reel, ai_feature, analytics, score_data = item

            self._create_recommendation_log(
                user_id=user_id,
                reel_id=reel.id,
                position=position,
                score_data=score_data,
                session_id=session_id,
            )

            results.append(
                self._serialize_recommendation(
                    reel=reel,
                    ai_feature=ai_feature,
                    analytics=analytics,
                    score_data=score_data,
                )
            )

        self.db.commit()

        return results

    # ========================================================
    # LOAD USER HISTORY
    # ========================================================

    def _load_history(
        self,
        user_id: int,
    ) -> Dict[str, Any]:

        cutoff = _now() - timedelta(
            days=HISTORY_LOOKBACK_DAYS
        )

        rows = (
            self.db.query(UserReelHistory)
            .filter(
                UserReelHistory.user_id == user_id,
                UserReelHistory.last_seen_at >= cutoff,
            )
            .all()
        )

        seen_reels: Set[int] = set()

        reel_watch_time: Dict[int, float] = {}

        reel_completion: Dict[int, float] = {}

        reel_replays: Dict[int, int] = {}

        for row in rows:
            seen_reels.add(row.reel_id)

            reel_watch_time[row.reel_id] = _safe_float(
                row.total_watch_time
            )

            reel_completion[row.reel_id] = _safe_float(
                row.max_watch_percentage
            )

            reel_replays[row.reel_id] = _safe_int(
                row.replay_count
            )

        return {
            "seen_reels": seen_reels,
            "watch_time": reel_watch_time,
            "completion": reel_completion,
            "replays": reel_replays,
        }

    # ========================================================
    # LOAD USER INTEREST PROFILE
    # ========================================================

    def _load_interest_profile(
        self,
        user_id: int,
    ) -> Dict[str, Any]:

        interests = (
            self.db.query(UserReelInterest)
            .filter(
                UserReelInterest.user_id == user_id
            )
            .all()
        )

        category_scores: Dict[str, float] = defaultdict(float)

        subcategory_scores: Dict[str, float] = defaultdict(float)

        for interest in interests:

            category = _normalize_text(
                interest.category
            )

            if not category:
                continue

            score = _safe_float(
                interest.interest_score
            )

            category_scores[category] += score

            subcategory = _normalize_text(
                interest.subcategory
            )

            if subcategory:
                subcategory_scores[subcategory] += score

        total_seen = 0

        total_watch = 0.0

        if interests:
            total_seen = max(
                _safe_int(i.videos_seen)
                for i in interests
            )

            total_watch = sum(
                _safe_float(i.total_watch_time)
                for i in interests
            )

        return {
            "category_scores": dict(category_scores),
            "subcategory_scores": dict(subcategory_scores),
            "total_seen": total_seen,
            "total_watch_time": total_watch,
            "cold_start": total_seen < 10,
        }

    # ========================================================
    # CANDIDATE GENERATION
    # ========================================================

    def _generate_candidates(
        self,
        user_id: int,
        profile: Dict[str, Any],
        history: Dict[str, Any],
        limit: int,
    ):

        query = (
            self.db.query(
                Reel,
                ReelAIFeature,
                ReelAnalytics,
            )
            .outerjoin(
                ReelAIFeature,
                ReelAIFeature.reel_id == Reel.id,
            )
            .outerjoin(
                ReelAnalytics,
                ReelAnalytics.reel_id == Reel.id,
            )
            .filter(
                Reel.user_id != user_id,
                Reel.visibility == "public",
            )
        )

        seen_reels = history["seen_reels"]

        if seen_reels:
            query = query.filter(
                ~Reel.id.in_(seen_reels)
            )

        query = query.order_by(
            Reel.created_at.desc()
        )

        rows = query.limit(limit).all()

        if rows:
            return rows

        # ----------------------------------------------------
        # Fallback:
        # If user has already seen everything available,
        # allow previously seen reels.
        # ----------------------------------------------------

        fallback = (
            self.db.query(
                Reel,
                ReelAIFeature,
                ReelAnalytics,
            )
            .outerjoin(
                ReelAIFeature,
                ReelAIFeature.reel_id == Reel.id,
            )
            .outerjoin(
                ReelAnalytics,
                ReelAnalytics.reel_id == Reel.id,
            )
            .filter(
                Reel.user_id != user_id,
                Reel.visibility == "public",
            )
            .order_by(
                Reel.created_at.desc()
            )
            .limit(limit)
            .all()
        )

        return fallback

    # ========================================================
    # SCORE ONE REEL
    # ========================================================

    def _score_reel(
        self,
        user_id: int,
        reel: Reel,
        ai_feature: Optional[ReelAIFeature],
        analytics: Optional[ReelAnalytics],
        profile: Dict[str, Any],
        history: Dict[str, Any],
    ) -> Dict[str, float]:

        profile_score = self._profile_score(
            reel=reel,
            ai_feature=ai_feature,
            profile=profile,
        )

        content_score = self._content_score(
            reel=reel,
            ai_feature=ai_feature,
            profile=profile,
        )

        behaviour_score = self._behaviour_score(
            analytics=analytics,
        )

        popularity_score = self._popularity_score(
            analytics=analytics,
        )

        freshness_score = self._freshness_score(
            reel.created_at
        )

        exploration_score = self._exploration_score(
            reel=reel,
            profile=profile,
        )

        final_score = (
            PROFILE_WEIGHT * profile_score
            + CONTENT_WEIGHT * content_score
            + BEHAVIOUR_WEIGHT * behaviour_score
            + POPULARITY_WEIGHT * popularity_score
            + FRESHNESS_WEIGHT * freshness_score
            + EXPLORATION_WEIGHT * exploration_score
        )

        return {
            "final_score": _clamp(
                final_score,
                0.0,
                1.0,
            ),
            "profile_score": _clamp(profile_score),
            "content_score": _clamp(content_score),
            "behaviour_score": _clamp(behaviour_score),
            "popularity_score": _clamp(popularity_score),
            "freshness_score": _clamp(freshness_score),
            "exploration_score": _clamp(exploration_score),
        }

    # ========================================================
    # PROFILE SCORE
    # ========================================================

    def _profile_score(
        self,
        reel: Reel,
        ai_feature: Optional[ReelAIFeature],
        profile: Dict[str, Any],
    ) -> float:

        category_scores = profile["category_scores"]

        category = _normalize_text(
            reel.category
        )

        if ai_feature:
            ai_category = _normalize_text(
                ai_feature.category
            )

            if ai_category:
                category = ai_category

        if not category:
            return 0.25

        score = category_scores.get(
            category,
            0.0,
        )

        if not category_scores:
            return 0.35

        maximum = max(
            category_scores.values()
        )

        if maximum <= 0:
            return 0.25

        return _clamp(
            score / maximum
        )

    # ========================================================
    # CONTENT MATCH
    # ========================================================

    def _content_score(
        self,
        reel: Reel,
        ai_feature: Optional[ReelAIFeature],
        profile: Dict[str, Any],
    ) -> float:

        user_categories = set(
            profile["category_scores"].keys()
        )

        user_subcategories = set(
            profile["subcategory_scores"].keys()
        )

        reel_categories: Set[str] = set()

        reel_subcategories: Set[str] = set()

        if reel.category:
            reel_categories.add(
                _normalize_text(reel.category)
            )

        if ai_feature:

            if ai_feature.category:
                reel_categories.add(
                    _normalize_text(
                        ai_feature.category
                    )
                )

            if ai_feature.subcategory:
                reel_subcategories.add(
                    _normalize_text(
                        ai_feature.subcategory
                    )
                )

            for keyword in _parse_json_list(
                ai_feature.keywords
            ):
                reel_subcategories.add(
                    keyword
                )

        category_match = (
            len(
                reel_categories
                & user_categories
            )
            > 0
        )

        subcategory_match = (
            len(
                reel_subcategories
                & user_subcategories
            )
            > 0
        )

        if category_match and subcategory_match:
            return 1.0

        if category_match:
            return 0.75

        if subcategory_match:
            return 0.85

        return 0.20

    # ========================================================
    # BEHAVIOUR SCORE
    # ========================================================

    def _behaviour_score(
        self,
        analytics: Optional[ReelAnalytics],
    ) -> float:

        if not analytics:
            return 0.20

        completion = _clamp(
            _safe_float(
                analytics.average_completion
            ) / 100.0
        )

        average_watch = _safe_float(
            analytics.average_watch_seconds
        )

        replay = _safe_int(
            analytics.replay_count
        )

        save = _safe_int(
            analytics.save_count
        )

        share = _safe_int(
            analytics.share_count
        )

        three_star = _safe_int(
            analytics.three_star_count
        )

        two_star = _safe_int(
            analytics.two_star_count
        )

        one_star = _safe_int(
            analytics.one_star_count
        )

        total_stars = (
            one_star
            + two_star
            + three_star
        )

        rating_score = 0.0

        if total_stars > 0:

            rating_score = (
                one_star * 0.20
                + two_star * 0.60
                + three_star * 1.00
            ) / total_stars

        engagement = (
            min(math.log1p(average_watch) / 5.0, 1.0)
            * 0.25
            + min(math.log1p(replay) / 4.0, 1.0)
            * 0.15
            + min(math.log1p(save) / 5.0, 1.0)
            * 0.20
            + min(math.log1p(share) / 5.0, 1.0)
            * 0.15
            + completion * 0.15
            + rating_score * 0.10
        )

        return _clamp(
            engagement
        )

    # ========================================================
    # POPULARITY
    # ========================================================

    def _popularity_score(
        self,
        analytics: Optional[ReelAnalytics],
    ) -> float:

        if not analytics:
            return 0.20

        views = max(
            _safe_int(
                analytics.view_count
            ),
            0,
        )

        saves = max(
            _safe_int(
                analytics.save_count
            ),
            0,
        )

        shares = max(
            _safe_int(
                analytics.share_count
            ),
            0,
        )

        comments = max(
            _safe_int(
                analytics.comment_count
            ),
            0,
        )

        weighted = (
            math.log1p(views) * 0.45
            + math.log1p(saves) * 0.20
            + math.log1p(shares) * 0.25
            + math.log1p(comments) * 0.10
        )

        return _clamp(
            weighted / 10.0
        )

    # ========================================================
    # FRESHNESS
    # ========================================================

    def _freshness_score(
        self,
        created_at: Optional[datetime],
    ) -> float:

        if not created_at:
            return 0.20

        age_hours = max(
            (
                _now() - created_at
            ).total_seconds()
            / 3600.0,
            0.0,
        )

        return _clamp(
            math.exp(
                -age_hours
                / FRESHNESS_HALF_LIFE_HOURS
            )
        )

    # ========================================================
    # EXPLORATION
    # ========================================================

    def _exploration_score(
        self,
        reel: Reel,
        profile: Dict[str, Any],
    ) -> float:

        category = _normalize_text(
            reel.category
        )

        known_categories = set(
            profile["category_scores"].keys()
        )

        # New category gets exploration value.
        if category and category not in known_categories:
            return 1.0

        # Cold-start users need more exploration.
        if profile["cold_start"]:
            return 0.85

        return random.uniform(
            0.10,
            0.45,
        )

    # ========================================================
    # DIVERSITY / RANKING
    # ========================================================

    def _apply_diversity(
        self,
        scored: Sequence[
            Tuple[
                Reel,
                Optional[ReelAIFeature],
                Optional[ReelAnalytics],
                Dict[str, float],
            ]
        ],
        limit: int,
    ):

        selected = []

        creator_counts: Dict[int, int] = defaultdict(int)

        category_counts: Dict[str, int] = defaultdict(int)

        remaining = list(scored)

        while remaining and len(selected) < limit:

            best_index = None

            best_adjusted_score = -1.0

            for index, item in enumerate(remaining):

                reel = item[0]

                score_data = item[3]

                base_score = score_data[
                    "final_score"
                ]

                creator_penalty = 0.0

                if (
                    creator_counts[reel.user_id]
                    >= MAX_SAME_CREATOR_IN_BATCH
                ):
                    creator_penalty = 0.35

                category = _normalize_text(
                    reel.category
                )

                category_penalty = 0.0

                if (
                    category
                    and category_counts[category] >= 3
                ):
                    category_penalty = 0.12

                adjusted = (
                    base_score
                    - creator_penalty
                    - category_penalty
                )

                if adjusted > best_adjusted_score:
                    best_adjusted_score = adjusted
                    best_index = index

            if best_index is None:
                break

            item = remaining.pop(
                best_index
            )

            reel = item[0]

            selected.append(item)

            creator_counts[
                reel.user_id
            ] += 1

            category = _normalize_text(
                reel.category
            )

            if category:
                category_counts[
                    category
                ] += 1

        return selected

    # ========================================================
    # RECOMMENDATION LOG
    # ========================================================

    def _create_recommendation_log(
        self,
        user_id: int,
        reel_id: int,
        position: int,
        score_data: Dict[str, float],
        session_id: Optional[str],
    ):

        reason = self._build_reason(
            score_data
        )

        log = ReelRecommendationLog(
            user_id=user_id,
            reel_id=reel_id,
            position=position,
            recommendation_score=score_data[
                "final_score"
            ],
            interest_score=score_data[
                "profile_score"
            ],
            content_score=score_data[
                "content_score"
            ],
            popularity_score=score_data[
                "popularity_score"
            ],
            freshness_score=score_data[
                "freshness_score"
            ],
            exploration_score=score_data[
                "exploration_score"
            ],
            reason=reason,
            created_at=_now(),
        )

        # session_id is intentionally not written here
        # because the current model does not contain it.

        self.db.add(log)

    # ========================================================
    # REASON
    # ========================================================

    def _build_reason(
        self,
        score_data: Dict[str, float],
    ) -> str:

        profile = score_data["profile_score"]

        content = score_data["content_score"]

        popularity = score_data[
            "popularity_score"
        ]

        freshness = score_data[
            "freshness_score"
        ]

        if profile >= 0.80:
            return "strong_interest_match"

        if content >= 0.80:
            return "content_match"

        if freshness >= 0.80:
            return "fresh_content"

        if popularity >= 0.75:
            return "popular_content"

        if score_data[
            "exploration_score"
        ] >= 0.75:
            return "exploration"

        return "personalized_rank"

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def _serialize_recommendation(
        self,
        reel: Reel,
        ai_feature: Optional[ReelAIFeature],
        analytics: Optional[ReelAnalytics],
        score_data: Dict[str, float],
    ) -> Dict[str, Any]:

        return {
            "id": reel.id,
            "user_id": reel.user_id,
            "video_url": reel.video_url,
            "thumbnail_url": reel.thumbnail_url,
            "duration": _safe_float(
                reel.duration
            ),
            "caption": reel.caption,
            "hashtags": reel.hashtags,
            "language": reel.language,
            "category": reel.category,
            "visibility": reel.visibility,

            "ai": {
                "category": (
                    ai_feature.category
                    if ai_feature
                    else None
                ),
                "subcategory": (
                    ai_feature.subcategory
                    if ai_feature
                    else None
                ),
                "confidence": (
                    _safe_float(
                        ai_feature.ai_confidence
                    )
                    if ai_feature
                    else None
                ),
            },

            "analytics": {
                "views": (
                    _safe_int(
                        analytics.view_count
                    )
                    if analytics
                    else 0
                ),
                "average_completion": (
                    _safe_float(
                        analytics.average_completion
                    )
                    if analytics
                    else 0
                ),
                "three_star": (
                    _safe_int(
                        analytics.three_star_count
                    )
                    if analytics
                    else 0
                ),
                "save_count": (
                    _safe_int(
                        analytics.save_count
                    )
                    if analytics
                    else 0
                ),
                "share_count": (
                    _safe_int(
                        analytics.share_count
                    )
                    if analytics
                    else 0
                ),
            },

            "recommendation": {
                "score": score_data[
                    "final_score"
                ],
                "reason": self._build_reason(
                    score_data
                ),
            },
        }


# ============================================================
# SIMPLE SERVICE FUNCTION
# ============================================================

def get_personalized_reels(
    db: Session,
    user_id: int,
    limit: int = 10,
    session_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Convenient function for API routes.

    Example:

        reels = get_personalized_reels(
            db=db,
            user_id=current_user.id,
            limit=10,
            session_id=session_id,
        )
    """

    engine = ReelRecommendationEngine(
        db=db
    )

    return engine.get_recommendations(
        user_id=user_id,
        limit=limit,
        session_id=session_id,
    )
