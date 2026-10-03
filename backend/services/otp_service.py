from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import (
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)
from sqlalchemy.orm import Session

from ..database.models import OTPVerification
from .auth_service import generate_otp


# =========================================================
# OTP SETTINGS
# =========================================================

otp_hasher = PasswordHasher()

OTP_EXPIRY_MINUTES = 2

MAX_OTP_ATTEMPTS = 5


# =========================================================
# UTC TIME
# =========================================================

def utc_now():
    """
    Return current UTC time as a naive datetime.

    Database model uses SQLAlchemy DateTime
    without timezone.
    """

    return datetime.now(
        timezone.utc
    ).replace(
        tzinfo=None
    )


# =========================================================
# CREATE OTP
# =========================================================

def create_otp(
    db: Session,
    identifier: str,
    purpose: str,
) -> str:
    """
    Generate and store a new OTP.

    OTP validity:
        2 minutes

    Previous OTP for the same
    identifier + purpose is removed.
    """

    identifier = (
        identifier or ""
    ).strip()

    purpose = (
        purpose or ""
    ).strip()

    if not identifier:
        raise ValueError(
            "OTP identifier is required"
        )

    if not purpose:
        raise ValueError(
            "OTP purpose is required"
        )

    # -----------------------------------------------------
    # DELETE OLD OTP
    # -----------------------------------------------------

    db.query(
        OTPVerification
    ).filter(
        OTPVerification.identifier
        == identifier,

        OTPVerification.purpose
        == purpose,
    ).delete(
        synchronize_session=False
    )

    # -----------------------------------------------------
    # GENERATE OTP
    # -----------------------------------------------------

    otp = generate_otp(
        length=6
    )

    # -----------------------------------------------------
    # HASH OTP
    # -----------------------------------------------------

    otp_hash = otp_hasher.hash(
        otp
    )

    # -----------------------------------------------------
    # EXPIRY
    # -----------------------------------------------------

    expires_at = (
        utc_now()
        + timedelta(
            minutes=OTP_EXPIRY_MINUTES
        )
    )

    # -----------------------------------------------------
    # DATABASE RECORD
    # -----------------------------------------------------

    otp_record = OTPVerification(
        identifier=identifier,
        otp_hash=otp_hash,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
    )

    db.add(
        otp_record
    )

    db.commit()

    return otp


# =========================================================
# VERIFY OTP
# =========================================================

def verify_otp(
    db: Session,
    identifier: str,
    otp: str,
    purpose: str,
) -> bool:
    """
    Verify OTP.

    Rules:

    1. OTP must exist.
    2. OTP must not be expired.
    3. Maximum 5 attempts.
    4. Correct OTP is required.
    5. Successful OTP is deleted.
    """

    identifier = (
        identifier or ""
    ).strip()

    otp = (
        otp or ""
    ).strip()

    purpose = (
        purpose or ""
    ).strip()

    if not identifier:
        return False

    if not otp:
        return False

    if not purpose:
        return False

    # -----------------------------------------------------
    # FIND OTP
    # -----------------------------------------------------

    otp_record = (
        db.query(
            OTPVerification
        )
        .filter(
            OTPVerification.identifier
            == identifier,

            OTPVerification.purpose
            == purpose,
        )
        .order_by(
            OTPVerification.id.desc()
        )
        .first()
    )

    if otp_record is None:
        return False

    # -----------------------------------------------------
    # CURRENT TIME
    # -----------------------------------------------------

    now = datetime.now(
        timezone.utc
    )

    # -----------------------------------------------------
    # DATABASE TIMEZONE HANDLING
    # -----------------------------------------------------

    expires_at = (
        otp_record.expires_at
    )

    if expires_at.tzinfo is None:

        expires_at = (
            expires_at.replace(
                tzinfo=timezone.utc
            )
        )

    # -----------------------------------------------------
    # CHECK EXPIRY
    # -----------------------------------------------------

    if now >= expires_at:

        db.delete(
            otp_record
        )

        db.commit()

        return False

    # -----------------------------------------------------
    # CHECK ATTEMPTS
    # -----------------------------------------------------

    if (
        otp_record.attempts
        >= MAX_OTP_ATTEMPTS
    ):

        db.delete(
            otp_record
        )

        db.commit()

        return False

    # -----------------------------------------------------
    # INCREMENT ATTEMPT
    # -----------------------------------------------------

    otp_record.attempts += 1

    # -----------------------------------------------------
    # VERIFY ARGON2
    # -----------------------------------------------------

    try:

        valid = otp_hasher.verify(
            otp_record.otp_hash,
            otp,
        )

    except (
        VerifyMismatchError,
        VerificationError,
        InvalidHashError,
    ):

        valid = False

    # -----------------------------------------------------
    # INVALID OTP
    # -----------------------------------------------------

    if not valid:

        db.commit()

        return False

    # -----------------------------------------------------
    # OTP SUCCESS
    # -----------------------------------------------------

    db.delete(
        otp_record
    )

    db.commit()

    return True
