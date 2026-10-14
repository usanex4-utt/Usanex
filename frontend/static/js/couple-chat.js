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

   // ======================================================
// UTANEXA AI — 60 AUTOMATIC COUPLE CHAT MOODS
// ======================================================

const UTANEXA_AI_MOODS = {
    deep_love: {
        keywords: ["deep love", "soulmate", "meri jaan", "jaan ho",
            "forever", "hamesha tumhara", "dil se pyaar"],
        colors: ["#321044", "#d63384", "#ff75b5"],
        emoji: "❤️"
    },

    romantic: {
        keywords: ["romantic", "romance", "kiss", "pyaar", "love you",
            "i love you", "jaan", "baby", "darling"],
        colors: ["#351044", "#c21870", "#ff8fb8"],
        emoji: "💕"
    },

    first_love: {
        keywords: ["first love", "pehli baar pyaar", "pehla pyaar"],
        colors: ["#44204c", "#ed8cb8", "#ffc5de"],
        emoji: "🥰"
    },

    crush: {
        keywords: ["crush", "pasand ho", "like you", "tum achhe lagte"],
        colors: ["#49304e", "#ef75ae", "#ffbad7"],
        emoji: "💘"
    },

    flirting: {
        keywords: ["flirt", "hot lag rahe", "handsome", "beautiful",
            "cute lag", "kya ada"],
        colors: ["#42113b", "#d946a6", "#ffa0d0"],
        emoji: "😉"
    },

    shy_love: {
        keywords: ["sharma", "sharam aa", "blush", "laaj", "shy"],
        colors: ["#563047", "#e99ab8", "#ffd0dc"],
        emoji: "☺️"
    },

    passionate_love: {
        keywords: ["passionate", "beinteha pyaar", "deewana",
            "deewani", "pagal hoon tumhare"],
        colors: ["#421020", "#c62850", "#ff7185"],
        emoji: "🔥"
    },

    soulmate: {
        keywords: ["soulmate", "meri duniya", "sirf tum",
            "ek dusre ke liye", "made for each other"],
        colors: ["#29204f", "#8966cb", "#ff9dcf"],
        emoji: "💞"
    },

    forever_together: {
        keywords: ["forever together", "saath rahenge",
            "zindagi bhar", "hamesha saath", "kabhi nahi chhodunga"],
        colors: ["#27234f", "#745ac8", "#f4a6d7"],
        emoji: "♾️"
    },

    confession: {
        keywords: ["confess", "ek baat kahun", "i love you",
            "pyaar karta hoon", "pyaar karti hoon"],
        colors: ["#4c1c45", "#e05b9b", "#ffc2dc"],
        emoji: "💌"
    },

    caring: {
        keywords: ["khana khaya", "apna khayal", "care",
            "dawai li", "aaram karna", "dhyan rakhna"],
        colors: ["#183c50", "#468da7", "#f2a9cf"],
        emoji: "🤗"
    },

    missing_you: {
        keywords: ["miss you", "yaad aa rahi", "yaad aate",
            "tumhari yaad", "miss kar raha", "miss kar rahi"],
        colors: ["#182747", "#6655a6", "#d58abf"],
        emoji: "🥺"
    },

    emotional_bond: {
        keywords: ["samajhte ho mujhe", "mere liye ho",
            "apnapan", "dil ka rishta", "connection"],
        colors: ["#25334e", "#8069b5", "#e6a6cf"],
        emoji: "🫂"
    },

    protective_love: {
        keywords: ["safe raho", "tumhari fikr", "protect",
            "tumhe kuch na ho", "main hoon na"],
        colors: ["#20364c", "#5489a7", "#e5b1d1"],
        emoji: "🛡️"
    },

    appreciation: {
        keywords: ["proud of you", "tum best ho", "thank you",
            "shukriya", "tum bahut achhe ho"],
        colors: ["#34405a", "#8b79bc", "#ffc7db"],
        emoji: "🌸"
    },

    gratitude: {
        keywords: ["thankful", "grateful", "shukriya",
            "thanks for everything", "ehsaan"],
        colors: ["#284b59", "#75a7ad", "#e5c0da"],
        emoji: "💝"
    },

    reassurance: {
        keywords: ["bharosa rakho", "main saath hoon",
            "sab theek hoga", "tension mat lo", "don't worry"],
        colors: ["#233e57", "#678fb8", "#d6b9e8"],
        emoji: "🫶"
    },

    comfort: {
        keywords: ["ro mat", "main hoon na", "sab theek hoga",
            "tum akele nahi", "it is okay"],
        colors: ["#243a59", "#718ec1", "#c7b8ed"],
        emoji: "🤍"
    },

    special_feeling: {
        keywords: ["special", "sabse alag", "mere liye khaas",
            "important ho", "proud of you"],
        colors: ["#37244f", "#a075c4", "#ffbfdc"],
        emoji: "✨"
    },

    happy: {
        keywords: ["happy", "khush hoon", "bahut achha",
            "maza aa gaya", "yay", "great"],
        colors: ["#27466a", "#438fc0", "#ffd07f"],
        emoji: "😊"
    },

    excited: {
        keywords: ["excited", "can't wait", "bahut excited",
            "jaldi milenge", "woohoo"],
        colors: ["#3a3068", "#8b70d7", "#ffbc79"],
        emoji: "🤩"
    },

    funny: {
        keywords: ["hahaha", "lol", "joke", "has raha",
            "has rahi", "bahut funny"],
        colors: ["#31516b", "#57b7c1", "#ffce78"],
        emoji: "😂"
    },

    playful: {
        keywords: ["masti", "mazak", "chhedna", "pagal ho",
            "hehe", "hehehe"],
        colors: ["#4a326b", "#bb76d1", "#ffb5b5"],
        emoji: "😜"
    },

    teasing: {
        keywords: ["chidhana", "tease", "pakad ke dikhao",
            "achha ji", "bade aaye"],
        colors: ["#49305c", "#d37bb4", "#ffc28d"],
        emoji: "😏"
    },

    cute_moments: {
        keywords: ["cutie", "so cute", "pyaru", "golu",
            "aww", "kitne cute"],
        colors: ["#56304e", "#ed9fc7", "#ffe0eb"],
        emoji: "🧸"
    },

    celebration: {
        keywords: ["congratulations", "congrats", "party",
            "celebrate", "birthday", "success"],
        colors: ["#342b66", "#9275d6", "#ffd27c"],
        emoji: "🎉"
    },

    naughty_fun: {
        keywords: ["naughty", "badmash", "shararti",
            "mischief", "bade shararti"],
        colors: ["#402747", "#a45bb6", "#f6a5c7"],
        emoji: "😈"
    },

    crazy_together: {
        keywords: ["crazy", "pagalpan", "hum dono pagal",
            "full pagal", "kya jodi hai"],
        colors: ["#34305e", "#9b72ce", "#ffb77d"],
        emoji: "🤪"
    },

    sweet_surprise: {
        keywords: ["surprise", "guess what", "gift",
            "tumhare liye kuch", "surprise hai"],
        colors: ["#392653", "#ad73cb", "#ffd18d"],
        emoji: "🎁"
    },

    sad: {
        keywords: ["sad", "dukhi", "udaas", "rona aa raha",
            "mann nahi lag raha"],
        colors: ["#172b46", "#425c89", "#8e9ac5"],
        emoji: "💔"
    },

    missing_someone: {
        keywords: ["akela lag raha", "tum nahi ho",
            "tumhare bina", "kisi ki yaad", "lonely"],
        colors: ["#1c2945", "#555b92", "#a68bbd"],
        emoji: "🌧️"
    },

    lonely: {
        keywords: ["lonely", "akela hoon", "koi nahi hai",
            "bahut akela", "alone"],
        colors: ["#18253b", "#45516d", "#858fa9"],
        emoji: "🥀"
    },

    heartbroken: {
        keywords: ["heartbroken", "dil toot gaya",
            "dil tod diya", "breakup", "rishta khatam"],
        colors: ["#291b34", "#68405f", "#b37b99"],
        emoji: "💔"
    },

    emotional: {
        keywords: ["emotional ho gaya", "aankhon mein aansu",
            "dil bhar aaya", "rona aa gaya"],
        colors: ["#222a4a", "#666da4", "#c0a2cf"],
        emoji: "😢"
    },

    feeling_low: {
        keywords: ["low feel", "mann udaas", "energy nahi",
            "thak gaya hoon", "kuch achha nahi lagta"],
        colors: ["#202b40", "#59677e", "#9ca8bf"],
        emoji: "🌫️"
    },

    need_support: {
        keywords: ["help chahiye", "support chahiye",
            "mujhe sambhalo", "baat karni hai", "pareshan hoon"],
        colors: ["#24344f", "#637ba5", "#b6addd"],
        emoji: "🫂"
    },

    disappointed: {
        keywords: ["disappointed", "nirash", "ummeed nahi thi",
            "dil dukha diya", "expect nahi kiya"],
        colors: ["#30283d", "#76617d", "#c4a0b5"],
        emoji: "😞"
    },

    nostalgic: {
        keywords: ["purani yaadein", "yaad hai jab",
            "pehle hum", "woh din", "memories"],
        colors: ["#3b2b48", "#92749e", "#d9b6bb"],
        emoji: "🕰️"
    },

    healing: {
        keywords: ["heal", "aage badhna", "nayi shuruaat",
            "ab behtar hoon", "move on"],
        colors: ["#23464b", "#65a8a0", "#d5d7b2"],
        emoji: "❤️‍🩹"
    },

    angry: {
        keywords: ["gussa", "angry", "bahut gussa",
            "naraz hoon", "irritated"],
        colors: ["#36232b", "#914c50", "#d99a7b"],
        emoji: "😠"
    },

    annoyed: {
        keywords: ["pareshan kar rahe", "annoying",
            "dimag mat khao", "chidh gaya", "chidh gayi"],
        colors: ["#39303a", "#916879", "#d4a5a0"],
        emoji: "😒"
    },

    jealous: {
        keywords: ["jealous", "jalan", "kiske saath",
            "mujhe achha nahi laga", "possessive"],
        colors: ["#302541", "#795b87", "#d49ab7"],
        emoji: "😶"
    },

    misunderstood: {
        keywords: ["samjhe nahi", "galat samjha",
            "meri baat samjho", "misunderstand", "meri baat suno"],
        colors: ["#303047", "#73739b", "#c0b2d0"],
        emoji: "🥹"
    },

    serious_talk: {
        keywords: ["serious baat", "ek zaroori baat",
            "seriously", "future ke baare", "baat karni hai"],
        colors: ["#202c42", "#536987", "#9baac3"],
        emoji: "💬"
    },

    apologetic: {
        keywords: ["sorry", "maaf kar do", "meri galti",
            "mujhse galti hui", "forgive me"],
        colors: ["#343047", "#88759f", "#d9b9cb"],
        emoji: "🙏"
    },

    forgiveness: {
        keywords: ["maaf kiya", "maaf kar diya",
            "it's okay", "koi baat nahi", "forgive"],
        colors: ["#254b4b", "#70a9a0", "#d4d9b7"],
        emoji: "🕊️"
    },

    making_up: {
        keywords: ["ab naraz nahi", "phir se saath",
            "maan jao", "sab bhool jao", "patch up"],
        colors: ["#3e2949", "#b26e9d", "#ffc0d5"],
        emoji: "❤️‍🩹"
    },

    trust_building: {
        keywords: ["trust", "bharosa", "vishwas",
            "sach bol raha", "sach bol rahi"],
        colors: ["#254052", "#5e8c9d", "#c5b9d7"],
        emoji: "🤝"
    },

    peaceful_resolution: {
        keywords: ["ab sab theek", "suljha lete",
            "shanti se", "milkar solve", "no problem"],
        colors: ["#24464d", "#6ba9a0", "#d5d9b5"],
        emoji: "🕊️"
    },

    good_morning: {
        keywords: ["good morning", "suprabhat",
            "uth gaye", "subah ho gayi", "morning jaan"],
        colors: ["#614b45", "#e9a56e", "#ffe2a1"],
        emoji: "☀️"
    },

    good_night: {
        keywords: ["good night", "shubh ratri",
            "so jao", "sweet dreams", "gn jaan"],
        colors: ["#121d3c", "#343e79", "#8f8dd0"],
        emoji: "🌙"
    },

    midnight_talks: {
        keywords: ["raat bhar", "midnight", "neend nahi",
            "raat ko baat", "late night"],
        colors: ["#10172f", "#34365f", "#9b83be"],
        emoji: "🌌"
    },

    rainy_romance: {
        keywords: ["baarish", "rain", "bheeg", "mausam romantic",
            "rainy day"],
        colors: ["#1b344c", "#547d9c", "#d4a6c9"],
        emoji: "🌧️"
    },

    dreamy: {
        keywords: ["dream", "sapna", "khwaab",
            "fairy tale", "dreamy"],
        colors: ["#31254f", "#8b76c7", "#eab3d9"],
        emoji: "✨"
    },

    calm: {
        keywords: ["calm", "peaceful", "sukoon",
            "relax", "shanti", "aaraam"],
        colors: ["#1d3c4b", "#639caa", "#c2d9d6"],
        emoji: "🪷"
    },

    deep_conversation: {
        keywords: ["dil ki baat", "deep talk",
            "andar ki baat", "life ke baare", "samjho mujhe"],
        colors: ["#1b2949", "#596da0", "#c5a9d6"],
        emoji: "🌊"
    },

    future_dreams: {
        keywords: ["future", "sapne poore", "ghar banayenge",
            "shaadi karenge", "future plan"],
        colors: ["#2e2b58", "#8b80c9", "#e6c0d9"],
        emoji: "🌠"
    },

    long_distance: {
        keywords: ["long distance", "door ho tum",
            "dooriyan", "online relationship", "kab miloge"],
        colors: ["#1b2d4c", "#6667a8", "#df9dc7"],
        emoji: "🌍"
    },

    together_forever: {
        keywords: ["shaadi", "life partner", "hamesha tumhare",
            "budhape tak", "saath nibhana"],
        colors: ["#38264c", "#9a6fba", "#ffd0dd"],
        emoji: "💍"
    }
};


// ------------------------------------------------------
// MOOD DETECTION
// Latest messages ko analyze karta hai.
// Yeh lightweight keyword-based detection hai, full AI model nahi.
// ------------------------------------------------------

function detectUtaNexaMood(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return null;
    }

    const recentMessages = messages.slice(-8);

    const text = recentMessages
        .map(message => String(message.content || message.text || ""))
        .join(" ")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s']/gu, " ");

    let bestMood = null;
    let bestScore = 0;

    for (const [mood, config] of Object.entries(UTANEXA_AI_MOODS)) {
        let score = 0;

        for (const keyword of config.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                score += keyword.includes(" ") ? 2 : 1;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMood = mood;
        }
    }

    // Weak evidence par theme ko forcefully change mat karo.
    return bestScore >= 2 ? bestMood : null;
}


// ------------------------------------------------------
// AUTOMATIC MOOD CONTROLLER
// Har 10 seconds mein conversation mood check karega.
// ------------------------------------------------------

let utanexaAutoMoodTimer = null;
let utanexaLastAutoMood = null;
let utanexaManualMoodUntil = 0;

function startUtaNexaAutoMood() {
    if (utanexaAutoMoodTimer) {
        clearInterval(utanexaAutoMoodTimer);
    }

    utanexaAutoMoodTimer = setInterval(() => {
        try {
            // Existing chat state se messages leta hai.
            if (typeof state === "undefined" || !Array.isArray(state.messages)) {
                return;
            }

            // Manual mood select kiya hai toh use respect karo.
            if (Date.now() < utanexaManualMoodUntil) {
                return;
            }

            const detectedMood = detectUtaNexaMood(state.messages);

            if (!detectedMood || detectedMood === utanexaLastAutoMood) {
                return;
            }

            // Current app ke mood function ko use karo.
            if (typeof setMood === "function") {
                setMood(detectedMood);
                utanexaLastAutoMood = detectedMood;
            }

        } catch (error) {
            console.warn("[UtaNexa AI Mood]", error);
        }
    }, 10000);
}


// ------------------------------------------------------
// OPTIONAL: Manual mood select karne par auto mood pause.
// Agar user 2 minute tak manually selected mood rakhe,
// automatic detection us dauran theme change nahi karega.
// ------------------------------------------------------

function pauseUtaNexaAutoMoodForManualSelection() {
    utanexaManualMoodUntil = Date.now() + 120000;
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
