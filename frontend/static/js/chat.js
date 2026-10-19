
/* =========================================================
   UTANEXA — NORMAL CHAT
   Header DP + Profile + Messages + Attachments
   Existing backend API integration
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
    let isLoading = false;
    let isSending = false;
    let pollTimer = null;
    let toastTimer = null;
    let searchTerm = "";
    let mediaOnly = false;
    let recorder = null;
    let recordingStream = null;
    let recordedChunks = [];
    let recordedBlob = null;
    let recordingTimer = null;
    let recordingStartedAt = 0;

    const DEFAULT_AVATAR = "/static/images/default-avatar.png";

    const EMOJIS = [
        "😀","😂","🥰","😍","😘","😊","😭","🥹","😎",
        "❤️","🩷","💖","💕","💞","💘","🔥","✨","🌹",
        "👍","🙏","🤝","🫶","🎉","🌙","☀️","😔","🤗"
    ];

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            ...options,
            headers: { ...(options.headers || {}) }
        });

        const contentType = response.headers.get("content-type") || "";
        let data = {};

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data.message = await response.text();
        }

        if (!response.ok) {
            throw new Error(
                data.detail || data.message || `Request failed (${response.status})`
            );
        }

        return data;
    }

    function toast(message) {
        const element = $("chatToast");
        if (!element) {
            console.log("[UtaNexa]", message);
            return;
        }

        element.textContent = message;
        element.classList.add("show");
        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.classList.remove("show");
        }, 2800);
    }

    function partnerIdFromURL() {
        const params = new URLSearchParams(location.search);

        return (
            params.get("user_id") ||
            params.get("partner_id") ||
            params.get("receiver_id") ||
            params.get("id") ||
            ""
        ).trim();
    }

    function userId(user) {
        return String(
            user?.user_id ??
            user?.id ??
            user?.uid ??
            ""
        );
    }

    function displayName(user) {
        return (
            user?.name ||
            user?.full_name ||
            user?.username ||
            user?.user_id ||
            "UtaNexa User"
        );
    }

    // Supports common profile field names and nested profile responses.
    function getAvatar(user) {
        const objects = [
            user,
            user?.user,
            user?.profile,
            user?.data,
            user?.data?.user,
            user?.data?.profile
        ].filter(Boolean);

        const keys = [
            "profile_picture",
            "profile_picture_url",
            "profile_pic",
            "profile_pic_url",
            "profile_image",
            "profile_image_url",
            "profile_photo",
            "profile_photo_url",
            "avatar_url",
            "photo_url",
            "image_url",
            "avatar",
            "photo",
            "image",
            "dp"
        ];

        for (const object of objects) {
            for (const key of keys) {
                const value = object[key];

                if (typeof value === "string" && value.trim()) {
                    const url = value.trim();

                    if (
                        /^(https?:\/\/|data:image\/|blob:|\/)/i.test(url)
                    ) {
                        return url;
                    }

                    return "/" + url.replace(/^\.?\//, "");
                }
            }
        }

        return "";
    }

    function setHeaderPhoto(url, name) {
        const image = $("selectedAvatar");
        if (!image) return;

        // Keep the real URL available for the enlarged photo view.
        image.dataset.realPhoto = url || "";
        image.alt = name || "Profile photo";

        image.onerror = function () {
            console.error("Header DP failed to load:", this.src);

            this.onerror = null;
            this.src = DEFAULT_AVATAR;
            this.dataset.realPhoto = "";
        };

        image.src = url || DEFAULT_AVATAR;
    }

    function setPartnerHeader(user) {
        const name = displayName(user);
        const photo = getAvatar(user);

        if ($("selectedName")) {
            $("selectedName").textContent = name;
        }

        setHeaderPhoto(photo, name);

        if ($("selectedStatus")) {
            $("selectedStatus").textContent = "Chat on UtaNexa";
        }

        if ($("onlineDot")) {
            $("onlineDot").classList.remove("is-online");
            $("onlineDot").title = "Online status unavailable";
        }
    }

    async function loadCurrentUser() {
        const data = await api(`${API}/auth/me`);
        currentUser = data.user || data.current_user || data;
    }

    async function loadProfile() {
        if (!partnerId) return;

        try {
            const data = await api(
                `${API}/profile/${encodeURIComponent(partnerId)}`
            );

            // Prefer the object that actually contains a photo URL.
            const candidates = [
                data?.user,
                data?.profile,
                data?.data?.user,
                data?.data?.profile,
                data?.data,
                data
            ].filter(Boolean);

            partner =
                candidates.find((item) => getAvatar(item)) ||
                candidates[0] ||
                { user_id: partnerId };

            setPartnerHeader(partner);
        } catch (error) {
            console.error("Profile API failed:", error);
            setPartnerHeader({ user_id: partnerId });
            toast("Partner profile load nahi hui.");
        }
    }

    function messageId(message) {
        return message?.id ?? message?.message_id ?? "";
    }

    function messageText(message) {
        return String(message?.content ?? message?.message ?? message?.text ?? "");
    }

    function mediaURL(message) {
        const value =
            message?.media_url ||
            message?.file_url ||
            message?.attachment_url ||
            message?.image_url ||
            "";

        if (typeof value === "string" && value.trim()) {
            const url = value.trim();

            if (/^(https?:\/\/|data:|blob:|\/)/i.test(url)) {
                return url;
            }

            return "/" + url.replace(/^\.?\//, "");
        }

        const content = messageText(message).trim();
        return /^data:image\//i.test(content) ? content : "";
    }

    function mediaType(message, url) {
        const type = String(message?.media_type || "").toLowerCase();

        if (type.includes("image") || /^data:image\//i.test(url) ||
            /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url)) {
            return "image";
        }

        if (type.includes("video") || /\.(mp4|webm|mov)(\?|$)/i.test(url)) {
            return "video";
        }

        if (type.includes("audio") || /\.(mp3|wav|ogg|m4a|webm)(\?|$)/i.test(url)) {
            return "audio";
        }

        return url ? "file" : "";
    }

    function mine(message) {
        return String(message?.sender_id) === userId(currentUser);
    }

    function timeLabel(value) {
        if (!value) return "";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function dateLabel(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString([], {
            day: "numeric",
            month: "short"
        });
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function openImage(url) {
        if (!url) {
            toast("Profile photo available nahi hai.");
            return;
        }

        const modal = $("imageViewer");
        const image = $("viewerImage");

        if (!modal || !image) return;

        image.onerror = () => toast("Image load nahi ho paayi.");
        image.src = url;
        modal.hidden = false;
        document.body.classList.add("viewer-open");
    }

    function closeImage() {
        if ($("imageViewer")) $("imageViewer").hidden = true;
        if ($("viewerImage")) $("viewerImage").src = "";
        document.body.classList.remove("viewer-open");
    }

    function renderOneMessage(message) {
        const outgoing = mine(message);
        const row = el(
            "article",
            "message " + (outgoing ? "outgoing" : "incoming")
        );

        row.dataset.messageId = String(messageId(message));
        const bubble = el("div", "message-bubble");

        if (message.is_deleted) {
            bubble.appendChild(
                el("p", "deleted-message", "This message was deleted.")
            );
        } else {
            const url = mediaURL(message);
            const type = mediaType(message, url);

            if (url && type === "image") {
                const image = el("img", "message-image");
                image.src = url;
                image.alt = "Shared image";
                image.loading = "lazy";
                image.addEventListener("click", () => openImage(url));
                image.onerror = () => {
                    image.alt = "Image could not be loaded";
                    console.error("Message image failed:", url);
                };
                bubble.appendChild(image);
            } else if (url && type === "video") {
                const video = el("video", "message-video");
                video.src = url;
                video.controls = true;
                video.preload = "metadata";
                bubble.appendChild(video);
            } else if (url && type === "audio") {
                const audio = el("audio", "message-audio");
                audio.src = url;
                audio.controls = true;
                bubble.appendChild(audio);
            } else if (url) {
                const link = el("a", "message-file", "📎 Open attachment");
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                bubble.appendChild(link);
            }

            const content = messageText(message);
            if (content && !(url === content && /^data:image\//i.test(content))) {
                bubble.appendChild(el("p", "message-text", content));
            }
        }

        const meta = el("div", "message-meta");
        meta.appendChild(el("time", "message-time", timeLabel(message.created_at)));

        if (outgoing && !message.is_deleted) {
            const read = Boolean(message.is_read || message.read || message.seen);
            meta.appendChild(el("span", "message-receipt", read ? "✓✓" : "✓"));
        }

        bubble.appendChild(meta);
        row.appendChild(bubble);

        if (outgoing && messageId(message) && !message.is_deleted) {
            row.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                if (confirm("Delete this message?")) deleteMessage(messageId(message));
            });
        }

        if (searchTerm) {
            const searchable = (
                messageText(message) + " " + urlForSearch(message)
            ).toLowerCase();

            row.hidden = !searchable.includes(searchTerm.toLowerCase());
        }

        if (mediaOnly && !mediaURL(message)) row.hidden = true;

        return row;
    }

    function urlForSearch(message) {
        return String(
            message?.media_url ||
            message?.file_url ||
            message?.attachment_url ||
            ""
        );
    }

    function renderMessages(scrollToBottom = false) {
        const container = $("conversation");
        if (!container) return;

        const area = $("messages");
        const nearBottom = area
            ? area.scrollHeight - area.scrollTop - area.clientHeight < 140
            : true;

        container.replaceChildren();

        let lastDate = "";

        messages.forEach((message) => {
            const currentDate = dateLabel(message.created_at);

            if (currentDate && currentDate !== lastDate) {
                container.appendChild(
                    el("div", "message-date-divider", currentDate)
                );
                lastDate = currentDate;
            }

            container.appendChild(renderOneMessage(message));
        });

        if ($("emptyConversation")) {
            $("emptyConversation").hidden = messages.length > 0;
        }

        if (area && (scrollToBottom || nearBottom)) {
            area.scrollTop = area.scrollHeight;
        }
    }

    function signature(list) {
        return JSON.stringify(list.map((item) => [
            messageId(item),
            item.content,
            item.media_url,
            item.is_read,
            item.is_deleted
        ]));
    }

    async function loadMessages({ initial = false } = {}) {
        if (!partnerId || isLoading) return;

        isLoading = true;

        try {
            const data = await api(
                `${API}/chat/${encodeURIComponent(partnerId)}`
            );

            const list = Array.isArray(data)
                ? data
                : (data.messages || data.items || []);

            const oldSignature = signature(messages);
            const newSignature = signature(list);

            messages = list;

            if (initial || oldSignature !== newSignature) {
                renderMessages(initial);
            }

            if (initial) await markRead();
        } catch (error) {
            console.error("Messages API failed:", error);
            if (initial) toast("Messages load nahi ho paaye.");
        } finally {
            isLoading = false;
        }
    }

    async function markRead() {
        try {
            await api(
                `${API}/chat/${encodeURIComponent(partnerId)}/read`,
                { method: "POST" }
            );
        } catch (error) {
            console.debug("Read receipt:", error.message);
        }
    }

    async function sendPayload(payload) {
        if (isSending || !partnerId) return false;

        isSending = true;
        if ($("sendButton")) $("sendButton").disabled = true;

        try {
            await api(`${API}/chat/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiver_id: partnerId,
                    recipient_id: partnerId,
                    ...payload
                })
            });

            await loadMessages();
            renderMessages(true);
            return true;
        } catch (error) {
            console.error("Send API failed:", error);
            toast(error.message || "Message send nahi hua.");
            return false;
        } finally {
            isSending = false;
            if ($("sendButton")) $("sendButton").disabled = false;
        }
    }

    async function sendText() {
        const input = $("messageInput");
        if (!input) return;

        const content = input.value.trim();
        if (!content) return;

        const success = await sendPayload({ content });

        if (success) {
            input.value = "";
            resizeInput();
        }
    }

    async function deleteMessage(id) {
        try {
            await api(
                `${API}/chat/message/${encodeURIComponent(id)}/delete`,
                { method: "POST" }
            );
            toast("Message deleted.");
            await loadMessages();
        } catch (error) {
            toast(error.message || "Message delete nahi hua.");
        }
    }

    function resizeInput() {
        const input = $("messageInput");
        if (!input) return;

        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
    }

    function openProfile() {
        if (partnerId) {
            location.href = `/profile?user_id=${encodeURIComponent(partnerId)}`;
        }
    }

    function showModal(id) {
        if ($(id)) $(id).hidden = false;
    }

    function hideModal(id) {
        if ($(id)) $(id).hidden = true;
    }

    function addEmojiPicker() {
        $("emojiPicker")?.remove();

        const picker = el("div", "emoji-picker");
        picker.id = "emojiPicker";

        EMOJIS.forEach((emoji) => {
            const button = el("button", "emoji-option", emoji);
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
                input.setSelectionRange(start + emoji.length, start + emoji.length);
                resizeInput();
            });

            picker.appendChild(button);
        });

        $("composer")?.insertAdjacentElement("beforebegin", picker);
    }

    function dataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("File read nahi hui."));
            reader.readAsDataURL(blob);
        });
    }

    async function sendFile(file) {
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            toast("File 8 MB se chhoti honi chahiye.");
            return;
        }

        try {
            const url = await dataURL(file);
            let type = "file";

            if (file.type.startsWith("image/")) type = "image";
            else if (file.type.startsWith("video/")) type = "video";
            else if (file.type.startsWith("audio/")) type = "audio";

            await sendPayload({
                content: "",
                media_url: url,
                media_type: type,
                file_name: file.name || "attachment"
            });
        } catch (error) {
            toast("Attachment prepare nahi ho paaya.");
        }
    }

    async function startRecording() {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            toast("Voice recording is browser mein supported nahi hai.");
            return;
        }

        try {
            recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordedChunks = [];
            recorder = new MediaRecorder(recordingStream);

            recorder.ondataavailable = (event) => {
                if (event.data?.size) recordedChunks.push(event.data);
            };

            recorder.onstop = () => {
                recordedBlob = new Blob(recordedChunks, {
                    type: recorder?.mimeType || "audio/webm"
                });

                if ($("audioPreview")) {
                    $("audioPreview").replaceChildren();

                    const audio = el("audio", "recorded-audio-preview");
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
                const elapsed = Math.floor((Date.now() - recordingStartedAt) / 1000);
                const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
                const seconds = String(elapsed % 60).padStart(2, "0");

                if ($("recordingTime")) {
                    $("recordingTime").textContent = `${minutes}:${seconds}`;
                }
            }, 500);

            $("micButton")?.classList.add("recording");
        } catch (error) {
            console.error("Microphone error:", error);
            toast("Microphone permission allow karein.");
            stopRecordingTracks();
        }
    }

    function stopRecordingTracks() {
        clearInterval(recordingTimer);
        recordingTimer = null;

        recordingStream?.getTracks().forEach((track) => track.stop());
        recordingStream = null;

        $("micButton")?.classList.remove("recording");
    }

    function stopRecording() {
        if (recorder && recorder.state !== "inactive") recorder.stop();
        stopRecordingTracks();

        if ($("recordingStatus")) $("recordingStatus").hidden = true;
    }

    function cancelRecording() {
        if (recorder && recorder.state !== "inactive") {
            recorder.onstop = null;
            recorder.stop();
        }

        stopRecordingTracks();
        recordedBlob = null;
        recordedChunks = [];

        if ($("recordingStatus")) $("recordingStatus").hidden = true;
        if ($("audioPreview")) {
            $("audioPreview").hidden = true;
            $("audioPreview").replaceChildren();
        }

        toast("Recording cancelled.");
    }

    async function sendRecording() {
        if (!recordedBlob) {
            toast("Pehle voice record karein.");
            return;
        }

        try {
            const url = await dataURL(recordedBlob);

            const success = await sendPayload({
                content: "",
                media_url: url,
                media_type: "audio"
            });

            if (success) {
                recordedBlob = null;
                recordedChunks = [];

                if ($("audioPreview")) {
                    $("audioPreview").hidden = true;
                    $("audioPreview").replaceChildren();
                }

                toast("Voice message sent.");
            }
        } catch (error) {
            toast("Voice message send nahi hua.");
        }
    }

    function searchMessages() {
        searchTerm = ($("chatSearch")?.value || "").trim();
        renderMessages();
    }

    function bindEvents() {
        $("backButton")?.addEventListener("click", () => {
            if (history.length > 1) history.back();
            else location.href = "/home";
        });

        $("profileNameButton")?.addEventListener("click", openProfile);

        $("selectedAvatarButton")?.addEventListener("click", () => {
            const image = $("selectedAvatar");
            openImage(image?.dataset.realPhoto || "");
        });

        $("composer")?.addEventListener("submit", (event) => {
            event.preventDefault();
            sendText();
        });

        $("messageInput")?.addEventListener("input", resizeInput);

        $("messageInput")?.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendText();
            }
        });

        $("emojiButton")?.addEventListener("click", addEmojiPicker);

        $("attachButton")?.addEventListener("click", () => $("fileInput")?.click());
        $("cameraButton")?.addEventListener("click", () => $("cameraInput")?.click());

        $("fileInput")?.addEventListener("change", async (event) => {
            if (event.target.files?.[0]) await sendFile(event.target.files[0]);
            event.target.value = "";
        });

        $("cameraInput")?.addEventListener("change", async (event) => {
            if (event.target.files?.[0]) await sendFile(event.target.files[0]);
            event.target.value = "";
        });

        $("micButton")?.addEventListener("click", () => {
            if (recorder?.state === "recording") stopRecording();
            else startRecording();
        });

        $("cancelRecordingButton")?.addEventListener("click", cancelRecording);
        $("sendRecordingButton")?.addEventListener("click", sendRecording);

        $("voiceCallButton")?.addEventListener("click", () => showModal("callOptionsModal"));
        $("closeCallOptions")?.addEventListener("click", () => hideModal("callOptionsModal"));

        $("startVoiceCall")?.addEventListener("click", () => {
            hideModal("callOptionsModal");
            toast("Voice calling ke liye WebRTC signaling backend required hai.");
        });

        $("startVideoCall")?.addEventListener("click", () => {
            hideModal("callOptionsModal");
            toast("Video calling ke liye WebRTC signaling backend required hai.");
        });

        $("conversationMenu")?.addEventListener("click", () => {
            showModal("conversationMenuModal");
        });

        $("closeConversationMenu")?.addEventListener("click", () => {
            hideModal("conversationMenuModal");
        });

        $("menuSearchMessages")?.addEventListener("click", () => {
            mediaOnly = false;
            if ($("chatSearchSection")) $("chatSearchSection").hidden = false;
            $("chatSearch")?.focus();
            hideModal("conversationMenuModal");
        });

        $("closeChatSearch")?.addEventListener("click", () => {
            searchTerm = "";
            if ($("chatSearch")) $("chatSearch").value = "";
            if ($("chatSearchSection")) $("chatSearchSection").hidden = true;
            renderMessages();
        });

        $("chatSearch")?.addEventListener("input", searchMessages);

        $("menuViewMedia")?.addEventListener("click", () => {
            mediaOnly = true;
            searchTerm = "";
            hideModal("conversationMenuModal");
            renderMessages();

            const count = messages.filter((message) => mediaURL(message)).length;
            toast(count ? `${count} attachment(s) in chat.` : "No shared media yet.");
        });

        $("menuClearChat")?.addEventListener("click", () => {
            hideModal("conversationMenuModal");
            toast("Clear chat ke liye backend endpoint chahiye.");
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
                $("emojiPicker")?.remove();
            }
        });

        const menu = $("conversationMenuModal")?.querySelector(".options-modal");

        if (menu && !$("openCoupleChat")) {
            const button = el("button", "", "💗 Open Couple Chat");
            button.id = "openCoupleChat";
            button.type = "button";

            button.addEventListener("click", () => {
                if (!partnerId) return;

                location.href =
                    `/couple-chat?partner_id=${encodeURIComponent(partnerId)}`;
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
        partnerId = partnerIdFromURL();

        if (!partnerId) {
            toast("Chat URL mein partner user_id nahi mili.");
            return;
        }

        try {
            await loadCurrentUser();
        } catch (error) {
            console.error("Login session:", error);
            toast("Login session nahi mila. Dobara login karein.");

            setTimeout(() => {
                location.href = "/login";
            }, 1000);

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
