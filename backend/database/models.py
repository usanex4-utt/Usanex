from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    user_id = Column(
        String(30),
        unique=True,
        index=True,
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    mobile = Column(
        String(20),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    profile_photo = Column(
        String(500),
        nullable=True
    )

    bio = Column(
        String(500),
        nullable=True
    )


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)

    identifier = Column(
        String(100),
        index=True,
        nullable=False
    )

    otp_hash = Column(
        String(255),
        nullable=False
    )

    purpose = Column(
        String(30),
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    attempts = Column(
        Integer,
        default=0,
        nullable=False
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)

    session_token = Column(
        String(128),
        unique=True,
        index=True,
        nullable=False
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False
    )


class ConnectionRequest(Base):
    __tablename__ = "connection_requests"

    id = Column(Integer, primary_key=True, index=True)

    sender_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    receiver_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    status = Column(
        String(20),
        index=True,
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        nullable=False
    )


class ConnectionVerification(Base):
    __tablename__ = "connection_verifications"

    id = Column(Integer, primary_key=True, index=True)

    connection_request_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    requester_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    receiver_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    code_hash = Column(
        String(255),
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    attempts = Column(
        Integer,
        default=0,
        nullable=False
    )

    status = Column(
        String(20),
        index=True,
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime,
        nullable=False
    )

    verified_at = Column(
        DateTime,
        nullable=True
    )


class ConnectionNotification(Base):
    __tablename__ = "connection_notifications"

    id = Column(Integer, primary_key=True, index=True)

    receiver_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    sender_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    connection_request_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    verification_id = Column(
        Integer,
        index=True,
        nullable=True
    )

    notification_type = Column(
        String(50),
        index=True,
        nullable=False
    )

    encrypted_code = Column(
        String(500),
        nullable=True
    )

    is_read = Column(
        Integer,
        default=0,
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False
    )


class UserConnection(Base):
    __tablename__ = "user_connections"

    id = Column(Integer, primary_key=True, index=True)

    user_one_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    user_two_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    status = Column(
        String(20),
        index=True,
        nullable=False,
        default="connected"
    )

    created_at = Column(
        DateTime,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        nullable=False
    )


class UserConnectionCategory(Base):
    __tablename__ = "user_connection_categories"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    connected_user_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    category = Column(
        String(20),
        index=True,
        nullable=False,
        default="friend"
    )

    created_at = Column(
        DateTime,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        nullable=False
    )


class UserFollow(Base):
    __tablename__ = "user_follows"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    follower_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    following_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "follower_id",
            "following_id",
            name="uq_user_follows_pair"
        ),
    )


class Post(Base):
    __tablename__ = "posts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    content = Column(
        Text,
        nullable=True
    )

    media_url = Column(
        String(500),
        nullable=True
    )

    media_type = Column(
        String(30),
        index=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        index=True,
        nullable=False
    )
