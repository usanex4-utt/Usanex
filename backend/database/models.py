from sqlalchemy import Column, DateTime, Integer, String

from .database import Base


# =========================================================
# USERS
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

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


# =========================================================
# OTP VERIFICATION
# =========================================================

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

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
# USER SESSIONS
# =========================================================

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

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
# CONNECTION REQUESTS
# =========================================================

class ConnectionRequest(Base):
    __tablename__ = "connection_requests"

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
# CONNECTION VERIFICATION CODES
# =========================================================

class ConnectionVerification(Base):
    __tablename__ = "connection_verifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

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
# ACTUAL USER CONNECTIONS
# =========================================================

class UserConnection(Base):
    __tablename__ = "user_connections"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

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
