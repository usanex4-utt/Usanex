/* =========================================================
UTANEXA — COUPLE CHAT
55 MOODS + AUTO MOOD DETECTION + ANIMATED EFFECTS
Realtime endpoint support: /ws/couple/{partner_user_id}
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
return utanexa_couple_messages_${state.partnerId || "unknown"};
}

function modeKey() {
return utanexa_couple_mode_${state.partnerId || "unknown"};
}

function safeText(value) {
return String(value ?? "").replace(/[&<>"']/g, (c) => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
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
local_${Date.now()}_${Math.random().toString(36).slice(2)};

return {  
  id: String(id),  
  serverId: item.id ?? item.message_id ?? null,  
  clientId: item.client_message_id ?? item.client_id ?? null,  
  senderId: item.sender_id ?? item.senderId ?? null,  
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
  replyTo: item.reply_to_message_id ?? item.reply_to ?? null,  
  isOwn: Boolean(item.isOwn)  
};

}

function saveMessages() {
try {
const safe = state.messages.filter(
(m) => !(m.mediaUrl && String(m.mediaUrl).startsWith("blob:"))
);

localStorage.setItem(storageKey(), JSON.stringify(safe.slice(-100)));  
} catch (_) {}

}

function loadMessages() {
try {
const raw = JSON.parse(localStorage.getItem(storageKey()) || "[]");

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
    '<span aria-hidden="true">💙</span><strong>Your story starts here</strong><p>Send your first message.</p>';  

  box.appendChild(empty);  
}  

state.messages.forEach((m) => {  
  const own =  
    state.currentUserId !== null && m.senderId !== null  
      ? String(m.senderId) === String(state.currentUserId)  
      : Boolean(m.isOwn);  

  const row = document.createElement("div");  
  row.className = `couple-message-row ${own ? "is-own" : "is-partner"}`;  
  row.dataset.messageId = m.id;  

  const bubble = document.createElement("div");  
  bubble.className = "couple-message-bubble";  

  if (m.mediaUrl) {  
    const type = String(m.mediaType || "").toLowerCase();  

    if (  
      type.startsWith("image/") ||  
      /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.mediaUrl)  
    ) {  
      const img = document.createElement("img");  
      img.className = "couple-message-image";  
      img.src = m.mediaUrl;  
      img.alt = "Shared image";  
      img.loading = "lazy";  
      bubble.appendChild(img);  
    } else if (type.startsWith("audio/") || m.messageType === "voice") {  
      const audio = document.createElement("audio");  
      audio.controls = true;  
      audio.src = m.mediaUrl;  
      bubble.appendChild(audio);  
    } else {  
      const link = document.createElement("a");  
      link.href = m.mediaUrl;  
      link.target = "_blank";  
      link.rel = "noopener noreferrer";  
      link.textContent = "Open attachment";  
      bubble.appendChild(link);  
    }  
  }  

  if (m.content) {  
    const content = document.createElement("div");  
    content.className = "couple-message-text";  
    content.textContent = m.content;  
    bubble.appendChild(content);  
  }  

  const meta = document.createElement("div");  
  meta.className = "couple-message-meta";  

  const time = document.createElement("span");  
  time.textContent = formatTime(m.timestamp);  
  meta.appendChild(time);  

  if (own) {  
    const receipt = document.createElement("span");  
    receipt.className = `couple-message-receipt receipt-${safeText(m.status)}`;  

    receipt.textContent =  
      m.status === "seen" ? "✓✓" :  
      m.status === "delivered" ? "✓✓" :  
      m.status === "sent" ? "✓" :  
      m.status === "pending" ? "◷" : "";  

    receipt.setAttribute("aria-label", m.status || "sent");  
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

if (online) setStatus("Online", "online");  
else if (lastSeen) {  
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
const incoming = normaliseMessage(item);

let existing = state.messages.find((m) =>  
  (  
    incoming.clientId &&  
    (m.clientId === incoming.clientId || m.id === incoming.clientId)  
  ) ||  
  (  
    incoming.serverId &&  
    m.serverId &&  
    String(m.serverId) === String(incoming.serverId)  
  )  
);  

if (existing) {  
  existing.serverId = incoming.serverId || existing.serverId;  
  existing.id = incoming.serverId  
    ? String(incoming.serverId)  
    : existing.id;  

  existing.senderId = incoming.senderId ?? existing.senderId;  
  existing.content = incoming.content || existing.content;  
  existing.mediaUrl = incoming.mediaUrl || existing.mediaUrl;  
  existing.mediaType = incoming.mediaType || existing.mediaType;  
  existing.timestamp = incoming.timestamp || existing.timestamp;  
  existing.status = incoming.status || "sent";  
} else {  
  state.messages.push(incoming);  
}  

state.messages = state.messages.slice(-100);  
saveMessages();  
render();

}

function handleHistory(messages) {
const localPending = state.messages.filter(
(m) => m.status === "pending" || m.status === "local_only"
);

const history = (messages || []).map(normaliseMessage);  
const byId = new Map();  

history.forEach((m) => {  
  byId.set(String(m.serverId || m.id), m);  
});  

localPending.forEach((m) => {  
  if (!byId.has(String(m.serverId || m.id))) {  
    byId.set(String(m.serverId || m.id), m);  
  }  
});  

state.messages = Array.from(byId.values())  
  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))  
  .slice(-100);  

saveMessages();  
render();

}

function renderSuggestions() {
const grid =
$("coupleSuggestionList") ||
$("coupleMoodSuggestions") ||
$("coupleMoodQuickReplies");

if (!grid) return;  

grid.innerHTML = "";  

(SUGGESTIONS[state.mode] || SUGGESTIONS.romantic).forEach((text) => {  
  const button = document.createElement("button");  
  button.type = "button";  
  button.className = "couple-suggestion-chip suggestion-chip";  
  button.textContent = text;  

  button.addEventListener("click", () => {  
    const input = $("coupleMessageInput") || $("coupleInput");  

    if (input) {  
      input.value = text;  
      input.focus();  
    }  
  });  

  grid.appendChild(button);  
});

}

function setMode(mode, persist = true) {
const selected = MODES.some((m) => m[0] === mode)
? mode
: "romantic";

state.mode = selected;  

document.body.dataset.coupleMode = selected;  
document.documentElement.dataset.coupleMode = selected;  

const modeData = MODES.find((m) => m[0] === selected);  

const modeButton =  
  $("coupleHeaderMood") ||  
  $("coupleMoodButton") ||  
  $("coupleCurrentMood");  

if (modeButton && modeData) {  
  modeButton.title = `${modeData[2]} ${modeData[1]}`;  
  modeButton.setAttribute("aria-label", `Current mood: ${modeData[1]}`);  

  const label = modeButton.querySelector("[data-mood-label]");  

  if (label) label.textContent = modeData[1];  
  else if (modeButton.id === "coupleHeaderMood") {  
    modeButton.textContent = `${modeData[2]} ${modeData[1]}`;  
  }  
}  

document.querySelectorAll("[data-couple-mood]").forEach((btn) => {  
  const active = btn.dataset.coupleMood === selected;  

  btn.classList.toggle("active", active);  
  btn.setAttribute("aria-pressed", String(active));  
});  

if (persist) {  
  try {  
    localStorage.setItem(modeKey(), selected);  
  } catch (_) {}  

  fetch("/api/couple-chat/mood", {  
    method: "POST",  
    headers: { "Content-Type": "application/json" },  
    credentials: "same-origin",  
    body: JSON.stringify({  
      partner_id: state.partnerId,  
      mood: selected,  
      mode: selected  
    })  
  }).catch(() => {});  
}  

renderSuggestions();  
launchMoodEffects(selected);

}

function launchMoodEffects(mode) {
const layer = $("coupleEffectsLayer");

if (!layer) return;  

layer.innerHTML = "";  

const config = {  
  romantic: ["💗", "♥", "♡"],  
  deep_love: ["❤️", "💞", "♥"],  
  happy: ["✨", "☀️", "✦"],  
  funny: ["😂", "✦", "🎈"],  
  sad: ["💧", "⋆", "🌧️"],  
  emotional: ["💗", "✨", "🥹"],  
  angry: ["🔥", "✦", "⚡"],  
  frustrated: ["⚡", "⋆", "🔥"],  
  caring: ["💗", "✧", "🤗"],  
  comfort: ["🫧", "♡", "✧"],  
  flirty: ["😘", "💋", "♡"],  
  passionate: ["❤️", "🔥", "💋"],  
  good_night: ["🌙", "✦", "⭐"],  
  good_morning: ["☀️", "✧", "🌼"],  
  memory: ["📸", "♡", "✧"],  
  celebration: ["🎉", "✨", "🎊"],  
  birthday: ["🎂", "🎉", "✨"],  
  future_marriage: ["💍", "♡", "✨"],  
  missing_you: ["🥺", "♡", "💗"],  
  apology: ["🕊️", "♡", "✧"],  
  appreciation: ["✨", "🌟", "♡"],  
  game: ["🎮", "✦", "⭐"],  
  photo_memory: ["📸", "✧", "♡"],  
  serious_talk: ["✦", "○", "⋆"],  
  deep_conversation: ["🌌", "✦", "☾"],  
  calm: ["🍃", "🫧", "✧"],  
  excited: ["🤩", "✨", "🎉"],  
  jealous: ["💚", "♡", "✦"],  
  lonely: ["🌧️", "⋆", "💧"],  
  grateful: ["🙏", "✨", "💛"],  
  hopeful: ["🌈", "✨", "🌟"],  
  worried: ["🫧", "♡", "✧"],  
  stressed: ["🍃", "🫧", "○"],  
  confused: ["✦", "❔", "⋆"],  
  shy: ["💗", "☺️", "♡"],  
  proud: ["🏆", "✨", "🌟"],  
  supportive: ["🤝", "💙", "✨"],  
  playful: ["😜", "🎈", "✦"],  
  teasing: ["😏", "♡", "✦"],  
  peaceful: ["🕊️", "🍃", "🫧"],  
  sleepy: ["🌙", "⭐", "💤"],  
  nostalgic: ["📷", "♡", "✧"],  
  long_distance: ["🌍", "💗", "✦"],  
  trust: ["🤍", "♡", "✨"],  
  reassurance: ["🫂", "💗", "🫧"],  
  conflict_resolution: ["🕊️", "❤️‍🩹", "♡"],  
  boundaries: ["🛡️", "○", "✦"],  
  vulnerable: ["💗", "🫧", "♡"],  
  motivated: ["🚀", "✨", "⭐"],  
  bored: ["🥱", "⋆", "🎈"],  
  curious: ["🔎", "✦", "❔"],  
  surprise: ["🎁", "✨", "🎉"],  
  anniversary: ["💐", "♡", "✨"],  
  proposal: ["💍", "❤️", "✨"],  
  reconciliation: ["❤️‍🩹", "🕊️", "♡"]  
};  

const symbols = config[mode] || config.romantic;  

const reduceMotion = window.matchMedia &&  
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;  

const count = reduceMotion ? 3 : 16;  

for (let i = 0; i < count; i++) {  
  const particle = document.createElement("span");  

  particle.className =  
    `mood-particle mood-particle-${mode.replace(/_/g, "-")}`;  

  particle.textContent = symbols[i % symbols.length];  
  particle.style.left = `${Math.random() * 100}%`;  
  particle.style.setProperty("--delay", `${Math.random() * 7}s`);  
  particle.style.setProperty("--duration", `${7 + Math.random() * 9}s`);  
  particle.style.setProperty(  
    "--drift",  
    `${Math.round(Math.random() * 100 - 50)}px`  
  );  
  particle.style.setProperty("--size", `${12 + Math.random() * 15}px`);  

  layer.appendChild(particle);  
}

}

function openMoodPicker() {
const modal =
$("coupleMoodOverlay") ||
$("coupleMoodModal") ||
$("coupleMoodPicker") ||
$("moodModal");

if (!modal) return;  

modal.classList.remove("hidden");  
modal.classList.add("is-open", "open", "active");  
modal.removeAttribute("hidden");  
modal.setAttribute("aria-hidden", "false");

}

function closeMoodPicker() {
const modal =
$("coupleMoodOverlay") ||
$("coupleMoodModal") ||
$("coupleMoodPicker") ||
$("moodModal");

if (!modal) return;  

modal.classList.remove("is-open", "open", "active");  

if (modal.id === "coupleMoodOverlay") {  
  modal.classList.add("hidden");  
}  

modal.setAttribute("aria-hidden", "true");  

if (modal.dataset.hideOnClose === "true") {  
  modal.hidden = true;  
}

}

function buildMoodButtons() {
const grid = $("coupleMoodGrid");

if (!grid || grid.dataset.built === "true") return;  

grid.dataset.built = "true";  
grid.innerHTML = "";  

MODES.forEach(([key, label, emoji]) => {  
  const btn = document.createElement("button");  

  btn.type = "button";  
  btn.className = "couple-mood-option";  
  btn.dataset.coupleMood = key;  

  btn.innerHTML =  
    `<span class="couple-mood-emoji">${emoji}</span>` +  
    `<span>${safeText(label)}</span>`;  

  btn.addEventListener("click", () => {  
    setMode(key);  
    closeMoodPicker();  
  });  

  grid.appendChild(btn);  
});

}

function inputElement() {
return $("coupleMessageInput") ||
$("coupleInput") ||
$("messageInput");
}

// On-device keyword detection. Message text is not sent to a mood API.
function detectMessageMood(text) {
const value = String(text || "").toLowerCase();

const rules = [  
  ["good_night", /\b(good night|gn|so ja|shubh ratri|night jaan)\b/],  
  ["good_morning", /\b(good morning|gm|suprabhat|uth jao)\b/],  
  ["apology", /\b(sorry|maaf|mafi|forgive me|galti meri)\b/],  
  ["angry", /\b(angry|gussa|ghussa|hate you|bakwas|chup raho)\b/],  
  ["sad", /\b(sad|dukhi|rona|ro raha|ro rahi|upset|low feel|udaas|akela|akeli)\b/],  
  ["comfort", /\b(akela nahi|i am here|main hoon na|tension mat|don't worry|chinta mat)\b/],  
  ["missing_you", /\b(miss you|yaad aa|yaad kar|missing you|tumhari yaad)\b/],  
  ["deep_love", /\b(love you so much|meri jaan|forever|hamesha tum|soulmate)\b/],  
  ["romantic", /\b(i love you|love you|pyaar|pyar|jaan|baby|babu|kiss|❤️|💕|💗|💖)\b/],  
  ["happy", /\b(happy|khush|yay|awesome|great|mast|maza aa|😊|😄|😁)\b/],  
  ["funny", /\b(haha|lol|funny|joke|😂|🤣|mazaak|mazak)\b/],  
  ["caring", /\b(khana khaya|take care|apna khayal|paani pi|rest kar|tabiyat)\b/],  
  ["flirty", /\b(cute|sexy|flirt|handsome|beautiful|😉|😘)\b/],  
  ["appreciation", /\b(thank you|thanks|shukriya|proud of you|best ho|special ho)\b/],  
  ["serious_talk", /\b(serious baat|baat karni|listen to me|meri baat|important baat)\b/],  
  ["game", /\b(truth or dare|game khele|game khelen|quiz|🎮)\b/],  
  ["excited", /\b(excited|super excited|can't wait|cant wait|bahut khush|🤩)\b/],  
  ["jealous", /\b(jealous|jalan|jealousy|insecure feel)\b/],  
  ["lonely", /\b(lonely|alone feel|akela feel|akeli feel|tanha)\b/],  
  ["grateful", /\b(grateful|thankful|shukr|blessed)\b/],  
  ["hopeful", /\b(hopeful|umeed|better days|sab theek hoga)\b/],  
  ["worried", /\b(worried|worry|fikar|chinta|pareshan)\b/],  
  ["stressed", /\b(stressed|stress|overwhelmed|pressure|thak gaya|thak gayi)\b/],  
  ["confused", /\b(confused|samajh nahi|confuse|uljhan)\b/],  
  ["shy", /\b(shy|sharma|sharma raha|sharma rahi|blush)\b/],  
  ["proud", /\b(proud|garv|proud of you|well done)\b/],  
  ["supportive", /\b(support|support you|saath hoon|saath hu|i got you)\b/],  
  ["playful", /\b(playful|masti|silly|😜)\b/],  
  ["teasing", /\b(tease|teasing|chidhana|chhedna|😏)\b/],  
  ["peaceful", /\b(peaceful|sukoon|peace|shanti)\b/],  
  ["sleepy", /\b(sleepy|neend aa|so raha|so rahi|😴)\b/],  
  ["nostalgic", /\b(nostalgic|purani yaad|old memories|those days)\b/],  
  ["long_distance", /\b(long distance|long-distance|door hain|door ho|distance relationship)\b/],  
  ["trust", /\b(trust|bharosa|vishwas)\b/],  
  ["reassurance", /\b(reassure|reassurance|pakka na|you still love me|i am here for you)\b/],  
  ["conflict_resolution", /\b(make up|sort this out|sulah|suljha|patch up|resolve this)\b/],  
  ["boundaries", /\b(boundaries|personal space|comfortable with|limit set)\b/],  
  ["vulnerable", /\b(vulnerable|dil ki baat|honestly share|hard to say)\b/],  
  ["motivated", /\b(motivated|motivation|let's do this|kar sakte|kar sakti|🚀)\b/],  
  ["bored", /\b(bored|boring|pak gaya|pak gayi|bore ho raha)\b/],  
  ["curious", /\b(curious|wondering|ek sawal|question puch|ask you something)\b/],  
  ["surprise", /\b(surprise|guess what|secret plan|🎁)\b/],  
  ["anniversary", /\b(anniversary|saalgirah|our special day)\b/],  
  ["proposal", /\b(proposal|marry me|shaadi karogi|shaadi karoge)\b/],  
  ["reconciliation", /\b(reconcile|heal things|start again|give us another chance|❤️‍🩹)\b/]  
];  

for (const [mode, pattern] of rules) {  
  if (pattern.test(value)) return mode;  
}  

return null;

}

function sendText() {
const input = inputElement();
if (!input) return;

const content = input.value.trim();  
if (!content) return;  

const detectedMood = detectMessageMood(content);  

if (detectedMood && detectedMood !== state.mode) {  
  setMode(detectedMood, false);  
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
state.messages.push(local);  
saveMessages();  
render();  

input.value = "";  

const sent = state.realtime && state.realtime.sendMessage({  
  client_message_id: clientId,  
  content,  
  message_type: "text"  
});  

if (!sent) {  
  const found = state.messages.find(  
    (m) => m.clientId === clientId || m.id === clientId  
  );  

  if (found) {  
    found.status = state.realtime?.connected  
      ? "pending"  
      : "local_only";  
  }  

  saveMessages();  
  render();  

  if (!state.realtime?.connected) {  
    setStatus("Reconnecting…", "offline");  
  }  
}  

if (state.realtime?.connected && state.typingSent) {  
  state.realtime.stopTyping();  
  state.typingSent = false;  
}

}

function sendMedia(url, mediaType, messageType = "image") {
if (!url) return;

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

const sent = state.realtime?.sendMessage({  
  client_message_id: clientId,  
  media_url: url,  
  media_type: mediaType,  
  message_type: messageType  
});  

if (!sent) {  
  item.status = "local_only";  
  saveMessages();  
  render();  
}

}

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

function sendPresetText(text) {
const input = inputElement();
if (!input) return;

input.value = text;  
sendText();

}

function exportChatText() {
const text = state.messages.map((m) =>
[${formatTime(m.timestamp)}] ${m.isOwn ? "You" : "Partner"}: ${m.content || (m.mediaUrl ? "[attachment]" : "")}
).join("\n");

const url = URL.createObjectURL(  
  new Blob([text], { type: "text/plain;charset=utf-8" })  
);  

const a = document.createElement("a");  
a.href = url;  
a.download = "utanexa-chat.txt";  
a.click();  

setTimeout(() => URL.revokeObjectURL(url), 1000);  
$("closeCoupleMenu")?.click();

}

function buildEmojiGrid(search = "") {
const grid = $("coupleEmojiGrid");
if (!grid) return;

const emojis = [  
  "😀","😃","😄","😁","😅","😂","🤣","🥹","😊","😍","🥰","😘",  
  "😎","🥳","😭","😢","🥺","😡","🤗","🫂","❤️","🧡","💛","💚",  
  "💙","💜","💕","💞","💓","💗","💖","💘","💝","💋","🌹","🌷",  
  "✨","⭐","🌙","☀️","🔥","🎉","🎂","💍","🎮","📸","🙏","🕊️"  
];  

const q = String(search).trim();  

grid.innerHTML = emojis  
  .filter((e) => !q || e.includes(q))  
  .map((e) =>  
    `<button type="button" class="emoji-item" data-emoji="${e}">${e}</button>`  
  )  
  .join("");

}

function closeEmojiPicker() {
if ($("couplePickerBackdrop")) {
$("couplePickerBackdrop").hidden = true;
}

if ($("coupleEmojiPicker")) {  
  $("coupleEmojiPicker").hidden = true;  
}

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

const moodButton =  
  $("coupleHeaderMood") ||  
  $("coupleMoodButton") ||  
  $("coupleCurrentMood");  

if (moodButton) {  
  moodButton.addEventListener("click", openMoodPicker);  
}  

document.querySelectorAll("[data-mode]").forEach((btn) => {  
  btn.addEventListener("click", () => {  
    const mode = btn.dataset.mode;  

    if (MODES.some((item) => item[0] === mode)) {  
      setMode(mode);  
      closeMoodPicker();  
    }  
  });  
});  

document.querySelectorAll(  
  "[data-close-couple-mood], .couple-mood-close"  
).forEach((btn) => {  
  btn.addEventListener("click", closeMoodPicker);  
});  

$("closeMoodPanel")?.addEventListener("click", closeMoodPicker);  

$("coupleMoodOverlay")?.addEventListener("click", (event) => {  
  if (event.target.id === "coupleMoodOverlay") {  
    closeMoodPicker();  
  }  
});  

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

  const actionButton = event.target.closest("[data-ai-action]");  
  if (!actionButton) return;  

  const action = actionButton.dataset.aiAction;  

  if (  
    action === "suggest" ||  
    action === "question" ||  
    action === "game"  
  ) {  
    if (action === "game") setMode("game");  
    else if (action === "question") setMode("deep_conversation");  

    const panel = $("coupleSuggestions");  
    if (panel) panel.hidden = false;  
  }  

  if (action === "mood") openMoodPicker();  

  $("closeAiPanel")?.click();  
});  

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

  if (action === "export") exportChatText();  

  if (  
    action === "clear" &&  
    window.confirm("Clear locally saved messages from this device?")  
  ) {  
    state.messages = [];  
    saveMessages();  
    render();  
  }  
});  

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

$("coupleAttachButton")?.addEventListener("click", () => {  
  $("coupleFileInput")?.click();  
});  

$("coupleCameraButton")?.addEventListener("click", () => {  
  $("coupleCameraInput")?.click();  
});  

$("coupleAvatarButton")?.addEventListener("click", () => {  
  const name = $("couplePartnerName")?.textContent || "Partner";  

  if (typeof window.showToast === "function") {  
    window.showToast(name);  
  }  
});  

$("coupleBackButton")?.addEventListener("click", () => {  
  if (history.length > 1) history.back();  
  else location.href = "/";  
});  

$("coupleCallButton")?.addEventListener("click", () => {  
  setStatus("Calling is not configured yet", "neutral");  
});  

const fileInput =  
  $("coupleMediaInput") ||  
  $("coupleImageInput") ||  
  $("coupleFileInput");  

if (fileInput) {  
  fileInput.addEventListener("change", () => {  
    const file = fileInput.files && fileInput.files[0];  
    if (!file) return;  

    const previewUrl = URL.createObjectURL(file);  
    const isImage = file.type.startsWith("image/");  

    if (isImage) {  
      const preview = $("coupleMediaPreview");  

      if (preview) {  
        preview.innerHTML = "";  

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
      setStatus(  
        "This file needs an uploaded public URL before sending",  
        "neutral"  
      );  
    }  

    fileInput.value = "";  
  });  
}

}

function initRealtime() {
if (!window.UsanexCoupleRealtime) {
setStatus("Chat connection unavailable", "offline");
return;
}

state.realtime = new window.UsanexCoupleRealtime({  
  partnerId: state.partnerId,  

  onStatus: (info) => {  
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
      if (!state.connectedEventReceived || info.state === "offline") {  
        setStatus("Offline", "offline");  
      }  
    }  
  },  

  onConnection: (data) => updatePartner(data),  

  onHistory: (messages) => handleHistory(messages),  

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
    const online = Boolean(presence.is_online ?? presence.online);  

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
      data.is_typing ??  
      data.typing ??  
      data.active  
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

    const item = state.messages.find((m) =>  
      (  
        receipt.client_message_id &&  
        (  
          m.clientId === receipt.client_message_id ||  
          m.id === receipt.client_message_id  
        )  
      ) ||  
      (  
        receipt.message_id &&  
        String(m.serverId || m.id) === String(receipt.message_id)  
      ) ||  
      (  
        id &&  
        String(m.serverId || m.id) === String(id)  
      )  
    );  

    if (item) {  
      const status = String(receipt.status || "").toLowerCase();  

      if (status === "seen" || status === "read") {  
        item.status = "seen";  
      } else if (status === "delivered") {  
        item.status = "delivered";  
      } else if (status === "sent" && item.status === "pending") {  
        item.status = "sent";  
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
    setStatus("Reconnecting…", "offline");  
  }  
});  

state.realtime.connect();

}

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

window.UtaNexaCoupleChat = {
setMode,
sendText,
sendMedia,
openMoodPicker,
closeMoodPicker,
detectMessageMood,

getModes: () => MODES.map(([key, label, emoji]) => ({  
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

window.UsanexCoupleChat = window.UtaNexaCoupleChat;

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init);
} else {
init();
}
})();
