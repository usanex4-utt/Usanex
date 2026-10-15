/* UtaNexa Couple Chat
 * Mood effects, messages, emoji picker, suggestions and realtime support.
 * Keeps the existing UsanexCoupleRealtime interface.
 */
(() => {
"use strict";

const $ = id => document.getElementById(id);

const API = {
  analyze: "/api/couple-chat/analyze",
  mood: "/api/couple-chat/mood"
};

const MODES = [
  ["calm","Calm"],
  ["romantic","Romantic"],
  ["deep_love","Deep Love"],
  ["happy","Happy"],
  ["funny","Funny"],
  ["sad","Sad"],
  ["emotional","Emotional"],
  ["angry","Angry"],
  ["frustrated","Frustrated"],
  ["caring","Caring"],
  ["comfort","Comfort"],
  ["flirty","Flirty"],
  ["passionate","Passionate"],
  ["good_night","Good Night"],
  ["good_morning","Good Morning"],
  ["memory","Memory"],
  ["celebration","Celebration"],
  ["birthday","Birthday"],
  ["future_marriage","Future"],
  ["missing_you","Missing You"],
  ["apology","Apology"],
  ["appreciation","Appreciation"],
  ["game","Game"],
  ["photo_memory","Photo Memory"],
  ["serious_talk","Serious Talk"],
  ["deep_conversation","Deep Talk"]
];

const EFFECTS = [
  "Soft Hearts","Heart Glow","Heartbeat","Connecting Hearts",
  "Rose Petals","Love Sparkles","Romantic Aura","Blush Glow",
  "Deep Love Pulse","Tiny Heart Trail","Missing You","Gentle Hug",
  "Comfort Glow","Heart-to-Heart","Emotional Reveal","Healing Particles",
  "Care Aura","Together Hearts","Distance Love","Memory Glow",
  "Kiss Sparkle","Blushing Face","Cute Hearts","Playful Wink",
  "Love Pop","Heart Bounce","Sweet Reveal","Couple Sparkles",
  "Tiny Confetti","Smile Glow","Sunrise","Moonlight","Twinkling Stars",
  "Sunset","Rainy Calm","Night Sky","Anniversary","Birthday Sparkles",
  "Special Date","Midnight Romance","Calm Apology","Make-Up Glow",
  "Sorry Transition","Thank-You Gold","Appreciation Aura",
  "Excitement Pop","Shy Pink","Deep Talk Purple","Peaceful Glow",
  "Reconciliation","Love Letter","Heart Trail","Breathing Glow",
  "Message Spotlight","Memory Transition","Virtual Hug","Love Mode",
  "Mood Transition","Arrival Glow","Usanex Love"
];

const REPLIES = {
  love: [
    "I feel lucky to have you in my life. ❤️",
    "You make ordinary moments special.",
    "I wish I could give you a hug right now. 🫂"
  ],
  question: [
    "What is one little thing I do that makes you smile?",
    "What would our perfect day together look like?",
    "What is a memory of us you never want to forget?"
  ],
  game: [
    "Describe our relationship in three words.",
    "Sunset walk or cozy movie night?",
    "What little thing should we do together soon?"
  ],
  memory: [
    "What is your favourite memory of us so far?",
    "Let’s make another memory worth keeping.",
    "I was just thinking about one of our good moments."
  ],
  romantic: [
    "I wish I could be right beside you. ❤️",
    "You make my days feel warmer.",
    "If I could choose again, I’d still choose you."
  ]
};

const partnerId = (() => {
  const p = new URLSearchParams(location.search);
  return p.get("partner_id") || p.get("user_id") || p.get("id") || "unknown";
})();

const storageKey = "utanexa_couple_chat_messages_v13_" + partnerId;
const modeKey = "utanexa_couple_chat_mode_v13_" + partnerId;

let currentUserId = null;
let currentMode = localStorage.getItem(modeKey) || "calm";
let manualMood = false;
let messages = [];
let realtime = null;
let toastTimer = null;
let aiTimer = null;
let recorder = null;
let recordChunks = [];
let recordInterval = null;
let recordStarted = 0;

const state = {
  partnerOnline: false,
  connected: false
};

function toast(message) {
  const el = $("coupleToast");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2400);
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-500)));
  } catch (error) {
    console.warn("Could not save chat locally.", error);
  }
}

function time(value) {
  try {
    return new Date(value || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function scroll() {
  const el = $("coupleConversation");
  if (el) el.scrollTop = el.scrollHeight;
}

function normalize(message) {
  return {
    ...message,
    content: message.content ?? message.text ?? "",
    is_mine: !!(
      message.is_mine ||
      message.isMine ||
      (
        currentUserId != null &&
        String(message.sender_id ?? message.senderId) === String(currentUserId)
      )
    )
  };
}

function render() {
  const box = $("coupleMessages");
  if (!box) return;

  box.replaceChildren();

  messages.forEach(message => {
    const mine = !!(
      message.is_mine ||
      message.isMine ||
      (
        currentUserId != null &&
        String(message.sender_id ?? message.senderId) === String(currentUserId)
      )
    );

    const row = document.createElement("article");
    row.className = "message-row" + (mine ? " mine" : "");

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (
      message.media_url &&
      String(message.media_type || "").startsWith("image")
    ) {
      const image = document.createElement("img");
      image.className = "message-media";
      image.src = message.media_url;
      image.alt = "Shared image";
      image.loading = "lazy";
      bubble.append(image);

    } else if (
      message.media_url &&
      String(message.media_type || "").startsWith("video")
    ) {
      const video = document.createElement("video");
      video.className = "message-media";
      video.src = message.media_url;
      video.controls = true;
      video.playsInline = true;
      bubble.append(video);

    } else if (
      message.media_url &&
      String(message.media_type || "").startsWith("audio")
    ) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = message.media_url;
      bubble.append(audio);
    }

    const text = String(message.content ?? message.text ?? "");

    if (text) {
      const content = document.createElement("div");
      content.className = "message-text";
      content.textContent = text;
      bubble.append(content);
    }

    if (message.file_name && !message.media_url) {
      const file = document.createElement("div");
      file.className = "message-file";
      file.textContent = "File: " + message.file_name;
      bubble.append(file);
    }

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = time(
      message.created_at || message.timestamp || message.sent_at
    );

    if (mine) {
      const receipt = document.createElement("span");
      receipt.className = "message-status";

      receipt.textContent =
        message.read_at || message.seen
          ? "Seen"
          : message.delivered_at || message.delivered
            ? "Delivered"
            : message.pending
              ? "Sending…"
              : "Sent";

      meta.append(receipt);
    }

    bubble.append(meta);
    row.append(bubble);
    box.append(row);
  });

  scroll();
}

function add(message, mine) {
  if (!message) return;

  const id = message.message_id || message.id || message.client_id;

  if (
    id &&
    messages.some(item =>
      String(item.message_id || item.id || item.client_id) === String(id)
    )
  ) {
    return;
  }

  messages.push({
    ...message,
    message_id: id || "local-" + Date.now(),
    created_at:
      message.created_at ||
      message.timestamp ||
      new Date().toISOString(),
    is_mine: !!(mine || message.is_mine || message.isMine)
  });

  persist();
  render();
}

function status(text, online) {
  const label = $("couplePartnerStatus");
  if (label) label.textContent = text;

  if (online !== undefined) {
    state.partnerOnline = !!online;

    const dot = $("coupleOnlineDot");
    if (dot) dot.hidden = !online;
  }
}

function detectMood(text) {
  const value = String(text || "").toLowerCase();

  const tests = [
    ["good_night", /good night|sweet dreams|shubh ratri|शुभ रात्रि|सो जाओ/],
    ["good_morning", /good morning|suprabhat|शुभ प्रभात/],
    ["apology", /sorry|maaf|माफ़|माफी|गलती/],
    ["angry", /gussa|naraz|angry|fight|jhagda|गुस्सा|नाराज़/],
    ["sad", /sad|dukhi|udaas|pareshan|cry|lonely|दुखी|उदास|परेशान/],
    ["missing_you", /miss you|yaad aa|tumhari yaad|याद आ/],
    ["comfort", /tension|stress|hurt|pareshani|तनाव/],
    ["appreciation", /thank you|thanks|shukriya|धन्यवाद|शुक्रिया/],
    ["deep_love", /hamesha saath|forever|zindagi bhar|meri jaan|हमेशा साथ|मेरी जान/],
    ["romantic", /love you|pyaar|pyar|mohabbat|kiss|jaan|❤️|💕|💋|🥰|😘/],
    ["happy", /happy|khush|awesome|haha|😂|😄|😊|खुश/]
  ];

  for (const [mood, regex] of tests) {
    if (regex.test(value)) return mood;
  }

  return "calm";
}

function setMode(mode, manual = true) {
  if (!MODES.some(item => item[0] === mode)) mode = "calm";

  currentMode = mode;
  if (manual) manualMood = true;

  try {
    localStorage.setItem(modeKey, mode);
  } catch (error) {
    console.warn("Could not save mood.", error);
  }

  document.body.dataset.coupleMode = mode;

  const header = $("coupleHeaderMood");
  if (header) {
    const selected = MODES.find(item => item[0] === mode);
    header.title = "Current mood: " + (selected ? selected[1] : "Calm");
  }

  const grid = $("coupleMoodGrid");
  if (grid) {
    grid.querySelectorAll("[data-mode]").forEach(button => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });
  }

  effects();

  fetch(API.mood, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partner_id: partnerId,
      mood: mode,
      mode
    })
  }).catch(() => {});

  suggestions();
}

function effects() {
  const layer = $("coupleEffectsLayer");
  if (!layer) return;

  layer.replaceChildren();

  const romantic = [
    "romantic","deep_love","missing_you","appreciation",
    "flirty","passionate"
  ].includes(currentMode);

  const gold = [
    "happy","celebration","birthday","good_morning"
  ].includes(currentMode);

  const blue = [
    "sad","comfort","good_night","emotional"
  ].includes(currentMode);

  if (!romantic && !gold && !blue) return;

  const reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const count = reduced ? 2 : 7;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");

    particle.className = "mood-particle" + (romantic ? " heart" : "");

    particle.style.setProperty("--x", Math.random() * 100 + "%");
    particle.style.setProperty(
      "--size",
      (romantic ? 8 + Math.random() * 7 : 3 + Math.random() * 4) + "px"
    );
    particle.style.setProperty(
      "--duration",
      (13 + Math.random() * 9) + "s"
    );
    particle.style.setProperty(
      "--particle-color",
      gold ? "#e9c783" : blue ? "#8ca9d6" : "#d98aaa"
    );

    particle.style.animationDelay = (-Math.random() * 10) + "s";
    layer.append(particle);
  }
}

function suggestions(list) {
  const section = $("coupleSuggestions");
  const box = $("coupleSuggestionList");

  if (!section || !box) return;

  const items = (
    Array.isArray(list) && list.length
      ? list
      : REPLIES[currentMode] || REPLIES.romantic
  ).slice(0, 8);

  box.replaceChildren();

  items.forEach(text => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-chip";
    button.textContent = text;

    button.onclick = () => {
      const input = $("coupleMessageInput");

      if (input) {
        input.value = text;
        input.focus();
      }

      section.hidden = true;
    };

    box.append(button);
  });

  section.hidden = false;
}

async function analyze(text) {
  const label = $("coupleAiStatus");

  if (label) label.textContent = "Understanding your conversation…";

  if (!manualMood) {
    setMode(detectMood(text), false);
  }

  clearTimeout(aiTimer);

  aiTimer = setTimeout(() => {
    if (label) label.textContent = "Here to help you connect";
  }, 3500);

  try {
    const response = await fetch(API.analyze, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partner_id: partnerId,
        message: text,
        text,
        mode: currentMode
      })
    });

    if (!response.ok) return;

    const data = await response.json();

    if ((data.mood || data.mode) && !manualMood) {
      setMode(data.mood || data.mode, false);
    }

    if (Array.isArray(data.suggestions)) {
      suggestions(data.suggestions);
    }

    if (label) {
      label.textContent =
        data.status || "Conversation mood: " + currentMode.replaceAll("_", " ");
    }

  } catch {
    if (label) label.textContent = "Your private conversation companion";
  }
}

function sendRealtime(item) {
  try {
    if (realtime?.sendMessage) {
      realtime.sendMessage(item);
      return true;
    }

    if (realtime?.send) {
      realtime.send({ type: "message", ...item });
      return true;
    }
  } catch (error) {
    console.warn(error);
  }

  toast("Realtime connection unavailable; message saved on this device.");
  return false;
}

function sendText(text) {
  text = String(text || "").trim();
  if (!text) return;

  const message = {
    message_id: "client-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    client_id: "client-" + Date.now(),
    content: text,
    created_at: new Date().toISOString(),
    is_mine: true,
    pending: true
  };

  messages.push(message);
  persist();
  render();

  const input = $("coupleMessageInput");
  if (input) input.value = "";

  const sent = sendRealtime(message);

  if (!sent) {
    const item = messages.find(m => m.message_id === message.message_id);
    if (item) {
      item.pending = false;
      item.local_only = true;
      persist();
      render();
    }
  } else {
    const item = messages.find(m => m.message_id === message.message_id);
    if (item) {
      item.pending = false;
      persist();
      render();
    }
  }

  analyze(text);
}

function setupEmoji() {
  const categories = $("coupleEmojiCategories");
  const grid = $("coupleEmojiGrid");
  const search = $("coupleEmojiSearch");

  if (!categories || !grid || !search) return;

  const data = [
    ["Recent","◷",[]],
    ["Smileys","☺","😀 😃 😄 😁 😅 😂 🙂 😉 😊 🥰 😍 🤩 😘 🥲 😋 🤗 🤔 😌 😔 😴 🥳 😎".split(" ")],
    ["Hearts","♡","❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🩷 💔 ❤️‍🔥 ❤️‍🩹 💕 💞 💓 💗 💖 💘 💝".split(" ")],
    ["Hands","✋","👋 ✌️ 🤞 🤟 🤘 👍 👎 👏 🙌 🫶 🙏 💪".split(" ")],
    ["Nature","❀","🐶 🐱 🐰 🦊 🐻 🦋 🌷 🌹 🌸 💐 🍀 🌈 ⭐ 🌙 ☀️ 🔥 ❄️".split(" ")],
    ["Objects","◇","📱 📷 💌 💍 🎁 🎈 🎉 🧸".split(" ")]
  ];

  let category = "Smileys";
  let recent = [];

  try {
    recent = JSON.parse(localStorage.getItem("utanexa_recent_emojis") || "[]");
  } catch {}

  function draw() {
    categories.replaceChildren();

    data.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "emoji-category" + (category === item[0] ? " active" : "");
      button.textContent = item[1] + " " + item[0];

      button.onclick = () => {
        category = item[0];
        search.value = "";
        draw();
      };

      categories.append(button);
    });

    grid.replaceChildren();

    const list = search.value
      ? data.flatMap(item => item[2]).filter(emoji => emoji.includes(search.value))
      : category === "Recent"
        ? recent
        : (data.find(item => item[0] === category) || data[1])[2];

    [...new Set(list)].forEach(emoji => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "emoji-cell";
      button.textContent = emoji;

      button.onclick = () => {
        const input = $("coupleMessageInput");
        if (!input) return;

        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;

        input.value =
          input.value.slice(0, start) +
          emoji +
          input.value.slice(end);

        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);

        recent = [emoji, ...recent.filter(item => item !== emoji)].slice(0, 24);

        try {
          localStorage.setItem("utanexa_recent_emojis", JSON.stringify(recent));
        } catch {}
      };

      grid.append(button);
    });
  }

  draw();
  search.addEventListener("input", draw);
}

function overlay(id, show) {
  const element = $(id);
  if (element) element.classList.toggle("hidden", !show);
}

function events() {
  const bind = (id, event, handler) => {
    $(id)?.addEventListener(event, handler);
  };

  bind("coupleBackButton", "click", () => {
    history.length > 1 ? history.back() : location.assign("/");
  });

  bind("coupleAvatarButton", "click", () => {
    const params = new URLSearchParams(location.search);
    const id =
      params.get("partner_id") ||
      params.get("user_id") ||
      params.get("id");

    if (id) {
      location.href = "/profile?user_id=" + encodeURIComponent(id);
    } else {
      toast("Partner profile unavailable");
    }
  });

  bind("coupleCallButton", "click", () => {
    toast("Calling needs a configured voice/video service.");
  });

  bind("coupleHeaderMood", "click", () => {
    overlay("coupleMoodOverlay", true);
  });

  bind("coupleMenuButton", "click", () => {
    overlay("coupleMenuOverlay", true);
  });

  bind("coupleAiButton", "click", () => {
    overlay("coupleAiOverlay", true);
  });

  bind("closeMoodPanel", "click", () => {
    overlay("coupleMoodOverlay", false);
  });

  bind("closeAiPanel", "click", () => {
    overlay("coupleAiOverlay", false);
  });

  bind("closeCoupleMenu", "click", () => {
    overlay("coupleMenuOverlay", false);
  });

  bind("closeSuggestions", "click", () => {
    $("coupleSuggestions").hidden = true;
  });

  document.querySelectorAll(".overlay").forEach(element => {
    element.addEventListener("click", event => {
      if (event.target === element) element.classList.add("hidden");
    });
  });

  bind("coupleMoodGrid", "click", event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;

    setMode(button.dataset.mode, true);
    overlay("coupleMoodOverlay", false);
  });

  bind("coupleQuickActions", "click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    setMode(
      action === "love"
        ? "romantic"
        : action === "memory"
          ? "memory"
          : action === "question"
            ? "deep_conversation"
            : "game",
      true
    );

    suggestions(REPLIES[action] || REPLIES.romantic);
  });

  document.querySelectorAll("[data-ai-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.aiAction;

      if (action === "mood") {
        analyze(messages.at(-1)?.content || "");
      } else {
        suggestions(REPLIES[action] || REPLIES.romantic);
      }

      overlay("coupleAiOverlay", false);
    });
  });

  document.querySelectorAll("[data-menu-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.menuAction;
      overlay("coupleMenuOverlay", false);

      if (action === "export") {
        const text = messages.map(message =>
          `${time(message.created_at)} ${message.is_mine ? "Me" : "Partner"}: ${message.content || message.file_name || "[media]"}`
        ).join("\n");

        const url = URL.createObjectURL(
          new Blob([text], { type: "text/plain" })
        );

        const link = document.createElement("a");
        link.href = url;
        link.download = "utanexa-couple-chat.txt";
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

      } else if (
        action === "clear" &&
        confirm("Clear this chat only from this device?")
      ) {
        messages = [];
        persist();
        render();
        toast("Local chat cleared");
      }
    });
  });

  bind("coupleComposer", "submit", event => {
    event.preventDefault();
    sendText($("coupleMessageInput")?.value || "");
  });

  bind("coupleMessageInput", "input", () => {
    try {
      realtime?.sendTyping?.(!!$("coupleMessageInput")?.value);
    } catch {}
  });

  bind("coupleEmojiButton", "click", () => {
    const picker = $("coupleEmojiPicker");
    const backdrop = $("couplePickerBackdrop");

    if (!picker || !backdrop) return;

    picker.hidden = !picker.hidden;
    backdrop.hidden = picker.hidden;

    if (!picker.hidden) $("coupleEmojiSearch")?.focus();
  });

  const hideEmojiPicker = () => {
    if ($("coupleEmojiPicker")) $("coupleEmojiPicker").hidden = true;
    if ($("couplePickerBackdrop")) $("couplePickerBackdrop").hidden = true;
  };

  bind("closeEmojiPicker", "click", hideEmojiPicker);
  bind("couplePickerBackdrop", "click", hideEmojiPicker);

  bind("coupleAttachButton", "click", () => $("coupleFileInput")?.click());
  bind("coupleCameraButton", "click", () => $("coupleCameraInput")?.click());

  bind("coupleFileInput", "change", event => files(event.target.files));
  bind("coupleCameraInput", "change", event => files(event.target.files));

  bind("coupleVoiceButton", "click", record);
  bind("coupleCancelRecording", "click", () => stopRecord(false));
  bind("coupleStopRecording", "click", () => stopRecord(true));
}

async function files(fileList) {
  for (const file of fileList || []) {
    if (file.size > 25 * 1024 * 1024) {
      toast(file.name + " is larger than 25 MB");
      continue;
    }

    const url = URL.createObjectURL(file);

    messages.push({
      message_id: "local-" + Date.now(),
      content: file.name,
      file_name: file.name,
      media_url: url,
      media_type: file.type || "application/octet-stream",
      created_at: new Date().toISOString(),
      is_mine: true,
      local_only: true
    });

    persist();
    render();

    toast("Media preview only: server upload is required to deliver it.");
  }

  if ($("coupleFileInput")) $("coupleFileInput").value = "";
  if ($("coupleCameraInput")) $("coupleCameraInput").value = "";
}

async function record() {
  if (recorder?.state === "recording") {
    stopRecord(true);
    return;
  }

  if (
    !navigator.mediaDevices?.getUserMedia ||
    !window.MediaRecorder
  ) {
    toast("Voice recording is not supported.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    recordChunks = [];
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = event => {
      if (event.data.size) recordChunks.push(event.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());

      if (window._keepVoice && recordChunks.length) {
        const blob = new Blob(recordChunks, {
          type: recorder.mimeType || "audio/webm"
        });

        const url = URL.createObjectURL(blob);

        messages.push({
          message_id: "voice-" + Date.now(),
          content: "Voice message",
          media_url: url,
          media_type: blob.type,
          created_at: new Date().toISOString(),
          is_mine: true,
          local_only: true
        });

        persist();
        render();

        toast("Voice preview only: server upload is required to send it.");
      }

      window._keepVoice = false;
    };

    recorder.start();
    recordStarted = Date.now();

    if ($("coupleRecordingBar")) $("coupleRecordingBar").hidden = false;

    recordInterval = setInterval(() => {
      const seconds = Math.floor((Date.now() - recordStarted) / 1000);

      if ($("coupleRecordingTime")) {
        $("coupleRecordingTime").textContent =
          String(Math.floor(seconds / 60)).padStart(2, "0") +
          ":" +
          String(seconds % 60).padStart(2, "0");
      }
    }, 250);

  } catch {
    toast("Microphone permission was not granted.");
  }
}

function stopRecord(keep) {
  if (!recorder || recorder.state !== "recording") return;

  window._keepVoice = keep;
  recorder.stop();

  clearInterval(recordInterval);

  if ($("coupleRecordingBar")) $("coupleRecordingBar").hidden = true;
}

function mergeHistory(historyList) {
  if (!Array.isArray(historyList)) return;

  const map = new Map(
    messages.map(message => [
      String(message.message_id || message.id || message.client_id),
      message
    ])
  );

  historyList.forEach(raw => {
    const message = normalize(raw);
    const id = String(
      message.message_id ||
      message.id ||
      message.client_id ||
      "hist-" + Math.random()
    );

    map.set(id, {
      ...map.get(id),
      ...message,
      message_id: id
    });
  });

  messages = [...map.values()]
    .sort((a, b) =>
      new Date(a.created_at || a.timestamp || 0) -
      new Date(b.created_at || b.timestamp || 0)
    )
    .slice(-500);

  persist();
  render();
}

function initRealtime() {
  if (typeof window.UsanexCoupleRealtime !== "function") {
    status("Offline", false);
    return;
  }

  try {
    realtime = new window.UsanexCoupleRealtime(partnerId, {
      onConnection: data => {
        state.connected = !!data.connected;

        if (data.user) {
          currentUserId =
            data.user.id ??
            data.user.user_id ??
            currentUserId;
        }

        if (data.partner) {
          if ($("couplePartnerName")) {
            $("couplePartnerName").textContent =
              data.partner.name ||
              data.partner.username ||
              "Partner";
          }

          if (
            data.partner.profile_photo &&
            $("couplePartnerAvatar")
          ) {
            $("couplePartnerAvatar").src = data.partner.profile_photo;
          }
        }

        status(
          data.partnerOnline
            ? "Online"
            : data.connected
              ? "Connected"
              : "Offline",
          data.partnerOnline
        );

        if (Array.isArray(data.history)) mergeHistory(data.history);
      },

      onMessage: message => {
        const normalized = normalize(message);
        add(normalized, normalized.is_mine);

        if (!normalized.is_mine) {
          try {
            realtime?.sendReceipt?.("message_delivered", normalized.message_id);
            realtime?.sendReceipt?.("message_read", normalized.message_id);
          } catch {}

          if (normalized.content) analyze(normalized.content);
        }
      },

      onHistory: mergeHistory,

      onReceipt: receipt => {
        const message = messages.find(item =>
          String(item.message_id || item.id) ===
          String(receipt.message_id || receipt.id)
        );

        if (message) {
          if ((receipt.type || receipt.status || "").includes("read")) {
            message.read_at = true;
          } else {
            message.delivered_at = true;
          }

          persist();
          render();
        }
      },

      onPresence: presence => {
        status(presence.online ? "Online" : "Offline", presence.online);
      },

      onTyping: typing => {
        if ($("coupleTyping")) {
          $("coupleTyping").hidden = !(
            typing.typing ??
            typing.isTyping ??
            typing.active
          );
        }

        if ($("coupleTypingName") && $("couplePartnerName")) {
          $("coupleTypingName").textContent =
            $("couplePartnerName").textContent;
        }
      }
    });

    realtime.connect?.();

  } catch (error) {
    console.warn("Realtime init error", error);
    status("Offline", false);
  }
}

function init() {
  const params = new URLSearchParams(location.search);

  if ($("couplePartnerName")) {
    $("couplePartnerName").textContent =
      params.get("partner_name") || "Partner";
  }

  status("Connecting…", false);

  try {
    messages = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(messages)) messages = [];
  } catch {
    messages = [];
  }

  render();
  setupEmoji();
  events();
  setMode(currentMode, false);
  initRealtime();

  const composer = document.querySelector(".composer-area");
  const app = $("coupleApp");

  if (composer && app && window.ResizeObserver) {
    new ResizeObserver(() => {
      const height = composer.getBoundingClientRect().height;

      app.style.setProperty("--composer-height", height + "px");
      document.documentElement.style.setProperty(
        "--composer-height",
        height + "px"
      );
    }).observe(composer);
  }

  setTimeout(scroll, 100);
}

window.UtaNexaCoupleChat = {
  setMode,
  sendText,
  getMessages: () => messages.slice(),
  refresh: render,
  getEffects: () => EFFECTS.slice()
};

window.UsanexCoupleChat = window.UtaNexaCoupleChat;
window.UtaNexaCoupleModes = MODES;
window.UtaNexaCoupleEffects = EFFECTS;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

})();
