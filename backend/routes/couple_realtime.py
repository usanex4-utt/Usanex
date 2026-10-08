# =========================================================
# USANEX — COUPLE REALTIME v2
# backend/routes/couple_realtime.py
# =========================================================

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)

from sqlalchemy.orm import Session

from ..database.database import SessionLocal
from ..database.models import User

from ..routes.auth import (
    SESSION_COOKIE_NAME,
    get_valid_session,
)

from ..services.couple_message_service import (
    get_or_create_couple_room,
    create_couple_message,
    get_couple_messages,
    get_message,
    mark_message_delivered,
    mark_message_seen,
    serialize_message,
    serialize_receipt,
)

from ..websocket.couple_manager import (
    couple_manager,
)


router = APIRouter(
    tags=["Couple Realtime"]
)


# =========================================================
# TIME
# =========================================================

def utc_now_iso():

    return datetime.now(
        timezone.utc
    ).isoformat()


# =========================================================
# USER
# =========================================================

def get_user(
    db: Session,
    user_id: int,
):

    return (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


# =========================================================
# CLIENT MESSAGE ID
# =========================================================

def get_client_message_id(data):

    return (
        data.get("client_message_id")
        or data.get("client_id")
        or data.get("message_id")
    )


# =========================================================
# WEBSOCKET
# =========================================================

@router.websocket(
    "/ws/couple/{partner_user_id}"
)
async def couple_realtime(
    websocket: WebSocket,
    partner_user_id: int,
):

    db = SessionLocal()

    current_user = None
    partner = None
    room = None

    try:

        # =================================================
        # AUTH
        # =================================================

        session_token = websocket.cookies.get(
            SESSION_COOKIE_NAME
        )

        session = get_valid_session(
            db=db,
            session_token=session_token,
        )

        if session is None:

            await websocket.close(
                code=1008,
                reason="Authentication required",
            )

            return

        # =================================================
        # CURRENT USER
        # =================================================

        current_user = get_user(
            db=db,
            user_id=session.user_id,
        )

        if current_user is None:

            await websocket.close(
                code=1008,
                reason="User not found",
            )

            return

        # =================================================
        # PARTNER
        # =================================================

        partner = get_user(
            db=db,
            user_id=partner_user_id,
        )

        if partner is None:

            await websocket.close(
                code=1008,
                reason="Partner not found",
            )

            return

        if current_user.id == partner.id:

            await websocket.close(
                code=1008,
                reason="Cannot chat with yourself",
            )

            return

        # =================================================
        # ROOM
        # =================================================

        room = get_or_create_couple_room(
            db=db,
            user_one_id=current_user.id,
            user_two_id=partner.id,
        )

        # =================================================
        # CONNECT
        # =================================================

        await couple_manager.connect(
            user_id=current_user.id,
            websocket=websocket,
        )

        # =================================================
        # CONNECTED EVENT
        # =================================================

        await websocket.send_json({

            "type": "connected",

            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "name": current_user.name,
            },

            "partner": {
                "id": partner.id,
                "username": partner.username,
                "name": partner.name,
            },

            "room": {
                "id": room.id,
            },

            "room_id": room.id,

            "partner_online":
                couple_manager.is_online(
                    partner.id
                ),

            "timestamp":
                utc_now_iso(),

        })

        # =================================================
        # MESSAGE HISTORY
        # =================================================

        messages = get_couple_messages(
            db=db,
            room_id=room.id,
            limit=50,
        )

        await websocket.send_json({

            "type": "message_history",

            "room_id": room.id,

            "messages": [
                serialize_message(message)
                for message in messages
            ],

            "timestamp":
                utc_now_iso(),

        })

        # =================================================
        # ONLINE PRESENCE
        # =================================================

        await couple_manager.send_presence(

            receiver_id=partner.id,

            user_id=current_user.id,

            is_online=True,

            last_seen=None,

        )

        # =================================================
        # EVENT LOOP
        # =================================================

        while True:

            raw_data = await websocket.receive_text()

            try:

                data = json.loads(
                    raw_data
                )

            except json.JSONDecodeError:

                await websocket.send_json({

                    "type": "error",

                    "message":
                        "Invalid JSON",

                })

                continue

            if not isinstance(data, dict):

                await websocket.send_json({

                    "type": "error",

                    "message":
                        "Invalid event",

                })

                continue

            event_type = data.get(
                "type"
            )

            if not event_type:

                await websocket.send_json({

                    "type": "error",

                    "message":
                        "Event type is required",

                })

                continue

            # =================================================
            # TYPING START
            # =================================================

            if event_type == "typing_start":

                await couple_manager.send_typing(

                    sender_id=current_user.id,

                    receiver_id=partner.id,

                    is_typing=True,

                )

                continue

            # =================================================
            # TYPING STOP
            # =================================================

            if event_type == "typing_stop":

                await couple_manager.send_typing(

                    sender_id=current_user.id,

                    receiver_id=partner.id,

                    is_typing=False,

                )

                continue

            # =================================================
            # NEW MESSAGE
            # =================================================

            if event_type == "message":

                # ---------------------------------------------
                # IMPORTANT:
                # Accept all frontend client ID formats
                # ---------------------------------------------

                client_message_id = (
                    data.get("client_message_id")
                    or data.get("client_id")
                    or data.get("message_id")
                )

                content = data.get(
                    "content"
                )

                media_url = data.get(
                    "media_url"
                )

                media_type = data.get(
                    "media_type"
                )

                message_type = data.get(
                    "message_type",
                    "text",
                )

                reply_to_message_id = data.get(
                    "reply_to_message_id"
                )

                # ---------------------------------------------
                # VALIDATION
                # ---------------------------------------------

                if not content and not media_url:

                    await websocket.send_json({

                        "type": "error",

                        "message":
                            "Message cannot be empty",

                        "client_message_id":
                            client_message_id,

                    })

                    continue

                if content is not None:

                    content = str(
                        content
                    ).strip()

                    if not content:
                        content = None

                    if (
                        content
                        and len(content) > 4000
                    ):

                        await websocket.send_json({

                            "type": "error",

                            "message":
                                "Message is too long",

                            "client_message_id":
                                client_message_id,

                        })

                        continue

                # ---------------------------------------------
                # SAVE
                # ---------------------------------------------

                message = create_couple_message(

                    db=db,

                    room_id=room.id,

                    sender_id=current_user.id,

                    receiver_id=partner.id,

                    content=content,

                    media_url=media_url,

                    media_type=media_type,

                    message_type=message_type,

                    reply_to_message_id=
                        reply_to_message_id,

                )

                # ---------------------------------------------
                # SERVER MESSAGE
                # ---------------------------------------------

                message_payload = {

                    "type": "message",

                    "message_id":
                        message.id,

                    "client_message_id":
                        client_message_id,

                    "room_id":
                        room.id,

                    "sender_id":
                        message.sender_id,

                    "receiver_id":
                        message.receiver_id,

                    "content":
                        message.content,

                    "media_url":
                        message.media_url,

                    "media_type":
                        message.media_type,

                    "message_type":
                        message.message_type,

                    "timestamp":
                        message.created_at.isoformat(),

                }

                # =================================================
                # SEND MESSAGE TO PARTNER
                # =================================================

                delivered = (
                    await couple_manager.send_to_user(

                        user_id=partner.id,

                        event=message_payload,

                    )
                )

                # =================================================
                # ALSO SEND SERVER MESSAGE BACK TO SENDER
                #
                # This is important for optimistic-message
                # reconciliation.
                # =================================================

                await websocket.send_json(
                    message_payload
                )

                # =================================================
                # DELIVERY RECEIPT
                # =================================================

                if delivered:

                    receipt = (
                        mark_message_delivered(

                            db=db,

                            message_id=message.id,

                            receiver_id=
                                partner.id,

                        )
                    )

                    if receipt:

                        receipt_payload = (
                            serialize_receipt(
                                receipt
                            )
                        )

                        receipt_payload[
                            "type"
                        ] = "message_receipt"

                        receipt_payload[
                            "client_message_id"
                        ] = client_message_id

                        receipt_payload[
                            "message_id"
                        ] = message.id

                        receipt_payload[
                            "status"
                        ] = "delivered"

                        await websocket.send_json(
                            receipt_payload
                        )

                else:

                    await websocket.send_json({

                        "type":
                            "message_receipt",

                        "message_id":
                            message.id,

                        "client_message_id":
                            client_message_id,

                        "status":
                            "sent",

                        "timestamp":
                            utc_now_iso(),

                    })

                continue

            # =================================================
            # MESSAGE DELIVERED
            # =================================================

            if event_type == "message_delivered":

                message_id = data.get(
                    "message_id"
                )

                if not message_id:
                    continue

                try:
                    message_id = int(
                        message_id
                    )
                except (
                    TypeError,
                    ValueError
                ):
                    continue

                receipt = (
                    mark_message_delivered(

                        db=db,

                        message_id=message_id,

                        receiver_id=
                            current_user.id,

                    )
                )

                if receipt:

                    # -----------------------------------------
                    # Get original message
                    # -----------------------------------------

                    original_message = get_message(
                        db=db,
                        message_id=message_id,
                    )

                    client_message_id = None

                    if original_message:

                        # If service/model supports it
                        client_message_id = getattr(
                            original_message,
                            "client_message_id",
                            None,
                        )

                    await couple_manager.send_to_user(

                        user_id=partner.id,

                        event={

                            "type":
                                "message_receipt",

                            "message_id":
                                message_id,

                            "client_message_id":
                                client_message_id,

                            "status":
                                "delivered",

                            "timestamp":
                                utc_now_iso(),

                        },

                    )

                continue

            # =================================================
            # MESSAGE READ
            # =================================================

            if event_type == "message_read":

                message_id = data.get(
                    "message_id"
                )

                if not message_id:
                    continue

                try:
                    message_id = int(
                        message_id
                    )
                except (
                    TypeError,
                    ValueError
                ):
                    continue

                receipt = (
                    mark_message_seen(

                        db=db,

                        message_id=message_id,

                        receiver_id=
                            current_user.id,

                    )
                )

                if receipt:

                    original_message = get_message(
                        db=db,
                        message_id=message_id,
                    )

                    client_message_id = None

                    if original_message:

                        client_message_id = getattr(
                            original_message,
                            "client_message_id",
                            None,
                        )

                    await couple_manager.send_to_user(

                        user_id=partner.id,

                        event={

                            "type":
                                "message_receipt",

                            "message_id":
                                message_id,

                            "client_message_id":
                                client_message_id,

                            "status":
                                "seen",

                            "timestamp":
                                utc_now_iso(),

                        },

                    )

                continue

            # =================================================
            # PING
            # =================================================

            if event_type == "ping":

                await websocket.send_json({

                    "type":
                        "pong",

                    "timestamp":
                        utc_now_iso(),

                })

                continue

            # =================================================
            # UNKNOWN
            # =================================================

            await websocket.send_json({

                "type":
                    "error",

                "message":
                    f"Unknown event: {event_type}",

            })

    # =========================================================
    # DISCONNECT
    # =========================================================

    except WebSocketDisconnect:

        print(
            "[Usanex Couple] WebSocket disconnected."
        )

    except Exception as e:

        print(
            "[Usanex Couple WebSocket] ERROR:",
            repr(e),
        )

    finally:

        if current_user is not None:

            try:

                await couple_manager.disconnect(

                    user_id=current_user.id,

                    websocket=websocket,

                )

            except Exception as e:

                print(
                    "[Usanex Couple] "
                    "Disconnect manager error:",
                    repr(e),
                )

            # ---------------------------------------------
            # OFFLINE
            # ---------------------------------------------

            try:

                await couple_manager.send_presence(

                    receiver_id=partner_user_id,

                    user_id=current_user.id,

                    is_online=False,

                    last_seen=
                        utc_now_iso(),

                )

            except Exception as e:

                print(
                    "[Usanex Couple] "
                    "Offline event error:",
                    repr(e),
                )

        db.close()
