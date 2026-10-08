
# =========================================================
# USANEX — COUPLE CHAT WEBSOCKET MANAGER
# backend/websocket/couple_manager.py
# =========================================================

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class CoupleConnectionManager:
    """
    Manages real-time Couple Chat WebSocket connections.
    """

    def __init__(self) -> None:

        # user_id -> active WebSocket connections
        self.connections: dict[
            int,
            set[WebSocket],
        ] = defaultdict(set)

        # Prevent connection/disconnection race conditions.
        self._lock = asyncio.Lock()

    # =====================================================
    # CONNECT
    # =====================================================

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket,
    ) -> None:

        await websocket.accept()

        async with self._lock:

            self.connections[user_id].add(
                websocket
            )

    # =====================================================
    # DISCONNECT
    # =====================================================

    async def disconnect(
        self,
        user_id: int,
        websocket: WebSocket,
    ) -> None:

        async with self._lock:

            user_connections = (
                self.connections.get(
                    user_id,
                    set(),
                )
            )

            user_connections.discard(
                websocket
            )

            if not user_connections:

                self.connections.pop(
                    user_id,
                    None,
                )

    # =====================================================
    # IS ONLINE
    # =====================================================

    def is_online(
        self,
        user_id: int,
    ) -> bool:

        return bool(
            self.connections.get(
                user_id
            )
        )

    # =====================================================
    # ONLINE USER IDS
    # =====================================================

    def online_user_ids(self) -> list[int]:

        return list(
            self.connections.keys()
        )

    # =====================================================
    # CONNECTION COUNT
    # =====================================================

    def connection_count(
        self,
        user_id: int,
    ) -> int:

        return len(
            self.connections.get(
                user_id,
                set(),
            )
        )

    # =====================================================
    # SEND TO ONE USER
    # =====================================================

    async def send_to_user(
        self,
        user_id: int,
        event: dict[str, Any],
    ) -> bool:

        sockets = list(
            self.connections.get(
                user_id,
                set(),
            )
        )

        if not sockets:
            return False

        delivered = False

        dead_sockets: list[
            WebSocket
        ] = []

        for websocket in sockets:

            try:

                await websocket.send_json(
                    event
                )

                delivered = True

            except Exception:

                dead_sockets.append(
                    websocket
                )

        # Remove dead WebSocket connections.
        if dead_sockets:

            async with self._lock:

                current = (
                    self.connections.get(
                        user_id,
                        set(),
                    )
                )

                for websocket in dead_sockets:

                    current.discard(
                        websocket
                    )

                if not current:

                    self.connections.pop(
                        user_id,
                        None,
                    )

        return delivered

    # =====================================================
    # SEND TO MULTIPLE USERS
    # =====================================================

    async def send_to_users(
        self,
        user_ids: list[int],
        event: dict[str, Any],
    ) -> dict[int, bool]:

        results: dict[int, bool] = {}

        for user_id in set(user_ids):

            results[user_id] = (
                await self.send_to_user(
                    user_id=user_id,
                    event=event,
                )
            )

        return results

    # =====================================================
    # SEND TO COUPLE ROOM
    # =====================================================

    async def send_to_room(
        self,
        user_one_id: int,
        user_two_id: int,
        event: dict[str, Any],
    ) -> dict[int, bool]:

        return await self.send_to_users(
            user_ids=[
                user_one_id,
                user_two_id,
            ],
            event=event,
        )

    # =====================================================
    # TYPING EVENT
    # =====================================================

    async def send_typing(
        self,
        sender_id: int,
        receiver_id: int,
        is_typing: bool,
    ) -> bool:

        return await self.send_to_user(
            user_id=receiver_id,
            event={
                "type": "typing",
                "sender_id": sender_id,
                "is_typing": is_typing,
            },
        )

    # =====================================================
    # PRESENCE EVENT
    # =====================================================

    async def send_presence(
        self,
        receiver_id: int,
        user_id: int,
        is_online: bool,
        last_seen: str | None = None,
    ) -> bool:

        return await self.send_to_user(
            user_id=receiver_id,
            event={
                "type": "presence",
                "user_id": user_id,
                "is_online": is_online,
                "last_seen": last_seen,
            },
        )


# =========================================================
# GLOBAL COUPLE MANAGER
# =========================================================

couple_manager = CoupleConnectionManager()
