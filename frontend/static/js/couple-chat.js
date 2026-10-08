/* =========================================================
   USANEX - COUPLE CHAT
   Full Frontend Controller
   Version: 2.0
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {
        storageKey: "usanex_couple_chat_v2",
        recentEmojiKey: "usanex_recent_emojis",
        maxMessages: 300,
        maxRecentEmoji: 20,
        apiAnalyze: "/api/couple-chat/analyze",
        apiMessage: "/api/couple-chat/message",
        defaultMode: "calm"
    };

    /* =====================================================
       DOM HELPER
    ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    /* =====================================================
       26 COUPLE MODES
    ===================================================== */

    const COUPLE_MODES = {

        romantic: {
            name: "Romantic",
            emoji: "❤️",
            emotion: "love",
            intensity: 0.82,
            effect: "hearts",
            suggestions: [
                "I just want to be close to you ❤️",
                "You make my heart smile.",
                "I feel lucky to have you.",
                "I wish you were here right now."
            ]
        },

        "deep-love": {
            name: "Deep Love",
            emoji: "🥰",
            emotion: "deep-love",
            intensity: 0.92,
            effect: "glow",
            suggestions: [
                "You mean more to me than words can explain.",
                "I want us to grow together.",
                "I choose you every single day.",
                "You're a beautiful part of my life."
            ]
        },

        happy: {
            name: "Happy",
            emoji: "😊",
            emotion: "joy",
            intensity: 0.70,
            effect: "sparkles",
            suggestions: [
                "Today feels so good! 😍",
                "I'm smiling because of you.",
                "Let's make today special!",
                "You always make things better."
            ]
        },

        funny: {
            name: "Funny",
            emoji: "😂",
            emotion: "fun",
            intensity: 0.76,
            effect: "laugh",
            suggestions: [
                "Okay, now make me laugh 😂",
                "I have a very important question...",
                "You are officially too funny.",
                "Challenge accepted 😎"
            ]
        },

        sad: {
            name: "Sad",
            emoji: "😢",
            emotion: "sadness",
            intensity: 0.70,
            effect: "rain",
            suggestions: [
                "I'm feeling a little low today.",
                "Can you stay with me for a while?",
                "I don't really know what I'm feeling.",
                "I just need you right now."
            ]
        },

        emotional: {
            name: "Emotional",
            emoji: "😭",
            emotion: "emotional",
            intensity: 0.90,
            effect: "soft-glow",
            suggestions: [
                "That really touched my heart.",
                "I don't know what to say right now.",
                "You mean so much to me.",
                "I feel everything so deeply."
            ]
        },

        angry: {
            name: "Angry",
            emoji: "😠",
            emotion: "anger",
            intensity: 0.85,
            effect: "pulse",
            suggestions: [
                "I'm upset right now.",
                "I need a little time.",
                "Let's talk when we're both calm.",
                "I don't want us to hurt each other."
            ]
        },

        frustrated: {
            name: "Frustrated",
            emoji: "😤",
            emotion: "frustration",
            intensity: 0.78,
            effect: "shake",
            suggestions: [
                "Everything feels overwhelming.",
                "I just need you to understand me.",
                "Can we talk about this?",
                "I don't want to argue."
            ]
        },

        caring: {
            name: "Caring",
            emoji: "🤗",
            emotion: "care",
            intensity: 0.80,
            effect: "warm",
            suggestions: [
                "Did you eat something?",
                "Please take care of yourself.",
                "I'm here if you need me.",
                "Don't forget to rest."
            ]
        },

        comfort: {
            name: "Comfort",
            emoji: "🫂",
            emotion: "comfort",
            intensity: 0.88,
            effect: "soft-glow",
            suggestions: [
                "Come here, I'm with you.",
                "You don't have to handle everything alone.",
                "It's okay. I'm here.",
                "Take your time."
            ]
        },

        flirty: {
            name: "Flirty",
            emoji: "😘",
            emotion: "flirty",
            intensity: 0.84,
            effect: "sparkles",
            suggestions: [
                "Why are you looking this cute today? 😘",
                "Someone is definitely distracting me.",
                "Guess who I'm thinking about?",
                "You're making it hard to behave 😏"
            ]
        },

        passionate: {
            name: "Passionate",
            emoji: "🔥",
            emotion: "passion",
            intensity: 0.94,
            effect: "fire",
            suggestions: [
                "You have no idea what you do to my heart.",
                "Our connection feels intense.",
                "I can't stop thinking about you.",
                "There's something special between us."
            ]
        },

        "good-night": {
            name: "Good Night",
            emoji: "🌙",
            emotion: "peace",
            intensity: 0.65,
            effect: "stars",
            suggestions: [
                "Good night, sleep peacefully 🌙",
                "Sweet dreams ❤️",
                "I'll be thinking about you.",
                "See you in my dreams."
            ]
        },

        "good-morning": {
            name: "Good Morning",
            emoji: "☀️",
            emotion: "fresh",
            intensity: 0.68,
            effect: "sunrise",
            suggestions: [
                "Good morning ❤️",
                "Did you sleep well?",
                "Hope your day starts beautifully.",
                "Sending you a morning hug 🤗"
            ]
        },

        memory: {
            name: "Memory",
            emoji: "💭",
            emotion: "nostalgia",
            intensity: 0.76,
            effect: "memory",
            suggestions: [
                "Remember when we first talked?",
                "What's your favorite memory of us?",
                "I was just thinking about that day.",
                "That memory still makes me smile."
            ]
        },

        celebration: {
            name: "Celebration",
            emoji: "🥳",
            emotion: "celebration",
            intensity: 0.88,
            effect: "confetti",
            suggestions: [
                "We should celebrate this! 🎉",
                "I'm so happy for us!",
                "This deserves a special moment.",
                "Let's make a memory today."
            ]
        },

        birthday: {
            name: "Birthday",
            emoji: "🎂",
            emotion: "celebration",
            intensity: 0.90,
            effect: "confetti",
            suggestions: [
                "Happy birthday, my favorite person! 🎂",
                "Today is all about you.",
                "I hope your wish comes true.",
                "Let's make this birthday unforgettable."
            ]
        },

        future: {
            name: "Future",
            emoji: "💍",
            emotion: "hope",
            intensity: 0.86,
            effect: "stars",
            suggestions: [
                "Where do you see us in five years?",
                "I want to build beautiful memories with you.",
                "Let's talk about our future.",
                "What dream should we achieve together?"
            ]
        },

        "missing-you": {
            name: "Missing You",
            emoji: "🫶",
            emotion: "longing",
            intensity: 0.89,
            effect: "hearts",
            suggestions: [
                "I really miss you.",
                "Wish you were here.",
                "Everything reminds me of you.",
                "When can I see you?"
            ]
        },

        apology: {
            name: "Apology",
            emoji: "😔",
            emotion: "regret",
            intensity: 0.82,
            effect: "soft-glow",
            suggestions: [
                "I'm sorry.",
                "I didn't mean to hurt you.",
                "Can we talk about it?",
                "I want to make things right."
            ]
        },

        appreciation: {
            name: "Appreciation",
            emoji: "💕",
            emotion: "gratitude",
            intensity: 0.84,
            effect: "hearts",
            suggestions: [
                "Thank you for always being there.",
                "I really appreciate you.",
                "You make my life better.",
                "I'm grateful for you."
            ]
        },

        game: {
            name: "Game",
            emoji: "🎮",
            emotion: "playful",
            intensity: 0.80,
            effect: "sparkles",
            suggestions: [
                "Truth or dare? 😏",
                "Let's play a couple quiz.",
                "Guess what I'm thinking.",
                "Would you rather?"
            ]
        },

        "photo-memory": {
            name: "Photo Memory",
            emoji: "📸",
            emotion: "nostalgia",
            intensity: 0.75,
            effect: "memory",
            suggestions: [
                "Look at this memory ❤️",
                "This photo is one of my favorites.",
                "We need more moments like this.",
                "Remember this day?"
            ]
        },

        serious: {
            name: "Serious Talk",
            emoji: "🤔",
            emotion: "serious",
            intensity: 0.72,
            effect: "calm",
            suggestions: [
                "Can we talk about something important?",
                "I want us to understand each other.",
                "Let's be honest with each other.",
                "I want to hear your side."
            ]
        },

        "deep-talk": {
            name: "Deep Talk",
            emoji: "🧠",
            emotion: "thoughtful",
            intensity: 0.84,
            effect: "stars",
            suggestions: [
                "What is something you never tell anyone?",
                "What does love mean to you?",
                "What is your biggest dream?",
                "What makes you feel truly understood?"
            ]
        },

        calm: {
            name: "Calm",
            emoji: "😌",
            emotion: "peace",
            intensity: 0.48,
            effect: "calm",
            suggestions: [
                "Tell me about your day.",
                "Let's just talk.",
                "I'm happy you're here.",
                "Take a deep breath and relax."
            ]
        }
    };

    /* =====================================================
       EMOJI DATABASE
       100+ EMOJIS
    ===================================================== */

    const EMOJI_CATEGORIES = {

        recent: [],

        love: [
            "❤️", "🩷", "🧡", "💛", "💚", "💙", "🩵",
            "💜", "🤎", "🖤", "🩶", "🤍", "💔", "❤️‍🔥",
            "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘",
            "💝", "💟", "❣️", "💌", "💋", "🥰", "😍",
            "😘", "😚", "😙", "😻", "🫶", "💑", "💏"
        ],

        smile: [
            "😀", "😃", "😄", "😁", "😆", "😅", "😂",
            "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌",
            "😍", "🥰", "😘", "😗", "😙", "😚", "😋",
            "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓",
            "😎", "🥳", "🤩", "😏", "😒", "🙄", "😬",
            "🤭", "🤫", "🤔", "🫢", "🫣", "😴", "🥱"
        ],

        people: [
            "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌",
            "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
            "👈", "👉", "👆", "👇", "☝️", "👍", "👎",
            "✊", "👊", "🤝", "👏", "🙌", "👐", "🤲",
            "🙏", "💪", "🫂", "👀", "👁️", "🧠",
            "💋", "💅", "🫵", "🫶"
        ],

        animals: [
            "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻",
            "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸",
            "🐵", "🙈", "🙉", "🙊", "🐔", "🐧", "🐦",
            "🐤", "🦋", "🐝", "🐞", "🐢", "🐍", "🐙",
            "🦄", "🐠", "🐟", "🐬", "🐳", "🦈"
        ],

        food: [
            "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓",
            "🫐", "🍒", "🍑", "🥭", "🍍", "🥝", "🍅",
            "🥑", "🍕", "🍔", "🍟", "🌭", "🌮", "🌯",
            "🍿", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫",
            "🍭", "🍬", "☕", "🍵", "🧋", "🥤"
        ],

        activities: [
            "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎮",
            "🎯", "🎲", "🎳", "🎸", "🎹", "🎤", "🎧",
            "🎬", "🎨", "🎭", "🏆", "🥇", "🎉", "🎊",
            "🎈", "🎁", "🎂", "🔥", "✨", "🌟", "⭐"
        ],

        travel: [
            "🚗", "🚕", "🚌", "🏎️", "✈️", "🚀", "🚲",
            "🏍️", "🚢", "⛵", "🏖️", "🏝️", "🏔️", "🌋",
            "🗺️", "🌍", "🌎", "🌏", "🌅", "🌄", "🌃",
            "🌌", "🏕️", "🏠", "🏡", "🏙️"
        ],

        objects: [
            "📱", "💻", "⌚", "📷", "📸", "🎥", "📺",
            "🎧", "🎵", "🎶", "💡", "📚", "✏️", "📝",
            "💰", "💎", "🔑", "🔒", "🔓", "📌", "📍",
            "🎀", "🎁", "🛍️", "💍", "🕯️", "☀️", "🌙"
        ],

        symbols: [
            "❤️", "💯", "❗", "❓", "‼️", "⁉️", "✅",
            "❌", "⭕", "💥", "💫", "✨", "⭐", "🌟",
            "🔥", "💦", "💤", "💬", "🗨️", "🔔",
            "🔕", "✔️", "➕", "➖", "♾️", "©️", "™️"
        ]
    };

    /* =====================================================
       APP STATE
    ===================================================== */

    const state = {
        mode: CONFIG.defaultMode,
        emotion: "peace",
        intensity: 0.48,
        messages: [],
        partner: {
            id: null,
            name: "Partner",
            avatar: "/static/images/default-profile.png",
            online: false
        },
        connectedToAI: false,
        isTyping: false
    };

    /* =====================================================
       DOM REFERENCES
    ===================================================== */

    const dom = {
        app: $("#coupleApp"),
        body: document.body,

        back: $("#coupleBackButton"),

        avatarButton: $("#coupleAvatarButton"),
        partnerAvatar: $("#couplePartnerAvatar"),
        partnerName: $("#couplePartnerName"),
        partnerStatus: $("#couplePartnerStatus"),
        onlineDot: $("#coupleOnlineDot"),

        moodButton: $("#coupleMoodButton"),
        menuButton: $("#coupleMenuButton"),

        moodBar: $("#coupleMoodBar"),
        moodIcon: $("#coupleMoodIcon"),
        moodName: $("#coupleMoodName"),
        moodChange: $("#coupleMoodChangeButton"),

        aiPanel: $("#coupleAiPanel"),
        aiStatus: $("#coupleAiStatus"),
        aiButton: $("#coupleAiButton"),

        togetherDays: $("#coupleTogetherDays"),
        connectionStatus: $("#coupleConnectionStatus"),

        quickActions: $("#coupleQuickActions"),

        conversation: $("#coupleConversation"),
        background: $("#coupleBackgroundLayer"),
        effects: $("#coupleEffectsLayer"),

        dayLabel: $("#coupleDayLabel"),
        messages: $("#coupleMessages"),

        suggestions: $("#coupleSuggestions"),
        suggestionList: $("#coupleSuggestionList"),

        moodOverlay: $("#coupleMoodOverlay"),
        moodGrid: $("#coupleMoodGrid"),
        closeMood: $("#closeMoodPanel"),

        aiOverlay: $("#coupleAiOverlay"),
        closeAI: $("#closeAiPanel"),

        composerArea: $(".couple-composer-area"),
        typing: $("#coupleTyping"),

        composer: $("#coupleComposer"),
        input: $("#coupleMessageInput"),
        emojiButton: $("#coupleEmojiButton"),
        attachButton: $("#coupleAttachButton"),
        cameraButton: $("#coupleCameraButton"),
        sendButton: $("#coupleSendButton"),

        fileInput: $("#coupleFileInput")
    };

    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        if (!dom.app) {
            console.warn("Usanex Couple Chat: app not found.");
            return;
        }

        loadPartnerFromURL();

        loadSavedChat();

        setupEvents();

        renderMood();

        renderMessages();

        renderSuggestions();

        updatePartnerUI();

        updateTogetherData();

        createEmojiPicker();

        applyMode(state.mode, false);

        if (!state.messages.length) {
            createWelcomeConversation();
        }

        dom.input?.focus();
    }

    /* =====================================================
       URL PARTNER DATA
    ===================================================== */

    function loadPartnerFromURL() {

        const params = new URLSearchParams(window.location.search);

        state.partner.id =
            params.get("partner_id") ||
            params.get("user_id") ||
            params.get("id") ||
            null;

        state.partner.name =
            params.get("name") ||
            params.get("partner") ||
            "Partner";

        state.partner.avatar =
            params.get("avatar") ||
            "/static/images/default-profile.png";

        state.partner.online =
            params.get("online") === "true";

        /*
         * Decode URL encoded names.
         */

        try {
            state.partner.name = decodeURIComponent(state.partner.name);
        } catch (_) {}

        try {
            state.partner.avatar = decodeURIComponent(state.partner.avatar);
        } catch (_) {}
    }

    /* =====================================================
       UI EVENTS
    ===================================================== */

    function setupEvents() {

        dom.back?.addEventListener("click", () => {
            if (history.length > 1) {
                history.back();
            } else {
                window.location.href = "/chat";
            }
        });

        dom.avatarButton?.addEventListener("click", () => {

            if (state.partner.id) {
                window.location.href =
                    `/profile?user_id=${encodeURIComponent(state.partner.id)}`;
            }
        });

        dom.moodButton?.addEventListener("click", openMoodPanel);

        dom.moodChange?.addEventListener("click", openMoodPanel);

        dom.closeMood?.addEventListener("click", closeMoodPanel);

        dom.aiButton?.addEventListener("click", openAIPanel);

        dom.closeAI?.addEventListener("click", closeAIPanel);

        dom.moodOverlay?.addEventListener("click", event => {
            if (event.target === dom.moodOverlay) {
                closeMoodPanel();
            }
        });

        dom.aiOverlay?.addEventListener("click", event => {
            if (event.target === dom.aiOverlay) {
                closeAIPanel();
            }
        });

        dom.moodGrid?.addEventListener("click", event => {

            const button =
                event.target.closest("[data-mode]");

            if (!button) return;

            const mode = button.dataset.mode;

            if (COUPLE_MODES[mode]) {
                applyMode(mode);
            }

            closeMoodPanel();
        });

        dom.composer?.addEventListener("submit", event => {
            event.preventDefault();
            sendCurrentMessage();
        });

        dom.input?.addEventListener("input", updateSendButton);

        dom.input?.addEventListener("keydown", event => {

            if (event.key === "Enter" && !event.shiftKey) {

                event.preventDefault();

                sendCurrentMessage();
            }
        });

        dom.emojiButton?.addEventListener("click", toggleEmojiPicker);

        dom.attachButton?.addEventListener("click", () => {

            if (dom.fileInput) {
                dom.fileInput.removeAttribute("capture");
                dom.fileInput.click();
            }
        });

        dom.cameraButton?.addEventListener("click", () => {

            if (dom.fileInput) {
                dom.fileInput.setAttribute("accept", "image/*");
                dom.fileInput.setAttribute("capture", "environment");
                dom.fileInput.click();
            }
        });

        dom.fileInput?.addEventListener("change", handleFiles);

        dom.quickActions?.addEventListener("click", event => {

            const button =
                event.target.closest("[data-action]");

            if (!button) return;

            handleQuickAction(button.dataset.action);
        });

        dom.menuButton?.addEventListener("click", openMenu);

        document.addEventListener("keydown", event => {

            if (event.key === "Escape") {
                closeMoodPanel();
                closeAIPanel();
                closeEmojiPicker();
            }
        });
    }

    /* =====================================================
       PARTNER UI
    ===================================================== */

    function updatePartnerUI() {

        if (dom.partnerName) {
            dom.partnerName.textContent = state.partner.name;
        }

        if (dom.partnerAvatar) {
            dom.partnerAvatar.src = state.partner.avatar;
        }

        if (state.partner.online) {

            dom.onlineDot?.removeAttribute("hidden");

            if (dom.partnerStatus) {
                dom.partnerStatus.textContent = "Online";
            }

        } else {

            dom.onlineDot?.setAttribute("hidden", "");

            if (dom.partnerStatus) {
                dom.partnerStatus.textContent =
                    "Your Couple Space";
            }
        }
    }

    /* =====================================================
       MOOD
    ===================================================== */

    function renderMood() {

        const mode =
            COUPLE_MODES[state.mode] ||
            COUPLE_MODES.calm;

        if (dom.moodIcon) {
            dom.moodIcon.textContent = mode.emoji;
        }

        if (dom.moodName) {
            dom.moodName.textContent = mode.name;
        }

        if (dom.moodButton) {
            dom.moodButton.textContent = mode.emoji;
        }
    }

    /* =====================================================
       APPLY MODE
    ===================================================== */

    function applyMode(mode, animate = true) {

        if (!COUPLE_MODES[mode]) {
            mode = CONFIG.defaultMode;
        }

        const modeData = COUPLE_MODES[mode];

        state.mode = mode;
        state.emotion = modeData.emotion;
        state.intensity = modeData.intensity;

        dom.body.dataset.coupleMode = mode;

        renderMood();

        renderSuggestions();

        updateAIStatus(modeData);

        if (animate) {
            triggerEffect(modeData.effect);
        }

        saveChat();
    }

    /* =====================================================
       AI STATUS
    ===================================================== */

    function updateAIStatus(modeData) {

        if (!dom.aiStatus) return;

        dom.aiStatus.textContent =
            `Mood: ${modeData.name} • AI is understanding your conversation`;
    }

    /* =====================================================
       SUGGESTIONS
    ===================================================== */

    function renderSuggestions() {

        if (!dom.suggestionList) return;

        const mode =
            COUPLE_MODES[state.mode] ||
            COUPLE_MODES.calm;

        dom.suggestionList.innerHTML = "";

        mode.suggestions.forEach(text => {

            const button = document.createElement("button");

            button.type = "button";
            button.className = "couple-suggestion";
            button.textContent = text;

            button.addEventListener("click", () => {

                dom.input.value = text;

                updateSendButton();

                dom.input.focus();

                closeSuggestions();
            });

            dom.suggestionList.appendChild(button);
        });

        if (dom.suggestions) {
            dom.suggestions.hidden = false;
        }
    }

    function closeSuggestions() {

        if (dom.suggestions) {
            dom.suggestions.hidden = true;
        }
    }

    /* =====================================================
       MESSAGE CREATION
    ===================================================== */

    function createMessage({
        text,
        from = "me",
        type = "text",
        time = Date.now(),
        file = null
    }) {

        return {
            id:
                `${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 9)}`,

            text,
            from,
            type,
            time,
            file
        };
    }

    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    async function sendCurrentMessage() {

        if (!dom.input) return;

        const text = dom.input.value.trim();

        if (!text) return;

        const message = createMessage({
            text,
            from: "me"
        });

        state.messages.push(message);

        trimMessages();

        dom.input.value = "";

        updateSendButton();

        renderMessages();

        saveChat();

        analyzeMessage(text);

        triggerEffectForMessage(text);

        /*
         * Backend AI is intentionally optional.
         */

        await sendMessageToBackend(message);
    }

    /* =====================================================
       MESSAGE BACKEND
    ===================================================== */

    async function sendMessageToBackend(message) {

        try {

            const response = await fetch(CONFIG.apiMessage, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    partner_id: state.partner.id,
                    message: message.text,
                    mode: state.mode
                })
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (data?.mode && COUPLE_MODES[data.mode]) {

                applyMode(data.mode);

            }

            if (data?.response) {

                simulatePartnerResponse(
                    data.response,
                    500
                );
            }

        } catch (error) {

            /*
             * Backend not connected yet.
             * Local UI continues working.
             */

            console.debug(
                "Couple AI backend unavailable:",
                error
            );
        }
    }

    /* =====================================================
       MESSAGE ANALYSIS
    ===================================================== */

    async function analyzeMessage(text) {

        const localMode =
            detectModeFromText(text);

        if (localMode) {
            applyMode(localMode);
        }

        /*
         * Future AI endpoint.
         */

        try {

            const response = await fetch(
                CONFIG.apiAnalyze,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        message: text,
                        current_mode: state.mode
                    })
                }
            );

            if (!response.ok) return;

            const data = await response.json();

            if (
                data &&
                data.mode &&
                COUPLE_MODES[data.mode]
            ) {
                applyMode(data.mode);
            }

        } catch (_) {
            /*
             * Safe fallback.
             */
        }
    }

    /* =====================================================
       LOCAL MODE DETECTOR
    ===================================================== */

    function detectModeFromText(text) {

        const value = text.toLowerCase();

        const rules = [

            {
                mode: "good-night",
                words: [
                    "good night",
                    "gn",
                    "sleep",
                    "sweet dreams"
                ]
            },

            {
                mode: "good-morning",
                words: [
                    "good morning",
                    "gm",
                    "morning"
                ]
            },

            {
                mode: "missing-you",
                words: [
                    "miss you",
                    "missing you",
                    "yaad aa",
                    "yaad aati",
                    "miss u"
                ]
            },

            {
                mode: "apology",
                words: [
                    "sorry",
                    "maaf",
                    "forgive",
                    "galti"
                ]
            },

            {
                mode: "angry",
                words: [
                    "angry",
                    "gussa",
                    "hate",
                    "irritated"
                ]
            },

            {
                mode: "sad",
                words: [
                    "sad",
                    "dukhi",
                    "cry",
                    "rona",
                    "alone"
                ]
            },

            {
                mode: "happy",
                words: [
                    "happy",
                    "khush",
                    "awesome",
                    "great",
                    "amazing"
                ]
            },

            {
                mode: "funny",
                words: [
                    "lol",
                    "haha",
                    "funny",
                    "joke",
                    "😂"
                ]
            },

            {
                mode: "romantic",
                words: [
                    "love",
                    "pyaar",
                    "pyar",
                    "jaan",
                    "baby",
                    "meri jaan"
                ]
            },

            {
                mode: "flirty",
                words: [
                    "kiss",
                    "cute",
                    "hot",
                    "handsome",
                    "beautiful"
                ]
            },

            {
                mode: "caring",
                words: [
                    "take care",
                    "khana",
                    "eat",
                    "rest",
                    "health"
                ]
            },

            {
                mode: "future",
                words: [
                    "future",
                    "marriage",
                    "shaadi",
                    "wedding",
                    "together forever"
                ]
            },

            {
                mode: "memory",
                words: [
                    "remember",
                    "memory",
                    "yaad",
                    "first time",
                    "old days"
                ]
            },

            {
                mode: "game",
                words: [
                    "game",
                    "truth",
                    "dare",
                    "challenge",
                    "quiz"
                ]
            },

            {
                mode: "deep-talk",
                words: [
                    "deep",
                    "dream",
                    "meaning",
                    "life",
                    "fear",
                    "secret"
                ]
            }
        ];

        for (const rule of rules) {

            if (
                rule.words.some(word =>
                    value.includes(word)
                )
            ) {
                return rule.mode;
            }
        }

        return null;
    }

    /* =====================================================
       SIMULATE PARTNER
    ===================================================== */

    function simulatePartnerResponse(
        text,
        delay = 1000
    ) {

        showTyping();

        setTimeout(() => {

            hideTyping();

            const message = createMessage({
                text,
                from: "partner"
            });

            state.messages.push(message);

            trimMessages();

            renderMessages();

            saveChat();

        }, delay);
    }

    /* =====================================================
       DEMO / WELCOME CONVERSATION
    ===================================================== */

    function createWelcomeConversation() {

        const welcomeMessages = [

            {
                text: "Hey ❤️",
                from: "partner",
                delay: 400
            },

            {
                text: `Welcome to your Couple Space, ${state.partner.name === "Partner" ? "love" : state.partner.name} 🥰`,
                from: "partner",
                delay: 900
            },

            {
                text: "Yahan tum dono ki conversations ke mood ke according experience change hoga ✨",
                from: "partner",
                delay: 1400
            }
        ];

        let totalDelay = 0;

        welcomeMessages.forEach(item => {

            totalDelay += item.delay;

            setTimeout(() => {

                const message = createMessage({
                    text: item.text,
                    from: item.from
                });

                state.messages.push(message);

                trimMessages();

                renderMessages();

                saveChat();

            }, totalDelay);
        });
    }

    /* =====================================================
       RENDER MESSAGES
    ===================================================== */

    function renderMessages() {

        if (!dom.messages) return;

        dom.messages.innerHTML = "";

        if (!state.messages.length) {

            renderEmptyConversation();

            return;
        }

        let previousDate = null;

        state.messages.forEach(message => {

            const dateKey =
                new Date(message.time)
                    .toDateString();

            if (dateKey !== previousDate) {

                const dateLabel =
                    document.createElement("div");

                dateLabel.className =
                    "couple-date-separator";

                dateLabel.textContent =
                    formatDateLabel(
                        message.time
                    );

                dom.messages.appendChild(
                    dateLabel
                );

                previousDate = dateKey;
            }

            const bubble =
                createMessageBubble(message);

            dom.messages.appendChild(bubble);
        });

        scrollToBottom();
    }

    /* =====================================================
       MESSAGE BUBBLE
    ===================================================== */

    function createMessageBubble(message) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            `couple-message-row ${message.from}`;

        const bubble =
            document.createElement("div");

        bubble.className =
            `couple-message-bubble ${message.type}`;

        if (message.type === "file" && message.file) {

            const image =
                document.createElement("img");

            image.src = message.file;

            image.alt = "Shared photo";

            image.className =
                "couple-message-image";

            bubble.appendChild(image);

        } else {

            const text =
                document.createElement("div");

            text.className =
                "couple-message-text";

            text.textContent =
                message.text || "";

            bubble.appendChild(text);
        }

        const footer =
            document.createElement("div");

        footer.className =
            "couple-message-meta";

        const time =
            document.createElement("span");

        time.textContent =
            formatTime(message.time);

        footer.appendChild(time);

        if (message.from === "me") {

            const status =
                document.createElement("span");

            status.className =
                "couple-message-status";

            status.textContent = "✓✓";

            footer.appendChild(status);
        }

        bubble.appendChild(footer);

        wrapper.appendChild(bubble);

        return wrapper;
    }

    /* =====================================================
       EMPTY CHAT
    ===================================================== */

    function renderEmptyConversation() {

        const empty =
            document.createElement("div");

        empty.className =
            "couple-empty-state";

        empty.innerHTML = `
            <div class="couple-empty-icon">❤️</div>
            <strong>Your Couple Space</strong>
            <span>Start a beautiful conversation together.</span>
        `;

        dom.messages.appendChild(empty);
    }

    /* =====================================================
       DATE / TIME
    ===================================================== */

    function formatTime(timestamp) {

        return new Intl.DateTimeFormat(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(timestamp);
    }

    function formatDateLabel(timestamp) {

        const date = new Date(timestamp);

        const today =
            new Date();

        const yesterday =
            new Date();

        yesterday.setDate(
            yesterday.getDate() - 1
        );

        if (
            date.toDateString() ===
            today.toDateString()
        ) {
            return "Today";
        }

        if (
            date.toDateString() ===
            yesterday.toDateString()
        ) {
            return "Yesterday";
        }

        return new Intl.DateTimeFormat(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        ).format(date);
    }

    /* =====================================================
       SCROLL
    ===================================================== */

    function scrollToBottom() {

        requestAnimationFrame(() => {

            if (dom.conversation) {

                dom.conversation.scrollTop =
                    dom.conversation.scrollHeight;
            }

            if (dom.messages) {

                dom.messages.scrollTop =
                    dom.messages.scrollHeight;
            }

            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });
        });
    }

    /* =====================================================
       SEND BUTTON
    ===================================================== */

    function updateSendButton() {

        if (!dom.sendButton) return;

        const hasText =
            Boolean(
                dom.input?.value.trim()
            );

        dom.sendButton.disabled =
            !hasText;
    }

    /* =====================================================
       TYPING
    ===================================================== */

    function showTyping() {

        state.isTyping = true;

        if (dom.typing) {
            dom.typing.hidden = false;
        }
    }

    function hideTyping() {

        state.isTyping = false;

        if (dom.typing) {
            dom.typing.hidden = true;
        }
    }

    /* =====================================================
       MOOD PANEL
    ===================================================== */

    function openMoodPanel() {

        dom.moodOverlay?.classList.remove("hidden");

        document.body.classList.add(
            "couple-modal-open"
        );
    }

    function closeMoodPanel() {

        dom.moodOverlay?.classList.add("hidden");

        document.body.classList.remove(
            "couple-modal-open"
        );
    }

    /* =====================================================
       AI PANEL
    ===================================================== */

    function openAIPanel() {

        dom.aiOverlay?.classList.remove("hidden");

        document.body.classList.add(
            "couple-modal-open"
        );

        setupAIActions();
    }

    function closeAIPanel() {

        dom.aiOverlay?.classList.add("hidden");

        document.body.classList.remove(
            "couple-modal-open"
        );
    }

    /* =====================================================
       AI ACTIONS
    ===================================================== */

    function setupAIActions() {

        $$(".couple-ai-options [data-ai-action]")
            .forEach(button => {

                button.onclick = () => {

                    const action =
                        button.dataset.aiAction;

                    handleAIAction(action);

                    closeAIPanel();
                };
            });
    }

    function handleAIAction(action) {

        switch (action) {

            case "suggest":
                showSuggestions();
                break;

            case "love":

                applyMode("romantic");

                insertTextSuggestion(
                    "I just wanted to tell you how special you are to me ❤️"
                );

                break;

            case "comfort":

                applyMode("comfort");

                insertTextSuggestion(
                    "I'm here with you. You don't have to go through this alone 🫂"
                );

                break;

            case "game":

                applyMode("game");

                insertTextSuggestion(
                    "Let's play a couple game 🎮"
                );

                break;
        }
    }

    function showSuggestions() {

        if (!dom.suggestions) return;

        dom.suggestions.hidden = false;

        renderSuggestions();

        scrollToBottom();
    }

    function insertTextSuggestion(text) {

        if (!dom.input) return;

        dom.input.value = text;

        updateSendButton();

        dom.input.focus();
    }

    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    function handleQuickAction(action) {

        const actionMap = {

            love: {
                mode: "romantic",
                text: "Just sending you some love ❤️"
            },

            memory: {
                mode: "memory",
                text: "Let's remember one of our favorite moments 📸"
            },

            question: {
                mode: "deep-talk",
                text: "I have a question for you 💭"
            },

            game: {
                mode: "game",
                text: "Let's play a game 🎮"
            }
        };

        const selected =
            actionMap[action];

        if (!selected) return;

        applyMode(selected.mode);

        insertTextSuggestion(
            selected.text
        );
    }

    /* =====================================================
       EMOJI PICKER
    ===================================================== */

    let emojiPicker = null;

    function createEmojiPicker() {

        if (emojiPicker) return;

        emojiPicker =
            document.createElement("div");

        emojiPicker.id =
            "usanexEmojiPicker";

        emojiPicker.className =
            "usanex-emoji-picker";

        emojiPicker.innerHTML = `
            <div class="usanex-emoji-header">
                <strong>Emoji</strong>

                <button
                    type="button"
                    id="closeEmojiPicker"
                    aria-label="Close emoji picker">
                    ×
                </button>
            </div>

            <div class="usanex-emoji-search">
                <input
                    id="emojiSearch"
                    type="text"
                    placeholder="Search emoji..."
                    autocomplete="off">
            </div>

            <div
                class="usanex-emoji-tabs"
                id="emojiTabs">
            </div>

            <div
                class="usanex-emoji-grid"
                id="emojiGrid">
            </div>
        `;

        document.body.appendChild(
            emojiPicker
        );

        setupEmojiPickerEvents();

        renderEmojiTabs();

        renderEmojiCategory("recent");
    }

    function setupEmojiPickerEvents() {

        $("#closeEmojiPicker")
            ?.addEventListener(
                "click",
                closeEmojiPicker
            );

        $("#emojiSearch")
            ?.addEventListener(
                "input",
                event => {

                    searchEmojis(
                        event.target.value
                    );
                }
            );
    }

    function renderEmojiTabs() {

        const tabs =
            $("#emojiTabs");

        if (!tabs) return;

        const categories = [
            ["recent", "🕘"],
            ["love", "❤️"],
            ["smile", "😊"],
            ["people", "👍"],
            ["animals", "🐶"],
            ["food", "🍕"],
            ["activities", "🎮"],
            ["travel", "✈️"],
            ["objects", "📱"],
            ["symbols", "✨"]
        ];

        tabs.innerHTML = "";

        categories.forEach(
            ([category, icon]) => {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.dataset.category =
                    category;

                button.textContent =
                    icon;

                button.addEventListener(
                    "click",
                    () => {

                        renderEmojiCategory(
                            category
                        );
                    }
                );

                tabs.appendChild(button);
            }
        );
    }

    function renderEmojiCategory(category) {

        const grid =
            $("#emojiGrid");

        if (!grid) return;

        let emojis =
            EMOJI_CATEGORIES[category] || [];

        if (
            category === "recent" &&
            emojis.length === 0
        ) {
            emojis = [
                "❤️",
                "😊",
                "😂",
                "🥰",
                "😘",
                "👍"
            ];
        }

        grid.innerHTML = "";

        emojis.forEach(emoji => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "usanex-emoji-item";

            button.textContent =
                emoji;

            button.addEventListener(
                "click",
                () => {

                    insertEmoji(
                        emoji
                    );

                    addRecentEmoji(
                        emoji
                    );
                }
            );

            grid.appendChild(button);
        });
    }

    function searchEmojis(query) {

        const value =
            query.trim().toLowerCase();

        if (!value) {

            renderEmojiCategory("recent");

            return;
        }

        /*
         * Search using category names,
         * emoji itself, and common keywords.
         */

        const keywordMap = {

            love: "love",
            heart: "love",
            pyaar: "love",
            pyar: "love",

            happy: "smile",
            smile: "smile",
            laugh: "smile",

            hand: "people",
            people: "people",

            animal: "animals",
            dog: "animals",
            cat: "animals",

            food: "food",
            pizza: "food",

            game: "activities",
            music: "activities",

            travel: "travel",
            car: "travel",

            phone: "objects",
            gift: "objects",

            star: "symbols",
            fire: "symbols"
        };

        const category =
            keywordMap[value];

        if (category) {

            renderEmojiCategory(
                category
            );

            return;
        }

        const all = Object.values(
            EMOJI_CATEGORIES
        ).flat();

        const unique =
            [...new Set(all)];

        const filtered =
            unique.filter(emoji =>
                emoji.includes(value)
            );

        const grid =
            $("#emojiGrid");

        if (!grid) return;

        grid.innerHTML = "";

        (filtered.length
            ? filtered
            : ["❤️", "😊", "😂", "🥰"]
        ).forEach(emoji => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "usanex-emoji-item";

            button.textContent =
                emoji;

            button.onclick = () => {

                insertEmoji(emoji);

                addRecentEmoji(emoji);
            };

            grid.appendChild(button);
        });
    }

    function toggleEmojiPicker() {

        if (!emojiPicker) {
            createEmojiPicker();
        }

        emojiPicker.classList.toggle(
            "show"
        );

        if (
            emojiPicker.classList.contains(
                "show"
            )
        ) {

            positionEmojiPicker();

            setTimeout(() => {
                $("#emojiSearch")?.focus();
            }, 50);
        }
    }

    function closeEmojiPicker() {

        emojiPicker?.classList.remove(
            "show"
        );
    }

    function positionEmojiPicker() {

        if (!emojiPicker || !dom.emojiButton) {
            return;
        }

        const rect =
            dom.emojiButton.getBoundingClientRect();

        const pickerWidth =
            Math.min(
                window.innerWidth - 20,
                360
            );

        emojiPicker.style.width =
            `${pickerWidth}px`;

        let left =
            rect.left;

        if (
            left + pickerWidth >
            window.innerWidth - 10
        ) {
            left =
                window.innerWidth -
                pickerWidth -
                10;
        }

        emojiPicker.style.left =
            `${Math.max(10, left)}px`;

        emojiPicker.style.bottom =
            `${window.innerHeight - rect.top + 8}px`;
    }

    function insertEmoji(emoji) {

        if (!dom.input) return;

        const input =
            dom.input;

        const start =
            input.selectionStart ??
            input.value.length;

        const end =
            input.selectionEnd ??
            input.value.length;

        input.value =
            input.value.slice(0, start) +
            emoji +
            input.value.slice(end);

        const newPosition =
            start + emoji.length;

        input.setSelectionRange(
            newPosition,
            newPosition
        );

        updateSendButton();

        input.focus();
    }

    function addRecentEmoji(emoji) {

        let recent =
            loadRecentEmojis();

        recent =
            recent.filter(
                item => item !== emoji
            );

        recent.unshift(emoji);

        recent =
            recent.slice(
                0,
                CONFIG.maxRecentEmoji
            );

        EMOJI_CATEGORIES.recent =
            recent;

        try {

            localStorage.setItem(
                CONFIG.recentEmojiKey,
                JSON.stringify(recent)
            );

        } catch (_) {}
    }

    function loadRecentEmojis() {

        try {

            const saved =
                localStorage.getItem(
                    CONFIG.recentEmojiKey
                );

            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed)) {

                EMOJI_CATEGORIES.recent =
                    parsed;

                return parsed;
            }

        } catch (_) {}

        return [];
    }

    /* =====================================================
       FILE / CAMERA
    ===================================================== */

    function handleFiles(event) {

        const files =
            [...(event.target.files || [])];

        if (!files.length) return;

        files.forEach(file => {

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload = () => {

                const message =
                    createMessage({
                        text: "📸 Photo",
                        from: "me",
                        type: "file",
                        file: reader.result
                    });

                state.messages.push(
                    message
                );

                trimMessages();

                renderMessages();

                saveChat();

                applyMode(
                    "photo-memory"
                );
            };

            reader.readAsDataURL(file);
        });

        event.target.value = "";
    }

    /* =====================================================
       EFFECT ENGINE
    ===================================================== */

    function triggerEffect(effect) {

        if (!dom.effects) return;

        dom.effects.innerHTML = "";

        const effectCount =
            Math.max(
                8,
                Math.round(
                    10 +
                    state.intensity * 20
                )
            );

        if (
            effect === "hearts" ||
            effect === "sparkles" ||
            effect === "confetti" ||
            effect === "fire" ||
            effect === "stars"
        ) {

            const symbols = {

                hearts: [
                    "❤️",
                    "💕",
                    "💗",
                    "💖",
                    "💘",
                    "🫶"
                ],

                sparkles: [
                    "✨",
                    "⭐",
                    "🌟",
                    "💫"
                ],

                confetti: [
                    "🎉",
                    "🎊",
                    "🎈",
                    "✨",
                    "🥳"
                ],

                fire: [
                    "🔥",
                    "❤️‍🔥",
                    "✨"
                ],

                stars: [
                    "⭐",
                    "🌟",
                    "✨",
                    "💫",
                    "🌙"
                ]
            };

            const list =
                symbols[effect] ||
                symbols.sparkles;

            for (
                let i = 0;
                i < effectCount;
                i++
            ) {

                const item =
                    document.createElement("span");

                item.className =
                    "couple-effect-item";

                item.textContent =
                    list[
                        Math.floor(
                            Math.random() *
                            list.length
                        )
                    ];

                item.style.left =
                    `${Math.random() * 100}%`;

                item.style.animationDelay =
                    `${Math.random() * 0.8}s`;

                item.style.animationDuration =
                    `${2 + Math.random() * 2}s`;

                dom.effects.appendChild(
                    item
                );
            }

            setTimeout(() => {

                dom.effects.innerHTML = "";

            }, 4500);
        }

        if (effect === "rain") {

            for (
                let i = 0;
                i < 18;
                i++
            ) {

                const drop =
                    document.createElement("span");

                drop.className =
                    "couple-rain-drop";

                drop.style.left =
                    `${Math.random() * 100}%`;

                drop.style.animationDelay =
                    `${Math.random()}s`;

                dom.effects.appendChild(
                    drop
                );
            }

            setTimeout(() => {

                dom.effects.innerHTML = "";

            }, 4000);
        }
    }

    function triggerEffectForMessage(text) {

        const mode =
            detectModeFromText(text);

        if (!mode) return;

        const data =
            COUPLE_MODES[mode];

        if (data) {
            triggerEffect(
                data.effect
            );
        }
    }

    /* =====================================================
       MENU
    ===================================================== */

    function openMenu() {

        const action =
            window.prompt(
                "Couple Chat\n\n" +
                "1 = Clear conversation\n" +
                "2 = Export conversation\n" +
                "3 = Cancel"
            );

        if (action === "1") {

            const confirmed =
                window.confirm(
                    "Clear this Couple Chat?"
                );

            if (confirmed) {

                state.messages = [];

                saveChat();

                renderMessages();
            }

        } else if (action === "2") {

            exportConversation();
        }
    }

    /* =====================================================
       EXPORT CHAT
    ===================================================== */

    function exportConversation() {

        if (!state.messages.length) {

            alert("No messages to export.");

            return;
        }

        const lines =
            state.messages.map(message => {

                const sender =
                    message.from === "me"
                        ? "You"
                        : state.partner.name;

                return `[${formatTime(message.time)}] ${sender}: ${message.text}`;
            });

        const text =
            lines.join("\n");

        const blob =
            new Blob(
                [text],
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

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);
    }

    /* =====================================================
       STORAGE
    ===================================================== */

    function storageKey() {

        const partner =
            state.partner.id ||
            state.partner.name ||
            "default";

        return `${CONFIG.storageKey}_${partner}`;
    }

    function saveChat() {

        try {

            const data = {

                mode: state.mode,

                emotion: state.emotion,

                intensity: state.intensity,

                messages:
                    state.messages.slice(
                        -CONFIG.maxMessages
                    ),

                partner:
                    state.partner,

                savedAt:
                    Date.now()
            };

            localStorage.setItem(
                storageKey(),
                JSON.stringify(data)
            );

        } catch (error) {

            console.debug(
                "Could not save Couple Chat:",
                error
            );
        }
    }

    function loadSavedChat() {

        loadRecentEmojis();

        try {

            const raw =
                localStorage.getItem(
                    storageKey()
                );

            if (!raw) return;

            const data =
                JSON.parse(raw);

            if (!data) return;

            if (
                data.mode &&
                COUPLE_MODES[data.mode]
            ) {
                state.mode =
                    data.mode;
            }

            if (
                Array.isArray(
                    data.messages
                )
            ) {
                state.messages =
                    data.messages;
            }

        } catch (error) {

            console.debug(
                "Could not load Couple Chat:",
                error
            );
        }
    }

    /* =====================================================
       TRIM MESSAGES
    ===================================================== */

    function trimMessages() {

        if (
            state.messages.length >
            CONFIG.maxMessages
        ) {

            state.messages =
                state.messages.slice(
                    -CONFIG.maxMessages
                );
        }
    }

    /* =====================================================
       TOGETHER DATA
    ===================================================== */

    function updateTogetherData() {

        if (dom.togetherDays) {

            dom.togetherDays.textContent =
                "Your special space";
        }

        if (dom.connectionStatus) {

            dom.connectionStatus.textContent =
                "Growing ❤️";
        }
    }

    /* =====================================================
       PUBLIC DEBUG API
    ===================================================== */

    window.UsanexCoupleChat = {

        state,

        modes:
            COUPLE_MODES,

        emojis:
            EMOJI_CATEGORIES,

        applyMode,

        sendMessage(text) {

            if (!text) return;

            if (dom.input) {
                dom.input.value = text;
                sendCurrentMessage();
            }
        },

        addPartnerMessage(text) {

            if (!text) return;

            simulatePartnerResponse(
                text,
                100
            );
        },

        clear() {

            state.messages = [];

            saveChat();

            renderMessages();
        }
    };

    window.UsanexCoupleModes =
        COUPLE_MODES;

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
