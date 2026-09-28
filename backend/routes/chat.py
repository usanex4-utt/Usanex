# =========================================================
# USANEX — CHAT ROUTES
# backend/routes/chat.py
# =========================================================

from datetime import datetime, timezone
from pathlib import Path
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)
from sqlalchemy.orm import Session

from ..database.database import SessionLocal
from ..database.models import (
    User,
    UserSession,
    ChatMessage,
    UserConnection,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


# =========================================================
# SESSION COOKIE
# =========================================================
#
# IMPORTANT:
# auth.py भी यही cookie बनाता है:
#
#     usanex_session
#
# इसलिए Chat में भी यही नाम होना चाहिए.
# =========================================================

SESSION_COOKIE_NAME = "usanex_session"


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# TIME
# =========================================================

def utc_now():
    """
    Return current UTC time without timezone information.
    This matches the DateTime fields used in models.py.
    """

    return datetime.now(
        timezone.utc
    ).replace(
        tzinfo=None
    )


# =========================================================
# CURRENT USER
# =========================================================

def get_current_user(
    request: Request,
    db: Session,
):
    """
    Get currently logged-in user.

    Uses the same session cookie created by auth.py:

        usanex_session
    """

    # -----------------------------------------------------
    # READ SESSION COOKIE
    # -----------------------------------------------------

    session_token = request.cookies.get(
        SESSION_COOKIE_NAME
    )

    if not session_token:

        raise HTTPException(
            status_code=401,
            detail="Not authenticated.",
        )

    # -----------------------------------------------------
    # FIND SESSION
    # -----------------------------------------------------

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token
            == session_token
        )
        .first()
    )

    if session is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid session.",
        )

    # -----------------------------------------------------
    # CHECK EXPIRATION
    # -----------------------------------------------------

    expires_at = session.expires_at

    if expires_at.tzinfo is None:

        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    now = datetime.now(
        timezone.utc
    )

    if now >= expires_at:

        db.delete(session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Session expired.",
        )

    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id == session.user_id
        )
        .first()
    )

    if user is None:

        db.delete(session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    return user


# =========================================================
# FIND USER
# =========================================================

def find_user(
    db: Session,
    user_identifier: str,
):
    """
    Find user by public user_id.

    Also supports database integer id as fallback.
    """

    user = (
        db.query(User)
        .filter(
            User.user_id == user_identifier
        )
        .first()
    )

    if user:

        return user

    # -----------------------------------------------------
    # INTEGER ID FALLBACK
    # -----------------------------------------------------

    try:

        numeric_id = int(
            user_identifier
        )

    except (
        ValueError,
        TypeError,
    ):

        return None

    return (
        db.query(User)
        .filter(
            User.id == numeric_id
        )
        .first()
    )


# =========================================================
# SERIALIZE USER
# =========================================================

def serialize_user(
    user: User,
):
    return {
        "id": user.id,
        "user_id": user.user_id,
        "username": user.username,
        "name": user.name,
        "profile_photo": user.profile_photo,
    }


# =========================================================
# SERIALIZE MESSAGE
# =========================================================

def serialize_message(
    message: ChatMessage,
):
    return {
        "id": message.id,

        "sender_id": message.sender_id,

        "receiver_id": message.receiver_id,

        "content": message.content,

        "message": message.content,

        "media_url": message.media_url,

        "media_type": message.media_type,

        "read": bool(
            message.is_read
        ),

        "is_read": bool(
            message.is_read
        ),

        "is_deleted": bool(
            message.is_deleted
        ),

        "created_at": (
            message.created_at.isoformat()
            if message.created_at
            else None
        ),
    }


# =========================================================
# CONNECTION CHECK
# =========================================================

def are_users_connected(
    db: Session,
    user_one_id: int,
    user_two_id: int,
):
    """
    Chat is allowed only when users are connected.
    """

    connection = (
        db.query(UserConnection)
        .filter(
            UserConnection.status
            == "connected"
        )
        .filter(
            (
                (
                    UserConnection.user_one_id
                    == user_one_id
                )
                &
                (
                    UserConnection.user_two_id
                    == user_two_id
                )
            )
            |
            (
                (
                    UserConnection.user_one_id
                    == user_two_id
                )
                &
                (
                    UserConnection.user_two_id
                    == user_one_id
                )
            )
        )
        .first()
    )

    return connection is not None


# =========================================================
# CHAT HEALTH
# =========================================================
#
# GET /api/chat/health/status
#
# =========================================================

@router.get(
    "/health/status"
)
def chat_health():

    return {
        "success": True,
        "app": "Usanex",
        "service": "chat",
        "status": "online",
    }


# =========================================================
# GET CHAT
# =========================================================
#
# GET /api/chat/{user_id}
#
# Example:
#
# /api/chat/u_abc123
#
# =========================================================

@router.get(
    "/{user_id}"
)
def get_chat(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # CURRENT USER
    # -----------------------------------------------------

    current_user = get_current_user(
        request=request,
        db=db,
    )

    # -----------------------------------------------------
    # CHAT USER
    # -----------------------------------------------------

    chat_user = find_user(
        db=db,
        user_identifier=user_id,
    )

    if chat_user is None:

        raise HTTPException(
            status_code=404,
            detail="Chat user not found.",
        )

    # -----------------------------------------------------
    # SELF CHAT
    # -----------------------------------------------------

    if (
        chat_user.id
        == current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail="You cannot chat with yourself.",
        )

    # -----------------------------------------------------
    # LOAD MESSAGES
    # -----------------------------------------------------

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.is_deleted == 0
        )
        .filter(
            (
                (
                    ChatMessage.sender_id
                    == current_user.id
                )
                &
                (
                    ChatMessage.receiver_id
                    == chat_user.id
                )
            )
            |
            (
                (
                    ChatMessage.sender_id
                    == chat_user.id
                )
                &
                (
                    ChatMessage.receiver_id
                    == current_user.id
                )
            )
        )
        .order_by(
            ChatMessage.created_at.asc()
        )
        .all()
    )

    # -----------------------------------------------------
    # MARK RECEIVED MESSAGES AS READ
    # -----------------------------------------------------

    unread_messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.sender_id
            == chat_user.id
        )
        .filter(
            ChatMessage.receiver_id
            == current_user.id
        )
        .filter(
            ChatMessage.is_read == 0
        )
        .filter(
            ChatMessage.is_deleted == 0
        )
        .all()
    )

    for message in unread_messages:

        message.is_read = 1

    if unread_messages:

        db.commit()

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "success": True,

        "current_user":
            serialize_user(
                current_user
            ),

        "user":
            serialize_user(
                chat_user
            ),

        "messages": [
            serialize_message(
                message
            )
            for message in messages
        ],
    }


# =========================================================
# SEND MESSAGE
# =========================================================
#
# POST /api/chat/send
#
# FormData:
#
# receiver_id
# content
# file
#
# =========================================================

@router.post(
    "/send"
)
async def send_message(
    request: Request,

    receiver_id: str = Form(...),

    content: str = Form(
        default=""
    ),

    file: UploadFile | None = File(
        default=None
    ),

    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # CURRENT USER
    # -----------------------------------------------------

    current_user = get_current_user(
        request=request,
        db=db,
    )

    # -----------------------------------------------------
    # RECEIVER
    # -----------------------------------------------------

    receiver = find_user(
        db=db,
        user_identifier=receiver_id,
    )

    if receiver is None:

        raise HTTPException(
            status_code=404,
            detail="Receiver not found.",
        )

    # -----------------------------------------------------
    # SELF MESSAGE
    # -----------------------------------------------------

    if (
        receiver.id
        == current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail="You cannot send a message to yourself.",
        )

    # -----------------------------------------------------
    # CONNECTION CHECK
    # -----------------------------------------------------
    #
    # फिलहाल development में connection check
    # optional रखा गया है ताकि existing users
    # का chat flow न टूटे.
    #
    # जब पूरा connection system stable होगा,
    # इसे strict किया जा सकता है.
    # -----------------------------------------------------

    # connected = are_users_connected(
    #     db,
    #     current_user.id,
    #     receiver.id,
    # )

    # if not connected:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="You can only chat with connected users.",
    #     )

    # -----------------------------------------------------
    # CLEAN TEXT
    # -----------------------------------------------------

    clean_content = (
        content.strip()
        if content
        else ""
    )

    media_url = None
    media_type = None

    # =====================================================
    # FILE UPLOAD
    # =====================================================

    if file:

        # -------------------------------------------------
        # CONTENT TYPE
        # -------------------------------------------------

        if not file.content_type:

            raise HTTPException(
                status_code=400,
                detail="Invalid file.",
            )

        # -------------------------------------------------
        # IMAGE ONLY
        # -------------------------------------------------

        if not file.content_type.startswith(
            "image/"
        ):

            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed.",
            )

        # -------------------------------------------------
        # READ FILE
        # -------------------------------------------------

        file_bytes = await file.read()

        # -------------------------------------------------
        # MAX SIZE = 10 MB
        # -------------------------------------------------

        max_size = (
            10 * 1024 * 1024
        )

        if len(file_bytes) > max_size:

            raise HTTPException(
                status_code=400,
                detail="Image must be 10 MB or smaller.",
            )

        # -------------------------------------------------
        # UPLOAD DIRECTORY
        # -------------------------------------------------

        upload_dir = (
            Path(__file__)
            .resolve()
            .parents[2]
            / "frontend"
            / "static"
            / "uploads"
            / "chat"
        )

        upload_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        # -------------------------------------------------
        # EXTENSION
        # -------------------------------------------------

        extension = (
            Path(
                file.filename or ""
            ).suffix.lower()
        )

        allowed_extensions = {
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
        }

        if extension not in allowed_extensions:

            extension = ".jpg"

        # -------------------------------------------------
        # UNIQUE FILE NAME
        # -------------------------------------------------

        filename = (
            uuid.uuid4().hex
            + extension
        )

        file_path = (
            upload_dir
            / filename
        )

        # -------------------------------------------------
        # SAVE FILE
        # -----------------------------------------------------

        with open(
            file_path,
            "wb",
        ) as buffer:

            buffer.write(
                file_bytes
            )

        # -------------------------------------------------
        # PUBLIC URL
        # -------------------------------------------------

        media_url = (
            "/static/uploads/chat/"
            + filename
        )

        media_type = "image"

    # =====================================================
    # EMPTY MESSAGE CHECK
    # =====================================================

    if (
        not clean_content
        and not media_url
    ):

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    # =====================================================
    # CREATE MESSAGE
    # =====================================================

    message = ChatMessage(

        sender_id=current_user.id,

        receiver_id=receiver.id,

        content=(
            clean_content
            if clean_content
            else None
        ),

        media_url=media_url,

        media_type=media_type,

        is_read=0,

        is_deleted=0,

        created_at=utc_now(),
    )

    # -----------------------------------------------------
    # SAVE
    # -----------------------------------------------------

    db.add(message)

    db.commit()

    db.refresh(message)

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "message":
            serialize_message(
                message
            ),
    }


# =========================================================
# MARK CHAT AS READ
# =========================================================
#
# POST /api/chat/{user_id}/read
#
# =========================================================

@router.post(
    "/{user_id}/read"
)
def mark_chat_read(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # CURRENT USER
    # -----------------------------------------------------

    current_user = get_current_user(
        request=request,
        db=db,
    )

    # -----------------------------------------------------
    # CHAT USER
    # -----------------------------------------------------

    chat_user = find_user(
        db=db,
        user_identifier=user_id,
    )

    if chat_user is None:

        raise HTTPException(
            status_code=404,
            detail="Chat user not found.",
        )

    # -----------------------------------------------------
    # FIND UNREAD
    # -----------------------------------------------------

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.sender_id
            == chat_user.id
        )
        .filter(
            ChatMessage.receiver_id
            == current_user.id
        )
        .filter(
            ChatMessage.is_read == 0
        )
        .filter(
            ChatMessage.is_deleted == 0
        )
        .all()
    )

    # -----------------------------------------------------
    # MARK READ
    # -----------------------------------------------------

    for message in messages:

        message.is_read = 1

    db.commit()

    return {
        "success": True,
        "marked_read": len(
            messages
        ),
    }


# =========================================================
# DELETE MESSAGE
# =========================================================
#
# POST /api/chat/message/{message_id}/delete
#
# =========================================================

@router.post(
    "/message/{message_id}/delete"
)
def delete_message(
    message_id: int,
    request: Request,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # CURRENT USER
    # -----------------------------------------------------

    current_user = get_current_user(
        request=request,
        db=db,
    )

    # -----------------------------------------------------
    # MESSAGE
    # -----------------------------------------------------

    message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id
            == message_id
        )
        .first()
    )

    if message is None:

        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    # -----------------------------------------------------
    # ONLY SENDER CAN DELETE
    # -----------------------------------------------------

    if (
        message.sender_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail="You cannot delete this message.",
        )

    # -----------------------------------------------------
    # SOFT DELETE
    # -----------------------------------------------------

    message.is_deleted = 1

    db.commit()

    return {
        "success": True,
        "message": "Message deleted.",
    }
