/* ============================================================
   UTANEXA — NORMAL CHAT
   Complete JavaScript Replacement
   File: frontend/static/js/chat.js

   Features:
   - Authentication
   - User profile and online status
   - Text messaging
   - Image / file sending
   - Image compression
   - Emoji picker
   - Message search
   - Speech-to-text
   - Voice recording
   - Image viewer
   - Conversation menu
   - Couple Chat navigation
   - Voice/video call UI hooks
   - Message polling and deduplication
   - Mobile responsive support

   API:
   GET  /api/auth/me
   GET  /api/profile/{user_id}
   GET  /api/chat/{user_id}
   POST /api/chat/send
   ============================================================ */

(function () {
    "use strict";

    /* ========================================================
       1. CONFIGURATION
    ======================================================== */

    const API = {
        me: "/api/auth/me",

        profile: function (id) {
            return "/api/profile/" + encodeURIComponent(id);
        },

        messages: function (id) {
            return "/api/chat/" + encodeURIComponent(id);
        },

        send: "/api/chat/send"
    };

    const CONFIG = {
        maxFileSize: 25 * 1024 * 1024,
        compressAbove: 2 * 1024 * 1024,
        maxImageDimension: 1920,
        imageQuality: 0.88,
        pollInterval: 4000,
        requestTimeout: 20000
    };

    const $ = function (id) {
        return document.getElementById(id);
    };

    const state = {
        me: null,
        partner: null,

        partnerId: null,

        messages: [],
        messageIds: new Set(),

        loadingMessages: false,
        sendingMessage: false,

        pollingTimer: null,
        pollingActive: false,

        activeExpressionTab: "emoji",
        activeEmojiCategory: "smileys",

        recentEmojis: [],

        selectedFile: null,

        mediaRecorder: null,
        recordedChunks: [],
        recordingStream: null,
        recordingTimer: null,
        recordingStartedAt: 0,
        recordingSeconds: 0,

        isRecording: false,
        isSendingRecording: false,

        speechRecognition: null,
        speechActive: false,

        searchTerm: "",

        toastTimer: null,

        currentAudio: null,

        lastMessageSignature: null
    };

    /* ========================================================
       2. SAFE HELPERS
    ======================================================== */

    function getParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function firstValue(object, keys, fallback) {
        if (!object || typeof object !== "object") {
            return fallback;
        }

        for (const key of keys) {
            const value = object[key];

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return value;
            }
        }

        return fallback;
    }

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normaliseId(value) {
        return String(value == null ? "" : value).trim();
    }

    function sameId(a, b) {
        return normaliseId(a) === normaliseId(b);
    }

    function getUserId(user) {
        return normaliseId(
            firstValue(
                user,
                ["user_id", "id", "username", "uid"],
                ""
            )
        );
    }

    function getUserName(user) {
        return String(
            firstValue(
                user,
                ["name", "full_name", "username", "display_name"],
                "UtaNexa User"
            )
        );
    }

    function getAvatar(user) {
        return String(
            firstValue(
                user,
                [
                    "avatar_url",
                    "profile_picture",
                    "profile_image",
                    "photo_url",
                    "image_url",
                    "avatar"
                ],
                ""
            )
        );
    }

    function getMessageId(message) {
        return normaliseId(
            firstValue(
                message,
                ["id", "message_id", "uuid"],
                ""
            )
        );
    }

    function getMessageText(message) {
        return String(
            firstValue(
                message,
                ["content", "message", "text", "body"],
                ""
            )
        );
    }

    function getMessageSenderId(message) {
        return normaliseId(
            firstValue(
                message,
                [
                    "sender_id",
                    "user_id",
                    "from_user_id",
                    "sender_user_id"
                ],
                ""
            )
        );
    }

    function getMessageTimestamp(message) {
        return firstValue(
            message,
            [
                "created_at",
                "timestamp",
                "sent_at",
                "created",
                "time"
            ],
            null
        );
    }

    function getMessageMediaUrl(message) {
        return String(
            firstValue(
                message,
                [
                    "file_url",
                    "attachment_url",
                    "media_url",
                    "image_url",
                    "audio_url",
                    "voice_url",
                    "file"
                ],
                ""
            )
        );
    }

    function isImageMessage(message) {
        const type = String(
            firstValue(
                message,
                ["file_type", "media_type", "attachment_type", "type"],
                ""
            )
        ).toLowerCase();

        const url = getMessageMediaUrl(message);

        return (
            type.startsWith("image") ||
            /\.(png|jpe?g|gif|webp|bmp|avif)(\?.*)?$/i.test(url)
        );
    }

    function isAudioMessage(message) {
        const type = String(
            firstValue(
                message,
                ["file_type", "media_type", "attachment_type", "type"],
                ""
            )
        ).toLowerCase();

        const url = getMessageMediaUrl(message);

        return (
            type.startsWith("audio") ||
            type.startsWith("voice") ||
            /\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i.test(url)
        );
    }

    function getErrorMessage(error, fallback) {
        if (error && error.message) {
            return error.message;
        }

        return fallback || "Kuch galat ho gaya.";
    }

    /* ========================================================
       3. TOAST
    ======================================================== */

    function showToast(message, duration) {
        const toast = $("chatToast");

        if (!toast) {
            console.log("[UtaNexa Chat]", message);
            return;
        }

        toast.textContent = String(message || "");

        toast.hidden = false;

        if (state.toastTimer) {
            clearTimeout(state.toastTimer);
        }

        state.toastTimer = setTimeout(function () {
            toast.hidden = true;
        }, duration || 2800);
    }

    /* ========================================================
       4. FETCH HELPER
    ======================================================== */

    async function request(url, options) {
        const controller = new AbortController();

        const timeout = setTimeout(function () {
            controller.abort();
        }, CONFIG.requestTimeout);

        try {
            const response = await fetch(url, {
                credentials: "same-origin",
                ...options,
                signal: controller.signal
            });

            if (response.status === 401) {
                window.location.href = "/login";
                throw new Error("Login required.");
            }

            if (response.status === 403) {
                throw new Error("Aapko is action ki permission nahi hai.");
            }

            const contentType =
                response.headers.get("content-type") || "";

            let data = null;

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();

                data = {
                    detail: text
                };
            }

            if (!response.ok) {
                const message = firstValue(
                    data,
                    ["detail", "message", "error"],
                    "Request failed: " + response.status
                );

                throw new Error(
                    typeof message === "string"
                        ? message
                        : "Request failed: " + response.status
                );
            }

            return data;

        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("Request timeout. Dobara try karein.");
            }

            throw error;

        } finally {
            clearTimeout(timeout);
        }
    }

    /* ========================================================
       5. CURRENT USER
    ======================================================== */

    async function loadCurrentUser() {
        const data = await request(API.me);

        state.me = data && data.user
            ? data.user
            : data;

        if (
            !state.me ||
            typeof state.me !== "object"
        ) {
            throw new Error("User information nahi mili.");
        }

        return state.me;
    }

    /* ========================================================
       6. PARTNER ID
    ======================================================== */

    function getPartnerIdFromURL() {
        return (
            getParam("user_id") ||
            getParam("partner_id") ||
            getParam("receiver_id") ||
            getParam("id") ||
            ""
        ).trim();
    }

    /* ========================================================
       7. LOAD PARTNER PROFILE
    ======================================================== */

    async function loadPartnerProfile() {
        state.partnerId = getPartnerIdFromURL();

        if (!state.partnerId) {
            showToast("Chat karne ke liye user select karein.");
            return false;
        }

        const myId = getUserId(state.me);

        if (myId && sameId(myId, state.partnerId)) {
            showToast("Aap apne aap ko message nahi kar sakte.");
            return false;
        }

        const data = await request(
            API.profile(state.partnerId)
        );

        state.partner = data && data.user
            ? data.user
            : data && data.profile
                ? data.profile
                : data;

        if (!state.partner || typeof state.partner !== "object") {
            throw new Error("User profile load nahi hua.");
        }

        const actualId = getUserId(state.partner);

        if (actualId) {
            state.partnerId = actualId;
        }

        renderPartnerHeader();

        return true;
    }

    /* ========================================================
       8. PARTNER HEADER
    ======================================================== */

    function renderPartnerHeader() {
        const partner = state.partner;

        if (!partner) {
            return;
        }

        const name = getUserName(partner);
        const avatar = getAvatar(partner);

        const nameElement = $("selectedName");
        const avatarElement = $("selectedAvatar");
        const statusElement = $("selectedStatus");

        if (nameElement) {
            nameElement.textContent = name;
        }

        if (avatarElement) {
            if (avatar) {
                avatarElement.src = avatar;
                avatarElement.alt = name;

                avatarElement.onerror = function () {
                    this.style.visibility = "hidden";
                };

                avatarElement.onload = function () {
                    this.style.visibility = "visible";
                };

            } else {
                avatarElement.removeAttribute("src");
                avatarElement.alt = name;
                avatarElement.style.visibility = "hidden";
            }
        }

        if (statusElement) {
            const online = Boolean(
                firstValue(
                    partner,
                    ["is_online", "online", "is_active"],
                    false
                )
            );

            const lastSeen = firstValue(
                partner,
                ["last_seen", "last_seen_at"],
                null
            );

            statusElement.textContent = online
                ? "Online"
                : formatLastSeen(lastSeen);

            statusElement.classList.toggle("online", online);
            statusElement.classList.toggle("is-online", online);
        }

        document.title = name + " | UtaNexa Chat";
    }

    function formatLastSeen(value) {
        if (!value) {
            return "UtaNexa par";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "UtaNexa par";
        }

        return "Last seen " + formatTime(date);
    }

    /* ========================================================
       9. TIME FORMATTING — INDIA
    ======================================================== */

    function formatTime(value) {
        let date;

        if (value instanceof Date) {
            date = value;
        } else {
            date = new Date(value || Date.now());
        }

        if (Number.isNaN(date.getTime())) {
            date = new Date();
        }

        return new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }).format(date);
    }

    function formatDateLabel(value) {
        const date = new Date(value || Date.now());

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(date);
    }

    /* ========================================================
       10. LOAD MESSAGE HISTORY
    ======================================================== */

    async function loadMessages(options) {
        options = options || {};

        if (!state.partnerId || state.loadingMessages) {
            return;
        }

        state.loadingMessages = true;

        const container = $("messages");

        const previousScrollTop = container
            ? container.scrollTop
            : 0;

        const wasNearBottom = container
            ? (
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight
            ) < 100
            : true;

        try {
            const data = await request(
                API.messages(state.partnerId)
            );

            let list = [];

            if (Array.isArray(data)) {
                list = data;

            } else if (data && Array.isArray(data.messages)) {
                list = data.messages;

            } else if (data && Array.isArray(data.items)) {
                list = data.items;

            } else if (data && Array.isArray(data.results)) {
                list = data.results;
            }

            const previousCount = state.messages.length;

            state.messages = list;

            rebuildMessageIdSet();

            renderMessages();

            if (container) {
                if (
                    options.forceBottom ||
                    wasNearBottom ||
                    previousCount === 0
                ) {
                    scrollMessagesToBottom();

                } else {
                    container.scrollTop = previousScrollTop;
                }
            }

        } catch (error) {
            if (!options.silent) {
                showToast(
                    getErrorMessage(
                        error,
                        "Messages load nahi hue."
                    )
                );
            }

        } finally {
            state.loadingMessages = false;
        }
    }

    function rebuildMessageIdSet() {
        state.messageIds.clear();

        state.messages.forEach(function (message) {
            const id = getMessageId(message);

            if (id) {
                state.messageIds.add(id);
            }
        });
    }

    /* ========================================================
       11. RENDER MESSAGES
    ======================================================== */

    function renderMessages() {
        const container = $("messages");

        if (!container) {
            return;
        }

        container.replaceChildren();

        const empty = $("emptyConversation");

        const filtered = getFilteredMessages();

        if (empty) {
            empty.hidden = filtered.length > 0;
        }

        filtered.forEach(function (message) {
            container.appendChild(
                createMessageElement(message)
            );
        });

        container.setAttribute(
            "aria-live",
            "polite"
        );
    }

    function getFilteredMessages() {
        const term = state.searchTerm.trim().toLowerCase();

        if (!term) {
            return state.messages;
        }

        return state.messages.filter(function (message) {
            const text = getMessageText(message).toLowerCase();

            return text.includes(term);
        });
    }

    function isMyMessage(message) {
        const senderId = getMessageSenderId(message);
        const myId = getUserId(state.me);

        if (senderId && myId) {
            return sameId(senderId, myId);
        }

        if (message && typeof message.is_mine === "boolean") {
            return message.is_mine;
        }

        if (message && typeof message.is_sent_by_me === "boolean") {
            return message.is_sent_by_me;
        }

        return false;
    }

    function createMessageElement(message) {
        const row = document.createElement("div");

        const mine = isMyMessage(message);

        row.className = "message-row " +
            (mine ? "sent" : "received");

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        const mediaUrl = getMessageMediaUrl(message);
        const text = getMessageText(message);

        if (mediaUrl && isImageMessage(message)) {
            const image = document.createElement("img");

            image.src = mediaUrl;
            image.alt = "Shared image";
            image.loading = "lazy";
            image.className = "message-image";

            image.addEventListener("click", function () {
                openImageViewer(mediaUrl);
            });

            image.addEventListener("error", function () {
                image.alt = "Image could not be loaded";
            });

            bubble.appendChild(image);

        } else if (mediaUrl && isAudioMessage(message)) {
            const audio = document.createElement("audio");

            audio.controls = true;
            audio.preload = "metadata";
            audio.src = mediaUrl;

            bubble.appendChild(audio);

        } else if (mediaUrl) {
            const link = document.createElement("a");

            link.href = mediaUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Open attachment";

            bubble.appendChild(link);
        }

        if (text) {
            const textElement = document.createElement("div");

            textElement.className = "message-text";
            textElement.textContent = text;

            bubble.appendChild(textElement);
        }

        if (!text && !mediaUrl) {
            const fallback = document.createElement("div");

            fallback.className = "message-text";
            fallback.textContent = "Message";

            bubble.appendChild(fallback);
        }

        const meta = document.createElement("div");
        meta.className = "message-meta";

        const timestamp = document.createElement("span");

        timestamp.className = "message-time";
        timestamp.textContent = formatTime(
            getMessageTimestamp(message)
        );

        meta.appendChild(timestamp);

        if (mine) {
            const tick = document.createElement("span");

            tick.className = "message-tick";

            const read = Boolean(
                firstValue(
                    message,
                    ["is_read", "read", "seen"],
                    false
                )
            );

            tick.textContent = read ? "✓✓" : "✓";

            meta.appendChild(tick);
        }

        bubble.appendChild(meta);
        row.appendChild(bubble);

        const id = getMessageId(message);

        if (id) {
            row.dataset.messageId = id;
        }

        return row;
    }

    function scrollMessagesToBottom() {
        const container = $("messages");

        if (!container) {
            return;
        }

        requestAnimationFrame(function () {
            container.scrollTop = container.scrollHeight;
        });
    }

    /* ========================================================
       12. SEND TEXT MESSAGE
    ======================================================== */

    async function sendTextMessage() {
        const input = $("messageInput");

        if (!input || state.sendingMessage) {
            return;
        }

        const content = input.value.trim();

        if (!content) {
            return;
        }

        if (!state.partnerId) {
            showToast("Pehle user select karein.");
            return;
        }

        if (state.me && state.partnerId === getUserId(state.me)) {
            showToast("Khud ko message nahi bhej sakte.");
            return;
        }

        state.sendingMessage = true;

        const sendButton = $("sendButton");

        if (sendButton) {
            sendButton.disabled = true;
        }

        try {
            const formData = new FormData();

            formData.append(
                "receiver_id",
                state.partnerId
            );

            formData.append(
                "content",
                content
            );

            await request(API.send, {
                method: "POST",
                body: formData
            });

            input.value = "";
            autoResizeInput();

            await loadMessages({
                silent: true,
                forceBottom: true
            });

        } catch (error) {
            showToast(
                getErrorMessage(
                    error,
                    "Message send nahi hua."
                )
            );

        } finally {
            state.sendingMessage = false;

            if (sendButton) {
                sendButton.disabled = false;
            }

            if (input) {
                input.focus();
            }
        }
    }

    /* ========================================================
       13. SEND FILE / IMAGE
    ======================================================== */

    async function sendFile(file) {
        if (!file || state.isSendingRecording) {
            return;
        }

        if (!state.partnerId) {
            showToast("Pehle user select karein.");
            return;
        }

        if (file.size > CONFIG.maxFileSize) {
            showToast("File 25 MB se chhoti honi chahiye.");
            return;
        }

        let uploadFile = file;

        if (
            file.type.startsWith("image/") &&
            file.size > CONFIG.compressAbove &&
            file.type !== "image/gif" &&
            file.type !== "image/svg+xml"
        ) {
            try {
                uploadFile = await compressImage(file);
            } catch (error) {
                console.warn(
                    "Image compression failed:",
                    error
                );
            }
        }

        const formData = new FormData();

        formData.append(
            "receiver_id",
            state.partnerId
        );

        formData.append("content", "");

        formData.append(
            "file",
            uploadFile,
            uploadFile.name || "attachment"
        );

        showToast("File send ho rahi hai...", 1200);

        try {
            await request(API.send, {
                method: "POST",
                body: formData
            });

            await loadMessages({
                silent: true,
                forceBottom: true
            });

            showToast("File send ho gayi.");

        } catch (error) {
            showToast(
                getErrorMessage(
                    error,
                    "File send nahi hui."
                )
            );
        }
    }

    /* ========================================================
       14. IMAGE COMPRESSION
    ======================================================== */

    async function compressImage(file) {
        if (!file.type.startsWith("image/")) {
            return file;
        }

        const image = await loadImageFromFile(file);

        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;

        if (!width || !height) {
            return file;
        }

        const ratio = Math.min(
            1,
            CONFIG.maxImageDimension / Math.max(width, height)
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);

        const context = canvas.getContext("2d");

        if (!context) {
            return file;
        }

        context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const blob = await new Promise(function (resolve) {
            canvas.toBlob(
                resolve,
                "image/jpeg",
                CONFIG.imageQuality
            );
        });

        if (!blob) {
            return file;
        }

        const originalName = file.name.replace(
            /\.[^.]+$/,
            ""
        );

        return new File(
            [blob],
            (originalName || "image") + ".jpg",
            {
                type: "image/jpeg",
                lastModified: Date.now()
            }
        );
    }

    function loadImageFromFile(file) {
        return new Promise(function (resolve, reject) {
            const url = URL.createObjectURL(file);

            const image = new Image();

            image.onload = function () {
                URL.revokeObjectURL(url);
                resolve(image);
            };

            image.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error("Image read nahi ho payi."));
            };

            image.src = url;
        });
    }

    /* ========================================================
       15. IMAGE VIEWER
    ======================================================== */

    function openImageViewer(url) {
        const viewer = $("imageViewer");
        const image = $("viewerImage");

        if (!viewer || !image) {
            window.open(url, "_blank", "noopener");
            return;
        }

        image.src = url;
        viewer.hidden = false;

        document.body.style.overflow = "hidden";
    }

    function closeImageViewer() {
        const viewer = $("imageViewer");
        const image = $("viewerImage");

        if (viewer) {
            viewer.hidden = true;
        }

        if (image) {
            image.removeAttribute("src");
        }

        document.body.style.overflow = "";
    }

    /* ========================================================
       16. EMOJI DATA
    ======================================================== */

    const EMOJIS = {
        recent: [],

        smileys: [
            "😀", "😃", "😄", "😁", "😆", "😅",
            "😂", "🤣", "🥹", "😊", "😇", "🙂",
            "🙃", "😉", "😍", "🥰", "😘", "😗",
            "😙", "😚", "😋", "😛", "😜", "🤪",
            "😎", "🤩", "🥳", "😏", "😒", "😔",
            "🥺", "😭", "😢", "😤", "😡", "🤬",
            "🤔", "🤫", "🤭", "🫢", "🫣", "🤗",
            "😴", "🥱", "😷", "🤒", "🤕", "🤯",
            "😱", "😳", "🥴", "😵", "🤐", "😬",
            "🙄", "😮", "😲", "😌", "😈", "👿",
            "💀", "👻", "🤖", "💩", "🫶", "❤️",
            "🩷", "🧡", "💛", "💚", "💙", "💜",
            "🖤", "🤍", "💔", "💕", "💞", "💓",
            "💗", "💖", "💘", "💝", "💟", "💌"
        ],

        people: [
            "👋", "🤚", "✋", "🖐️", "👌", "🤌",
            "🤏", "✌️", "🤞", "🫰", "🤟", "🤘",
            "🤙", "👈", "👉", "👆", "👇", "☝️",
            "👍", "👎", "✊", "👊", "👏", "🙌",
            "👐", "🤲", "🤝", "🙏", "✍️", "💅",
            "💪", "🦾", "🧠", "👀", "👁️", "👄",
            "👶", "🧒", "👦", "👧", "🧑", "👨",
            "👩", "🧔", "👴", "👵", "👮", "👷",
            "💃", "🕺", "👯", "🧘", "🚶", "🏃"
        ],

        nature: [
            "🐶", "🐱", "🐭", "🐹", "🐰", "🦊",
            "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
            "🐷", "🐸", "🐵", "🙈", "🙉", "🙊",
            "🐔", "🐧", "🐦", "🦆", "🦅", "🦉",
            "🦋", "🐌", "🐞", "🐜", "🐝", "🪲",
            "🌸", "🌹", "🌺", "🌻", "🌼", "🌷",
            "🌱", "🌲", "🌳", "🌴", "🌵", "🍀",
            "🍁", "🍂", "🍃", "🌍", "🌈", "☀️",
            "🌤️", "⛅", "🌧️", "⛈️", "❄️", "☃️",
            "🔥", "💧", "🌊", "🌙", "⭐", "✨"
        ],

        food: [
            "🍏", "🍎", "🍐", "🍊", "🍋", "🍌",
            "🍉", "🍇", "🍓", "🫐", "🍈", "🍒",
            "🍑", "🥭", "🍍", "🥥", "🥝", "🍅",
            "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️",
            "🌽", "🥕", "🧄", "🧅", "🥔", "🍠",
            "🥐", "🍞", "🥖", "🧀", "🥚", "🍳",
            "🥞", "🧇", "🥓", "🍔", "🍟", "🍕",
            "🌭", "🥪", "🌮", "🌯", "🥗", "🍝",
            "🍜", "🍣", "🍱", "🍛", "🍚", "🍦",
            "🍧", "🍨", "🍩", "🍪", "🎂", "🍰",
            "🧁", "🍫", "🍿", "☕", "🧋", "🥤"
        ],

        activities: [
            "⚽", "🏀", "🏈", "⚾", "🎾", "🏐",
            "🏉", "🎱", "🏓", "🏸", "🥊", "🥋",
            "🎯", "⛳", "🎣", "🤿", "🎽", "🎿",
            "🛷", "🥌", "🎮", "🕹️", "🎲", "♟️",
            "🎭", "🎨", "🎬", "🎤", "🎧", "🎼",
            "🎹", "🥁", "🎷", "🎸", "🎻", "🎺",
            "🏆", "🥇", "🥈", "🥉", "🎖️", "🏅",
            "🎪", "🎟️", "🎫", "🎳", "🎰", "🧩"
        ],

        travel: [
            "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️",
            "🚓", "🚑", "🚒", "🚐", "🛻", "🚚",
            "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴",
            "✈️", "🚀", "🛸", "🚁", "⛵", "🚤",
            "🚢", "🚂", "🚆", "🚇", "🚉", "🚏",
            "🏠", "🏡", "🏢", "🏰", "🏯", "🏖️",
            "🏝️", "🏕️", "🏔️", "⛰️", "🌋", "🗻",
            "⛺", "🗽", "🗼", "🌉", "🌃", "🌆",
            "🌇", "🌄", "🌅", "🛣️", "🛤️", "🗺️"
        ],

        objects: [
            "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️",
            "🖱️", "💽", "💾", "📷", "📸", "📹",
            "🎥", "📞", "☎️", "📺", "📻", "🎙️",
            "🔋", "🔌", "💡", "🔦", "🕯️", "🧯",
            "💸", "💵", "💴", "💶", "💷", "💰",
            "💎", "⚖️", "🔧", "🔨", "⚒️", "🛠️",
            "🔑", "🗝️", "🔒", "🔓", "🔔", "🔕",
            "📦", "📫", "📮", "✉️", "📩", "📨",
            "📁", "📂", "📅", "📆", "📝", "📚",
            "📖", "✏️", "🖊️", "🖋️", "✂️", "📌"
        ],

        symbols: [
            "❤️", "🩷", "💔", "❣️", "💕", "💞",
            "💓", "💗", "💖", "💘", "💝", "💟",
            "☮️", "✝️", "☯️", "♈", "♉", "♊",
            "♋", "♌", "♍", "♎", "♏", "♐",
            "♑", "♒", "♓", "⚛️", "🆔", "⚠️",
            "🚫", "⛔", "❌", "⭕", "✅", "☑️",
            "✔️", "❎", "➕", "➖", "➗", "✖️",
            "♾️", "💯", "🔱", "⚡", "☀️", "🌙",
            "❄️", "☂️", "⭐", "🌟", "✨", "💫",
            "🎵", "🎶", "🔊", "🔇", "🔔", "📣",
            "🔝", "🔜", "🔙", "🔚", "🔛", "🔜"
        ]
    };

    /* ========================================================
       17. EMOJI PICKER
    ======================================================== */

    function getExpressionCategoryButtons() {
        const container = $("emojiCategories");

        if (!container) {
            return [];
        }

        return Array.from(container.querySelectorAll("button"));
    }

    function resolveEmojiCategory(button) {
        return (
            button.dataset.category ||
            button.dataset.emojiCategory ||
            button.getAttribute("data-tab") ||
            button.getAttribute("aria-label") ||
            button.textContent.trim().toLowerCase()
        );
    }

    function renderEmojiGrid() {
        const grid = $("emojiGrid");

        if (!grid) {
            return;
        }

        const category = state.activeEmojiCategory;

        const list = EMOJIS[category] || EMOJIS.smileys;

        const search = (
            $("expressionSearch")?.value || ""
        ).trim();

        grid.replaceChildren();

        let emojis = list.slice();

        if (category === "recent") {
            emojis = state.recentEmojis.slice();
        }

        if (search) {
            /*
             * Emoji Unicode doesn't provide a reliable English
             * keyword search in the browser. Keep matching visible
             * to the selected category rather than hiding results.
             */
            emojis = emojis.filter(function (emoji) {
                return emoji.includes(search);
            });
        }

        emojis.forEach(function (emoji) {
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = emoji;
            button.setAttribute("aria-label", emoji);

            button.addEventListener("click", function () {
                insertEmoji(emoji);
            });

            grid.appendChild(button);
        });
    }

    function insertEmoji(emoji) {
        const input = $("messageInput");

        if (!input) {
            return;
        }

        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;

        input.value =
            input.value.slice(0, start) +
            emoji +
            input.value.slice(end);

        const cursor = start + emoji.length;

        input.focus();

        input.setSelectionRange(cursor, cursor);

        autoResizeInput();

        state.recentEmojis = [
            emoji,
            ...state.recentEmojis.filter(function (item) {
                return item !== emoji;
            })
        ].slice(0, 30);

        if (state.activeEmojiCategory === "recent") {
            renderEmojiGrid();
        }
    }

    function setExpressionTab(tab) {
        state.activeExpressionTab = tab;

        const emojiTab = $("emojiTab");
        const gifTab = $("gifTab");
        const emojiGrid = $("emojiGrid");
        const gifGrid = $("gifGrid");
        const categories = $("emojiCategories");
        const search = $("expressionSearch");
        const note = $("expressionNote");

        if (emojiTab) {
            emojiTab.classList.toggle("active", tab === "emoji");
            emojiTab.setAttribute(
                "aria-selected",
                String(tab === "emoji")
            );
        }

        if (gifTab) {
            gifTab.classList.toggle("active", tab === "gif");
            gifTab.setAttribute(
                "aria-selected",
                String(tab === "gif")
            );
        }

        if (emojiGrid) {
            emojiGrid.hidden = tab !== "emoji";
        }

        if (gifGrid) {
            gifGrid.hidden = tab !== "gif";
        }

        if (categories) {
            categories.hidden = tab !== "emoji";
        }

        if (search) {
            search.value = "";
            search.placeholder = tab === "gif"
                ? "GIF search"
                : "Search emoji";
        }

        if (note) {
            note.textContent = tab === "gif"
                ? "GIF search requires a configured GIF provider."
                : "Select an emoji to add it to your message.";
        }

        if (tab === "emoji") {
            renderEmojiGrid();
        } else {
            renderGifPlaceholder();
        }
    }

    function renderGifPlaceholder() {
        const grid = $("gifGrid");

        if (!grid) {
            return;
        }

        grid.replaceChildren();

        const note = document.createElement("p");

        note.textContent =
            "GIFs abhi available nahi hain. GIF provider/API configure karna hoga.";

        note.style.gridColumn = "1 / -1";
        note.style.color = "var(--chat-muted)";
        note.style.textAlign = "center";
        note.style.fontSize = "12px";
        note.style.padding = "20px 8px";

        grid.appendChild(note);
    }

    function toggleExpressionPanel() {
        const panel = $("expressionPanel");

        if (!panel) {
            return;
        }

        panel.hidden = !panel.hidden;

        if (!panel.hidden) {
            setExpressionTab("emoji");
            renderEmojiGrid();
        }
    }

    /* ========================================================
       18. SPEECH TO TEXT
    ======================================================== */

    function startSpeechRecognition() {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        const input = $("messageInput");

        if (!SpeechRecognition) {
            showToast(
                "Speech input is browser mein supported nahi hai."
            );
            return;
        }

        if (state.speechActive && state.speechRecognition) {
            state.speechRecognition.stop();
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "hi-IN";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        state.speechRecognition = recognition;
        state.speechActive = true;

        let finalTranscript = "";

        recognition.onresult = function (event) {
            let interimTranscript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const transcript =
                    event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript;
                }
            }

            if (input) {
                const existing = input.value.trim();

                const spoken =
                    (finalTranscript + interimTranscript).trim();

                input.value = existing
                    ? existing + " " + spoken
                    : spoken;

                autoResizeInput();
            }
        };

        recognition.onerror = function (event) {
            if (event.error !== "no-speech" &&
                event.error !== "aborted") {
                showToast("Voice input complete nahi hua.");
            }
        };

        recognition.onend = function () {
            state.speechActive = false;
            state.speechRecognition = null;

            const mic = $("micButton");

            if (mic) {
                mic.classList.remove("active");
                mic.setAttribute("aria-pressed", "false");
            }
        };

        const mic = $("micButton");

        if (mic) {
            mic.classList.add("active");
            mic.setAttribute("aria-pressed", "true");
        }

        try {
            recognition.start();
        } catch (error) {
            state.speechActive = false;
            state.speechRecognition = null;

            if (mic) {
                mic.classList.remove("active");
            }

            showToast("Microphone start nahi ho paya.");
        }
    }

    /* ========================================================
       19. VOICE RECORDING
    ======================================================== */

    async function startVoiceRecording() {
        if (state.isRecording) {
            return;
        }

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia ||
            !window.MediaRecorder) {
            showToast(
                "Voice recording is browser mein supported nahi hai."
            );
            return;
        }

        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            state.recordingStream = stream;
            state.recordedChunks = [];

            let mimeType = "";

            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                mimeType = "audio/webm;codecs=opus";
            } else if (MediaRecorder.isTypeSupported("audio/webm")) {
                mimeType = "audio/webm";
            }

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            state.mediaRecorder = recorder;
            state.isRecording = true;
            state.recordingStartedAt = Date.now();
            state.recordingSeconds = 0;

            recorder.ondataavailable = function (event) {
                if (event.data && event.data.size > 0) {
                    state.recordedChunks.push(event.data);
                }
            };

            recorder.onstop = function () {
                stopRecordingTimer();
                stopRecordingTracks();

                const type =
                    recorder.mimeType || "audio/webm";

                const blob = new Blob(
                    state.recordedChunks,
                    { type }
                );

                state.recordedChunks = [];

                if (blob.size > 0 && !state.cancelRecording) {
                    const extension =
                        type.includes("mp4") ? "m4a" : "webm";

                    const file = new File(
                        [blob],
                        "voice-message." + extension,
                        {
                            type,
                            lastModified: Date.now()
                        }
                    );

                    state.pendingVoiceFile = file;
                }

                state.isRecording = false;
                state.mediaRecorder = null;

                updateRecordingUI(false);
            };

            recorder.start(250);

            state.cancelRecording = false;

            startRecordingTimer();
            updateRecordingUI(true);

            showToast("Voice recording start ho gayi.", 1400);

        } catch (error) {
            stopRecordingTracks();

            showToast(
                "Microphone permission dein aur dobara try karein."
            );
        }
    }

    function startRecordingTimer() {
        stopRecordingTimer();

        state.recordingTimer = setInterval(function () {
            state.recordingSeconds = Math.floor(
                (Date.now() - state.recordingStartedAt) / 1000
            );

            const time = $("recordingTime");

            if (time) {
                const minutes = Math.floor(
                    state.recordingSeconds / 60
                );

                const seconds = state.recordingSeconds % 60;

                time.textContent =
                    String(minutes).padStart(2, "0") +
                    ":" +
                    String(seconds).padStart(2, "0");
            }
        }, 250);
    }

    function stopRecordingTimer() {
        if (state.recordingTimer) {
            clearInterval(state.recordingTimer);
            state.recordingTimer = null;
        }
    }

    function stopRecordingTracks() {
        if (state.recordingStream) {
            state.recordingStream.getTracks().forEach(
                function (track) {
                    track.stop();
                }
            );

            state.recordingStream = null;
        }
    }

    function updateRecordingUI(active) {
        const status = $("recordingStatus");
        const composer = $("composer");

        if (status) {
            status.hidden = !active;
        }

        if (composer) {
            composer.classList.toggle(
                "is-recording",
                active
            );
        }

        const button = $("sendButton");

        if (button) {
            button.classList.toggle(
                "is-recording",
                active
            );
        }
    }

    function stopVoiceRecording(cancel) {
        const recorder = state.mediaRecorder;

        if (!recorder || recorder.state === "inactive") {
            return;
        }

        state.cancelRecording = Boolean(cancel);

        try {
            recorder.stop();
        } catch (error) {
            console.warn("Recorder stop error:", error);
        }
    }

    async function sendRecordedVoice() {
        if (!state.pendingVoiceFile) {
            showToast("Pehle voice message record karein.");
            return;
        }

        if (!state.partnerId) {
            showToast("Pehle user select karein.");
            return;
        }

        const file = state.pendingVoiceFile;

        state.pendingVoiceFile = null;
        state.isSendingRecording = true;

        try {
            await sendFile(file);
        } finally {
            state.isSendingRecording = false;
        }
    }

    function cancelRecordedVoice() {
        state.pendingVoiceFile = null;
        state.cancelRecording = true;

        if (state.isRecording) {
            stopVoiceRecording(true);
        }

        updateRecordingUI(false);
    }

    /* ========================================================
       20. INPUT AUTO RESIZE
    ======================================================== */

    function autoResizeInput() {
        const input = $("messageInput");

        if (!input) {
            return;
        }

        input.style.height = "auto";

        input.style.height = Math.min(
            input.scrollHeight,
            130
        ) + "px";
    }

    /* ========================================================
       21. SEARCH MESSAGES
    ======================================================== */

    function openChatSearch() {
        const section = $("chatSearchSection");
        const input = $("chatSearch");

        if (section) {
            section.hidden = false;
        }

        if (input) {
            input.focus();
        }
    }

    function closeChatSearch() {
        const section = $("chatSearchSection");
        const input = $("chatSearch");

        if (section) {
            section.hidden = true;
        }

        if (input) {
            input.value = "";
        }

        state.searchTerm = "";

        renderMessages();
    }

    function filterMessages() {
        const input = $("chatSearch");

        state.searchTerm = input
            ? input.value.trim()
            : "";

        renderMessages();
    }

    /* ========================================================
       22. MODAL HELPERS
    ======================================================== */

    function openModal(id) {
        const modal = $(id);

        if (modal) {
            modal.hidden = false;
        }
    }

    function closeModal(id) {
        const modal = $(id);

        if (modal) {
            modal.hidden = true;
        }
    }

    /* ========================================================
       23. NAVIGATION
    ======================================================== */

    function goBack() {
        if (window.history.length > 1) {
            const referrer = document.referrer;

            if (referrer && new URL(referrer).origin === location.origin) {
                window.history.back();
                return;
            }
        }

        window.location.href = "/home";
    }

    function openPartnerProfile() {
        if (!state.partnerId) {
            return;
        }

        window.location.href =
            "/profile?user_id=" +
            encodeURIComponent(state.partnerId);
    }

    function openCoupleChat() {
        if (!state.partnerId) {
            showToast("Partner select nahi hua.");
            return;
        }

        const params = new URLSearchParams();

        params.set("partner_id", state.partnerId);

        if (state.partner) {
            params.set("name", getUserName(state.partner));

            const avatar = getAvatar(state.partner);

            if (avatar) {
                params.set("avatar", avatar);
            }
        }

        window.location.href =
            "/couple-chat?" + params.toString();
    }

    /* ========================================================
       24. CALL OPTIONS
    ======================================================== */

    function openCallOptions() {
        openModal("callOptionsModal");
    }

    function startVoiceCall() {
        closeModal("callOptionsModal");

        showToast(
            "Voice calling ke liye backend call signaling aur WebRTC configure karna hoga."
        );
    }

    function startVideoCall() {
        closeModal("callOptionsModal");

        showToast(
            "Video calling ke liye backend call signaling aur WebRTC configure karna hoga."
        );
    }

    /* ========================================================
       25. CONVERSATION MENU
    ======================================================== */

    function openConversationMenu() {
        openModal("conversationMenuModal");
    }

    function clearConversation() {
        closeModal("conversationMenuModal");

        const confirmed = window.confirm(
            "Kya aap is chat ko clear karna chahte hain? Yeh action server par messages delete nahi karega."
        );

        if (!confirmed) {
            return;
        }

        /*
         * Local-only clearing is intentionally avoided.
         * Otherwise messages would reappear during the next poll.
         * Server deletion requires a dedicated backend endpoint.
         */

        showToast(
            "Chat delete karne ke liye backend delete endpoint zaroori hai."
        );
    }

    function viewConversationMedia() {
        closeModal("conversationMenuModal");

        const images = state.messages.filter(function (message) {
            return getMessageMediaUrl(message) &&
                isImageMessage(message);
        });

        if (!images.length) {
            showToast("Is chat mein koi image nahi hai.");
            return;
        }

        openImageViewer(getMessageMediaUrl(images[images.length - 1]));
    }

    /* ========================================================
       26. POLLING
    ======================================================== */

    function startPolling() {
        stopPolling();

        state.pollingActive = true;

        state.pollingTimer = setInterval(function () {
            if (
                document.visibilityState === "visible" &&
                state.partnerId &&
                !state.loadingMessages
            ) {
                loadMessages({
                    silent: true
                });
            }
        }, CONFIG.pollInterval);
    }

    function stopPolling() {
        if (state.pollingTimer) {
            clearInterval(state.pollingTimer);
            state.pollingTimer = null;
        }

        state.pollingActive = false;
    }

    document.addEventListener(
        "visibilitychange",
        function () {
            if (
                document.visibilityState === "visible" &&
                state.partnerId &&
                !state.loadingMessages
            ) {
                loadMessages({
                    silent: true
                });
            }
        }
    );

    /* ========================================================
       27. FILE INPUTS
    ======================================================== */

    function openFilePicker() {
        const input = $("fileInput");

        if (input) {
            input.click();
        }
    }

    function openCameraPicker() {
        const input = $("cameraInput");

        if (input) {
            input.click();
        }
    }

    /* ========================================================
       28. EVENT BINDINGS
    ======================================================== */

    function bindEvents() {
        /* Back */

        $("backButton")?.addEventListener(
            "click",
            goBack
        );

        /* Partner profile */

        $("selectedAvatarButton")?.addEventListener(
            "click",
            openPartnerProfile
        );

        /* Couple Chat */

        $("coupleChatButton")?.addEventListener(
            "click",
            openCoupleChat
        );

        /* Calls */

        $("voiceCallButton")?.addEventListener(
            "click",
            openCallOptions
        );

        $("closeCallOptions")?.addEventListener(
            "click",
            function () {
                closeModal("callOptionsModal");
            }
        );

        $("startVoiceCall")?.addEventListener(
            "click",
            startVoiceCall
        );

        $("startVideoCall")?.addEventListener(
            "click",
            startVideoCall
        );

        /* Conversation menu */

        $("conversationMenu")?.addEventListener(
            "click",
            openConversationMenu
        );

        $("closeConversationMenu")?.addEventListener(
            "click",
            function () {
                closeModal("conversationMenuModal");
            }
        );

        $("menuSearchMessages")?.addEventListener(
            "click",
            function () {
                closeModal("conversationMenuModal");
                openChatSearch();
            }
        );

        $("menuViewMedia")?.addEventListener(
            "click",
            viewConversationMedia
        );

        $("menuClearChat")?.addEventListener(
            "click",
            clearConversation
        );

        /* Search */

        $("closeChatSearch")?.addEventListener(
            "click",
            closeChatSearch
        );

        $("chatSearch")?.addEventListener(
            "input",
            filterMessages
        );

        /* Sending text */

        $("sendButton")?.addEventListener(
            "click",
            function () {
                if (state.isRecording) {
                    stopVoiceRecording(false);
                    return;
                }

                if (state.pendingVoiceFile) {
                    sendRecordedVoice();
                    return;
                }

                sendTextMessage();
            }
        );

        $("messageInput")?.addEventListener(
            "input",
            autoResizeInput
        );

        $("messageInput")?.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.isComposing
                ) {
                    event.preventDefault();
                    sendTextMessage();
                }
            }
        );

        /* Emoji */

        $("emojiButton")?.addEventListener(
            "click",
            toggleExpressionPanel
        );

        $("emojiTab")?.addEventListener(
            "click",
            function () {
                setExpressionTab("emoji");
            }
        );

        $("gifTab")?.addEventListener(
            "click",
            function () {
                setExpressionTab("gif");
            }
        );

        $("closeExpressionPanel")?.addEventListener(
            "click",
            function () {
                const panel = $("expressionPanel");

                if (panel) {
                    panel.hidden = true;
                }
            }
        );

        $("expressionSearch")?.addEventListener(
            "input",
            function () {
                if (state.activeExpressionTab === "emoji") {
                    renderEmojiGrid();
                } else {
                    renderGifPlaceholder();
                }
            }
        );

        getExpressionCategoryButtons().forEach(
            function (button) {
                button.addEventListener("click", function () {
                    const category = resolveEmojiCategory(button);

                    if (EMOJIS[category]) {
                        state.activeEmojiCategory = category;

                        getExpressionCategoryButtons().forEach(
                            function (item) {
                                item.classList.toggle(
                                    "active",
                                    item === button
                                );
                            }
                        );

                        renderEmojiGrid();
                    }
                });
            }
        );

        /* Speech-to-text */

        $("micButton")?.addEventListener(
            "click",
            startSpeechRecognition
        );

        /* File upload */

        $("attachButton")?.addEventListener(
            "click",
            openFilePicker
        );

        $("cameraButton")?.addEventListener(
            "click",
            openCameraPicker
        );

        $("fileInput")?.addEventListener(
            "change",
            async function () {
                const file = this.files && this.files[0];

                if (file) {
                    await sendFile(file);
                }

                this.value = "";
            }
        );

        $("cameraInput")?.addEventListener(
            "change",
            async function () {
                const file = this.files && this.files[0];

                if (file) {
                    await sendFile(file);
                }

                this.value = "";
            }
        );

        /* Voice recording controls */

        $("cancelRecordingButton")?.addEventListener(
            "click",
            cancelRecordedVoice
        );

        $("sendRecordingButton")?.addEventListener(
            "click",
            function () {
                if (state.isRecording) {
                    stopVoiceRecording(false);
                } else {
                    sendRecordedVoice();
                }
            }
        );

        /* Image viewer */

        $("closeImageViewer")?.addEventListener(
            "click",
            closeImageViewer
        );

        $("imageViewer")?.addEventListener(
            "click",
            function (event) {
                if (event.target === this) {
                    closeImageViewer();
                }
            }
        );

        /* Modal backdrop clicks */

        ["callOptionsModal", "conversationMenuModal"].forEach(
            function (id) {
                const modal = $(id);

                if (!modal) {
                    return;
                }

                modal.addEventListener("click", function (event) {
                    if (event.target === modal) {
                        modal.hidden = true;
                    }
                });
            }
        );

        /* Escape key */

        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }

            closeImageViewer();

            closeModal("callOptionsModal");
            closeModal("conversationMenuModal");

            const expressionPanel = $("expressionPanel");

            if (expressionPanel) {
                expressionPanel.hidden = true;
            }

            if (!$("chatSearchSection")?.hidden) {
                closeChatSearch();
            }
        });

        /* Prevent default file drag-and-drop navigation */

        const conversation = $("conversation");

        if (conversation) {
            conversation.addEventListener(
                "dragover",
                function (event) {
                    event.preventDefault();
                }
            );

            conversation.addEventListener(
                "drop",
                async function (event) {
                    event.preventDefault();

                    const file =
                        event.dataTransfer?.files?.[0];

                    if (file) {
                        await sendFile(file);
                    }
                }
            );
        }
    }

    /* ========================================================
       29. INITIALIZATION
    ======================================================== */

    async function init() {
        bindEvents();

        if ($("expressionPanel")) {
            $("expressionPanel").hidden = true;
        }

        if ($("chatSearchSection")) {
            $("chatSearchSection").hidden = true;
        }

        if ($("callOptionsModal")) {
            $("callOptionsModal").hidden = true;
        }

        if ($("conversationMenuModal")) {
            $("conversationMenuModal").hidden = true;
        }

        if ($("imageViewer")) {
            $("imageViewer").hidden = true;
        }

        if ($("recordingStatus")) {
            $("recordingStatus").hidden = true;
        }

        renderEmojiGrid();

        try {
            await loadCurrentUser();

            const loaded = await loadPartnerProfile();

            if (!loaded) {
                return;
            }

            await loadMessages({
                silent: false,
                forceBottom: true
            });

            startPolling();

            console.log(
                "[UtaNexa Chat] Initialized successfully."
            );

        } catch (error) {
            console.error(
                "[UtaNexa Chat] Initialization failed:",
                error
            );

            showToast(
                getErrorMessage(
                    error,
                    "Chat load nahi hui."
                ),
                4000
            );
        }
    }

    /* ========================================================
       30. CLEANUP
    ======================================================== */

    window.addEventListener("beforeunload", function () {
        stopPolling();
        stopRecordingTimer();
        stopRecordingTracks();

        if (
            state.speechRecognition &&
            state.speechActive
        ) {
            try {
                state.speechRecognition.stop();
            } catch (_) {
                // Browser may already have stopped recognition.
            }
        }

        if (
            state.mediaRecorder &&
            state.mediaRecorder.state !== "inactive"
        ) {
            try {
                state.mediaRecorder.stop();
            } catch (_) {
                // Browser may already have stopped recording.
            }
        }
    });

    /* ========================================================
       31. START
    ======================================================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

})();


/* =====================================================
   UTANEXA NORMAL CHAT — UI ENHANCEMENTS
   Add at the END of the existing chat.js file.
   Does not replace existing chat functions.
   ===================================================== */
(function () {
    "use strict";

    function initChatEnhancements() {
        const avatarButton = document.getElementById("selectedAvatarButton");
        const avatar = document.getElementById("selectedAvatar");
        const name = document.getElementById("selectedName");

        if (!avatarButton || !avatar || !name) return;

        /* ---------- Toast message ---------- */
        function showEnhancementToast(message) {
            let toast = document.getElementById("chatEnhancementToast");

            if (!toast) {
                toast = document.createElement("div");
                toast.id = "chatEnhancementToast";
                toast.className = "chat-enhancement-toast";
                toast.setAttribute("role", "status");
                document.body.appendChild(toast);
            }

            toast.textContent = message;
            toast.classList.add("show");

            clearTimeout(toast._hideTimer);
            toast._hideTimer = setTimeout(function () {
                toast.classList.remove("show");
            }, 2200);
        }

        /* ---------- Enlarge profile photo ---------- */
        function openProfilePhoto() {
            const imageUrl = avatar.currentSrc || avatar.src;

            if (!imageUrl || imageUrl === window.location.href) {
                showEnhancementToast("Profile photo available nahi hai.");
                return;
            }

            let overlay = document.getElementById("chatProfilePhotoOverlay");

            if (!overlay) {
                overlay = document.createElement("div");
                overlay.id = "chatProfilePhotoOverlay";

                Object.assign(overlay.style, {
                    position: "fixed",
                    inset: "0",
                    zIndex: "11000",
                    display: "none",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    background: "rgba(0,0,0,0.92)",
                    backdropFilter: "blur(12px)"
                });

                const close = document.createElement("button");
                close.type = "button";
                close.textContent = "×";
                close.setAttribute("aria-label", "Close photo");

                Object.assign(close.style, {
                    position: "absolute",
                    top: "max(18px, env(safe-area-inset-top))",
                    right: "20px",
                    width: "44px",
                    height: "44px",
                    border: "0",
                    borderRadius: "50%",
                    background: "#202b40",
                    color: "#fff",
                    fontSize: "30px",
                    cursor: "pointer"
                });

                const largeImage = document.createElement("img");
                largeImage.id = "chatProfilePhotoLarge";
                largeImage.alt = "Profile photo";

                Object.assign(largeImage.style, {
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "80dvh",
                    objectFit: "contain",
                    borderRadius: "18px",
                    boxShadow: "0 12px 45px rgba(0,0,0,0.5)"
                });

                close.addEventListener("click", closePhoto);
                overlay.addEventListener("click", function (event) {
                    if (event.target === overlay) closePhoto();
                });

                overlay.append(close, largeImage);
                document.body.appendChild(overlay);
            }

            const largeImage = document.getElementById("chatProfilePhotoLarge");
            largeImage.src = imageUrl;
            overlay.style.display = "flex";
            document.body.style.overflow = "hidden";

            function handleEscape(event) {
                if (event.key === "Escape") closePhoto();
            }

            function closePhoto() {
                overlay.style.display = "none";
                document.body.style.overflow = "";
                document.removeEventListener("keydown", handleEscape);
            }

            overlay._closePhoto = closePhoto;
            document.addEventListener("keydown", handleEscape);
        }

        /* Capture the avatar tap before the old profile-click handler. */
        document.addEventListener("click", function (event) {
            const clickedAvatar = event.target.closest("#selectedAvatarButton");

            if (!clickedAvatar) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            openProfilePhoto();
        }, true);

        /* ---------- Name opens partner profile ---------- */
        name.setAttribute("role", "link");
        name.setAttribute("tabindex", "0");
        name.setAttribute("aria-label", "Open profile");

        function openPartnerProfilePage() {
            const params = new URLSearchParams(window.location.search);
            const partnerId =
                params.get("user_id") ||
                params.get("partner_id") ||
                params.get("receiver_id");

            if (!partnerId) {
                showEnhancementToast("Profile kholne ke liye partner ID nahi mili.");
                return;
            }

            window.location.href =
                "/profile?user_id=" + encodeURIComponent(partnerId);
        }

        name.addEventListener("click", openPartnerProfilePage);

        name.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPartnerProfilePage();
            }
        });

        /* ---------- Better mobile tap feedback ---------- */
        [avatarButton, name].forEach(function (element) {
            element.style.webkitTapHighlightColor = "transparent";
        });

        console.info("[UtaNexa] Chat UI enhancements loaded.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initChatEnhancements, {
            once: true
        });
    } else {
        initChatEnhancements();
    }
})();

