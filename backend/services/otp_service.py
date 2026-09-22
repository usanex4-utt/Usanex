from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.orm import Session

from ..database.models import OTPVerification
from .auth_service import generate_otp


otp_hasher = PasswordHasher()

OTP_EXPIRY_MINUTES = 2
MAX_OTP_ATTEMPTS = 5


def create_otp(
    db: Session,
    identifier: str,
    purpose: str,
) -> str:
    """
    Create a new OTP.

    OTP validity:
        2 minutes
    """

    identifier = identifier.strip()

    # Remove previous OTPs for the same
    # identifier and purpose.
    db.query(OTPVerification).filter(
        OTPVerification.identifier == identifier,
        OTPVerification.purpose == purpose,
    ).delete(
        synchronize_session=False
    )

    otp = generate_otp()

    otp_hash = otp_hasher.hash(otp)

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=OTP_EXPIRY_MINUTES
        )
    )

    otp_record = OTPVerification(
        identifier=identifier,
        otp_hash=otp_hash,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
    )

    db.add(otp_record)
    db.commit()

    return otp


def verify_otp(
    db: Session,
    identifier: str,
    otp: str,
    purpose: str,
) -> bool:
    """
    Verify an OTP.

    Conditions:
    - OTP must exist
    - OTP must not be expired
    - Maximum 5 attempts
    - OTP must match
    """

    identifier = identifier.strip()
    otp = otp.strip()

    otp_record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.identifier == identifier,
            OTPVerification.purpose == purpose,
        )
        .order_by(
            OTPVerification.id.desc()
        )
        .first()
    )

    if otp_record is None:
        return False

    now = datetime.now(timezone.utc)

    # Handle databases that return
    # a timezone-naive datetime.
    expires_at = otp_record.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    # OTP expired
    if now >= expires_at:
        db.delete(otp_record)
        db.commit()
        return False

    # Too many attempts
    if otp_record.attempts >= MAX_OTP_ATTEMPTS:
        db.delete(otp_record)
        db.commit()
        return False

    otp_record.attempts += 1

    try:
        valid = otp_hasher.verify(
            otp_record.otp_hash,
            otp,
        )

    except VerifyMismatchError:
        valid = False

    if not valid:
        db.commit()
        return False

    # OTP successfully verified.
    db.delete(otp_record)
    db.commit()

    return True
