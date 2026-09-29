# backend/database/models.py

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from .database import Base


# =========================================================
# USERS
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    user_id = Column(
        String(30),
        unique=True,
        index=True,
        nullable=False,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    mobile = Column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    profile_photo = Column(
        String(500),
        nullable=True,
    )

    bio = Column(
        String(500),
        nullable=True,
    )

    website = Column(
        String(500),
        nullable=True,
    )

    instagram = Column(
        String(500),
        nullable=True,
    )

    social_link = Column(
        String(500),
        nullable=True,
    )


# =========================================================
# OTP VERIFICATION
# =========================================================

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)

    identifier = Column(
        String(100),
        index=True,
        nullable=False,
    )

    otp_hash = Column(
        String(255),
        nullable=False,
    )

    purpose = Column(
        String(30),
        nullable=False,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    attempts = Column(
        Integer,
        default=0,
        nullable=False,
    )


# =========================================================
# USER SESSION
# =========================================================

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)

    session_token = Column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )


# =========================================================
# CONNECTION REQUEST
# =========================================================

class ConnectionRequest(Base):
    __tablename__ = "connection_requests"

    id = Column(Integer, primary_key=True, index=True)

    sender_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    receiver_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    status = Column(
        String(20),
        index=True,
        nullable=False,
        default="pending",
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
    )


# =========================================================
# CONNECTION VERIFICATION
# =========================================================

class ConnectionVerification(Base):
    __tablename__ = "connection_verifications"

    id = Column(Integer, primary_key=True, index=True)

    connection_request_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    requester_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    receiver_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    code_hash = Column(
        String(255),
        nullable=False,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    attempts = Column(
        Integer,
        default=0,
        nullable=False,
    )

    status = Column(
        String(20),
        index=True,
        nullable=False,
        default="pending",
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )

    verified_at = Column(
        DateTime,
        nullable=True,
    )


# =========================================================
# CONNECTION NOTIFICATION
# =========================================================

class ConnectionNotification(Base):
    __tablename__ = "connection_notifications"

    id = Column(Integer, primary_key=True, index=True)

    receiver_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    sender_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    connection_request_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    verification_id = Column(
        Integer,
        index=True,
        nullable=True,
    )

    notification_type = Column(
        String(50),
        index=True,
        nullable=False,
    )

    encrypted_code = Column(
        String(500),
        nullable=True,
    )

    is_read = Column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )


# =========================================================
# USER CONNECTION
# =========================================================

class UserConnection(Base):
    __tablename__ = "user_connections"

    id = Column(Integer, primary_key=True, index=True)

    user_one_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    user_two_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    status = Column(
        String(20),
        index=True,
        nullable=False,
        default="connected",
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_one_id",
            "user_two_id",
            name="uq_user_connection_pair",
        ),
    )


# =========================================================
# PERSONAL CONNECTION CATEGORY
# =========================================================

class UserConnectionCategory(Base):
    __tablename__ = "user_connection_categories"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    connected_user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    category = Column(
        String(20),
        index=True,
        nullable=False,
        default="friend",
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "connected_user_id",
            name="uq_user_connection_category",
        ),
    )


# =========================================================
# USER FOLLOWS
# =========================================================

class UserFollow(Base):
    __tablename__ = "user_follows"

    id = Column(Integer, primary_key=True, index=True)

    follower_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    following_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "follower_id",
            "following_id",
            name="uq_user_follow",
        ),
    )


# =========================================================
# POSTS
# =========================================================

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    content = Column(
        Text,
        nullable=True,
    )

    media_url = Column(
        String(500),
        nullable=True,
    )

    media_type = Column(
        String(30),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
    )


# =========================================================
# =========================================================
# REELS SYSTEM
# =========================================================
# =========================================================


# =========================================================
# REEL
# =========================================================

class Reel(Base):
    __tablename__ = "reels"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Creator
    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    # Video
    video_url = Column(
        String(1000),
        nullable=False,
    )

    thumbnail_url = Column(
        String(1000),
        nullable=True,
    )

    duration = Column(
        Float,
        nullable=False,
        default=0,
    )

    file_size = Column(
        Integer,
        nullable=True,
    )

    # User information
    caption = Column(
        Text,
        nullable=True,
    )

    hashtags = Column(
        Text,
        nullable=True,
    )

    language = Column(
        String(50),
        index=True,
        nullable=True,
    )

    category = Column(
        String(100),
        index=True,
        nullable=True,
    )

    visibility = Column(
        String(30),
        index=True,
        nullable=False,
        default="public",
    )

    status = Column(
        String(30),
        index=True,
        nullable=False,
        default="published",
    )

    # -----------------------------------------------------
    # BASIC ANALYTICS
    # -----------------------------------------------------

    views_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    unique_views_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    completed_views_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    replay_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    share_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    save_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    download_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    comment_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    # -----------------------------------------------------
    # 3 STAR SYSTEM
    # -----------------------------------------------------

    one_star_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    two_star_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    three_star_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    # -----------------------------------------------------
    # INTEREST
    # -----------------------------------------------------

    interested_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    not_interested_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    # -----------------------------------------------------
    # AI PROCESSING
    # -----------------------------------------------------

    ai_processed = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    ai_processing_status = Column(
        String(30),
        index=True,
        default="pending",
        nullable=False,
    )

    ai_category = Column(
        String(100),
        nullable=True,
    )

    ai_confidence = Column(
        Float,
        nullable=True,
    )

    is_safe = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        Index(
            "ix_reels_user_created",
            "user_id",
            "created_at",
        ),
        Index(
            "ix_reels_category_created",
            "category",
            "created_at",
        ),
        Index(
            "ix_reels_status_created",
            "status",
            "created_at",
        ),
    )


# =========================================================
# REEL AI FEATURES
# =========================================================

class ReelAIFeature(Base):
    __tablename__ = "reel_ai_features"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    reel_id = Column(
        Integer,
        unique=True,
        index=True,
        nullable=False,
    )

    # -----------------------------------------------------
    # CONTENT UNDERSTANDING
    # -----------------------------------------------------

    category = Column(
        String(100),
        index=True,
        nullable=True,
    )

    subcategory = Column(
        String(100),
        index=True,
        nullable=True,
    )

    topics = Column(
        Text,
        nullable=True,
    )

    keywords = Column(
        Text,
        nullable=True,
    )

    detected_objects = Column(
        Text,
        nullable=True,
    )

    detected_scenes = Column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # SPEECH / AUDIO
    # -----------------------------------------------------

    transcript = Column(
        Text,
        nullable=True,
    )

    detected_language = Column(
        String(50),
        nullable=True,
    )

    audio_name = Column(
        String(300),
        nullable=True,
    )

    audio_type = Column(
        String(100),
        nullable=True,
    )

    # -----------------------------------------------------
    # ML / EMBEDDING
    # -----------------------------------------------------

    embedding_reference = Column(
        Text,
        nullable=True,
    )

    embedding_model = Column(
        String(100),
        nullable=True,
    )

    ai_model_version = Column(
        String(100),
        nullable=True,
    )

    # -----------------------------------------------------
    # QUALITY / SAFETY
    # -----------------------------------------------------

    content_quality_score = Column(
        Float,
        nullable=True,
    )

    safety_score = Column(
        Float,
        nullable=True,
    )

    ai_confidence = Column(
        Float,
        nullable=True,
    )

    analyzed_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# REEL INTERACTION EVENTS
# =========================================================

class ReelInteraction(Base):
    __tablename__ = "reel_interactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    creator_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    # -----------------------------------------------------
    # SESSION
    # -----------------------------------------------------

    session_id = Column(
        String(100),
        index=True,
        nullable=True,
    )

    feed_position = Column(
        Integer,
        nullable=True,
    )

    source = Column(
        String(50),
        nullable=True,
    )

    # -----------------------------------------------------
    # EVENT
    # -----------------------------------------------------

    event_type = Column(
        String(50),
        index=True,
        nullable=False,
    )

    # Examples:
    # impression
    # play
    # pause
    # complete
    # replay
    # star
    # save
    # download
    # share
    # comment
    # interested
    # not_interested
    # mute
    # unmute
    # skip

    # -----------------------------------------------------
    # WATCH BEHAVIOUR
    # -----------------------------------------------------

    watch_time = Column(
        Float,
        default=0,
        nullable=False,
    )

    watch_percentage = Column(
        Float,
        default=0,
        nullable=False,
    )

    completed = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    replayed = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    replay_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    # -----------------------------------------------------
    # 3 STAR RATING
    # -----------------------------------------------------

    star_rating = Column(
        Integer,
        default=0,
        nullable=False,
    )

    # -----------------------------------------------------
    # ACTION SIGNALS
    # -----------------------------------------------------

    interested = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    not_interested = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    saved = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    downloaded = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    shared = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    commented = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    muted = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        Index(
            "ix_reel_interactions_user_reel",
            "user_id",
            "reel_id",
        ),
        Index(
            "ix_reel_interactions_user_created",
            "user_id",
            "created_at",
        ),
        Index(
            "ix_reel_interactions_reel_created",
            "reel_id",
            "created_at",
        ),
    )


# =========================================================
# CURRENT REEL RATING
# One rating per user/reel
# =========================================================

class ReelRating(Base):
    __tablename__ = "reel_ratings"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    rating = Column(
        Integer,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "reel_id",
            name="uq_reel_rating_user_reel",
        ),
    )


# =========================================================
# REEL SAVE
# =========================================================

class ReelSave(Base):
    __tablename__ = "reel_saves"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "reel_id",
            name="uq_reel_save_user_reel",
        ),
    )


# =========================================================
# REEL DOWNLOAD
# =========================================================

class ReelDownload(Base):
    __tablename__ = "reel_downloads"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# REEL SHARE
# =========================================================

class ReelShare(Base):
    __tablename__ = "reel_shares"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    share_type = Column(
        String(50),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# REEL COMMENT
# =========================================================

class ReelComment(Base):
    __tablename__ = "reel_comments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    content = Column(
        Text,
        nullable=False,
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# REEL REPORT
# =========================================================

class ReelReport(Base):
    __tablename__ = "reel_reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reason = Column(
        String(100),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# USER REEL INTEREST
# =========================================================

class UserReelInterest(Base):
    __tablename__ = "user_reel_interests"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    category = Column(
        String(100),
        index=True,
        nullable=False,
    )

    subcategory = Column(
        String(100),
        index=True,
        nullable=True,
    )

    # -----------------------------------------------------
    # ML SCORES
    # -----------------------------------------------------

    interest_score = Column(
        Float,
        default=0,
        nullable=False,
    )

    positive_score = Column(
        Float,
        default=0,
        nullable=False,
    )

    negative_score = Column(
        Float,
        default=0,
        nullable=False,
    )

    # -----------------------------------------------------
    # BEHAVIOUR
    # -----------------------------------------------------

    videos_seen = Column(
        Integer,
        default=0,
        nullable=False,
    )

    videos_completed = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_watch_time = Column(
        Float,
        default=0,
        nullable=False,
    )

    average_watch_percentage = Column(
        Float,
        default=0,
        nullable=False,
    )

    total_replays = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_saves = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_shares = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_downloads = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_one_star = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_two_star = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_three_star = Column(
        Integer,
        default=0,
        nullable=False,
    )

    last_updated = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "category",
            "subcategory",
            name="uq_user_reel_interest",
        ),
    )


# =========================================================
# USER REEL HISTORY
# =========================================================

class UserReelHistory(Base):
    __tablename__ = "user_reel_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    first_seen_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    last_seen_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    times_seen = Column(
        Integer,
        default=1,
        nullable=False,
    )

    total_watch_time = Column(
        Float,
        default=0,
        nullable=False,
    )

    max_watch_percentage = Column(
        Float,
        default=0,
        nullable=False,
    )

    completed_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    replay_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "reel_id",
            name="uq_user_reel_history",
        ),
    )


# =========================================================
# USER REEL PROFILE
# =========================================================

class UserInterestProfile(Base):
    __tablename__ = "user_interest_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        unique=True,
        index=True,
        nullable=False,
    )

    # Serialized ML profiles
    topic_scores = Column(
        Text,
        nullable=True,
    )

    category_scores = Column(
        Text,
        nullable=True,
    )

    creator_scores = Column(
        Text,
        nullable=True,
    )

    language_scores = Column(
        Text,
        nullable=True,
    )

    embedding_reference = Column(
        Text,
        nullable=True,
    )

    embedding_model = Column(
        String(100),
        nullable=True,
    )

    # Overall behaviour
    total_reels_watched = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_watch_seconds = Column(
        Float,
        default=0,
        nullable=False,
    )

    average_completion = Column(
        Float,
        default=0,
        nullable=False,
    )

    last_updated = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# RECOMMENDATION LOG
# =========================================================

class ReelRecommendationLog(Base):
    __tablename__ = "reel_recommendation_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    position = Column(
        Integer,
        nullable=True,
    )

    # Final score
    recommendation_score = Column(
        Float,
        nullable=True,
    )

    # Individual ranking signals
    interest_score = Column(
        Float,
        nullable=True,
    )

    content_score = Column(
        Float,
        nullable=True,
    )

    creator_score = Column(
        Float,
        nullable=True,
    )

    popularity_score = Column(
        Float,
        nullable=True,
    )

    freshness_score = Column(
        Float,
        nullable=True,
    )

    exploration_score = Column(
        Float,
        nullable=True,
    )

    diversity_score = Column(
        Float,
        nullable=True,
    )

    # Why this reel was recommended
    reason = Column(
        String(100),
        nullable=True,
    )

    was_shown = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    was_watched = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# REEL AGGREGATE ANALYTICS
# =========================================================

class ReelAnalytics(Base):
    __tablename__ = "reel_analytics"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    reel_id = Column(
        Integer,
        unique=True,
        index=True,
        nullable=False,
    )

    view_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    unique_viewers = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_watch_seconds = Column(
        Float,
        default=0,
        nullable=False,
    )

    average_watch_seconds = Column(
        Float,
        default=0,
        nullable=False,
    )

    average_completion = Column(
        Float,
        default=0,
        nullable=False,
    )

    replay_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    one_star_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    two_star_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    three_star_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    save_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    download_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    share_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    interested_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    not_interested_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    comment_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )


# =========================================================
# AREA ANALYTICS
# =========================================================
# IMPORTANT:
# Only broad aggregate location is stored.
# Exact GPS/address should NOT be stored for recommendation
# analytics.
# =========================================================

class ReelAreaAnalytics(Base):
    __tablename__ = "reel_area_analytics"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    reel_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    country = Column(
        String(100),
        index=True,
        nullable=True,
    )

    state = Column(
        String(100),
        index=True,
        nullable=True,
    )

    city = Column(
        String(100),
        index=True,
        nullable=True,
    )

    category = Column(
        String(100),
        index=True,
        nullable=True,
    )

    views = Column(
        Integer,
        default=0,
        nullable=False,
    )

    completed_views = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_watch_seconds = Column(
        Float,
        default=0,
        nullable=False,
    )

    average_watch_percentage = Column(
        Float,
        default=0,
        nullable=False,
    )

    one_star = Column(
        Integer,
        default=0,
        nullable=False,
    )

    two_star = Column(
        Integer,
        default=0,
        nullable=False,
    )

    three_star = Column(
        Integer,
        default=0,
        nullable=False,
    )

    saves = Column(
        Integer,
        default=0,
        nullable=False,
    )

    shares = Column(
        Integer,
        default=0,
        nullable=False,
    )

    downloads = Column(
        Integer,
        default=0,
        nullable=False,
    )

    interested = Column(
        Integer,
        default=0,
        nullable=False,
    )

    not_interested = Column(
        Integer,
        default=0,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "reel_id",
            "country",
            "state",
            "city",
            name="uq_reel_area_analytics",
        ),
    )


# =========================================================
# CHAT MESSAGE
# =========================================================

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sender_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    receiver_id = Column(
        Integer,
        index=True,
        nullable=False,
    )

    content = Column(
        Text,
        nullable=True,
    )

    media_url = Column(
        String(500),
        nullable=True,
    )

    media_type = Column(
        String(30),
        nullable=True,
    )

    is_read = Column(
        Integer,
        default=0,
        nullable=False,
    )

    is_deleted = Column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )
