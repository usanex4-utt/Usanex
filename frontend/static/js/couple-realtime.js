/* =========================================================
   UTANEXA — COUPLE REALTIME
   File: static/js/couple-realtime.js
   Features:
   - WebSocket connection
   - Online / Last seen presence
   - Live messages and history
   - Typing indicators
   - Message delivery/read receipts
   - Reconnection
========================================================= */

(function () {
    "use strict";

    class UsanexCoupleRealtime {
        constructor(options = {}) {
            this.partnerId = options.partnerId ?? null;

            this.onConnection = options.onConnection ?? (() => {});
            this.onMessage = options.onMessage ?? (() => {});
            this.onHistory = options.onHistory ?? (() => {});
            this.onReceipt = options.onReceipt ?? (() => {});
            this.onPresence = options.onPresence ?? (() => {});
            this.onTyping = options.onTyping ?? (() => {});
            this.onError = options.onError ?? (() => {});
            this.onDisconnect = options.onDisconnect ?? (() => {});

            this.socket = null;
            this.connected = false;
            this.connecting = false;
            this.manualClose = false;

            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 10;
            this.reconnectTimer = null;
            this.pingTimer = null;

            this.partnerOnline = false;
            this.partnerLastSeen = null;

            this.messageQueue = [];
        }

        /* =====================================================
           CONNECTION
        ===================================================== */

        connect() {
            if (this.connected || this.connecting) {
                return;
            }

            if (!this.partnerId) {
                this.onError({
                    message: "Partner ID is required."
                });
                return;
            }

            this.manualClose = false;
            this.connecting = true;

            const protocol =
                window.location.protocol === "https:"
                    ? "wss:"
                    : "ws:";

            const url =
                `${protocol}//${window.location.host}` +
                `/ws/couple/${encodeURIComponent(this.partnerId)}`;

            try {
                this.socket = new WebSocket(url);
            } catch (error) {
                this.connecting = false;
                this.onError(error);
                this.scheduleReconnect();
                return;
            }

            this.socket.addEventListener("open", () => {
                this.connecting = false;
                this.connected = true;
                this.reconnectAttempts = 0;

                this.startPing();
                this.flushQueue();
            });

            this.socket.addEventListener("message", (event) => {
                this.handleIncoming(event.data);
            });

            this.socket.addEventListener("error", (event) => {
                this.onError({
                    message: "WebSocket connection error.",
                    event
                });
            });

            this.socket.addEventListener("close", () => {
                const wasConnected = this.connected;

                this.connected = false;
                this.connecting = false;

                this.stopPing();

                if (wasConnected) {
                    this.onDisconnect({
                        connected: false,
                        partnerOnline: this.partnerOnline,
                        partnerLastSeen: this.partnerLastSeen
                    });
                }

                if (!this.manualClose) {
                    this.scheduleReconnect();
                }
            });
        }

        disconnect() {
            this.manualClose = true;

            this.clearReconnectTimer();
            this.stopPing();

            if (this.socket) {
                try {
                    this.socket.close(1000, "Client disconnected");
                } catch (_) {
                    // Socket may already be closed.
                }
            }

            this.connected = false;
            this.connecting = false;
            this.socket = null;
        }

        /* =====================================================
           RECONNECT
        ===================================================== */

        scheduleReconnect() {
            if (this.manualClose || this.reconnectTimer) {
                return;
            }

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.onError({
                    message: "Unable to reconnect to Couple Chat."
                });
                return;
            }

            const delay = Math.min(
                1000 * Math.pow(2, this.reconnectAttempts),
                30000
            );

            this.reconnectAttempts += 1;

            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null;
                this.connect();
            }, delay);
        }

        clearReconnectTimer() {
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
        }

        /* =====================================================
           PING
        ===================================================== */

        startPing() {
            this.stopPing();

            this.pingTimer = setInterval(() => {
                if (this.connected) {
                    this.send({
                        type: "ping"
                    });
                }
            }, 25000);
        }

        stopPing() {
            if (this.pingTimer) {
                clearInterval(this.pingTimer);
                this.pingTimer = null;
            }
        }

        /* =====================================================
           SEND
        ===================================================== */

        send(payload) {
            if (
                this.socket &&
                this.socket.readyState === WebSocket.OPEN
            ) {
                try {
                    this.socket.send(JSON.stringify(payload));
                    return true;
                } catch (error) {
                    this.onError(error);
                    return false;
                }
            }

            return false;
        }

        sendMessage(message = {}) {
            const clientMessageId =
                message.client_message_id ??
                message.client_id ??
                message.message_id ??
                message.id ??
                null;

            return this.send({
                type: "message",
                client_message_id: clientMessageId,
                client_id: clientMessageId,
                message_id: clientMessageId,
                content: message.content ?? null,
                media_url: message.media_url ?? null,
                media_type: message.media_type ?? null,
                message_type: message.message_type ?? "text",
                reply_to_message_id:
                    message.reply_to_message_id ?? null
            });
        }

        startTyping() {
            return this.send({
                type: "typing_start"
            });
        }

        stopTyping() {
            return this.send({
                type: "typing_stop"
            });
        }

        sendTypingStart() {
            return this.startTyping();
        }

        sendTypingStop() {
            return this.stopTyping();
        }

        sendDelivered(messageId) {
            if (!messageId) return false;

            return this.send({
                type: "message_delivered",
                message_id: messageId
            });
        }

        sendRead(messageId) {
            if (!messageId) return false;

            return this.send({
                type: "message_read",
                message_id: messageId
            });
        }

        /* =====================================================
           MESSAGE QUEUE
        ===================================================== */

        queueMessage(message) {
            if (!message || typeof message !== "object") {
                return false;
            }

            this.messageQueue.push(message);
            return true;
        }

        flushQueue() {
            if (!this.connected || !this.messageQueue.length) {
                return;
            }

            const queued = [...this.messageQueue];
            this.messageQueue = [];

            queued.forEach((message) => {
                const sent = this.sendMessage(message);

                if (!sent) {
                    this.messageQueue.push(message);
                }
            });
        }

        /* =====================================================
           RECEIVE
        ===================================================== */

        handleIncoming(rawData) {
            let data;

            try {
                data = JSON.parse(rawData);
            } catch (_) {
                this.onError({
                    message: "Received invalid WebSocket JSON."
                });
                return;
            }

            if (!data || typeof data !== "object") {
                return;
            }

            switch (data.type) {
                case "connected":
                case "websocket_connected":
                    this.handleConnectedEvent(data);
                    break;

                case "message_history":
                    this.handleHistoryEvent(data);
                    break;

                case "message":
                    this.handleMessageEvent(data);
                    break;

                case "message_receipt":
                case "receipt":
                    this.onReceipt(data);
                    break;

                case "presence":
                case "user_presence":
                    this.handlePresenceEvent(data);
                    break;

                case "typing":
                    this.handleTypingEvent(data);
                    break;

                case "pong":
                    break;

                case "error":
                    this.onError(data);
                    break;

                default:
                    break;
            }
        }

        /* =====================================================
           CONNECTED EVENT
        ===================================================== */

        handleConnectedEvent(data) {
            const partnerOnline = Boolean(
                data.partner_online ??
                data.partnerOnline ??
                false
            );

            const partnerLastSeen =
                data.partner_last_seen ??
                data.partnerLastSeen ??
                null;

            this.partnerOnline = partnerOnline;

            if (partnerLastSeen !== null) {
                this.partnerLastSeen = partnerLastSeen;
            }

            this.onConnection({
                connected: true,
                partnerOnline: this.partnerOnline,
                partner_online: this.partnerOnline,
                partnerLastSeen: this.partnerLastSeen,
                partner_last_seen: this.partnerLastSeen,
                roomId: data.room_id ?? data.room?.id ?? null,
                room_id: data.room_id ?? data.room?.id ?? null,
                user: data.user ?? null,
                partner: data.partner ?? null,
                timestamp: data.timestamp ?? null,
                raw: data
            });
        }

        /* =====================================================
           HISTORY
        ===================================================== */

        handleHistoryEvent(data) {
            const messages = Array.isArray(data.messages)
                ? data.messages
                : [];

            this.onHistory(messages);

            this.onConnection({
                connected: true,
                history: messages,
                historyLoaded: true,
                roomId: data.room_id ?? null,
                room_id: data.room_id ?? null,
                raw: data
            });
        }

        /* =====================================================
           MESSAGE
        ===================================================== */

        handleMessageEvent(data) {
            const message = {
                ...data,
                id: data.id ?? data.message_id ?? null,
                message_id: data.message_id ?? data.id ?? null,
                sender_id: data.sender_id ?? data.senderId ?? null,
                receiver_id: data.receiver_id ?? data.receiverId ?? null,
                content: data.content ?? "",
                timestamp: data.timestamp ?? null
            };

            this.onMessage(message);
        }

        /* =====================================================
           PRESENCE — ONLINE / LAST SEEN
        ===================================================== */

        handlePresenceEvent(data) {
            const userId = data.user_id ?? data.userId ?? null;

            const isOnline = Boolean(
                data.is_online ??
                data.isOnline ??
                false
            );

            const lastSeen =
                data.last_seen ??
                data.lastSeen ??
                null;

            if (
                String(userId) === String(this.partnerId)
            ) {
                this.partnerOnline = isOnline;

                if (lastSeen !== null) {
                    this.partnerLastSeen = lastSeen;
                }
            }

            this.onPresence({
                ...data,
                user_id: userId,
                is_online: isOnline,
                last_seen: lastSeen
            });
        }

        /* =====================================================
           TYPING
        ===================================================== */

        handleTypingEvent(data) {
            this.onTyping({
                ...data,
                sender_id:
                    data.sender_id ??
                    data.senderId ??
                    data.user_id ??
                    null,
                is_typing: Boolean(
                    data.is_typing ??
                    data.isTyping ??
                    false
                )
            });
        }
    }

    window.UsanexCoupleRealtime = UsanexCoupleRealtime;
})();
