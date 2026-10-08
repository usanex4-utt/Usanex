/* =========================================================
   USANEX COUPLE CHAT
   FINAL DYNAMIC EXPERIENCE
   Version 3.0
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
       ===================================================== */

    const CONFIG = {
        storageKey: "usanex_couple_chat_v3",
        modeKey: "usanex_couple_mode_v3",
        recentEmojiKey: "usanex_recent_emojis_v3",
        partnerKey: "usanex_couple_partner_v3",

        analyzeEndpoint: "/api/couple-chat/analyze",
        messageEndpoint: "/api/couple-chat/message",

        maxMessages: 500,
        maxRecentEmoji: 24
    };

    /* =====================================================
       26 COUPLE MODES
       ===================================================== */

    const MODES = {
        romantic: {
            label: "Romantic",
            icon: "❤️",
            emotion: "love",
            background: "romantic",
            effect: "hearts",
            suggestions: [
                "I just want to be close to you ❤️",
                "You make my heart smile.",
                "I wish you were here with me tonight."
            ]
        },

        "deep-love": {
            label: "Deep Love",
            icon: "🥰",
            emotion: "deep_love",
            background: "deep-love",
            effect: "soft-hearts",
            suggestions: [
                "You mean more to me than I can explain ❤️",
                "I feel lucky to have you.",
                "You are my safe place."
            ]
        },

        happy: {
            label: "Happy",
            icon: "😊",
            emotion: "happiness",
            background: "happy",
            effect: "sparkles",
            suggestions: [
                "Today feels better because of you 😊",
                "Let's make another happy memory.",
                "You always make me smile."
            ]
        },

        funny: {
            label: "Funny",
            icon: "😂",
            emotion: "fun",
            background: "funny",
            effect: "bounce",
            suggestions: [
                "Okay 😂 challenge accepted!",
                "You are impossible 😂",
                "Wait till I get my revenge!"
            ]
        },

        sad: {
            label: "Sad",
            icon: "😢",
            emotion: "sadness",
            background: "sad",
            effect: "rain",
            suggestions: [
                "I'm here with you.",
                "Tell me what happened.",
                "You don't have to handle it alone."
            ]
        },

        emotional: {
            label: "Emotional",
            icon: "😭",
            emotion: "emotional",
            background: "emotional",
            effect: "slow-particles",
            suggestions: [
                "I understand how you feel.",
                "Come here, I'm listening.",
                "You can tell me everything."
            ]
        },

        angry: {
            label: "Angry",
            icon: "😠",
            emotion: "anger",
            background: "angry",
            effect: "pulse",
            suggestions: [
                "Let's talk about it calmly.",
                "Tell me what upset you.",
                "I don't want us to fight."
            ]
        },

        frustrated: {
            label: "Frustrated",
            icon: "😤",
            emotion: "frustration",
            background: "frustrated",
            effect: "pulse",
            suggestions: [
                "Take a breath. I'm listening.",
                "Tell me what's bothering you.",
                "We'll figure it out together."
            ]
        },

        caring: {
            label: "Caring",
            icon: "🤗",
            emotion: "care",
            background: "caring",
            effect: "warm-glow",
            suggestions: [
                "Have you eaten?",
                "Please take care of yourself ❤️",
                "I'm always here for you."
            ]
        },

        comfort: {
            label: "Comfort",
            icon: "🫂",
            emotion: "comfort",
            background: "comfort",
            effect: "breathing",
            suggestions: [
                "Come here, you deserve a hug 🫂",
                "It's okay. I'm with you.",
                "You are safe with me."
            ]
        },

        flirty: {
            label: "Flirty",
            icon: "😘",
            emotion: "flirty",
            background: "flirty",
            effect: "hearts",
            suggestions: [
                "Why are you making me smile like this? 😘",
                "Someone is looking cute today.",
                "Come closer 😉"
            ]
        },

        passionate: {
            label: "Passionate",
            icon: "🔥",
            emotion: "passion",
            background: "passionate",
            effect: "fire-glow",
            suggestions: [
                "You have no idea what you do to me ❤️",
                "I can't stop thinking about you.",
                "You make everything feel intense."
            ]
        },

        "good-night": {
            label: "Good Night",
            icon: "🌙",
            emotion: "peace",
            background: "good-night",
            effect: "stars",
            suggestions: [
                "Good night, sleep peacefully 🌙",
                "Wish I could say good night beside you.",
                "Sweet dreams ❤️"
            ]
        },

        "good-morning": {
            label: "Good Morning",
            icon: "☀️",
            emotion: "fresh",
            background: "good-morning",
            effect: "sunrise",
            suggestions: [
                "Good morning, beautiful ☀️",
                "I hope your day starts with a smile.",
                "Morning feels better when I think of you."
            ]
        },

        memory: {
            label: "Memory",
            icon: "💭",
            emotion: "nostalgia",
            background: "memory",
            effect: "dust",
            suggestions: [
                "Do you remember that day?",
                "That memory still makes me smile.",
                "We should create another memory like that."
            ]
        },

        celebration: {
            label: "Celebration",
            icon: "🥳",
            emotion: "celebration",
            background: "celebration",
            effect: "confetti",
            suggestions: [
                "We have to celebrate this! 🥳",
                "This deserves a special memory.",
                "Cheers to us ❤️"
            ]
        },

        birthday: {
            label: "Birthday",
            icon: "🎂",
            emotion: "joy",
            background: "birthday",
            effect: "confetti",
            suggestions: [
                "Today is all about you 🎂❤️",
                "I hope your biggest wish comes true.",
                "Let's make this birthday unforgettable."
            ]
        },

        future: {
            label: "Future",
            icon: "💍",
            emotion: "hope",
            background: "future",
            effect: "stars",
            suggestions: [
                "Imagine where we'll be together someday ❤️",
                "I want to build beautiful memories with you.",
                "Our future sounds beautiful."
            ]
        },

        "missing-you": {
            label: "Missing You",
            icon: "🫶",
            emotion: "longing",
            background: "missing-you",
            effect: "hearts",
            suggestions: [
                "I wish you were here right now ❤️",
                "I miss you more than I can say.",
                "Come back soon."
            ]
        },

        apology: {
            label: "Apology",
            icon: "😔",
            emotion: "regret",
            background: "apology",
            effect: "soft-particles",
            suggestions: [
                "I'm really sorry.",
                "I don't want to hurt you.",
                "Can we talk about it?"
            ]
        },

        appreciation: {
            label: "Appreciation",
            icon: "💕",
            emotion: "gratitude",
            background: "appreciation",
            effect: "sparkles",
            suggestions: [
                "Thank you for being you ❤️",
                "I appreciate everything you do.",
                "I'm really lucky to have you."
            ]
        },

        game: {
            label: "Game",
            icon: "🎮",
            emotion: "playful",
            background: "game",
            effect: "game",
            suggestions: [
                "Let's play a couple game 🎮",
                "Truth or dare?",
                "Let's see who knows the other better."
            ]
        },

        "photo-memory": {
            label: "Photo Memory",
            icon: "📸",
            emotion: "nostalgia",
            background: "photo-memory",
            effect: "camera",
            suggestions: [
                "This photo deserves a memory ❤️",
                "Look how happy we were.",
                "Let's make another memory."
            ]
        },

        serious: {
            label: "Serious Talk",
            icon: "🤔",
            emotion: "serious",
            background: "serious",
            effect: "minimal",
            suggestions: [
                "Let's talk honestly.",
                "I'm listening carefully.",
                "Tell me what you're thinking."
            ]
        },

        "deep-talk": {
            label: "Deep Talk",
            icon: "🧠",
            emotion: "thoughtful",
            background: "deep-talk",
            effect: "slow-particles",
            suggestions: [
                "What's something you never tell anyone?",
                "What does love mean to you?",
                "Tell me what's really on your mind."
            ]
        },

        calm: {
            label: "Calm",
            icon: "😌",
            emotion: "peace",
            background: "calm",
            effect: "breathing",
            suggestions: [
                "Let's just enjoy this moment.",
                "No pressure. Just us.",
                "I'm happy being here with you."
            ]
        }
    };

    /* =====================================================
       EMOJIS
       ===================================================== */

    const EMOJIS = {
        recent: [],

        love: [
            "❤️","🩷","🧡","💛","💚","💙","🩵","💜","🤎","🖤",
            "🩶","🤍","💕","💞","💓","💗","💖","💘","💝","💟",
            "❣️","💌","💋","💑","👩‍❤️‍👨","👨‍❤️‍👨","👩‍❤️‍👩",
            "🥰","😍","😘","😚","😙","😻","🫶"
        ],

        smile: [
            "😀","😃","😄","😁","😆","😅","😂","🤣","😊","🙂",
            "🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋",
            "😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥳","🤩",
            "🥹","☺️","😇","🤭","🫢","🫣"
        ],

        people: [
            "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞",
            "🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎",
            "👏","🙌","👐","🤝","🙏","💪","🫂","🫶","👀","🫀",
            "🧠","👑","💎"
        ],

        animals: [
            "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
            "🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧",
            "🐦","🐤","🦄","🐝","🦋","🐢","🐍","🐙","🐠","🐬"
        ],

        food: [
            "🍎","🍓","🍒","🍉","🍇","🍑","🍊","🍋","🍌","🥭",
            "🍍","🥝","🍕","🍔","🍟","🌭","🌮","🍿","🍩","🍪",
            "🎂","🍰","🧁","🍫","🍭","☕","🧋","🍹","🍓"
        ],

        fun: [
            "🎮","🎯","🎲","🧩","🎸","🎵","🎶","🎤","🎧","🎬",
            "🎨","🎉","🎊","🎈","🥳","🏆","⚽","🏀","🏏","🎳",
            "🎭","🎪","🎠","🚀"
        ],

        travel: [
            "✈️","🚗","🚕","🚌","🚆","🚢","🏝️","🏖️","🌍","🌎",
            "🌙","⭐","🌟","✨","🌈","☀️","🌤️","🌅","🌄","🏔️",
            "🏕️","🏙️","🌃"
        ],

        objects: [
            "📱","💻","📷","📸","🎁","💍","💎","🔑","📚","💡",
            "🎀","🧸","🕯️","📩","💌","📍","🔒","🔓","⌚","🎒"
        ],

        symbols: [
            "✨","⭐","🌟","💫","🔥","💥","💯","✅","❌","❗",
            "❓","‼️","⁉️","💢","💤","💦","💨","☀️","🌙","☁️",
            "🌸","🌹","🌷","🌺","🍀"
        ]
    };

    /* =====================================================
       STATE
       ===================================================== */

    const state = {
        mode: "calm",
        intensity: 0.5,
        timeContext: "night",
        messages: [],
        partner: {
            id: null,
            name: "Partner",
            avatar: "/static/images/default-profile.png",
            online: false
        },
        isSending: false,
        emojiCategory: "love"
    };

    /* =====================================================
       DOM
       ===================================================== */

    const $ = (id) => document.getElementById(id);

    const app = $("coupleApp");
    const messagesEl = $("coupleMessages");
    const input = $("coupleMessageInput");
    const composer = $("coupleComposer");

    const moodBar = $("coupleMoodBar");
    const moodIcon = $("coupleMoodIcon");
    const moodName = $("coupleMoodName");

    const aiStatus = $("coupleAiStatus");

    const effectsLayer = $("coupleEffectsLayer");
    const backgroundLayer = $("coupleBackgroundLayer");

    const suggestionsEl = $("coupleSuggestions");
    const suggestionList = $("coupleSuggestionList");

    const partnerNameEl = $("couplePartnerName");
    const partnerAvatarEl = $("couplePartnerAvatar");
    const onlineDot = $("coupleOnlineDot");

    /* =====================================================
       UTILITIES
       ===================================================== */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function nowTime() {
        return new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalizeMode(mode) {
        if (!mode) return "calm";

        const normalized = String(mode)
            .trim()
            .toLowerCase()
            .replace(/_/g, "-")
            .replace(/\s+/g, "-");

        return MODES[normalized] ? normalized : "calm";
    }

    /* =====================================================
       TIME DETECTION
       ===================================================== */

    function detectTimeContext() {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 11) {
            return "morning";
        }

        if (hour >= 11 && hour < 17) {
            return "day";
        }

        if (hour >= 17 && hour < 20) {
            return "evening";
        }

        if (hour >= 20 && hour < 24) {
            return "night";
        }

        return "late-night";
    }

    /* =====================================================
       DYNAMIC TIME LABEL
       ===================================================== */

    function getTimeLabel() {
        switch (state.timeContext) {
            case "morning":
                return "Morning";
            case "day":
                return "Day";
            case "evening":
                return "Evening";
            case "night":
                return "Night";
            case "late-night":
                return "Late Night";
            default:
                return "Today";
        }
    }

    /* =====================================================
       THEME ENGINE
       ===================================================== */

    function applyTheme(mode, intensity = 0.5) {
        const normalized = normalizeMode(mode);

        state.mode = normalized;
        state.intensity = clamp(Number(intensity) || 0.5, 0, 1);
        state.timeContext = detectTimeContext();

        const config = MODES[normalized];

        document.body.dataset.coupleMode = normalized;
        document.body.dataset.timeContext = state.timeContext;

        document.documentElement.style.setProperty(
            "--couple-intensity",
            state.intensity.toFixed(2)
        );

        if (moodIcon) {
            moodIcon.textContent = config.icon;
        }

        if (moodName) {
            moodName.textContent = config.label;
        }

        if (aiStatus) {
            aiStatus.textContent =
                `Mood: ${config.label} • ${getTimeLabel()} • AI is understanding your conversation...`;
        }

        updateSuggestions(config.suggestions);

        createModeEffects(config.effect);

        localStorage.setItem(CONFIG.modeKey, normalized);
    }

    /* =====================================================
       BACKGROUND EFFECTS
       ===================================================== */

    function clearEffects() {
        if (effectsLayer) {
            effectsLayer.innerHTML = "";
        }
    }

    function createEffectParticle(char, className, delay = 0) {
        if (!effectsLayer) return;

        const item = document.createElement("span");

        item.className = `couple-effect-item ${className}`;

        item.textContent = char;

        item.style.setProperty(
            "--delay",
            `${delay}s`
        );

        item.style.setProperty(
            "--x",
            `${Math.random() * 100}%`
        );

        item.style.setProperty(
            "--size",
            `${10 + Math.random() * 18}px`
        );

        effectsLayer.appendChild(item);
    }

    function createModeEffects(effect) {
        clearEffects();

        const intensity = state.intensity;

        if (effect === "hearts") {
            const count = Math.round(5 + intensity * 8);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    i % 2 === 0 ? "❤️" : "💕",
                    "effect-heart",
                    Math.random() * 5
                );
            }
        }

        if (effect === "soft-hearts") {
            const count = Math.round(4 + intensity * 6);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    i % 2 === 0 ? "🩷" : "✨",
                    "effect-soft-heart",
                    Math.random() * 6
                );
            }
        }

        if (effect === "stars" || effect === "slow-particles") {
            const count = Math.round(8 + intensity * 10);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    i % 3 === 0 ? "⭐" : "✨",
                    "effect-star",
                    Math.random() * 7
                );
            }
        }

        if (effect === "sparkles") {
            const count = Math.round(7 + intensity * 9);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    "✨",
                    "effect-sparkle",
                    Math.random() * 4
                );
            }
        }

        if (effect === "confetti") {
            const symbols = ["🎉", "🎊", "✨", "🥳", "💖"];

            const count = Math.round(10 + intensity * 12);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    symbols[i % symbols.length],
                    "effect-confetti",
                    Math.random() * 4
                );
            }
        }

        if (effect === "rain") {
            const count = Math.round(8 + intensity * 12);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    "💧",
                    "effect-rain",
                    Math.random() * 3
                );
            }
        }

        if (effect === "dust") {
            const count = Math.round(8 + intensity * 10);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    "•",
                    "effect-dust",
                    Math.random() * 5
                );
            }
        }

        if (effect === "fire-glow") {
            const count = Math.round(5 + intensity * 7);

            for (let i = 0; i < count; i++) {
                createEffectParticle(
                    i % 2 ? "🔥" : "✨",
                    "effect-fire",
                    Math.random() * 4
                );
            }
        }

        if (effect === "game") {
            const symbols = ["🎮", "⚡", "🎯", "✨"];

            for (let i = 0; i < 8; i++) {
                createEffectParticle(
                    symbols[i % symbols.length],
                    "effect-game",
                    Math.random() * 3
                );
            }
        }

        if (effect === "camera") {
            for (let i = 0; i < 7; i++) {
                createEffectParticle(
                    i % 2 ? "✨" : "📸",
                    "effect-camera",
                    Math.random() * 5
                );
            }
        }

        if (effect === "warm-glow" || effect === "breathing") {
            const item = document.createElement("div");

            item.className = `couple-effect-glow ${effect}`;

            effectsLayer.appendChild(item);
        }
    }

    /* =====================================================
       MESSAGE EFFECT
       ===================================================== */

    function messageEffect() {
        const config = MODES[state.mode];

        createModeEffects(config.effect);

        if (navigator.vibrate && state.intensity > 0.75) {
            try {
                navigator.vibrate(15);
            } catch {}
        }
    }

    /* =====================================================
       MESSAGE STORAGE
       ===================================================== */

    function saveMessages() {
        try {
            localStorage.setItem(
                CONFIG.storageKey,
                JSON.stringify(
                    state.messages.slice(-CONFIG.maxMessages)
                )
            );
        } catch {}
    }

    function loadMessages() {
        const saved = safeParse(
            localStorage.getItem(CONFIG.storageKey),
            []
        );

        if (Array.isArray(saved)) {
            state.messages = saved;
        }
    }

    /* =====================================================
       MESSAGE RENDER
       ===================================================== */

    function renderMessages() {
        if (!messagesEl) return;

        messagesEl.innerHTML = "";

        state.messages.forEach(renderMessage);

        scrollToBottom(false);
    }

    function renderMessage(message) {
        if (!messagesEl) return;

        const wrapper = document.createElement("div");

        wrapper.className =
            `couple-message ${message.sender === "me" ? "me" : "partner"}`;

        const bubble = document.createElement("div");

        bubble.className = "couple-message-bubble";

        const text = document.createElement("div");

        text.className = "couple-message-text";

        text.innerHTML = escapeHtml(message.text)
            .replace(/\n/g, "<br>");

        const time = document.createElement("span");

        time.className = "couple-message-time";

        time.textContent = message.time || nowTime();

        bubble.appendChild(text);
        bubble.appendChild(time);

        wrapper.appendChild(bubble);

        messagesEl.appendChild(wrapper);
    }

    function addMessage(text, sender = "me", extra = {}) {
        const message = {
            id:
                `${Date.now()}_${Math.random().toString(36).slice(2)}`,

            text: String(text),

            sender,

            time: nowTime(),

            mode: state.mode,

            intensity: state.intensity,

            timeContext: state.timeContext,

            ...extra
        };

        state.messages.push(message);

        if (state.messages.length > CONFIG.maxMessages) {
            state.messages =
                state.messages.slice(-CONFIG.maxMessages);
        }

        renderMessage(message);

        saveMessages();

        scrollToBottom(true);

        return message;
    }

    /* =====================================================
       SCROLL
       ===================================================== */

    function scrollToBottom(smooth = true) {
        if (!messagesEl) return;

        requestAnimationFrame(() => {
            messagesEl.scrollTo({
                top: messagesEl.scrollHeight,
                behavior: smooth ? "smooth" : "auto"
            });
        });
    }

    /* =====================================================
       TYPING
       ===================================================== */

    function setTyping(show) {
        const typing = $("coupleTyping");

        if (!typing) return;

        typing.hidden = !show;
    }

    /* =====================================================
       PARTNER DATA
       ===================================================== */

    function getPartnerFromURL() {
        const params = new URLSearchParams(
            window.location.search
        );

        const partner = {
            id:
                params.get("partner_id") ||
                params.get("user_id") ||
                params.get("id") ||
                null,

            name:
                params.get("name") ||
                params.get("partner") ||
                "Partner",

            avatar:
                params.get("avatar") ||
                "/static/images/default-profile.png",

            online:
                params.get("online") === "1" ||
                params.get("online") === "true"
        };

        const stored = safeParse(
            localStorage.getItem(CONFIG.partnerKey),
            null
        );

        if (
            stored &&
            typeof stored === "object"
        ) {
            return {
                ...stored,
                ...Object.fromEntries(
                    Object.entries(partner)
                        .filter(([, value]) => value !== null)
                )
            };
        }

        return partner;
    }

    function applyPartner() {
        state.partner = getPartnerFromURL();

        if (partnerNameEl) {
            partnerNameEl.textContent =
                state.partner.name || "Partner";
        }

        if (partnerAvatarEl) {
            partnerAvatarEl.src =
                state.partner.avatar ||
                "/static/images/default-profile.png";

            partnerAvatarEl.onerror = () => {
                partnerAvatarEl.src =
                    "/static/images/default-profile.png";
            };
        }

        if (onlineDot) {
            onlineDot.hidden = !state.partner.online;
        }

        try {
            localStorage.setItem(
                CONFIG.partnerKey,
                JSON.stringify(state.partner)
            );
        } catch {}
    }

    /* =====================================================
       AI ANALYSIS
       ===================================================== */

    async function analyzeMessage(text) {
        try {
            const response = await fetch(
                CONFIG.analyzeEndpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text,

                        mode: state.mode,

                        time_context:
                            state.timeContext,

                        intensity:
                            state.intensity,

                        partner_id:
                            state.partner.id
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Analyze HTTP ${response.status}`
                );
            }

            const data =
                await response.json();

            return data;
        } catch {
            return localAnalyze(text);
        }
    }

    /* =====================================================
       LOCAL AI FALLBACK
       ===================================================== */

    function localAnalyze(text) {
        const value =
            String(text).toLowerCase();

        let mode = state.mode;

        const rules = [
            {
                words: [
                    "miss",
                    "missing",
                    "yaad",
                    "याद",
                    "wish you were",
                    "without you"
                ],
                mode: "missing-you"
            },

            {
                words: [
                    "love",
                    "pyaar",
                    "pyar",
                    "jaan",
                    "love you",
                    "❤️",
                    "💕"
                ],
                mode: "romantic"
            },

            {
                words: [
                    "good night",
                    "gn",
                    "shubh ratri",
                    "सो जाओ"
                ],
                mode: "good-night"
            },

            {
                words: [
                    "good morning",
                    "gm",
                    "suprabhat",
                    "सुबह"
                ],
                mode: "good-morning"
            },

            {
                words: [
                    "sad",
                    "dukhi",
                    "उदास",
                    "cry",
                    "rona",
                    "ro raha"
                ],
                mode: "sad"
            },

            {
                words: [
                    "angry",
                    "gussa",
                    "गुस्सा",
                    "hate",
                    "fight"
                ],
                mode: "angry"
            },

            {
                words: [
                    "sorry",
                    "maaf",
                    "माफ",
                    "apolog"
                ],
                mode: "apology"
            },

            {
                words: [
                    "game",
                    "play",
                    "challenge",
                    "गेम"
                ],
                mode: "game"
            },

            {
                words: [
                    "remember",
                    "yaad hai",
                    "याद है",
                    "memory"
                ],
                mode: "memory"
            },

            {
                words: [
                    "future",
                    "marriage",
                    "shaadi",
                    "शादी",
                    "wedding"
                ],
                mode: "future"
            },

            {
                words: [
                    "happy",
                    "khush",
                    "खुश",
                    "yay",
                    "awesome"
                ],
                mode: "happy"
            },

            {
                words: [
                    "thank",
                    "thanks",
                    "appreciate",
                    "shukriya"
                ],
                mode: "appreciation"
            }
        ];

        for (const rule of rules) {
            if (
                rule.words.some(
                    word => value.includes(word)
                )
            ) {
                mode = rule.mode;
                break;
            }
        }

        let intensity = 0.55;

        const exclamationCount =
            (text.match(/!/g) || []).length;

        const heartCount =
            (text.match(/❤️|💕|💗|💖|🩷/g) || []).length;

        const caps =
            text.length > 5 &&
            text === text.toUpperCase();

        intensity +=
            exclamationCount * 0.05;

        intensity +=
            heartCount * 0.04;

        if (caps) {
            intensity += 0.12;
        }

        intensity =
            clamp(intensity, 0.2, 1);

        return {
            mode,
            secondary_mode:
                mode === "romantic"
                    ? "deep-love"
                    : "calm",

            emotion:
                MODES[mode]?.emotion ||
                "neutral",

            intensity,

            time_context:
                detectTimeContext(),

            animation:
                MODES[mode]?.effect ||
                "soft-particles",

            response_style:
                mode === "sad" ||
                mode === "emotional"
                    ? "supportive"
                    : "warm"
        };
    }

    /* =====================================================
       SEND TO BACKEND
       ===================================================== */

    async function sendToBackend(text, analysis) {
        try {
            const response = await fetch(
                CONFIG.messageEndpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text,

                        partner_id:
                            state.partner.id,

                        mode:
                            analysis.mode,

                        emotion:
                            analysis.emotion,

                        intensity:
                            analysis.intensity,

                        time_context:
                            analysis.time_context
                    })
                }
            );

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch {
            return null;
        }
    }

    /* =====================================================
       SEND MESSAGE
       ===================================================== */

    async function handleSend(text) {
        text = String(text || "").trim();

        if (!text || state.isSending) {
            return;
        }

        state.isSending = true;

        if (input) {
            input.value = "";
        }

        const analysis =
            await analyzeMessage(text);

        if (analysis) {
            applyTheme(
                analysis.mode || state.mode,
                analysis.intensity ??
                    state.intensity
            );
        }

        addMessage(
            text,
            "me",
            {
                analysis
            }
        );

        messageEffect();

        setTyping(true);

        const backendResponse =
            await sendToBackend(
                text,
                analysis || {}
            );

        setTyping(false);

        if (
            backendResponse &&
            backendResponse.response
        ) {
            addMessage(
                backendResponse.response,
                "partner"
            );
        } else {
            /*
             * Backend AI not connected yet.
             * No fake automatic partner response.
             */
        }

        state.isSending = false;
    }

    /* =====================================================
       SUGGESTIONS
       ===================================================== */

    function updateSuggestions(items) {
        if (!suggestionsEl || !suggestionList) {
            return;
        }

        suggestionList.innerHTML = "";

        if (!Array.isArray(items) || !items.length) {
            suggestionsEl.hidden = true;
            return;
        }

        items
            .slice(0, 4)
            .forEach(text => {
                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "couple-suggestion";

                button.textContent = text;

                button.addEventListener(
                    "click",
                    () => {
                        if (input) {
                            input.value = text;
                            input.focus();
                        }
                    }
                );

                suggestionList.appendChild(button);
            });

        suggestionsEl.hidden = false;
    }

    /* =====================================================
       QUICK ACTIONS
       ===================================================== */

    function handleQuickAction(action) {
        const actionMap = {
            love: {
                mode: "romantic",
                text:
                    "I just want to tell you how special you are ❤️"
            },

            memory: {
                mode: "memory",
                text:
                    "Do you remember one of our favorite moments? 📸"
            },

            question: {
                mode: "deep-talk",
                text:
                    "Can I ask you something from my heart? 💭"
            },

            game: {
                mode: "game",
                text:
                    "Let's play a couple game 🎮"
            }
        };

        const selected =
            actionMap[action];

        if (!selected) return;

        applyTheme(
            selected.mode,
            0.72
        );

        if (input) {
            input.value =
                selected.text;

            input.focus();
        }
    }

    /* =====================================================
       MOOD PANEL
       ===================================================== */

    function openMoodPanel() {
        const overlay =
            $("coupleMoodOverlay");

        if (overlay) {
            overlay.classList.remove("hidden");
        }
    }

    function closeMoodPanel() {
        const overlay =
            $("coupleMoodOverlay");

        if (overlay) {
            overlay.classList.add("hidden");
        }
    }

    function selectMood(mode) {
        applyTheme(mode, 0.65);

        closeMoodPanel();

        saveMessages();
    }

    /* =====================================================
       AI PANEL
       ===================================================== */

    function openAiPanel() {
        const overlay =
            $("coupleAiOverlay");

        if (overlay) {
            overlay.classList.remove("hidden");
        }
    }

    function closeAiPanel() {
        const overlay =
            $("coupleAiOverlay");

        if (overlay) {
            overlay.classList.add("hidden");
        }
    }

    function handleAiAction(action) {
        const actions = {
            suggest:
                MODES[state.mode]?.suggestions?.[0],

            love:
                "I want to make this moment a little more romantic ❤️",

            comfort:
                "I'm here with you. You can tell me anything 🫂",

            game:
                "Let's start a couple challenge 🎮"
        };

        const text =
            actions[action];

        if (!text) return;

        if (input) {
            input.value = text;
            input.focus();
        }

        closeAiPanel();
    }

    /* =====================================================
       EMOJI PICKER
       ===================================================== */

    function loadRecentEmojis() {
        const saved =
            safeParse(
                localStorage.getItem(
                    CONFIG.recentEmojiKey
                ),
                []
            );

        EMOJIS.recent =
            Array.isArray(saved)
                ? saved
                : [];
    }

    function saveRecentEmoji(emoji) {
        EMOJIS.recent =
            [
                emoji,
                ...EMOJIS.recent.filter(
                    item => item !== emoji
                )
            ].slice(
                0,
                CONFIG.maxRecentEmoji
            );

        localStorage.setItem(
            CONFIG.recentEmojiKey,
            JSON.stringify(
                EMOJIS.recent
            )
        );
    }

    function createEmojiPicker() {
        if ($("coupleEmojiPicker")) {
            return;
        }

        const picker =
            document.createElement("section");

        picker.id =
            "coupleEmojiPicker";

        picker.className =
            "couple-emoji-picker";

        picker.hidden = true;

        const tabs =
            document.createElement("div");

        tabs.className =
            "couple-emoji-tabs";

        const categories = [
            ["recent", "🕘"],
            ["love", "❤️"],
            ["smile", "😊"],
            ["people", "👍"],
            ["animals", "🐶"],
            ["food", "🍕"],
            ["fun", "🎮"],
            ["travel", "✈️"],
            ["objects", "📱"],
            ["symbols", "✨"]
        ];

        categories.forEach(
            ([category, icon]) => {
                const button =
                    document.createElement("button");

                button.type = "button";

                button.textContent = icon;

                button.dataset.category =
                    category;

                button.addEventListener(
                    "click",
                    () => {
                        state.emojiCategory =
                            category;

                        renderEmojiGrid();
                    }
                );

                tabs.appendChild(button);
            }
        );

        const grid =
            document.createElement("div");

        grid.id =
            "coupleEmojiGrid";

        grid.className =
            "couple-emoji-grid";

        picker.appendChild(tabs);
        picker.appendChild(grid);

        document.body.appendChild(picker);

        renderEmojiGrid();
    }

    function renderEmojiGrid() {
        const grid =
            $("coupleEmojiGrid");

        if (!grid) return;

        const emojis =
            EMOJIS[state.emojiCategory] ||
            [];

        grid.innerHTML = "";

        emojis.forEach(emoji => {
            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent = emoji;

            button.addEventListener(
                "click",
                () => {
                    if (input) {
                        input.value += emoji;
                        input.focus();
                    }

                    saveRecentEmoji(emoji);
                }
            );

            grid.appendChild(button);
        });
    }

    function toggleEmojiPicker() {
        const picker =
            $("coupleEmojiPicker");

        if (!picker) return;

        picker.hidden =
            !picker.hidden;
    }

    /* =====================================================
       FILE / CAMERA
       ===================================================== */

    function handleFiles(files) {
        if (!files || !files.length) {
            return;
        }

        [...files].forEach(file => {
            if (!file.type.startsWith("image/")) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload = () => {
                addMessage(
                    `📸 ${file.name}`,
                    "me",
                    {
                        type: "image",
                        image: reader.result
                    }
                );

                applyTheme(
                    "photo-memory",
                    0.65
                );
            };

            reader.readAsDataURL(file);
        });
    }

    /* =====================================================
       EXPORT CHAT
       ===================================================== */

    function exportChat() {
        const lines =
            state.messages.map(
                message =>
                    `[${message.time}] ${
                        message.sender === "me"
                            ? "You"
                            : state.partner.name
                    }: ${message.text}`
            );

        const blob =
            new Blob(
                [lines.join("\n")],
                {
                    type: "text/plain"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "usanex-couple-chat.txt";

        link.click();

        URL.revokeObjectURL(url);
    }

    /* =====================================================
       CLEAR CHAT
       ===================================================== */

    function clearChat() {
        const confirmed =
            window.confirm(
                "Clear this Couple Chat?"
            );

        if (!confirmed) {
            return;
        }

        state.messages = [];

        saveMessages();

        renderMessages();

        addMessage(
            "Your Couple Space is ready again ❤️",
            "partner"
        );
    }

    /* =====================================================
       DEMO WELCOME
       ===================================================== */

    function createWelcomeMessages() {
        if (state.messages.length) {
            return;
        }

        state.messages = [
            {
                id: "welcome_1",
                text: "Hey ❤️",
                sender: "partner",
                time: nowTime()
            },

            {
                id: "welcome_2",
                text:
                    "Welcome to your Couple Space, love 🥰",
                sender: "partner",
                time: nowTime()
            },

            {
                id: "welcome_3",
                text:
                    "Yahan tum dono ki conversations ke mood ke according experience change hoga ✨",
                sender: "partner",
                time: nowTime()
            }
        ];

        saveMessages();
    }

    /* =====================================================
       EVENTS
       ===================================================== */

    function bindEvents() {

        /* Back */

        $("coupleBackButton")
            ?.addEventListener(
                "click",
                () => {
                    if (
                        window.history.length > 1
                    ) {
                        window.history.back();
                    } else {
                        window.location.href =
                            "/chat";
                    }
                }
            );

        /* Mood buttons */

        $("coupleMoodButton")
            ?.addEventListener(
                "click",
                openMoodPanel
            );

        $("coupleMoodChangeButton")
            ?.addEventListener(
                "click",
                openMoodPanel
            );

        $("closeMoodPanel")
            ?.addEventListener(
                "click",
                closeMoodPanel
            );

        document
            .querySelectorAll(
                "#coupleMoodGrid button"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        selectMood(
                            button.dataset.mode
                        );
                    }
                );
            });

        /* AI */

        $("coupleAiButton")
            ?.addEventListener(
                "click",
                openAiPanel
            );

        $("closeAiPanel")
            ?.addEventListener(
                "click",
                closeAiPanel
            );

        document
            .querySelectorAll(
                "[data-ai-action]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        handleAiAction(
                            button.dataset.aiAction
                        );
                    }
                );
            });

        /* Quick actions */

        document
            .querySelectorAll(
                ".couple-action"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        handleQuickAction(
                            button.dataset.action
                        );
                    }
                );
            });

        /* Composer */

        composer?.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                handleSend(
                    input?.value || ""
                );
            }
        );

        /* Emoji */

        $("coupleEmojiButton")
            ?.addEventListener(
                "click",
                toggleEmojiPicker
            );

        /* Attach */

        $("coupleAttachButton")
            ?.addEventListener(
                "click",
                () => {
                    $("coupleFileInput")
                        ?.click();
                }
            );

        $("coupleCameraButton")
            ?.addEventListener(
                "click",
                () => {
                    const fileInput =
                        $("coupleFileInput");

                    if (!fileInput) return;

                    fileInput.accept =
                        "image/*";

                    fileInput.setAttribute(
                        "capture",
                        "environment"
                    );

                    fileInput.click();
                }
            );

        $("coupleFileInput")
            ?.addEventListener(
                "change",
                event => {
                    handleFiles(
                        event.target.files
                    );

                    event.target.value = "";
                }
            );

        /* Outside emoji picker */

        document.addEventListener(
            "click",
            event => {
                const picker =
                    $("coupleEmojiPicker");

                if (!picker) return;

                if (
                    picker.hidden
                ) {
                    return;
                }

                const emojiButton =
                    $("coupleEmojiButton");

                if (
                    picker.contains(
                        event.target
                    ) ||
                    emojiButton?.contains(
                        event.target
                    )
                ) {
                    return;
                }

                picker.hidden = true;
            }
        );

        /* Keyboard */

        input?.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();

                    handleSend(
                        input.value
                    );
                }
            }
        );

        /* Menu */

        $("coupleMenuButton")
            ?.addEventListener(
                "click",
                () => {
                    const choice =
                        window.prompt(
                            "Type: export or clear"
                        );

                    if (
                        choice?.toLowerCase() ===
                        "export"
                    ) {
                        exportChat();
                    }

                    if (
                        choice?.toLowerCase() ===
                        "clear"
                    ) {
                        clearChat();
                    }
                }
            );

        /* Avatar */

        $("coupleAvatarButton")
            ?.addEventListener(
                "click",
                () => {
                    if (state.partner.id) {
                        window.location.href =
                            `/profile?user_id=${encodeURIComponent(
                                state.partner.id
                            )}`;
                    }
                }
            );
    }

    /* =====================================================
       AUTO REFRESH TIME THEME
       ===================================================== */

    function startTimeWatcher() {
        setInterval(() => {
            const current =
                detectTimeContext();

            if (
                current !==
                state.timeContext
            ) {
                state.timeContext =
                    current;

                applyTheme(
                    state.mode,
                    state.intensity
                );
            }
        }, 60000);
    }

    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {
        loadRecentEmojis();

        createEmojiPicker();

        applyPartner();

        loadMessages();

        createWelcomeMessages();

        renderMessages();

        const savedMode =
            localStorage.getItem(
                CONFIG.modeKey
            );

        applyTheme(
            normalizeMode(
                savedMode || "calm"
            ),
            0.55
        );

        bindEvents();

        startTimeWatcher();

        /*
         * Re-check time when page becomes visible.
         */

        document.addEventListener(
            "visibilitychange",
            () => {
                if (
                    !document.hidden
                ) {
                    applyTheme(
                        state.mode,
                        state.intensity
                    );
                }
            }
        );
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.UsanexCoupleChat = {
        state,

        modes: MODES,

        applyTheme,

        addMessage,

        handleSend,

        clearChat,

        exportChat,

        openMoodPanel,

        openAiPanel
    };

    window.UsanexCoupleModes =
        MODES;

    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }

})();
