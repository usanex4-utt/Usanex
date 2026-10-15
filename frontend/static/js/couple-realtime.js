/* =========================================================
   UTANEXA — COUPLE REALTIME + ONLINE STATUS
   File: frontend/static/js/couple-realtime.js
   Backend: /ws/couple/{partner_user_id}
   ========================================================= */

(function () {
  "use strict";

  class UsanexCoupleRealtime {

    constructor(options = {}, legacyCallbacks = {}) {

      // Support both constructor formats.
      // new UsanexCoupleRealtime({ partnerId, onMessage })
      // new UsanexCoupleRealtime(partnerId, { onMessage })

      if (
        typeof options === "string" ||
        typeof options === "number"
      ) {
        this.partnerId = String(options);
        options = legacyCallbacks || {};
      } else {
        this.partnerId =
          options.partnerId ??
          options.partner_user_id ??
          null;
      }

      this.onConnection = options.onConnection || (() => {});
      this.onMessage = options.onMessage || (() => {});
      this.onHistory = options.onHistory || (() => {});
      this.onPresence = options.onPresence || (() => {});
      this.onTyping = options.onTyping || (() => {});
      this.onReceipt = options.onReceipt || (() => {});
      this.onError = options.onError || (() => {});
      this.onDisconnect = options.onDisconnect || (() => {});
      this.onStatus = options.onStatus || (() => {});

      this.socket = null;

      this.connected = false;
      this.connecting = false;
      this.manualClose = false;

      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 10;

      this.reconnectTimer = null;
      this.pingTimer = null;

      this.outgoingQueue = [];
      this.lastConnectionData = null;
    }

    // =====================================================
    // CONNECT WEBSOCKET
    // =====================================================

    connect() {

      if (this.connected || this.connecting) {
        return;
      }

      if (
        !this.partnerId ||
        String(this.partnerId) === "unknown"
      ) {
        this.onError({
          message: "Partner ID is missing."
        });

        this.onStatus({
          state: "error",
          message: "Partner ID missing"
        });

        return;
      }

      this.manualClose = false;
      this.connecting = true;

      this.onStatus({
        state: "connecting",
        message: "Connecting…"
      });

      const protocol =
        window.location.protocol === "https:"
          ? "wss:"
          : "ws:";

      const url =
        `${protocol}//${window.location.host}` +
        `/ws/couple/${encodeURIComponent(
          String(this.partnerId)
        )}`;

      let socket;

      try {

        socket = new WebSocket(url);

      } catch (error) {

        this.connecting = false;

        this.onError({
          message: "Could not create WebSocket.",
          error
        });

        this.scheduleReconnect();

        return;
      }

      this.socket = socket;

      // ---------------------------------------------------
      // SOCKET OPEN
      // ---------------------------------------------------

      socket.addEventListener("open", () => {

        this.connecting = false;
        this.connected = true;

        this.reconnectAttempts = 0;

        this.onStatus({
          state: "connected",
          message: "Connected"
        });

        this.startPing();

        this.flushQueue();

      });

      // ---------------------------------------------------
      // SERVER EVENTS
      // ---------------------------------------------------

      socket.addEventListener("message", (event) => {

        this.handleIncoming(event.data);

      });

      // ---------------------------------------------------
      // SOCKET ERROR
      // ---------------------------------------------------

      socket.addEventListener("error", (event) => {

        this.onError({
          message: "WebSocket connection error.",
          event
        });

      });

      // ---------------------------------------------------
      // SOCKET CLOSE
      // ---------------------------------------------------

      socket.addEventListener("close", (event) => {

        const wasConnected = this.connected;

        this.connected = false;
        this.connecting = false;

        this.stopPing();

        this.onStatus({
          state: "disconnected",
          message: event.reason || "Disconnected",
          code: event.code
        });

        if (wasConnected) {

          this.onDisconnect({
            code: event.code,
            reason: event.reason
          });

        }

        if (!this.manualClose) {
          this.scheduleReconnect();
        }

      });

    }

    // =====================================================
    // AUTOMATIC RECONNECT
    // =====================================================

    scheduleReconnect() {

      if (
        this.manualClose ||
        this.reconnectTimer ||
        this.reconnectAttempts >= this.maxReconnectAttempts
      ) {

        if (
          this.reconnectAttempts >=
          this.maxReconnectAttempts
        ) {
          this.onStatus({
            state: "offline",
            message: "Unable to reconnect"
          });
        }

        return;
      }

      const delay = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        30000
      );

      this.reconnectAttempts++;

      this.onStatus({
        state: "reconnecting",
        message: "Reconnecting…"
      });

      this.reconnectTimer = window.setTimeout(() => {

        this.reconnectTimer = null;

        this.connect();

      }, delay);

    }

    // =====================================================
    // DISCONNECT
    // =====================================================

    disconnect() {

      this.manualClose = true;

      this.stopPing();

      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer);
      }

      this.reconnectTimer = null;

      if (this.socket) {

        try {
          this.socket.close(1000, "Client closed");
        } catch (_) {}

      }

      this.socket = null;

      this.connected = false;
      this.connecting = false;

    }

    // =====================================================
    // SEND EVENT
    // =====================================================

    send(payload) {

      if (
        !payload ||
        typeof payload !== "object"
      ) {
        return false;
      }

      if (
        this.socket &&
        this.socket.readyState === WebSocket.OPEN
      ) {

        try {

          this.socket.send(
            JSON.stringify(payload)
          );

          return true;

        } catch (error) {

          this.onError({
            message: "Could not send event.",
            error
          });

          return false;
        }
      }

      // Queue messages while disconnected.
      if (payload.type === "message") {
        this.outgoingQueue.push(payload);
      }

      return false;

    }

    // =====================================================
    // SEND CHAT MESSAGE
    // =====================================================

    sendMessage(message = {}) {

      const payload = {
        type: "message",

        client_message_id:
          message.client_message_id ||
          message.client_id ||
          `client_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        content: message.content ?? null,

        media_url:
          message.media_url ?? null,

        media_type:
          message.media_type ?? null,

        message_type:
          message.message_type || "text"
      };

      const replyTo =
        message.reply_to_message_id ??
        message.reply_to ??
        null;

      if (replyTo !== null) {

        payload.reply_to_message_id = replyTo;

      }

      return this.send(payload);

    }

    // =====================================================
    // TYPING INDICATOR
    // =====================================================

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

    sendTyping(isTyping) {

      return isTyping
        ? this.startTyping()
        : this.stopTyping();

    }

    // =====================================================
    // MESSAGE DELIVERY RECEIPT
    // =====================================================

    sendDelivered(messageId) {

      if (
        messageId === undefined ||
        messageId === null
      ) {
        return false;
      }

      return this.send({
        type: "message_delivered",
        message_id: messageId
      });

    }

    // =====================================================
    // MESSAGE READ RECEIPT
    // =====================================================

    sendRead(messageId) {

      if (
        messageId === undefined ||
        messageId === null
      ) {
        return false;
      }

      return this.send({
        type: "message_read",
        message_id: messageId
      });

    }

    sendReceipt(status, messageId) {

      const value = String(
        status || ""
      ).toLowerCase();

      if (
        value === "read" ||
        value === "seen"
      ) {
        return this.sendRead(messageId);
      }

      if (value === "delivered") {
        return this.sendDelivered(messageId);
      }

      return false;

    }

    // =====================================================
    // HEARTBEAT / PING
    // =====================================================

    startPing() {

      this.stopPing();

      this.pingTimer = window.setInterval(() => {

        if (this.connected) {

          this.send({
            type: "ping"
          });

        }

      }, 25000);

    }

    stopPing() {

      if (this.pingTimer) {

        window.clearInterval(
          this.pingTimer
        );

      }

      this.pingTimer = null;

    }

    // =====================================================
    // SEND QUEUED MESSAGES
    // =====================================================

    flushQueue() {

      if (
        !this.socket ||
        this.socket.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      const queue =
        this.outgoingQueue.splice(0);

      queue.forEach((payload) => {

        try {

          this.socket.send(
            JSON.stringify(payload)
          );

        } catch (error) {

          this.outgoingQueue.unshift(
            payload
          );

          this.onError({
            message: "Queued message could not be sent.",
            error
          });

        }

      });

    }

    // =====================================================
    // HANDLE BACKEND EVENTS
    // =====================================================

    handleIncoming(raw) {

      let data;

      try {

        data =
          typeof raw === "string"
            ? JSON.parse(raw)
            : raw;

      } catch (_) {

        this.onError({
          message: "Server sent invalid JSON."
        });

        return;
      }

      if (
        !data ||
        typeof data !== "object"
      ) {
        return;
      }

      switch (data.type) {

        // -----------------------------------------------
        // CONNECTED
        // -----------------------------------------------

        case "connected":
        case "websocket_connected":

          this.lastConnectionData = data;

          this.onConnection({
            ...data,

            connected: true,

            partnerOnline: Boolean(
              data.partner_online ??
              data.partnerOnline
            ),

            partnerLastSeen:
              data.partner_last_seen ??
              data.partnerLastSeen ??
              null,

            roomId:
              data.room_id ??
              data.room?.id ??
              null
          });

          break;

        // -----------------------------------------------
        // MESSAGE HISTORY
        // -----------------------------------------------

        case "message_history":

          this.onHistory(
            Array.isArray(data.messages)
              ? data.messages
              : [],
            data
          );

          break;

        // -----------------------------------------------
        // NEW MESSAGE
        // -----------------------------------------------

        case "message":

          this.onMessage(data);

          break;

        // -----------------------------------------------
        // RECEIPTS
        // -----------------------------------------------

        case "message_receipt":
        case "receipt":

          this.onReceipt(data);

          break;

        // -----------------------------------------------
        // ONLINE / OFFLINE PRESENCE
        // -----------------------------------------------

        case "presence":
        case "user_presence":

          this.onPresence({
            ...data,

            online: Boolean(
              data.is_online ??
              data.online
            ),

            is_online: Boolean(
              data.is_online ??
              data.online
            ),

            last_seen:
              data.last_seen ??
              data.last_seen_at ??
              null
          });

          break;

        // -----------------------------------------------
        // TYPING
        // -----------------------------------------------

        case "typing":

          this.onTyping({
            ...data,

            typing: Boolean(
              data.is_typing ??
              data.typing ??
              data.active
            ),

            is_typing: Boolean(
              data.is_typing ??
              data.typing ??
              data.active
            )
          });

          break;

        // -----------------------------------------------
        // HEARTBEAT RESPONSE
        // -----------------------------------------------

        case "pong":
          break;

        // -----------------------------------------------
        // BACKEND ERROR
        // -----------------------------------------------

        case "error":

          this.onError(data);

          break;

        default:
          break;

      }

    }

  }

  // Global exports
  window.UsanexCoupleRealtime =
    UsanexCoupleRealtime;

  window.UtaNexaCoupleRealtime =
    UsanexCoupleRealtime;

})();
