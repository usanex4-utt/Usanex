
/* =========================================================
   UTANEXA — NORMAL CHAT
   Existing API:
   GET  /api/auth/me
   GET  /api/profile/{user_id}
   GET  /api/chat/{user_id}
   POST /api/chat/send
   POST /api/chat/{user_id}/read
   POST /api/chat/message/{message_id}/delete

   Couple Chat remains separate.
   ========================================================= */

(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const API = "/api";
    const POLL_INTERVAL = 4000;

    let currentUser = null;
    let partner = null;
    let partnerId = "";
    let messages = [];
    let isSending = false;
    let isLoading = false;
    let lastMessageSignature = "";
    let pollTimer = null;
    let toastTimer = null;
    let recorder = null;
    let recordingStream = null;
    let recordedChunks = [];
    let recordingStartedAt = 0;
    let recordingTimer = null;
    let recordedBlob = null;
    let searchTerm = "";
    let mediaOnly = false;

    const emojiList = [
        "😀", "😃", "😄", "😁", "😂", "🤣",
        "😊", "😍", "🥰", "😘", "😎", "🤗",
        "🥹", "😭", "😢", "😔", "😡", "🤔",
        "❤️", "🩷", "💖", "💕", "💞", "💘",
        "🔥", "✨", "🎉", "👍", "🙏", "🤝",
        "🌹", "😘", "🫶", "💋", "🌙", "☀️"
    ];

    function escapeText(value) {
        return String(value ?? "");
    }

    function showToast(message) {
        const toast = $("chatToast");
        if (!toast) {
            console.log("[UtaNexa Chat]", message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    }

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            ...options,
            headers: {
                ...(options.headers || {})
            }
        });

        let data = {};
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data.message = await response.text();
        }

        if (response.status === 401 || response.status === 403) {
            throw new Error(
                data.detail || data.message || "Please log in again."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.detail || data.message || "Request failed."
            );
        }

        return data;
    }

    function getPartnerIdFromURL() {
        const params = new URLSearchParams(window.location.search);

        return (
            params.get("user_id") ||
            params.get("partner_id") ||
            params.get("receiver_id") ||
            params.get("id") ||
            ""
        ).trim();
    }

    function getUserId(user) {
        return String(
            user?.user_id ??
            user?.id ??
            user?.uid ??
            user?.username ??
            ""
        );
    }

    function getDisplayName(user) {
        return (
            user?.name ||
            user?.full_name ||
            user?.username ||
            user?.user_id ||
            "UtaNexa User"
        );
    }

    function getAvatar(user) {
        return (
            user?.profile_picture ||
            user?.profile_pic ||
            user?.avatar_url ||
            user?.avatar ||
            user?.photo_url ||
            "/static/images/default-avatar.png"
        );
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

    function formatDateLabel(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        }

        if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }

        return date.toLocaleDateString([], {
            day: "numeric",
            month: "short",
            year: date.getFullYear() === today.getFullYear()
                ? undefined
                : "numeric"
        });
    }

    function isMine(message) {
        return String(message.sender_id) === getUserId(currentUser);
    }

    function isRead(message) {
        return Boolean(
            message.is_read ||
            message.read ||
            message.seen ||
            message.status === "read"
        );
    }

    function getMessageContent(message) {
        return String(
            message.content ??
            message.message ??
            message.text ??
            ""
        );
    }

    function getMediaURL(message) {
        return (
            message.media_url ||
            message.file_url ||
            message.attachment_url ||
            ""
        );
    }

    function getMediaType(message) {
        const type = String(message.media_type || "").toLowerCase();
        const url = getMediaURL(message).toLowerCase();

        if (type.includes("image") || /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url)) {
            return "image";
        }

        if (type.includes("video") || /\.(mp4|webm|mov)(\?|$)/i.test(url)) {
            return "video";
        }

        if (type.includes("audio") || /\.(mp3|wav|ogg|m4a|webm)(\?|$)/i.test(url)) {
            return "audio";
        }

        return type ? "file" : "";
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function setPartnerHeader(user) {
        const name = getDisplayName(user);
        const avatar = getAvatar(user);

        if ($("selectedName")) {
            $("selectedName").textContent = name;
        }

        if ($("selectedAvatar")) {
            $("selectedAvatar").src = avatar;
            $("selectedAvatar").alt = name;
            $("selectedAvatar").onerror = function () {
                this.onerror = null;
                this.src = "/static/images/default-avatar.png";
            };
        }

        if ($("selectedStatus")) {
            $("selectedStatus").textContent = "Chat on UtaNexa";
        }

        if ($("onlineDot")) {
            $("onlineDot").classList.remove("is-online");
            $("onlineDot").title = "Online status unavailable";
        }
    }

    function renderMessage(message) {
        const mine = isMine(message);
        const row = makeElement(
            "article",
            "message " + (mine ? "outgoing" : "incoming")
        );

        row.dataset.messageId = String(message.id ?? "");
        row.dataset.media = getMediaURL(message) ? "true" : "false";

        const bubble = makeElement("div", "message-bubble");

        if (message.is_deleted) {
            bubble.appendChild(
                makeElement("p", "deleted-message", "This message was deleted.")
            );
        } else {
            const mediaURL = getMediaURL(message);
            const mediaType = getMediaType(message);

            if (mediaURL) {
                if (mediaType === "image") {
                    const image = makeElement("img", "message-image");
                    image.src = mediaURL;
                    image.alt = "Shared image";
                    image.loading = "lazy";
                    image.addEventListener("click", () => openImage(mediaURL));
                    image.onerror = () => {
                        image.alt = "Image could not be loaded";
                    };
                    bubble.appendChild(image);
                } else if (mediaType === "video") {
                    const video = makeElement("video", "message-video");
                    video.src = mediaURL;
                    video.controls = true;
                    video.preload = "metadata";
                    bubble.appendChild(video);
                } else if (mediaType === "audio") {
                    const audio = makeElement("audio", "message-audio");
                    audio.src = mediaURL;
                    audio.controls = true;
                    bubble.appendChild(audio);
                } else {
                    const link = makeElement(
                        "a",
                        "message-file",
                        "📎 Open attachment"
                    );
                    link.href = mediaURL;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    bubble.appendChild(link);
                }
            }

            const content = getMessageContent(message);

            if (content) {
                const text = makeElement("p", "message-text");
                text.textContent = content;
                bubble.appendChild(text);
            }
        }

        const footer = makeElement("div", "message-meta");
        footer.appendChild(
            makeElement("time", "message-time", formatTime(message.created_at))
        );

        if (mine && !message.is_deleted) {
            footer.appendChild(
                makeElement(
                    "span",
                    "message-receipt",
                    isRead(message) ? "✓✓" : "✓"
                )
            );
        }

        bubble.appendChild(footer);
        row.appendChild(bubble);

        if (mine && message.id && !message.is_deleted) {
            row.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                if (confirm("Delete this message?")) {
                    deleteMessage(message.id);
                }
            });

            let pressTimer;
            row.addEventListener("touchstart", () => {
                pressTimer = setTimeout(() => {
                    if (confirm("Delete this message?")) {
                        deleteMessage(message.id);
                    }
                }, 850);
            }, { passive: true });

            ["touchend", "touchmove", "touchcancel"].forEach((eventName) => {
                row.addEventListener(eventName, () => clearTimeout(pressTimer), {
                    passive: true
                });
            });
        }

        if (searchTerm) {
            const searchable = (
                getMessageContent(message) + " " + getMediaURL(message)
            ).toLowerCase();

            if (!searchable.includes(searchTerm.toLowerCase())) {
                row.hidden = true;
            }
        }

        if (mediaOnly && !getMediaURL(message)) {
            row.hidden = true;
        }

        return row;
    }

    function renderMessages(forceScroll = false) {
        const container = $("conversation");
        if (!container) return;

        const parent = $("messages");
        const nearBottom = parent
            ? parent.scrollHeight - parent.scrollTop - parent.clientHeight < 140
            : true;

        container.replaceChildren();

        const visibleMessages = messages.filter((message) => {
            if (message.is_deleted && !getMessageContent(message)) {
                return true;
            }
            return true;
        });

        let previousDate = "";

        visibleMessages.forEach((message) => {
            const dateLabel = formatDateLabel(message.created_at);

            if (dateLabel && dateLabel !== previousDate) {
                container.appendChild(
                    makeElement("div", "message-date-divider", dateLabel)
                );
                previousDate = dateLabel;
            }

            container.appendChild(renderMessage(message));
        });

        const hasMessages = messages.length > 0;

        if ($("emptyConversation")) {
            $("emptyConversation").hidden = hasMessages;
        }

        if (parent && (forceScroll || nearBottom)) {
            parent.scrollTop = parent.scrollHeight;
        }
    }

    function getMessageSignature(list) {
        return list.map((message) => [
            message.id,
            message.is_read,
            message.read,
            message.is_deleted,
            message.content,
            message.media_url
        ].join(":")).join("|");
    }

    async function loadMessages({ initial = false } = {}) {
        if (!partnerId || isLoading) return;

        isLoading = true;

        try {
            const data = await request(
                `${API}/chat/${encodeURIComponent(partnerId)}`
            );

            const list = Array.isArray(data)
                ? data
                : (data.messages || data.items || []);

            const signature = getMessageSignature(list);

            if (signature !== lastMessageSignature || initial) {
                messages = list;
                lastMessageSignature = signature;
                renderMessages(initial);
            } else {
                messages = list;
            }

            if (initial) {
                await markRead();
            }
        } catch (error) {
            console.error("Load messages:", error);
            if (initial) {
                showToast(error.message || "Chat load nahi ho paya.");
            }
        } finally {
            isLoading = false;
        }
    }

    async function markRead() {
        if (!partnerId) return;

        try {
            await request(
                `${API}/chat/${encodeURIComponent(partnerId)}/read`,
                { method: "POST" }
            );
        } catch (error) {
            // Some backend versions mark messages read during history loading.
            console.debug("Read receipt endpoint:", error.message);
        }
    }

    async function sendPayload(payload) {
        if (!partnerId || isSending) return false;

        isSending = true;
        if ($("sendButton")) $("sendButton").disabled = true;

        try {
            const data = await request(`${API}/chat/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiver_id: partnerId,
                    recipient_id: partnerId,
                    ...payload
                })
            });

            if (data.message && typeof data.message === "object") {
                messages.push(data.message);
            }

            await loadMessages();
            renderMessages(true);
            return true;
        } catch (error) {
            console.error("Send message:", error);
            showToast(error.message || "Message send nahi hua.");
            return false;
        } finally {
            isSending = false;
            if ($("sendButton")) $("sendButton").disabled = false;
        }
    }

    async function sendTextMessage() {
        const input = $("messageInput");
        if (!input) return;

        const content = input.value.trim();
        if (!content) return;

        input.value = "";
        resizeTextarea();

        const sent = await sendPayload({ content });

        if (!sent && !input.value) {
            // Restore the draft if sending fails.
            input.value = content;
            resizeTextarea();
        }
    }

    async function deleteMessage(messageId) {
        try {
            await request(
                `${API}/chat/message/${encodeURIComponent(messageId)}/delete`,
                { method: "POST" }
            );

            showToast("Message deleted.");
            await loadMessages();
        } catch (error) {
            showToast(error.message || "Message delete nahi hua.");
        }
    }

    async function loadProfile() {
        if (!partnerId) return;

        try {
            const data = await request(
                `${API}/profile/${encodeURIComponent(partnerId)}`
            );

            partner = data.user || data.profile || data;
            setPartnerHeader(partner);
        } catch (error) {
            console.debug("Profile fallback:", error.message);
            setPartnerHeader({ user_id: partnerId, name: "UtaNexa User" });
        }
    }

    async function loadCurrentUser() {
        const data = await request(`${API}/auth/me`);
        currentUser = data.user || data.current_user || data;
        return currentUser;
    }

    function resizeTextarea() {
        const input = $("messageInput");
        if (!input) return;

        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
    }

    function openProfile() {
        if (!partnerId) return;

        window.location.href =
            `/profile?user_id=${encodeURIComponent(partnerId)}`;
    }

    function openImage(url) {
        const viewer = $("imageViewer");
        const image = $("viewerImage");

        if (!viewer || !image) return;

        image.src = url;
        viewer.hidden = false;
        document.body.classList.add("viewer-open");
    }

    function closeImage() {
        if ($("imageViewer")) $("imageViewer").hidden = true;
        if ($("viewerImage")) $("viewerImage").src = "";
        document.body.classList.remove("viewer-open");
    }

    function showModal(id) {
        const modal = $(id);
        if (modal) modal.hidden = false;
    }

    function hideModal(id) {
        const modal = $(id);
        if (modal) modal.hidden = true;
    }

    function addEmojiPicker() {
        const existing = $("emojiPicker");
        if (existing) {
            existing.remove();
            return;
        }

        const picker = makeElement("div", "emoji-picker");
        picker.id = "emojiPicker";

        emojiList.forEach((emoji) => {
            const button = makeElement("button", "emoji-option", emoji);
            button.type = "button";
            button.addEventListener("click", () => {
                const input = $("messageInput");
                if (!input) return;

                const start = input.selectionStart ?? input.value.length;
                const end = input.selectionEnd ?? input.value.length;

                input.value =
                    input.value.slice(0, start) +
                    emoji +
                    input.value.slice(end);

                input.focus();
                input.setSelectionRange(
                    start + emoji.length,
                    start + emoji.length
                );

                resizeTextarea();
            });

            picker.appendChild(button);
        });

        const composer = $("composer");
        if (composer) composer.insertAdjacentElement("beforebegin", picker);
    }

    function dataURLFromBlob(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("File read nahi ho payi."));
            reader.readAsDataURL(blob);
        });
    }

    async function prepareImage(file) {
        if (!file.type.startsWith("image/") || file.size < 700000) {
            return file;
        }

        try {
            const imageURL = URL.createObjectURL(file);

            const image = new Image();
            image.src = imageURL;

            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            const maxSide = 1600;
            const ratio = Math.min(
                1,
                maxSide / Math.max(image.width, image.height)
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * ratio);
            canvas.height = Math.round(image.height * ratio);

            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(imageURL);

            const compressed = await new Promise((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.78);
            });

            return compressed || file;
        } catch (error) {
            console.debug("Image compression skipped:", error);
            return file;
        }
    }

    async function sendFile(file) {
        if (!file) return;

        const maxBytes = 8 * 1024 * 1024;

        if (file.size > maxBytes) {
            showToast("File 8 MB se chhoti honi chahiye.");
            return;
        }

        try {
            showToast("Attachment prepare ho raha hai…");

            const preparedFile = await prepareImage(file);
            const dataURL = await dataURLFromBlob(preparedFile);

            let mediaType = "file";
            if (preparedFile.type.startsWith("image/")) mediaType = "image";
            else if (preparedFile.type.startsWith("video/")) mediaType = "video";
            else if (preparedFile.type.startsWith("audio/")) mediaType = "audio";

            const success = await sendPayload({
                content: "",
                media_url: dataURL,
                media_type: mediaType,
                file_name: file.name || "attachment"
            });

            if (success) showToast("Attachment sent.");
        } catch (error) {
            console.error("Attachment:", error);
            showToast(
                "Attachment send nahi hua. Server par media upload support check karein."
            );
        }
    }

    function formatRecordingTime(milliseconds) {
        const total = Math.floor(milliseconds / 1000);
        const minutes = String(Math.floor(total / 60)).padStart(2, "0");
        const seconds = String(total % 60).padStart(2, "0");
        return `${minutes}:${seconds}`;
    }

    async function startRecording() {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            showToast("Is browser mein voice recording supported nahi hai.");
            return;
        }

        try {
            recordingStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            recordedChunks = [];
            recorder = new MediaRecorder(recordingStream);

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                recordedBlob = new Blob(recordedChunks, {
                    type: recorder?.mimeType || "audio/webm"
                });

                if ($("audioPreview")) {
                    $("audioPreview").replaceChildren();

                    const audio = makeElement("audio", "recorded-audio-preview");
                    audio.controls = true;
                    audio.src = URL.createObjectURL(recordedBlob);

                    $("audioPreview").appendChild(audio);
                    $("audioPreview").hidden = false;
                }

                if ($("sendRecordingButton")) {
                    $("sendRecordingButton").disabled = false;
                }
            };

            recorder.start();
            recordingStartedAt = Date.now();

            if ($("recordingStatus")) $("recordingStatus").hidden = false;
            if ($("sendRecordingButton")) $("sendRecordingButton").disabled = true;

            recordingTimer = setInterval(() => {
                if ($("recordingTime")) {
                    $("recordingTime").textContent =
                        formatRecordingTime(Date.now() - recordingStartedAt);
                }
            }, 500);

            if ($("micButton")) $("micButton").classList.add("recording");
        } catch (error) {
            console.error("Microphone:", error);
            showToast("Microphone permission allow karein.");
            stopRecordingStream();
        }
    }

    function stopRecordingStream() {
        if (recordingTimer) clearInterval(recordingTimer);
        recordingTimer = null;

        if (recordingStream) {
            recordingStream.getTracks().forEach((track) => track.stop());
        }

        recordingStream = null;

        if ($("micButton")) $("micButton").classList.remove("recording");
    }

    function stopRecording() {
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }

        stopRecordingStream();

        if ($("recordingStatus")) $("recordingStatus").hidden = true;
    }

    function cancelRecording() {
        if (recorder && recorder.state !== "inactive") {
            recorder.ondataavailable = null;
            recorder.onstop = null;
            recorder.stop();
        }

        stopRecordingStream();
        recordedBlob = null;
        recordedChunks = [];

        if ($("recordingStatus")) $("recordingStatus").hidden = true;
        if ($("audioPreview")) {
            $("audioPreview").hidden = true;
            $("audioPreview").replaceChildren();
        }

        showToast("Recording cancelled.");
    }

    async function sendRecording() {
        if (!recordedBlob) {
            showToast("Pehle voice record karein.");
            return;
        }

        try {
            const dataURL = await dataURLFromBlob(recordedBlob);

            const sent = await sendPayload({
                content: "",
                media_url: dataURL,
                media_type: "audio"
            });

            if (sent) {
                recordedBlob = null;
                recordedChunks = [];

                if ($("audioPreview")) {
                    $("audioPreview").hidden = true;
                    $("audioPreview").replaceChildren();
                }

                showToast("Voice message sent.");
            }
        } catch (error) {
            showToast("Voice message send nahi hua.");
        }
    }

    function runSearch() {
        searchTerm = ($("chatSearch")?.value || "").trim();
        renderMessages();
    }

    function openSearch() {
        mediaOnly = false;

        const section = $("chatSearchSection");
        if (section) section.hidden = false;

        $("chatSearch")?.focus();
        runSearch();
        hideModal("conversationMenuModal");
    }

    function closeSearch() {
        searchTerm = "";

        if ($("chatSearch")) $("chatSearch").value = "";
        if ($("chatSearchSection")) $("chatSearchSection").hidden = true;

        renderMessages();
    }

    function viewMedia() {
        mediaOnly = true;
        searchTerm = "";

        if ($("chatSearch")) $("chatSearch").value = "";
        if ($("chatSearchSection")) $("chatSearchSection").hidden = true;

        renderMessages();
        hideModal("conversationMenuModal");

        const count = messages.filter((message) => getMediaURL(message)).length;
        showToast(count ? `${count} attachment(s) in this chat.` : "No shared media yet.");
    }

    function openCoupleChat() {
        if (!partnerId) return;

        window.location.href =
            `/couple-chat?partner_id=${encodeURIComponent(partnerId)}`;
    }

    function bindEvents() {
        $("backButton")?.addEventListener("click", () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "/home";
            }
        });

        $("profileNameButton")?.addEventListener("click", openProfile);

        $("selectedAvatarButton")?.addEventListener("click", () => {
            openImage(getAvatar(partner || {}));
        });

        $("composer")?.addEventListener("submit", (event) => {
            event.preventDefault();
            sendTextMessage();
        });

        $("messageInput")?.addEventListener("input", resizeTextarea);

        $("messageInput")?.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendTextMessage();
            }
        });

        $("emojiButton")?.addEventListener("click", addEmojiPicker);

        $("attachButton")?.addEventListener("click", () => {
            $("fileInput")?.click();
        });

        $("cameraButton")?.addEventListener("click", () => {
            $("cameraInput")?.click();
        });

        $("fileInput")?.addEventListener("change", async (event) => {
            const file = event.target.files?.[0];
            if (file) await sendFile(file);
            event.target.value = "";
        });

        $("cameraInput")?.addEventListener("change", async (event) => {
            const file = event.target.files?.[0];
            if (file) await sendFile(file);
            event.target.value = "";
        });

        $("micButton")?.addEventListener("click", () => {
            if (recorder && recorder.state === "recording") {
                stopRecording();
            } else {
                startRecording();
            }
        });

        $("cancelRecordingButton")?.addEventListener("click", cancelRecording);
        $("sendRecordingButton")?.addEventListener("click", sendRecording);

        $("voiceCallButton")?.addEventListener("click", () => {
            showModal("callOptionsModal");
        });

        $("closeCallOptions")?.addEventListener("click", () => {
            hideModal("callOptionsModal");
        });

        $("startVoiceCall")?.addEventListener("click", () => {
            hideModal("callOptionsModal");
            showToast("Voice call ke liye server-side WebRTC signaling abhi required hai.");
        });

        $("startVideoCall")?.addEventListener("click", () => {
            hideModal("callOptionsModal");
            showToast("Video call ke liye server-side WebRTC signaling abhi required hai.");
        });

        $("conversationMenu")?.addEventListener("click", () => {
            showModal("conversationMenuModal");
        });

        $("closeConversationMenu")?.addEventListener("click", () => {
            hideModal("conversationMenuModal");
        });

        $("menuSearchMessages")?.addEventListener("click", openSearch);

        $("closeChatSearch")?.addEventListener("click", closeSearch);
        $("chatSearch")?.addEventListener("input", runSearch);

        $("menuViewMedia")?.addEventListener("click", viewMedia);

        $("menuClearChat")?.addEventListener("click", () => {
            hideModal("conversationMenuModal");
            showToast("Clear chat ke liye backend endpoint required hai. Messages delete nahi kiye gaye.");
        });

        $("menuViewProfile")?.addEventListener("click", () => {
            hideModal("conversationMenuModal");
            openProfile();
        });

        $("closeImageViewer")?.addEventListener("click", closeImage);

        $("imageViewer")?.addEventListener("click", (event) => {
            if (event.target === $("imageViewer")) closeImage();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeImage();
                hideModal("callOptionsModal");
                hideModal("conversationMenuModal");
                const picker = $("emojiPicker");
                if (picker) picker.remove();
            }
        });

        // Couple Chat stays a separate page; this is only a navigation link.
        const menu = $("conversationMenuModal")?.querySelector(".options-modal");
        if (menu && !$("openCoupleChat")) {
            const button = makeElement("button", "", "💗 Open Couple Chat");
            button.id = "openCoupleChat";
            button.type = "button";
            button.addEventListener("click", () => {
                hideModal("conversationMenuModal");
                openCoupleChat();
            });
            menu.appendChild(button);
        }

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                loadMessages();
                markRead();
            }
        });
    }

    async function init() {
        bindEvents();

        partnerId = getPartnerIdFromURL();

        if (!partnerId) {
            showToast("Chat open karne ke liye user ID missing hai.");
            if ($("selectedStatus")) $("selectedStatus").textContent = "User not selected";
            return;
        }

        try {
            await loadCurrentUser();
        } catch (error) {
            console.error("Authentication:", error);
            showToast("Login session nahi mila. Please log in again.");
            setTimeout(() => {
                window.location.href = "/login";
            }, 1200);
            return;
        }

        await loadProfile();
        await loadMessages({ initial: true });

        clearInterval(pollTimer);
        pollTimer = setInterval(() => {
            if (!document.hidden) loadMessages();
        }, POLL_INTERVAL);
    }

    document.addEventListener("DOMContentLoaded", init);
})();
