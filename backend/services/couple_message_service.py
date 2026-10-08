
# =========================================================
# USANEX — COUPLE MESSAGE SERVICE
# backend/services/couple_message_service.py
# =========================================================

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from ..database.couple_models import (
    CoupleMessage,
    CoupleMessageReceipt,
    CoupleRoom,
    utcnow,
)


# =========================================================
# ROOM
# =========================================================

def get_or_create_couple_room(
    db: Session,
    user_one_id: int,
    user_two_id: int,
) -> CoupleRoom:

    if user_one_id == user_two_id:
        raise ValueError(
            "A Couple Chat room requires two different users."
        )

    # Keep user order consistent.
    first_id = min(user_one_id, user_two_id)
    second_id = max(user_one_id, user_two_id)

    room = (
        db.query(CoupleRoom)
        .filter(
            CoupleRoom.user_one_id == first_id,
            CoupleRoom.user_two_id == second_id,
        )
        .first()
    )

    if room:
        if not room.is_active:
            room.is_active = True
            room.updated_at = utcnow()

            db.commit()
            db.refresh(room)

        return room

    room = CoupleRoom(
        user_one_id=first_id,
        user_two_id=second_id,
        is_active=True,
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    return room


# =========================================================
# GET ROOM
# =========================================================

def get_couple_room(
    db: Session,
    user_one_id: int,
    user_two_id: int,
) -> Optional[CoupleRoom]:

    first_id = min(user_one_id, user_two_id)
    second_id = max(user_one_id, user_two_id)

    return (
        db.query(CoupleRoom)
        .filter(
            CoupleRoom.user_one_id == first_id,
            CoupleRoom.user_two_id == second_id,
            CoupleRoom.is_active.is_(True),
        )
        .first()
    )


# =========================================================
# CREATE MESSAGE
# =========================================================

def create_couple_message(
    db: Session,
    room_id: int,
    sender_id: int,
    receiver_id: int,
    content: Optional[str] = None,
    media_url: Optional[str] = None,
    media_type: Optional[str] = None,
    message_type: str = "text",
    reply_to_message_id: Optional[int] = None,
    ai_mode: Optional[str] = None,
    ai_emotion: Optional[str] = None,
    ai_intent: Optional[str] = None,
    ai_intensity: Optional[float] = None,
    ai_theme: Optional[str] = None,
) -> CoupleMessage:

    if sender_id == receiver_id:
        raise ValueError(
            "Sender and receiver cannot be the same user."
        )

    if not content and not media_url:
        raise ValueError(
            "Message cannot be empty."
        )

    if content is not None:
        content = str(content).strip()

        if not content:
            content = None

        if content and len(content) > 4000:
            raise ValueError(
                "Message is too long."
            )

    message = CoupleMessage(
        room_id=room_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        media_url=media_url,
        media_type=media_type,
        message_type=message_type or "text",
        reply_to_message_id=reply_to_message_id,
        ai_mode=ai_mode,
        ai_emotion=ai_emotion,
        ai_intent=ai_intent,
        ai_intensity=ai_intensity,
        ai_theme=ai_theme,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


# =========================================================
# GET MESSAGE
# =========================================================

def get_message(
    db: Session,
    message_id: int,
) -> Optional[CoupleMessage]:

    return (
        db.query(CoupleMessage)
        .filter(
            CoupleMessage.id == message_id,
            CoupleMessage.is_deleted.is_(False),
        )
        .first()
    )


# =========================================================
# MESSAGE HISTORY
# =========================================================

def get_couple_messages(
    db: Session,
    room_id: int,
    limit: int = 50,
    before_message_id: Optional[int] = None,
) -> list[CoupleMessage]:

    limit = max(
        1,
        min(limit, 100),
    )

    query = (
        db.query(CoupleMessage)
        .filter(
            CoupleMessage.room_id == room_id,
            CoupleMessage.is_deleted.is_(False),
        )
    )

    if before_message_id is not None:

        query = query.filter(
            CoupleMessage.id < before_message_id
        )

    messages = (
        query
        .order_by(
            CoupleMessage.id.desc()
        )
        .limit(limit)
        .all()
    )

    messages.reverse()

    return messages


# =========================================================
# CREATE / GET RECEIPT
# =========================================================

def get_or_create_receipt(
    db: Session,
    message_id: int,
    receiver_id: int,
) -> CoupleMessageReceipt:

    receipt = (
        db.query(CoupleMessageReceipt)
        .filter(
            CoupleMessageReceipt.message_id == message_id,
            CoupleMessageReceipt.receiver_id == receiver_id,
        )
        .first()
    )

    if receipt:
        return receipt

    receipt = CoupleMessageReceipt(
        message_id=message_id,
        receiver_id=receiver_id,
        delivered=False,
        seen=False,
    )

    db.add(receipt)
    db.commit()
    db.refresh(receipt)

    return receipt


# =========================================================
# MARK DELIVERED
# =========================================================

def mark_message_delivered(
    db: Session,
    message_id: int,
    receiver_id: int,
) -> Optional[CoupleMessageReceipt]:

    receipt = get_or_create_receipt(
        db=db,
        message_id=message_id,
        receiver_id=receiver_id,
    )

    if not receipt.delivered:

        receipt.delivered = True
        receipt.delivered_at = utcnow()
        receipt.updated_at = utcnow()

        db.commit()
        db.refresh(receipt)

    return receipt


# =========================================================
# MARK SEEN
# =========================================================

def mark_message_seen(
    db: Session,
    message_id: int,
    receiver_id: int,
) -> Optional[CoupleMessageReceipt]:

    receipt = get_or_create_receipt(
        db=db,
        message_id=message_id,
        receiver_id=receiver_id,
    )

    if not receipt.delivered:

        receipt.delivered = True
        receipt.delivered_at = utcnow()

    if not receipt.seen:

        receipt.seen = True
        receipt.seen_at = utcnow()

    receipt.updated_at = utcnow()

    db.commit()
    db.refresh(receipt)

    return receipt


# =========================================================
# DELETE MESSAGE
# =========================================================

def soft_delete_message(
    db: Session,
    message_id: int,
    user_id: int,
) -> Optional[CoupleMessage]:

    message = (
        db.query(CoupleMessage)
        .filter(
            CoupleMessage.id == message_id,
            CoupleMessage.is_deleted.is_(False),
        )
        .first()
    )

    if message is None:
        return None

    if (
        message.sender_id != user_id
        and message.receiver_id != user_id
    ):
        return None

    message.is_deleted = True
    message.updated_at = utcnow()

    db.commit()
    db.refresh(message)

    return message


# =========================================================
# EDIT MESSAGE
# =========================================================

def edit_couple_message(
    db: Session,
    message_id: int,
    user_id: int,
    content: str,
) -> Optional[CoupleMessage]:

    message = (
        db.query(CoupleMessage)
        .filter(
            CoupleMessage.id == message_id,
            CoupleMessage.is_deleted.is_(False),
        )
        .first()
    )

    if message is None:
        return None

    if message.sender_id != user_id:
        return None

    content = str(content).strip()

    if not content:
        raise ValueError(
            "Message cannot be empty."
        )

    if len(content) > 4000:
        raise ValueError(
            "Message is too long."
        )

    message.content = content
    message.is_edited = True
    message.updated_at = utcnow()

    db.commit()
    db.refresh(message)

    return message


# =========================================================
# SERIALIZE MESSAGE
# =========================================================

def serialize_message(
    message: CoupleMessage,
) -> dict:

    return {
        "id": message.id,
        "room_id": message.room_id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "content": message.content,
        "media_url": message.media_url,
        "media_type": message.media_type,
        "message_type": message.message_type,
        "reply_to_message_id": message.reply_to_message_id,
        "is_deleted": message.is_deleted,
        "is_edited": message.is_edited,
        "ai_mode": message.ai_mode,
        "ai_emotion": message.ai_emotion,
        "ai_intent": message.ai_intent,
        "ai_intensity": message.ai_intensity,
        "ai_theme": message.ai_theme,
        "created_at": (
            message.created_at.isoformat()
            if message.created_at
            else None
        ),
        "updated_at": (
            message.updated_at.isoformat()
            if message.updated_at
            else None
        ),
    }


# =========================================================
# SERIALIZE RECEIPT
# =========================================================

def serialize_receipt(
    receipt: CoupleMessageReceipt,
) -> dict:

    if receipt.seen:
        status = "seen"

    elif receipt.delivered:
        status = "delivered"

    else:
        status = "sent"

    return {
        "message_id": receipt.message_id,
        "receiver_id": receipt.receiver_id,
        "delivered": receipt.delivered,
        "delivered_at": (
            receipt.delivered_at.isoformat()
            if receipt.delivered_at
            else None
        ),
        "seen": receipt.seen,
        "seen_at": (
            receipt.seen_at.isoformat()
            if receipt.seen_at
            else None
        ),
        "status": status,
        "created_at": (
            receipt.created_at.isoformat()
            if receipt.created_at
            else None
        ),
        "updated_at": (
            receipt.updated_at.isoformat()
            if receipt.updated_at
            else None
        ),
    }
