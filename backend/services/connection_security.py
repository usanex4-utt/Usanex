import base64
import hashlib
import os


# =========================================================
# USANEX CONNECTION CODE SECURITY
# =========================================================

# Secret key environment variable se aayegi.
# Production me ise Render Environment Variables me rakhenge.
SECRET_KEY = os.getenv(
    "USANEX_CONNECTION_SECRET"
)


def get_secret_key() -> bytes:
    """
    Get the encryption secret.

    The application must have this secret configured.
    """

    if not SECRET_KEY:
        raise RuntimeError(
            "USANEX_CONNECTION_SECRET environment variable is not set"
        )

    return hashlib.sha256(
        SECRET_KEY.encode("utf-8")
    ).digest()


# =========================================================
# ENCRYPT
# =========================================================

def encrypt_code(code: str) -> str:
    """
    Encrypt a verification code.

    This implementation uses a keyed stream based on
    SHA-256 and a random nonce.

    The encrypted value is stored as:
        nonce + encrypted_data
    """

    if not code:
        raise ValueError(
            "Verification code cannot be empty"
        )


    secret = get_secret_key()


    nonce = os.urandom(16)


    encrypted = bytearray()


    for index, value in enumerate(
        code.encode("utf-8")
    ):

        key_material = hashlib.sha256(
            secret
            + nonce
            + index.to_bytes(
                4,
                "big"
            )
        ).digest()


        encrypted.append(
            value
            ^ key_material[0]
        )


    payload = (
        nonce
        + bytes(encrypted)
    )


    return base64.urlsafe_b64encode(
        payload
    ).decode("utf-8")


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


    secret = get_secret_key()


    try:

        payload = (
            base64.urlsafe_b64decode(
                encrypted_code.encode(
                    "utf-8"
                )
            )
        )

    except Exception as exc:

        raise ValueError(
            "Invalid encrypted code"
        ) from exc


    if len(payload) < 17:

        raise ValueError(
            "Invalid encrypted payload"
        )


    nonce = payload[:16]

    encrypted_data = payload[16:]


    decrypted = bytearray()


    for index, value in enumerate(
        encrypted_data
    ):

        key_material = hashlib.sha256(
            secret
            + nonce
            + index.to_bytes(
                4,
                "big"
            )
        ).digest()


        decrypted.append(
            value
            ^ key_material[0]
        )


    try:

        return bytes(
            decrypted
        ).decode("utf-8")

    except UnicodeDecodeError as exc:

        raise ValueError(
            "Unable to decrypt code"
        ) from exc
