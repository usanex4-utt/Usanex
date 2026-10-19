
/* =========================================================
   UTANEXA — NORMAL CHAT
   Messaging + Profile DP + Circular Zoom + Search + Media
   Couple Chat files are not modified.
   ========================================================= */

(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const state = {
        currentUser: null,
        partner: null,
        messages: [],
        loading: false,
        sending: false,
        zoomed: false,
        searchQuery: "",
        refreshTimer: null,
        lastMessageCount: 0
    };

    const API = {
        me: "/api/auth/me",
        profile: (id) => `/api/profile/${encodeURIComponent(id)}`,
        chat: (id) => `/api/chat/${encodeURIComponent(id)}`,
        send: "/api/chat/send",
        read: (id) => `/api/chat/${encodeURIComponent(id)}/read`,
        deleteMessage: (id) =>
            `/api/chat/message/${encodeURIComponent(id)}/delete`
    };

    function getToken() {
        return (
            localStorage.getItem("access_token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("access_token") ||
            sessionStorage.getItem("token") ||
            ""
        );
    }

    function headers(json = false) {
        const h = {};
        if (json) h["Content-Type"] = "application/json";

        const token = getToken();
        if (token) h.Authorization = `Bearer ${token}`;

        return h;
    }

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                ...headers(
                    options.body &&
                    typeof options.body === "string"
                ),
                ...(options.headers || {})
            }
        });

        if (response.status === 401) {
            toast("Session expire ho gaya. Dobara login karein.");
            throw new Error("Authentication required");
        }

        if (!response.ok) {
            const message = await response.text().catch(() => "");
            throw new Error(message || `Request failed: ${response.status}`);
        }

        if (response.status === 204) return null;

        const type = response.headers.get("content-type") || "";
        if (type.includes("application/json")) {
            return response.json();
        }

        return response.text();
    }

    function toast(message) {
        const el = $("chatToast");
        if (!el) {
            console.log(message);
            return;
        }

        el.textContent = message;
        el.classList.add("show");

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            el.classList.remove("show");
        }, 2600);
    }

    function getUserId(user) {
        if (!user) return "";

        return String(
            user.user_id ??
            user.id ??
            user.uid ??
            user.receiver_id ??
            user.partner_id ??
            ""
        );
    }

    function displayName(user) {
        if (!user) return "UtaNexa User";

        return String(
            user.full_name ||
            user.name ||
            user.display_name ||
            user.username ||
            user.user_name ||
            user.first_name ||
            "UtaNexa User"
        ).trim();
    }

    function getPartnerId() {
        const params = new URLSearchParams(location.search);

        return (
            params.get("user_id") ||
            params.get("partner_id") ||
            params.get("id") ||
            getUserId(state.partner)
        );
    }

    function normalizeImageUrl(value) {
        if (!value || typeof value !== "string") return "";

        const url = value.trim();
        if (!url) return "";

        if (
            url.startsWith("data:image/") ||
            url.startsWith("blob:")
        ) {
            return url;
        }

        if (/^https?:\/\//i.test(url)) return url;
        if (url.startsWith("//")) return `${location.protocol}${url}`;

        return url.startsWith("/") ? url : `/${url}`;
    }

    function getAvatar(user) {
        if (!user) return "";

        const candidates = [
            user.profile_photo_url,
            user.profile_image_url,
            user.avatar_url,
            user.photo_url,
            user.profile_picture,
            user.profile_pic,
            user.avatar,
            user.photo,
            user.image_url,
            user.image,
            user.profile_image,
            user.dp,
            user.picture
        ];

        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim()) {
                return normalizeImageUrl(candidate);
            }
        }

        return "";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function formatTime(value) {
        if (!value) return "";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function setStatus(text, online = false) {
        const status = $("selectedStatus");
        const dot = $("onlineDot");

        if (status) status.textContent = text || "Offline";

        if (dot) {
            dot.classList.toggle("online", Boolean(online));
            dot.hidden = !online;
        }
    }

    function setHeaderPhoto(user) {
        const img = $("selectedAvatar");
        if (!img) return;

        const url = getAvatar(user);
        img.dataset.realPhoto = url;

        img.onerror = () => {
            img.onerror = null;
            img.src = "/static/images/default-avatar.png";
        };

        img.src = url || "/static/images/default-avatar.png";
        img.alt = `${displayName(user)} profile photo`;
    }

    function setHeader(user) {
        state.partner = user || state.partner;

        const name = $("selectedName");
        if (name) name.textContent = displayName(state.partner);

        setHeaderPhoto(state.partner);

        const online =
            state.partner?.is_online === true ||
            state.partner?.online === true;

        const statusText =
            state.partner?.is_online === true ||
            state.partner?.online === true
                ? "Online"
                : state.partner?.last_seen
                    ? `Last seen ${formatLastSeen(state.partner.last_seen)}`
                    : "UtaNexa";

        setStatus(statusText, online);
    }

    function formatLastSeen(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "recently";

        return date.toLocaleString([], {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function getMessageId(message) {
        return String(
            message?.id ??
            message?.message_id ??
            message?.chat_id ??
            ""
        );
    }

    function isMine(message) {
        const sender = String(
            message.sender_id ??
            message.sender_user_id ??
            message.from_user_id ??
            message.user_id ??
            ""
        );

        return sender !== "" && sender === getUserId(state.currentUser);
    }

    function messageText(message) {
        return String(
            message.content ??
            message.message ??
            message.text ??
            ""
        );
    }

    function mediaUrl(message) {
        return normalizeImageUrl(
            message.media_url ||
            message.file_url ||
            message.attachment_url ||
            message.image_url ||
            ""
        );
    }

    function mediaType(message) {
        const explicit = String(
            message.media_type ||
            message.file_type ||
            message.attachment_type ||
            ""
        ).toLowerCase();

        if (explicit.includes("image")) return "image";
        if (explicit.includes("video")) return "video";
        if (explicit.includes("audio") || explicit.includes("voice")) {
            return "audio";
        }

        const url = mediaUrl(message).split("?")[0].toLowerCase();

        if (/\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(url)) return "image";
        if (/\.(mp4|webm|mov|m4v)$/i.test(url)) return "video";
        if (/\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(url)) return "audio";

        return "";
    }

    function renderMedia(message) {
        const url = mediaUrl(message);
        if (!url) return "";

        const type = mediaType(message);
        const safeUrl = escapeHTML(url);

        if (type === "image") {
            return `
                <img
                    class="message-media message-image"
                    src="${safeUrl}"
                    alt="Shared image"
                    loading="lazy"
                    data-open-image="${safeUrl}"
                >
            `;
        }

        if (type === "video") {
            return `
                <video class="message-media" controls preload="metadata">
                    <source src="${safeUrl}">
                    Your browser does not support video.
                </video>
            `;
        }

        if (type === "audio") {
            return `
                <audio class="message-audio" controls preload="metadata">
                    <source src="${safeUrl}">
                </audio>
            `;
        }

        return `
            <a class="message-file" href="${safeUrl}" target="_blank"
               rel="noopener noreferrer">Open attachment</a>
        `;
    }

    function receiptText(message) {
        if (!isMine(message)) return "";

        if (message.seen || message.is_seen || message.read_at) {
            return "✓✓ Seen";
        }

        if (message.delivered || message.is_delivered) {
            return "✓✓ Delivered";
        }

        return "✓ Sent";
    }

    function renderMessage(message) {
        const mine = isMine(message);
        const content = messageText(message);
        const time = formatTime(
            message.created_at ||
            message.timestamp ||
            message.sent_at
        );

        const id = getMessageId(message);
        const media = renderMedia(message);
        const receipt = receiptText(message);

        return `
            <article
                class="message ${mine ? "outgoing sent" : "incoming received"}"
                data-message-id="${escapeHTML(id)}"
                data-message-text="${escapeHTML(content.toLowerCase())}"
            >
                <div class="message-bubble">
                    ${media}
                    ${content ? `<div class="message-text">${escapeHTML(content)}</div>` : ""}
                    <div class="message-meta">
                        <time>${escapeHTML(time)}</time>
                        ${receipt ? `<span class="message-receipt">${escapeHTML(receipt)}</span>` : ""}
                    </div>
                </div>
            </article>
        `;
    }

    function scrollToBottom(force = false) {
        const area = $("messages");
        if (!area) return;

        const distance =
            area.scrollHeight - area.scrollTop - area.clientHeight;

        if (force || distance < 180) {
            area.scrollTop = area.scrollHeight;
        }
    }

    function renderMessages(messages, forceScroll = false) {
        const conversation = $("conversation");
        const empty = $("emptyConversation");

        if (!conversation) return;

        state.messages = Array.isArray(messages) ? messages : [];

        conversation.innerHTML = state.messages
            .map(renderMessage)
            .join("");

        if (empty) {
            empty.hidden = state.messages.length > 0;
        }

        applySearch();

        if (forceScroll) scrollToBottom(true);
    }

    function applySearch() {
        const query = state.searchQuery.trim().toLowerCase();
        const nodes = document.querySelectorAll("#conversation .message");

        nodes.forEach((node) => {
            const text = node.dataset.messageText || "";
            node.hidden = Boolean(query && !text.includes(query));
        });
    }

    async function loadCurrentUser() {
        const data = await api(API.me);
        state.currentUser =
            data?.user ||
            data?.current_user ||
            data?.profile ||
            data;

        if (!state.currentUser || !getUserId(state.currentUser)) {
            throw new Error("Current user details not found");
        }

        return state.currentUser;
    }

    async function loadProfile(partnerId) {
        if (!partnerId) {
            throw new Error("Chat user ID missing in URL");
        }

        const data = await api(API.profile(partnerId));
        const user =
            data?.user ||
            data?.profile ||
            data?.data ||
            data;

        if (!user || typeof user !== "object") {
            throw new Error("User profile not found");
        }

        state.partner = {
            ...user,
            user_id: user.user_id ?? user.id ?? partnerId
        };

        setHeader(state.partner);
        return state.partner;
    }

    async function markRead(partnerId) {
        try {
            await api(API.read(partnerId), {
                method: "POST"
            });
        } catch (error) {
            console.debug("Could not mark messages read:", error.message);
        }
    }

    async function loadMessages({ initial = false } = {}) {
        const partnerId = getPartnerId();
        if (!partnerId || state.loading) return;

        state.loading = true;

        try {
            const data = await api(API.chat(partnerId));
            const messages = Array.isArray(data)
                ? data
                : data?.messages ||
                  data?.data?.messages ||
                  [];

            if (data?.user && typeof data.user === "object") {
                state.partner = {
                    ...state.partner,
                    ...data.user
                };
                setHeader(state.partner);
            }

            const oldCount = state.messages.length;
            const oldLastId = oldCount
                ? getMessageId(state.messages[oldCount - 1])
                : "";

            const newLastId = messages.length
                ? getMessageId(messages[messages.length - 1])
                : "";

            const changed =
                oldCount !== messages.length ||
                oldLastId !== newLastId;

            if (changed || initial) {
                renderMessages(messages, initial || changed);
            } else {
                state.messages = messages;
            }

            await markRead(partnerId);
        } catch (error) {
            console.error("Chat load failed:", error);
            if (initial) {
                toast("Chat load nahi ho paayi. Dobara try karein.");
            }
        } finally {
            state.loading = false;
        }
    }

    async function sendMessage(content, file = null) {
        const partnerId = getPartnerId();

        if (!partnerId) {
            toast("Chat user nahi mila.");
            return;
        }

        if (state.sending) return;

        const text = String(content || "").trim();

        if (!text && !file) return;

        /*
         * Text messages are sent through the existing API.
         * The file input is handled separately below because file uploads
         * require the upload endpoint supported by the backend.
         */
        if (file) {
            toast("File upload ke liye backend upload endpoint zaroori hai.");
            return;
        }

        state.sending = true;

        const sendButton = $("sendButton");
        if (sendButton) sendButton.disabled = true;

        try {
            await api(API.send, {
                method: "POST",
                body: JSON.stringify({
                    receiver_id: partnerId,
                    content: text,
                    media_url: null,
                    media_type: null
                })
            });

            const input = $("messageInput");
            if (input) {
                input.value = "";
                resizeTextarea(input);
            }

            await loadMessages();
            scrollToBottom(true);
        } catch (error) {
            console.error("Message send failed:", error);
            toast("Message send nahi hua. Dobara try karein.");
        } finally {
            state.sending = false;
            if (sendButton) sendButton.disabled = false;
        }
    }

    function resizeTextarea(input) {
        if (!input) return;

        input.style.height = "auto";
        input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    }

    function openImage(url, owner = state.partner) {
        if (!url) {
            toast("Photo available nahi hai.");
            return;
        }

        const viewer = $("imageViewer");
        const image = $("viewerImage");
        const name = $("dpProfileName");

        if (!viewer || !image) return;

        state.zoomed = false;
        image.classList.remove("zoomed");
        image.style.transformOrigin = "center center";

        if (name) {
            name.textContent = displayName(owner);
        }

        image.onerror = () => {
            image.onerror = null;
            toast("Photo load nahi ho paayi.");
        };

        image.src = normalizeImageUrl(url);
        viewer.hidden = false;
        document.body.classList.add("viewer-open");
    }

    function closeImage() {
        const viewer = $("imageViewer");
        const image = $("viewerImage");

        if (viewer) viewer.hidden = true;

        if (image) {
            image.classList.remove("zoomed");
            image.style.transformOrigin = "center center";
        }

        state.zoomed = false;
        document.body.classList.remove("viewer-open");
    }

    function toggleZoom() {
        const image = $("viewerImage");
        if (!image) return;

        state.zoomed = !state.zoomed;
        image.classList.toggle("zoomed", state.zoomed);
    }

    function openModal(id) {
        const modal = $(id);
        if (modal) modal.hidden = false;
    }

    function closeModal(id) {
        const modal = $(id);
        if (modal) modal.hidden = true;
    }

    function openSearch() {
        const section = $("chatSearchSection");
        const input = $("chatSearch");

        if (section) section.hidden = false;
        if (input) input.focus();
    }

    function showProfile() {
        const partnerId = getPartnerId();
        if (!partnerId) return;

        location.href =
            `/profile?user_id=${encodeURIComponent(partnerId)}`;
    }

    function showMedia() {
        const images = document.querySelectorAll(
            "#conversation img.message-image"
        );

        if (!images.length) {
            toast("Abhi koi image available nahi hai.");
            return;
        }

        const first = images[0];
        first.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        first.classList.add("media-highlight");
        setTimeout(() => first.classList.remove("media-highlight"), 1200);

        closeModal("conversationMenuModal");
    }

    function clearVisibleChat() {
        /*
         * This only clears the current display.
         * It does not delete server-side messages.
         */
        const conversation = $("conversation");
        if (conversation) conversation.innerHTML = "";

        state.messages = [];

        const empty = $("emptyConversation");
        if (empty) empty.hidden = false;

        closeModal("conversationMenuModal");
        toast("Chat display clear ho gaya.");
    }

    function bindEvents() {
        const composer = $("composer");
        composer?.addEventListener("submit", (event) => {
            event.preventDefault();
            sendMessage($("messageInput")?.value || "");
        });

        const input = $("messageInput");
        input?.addEventListener("input", () => resizeTextarea(input));

        input?.addEventListener("keydown", (event) => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();
                composer?.requestSubmit();
            }
        });

        $("backButton")?.addEventListener("click", () => {
            if (history.length > 1) history.back();
            else location.href = "/home";
        });

        $("selectedAvatarButton")?.addEventListener("click", () => {
            const url = $("selectedAvatar")?.dataset.realPhoto || "";
            openImage(url, state.partner);
        });

        $("profileNameButton")?.addEventListener("click", showProfile);
        $("menuViewProfile")?.addEventListener("click", showProfile);

        $("closeImageViewer")?.addEventListener("click", closeImage);
        $("viewerImage")?.addEventListener("click", toggleZoom);

        $("imageViewer")?.addEventListener("click", (event) => {
            if (event.target === $("imageViewer")) closeImage();
        });

        $("conversationMenu")?.addEventListener("click", () => {
            openModal("conversationMenuModal");
        });

        $("closeConversationMenu")?.addEventListener("click", () => {
            closeModal("conversationMenuModal");
        });

        $("voiceCallButton")?.addEventListener("click", () => {
            openModal("callOptionsModal");
        });

        $("closeCallOptions")?.addEventListener("click", () => {
            closeModal("callOptionsModal");
        });

        $("startVoiceCall")?.addEventListener("click", () => {
            toast("Voice call ke liye call-signaling backend chahiye.");
            closeModal("callOptionsModal");
        });

        $("startVideoCall")?.addEventListener("click", () => {
            toast("Video call ke liye call-signaling backend chahiye.");
            closeModal("callOptionsModal");
        });

        $("menuSearchMessages")?.addEventListener("click", () => {
            closeModal("conversationMenuModal");
            openSearch();
        });

        $("menuViewMedia")?.addEventListener("click", showMedia);

        $("menuClearChat")?.addEventListener("click", () => {
            const confirmed = window.confirm(
                "Sirf current screen se messages clear karein? Server ke messages delete nahi honge."
            );

            if (confirmed) clearVisibleChat();
        });

        $("chatSearch")?.addEventListener("input", (event) => {
            state.searchQuery = event.target.value || "";
            applySearch();
        });

        $("closeChatSearch")?.addEventListener("click", () => {
            state.searchQuery = "";

            const input = $("chatSearch");
            if (input) input.value = "";

            const section = $("chatSearchSection");
            if (section) section.hidden = true;

            applySearch();
        });

        $("conversation")?.addEventListener("click", (event) => {
            const image = event.target.closest("[data-open-image]");
            if (!image) return;

            const messageElement = image.closest("[data-message-id]");
            const messageId = messageElement?.dataset.messageId;

            const message = state.messages.find(
                (item) => getMessageId(item) === messageId
            );

            const owner = message && isMine(message)
                ? state.currentUser
                : state.partner;

            openImage(image.dataset.openImage, owner);
        });

        $("attachButton")?.addEventListener("click", () => {
            $("fileInput")?.click();
        });

        $("cameraButton")?.addEventListener("click", () => {
            $("cameraInput")?.click();
        });

        $("fileInput")?.addEventListener("change", (event) => {
            const file = event.target.files?.[0];
            if (file) {
                toast("File select hui. Upload ke liye backend upload endpoint chahiye.");
            }
            event.target.value = "";
        });

        $("cameraInput")?.addEventListener("change", (event) => {
            const file = event.target.files?.[0];
            if (file) {
                toast("Photo select hui. Upload ke liye backend upload endpoint chahiye.");
            }
            event.target.value = "";
        });

        $("emojiButton")?.addEventListener("click", () => {
            const input = $("messageInput");
            if (!input) return;

            input.value += " 😊";
            input.focus();
            resizeTextarea(input);
        });

        $("micButton")?.addEventListener("click", () => {
            toast("Voice recording upload ke liye backend support chahiye.");
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeImage();
                closeModal("callOptionsModal");
                closeModal("conversationMenuModal");
            }
        });
    }

    async function init() {
        bindEvents();

        try {
            await loadCurrentUser();

            const partnerId = getPartnerId();

            if (!partnerId) {
                toast("Chat open karne ke liye user ID missing hai.");
                setStatus("User not selected", false);
                return;
            }

            await loadProfile(partnerId);
            await loadMessages({ initial: true });

            clearInterval(state.refreshTimer);
            state.refreshTimer = setInterval(() => {
                if (!document.hidden) loadMessages();
            }, 5000);
        } catch (error) {
            console.error("UtaNexa chat initialization failed:", error);
            setStatus("Connection problem", false);
            toast("Chat connect nahi ho paayi. Login aur user ID check karein.");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
