import secrets
import string

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.orm import Session

from ..database.models import User


password_hasher = PasswordHasher()


# ==========================================
# PASSWORD
# ==========================================

def hash_password(password: str) -> str:
    """
    Securely hash a password using Argon2.
    """
    return password_hasher.hash(password)


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    """
    Verify a password against its Argon2 hash.
    """
    try:
        return password_hasher.verify(
            password_hash,
            password,
        )

    except VerifyMismatchError:
        return False


# ==========================================
# USER ID
# ==========================================

def generate_user_id(
    length: int = 8,
) -> str:
    """
    Generate a unique-looking internal Usanex user ID.

    Example:
        u_a8k29x7p
    """

    characters = (
        string.ascii_lowercase
        + string.digits
    )

    random_part = "".join(
        secrets.choice(characters)
        for _ in range(length)
    )

    return f"u_{random_part}"


# ==========================================
# OTP
# ==========================================

def generate_otp(
    length: int = 6,
) -> str:
    """
    Generate a numeric OTP.
    """

    return "".join(
        secrets.choice(string.digits)
        for _ in range(length)
    )


# ==========================================
# USERNAME
# ==========================================

def generate_username(
    name: str,
    db: Session,
) -> str:
    """
    Generate a unique Usanex username.

    Format:

        FirstName + 5 digits + @usa

    Example:

        Uttam48217@usa
    """

    name_parts = name.strip().split()

    if not name_parts:
        first_name = "user"

    else:
        first_name = name_parts[0]

    clean_name = "".join(
        character
        for character in first_name
        if character.isalnum()
    )

    if not clean_name:
        clean_name = "user"

    clean_name = clean_name[:30]

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
