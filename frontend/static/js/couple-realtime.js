/* =========================================================
   USANEX COUPLE REALTIME v4
   Constructor-based WebSocket Controller
   Compatible with couple-chat.js
   ---------------------------------------------------------
   Features:
   - Real WebSocket
   - Partner-specific connection
   - Room ID support
   - Message history
   - client_message_id support
   - Delivery receipts
   - Seen receipts
   - Presence
   - Typing
   - Ping / keep alive
   - Stable reconnect
   - Auto reconnect
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ====================================================== */

    const WS_BASE =
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;

    const RECONNECT_MIN = 1000;
    const RECONNECT_MAX = 10000;
    const PING_INTERVAL = 25000;


    /* =====================================================
       CLASS
    ====================================================== */

    class UsanexCoupleRealtime {

        constructor(options = {}) {

            this.partnerId =
                options.partnerId ??
                null;

            this.onConnection =
                typeof options.onConnection === "function"
                    ? options.onConnection
                    : () => {};

            this.onMessage =
                typeof options.onMessage === "function"
                    ? options.onMessage
                    : () => {};

            this.onHistory =
                typeof options.onHistory === "function"
                    ? options.onHistory
                    : () => {};

            this.onReceipt =
                typeof options.onReceipt === "function"
                    ? options.onReceipt
                    : () => {};

            this.onPresence =
                typeof options.onPresence === "function"
                    ? options.onPresence
                    : () => {};

            this.onTyping =
                typeof options.onTyping === "function"
                    ? options.onTyping
                    : () => {};

            this.onError =
                typeof options.onError === "function"
                    ? options.onError
                    : () => {};

            this.onDisconnect =
                typeof options.onDisconnect === "function"
                    ? options.onDisconnect
                    : () => {};


            this.socket = null;

            this.roomId = null;

            this.currentUserId = null;

            this.connected = false;

            this.partnerOnline = false;

            this.reconnectTimer = null;

            this.pingTimer = null;

            this.reconnectAttempt = 0;

            this.intentionallyClosed = false;

            this.connecting = false;

            this.destroyed = false;

        }


        /* =================================================
           CONNECT
        ================================================== */

        connect() {

            if (this.destroyed) {
                return false;
            }

            if (!this.partnerId) {

                console.warn(
                    "[UsanexRealtime] Partner ID missing."
                );

                return false;
            }


            this.intentionallyClosed = false;


            this.clearReconnect();


            /*
             * Already connected / connecting
             */

            if (
                this.socket &&
                (
                    this.socket.readyState ===
                        WebSocket.OPEN ||
                    this.socket.readyState ===
                        WebSocket.CONNECTING
                )
            ) {

                return true;

            }


            /*
             * Close previous socket
             */

            if (this.socket) {

                try {
                    this.socket.close();
                } catch {}

            }


            const url =
                `${WS_BASE}/ws/couple/${encodeURIComponent(
                    this.partnerId
                )}`;


            console.log(
                "[UsanexRealtime] Connecting:",
                url
            );


            this.connecting = true;


            try {

                this.socket =
                    new WebSocket(url);

            } catch (error) {

                this.connecting = false;

                this.connected = false;

                this.emitError(
                    error
                );

                this.scheduleReconnect();

                return false;
            }


            this.socket.addEventListener(
                "open",
                () => this.handleOpen()
            );


            this.socket.addEventListener(
                "message",
                event =>
                    this.handleMessage(event)
            );


            this.socket.addEventListener(
                "close",
                event =>
                    this.handleClose(event)
            );


            this.socket.addEventListener(
                "error",
                error =>
                    this.handleSocketError(error)
            );


            return true;

        }


        /* =================================================
           OPEN
        ================================================== */

        handleOpen() {

            this.connecting = false;

            this.connected = true;

            this.reconnectAttempt = 0;


            console.log(
                "[UsanexRealtime] WebSocket connected."
            );


            this.startPing();


            /*
             * IMPORTANT:
             *
             * Do not assume history is received here.
             * Backend sends:
             *
             * connected
             * then message_history
             */

        }


        /* =================================================
           CLOSE
        ================================================== */

        handleClose(event) {

            this.connecting = false;

            this.connected = false;

            this.stopPing();


            console.log(
                "[UsanexRealtime] WebSocket closed:",
                event.code,
                event.reason || ""
            );


            this.onDisconnect({
                connected: false,
                code: event.code,
                reason:
                    event.reason || ""
            });


            this.onConnection({
                connected: false,
                code: event.code,
                reason:
                    event.reason || ""
            });


            if (
                !this.intentionallyClosed &&
                !this.destroyed
            ) {

                this.scheduleReconnect();

            }

        }


        /* =================================================
           SOCKET ERROR
        ================================================== */

        handleSocketError(error) {

            console.warn(
                "[UsanexRealtime] WebSocket error:",
                error
            );


            this.emitError(
                error
            );

        }


        /* =================================================
           INCOMING MESSAGE
        ================================================== */

        handleMessage(event) {

            let data;


            try {

                data =
                    JSON.parse(
                        event.data
                    );

            } catch (error) {

                console.warn(
                    "[UsanexRealtime] Invalid JSON:",
                    event.data
                );

                return;

            }


            if (
                !data ||
                typeof data !== "object"
            ) {

                return;

            }


            switch (
                data.type
            ) {


                /* =========================================
                   CONNECTED
                ========================================== */

                case "connected":
                case "websocket_connected":

                    this.handleConnectedEvent(
                        data
                    );

                    break;


                /* =========================================
                   HISTORY
                ========================================== */

                case "message_history":

                    this.handleHistoryEvent(
                        data
                    );

                    break;


                /* =========================================
                   MESSAGE
                ========================================== */

                case "message":

                    this.handleMessageEvent(
                        data
                    );

                    break;


                /* =========================================
                   RECEIPT
                ========================================== */

                case "message_receipt":
                case "receipt":

                    this.handleReceiptEvent(
                        data
                    );

                    break;


                /* =========================================
                   PRESENCE
                ========================================== */

                case "presence":
                case "user_presence":

                    this.handlePresenceEvent(
                        data
                    );

                    break;


                /* =========================================
                   TYPING
                ========================================== */

                case "typing":

                    this.handleTypingEvent(
                        data
                    );

                    break;


                /* =========================================
                   PONG
                ========================================== */

                case "pong":

                    break;


                /* =========================================
                   ERROR
                ========================================== */

                case "error":

                    this.emitError(
                        data
                    );

                    break;


                /* =========================================
                   UNKNOWN
                ========================================== */

                default:

                    console.debug(
                        "[UsanexRealtime] Unknown event:",
                        data
                    );

            }

        }


        /* =================================================
           CONNECTED EVENT
        ================================================== */

        handleConnectedEvent(data) {

            this.connected = true;

            this.connecting = false;


            /*
             * Current user
             */

            if (
                data.user &&
                data.user.id != null
            ) {

                this.currentUserId =
                    data.user.id;

            }


            /*
             * Room
             */

            if (
                data.room &&
                data.room.id != null
            ) {

                this.roomId =
                    data.room.id;

            }


            if (
                data.room_id != null
            ) {

                this.roomId =
                    data.room_id;

            }


            /*
             * Partner online
             */

            if (
                typeof data.partner_online ===
                "boolean"
            ) {

                this.partnerOnline =
                    data.partner_online;

            } else if (
                typeof data.partnerOnline ===
                "boolean"
            ) {

                this.partnerOnline =
                    data.partnerOnline;

            }


            /*
             * Send normalized connection data
             * to couple-chat.js
             */

            this.onConnection({

                connected: true,

                partnerOnline:
                    this.partnerOnline,

                partner_online:
                    this.partnerOnline,

                roomId:
                    this.roomId,

                room_id:
                    this.roomId,

                user:
                    data.user || null,

                partner:
                    data.partner || null,

                timestamp:
                    data.timestamp || null,

                raw:
                    data

            });

        }


        /* =================================================
           HISTORY
        ================================================== */

        handleHistoryEvent(data) {

            const rawMessages =
                Array.isArray(
                    data.messages
                )
                    ? data.messages
                    : [];


            /*
             * Save room ID
             */

            if (
                data.room_id != null
            ) {

                this.roomId =
                    data.room_id;

            }


            /*
             * Normalize backend history
             */

            const messages =
                rawMessages
                    .map(
                        message =>
                            this.normalizeMessage(
                                message
                            )
                    )
                    .filter(
                        message =>
                            this.isMessageForPartner(
                                message
                            )
                    );


            /*
             * Current couple-chat.js expects
             * history inside onConnection().
             */

            this.onConnection({

                connected: true,

                history:
                    messages,

                historyLoaded:
                    true,

                roomId:
                    this.roomId,

                room_id:
                    this.roomId

            });


            /*
             * Also expose dedicated history callback
             */

            this.onHistory(
                messages
            );

        }


        /* =================================================
           MESSAGE EVENT
        ================================================== */

        handleMessageEvent(data) {

            let message =
                data.message ||
                data;


            if (!message) {
                return;
            }


            /*
             * Backend directly sends:
             *
             * message_id
             * client_message_id
             * room_id
             * sender_id
             * receiver_id
             */

            message =
                this.normalizeMessage(
                    message
                );


            /*
             * STRICT PARTNER FILTER
             */

            if (
                !this.isMessageForPartner(
                    message
                )
            ) {

                console.debug(
                    "[UsanexRealtime] Ignored message from another chat.",
                    message
                );

                return;

            }


            /*
             * STRICT ROOM FILTER
             */

            if (
                this.roomId != null &&
                message.room_id != null &&
                String(
                    this.roomId
                ) !==
                String(
                    message.room_id
                )
            ) {

                console.debug(
                    "[UsanexRealtime] Ignored message from another room."
                );

                return;

            }


            this.onMessage(
                message
            );

        }


        /* =================================================
           RECEIPT EVENT
        ================================================== */

        handleReceiptEvent(data) {

            let receipt =
                data.receipt ||
                data;


            if (!receipt) {
                return;
            }


            /*
             * Normalize backend receipt
             */

            receipt = {

                ...receipt,

                message_id:
                    receipt.message_id ??
                    receipt.id ??
                    null,

                client_message_id:
                    receipt.client_message_id ??
                    receipt.client_id ??
                    null,

                status:
                    this.normalizeReceiptStatus(
                        receipt
                    )

            };


            this.onReceipt(
                receipt
            );

        }


        /* =================================================
           PRESENCE EVENT
        ================================================== */

        handlePresenceEvent(data) {

            this.onPresence({
                ...data,

                user_id:
                    data.user_id ??
                    data.userId ??
                    null,

                is_online:
                    data.is_online === true ||
                    data.online === true,

                last_seen:
                    data.last_seen ??
                    data.last_seen_at ??
                    null

            });

        }


        /* =================================================
           TYPING EVENT
        ================================================== */

        handleTypingEvent(data) {

            this.onTyping({
                ...data,

                is_typing:
                    data.is_typing === true ||
                    data.typing === true,

                sender_id:
                    data.sender_id ??
                    data.senderId ??
                    null

            });

        }


        /* =================================================
           NORMALIZE MESSAGE
        ================================================== */

        normalizeMessage(message) {

            return {

                ...message,

                id:
                    message.id ??
                    message.message_id ??
                    null,

                message_id:
                    message.message_id ??
                    message.id ??
                    null,

                client_id:
                    message.client_id ??
                    message.client_message_id ??
                    null,

                client_message_id:
                    message.client_message_id ??
                    message.client_id ??
                    null,

                room_id:
                    message.room_id ??
                    null,

                sender_id:
                    message.sender_id ??
                    message.senderId ??
                    null,

                receiver_id:
                    message.receiver_id ??
                    message.receiverId ??
                    null,

                content:
                    message.content ??
                    message.text ??
                    "",

                text:
                    message.content ??
                    message.text ??
                    "",

                message_type:
                    message.message_type ||
                    "text",

                media_url:
                    message.media_url ??
                    null,

                media_type:
                    message.media_type ??
                    null,

                created_at:
                    message.created_at ||
                    message.timestamp ||
                    new Date().toISOString(),

                timestamp:
                    message.timestamp ||
                    message.created_at ||
                    new Date().toISOString()

            };

        }


        /* =================================================
           PARTNER FILTER
        ================================================== */

        isMessageForPartner(message) {

            if (!this.partnerId) {
                return true;
            }


            const senderId =
                message.sender_id ??
                message.senderId ??
                null;


            const receiverId =
                message.receiver_id ??
                message.receiverId ??
                null;


            const partner =
                String(
                    this.partnerId
                );


            /*
             * Partner -> current user
             */

            if (
                senderId != null &&
                String(
                    senderId
                ) === partner
            ) {

                return true;

            }


            /*
             * Current user -> partner
             */

            if (
                receiverId != null &&
                String(
                    receiverId
                ) === partner
            ) {

                return true;

            }


            /*
             * If IDs are unavailable,
             * don't accidentally discard event.
             */

            if (
                senderId == null &&
                receiverId == null
            ) {

                return true;

            }


            return false;

        }


        /* =================================================
           SEND RAW
        ================================================== */

        send(payload) {

            if (
                !this.socket ||
                this.socket.readyState !==
                    WebSocket.OPEN
            ) {

                console.warn(
                    "[UsanexRealtime] Socket not connected."
                );

                return false;

            }


            try {

                this.socket.send(
                    JSON.stringify(
                        payload
                    )
                );

                return true;

            } catch (error) {

                console.error(
                    "[UsanexRealtime] Send failed:",
                    error
                );

                this.emitError(
                    error
                );

                return false;

            }

        }


        /* =================================================
           SEND MESSAGE
        ================================================== */

        sendMessage(message) {

            if (!message) {
                return false;
            }


            /*
             * couple-chat.js sends the COMPLETE
             * optimistic message object.
             */

            if (
                typeof message === "object"
            ) {

                const clientId =
                    message.client_id ??
                    message.client_message_id ??
                    null;


                const payload = {

                    type:
                        "message",

                    message_id:
                        clientId,

                    content:
                        message.content ??
                        message.text ??
                        null,

                    media_url:
                        message.media_url ??
                        null,

                    media_type:
                        message.media_type ??
                        null,

                    message_type:
                        message.message_type ||
                        "text",

                    reply_to_message_id:
                        message.reply_to_message_id ??
                        null

                };


                return this.send(
                    payload
                );

            }


            /*
             * Backward compatibility:
             * sendMessage("hello", "text", clientId)
             */

            const text =
                String(
                    message
                ).trim();


            if (!text) {
                return false;
            }


            return this.send({

                type:
                    "message",

                message_id:
                    arguments[2] ??
                    null,

                content:
                    text,

                message_type:
                    arguments[1] ||
                    "text"

            });

        }


        /* =================================================
           DELIVERED
        ================================================== */

        sendDelivered(messageId) {

            if (
                messageId == null ||
                messageId === ""
            ) {

                return false;

            }


            return this.send({

                type:
                    "message_delivered",

                message_id:
                    messageId

            });

        }


        /*
         * Alias for compatibility
         */

        sendMessageDelivered(messageId) {

            return this.sendDelivered(
                messageId
            );

        }


        /* =================================================
           READ / SEEN
        ================================================== */

        sendRead(messageId) {

            if (
                messageId == null ||
                messageId === ""
            ) {

                return false;

            }


            return this.send({

                type:
                    "message_read",

                message_id:
                    messageId

            });

        }


        /*
         * Alias for compatibility
         */

        sendMessageRead(messageId) {

            return this.sendRead(
                messageId
            );

        }


        /* =================================================
           TYPING
        ================================================== */

        startTyping() {

            return this.send({

                type:
                    "typing_start"

            });

        }


        sendTypingStart() {

            return this.startTyping();

        }


        stopTyping() {

            return this.send({

                type:
                    "typing_stop"

            });

        }


        sendTypingStop() {

            return this.stopTyping();

        }


        /* =================================================
           PING
        ================================================== */

        ping() {

            return this.send({

                type:
                    "ping"

            });

        }


        /* =================================================
           KEEP ALIVE
        ================================================== */

        startPing() {

            this.stopPing();


            this.pingTimer =
                setInterval(
                    () => {

                        if (
                            this.socket &&
                            this.socket.readyState ===
                                WebSocket.OPEN
                        ) {

                            this.ping();

                        }

                    },
                    PING_INTERVAL
                );

        }


        stopPing() {

            if (
                this.pingTimer
            ) {

                clearInterval(
                    this.pingTimer
                );

                this.pingTimer =
                    null;

            }

        }


        /* =================================================
           RECONNECT
        ================================================== */

        scheduleReconnect() {

            if (
                this.intentionallyClosed ||
                this.destroyed ||
                !this.partnerId
            ) {

                return;

            }


            this.clearReconnect();


            this.reconnectAttempt++;


            const delay =
                Math.min(
                    RECONNECT_MIN *
                        Math.pow(
                            1.5,
                            this.reconnectAttempt - 1
                        ),
                    RECONNECT_MAX
                );


            console.log(
                `[UsanexRealtime] Reconnecting in ${Math.round(
                    delay
                )}ms...`
            );


            this.reconnectTimer =
                setTimeout(
                    () => {

                        if (
                            !this.intentionallyClosed &&
                            !this.destroyed
                        ) {

                            this.connect();

                        }

                    },
                    delay
                );

        }


        clearReconnect() {

            if (
                this.reconnectTimer
            ) {

                clearTimeout(
                    this.reconnectTimer
                );

                this.reconnectTimer =
                    null;

            }

        }


        /* =================================================
           DISCONNECT
        ================================================== */

        disconnect() {

            this.intentionallyClosed =
                true;


            this.clearReconnect();

            this.stopPing();


            this.reconnectAttempt =
                0;


            if (
                this.socket
            ) {

                try {

                    this.socket.close(
                        1000,
                        "Client closed"
                    );

                } catch {}

            }


            this.socket =
                null;


            this.connected =
                false;


            this.connecting =
                false;

        }


        /* =================================================
           DESTROY
        ================================================== */

        destroy() {

            this.destroyed =
                true;

            this.disconnect();

        }


        /* =================================================
           RECEIPT NORMALIZER
        ================================================== */

        normalizeReceiptStatus(
            receipt
        ) {

            if (
                receipt.status ===
                    "seen" ||
                receipt.seen === true ||
                receipt.seen_at
            ) {

                return "seen";

            }


            if (
                receipt.status ===
                    "delivered" ||
                receipt.delivered === true ||
                receipt.delivered_at
            ) {

                return "delivered";

            }


            return "sent";

        }


        /* =================================================
           ERROR
        ================================================== */

        emitError(error) {

            try {

                this.onError(
                    error
                );

            } catch {}

        }

    }


    /* =====================================================
       EXPORT
    ====================================================== */

    window.UsanexCoupleRealtime =
        UsanexCoupleRealtime;


    console.log(
        "[Usanex] Couple Realtime v4 loaded."
    );

})();
