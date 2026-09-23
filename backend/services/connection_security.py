import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken


# =========================================================
# USANEX CONNECTION CODE SECURITY
# =========================================================

SECRET_ENV_NAME = "USANEX_CONNECTION_SECRET"


# =========================================================
# GET FERNET KEY
# =========================================================

def get_fernet() -> Fernet:
    """
    Creates a stable Fernet key from the
    USANEX_CONNECTION_SECRET environment variable.

    The secret itself is never stored in the database.
    """

    secret = os.getenv(
        SECRET_ENV_NAME
    )

    if not secret:
        raise RuntimeError(
            "USANEX_CONNECTION_SECRET environment variable is not set"
        )

    # Convert environment secret into a
    # valid 32-byte Fernet key.
    digest = hashlib.sha256(
        secret.encode("utf-8")
    ).digest()

    key = base64.urlsafe_b64encode(
        digest
    )

    return Fernet(key)


# =========================================================
# ENCRYPT
# =========================================================

def encrypt_code(
    code: str,
) -> str:
    """
    Encrypt a verification code using
    authenticated Fernet encryption.
    """

    if not code:
        raise ValueError(
            "Verification code cannot be empty"
        )

    fernet = get_fernet()

    encrypted = fernet.encrypt(
        code.encode("utf-8")
    )

    return encrypted.decode("utf-8")


# =========================================================
# DECRYPT
# =========================================================

def decrypt_code(
    encrypted_code: str,
) -> str:
    """
    Decrypt a previously encrypted
    verification code.
    """

    if not encrypted_code:
        raise ValueError(
            "Encrypted code cannot be empty"
        )

    fernet = get_fernet()

    try:

        decrypted = fernet.decrypt(
            encrypted_code.encode("utf-8")
        )

    except InvalidToken as exc:

        raise ValueError(
            "Invalid or corrupted encrypted code"
        ) from exc

    return decrypted.decode("utf-8")
