(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    partnerId: null,
    currentUserId: null,
    partnerName: "Partner",
    partnerOnline: false,
    mode: "calm",
    messages: [],
    realtime: null,
    typingTimer: null,
    emojiCategory: "Smileys",
    mediaRecorder: null,
    audioChunks: [],
    recordingStarted: 0,
    recordingTimer: null
  };

  const MOODS = {
    romantic: ["❤️", "Romantic", "romantic"],
    deep_love: ["💗", "Deep Love", "deep-love"],
    happy: ["😊", "Happy", "happy"],
    funny: ["😂", "Funny", "funny"],
    sad: ["🥺", "Sad", "sad"],
    emotional: ["🥹", "Emotional", "emotional"],
    angry: ["😠", "Angry", "angry"],
    frustrated: ["😤", "Frustrated", "frustrated"],
    caring: ["🤗", "Caring", "caring"],
    comfort: ["🫂", "Comfort", "comfort"],
    flirty: ["😉", "Flirty", "flirty"],
    passionate: ["🔥", "Passionate", "passionate"],
    good_night: ["🌙", "Good Night", "good-night"],
    good_morning: ["🌅", "Good Morning", "good-morning"],
    memory: ["📸", "Memory", "memory"],
    celebration: ["🎉", "Celebration", "celebration"],
    birthday: ["🎂", "Birthday", "birthday"],
    future_marriage: ["💍", "Future", "future"],
    missing_you: ["💌", "Missing You", "missing"],
    apology: ["🙏", "Apology", "apology"],
    appreciation: ["🌷", "Appreciation", "appreciation"],
    game: ["🎮", "Game", "game"],
    photo_memory: ["🖼️", "Photo Memory", "photo-memory"],
    serious_talk: ["💬", "Serious Talk", "serious"],
    deep_conversation: ["🌌", "Deep Talk", "deep-conversation"],
    calm: ["🕊️", "Calm", "calm"]
  };

  const QUICK_REPLIES = {
    romantic: ["I love you ❤️", "Miss you jaan", "You make me smile"],
    deep_love: ["You mean everything to me 💗", "I choose you, always"],
    happy: ["You made my day 😊", "Let's make more memories"],
    funny: ["You are so silly 😂", "Tell me a joke"],
    sad: ["I'm feeling low 🥺", "Please talk to me"],
    emotional: ["You matter so much to me", "Stay with me 🫂"],
    angry: ["I'm upset right now", "Let's talk calmly"],
    frustrated: ["Please listen to me", "Let's solve this together"],
    caring: ["Have you eaten?", "Take care of yourself ❤️"],
    comfort: ["It's okay, I'm here", "You are not alone"],
    flirty: ["Guess what I'm thinking 😉", "You're looking cute"],
    passionate: ["I can't stop thinking about you 🔥"],
    good_night: ["Good night, jaan 🌙", "Sweet dreams ❤️"],
    good_morning: ["Good morning ❤️", "Have a lovely day"],
    memory: ["Remember our first chat?", "That day was special"],
    celebration: ["We did it! 🎉", "Here's to us"],
    birthday: ["Happy birthday, my favourite person 🎂"],
    future_marriage: ["Imagine our future home 💍", "Let's grow together"],
    missing_you: ["I miss you so much 💌", "Wish you were here"],
    apology: ["I'm sorry ❤️", "Can we talk?"],
    appreciation: ["Thank you for being you 🌷", "You're special to me"],
    game: ["Truth or dare?", "Let's play a quick game 🎮"],
    photo_memory: ["This reminds me of us 📸"],
    serious_talk: ["Can we talk about something?", "Please hear me out"],
    deep_conversation: ["What makes you feel loved?", "What's your biggest dream?"],
    calm: ["I'm listening 🕊️", "Let's take it slowly"]
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

  function getPartnerId() {
    const params = new URLSearchParams(location.search);

    return (
      params.get("partner_id") ||
      params.get("partner") ||
      params.get("user_id") ||
      document.body.dataset.partnerId ||
      $("coupleApp")?.dataset.partnerId ||
      null
    );
  }

  function storageKey(suffix) {
    return `utanexa_couple_${state.partnerId || "unknown"}_${suffix}`;
  }

  function toast(message) {
    const element = $("coupleToast");
    if (!element) {
      alert(message);
      return;
    }

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(element._timer);

    element._timer = setTimeout(() => {
      element.classList.remove("show");
    }, 2500);
  }

  function setConnection(status) {
    const element = $("couplePartnerStatus");
    if (!element) return;

    if (status === "connected" || status === "open") {
      element.textContent = state.partnerOnline ? "Online" : "Connected";
    } else if (status === "connecting" || status === "reconnecting") {
      element.textContent = "Connecting…";
    } else {
      element.textContent = "Offline";
    }
  }

  function setPartnerPresence(online, lastSeen) {
    state.partnerOnline = Boolean(online);

    const dot = $("coupleOnlineDot");
    if (dot) {
      dot.hidden = !state.partnerOnline;
      dot.classList.toggle("online", state.partnerOnline);
    }

    const status = $("couplePartnerStatus");

    if (status) {
      if (state.partnerOnline) {
        status.textContent = "Online";
      } else if (lastSeen) {
        const date = new Date(lastSeen);

        status.textContent = Number.isNaN(date.getTime())
          ? "Offline"
          : "Last seen " + date.toLocaleString([], {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            });
      } else {
        status.textContent = "Offline";
      }
    }
  }

  function normalizeMessage(raw = {}) {
    return {
      id: String(
        raw.id ??
        raw.message_id ??
        raw.client_message_id ??
        `local_${Date.now()}_${Math.random().toString(36).slice(2)}`
      ),
      clientId: raw.client_message_id || null,
      senderId: raw.sender_id ?? raw.senderId ?? null,
      receiverId: raw.receiver_id ?? raw.receiverId ?? null,
      content: raw.content ?? raw.message ?? raw.text ?? "",
      mediaUrl: raw.media_url ?? raw.mediaUrl ?? null,
      mediaType: raw.media_type ?? raw.mediaType ?? null,
      messageType: raw.message_type ?? raw.messageType ?? "text",
      timestamp: raw.timestamp ?? raw.created_at ?? new Date().toISOString(),
      status: raw.status ?? "sent",
      pending: Boolean(raw.pending),
      failed: Boolean(raw.failed)
    };
  }

  function isOwn(message) {
    if (message.senderId == null || state.currentUserId == null) {
      return false;
    }

    return String(message.senderId) === String(state.currentUserId);
  }

  function messageTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function renderMessage(message) {
    const own = isOwn(message);

    const ticks = !own
      ? ""
      : message.status === "seen"
        ? '<span class="message-ticks seen">✓✓</span>'
        : message.status === "delivered"
          ? '<span class="message-ticks">✓✓</span>'
          : '<span class="message-ticks">✓</span>';

    let mediaHTML = "";

    if (message.mediaUrl) {
      if (String(message.mediaType || "").startsWith("image/")) {
        mediaHTML = `
          <a href="${escapeHTML(message.mediaUrl)}"
             target="_blank"
             rel="noopener noreferrer">
            <img class="message-image"
                 src="${escapeHTML(message.mediaUrl)}"
                 alt="Shared image">
          </a>`;
      } else {
        mediaHTML = `
          <a href="${escapeHTML(message.mediaUrl)}"
             target="_blank"
             rel="noopener noreferrer">
            Open attachment
          </a>`;
      }
    }

    const content = escapeHTML(message.content)
      .replace(/\n/g, "<br>");

    return `
      <article class="message-bubble ${own ? "own" : "received"}"
               data-message-id="${escapeHTML(message.id)}">
        ${content ? `<div class="message-content">${content}</div>` : ""}
        ${mediaHTML}
        <div class="message-meta">
          <time>${escapeHTML(messageTime(message.timestamp))}</time>
          ${ticks}
          ${message.pending ? '<span class="message-pending">Sending…</span>' : ""}
        </div>
      </article>`;
  }

  function saveMessages() {
    try {
      localStorage.setItem(
        storageKey("messages"),
        JSON.stringify(state.messages.slice(-150))
      );
    } catch (error) {
      console.warn("Local chat cache could not be saved.", error);
    }
  }

  function renderMessages() {
    const box = $("coupleMessages");
    if (!box) return;

    if (!state.messages.length) {
      box.innerHTML = `
        <div class="empty-chat">
          <span>💙</span>
          <strong>Your story starts here</strong>
          <p>Send your first message.</p>
        </div>`;
      return;
    }

    const today = $("coupleDayLabel");

    if (today) {
      today.textContent = "Today";
    }

    box.innerHTML = state.messages.map(renderMessage).join("");

    const conversation = $("coupleConversation");
    if (conversation) {
      conversation.scrollTop = conversation.scrollHeight;
    }

    box.scrollTop = box.scrollHeight;
  }

  function addMessage(raw, options = {}) {
    const message = normalizeMessage(raw);

    const existing = state.messages.find((item) =>
      item.id === message.id ||
      (message.clientId && item.clientId === message.clientId)
    );

    if (existing) {
      Object.assign(existing, message, { pending: false });
    } else {
      state.messages.push(message);
      state.messages = state.messages.slice(-150);
    }

    renderMessages();
    saveMessages();

    if (!options.silent && !isOwn(message)) {
      animateIncoming();
    }

    return existing || message;
  }

  function animateIncoming() {
    const layer = $("coupleEffectsLayer");
    if (!layer) return;

    const mood = MOODS[state.mode] || MOODS.calm;
    const particle = document.createElement("span");

    particle.className = "mood-particle";
    particle.textContent = mood[0];
    particle.setAttribute("aria-hidden", "true");

    layer.appendChild(particle);

    setTimeout(() => particle.remove(), 1800);
  }

  function setMood(mode, sync = true) {
    if (!MOODS[mode]) return;

    state.mode = mode;

    document.body.dataset.coupleMode = mode;

    const app = $("coupleApp");
    if (app) app.dataset.coupleMode = mode;

    const mood = MOODS[mode];
    const background = $("coupleBackgroundLayer");

    if (background) {
      background.dataset.mood = mode;
    }

    const effects = $("coupleEffectsLayer");

    if (effects) {
      effects.dataset.mood = mode;
    }

    try {
      localStorage.setItem(storageKey("mood"), mode);
    } catch {}

    const moodButton = $("coupleHeaderMood");

    if (moodButton) {
      moodButton.textContent = `${mood[0]} ${mood[1]}`;
    }

    document.querySelectorAll("#coupleMoodGrid [data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    renderSuggestions();

    if (sync) {
      fetch("/api/couple-chat/mood", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: state.partnerId,
          mood: mode
        })
      }).catch(() => {});
    }
  }

  function openOverlay(id) {
    const overlay = $(id);
    if (!overlay) return;

    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeOverlay(id) {
    const overlay = $(id);
    if (!overlay) return;

    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }

  function renderSuggestions() {
    const list = $("coupleSuggestionList");
    if (!list) return;

    const suggestions = QUICK_REPLIES[state.mode] || QUICK_REPLIES.calm;

    list.innerHTML = suggestions.map((text) => `
      <button type="button"
              class="suggestion-chip"
              data-suggestion="${escapeHTML(text)}">
        ${escapeHTML(text)}
      </button>
    `).join("");
  }

  function showSuggestions() {
    renderSuggestions();

    const panel = $("coupleSuggestions");
    if (panel) panel.hidden = false;
  }

  function sendText(text) {
    const input = $("coupleMessageInput");
    const content = String(text ?? input?.value ?? "").trim();

    if (!content) return;

    if (!state.partnerId) {
      toast("Partner ID missing. Please reopen this chat.");
      return;
    }

    if (!state.realtime) {
      toast("Chat is connecting. Please wait.");
      return;
    }

    const clientId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const optimistic = {
      id: clientId,
      clientId,
      senderId: state.currentUserId,
      receiverId: state.partnerId,
      content,
      timestamp: new Date().toISOString(),
      status: "sent",
      pending: true
    };

    state.messages.push(optimistic);
    state.messages = state.messages.slice(-150);

    renderMessages();
    saveMessages();

    if (input) {
      input.value = "";
      input.focus();
    }

    const sent = state.realtime.sendMessage({
      content,
      client_message_id: clientId,
      message_type: "text"
    });

    if (!sent) {
      toast("Connection unavailable. Message may be queued.");
    }
  }

  function handleHistory(payload) {
    const list = Array.isArray(payload)
      ? payload
      : payload?.messages;

    if (!Array.isArray(list)) return;

    state.messages = [];

    list.forEach((item) => {
      state.messages.push(normalizeMessage(item));
    });

    state.messages = state.messages.slice(-150);
    renderMessages();
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

    const name = $("couplePartnerName");

    if (name) {
      name.textContent = state.partnerName;
    }

    setPartnerPresence(
      payload.partner_online ?? partner.is_online ?? false,
      payload.partner_last_seen ?? partner.last_seen
    );

    setConnection("connected");
  }

  function handleReceipt(payload = {}) {
    const id = String(
      payload.message_id ??
      payload.id ??
      payload.client_message_id ??
      ""
    );

    const message = state.messages.find((item) =>
      item.id === id ||
      item.clientId === id
    );

    if (!message) return;

    message.status = payload.status || "delivered";
    message.pending = false;

    renderMessages();
    saveMessages();
  }

  function handleTyping(payload = {}) {
    const indicator = $("coupleTyping");
    const name = $("coupleTypingName");

    if (!indicator) return;

    const typing = Boolean(
      payload.is_typing ??
      payload.typing ??
      payload.type === "typing_start"
    );

    indicator.hidden = !typing;

    if (name && payload.username) {
      name.textContent = payload.username;
    }
  }

  function initRealtime() {
    const Realtime =
      window.UsanexCoupleRealtime ||
      window.UtaNexaCoupleRealtime;

    if (!state.partnerId) {
      setConnection("disconnected");
      toast("Partner ID URL mein nahi mila.");
      return;
    }

    if (typeof Realtime !== "function") {
      console.error("couple-realtime.js not loaded");
      setConnection("disconnected");
      toast("Realtime script load nahi hui.");
      return;
    }

    state.realtime = new Realtime({
      partnerId: state.partnerId,

      onConnection: handleConnection,

      onStatus: setConnection,

      onMessage: (message) => {
        const saved = addMessage(message);

        if (!isOwn(saved) && saved.id && state.realtime) {
          state.realtime.sendDelivered(saved.id);
          state.realtime.sendRead(saved.id);
        }
      },

      onHistory: handleHistory,

      onReceipt: handleReceipt,

      onPresence: (payload) => {
        setPartnerPresence(
          payload.is_online ?? payload.online,
          payload.last_seen
        );
      },

      onTyping: handleTyping,

      onError: (error) => {
        console.warn("Couple chat connection error:", error);
      }
    });

    state.realtime.connect();
  }

  // Emoji picker
  const EMOJIS = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","🥹","😊",
    "😍","🥰","😘","😗","😚","😙","😋","😛","😜","🤪",
    "😎","🥳","😭","😢","🥺","😡","😠","🤗","🫂","❤️",
    "🧡","💛","💚","💙","💜","🖤","🤍","💕","💞","💓",
    "💗","💖","💘","💝","💋","🌹","🌷","🌸","✨","⭐",
    "🌙","☀️","🔥","🎉","🎂","💍","🎮","📸","🙏","🕊️"
  ];

  function renderEmojis(search = "") {
    const grid = $("coupleEmojiGrid");
    if (!grid) return;

    const filtered = EMOJIS.filter((emoji) => !search || emoji.includes(search));

    grid.innerHTML = filtered.map((emoji) => `
      <button type="button" class="emoji-item" data-emoji="${emoji}">
        ${emoji}
      </button>
    `).join("");
  }

  function openEmojiPicker() {
    const backdrop = $("couplePickerBackdrop");
    const picker = $("coupleEmojiPicker");

    if (backdrop) backdrop.hidden = false;
    if (picker) picker.hidden = false;

    renderEmojis();
  }

  function closeEmojiPicker() {
    if ($("couplePickerBackdrop")) $("couplePickerBackdrop").hidden = true;
    if ($("coupleEmojiPicker")) $("coupleEmojiPicker").hidden = true;
  }

  function attachFiles(files) {
    if (!files?.length) return;

    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      toast("File size 10 MB se kam rakho.");
      return;
    }

    toast("File select ho gayi. Send karne ke liye backend upload API zaroori hai.");
  }

  // Voice recording
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      state.audioChunks = [];
      state.mediaRecorder = new MediaRecorder(stream);

      state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size) state.audioChunks.push(event.data);
      };

      state.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(state.audioChunks, {
          type: state.mediaRecorder.mimeType || "audio/webm"
        });

        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type
        });

        state.voiceFile = file;

        toast("Voice recording ready. Upload API ke baad send ho payegi.");
      };

      state.mediaRecorder.start();
      state.recordingStarted = Date.now();

      if ($("coupleRecordingBar")) $("coupleRecordingBar").hidden = false;

      state.recordingTimer = setInterval(() => {
        const seconds = Math.floor((Date.now() - state.recordingStarted) / 1000);

        if ($("coupleRecordingTime")) {
          $("coupleRecordingTime").textContent =
            `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
        }
      }, 500);

    } catch (error) {
      toast("Microphone permission allow karo.");
    }
  }

  function stopRecording() {
    clearInterval(state.recordingTimer);

    if (state.mediaRecorder?.state === "recording") {
      state.mediaRecorder.stop();
    }

    if ($("coupleRecordingBar")) $("coupleRecordingBar").hidden = true;
  }

  function exportChat() {
    const content = state.messages.map((message) => {
      const sender = isOwn(message) ? "You" : state.partnerName;

      return `[${messageTime(message.timestamp)}] ${sender}: ${message.content}`;
    }).join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "utanexa-chat.txt";
    link.click();

    URL.revokeObjectURL(url);
    closeOverlay("coupleMenuOverlay");
  }

  function bindEvents() {
    $("coupleComposer")?.addEventListener("submit", (event) => {
      event.preventDefault();
      sendText();
    });

    $("coupleHeaderMood")?.addEventListener("click", () => {
      openOverlay("coupleMoodOverlay");
    });

    $("closeMoodPanel")?.addEventListener("click", () => {
      closeOverlay("coupleMoodOverlay");
    });

    $("coupleMoodOverlay")?.addEventListener("click", (event) => {
      if (event.target.id === "coupleMoodOverlay") {
        closeOverlay("coupleMoodOverlay");
      }
    });

    $("coupleMoodGrid")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mode]");
      if (!button) return;

      setMood(button.dataset.mode);
      closeOverlay("coupleMoodOverlay");
    });

    $("coupleAiButton")?.addEventListener("click", () => {
      openOverlay("coupleAiOverlay");
    });

    $("closeAiPanel")?.addEventListener("click", () => {
      closeOverlay("coupleAiOverlay");
    });

    $("coupleAiOverlay")?.addEventListener("click", (event) => {
      if (event.target.id === "coupleAiOverlay") {
        closeOverlay("coupleAiOverlay");
      }
    });

    $("coupleMenuButton")?.addEventListener("click", () => {
      openOverlay("coupleMenuOverlay");
    });

    $("closeCoupleMenu")?.addEventListener("click", () => {
      closeOverlay("coupleMenuOverlay");
    });

    $("coupleMenuOverlay")?.addEventListener("click", (event) => {
      if (event.target.id === "coupleMenuOverlay") {
        closeOverlay("coupleMenuOverlay");
      }
    });

    $("coupleMenuOverlay")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-menu-action]");
      if (!button) return;

      if (button.dataset.menuAction === "export") {
        exportChat();
      }

      if (button.dataset.menuAction === "clear") {
        if (confirm("Clear locally saved messages from this device?")) {
          state.messages = [];
          saveMessages();
          renderMessages();
        }

        closeOverlay("coupleMenuOverlay");
      }
    });

    $("coupleQuickActions")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;

      if (action === "love") {
        setMood("romantic");
        sendText("I love you ❤️");
      } else if (action === "memory") {
        setMood("memory");
        sendText("Remember our special moments? 📸");
      } else if (action === "question") {
        setMood("deep_conversation");
        showSuggestions();
      } else if (action === "game") {
        setMood("game");
        sendText("Let's play a couple game! 🎮 Truth or dare?");
      }
    });

    $("coupleSuggestions")?.addEventListener("click", (event) => {
      if (event.target.id === "closeSuggestions") {
        $("coupleSuggestions").hidden = true;
        return;
      }

      const button = event.target.closest("[data-suggestion]");
      if (button) sendText(button.dataset.suggestion);
    });

    $("coupleEmojiButton")?.addEventListener("click", openEmojiPicker);
    $("closeEmojiPicker")?.addEventListener("click", closeEmojiPicker);
    $("couplePickerBackdrop")?.addEventListener("click", closeEmojiPicker);

    $("coupleEmojiSearch")?.addEventListener("input", (event) => {
      renderEmojis(event.target.value.trim());
    });

    $("coupleEmojiGrid")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-emoji]");
      if (!button) return;

      const input = $("coupleMessageInput");

      if (input) {
        input.value += button.dataset.emoji;
        input.focus();
      }

      closeEmojiPicker();
    });

    $("coupleAttachButton")?.addEventListener("click", () => {
      $("coupleFileInput")?.click();
    });

    $("coupleCameraButton")?.addEventListener("click", () => {
      $("coupleCameraInput")?.click();
    });

    $("coupleFileInput")?.addEventListener("change", (event) => {
      attachFiles(event.target.files);
    });

    $("coupleCameraInput")?.addEventListener("change", (event) => {
      attachFiles(event.target.files);
    });

    $("coupleVoiceButton")?.addEventListener("click", () => {
      if (state.mediaRecorder?.state === "recording") {
        stopRecording();
      } else {
        startRecording();
      }
    });

    $("coupleStopRecording")?.addEventListener("click", stopRecording);

    $("coupleCancelRecording")?.addEventListener("click", () => {
      if (state.mediaRecorder?.state === "recording") {
        state.mediaRecorder.onstop = null;
        state.mediaRecorder.stop();
      }

      clearInterval(state.recordingTimer);

      if ($("coupleRecordingBar")) $("coupleRecordingBar").hidden = true;
    });

    $("coupleBackButton")?.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.href = "/";
    });

    $("coupleAvatarButton")?.addEventListener("click", () => {
      toast(state.partnerName);
    });

    $("coupleCallButton")?.addEventListener("click", () => {
      toast("Voice/video calling backend abhi connect karna hoga.");
    });

    $("coupleMessageInput")?.addEventListener("input", () => {
      if (!state.realtime) return;

      state.realtime.startTyping();

      clearTimeout(state.typingTimer);

      state.typingTimer = setTimeout(() => {
        state.realtime?.stopTyping();
      }, 1000);
    });

    window.addEventListener("online", () => {
      state.realtime?.connect();
    });

    window.addEventListener("beforeunload", () => {
      state.realtime?.disconnect();
    });
  }

  function init() {
    state.partnerId = getPartnerId();

    try {
      const savedMood = localStorage.getItem(storageKey("mood"));

      if (savedMood && MOODS[savedMood]) {
        state.mode = savedMood;
      }

      const savedMessages = JSON.parse(
        localStorage.getItem(storageKey("messages")) || "[]"
      );

      if (Array.isArray(savedMessages)) {
        state.messages = savedMessages.map(normalizeMessage);
      }
    } catch (error) {
      console.warn("Could not restore local chat.", error);
    }

    renderMessages();
    renderSuggestions();
    setMood(state.mode, false);
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
    sendMessage: sendText,
    setMood,
    openMoodPicker: () => openOverlay("coupleMoodOverlay"),
    openSuggestions: showSuggestions,
    getState: () => ({
      partnerId: state.partnerId,
      partnerName: state.partnerName,
      partnerOnline: state.partnerOnline,
      mood: state.mode,
      messages: state.messages.length
    })
  };
})();
