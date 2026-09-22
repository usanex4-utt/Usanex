import secrets
import string

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError


password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a password securely."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its stored hash."""
    try:
        return password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def generate_user_id(length: int = 8) -> str:
    """Generate a random Usanex user ID."""
    characters = string.ascii_lowercase + string.digits

    return "u_" + "".join(
        secrets.choice(characters)
        for _ in range(length)
    )


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP."""
    return "".join(
        secrets.choice(string.digits)
        for _ in range(length)
    )
