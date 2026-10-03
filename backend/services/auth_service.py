import secrets
import string

from argon2 import PasswordHasher
from argon2.exceptions import (
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)
from sqlalchemy.orm import Session

from ..database.models import User


# =========================================================
# PASSWORD HASHER
# =========================================================

password_hasher = PasswordHasher()


# =========================================================
# PASSWORD — HASH
# =========================================================

def hash_password(password: str) -> str:
    """
    Hash password securely using Argon2.
    """

    if not password:
        raise ValueError("Password cannot be empty")

    return password_hasher.hash(password)


# =========================================================
# PASSWORD — VERIFY
# =========================================================

def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    """
    Verify password against Argon2 hash.
    """

    if not password or not password_hash:
        return False

    try:
        return password_hasher.verify(
            password_hash,
            password,
        )

    except (
        VerifyMismatchError,
        VerificationError,
        InvalidHashError,
    ):
        return False


# =========================================================
# USER ID
# =========================================================

def generate_user_id(
    length: int = 8,
) -> str:
    """
    Generate internal unique-looking Usanex user ID.

    Example:
        u_a8k29x7p
    """

    if length < 6:
        length = 6

    characters = (
        string.ascii_lowercase
        + string.digits
    )

    random_part = "".join(
        secrets.choice(characters)
        for _ in range(length)
    )

    return f"u_{random_part}"


# =========================================================
# OTP
# =========================================================

def generate_otp(
    length: int = 6,
) -> str:
    """
    Generate secure numeric OTP.
    """

    if length < 4:
        length = 4

    digits = string.digits

    return "".join(
        secrets.choice(digits)
        for _ in range(length)
    )


# =========================================================
# USERNAME
# =========================================================

def generate_username(
    name: str,
    db: Session,
) -> str:
    """
    Generate unique Usanex username.

    Format:

        FirstName + 5 digit number + @usa

    Example:

        Uttam48217@usa
    """

    name = (name or "").strip()

    # -----------------------------------------------------
    # FIRST NAME
    # -----------------------------------------------------

    name_parts = name.split()

    if name_parts:
        first_name = name_parts[0]
    else:
        first_name = "user"

    # -----------------------------------------------------
    # REMOVE SPECIAL CHARACTERS
    # -----------------------------------------------------

    clean_name = "".join(
        character
        for character in first_name
        if character.isalnum()
    )

    if not clean_name:
        clean_name = "user"

    # Keep username reasonably sized
    clean_name = clean_name[:30]

    # -----------------------------------------------------
    # GENERATE UNIQUE USERNAME
    # -----------------------------------------------------

    while True:

        number = secrets.randbelow(90000) + 10000

        username = (
            f"{clean_name}{number}@usa"
        )

        existing_user = (
            db.query(User)
            .filter(
                User.username == username
            )
            .first()
        )

        if existing_user is None:
            return username
