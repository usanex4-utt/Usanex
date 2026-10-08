# =========================================================
# USANEX — COUPLE CHAT REALTIME
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
from ..websocket.couple_manager import (
    couple_manager,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    tags=["Couple Realtime"],
)


# =========================================================
# TIME
# =========================================================

def utc_now_iso() -> str:
    return (
        datetime.now(
            timezone.utc
        ).isoformat()
    )


# =========================================================
# USER FINDER
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
# COUPLE WEBSOCKET
# =========================================================
#
# Example:
#
# ws://domain/ws/couple/25
#
# 25 = partner User.id
#
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

    try:

        # =================================================
        # AUTHENTICATION
        # =================================================

        session_token = (
            websocket.cookies.get(
                SESSION_COOKIE_NAME
            )
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

        # =================================================
        # SELF CHAT PROTECTION
        # =================================================

        if current_user.id == partner.id:

            await websocket.close(
                code=1008,
                reason="Cannot chat with yourself",
            )

            return

        # =================================================
        # CONNECT USER
        # =================================================

        await couple_manager.connect(
            user_id=current_user.id,
            websocket=websocket,
        )

        # =================================================
        # CONFIRM CONNECTION
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

            "partner_online":
                couple_manager.is_online(
                    partner.id
                ),

            "timestamp":
                utc_now_iso(),
        })

        # =================================================
        # TELL PARTNER THAT CURRENT USER IS ONLINE
        # =================================================

        await couple_manager.send_presence(
            receiver_id=partner.id,
            user_id=current_user.id,
            is_online=True,
            last_seen=None,
        )

        # =================================================
        # REALTIME EVENT LOOP
        # =================================================

        while True:

            raw_data = (
                await websocket.receive_text()
            )

            # =================================================
            # PARSE
            # =================================================

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

            event_type = data.get(
                "type"
            )

            # =================================================
            # INVALID EVENT
            # =================================================

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
            # MESSAGE
            # =================================================

            if event_type == "message":

                message_id = data.get(
                    "message_id"
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

                # ---------------------------------------------
                # VALIDATE MESSAGE
                # ---------------------------------------------

                if (
                    not content
                    and not media_url
                ):

                    await websocket.send_json({

                        "type": "error",

                        "message":
                            "Message cannot be empty",
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
                        })

                        continue

                # ---------------------------------------------
                # CHECK PARTNER ONLINE
                # ---------------------------------------------

                partner_online = (
                    couple_manager.is_online(
                        partner.id
                    )
                )

                # ---------------------------------------------
                # MESSAGE EVENT
                # ---------------------------------------------

                message_event = {

                    "type":
                        "message",

                    "message_id":
                        message_id,

                    "sender_id":
                        current_user.id,

                    "receiver_id":
                        partner.id,

                    "content":
                        content,

                    "media_url":
                        media_url,

                    "media_type":
                        media_type,

                    "timestamp":
                        utc_now_iso(),
                }

                # ---------------------------------------------
                # SEND TO PARTNER
                # ---------------------------------------------

                delivered = (
                    await couple_manager.send_to_user(

                        user_id=
                            partner.id,

                        event=
                            message_event,
                    )
                )

                # ---------------------------------------------
                # RECEIPT
                # ---------------------------------------------

                await websocket.send_json({

                    "type":
                        "message_receipt",

                    "message_id":
                        message_id,

                    "status":
                        "delivered"
                        if delivered
                        else "sent",

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

                await couple_manager.send_to_user(

                    user_id=
                        partner.id,

                    event={

                        "type":
                            "message_receipt",

                        "message_id":
                            message_id,

                        "status":
                            "delivered",

                        "timestamp":
                            utc_now_iso(),
                    },
                )

                continue

            # =================================================
            # MESSAGE READ / SEEN
            # =================================================

            if event_type == "message_read":

                message_id = data.get(
                    "message_id"
                )

                await couple_manager.send_to_user(

                    user_id=
                        partner.id,

                    event={

                        "type":
                            "message_receipt",

                        "message_id":
                            message_id,

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
            # UNKNOWN EVENT
            # =================================================

            await websocket.send_json({

                "type":
                    "error",

                "message":
                    f"Unknown event: {event_type}",
            })

    # =====================================================
    # DISCONNECT
    # =====================================================

    except WebSocketDisconnect:

        print(
            "[Usanex Couple] WebSocket disconnected."
        )

    except Exception as e:

        print(
            "[Usanex Couple WebSocket] ERROR:",
            str(e),
        )

    finally:

        # =================================================
        # REMOVE CONNECTION
        # =================================================

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
                    str(e),
                )

            # =================================================
            # PARTNER OFFLINE EVENT
            # =================================================

            try:

                await couple_manager.send_presence(
                    receiver_id=partner_user_id,
                    user_id=current_user.id,
                    is_online=False,
                    last_seen=utc_now_iso(),
                )

            except Exception as e:

                print(
                    "[Usanex Couple] "
                    "Offline event error:",
                    str(e),
                )

        db.close()
