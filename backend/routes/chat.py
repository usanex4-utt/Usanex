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
)


router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


SESSION_COOKIE_NAME = "usanex_session"


# =========================================================
# DATABASE
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
    session_token = request.cookies.get(
        SESSION_COOKIE_NAME
    )

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated.",
        )

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token
            == session_token
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Invalid session.",
        )

    expires_at = session.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if datetime.now(timezone.utc) >= expires_at:

        db.delete(session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Session expired.",
        )

    user = (
        db.query(User)
        .filter(
            User.id == session.user_id
        )
        .first()
    )

    if not user:

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
    identifier: str,
):

    user = (
        db.query(User)
        .filter(
            User.user_id == identifier
        )
        .first()
    )

    if user:
        return user

    try:
        numeric_id = int(identifier)

        return (
            db.query(User)
            .filter(
                User.id == numeric_id
            )
            .first()
        )

    except (
        ValueError,
        TypeError,
    ):
        return None


# =========================================================
# SERIALIZE USER
# =========================================================

def serialize_user(user):

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

def serialize_message(message):

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
# CHAT HEALTH
# =========================================================

@router.get("/health/status")
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

@router.get("/{user_id}")
def get_chat(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user(
        request,
        db,
    )

    chat_user = find_user(
        db,
        user_id,
    )

    if not chat_user:

        raise HTTPException(
            status_code=404,
            detail="Chat user not found.",
        )

    if chat_user.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot chat with yourself.",
        )

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

    # Mark received messages as read

    unread = (
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

    for message in unread:
        message.is_read = 1

    if unread:
        db.commit()

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

@router.post("/send")
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

    current_user = get_current_user(
        request,
        db,
    )

    receiver = find_user(
        db,
        receiver_id,
    )

    if not receiver:

        raise HTTPException(
            status_code=404,
            detail="Receiver not found.",
        )

    if receiver.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot message yourself.",
        )

    clean_content = (
        content.strip()
        if content
        else ""
    )

    media_url = None
    media_type = None

    # =====================================================
    # HD IMAGE UPLOAD
    # =====================================================

    if file:

        content_type = (
            file.content_type or ""
        ).lower()

        if not content_type.startswith(
            "image/"
        ):

            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed.",
            )

        # -------------------------------------------------
        # 25 MB MAXIMUM
        #
        # Original image is NOT resized.
        # Original quality is preserved.
        # -------------------------------------------------

        max_size = (
            25 * 1024 * 1024
        )

        file_bytes = await file.read()

        if len(file_bytes) > max_size:

            raise HTTPException(
                status_code=400,
                detail="Image must be 25 MB or smaller.",
            )

        # -------------------------------------------------
        # SAFE EXTENSION
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
            ".webp",
            ".gif",
        }

        if extension not in allowed_extensions:

            raise HTTPException(
                status_code=400,
                detail="Unsupported image format.",
            )

        # -------------------------------------------------
        # DIRECTORY
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
        # UNIQUE NAME
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
        # ORIGINAL FILE SAVE
        # -------------------------------------------------

        with open(
            file_path,
            "wb",
        ) as output:

            output.write(
                file_bytes
            )

        media_url = (
            "/static/uploads/chat/"
            + filename
        )

        media_type = "image"

    # =====================================================
    # EMPTY MESSAGE
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
    # DATABASE MESSAGE
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

    db.add(message)

    db.commit()

    db.refresh(message)

    return {
        "success": True,

        "message":
            serialize_message(
                message
            ),
    }


# =========================================================
# MARK READ
# =========================================================

@router.post("/{user_id}/read")
def mark_chat_read(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user(
        request,
        db,
    )

    chat_user = find_user(
        db,
        user_id,
    )

    if not chat_user:

        raise HTTPException(
            status_code=404,
            detail="Chat user not found.",
        )

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

    for message in messages:
        message.is_read = 1

    db.commit()

    return {
        "success": True,
        "marked_read": len(messages),
    }


# =========================================================
# DELETE MESSAGE
# =========================================================

@router.post(
    "/message/{message_id}/delete"
)
def delete_message(
    message_id: int,
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user(
        request,
        db,
    )

    message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id
            == message_id
        )
        .first()
    )

    if not message:

        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    if (
        message.sender_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail="You cannot delete this message.",
        )

    message.is_deleted = 1

    db.commit()

    return {
        "success": True,
        "message": "Message deleted.",
    }
