/* =========================================================
   UTANEXA — COUPLE CHAT (OPTIMIZED REPLACEMENT)
   55 moods • local mood detection • safe rendering • receipts
   Realtime contract: window.UsanexCoupleRealtime
   ========================================================= */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const MODES = [
    ["romantic", "Romantic", "💗"],
    ["deep_love", "Deep Love", "❤️"],
    ["happy", "Happy", "😊"],
    ["funny", "Funny", "😂"],
    ["sad", "Sad", "🌧️"],
    ["emotional", "Emotional", "🥹"],
    ["angry", "Angry", "🔥"],
    ["frustrated", "Frustrated", "😤"],
    ["caring", "Caring", "🤗"],
    ["comfort", "Comfort", "🫂"],
    ["flirty", "Flirty", "😘"],
    ["passionate", "Passionate", "💋"],
    ["good_night", "Good Night", "🌙"],
    ["good_morning", "Good Morning", "🌅"],
    ["memory", "Memory", "📸"],
    ["celebration", "Celebration", "🎉"],
    ["birthday", "Birthday", "🎂"],
    ["future_marriage", "Future & Marriage", "💍"],
    ["missing_you", "Missing You", "🥺"],
    ["apology", "Apology", "🕊️"],
    ["appreciation", "Appreciation", "✨"],
    ["game", "Game", "🎮"],
    ["photo_memory", "Photo Memory", "🖼️"],
    ["serious_talk", "Serious Talk", "🗣️"],
    ["deep_conversation", "Deep Conversation", "🌌"],
    ["calm", "Calm", "🍃"],
    ["excited", "Excited", "🤩"],
    ["jealous", "Jealous", "💚"],
    ["lonely", "Lonely", "🌧️"],
    ["grateful", "Grateful", "🙏"],
    ["hopeful", "Hopeful", "🌈"],
    ["worried", "Worried", "🫶"],
    ["stressed", "Stressed", "😮‍💨"],
    ["confused", "Confused", "🤔"],
    ["shy", "Shy", "☺️"],
    ["proud", "Proud", "🏆"],
    ["supportive", "Supportive", "🤝"],
    ["playful", "Playful", "😜"],
    ["teasing", "Teasing", "😏"],
    ["peaceful", "Peaceful", "🕊️"],
    ["sleepy", "Sleepy", "😴"],
    ["nostalgic", "Nostalgic", "📷"],
    ["long_distance", "Long Distance", "🌍"],
    ["trust", "Trust", "🤍"],
    ["reassurance", "Reassurance", "🫂"],
    ["conflict_resolution", "Make Up", "🕊️"],
    ["boundaries", "Boundaries", "🛡️"],
    ["vulnerable", "Vulnerable", "💗"],
    ["motivated", "Motivated", "🚀"],
    ["bored", "Bored", "🥱"],
    ["curious", "Curious", "🔎"],
    ["surprise", "Surprise", "🎁"],
    ["anniversary", "Anniversary", "💐"],
    ["proposal", "Proposal", "💍"],
    ["reconciliation", "Reconciliation", "❤️‍🩹"]
  ];

  const SUGGESTIONS = {
    romantic: [
      "I’m thinking about you 💗",
      "You make my day better.",
      "Wish you were here."
    ],
    deep_love: [
      "You mean so much to me ❤️",
      "I feel safe with you.",
      "I choose you, every day."
    ],
    happy: [
      "You made me smile 😊",
      "Tell me something good!",
      "Today feels special."
    ],
    funny: [
      "Okay, your turn to make me laugh 😂",
      "Guess what happened today?",
      "You’re impossible 😂"
    ],
    sad: [
      "I’m feeling a little low.",
      "Can we talk for a bit?",
      "I need a little comfort."
    ],
    emotional: [
      "I don’t know how to explain it, but I feel a lot.",
      "You matter to me.",
      "Stay with me for a moment."
    ],
    angry: [
      "I’m upset; let’s talk calmly.",
      "I need a little time to cool down.",
      "Let’s understand each other."
    ],
    frustrated: [
      "Today has been a lot.",
      "Can you hear me out?",
      "Let’s take this one step at a time."
    ],
    caring: [
      "Have you eaten?",
      "Please take care of yourself.",
      "I’m here if you need me."
    ],
    comfort: [
      "You don’t have to handle everything alone.",
      "I’m listening.",
      "Take your time. I’m here."
    ],
    flirty: [
      "You’re distracting me 😘",
      "Are you always this cute?",
      "I might be smiling at my phone."
    ],
    passionate: [
      "I can’t stop thinking about you 💋",
      "You have my whole attention.",
      "Come closer—at least in my thoughts."
    ],
    good_night: [
      "Good night, my favourite person 🌙",
      "Sleep well. Dream sweet.",
      "One last hug before sleep."
    ],
    good_morning: [
      "Good morning, sunshine 🌅",
      "Hope today is kind to you.",
      "You were my first thought today."
    ],
    memory: [
      "Remember that day we laughed so much?",
      "Let’s make another memory.",
      "What’s your favourite memory of us?"
    ],
    celebration: [
      "We did it! 🎉",
      "This deserves a little celebration.",
      "Here’s to more good moments."
    ],
    birthday: [
      "I hope your day feels as special as you are 🎂",
      "Make a wish!",
      "Sending you the biggest hug."
    ],
    future_marriage: [
      "What kind of future do you imagine for us?",
      "Let’s talk about our dreams 💍",
      "Small steps, shared dreams."
    ],
    missing_you: [
      "I miss you more than I can say 🥺",
      "Wish you were beside me.",
      "Thinking of you right now."
    ],
    apology: [
      "I’m sorry. Can we talk?",
      "I want to understand how you felt.",
      "You matter more than winning an argument."
    ],
    appreciation: [
      "I notice the little things you do ✨",
      "Thank you for being you.",
      "I appreciate you."
    ],
    game: [
      "Quick question game? 🎮",
      "Truth or dare—your pick!",
      "Ask me anything."
    ],
    photo_memory: [
      "This photo brings back so much.",
      "Let’s save this moment.",
      "Which memory should we capture next?"
    ],
    serious_talk: [
      "Can we talk honestly for a moment?",
      "I want to understand your point of view.",
      "Let’s talk without interrupting."
    ],
    deep_conversation: [
      "What makes you feel truly understood?",
      "What is something you rarely say out loud?",
      "What does a peaceful future look like to you?"
    ],
    calm: [
      "No rush. I’m here 🍃",
      "Let’s take a breath.",
      "A quiet moment with you sounds nice."
    ],
    excited: [
      "I have exciting news! 🤩",
      "I can't wait to tell you!",
      "Let's make today unforgettable."
    ],
    jealous: [
      "Can we talk about something that's bothering me?",
      "I want to feel secure with us.",
      "Let's be honest with each other."
    ],
    lonely: [
      "I feel a little alone today.",
      "Can you stay and talk for a while?",
      "I could use your company."
    ],
    grateful: [
      "I'm grateful to have you in my life 🙏",
      "You make so many things better.",
      "Thank you for being there."
    ],
    hopeful: [
      "I believe good things are ahead 🌈",
      "Let's keep believing in us.",
      "One step at a time, together."
    ],
    worried: [
      "Something is on my mind.",
      "Can I share what's worrying me?",
      "I could use some reassurance."
    ],
    stressed: [
      "Today feels overwhelming.",
      "Can we slow things down?",
      "I just need a calm moment."
    ],
    confused: [
      "Help me understand this better.",
      "I'm not sure how to feel yet.",
      "Can we clear things up?"
    ],
    shy: [
      "I'm a little shy saying this ☺️",
      "You make me nervous in a good way.",
      "I was hoping you'd message me."
    ],
    proud: [
      "I'm so proud of you 🏆",
      "You worked hard for this.",
      "I knew you could do it."
    ],
    supportive: [
      "I'm on your side 🤝",
      "You don't have to do this alone.",
      "I'll support you as you figure it out."
    ],
    playful: [
      "Your turn! 😜",
      "Bet I can make you smile.",
      "Let's be silly for a minute."
    ],
    teasing: [
      "Oh really? 😏",
      "You're acting way too cute today.",
      "I know you're smiling right now."
    ],
    peaceful: [
      "Let's enjoy a little peace 🕊️",
      "No pressure, just us.",
      "This quiet moment feels good."
    ],
    sleepy: [
      "I'm getting sleepy 😴",
      "One more message, then sleep.",
      "Wish I could say goodnight in person."
    ],
    nostalgic: [
      "Remember when we first started talking? 📷",
      "What's a moment you'd relive with me?",
      "Some memories still make me smile."
    ],
    long_distance: [
      "Miles can't change how much you matter 🌍",
      "I wish we were in the same place.",
      "Let's plan our next time together."
    ],
    trust: [
      "Trust matters to me 🤍",
      "Let's keep being honest with each other.",
      "I want us to feel safe together."
    ],
    reassurance: [
      "I'm here, and I care about you 🫂",
      "You matter to me.",
      "Let's talk through it together."
    ],
    conflict_resolution: [
      "I want us to understand each other.",
      "Let's fix this together, not fight each other.",
      "Can we start again calmly?"
    ],
    boundaries: [
      "Can we talk about what feels comfortable for both of us?",
      "I want us to respect each other's space.",
      "Let's be clear and kind about our needs."
    ],
    vulnerable: [
      "This is hard for me to say, but I want to be honest.",
      "I'm sharing this because I trust you.",
      "Please hear me out gently."
    ],
    motivated: [
      "We can do this 🚀",
      "Let's take the first step today.",
      "I'm cheering for you."
    ],
    bored: [
      "Let's do something fun 🥱",
      "Ask me a random question.",
      "Want to play a quick game?"
    ],
    curious: [
      "Can I ask you something? 🔎",
      "What's something I've never asked you?",
      "Tell me more about that."
    ],
    surprise: [
      "I have a little surprise for you 🎁",
      "Guess what I've been planning?",
      "Something special is coming."
    ],
    anniversary: [
      "Every chapter with you matters 💐",
      "Here's to our story and what's next.",
      "What's your favourite moment of us?"
    ],
    proposal: [
      "Can we talk about our forever? 💍",
      "What would your dream proposal look like?",
      "I love imagining a future with you."
    ],
    reconciliation: [
      "I want to heal things between us ❤️‍🩹",
      "I'm ready to listen and understand.",
      "Let's take a gentle step forward."
    ]
  };

  const state = {
    partnerId: null,
    realtime: null,
    mode: "romantic",
    messages: [],
    typingTimer: null,
    typingSent: false,
    localOnly: false,
    currentUserId: null,
    roomId: null,
    connectedEventReceived: false
  };

  function getPartnerId() {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("partner_id") ||
      params.get("partner_user_id") ||
      params.get("user_id") ||
      params.get("id") ||
      ""
    );
  }

  function storageKey() {
    return `utanexa_couple_messages_${state.partnerId || "unknown"}`;
  }

  function modeKey() {
    return `utanexa_couple_mode_${state.partnerId || "unknown"}`;
  }

  function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function setStatus(text, kind) {
    const el = $("couplePartnerStatus");

    if (el) {
      el.textContent = text;
      el.dataset.status = kind || "neutral";
    }

    const dot = $("coupleOnlineDot");

    if (dot) {
      dot.hidden = kind !== "online";
      dot.classList.toggle("is-online", kind === "online");
      dot.classList.toggle("is-offline", kind !== "online");
    }
  }

  function formatTime(value) {
    if (!value) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function normaliseMessage(item) {
    const id =
      item.id ??
      item.message_id ??
      item.client_message_id ??
      item.client_id ??
      `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    return {
      id: String(id),
      serverId: item.id ?? item.message_id ?? null,
      clientId: item.client_message_id ?? item.client_id ?? null,
      senderId: item.sender_id ?? item.senderId ?? null,
      isOwn:
        typeof item.isOwn === "boolean"
          ? item.isOwn
          : typeof item.is_own === "boolean"
            ? item.is_own
            : undefined,
      content: item.content ?? "",
      mediaUrl: item.media_url ?? item.mediaUrl ?? null,
      mediaType: item.media_type ?? item.mediaType ?? null,
      messageType: item.message_type ?? item.messageType ?? "text",
      timestamp:
        item.timestamp ??
        item.created_at ??
        item.createdAt ??
        new Date().toISOString(),
      status: item.status || (item.pending ? "pending" : "sent"),
      replyTo: item.reply_to_message_id ?? item.reply_to ?? null
    };
  }

  function isOwnMessage(message) {
    if (
      state.currentUserId !== null &&
      state.currentUserId !== undefined &&
      message.senderId !== null &&
      message.senderId !== undefined
    ) {
      return String(message.senderId) === String(state.currentUserId);
    }

    return Boolean(message.isOwn);
  }

  function saveMessages() {
    try {
      // Blob URLs are temporary previews and must not survive reloads.
      const safe = state.messages.filter(
        (message) =>
          !(
            message.mediaUrl &&
            String(message.mediaUrl).startsWith("blob:")
          )
      );

      localStorage.setItem(
        storageKey(),
        JSON.stringify(safe.slice(-100))
      );
    } catch (_) {
      // Storage may be unavailable or full.
    }
  }

  function loadMessages() {
    try {
      const raw = JSON.parse(
        localStorage.getItem(storageKey()) || "[]"
      );

      state.messages = Array.isArray(raw)
        ? raw.map(normaliseMessage)
        : [];
    } catch (_) {
      state.messages = [];
    }
  }

  function render() {
    const box = $("coupleMessages");
    if (!box) return;

    box.innerHTML = "";

    if (!state.messages.length) {
      const empty = document.createElement("div");

      empty.className = "couple-empty-state";
      empty.innerHTML =
        '<span aria-hidden="true">💙</span>' +
        "<strong>Your story starts here</strong>" +
        "<p>Send your first message.</p>";

      box.appendChild(empty);
    }

    state.messages.forEach((message) => {
      const own = isOwnMessage(message);
      const row = document.createElement("div");

      row.className =
        `couple-message-row ${own ? "is-own" : "is-partner"}`;

      row.dataset.messageId = message.id;

      const bubble = document.createElement("div");
      bubble.className = "couple-message-bubble";

      if (message.mediaUrl) {
        const type = String(message.mediaType || "").toLowerCase();

        if (
          type.startsWith("image/") ||
          /\.(png|jpe?g|gif|webp)(\?|$)/i.test(message.mediaUrl)
        ) {
          const img = document.createElement("img");

          img.className = "couple-message-image";
          img.src = message.mediaUrl;
          img.alt = "Shared image";
          img.loading = "lazy";

          bubble.appendChild(img);
        } else if (
          type.startsWith("audio/") ||
          message.messageType === "voice"
        ) {
          const audio = document.createElement("audio");

          audio.controls = true;
          audio.src = message.mediaUrl;

          bubble.appendChild(audio);
        } else {
          const link = document.createElement("a");

          link.href = message.mediaUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Open attachment";

          bubble.appendChild(link);
        }
      }

      if (message.content) {
        const content = document.createElement("div");

        content.className = "couple-message-text";
        content.textContent = message.content;

        bubble.appendChild(content);
      }

      const meta = document.createElement("div");
      meta.className = "couple-message-meta";

      const time = document.createElement("span");
      time.textContent = formatTime(message.timestamp);

      meta.appendChild(time);

      if (own) {
        const receipt = document.createElement("span");

        receipt.className =
          `couple-message-receipt receipt-${safeText(message.status)}`;

        receipt.textContent =
          message.status === "seen" ? "✓✓" :
          message.status === "delivered" ? "✓✓" :
          message.status === "sent" ? "✓" :
          message.status === "pending" ? "◷" : "";

        receipt.setAttribute("aria-label", message.status || "sent");

        meta.appendChild(receipt);
      }

      bubble.appendChild(meta);
      row.appendChild(bubble);
      box.appendChild(row);
    });

    box.scrollTop = box.scrollHeight;
  }

  function updatePartner(data) {
    const partner = data.partner || {};
    const name = partner.name || partner.username || "Partner";

    const nameEl = $("couplePartnerName");
    if (nameEl) nameEl.textContent = name;

    const avatar = $("couplePartnerAvatar");

    if (avatar) {
      const avatarUrl =
        partner.photo_url ||
        partner.avatar_url ||
        partner.profile_photo ||
        partner.profile_image ||
        partner.profile_picture ||
        partner.avatar ||
        "";

      avatar.alt = name;

      if (
        avatarUrl &&
        (/^https?:\/\//i.test(avatarUrl) || avatarUrl.startsWith("/"))
      ) {
        avatar.hidden = false;
        avatar.src = avatarUrl;
      } else {
        avatar.removeAttribute("src");
        avatar.hidden = true;
      }

      avatar.onerror = () => {
        avatar.removeAttribute("src");
        avatar.hidden = true;
      };
    }

    state.currentUserId =
      data.user?.id ??
      data.user?.user_id ??
      data.current_user_id ??
      state.currentUserId;

    state.roomId = data.room_id ?? data.room?.id ?? state.roomId;
    state.connectedEventReceived = true;

    const online = Boolean(
      data.partner_online ??
      data.partnerOnline ??
      partner.is_online
    );

    const lastSeen =
      data.partner_last_seen ??
      data.partnerLastSeen ??
      partner.last_seen;

    if (online) {
      setStatus("Online", "online");
    } else if (lastSeen) {
      setStatus(`Last seen ${formatLastSeen(lastSeen)}`, "offline");
    } else {
      setStatus("Offline", "offline");
    }
  }

  function formatLastSeen(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "offline";

    const diff = Math.max(0, Date.now() - date.getTime());

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

   function mergeIncoming(item) {
    const message = normaliseMessage(item);
    if (!message.id && !message.clientId) {
      message.id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    const existingIndex = state.messages.findIndex((m) =>
      (message.id && m.id === message.id) ||
      (message.clientId && m.clientId === message.clientId)
    );

    if (existingIndex >= 0) {
      state.messages[existingIndex] = {
        ...state.messages[existingIndex],
        ...message,
        pending: false
      };
    } else {
      state.messages.push(message);
    }

    saveMessages();
    render();
  }

  function handleHistory(messages) {
    if (!Array.isArray(messages)) return;

    const pendingMessages = state.messages.filter(
      (message) => message.pending || message.local_only
    );

    const serverMessages = messages.map(normaliseMessage);
    const merged = [...serverMessages];

    pendingMessages.forEach((pending) => {
      const exists = merged.some((message) =>
        (pending.id && message.id === pending.id) ||
        (pending.clientId && message.clientId === pending.clientId)
      );

      if (!exists) merged.push(pending);
    });

    merged.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return timeA - timeB;
    });

    state.messages = merged;
    saveMessages();
    render();
  }

  function renderSuggestions() {
    const container =
      $("coupleSuggestions") ||
      $("coupleQuickReplies") ||
      $("quickReplies");

    if (!container) return;

    const suggestions = SUGGESTIONS[state.mode] || SUGGESTIONS.neutral || [];
    container.replaceChildren();

    suggestions.forEach((suggestion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "couple-suggestion";
      button.textContent = suggestion;
      button.addEventListener("click", () => sendPresetText(suggestion));
      container.appendChild(button);
    });
  }

  function setMode(mode, persist = true) {
    const validMode = MODES.some((item) => item[0] === mode);
    if (!validMode) mode = "neutral";

    state.mode = mode;

    const modeData = MODES.find((item) => item[0] === mode);
    const emoji = modeData ? modeData[2] : "💬";

    document.documentElement.dataset.coupleMood = mode;
    document.body.dataset.coupleMood = mode;

    const page = $("coupleChatPage") || $("coupleChat");
    if (page) page.dataset.mood = mode;

    const moodLabel =
      $("coupleMoodLabel") ||
      $("currentMoodLabel") ||
      $("coupleMoodText");

    if (moodLabel) {
      moodLabel.textContent = modeData ? modeData[1] : "Neutral";
    }

    const moodIcon =
      $("coupleMoodIcon") ||
      $("currentMoodIcon");

    if (moodIcon) moodIcon.textContent = emoji;

    const moodButton =
      $("coupleMoodButton") ||
      $("moodPickerButton");

    if (moodButton) {
      moodButton.setAttribute(
        "aria-label",
        `Current mood: ${modeData ? modeData[1] : "Neutral"}`
      );
    }

    if (persist) {
      try {
        localStorage.setItem(modeKey(), mode);
      } catch (_) {}
    }

    renderSuggestions();
  }

  function launchMoodEffects(mode) {
    const container =
      $("coupleMoodEffects") ||
      $("coupleEffects") ||
      $("coupleChatEffects");

    if (!container) return;

    const symbols = {
      romantic: ["💗", "💕", "💖", "✨"],
      deep_love: ["❤️", "💞", "💘", "✨"],
      happy: ["😊", "💛", "✨", "🌟"],
      excited: ["🎉", "✨", "💫", "🥳"],
      sad: ["💧", "💙", "☁️"],
      angry: ["💢", "🔥", "⚡"],
      caring: ["🤗", "💗", "🌸"],
      playful: ["😜", "✨", "💫"],
      missing: ["💌", "💗", "🌙"],
      neutral: ["✨", "💫"]
    };

    const particles = symbols[mode] || symbols.neutral;
    container.replaceChildren();

    container.classList.add("active");

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("span");
      particle.className = `mood-particle mood-particle-${mode}`;
      particle.textContent = particles[i % particles.length];

      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 1.8}s`;
      particle.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;

      container.appendChild(particle);
    }

    window.setTimeout(() => {
      container.classList.remove("active");
      container.replaceChildren();
    }, 5000);
  }

  function openMoodPicker() {
    const modal =
      $("coupleMoodPicker") ||
      $("moodPickerModal");

    if (!modal) return;

    modal.hidden = false;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    buildMoodButtons();
  }

  function closeMoodPicker() {
    const modal =
      $("coupleMoodPicker") ||
      $("moodPickerModal");

    if (!modal) return;

    modal.classList.remove("open");
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }

  function buildMoodButtons() {
    const container =
      $("coupleMoodOptions") ||
      $("moodPickerOptions");

    if (!container) return;

    container.replaceChildren();

    MODES.forEach(([key, label, emoji]) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "couple-mood-option";
      button.dataset.mood = key;
      button.setAttribute("aria-pressed", String(state.mode === key));
      button.innerHTML = "";

      const icon = document.createElement("span");
      icon.className = "couple-mood-option-emoji";
      icon.textContent = emoji;

      const text = document.createElement("span");
      text.className = "couple-mood-option-label";
      text.textContent = label;

      button.append(icon, text);

      button.addEventListener("click", () => {
        setMode(key);
        launchMoodEffects(key);
        closeMoodPicker();
      });

      container.appendChild(button);
    });
  }

  function inputElement() {
    return (
      $("coupleMessageInput") ||
      $("coupleInput") ||
      $("messageInput")
    );
  }

  function detectMessageMood(text) {
    const value = String(text || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^\p{L}\p{N}\s!?.,❤️💔🥺😭😊😂😍😘😡😔🙂]/gu, " ");

    const moodKeywords = {
      romantic: [
        "i love you", "love you", "jaan", "meri jaan",
        "baby", "babu", "pyaar", "pyar", "romantic",
        "kiss", "kissi", "😘", "😍", "❤️", "💗"
      ],
      deep_love: [
        "forever", "hamesha tumhara", "hamesha tumhari",
        "zindagi bhar", "meri zindagi", "soulmate",
        "sirf tum", "always yours", "💞", "💘"
      ],
      happy: [
        "happy", "khush", "khushi", "mast", "achha laga",
        "bahut accha", "bahut acha", "yay", "😊", "😁", "😄"
      ],
      excited: [
        "excited", "cant wait", "can't wait", "omg",
        "amazing", "wow", "party", "congratulations",
        "🥳", "🎉", "🤩"
      ],
      sad: [
        "sad", "dukhi", "udaas", "udas", "rona",
        "ro raha", "ro rahi", "hurt", "depressed",
        "😭", "😢", "💔"
      ],
      angry: [
        "angry", "gussa", "naraz", "naraaz", "hate",
        "bakwas", "shut up", "irritated", "😡", "🤬"
      ],
      caring: [
        "take care", "apna khayal", "khana khaya",
        "paani pi", "pani pi", "rest karna", "safe rehna",
        "get well", "🤗"
      ],
      missing: [
        "miss you", "i miss you", "yaad aa rahi",
        "yaad aa raha", "tumhari yaad", "tumhare bina",
        "come back", "miss u", "🥺"
      ],
      playful: [
        "haha", "hehe", "lol", "mazaak", "mazak",
        "pagal", "tease", "😂", "😜", "🤣"
      ],
      worried: [
        "worried", "tension", "pareshan", "fikar",
        "chinta", "kya hua", "are you okay", "sab theek"
      ]
    };

    let bestMood = "neutral";
    let bestScore = 0;

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      let score = 0;

      keywords.forEach((keyword) => {
        if (value.includes(keyword)) score += keyword.length > 5 ? 2 : 1;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMood = mood;
      }
    }

    return bestScore > 0 ? bestMood : "neutral";
  }

   function sendText() {
    const input = inputElement();
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    // Automatically detect the mood from the message.
    const detectedMood = detectMessageMood(content);

    if (detectedMood && detectedMood !== state.mode) {
      setMode(detectedMood, false);
      launchMoodEffects(detectedMood);
    }

    const clientId =
      `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const local = normaliseMessage({
      id: clientId,
      client_message_id: clientId,
      content,
      sender_id: state.currentUserId,
      timestamp: new Date().toISOString(),
      status: "pending"
    });

    local.isOwn = true;

    // Show the message immediately.
    state.messages.push(local);
    saveMessages();
    render();

    input.value = "";

    // Send through the realtime connection when available.
    const sent = state.realtime && state.realtime.sendMessage({
      client_message_id: clientId,
      content,
      message_type: "text"
    });

    if (!sent) {
      const found = state.messages.find(
        (message) =>
          message.clientId === clientId ||
          message.id === clientId
      );

      if (found) found.status = "local_only";

      saveMessages();
      render();

      if (!state.realtime?.connected) {
        setStatus(
          "Offline — message saved on this device only",
          "offline"
        );
      }
    }

    if (state.realtime?.connected && state.typingSent) {
      state.realtime.stopTyping();
      state.typingSent = false;
    }
  }

  // Media sending requires a real, accessible media URL.
  // A local blob preview is not uploaded automatically.
  function sendMedia(url, mediaType, messageType = "image") {
    if (!url) return;

    if (/^blob:/i.test(String(url))) {
      setStatus(
        "This is only a local preview. Upload media first, then send its public URL.",
        "neutral"
      );
      return;
    }

    const clientId =
      `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const item = normaliseMessage({
      id: clientId,
      client_message_id: clientId,
      content: "",
      media_url: url,
      media_type: mediaType,
      message_type: messageType,
      sender_id: state.currentUserId,
      timestamp: new Date().toISOString(),
      status: "pending"
    });

    item.isOwn = true;

    state.messages.push(item);
    saveMessages();
    render();

    const sent =
      state.realtime?.connected &&
      state.realtime?.sendMessage({
        client_message_id: clientId,
        media_url: url,
        media_type: mediaType,
        message_type: messageType
      });

    if (!sent) {
      item.status = "local_only";
      saveMessages();
      render();

      setStatus(
        "Offline — media message saved on this device only",
        "offline"
      );
    }
  }

  // Show typing status to the partner.
  function setupTyping() {
    const input = inputElement();
    if (!input) return;

    input.addEventListener("input", () => {
      if (!state.realtime?.connected) return;

      if (!state.typingSent) {
        state.realtime.startTyping();
        state.typingSent = true;
      }

      clearTimeout(state.typingTimer);

      state.typingTimer = setTimeout(() => {
        state.realtime?.stopTyping();
        state.typingSent = false;
      }, 1600);
    });
  }

  // Send a suggested message.
  function sendPresetText(text) {
    const input = inputElement();
    if (!input) return;

    input.value = text;
    sendText();
  }

  // Identify whether a message belongs to the current user.
  function isOwnMessage(message) {
    if (
      state.currentUserId !== null &&
      message.senderId !== null &&
      message.senderId !== undefined
    ) {
      return String(message.senderId) === String(state.currentUserId);
    }

    return Boolean(message.isOwn);
  }

  // Export the current conversation as a text file.
  function exportChatText() {
    const text = state.messages.map((message) => {
      const content =
        message.content ||
        (message.mediaUrl ? "[attachment]" : "");

      return (
        `[${formatTime(message.timestamp)}] ` +
        `${isOwnMessage(message) ? "You" : "Partner"}: ${content}`
      );
    }).join("\n");

    const url = URL.createObjectURL(
      new Blob([text], {
        type: "text/plain;charset=utf-8"
      })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "utanexa-chat.txt";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    $("closeCoupleMenu")?.click();
  }

  // Build the emoji picker.
  function buildEmojiGrid(search = "") {
    const grid = $("coupleEmojiGrid");
    if (!grid) return;

    const emojis = [
      "😀", "😃", "😄", "😁", "😅", "😂", "🤣",
      "🥹", "😊", "😍", "🥰", "😘", "😎", "🥳",
      "😭", "😢", "🥺", "😡", "🤗", "🫂",
      "❤️", "🧡", "💛", "💚", "💙", "💜",
      "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "💋", "🌹", "🌷", "✨", "⭐", "🌙", "☀️",
      "🔥", "🎉", "🎂", "💍", "🎮", "📸", "🙏", "🕊️"
    ];

    const query = String(search).trim();

    grid.innerHTML = emojis
      .filter((emoji) => !query || emoji.includes(query))
      .map((emoji) =>
        `<button type="button" class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
      )
      .join("");
  }

  function closeEmojiPicker() {
    const backdrop = $("couplePickerBackdrop");
    const picker = $("coupleEmojiPicker");

    if (backdrop) backdrop.hidden = true;
    if (picker) picker.hidden = true;
  }

   function setupControls() {
    const composer = $("coupleComposer");

    if (composer) {
      composer.addEventListener("submit", (event) => {
        event.preventDefault();
        sendText();
      });
    }

    const input = inputElement();

    if (input) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendText();
        }
      });
    }

    // Mood picker
    const moodButton =
      $("coupleHeaderMood") ||
      $("coupleMoodButton") ||
      $("coupleCurrentMood");

    moodButton?.addEventListener("click", openMoodPicker);

    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode;

        if (MODES.some((item) => item[0] === mode)) {
          setMode(mode);
          closeMoodPicker();
        }
      });
    });

    document
      .querySelectorAll("[data-close-couple-mood], .couple-mood-close")
      .forEach((button) => {
        button.addEventListener("click", closeMoodPicker);
      });

    $("closeMoodPanel")?.addEventListener("click", closeMoodPicker);

    $("coupleMoodOverlay")?.addEventListener("click", (event) => {
      if (event.target.id === "coupleMoodOverlay") {
        closeMoodPicker();
      }
    });

    // Quick actions
    $("coupleQuickActions")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;

      if (action === "love") {
        setMode("romantic");
        sendPresetText("I love you ❤️");
      } else if (action === "memory") {
        setMode("memory");
        sendPresetText("Remember our special moments? 📸");
      } else if (action === "question") {
        setMode("deep_conversation");

        const panel = $("coupleSuggestions");
        if (panel) panel.hidden = false;
      } else if (action === "game") {
        setMode("game");
        sendPresetText("Let's play a couple game! 🎮 Truth or dare?");
      }
    });

    // AI panel
    $("coupleAiButton")?.addEventListener("click", () => {
      const overlay = $("coupleAiOverlay");

      if (overlay) {
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
      }
    });

    $("closeAiPanel")?.addEventListener("click", () => {
      const overlay = $("coupleAiOverlay");

      if (overlay) {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
      }
    });

    $("coupleAiOverlay")?.addEventListener("click", (event) => {
      if (event.target.id === "coupleAiOverlay") {
        $("closeAiPanel")?.click();
      }

      const button = event.target.closest("[data-ai-action]");
      if (!button) return;

      const action = button.dataset.aiAction;

      if (action === "suggest" || action === "question" || action === "game") {
        if (action === "game") setMode("game");
        else if (action === "question") setMode("deep_conversation");

        const panel = $("coupleSuggestions");
        if (panel) panel.hidden = false;
      }

      if (action === "mood") openMoodPicker();

      $("closeAiPanel")?.click();
    });

    // Three-dot menu
    $("coupleMenuButton")?.addEventListener("click", () => {
      const overlay = $("coupleMenuOverlay");

      if (overlay) {
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
      }
    });

    $("closeCoupleMenu")?.addEventListener("click", () => {
      const overlay = $("coupleMenuOverlay");

      if (overlay) {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
      }
    });

    $("coupleMenuOverlay")?.addEventListener("click", (event) => {
      if (event.target.id === "coupleMenuOverlay") {
        $("closeCoupleMenu")?.click();
      }

      const action = event.target.closest("[data-menu-action]")?.dataset.menuAction;

      if (action === "export") {
        exportChatText();
      }

      if (
        action === "clear" &&
        window.confirm("Clear locally saved messages from this device?")
      ) {
        state.messages = [];
        saveMessages();
        render();
      }
    });

    // Suggested messages
    $("coupleSuggestions")?.addEventListener("click", (event) => {
      if (event.target.id === "closeSuggestions") {
        $("coupleSuggestions").hidden = true;
        return;
      }

      const chip = event.target.closest(
        ".couple-suggestion-chip, .suggestion-chip"
      );

      if (chip && inputElement()) {
        inputElement().value = chip.textContent.trim();
        inputElement().focus();
      }
    });

    // Emoji picker
    $("coupleEmojiButton")?.addEventListener("click", () => {
      const backdrop = $("couplePickerBackdrop");
      const picker = $("coupleEmojiPicker");

      if (backdrop) backdrop.hidden = false;
      if (picker) picker.hidden = false;

      buildEmojiGrid();
    });

    $("closeEmojiPicker")?.addEventListener("click", closeEmojiPicker);
    $("couplePickerBackdrop")?.addEventListener("click", closeEmojiPicker);

    $("coupleEmojiSearch")?.addEventListener("input", (event) => {
      buildEmojiGrid(event.target.value);
    });

    $("coupleEmojiGrid")?.addEventListener("click", (event) => {
      const emoji = event.target.closest("[data-emoji]")?.dataset.emoji;

      if (emoji && inputElement()) {
        inputElement().value += emoji;
        inputElement().focus();
        closeEmojiPicker();
      }
    });

    // Media attachment buttons
    $("coupleAttachButton")?.addEventListener("click", () => {
      $("coupleFileInput")?.click();
    });

    $("coupleCameraButton")?.addEventListener("click", () => {
      $("coupleCameraInput")?.click();
    });

    // Partner profile
    $("coupleAvatarButton")?.addEventListener("click", () => {
      const name = $("couplePartnerName")?.textContent || "Partner";

      if (typeof window.showToast === "function") {
        window.showToast(name);
      }
    });

    // Back button
    $("coupleBackButton")?.addEventListener("click", () => {
      if (history.length > 1) {
        history.back();
      } else {
        location.href = "/";
      }
    });

    // Voice/video call placeholder
    $("coupleCallButton")?.addEventListener("click", () => {
      setStatus("Calling is not configured yet", "neutral");
    });

    // Media preview. Uploading requires a backend upload endpoint.
    const fileInput =
      $("coupleMediaInput") ||
      $("coupleImageInput") ||
      $("coupleFileInput");

    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        const isImage = file.type.startsWith("image/");

        if (isImage) {
          const preview = $("coupleMediaPreview");

          if (preview) {
            preview.replaceChildren();

            const img = document.createElement("img");
            img.src = previewUrl;
            img.alt = "Media preview";

            preview.appendChild(img);
          }

          setStatus(
            "Media preview only — upload is not configured",
            "neutral"
          );
        } else {
          URL.revokeObjectURL(previewUrl);

          setStatus(
            "This file needs an uploaded public URL before sending",
            "neutral"
          );
        }

        fileInput.value = "";
      });
    }
  }

  // =========================================================
  // REALTIME CONNECTION
  // =========================================================

  function initRealtime() {
    if (!state.partnerId) {
      setStatus("Open chat with a partner ID", "offline");
      return;
    }

    if (!window.UsanexCoupleRealtime) {
      setStatus("Chat connection unavailable", "offline");
      return;
    }

    state.realtime = new window.UsanexCoupleRealtime({
      partnerId: state.partnerId,

      onStatus: (info) => {
        if (
          info.state === "connecting" ||
          info.state === "reconnecting"
        ) {
          state.connectedEventReceived = false;
        }

        if (info.state === "connecting") {
          setStatus("Connecting…", "neutral");
        } else if (
          info.state === "connected" &&
          !state.connectedEventReceived
        ) {
          setStatus("Connected — loading chat…", "neutral");
        } else if (info.state === "reconnecting") {
          setStatus("Reconnecting…", "offline");
        } else if (
          info.state === "offline" ||
          info.state === "disconnected"
        ) {
          if (
            !state.connectedEventReceived ||
            info.state === "offline"
          ) {
            setStatus("Offline", "offline");
          }
        }
      },

      onConnection: (data) => {
        updatePartner(data);
      },

      onHistory: (messages) => {
        handleHistory(messages);
      },

      onMessage: (data) => {
        mergeIncoming(data);

        if (
          data.sender_id !== undefined &&
          state.currentUserId !== null &&
          String(data.sender_id) !== String(state.currentUserId)
        ) {
          state.realtime?.sendRead(data.id ?? data.message_id);
        }
      },

      onPresence: (presence) => {
        const online = Boolean(
          presence.is_online ?? presence.online
        );

        if (online) {
          setStatus("Online", "online");
        } else if (presence.last_seen) {
          setStatus(
            `Last seen ${formatLastSeen(presence.last_seen)}`,
            "offline"
          );
        } else {
          setStatus("Offline", "offline");
        }
      },

      onTyping: (data) => {
        const indicator =
          $("coupleTypingIndicator") ||
          $("coupleTyping");

        const typing = Boolean(
          data.is_typing ?? data.typing ?? data.active
        );

        if (indicator) {
          indicator.hidden = !typing;

          indicator.textContent = typing
            ? `${$("couplePartnerName")?.textContent || "Partner"} is typing…`
            : "";
        }
      },

      onReceipt: (receipt) => {
        const id =
          receipt.client_message_id ||
          receipt.message_id ||
          receipt.id;

        const message = state.messages.find((item) =>
          (
            receipt.client_message_id &&
            (
              item.clientId === receipt.client_message_id ||
              item.id === receipt.client_message_id
            )
          ) ||
          (
            receipt.message_id &&
            String(item.serverId || item.id) ===
              String(receipt.message_id)
          ) ||
          (
            id &&
            String(item.serverId || item.id) === String(id)
          )
        );

        if (message) {
          const status = String(receipt.status || "").toLowerCase();

          if (status === "seen" || status === "read") {
            message.status = "seen";
          } else if (status === "delivered") {
            message.status = "delivered";
          } else if (
            status === "sent" &&
            message.status === "pending"
          ) {
            message.status = "sent";
          }

          saveMessages();
          render();
        }
      },

      onError: (error) => {
        console.warn(
          "[UtaNexa Couple Chat]",
          error?.message || "Chat connection error"
        );
      },

      onDisconnect: () => {
        state.connectedEventReceived = false;
        setStatus("Reconnecting…", "offline");
      }
    });

    state.realtime.connect();
  }

  // =========================================================
  // INITIALIZATION
  // =========================================================

  function init() {
    state.partnerId = getPartnerId();

    try {
      state.mode = localStorage.getItem(modeKey()) || "romantic";
    } catch (_) {
      state.mode = "romantic";
    }

    if (!state.partnerId) {
      setStatus("Open chat with a partner ID", "offline");
    } else {
      setStatus("Connecting…", "neutral");
    }

    buildMoodButtons();
    loadMessages();
    render();
    setMode(state.mode, false);
    setupControls();
    setupTyping();
    initRealtime();
  }

  // Public API
  window.UtaNexaCoupleChat = {
    setMode,
    sendText,
    sendMedia,
    openMoodPicker,
    closeMoodPicker,
    detectMessageMood,

    getModes: () =>
      MODES.map(([key, label, emoji]) => ({
        key,
        label,
        emoji
      })),

    getState: () => ({
      partnerId: state.partnerId,
      mode: state.mode,
      connected: Boolean(state.realtime?.connected),
      messages: state.messages.slice()
    })
  };

  // Backward compatibility
  window.UsanexCoupleChat = window.UtaNexaCoupleChat;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
