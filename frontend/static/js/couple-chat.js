/* =========================================================
   USANEX — COUPLE CHAT
   AI-BASED COUPLE EXPERIENCE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (id) => document.getElementById(id);

    const qs = (selector) =>
        document.querySelector(selector);

    const qsa = (selector) =>
        [...document.querySelectorAll(selector)];


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const coupleChat =
        qs(".couple-chat") ||
        qs(".couple-chat-page") ||
        document.body;

    const messages =
        $("coupleMessages") ||
        $("messages");

    const messageInput =
        $("coupleMessageInput") ||
        $("messageInput");

    const composer =
        $("coupleComposer") ||
        $("composer");

    const sendButton =
        $("coupleSendButton") ||
        $("sendButton");

    const moodPanel =
        $("moodPanel");

    const aiPanel =
        $("aiPanel");

    const typingIndicator =
        $("coupleTypingIndicator") ||
        $("typingIndicator");

    const background =
        $("coupleBackground");

    const moodButton =
        $("moodButton");

    const aiButton =
        $("aiButton");

    const closeMoodButton =
        $("closeMoodPanel");

    const closeAIButton =
        $("closeAIPanel");

    const aiInput =
        $("aiInput");

    const aiSendButton =
        $("aiSendButton");

    const coupleName =
        $("coupleName");

    const partnerName =
        $("partnerName");

    const coupleAvatar =
        $("coupleAvatar");

    const partnerAvatar =
        $("partnerAvatar");

    const backButton =
        $("coupleBackButton") ||
        $("backButton");


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        mood: "love",

        theme: "love",

        typing: false,

        aiOpen: false,

        moodOpen: false,

        messages: [],

        partnerOnline: false,

        conversationId: null

    };


    /* =====================================================
       DEFAULT THEMES
    ===================================================== */

    const themes = {

        love: {
            name: "Love",
            className: "mood-love"
        },

        romantic: {
            name: "Romantic",
            className: "mood-romantic"
        },

        happy: {
            name: "Happy",
            className: "mood-happy"
        },

        cute: {
            name: "Cute",
            className: "mood-cute"
        },

        calm: {
            name: "Calm",
            className: "mood-calm"
        },

        sad: {
            name: "Comfort",
            className: "mood-sad"
        },

        angry: {
            name: "Tension",
            className: "mood-angry"
        },

        night: {
            name: "Night",
            className: "mood-night"
        }

    };


    /* =====================================================
       SAFE HTML
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* =====================================================
       TIME
    ===================================================== */

    function getTime() {

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(new Date());

    }


    /* =====================================================
       SCROLL
    ===================================================== */

    function scrollToBottom(smooth = true) {

        if (!messages) return;

        requestAnimationFrame(() => {

            messages.scrollTo({
                top: messages.scrollHeight,
                behavior: smooth ? "smooth" : "auto"
            });

        });

    }


    /* =====================================================
       SAVE STATE
    ===================================================== */

    function saveState() {

        try {

            localStorage.setItem(
                "usanexCoupleChatState",
                JSON.stringify({
                    mood: state.mood,
                    theme: state.theme
                })
            );

        } catch (error) {

            console.warn(
                "Unable to save couple chat state",
                error
            );

        }

    }


    /* =====================================================
       RESTORE STATE
    ===================================================== */

    function restoreState() {

        try {

            const saved =
                localStorage.getItem(
                    "usanexCoupleChatState"
                );

            if (!saved) return;

            const parsed =
                JSON.parse(saved);

            if (parsed.mood) {
                state.mood = parsed.mood;
            }

            if (parsed.theme) {
                state.theme = parsed.theme;
            }

        } catch (error) {

            console.warn(
                "Unable to restore couple chat state",
                error
            );

        }

    }


    /* =====================================================
       DYNAMIC BACKGROUND
    ===================================================== */

    function applyMood(mood) {

        if (!themes[mood]) {
            mood = "love";
        }

        state.mood = mood;
        state.theme = mood;

        Object.values(themes).forEach(
            (theme) => {

                document.body.classList.remove(
                    theme.className
                );

                if (coupleChat) {
                    coupleChat.classList.remove(
                        theme.className
                    );
                }

            }
        );

        const className =
            themes[mood].className;

        document.body.classList.add(
            className
        );

        if (coupleChat) {
            coupleChat.classList.add(
                className
            );
        }

        if (background) {

            background.dataset.mood =
                mood;

        }

        saveState();

        updateMoodButtons();

    }


    /* =====================================================
       MOOD BUTTONS
    ===================================================== */

    function updateMoodButtons() {

        qsa(
            "[data-mood]"
        ).forEach((button) => {

            const active =
                button.dataset.mood ===
                state.mood;

            button.classList.toggle(
                "active",
                active
            );

            button.setAttribute(
                "aria-selected",
                active ? "true" : "false"
            );

        });

    }


    qsa("[data-mood]").forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const mood =
                        button.dataset.mood;

                    applyMood(mood);

                    closeMoodPanel();

                }
            );

        }
    );


    /* =====================================================
       MOOD PANEL
    ===================================================== */

    function openMoodPanel() {

        if (!moodPanel) return;

        state.moodOpen = true;

        moodPanel.classList.add(
            "active"
        );

        moodPanel.classList.remove(
            "hidden"
        );

        updateMoodButtons();

    }


    function closeMoodPanel() {

        if (!moodPanel) return;

        state.moodOpen = false;

        moodPanel.classList.remove(
            "active"
        );

        moodPanel.classList.add(
            "hidden"
        );

    }


    moodButton?.addEventListener(
        "click",
        () => {

            if (state.moodOpen) {
                closeMoodPanel();
            } else {
                openMoodPanel();
            }

        }
    );


    closeMoodButton?.addEventListener(
        "click",
        closeMoodPanel
    );


    /* =====================================================
       AI PANEL
    ===================================================== */

    function openAIPanel() {

        if (!aiPanel) return;

        state.aiOpen = true;

        aiPanel.classList.add(
            "active"
        );

        aiPanel.classList.remove(
            "hidden"
        );

        setTimeout(() => {

            aiInput?.focus();

        }, 150);

    }


    function closeAIPanel() {

        if (!aiPanel) return;

        state.aiOpen = false;

        aiPanel.classList.remove(
            "active"
        );

        aiPanel.classList.add(
            "hidden"
        );

    }


    aiButton?.addEventListener(
        "click",
        () => {

            if (state.aiOpen) {
                closeAIPanel();
            } else {
                openAIPanel();
            }

        }
    );


    closeAIButton?.addEventListener(
        "click",
        closeAIPanel
    );


    /* =====================================================
       AI QUICK PROMPTS
    ===================================================== */

    qsa(
        "[data-ai-prompt]"
    ).forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const prompt =
                    button.dataset.aiPrompt;

                if (!prompt) return;

                if (aiInput) {
                    aiInput.value = prompt;
                    aiInput.focus();
                }

            }
        );

    });


    /* =====================================================
       AI RESPONSE
    ===================================================== */

    async function askAI(text) {

        if (!text.trim()) return;

        addAIMessage(
            text,
            "user"
        );

        if (aiInput) {
            aiInput.value = "";
        }

        showTyping();

        try {

            const response =
                await fetch(
                    "/api/couple-chat/ai",
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            "Accept":
                                "application/json"
                        },
                        body: JSON.stringify({
                            message: text,
                            mood: state.mood,
                            conversation_id:
                                state.conversationId
                        })
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "AI request failed"
                );

            }

            const data =
                await response.json();

            hideTyping();

            const reply =
                data.reply ||
                data.message ||
                data.response ||
                "I'm here with you ❤️";

            addAIMessage(
                reply,
                "ai"
            );

        } catch (error) {

            console.error(
                "Usanex AI error:",
                error
            );

            hideTyping();

            addAIMessage(
                "I'm here with you ❤️ Let's talk.",
                "ai"
            );

        }

    }


    function addAIMessage(
        text,
        type
    ) {

        if (!aiPanel) return;

        const container =
            aiPanel.querySelector(
                ".ai-messages"
            ) ||
            aiPanel.querySelector(
                "[data-ai-messages]"
            );

        if (!container) return;

        const message =
            document.createElement("div");

        message.className =
            `ai-message ai-message-${type}`;

        message.textContent =
            text;

        container.appendChild(
            message
        );

        container.scrollTop =
            container.scrollHeight;

    }


    aiSendButton?.addEventListener(
        "click",
        () => {

            if (!aiInput) return;

            const text =
                aiInput.value.trim();

            if (!text) return;

            askAI(text);

        }
    );


    aiInput?.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                aiSendButton?.click();

            }

        }
    );


    /* =====================================================
       TYPING
    ===================================================== */

    function showTyping() {

        state.typing = true;

        if (typingIndicator) {

            typingIndicator.hidden =
                false;

            typingIndicator.classList.add(
                "active"
            );

        }

    }


    function hideTyping() {

        state.typing = false;

        if (typingIndicator) {

            typingIndicator.hidden =
                true;

            typingIndicator.classList.remove(
                "active"
            );

        }

    }


    /* =====================================================
       MESSAGE RENDER
    ===================================================== */

    function renderMessage(message) {

        if (!messages) return;

        const wrapper =
            document.createElement("article");

        const sender =
            message.sender ||
            "me";

        const type =
            sender === "me"
                ? "sent"
                : "received";

        wrapper.className =
            `couple-message ${type}`;

        if (message.id) {

            wrapper.dataset.messageId =
                message.id;

        }

        const text =
            escapeHtml(
                message.text ||
                message.content ||
                ""
            );

        const time =
            escapeHtml(
                message.time ||
                getTime()
            );

        wrapper.innerHTML = `

            <div class="message-bubble">

                <div class="message-text">
                    ${text}
                </div>

                <div class="message-meta">
                    ${time}
                    ${
                        sender === "me"
                            ? `<span class="message-seen">
                                   ${message.seen ? "✓✓" : "✓"}
                               </span>`
                            : ""
                    }
                </div>

            </div>

        `;

        messages.appendChild(
            wrapper
        );

    }


    /* =====================================================
       ADD MESSAGE
    ===================================================== */

    function addMessage(
        text,
        sender = "me",
        options = {}
    ) {

        if (!text || !text.trim()) {
            return;
        }

        const message = {

            id:
                options.id ||
                `local_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            text:
                text.trim(),

            sender,

            time:
                options.time ||
                getTime(),

            seen:
                Boolean(options.seen)

        };

        state.messages.push(
            message
        );

        renderMessage(
            message
        );

        scrollToBottom();

        return message;

    }


    /* =====================================================
       SEND MESSAGE TO SERVER
    ===================================================== */

    async function sendMessage(
        text
    ) {

        const message =
            addMessage(
                text,
                "me"
            );

        if (!message) return;

        try {

            const response =
                await fetch(
                    "/api/couple-chat/messages",
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            "Accept":
                                "application/json"
                        },
                        body: JSON.stringify({
                            conversation_id:
                                state.conversationId,

                            content:
                                message.text,

                            mood:
                                state.mood
                        })
                    }
                );

            if (!response.ok) {

                console.warn(
                    "Message API returned:",
                    response.status
                );

            }

        } catch (error) {

            /*
             * Keep local message visible.
             * This makes the UI usable even
             * while backend endpoint is being built.
             */

            console.warn(
                "Message send API unavailable:",
                error
            );

        }

    }


    /* =====================================================
       COMPOSER
    ===================================================== */

    composer?.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!messageInput) return;

            const text =
                messageInput.value.trim();

            if (!text) return;

            messageInput.value = "";

            await sendMessage(
                text
            );

            messageInput.focus();

        }
    );


    /* =====================================================
       ENTER TO SEND
    ===================================================== */

    messageInput?.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                composer?.requestSubmit();

            }

        }
    );


    /* =====================================================
       AUTO RESIZE INPUT
    ===================================================== */

    messageInput?.addEventListener(
        "input",
        () => {

            messageInput.style.height =
                "auto";

            const height =
                Math.min(
                    messageInput.scrollHeight,
                    110
                );

            messageInput.style.height =
                `${height}px`;

        }
    );


    /* =====================================================
       LOAD EXISTING MESSAGES
    ===================================================== */

    async function loadMessages() {

        if (!messages) return;

        try {

            const response =
                await fetch(
                    "/api/couple-chat/messages",
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            const serverMessages =
                Array.isArray(data.messages)
                    ? data.messages
                    : Array.isArray(data)
                        ? data
                        : [];

            if (!serverMessages.length) {
                return;
            }

            messages.innerHTML = "";

            state.messages = [];

            serverMessages.forEach(
                (item) => {

                    const normalized = {

                        id:
                            item.id,

                        text:
                            item.content ||
                            item.text ||
                            "",

                        sender:
                            item.sender ||
                            item.sender_type ||
                            (
                                item.is_mine
                                    ? "me"
                                    : "partner"
                            ),

                        time:
                            item.created_at
                                ? formatServerTime(
                                    item.created_at
                                )
                                : getTime(),

                        seen:
                            Boolean(
                                item.seen
                            )

                    };

                    state.messages.push(
                        normalized
                    );

                    renderMessage(
                        normalized
                    );

                }
            );

            scrollToBottom(
                false
            );

        } catch (error) {

            console.warn(
                "Could not load couple messages:",
                error
            );

        }

    }


    function formatServerTime(
        value
    ) {

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return getTime();

        }

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(date);

    }


    /* =====================================================
       POLLING
    ===================================================== */

    let pollingTimer = null;

    function startMessagePolling() {

        if (pollingTimer) {
            clearInterval(
                pollingTimer
            );
        }

        pollingTimer =
            setInterval(
                async () => {

                    if (
                        document.hidden
                    ) {
                        return;
                    }

                    await loadMessages();

                },
                5000
            );

    }


    /* =====================================================
       PARTNER TYPING
    ===================================================== */

    function simulatePartnerTyping() {

        /*
         * Only visual fallback.
         * Real WebSocket typing should
         * replace this later.
         */

        if (
            !messageInput ||
            !messageInput.value.trim()
        ) {
            return;
        }

    }


    /* =====================================================
       ONLINE STATUS
    ===================================================== */

    function setPartnerOnline(
        online
    ) {

        state.partnerOnline =
            Boolean(online);

        const dot =
            $("coupleOnlineDot");

        const status =
            $("coupleOnlineStatus");

        if (dot) {

            dot.classList.toggle(
                "online",
                state.partnerOnline
            );

        }

        if (status) {

            status.textContent =
                state.partnerOnline
                    ? "Online"
                    : "Offline";

        }

    }


    /* =====================================================
       HEART / LOVE REACTION
    ===================================================== */

    qsa(
        "[data-reaction]"
    ).forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const reaction =
                    button.dataset.reaction;

                if (!reaction) return;

                sendReaction(
                    reaction
                );

            }
        );

    });


    async function sendReaction(
        reaction
    ) {

        const last =
            state.messages[
                state.messages.length - 1
            ];

        if (!last) return;

        const reactionMessage =
            `${reaction}`;

        try {

            await fetch(
                "/api/couple-chat/reaction",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        conversation_id:
                            state.conversationId,

                        message_id:
                            last.id,

                        reaction:
                            reactionMessage
                    })
                }
            );

        } catch (error) {

            console.warn(
                "Reaction API unavailable:",
                error
            );

        }

    }


    /* =====================================================
       BACK BUTTON
    ===================================================== */

    backButton?.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "/home";

            }

        }
    );


    /* =====================================================
       PROFILE OPEN
    ===================================================== */

    qsa(
        "[data-open-profile]"
    ).forEach((element) => {

        element.addEventListener(
            "click",
            () => {

                const userId =
                    element.dataset.openProfile;

                if (!userId) return;

                window.location.href =
                    `/profile/${encodeURIComponent(
                        userId
                    )}`;

            }
        );

    });


    /* =====================================================
       KEYBOARD / PANEL CLOSE
    ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }

            closeMoodPanel();
            closeAIPanel();

        }
    );


    /* =====================================================
       CLICK OUTSIDE PANELS
    ===================================================== */

    document.addEventListener(
        "click",
        (event) => {

            if (
                state.moodOpen &&
                moodPanel &&
                !moodPanel.contains(event.target) &&
                event.target !== moodButton
            ) {

                closeMoodPanel();

            }

            if (
                state.aiOpen &&
                aiPanel &&
                !aiPanel.contains(event.target) &&
                event.target !== aiButton
            ) {

                closeAIPanel();

            }

        }
    );


    /* =====================================================
       AI AUTO GREETING
    ===================================================== */

    function addInitialAIGreeting() {

        if (!aiPanel) return;

        const container =
            aiPanel.querySelector(
                ".ai-messages"
            ) ||
            aiPanel.querySelector(
                "[data-ai-messages]"
            );

        if (!container) return;

        if (
            container.children.length
        ) {
            return;
        }

        addAIMessage(
            "I'm your Usanex Couple AI ❤️ I can help with messages, moods, ideas and relationship moments.",
            "ai"
        );

    }


    /* =====================================================
       COUPLE NAME
    ===================================================== */

    function loadCoupleIdentity() {

        try {

            const saved =
                localStorage.getItem(
                    "usanexCouple"
                );

            if (!saved) return;

            const data =
                JSON.parse(saved);

            if (
                data.couple_name &&
                coupleName
            ) {

                coupleName.textContent =
                    data.couple_name;

            }

            if (
                data.partner_name &&
                partnerName
            ) {

                partnerName.textContent =
                    data.partner_name;

            }

            if (
                data.partner_photo &&
                partnerAvatar
            ) {

                partnerAvatar.src =
                    data.partner_photo;

            }

            if (
                data.couple_photo &&
                coupleAvatar
            ) {

                coupleAvatar.src =
                    data.couple_photo;

            }

            if (
                data.conversation_id
            ) {

                state.conversationId =
                    data.conversation_id;

            }

        } catch (error) {

            console.warn(
                "Couple identity unavailable:",
                error
            );

        }

    }


    /* =====================================================
       VISIBILITY
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                !document.hidden
            ) {

                loadMessages();

            }

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    restoreState();

    applyMood(
        state.mood
    );

    loadCoupleIdentity();

    addInitialAIGreeting();

    loadMessages();

    startMessagePolling();

    setPartnerOnline(
        false
    );

    scrollToBottom(
        false
    );


    /* =====================================================
       DEBUG
    ===================================================== */

    window.UsanexCoupleChat = {

        state,

        sendMessage,

        askAI,

        applyMood,

        openMoodPanel,

        closeMoodPanel,

        openAIPanel,

        closeAIPanel,

        addMessage,

        loadMessages

    };

});
