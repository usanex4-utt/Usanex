
/* =========================================================
   USANEX COUPLE REALTIME
   Real WebSocket controller
========================================================= */

(() => {
    "use strict";

    const WS_BASE =
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;

    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    let intentionallyClosed = false;

    let partnerId = null;
    let connected = false;

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

    function on(type, callback) {
        if (!listeners[type]) return;

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

        if (
            socket &&
            (
                socket.readyState === WebSocket.OPEN ||
                socket.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
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

    function handleOpen() {

        connected = true;
        reconnectAttempt = 0;

        console.log(
            "[UsanexRealtime] Connected."
        );

        emit("connected", {
            partner_id: partnerId
        });
    }

    function handleClose(event) {

        connected = false;

        console.log(
            "[UsanexRealtime] Disconnected.",
            event.code
        );

        emit("disconnected", {
            code: event.code,
            reason: event.reason || ""
        });

        if (!intentionallyClosed) {
            scheduleReconnect();
        }
    }

    function handleError(error) {

        connected = false;

        console.warn(
            "[UsanexRealtime] WebSocket error.",
            error
        );

        emit("error", error);
    }

    function handleMessage(event) {

        let data;

        try {
            data = JSON.parse(event.data);
        } catch (error) {
            console.warn(
                "[UsanexRealtime] Invalid JSON.",
                event.data
            );
            return;
        }

        switch (data.type) {

            case "connected":
            case "websocket_connected":
                emit("connected", data);
                break;

            case "message_history":
                emit(
                    "history",
                    Array.isArray(data.messages)
                        ? data.messages
                        : []
                );
                break;

            case "message":
                emit(
                    "message",
                    data.message || data
                );
                break;

            case "message_receipt":
            case "receipt":
                emit(
                    "receipt",
                    data.receipt || data
                );
                break;

            case "presence":
            case "user_presence":
                emit(
                    "presence",
                    data
                );
                break;

            case "typing":
                emit(
                    "typing",
                    data
                );
                break;

            case "pong":
                break;

            case "error":
                emit(
                    "error",
                    data
                );
                break;

            default:
                console.debug(
                    "[UsanexRealtime] Unknown event:",
                    data
                );
        }
    }

    function send(payload) {

        if (
            !socket ||
            socket.readyState !== WebSocket.OPEN
        ) {
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

    function sendMessage(text, messageType = "text") {

        const cleanText =
            String(text || "").trim();

        if (!cleanText) {
            return false;
        }

        return send({
            type: "message",
            content: cleanText,
            message_type: messageType
        });
    }

    function sendTypingStart() {

        return send({
            type: "typing_start"
        });
    }

    function sendTypingStop() {

        return send({
            type: "typing_stop"
        });
    }

    function sendMessageDelivered(messageId) {

        if (!messageId) return false;

        return send({
            type: "message_delivered",
            message_id: messageId
        });
    }

    function sendMessageRead(messageId) {

        if (!messageId) return false;

        return send({
            type: "message_read",
            message_id: messageId
        });
    }

    function ping() {

        return send({
            type: "ping"
        });
    }

    function disconnect() {

        intentionallyClosed = true;

        clearTimeout(reconnectTimer);

        if (socket) {

            try {
                socket.close();
            } catch {}
        }

        socket = null;
        connected = false;
    }

    function scheduleReconnect() {

        if (intentionallyClosed) {
            return;
        }

        clearTimeout(reconnectTimer);

        reconnectAttempt++;

        const delay =
            Math.min(
                1000 * Math.pow(1.5, reconnectAttempt),
                10000
            );

        reconnectTimer =
            setTimeout(
                () => {

                    if (partnerId) {
                        connect(partnerId);
                    }

                },
                delay
            );
    }

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

        on
    };

})();
