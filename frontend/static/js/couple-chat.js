/* =========================================================
   USANEX COUPLE CHAT
   Main Frontend Controller
   Real WebSocket + AI + UI
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ====================================================== */

    const API = {

        analyze:
            "/api/couple-chat/analyze",

        mood:
            "/api/couple-chat/mood"

    };


    const STORAGE_KEY =
        "usanex_couple_chat_messages_v11";


    const MODE_STORAGE_KEY =
        "usanex_couple_chat_mode_v11";


    const RECENT_EMOJI_KEY =
        "usanex_recent_emojis_v11";


    /* =====================================================
       26 COUPLE MODES
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

    const $ = selector =>
        document.querySelector(selector);


    const app =
        $("#coupleApp");

    const backButton =
        $("#coupleBackButton");

    const avatarButton =
        $("#coupleAvatarButton");

    const partnerAvatar =
        $("#couplePartnerAvatar");

    const partnerName =
        $("#couplePartnerName");

    const partnerStatus =
        $("#couplePartnerStatus");

    const onlineDot =
        $("#coupleOnlineDot");

    const headerMood =
        $("#coupleHeaderMood");

    const menuButton =
        $("#coupleMenuButton");

    const aiButton =
        $("#coupleAiButton");

    const aiStatus =
        $("#coupleAiStatus");

    const messagesEl =
        $("#coupleMessages");

    const conversation =
        $("#coupleConversation");

    const input =
        $("#coupleMessageInput");

    const composer =
        $("#coupleComposer");

    const emojiButton =
        $("#coupleEmojiButton");

    const attachButton =
        $("#coupleAttachButton");

    const cameraButton =
        $("#coupleCameraButton");

    const sendButton =
        $("#coupleSendButton");

    const fileInput =
        $("#coupleFileInput");

    const moodOverlay =
        $("#coupleMoodOverlay");

    const moodGrid =
        $("#coupleMoodGrid");

    const closeMood =
        $("#closeMoodPanel");

    const aiOverlay =
        $("#coupleAiOverlay");

    const closeAi =
        $("#closeAiPanel");

    const menuOverlay =
        $("#coupleMenuOverlay");

    const closeMenu =
        $("#closeCoupleMenu");

    const typingEl =
        $("#coupleTyping");

    const typingName =
        $("#coupleTypingName");

    const suggestionsEl =
        $("#coupleSuggestions");

    const suggestionList =
        $("#coupleSuggestionList");

    const effectsLayer =
        $("#coupleEffectsLayer");

    const dayLabel =
        $("#coupleDayLabel");

    const togetherDays =
        $("#coupleTogetherDays");

    const connectionStatus =
        $("#coupleConnectionStatus");


    /* =====================================================
       STATE
    ====================================================== */

    let currentMode =
        localStorage.getItem(
            MODE_STORAGE_KEY
        ) || "calm";


    let messages =
        loadMessages();


    let realtime =
        null;


    let typingTimer =
        null;


    let partnerTyping =
        false;


    let manualMood =
        false;


    let emojiPicker =
        null;


    let isInitialHistoryLoaded =
        false;


    const partner =
        readPartner();


    /* =====================================================
       INIT
    ====================================================== */

    function init() {

        applyPartner();

        applyAutomaticTimeMood();

        renderMessages();

        updateMoodTheme();

        updateSuggestions();

        updateConnectionText();

        updateDayLabel();

        setupEvents();

        initRealtime();

        updateAutomaticNightState();


        setInterval(
            updateAutomaticNightState,
            60000
        );


        window.UsanexCoupleChat = {

            sendMessage,

            setMode,

            getMessages:
                () => messages,

            reconnect:
                () => realtime?.connect(),

            isRealtimeConnected:
                () => realtime?.connected === true

        };


        window.UsanexCoupleModes =
            COUPLE_MODES;

    }


    /* =====================================================
       PARTNER
    ====================================================== */

    function readPartner() {

        const params =
            new URLSearchParams(
                window.location.search
            );


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
                params.get("online") === "true",

            last_seen:
                params.get("last_seen") ||
                null

        };

    }


    function applyPartner() {

        if (partnerName) {

            partnerName.textContent =
                partner.name;

        }


        if (partnerAvatar) {

            partnerAvatar.src =
                partner.avatar;


            partnerAvatar.onerror =
                () => {

                    partnerAvatar.src =
                        "/static/images/default-profile.png";

                };

        }


        setOnlineStatus(
            partner.online,
            partner.last_seen
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

                    window.location.href =
                        "/chat";

                }

            }
        );


        avatarButton?.addEventListener(
            "click",
            () => {

                if (!partner.id) {
                    return;
                }


                window.location.href =
                    `/profile?user_id=${encodeURIComponent(
                        partner.id
                    )}`;

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
            event => {

                if (
                    event.target ===
                    moodOverlay
                ) {

                    closeMoodPanel();

                }

            }
        );


        aiOverlay?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    aiOverlay
                ) {

                    closeAiPanel();

                }

            }
        );


        menuOverlay?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    menuOverlay
                ) {

                    closeMenuPanel();

                }

            }
        );


        moodGrid?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-mode]"
                    );


                if (!button) {
                    return;
                }


                setMode(
                    button.dataset.mode,
                    true
                );


                closeMoodPanel();

            }
        );


        composer?.addEventListener(
            "submit",
            event => {

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

                if (!fileInput) {
                    return;
                }


                fileInput.removeAttribute(
                    "capture"
                );


                fileInput.click();

            }
        );


        cameraButton?.addEventListener(
            "click",
            () => {

                if (!fileInput) {
                    return;
                }


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


        document
            .querySelectorAll(
                "[data-menu-action]"
            )
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
            event => {

                if (
                    emojiPicker &&
                    !emojiPicker.contains(
                        event.target
                    ) &&
                    event.target !== emojiButton
                ) {

                    removeEmojiPicker();

                }

            }
        );


        window.addEventListener(
            "beforeunload",
            () => {

                realtime?.stopTyping();

            }
        );

    }


    /* =====================================================
       REALTIME INITIALIZATION
    ====================================================== */

    function initRealtime() {

        if (!partner.id) {

            setConnectionState(
                false
            );

            return;

        }


        if (
            typeof window
                .UsanexCoupleRealtime !==
            "function"
        ) {

            console.error(
                "[Usanex] couple-realtime.js not loaded."
            );

            setConnectionState(
                false
            );

            return;

        }


        realtime =
            new window.UsanexCoupleRealtime({

                partnerId:
                    partner.id,


                onConnection:
                    handleRealtimeConnection,


                onMessage:
                    handleRealtimeMessage,


                onReceipt:
                    handleRealtimeReceipt,


                onPresence:
                    handleRealtimePresence,


                onTyping:
                    handleRealtimeTyping

            });


        realtime.connect();

    }


    /* =====================================================
       REALTIME CONNECTION
    ====================================================== */

    function handleRealtimeConnection(
        data
    ) {

        if (!data) {
            return;
        }


        if (data.connected) {

            setConnectionState(
                true
            );


            if (
                typeof data.partnerOnline ===
                "boolean"
            ) {

                setOnlineStatus(
                    data.partnerOnline,
                    partner.last_seen
                );

            }


            if (
                data.history &&
                Array.isArray(
                    data.history
                )
            ) {

                mergeServerMessages(
                    data.history
                );

            }

        } else {

            setConnectionState(
                false
            );

        }

    }


    /* =====================================================
       REALTIME MESSAGE
    ====================================================== */

    function handleRealtimeMessage(
        data
    ) {

        if (!data) {
            return;
        }


        const incoming =
            data.message ||
            data;


        if (!incoming) {
            return;
        }


        const normalized =
            normalizeRealtimeMessage(
                incoming
            );


        if (
            normalized.message_type ===
            "system"
        ) {

            return;

        }


        const existing =
            findMessage(
                normalized
            );


        /* ================================================
           Existing message
        ================================================ */

        if (existing) {

            Object.assign(
                existing,
                normalized
            );


            if (
                !existing.status ||
                existing.status === "sent"
            ) {

                existing.status =
                    normalized.status ||
                    existing.status ||
                    "sent";

            }


            saveMessages();

            renderMessages();

            return;

        }


        /* ================================================
           New partner message
        ================================================ */

        messages.push(
            normalized
        );


        messages =
            messages.slice(-500);


        saveMessages();

        renderMessages();

        scrollToBottom(true);


        /* ================================================
           Auto delivery
        ================================================ */

        if (
            !normalized.is_mine &&
            normalized.id
        ) {

            realtime?.sendDelivered(
                normalized.id
            );


            /*
             * Chat is currently open,
             * therefore message is read.
             */

            realtime?.sendRead(
                normalized.id
            );

        }


        /*
         * AI/UI analysis for partner message
         */

        if (
            normalized.text &&
            !normalized.is_mine
        ) {

            analyzeIncomingMessage(
                normalized.text
            );

        }

    }


    /* =====================================================
       NORMALIZE REALTIME MESSAGE
    ====================================================== */

    function normalizeRealtimeMessage(
        message
    ) {

        const normalized = {

            ...message,

            id:
                message.id ||
                null,

            client_id:
                message.client_id ||
                null,

            text:
                message.content ??
                message.text ??
                "",

            content:
                message.content ??
                message.text ??
                "",

            message_type:
                message.message_type ||
                "text",

            media_url:
                message.media_url ||
                null,

            media_type:
                message.media_type ||
                null,

            sender_id:
                message.sender_id ??
                null,

            receiver_id:
                message.receiver_id ??
                null,

            created_at:
                message.created_at ||
                new Date().toISOString(),

            status:
                normalizeStatus(
                    message.status ||
                    "sent"
                )

        };


        normalized.is_mine =
            isOwnMessage(
                normalized
            );


        return normalized;

    }


    /* =====================================================
       FIND MESSAGE
    ====================================================== */

    function findMessage(
        message
    ) {

        if (
            message.client_id
        ) {

            const byClient =
                messages.find(
                    item =>
                        item.client_id &&
                        String(
                            item.client_id
                        ) ===
                        String(
                            message.client_id
                        )
                );


            if (byClient) {
                return byClient;
            }

        }


        if (
            message.id
        ) {

            const byId =
                messages.find(
                    item =>
                        item.id &&
                        String(
                            item.id
                        ) ===
                        String(
                            message.id
                        )
                );


            if (byId) {
                return byId;
            }

        }


        return null;

    }


    /* =====================================================
       SERVER HISTORY
    ====================================================== */

    function mergeServerMessages(
        serverMessages
    ) {

        if (
            !Array.isArray(
                serverMessages
            )
        ) {

            return;

        }


        serverMessages.forEach(
            serverMessage => {

                const normalized =
                    normalizeRealtimeMessage(
                        serverMessage
                    );


                const existing =
                    findMessage(
                        normalized
                    );


                if (existing) {

                    Object.assign(
                        existing,
                        normalized
                    );

                } else {

                    messages.push(
                        normalized
                    );

                }

            }
        );


        messages =
            messages
                .slice(-500)
                .sort(
                    (a, b) =>
                        new Date(
                            a.created_at
                        ) -
                        new Date(
                            b.created_at
                        )
                );


        saveMessages();

        renderMessages();

        scrollToBottom(false);

        isInitialHistoryLoaded =
            true;

    }


    /* =====================================================
       RECEIPTS
    ====================================================== */

    function handleRealtimeReceipt(
        data
    ) {

        if (!data) {
            return;
        }


        const receipt =
            data.receipt ||
            data;


        const messageId =
            receipt.message_id ||
            receipt.client_id ||
            receipt.id;


        if (!messageId) {
            return;
        }


        const message =
            messages.find(
                item =>
                    (
                        item.id &&
                        String(item.id) ===
                        String(messageId)
                    ) ||
                    (
                        item.client_id &&
                        String(item.client_id) ===
                        String(messageId)
                    )
            );


        if (!message) {
            return;
        }


        let status =
            receipt.status;


        if (
            receipt.seen === true ||
            receipt.seen_at
        ) {

            status =
                "seen";

        } else if (
            receipt.delivered === true ||
            receipt.delivered_at
        ) {

            status =
                "delivered";

        }


        if (status) {

            const normalizedStatus =
                normalizeStatus(
                    status
                );


            if (
                normalizedStatus ===
                "seen"
            ) {

                message.status =
                    "seen";

            } else if (
                normalizedStatus ===
                "delivered" &&
                message.status !==
                "seen"
            ) {

                message.status =
                    "delivered";

            }

        }


        if (
            receipt.delivered_at
        ) {

            message.delivered_at =
                receipt.delivered_at;

        }


        if (
            receipt.seen_at
        ) {

            message.seen_at =
                receipt.seen_at;

            message.status =
                "seen";

        }


        saveMessages();


        updateMessageStatusUI(
            message.client_id ||
            message.id,
            message.status
        );

    }


    /* =====================================================
       PRESENCE
    ====================================================== */

    function handleRealtimePresence(
        data
    ) {

        if (!data) {
            return;
        }


        const online =
            data.is_online === true ||
            data.online === true ||
            data.status === "online";


        const lastSeen =
            data.last_seen ||
            data.last_seen_at ||
            null;


        if (lastSeen) {

            partner.last_seen =
                lastSeen;

        }


        setOnlineStatus(
            online,
            partner.last_seen
        );

    }


    /* =====================================================
       TYPING
    ====================================================== */

    function handleRealtimeTyping(
        data
    ) {

        if (!data) {
            return;
        }


        const typing =
            data.is_typing === true ||
            data.typing === true;


        partnerTyping =
            typing;


        if (typingEl) {

            typingEl.hidden =
                !typing;

        }


        if (typingName) {

            typingName.textContent =
                partner.name;

        }


        if (typing) {

            if (partnerStatus) {

                partnerStatus.textContent =
                    "typing...";


                partnerStatus.classList.add(
                    "typing"
                );


                partnerStatus.classList.remove(
                    "online"
                );

            }

        } else {

            setOnlineStatus(
                true,
                partner.last_seen
            );

        }

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
                ? String(
                    customText
                ).trim()
                : (
                    input?.value ||
                    ""
                ).trim();


        if (!text) {
            return;
        }


        const clientId =
            createMessageId();


        const message = {

            id:
                null,

            client_id:
                clientId,

            sender_id:
                getCurrentUserId(),

            receiver_id:
                partner.id ||
                null,

            content:
                text,

            text:
                text,

            message_type:
                messageType,

            media_url:
                null,

            media_type:
                null,

            created_at:
                new Date().toISOString(),

            status:
                "sent",

            is_mine:
                true

        };


        /*
         * Optimistic UI.
         * Message appears immediately.
         */

        messages.push(
            message
        );


        messages =
            messages.slice(-500);


        saveMessages();

        renderMessages();

        scrollToBottom(true);


        if (
            customText === null &&
            input
        ) {

            input.value =
                "";

        }


        stopTyping();


        /* ================================================
           REAL WEBSOCKET SEND
        ================================================ */

        const sent =
            realtime?.sendMessage(
                message
            );


        if (!sent) {

            /*
             * Message remains in UI as sent.
             * It will be retried after connection
             * only when user sends again.
             */

            setConnectionState(
                false
            );

        }


        /*
         * AI analysis.
         */

        analyzeMessage(
            text
        );

    }


    /* =====================================================
       MESSAGE ANALYSIS
    ====================================================== */

    async function analyzeMessage(
        text
    ) {

        try {

            const response =
                await fetch(
                    API.analyze,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                message:
                                    text,

                                current_mode:
                                    currentMode,

                                partner_id:
                                    partner.id ||
                                    null

                            })

                    }
                );


            if (!response.ok) {
                return;
            }


            const data =
                await response.json();


            applyAIAnalysis(
                data
            );

        } catch (error) {

            console.debug(
                "[Usanex AI] analysis unavailable",
                error
            );

        }

    }


    async function analyzeIncomingMessage(
        text
    ) {

        try {

            const response =
                await fetch(
                    API.analyze,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                message:
                                    text,

                                current_mode:
                                    currentMode,

                                partner_id:
                                    partner.id ||
                                    null

                            })

                    }
                );


            if (!response.ok) {
                return;
            }


            const data =
                await response.json();


            applyAIAnalysis(
                data
            );

        } catch {}

    }


    function applyAIAnalysis(
        data
    ) {

        if (!data) {
            return;
        }


        if (
            data.mode &&
            COUPLE_MODES[
                data.mode
            ] &&
            !manualMood
        ) {

            setMode(
                data.mode,
                false
            );

        }


        if (
            aiStatus &&
            data.response
        ) {

            aiStatus.textContent =
                data.response;

        }


        if (
            Array.isArray(
                data.suggestions
            )
        ) {

            showSuggestions(
                data.suggestions
            );

        }


        if (
            data.animation
        ) {

            triggerAIAnimation(
                data.animation
            );

        }

    }


    /* =====================================================
       MESSAGE RENDERING
    ====================================================== */

    function renderMessages() {

        if (!messagesEl) {
            return;
        }


        messagesEl.innerHTML =
            "";


        messages.forEach(
            message => {

                if (
                    message.message_type ===
                    "system"
                ) {

                    return;

                }


                const row =
                    document.createElement(
                        "div"
                    );


                const mine =
                    isOwnMessage(
                        message
                    );


                row.className =
                    `couple-message-row ${
                        mine
                            ? "mine"
                            : "partner"
                    }`;


                const bubble =
                    document.createElement(
                        "article"
                    );


                bubble.className =
                    `couple-message ${
                        mine
                            ? "mine"
                            : "partner"
                    }`;


                bubble.dataset.messageId =
                    message.client_id ||
                    message.id ||
                    "";


                /* =========================================
                   IMAGE
                ========================================== */

                if (
                    message.message_type ===
                    "image" &&
                    message.media_url
                ) {

                    const image =
                        document.createElement(
                            "img"
                        );


                    image.className =
                        "couple-message-image";


                    image.src =
                        message.media_url;


                    image.alt =
                        "Photo";


                    image.loading =
                        "lazy";


                    bubble.appendChild(
                        image
                    );

                }


                /* =========================================
                   TEXT
                ========================================== */

                if (
                    message.text
                ) {

                    const text =
                        document.createElement(
                            "div"
                        );


                    text.className =
                        "couple-message-text";


                    text.textContent =
                        message.text;


                    bubble.appendChild(
                        text
                    );

                }


                /* =========================================
                   FILE
                ========================================== */

                if (
                    message.message_type ===
                    "file"
                ) {

                    const file =
                        document.createElement(
                            "div"
                        );


                    file.className =
                        "couple-message-file";


                    file.textContent =
                        message.text ||
                        "📎 File";


                    bubble.appendChild(
                        file
                    );

                }


                /* =========================================
                   META
                ========================================== */

                const meta =
                    document.createElement(
                        "div"
                    );


                meta.className =
                    "couple-message-meta";


                const time =
                    document.createElement(
                        "span"
                    );


                time.className =
                    "couple-message-time";


                time.textContent =
                    formatTime(
                        message.created_at
                    );


                meta.appendChild(
                    time
                );


                /* =========================================
                   OWN MESSAGE STATUS
                ========================================== */

                if (mine) {

                    const status =
                        document.createElement(
                            "span"
                        );


                    status.className =
                        `couple-message-status ${
                            message.status ||
                            "sent"
                        }`;


                    status.dataset.statusFor =
                        message.client_id ||
                        message.id ||
                        "";


                    status.textContent =
                        getStatusTicks(
                            message.status
                        );


                    meta.appendChild(
                        status
                    );

                }


                bubble.appendChild(
                    meta
                );


                row.appendChild(
                    bubble
                );


                messagesEl.appendChild(
                    row
                );

            }
        );


        updateMoodTheme();

    }


    /* =====================================================
       STATUS
    ====================================================== */

    function getStatusTicks(
        status
    ) {

        if (
            status === "seen"
        ) {

            return "✓✓";

        }


        if (
            status === "delivered"
        ) {

            return "✓✓";

        }


        return "✓";

    }


    function normalizeStatus(
        status
    ) {

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


    function updateMessageStatusUI(
        messageId,
        status
    ) {

        if (!messageId) {
            return;
        }


        const element =
            document.querySelector(
                `.couple-message-status[data-status-for="${CSS.escape(
                    String(messageId)
                )}"]`
            );


        if (!element) {

            renderMessages();

            return;

        }


        element.className =
            `couple-message-status ${
                normalizeStatus(status)
            }`;


        element.textContent =
            getStatusTicks(
                status
            );

    }


    /* =====================================================
       OWN MESSAGE
    ====================================================== */

    function isOwnMessage(
        message
    ) {

        if (
            typeof message.is_mine ===
            "boolean"
        ) {

            return message.is_mine;

        }


        const current =
            getCurrentUserId();


        if (
            !current ||
            message.sender_id ===
            null ||
            message.sender_id ===
            undefined
        ) {

            return false;

        }


        return (
            String(
                message.sender_id
            ) ===
            String(current)
        );

    }


    /* =====================================================
       CONNECTION STATE
    ====================================================== */

    function setConnectionState(
        connected
    ) {

        if (
            connectionStatus
        ) {

            connectionStatus.textContent =
                connected
                    ? "Connected"
                    : "Reconnecting...";

        }

    }


    function updateConnectionText() {

        if (
            connectionStatus
        ) {

            connectionStatus.textContent =
                "Connecting...";

        }

    }


    /* =====================================================
       PRESENCE UI
    ====================================================== */

    function setOnlineStatus(
        online,
        lastSeen
    ) {

        if (onlineDot) {

            onlineDot.hidden =
                !online;

        }


        if (!partnerStatus) {
            return;
        }


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
                formatLastSeen(
                    lastSeen
                );


            partnerStatus.classList.remove(
                "online",
                "typing"
            );

        }

    }


    /* =====================================================
       TYPING
    ====================================================== */

    function handleInput() {

        if (!realtime) {
            return;
        }


        realtime.startTyping();


        clearTimeout(
            typingTimer
        );


        typingTimer =
            setTimeout(
                () => {

                    realtime.stopTyping();

                },
                1400
            );

    }


    function stopTyping() {

        clearTimeout(
            typingTimer
        );


        typingTimer =
            null;


        realtime?.stopTyping();

    }


    /* =====================================================
       MOOD
    ====================================================== */

    function setMode(
        mode,
        manual = false
    ) {

        if (
            !COUPLE_MODES[mode]
        ) {

            mode =
                "calm";

        }


        currentMode =
            mode;


        manualMood =
            manual;


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
            COUPLE_MODES[
                currentMode
            ];


        if (!mode) {
            return;
        }


        if (headerMood) {

            headerMood.title =
                `Current mood: ${mode.name}`;

        }

    }


    function openMood() {

        moodOverlay?.classList.remove(
            "hidden"
        );


        highlightCurrentMood();

    }


    function closeMoodPanel() {

        moodOverlay?.classList.add(
            "hidden"
        );

    }


    function highlightCurrentMood() {

        moodGrid
            ?.querySelectorAll(
                "[data-mode]"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.mode ===
                        currentMode
                    );

                }
            );

    }


    /* =====================================================
       AUTOMATIC TIME MOOD
    ====================================================== */

    function applyAutomaticTimeMood() {

        if (manualMood) {
            return;
        }


        const hour =
            new Date().getHours();


        if (
            hour >= 5 &&
            hour < 11
        ) {

            setMode(
                "good_morning",
                false
            );

        } else if (
            hour >= 22 ||
            hour < 5
        ) {

            setMode(
                "good_night",
                false
            );

        } else {

            setMode(
                "calm",
                false
            );

        }

    }


    function updateAutomaticNightState() {

        const hour =
            new Date().getHours();


        const night =
            hour >= 21 ||
            hour < 6;


        document.body.classList.toggle(
            "night-mode",
            night
        );

    }


    /* =====================================================
       SUGGESTIONS
    ====================================================== */

    function updateSuggestions() {

        const mode =
            COUPLE_MODES[
                currentMode
            ];


        if (!mode) {
            return;
        }


        showSuggestions(
            mode.suggestions
        );

    }


    function showSuggestions(
        items
    ) {

        if (
            !Array.isArray(items) ||
            !items.length
        ) {

            if (suggestionsEl) {

                suggestionsEl.hidden =
                    true;

            }

            return;

        }


        if (!suggestionList) {
            return;
        }


        suggestionList.innerHTML =
            "";


        items
            .slice(0, 5)
            .forEach(
                text => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "couple-suggestion";


                    button.textContent =
                        text;


                    button.addEventListener(
                        "click",
                        () => {

                            if (input) {

                                input.value =
                                    text;


                                input.focus();

                            }


                            if (suggestionsEl) {

                                suggestionsEl.hidden =
                                    true;

                            }

                        }
                    );


                    suggestionList.appendChild(
                        button
                    );

                }
            );


        if (suggestionsEl) {

            suggestionsEl.hidden =
                false;

        }

    }


    /* =====================================================
       QUICK ACTIONS
    ====================================================== */

    function handleQuickAction(
        action
    ) {

        const modeMap = {

            love:
                "romantic",

            memory:
                "memory",

            question:
                "deep_conversation",

            game:
                "game"

        };


        const mode =
            modeMap[action];


        if (mode) {

            setMode(
                mode,
                true
            );

        }


        const selected =
            COUPLE_MODES[
                mode ||
                currentMode
            ];


        if (
            selected?.suggestions
        ) {

            showSuggestions(
                selected.suggestions
            );

        }

    }


    /* =====================================================
       AI PANEL
    ====================================================== */

    function openAi() {

        aiOverlay?.classList.remove(
            "hidden"
        );

    }


    function closeAiPanel() {

        aiOverlay?.classList.add(
            "hidden"
        );

    }


    function handleAiAction(
        action
    ) {

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
                    COUPLE_MODES
                        .deep_conversation
                        .suggestions
                );

                break;


            case "game":

                setMode(
                    "game",
                    true
                );

                showSuggestions(
                    COUPLE_MODES
                        .game
                        .suggestions
                );

                break;

        }

    }


    /* =====================================================
       MENU
    ====================================================== */

    function openMenu() {

        menuOverlay?.classList.remove(
            "hidden"
        );

    }


    function closeMenuPanel() {

        menuOverlay?.classList.add(
            "hidden"
        );

    }


    function handleMenuAction(
        action
    ) {

        closeMenuPanel();


        if (
            action ===
            "export"
        ) {

            exportChat();

        }


        if (
            action ===
            "clear"
        ) {

            clearChat();

        }

    }


    /* =====================================================
       EXPORT
    ====================================================== */

    function exportChat() {

        const text =
            messages
                .map(
                    message => {

                        const who =
                            isOwnMessage(
                                message
                            )
                                ? "You"
                                : partner.name;


                        return (
                            `[${formatDateTime(
                                message.created_at
                            )}] ` +
                            `${who}: ` +
                            `${message.text || "[media]"}`
                        );

                    }
                )
                .join("\n");


        const blob =
            new Blob(
                [text],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "usanex-couple-chat.txt";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }


    /* =====================================================
       CLEAR
    ====================================================== */

    function clearChat() {

        const confirmed =
            window.confirm(
                "Clear this chat from this device?"
            );


        if (!confirmed) {
            return;
        }


        messages =
            [];


        saveMessages();

        renderMessages();

    }


    /* =====================================================
       EMOJI DATA
    ====================================================== */

    const EMOJI_CATEGORIES = {

        recent: [
            "❤️","😂","😊","🥰","😍","😘","😭","🥺",
            "😏","🔥","💕","💗","🫶","✨","💋"
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
            "🍫","🍭","☕","🧋","🍵","🥤"
        ],

        activities: [
            "⚽","🏀","🏈","⚾","🎾","🏐","🎮","🎯",
            "🎲","🎸","🎹","🎤","🎧","🎬","🎨","🏆",
            "🏃","🚴","🏊","🧘","💃","🕺","🎉","🎊",
            "🎁","🎈","🎵","🎶"
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


    /* =====================================================
       EMOJI PICKER
    ====================================================== */

    function toggleEmojiPicker() {

        if (emojiPicker) {

            removeEmojiPicker();

            return;

        }


        createEmojiPicker();

    }


    function createEmojiPicker() {

        const panel =
            document.createElement(
                "div"
            );


        panel.className =
            "couple-emoji-picker";


        emojiPicker =
            panel;


        const search =
            document.createElement(
                "input"
            );


        search.className =
            "emoji-search";


        search.placeholder =
            "Search emoji...";


        panel.appendChild(
            search
        );


        const categories =
            document.createElement(
                "div"
            );


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


        Object.keys(
            EMOJI_CATEGORIES
        )
            .forEach(
                (
                    category,
                    index
                ) => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "emoji-category-button";


                    if (
                        index === 0
                    ) {

                        button.classList.add(
                            "active"
                        );

                    }


                    button.textContent =
                        categoryIcons[
                            category
                        ];


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
            document.createElement(
                "div"
            );


        grid.className =
            "emoji-grid";


        panel.appendChild(
            grid
        );


        renderEmojiGrid(
            grid,
            "recent"
        );


        search.addEventListener(
            "input",
            () => {

                const query =
                    search.value
                        .trim()
                        .toLowerCase();


                if (!query) {

                    renderEmojiGrid(
                        grid,
                        "recent"
                    );

                    return;

                }


                const all =
                    [
                        ...new Set(
                            Object.values(
                                EMOJI_CATEGORIES
                            ).flat()
                        )
                    ];


                renderEmojiGrid(
                    grid,
                    null,
                    all
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

        if (!grid) {
            return;
        }


        grid.innerHTML =
            "";


        const list =
            customList ||
            EMOJI_CATEGORIES[
                category
            ] ||
            [];


        list.forEach(
            emoji => {

                const button =
                    document.createElement(
                        "button"
                    );


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

            }
        );

    }


    function insertEmoji(
        emoji
    ) {

        if (!input) {
            return;
        }


        const start =
            input.selectionStart ??
            input.value.length;


        const end =
            input.selectionEnd ??
            input.value.length;


        input.value =
            input.value.slice(
                0,
                start
            ) +
            emoji +
            input.value.slice(
                end
            );


        input.focus();


        const cursor =
            start +
            emoji.length;


        input.setSelectionRange(
            cursor,
            cursor
        );


        saveRecentEmoji(
            emoji
        );

    }


    function saveRecentEmoji(
        emoji
    ) {

        let recent =
            [];


        try {

            recent =
                JSON.parse(
                    localStorage.getItem(
                        RECENT_EMOJI_KEY
                    ) ||
                    "[]"
                );

        } catch {}


        recent =
            [
                emoji,
                ...recent.filter(
                    item =>
                        item !== emoji
                )
            ]
                .slice(0, 30);


        localStorage.setItem(
            RECENT_EMOJI_KEY,
            JSON.stringify(
                recent
            )
        );

    }


    function removeEmojiPicker() {

        emojiPicker?.remove();

        emojiPicker =
            null;

    }


    /* =====================================================
       FILES / IMAGE
    ====================================================== */

    async function handleFiles(
        event
    ) {

        const files =
            Array.from(
                event.target.files ||
                []
            );


        event.target.value =
            "";


        for (
            const file of files
        ) {

            if (
                file.type.startsWith(
                    "image/"
                )
            ) {

                await sendImageFile(
                    file
                );

            } else {

                await sendMessage(
                    `📎 ${file.name}`,
                    "file"
                );

            }

        }

    }


    async function sendImageFile(
        file
    ) {

        const localUrl =
            URL.createObjectURL(
                file
            );


        const clientId =
            createMessageId();


        const message = {

            id:
                null,

            client_id:
                clientId,

            sender_id:
                getCurrentUserId(),

            receiver_id:
                partner.id ||
                null,

            content:
                "",

            text:
                "",

            message_type:
                "image",

            media_url:
                localUrl,

            media_type:
                file.type,

            created_at:
                new Date().toISOString(),

            status:
                "sent",

            is_mine:
                true

        };


        messages.push(
            message
        );


        saveMessages();

        renderMessages();

        scrollToBottom(true);


        /*
         * Backend accepts media_url.
         * Current local blob URL is useful only
         * for immediate preview. A permanent
         * Cloudinary upload can later replace
         * this URL before sending.
         */

        const sent =
            realtime?.sendMessage(
                message
            );


        if (!sent) {

            setConnectionState(
                false
            );

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
                    ) ||
                    "[]"
                );


            if (
                Array.isArray(
                    stored
                )
            ) {

                return stored
                    .map(
                        normalizeRealtimeMessage
                    )
                    .filter(
                        message =>
                            message.message_type !==
                            "system"
                    );

            }

        } catch (error) {

            console.debug(
                "[Usanex] local messages unavailable",
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
                "[Usanex] unable to save messages",
                error
            );

        }

    }


    /* =====================================================
       SERVER MOOD
    ====================================================== */

    async function sendMoodToServer() {

        try {

            await fetch(
                API.mood,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            partner_id:
                                partner.id ||
                                null,

                            mode:
                                currentMode

                        })

                }
            );

        } catch {

            /*
             * UI continues even if
             * mood endpoint is unavailable.
             */

        }

    }


    /* =====================================================
       AI ANIMATION
    ====================================================== */

    function triggerAIAnimation(
        animation
    ) {

        if (!effectsLayer) {
            return;
        }


        if (
            animation ===
            "hearts"
        ) {

            createHeartEffect();

            setTimeout(
                createHeartEffect,
                250
            );

            setTimeout(
                createHeartEffect,
                500
            );

        }

    }


    function createHeartEffect() {

        if (
            !effectsLayer
        ) {
            return;
        }


        const heart =
            document.createElement(
                "span"
            );


        heart.className =
            "couple-heart-effect";


        heart.textContent =
            Math.random() > 0.5
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
       HELPERS
    ====================================================== */

    function getCurrentUserId() {

        const keys = [

            "user_id",

            "currentUser",

            "usanexUser",

            "user"

        ];


        for (
            const key of keys
        ) {

            try {

                const value =
                    localStorage.getItem(
                        key
                    );


                if (!value) {
                    continue;
                }


                try {

                    const parsed =
                        JSON.parse(
                            value
                        );


                    if (
                        parsed &&
                        typeof parsed ===
                        "object"
                    ) {

                        return (
                            parsed.id ||
                            parsed.user_id ||
                            parsed.userId ||
                            null
                        );

                    }

                } catch {}


                return value;

            } catch {}

        }


        return null;

    }


    function createMessageId() {

        return (
            "client_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 10)
        );

    }


    function formatTime(
        value
    ) {

        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return date.toLocaleTimeString(
            [],
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );

    }


    function formatDateTime(
        value
    ) {

        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return date.toLocaleString(
            [],
            {
                dateStyle:
                    "medium",

                timeStyle:
                    "short"
            }
        );

    }


    function formatLastSeen(
        value
    ) {

        if (!value) {
            return "Offline";
        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Offline";

        }


        return (
            `Last seen ${formatTime(
                date
            )}`
        );

    }


    function updateDayLabel() {

        if (!dayLabel) {
            return;
        }


        dayLabel.textContent =
            new Date()
                .toLocaleDateString(
                    [],
                    {
                        weekday:
                            "long",

                        month:
                            "short",

                        day:
                            "numeric"
                    }
                );

    }


    function scrollToBottom(
        smooth = true
    ) {

        if (!conversation) {
            return;
        }


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
       START
    ====================================================== */

    init();

})();
