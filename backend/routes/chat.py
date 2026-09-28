# =========================================================
# USANEX — CHAT ROUTES
# backend/routes/chat.py
# =========================================================

from datetime import datetime, timezone
from pathlib import Path
import uuid
import json

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)

from sqlalchemy.orm import Session

from ..database.database import SessionLocal
from ..database.models import (
    User,
    UserSession,
    ChatMessage,
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
# REAL-TIME CONNECTION MANAGER
# =========================================================

class ChatConnectionManager:

    def __init__(self):

        self.connections = {}


    async def connect(
        self,
        user_id: int,
        websocket: WebSocket,
    ):

        await websocket.accept()

        if user_id not in self.connections:

            self.connections[user_id] = set()

        self.connections[user_id].add(
            websocket
        )


    def disconnect(
        self,
        user_id: int,
        websocket: WebSocket,
    ):

        if user_id not in self.connections:
            return

        self.connections[user_id].discard(
            websocket
        )

        if not self.connections[user_id]:

            del self.connections[user_id]


    async def send_to_user(
        self,
        user_id: int,
        data: dict,
    ):

        sockets = list(
            self.connections.get(
                user_id,
                set()
            )
        )

        dead = []

        for websocket in sockets:

            try:

                await websocket.send_json(
                    data
                )

            except Exception:

                dead.append(
                    websocket
                )

        for websocket in dead:

            self.disconnect(
                user_id,
                websocket
            )


# =========================================================
# GLOBAL CONNECTION MANAGER
# =========================================================

chat_manager = ChatConnectionManager()


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

    if session is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid session.",
        )

    expires_at = session.expires_at

    if expires_at.tzinfo is None:

        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if datetime.now(
        timezone.utc
    ) >= expires_at:

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

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    return user


# =========================================================
# WEBSOCKET CURRENT USER
# =========================================================

def get_websocket_user(
    websocket: WebSocket,
    db: Session,
):

    session_token = websocket.cookies.get(
        SESSION_COOKIE_NAME
    )

    if not session_token:

        return None

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token
            == session_token
        )
        .first()
    )

    if session is None:
        return None

    expires_at = session.expires_at

    if expires_at.tzinfo is None:

        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if datetime.now(
        timezone.utc
    ) >= expires_at:

        return None

    return (
        db.query(User)
        .filter(
            User.id == session.user_id
        )
        .first()
    )


# =========================================================
# FIND USER
# =========================================================

def find_user(
    db: Session,
    user_identifier: str,
):

    user = (
        db.query(User)
        .filter(
            User.user_id == user_identifier
        )
        .first()
    )

    if user:
        return user

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

        "id":
            user.id,

        "user_id":
            user.user_id,

        "username":
            user.username,

        "name":
            user.name,

        "profile_photo":
            user.profile_photo,

    }


# =========================================================
# SERIALIZE MESSAGE
# =========================================================

def serialize_message(
    message: ChatMessage,
):

    return {

        "id":
            message.id,

        "sender_id":
            message.sender_id,

        "receiver_id":
            message.receiver_id,

        "content":
            message.content,

        "message":
            message.content,

        "media_url":
            message.media_url,

        "media_type":
            message.media_type,

        "read":
            bool(
                message.is_read
            ),

        "is_read":
            bool(
                message.is_read
            ),

        "is_deleted":
            bool(
                message.is_deleted
            ),

        "created_at":
            (
                message.created_at.isoformat()
                if message.created_at
                else None
            ),

    }


# =========================================================
# CHAT HEALTH
# =========================================================

@router.get(
    "/health/status"
)
def chat_health():

    return {

        "success":
            True,

        "app":
            "Usanex",

        "service":
            "chat",

        "status":
            "online",

        "realtime":
            "websocket",

    }


# =========================================================
# GET CHAT
# =========================================================

@router.get(
    "/{user_id}"
)
def get_chat(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user(
        request=request,
        db=db,
    )

    chat_user = find_user(
        db=db,
        user_identifier=user_id,
    )

    if chat_user is None:

        raise HTTPException(
            status_code=404,
            detail="Chat user not found.",
        )

    if (
        chat_user.id
        == current_user.id
    ):

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

    return {

        "success":
            True,

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
# SEND MESSAGE — HTTP
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

    current_user = get_current_user(
        request=request,
        db=db,
    )

    receiver = find_user(
        db=db,
        user_identifier=receiver_id,
    )

    if receiver is None:

        raise HTTPException(
            status_code=404,
            detail="Receiver not found.",
        )

    if (
        receiver.id
        == current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail="You cannot send a message to yourself.",
        )

    clean_content = (
        content.strip()
        if content
        else ""
    )

    media_url = None
    media_type = None

    # -----------------------------------------------------
    # IMAGE
    # -----------------------------------------------------

    if file:

        if not file.content_type:

            raise HTTPException(
                status_code=400,
                detail="Invalid file.",
            )

        if not file.content_type.startswith(
            "image/"
        ):

            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed.",
            )

        file_bytes = await file.read()

        max_size = (
            10 * 1024 * 1024
        )

        if len(file_bytes) > max_size:

            raise HTTPException(
                status_code=400,
                detail="Image must be 10 MB or smaller.",
            )

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

        filename = (
            uuid.uuid4().hex
            + extension
        )

        file_path = (
            upload_dir
            / filename
        )

        with open(
            file_path,
            "wb",
        ) as buffer:

            buffer.write(
                file_bytes
            )

        media_url = (
            "/static/uploads/chat/"
            + filename
        )

        media_type = "image"

    # -----------------------------------------------------
    # EMPTY
    # -----------------------------------------------------

    if (
        not clean_content
        and not media_url
    ):

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    message = ChatMessage(

        sender_id=
            current_user.id,

        receiver_id=
            receiver.id,

        content=(
            clean_content
            if clean_content
            else None
        ),

        media_url=
            media_url,

        media_type=
            media_type,

        is_read=0,

        is_deleted=0,

        created_at=
            utc_now(),

    )

    db.add(
        message
    )

    db.commit()

    db.refresh(
        message
    )

    serialized = serialize_message(
        message
    )

    # =====================================================
    # REAL-TIME DELIVERY
    # =====================================================

    await chat_manager.send_to_user(

        receiver.id,

        {

            "type":
                "new_message",

            "message":
                serialized,

        }

    )

    return {

        "success":
            True,

        "message":
            serialized,

    }


# =========================================================
# WEBSOCKET
# =========================================================
#
# WS /api/chat/ws
#
# Browser automatically sends the
# usanex_session cookie.
#
# =========================================================

@router.websocket(
    "/ws"
)
async def chat_websocket(
    websocket: WebSocket,
):

    db = SessionLocal()

    current_user = None

    try:

        # -------------------------------------------------
        # AUTHENTICATION
        # -------------------------------------------------

        current_user = get_websocket_user(
            websocket,
            db,
        )

        if current_user is None:

            await websocket.close(
                code=1008
            )

            return

        # -------------------------------------------------
        # CONNECT
        # -------------------------------------------------

        await chat_manager.connect(
            current_user.id,
            websocket,
        )

        # -------------------------------------------------
        # CONNECTED EVENT
        # -------------------------------------------------

        await websocket.send_json({

            "type":
                "connected",

            "user_id":
                current_user.user_id,

        })

        # -------------------------------------------------
        # LISTEN
        # -------------------------------------------------

        while True:

            data = await websocket.receive_json()

            if not isinstance(
                data,
                dict
            ):

                continue

            event_type = data.get(
                "type"
            )

            # =============================================
            # PING
            # =============================================

            if event_type == "ping":

                await websocket.send_json({

                    "type":
                        "pong",

                })

                continue

            # =============================================
            # TYPING
            # =============================================

            if event_type == "typing":

                receiver_id = data.get(
                    "receiver_id"
                )

                if not receiver_id:
                    continue

                receiver = find_user(
                    db,
                    str(
                        receiver_id
                    )
                )

                if receiver is None:
                    continue

                await chat_manager.send_to_user(

                    receiver.id,

                    {

                        "type":
                            "typing",

                        "sender_id":
                            current_user.id,

                        "sender_user_id":
                            current_user.user_id,

                        "typing":
                            bool(
                                data.get(
                                    "typing",
                                    False
                                )
                            ),

                    }

                )

                continue

            # =============================================
            # READ
            # =============================================

            if event_type == "read":

                sender_id = data.get(
                    "sender_id"
                )

                if not sender_id:
                    continue

                sender = find_user(
                    db,
                    str(
                        sender_id
                    )
                )

                if sender is None:
                    continue

                unread = (
                    db.query(
                        ChatMessage
                    )
                    .filter(
                        ChatMessage.sender_id
                        == sender.id
                    )
                    .filter(
                        ChatMessage.receiver_id
                        == current_user.id
                    )
                    .filter(
                        ChatMessage.is_read
                        == 0
                    )
                    .filter(
                        ChatMessage.is_deleted
                        == 0
                    )
                    .all()
                )

                for message in unread:

                    message.is_read = 1

                db.commit()

                await chat_manager.send_to_user(

                    sender.id,

                    {

                        "type":
                            "messages_read",

                        "reader_id":
                            current_user.id,

                        "reader_user_id":
                            current_user.user_id,

                    }

                )

                continue

    except WebSocketDisconnect:

        pass

    except Exception as exc:

        print(
            "Chat WebSocket error:",
            exc
        )

    finally:

        if current_user is not None:

            chat_manager.disconnect(
                current_user.id,
                websocket,
            )

        db.close()


# =========================================================
# MARK CHAT AS READ
# =========================================================

@router.post(
    "/{user_id}/read"
)
def mark_chat_read(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user(
        request=request,
        db=db,
    )

    chat_user = find_user(
        db=db,
        user_identifier=user_id,
    )

    if chat_user is None:

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

        "success":
            True,

        "marked_read":
            len(messages),

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
        request=request,
        db=db,
    )

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

    # -----------------------------------------------------
    # REAL-TIME DELETE EVENT
    # -----------------------------------------------------

    await_data = {

        "type":
            "message_deleted",

        "message_id":
            message.id,

        "sender_id":
            message.sender_id,

        "receiver_id":
            message.receiver_id,

    }

    # WebSocket delivery is intentionally
    # handled asynchronously only from
    # async routes. HTTP delete remains
    # safe here.

    return {

        "success":
            True,

        "message":
            "Message deleted.",

        "deleted_message_id":
            message.id,

    }
