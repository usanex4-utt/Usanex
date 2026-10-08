/* =========================================================
   USANEX COUPLE CHAT
   Frontend controller
========================================================= */

(() => {
    "use strict";


    /* =====================================================
       CONFIG
    ====================================================== */

    const API = {
        analyze: "/api/couple-chat/analyze",
        message: "/api/couple-chat/message",
        history: "/api/couple-chat/history",
        memories: "/api/couple-chat/memories"
    };


    const WS_BASE =
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;


    const STORAGE_KEY =
        "usanex_couple_chat_messages_v10";


    const MODE_STORAGE_KEY =
        "usanex_couple_chat_mode_v10";


    const RECENT_EMOJI_KEY =
        "usanex_recent_emojis_v10";


    /* =====================================================
       26 MODES
    ====================================================== */

    const COUPLE_MODES = {

        romantic: {
            name: "Romantic",
            emoji: "❤️",
            suggestions: [
                "I just want to be close to you ❤️",
                "You make my heart feel safe.",
                "I love having you in my life."
            ]
        },

        deep_love: {
            name: "Deep Love",
            emoji: "💗",
            suggestions: [
                "You mean more to me than words can explain.",
                "I feel deeply connected to you.",
                "I want us to keep growing together."
            ]
        },

        happy: {
            name: "Happy",
            emoji: "😊",
            suggestions: [
                "You made my day better 😊",
                "I am so happy with you.",
                "Let's make today special."
            ]
        },

        funny: {
            name: "Funny",
            emoji: "😂",
            suggestions: [
                "Okay, now make me laugh 😂",
                "Challenge accepted!",
                "You are seriously too funny."
            ]
        },

        sad: {
            name: "Sad",
            emoji: "😢",
            suggestions: [
                "I don't feel okay right now.",
                "Can you stay with me?",
                "I just need you right now."
            ]
        },

        emotional: {
            name: "Emotional",
            emoji: "🥹",
            suggestions: [
                "That really touched my heart.",
                "I don't know how to explain what I feel.",
                "You matter to me so much."
            ]
        },

        angry: {
            name: "Angry",
            emoji: "😡",
            suggestions: [
                "I am upset right now.",
                "Give me a little time.",
                "I want us to talk calmly."
            ]
        },

        frustrated: {
            name: "Frustrated",
            emoji: "😤",
            suggestions: [
                "Today has been really difficult.",
                "I need to clear my head.",
                "Can we talk about this?"
            ]
        },

        caring: {
            name: "Caring",
            emoji: "🫶",
            suggestions: [
                "Did you eat?",
                "Please take care of yourself.",
                "I am here if you need me."
            ]
        },

        comfort: {
            name: "Comfort",
            emoji: "🤗",
            suggestions: [
                "Come here, everything will be okay.",
                "You don't have to handle this alone.",
                "I am with you."
            ]
        },

        flirty: {
            name: "Flirty",
            emoji: "😏",
            suggestions: [
                "Why are you looking so cute today? 😏",
                "Someone is making me smile.",
                "You know exactly what you're doing."
            ]
        },

        passionate: {
            name: "Passionate",
            emoji: "🔥",
            suggestions: [
                "There is something special between us.",
                "You have my whole attention.",
                "I can't stop thinking about you."
            ]
        },

        good_night: {
            name: "Good Night",
            emoji: "🌙",
            suggestions: [
                "Good night ❤️",
                "Sleep well, my favorite person.",
                "See you in my dreams."
            ]
        },

        good_morning: {
            name: "Good Morning",
            emoji: "🌅",
            suggestions: [
                "Good morning ❤️",
                "Hope you have a beautiful day.",
                "You were the first thing I thought about."
            ]
        },

        memory: {
            name: "Memory",
            emoji: "📸",
            suggestions: [
                "Remember when we first talked?",
                "That memory still makes me smile.",
                "Let's make another beautiful memory."
            ]
        },

        celebration: {
            name: "Celebration",
            emoji: "🎉",
            suggestions: [
                "We did it! 🎉",
                "This deserves a celebration.",
                "I am so proud of us."
            ]
        },

        birthday: {
            name: "Birthday",
            emoji: "🎂",
            suggestions: [
                "Happy birthday ❤️",
                "I hope your day is amazing.",
                "You deserve all the happiness."
            ]
        },

        future_marriage: {
            name: "Future / Marriage",
            emoji: "💍",
            suggestions: [
                "Where do you see us in five years?",
                "I want to build a future with you.",
                "Let's talk about our dreams."
            ]
        },

        missing_you: {
            name: "Missing You",
            emoji: "🥺",
            suggestions: [
                "I really miss you.",
                "Wish you were here.",
                "I can't wait to see you."
            ]
        },

        apology: {
            name: "Apology",
            emoji: "🙏",
            suggestions: [
                "I am sorry.",
                "I didn't mean to hurt you.",
                "Can we talk about it?"
            ]
        },

        appreciation: {
            name: "Appreciation",
            emoji: "🥰",
            suggestions: [
                "Thank you for always being there.",
                "I really appreciate you.",
                "You make my life better."
            ]
        },

        game: {
            name: "Game / Challenge",
            emoji: "🎮",
            suggestions: [
                "Truth or dare?",
                "Let's play a quick game.",
                "I have a challenge for you 😏"
            ]
        },

        photo_memory: {
            name: "Photo Memory",
            emoji: "🖼️",
            suggestions: [
                "Look at this memory ❤️",
                "This photo brings back so many memories.",
                "We need more moments like this."
            ]
        },

        serious_talk: {
            name: "Serious Talk",
            emoji: "🗣️",
            suggestions: [
                "Can we talk seriously?",
                "There is something on my mind.",
                "I want us to understand each other."
            ]
        },

        deep_conversation: {
            name: "Deep Conversation",
            emoji: "💭",
            suggestions: [
                "What is something you never tell anyone?",
                "What does love mean to you?",
                "Tell me what is really on your mind."
            ]
        },

        calm: {
            name: "Calm / Peaceful",
            emoji: "😌",
            suggestions: [
                "Let's just enjoy this moment.",
                "No pressure, just us.",
                "Everything feels peaceful right now."
            ]
        }

    };


    /* =====================================================
       DOM
    ====================================================== */

    const $ = (selector) =>
        document.querySelector(selector);


    const app = $("#coupleApp");

    const backButton = $("#coupleBackButton");

    const avatarButton = $("#coupleAvatarButton");

    const partnerAvatar = $("#couplePartnerAvatar");

    const partnerName = $("#couplePartnerName");

    const partnerStatus = $("#couplePartnerStatus");

    const onlineDot = $("#coupleOnlineDot");

    const headerMood = $("#coupleHeaderMood");

    const menuButton = $("#coupleMenuButton");

    const aiButton = $("#coupleAiButton");

    const aiStatus = $("#coupleAiStatus");

    const messagesEl = $("#coupleMessages");

    const conversation = $("#coupleConversation");

    const input = $("#coupleMessageInput");

    const composer = $("#coupleComposer");

    const emojiButton = $("#coupleEmojiButton");

    const attachButton = $("#coupleAttachButton");

    const cameraButton = $("#coupleCameraButton");

    const sendButton = $("#coupleSendButton");

    const fileInput = $("#coupleFileInput");

    const moodOverlay = $("#coupleMoodOverlay");

    const moodGrid = $("#coupleMoodGrid");

    const closeMood = $("#closeMoodPanel");

    const aiOverlay = $("#coupleAiOverlay");

    const closeAi = $("#closeAiPanel");

    const menuOverlay = $("#coupleMenuOverlay");

    const closeMenu = $("#closeCoupleMenu");

    const typingEl = $("#coupleTyping");

    const typingName = $("#coupleTypingName");

    const suggestionsEl = $("#coupleSuggestions");

    const suggestionList = $("#coupleSuggestionList");

    const effectsLayer = $("#coupleEffectsLayer");

    const dayLabel = $("#coupleDayLabel");

    const togetherDays = $("#coupleTogetherDays");

    const connectionStatus = $("#coupleConnectionStatus");


    /* =====================================================
       STATE
    ====================================================== */

    let currentMode =
        localStorage.getItem(MODE_STORAGE_KEY) || "calm";


    let messages =
        loadMessages();


    let socket = null;

    let socketReady = false;

    let reconnectTimer = null;

    let typingTimer = null;

    let partnerTyping = false;

    let manualMood = false;

    let emojiPicker = null;


    const partner = readPartner();


    /* =====================================================
       INITIALIZATION
    ====================================================== */

    function init() {

        applyPartner();

        applyAutomaticTimeMood();

        renderMessages();

        updateMoodTheme();

        updateConnectionText();

        setupEvents();

        updateDayLabel();

        showWelcomeIfEmpty();

        loadHistory();

        connectWebSocket();

        setInterval(updateAutomaticNightState, 60 * 1000);

        window.UsanexCoupleChat = {
            sendMessage,
            setMode,
            connectWebSocket,
            getMessages: () => messages
        };

        window.UsanexCoupleModes = COUPLE_MODES;
    }


    /* =====================================================
       PARTNER
    ====================================================== */

    function readPartner() {

        const params =
            new URLSearchParams(window.location.search);

        return {

            id:
                params.get("partner_id") ||
                params.get("user_id") ||
                params.get("id") ||
                "",

            name:
                params.get("name") ||
                params.get("partner") ||
                "Partner",

            avatar:
                params.get("avatar") ||
                "/static/images/default-profile.png",

            online:
                params.get("online") === "true"

        };
    }


    function applyPartner() {

        partnerName.textContent =
            partner.name;


        partnerAvatar.src =
            partner.avatar;


        partnerAvatar.onerror = () => {

            partnerAvatar.src =
                "/static/images/default-profile.png";

        };


        setOnlineStatus(
            partner.online,
            null
        );
    }


    /* =====================================================
       EVENTS
    ====================================================== */

    function setupEvents() {

        backButton?.addEventListener(
            "click",
            () => {

                if (history.length > 1) {
                    history.back();
                } else {
                    window.location.href = "/chat";
                }

            }
        );


        avatarButton?.addEventListener(
            "click",
            () => {

                if (partner.id) {

                    window.location.href =
                        `/profile?user_id=${encodeURIComponent(partner.id)}`;

                }

            }
        );


        headerMood?.addEventListener(
            "click",
            openMood
        );


        menuButton?.addEventListener(
            "click",
            openMenu
        );


        aiButton?.addEventListener(
            "click",
            openAi
        );


        closeMood?.addEventListener(
            "click",
            closeMoodPanel
        );


        closeAi?.addEventListener(
            "click",
            closeAiPanel
        );


        closeMenu?.addEventListener(
            "click",
            closeMenuPanel
        );


        moodOverlay?.addEventListener(
            "click",
            (event) => {

                if (event.target === moodOverlay) {
                    closeMoodPanel();
                }

            }
        );


        aiOverlay?.addEventListener(
            "click",
            (event) => {

                if (event.target === aiOverlay) {
                    closeAiPanel();
                }

            }
        );


        menuOverlay?.addEventListener(
            "click",
            (event) => {

                if (event.target === menuOverlay) {
                    closeMenuPanel();
                }

            }
        );


        moodGrid?.addEventListener(
            "click",
            (event) => {

                const button =
                    event.target.closest("[data-mode]");

                if (!button) return;

                setMode(
                    button.dataset.mode,
                    true
                );

                closeMoodPanel();

            }
        );


        composer?.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                sendMessage();

            }
        );


        input?.addEventListener(
            "input",
            handleInput
        );


        emojiButton?.addEventListener(
            "click",
            toggleEmojiPicker
        );


        attachButton?.addEventListener(
            "click",
            () => {

                fileInput.removeAttribute("capture");

                fileInput.click();

            }
        );


        cameraButton?.addEventListener(
            "click",
            () => {

                fileInput.setAttribute(
                    "capture",
                    "environment"
                );

                fileInput.click();

            }
        );


        fileInput?.addEventListener(
            "change",
            handleFiles
        );


        document
            .querySelectorAll(".couple-action")
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


        document
            .querySelectorAll("[data-ai-action]")
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


        document
            .querySelectorAll("[data-menu-action]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        handleMenuAction(
                            button.dataset.menuAction
                        );

                    }
                );

            });


        document.addEventListener(
            "click",
            (event) => {

                if (
                    emojiPicker &&
                    !emojiPicker.contains(event.target) &&
                    event.target !== emojiButton
                ) {
                    removeEmojiPicker();
                }

            }
        );


        window.addEventListener(
            "beforeunload",
            () => {

                sendPresence("offline");

            }
        );

    }


    /* =====================================================
       MOOD
    ====================================================== */

    function setMode(
        mode,
        manual = false
    ) {

        if (!COUPLE_MODES[mode]) {
            mode = "calm";
        }


        currentMode = mode;

        manualMood = manual;


        localStorage.setItem(
            MODE_STORAGE_KEY,
            currentMode
        );


        updateMoodTheme();

        updateSuggestions();

        sendMoodToServer();

    }


    function updateMoodTheme() {

        document.body.dataset.coupleMode =
            currentMode;


        const mode =
            COUPLE_MODES[currentMode];


        if (!mode) return;


        headerMood.title =
            `Current mood: ${mode.name}`;


        document.documentElement.style.setProperty(
            "--mood-primary",
            getComputedStyle(document.body)
                .getPropertyValue("--mood-primary")
        );

    }


    function openMood() {

        moodOverlay.classList.remove("hidden");

        highlightCurrentMood();

    }


    function closeMoodPanel() {

        moodOverlay.classList.add("hidden");

    }


    function highlightCurrentMood() {

        moodGrid
            ?.querySelectorAll("[data-mode]")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.mode === currentMode
                );

            });

    }


    /* =====================================================
       AUTOMATIC TIME / NIGHT
    ====================================================== */

    function applyAutomaticTimeMood() {

        const hour =
            new Date().getHours();


        if (manualMood) return;


        if (hour >= 5 && hour < 11) {

            setMode("good_morning", false);

        } else if (hour >= 22 || hour < 5) {

            setMode("good_night", false);

        } else {

            setMode("calm", false);

        }

    }


    function updateAutomaticNightState() {

        const hour =
            new Date().getHours();


        const night =
            hour >= 21 || hour < 6;


        document.body.classList.toggle(
            "night-mode",
            night
        );

    }


    /* =====================================================
       SEND MESSAGE
    ====================================================== */

    async function sendMessage(
        customText = null,
        messageType = "text"
    ) {

        const text =
            customText !== null
                ? String(customText).trim()
                : input.value.trim();


        if (!text) return;


        const message = {

            id:
                createMessageId(),

            client_id:
                createMessageId(),

            sender_id:
                getCurrentUserId(),

            receiver_id:
                partner.id || null,

            text,

            message_type:
                messageType,

            created_at:
                new Date().toISOString(),

            status:
                "sent",

            is_mine:
                true

        };


        messages.push(message);

        saveMessages();

        renderMessages();

        scrollToBottom(true);


        if (customText === null) {
            input.value = "";
        }


        stopTyping();


        /* WebSocket first */

        if (socketReady) {

            sendSocket({

                type: "message",

                message

            });

        }


        /* REST fallback */

        try {

            const response =
                await fetch(
                    API.message,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            partner_id:
                                partner.id || null,

                            message:
                                text,

                            message_type:
                                messageType,

                            client_id:
                                message.client_id
                        })
                    }
                );


            if (response.ok) {

                const data =
                    await response.json()
                        .catch(() => ({}));


                updateMessageFromServer(
                    message.client_id,
                    data
                );

            }

        } catch (error) {

            console.debug(
                "Couple message REST unavailable",
                error
            );

        }


        analyzeMessage(text);

    }


    /* =====================================================
       MESSAGE ANALYSIS
    ====================================================== */

    async function analyzeMessage(text) {

        try {

            const response =
                await fetch(
                    API.analyze,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            message: text,

                            current_mode:
                                currentMode,

                            partner_id:
                                partner.id || null

                        })
                    }
                );


            if (!response.ok) return;


            const data =
                await response.json();


            if (
                data.mode &&
                COUPLE_MODES[data.mode] &&
                !manualMood
            ) {

                setMode(
                    data.mode,
                    false
                );

            }


            if (data.response) {

                aiStatus.textContent =
                    data.response;

            } else {

                aiStatus.textContent =
                    "Understanding your conversation...";

            }


            if (Array.isArray(data.suggestions)) {

                showSuggestions(
                    data.suggestions
                );

            }

        } catch (error) {

            console.debug(
                "AI analysis unavailable",
                error
            );

        }

    }


    /* =====================================================
       MESSAGE RENDERING
    ====================================================== */

    function renderMessages() {

        messagesEl.innerHTML = "";


        if (!messages.length) {
            return;
        }


        messages.forEach(message => {

            const row =
                document.createElement("div");


            const mine =
                isOwnMessage(message);


            row.className =
                `couple-message-row ${
                    mine ? "mine" : "partner"
                }`;


            const bubble =
                document.createElement("article");


            bubble.className =
                `couple-message ${
                    mine ? "mine" : "partner"
                }`;


            bubble.dataset.messageId =
                message.client_id ||
                message.id;


            if (
                message.message_type === "image" &&
                message.media_url
            ) {

                const image =
                    document.createElement("img");

                image.className =
                    "couple-message-image";

                image.src =
                    message.media_url;

                image.alt =
                    "Photo";

                bubble.appendChild(image);

            }


            if (message.text) {

                const text =
                    document.createElement("div");

                text.className =
                    "couple-message-text";

                text.textContent =
                    message.text;

                bubble.appendChild(text);

            }


            const meta =
                document.createElement("div");

            meta.className =
                "couple-message-meta";


            const time =
                document.createElement("span");

            time.className =
                "couple-message-time";

            time.textContent =
                formatTime(
                    message.created_at
                );


            meta.appendChild(time);


            if (mine) {

                const status =
                    document.createElement("span");

                status.className =
                    `couple-message-status ${
                        message.status || "sent"
                    }`;

                status.dataset.statusFor =
                    message.client_id ||
                    message.id;

                status.textContent =
                    getStatusTicks(
                        message.status
                    );

                meta.appendChild(status);

            }


            bubble.appendChild(meta);

            row.appendChild(bubble);

            messagesEl.appendChild(row);

        });


        updateMoodTheme();

    }


    function getStatusTicks(status) {

        if (status === "seen") {
            return "✓✓";
        }

        if (status === "delivered") {
            return "✓✓";
        }

        return "✓";
    }


    function isOwnMessage(message) {

        if (
            typeof message.is_mine === "boolean"
        ) {
            return message.is_mine;
        }


        const current =
            getCurrentUserId();


        return (
            message.sender_id &&
            current &&
            String(message.sender_id) ===
            String(current)
        );

    }


    /* =====================================================
       SERVER MESSAGE UPDATE
    ====================================================== */

    function updateMessageFromServer(
        clientId,
        data
    ) {

        const message =
            messages.find(
                item =>
                    item.client_id === clientId
            );


        if (!message) return;


        if (data.id) {
            message.id = data.id;
        }


        if (data.status) {

            message.status =
                normalizeStatus(
                    data.status
                );

        }


        if (data.delivered_at) {

            message.delivered_at =
                data.delivered_at;

            if (message.status !== "seen") {
                message.status = "delivered";
            }

        }


        if (data.seen_at) {

            message.seen_at =
                data.seen_at;

            message.status = "seen";

        }


        saveMessages();

        updateMessageStatusUI(
            clientId,
            message.status
        );

    }


    function updateMessageStatusUI(
        messageId,
        status
    ) {

        const element =
            document.querySelector(
                `.couple-message-status[data-status-for="${CSS.escape(messageId)}"]`
            );


        if (!element) {
            renderMessages();
            return;
        }


        element.className =
            `couple-message-status ${status}`;


        element.textContent =
            getStatusTicks(status);

    }


    function normalizeStatus(status) {

        if (
            status === "seen" ||
            status === "read"
        ) {
            return "seen";
        }

        if (
            status === "delivered" ||
            status === "delivery"
        ) {
            return "delivered";
        }

        return "sent";

    }


    /* =====================================================
       HISTORY
    ====================================================== */

    async function loadHistory() {

        try {

            const url =
                partner.id
                    ? `${API.history}?partner_id=${encodeURIComponent(partner.id)}`
                    : API.history;


            const response =
                await fetch(url);


            if (!response.ok) return;


            const data =
                await response.json();


            const serverMessages =
                Array.isArray(data)
                    ? data
                    : (
                        Array.isArray(data.messages)
                            ? data.messages
                            : []
                    );


            if (!serverMessages.length) {
                return;
            }


            messages =
                mergeMessages(
                    messages,
                    serverMessages
                );


            saveMessages();

            renderMessages();

            scrollToBottom(false);

        } catch (error) {

            console.debug(
                "History unavailable",
                error
            );

        }

    }


    function mergeMessages(
        local,
        server
    ) {

        const map =
            new Map();


        [...local, ...server]
            .forEach(message => {

                const key =
                    message.client_id ||
                    message.id ||
                    createMessageId();


                map.set(
                    String(key),
                    normalizeMessage(message)
                );

            });


        return Array.from(map.values())
            .sort(
                (a, b) =>
                    new Date(a.created_at) -
                    new Date(b.created_at)
            );

    }


    function normalizeMessage(message) {

        return {

            ...message,

            status:
                normalizeStatus(
                    message.status
                ),

            is_mine:
                isOwnMessage(message)

        };

    }


    /* =====================================================
       WEBSOCKET
    ====================================================== */

    function connectWebSocket() {

        if (!partner.id) {

            setConnectionState(false);

            return;

        }


        clearTimeout(reconnectTimer);


        const spaceId =
            getCoupleSpaceId();


        const url =
            `${WS_BASE}/ws/couple-chat/${encodeURIComponent(spaceId)}`;


        try {

            socket =
                new WebSocket(url);

        } catch (error) {

            setConnectionState(false);

            scheduleReconnect();

            return;

        }


        socket.addEventListener(
            "open",
            () => {

                socketReady = true;

                setConnectionState(true);

                sendSocket({
                    type: "presence",
                    status: "online"
                });

            }
        );


        socket.addEventListener(
            "message",
            handleSocketMessage
        );


        socket.addEventListener(
            "close",
            () => {

                socketReady = false;

                setConnectionState(false);

                scheduleReconnect();

            }
        );


        socket.addEventListener(
            "error",
            () => {

                socketReady = false;

                setConnectionState(false);

            }
        );

    }


    function scheduleReconnect() {

        clearTimeout(reconnectTimer);


        reconnectTimer =
            setTimeout(
                connectWebSocket,
                4000
            );

    }


    function sendSocket(payload) {

        if (
            !socket ||
            socket.readyState !== WebSocket.OPEN
        ) {
            return false;
        }


        try {

            socket.send(
                JSON.stringify(payload)
            );

            return true;

        } catch (error) {

            return false;

        }

    }


    function handleSocketMessage(event) {

        let data;


        try {

            data =
                JSON.parse(event.data);

        } catch {

            return;

        }


        switch (data.type) {

            case "message":
                receiveSocketMessage(
                    data.message || data
                );
                break;


            case "message_status":
            case "status":
                handleMessageStatus(data);
                break;


            case "presence":
                handlePresence(data);
                break;


            case "typing":
                handleTypingEvent(data);
                break;


            case "read":
                handleMessageStatus({
                    ...data,
                    status: "seen"
                });
                break;

        }

    }


    function receiveSocketMessage(message) {

        const normalized =
            normalizeMessage({
                ...message,

                is_mine:
                    false,

                status:
                    message.status ||
                    "delivered"

            });


        const exists =
            messages.some(
                item =>
                    (
                        item.id &&
                        normalized.id &&
                        String(item.id) ===
                        String(normalized.id)
                    ) ||
                    (
                        item.client_id &&
                        normalized.client_id &&
                        item.client_id ===
                        normalized.client_id
                    )
            );


        if (!exists) {

            messages.push(normalized);

            saveMessages();

            renderMessages();

            scrollToBottom(true);

        }


        sendDeliveryAck(
            normalized
        );


        markMessageSeen(
            normalized
        );

    }


    function handleMessageStatus(data) {

        const id =
            data.client_id ||
            data.message_id ||
            data.id;


        if (!id) return;


        const message =
            messages.find(
                item =>
                    item.client_id === id ||
                    String(item.id) === String(id)
            );


        if (!message) return;


        const status =
            normalizeStatus(
                data.status
            );


        if (
            status === "seen" ||
            (
                status === "delivered" &&
                message.status === "sent"
            )
        ) {

            message.status =
                status;

        }


        if (data.delivered_at) {
            message.delivered_at =
                data.delivered_at;
        }


        if (data.seen_at) {
            message.seen_at =
                data.seen_at;
        }


        saveMessages();

        updateMessageStatusUI(
            message.client_id || message.id,
            message.status
        );

    }


    function sendDeliveryAck(message) {

        sendSocket({
            type: "delivered",
            message_id:
                message.id ||
                message.client_id
        });

    }


    function markMessageSeen(message) {

        sendSocket({
            type: "seen",
            message_id:
                message.id ||
                message.client_id
        });

    }


    /* =====================================================
       PRESENCE
    ====================================================== */

    function setConnectionState(online) {

        if (online) {

            setOnlineStatus(
                true,
                null
            );

        } else {

            setOnlineStatus(
                false,
                partner.last_seen
            );

        }

    }


    function setOnlineStatus(
        online,
        lastSeen
    ) {

        onlineDot.hidden =
            !online;


        if (online) {

            partnerStatus.textContent =
                "Online";

            partnerStatus.classList.add(
                "online"
            );

            partnerStatus.classList.remove(
                "typing"
            );

        } else {

            partnerStatus.textContent =
                formatLastSeen(lastSeen);

            partnerStatus.classList.remove(
                "online",
                "typing"
            );

        }

    }


    function handlePresence(data) {

        const online =
            data.status === "online" ||
            data.online === true;


        partner.last_seen =
            data.last_seen ||
            data.last_seen_at ||
            partner.last_seen;


        setOnlineStatus(
            online,
            partner.last_seen
        );

    }


    function sendPresence(status) {

        sendSocket({
            type: "presence",
            status
        });

    }


    function updateConnectionText() {

        connectionStatus.textContent =
            "Connected";

    }


    /* =====================================================
       TYPING
    ====================================================== */

    function handleInput() {

        sendTyping(true);


        clearTimeout(typingTimer);


        typingTimer =
            setTimeout(
                () => sendTyping(false),
                1400
            );

    }


    function sendTyping(isTyping) {

        sendSocket({
            type: "typing",
            typing: isTyping
        });

    }


    function stopTyping() {

        clearTimeout(typingTimer);

        sendTyping(false);

    }


    function handleTypingEvent(data) {

        const typing =
            data.typing === true;


        partnerTyping =
            typing;


        typingEl.hidden =
            !typing;


        typingName.textContent =
            partner.name;


        if (typing) {

            partnerStatus.textContent =
                "typing...";

            partnerStatus.classList.add(
                "typing"
            );

            partnerStatus.classList.remove(
                "online"
            );

        } else {

            setOnlineStatus(
                data.online !== false,
                data.last_seen
            );

        }

    }


    /* =====================================================
       QUICK ACTIONS
    ====================================================== */

    function handleQuickAction(action) {

        const modeMap = {

            love: "romantic",

            memory: "memory",

            question: "deep_conversation",

            game: "game"

        };


        if (modeMap[action]) {

            setMode(
                modeMap[action],
                true
            );

        }


        const mode =
            COUPLE_MODES[
                modeMap[action] || currentMode
            ];


        if (!mode) return;


        if (mode.suggestions?.length) {

            showSuggestions(
                mode.suggestions
            );

        }

    }


    /* =====================================================
       SUGGESTIONS
    ====================================================== */

    function updateSuggestions() {

        const mode =
            COUPLE_MODES[currentMode];


        if (!mode) return;


        showSuggestions(
            mode.suggestions
        );

    }


    function showSuggestions(items) {

        if (!Array.isArray(items) || !items.length) {

            suggestionsEl.hidden = true;

            return;

        }


        suggestionList.innerHTML = "";


        items.slice(0, 5)
            .forEach(text => {

                const button =
                    document.createElement("button");


                button.type =
                    "button";


                button.className =
                    "couple-suggestion";


                button.textContent =
                    text;


                button.addEventListener(
                    "click",
                    () => {

                        input.value =
                            text;

                        input.focus();

                        suggestionsEl.hidden =
                            true;

                    }
                );


                suggestionList.appendChild(
                    button
                );

            });


        suggestionsEl.hidden = false;

    }


    /* =====================================================
       AI
    ====================================================== */

    function openAi() {

        aiOverlay.classList.remove(
            "hidden"
        );

    }


    function closeAiPanel() {

        aiOverlay.classList.add(
            "hidden"
        );

    }


    function handleAiAction(action) {

        closeAiPanel();


        switch (action) {

            case "suggest":

                updateSuggestions();

                break;


            case "mood":

                openMood();

                break;


            case "question":

                setMode(
                    "deep_conversation",
                    true
                );

                showSuggestions(
                    COUPLE_MODES.deep_conversation
                        .suggestions
                );

                break;


            case "game":

                setMode(
                    "game",
                    true
                );

                showSuggestions(
                    COUPLE_MODES.game
                        .suggestions
                );

                break;

        }

    }


    /* =====================================================
       MENU
    ====================================================== */

    function openMenu() {

        menuOverlay.classList.remove(
            "hidden"
        );

    }


    function closeMenuPanel() {

        menuOverlay.classList.add(
            "hidden"
        );

    }


    function handleMenuAction(action) {

        closeMenuPanel();


        if (action === "export") {

            exportChat();

        }


        if (action === "clear") {

            clearChat();

        }

    }


    function exportChat() {

        const text =
            messages.map(message => {

                const who =
                    isOwnMessage(message)
                        ? "You"
                        : partner.name;


                return `[${formatDateTime(message.created_at)}] ${who}: ${message.text || "[media]"}`;

            }).join("\n");


        const blob =
            new Blob(
                [text],
                {
                    type: "text/plain;charset=utf-8"
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


    function clearChat() {

        const confirmed =
            window.confirm(
                "Clear this chat from this device?"
            );


        if (!confirmed) return;


        messages = [];

        saveMessages();

        renderMessages();

    }


    /* =====================================================
       EMOJI PICKER
    ====================================================== */

    const EMOJI_CATEGORIES = {

        recent: [
            "❤️","😂","😊","🥰","😍","😘","😭","🥺",
            "😏","🔥","💕","💗","🫶","✨","😘","💋"
        ],

        love: [
            "❤️","🩷","🧡","💛","💚","💙","💜","🖤",
            "🤍","🤎","🩶","💔","❤️‍🔥","💕","💞","💓",
            "💗","💖","💘","💝","💟","❣️","💋","💌",
            "😍","🥰","😘","😚","😙","😗","🫶"
        ],

        smile: [
            "😀","😃","😄","😁","😆","😅","😂","🤣",
            "😊","😇","🙂","🙃","😉","😌","😍","🥰",
            "😘","😗","😙","😚","😋","😛","😝","😜",
            "🤪","🤨","🧐","🤓","😎","🤩","🥳"
        ],

        people: [
            "👋","🤚","🖐️","✋","🖖","👌","🤏","✌️",
            "🤞","🤟","🤘","🤙","👈","👉","👆","👇",
            "☝️","👍","👎","👏","🙌","🙏","🤝","💪",
            "🫶","❤️‍🩹","🫂","💋","👀","🧠"
        ],

        animals: [
            "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼",
            "🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈",
            "🙉","🙊","🐔","🐧","🐦","🐤","🦄","🐝",
            "🦋","🐢","🐍","🐬","🐳","🦈","🐘"
        ],

        food: [
            "🍎","🍊","🍋","🍌","🍉","🍇","🍓","🫐",
            "🍒","🍑","🥭","🍍","🥥","🥝","🍕","🍔",
            "🍟","🌭","🌮","🍿","🍩","🍪","🎂","🍰",
            "🍫","🍭","☕","🧋","🍵","🥤","🍓"
        ],

        activities: [
            "⚽","🏀","🏈","⚾","🎾","🏐","🎮","🎯",
            "🎲","🎸","🎹","🎤","🎧","🎬","🎨","🏆",
            "🏃","🚴","🏊","🧘","💃","🕺","🎉","🎊",
            "🎁","🎈","🎵","🎶","🎮","🎯"
        ],

        travel: [
            "🚗","🚕","🚌","🚎","🏎️","🚓","🚑","🚒",
            "✈️","🚀","🚁","🚢","⛵","🏝️","🏖️","🏕️",
            "🏠","🏡","🏙️","🌆","🌃","🌅","🌄","🌉",
            "🗺️","🧳","🎒","📍","🌎","🌙"
        ],

        objects: [
            "📱","💻","⌚","📷","📸","🎥","💡","🔑",
            "🔒","💎","💍","💰","📚","✏️","📝","📌",
            "📎","💌","📦","🎁","🕯️","🛏️","☂️","🧸",
            "🎀","👑","💄","👗","👟"
        ],

        symbols: [
            "✨","⭐","🌟","💫","🔥","💥","💯","❗",
            "❓","‼️","⁉️","✅","❌","⭕","💢","💤",
            "💭","💬","❤️","💕","☀️","🌙","☁️","🌈",
            "⚡","❄️","🌸","🌹","🌻","🍀"
        ]

    };


    function toggleEmojiPicker() {

        if (emojiPicker) {

            removeEmojiPicker();

            return;

        }


        createEmojiPicker();

    }


    function createEmojiPicker() {

        const panel =
            document.createElement("div");


        panel.className =
            "couple-emoji-picker";


        emojiPicker =
            panel;


        const search =
            document.createElement("input");


        search.className =
            "emoji-search";


        search.placeholder =
            "Search emoji...";


        panel.appendChild(search);


        const categories =
            document.createElement("div");


        categories.className =
            "emoji-categories";


        const categoryIcons = {

            recent: "🕘",

            love: "❤️",

            smile: "😊",

            people: "🫶",

            animals: "🐶",

            food: "🍕",

            activities: "🎮",

            travel: "✈️",

            objects: "📱",

            symbols: "✨"

        };


        Object.keys(EMOJI_CATEGORIES)
            .forEach(
                (category, index) => {

                    const button =
                        document.createElement("button");


                    button.type =
                        "button";


                    button.className =
                        "emoji-category-button";


                    if (index === 0) {
                        button.classList.add(
                            "active"
                        );
                    }


                    button.textContent =
                        categoryIcons[category];


                    button.dataset.category =
                        category;


                    button.addEventListener(
                        "click",
                        () => {

                            categories
                                .querySelectorAll(
                                    ".emoji-category-button"
                                )
                                .forEach(
                                    item =>
                                        item.classList.remove(
                                            "active"
                                        )
                                );


                            button.classList.add(
                                "active"
                            );


                            renderEmojiGrid(
                                grid,
                                category
                            );

                        }
                    );


                    categories.appendChild(
                        button
                    );

                }
            );


        panel.appendChild(
            categories
        );


        const grid =
            document.createElement("div");


        grid.className =
            "emoji-grid";


        panel.appendChild(grid);


        renderEmojiGrid(
            grid,
            "recent"
        );


        search.addEventListener(
            "input",
            () => {

                const query =
                    search.value.trim();


                if (!query) {

                    renderEmojiGrid(
                        grid,
                        "recent"
                    );

                    return;

                }


                const all =
                    Object.values(
                        EMOJI_CATEGORIES
                    ).flat();


                renderEmojiGrid(
                    grid,
                    null,
                    [...new Set(all)]
                );

            }
        );


        document.body.appendChild(
            panel
        );

    }


    function renderEmojiGrid(
        grid,
        category,
        customList = null
    ) {

        grid.innerHTML = "";


        let list;


        if (customList) {

            list = customList;

        } else {

            list =
                EMOJI_CATEGORIES[
                    category
                ] || [];

        }


        list.forEach(emoji => {

            const button =
                document.createElement("button");


            button.type =
                "button";


            button.className =
                "emoji-item";


            button.textContent =
                emoji;


            button.addEventListener(
                "click",
                () => {

                    insertEmoji(
                        emoji
                    );

                }
            );


            grid.appendChild(
                button
            );

        });

    }


    function insertEmoji(emoji) {

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


        input.focus();


        const cursor =
            start + emoji.length;


        input.setSelectionRange(
            cursor,
            cursor
        );


        saveRecentEmoji(
            emoji
        );

    }


    function saveRecentEmoji(emoji) {

        let recent =
            [];


        try {

            recent =
                JSON.parse(
                    localStorage.getItem(
                        RECENT_EMOJI_KEY
                    ) || "[]"
                );

        } catch {}


        recent =
            [
                emoji,
                ...recent.filter(
                    item =>
                        item !== emoji
                )
            ].slice(0, 30);


        localStorage.setItem(
            RECENT_EMOJI_KEY,
            JSON.stringify(recent)
        );

    }


    function removeEmojiPicker() {

        emojiPicker?.remove();

        emojiPicker = null;

    }


    /* =====================================================
       FILES
    ====================================================== */

    async function handleFiles(event) {

        const files =
            Array.from(
                event.target.files || []
            );


        event.target.value = "";


        for (const file of files) {

            if (file.type.startsWith("image/")) {

                await sendImageFile(file);

            } else {

                await sendMessage(
                    `📎 ${file.name}`,
                    "file"
                );

            }

        }

    }


    async function sendImageFile(file) {

        const localUrl =
            URL.createObjectURL(file);


        const message = {

            id:
                createMessageId(),

            client_id:
                createMessageId(),

            sender_id:
                getCurrentUserId(),

            receiver_id:
                partner.id || null,

            text: "",

            message_type:
                "image",

            media_url:
                localUrl,

            created_at:
                new Date().toISOString(),

            status:
                "sent",

            is_mine:
                true

        };


        messages.push(message);

        saveMessages();

        renderMessages();

        scrollToBottom(true);


        /*
         * Real media upload endpoint can be connected later.
         */

        if (socketReady) {

            sendSocket({

                type: "media",

                message

            });

        }

    }


    /* =====================================================
       LOCAL STORAGE
    ====================================================== */

    function loadMessages() {

        try {

            const stored =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || "[]"
                );


            if (Array.isArray(stored)) {
                return stored.map(
                    normalizeMessage
                );
            }

        } catch (error) {

            console.debug(
                "Unable to load couple messages",
                error
            );

        }


        return [];

    }


    function saveMessages() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    messages.slice(-500)
                )
            );

        } catch (error) {

            console.debug(
                "Unable to save couple messages",
                error
            );

        }

    }


    /* =====================================================
       WELCOME
    ====================================================== */

    function showWelcomeIfEmpty() {

        if (messages.length) return;


        const hour =
            new Date().getHours();


        let text;


        if (hour >= 5 && hour < 11) {

            text =
                "Good morning ❤️ Start your beautiful conversation.";

        } else if (
            hour >= 22 ||
            hour < 5
        ) {

            text =
                "Good night 🌙 Your Couple Space is ready.";

        } else {

            text =
                "Welcome to your Couple Space ❤️";

        }


        const welcome = {

            id:
                "welcome-" +
                Date.now(),

            client_id:
                "welcome-" +
                Date.now(),

            sender_id:
                "system",

            text,

            message_type:
                "system",

            created_at:
                new Date().toISOString(),

            status:
                "seen",

            is_mine:
                false

        };


        messages.push(
            welcome
        );


        saveMessages();

        renderMessages();

    }


    /* =====================================================
       HELPERS
    ====================================================== */

    function getCurrentUserId() {

        const keys = [
            "user_id",
            "currentUser",
            "usanexUser",
            "user"
        ];


        for (const key of keys) {

            try {

                const value =
                    localStorage.getItem(
                        key
                    );


                if (!value) continue;


                try {

                    const parsed =
                        JSON.parse(value);


                    if (
                        typeof parsed ===
                        "object"
                    ) {

                        return (
                            parsed.id ||
                            parsed.user_id ||
                            parsed.userId ||
                            parsed.username ||
                            null
                        );

                    }

                } catch {}


                return value;

            } catch {}

        }


        return null;

    }


    function getCoupleSpaceId() {

        const params =
            new URLSearchParams(
                location.search
            );


        return (
            params.get("couple_space_id") ||
            params.get("space_id") ||
            partner.id ||
            "default"
        );

    }


    function createMessageId() {

        return (
            "msg_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 10)
        );

    }


    function formatTime(value) {

        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return "";
        }


        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function formatDateTime(value) {

        const date =
            new Date(value);


        return date.toLocaleString(
            [],
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    }


    function formatLastSeen(value) {

        if (!value) {
            return "Offline";
        }


        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return "Offline";
        }


        return `Last seen ${formatTime(date)}`;

    }


    function updateDayLabel() {

        const today =
            new Date();


        dayLabel.textContent =
            today.toLocaleDateString(
                [],
                {
                    weekday: "long",
                    month: "short",
                    day: "numeric"
                }
            );

    }


    function scrollToBottom(
        smooth = true
    ) {

        requestAnimationFrame(
            () => {

                conversation.scrollTo({
                    top:
                        conversation.scrollHeight,

                    behavior:
                        smooth
                            ? "smooth"
                            : "auto"
                });

            }
        );

    }


    /* =====================================================
       MOOD / SERVER
    ====================================================== */

    async function sendMoodToServer() {

        try {

            await fetch(
                "/api/couple-chat/mood",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        partner_id:
                            partner.id || null,

                        mode:
                            currentMode

                    })
                }
            );

        } catch {

            /*
             * Endpoint may not exist yet.
             * UI continues normally.
             */

        }

    }


    /* =====================================================
       EFFECTS
    ====================================================== */

    function createHeartEffect() {

        if (
            !effectsLayer ||
            ![
                "romantic",
                "deep_love",
                "missing_you",
                "flirty",
                "passionate",
                "appreciation"
            ].includes(currentMode)
        ) {
            return;
        }


        const heart =
            document.createElement("span");


        heart.className =
            "couple-heart-effect";


        heart.textContent =
            Math.random() > .5
                ? "❤️"
                : "💕";


        heart.style.left =
            `${20 + Math.random() * 60}%`;


        heart.style.setProperty(
            "--drift",
            `${-50 + Math.random() * 100}px`
        );


        effectsLayer.appendChild(
            heart
        );


        setTimeout(
            () => heart.remove(),
            3000
        );

    }


    /* =====================================================
       START
    ====================================================== */

    updateAutomaticNightState();

    init();

})();
