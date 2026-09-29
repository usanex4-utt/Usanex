"""
USANEX REELS
Personalized Recommendation Engine

Features:
- User interest matching
- AI content matching
- Watch-history filtering
- Watch-time signals
- Completion signals
- Replay signals
- 1/2/3-star signals
- Save/download/share signals
- Popularity
- Freshness
- Exploration
- Creator diversity
- Category diversity
- Cold-start recommendation
- Recommendation logging

This service does NOT modify database models.
"""

from __future__ import annotations

import json
import math
import random
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session

from ..database.models import (
    Reel,
    ReelAIFeature,
    ReelAnalytics,
    ReelRecommendationLog,
    UserReelHistory,
    UserReelInterest,
)


# =========================================================
# CONFIGURATION
# =========================================================

DEFAULT_LIMIT = 10
MAX_LIMIT = 50

MAX_CANDIDATES = 300

HISTORY_DAYS = 90

FRESHNESS_HALF_LIFE_HOURS = 72.0

MAX_SAME_CREATOR = 2
MAX_SAME_CATEGORY = 3

# Main ranking weights
PROFILE_WEIGHT = 0.30
CONTENT_WEIGHT = 0.23
BEHAVIOR_WEIGHT = 0.20
POPULARITY_WEIGHT = 0.09
FRESHNESS_WEIGHT = 0.08
EXPLORATION_WEIGHT = 0.10


# =========================================================
# BASIC HELPERS
# =========================================================

def now_utc() -> datetime:
    return datetime.utcnow()


def safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        if value is None:
            return default

        result = float(value)

        if not math.isfinite(result):
            return default

        return result

    except (TypeError, ValueError):
        return default


def safe_int(
    value: Any,
    default: int = 0,
) -> int:
    try:
        if value is None:
            return default

        return int(value)

    except (TypeError, ValueError):
        return default


def clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 1.0,
) -> float:
    return max(
        minimum,
        min(maximum, value),
    )


def normalize(
    value: Optional[str],
) -> str:
    if not value:
        return ""

    return str(value).strip().lower()


def parse_json_list(
    value: Optional[str],
) -> List[str]:

    if not value:
        return []

    try:
        data = json.loads(value)

        if isinstance(data, list):
            return [
                normalize(item)
                for item in data
                if normalize(item)
            ]

    except Exception:
        pass

    return [
        normalize(item)
        for item in value.split(",")
        if normalize(item)
    ]


# =========================================================
# RECOMMENDATION ENGINE
# =========================================================

class ReelRecommendationEngine:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    # =====================================================
    # PUBLIC METHOD
    # =====================================================

    def recommend(
        self,
        user_id: int,
        limit: int = DEFAULT_LIMIT,
        session_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:

        limit = max(
            1,
            min(
                safe_int(limit, DEFAULT_LIMIT),
                MAX_LIMIT,
            ),
        )

        # -------------------------------------------------
        # 1. Load user history
        # -------------------------------------------------

        history = self.load_history(
            user_id=user_id,
        )

        # -------------------------------------------------
        # 2. Load interest profile
        # -------------------------------------------------

        profile = self.load_interest_profile(
            user_id=user_id,
        )

        # -------------------------------------------------
        # 3. Generate candidates
        # -------------------------------------------------

        candidates = self.generate_candidates(
            user_id=user_id,
            history=history,
            profile=profile,
        )

        if not candidates:
            return []

        # -------------------------------------------------
        # 4. Score every candidate
        # -------------------------------------------------

        scored = []

        for reel, ai, analytics in candidates:

            score = self.calculate_score(
                reel=reel,
                ai=ai,
                analytics=analytics,
                profile=profile,
            )

            scored.append(
                (
                    reel,
                    ai,
                    analytics,
                    score,
                )
            )

        # -------------------------------------------------
        # 5. Sort by recommendation score
        # -------------------------------------------------

        scored.sort(
            key=lambda item: item[3]["final_score"],
            reverse=True,
        )

        # -------------------------------------------------
        # 6. Apply diversity
        # -------------------------------------------------

        selected = self.apply_diversity(
            scored=scored,
            limit=limit,
        )

        # -------------------------------------------------
        # 7. Save recommendation logs
        # -------------------------------------------------

        result = []

        for position, item in enumerate(
            selected,
            start=1,
        ):

            reel, ai, analytics, score = item

            self.save_recommendation_log(
                user_id=user_id,
                reel_id=reel.id,
                position=position,
                score=score,
            )

            result.append(
                self.serialize_reel(
                    reel=reel,
                    ai=ai,
                    analytics=analytics,
                    score=score,
                )
            )

        self.db.commit()

        return result

    # =====================================================
    # USER HISTORY
    # =====================================================

    def load_history(
        self,
        user_id: int,
    ) -> Dict[str, Any]:

        cutoff = (
            now_utc()
            - timedelta(
                days=HISTORY_DAYS
            )
        )

        rows = (
            self.db.query(
                UserReelHistory
            )
            .filter(
                UserReelHistory.user_id == user_id,
                UserReelHistory.last_seen_at >= cutoff,
            )
            .all()
        )

        seen_reels: Set[int] = set()

        watch_time = {}

        completion = {}

        replay = {}

        for row in rows:

            reel_id = row.reel_id

            seen_reels.add(
                reel_id
            )

            watch_time[reel_id] = safe_float(
                row.total_watch_time
            )

            completion[reel_id] = safe_float(
                row.max_watch_percentage
            )

            replay[reel_id] = safe_int(
                row.replay_count
            )

        return {
            "seen": seen_reels,
            "watch_time": watch_time,
            "completion": completion,
            "replay": replay,
        }

    # =====================================================
    # USER INTEREST PROFILE
    # =====================================================

    def load_interest_profile(
        self,
        user_id: int,
    ) -> Dict[str, Any]:

        rows = (
            self.db.query(
                UserReelInterest
            )
            .filter(
                UserReelInterest.user_id == user_id
            )
            .all()
        )

        categories = defaultdict(float)

        subcategories = defaultdict(float)

        total_videos = 0

        total_watch = 0.0

        for row in rows:

            category = normalize(
                row.category
            )

            score = safe_float(
                row.interest_score
            )

            if category:
                categories[
                    category
                ] += score

            subcategory = normalize(
                row.subcategory
            )

            if subcategory:
                subcategories[
                    subcategory
                ] += score

            total_videos += safe_int(
                row.videos_seen
            )

            total_watch += safe_float(
                row.total_watch_time
            )

        return {
            "categories": dict(categories),
            "subcategories": dict(subcategories),
            "total_videos": total_videos,
            "total_watch": total_watch,

            # First 10 videos = cold start
            "cold_start": total_videos < 10,
        }

    # =====================================================
    # CANDIDATE GENERATION
    # =====================================================

    def generate_candidates(
        self,
        user_id: int,
        history: Dict[str, Any],
        profile: Dict[str, Any],
    ):

        query = (
            self.db.query(
                Reel,
                ReelAIFeature,
                ReelAnalytics,
            )
            .outerjoin(
                ReelAIFeature,
                ReelAIFeature.reel_id
                == Reel.id,
            )
            .outerjoin(
                ReelAnalytics,
                ReelAnalytics.reel_id
                == Reel.id,
            )
            .filter(
                Reel.user_id != user_id,
                Reel.visibility == "public",
            )
        )

        seen = history["seen"]

        # -------------------------------------------------
        # Don't repeatedly recommend watched reels
        # -------------------------------------------------

        if seen:

            query = query.filter(
                ~Reel.id.in_(seen)
            )

        # -------------------------------------------------
        # Recent content first
        # -------------------------------------------------

        query = query.order_by(
            Reel.created_at.desc()
        )

        rows = query.limit(
            MAX_CANDIDATES
        ).all()

        # -------------------------------------------------
        # If no unseen content remains,
        # use all available reels.
        # -------------------------------------------------

        if rows:
            return rows

        fallback = (
            self.db.query(
                Reel,
                ReelAIFeature,
                ReelAnalytics,
            )
            .outerjoin(
                ReelAIFeature,
                ReelAIFeature.reel_id
                == Reel.id,
            )
            .outerjoin(
                ReelAnalytics,
                ReelAnalytics.reel_id
                == Reel.id,
            )
            .filter(
                Reel.user_id != user_id,
                Reel.visibility == "public",
            )
            .order_by(
                Reel.created_at.desc()
            )
            .limit(
                MAX_CANDIDATES
            )
            .all()
        )

        return fallback

    # =====================================================
    # MASTER SCORE
    # =====================================================

    def calculate_score(
        self,
        reel: Reel,
        ai: Optional[ReelAIFeature],
        analytics: Optional[ReelAnalytics],
        profile: Dict[str, Any],
    ) -> Dict[str, float]:

        profile_score = self.profile_match(
            reel=reel,
            ai=ai,
            profile=profile,
        )

        content_score = self.content_match(
            reel=reel,
            ai=ai,
            profile=profile,
        )

        behavior_score = self.behavior_score(
            analytics=analytics,
        )

        popularity_score = self.popularity_score(
            analytics=analytics,
        )

        freshness_score = self.freshness_score(
            reel.created_at
        )

        exploration_score = self.exploration_score(
            reel=reel,
            profile=profile,
        )

        final_score = (
            profile_score
            * PROFILE_WEIGHT

            + content_score
            * CONTENT_WEIGHT

            + behavior_score
            * BEHAVIOR_WEIGHT

            + popularity_score
            * POPULARITY_WEIGHT

            + freshness_score
            * FRESHNESS_WEIGHT

            + exploration_score
            * EXPLORATION_WEIGHT
        )

        return {
            "final_score": clamp(
                final_score
            ),

            "profile_score": clamp(
                profile_score
            ),

            "content_score": clamp(
                content_score
            ),

            "behavior_score": clamp(
                behavior_score
            ),

            "popularity_score": clamp(
                popularity_score
            ),

            "freshness_score": clamp(
                freshness_score
            ),

            "exploration_score": clamp(
                exploration_score
            ),
        }

    # =====================================================
    # PROFILE MATCH
    # =====================================================

    def profile_match(
        self,
        reel: Reel,
        ai: Optional[ReelAIFeature],
        profile: Dict[str, Any],
    ) -> float:

        category_scores = profile[
            "categories"
        ]

        subcategory_scores = profile[
            "subcategories"
        ]

        if not category_scores:
            return 0.35

        category = normalize(
            reel.category
        )

        if ai and ai.category:

            category = normalize(
                ai.category
            )

        category_score = category_scores.get(
            category,
            0.0,
        )

        maximum = max(
            category_scores.values(),
            default=1.0,
        )

        category_match = (
            category_score / maximum
            if maximum > 0
            else 0.0
        )

        sub_score = 0.0

        if ai and ai.subcategory:

            subcategory = normalize(
                ai.subcategory
            )

            sub_score = subcategory_scores.get(
                subcategory,
                0.0,
            )

        max_sub = max(
            subcategory_scores.values(),
            default=1.0,
        )

        if max_sub > 0:
            sub_score /= max_sub

        return clamp(
            category_match * 0.70
            + sub_score * 0.30
        )

    # =====================================================
    # AI CONTENT MATCH
    # =====================================================

    def content_match(
        self,
        reel: Reel,
        ai: Optional[ReelAIFeature],
        profile: Dict[str, Any],
    ) -> float:

        user_categories = set(
            profile[
                "categories"
            ].keys()
        )

        user_subcategories = set(
            profile[
                "subcategories"
            ].keys()
        )

        reel_categories = set()

        reel_topics = set()

        if reel.category:

            reel_categories.add(
                normalize(
                    reel.category
                )
            )

        if ai:

            if ai.category:
                reel_categories.add(
                    normalize(
                        ai.category
                    )
                )

            if ai.subcategory:
                reel_topics.add(
                    normalize(
                        ai.subcategory
                    )
                )

            for keyword in parse_json_list(
                ai.keywords
            ):

                reel_topics.add(
                    keyword
                )

        category_match = bool(
            reel_categories
            & user_categories
        )

        topic_match = bool(
            reel_topics
            & user_subcategories
        )

        if category_match and topic_match:
            return 1.0

        if category_match:
            return 0.75

        if topic_match:
            return 0.85

        # AI analyzed but no direct match
        if ai:
            return 0.30

        return 0.20

    # =====================================================
    # BEHAVIOR SCORE
    # =====================================================

    def behavior_score(
        self,
        analytics: Optional[ReelAnalytics],
    ) -> float:

        if not analytics:
            return 0.20

        completion = clamp(
            safe_float(
                analytics.average_completion
            )
            / 100.0
        )

        watch_time = safe_float(
            analytics.average_watch_seconds
        )

        replays = safe_int(
            analytics.replay_count
        )

        saves = safe_int(
            analytics.save_count
        )

        shares = safe_int(
            analytics.share_count
        )

        three = safe_int(
            analytics.three_star_count
        )

        two = safe_int(
            analytics.two_star_count
        )

        one = safe_int(
            analytics.one_star_count
        )

        total_rating = (
            one
            + two
            + three
        )

        rating_score = 0.0

        if total_rating:

            rating_score = (
                one * 0.20
                + two * 0.60
                + three * 1.00
            ) / total_rating

        watch_score = min(
            math.log1p(
                watch_time
            ) / 5.0,
            1.0,
        )

        replay_score = min(
            math.log1p(
                replays
            ) / 4.0,
            1.0,
        )

        save_score = min(
            math.log1p(
                saves
            ) / 5.0,
            1.0,
        )

        share_score = min(
            math.log1p(
                shares
            ) / 5.0,
            1.0,
        )

        result = (
            completion * 0.30
            + watch_score * 0.20
            + replay_score * 0.15
            + save_score * 0.15
            + share_score * 0.10
            + rating_score * 0.10
        )

        return clamp(
            result
        )

    # =====================================================
    # POPULARITY
    # =====================================================

    def popularity_score(
        self,
        analytics: Optional[ReelAnalytics],
    ) -> float:

        if not analytics:
            return 0.20

        views = max(
            safe_int(
                analytics.view_count
            ),
            0,
        )

        saves = max(
            safe_int(
                analytics.save_count
            ),
            0,
        )

        shares = max(
            safe_int(
                analytics.share_count
            ),
            0,
        )

        comments = max(
            safe_int(
                analytics.comment_count
            ),
            0,
        )

        raw = (
            math.log1p(views) * 0.45
            + math.log1p(saves) * 0.20
            + math.log1p(shares) * 0.25
            + math.log1p(comments) * 0.10
        )

        return clamp(
            raw / 10.0
        )

    # =====================================================
    # FRESHNESS
    # =====================================================

    def freshness_score(
        self,
        created_at: Optional[datetime],
    ) -> float:

        if not created_at:
            return 0.20

        age_hours = max(
            (
                now_utc()
                - created_at
            ).total_seconds()
            / 3600.0,
            0.0,
        )

        return clamp(
            math.exp(
                -age_hours
                / FRESHNESS_HALF_LIFE_HOURS
            )
        )

    # =====================================================
    # EXPLORATION
    # =====================================================

    def exploration_score(
        self,
        reel: Reel,
        profile: Dict[str, Any],
    ) -> float:

        category = normalize(
            reel.category
        )

        known = set(
            profile[
                "categories"
            ].keys()
        )

        # New category
        if (
            category
            and category not in known
        ):
            return 1.0

        # New users need exploration
        if profile["cold_start"]:
            return 0.90

        # Small random exploration
        return random.uniform(
            0.05,
            0.40,
        )

    # =====================================================
    # DIVERSITY
    # =====================================================

    def apply_diversity(
        self,
        scored: List[
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

        creator_count = defaultdict(int)

        category_count = defaultdict(int)

        remaining = list(
            scored
        )

        while (
            remaining
            and len(selected) < limit
        ):

            best_index = -1

            best_score = -999999.0

            for index, item in enumerate(
                remaining
            ):

                reel = item[0]

                score = item[3][
                    "final_score"
                ]

                creator_penalty = 0.0

                category_penalty = 0.0

                # -----------------------------------------
                # Creator diversity
                # -----------------------------------------

                if (
                    creator_count[
                        reel.user_id
                    ]
                    >= MAX_SAME_CREATOR
                ):

                    creator_penalty = 0.35

                # -----------------------------------------
                # Category diversity
                # -----------------------------------------

                category = normalize(
                    reel.category
                )

                if (
                    category
                    and category_count[
                        category
                    ]
                    >= MAX_SAME_CATEGORY
                ):

                    category_penalty = 0.12

                adjusted = (
                    score
                    - creator_penalty
                    - category_penalty
                )

                if adjusted > best_score:

                    best_score = adjusted

                    best_index = index

            if best_index == -1:
                break

            item = remaining.pop(
                best_index
            )

            reel = item[0]

            selected.append(
                item
            )

            creator_count[
                reel.user_id
            ] += 1

            category = normalize(
                reel.category
            )

            if category:

                category_count[
                    category
                ] += 1

        return selected

    # =====================================================
    # LOG RECOMMENDATION
    # =====================================================

    def save_recommendation_log(
        self,
        user_id: int,
        reel_id: int,
        position: int,
        score: Dict[str, float],
    ):

        reason = self.get_reason(
            score
        )

        log = ReelRecommendationLog(
            user_id=user_id,
            reel_id=reel_id,
            position=position,

            recommendation_score=score[
                "final_score"
            ],

            interest_score=score[
                "profile_score"
            ],

            content_score=score[
                "content_score"
            ],

            popularity_score=score[
                "popularity_score"
            ],

            freshness_score=score[
                "freshness_score"
            ],

            exploration_score=score[
                "exploration_score"
            ],

            reason=reason,

            created_at=now_utc(),
        )

        self.db.add(
            log
        )

    # =====================================================
    # RECOMMENDATION REASON
    # =====================================================

    def get_reason(
        self,
        score: Dict[str, float],
    ) -> str:

        if score[
            "profile_score"
        ] >= 0.80:

            return "strong_interest_match"

        if score[
            "content_score"
        ] >= 0.80:

            return "content_match"

        if score[
            "behavior_score"
        ] >= 0.75:

            return "high_engagement"

        if score[
            "freshness_score"
        ] >= 0.80:

            return "fresh_content"

        if score[
            "popularity_score"
        ] >= 0.75:

            return "popular_content"

        if score[
            "exploration_score"
        ] >= 0.75:

            return "exploration"

        return "personalized_rank"

    # =====================================================
    # SERIALIZE
    # =====================================================

    def serialize_reel(
        self,
        reel: Reel,
        ai: Optional[ReelAIFeature],
        analytics: Optional[ReelAnalytics],
        score: Dict[str, float],
    ) -> Dict[str, Any]:

        return {

            "id": reel.id,

            "user_id": reel.user_id,

            "video_url": reel.video_url,

            "thumbnail_url": reel.thumbnail_url,

            "duration": safe_float(
                reel.duration
            ),

            "caption": reel.caption,

            "hashtags": reel.hashtags,

            "language": reel.language,

            "category": reel.category,

            "visibility": reel.visibility,

            "created_at": (
                reel.created_at.isoformat()
                if reel.created_at
                else None
            ),

            # ---------------------------------------------
            # AI INFORMATION
            # ---------------------------------------------

            "ai": {

                "category": (
                    ai.category
                    if ai
                    else None
                ),

                "subcategory": (
                    ai.subcategory
                    if ai
                    else None
                ),

                "keywords": (
                    parse_json_list(
                        ai.keywords
                    )
                    if ai
                    else []
                ),

                "language": (
                    ai.detected_language
                    if ai
                    else None
                ),

                "confidence": (
                    safe_float(
                        ai.ai_confidence
                    )
                    if ai
                    else None
                ),
            },

            # ---------------------------------------------
            # PUBLIC ANALYTICS
            # ---------------------------------------------

            "analytics": {

                "views": (
                    safe_int(
                        analytics.view_count
                    )
                    if analytics
                    else 0
                ),

                "completion": (
                    safe_float(
                        analytics.average_completion
                    )
                    if analytics
                    else 0
                ),

                "stars": {

                    "one": (
                        safe_int(
                            analytics.one_star_count
                        )
                        if analytics
                        else 0
                    ),

                    "two": (
                        safe_int(
                            analytics.two_star_count
                        )
                        if analytics
                        else 0
                    ),

                    "three": (
                        safe_int(
                            analytics.three_star_count
                        )
                        if analytics
                        else 0
                    ),
                },

                "saves": (
                    safe_int(
                        analytics.save_count
                    )
                    if analytics
                    else 0
                ),

                "shares": (
                    safe_int(
                        analytics.share_count
                    )
                    if analytics
                    else 0
                ),
            },

            # ---------------------------------------------
            # INTERNAL RECOMMENDATION INFORMATION
            # ---------------------------------------------

            "recommendation": {

                "score": round(
                    score[
                        "final_score"
                    ],
                    6,
                ),

                "reason": self.get_reason(
                    score
                ),
            },
        }


# =========================================================
# SIMPLE FUNCTION FOR ROUTES
# =========================================================

def get_personalized_reels(
    db: Session,
    user_id: int,
    limit: int = 10,
    session_id: Optional[str] = None,
) -> List[Dict[str, Any]]:

    engine = ReelRecommendationEngine(
        db=db
    )

    return engine.recommend(
        user_id=user_id,
        limit=limit,
        session_id=session_id,
    )
