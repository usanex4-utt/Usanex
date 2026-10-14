/* =========================================================
   UTANEXA — COUPLE CHAT
   File: static/js/couple-chat.js

   Features:
   - Online / Last seen status
   - WebSocket messages and history
   - Typing indicator
   - Message receipts
   - Mood selection
   - Emoji picker
   - Suggestions and quick actions
========================================================= */

(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const state = {
        partnerOnline: false,
        connected: false,
        typing: false,
        messages: [],
        currentUserId: null,
        partnerId: null,
        realtime: null,
        partnerLastSeen: null,
        lastSeenTimer: null,
        typingTimer: null,
        currentMode: "romantic",
        manualMood: null
    };

    const STORAGE_PREFIX = "utanexa_couple_chat_";

    /* =====================================================
       HELPERS
    ===================================================== */

    function getPartnerId() {
        const params = new URLSearchParams(window.location.search);

        return (
            params.get("partner_id") ||
            params.get("user_id") ||
            params.get("id") ||
            null
        );
    }

    function getStoredMessages() {
        try {
            const raw = localStorage.getItem(
                STORAGE_PREFIX + state.partnerId
            );

            const messages = JSON.parse(raw || "[]");

            return Array.isArray(messages) ? messages : [];
        } catch (_) {
            return [];
        }
    }

    function saveMessages() {
        try {
            localStorage.setItem(
                STORAGE_PREFIX + state.partnerId,
                JSON.stringify(state.messages.slice(-200))
            );
        } catch (error) {
            console.warn("[Couple Chat] Could not save messages.", error);
        }
    }

    function createClientMessageId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return "client_" + window.crypto.randomUUID();
        }

        return (
            "client_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2, 10)
        );
    }

    function normalizeMessage(message) {
        return {
            ...message,
            id: message.id ?? message.message_id ?? message.client_message_id ?? null,
            message_id: message.message_id ?? message.id ?? null,
            client_message_id:
                message.client_message_id ??
                message.client_id ??
                null,
            sender_id: message.sender_id ?? message.senderId ?? null,
            receiver_id: message.receiver_id ?? message.receiverId ?? null,
            content: message.content ?? "",
            timestamp: message.timestamp ?? new Date().toISOString(),
            status: message.status ?? "sent"
        };
    }

    function isOwnMessage(message) {
        if (
            state.currentUserId === null ||
            message.sender_id === null ||
            message.sender_id === undefined
        ) {
            return false;
        }

        return String(message.sender_id) === String(state.currentUserId);
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    /* =====================================================
       ONLINE / LAST SEEN
    ===================================================== */
function formatLastSeen(value) {
    if (!value) {
        return "Last seen time unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Last seen time unavailable";
    }

    // Convert the timestamp to Indian Standard Time.
    const time = date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).toLowerCase();

    const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
    });

    const seenDate = date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
    });

    const yesterdayDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
    });

    if (seenDate === today) {
        return `Last seen today at ${time}`;
    }

    if (seenDate === yesterdayDate) {
        return `Last seen yesterday at ${time}`;
    }

    const dateText = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    return `Last seen on ${dateText} at ${time}`;
}

    function updateCouplePartnerStatus(isOnline, lastSeen) {
        const statusElement = $("couplePartnerStatus");
        const onlineDot = $("coupleOnlineDot");

        state.partnerOnline = Boolean(isOnline);

        if (lastSeen !== undefined && lastSeen !== null) {
            state.partnerLastSeen = lastSeen;
        }

        if (onlineDot) {
            onlineDot.hidden = !state.partnerOnline;
        }

        if (statusElement) {
            statusElement.textContent = state.partnerOnline
                ? "Online"
                : formatLastSeen(state.partnerLastSeen);
        }
    }

    function startLastSeenRefresh() {
        if (state.lastSeenTimer) {
            clearInterval(state.lastSeenTimer);
        }

        state.lastSeenTimer = setInterval(() => {
            if (!state.partnerOnline) {
                updateCouplePartnerStatus(
                    false,
                    state.partnerLastSeen
                );
            }
        }, 60000);
    }

    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message) {
        const toast = $("coupleToast");

        if (!toast) {
            console.info("[Couple Chat]", message);
            return;
        }

        toast.textContent = message;
        toast.hidden = false;
        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
            toast.hidden = true;
        }, 2500);
    }

    /* =====================================================
       MESSAGE RENDERING
    ===================================================== */

    function renderMessages() {
        const container = $("coupleMessages");

        if (!container) return;

        container.replaceChildren();

        state.messages.forEach((message) => {
            container.appendChild(createMessageElement(message));
        });

        scrollToBottom();
    }

    function createMessageElement(message) {
        const own = isOwnMessage(message);
        const row = document.createElement("div");

        row.className = own
            ? "couple-message-row own"
            : "couple-message-row partner";

        const bubble = document.createElement("div");
        bubble.className = "couple-message-bubble";

        if (message.media_url) {
            if (
                message.media_type === "image" ||
                message.message_type === "image"
            ) {
                const image = document.createElement("img");
                image.src = message.media_url;
                image.alt = "Shared image";
                image.loading = "lazy";
                image.className = "couple-message-image";
                bubble.appendChild(image);
            } else {
                const link = document.createElement("a");
                link.href = message.media_url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Open attachment";
                bubble.appendChild(link);
            }
        }

        if (message.content) {
            const text = document.createElement("div");
            text.className = "couple-message-text";
            text.textContent = message.content;
            bubble.appendChild(text);
        }

        const meta = document.createElement("div");
        meta.className = "couple-message-meta";

        const time = document.createElement("span");
        time.textContent = formatMessageTime(message.timestamp);
        meta.appendChild(time);

        if (own) {
            const receipt = document.createElement("span");
            receipt.className = "couple-message-receipt";
            receipt.textContent = getReceiptLabel(message.status);
            meta.appendChild(receipt);
        }

        bubble.appendChild(meta);
        row.appendChild(bubble);

        return row;
    }

    function formatMessageTime(value) {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function getReceiptLabel(status) {
        switch (status) {
            case "seen":
            case "read":
                return "✓✓ Seen";

            case "delivered":
                return "✓✓ Delivered";

            case "sent":
            default:
                return "✓ Sent";
        }
    }

    function scrollToBottom() {
        const conversation = $("coupleConversation");

        if (conversation) {
            conversation.scrollTop = conversation.scrollHeight;
        }
    }

    function addMessage(rawMessage) {
        const message = normalizeMessage(rawMessage);

        const existingIndex = state.messages.findIndex((item) => {
            if (
                message.message_id &&
                item.message_id &&
                String(message.message_id) === String(item.message_id)
            ) {
                return true;
            }

            if (
                message.client_message_id &&
                item.client_message_id &&
                message.client_message_id === item.client_message_id
            ) {
                return true;
            }

            return false;
        });

        if (existingIndex !== -1) {
            const oldMessage = state.messages[existingIndex];

            state.messages[existingIndex] = {
                ...oldMessage,
                ...message
            };
        } else {
            state.messages.push(message);
        }

        state.messages.sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        saveMessages();
        renderMessages();
    }

    function mergeHistory(messages) {
        if (!Array.isArray(messages)) return;

        messages.forEach((message) => {
            addMessage(message);
        });
    }

    function updateMessageReceipt(receipt) {
        if (!receipt) return;

        const messageId = receipt.message_id;
        const clientId =
            receipt.client_message_id ??
            receipt.client_id ??
            null;

        const index = state.messages.findIndex((message) => {
            return (
                (messageId &&
                    message.message_id &&
                    String(message.message_id) === String(messageId)) ||
                (clientId &&
                    message.client_message_id &&
                    String(message.client_message_id) === String(clientId))
            );
        });

        if (index === -1) return;

        state.messages[index] = {
            ...state.messages[index],
            message_id:
                messageId ?? state.messages[index].message_id,
            id:
                messageId ?? state.messages[index].id,
            status: receipt.status ?? state.messages[index].status
        };

        saveMessages();
        renderMessages();
    }

    /* =====================================================
       TYPING INDICATOR
    ===================================================== */

    function updateTypingIndicator(info) {
        const typingElement = $("coupleTyping");

        if (!typingElement) return;

        const senderId =
            info.sender_id ??
            info.user_id ??
            info.senderId ??
            null;

        if (
            senderId !== null &&
            String(senderId) !== String(state.partnerId)
        ) {
            return;
        }

        const isTyping = Boolean(
            info.is_typing ??
            info.isTyping ??
            false
        );

        typingElement.hidden = !isTyping;
    }

    /* =====================================================
       REALTIME INITIALIZATION
    ===================================================== */

    function initializeRealtime() {
        if (state.realtime) return;

        if (typeof window.UsanexCoupleRealtime !== "function") {
            console.warn(
                "[Couple Chat] couple-realtime.js has not loaded."
            );
            return;
        }

        if (!state.partnerId) {
            console.warn(
                "[Couple Chat] Missing partner ID in page URL."
            );
            return;
        }

        state.realtime = new window.UsanexCoupleRealtime({
            partnerId: state.partnerId,

            onConnection(info) {
                state.connected = info.connected === true;

                if (info.user && info.user.id !== undefined) {
                    state.currentUserId = info.user.id;
                }

                const online =
                    info.partner_online ??
                    info.partnerOnline ??
                    false;

                const lastSeen =
                    info.partner_last_seen ??
                    info.partnerLastSeen ??
                    info.raw?.partner_last_seen ??
                    state.partnerLastSeen;

                updateCouplePartnerStatus(online, lastSeen);

                if (Array.isArray(info.history)) {
                    mergeHistory(info.history);
                }
            },

            onHistory(messages) {
                mergeHistory(messages);
            },

            onMessage(message) {
                addMessage(message);

                const own = (
                    state.currentUserId !== null &&
                    String(message.sender_id) ===
                        String(state.currentUserId)
                );

                if (
                    !own &&
                    message.message_id &&
                    state.realtime
                ) {
                    state.realtime.sendDelivered(message.message_id);
                }
            },

            onReceipt(receipt) {
                updateMessageReceipt(receipt);
            },

            onPresence(presence) {
                if (!presence) return;

                const userId =
                    presence.user_id ??
                    presence.userId ??
                    null;

                if (String(userId) !== String(state.partnerId)) {
                    return;
                }

                updateCouplePartnerStatus(
                    presence.is_online ??
                        presence.isOnline ??
                        false,
                    presence.last_seen ??
                        presence.lastSeen ??
                        null
                );
            },

            onTyping(info) {
                updateTypingIndicator(info);
            },

            onError(error) {
                console.warn("[Couple Chat] Realtime error:", error);
            },

            onDisconnect() {
                state.connected = false;

                // Never show "Offline".
                updateCouplePartnerStatus(
                    false,
                    state.partnerLastSeen
                );
            }
        });

        state.realtime.connect();
    }

    /* =====================================================
       MESSAGE SENDING
    ===================================================== */

    function sendTextMessage(text) {
        const content = String(text ?? "").trim();

        if (!content) return;

        if (content.length > 4000) {
            showToast("Message is too long.");
            return;
        }

        if (!state.realtime || !state.connected) {
            showToast("Connecting… Please try again.");
            return;
        }

        const clientId = createClientMessageId();

        const message = {
            id: clientId,
            message_id: null,
            client_message_id: clientId,
            client_id: clientId,
            sender_id: state.currentUserId,
            receiver_id: state.partnerId,
            content,
            message_type: "text",
            timestamp: new Date().toISOString(),
            status: "sent"
        };

        addMessage(message);

        const sent = state.realtime.sendMessage(message);

        if (!sent) {
            showToast("Message could not be sent. Please try again.");
        }

        const input = $("coupleMessageInput");

        if (input) {
            input.value = "";
            input.focus();
        }

        state.realtime.stopTyping();
    }

    /* =====================================================
       EMOJI PICKER
    ===================================================== */

    const DEFAULT_EMOJIS = [
        "❤️", "😍", "🥰", "😘", "💕", "💖",
        "😊", "😂", "🥹", "🤗", "😚", "💋",
        "🌹", "💐", "🫶", "✨", "💙", "💞",
        "😢", "😔", "🥺", "😎", "🔥", "🌙",
        "☀️", "🧸", "💌", "💍", "🎉", "🤍"
    ];

    function renderEmojiPicker(filter = "") {
        const grid = $("coupleEmojiGrid");

        if (!grid) return;

        grid.replaceChildren();

        const query = filter.trim();

        DEFAULT_EMOJIS
            .filter((emoji) => !query || emoji.includes(query))
            .forEach((emoji) => {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "couple-emoji-option";
                button.textContent = emoji;
                button.setAttribute("aria-label", emoji);

                button.addEventListener("click", () => {
                    const input = $("coupleMessageInput");

                    if (input) {
                        input.value += emoji;
                        input.focus();
                    }
                });

                grid.appendChild(button);
            });
    }

    function toggleEmojiPicker(show) {
        const picker = $("coupleEmojiPicker");
        const backdrop = $("couplePickerBackdrop");

        if (picker) picker.hidden = !show;
        if (backdrop) backdrop.hidden = !show;

        if (show) {
            renderEmojiPicker();
        }
    }

    /* =====================================================
       MOOD
    ===================================================== */

    function setMood(mode) {
        if (!mode) return;

        state.currentMode = mode;
        state.manualMood = mode;

        try {
            localStorage.setItem(
                STORAGE_PREFIX + "mood_" + state.partnerId,
                mode
            );
        } catch (_) {}

        const moodLabel = $("coupleHeaderMood");

        if (moodLabel) {
            moodLabel.textContent = mode;
        }

        const overlay = $("coupleMoodOverlay");

        if (overlay) {
            overlay.classList.add("hidden");
        }

        const moodOverlay = $("coupleMoodOverlay");

        if (moodOverlay) {
            moodOverlay.hidden = true;
        }

        document.querySelectorAll("[data-mode]").forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });

        const moodButton = document.querySelector(
            `[data-mode="${CSS.escape(mode)}"]`
        );

        if (moodButton) {
            moodButton.setAttribute("aria-pressed", "true");
        }
    }

    function initializeMood() {
        let savedMood = null;

        try {
            savedMood = localStorage.getItem(
                STORAGE_PREFIX + "mood_" + state.partnerId
            );
        } catch (_) {}

        if (savedMood) {
            setMood(savedMood);
        }

        document.querySelectorAll("[data-mode]").forEach((button) => {
            button.addEventListener("click", () => {
                setMood(button.dataset.mode);
            });
        });

        const openMood = $("coupleHeaderMood");

        if (openMood) {
            openMood.addEventListener("click", () => {
                const overlay = $("coupleMoodOverlay");

                if (overlay) {
                    overlay.hidden = false;
                    overlay.classList.remove("hidden");
                }
            });
        }

        const closeMood = $("closeMoodPanel");

        if (closeMood) {
            closeMood.addEventListener("click", () => {
                const overlay = $("coupleMoodOverlay");

                if (overlay) {
                    overlay.hidden = true;
                    overlay.classList.add("hidden");
                }
            });
        }
    }

    /* =====================================================
       SUGGESTIONS / QUICK ACTIONS
    ===================================================== */

    const SUGGESTIONS = [
        "I miss you ❤️",
        "How was your day?",
        "You make me smile 😊",
        "Tell me something sweet 💕",
        "Sending you a hug 🤗"
    ];

    function renderSuggestions() {
        const container = $("coupleSuggestionList");

        if (!container) return;

        container.replaceChildren();

        SUGGESTIONS.forEach((suggestion) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "couple-suggestion";
            button.textContent = suggestion;

            button.addEventListener("click", () => {
                const input = $("coupleMessageInput");

                if (input) {
                    input.value = suggestion;
                    input.focus();
                }
            });

            container.appendChild(button);
        });
    }

    function initializeQuickActions() {
        document.querySelectorAll(
            "[data-action], [data-quick-action]"
        ).forEach((button) => {
            button.addEventListener("click", () => {
                const action =
                    button.dataset.action ??
                    button.dataset.quickAction ??
                    "";

                const input = $("coupleMessageInput");

                const actionMessages = {
                    love: "I love you ❤️",
                    memory: "What's your favourite memory of us? 💕",
                    question: "Can I ask you something? 😊",
                    game: "Let's play a little question game! 🎮"
                };

                const text = actionMessages[action];

                if (input && text) {
                    input.value = text;
                    input.focus();
                }
            });
        });
    }

    /* =====================================================
       ATTACHMENT PREVIEW
    ===================================================== */

    function initializeAttachments() {
        const attachButton = $("coupleAttachButton");
        const fileInput = $("coupleFileInput");
        const cameraButton = $("coupleCameraButton");
        const cameraInput = $("coupleCameraInput");

        if (attachButton && fileInput) {
            attachButton.addEventListener("click", () => {
                fileInput.click();
            });

            fileInput.addEventListener("change", () => {
                const file = fileInput.files?.[0];

                if (file) {
                    showToast(
                        `${file.name} selected. Upload support is not configured here.`
                    );
                }

                fileInput.value = "";
            });
        }

        if (cameraButton && cameraInput) {
            cameraButton.addEventListener("click", () => {
                cameraInput.click();
            });

            cameraInput.addEventListener("change", () => {
                const file = cameraInput.files?.[0];

                if (file) {
                    showToast(
                        "Photo selected. Upload support is not configured here."
                    );
                }

                cameraInput.value = "";
            });
        }
    }

    /* =====================================================
       EVENT BINDINGS
    ===================================================== */

    function initializeControls() {
        const form = $("coupleComposer");
        const input = $("coupleMessageInput");
        const emojiButton = $("coupleEmojiButton");
        const emojiClose = $("closeEmojiPicker");
        const emojiSearch = $("coupleEmojiSearch");
        const backdrop = $("couplePickerBackdrop");

        if (form && input) {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                sendTextMessage(input.value);
            });

            input.addEventListener("input", () => {
                if (state.realtime && state.connected) {
                    state.realtime.startTyping();

                    clearTimeout(state.typingTimer);

                    state.typingTimer = setTimeout(() => {
                        if (state.realtime) {
                            state.realtime.stopTyping();
                        }
                    }, 1800);
                }
            });
        }

        if (emojiButton) {
            emojiButton.addEventListener("click", () => {
                const picker = $("coupleEmojiPicker");

                toggleEmojiPicker(!picker || picker.hidden);
            });
        }

        if (emojiClose) {
            emojiClose.addEventListener("click", () => {
                toggleEmojiPicker(false);
            });
        }

        if (emojiSearch) {
            emojiSearch.addEventListener("input", () => {
                renderEmojiPicker(emojiSearch.value);
            });
        }

        if (backdrop) {
            backdrop.addEventListener("click", () => {
                toggleEmojiPicker(false);
            });
        }

        const suggestionsClose = $("closeSuggestions");

        if (suggestionsClose) {
            suggestionsClose.addEventListener("click", () => {
                const suggestions = $("coupleSuggestions");

                if (suggestions) {
                    suggestions.hidden = true;
                }
            });
        }

        const backButton = $("coupleBackButton");

        if (backButton) {
            backButton.addEventListener("click", () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = "/";
                }
            });
        }

        const aiButton = $("coupleAiButton");
        const aiPanel = $("coupleAiOverlay");
        const aiClose = $("closeAiPanel");

        if (aiButton && aiPanel) {
            aiButton.addEventListener("click", () => {
                aiPanel.hidden = false;
                aiPanel.classList.remove("hidden");
            });
        }

        if (aiClose && aiPanel) {
            aiClose.addEventListener("click", () => {
                aiPanel.hidden = true;
                aiPanel.classList.add("hidden");
            });
        }

        const menuButton = $("coupleMenuButton");
        const menuOverlay = $("coupleMenuOverlay");
        const menuClose = $("closeCoupleMenu");

        if (menuButton && menuOverlay) {
            menuButton.addEventListener("click", () => {
                menuOverlay.hidden = false;
                menuOverlay.classList.remove("hidden");
            });
        }

        if (menuClose && menuOverlay) {
            menuClose.addEventListener("click", () => {
                menuOverlay.hidden = true;
                menuOverlay.classList.add("hidden");
            });
        }

        document.querySelectorAll("[data-menu-action]").forEach((button) => {
            button.addEventListener("click", () => {
                const action = button.dataset.menuAction;

                if (action === "close") {
                    if (menuOverlay) menuOverlay.hidden = true;
                } else if (action === "clear-chat") {
                    if (
                        window.confirm(
                            "Clear locally stored messages for this chat?"
                        )
                    ) {
                        state.messages = [];
                        saveMessages();
                        renderMessages();
                    }
                }
            });
        });

        initializeAttachments();
        initializeQuickActions();
    }

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initializeCoupleChat() {
        state.partnerId = getPartnerId();

        if (!state.partnerId) {
            updateCouplePartnerStatus(false, null);

            console.warn(
                "[Couple Chat] No partner ID was provided in the URL."
            );
        } else {
            state.messages = getStoredMessages();
            renderMessages();
        }

        initializeControls();
        initializeMood();
        renderSuggestions();

        updateCouplePartnerStatus(false, null);
        startLastSeenRefresh();

        if (state.partnerId) {
            initializeRealtime();
        }
    }

    /* =====================================================
       CLEANUP
    ===================================================== */

    window.addEventListener("beforeunload", () => {
        if (state.lastSeenTimer) {
            clearInterval(state.lastSeenTimer);
        }

        if (state.typingTimer) {
            clearTimeout(state.typingTimer);
        }

        if (state.realtime) {
            state.realtime.disconnect();
        }
    });

    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.UtaNexaCoupleChat = {
        addMessage,
        setMood,
        sendTextMessage,
        updateCouplePartnerStatus,
        getState: () => ({ ...state })
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeCoupleChat,
            { once: true }
        );
    } else {
        initializeCoupleChat();
    }
})();
