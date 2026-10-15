(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    partnerId: null,
    currentUserId: null,
    partnerName: "Your Partner",
    partnerOnline: false,
    messages: [],
    mode: "romantic",
    realtime: null,
    typingTimer: null,
    sending: false,
    selectedFile: null,
    clientMessageIds: new Set()
  };

  const MOODS = {
    romantic: {
      label: "Romantic",
      emoji: "❤️",
      title: "Romantic Vibes",
      suggestions: ["I love you ❤️", "You make me smile", "Miss you jaan"],
      effect: "romantic"
    },
    deep_love: {
      label: "Deep Love",
      emoji: "💗",
      title: "Deep Love",
      suggestions: ["You mean everything to me", "I choose you, always", "You are my home"],
      effect: "deep-love"
    },
    happy: {
      label: "Happy",
      emoji: "😊",
      title: "Happy Moments",
      suggestions: ["You made my day!", "Let's make more memories", "I'm so happy with you"],
      effect: "happy"
    },
    funny: {
      label: "Funny",
      emoji: "😂",
      title: "Fun Together",
      suggestions: ["You are so silly 😂", "Tell me a joke", "Let's tease each other"],
      effect: "funny"
    },
    sad: {
      label: "Sad",
      emoji: "🥺",
      title: "A Little Sad",
      suggestions: ["I'm feeling low", "Please talk to me", "I need a little comfort"],
      effect: "sad"
    },
    emotional: {
      label: "Emotional",
      emoji: "🥹",
      title: "From the Heart",
      suggestions: ["You matter so much to me", "I don't want to lose you", "Stay with me"],
      effect: "emotional"
    },
    angry: {
      label: "Angry",
      emoji: "😠",
      title: "Angry Mood",
      suggestions: ["I'm upset right now", "Let's talk calmly", "Give me a little time"],
      effect: "angry"
    },
    frustrated: {
      label: "Frustrated",
      emoji: "😤",
      title: "Feeling Frustrated",
      suggestions: ["Today has been difficult", "Please listen to me", "Let's solve this together"],
      effect: "frustrated"
    },
    caring: {
      label: "Caring",
      emoji: "🤗",
      title: "Care & Support",
      suggestions: ["Have you eaten?", "Take care of yourself", "I'm always here for you"],
      effect: "caring"
    },
    comfort: {
      label: "Comfort",
      emoji: "🫂",
      title: "A Safe Space",
      suggestions: ["It's okay, I'm here", "You don't have to face this alone", "Take your time"],
      effect: "comfort"
    },
    flirty: {
      label: "Flirty",
      emoji: "😉",
      title: "Flirty Vibes",
      suggestions: ["Guess what I'm thinking 😉", "You're looking cute", "Come a little closer"],
      effect: "flirty"
    },
    passionate: {
      label: "Passionate",
      emoji: "🔥",
      title: "Passionate Moments",
      suggestions: ["You drive me crazy ❤️", "I can't stop thinking about you", "You're my favourite person"],
      effect: "passionate"
    },
    good_night: {
      label: "Good Night",
      emoji: "🌙",
      title: "Sweet Dreams",
      suggestions: ["Good night, jaan 🌙", "Dream of us", "Sleep well, my love"],
      effect: "good-night"
    },
    good_morning: {
      label: "Good Morning",
      emoji: "🌅",
      title: "A Beautiful Morning",
      suggestions: ["Good morning ❤️", "Have a lovely day", "You were my first thought"],
      effect: "good-morning"
    },
    memory: {
      label: "Memories",
      emoji: "📸",
      title: "Our Memories",
      suggestions: ["Remember our first chat?", "That day was special", "Let's make a new memory"],
      effect: "memory"
    },
    celebration: {
      label: "Celebration",
      emoji: "🎉",
      title: "Let's Celebrate",
      suggestions: ["We did it!", "Here's to us 🥂", "More happiness ahead"],
      effect: "celebration"
    },
    birthday: {
      label: "Birthday",
      emoji: "🎂",
      title: "Birthday Wishes",
      suggestions: ["Happy birthday, my favourite person 🎂", "You deserve all the happiness", "Make a wish ❤️"],
      effect: "birthday"
    },
    future_marriage: {
      label: "Our Future",
      emoji: "💍",
      title: "Dreaming Together",
      suggestions: ["Imagine our future home", "Let's grow together", "One day, all these dreams"],
      effect: "future"
    },
    missing_you: {
      label: "Missing You",
      emoji: "💌",
      title: "Missing You",
      suggestions: ["I miss you so much", "Wish you were here", "Counting moments until we meet"],
      effect: "missing"
    },
    apology: {
      label: "Sorry",
      emoji: "🙏",
      title: "Making Things Right",
      suggestions: ["I'm sorry", "Can we talk?", "I want to understand your feelings"],
      effect: "apology"
    },
    appreciation: {
      label: "Appreciation",
      emoji: "🌷",
      title: "You Are Appreciated",
      suggestions: ["Thank you for being you", "I appreciate everything you do", "You're special to me"],
      effect: "appreciation"
    },
    game: {
      label: "Games",
      emoji: "🎮",
      title: "Let's Play",
      suggestions: ["Truth or dare?", "Ask me anything", "Let's play a quick game"],
      effect: "game"
    },
    photo_memory: {
      label: "Photo Memory",
      emoji: "🖼️",
      title: "Picture Perfect",
      suggestions: ["This reminds me of us", "Let's take a picture together", "Our best moment ❤️"],
      effect: "photo-memory"
    },
    serious_talk: {
      label: "Serious Talk",
      emoji: "💬",
      title: "Let's Talk Honestly",
      suggestions: ["Can we talk about something?", "I want to be honest", "Please hear me out"],
      effect: "serious"
    },
    deep_conversation: {
      label: "Deep Conversation",
      emoji: "🌌",
      title: "Beyond Small Talk",
      suggestions: ["What makes you feel loved?", "What's your biggest dream?", "What does happiness mean to you?"],
      effect: "deep-conversation"
    },
    calm: {
      label: "Calm",
      emoji: "🕊️",
      title: "Peaceful Moments",
      suggestions: ["Let's take it slowly", "I'm listening", "Everything can wait for a moment"],
      effect: "calm"
    }
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getQueryParam(...names) {
    const params = new URLSearchParams(window.location.search);

    for (const name of names) {
      const value = params.get(name);
      if (value) return value;
    }

    return null;
  }

  function getPartnerId() {
    return (
      getQueryParam("partner_id", "partner", "user_id") ||
      document.body?.dataset?.partnerId ||
      $("coupleChat")?.dataset?.partnerId ||
      $("coupleMessages")?.dataset?.partnerId ||
      null
    );
  }

  function getStorageKey(suffix) {
    return `utanexa_couple_${state.partnerId || "unknown"}_${suffix}`;
  }

  function getSavedMessages() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(getStorageKey("messages")) || "[]"
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveMessages() {
    try {
      // Keep local cache limited.
      localStorage.setItem(
        getStorageKey("messages"),
        JSON.stringify(state.messages.slice(-150))
      );
    } catch (error) {
      console.warn("Could not save local chat cache:", error);
    }
  }

  function getSavedMode() {
    try {
      const saved = localStorage.getItem(getStorageKey("mode"));
      return MOODS[saved] ? saved : "romantic";
    } catch {
      return "romantic";
    }
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function showToast(message) {
    const existing = $("coupleToast");

    if (existing) {
      existing.textContent = message;
      existing.classList.add("show");

      clearTimeout(existing._hideTimer);
      existing._hideTimer = setTimeout(() => {
        existing.classList.remove("show");
      }, 2400);

      return;
    }

    const toast = document.createElement("div");
    toast.id = "coupleToast";
    toast.className = "couple-toast show";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function setConnectionStatus(status) {
    const normalized = String(status || "").toLowerCase();

    const connected = [
      "connected",
      "online",
      "open"
    ].includes(normalized);

    const connecting = [
      "connecting",
      "reconnecting"
    ].includes(normalized);

    const label = connected
      ? (state.partnerOnline ? "Online" : "Connected")
      : connecting
        ? "Connecting…"
        : "Reconnecting…";

    setText("coupleConnectionStatus", label);

    const statusElement = $("coupleConnectionStatus");
    if (statusElement) {
      statusElement.dataset.status = connected
        ? "connected"
        : connecting
          ? "connecting"
          : "disconnected";
    }

    const dot = $("coupleOnlineDot");
    if (dot) {
      dot.classList.toggle("is-online", state.partnerOnline);
      dot.classList.toggle("online", state.partnerOnline);
    }
  }

  function setPartnerOnline(isOnline, lastSeen) {
    state.partnerOnline = Boolean(isOnline);

    const status = $("couplePartnerStatus");
    if (status) {
      status.textContent = state.partnerOnline
        ? "Online"
        : formatLastSeen(lastSeen);
    }

    const dot = $("coupleOnlineDot");
    if (dot) {
      dot.classList.toggle("is-online", state.partnerOnline);
      dot.classList.toggle("online", state.partnerOnline);
    }
  }

  function formatLastSeen(value) {
    if (!value) return "Offline";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Offline";

    return `Last seen ${date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}`;
  }

  function normalizeMessage(raw = {}) {
    const senderId =
      raw.sender_id ??
      raw.senderId ??
      raw.user_id ??
      raw.userId ??
      null;

    const id =
      raw.id ??
      raw.message_id ??
      raw.messageId ??
      raw.client_message_id ??
      `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
      id: String(id),
      messageId: raw.message_id ?? raw.id ?? null,
      clientMessageId: raw.client_message_id ?? null,
      senderId: senderId == null ? null : String(senderId),
      receiverId: raw.receiver_id ?? raw.receiverId ?? null,
      content: raw.content ?? raw.message ?? raw.text ?? "",
      mediaUrl: raw.media_url ?? raw.mediaUrl ?? null,
      mediaType: raw.media_type ?? raw.mediaType ?? null,
      messageType: raw.message_type ?? raw.messageType ?? "text",
      timestamp: raw.timestamp ?? raw.created_at ?? new Date().toISOString(),
      status: raw.status ?? raw.delivery_status ?? "sent",
      isOwn: raw.isOwn,
      pending: Boolean(raw.pending),
      failed: Boolean(raw.failed)
    };
  }

  function isOwnMessage(message) {
    if (typeof message.isOwn === "boolean") {
      return message.isOwn;
    }

    if (state.currentUserId == null || message.senderId == null) {
      return false;
    }

    return String(message.senderId) === String(state.currentUserId);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp || Date.now());

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function receiptMarkup(message) {
    if (!isOwnMessage(message)) return "";

    const status = message.status || "sent";
    const ticks = status === "seen"
      ? "✓✓"
      : status === "delivered"
        ? "✓✓"
        : "✓";

    const className = status === "seen" ? "is-seen" : "";

    return `<span class="couple-message-ticks ${className}" aria-label="${escapeHTML(status)}">${ticks}</span>`;
  }

  function messageMarkup(message) {
    const own = isOwnMessage(message);
    const content = escapeHTML(message.content);
    const media = message.mediaUrl
      ? `<a class="couple-media-link" href="${escapeHTML(message.mediaUrl)}" target="_blank" rel="noopener noreferrer">Open attachment</a>`
      : "";

    const failed = message.failed
      ? `<button type="button" class="couple-retry-message" data-retry-id="${escapeHTML(message.id)}">Retry</button>`
      : "";

    return `
      <article class="couple-message ${own ? "own" : "received"} ${message.pending ? "is-pending" : ""}"
               data-message-id="${escapeHTML(message.id)}">
        <div class="couple-message-bubble">
          ${content ? `<div class="couple-message-text">${content.replace(/\n/g, "<br>")}</div>` : ""}
          ${media}
          <div class="couple-message-meta">
            <time>${escapeHTML(formatTime(message.timestamp))}</time>
            ${receiptMarkup(message)}
            ${failed}
          </div>
        </div>
      </article>
    `;
  }

  function scrollMessagesToBottom() {
    const box = $("coupleMessages");
    if (!box) return;

    box.scrollTop = box.scrollHeight;
  }

  function renderMessages() {
    const box = $("coupleMessages");
    if (!box) return;

    if (state.messages.length === 0) {
      box.innerHTML = `
        <div class="couple-empty-state">
          <div class="couple-empty-emoji">💙</div>
          <h3>Start your conversation</h3>
          <p>Send a message and make this moment yours.</p>
        </div>
      `;
      return;
    }

    box.innerHTML = state.messages.map(messageMarkup).join("");
    scrollMessagesToBottom();
  }

  function addMessage(rawMessage, options = {}) {
    const message = normalizeMessage(rawMessage);

    if (message.clientMessageId) {
      const duplicate = state.messages.find(
        (item) => item.clientMessageId === message.clientMessageId
      );

      if (duplicate) {
        Object.assign(duplicate, message, {
          pending: false,
          failed: false
        });
        renderMessages();
        saveMessages();
        return duplicate;
      }
    }

    const duplicateById = state.messages.find(
      (item) => item.id === message.id
    );

    if (duplicateById) {
      Object.assign(duplicateById, message);
      renderMessages();
      saveMessages();
      return duplicateById;
    }

    state.messages.push(message);

    if (state.messages.length > 150) {
      state.messages = state.messages.slice(-150);
    }

    renderMessages();
    saveMessages();

    if (!options.silent && !isOwnMessage(message)) {
      playIncomingEffect();
    }

    return message;
  }

  function playIncomingEffect() {
    const layer = $("coupleEffectsLayer");
    if (!layer) return;

    const mood = MOODS[state.mode] || MOODS.romantic;
    const particle = document.createElement("span");

    particle.className = `couple-floating-effect effect-${mood.effect}`;
    particle.textContent = mood.emoji;
    particle.setAttribute("aria-hidden", "true");

    layer.appendChild(particle);

    setTimeout(() => particle.remove(), 1800);
  }

  function setMoodVisual(mode) {
    const mood = MOODS[mode] || MOODS.romantic;
    const root = document.documentElement;

    root.dataset.coupleMood = mode;
    root.style.setProperty("--couple-mood-emoji", `"${mood.emoji}"`);

    const layer = $("coupleEffectsLayer");
    if (layer) {
      layer.dataset.mood = mode;
      layer.className = `couple-effects-layer mood-${mood.effect}`;
    }

    setText("coupleMoodTitle", mood.title);
    setText("coupleCurrentMood", `${mood.emoji} ${mood.label}`);

    document.querySelectorAll("[data-couple-mood]").forEach((button) => {
      const active = button.dataset.coupleMood === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    renderMoodSuggestions();
  }

  function setMode(mode, save = true) {
    if (!MOODS[mode]) return;

    state.mode = mode;
    setMoodVisual(mode);

    if (save) {
      try {
        localStorage.setItem(getStorageKey("mode"), mode);
      } catch {}

      saveMoodToServer(mode);
    }
  }

  async function saveMoodToServer(mode) {
    try {
      await fetch("/api/couple-chat/mood", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          partner_id: state.partnerId,
          mood: mode
        })
      });
    } catch (error) {
      console.debug("Mood sync unavailable:", error);
    }
  }

  function renderMoodGrid() {
    const grid = $("coupleMoodGrid");
    if (!grid) return;

    grid.innerHTML = Object.entries(MOODS).map(([key, mood]) => `
      <button type="button"
              class="couple-mood-option ${state.mode === key ? "active" : ""}"
              data-couple-mood="${key}"
              aria-pressed="${state.mode === key}">
        <span class="couple-mood-emoji">${mood.emoji}</span>
        <span class="couple-mood-label">${escapeHTML(mood.label)}</span>
      </button>
    `).join("");
  }

  function renderMoodSuggestions() {
    const container =
      $("coupleMoodSuggestions") ||
      $("coupleQuickReplies");

    if (!container) return;

    const mood = MOODS[state.mode] || MOODS.romantic;

    container.innerHTML = mood.suggestions.map((suggestion) => `
      <button type="button"
              class="couple-suggestion"
              data-couple-suggestion="${escapeHTML(suggestion)}">
        ${escapeHTML(suggestion)}
      </button>
    `).join("");
  }

  function openMoodPicker() {
    const modal =
      $("coupleMoodModal") ||
      $("coupleMoodPicker");

    if (!modal) return;

    modal.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    renderMoodGrid();
  }

  function closeMoodPicker() {
    const modal =
      $("coupleMoodModal") ||
      $("coupleMoodPicker");

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.hidden = true;
  }

  function getComposerValue() {
    const input =
      $("coupleMessageInput") ||
      $("coupleMessage") ||
      $("messageInput");

    return input ? input.value.trim() : "";
  }

  function clearComposer() {
    const input =
      $("coupleMessageInput") ||
      $("coupleMessage") ||
      $("messageInput");

    if (input) {
      input.value = "";
      input.style.height = "";
      input.focus();
    }
  }

  function setSendButtonState(disabled) {
    const button =
      $("coupleSendButton") ||
      $("sendMessageButton");

    if (button) button.disabled = Boolean(disabled);
  }

  function createClientId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function sendMessage(textOverride = null) {
    const text = textOverride == null
      ? getComposerValue()
      : String(textOverride).trim();

    if (!text || state.sending) return;

    if (!state.partnerId) {
      showToast("Partner not found. Please reopen the chat.");
      return;
    }

    if (!state.realtime) {
      showToast("Chat is connecting. Please wait a moment.");
      return;
    }

    const clientId = createClientId();

    const optimisticMessage = {
      id: clientId,
      client_message_id: clientId,
      sender_id: state.currentUserId,
      receiver_id: state.partnerId,
      content: text,
      timestamp: new Date().toISOString(),
      status: "sent",
      isOwn: true,
      pending: true
    };

    state.clientMessageIds.add(clientId);
    addMessage(optimisticMessage, { silent: true });

    clearComposer();

    const sent = state.realtime.sendMessage({
      content: text,
      client_message_id: clientId,
      message_type: "text"
    });

    if (!sent) {
      const localMessage = state.messages.find(
        (item) => item.clientMessageId === clientId || item.id === clientId
      );

      if (localMessage) {
        localMessage.pending = true;
      }

      showToast("Message queued while reconnecting.");
    }
  }

  function retryMessage(id) {
    const message = state.messages.find((item) => item.id === id);
    if (!message || !state.realtime) return;

    const clientId = message.clientMessageId || createClientId();

    message.failed = false;
    message.pending = true;
    renderMessages();

    state.realtime.sendMessage({
      content: message.content,
      media_url: message.mediaUrl,
      media_type: message.mediaType,
      message_type: message.messageType || "text",
      client_message_id: clientId
    });
  }

  function setTypingIndicator(isTyping, username = null) {
    const indicator =
      $("coupleTypingIndicator") ||
      $("coupleTyping");

    if (!indicator) return;

    indicator.hidden = !isTyping;
    indicator.classList.toggle("is-typing", Boolean(isTyping));

    if (isTyping) {
      indicator.textContent = username
        ? `${username} is typing…`
        : "Your partner is typing…";
    }
  }

  function sendTypingState(isTyping) {
    if (!state.realtime) return;

    if (isTyping) {
      state.realtime.startTyping();
    } else {
      state.realtime.stopTyping();
    }
  }

  function handleIncomingMessage(raw) {
    const message = addMessage(raw);

    if (!isOwnMessage(message) && message.messageId && state.realtime) {
      state.realtime.sendDelivered(message.messageId);
      state.realtime.sendRead(message.messageId);
    }
  }

  function handleHistory(payload) {
    const messages = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.messages)
        ? payload.messages
        : [];

    if (messages.length) {
      state.messages = [];
      messages.forEach((message) => {
        addMessage(message, { silent: true });
      });
    } else {
      renderMessages();
    }

    saveMessages();
  }

  function handleConnection(payload = {}) {
    const user = payload.user || {};
    const partner = payload.partner || {};

    state.currentUserId =
      user.id ??
      user.user_id ??
      payload.current_user_id ??
      state.currentUserId;

    state.partnerName =
      partner.name ||
      partner.username ||
      state.partnerName;

    if (partner.name || partner.username) {
      setText("couplePartnerName", state.partnerName);
    }

    setPartnerOnline(
      payload.partner_online ?? partner.is_online ?? false,
      payload.partner_last_seen ?? partner.last_seen
    );

    setConnectionStatus("connected");

    if (payload.room_id) {
      document.body.dataset.coupleRoomId = payload.room_id;
    }

    renderMessages();
  }

  function handleReceipt(payload = {}) {
    const messageId = String(
      payload.message_id ??
      payload.id ??
      payload.client_message_id ??
      ""
    );

    if (!messageId) return;

    const status = String(payload.status || payload.receipt || "delivered");

    const message = state.messages.find((item) =>
      item.id === messageId ||
      String(item.messageId) === messageId ||
      String(item.clientMessageId) === messageId
    );

    if (!message) return;

    message.status = status;
    message.pending = false;

    renderMessages();
    saveMessages();
  }

  function handlePresence(payload = {}) {
    const isOnline =
      payload.is_online ??
      payload.online ??
      payload.partner_online ??
      false;

    setPartnerOnline(isOnline, payload.last_seen);
  }

  function initRealtime() {
    if (!state.partnerId) {
      setConnectionStatus("disconnected");
      showToast("Partner ID missing in the chat URL.");
      return;
    }

    const Realtime =
      window.UsanexCoupleRealtime ||
      window.UtaNexaCoupleRealtime;

    if (typeof Realtime !== "function") {
      console.error("couple-realtime.js was not loaded.");
      setConnectionStatus("disconnected");
      showToast("Chat connection script did not load.");
      return;
    }

    state.realtime = new Realtime({
      partnerId: state.partnerId,

      onConnection(payload) {
        handleConnection(payload || {});
      },

      onStatus(status) {
        setConnectionStatus(status);
      },

      onMessage(message) {
        handleIncomingMessage(message);
      },

      onHistory(history) {
        handleHistory(history);
      },

      onReceipt(receipt) {
        handleReceipt(receipt);
      },

      onPresence(presence) {
        handlePresence(presence);
      },

      onTyping(payload) {
        setTypingIndicator(
          payload.is_typing ?? payload.typing ?? true,
          payload.username || payload.name || null
        );
      },

      onError(error) {
        console.warn("Couple chat realtime:", error);
      }
    });

    state.realtime.connect();
  }

  function handleFileSelection(file) {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/mp4",
      "audio/ogg"
    ];

    if (!allowedTypes.includes(file.type)) {
      showToast("This file type is not supported.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      showToast("File must be 10 MB or smaller.");
      return;
    }

    state.selectedFile = file;

    const preview =
      $("coupleAttachmentPreview") ||
      $("coupleFilePreview");

    if (preview) {
      preview.hidden = false;
      preview.textContent = `Selected: ${file.name}`;
    }

    showToast("File selected. Upload API is required to send it.");
  }

  function bindEvents() {
    const sendButton =
      $("coupleSendButton") ||
      $("sendMessageButton");

    const input =
      $("coupleMessageInput") ||
      $("coupleMessage") ||
      $("messageInput");

    if (sendButton) {
      sendButton.addEventListener("click", () => sendMessage());
    }

    if (input) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      });

      input.addEventListener("input", () => {
        sendTypingState(true);

        clearTimeout(state.typingTimer);
        state.typingTimer = setTimeout(() => {
          sendTypingState(false);
        }, 1200);
      });
    }

    document.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-couple-mood], [data-couple-suggestion]");

      if (!target) return;

      if (target.matches("[data-couple-mood]")) {
        setMode(target.dataset.coupleMood);
        closeMoodPicker();
        return;
      }

      if (target.matches("[data-couple-suggestion]")) {
        sendMessage(target.dataset.coupleSuggestion);
        return;
      }

      if (target.id === "coupleMoodButton" ||
          target.id === "coupleMoodToggle" ||
          target.id === "openCoupleMood") {
        openMoodPicker();
        return;
      }

      if (target.id === "coupleMoodClose" ||
          target.id === "closeCoupleMood") {
        closeMoodPicker();
        return;
      }

      if (target.id === "coupleAttachButton" ||
          target.id === "coupleAttachmentButton") {
        const fileInput =
          $("coupleFileInput") ||
          $("coupleAttachmentInput");

        if (fileInput) fileInput.click();
        else showToast("File input is not present in the HTML.");
        return;
      }

      if (target.matches("[data-retry-id]")) {
        retryMessage(target.dataset.retryId);
      }
    });

    const fileInput =
      $("coupleFileInput") ||
      $("coupleAttachmentInput");

    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        handleFileSelection(file);
      });
    }

    const modal =
      $("coupleMoodModal") ||
      $("coupleMoodPicker");

    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeMoodPicker();
      });
    }

    window.addEventListener("online", () => {
      if (state.realtime) state.realtime.connect();
    });

    window.addEventListener("offline", () => {
      setConnectionStatus("disconnected");
    });

    window.addEventListener("beforeunload", () => {
      if (state.realtime) state.realtime.disconnect();
    });
  }

  function init() {
    state.partnerId = getPartnerId();
    state.mode = getSavedMode();
    state.messages = getSavedMessages();

    renderMoodGrid();
    setMoodVisual(state.mode);
    renderMessages();
    bindEvents();
    initRealtime();

    console.info("UtaNexa Couple Chat initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.UtaNexaCoupleChat = {
    sendMessage,
    setMode,
    openMoodPicker,
    closeMoodPicker,
    getState() {
      return {
        partnerId: state.partnerId,
        partnerName: state.partnerName,
        partnerOnline: state.partnerOnline,
        mode: state.mode,
        messageCount: state.messages.length
      };
    }
  };
})();
