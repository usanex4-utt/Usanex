/* =========================================================
   USANEX COUPLE REALTIME v3
   Real WebSocket Controller
   - Stable reconnect
   - Partner-specific filtering
   - Message client_id support
   - Delivery/read receipts
   - Presence
   - Typing
========================================================= */

(() => {
    "use strict";

    const WS_BASE =
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;

    let socket = null;
    let reconnectTimer = null;
    let pingTimer = null;

    let reconnectAttempt = 0;
    let intentionallyClosed = false;
    let connected = false;

    let partnerId = null;

    const listeners = {
        connected: [],
        disconnected: [],
        message: [],
        history: [],
        receipt: [],
        presence: [],
        typing: [],
        error: []
    };

    /* =========================================================
       EVENTS
    ========================================================= */

    function on(type, callback) {
        if (!listeners[type]) return;
        if (typeof callback !== "function") return;

        listeners[type].push(callback);
    }

    function emit(type, data) {
        if (!listeners[type]) return;

        listeners[type].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(
                    `[UsanexRealtime] ${type} listener error`,
                    error
                );
            }
        });
    }

    /* =========================================================
       CONNECT
    ========================================================= */

    function connect(id) {

        if (!id) {
            console.warn(
                "[UsanexRealtime] Partner ID missing."
            );
            return;
        }

        partnerId = String(id);
        intentionallyClosed = false;

        clearTimeout(reconnectTimer);

        /*
         * Already connected/connecting to same partner
         */
        if (
            socket &&
            (
                socket.readyState === WebSocket.OPEN ||
                socket.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        /*
         * Close old socket if any
         */
        if (socket) {
            try {
                socket.close();
            } catch {}
        }

        const url =
            `${WS_BASE}/ws/couple/${encodeURIComponent(partnerId)}`;

        console.log(
            "[UsanexRealtime] Connecting:",
            url
        );

        try {

            socket = new WebSocket(url);

        } catch (error) {

            connected = false;

            emit("error", error);

            scheduleReconnect();

            return;
        }

        socket.addEventListener(
            "open",
            handleOpen
        );

        socket.addEventListener(
            "message",
            handleMessage
        );

        socket.addEventListener(
            "close",
            handleClose
        );

        socket.addEventListener(
            "error",
            handleError
        );
    }

    /* =========================================================
       OPEN
    ========================================================= */

    function handleOpen() {

        connected = true;
        reconnectAttempt = 0;

        console.log(
            "[UsanexRealtime] WebSocket connected."
        );

        emit("connected", {
            partner_id: partnerId,
            websocket_open: true
        });

        startPing();
    }

    /* =========================================================
       CLOSE
    ========================================================= */

    function handleClose(event) {

        connected = false;

        stopPing();

        console.log(
            "[UsanexRealtime] WebSocket disconnected:",
            event.code,
            event.reason || ""
        );

        emit("disconnected", {
            code: event.code,
            reason: event.reason || ""
        });

        if (!intentionallyClosed) {
            scheduleReconnect();
        }
    }

    /* =========================================================
       ERROR
    ========================================================= */

    function handleError(error) {

        console.warn(
            "[UsanexRealtime] WebSocket error:",
            error
        );

        emit("error", error);
    }

    /* =========================================================
       INCOMING MESSAGE
    ========================================================= */

    function handleMessage(event) {

        let data = null;

        try {

            data = JSON.parse(event.data);

        } catch (error) {

            console.warn(
                "[UsanexRealtime] Invalid JSON:",
                event.data
            );

            return;
        }

        if (!data || typeof data !== "object") {
            return;
        }

        switch (data.type) {

            /* -------------------------------------------------
               SERVER CONNECTED
            ------------------------------------------------- */

            case "connected":
            case "websocket_connected":

                connected = true;

                emit("connected", data);

                break;


            /* -------------------------------------------------
               MESSAGE HISTORY
            ------------------------------------------------- */

            case "message_history": {

                const messages =
                    Array.isArray(data.messages)
                        ? data.messages
                        : [];

                emit("history", messages);

                break;
            }


            /* -------------------------------------------------
               NEW MESSAGE
            ------------------------------------------------- */

            case "message": {

                const message =
                    data.message || data;

                if (!message) {
                    break;
                }

                /*
                 * Prevent a socket opened for another partner
                 * from displaying unrelated messages.
                 */
                if (!isMessageForCurrentPartner(message)) {

                    console.debug(
                        "[UsanexRealtime] Ignoring message for another chat.",
                        message
                    );

                    break;
                }

                emit("message", message);

                break;
            }


            /* -------------------------------------------------
               RECEIPT
            ------------------------------------------------- */

            case "message_receipt":
            case "receipt": {

                const receipt =
                    data.receipt || data;

                emit("receipt", receipt);

                break;
            }


            /* -------------------------------------------------
               PRESENCE
            ------------------------------------------------- */

            case "presence":
            case "user_presence":

                emit("presence", data);

                break;


            /* -------------------------------------------------
               TYPING
            ------------------------------------------------- */

            case "typing":

                emit("typing", data);

                break;


            /* -------------------------------------------------
               PONG
            ------------------------------------------------- */

            case "pong":

                break;


            /* -------------------------------------------------
               ERROR
            ------------------------------------------------- */

            case "error":

                emit("error", data);

                break;


            /* -------------------------------------------------
               UNKNOWN
            ------------------------------------------------- */

            default:

                console.debug(
                    "[UsanexRealtime] Unknown event:",
                    data
                );
        }
    }

    /* =========================================================
       PARTNER MESSAGE FILTER
    ========================================================= */

    function isMessageForCurrentPartner(message) {

        if (!partnerId) {
            return true;
        }

        /*
         * If room_id exists, frontend chat.js will perform
         * final room validation.
         */

        const senderId =
            message.sender_id ??
            message.senderId ??
            null;

        const receiverId =
            message.receiver_id ??
            message.receiverId ??
            null;

        /*
         * Own message -> receiver must be partner.
         * Partner message -> sender must be partner.
         */

        if (
            senderId !== null &&
            String(senderId) === String(partnerId)
        ) {
            return true;
        }

        if (
            receiverId !== null &&
            String(receiverId) === String(partnerId)
        ) {
            return true;
        }

        /*
         * Some server events may not expose IDs.
         * Don't incorrectly discard those.
         */

        if (
            senderId === null &&
            receiverId === null
        ) {
            return true;
        }

        return false;
    }

    /* =========================================================
       SEND RAW PAYLOAD
    ========================================================= */

    function send(payload) {

        if (
            !socket ||
            socket.readyState !== WebSocket.OPEN
        ) {

            console.warn(
                "[UsanexRealtime] Socket not connected."
            );

            return false;
        }

        try {

            socket.send(
                JSON.stringify(payload)
            );

            return true;

        } catch (error) {

            console.error(
                "[UsanexRealtime] Send failed:",
                error
            );

            return false;
        }
    }

    /* =========================================================
       SEND MESSAGE
    ========================================================= */

    function sendMessage(
        text,
        messageType = "text",
        clientId = null
    ) {

        const cleanText =
            String(text || "").trim();

        if (!cleanText) {
            return false;
        }

        const payload = {
            type: "message",
            content: cleanText,
            message_type: messageType
        };

        /*
         * client_id is useful for frontend optimistic-message
         * reconciliation. Backend can safely ignore it if the
         * current server implementation doesn't store it.
         */

        if (clientId) {
            payload.client_id = String(clientId);
        }

        return send(payload);
    }

    /* =========================================================
       TYPING START
    ========================================================= */

    function sendTypingStart() {

        return send({
            type: "typing_start"
        });
    }

    /* =========================================================
       TYPING STOP
    ========================================================= */

    function sendTypingStop() {

        return send({
            type: "typing_stop"
        });
    }

    /* =========================================================
       MESSAGE DELIVERED
    ========================================================= */

    function sendMessageDelivered(messageId) {

        if (
            messageId === null ||
            messageId === undefined ||
            messageId === ""
        ) {
            return false;
        }

        return send({
            type: "message_delivered",
            message_id: messageId
        });
    }

    /* =========================================================
       MESSAGE READ
    ========================================================= */

    function sendMessageRead(messageId) {

        if (
            messageId === null ||
            messageId === undefined ||
            messageId === ""
        ) {
            return false;
        }

        return send({
            type: "message_read",
            message_id: messageId
        });
    }

    /* =========================================================
       PING
    ========================================================= */

    function ping() {

        return send({
            type: "ping"
        });
    }

    /* =========================================================
       KEEP ALIVE
    ========================================================= */

    function startPing() {

        stopPing();

        pingTimer =
            setInterval(() => {

                if (
                    socket &&
                    socket.readyState === WebSocket.OPEN
                ) {
                    ping();
                }

            }, 25000);
    }

    function stopPing() {

        if (pingTimer) {

            clearInterval(pingTimer);

            pingTimer = null;
        }
    }

    /* =========================================================
       RECONNECT
    ========================================================= */

    function scheduleReconnect() {

        if (intentionallyClosed) {
            return;
        }

        clearTimeout(reconnectTimer);

        reconnectAttempt++;

        const delay =
            Math.min(
                1000 *
                Math.pow(1.5, reconnectAttempt - 1),
                10000
            );

        console.log(
            `[UsanexRealtime] Reconnecting in ${delay}ms...`
        );

        reconnectTimer =
            setTimeout(() => {

                if (
                    !intentionallyClosed &&
                    partnerId
                ) {
                    connect(partnerId);
                }

            }, delay);
    }

    /* =========================================================
       DISCONNECT
    ========================================================= */

    function disconnect() {

        intentionallyClosed = true;

        clearTimeout(reconnectTimer);

        stopPing();

        reconnectAttempt = 0;

        if (socket) {

            try {
                socket.close(1000, "Client closed");
            } catch {}
        }

        socket = null;

        connected = false;

        emit("disconnected", {
            code: 1000,
            reason: "Client closed"
        });
    }

    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.UsanexCoupleRealtime = {

        connect,

        disconnect,

        send,

        sendMessage,

        sendTypingStart,

        sendTypingStop,

        sendMessageDelivered,

        sendMessageRead,

        ping,

        isConnected: () => connected,

        getPartnerId: () => partnerId,

        on
    };

})();
