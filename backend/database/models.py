from sqlalchemy import Column, Integer, String, DateTime

from .database import Base


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
