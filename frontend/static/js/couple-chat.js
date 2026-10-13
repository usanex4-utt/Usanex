/* ============================================================
 * UTANEXA — COUPLE CHAT
 * File: couple-chat.js
 * Part: 1/4
 *
 * Core Features:
 * - Partner-specific conversation
 * - Mood management
 * - Message rendering
 * - Message history
 * - Delivery and seen indicators
 * - Online status
 * - Emoji data
 * ============================================================ */

(() => {
    "use strict";

    /* ========================================================
     * 1. DOM HELPERS
     * ======================================================== */

    /**
     * Find an element using its ID.
     *
     * @param {string} id
     * @returns {HTMLElement|null}
     */
    const $ = (id) => document.getElementById(id);


    /* ========================================================
     * 2. API CONFIGURATION
     * ======================================================== */

    const API = {
        analyze: "/api/couple-chat/analyze",
        mood: "/api/couple-chat/mood"
    };


    /* ========================================================
     * 3. AVAILABLE MOODS
     * ======================================================== */

    const MODES = [
        ["calm", "Calm"],
        ["romantic", "Romantic"],
        ["deep_love", "Deep Love"],
        ["happy", "Happy"],
        ["funny", "Funny"],
        ["sad", "Sad"],
        ["emotional", "Emotional"],
        ["angry", "Angry"],
        ["frustrated", "Frustrated"],
        ["caring", "Caring"],
        ["comfort", "Comfort"],
        ["flirty", "Flirty"],
        ["passionate", "Passionate"],
        ["good_night", "Good Night"],
        ["good_morning", "Good Morning"],
        ["memory", "Memory"],
        ["celebration", "Celebration"],
        ["birthday", "Birthday"],
        ["future_marriage", "Future"],
        ["missing_you", "Missing You"],
        ["apology", "Apology"],
        ["appreciation", "Appreciation"],
        ["game", "Game"],
        ["photo_memory", "Photo Memory"],
        ["serious_talk", "Serious Talk"],
        ["deep_conversation", "Deep Talk"]
    ];


    /* ========================================================
     * 4. DEFAULT MESSAGE SUGGESTIONS
     * ======================================================== */

    const REPLIES = {
        love: [
            "I feel lucky to have you in my life.",
            "You make ordinary moments special.",
            "I wish I could give you a hug right now."
        ],

        question: [
            "What is one little thing I do that makes you smile?",
            "What would our perfect day together look like?",
            "What is a memory of us you never want to forget?"
        ],

        game: [
            "Two truths and a dream: tell me yours.",
            "Describe our relationship in three words.",
            "Would you rather have a sunset walk or a cozy movie night?"
        ],

        memory: [
            "What is your favourite memory of us so far?",
            "Let's make another memory worth keeping.",
            "I was just thinking about one of our good moments."
        ]
    };


    /* ========================================================
     * 5. EMOJI COLLECTIONS
     * ======================================================== */

    const EMOJI_CATEGORIES = [
        {
            name: "Recent",
            icon: "◷",
            items: []
        },

        {
            name: "Smileys",
            icon: "☺",
            items: [
                "😀", "😃", "😄", "😁", "😆", "😅", "😂",
                "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍",
                "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲",
                "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗",
                "🤭", "🫢", "🫣", "🤫", "🤔", "🫡", "🤐",
                "🤨", "😐", "😑", "😶", "🫥", "😏", "😒",
                "🙄", "😬", "🤥", "🫨", "😌", "😔", "😪",
                "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
                "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠",
                "🥳", "🥸", "😎", "🤓", "🧐"
            ]
        },

        {
            name: "Hearts",
            icon: "♡",
            items: [
                "❤️", "🧡", "💛", "💚", "💙", "💜",
                "🖤", "🤍", "🤎", "🩷", "🩵", "🩶",
                "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕",
                "💞", "💓", "💗", "💖", "💘", "💝", "💟"
            ]
        },

        {
            name: "Hands",
            icon: "✋",
            items: [
                "👋", "🤚", "🖐️", "✋", "🖖", "🫱",
                "🫲", "🫳", "🫴", "👌", "🤌", "🤏",
                "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
                "👈", "👉", "👆", "🖕", "👇", "☝️",
                "👍", "👎", "✊", "👊", "🤛", "🤜",
                "👏", "🙌", "🫶", "👐", "🤲", "🙏", "💪"
            ]
        },

        {
            name: "People",
            icon: "♙",
            items: [
                "👶", "🧒", "👦", "👧", "🧑", "👨",
                "👩", "🧔", "👵", "👴", "👮", "👷",
                "💂", "🥷", "👸", "🤴", "👰", "🤵",
                "🫅", "👼", "🎅", "🤶", "🧑‍🎄",
                "🦸", "🦹", "🧙", "🧚", "🧛", "🧜",
                "🧝", "🧞", "🧟"
            ]
        },

        {
            name: "Nature",
            icon: "❀",
            items: [
                "🐶", "🐱", "🐭", "🐹", "🐰", "🦊",
                "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
                "🐷", "🐸", "🐵", "🙈", "🙉", "🙊",
                "🐔", "🐧", "🐦", "🦄", "🐝", "🦋",
                "🐢", "🐬", "🐳", "🌷", "🌹", "🌺",
                "🌻", "🌼", "🌸", "💐", "🍀", "🌿",
                "🌈", "⭐", "🌙", "☀️", "🔥", "❄️"
            ]
        },

        {
            name: "Food",
            icon: "♨",
            items: [
                "🍎", "🍐", "🍊", "🍋", "🍌", "🍉",
                "🍇", "🍓", "🫐", "🍒", "🍑", "🥭",
                "🍍", "🥥", "🥝", "🍅", "🥑", "🥦",
                "🥕", "🌽", "🍕", "🍔", "🍟", "🌭",
                "🍿", "🧂", "🍩", "🍪", "🎂", "🍰",
                "🧁", "🍫", "🍬", "🍭", "☕", "🧋", "🥤"
            ]
        },

        {
            name: "Activities",
            icon: "⚽",
            items: [
                "⚽", "🏀", "🏈", "⚾", "🎾", "🏐",
                "🎱", "🏓", "🏸", "🥊", "🥋", "🎯",
                "🪁", "🎮", "🕹️", "🎲", "🧩", "🎨",
                "🎤", "🎧", "🎼", "🎹", "🎸", "🎻",
                "🥁", "🎬", "🎭", "🎟️"
            ]
        },

        {
            name: "Travel",
            icon: "✈",
            items: [
                "🚗", "🚕", "🚌", "🚎", "🏎️", "🚓",
                "🚑", "🚒", "🚲", "🛵", "🛴", "🚂",
                "✈️", "🚀", "🛸", "🚁", "⛵", "🚤",
                "🛳️", "⚓", "🏖️", "🏝️", "🏕️", "🏠",
                "🏡", "🏰", "🌆", "🌃", "🌉",
                "🌍", "🌎", "🌏"
            ]
        },

        {
            name: "Objects",
            icon: "◇",
            items: [
                "📱", "💻", "⌚", "📷", "📸", "💡",
                "🔦", "🕯️", "📚", "📖", "✏️", "🖊️",
                "💌", "💎", "💍", "🎁", "🎈", "🎉",
                "🎊", "🏆", "🥇", "🔑", "🔒", "🔔",
                "📌", "📎", "✂️", "🧸", "🛏️", "🛋️", "🚿"
            ]
        },

        {
            name: "Symbols",
            icon: "♬",
            items: [
                "❤️‍🔥", "💯", "✨", "💫", "⭐", "🌟",
                "⚡", "☄️", "💥", "💢", "💦", "💨",
                "🕳️", "💬", "🗨️", "🗯️", "💭", "💤",
                "✔️", "☑️", "❌", "⭕", "🚫", "♻️",
                "🔞", "🔆", "🔅", "♾️", "➕", "➖",
                "➗", "💲"
            ]
        }
    ];


    /* ========================================================
     * 6. PARTNER IDENTIFICATION
     * ======================================================== */

    /**
     * Determine the partner ID from the current URL.
     */
    const partnerId = (() => {
        const params = new URLSearchParams(window.location.search);

        return (
            params.get("partner_id") ||
            params.get("user_id") ||
            params.get("id") ||
            "unknown"
        );
    })();


    /* ========================================================
     * 7. LOCAL STORAGE
     * ======================================================== */

    const storageKey =
        `utanexa_couple_chat_messages_v13_${partnerId}`;

    const modeKey =
        `utanexa_couple_chat_mode_v13_${partnerId}`;


    /* ========================================================
     * 8. RUNTIME STATE
     * ======================================================== */

    let currentUserId = null;

    let currentMode =
        localStorage.getItem(modeKey) || "calm";

    let manualMood = false;

    let messages = [];

    let realtime = null;

    let aiTimer = null;

    let toastTimer = null;

    let recorder = null;

    let recordChunks = [];

    let recordStarted = 0;

    let recordInterval = null;

    let selectedEmojiCategory = "Smileys";

    let recentEmojis = [];

    try {
        recentEmojis = JSON.parse(
            localStorage.getItem("utanexa_recent_emojis") || "[]"
        );

        if (!Array.isArray(recentEmojis)) {
            recentEmojis = [];
        }
    } catch {
        recentEmojis = [];
    }

    const state = {
        partnerOnline: false,
        connected: false,
        typing: false
    };


    /* ========================================================
     * 9. NOTIFICATION TOAST
     * ======================================================== */

    /**
     * Display a temporary notification.
     *
     * @param {string} message
     */
    function toast(message) {
        const element = $("coupleToast");

        if (!element) {
            return;
        }

        element.textContent = message;

        element.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.classList.remove("show");
        }, 2400);
    }


    /* ========================================================
     * 10. TEXT HELPERS
     * ======================================================== */

    /**
     * Safely convert a value to a string.
     *
     * @param {*} value
     * @returns {string}
     */
    function safe(value) {
        return String(value ?? "");
    }


    /**
     * Normalize message text.
     *
     * @param {*} value
     * @returns {string}
     */
    function escapeText(value) {
        return safe(value);
    }


    /* ========================================================
     * 11. MESSAGE STORAGE
     * ======================================================== */

    /**
     * Load locally cached messages.
     *
     * @returns {Array<Object>}
     */
    function loadMessages() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(storageKey) || "[]"
            );

            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }


    /**
     * Persist recent messages locally.
     */
    function persist() {
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(messages.slice(-500))
            );
        } catch (error) {
            console.warn(
                "Unable to save local conversation history:",
                error
            );
        }
    }


    /* ========================================================
     * 12. MESSAGE TIME
     * ======================================================== */

    /**
     * Format a timestamp for the message bubble.
     *
     * @param {string|number|Date} timestamp
     * @returns {string}
     */
    function nowTime(timestamp) {
        try {
            return new Date(timestamp || Date.now())
                .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });
        } catch {
            return "";
        }
    }


    /* ========================================================
     * 13. CONVERSATION SCROLLING
     * ======================================================== */

    /**
     * Scroll the conversation to the latest message.
     */
    function scrollBottom() {
        const conversation = $("coupleConversation");

        if (conversation) {
            conversation.scrollTop = conversation.scrollHeight;
        }
    }


    /* ========================================================
     * 14. MESSAGE RENDERING
     * ======================================================== */

    /**
     * Render messages in the conversation container.
     */
    function renderMessages() {
        const container = $("coupleMessages");

        if (!container) {
            return;
        }

        container.replaceChildren();

        messages.forEach((message) => {
            const senderId =
                message.sender_id ?? message.senderId;

            const mine = Boolean(
                message.is_mine ||
                message.isMine ||
                (
                    currentUserId != null &&
                    String(senderId) === String(currentUserId)
                )
            );

            // Message row.
            const row = document.createElement("article");

            row.className = "message-row";

            if (mine) {
                row.classList.add("mine");
            }

            // Message bubble.
            const bubble = document.createElement("div");

            bubble.className = "message-bubble";

            const mediaUrl = message.media_url;

            const mediaType = safe(message.media_type);

            // Image attachment.
            if (
                mediaUrl &&
                mediaType.startsWith("image")
            ) {
                const image = document.createElement("img");

                image.className = "message-media";
                image.src = mediaUrl;
                image.alt = "Shared image";
                image.loading = "lazy";

                bubble.appendChild(image);
            }

            // Video attachment.
            else if (
                mediaUrl &&
                mediaType.startsWith("video")
            ) {
                const video = document.createElement("video");

                video.className = "message-media";
                video.src = mediaUrl;
                video.controls = true;
                video.playsInline = true;

                bubble.appendChild(video);
            }

            // Audio attachment.
            else if (
                mediaUrl &&
                mediaType.startsWith("audio")
            ) {
                const audio = document.createElement("audio");

                audio.controls = true;
                audio.src = mediaUrl;

                bubble.appendChild(audio);
            }

            // Text content.
            const content = safe(
                message.content ?? message.text ?? ""
            );

            if (content) {
                const textElement = document.createElement("div");

                textElement.className = "message-text";
                textElement.textContent = content;

                bubble.appendChild(textElement);
            }

            // Attachment without an available media URL.
            if (message.file_name && !mediaUrl) {
                const fileElement = document.createElement("div");

                fileElement.className = "message-file";
                fileElement.textContent =
                    `File: ${message.file_name}`;

                bubble.appendChild(fileElement);
            }

            // Message metadata.
            const metadata = document.createElement("div");

            metadata.className = "message-meta";

            metadata.textContent = nowTime(
                message.created_at ||
                message.timestamp ||
                message.sent_at
            );

            // Delivery and read indicators.
            if (mine) {
                const status = document.createElement("span");

                status.className = "message-status";

                if (message.read_at || message.seen) {
                    status.textContent = "Seen";
                } else if (
                    message.delivered_at ||
                    message.delivered
                ) {
                    status.textContent = "Delivered";
                } else if (message.pending) {
                    status.textContent = "Sending…";
                } else {
                    status.textContent = "Sent";
                }

                metadata.appendChild(status);
            }

            bubble.appendChild(metadata);

            row.appendChild(bubble);

            container.appendChild(row);
        });

        scrollBottom();
    }


    /* ========================================================
     * 15. ADD MESSAGE
     * ======================================================== */

    /**
     * Add a message to the local conversation.
     *
     * @param {Object} message
     * @param {boolean} send
     * @returns {Object|undefined}
     */
    function addMessage(message, send = false) {
        if (!message) {
            return;
        }

        const id =
            message.message_id ||
            message.id ||
            message.client_id;

        // Prevent duplicate messages.
        if (
            id &&
            messages.some((item) => {
                const existingId =
                    item.message_id ||
                    item.id ||
                    item.client_id;

                return String(existingId) === String(id);
            })
        ) {
            return;
        }

        const item = {
            ...message,

            message_id:
                id ||
                `local-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,

            created_at:
                message.created_at ||
                message.timestamp ||
                new Date().toISOString(),

            is_mine:
                send ||
                message.is_mine ||
                message.isMine
        };

        messages.push(item);

        persist();

        renderMessages();

        return item;
    }


    /* ========================================================
     * 16. NORMALIZE INCOMING MESSAGES
     * ======================================================== */

    /**
     * Normalize a message received from realtime transport.
     *
     * @param {Object} message
     * @returns {Object}
     */
    function normalizeIncoming(message) {
        const senderId =
            message.sender_id ?? message.senderId;

        return {
            ...message,

            content:
                message.content ??
                message.text ??
                "",

            is_mine: Boolean(
                message.is_mine ||
                message.isMine ||
                (
                    currentUserId != null &&
                    String(senderId) === String(currentUserId)
                )
            )
        };
    }


    /* ========================================================
     * 17. PARTNER STATUS
     * ======================================================== */

    /**
     * Update the partner's online status.
     *
     * @param {string} text
     * @param {boolean|undefined} online
     */
    function setStatus(text, online) {
        const statusElement = $("couplePartnerStatus");

        if (statusElement) {
            statusElement.textContent = text;
        }

        if (online !== undefined) {
            state.partnerOnline = Boolean(online);

            const onlineDot = $("coupleOnlineDot");

            if (onlineDot) {
                onlineDot.hidden = !online;
            }




          /* =========================================================
   UTANEXA — COUPLE CHAT
   PART 2/4
   Mood Engine • AI Suggestions • Message Sending
========================================================= */

/**
 * Update the active relationship mood.
 *
 * @param {string} mode - Mood identifier.
 * @param {boolean} manual - Whether selected manually.
 */
function setMode(mode, manual = true) {
    const isValidMode = MODES.some(([key]) => key === mode);

    if (!isValidMode) {
        mode = "calm";
    }

    currentMode = mode;

    if (manual) {
        manualMood = true;
    }

    localStorage.setItem(modeKey, mode);
    document.body.dataset.coupleMode = mode;

    const moodButton = $("coupleHeaderMood");

    if (moodButton) {
        const selectedMode = MODES.find(([key]) => key === mode);

        moodButton.textContent = "Mood";
        moodButton.title = `Current mood: ${selectedMode?.[1] || "Calm"}`;
    }

    const moodGrid = $("coupleMoodGrid");

    if (moodGrid) {
        moodGrid.querySelectorAll("[data-mode]").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });
    }

    makeMoodEffects();

    // Inform the backend about the selected mood.
    fetch(API.mood, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            partner_id: partnerId,
            mood: mode,
            mode: mode
        })
    }).catch(error => {
        console.warn("Unable to synchronize mood:", error);
    });

    updateSuggestions();
}


/**
 * Create subtle visual effects according to the current mood.
 */
function makeMoodEffects() {
    const layer = $("coupleEffectsLayer");

    if (!layer) {
        return;
    }

    layer.replaceChildren();

    const romanticMoods = [
        "romantic",
        "deep_love",
        "missing_you",
        "appreciation"
    ];

    const happyMoods = [
        "happy",
        "celebration",
        "birthday",
        "good_morning"
    ];

    const calmMoods = [
        "sad",
        "comfort",
        "good_night"
    ];

    const romantic = romanticMoods.includes(currentMode);
    const happy = happyMoods.includes(currentMode);
    const calm = calmMoods.includes(currentMode);

    if (!romantic && !happy && !calm) {
        return;
    }

    for (let index = 0; index < 16; index++) {
        const particle = document.createElement("span");

        particle.className = "mood-particle";

        if (romantic) {
            particle.classList.add("heart");
        }

        particle.style.setProperty(
            "--x",
            `${Math.random() * 100}%`
        );

        particle.style.setProperty(
            "--size",
            `${romantic ? 10 : 3 + Math.random() * 6}px`
        );

        particle.style.setProperty(
            "--duration",
            `${8 + Math.random() * 12}s`
        );

        const particleColor = happy
            ? "#ffd88a"
            : calm
                ? "#8dc7ff"
                : "#ff9fca";

        particle.style.setProperty(
            "--particle-color",
            particleColor
        );

        particle.style.animationDelay =
            `${-Math.random() * 15}s`;

        layer.appendChild(particle);
    }
}


/**
 * Render AI-generated or predefined message suggestions.
 *
 * @param {string[]} list
 */
function updateSuggestions(list) {
    const section = $("coupleSuggestions");
    const container = $("coupleSuggestionList");

    if (!section || !container) {
        return;
    }

    const fallbackSuggestions =
        REPLIES[currentMode] || REPLIES.question;

    const suggestions = (
        Array.isArray(list) && list.length
            ? list
            : fallbackSuggestions
    ).slice(0, 8);

    container.replaceChildren();

    suggestions.forEach(suggestion => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "suggestion-chip";
        button.textContent = suggestion;
        button.title = suggestion;

        button.addEventListener("click", () => {
            const input = $("coupleMessageInput");

            if (!input) {
                return;
            }

            input.value = suggestion;
            input.focus();

            section.hidden = true;
        });

        container.appendChild(button);
    });

    section.hidden = false;
}


/**
 * Analyze a conversation message using the Usanex AI endpoint.
 *
 * @param {string} text
 */
async function analyzeMessage(text) {
    const status = $("coupleAiStatus");

    if (status) {
        status.textContent = "Understanding your conversation…";
    }

    clearTimeout(aiTimer);

    aiTimer = setTimeout(() => {
        if (status) {
            status.textContent = "Here to help you connect";
        }
    }, 3500);

    try {
        const response = await fetch(API.analyze, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                partner_id: partnerId,
                message: text,
                text: text,
                mode: currentMode
            })
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        // Apply AI mood only when the user has not
        // manually selected a mood.
        if (data.mood || data.mode) {
            if (!manualMood) {
                setMode(data.mood || data.mode, false);
            }
        }

        if (Array.isArray(data.suggestions)) {
            updateSuggestions(data.suggestions);
        }

        if (status) {
            status.textContent = data.status
                ? String(data.status)
                : `Conversation mood: ${currentMode.replaceAll("_", " ")}`;
        }
    } catch (error) {
        console.warn("AI analysis unavailable:", error);

        if (status) {
            status.textContent =
                "Your private conversation companion";
        }
    }
}


/**
 * Send a message through the available realtime controller.
 *
 * NOTE:
 * The realtime controller's expected sendMessage()
 * signature must match this implementation.
 *
 * @param {Object} item
 * @returns {boolean}
 */
function sendRealtime(item) {
    try {
        if (
            realtime &&
            typeof realtime.sendMessage === "function"
        ) {
            realtime.sendMessage(item);
            return true;
        }

        if (
            realtime &&
            typeof realtime.send === "function"
        ) {
            realtime.send({
                type: "message",
                ...item
            });

            return true;
        }
    } catch (error) {
        console.warn("Realtime send failed:", error);
    }

    return false;
}


/**
 * Send a text message.
 *
 * @param {string} text
 */
function sendText(text) {
    text = text.trim();

    if (!text) {
        return;
    }

    const message = {
        message_id:
            `client-${Date.now()}-${Math.random().toString(36).slice(2)}`,

        content: text,
        message_type: "text",
        created_at: new Date().toISOString(),
        is_mine: true,
        pending: true
    };

    messages.push(message);

    persist();
    renderMessages();

    const input = $("coupleMessageInput");

    if (input) {
        input.value = "";
    }

    sendRealtime(message);

    analyzeMessage(text);

    if (
        realtime &&
        typeof realtime.sendTyping === "function"
    ) {
        try {
            realtime.sendTyping(false);
        } catch (error) {
            console.warn("Unable to update typing status:", error);
        }
    }
}
          /* ============================================================
 * UTANEXA — COUPLE CHAT
 * PART 3/4
 *
 * Features:
 * - Emoji picker
 * - Emoji categories
 * - Recent emojis
 * - Message composer
 * - Quick message actions
 * - Attachment preview
 * - Voice recording
 * ============================================================ */


/* ============================================================
 * 18. EMOJI PICKER
 * ============================================================ */

/**
 * Render the emoji category buttons.
 */
function renderEmojiCategories() {
    const container = $("coupleEmojiCategories");

    if (!container) {
        return;
    }

    container.replaceChildren();

    EMOJI_CATEGORIES.forEach((category) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "emoji-category";
        button.textContent = category.icon;
        button.title = category.name;
        button.setAttribute("aria-label", category.name);

        button.classList.toggle(
            "active",
            category.name === selectedEmojiCategory
        );

        button.addEventListener("click", () => {
            selectedEmojiCategory = category.name;

            renderEmojiCategories();
            renderEmojiGrid();
        });

        container.appendChild(button);
    });
}


/**
 * Get the emojis for the currently selected category.
 *
 * @returns {string[]}
 */
function getSelectedEmojis() {
    if (selectedEmojiCategory === "Recent") {
        return recentEmojis;
    }

    const category = EMOJI_CATEGORIES.find(
        (item) => item.name === selectedEmojiCategory
    );

    return category ? category.items : [];
}


/**
 * Save a recently used emoji.
 *
 * @param {string} emoji
 */
function saveRecentEmoji(emoji) {
    recentEmojis = [
        emoji,
        ...recentEmojis.filter((item) => item !== emoji)
    ].slice(0, 30);

    try {
        localStorage.setItem(
            "utanexa_recent_emojis",
            JSON.stringify(recentEmojis)
        );
    } catch (error) {
        console.warn("Unable to save recent emojis:", error);
    }
}


/**
 * Insert an emoji into the message composer.
 *
 * @param {string} emoji
 */
function insertEmoji(emoji) {
    const input = $("coupleMessageInput");

    if (!input) {
        return;
    }

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    input.value =
        input.value.slice(0, start) +
        emoji +
        input.value.slice(end);

    const cursorPosition = start + emoji.length;

    input.focus();

    input.setSelectionRange(
        cursorPosition,
        cursorPosition
    );

    saveRecentEmoji(emoji);

    renderEmojiGrid();
}


/**
 * Render the emoji grid.
 */
function renderEmojiGrid() {
    const container = $("coupleEmojiGrid");

    if (!container) {
        return;
    }

    container.replaceChildren();

    const emojis = getSelectedEmojis();

    if (!emojis.length) {
        const empty = document.createElement("p");

        empty.className = "emoji-empty";
        empty.textContent = "Your recently used emojis will appear here.";

        container.appendChild(empty);

        return;
    }

    emojis.forEach((emoji) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "emoji-item";
        button.textContent = emoji;
        button.setAttribute("aria-label", emoji);

        button.addEventListener("click", () => {
            insertEmoji(emoji);
        });

        container.appendChild(button);
    });
}


/**
 * Open or close the emoji picker.
 *
 * @param {boolean} forceOpen
 */
function toggleEmojiPicker(forceOpen) {
    const picker = $("coupleEmojiPicker");

    if (!picker) {
        return;
    }

    const shouldOpen =
        forceOpen === undefined
            ? picker.hidden
            : Boolean(forceOpen);

    picker.hidden = !shouldOpen;

    if (shouldOpen) {
        renderEmojiCategories();
        renderEmojiGrid();
    }
}


/* ============================================================
 * 19. MESSAGE COMPOSER
 * ============================================================ */

/**
 * Handle sending from the message input.
 *
 * @param {KeyboardEvent} event
 */
function handleComposerKeydown(event) {
    if (event.key !== "Enter") {
        return;
    }

    // Allow Shift+Enter to create a new line.
    if (event.shiftKey) {
        return;
    }

    event.preventDefault();

    const input = $("coupleMessageInput");

    if (!input) {
        return;
    }

    sendText(input.value);
}


/**
 * Update the composer character counter.
 */
function updateComposerCounter() {
    const input = $("coupleMessageInput");
    const counter = $("coupleCharacterCount");

    if (!input || !counter) {
        return;
    }

    counter.textContent = String(input.value.length);
}


/**
 * Update typing status if the realtime controller supports it.
 */
function notifyTyping() {
    if (
        !realtime ||
        typeof realtime.sendTyping !== "function"
    ) {
        return;
    }

    try {
        realtime.sendTyping(true);
    } catch (error) {
        console.warn("Typing notification failed:", error);
    }
}


/* ============================================================
 * 20. QUICK MESSAGE ACTIONS
 * ============================================================ */

/**
 * Handle a predefined quick-action button.
 *
 * @param {string} action
 */
function handleQuickAction(action) {
    const input = $("coupleMessageInput");

    if (!input) {
        return;
    }

    const suggestions = REPLIES[action];

    if (suggestions && suggestions.length) {
        updateSuggestions(suggestions);

        const firstSuggestion = suggestions[0];

        input.value = firstSuggestion;
        input.focus();

        return;
    }

    const prompts = {
        love: "I just want you to know how special you are to me. ❤️",
        memory: "Let's talk about our favourite memories together. 💗",
        question: "Can I ask you something? 💭",
        game: "Let's play a little relationship game! 🎮"
    };

    if (prompts[action]) {
        input.value = prompts[action];
        input.focus();
    }
}


/* ============================================================
 * 21. ATTACHMENT PREVIEW
 * ============================================================ */

let currentAttachmentUrl = null;


/**
 * Clear an attachment preview.
 */
function clearAttachmentPreview() {
    const preview = $("coupleAttachmentPreview");

    if (preview) {
        preview.replaceChildren();
        preview.hidden = true;
    }

    if (currentAttachmentUrl) {
        URL.revokeObjectURL(currentAttachmentUrl);
        currentAttachmentUrl = null;
    }
}


/**
 * Display a local preview of a selected attachment.
 *
 * IMPORTANT:
 * This function previews a file locally.
 * It does not upload the file to the server.
 *
 * @param {File} file
 */
function previewAttachment(file) {
    if (!file) {
        return;
    }

    const preview = $("coupleAttachmentPreview");

    if (!preview) {
        toast("Attachment preview is unavailable.");
        return;
    }

    clearAttachmentPreview();

    currentAttachmentUrl = URL.createObjectURL(file);

    const wrapper = document.createElement("div");

    wrapper.className = "attachment-preview-item";

    if (file.type.startsWith("image/")) {
        const image = document.createElement("img");

        image.src = currentAttachmentUrl;
        image.alt = file.name;
        image.className = "attachment-preview-image";

        wrapper.appendChild(image);
    } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");

        video.src = currentAttachmentUrl;
        video.controls = true;
        video.playsInline = true;

        wrapper.appendChild(video);
    } else {
        const fileLabel = document.createElement("span");

        fileLabel.textContent = file.name;

        wrapper.appendChild(fileLabel);
    }

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "attachment-remove";

    removeButton.addEventListener(
        "click",
        clearAttachmentPreview
    );

    wrapper.appendChild(removeButton);

    preview.appendChild(wrapper);
    preview.hidden = false;
}


/* ============================================================
 * 22. VOICE RECORDING
 * ============================================================ */

/**
 * Format a duration in seconds as MM:SS.
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatRecordingTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


/**
 * Start recording audio using the browser's MediaRecorder API.
 */
async function startVoiceRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
        toast("Voice recording is not supported in this browser.");
        return;
    }

    if (!window.MediaRecorder) {
        toast("Audio recording is unavailable on this device.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        recordChunks = [];

        recorder = new MediaRecorder(stream);

        recorder.addEventListener("dataavailable", (event) => {
            if (event.data && event.data.size > 0) {
                recordChunks.push(event.data);
            }
        });

        recorder.addEventListener("stop", () => {
            const mimeType =
                recorder?.mimeType || "audio/webm";

            const audioBlob = new Blob(recordChunks, {
                type: mimeType
            });

            stream.getTracks().forEach((track) => {
                track.stop();
            });

            clearInterval(recordInterval);
            recordInterval = null;

            const recordingIndicator = $("coupleRecordingIndicator");

            if (recordingIndicator) {
                recordingIndicator.hidden = true;
            }

            if (audioBlob.size > 0) {
                prepareVoiceMessage(audioBlob);
            }

            recorder = null;
        });

        recorder.start();

        recordStarted = Date.now();

        const indicator = $("coupleRecordingIndicator");

        if (indicator) {
            indicator.hidden = false;
        }

        clearInterval(recordInterval);

        recordInterval = setInterval(() => {
            const elapsed = Math.floor(
                (Date.now() - recordStarted) / 1000
            );

            const timer = $("coupleRecordingTimer");

            if (timer) {
                timer.textContent =
                    formatRecordingTime(elapsed);
            }
        }, 500);

        toast("Recording started.");
    } catch (error) {
        console.error("Unable to start voice recording:", error);

        toast("Microphone permission is required.");
    }
}


/**
 * Prepare the recorded audio for local preview.
 *
 * The recorded audio is not sent to the partner by this function.
 *
 * @param {Blob} audioBlob
 */
function prepareVoiceMessage(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);

    const preview = $("coupleAttachmentPreview");

    if (!preview) {
        toast("Recording ready, but preview is unavailable.");
        return;
    }

    clearAttachmentPreview();

    currentAttachmentUrl = audioUrl;

    const wrapper = document.createElement("div");

    wrapper.className = "attachment-preview-item";

    const audio = document.createElement("audio");

    audio.controls = true;
    audio.src = audioUrl;

    const label = document.createElement("span");

    label.textContent = "Voice recording ready";

    wrapper.appendChild(audio);
    wrapper.appendChild(label);

    preview.appendChild(wrapper);
    preview.hidden = false;

    toast("Voice recording ready to preview.");
}


/**
 * Stop the current recording.
 */
function stopVoiceRecording() {
    if (
        recorder &&
        recorder.state !== "inactive"
    ) {
        recorder.stop();
    }
}


/* ============================================================
 * END OF PART 3
 *
 * Paste Part 4 below this line.
 * ============================================================ */
/* ============================================================
 * UTANEXA — COUPLE CHAT
 * PART 4/4
 *
 * Features:
 * - Event initialization
 * - Emoji picker controls
 * - Message composer events
 * - Quick actions
 * - Attachment selection
 * - Voice recording controls
 * - Keyboard shortcuts
 * - Initial rendering
 * ============================================================ */


/* ============================================================
 * 23. ELEMENT EVENT HELPER
 * ============================================================ */

/**
 * Register an event listener if the element exists.
 *
 * @param {string} id
 * @param {string} eventName
 * @param {Function} callback
 */
function on(id, eventName, callback) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.addEventListener(eventName, callback);
}


/* ============================================================
 * 24. EMOJI PICKER EVENTS
 * ============================================================ */

function initializeEmojiPicker() {
    on("coupleEmojiButton", "click", () => {
        toggleEmojiPicker();
    });

    on("coupleEmojiClose", "click", () => {
        toggleEmojiPicker(false);
    });

    on("coupleEmojiSearch", "input", (event) => {
        const query = event.target.value.trim().toLowerCase();
        const container = $("coupleEmojiGrid");

        if (!container) {
            return;
        }

        container.replaceChildren();

        const allEmojis = EMOJI_CATEGORIES.flatMap(
            category => category.items
        );

        const uniqueEmojis = [...new Set(allEmojis)];

        const results = query
            ? uniqueEmojis.filter(emoji => emoji.includes(query))
            : getSelectedEmojis();

        results.forEach(emoji => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "emoji-item";
            button.textContent = emoji;

            button.addEventListener("click", () => {
                insertEmoji(emoji);
            });

            container.appendChild(button);
        });
    });
}


/* ============================================================
 * 25. COMPOSER EVENTS
 * ============================================================ */

function initializeComposer() {
    on("coupleMessageInput", "keydown", handleComposerKeydown);

    on("coupleMessageInput", "input", () => {
        updateComposerCounter();
        notifyTyping();
    });

    on("coupleSendButton", "click", () => {
        const input = $("coupleMessageInput");

        if (input) {
            sendText(input.value);
        }
    });

    updateComposerCounter();
}


/* ============================================================
 * 26. QUICK ACTION EVENTS
 * ============================================================ */

function initializeQuickActions() {
    document.querySelectorAll("[data-quick-action]").forEach(button => {
        button.addEventListener("click", () => {
            handleQuickAction(button.dataset.quickAction);
        });
    });

    on("coupleLoveAction", "click", () => {
        handleQuickAction("love");
    });

    on("coupleMemoryAction", "click", () => {
        handleQuickAction("memory");
    });

    on("coupleQuestionAction", "click", () => {
        handleQuickAction("question");
    });

    on("coupleGameAction", "click", () => {
        handleQuickAction("game");
    });
}


/* ============================================================
 * 27. MOOD SELECTOR EVENTS
 * ============================================================ */

function initializeMoodSelector() {
    const grid = $("coupleMoodGrid");

    if (grid) {
        grid.querySelectorAll("[data-mode]").forEach(button => {
            button.addEventListener("click", () => {
                setMode(button.dataset.mode, true);

                const modal = $("coupleMoodModal");

                if (modal) {
                    modal.hidden = true;
                }
            });
        });
    }

    on("coupleHeaderMood", "click", () => {
        const modal = $("coupleMoodModal");

        if (modal) {
            modal.hidden = !modal.hidden;
        }
    });

    on("coupleMoodClose", "click", () => {
        const modal = $("coupleMoodModal");

        if (modal) {
            modal.hidden = true;
        }
    });
}


/* ============================================================
 * 28. ATTACHMENT EVENTS
 * ============================================================ */

function initializeAttachments() {
    on("coupleAttachmentButton", "click", () => {
        $("coupleAttachmentInput")?.click();
    });

    on("coupleAttachmentInput", "change", event => {
        const file = event.target.files?.[0];

        if (file) {
            previewAttachment(file);
        }

        // Allow selecting the same file again.
        event.target.value = "";
    });

    on("coupleAttachmentCancel", "click", () => {
        clearAttachmentPreview();
    });
}


/* ============================================================
 * 29. VOICE RECORDING EVENTS
 * ============================================================ */

function initializeVoiceRecording() {
    on("coupleVoiceButton", "click", async () => {
        if (recorder && recorder.state === "recording") {
            stopVoiceRecording();
            return;
        }

        await startVoiceRecording();
    });

    on("coupleStopRecording", "click", () => {
        stopVoiceRecording();
    });
}


/* ============================================================
 * 30. GLOBAL KEYBOARD EVENTS
 * ============================================================ */

function initializeKeyboardShortcuts() {
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            toggleEmojiPicker(false);

            const moodModal = $("coupleMoodModal");

            if (moodModal) {
                moodModal.hidden = true;
            }
        }
    });

    document.addEventListener("click", event => {
        const picker = $("coupleEmojiPicker");
        const button = $("coupleEmojiButton");

        if (
            picker &&
            !picker.hidden &&
            !picker.contains(event.target) &&
            !button?.contains(event.target)
        ) {
            toggleEmojiPicker(false);
        }
    });
}


/* ============================================================
 * 31. INITIALIZE CHAT
 * ============================================================ */

/**
 * Initialize the couple-chat interface.
 */
function initializeCoupleChat() {
    // Restore locally saved messages.
    messages = loadMessages();

    // Render conversation history.
    renderMessages();

    // Restore the selected mood.
    const validMode = MODES.some(
        ([mode]) => mode === currentMode
    );

    if (!validMode) {
        currentMode = "calm";
    }

    document.body.dataset.coupleMode = currentMode;

    // Initialize interactive components.
    initializeEmojiPicker();
    initializeComposer();
    initializeQuickActions();
    initializeMoodSelector();
    initializeAttachments();
    initializeVoiceRecording();
    initializeKeyboardShortcuts();

    // Render mood-related visuals.
    makeMoodEffects();

    // Render default suggestions.
    updateSuggestions();

    // Initialize partner status.
    setStatus("Connecting…", false);

    console.info("[UtaNexa] Couple chat interface initialized.");
}


/* ============================================================
 * 32. SAFE INITIALIZATION
 * ============================================================ */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeCoupleChat,
        { once: true }
    );
} else {
    initializeCoupleChat();
}


/* ============================================================
 * END OF PART 4
 * UTANEXA COUPLE CHAT
 * ============================================================ */

})();
