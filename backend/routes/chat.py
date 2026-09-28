# =========================================================
# USANEX — CHAT ROUTES
# backend/routes/chat.py
# =========================================================

from datetime import datetime, timezone
from pathlib import Path
import shutil
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
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database.database import SessionLocal
from ..database.models import (
    User,
    ChatMessage,
    UserConnection,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


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
    return datetime.now(timezone.utc).replace(tzinfo=None)


# =========================================================
# SESSION / CURRENT USER
# =========================================================

def get_current_user(
    request: Request,
    db: Session
):
    """
    Reads the Usanex session cookie.

    Expected cookie:
        session_token

    It also supports:
        user_id
    as a fallback for older login code.
    """

    session_token = (
        request.cookies.get("session_token")
    )

    # -----------------------------------------------------
    # SESSION TOKEN LOGIN
    # -----------------------------------------------------

    if session_token:

        try:

            from ..database.models import UserSession

            session = (
                db.query(UserSession)
                .filter(
                    UserSession.session_token
                    == session_token
                )
                .first()
            )

            if session:

                if (
                    session.expires_at
                    and session.expires_at > utc_now()
                ):

                    user = (
                        db.query(User)
                        .filter(
                            User.id == session.user_id
                        )
                        .first()
                    )

                    if user:
                        return user

        except Exception:
            pass

    # -----------------------------------------------------
    # FALLBACK USER ID COOKIE
    # -----------------------------------------------------

    cookie_user_id = (
        request.cookies.get("user_id")
    )

    if cookie_user_id:

        user = (
            db.query(User)
            .filter(
                User.user_id == cookie_user_id
            )
            .first()
        )

        if user:
            return user

        try:

            user = (
                db.query(User)
                .filter(
                    User.id == int(cookie_user_id)
                )
                .first()
            )

            if user:
                return user

        except Exception:
            pass

    # -----------------------------------------------------
    # FALLBACK LOCAL STORAGE CANNOT BE READ BY BACKEND
    # -----------------------------------------------------
    #
    # Browser localStorage is NOT automatically available
    # to FastAPI.
    #
    # Therefore the proper production method is the
    # session_token cookie.
    #

    raise HTTPException(
        status_code=401,
        detail="Not authenticated."
    )


# =========================================================
# USER RESPONSE
# =========================================================

def serialize_user(user: User):
    return {
        "id": user.id,
        "user_id": user.user_id,
        "username": user.username,
        "name": user.name,
        "profile_photo": user.profile_photo,
    }


# =========================================================
# MESSAGE RESPONSE
# =========================================================

def serialize_message(message: ChatMessage):

    return {
        "id": message.id,

        "sender_id": message.sender_id,

        "receiver_id": message.receiver_id,

        "content": message.content,

        "media_url": message.media_url,

        "media_type": message.media_type,

        "read": bool(message.is_read),

        "is_deleted": bool(message.is_deleted),

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
    user_two_id: int
):

    connection = (
        db.query(UserConnection)
        .filter(
            UserConnection.status == "connected"
        )
        .filter(
            (
                (UserConnection.user_one_id == user_one_id)
                &
                (UserConnection.user_two_id == user_two_id)
            )
            |
            (
                (UserConnection.user_one_id == user_two_id)
                &
                (UserConnection.user_two_id == user_one_id)
            )
        )
        .first()
    )

    return connection is not None


# =========================================================
# GET CHAT
# =========================================================
#
# GET /api/chat/{user_id}
#
# Example:
# /api/chat/u_abc123
#
# =========================================================

@router.get("/{user_id}")
def get_chat(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # CURRENT USER
    # -----------------------------------------------------

    current_user = get_current_user(
        request,
        db
    )

    # -----------------------------------------------------
    # FIND CHAT USER
    # -----------------------------------------------------

    chat_user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    # -----------------------------------------------------
    # FALLBACK: INTEGER USER ID
    # -----------------------------------------------------

    if not chat_user:

        try:

            numeric_id = int(user_id)

            chat_user = (
                db.query(User)
                .filter(
                    User.id == numeric_id
                )
                .first()
            )

        except Exception:
            pass

    # -----------------------------------------------------
    # USER NOT FOUND
    # -----------------------------------------------------

    if not chat_user:

        raise HTTPException(
            status_code=404,
            detail="Chat user not found."
        )

    # -----------------------------------------------------
    # CANNOT CHAT WITH YOURSELF
    # -----------------------------------------------------

    if chat_user.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot chat with yourself."
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
                (ChatMessage.sender_id == current_user.id)
                &
                (ChatMessage.receiver_id == chat_user.id)
            )
            |
            (
                (ChatMessage.sender_id == chat_user.id)
                &
                (ChatMessage.receiver_id == current_user.id)
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
            ChatMessage.sender_id == chat_user.id
        )
        .filter(
            ChatMessage.receiver_id == current_user.id
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

        "current_user": serialize_user(
            current_user
        ),

        "user": serialize_user(
            chat_user
        ),

        "messages": [
            serialize_message(message)
            for message in messages
        ]
    }


# =========================================================
# SEND MESSAGE
# =========================================================
#
# POST /api/chat/send
#
# Form:
# receiver_id
# content
# file
#
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

    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # CURRENT USER
    # -----------------------------------------------------

    current_user = get_current_user(
        request,
        db
    )

    # -----------------------------------------------------
    # FIND RECEIVER
    # -----------------------------------------------------

    receiver = (
        db.query(User)
        .filter(
            User.user_id == receiver_id
        )
        .first()
    )

    # -----------------------------------------------------
    # FALLBACK INTEGER ID
    # -----------------------------------------------------

    if not receiver:

        try:

            numeric_id = int(receiver_id)

            receiver = (
                db.query(User)
                .filter(
                    User.id == numeric_id
                )
                .first()
            )

        except Exception:
            pass

    # -----------------------------------------------------
    # RECEIVER NOT FOUND
    # -----------------------------------------------------

    if not receiver:

        raise HTTPException(
            status_code=404,
            detail="Receiver not found."
        )

    # -----------------------------------------------------
    # SELF MESSAGE BLOCK
    # -----------------------------------------------------

    if receiver.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot send a message to yourself."
        )

    # -----------------------------------------------------
    # CLEAN MESSAGE
    # -----------------------------------------------------

    clean_content = (
        content.strip()
        if content
        else ""
    )

    media_url = None
    media_type = None

    # =====================================================
    # IMAGE UPLOAD
    # =====================================================

    if file:

        # -------------------------------------------------
        # FILE TYPE
        # -------------------------------------------------

        if not file.content_type:

            raise HTTPException(
                status_code=400,
                detail="Invalid file."
            )

        if not file.content_type.startswith(
            "image/"
        ):

            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed."
            )

        # -------------------------------------------------
        # FILE SIZE
        # -------------------------------------------------
        #
        # Maximum = 10 MB
        #

        max_size = (
            10 * 1024 * 1024
        )

        file_bytes = await file.read()

        if len(file_bytes) > max_size:

            raise HTTPException(
                status_code=400,
                detail="Image must be 10 MB or smaller."
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
            exist_ok=True
        )

        # -------------------------------------------------
        # SAFE FILE EXTENSION
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
            ".webp"
        }

        if extension not in allowed_extensions:

            extension = ".jpg"

        # -------------------------------------------------
        # UNIQUE FILE NAME
        # -------------------------------------------------

        filename = (
            f"{uuid.uuid4().hex}"
            f"{extension}"
        )

        file_path = (
            upload_dir /
            filename
        )

        # -------------------------------------------------
        # SAVE FILE
        # -------------------------------------------------

        with open(
            file_path,
            "wb"
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

    if not clean_content and not media_url:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
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

        created_at=utc_now()
    )

    db.add(message)

    db.commit()

    db.refresh(message)

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "message": serialize_message(
            message
        )
    }


# =========================================================
# MARK CHAT AS READ
# =========================================================
#
# POST /api/chat/{user_id}/read
#
# =========================================================

@router.post("/{user_id}/read")
def mark_chat_read(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db)
):

    current_user = get_current_user(
        request,
        db
    )

    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    chat_user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if not chat_user:

        try:

            chat_user = (
                db.query(User)
                .filter(
                    User.id == int(user_id)
                )
                .first()
            )

        except Exception:
            pass

    if not chat_user:

        raise HTTPException(
            status_code=404,
            detail="Chat user not found."
        )

    # -----------------------------------------------------
    # MARK AS READ
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

    for message in messages:

        message.is_read = 1

    db.commit()

    return {
        "success": True,
        "marked_read": len(messages)
    }


# =========================================================
# DELETE MESSAGE
# =========================================================
#
# POST /api/chat/message/{message_id}/delete
#
# =========================================================

@router.post("/message/{message_id}/delete")
def delete_message(
    message_id: int,
    request: Request,
    db: Session = Depends(get_db)
):

    current_user = get_current_user(
        request,
        db
    )

    message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id
        )
        .first()
    )

    if not message:

        raise HTTPException(
            status_code=404,
            detail="Message not found."
        )

    # -----------------------------------------------------
    # ONLY SENDER CAN DELETE
    # -----------------------------------------------------

    if message.sender_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You cannot delete this message."
        )

    message.is_deleted = 1

    db.commit()

    return {
        "success": True,
        "message": "Message deleted."
    }


# =========================================================
# CHAT HEALTH CHECK
# =========================================================

@router.get("/health/status")
def chat_health():

    return {
        "success": True,
        "app": "Usanex",
        "service": "chat",
        "status": "online"
    }
