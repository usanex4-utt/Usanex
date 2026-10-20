
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const partnerId =
    params.get("user_id") ||
    params.get("partner_id") ||
    params.get("id");

  const state = {
    partner: null,
    currentUser: null,
    messages: [],
    file: null,
    reply: null,
    selected: null,
    zoom: 1,
    loading: false,
    sending: false,
    muted: false,
    search: "",
    poll: null,
    mediaRecorder: null,
    audioChunks: [],
    recording: false,
    loadAgain: false,
    lastError: "",

    // Online / Last Seen / Typing
    presenceConnected: false,
    presenceSocket: null,
    presenceOnline: false,
    presenceLastSeen: null,
    partnerTyping: false,
    typingTimer: null
  };

  const EMOJIS = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
    "🙂","🙃","😉","😍","🥰","😘","😗","😋","😛","🤪",
    "🤔","🫡","😎","🥳","😭","😢","🥺","😔","😴","😡",
    "🤬","😱","😮","😌","🤗","🤝","❤️","🧡","💛","💚",
    "💙","💜","🖤","🤍","💔","💕","💞","💖","💗","💓",
    "💘","💝","🔥","✨","⭐","🌹","🌸","🎉","👍","👎",
    "🙏","👏","🙌","💯","✅","❌","💐","🫶","😏","😜","🤩"
  ];

  const byId = id => $(id);

  function toast(message, error = false) {
    const container = $("toastContainer");

    if (!container) {
      console[error ? "error" : "log"](message);
      return;
    }

    const node = document.createElement("div");
    node.className = "toast" + (error ? " error" : "");
    node.textContent = String(message);
    container.appendChild(node);

    window.setTimeout(() => node.remove(), 3200);
  }
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include"
  });

  const contentType = response.headers.get("content-type") || "";
  let data = {};

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { detail: await response.text() };
    }
  } catch (_) {}

  if (!response.ok) {
    let message = data.detail || data.message || "";

    if (Array.isArray(message)) {
      message = message
        .map(item => item.msg || JSON.stringify(item))
        .join(", ");
    }

    console.error("UtaNexa API error:", {
      url,
      status: response.status,
      response: data
    });

    throw new Error(
      `HTTP ${response.status}: ${message || "Request failed"}`
    );
  }

  return data;
}

  function setConnectionError(message) {
    const banner = $("connectionBanner");
    const messageNode = $("connectionMessage");
    const retry = $("retryButton");

    if (banner) banner.hidden = false;
    if (messageNode) messageNode.textContent = message;
    if (retry) retry.hidden = false;
  }

  function clearConnectionError() {
    if ($("connectionBanner")) $("connectionBanner").hidden = true;
  }

  function setStatus(text, online = false) {
  const status = $("selectedStatus");
  const dot = $("onlineDot");

  if (status) {
    status.textContent = text;
  }

  if (dot) {
    dot.classList.toggle("is-online", online);
  }
}

function formatLastSeen(value) {
  if (!value) return "Offline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Offline";
  }

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return "Last seen today, " + date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return "Last seen " + date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}


    // =====================================================
  // UTANEXA CHAT: ONLINE / LAST SEEN / TYPING
  // =====================================================

  function updatePresenceStatus() {
    if (state.partnerTyping) {
      setStatus("Typing…", state.presenceOnline);
      return;
    }

    if (state.presenceOnline) {
      setStatus("Online", true);
      return;
    }

    setStatus(formatLastSeen(state.presenceLastSeen), false);
  }

  function sendTypingStatus(typing) {
    const socket = state.presenceSocket;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      socket.send(JSON.stringify({
        type: "typing",
        typing: typing === true
      }));
    } catch (error) {
      console.debug("Typing status unavailable:", error);
    }
  }

  function connectPresence() {
    if (!partnerId) return;

    const existing = state.presenceSocket;

    if (
      existing &&
      (
        existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl =
      `${protocol}//${location.host}/api/chat/ws/${encodeURIComponent(partnerId)}`;

    let socket;

    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      console.error("Chat presence connection failed:", error);
      return;
    }

    state.presenceSocket = socket;

    socket.addEventListener("open", () => {
      if (state.presenceSocket !== socket) return;

      state.presenceConnected = true;
      console.log("UtaNexa chat presence connected.");
    });

    socket.addEventListener("message", event => {
      if (state.presenceSocket !== socket) return;

      let payload;

      try {
        payload = JSON.parse(event.data);
      } catch (_) {
        return;
      }

      if (!payload || typeof payload !== "object") return;

      if (payload.type === "presence") {
        // Ignore presence events for users other than this chat partner.
        if (
          !state.partner ||
          String(payload.user_id) !== String(state.partner.id)
        ) {
          return;
        }

        state.presenceOnline = payload.online === true;
        state.presenceLastSeen = payload.last_seen || null;

        updatePresenceStatus();
        return;
      }

      if (payload.type === "typing") {
        if (
          !state.partner ||
          String(payload.user_id) !== String(state.partner.id)
        ) {
          return;
        }

        state.partnerTyping = payload.typing === true;
        updatePresenceStatus();
      }
    });

    socket.addEventListener("close", () => {
      if (state.presenceSocket !== socket) return;

      state.presenceConnected = false;
      state.presenceSocket = null;
      state.partnerTyping = false;

      // Do not repeatedly replace a status supplied by a live socket.
      if (state.presenceOnline) {
        state.presenceOnline = false;
        updatePresenceStatus();
      }
    });

    socket.addEventListener("error", error => {
      console.debug("Chat presence socket error:", error);
    });
  }

  function disconnectPresence() {
    if (state.typingTimer) {
      clearTimeout(state.typingTimer);
      state.typingTimer = null;
    }

    const socket = state.presenceSocket;
    state.presenceSocket = null;
    state.presenceConnected = false;
    state.partnerTyping = false;

    if (socket) {
      try {
        socket.close();
      } catch (_) {}
    }
  }

  function profileImageUrl(path) {
    if (!path || typeof path !== "string") return "";

    try {
      const url = new URL(path, location.origin);

      if (!["http:", "https:"].includes(url.protocol)) return "";

      // Permit same-origin media and remote HTTPS images.
      if (url.protocol === "http:" && url.origin !== location.origin) return "";

      return url.href;
    } catch (_) {
      return "";
    }
  }

  function iconFallback(name) {
    return String(name || "U").trim().charAt(0).toUpperCase() || "U";
  }

  function updateProfile(user) {
    if (user) state.partner = user;
    if (!state.partner) return;

    const name =
      state.partner.name ||
      state.partner.username ||
      state.partner.user_id ||
      "User";

    if ($("selectedName")) $("selectedName").textContent = name;
    if ($("welcomeName")) $("welcomeName").textContent = name;
    if ($("dpProfileName")) $("dpProfileName").textContent = name;

    const photo = profileImageUrl(state.partner.profile_photo);
    const avatar = $("selectedAvatar");
    const fallback = $("avatarFallback");

    if (avatar && fallback) {
      if (photo) {
        avatar.src = photo;
        avatar.hidden = false;
        fallback.hidden = true;

        avatar.onerror = () => {
          avatar.hidden = true;
          fallback.hidden = false;
        };
      } else {
        avatar.removeAttribute("src");
        avatar.hidden = true;
        fallback.hidden = false;
      }

      fallback.textContent = iconFallback(name);
    }

    if ($("viewerAvatar")) {
      $("viewerAvatar").textContent = iconFallback(name);
    }

    if ($("welcomeCard")) {
      $("welcomeCard").hidden = state.messages.length > 0;
    }
  }

  function normalizeMessage(raw) {
    return {
      ...raw,
      id: raw.id,
      sender_id: raw.sender_id,
      receiver_id: raw.receiver_id,
      content: raw.content ?? raw.message ?? "",
      media_url: raw.media_url || "",
      media_type: raw.media_type || "",
      is_read: Boolean(raw.is_read ?? raw.read),
      is_deleted: Boolean(raw.is_deleted),
      created_at: raw.created_at || null
    };
  }

  function isMine(message) {
    if (!state.currentUser) return false;

    return String(message.sender_id) === String(state.currentUser.id) ||
      String(message.sender_id) === String(state.currentUser.user_id);
  }

  function messageTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function dateKey(value) {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) return "unknown";

    return [
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ].join("-");
  }

  function dateLabel(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateKey(date) === dateKey(today)) return "Today";
    if (dateKey(date) === dateKey(yesterday)) return "Yesterday";

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function makeElement(tag, className = "", text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);

    return node;
  }

  function attachmentElement(message) {
    if (!message.media_url) return null;

    const url = profileImageUrl(message.media_url);
    if (!url) return null;

    const wrapper = makeElement("div", "message-attachment");
    const type = String(message.media_type || "").toLowerCase();
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop().toLowerCase();

    if (type.startsWith("image/") ||
        ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.src = url;
      img.alt = "Shared image";
      img.loading = "lazy";

      link.appendChild(img);
      wrapper.appendChild(link);
    } else if (type.startsWith("video/") ||
               ["mp4", "mov", "webm"].includes(ext)) {
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.preload = "metadata";
      wrapper.appendChild(video);
    } else if (type.startsWith("audio/") ||
               ["mp3", "wav", "ogg", "m4a", "aac", "opus"].includes(ext)) {
      const audio = document.createElement("audio");
      audio.src = url;
      audio.controls = true;
      audio.preload = "metadata";
      wrapper.appendChild(audio);
    } else {
      const card = makeElement("div", "file-card");
      card.appendChild(makeElement("span", "file-card-icon", "▤"));

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = pathname.split("/").pop() || "Open attachment";

      card.appendChild(link);
      wrapper.appendChild(card);
    }

    return wrapper;
  }

  function createMessage(message) {
    const mine = isMine(message);
    const row = makeElement("div", `message-row ${mine ? "mine" : "theirs"}`);

    row.dataset.messageId = String(message.id);

    const bubble = makeElement("article", "message-bubble");
    bubble.dataset.messageId = String(message.id);
    bubble.tabIndex = 0;
    bubble.setAttribute("aria-label", "Message. Open message options.");

    // Reply information is displayed only if the API actually returns it.
    if (message.reply_to_content || message.reply_message) {
      const quote = makeElement("div", "reply-quote");

      quote.appendChild(
        makeElement("strong", "", message.reply_to_name || "Reply")
      );
      quote.appendChild(
        makeElement(
          "span",
          "",
          message.reply_to_content || message.reply_message || ""
        )
      );

      bubble.appendChild(quote);
    }

    if (message.is_deleted) {
      bubble.appendChild(
        makeElement("div", "deleted-message", "This message was deleted")
      );
    } else {
      const attachment = attachmentElement(message);

      if (attachment) bubble.appendChild(attachment);

      if (message.content) {
        bubble.appendChild(makeElement("div", "message-text", message.content));
      }
    }

    if (Array.isArray(message.reactions) && message.reactions.length) {
      const reactions = makeElement("div", "message-reactions");

      message.reactions.forEach(reaction => {
        const emoji = typeof reaction === "string"
          ? reaction
          : reaction.emoji || "❤️";

        reactions.appendChild(makeElement("span", "", emoji));
      });

      bubble.appendChild(reactions);
    }

    const meta = makeElement("div", "message-meta");
    meta.appendChild(makeElement("span", "message-time", messageTime(message.created_at)));

    if (mine) {
      const ticks = makeElement(
        "span",
        "message-ticks" + (message.is_read ? " seen" : ""),
        message.is_read ? "✓✓" : "✓"
      );

      ticks.title = message.is_read ? "Read according to server" : "Sent";
      meta.appendChild(ticks);
    }

    bubble.appendChild(meta);

    bubble.addEventListener("contextmenu", event => {
      event.preventDefault();
      openMessageActions(message, event.clientX, event.clientY);
    });

    let pressTimer = null;
    let longPressTriggered = false;

    bubble.addEventListener("touchstart", () => {
      longPressTriggered = false;

      pressTimer = window.setTimeout(() => {
        longPressTriggered = true;
        openMessageActions(message);
      }, 550);
    }, { passive: true });

    ["touchend", "touchmove", "touchcancel"].forEach(name => {
      bubble.addEventListener(name, () => {
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = null;
      }, { passive: true });
    });

    let startX = 0;
    let startY = 0;

    bubble.addEventListener("touchstart", event => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    }, { passive: true });

    bubble.addEventListener("touchend", event => {
      if (longPressTriggered) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Math.abs(dx) > 75 && Math.abs(dy) < 55) {
        setReply(message);
      }
    }, { passive: true });

    bubble.addEventListener("click", event => {
      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }

      if (window.getSelection()?.toString()) return;

      if (event.detail === 2) {
        openMessageActions(message);
      }
    });

    bubble.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMessageActions(message);
      }
    });

    row.appendChild(bubble);
    return row;
  }

  function messageSignature(messages) {
    return messages.map(message => [
      message.id,
      message.sender_id,
      message.receiver_id,
      message.content,
      message.media_url,
      message.is_read,
      message.is_deleted,
      message.created_at
    ].join(":")).join("|");
  }

  function renderMessages(keepPosition = false) {
    const area = $("messagesArea");
    const list = $("messagesList");

    if (!area || !list) return;

    const nearBottom =
      area.scrollHeight - area.scrollTop - area.clientHeight < 140;

    const previousTop = area.scrollTop;
    const previousHeight = area.scrollHeight;

    const sorted = [...state.messages].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();

      return da - db;
    });

    list.replaceChildren();

    let previousDate = "";

    sorted.forEach(message => {
      const key = dateKey(message.created_at);

      if (key !== previousDate) {
        const separator = makeElement("div", "date-separator");
        separator.appendChild(
          makeElement("span", "", dateLabel(message.created_at))
        );
        list.appendChild(separator);
        previousDate = key;
      }

      const row = createMessage(message);
      const needle = state.search.trim().toLowerCase();
      const content = String(message.content || "").toLowerCase();

      if (needle && !content.includes(needle)) {
        row.hidden = true;
      } else if (needle) {
        const bubble = row.querySelector(".message-bubble");

        if (bubble) bubble.style.outline = "1px solid #a9ccff";
      }

      list.appendChild(row);
    });

    if ($("welcomeCard")) {
      $("welcomeCard").hidden = sorted.length > 0;
    }

    if (!keepPosition || nearBottom) {
      area.scrollTop = area.scrollHeight;
    } else {
      const newHeight = area.scrollHeight;
      area.scrollTop = Math.max(
        0,
        previousTop + (newHeight - previousHeight)
      );
    }
  }

  async function loadMessages(options = {}) {
    if (!partnerId) {
      setConnectionError(
        "Chat partner ID missing. Open chat from a user's profile or connections."
      );
      setStatus("User not selected");
      return;
    }

    if (state.loading) {
      state.loadAgain = true;
      return;
    }

    state.loading = true;

    try {
      const data = await request(
        `/api/chat/${encodeURIComponent(partnerId)}`
      );

      if (data.success === false) {
        throw new Error(data.message || "Could not load chat");
      }

      const incoming = Array.isArray(data.messages)
        ? data.messages.map(normalizeMessage)
        : [];

      const oldSignature = messageSignature(state.messages);
      const newSignature = messageSignature(incoming);

      state.currentUser = data.current_user || state.currentUser;
      state.partner = data.user || state.partner;
      state.messages = incoming;

      updateProfile(state.partner);
      clearConnectionError();

      if (oldSignature !== newSignature || !options.keepPosition) {
        renderMessages(Boolean(options.keepPosition));
      }

      if ($("welcomeCard")) {
        $("welcomeCard").hidden = state.messages.length > 0;
      }

      state.lastError = "";
    } catch (error) {
      console.error("Chat load failed:", error);

      if (state.lastError !== error.message) {
        setConnectionError(error.message || "Could not load messages.");
        state.lastError = error.message;
      }

      if (!state.partner) setStatus("Unable to connect");
    } finally {
      state.loading = false;

      if (state.loadAgain) {
        state.loadAgain = false;

        if (document.visibilityState === "visible") {
          void loadMessages({ keepPosition: true });
        }
      }
    }
  }

  async function markRead() {
    if (!partnerId || document.visibilityState === "hidden") return;

    try {
      await request(
        `/api/chat/${encodeURIComponent(partnerId)}/read`,
        { method: "POST" }
      );
    } catch (error) {
      // Reading history may already mark messages read on the server.
      console.debug("Mark read unavailable:", error.message);
    }
  }
async function sendMessage() {
  if (!partnerId || state.sending) return;

  const input = $("messageInput");
  if (!input) return;

  const content = input.value.trim();

  if (!content && !state.file) {
    toast("Type a message or attach a file.");
    return;
  }

  const form = new FormData();
  form.append("receiver_id", partnerId);
  form.append("content", content);

  if (state.file) {
    form.append("file", state.file);
  }

  state.sending = true;

  if ($("sendButton")) $("sendButton").disabled = true;

  try {
    const data = await request("/api/chat/send", {
      method: "POST",
      body: form
    });

    if (data.success === false || !data.message) {
      throw new Error(data.message || "Server did not confirm the message.");
    }

    const sentMessage = normalizeMessage(data.message);

    // Show the confirmed message immediately.
    if (
      !state.messages.some(
        message => String(message.id) === String(sentMessage.id)
      )
    ) {
      state.messages.push(sentMessage);
    }

    input.value = "";
    resizeInput();
    clearAttachment();
    clearReply();
    renderMessages(false);

    toast("Message sent.");

    // Refresh history separately; a refresh failure should not
    // make a successfully sent message appear to have failed.
    void loadMessages({ keepPosition: true });
    void markRead();

  } catch (error) {
    console.error("UtaNexa send error:", error);
    toast(error.message || "Message could not be sent.", true);
  } finally {
    state.sending = false;

    if ($("sendButton")) $("sendButton").disabled = false;

    input.focus();
  }
}

  function resizeInput() {
    const input = $("messageInput");
    if (!input) return;

    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  function setAttachment(file) {
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    const video =
      file.type.startsWith("video/") ||
      ["mp4", "mov", "webm"].includes(ext);

    const max = video
      ? 100 * 1024 * 1024
      : 25 * 1024 * 1024;

    if (file.size > max) {
      toast(video ? "Video limit is 100 MB." : "File limit is 25 MB.", true);
      return;
    }

    state.file = file;

    if ($("previewName")) $("previewName").textContent = file.name;
    if ($("previewSize")) $("previewSize").textContent = formatBytes(file.size);

    if ($("previewIcon")) {
      $("previewIcon").textContent =
        file.type.startsWith("image/") ? "▧" :
        file.type.startsWith("video/") ? "▶" :
        file.type.startsWith("audio/") ? "♫" : "▤";
    }

    if ($("uploadPreview")) $("uploadPreview").hidden = false;
  }

  function clearAttachment() {
    state.file = null;

    if ($("fileInput")) $("fileInput").value = "";
    if ($("uploadPreview")) $("uploadPreview").hidden = true;
  }

  function setReply(message) {
    state.reply = message;

    if ($("replyPreviewName")) {
      $("replyPreviewName").textContent =
        isMine(message) ? "You" : (state.partner?.name || "User");
    }

    if ($("replyPreviewText")) {
      $("replyPreviewText").textContent =
        message.content || (message.media_url ? "Attachment" : "Message");
    }

    if ($("replyPreview")) $("replyPreview").hidden = false;

    hideMessageActions();

    $("messageInput")?.focus();

    toast(
      "Reply selected. The current backend does not save reply links; your message will send as normal text."
    );
  }

  function clearReply() {
    state.reply = null;

    if ($("replyPreview")) $("replyPreview").hidden = true;
  }

  function hideMessageActions() {
    if ($("messageActions")) $("messageActions").hidden = true;
    state.selected = null;
  }

  function openMessageActions(message, x, y) {
    state.selected = message;

    const actions = $("messageActions");
    if (!actions) return;

    const del = actions.querySelector('[data-message-action="delete"]');

    if (del) del.hidden = false;

    actions.hidden = false;

    if (Number.isFinite(x) && Number.isFinite(y)) {
      const width = Math.min(actions.offsetWidth || 270, window.innerWidth - 16);
      const height = actions.offsetHeight || 150;

      actions.style.position = "fixed";
      actions.style.left =
        Math.max(8, Math.min(x, window.innerWidth - width - 8)) + "px";
      actions.style.top =
        Math.max(8, Math.min(y, window.innerHeight - height - 8)) + "px";
    }
  }

  async function deleteMessage(mode) {
    const message = state.selected;
    if (!message) return;

    if (mode === "everyone" && !isMine(message)) {
      toast("You can only delete your own message for everyone.", true);
      return;
    }

    try {
      if (mode === "everyone") {
        await request(
          `/api/chat/message/${encodeURIComponent(message.id)}/delete`,
          { method: "POST" }
        );

        hideMessageActions();

        if ($("actionSheet")) $("actionSheet").hidden = true;

        await loadMessages({ keepPosition: true });
        toast("Message deleted.");
      } else {
        // No server-side delete-for-me endpoint exists.
        state.messages = state.messages.filter(
          item => String(item.id) !== String(message.id)
        );

        hideMessageActions();

        if ($("actionSheet")) $("actionSheet").hidden = true;

        renderMessages(true);
        toast("Hidden until this chat reloads. Server delete-for-me is not available.");
      }
    } catch (error) {
      toast(error.message || "Could not delete message.", true);
    }
  }

  async function reactToMessage(emoji) {
    const message = state.selected;

    hideMessageActions();

    if (!message) return;

    toast(
      `Reaction ${emoji} selected. Saving reactions requires a backend endpoint.`
    );
  }

  async function copyMessage() {
    const message = state.selected;
    if (!message) return;

    const text = message.content || message.media_url || "";

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(text);
      toast("Message copied.");
    } catch (_) {
      toast("Clipboard access is not available.", true);
    }

    hideMessageActions();
  }

  function closeMenus() {
    if ($("chatMenu")) $("chatMenu").hidden = true;
    if ($("attachMenu")) $("attachMenu").hidden = true;
  }

  function showSheet(title, contentBuilder) {
    closeMenus();

    if (!$("actionSheet") || !$("actionSheetContent")) return;

    $("actionSheetTitle").textContent = title;

    const content = $("actionSheetContent");
    content.replaceChildren();

    contentBuilder(content);
    $("actionSheet").hidden = false;
  }

  function option(parent, title, subtitle, callback, danger = false) {
    const button = makeElement(
      "button",
      "sheet-option" + (danger ? " danger" : "")
    );

    button.type = "button";

    const text = makeElement("span");
    text.appendChild(makeElement("span", "", title));

    if (subtitle) {
      text.appendChild(makeElement("small", "", subtitle));
    }

    button.appendChild(text);
    button.appendChild(makeElement("span", "", "›"));
    button.addEventListener("click", callback);

    parent.appendChild(button);

    return button;
  }

  function showChatCategories() {
    showSheet("Chat", content => {
      ["Connected", "Friend", "Family"].forEach(category => {
        option(
          content,
          category,
          `Set this conversation as ${category.toLowerCase()}`,
          () => {
            toast(
              "Category saving is not connected in this chat script. Existing connection-category API is separate."
            );

            $("actionSheet").hidden = true;
          }
        );
      });
    });
  }

  function showPrivacy() {
    showSheet("Privacy for this person", content => {
      const note = makeElement(
        "p",
        "",
        "These controls are visual only until per-person privacy is implemented on the server."
      );

      note.style.cssText =
        "font-size:12px;line-height:1.6;color:#9aa9bf";

      content.appendChild(note);

      [
        ["Online status", "online"],
        ["Last seen", "last_seen"],
        ["Typing status", "typing"]
      ].forEach(([label, key]) => {
        const row = makeElement("label", "sheet-option");
        const left = makeElement("span", "", label);
        const input = document.createElement("input");

        input.type = "checkbox";
        input.checked = true;
        input.dataset.privacy = key;

        row.append(left, input);
        content.appendChild(row);
      });

      option(content, "Apply for this chat", null, () => {
        toast("Privacy settings are not server-saved yet.");
        $("actionSheet").hidden = true;
      });
    });
  }

  function showMore() {
    showSheet("More", content => {
      option(content, "Report", "Report this account or conversation", () => {
        showSheet("Report", inner => {
          ["Spam", "Harassment", "Fake account", "Inappropriate content", "Other"]
            .forEach(reason => {
              option(inner, reason, null, () => {
                toast("Report submission needs a backend endpoint.");
                $("actionSheet").hidden = true;
              });
            });
        });
      });

      option(content, "Block", "Prevent further communication", () => {
        showSheet("Block user?", inner => {
          option(inner, "Cancel", null, () => {
            $("actionSheet").hidden = true;
          });

          option(
            inner,
            "Block this user",
            "Blocking requires a backend endpoint",
            () => {
              toast("Block feature needs a backend endpoint.", true);
              $("actionSheet").hidden = true;
            },
            true
          );
        });
      });

      option(content, "Clear chat", "Remove conversation history", () => {
        showSheet("Clear chat?", inner => {
          option(inner, "Cancel", null, () => {
            $("actionSheet").hidden = true;
          });

          option(
            inner,
            "Clear this chat",
            "Server-side clear-chat endpoint required",
            () => {
              toast("Clear chat endpoint is not configured.", true);
              $("actionSheet").hidden = true;
            },
            true
          );
        });
      });
    });
  }

  function showMedia() {
    const files = state.messages.filter(message => message.media_url);

    showSheet("Media, links & documents", content => {
      if (!files.length) {
        content.appendChild(
          makeElement("p", "", "No attachments in this conversation yet.")
        );
        return;
      }

      files.forEach(message => {
        const url = profileImageUrl(message.media_url);
        if (!url) return;

        const label =
          message.content ||
          new URL(url).pathname.split("/").pop() ||
          "Open attachment";

        const link = makeElement("a", "sheet-option", label);

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.textDecoration = "none";

        content.appendChild(link);
      });
    });
  }

  function openCallOptions() {
    showSheet("Connect with this person", content => {
      option(content, "Voice call", "Requires a calling service", () => {
        toast("Voice calling is not connected yet.");
        $("actionSheet").hidden = true;
      });

      option(content, "Video call", "Requires signaling and video service", () => {
        toast("Video calling is not connected yet.");
        $("actionSheet").hidden = true;
      });

      option(content, "Share call link", "Copy a proposed call URL", async () => {
        const link =
          `${location.origin}/call?user_id=${encodeURIComponent(partnerId || "")}`;

        try {
          await navigator.clipboard.writeText(link);
          toast("Link copied. A real call room must be configured before it can connect.");
        } catch (_) {
          toast(link);
        }

        $("actionSheet").hidden = true;
      });
    });
  }

  function openProfileViewer() {
    const url = profileImageUrl(state.partner?.profile_photo);

    state.zoom = 1;
    updateZoomLabel();

    if ($("viewerImage")) {
      $("viewerImage").hidden = !url;

      if (url) {
        $("viewerImage").src = url;
      } else {
        $("viewerImage").removeAttribute("src");
      }
    }

    if ($("viewerAvatar")) $("viewerAvatar").hidden = !!url;
    if ($("dpViewer")) $("dpViewer").hidden = false;
  }

  function updateZoomLabel() {
    if ($("zoomLevel")) {
      $("zoomLevel").textContent = Math.round(state.zoom * 100) + "%";
    }

    if ($("viewerImage")) {
      $("viewerImage").style.transform = `scale(${state.zoom})`;
    }
  }

  function fillEmojiGrid(filter = "") {
    const grid = $("emojiGrid");
    if (!grid) return;

    grid.replaceChildren();

    EMOJIS.filter(emoji => !filter || emoji.includes(filter)).forEach(emoji => {
      const button = makeElement("button", "", emoji);

      button.type = "button";
      button.addEventListener("click", () => {
        insertAtCursor($("messageInput"), emoji);
        $("messageInput")?.focus();
      });

      grid.appendChild(button);
    });
  }

  function insertAtCursor(input, text) {
    if (!input) return;

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    input.setRangeText(text, start, end, "end");
    resizeInput();
  }

  function toggleEmojiPanel() {
    const panel = $("emojiPanel");
    if (!panel) return;

    panel.hidden = !panel.hidden;

    if (!panel.hidden) fillEmojiGrid();
  }

  async function startVoiceRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast("Voice recording is not supported in this browser.");
      return;
    }

    if (state.recording) {
      state.mediaRecorder?.stop();
      return;
    }

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      state.audioChunks = [];

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/webm",
        "audio/ogg"
      ];

      const mimeType = mimeCandidates.find(type =>
        MediaRecorder.isTypeSupported?.(type)
      );

      state.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      state.mediaRecorder.ondataavailable = event => {
        if (event.data?.size) state.audioChunks.push(event.data);
      };

      state.mediaRecorder.onerror = () => {
        toast("Voice recording failed.", true);
      };

      state.mediaRecorder.onstop = () => {
        const recorder = state.mediaRecorder;
        const type = recorder?.mimeType || "audio/webm";
        const ext = type.includes("ogg") ? "ogg" : "webm";

        const blob = new Blob(state.audioChunks, { type });

        stream.getTracks().forEach(track => track.stop());

        state.recording = false;

        if ($("micButton")) {
          $("micButton").classList.remove("recording");
        }

        if (blob.size) {
          setAttachment(
            new File(
              [blob],
              `voice-message-${Date.now()}.${ext}`,
              { type }
            )
          );

          toast(
            "Recording ready. Backend upload support for this audio format must be enabled."
          );
        }
      };

      state.mediaRecorder.start();
      state.recording = true;

      if ($("micButton")) {
        $("micButton").classList.add("recording");
      }

      toast("Recording… tap the microphone again to finish.");
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      toast("Microphone permission denied or unavailable.", true);
    }
  }

  function setupEvents() {
    $("backButton")?.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.href = "/";
    });

    $("selectedAvatarButton")?.addEventListener("click", openProfileViewer);

    $("closeImageViewer")?.addEventListener("click", () => {
      $("dpViewer").hidden = true;
    });

    $("zoomIn")?.addEventListener("click", () => {
      state.zoom = Math.min(3, state.zoom + 0.25);
      updateZoomLabel();
    });

    $("zoomOut")?.addEventListener("click", () => {
      state.zoom = Math.max(0.5, state.zoom - 0.25);
      updateZoomLabel();
    });

    $("zoomReset")?.addEventListener("click", () => {
      state.zoom = 1;
      updateZoomLabel();
    });

    $("coupleButton")?.addEventListener("click", () => {
      // Existing Couple Chat page remains untouched.
      location.href =
        `/couple-chat?partner_user_id=${encodeURIComponent(partnerId || "")}`;
    });

    $("callButton")?.addEventListener("click", openCallOptions);

    $("chatMenuButton")?.addEventListener("click", event => {
      event.stopPropagation();

      if ($("attachMenu")) $("attachMenu").hidden = true;

      if ($("chatMenu")) {
        $("chatMenu").hidden = !$("chatMenu").hidden;
      }
    });

    $("chatMenu")?.addEventListener("click", event => {
      const button = event.target.closest("[data-menu]");
      if (!button) return;

      const action = button.dataset.menu;

      if (action === "chat") {
        showChatCategories();
      } else if (action === "privacy") {
        showPrivacy();
      } else if (action === "mute") {
        state.muted = !state.muted;

        toast(
          state.muted
            ? "Mute selected for this page only."
            : "Page mute disabled."
        );

        closeMenus();
      } else if (action === "search") {
        closeMenus();

        if ($("searchBar")) $("searchBar").hidden = false;
        $("messageSearch")?.focus();
      } else if (action === "media") {
        showMedia();
      } else if (action === "more") {
        showMore();
      }
    });

    $("messageSearch")?.addEventListener("input", event => {
      state.search = event.target.value;
      renderMessages(true);
    });

    $("clearSearch")?.addEventListener("click", () => {
      if ($("messageSearch")) $("messageSearch").value = "";
      state.search = "";

      if ($("searchBar")) $("searchBar").hidden = true;

      renderMessages(true);
    });

    $("attachButton")?.addEventListener("click", event => {
      event.stopPropagation();

      if ($("chatMenu")) $("chatMenu").hidden = true;

      if ($("attachMenu")) {
        $("attachMenu").hidden = !$("attachMenu").hidden;
      }
    });

    $("attachMenu")?.addEventListener("click", event => {
      const button = event.target.closest("[data-attach]");
      if (!button) return;

      const type = button.dataset.attach;
      const input = $("fileInput");

      if (!input) return;

      input.removeAttribute("capture");

      if (type === "image") {
        input.accept = "image/*,video/*";
      } else if (type === "audio") {
        input.accept = "audio/*";
      } else {
        input.accept =
          ".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
      }

      input.click();
      $("attachMenu").hidden = true;
    });

    $("cameraButton")?.addEventListener("click", () => {
      const input = $("fileInput");
      if (!input) return;

      input.accept = "image/*,video/*";
      input.setAttribute("capture", "environment");
      input.click();
    });

    $("fileInput")?.addEventListener("change", event => {
      setAttachment(event.target.files?.[0]);
      event.target.removeAttribute("capture");
    });

    $("removeAttachment")?.addEventListener("click", clearAttachment);

    $("sendButton")?.addEventListener("click", sendMessage);

    $("messageInput")?.addEventListener("input", resizeInput);
        // Send typing status to the chat partner
    $("messageInput")?.addEventListener("input", () => {
      sendTypingStatus(true);

      if (state.typingTimer) {
        clearTimeout(state.typingTimer);
      }

      state.typingTimer = window.setTimeout(() => {
        sendTypingStatus(false);
        state.typingTimer = null;
      }, 1500);
    });

    $("messageInput")?.addEventListener("blur", () => {
      sendTypingStatus(false);

      if (state.typingTimer) {
        clearTimeout(state.typingTimer);
        state.typingTimer = null;
      }
    });

    $("messageInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing) {
        event.preventDefault();
        void sendMessage();
      }
    });

    $("emojiButton")?.addEventListener("click", toggleEmojiPanel);

    $("closeEmojiPanel")?.addEventListener("click", () => {
      if ($("emojiPanel")) $("emojiPanel").hidden = true;
    });

    $("emojiSearch")?.addEventListener("input", event => {
      fillEmojiGrid(event.target.value.trim());
    });

    document.querySelectorAll("[data-emoji-tab]").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-emoji-tab]").forEach(tab => {
          tab.classList.toggle("active", tab === button);
        });

        const isGif = button.dataset.emojiTab === "gif";

        if ($("gifPanel")) $("gifPanel").hidden = !isGif;
        if ($("emojiGrid")) $("emojiGrid").hidden = isGif;
        if ($("emojiSearch")) $("emojiSearch").hidden = isGif;
      });
    });

    $("gifSearchButton")?.addEventListener("click", () => {
      toast("GIF search needs a configured GIF provider API.");
    });

    $("micButton")?.addEventListener("click", () => {
      void startVoiceRecording();
    });

    $("retryButton")?.addEventListener("click", () => {
      void loadMessages();
    });

    $("closeActionSheet")?.addEventListener("click", () => {
      if ($("actionSheet")) $("actionSheet").hidden = true;
    });

    $("actionSheet")?.addEventListener("click", event => {
      if (event.target === $("actionSheet")) {
        $("actionSheet").hidden = true;
      }
    });

    $("messageActions")?.addEventListener("click", async event => {
      const reaction = event.target.closest("[data-reaction]");

      if (reaction) {
        await reactToMessage(reaction.dataset.reaction);
        return;
      }

      const button = event.target.closest("[data-message-action]");
      if (!button || !state.selected) return;

      const action = button.dataset.messageAction;
      const message = state.selected;

      if (action === "reply") {
        setReply(message);
      } else if (action === "copy") {
        await copyMessage();
      } else if (action === "delete") {
        showSheet("Delete message", content => {
          if (isMine(message)) {
            option(
              content,
              "Delete for everyone",
              null,
              () => void deleteMessage("everyone"),
              true
            );
          }

          option(
            content,
            "Delete for me",
            null,
            () => void deleteMessage("me"),
            true
          );

          option(content, "Cancel", null, () => {
            $("actionSheet").hidden = true;
            hideMessageActions();
          });
        });
      } else if (action === "info") {
        showSheet("Message info", content => {
          option(
            content,
            "Sent",
            messageTime(message.created_at) || "Time unavailable",
            () => {}
          );

          option(
            content,
            "Read status",
            message.is_read ? "Read according to server" : "Not marked as read",
            () => {}
          );

          option(content, "Message ID", String(message.id), async () => {
            try {
              await navigator.clipboard.writeText(String(message.id));
              toast("Message ID copied.");
            } catch (_) {
              toast("Clipboard unavailable.", true);
            }
          });
        });

        hideMessageActions();
      } else if (action === "pin") {
        toast("Pinning requires a backend endpoint.", true);
        hideMessageActions();
      } else if (action === "share") {
        const text = message.content || message.media_url || "";

        if (navigator.share) {
          navigator.share({ text }).catch(() => {});
        } else {
          try {
            await navigator.clipboard.writeText(text);
            toast("Message copied for sharing.");
          } catch (_) {
            toast("Sharing is unavailable.", true);
          }
        }

        hideMessageActions();
      }
    });

    $("cancelReply")?.addEventListener("click", clearReply);

    document.addEventListener("click", event => {
      if (!event.target.closest("#chatMenu") &&
          !event.target.closest("#chatMenuButton")) {
        if ($("chatMenu")) $("chatMenu").hidden = true;
      }

      if (!event.target.closest("#attachMenu") &&
          !event.target.closest("#attachButton")) {
        if ($("attachMenu")) $("attachMenu").hidden = true;
      }

      if (!event.target.closest("#messageActions") &&
          !event.target.closest(".message-bubble")) {
        hideMessageActions();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void loadMessages({ keepPosition: true });
        void markRead();
      }
    });

    window.addEventListener("beforeunload", () => {
      if (state.poll) clearInterval(state.poll);

      disconnectPresence();

      if (state.mediaRecorder?.state === "recording") {
        state.mediaRecorder.stop();
      }
    });
  }

  async function init() {
    setupEvents();
    fillEmojiGrid();

    if (!partnerId) {
      setConnectionError(
        "No chat partner selected. Open a conversation from your connections."
      );

      setStatus("User not selected");
      return;
    }

    await loadMessages();
    connectPresence();
    await markRead();

    state.poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadMessages({ keepPosition: true });
        void markRead();
      }
    }, 5000);
  }

  void init();
})();
