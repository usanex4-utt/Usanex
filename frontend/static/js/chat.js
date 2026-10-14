/* =========================================================
   UTANEXA — CHAT ENGINE
   File: frontend/static/js/chat.js
   Version: 6

   Features:
   - Existing authentication and chat API integration
   - Text messages
   - Image attachment and camera
   - Emoji picker and searchable emojis
   - Speech-to-text where browser supports it
   - Voice message recording UI
   - Couple Chat navigation
   - Call option UI
   - Message search
   - Image viewer
   - Responsive mobile interaction

   Note:
   Real-time delivery, GIF provider integration, and
   WebRTC calls require corresponding backend support.
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API = {
        me: "/api/auth/me",
        profile: (id) => `/api/profile/${encodeURIComponent(id)}`,
        messages: (id) => `/api/chat/${encodeURIComponent(id)}`,
        send: "/api/chat/send"
    };

    const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
    const IMAGE_COMPRESS_THRESHOLD = 2 * 1024 * 1024;
    const MAX_MESSAGE_LENGTH = 10000;

    const state = {
        currentUser: null,
        selectedUser: null,
        selectedUserId: null,

        messages: [],

        loading: false,
        sending: false,

        recognition: null,
        isRecognizing: false,

        mediaRecorder: null,
        audioStream: null,
        audioChunks: [],
        recordedAudioBlob: null,

        recordingStartedAt: 0,
        recordingTimer: null,

        activeExpressionTab: "emoji",
        activeEmojiCategory: "smileys",

        recentEmojis: [],

        toastTimer: null,
        searchQuery: "",

        messageObjectUrls: new Set()
    };

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       DOM HELPERS
    ===================================================== */

    function on(element, event, handler, options) {
        if (element) {
            element.addEventListener(event, handler, options);
        }
    }

    function show(element) {
        if (element) element.hidden = false;
    }

    function hide(element) {
        if (element) element.hidden = true;
    }

    function setText(element, value) {
        if (element) {
            element.textContent = value ?? "";
        }
    }

    function safeString(value) {
        return value == null ? "" : String(value);
    }

    function getUserId(user) {
        if (!user || typeof user !== "object") return "";

        return safeString(
            user.user_id ??
            user.id ??
            user.username ??
            user.mobile ??
            ""
        );
    }

    function getDisplayName(user) {
        if (!user || typeof user !== "object") {
            return "User";
        }

        return safeString(
            user.name ??
            user.full_name ??
            user.username ??
            user.user_id ??
            "User"
        );
    }

    function getAvatarUrl(user) {
        if (!user || typeof user !== "object") return "";

        return safeString(
            user.profile_photo ??
            user.profile_picture ??
            user.avatar ??
            user.photo ??
            ""
        );
    }

    function getCurrentPageUserId() {
        const params = new URLSearchParams(window.location.search);

        return (
            params.get("user_id") ||
            params.get("partner_id") ||
            params.get("receiver_id") ||
            params.get("id") ||
            ""
        );
    }

    /* =====================================================
       FETCH HELPERS
    ===================================================== */

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                ...(options.headers || {})
            }
        });

        if (response.status === 401) {
            window.location.href = "/login";
            throw new Error("Your session has expired. Please log in again.");
        }

        return response;
    }

    async function requestJSON(url, options = {}) {
        const response = await request(url, options);

        if (!response.ok) {
            const message = await readErrorMessage(response);

            throw new Error(message || `Request failed (${response.status})`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            return {};
        }

        return response.json();
    }

    async function readErrorMessage(response) {
        try {
            const data = await response.clone().json();

            return (
                data.detail ||
                data.message ||
                data.error ||
                ""
            );
        } catch {
            return "";
        }
    }

    /* =====================================================
       TOAST
    ===================================================== */

    function toast(message, duration = 2600) {
        const element = $("chatToast");

        if (!element) {
            console.log("[UtaNexa]", message);
            return;
        }

        setText(element, message);
        show(element);

        clearTimeout(state.toastTimer);

        state.toastTimer = setTimeout(() => {
            hide(element);
        }, duration);
    }

    /* =====================================================
       USER LOADING
    ===================================================== */

    async function loadCurrentUser() {
        try {
            const data = await requestJSON(API.me);

            state.currentUser =
                data.user ||
                data.current_user ||
                data.profile ||
                data;

            return state.currentUser;
        } catch (error) {
            console.error("Could not load current user:", error);
            return null;
        }
    }

    async function loadSelectedUser(userId) {
        if (!userId) {
            state.selectedUser = null;
            showEmptyConversation(true);
            setText($("selectedName"), "Select a conversation");
            setText($("selectedStatus"), "No conversation selected");
            return null;
        }

        state.selectedUserId = userId;

        try {
            const data = await requestJSON(API.profile(userId));

            state.selectedUser =
                data.user ||
                data.profile ||
                data;

            updateHeader();

            return state.selectedUser;
        } catch (error) {
            console.error("Could not load chat profile:", error);

            state.selectedUser = {
                user_id: userId,
                name: "User"
            };

            updateHeader();

            return state.selectedUser;
        }
    }

    function updateHeader() {
    const user = state.selectedUser;

    if (!user) return;

    setText($("selectedName"), getDisplayName(user));

    const statusElement = $("selectedStatus");

    const online =
        user.is_online === true ||
        user.online === true ||
        String(user.status || "").toLowerCase() === "online";

    if (statusElement) {
        if (online) {
            statusElement.textContent = "Online";
            statusElement.classList.add("online-status");
        } else {
            const lastSeen =
                user.last_seen_at ??
                user.last_seen ??
                user.last_seen_time ??
                user.last_active_at ??
                null;

            statusElement.textContent = formatLastSeen(lastSeen);
            statusElement.classList.remove("online-status");
        }
    }

    const avatar = $("selectedAvatar");
    const avatarUrl = getAvatarUrl(user);

    if (avatar && avatarUrl) {
        avatar.src = avatarUrl;
    }

    if (avatar) {
        avatar.onerror = () => {
            avatar.onerror = null;
            avatar.removeAttribute("src");
            avatar.alt = getDisplayName(user);
        };
    }
    }

        const onlineDot = $("headerOnlineDot");

        if (onlineDot) {
            const online =
                user.is_online === true ||
                user.online === true ||
                user.status === "online";

            onlineDot.classList.toggle("online", online);
            onlineDot.setAttribute("aria-label", online ? "Online" : "Offline");
        }
    }

    /* =====================================================
       MESSAGE NORMALIZATION
    ===================================================== */

    function normalizeMessages(data) {
        if (Array.isArray(data)) return data;

        if (!data || typeof data !== "object") return [];

        if (Array.isArray(data.messages)) return data.messages;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.results)) return data.results;

        return [];
    }

    async function loadMessages() {
        if (!state.selectedUserId || state.loading) return;

        state.loading = true;

        try {
            const data = await requestJSON(
                API.messages(state.selectedUserId)
            );

            state.messages = normalizeMessages(data);

            renderMessages();
            showEmptyConversation(state.messages.length === 0);
            scrollMessages(false);
        } catch (error) {
            console.error("Could not load messages:", error);

            toast("Messages could not be loaded.");
        } finally {
            state.loading = false;
        }
    }

    /* =====================================================
       MESSAGE HELPERS
    ===================================================== */

    function getMessageSenderId(message) {
        return safeString(
            message.sender_id ??
            message.sender_user_id ??
            message.from_user_id ??
            message.user_id ??
            message.sender?.user_id ??
            message.sender?.id ??
            ""
        );
    }

    function getMessageContent(message) {
        return safeString(
            message.content ??
            message.message ??
            message.text ??
            ""
        );
    }

    function getMessageImage(message) {
        return safeString(
            message.image_url ??
            message.file_url ??
            message.media_url ??
            message.attachment_url ??
            message.image ??
            ""
        );
    }

    function getMessageDate(message) {
        const value =
            message.created_at ??
            message.timestamp ??
            message.sent_at ??
            message.time ??
            "";

        if (!value) return null;

        const date = new Date(value);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function isOwnMessage(message) {
        const senderId = getMessageSenderId(message);

        const currentId = getUserId(state.currentUser);

        return Boolean(
            senderId &&
            currentId &&
            senderId === currentId
        );
    }

    function formatTime(message) {
        const date = getMessageDate(message);

        if (!date) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    /* =====================================================
       MESSAGE RENDERING
    ===================================================== */

    function renderMessages() {
        const container = $("messages");

        if (!container) return;

        const fragment = document.createDocumentFragment();

        const filtered = state.searchQuery
            ? state.messages.filter((message) =>
                getMessageContent(message)
                    .toLowerCase()
                    .includes(state.searchQuery.toLowerCase())
            )
            : state.messages;

        for (const message of filtered) {
            const row = createMessageElement(message);

            if (row) fragment.appendChild(row);
        }

        container.replaceChildren(fragment);

        showEmptyConversation(
            filtered.length === 0 && !state.searchQuery
        );
    }

    function createMessageElement(message) {
        const row = document.createElement("div");

        row.className = "message-row";

        const own = isOwnMessage(message);

        row.classList.add(own ? "sent" : "received");

        const bubble = document.createElement("div");

        bubble.className = "message-bubble";

        const content = getMessageContent(message);
        const imageUrl = getMessageImage(message);

        if (imageUrl) {
            const image = document.createElement("img");

            image.src = imageUrl;
            image.alt = "Shared image";
            image.loading = "lazy";
            image.decoding = "async";

            image.addEventListener("click", () => {
                openImageViewer(imageUrl);
            });

            bubble.appendChild(image);
        }

        if (content) {
            const text = document.createElement("div");

            text.className = "message-text";
            text.textContent = content;

            bubble.appendChild(text);
        }

        if (!content && !imageUrl) {
            const fallback = document.createElement("div");

            fallback.className = "message-text";
            fallback.textContent = "Unsupported message";

            bubble.appendChild(fallback);
        }

        const meta = document.createElement("div");

        meta.className = "message-meta";

        const time = document.createElement("span");

        time.className = "message-time";
        time.textContent = formatTime(message);

        meta.appendChild(time);

        if (own) {
            const status = document.createElement("span");

            status.className = "message-status";

            const read =
                message.is_read === true ||
                message.read === true ||
                message.status === "read";

            status.textContent = read ? "✓✓" : "✓";

            meta.appendChild(status);
        }

        bubble.appendChild(meta);
        row.appendChild(bubble);

        return row;
    }

    function showEmptyConversation(empty) {
        const element = $("emptyConversation");

        if (!element) return;

        element.hidden = !empty;
    }

    function scrollMessages(smooth = true) {
        const container = $("messages");

        if (!container) return;

        container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? "smooth" : "auto"
        });
    }

    /* =====================================================
       SEND TEXT MESSAGE
    ===================================================== */

    async function sendMessage() {
        const input = $("messageInput");

        if (!input || state.sending) return;

        const content = input.value.trim();

        if (!content) return;

        if (!state.selectedUserId) {
            toast("Please open a conversation first.");
            return;
        }

        if (content.length > MAX_MESSAGE_LENGTH) {
            toast("Message is too long.");
            return;
        }

        state.sending = true;

        const sendButton = $("sendButton");

        if (sendButton) sendButton.disabled = true;

        const formData = new FormData();

        formData.append("receiver_id", state.selectedUserId);
        formData.append("content", content);

        try {
            await requestJSON(API.send, {
                method: "POST",
                body: formData
            });

            input.value = "";
            autoResizeInput();

            await loadMessages();
            scrollMessages(true);
        } catch (error) {
            console.error("Message sending failed:", error);

            toast(error.message || "Message could not be sent.");
        } finally {
            state.sending = false;

            if (sendButton) sendButton.disabled = false;

            input.focus({ preventScroll: true });
        }
    }

    /* =====================================================
       COMPOSER
    ===================================================== */

    function setupComposer() {
        const form = $("composer");
        const input = $("messageInput");

        on(form, "submit", (event) => {
            event.preventDefault();
            sendMessage();
        });

        on(input, "input", autoResizeInput);

        on(input, "keydown", (event) => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    function autoResizeInput() {
        const input = $("messageInput");

        if (!input) return;

        input.style.height = "auto";

        input.style.height = Math.min(
            input.scrollHeight,
            130
        ) + "px";
    }

    /* =====================================================
       IMAGE COMPRESSION
    ===================================================== */

    async function compressImage(file) {
        if (
            !file ||
            !file.type.startsWith("image/") ||
            file.size <= IMAGE_COMPRESS_THRESHOLD
        ) {
            return file;
        }

        if (!("createImageBitmap" in window)) {
            return file;
        }

        try {
            const bitmap = await createImageBitmap(file);

            const maxDimension = 1920;

            const ratio = Math.min(
                1,
                maxDimension / Math.max(bitmap.width, bitmap.height)
            );

            const canvas = document.createElement("canvas");

            canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
            canvas.height = Math.max(1, Math.round(bitmap.height * ratio));

            const context = canvas.getContext("2d", {
                alpha: false
            });

            if (!context) {
                bitmap.close?.();
                return file;
            }

            context.drawImage(
                bitmap,
                0,
                0,
                canvas.width,
                canvas.height
            );

            bitmap.close?.();

            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.86);
            });

            if (!blob || blob.size >= file.size) {
                return file;
            }

            const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";

            return new File([blob], name, {
                type: "image/jpeg",
                lastModified: Date.now()
            });
        } catch (error) {
            console.warn("Image compression skipped:", error);
            return file;
        }
    }

    /* =====================================================
       SEND IMAGE
    ===================================================== */

    async function sendImage(file) {
        if (!file) return;

        if (!state.selectedUserId) {
            toast("Please open a conversation first.");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast("Please select an image.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            toast("Image is too large. Maximum size is 25 MB.");
            return;
        }

        toast("Preparing image...");

        try {
            const optimized = await compressImage(file);

            const formData = new FormData();

            formData.append("receiver_id", state.selectedUserId);
            formData.append("content", "");
            formData.append("file", optimized);

            await requestJSON(API.send, {
                method: "POST",
                body: formData
            });

            await loadMessages();
            scrollMessages(true);

            toast("Image sent.");
        } catch (error) {
            console.error("Image sending failed:", error);

            toast(error.message || "Image could not be sent.");
        }
    }

    /* =====================================================
       ATTACHMENT / CAMERA
    ===================================================== */

    function setupAttachment() {
        on($("attachButton"), "click", () => {
            $("fileInput")?.click();
        });

        on($("fileInput"), "change", async (event) => {
            const files = Array.from(event.target.files || []);

            event.target.value = "";

            for (const file of files) {
                await sendImage(file);
            }
        });
    }

    function setupCamera() {
        on($("cameraButton"), "click", () => {
            $("cameraInput")?.click();
        });

        on($("cameraInput"), "change", async (event) => {
            const file = event.target.files?.[0];

            event.target.value = "";

            if (file) {
                await sendImage(file);
            }
        });
    }

    /* =====================================================
       IMAGE VIEWER
    ===================================================== */

    function openImageViewer(src) {
        const viewer = $("imageViewer");
        const image = $("viewerImage");

        if (!viewer || !image || !src) return;

        image.src = src;

        show(viewer);
    }

    function closeImageViewer() {
        const viewer = $("imageViewer");
        const image = $("viewerImage");

        hide(viewer);

        if (image) image.removeAttribute("src");
    }

    function setupImageViewer() {
        on($("closeImageViewer"), "click", closeImageViewer);

        on($("imageViewer"), "click", (event) => {
            if (event.target === $("imageViewer")) {
                closeImageViewer();
            }
        });
    }

    /* =====================================================
       EMOJI DATA
    ===================================================== */

    const EMOJI_DATA = {
        smileys: [
            "😀","😃","😄","😁","😆","😅","🤣","😂",
            "🙂","🙃","😉","😊","😇","🥰","😍","🤩",
            "😘","😗","☺️","😚","😙","🥲","😋","😛",
            "😜","🤪","😝","🤑","🤗","🤭","🫢","🫣",
            "🤫","🤔","🫡","🤐","🤨","😐","😑","😶",
            "🫥","😏","😒","🙄","😬","😮‍💨","🤥","😌",
            "😔","😪","🤤","😴","😷","🤒","🤕","🤢",
            "🤮","🥵","🥶","🥴","😵","🤯","🥳","🥸",
            "😎","🤓","🧐","😕","🫤","😟","🙁","☹️",
            "😮","😯","😲","😳","🥺","🥹","😦","😧",
            "😨","😰","😥","😢","😭","😱","😖","😣",
            "😞","😓","😩","😫","🥱","😤","😡","😠",
            "🤬","😈","👿","💀","☠️","💩","🤡","👻",
            "👽","👾","🤖","🎃","😺","😸","😹","😻",
            "😼","😽","🙀","😿","😾"
        ],

        people: [
            "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏",
            "✌️","🤞","🫰","🤟","🤘","🤙","👈","👉",
            "👆","👇","☝️","🫵","👍","👎","✊","👊",
            "🤛","🤜","👏","🙌","🫶","👐","🤲","🤝",
            "🙏","✍️","💅","🤳","💪","🦾","🦿","🦵",
            "🦶","👂","🦻","👃","🧠","🫀","🫁","🦷",
            "🦴","👀","👁️","👅","👄","🫦","👶","🧒",
            "👦","👧","🧑","👨","👩","🧔","👵","👴",
            "🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇",
            "🤦","🤷","👮","🕵️","💂","🥷","👷","🫅",
            "🤴","👸","👳","👲","🧕","🤵","👰","🤰",
            "🫃","🫄","🤱","👼","🎅","🤶","🦸","🦹"
        ],

        nature: [
            "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼",
            "🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
            "🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤",
            "🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄",
            "🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰",
            "🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖",
            "🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠",
            "🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆",
            "🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪",
            "🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎",
            "🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩",
            "🦮","🐈","🐈‍⬛","🐓","🦃","🦚","🦜","🦢",
            "🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦",
            "🌵","🌲","🌳","🌴","🌱","🌿","☘️","🍀",
            "🎍","🪴","🎋","🍃","🍂","🍁","🌾","🌺",
            "🌻","🌹","🌷","🌼","🌸","💐","🌞","🌝",
            "🌛","🌜","🌚","🌕","🌙","⭐","🌟","✨",
            "⚡","☄️","💥","🔥","🌪️","🌈","☀️","🌤️",
            "⛅","🌧️","⛈️","❄️","☃️","🌊"
        ],

        food: [
            "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇",
            "🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥",
            "🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️",
            "🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠",
            "🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳",
            "🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭",
            "🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮",
            "🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜",
            "🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙",
            "🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧",
            "🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭",
            "🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯",
            "🥛","🍼","☕","🫖","🍵","🧃","🥤","🧋",
            "🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹",
            "🧉","🍾"
        ],

        activities: [
            "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉",
            "🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍",
            "🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿",
            "🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌",
            "🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️",
            "🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽",
            "🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉",
            "🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹",
            "🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹",
            "🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻",
            "🎲","♟️","🎯","🎳","🎮","🕹️","🎰","🧩",
            "🎊","🎉","🎈","🎁","🎀","🎂","🎆","🎇",
            "🧨","✨","🎄","🎃","🎋","🎍"
        ],

        travel: [
            "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑",
            "🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️",
            "🛺","🚲","🛴","🛹","🚏","🛣️","🛤️","🛢️",
            "⛽","🛞","🚨","🚥","🚦","🛑","🚧","⚓",
            "⛵","🛶","🚤","🛳️","⛴️","🚢","✈️","🛩️",
            "🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡",
            "🛰️","🚀","🛸","🌍","🌎","🌏","🌐","🗺️",
            "🗾","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️",
            "🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱","🪨",
            "🪵","🛖","🏘️","🏚️","🏠","🏡","🏢","🏣",
            "🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬",
            "🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌",
            "🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃",
            "🌆","🌇","🌉","🎠","🛝","🎡","🎢","💈"
        ],

        objects: [
            "⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️",
            "🖲️","🕹️","💽","💾","💿","📀","📼","📷",
            "📸","📹","🎥","📽️","🎞️","📞","☎️","📟",
            "📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️",
            "⏰","🕰️","⌛","⏳","📡","🔋","🪫","🔌",
            "💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵",
            "💴","💶","💷","💰","💳","🪙","💎","⚖️",
            "🪜","🧰","🔧","🔨","⚒️","🛠️","⛏️","🪚",
            "🔩","⚙️","🪤","🧲","🪝","🧪","🧫","🧬",
            "🔬","🔭","📡","💊","🩹","🩺","🩻","🩼",
            "🚪","🛏️","🛋️","🪑","🚽","🚿","🛁","🪥",
            "🧴","🧻","🧼","🪒","🧽","🧹","🧺","🧷",
            "🧵","🪡","🧶","🪢","🧳","🌂","☂️","🧸",
            "🪆","🖼️","🪞","🪟","🛍️","🎒","👓","🕶️"
        ],

        symbols: [
            "❤️","🧡","💛","💚","💙","💜","🖤","🤍",
            "🤎","🩷","🩵","🩶","💔","❣️","💕","💞",
            "💓","💗","💖","💘","💝","💟","♥️","💌",
            "💋","💯","💢","💥","💫","💦","💨","🕳️",
            "💬","👁️‍🗨️","🗨️","🗯️","💭","💤","♨️","💣",
            "💬","🌀","💠","🔔","🔕","🎵","🎶","🏧",
            "🚮","🚰","♿","🚹","🚺","🚻","🚼","🚾",
            "⚠️","🚸","⛔","🚫","🚳","🚭","🚯","🚱",
            "🚷","📵","🔞","☢️","☣️","⬆️","↗️","➡️",
            "↘️","⬇️","↙️","⬅️","↖️","↕️","↔️","↩️",
            "↪️","⤴️","⤵️","🔃","🔄","🔙","🔚","🔛",
            "🔜","🔝","🛐","⚛️","🕉️","✡️","☸️","☯️",
            "✝️","☦️","☪️","☮️","🕎","🔯","♈","♉",
            "♊","♋","♌","♍","♎","♏","♐","♑",
            "♒","♓","⏭️","⏮️","⏯️","🔀","🔁","🔂",
            "▶️","⏩","⏪","⏫","⏬","⏹️","⏺️","⏏️",
            "🎦","🔅","🔆","📶","🛜","📳","📴","✖️",
            "➕","➖","➗","🟰","♾️","‼️","⁉️","❓",
            "❔","❕","❗","〰️","➰","➿","✔️","☑️",
            "🔘","⚪","⚫","🔴","🟠","🟡","🟢","🔵",
            "🟣","🟤","🔺","🔻","🔸","🔹","🔶","🔷",
            "▪️","▫️","◾","◽","◼️","◻️","⬛","⬜",
            "⭐","🌟","✨","💫","🔥","🎉","🎊","🏆"
        ]
    };

    /* =====================================================
       EMOJI PICKER
    ===================================================== */

    function setupEmoji() {
        on($("emojiButton"), "click", toggleExpressionPanel);

        on($("closeExpressionPanel"), "click", closeExpressionPanel);

        on($("emojiTab"), "click", () => {
            switchExpressionTab("emoji");
        });

        on($("gifTab"), "click", () => {
            switchExpressionTab("gif");
        });

        on($("emojiCategories"), "click", (event) => {
            const button = event.target.closest("[data-emoji-category]");

            if (!button) return;

            const category = button.dataset.emojiCategory;

            state.activeEmojiCategory =
                EMOJI_DATA[category] ? category : "smileys";

            $("emojiCategories")
                ?.querySelectorAll("[data-emoji-category]")
                .forEach((item) => {
                    item.classList.toggle(
                        "active",
                        item.dataset.emojiCategory === state.activeEmojiCategory
                    );
                });

            renderEmojiGrid();
        });

        on($("emojiGrid"), "click", (event) => {
            const button = event.target.closest("[data-emoji]");

            if (!button) return;

            insertEmoji(button.dataset.emoji);
        });

        on($("expressionSearch"), "input", () => {
            if (state.activeExpressionTab === "emoji") {
                renderEmojiGrid();
            } else {
                renderGifPlaceholder();
            }
        });

        document.addEventListener("click", (event) => {
            const panel = $("expressionPanel");

            if (!panel || panel.hidden) return;

            if (
                panel.contains(event.target) ||
                $("emojiButton")?.contains(event.target)
            ) {
                return;
            }

            closeExpressionPanel();
        });
    }

    function toggleExpressionPanel() {
        const panel = $("expressionPanel");

        if (!panel) return;

        if (!panel.hidden) {
            closeExpressionPanel();
            return;
        }

        show(panel);

        switchExpressionTab("emoji");

        renderEmojiGrid();
    }

    function closeExpressionPanel() {
        hide($("expressionPanel"));
    }

    function switchExpressionTab(tab) {
        state.activeExpressionTab = tab;

        const emojiTab = $("emojiTab");
        const gifTab = $("gifTab");

        emojiTab?.classList.toggle("active", tab === "emoji");
        gifTab?.classList.toggle("active", tab === "gif");

        emojiTab?.setAttribute(
            "aria-selected",
            String(tab === "emoji")
        );

        gifTab?.setAttribute(
            "aria-selected",
            String(tab === "gif")
        );

        const emojiGrid = $("emojiGrid");
        const categories = $("emojiCategories");
        const gifGrid = $("gifGrid");
        const search = $("expressionSearch");

        if (tab === "emoji") {
            show(emojiGrid);
            show(categories);
            hide(gifGrid);

            if (search) search.placeholder = "Search emoji...";

            renderEmojiGrid();
        } else {
            hide(emojiGrid);
            hide(categories);
            show(gifGrid);

            if (search) search.placeholder = "Search GIFs...";

            renderGifPlaceholder();
        }
    }

    function renderEmojiGrid() {
        const grid = $("emojiGrid");

        if (!grid) return;

        const query = ($("expressionSearch")?.value || "")
            .trim()
            .toLowerCase();

        let emojis = EMOJI_DATA[state.activeEmojiCategory] || EMOJI_DATA.smileys;

        if (query) {
            const allEmojis = Object.values(EMOJI_DATA).flat();

            emojis = [...new Set(allEmojis)].filter((emoji) =>
                emoji.includes(query)
            );
        }

        const fragment = document.createDocumentFragment();

        for (const emoji of emojis) {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "emoji-item";
            button.dataset.emoji = emoji;

            button.textContent = emoji;
            button.setAttribute("aria-label", emoji);

            fragment.appendChild(button);
        }

        grid.replaceChildren(fragment);
    }

    function insertEmoji(emoji) {
        const input = $("messageInput");

        if (!input) return;

        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;

        input.value =
            input.value.slice(0, start) +
            emoji +
            input.value.slice(end);

        const position = start + emoji.length;

        input.focus({ preventScroll: true });
        input.setSelectionRange(position, position);

        autoResizeInput();

        closeExpressionPanel();

        state.recentEmojis = [
            emoji,
            ...state.recentEmojis.filter((item) => item !== emoji)
        ].slice(0, 20);
    }

    /* =====================================================
       GIF PLACEHOLDER
    ===================================================== */

    function renderGifPlaceholder() {
        const grid = $("gifGrid");

        if (!grid) return;

        grid.replaceChildren();

        const note = document.createElement("p");

        note.className = "expression-note";

        note.textContent =
            "GIF search needs a GIF provider and a server endpoint. " +
            "Connect a provider before GIFs can be searched and sent.";

        grid.appendChild(note);
    }

    /* =====================================================
       SPEECH TO TEXT
    ===================================================== */

    function setupSpeechToText() {
        const button = $("micButton");

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!button) return;

        if (!SpeechRecognition) {
            button.addEventListener("click", () => {
                toast("Speech-to-text is not supported in this browser.");
            });

            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "hi-IN";
        recognition.continuous = true;
        recognition.interimResults = true;

        state.recognition = recognition;

        let finalTranscript = "";

        recognition.onstart = () => {
            state.isRecognizing = true;

            button.style.color = "var(--success)";

            toast("Listening... Speak now.");
        };

        recognition.onresult = (event) => {
            let interim = "";

            for (
                let index = event.resultIndex;
                index < event.results.length;
                index++
            ) {
                const result = event.results[index];

                if (result.isFinal) {
                    finalTranscript += result[0].transcript + " ";
                } else {
                    interim += result[0].transcript;
                }
            }

            const input = $("messageInput");

            if (!input) return;

            const combined = (finalTranscript + interim).trim();

            input.value = combined;

            autoResizeInput();
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);

            if (event.error === "not-allowed") {
                toast("Please allow microphone access.");
            } else if (event.error !== "no-speech") {
                toast("Speech recognition stopped.");
            }
        };

        recognition.onend = () => {
            state.isRecognizing = false;

            button.style.color = "";

            finalTranscript = "";
        };

        on(button, "click", () => {
            if (state.isRecognizing) {
                recognition.stop();
                return;
            }

            finalTranscript = "";

            try {
                recognition.lang = "hi-IN";
                recognition.start();
            } catch (error) {
                console.warn(error);
                toast("Unable to start speech recognition.");
            }
        });
    }

    /* =====================================================
       VOICE MESSAGE RECORDING
    ===================================================== */

    function setupVoiceRecording() {
        const sendButton = $("sendButton");

        if (!sendButton) return;

        on(sendButton, "contextmenu", (event) => {
            event.preventDefault();
            startVoiceRecording();
        });

        let holdTimer = null;
        let holdStarted = false;

        on(sendButton, "pointerdown", (event) => {
            if (event.pointerType === "mouse") return;

            holdStarted = false;

            holdTimer = setTimeout(() => {
                holdStarted = true;
                startVoiceRecording();
            }, 500);
        });

        const stopHold = () => {
            clearTimeout(holdTimer);
        };

        on(sendButton, "pointerup", stopHold);
        on(sendButton, "pointercancel", stopHold);
        on(sendButton, "pointerleave", stopHold);

        on($("cancelRecordingButton"), "click", cancelVoiceRecording);
        on($("sendRecordingButton"), "click", sendVoiceRecording);
    }

    async function startVoiceRecording() {
        if (state.mediaRecorder) return;

        if (!navigator.mediaDevices?.getUserMedia) {
            toast("Voice recording is not supported by this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            state.audioStream = stream;
            state.audioChunks = [];

            let options = {};

            if (
                window.MediaRecorder &&
                MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ) {
                options.mimeType = "audio/webm;codecs=opus";
            }

            state.mediaRecorder = new MediaRecorder(stream, options);

            state.mediaRecorder.ondataavailable = (event) => {
                if (event.data?.size) {
                    state.audioChunks.push(event.data);
                }
            };

            state.mediaRecorder.onstop = () => {
                const mimeType =
                    state.mediaRecorder?.mimeType ||
                    "audio/webm";

                state.recordedAudioBlob = new Blob(
                    state.audioChunks,
                    { type: mimeType }
                );

                stopAudioStream();

                state.mediaRecorder = null;
            };

            state.mediaRecorder.start();

            state.recordingStartedAt = Date.now();

            show($("recordingStatus"));

            updateRecordingTimer();

            state.recordingTimer = setInterval(
                updateRecordingTimer,
                500
            );

            toast("Recording started. Tap Send to finish.");
        } catch (error) {
            console.error("Microphone error:", error);

            toast("Microphone permission is required.");
        }
    }

    function updateRecordingTimer() {
        const elapsed = Math.max(
            0,
            Math.floor((Date.now() - state.recordingStartedAt) / 1000)
        );

        const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const seconds = String(elapsed % 60).padStart(2, "0");

        setText(
            $("recordingTime"),
            `Recording ${minutes}:${seconds}`
        );
    }

    function stopAudioStream() {
        if (state.audioStream) {
            state.audioStream.getTracks().forEach((track) => track.stop());
            state.audioStream = null;
        }

        clearInterval(state.recordingTimer);
        state.recordingTimer = null;
    }

    function cancelVoiceRecording() {
        if (state.mediaRecorder?.state !== "inactive") {
            try {
                state.mediaRecorder.stop();
            } catch (error) {
                console.warn(error);
            }
        }

        state.audioChunks = [];
        state.recordedAudioBlob = null;

        stopAudioStream();

        hide($("recordingStatus"));

        toast("Recording cancelled.");
    }

    async function sendVoiceRecording() {
        if (state.mediaRecorder?.state === "recording") {
            state.mediaRecorder.stop();
        }

        /*
         * MediaRecorder fires its final data and stop events
         * asynchronously. Wait briefly for the final Blob.
         */
        await new Promise((resolve) => setTimeout(resolve, 250));

        const blob = state.recordedAudioBlob;

        if (!blob || !blob.size) {
            toast("No voice recording available.");
            return;
        }

        if (!state.selectedUserId) {
            toast("Please open a conversation first.");
            return;
        }

        const formData = new FormData();

        formData.append("receiver_id", state.selectedUserId);
        formData.append("content", "");
        formData.append("file", blob, "voice-message.webm");

        try {
            await requestJSON(API.send, {
                method: "POST",
                body: formData
            });

            state.recordedAudioBlob = null;
            state.audioChunks = [];

            hide($("recordingStatus"));

            await loadMessages();

            toast("Voice message uploaded.");
        } catch (error) {
            console.error("Voice message upload failed:", error);

            toast(
                "Voice upload failed. Your server must support audio attachments."
            );
        } finally {
            stopAudioStream();
        }
    }

    /* =====================================================
       COUPLE CHAT
    ===================================================== */

    function setupNavigation() {
        on($("coupleChatButton"), "click", () => {
            if (!state.selectedUserId) {
                toast("Please select a conversation first.");
                return;
            }

            const user = state.selectedUser || {};

            const params = new URLSearchParams({
                partner_id: state.selectedUserId,
                name: getDisplayName(user),
                avatar: getAvatarUrl(user)
            });

            window.location.href = `/couple-chat?${params.toString()}`;
        });

        on($("backButton"), "click", () => {
            window.location.href = "/home";
        });

        on($("selectedAvatarButton"), "click", () => {
            if (!state.selectedUserId) return;

            window.location.href =
                `/profile?user_id=${encodeURIComponent(state.selectedUserId)}`;
        });

        document.querySelectorAll(".bottom-nav button[data-page]")
            .forEach((button) => {
                on(button, "click", () => {
                    const page = button.dataset.page;

                    if (page) {
                        window.location.href = `/${encodeURIComponent(page)}`;
                    }
                });
            });
    }

    /* =====================================================
       CALL OPTIONS
    ===================================================== */

    function setupCallOptions() {
        on($("voiceCallButton"), "click", () => {
            if (!state.selectedUserId) {
                toast("Please select a conversation first.");
                return;
            }

            show($("callOptionsModal"));
        });

        on($("closeCallOptions"), "click", () => {
            hide($("callOptionsModal"));
        });

        on($("callOptionsModal"), "click", (event) => {
            if (event.target === $("callOptionsModal")) {
                hide($("callOptionsModal"));
            }
        });

        on($("startVoiceCall"), "click", () => {
            hide($("callOptionsModal"));

            toast(
                "Voice calling requires WebRTC and call-signaling support on the server.",
                4000
            );
        });

        on($("startVideoCall"), "click", () => {
            hide($("callOptionsModal"));

            toast(
                "Video calling requires WebRTC and call-signaling support on the server.",
                4000
            );
        });
    }

    /* =====================================================
       CONVERSATION MENU
    ===================================================== */

    function setupConversationMenu() {
        on($("conversationMenu"), "click", () => {
            show($("conversationMenuModal"));
        });

        on($("closeConversationMenu"), "click", () => {
            hide($("conversationMenuModal"));
        });

        on($("conversationMenuModal"), "click", (event) => {
            if (event.target === $("conversationMenuModal")) {
                hide($("conversationMenuModal"));
            }
        });

        on($("menuSearchMessages"), "click", () => {
            hide($("conversationMenuModal"));

            show($("chatSearchSection"));

            $("chatSearch")?.focus();
        });

        on($("menuViewMedia"), "click", () => {
            hide($("conversationMenuModal"));

            const hasMedia = state.messages.some(
                (message) => Boolean(getMessageImage(message))
            );

            toast(
                hasMedia
                    ? "Scroll through the conversation to view shared images."
                    : "No shared images found."
            );
        });

        on($("menuClearChat"), "click", () => {
            hide($("conversationMenuModal"));

            toast(
                "Clear chat is not enabled. A backend endpoint is required.",
                3500
            );
        });
    }

    /* =====================================================
       MESSAGE SEARCH
    ===================================================== */

    function setupSearch() {
        on($("chatSearch"), "input", (event) => {
            state.searchQuery = event.target.value.trim();

            renderMessages();
        });

        on($("closeChatSearch"), "click", () => {
            state.searchQuery = "";

            if ($("chatSearch")) {
                $("chatSearch").value = "";
            }

            hide($("chatSearchSection"));

            renderMessages();
        });
    }

    /* =====================================================
       KEYBOARD SHORTCUTS
    ===================================================== */

    function setupKeyboard() {
        on(document, "keydown", (event) => {
            if (event.key === "Escape") {
                closeExpressionPanel();
                hide($("callOptionsModal"));
                hide($("conversationMenuModal"));
                closeImageViewer();
            }
        });
    }

    /* =====================================================
       PAGE INITIALIZATION
    ===================================================== */

    async function initChatPage() {
        setupComposer();
        setupEmoji();
        setupAttachment();
        setupCamera();
        setupNavigation();
        setupCallOptions();
        setupConversationMenu();
        setupSearch();
        setupImageViewer();
        setupSpeechToText();
        setupVoiceRecording();
        setupKeyboard();

        renderEmojiGrid();

        const userId = getCurrentPageUserId();

        if (!userId) {
            await loadCurrentUser();

            setText($("selectedName"), "Select a conversation");
            setText($("selectedStatus"), "Open a chat from your connections");

            showEmptyConversation(true);

            return;
        }

        await loadCurrentUser();
        await loadSelectedUser(userId);
        await loadMessages();
    }

    document.addEventListener("DOMContentLoaded", initChatPage);

})();
