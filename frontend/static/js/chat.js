/* =========================================================
   USANEX — CHAT PAGE
   Fast + Real-time-like Chat
   ========================================================= */

"use strict";

/* =========================================================
   STATE
========================================================= */

const chatState = {
    currentUser: null,
    selectedUser: null,
    selectedUserId: null,
    messages: [],
    sending: false,
    loading: false,
    refreshTimer: null,
    lastMessageId: 0,
    typingTimer: null
};


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", initChatPage);


/* =========================================================
   INIT
========================================================= */

async function initChatPage() {

    setupBackButton();
    setupComposer();
    setupEmoji();
    setupAttachment();
    setupCamera();
    setupHeaderButtons();
    setupNavigation();

    await loadCurrentUser();

    const userId = getUserIdFromURL();

    if (!userId) {
        showEmptyConversation();
        return;
    }

    chatState.selectedUserId = userId;

    await loadChat(userId);

    startFastRefresh();
}


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function getUserIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("user_id") ||
        params.get("id") ||
        ""
    );
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getAvatar(photo) {

    return photo ||
        "/static/images/default-profile.png";
}


/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    credentials: "include",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        if (response.status === 401) {

            window.location.href =
                "/login";

            return false;
        }

        if (!response.ok) {
            return false;
        }

        const data =
            await response.json();

        if (data?.user) {

            chatState.currentUser =
                data.user;

        }

        return true;

    } catch (error) {

        console.error(
            "Current user error:",
            error
        );

        return false;
    }
}


/* =========================================================
   LOAD CHAT
========================================================= */

async function loadChat(userId) {

    if (chatState.loading) {
        return;
    }

    chatState.loading = true;

    try {

        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(userId)}`,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        if (response.status === 401) {

            stopFastRefresh();

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            const error =
                await response
                    .json()
                    .catch(() => null);

            throw new Error(
                error?.detail ||
                "Chat could not be loaded."
            );
        }

        const data =
            await response.json();

        chatState.currentUser =
            data.current_user ||
            chatState.currentUser;

        chatState.selectedUser =
            data.user ||
            null;

        chatState.messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];

        updateChatHeader(
            chatState.selectedUser
        );

        renderMessages();

    } catch (error) {

        console.error(
            "Load chat error:",
            error
        );

        showChatError(
            error.message
        );

    } finally {

        chatState.loading = false;
    }
}


/* =========================================================
   FAST REFRESH
========================================================= */

function startFastRefresh() {

    stopFastRefresh();

    /*
     * 2.5 second refresh.
     *
     * Ye full page reload nahi karta.
     * Sirf chat API se latest messages leta hai.
     */

    chatState.refreshTimer =
        setInterval(
            async () => {

                if (
                    !chatState.selectedUserId ||
                    chatState.sending
                ) {
                    return;
                }

                await refreshMessages();

            },
            2500
        );
}


function stopFastRefresh() {

    if (chatState.refreshTimer) {

        clearInterval(
            chatState.refreshTimer
        );

        chatState.refreshTimer = null;
    }
}


/* =========================================================
   REFRESH MESSAGES
========================================================= */

async function refreshMessages() {

    const userId =
        chatState.selectedUserId;

    if (!userId) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(userId)}`,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        const newMessages =
            Array.isArray(data.messages)
                ? data.messages
                : [];

        /*
         * Sirf tab DOM update karenge
         * jab messages actually change hue hain.
         */

        if (
            messagesChanged(
                chatState.messages,
                newMessages
            )
        ) {

            chatState.messages =
                newMessages;

            renderMessages();
        }

    } catch (error) {

        console.debug(
            "Background refresh:",
            error
        );
    }
}


/* =========================================================
   MESSAGE CHANGE CHECK
========================================================= */

function messagesChanged(
    oldMessages,
    newMessages
) {

    if (
        oldMessages.length !==
        newMessages.length
    ) {
        return true;
    }

    if (!oldMessages.length) {
        return false;
    }

    const oldLast =
        oldMessages[
            oldMessages.length - 1
        ];

    const newLast =
        newMessages[
            newMessages.length - 1
        ];

    if (
        String(oldLast?.id) !==
        String(newLast?.id)
    ) {
        return true;
    }

    /*
     * Read status change detect.
     */

    for (
        let i = 0;
        i < newMessages.length;
        i++
    ) {

        if (
            Boolean(
                oldMessages[i]?.read
            ) !==
            Boolean(
                newMessages[i]?.read
            )
        ) {

            return true;
        }
    }

    return false;
}


/* =========================================================
   HEADER
========================================================= */

function updateChatHeader(user) {

    if (!user) {
        return;
    }

    const avatar =
        $("selectedAvatar");

    const name =
        $("selectedName");

    const status =
        $("selectedStatus");

    const photo =
        user.profile_photo ||
        user.avatar ||
        user.photo ||
        "";

    const userName =
        user.name ||
        user.full_name ||
        user.username ||
        "Usanex User";

    if (avatar) {

        avatar.src =
            getAvatar(photo);

        avatar.alt =
            userName;
    }

    if (name) {

        name.textContent =
            userName;
    }

    if (status) {

        status.textContent =
            user.online
                ? "Online"
                : "Usanex";
    }
}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages() {

    const container =
        $("messages");

    if (!container) {
        return;
    }

    /*
     * Save scroll position.
     */

    const wasNearBottom =
        isNearBottom(container);

    container.innerHTML = "";

    if (
        chatState.messages.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-chat">
                <div class="empty-chat-icon">💬</div>

                <strong>
                    Start a conversation
                </strong>

                <span>
                    Send a message to start chatting.
                </span>
            </div>
        `;

        return;
    }

    let lastDate = "";

    chatState.messages.forEach(
        message => {

            const date =
                formatDate(
                    message.created_at
                );

            if (
                date !== lastDate
            ) {

                const day =
                    document.createElement(
                        "div"
                    );

                day.className =
                    "day-label";

                day.textContent =
                    date;

                container.appendChild(
                    day
                );

                lastDate = date;
            }

            container.appendChild(
                createMessageBubble(
                    message
                )
            );
        }
    );

    /*
     * New message aaye to bottom.
     * User purane messages dekh raha ho
     * to uski position disturb nahi hogi.
     */

    if (wasNearBottom) {
        scrollMessages();
    }
}


/* =========================================================
   MESSAGE BUBBLE
========================================================= */

function createMessageBubble(message) {

    const wrapper =
        document.createElement(
            "div"
        );

    const senderId =
        String(
            message.sender_id ?? ""
        );

    const currentId =
        String(
            chatState.currentUser?.id ??
            ""
        );

    const isMine =
        senderId === currentId;

    wrapper.className =
        isMine
            ? "message-row mine"
            : "message-row received";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    /*
     * IMAGE
     */

    if (
        message.media_url &&
        message.media_type === "image"
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            message.media_url;

        image.loading =
            "lazy";

        image.className =
            "chat-image";

        image.alt =
            "Image";

        image.addEventListener(
            "click",
            () => {

                window.open(
                    message.media_url,
                    "_blank"
                );

            }
        );

        bubble.appendChild(
            image
        );
    }

    /*
     * TEXT
     */

    const content =
        message.content ??
        message.message ??
        "";

    if (content) {

        const text =
            document.createElement(
                "div"
            );

        text.className =
            "message-text";

        text.textContent =
            content;

        bubble.appendChild(
            text
        );
    }

    /*
     * TIME
     */

    const meta =
        document.createElement(
            "div"
        );

    meta.className =
        "message-meta";

    meta.textContent =
        formatTime(
            message.created_at
        );

    /*
     * READ TICKS
     */

    if (isMine) {

        const ticks =
            document.createElement(
                "span"
            );

        ticks.className =
            "message-ticks";

        ticks.textContent =
            message.read
                ? " ✓✓"
                : " ✓";

        meta.appendChild(
            ticks
        );
    }

    bubble.appendChild(
        meta
    );

    wrapper.appendChild(
        bubble
    );

    return wrapper;
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (chatState.sending) {
        return;
    }

    const input =
        $("messageInput");

    if (!input) {
        return;
    }

    const content =
        input.value.trim();

    if (!content) {
        return;
    }

    const receiverId =
        chatState.selectedUserId;

    if (!receiverId) {

        alert(
            "Please select a chat first."
        );

        return;
    }

    chatState.sending = true;

    const sendButton =
        $("sendButton");

    if (sendButton) {
        sendButton.disabled = true;
    }

    /*
     * IMPORTANT:
     * chat.py FormData expect karta hai.
     */

    const formData =
        new FormData();

    formData.append(
        "receiver_id",
        receiverId
    );

    formData.append(
        "content",
        content
    );

    /*
     * Instant UI.
     *
     * User ko message turant dikhega.
     */

    const optimisticMessage = {

        id:
            "temp-" +
            Date.now(),

        sender_id:
            chatState.currentUser?.id,

        receiver_id:
            receiverId,

        content:
            content,

        message:
            content,

        media_url:
            null,

        media_type:
            null,

        read:
            false,

        created_at:
            new Date().toISOString(),

        optimistic:
            true
    };

    chatState.messages.push(
        optimisticMessage
    );

    input.value = "";

    renderMessages();

    scrollMessages();

    try {

        const response =
            await fetch(
                "/api/chat/send",
                {
                    method: "POST",
                    credentials: "include",
                    body: formData
                }
            );

        if (response.status === 401) {

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => null);

            /*
             * Optimistic message remove.
             */

            chatState.messages =
                chatState.messages.filter(
                    message =>
                        message.id !==
                        optimisticMessage.id
                );

            renderMessages();

            throw new Error(
                errorData?.detail ||
                "Message could not be sent."
            );
        }

        const data =
            await response.json();

        /*
         * Server message mil gaya.
         */

        if (data?.message) {

            const index =
                chatState.messages.findIndex(
                    message =>
                        message.id ===
                        optimisticMessage.id
                );

            if (index !== -1) {

                chatState.messages[
                    index
                ] = data.message;

            } else {

                chatState.messages.push(
                    data.message
                );
            }

            renderMessages();

            scrollMessages();
        }

        input.focus();

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        alert(
            error.message ||
            "Unable to send message."
        );

    } finally {

        chatState.sending = false;

        if (sendButton) {
            sendButton.disabled = false;
        }
    }
}


/* =========================================================
   COMPOSER
========================================================= */

function setupComposer() {

    const composer =
        $("composer");

    const input =
        $("messageInput");

    if (composer) {

        composer.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                sendMessage();
            }
        );
    }

    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );

        input.addEventListener(
            "input",
            handleTyping
        );
    }
}


/* =========================================================
   TYPING
========================================================= */

function handleTyping() {

    clearTimeout(
        chatState.typingTimer
    );

    chatState.typingTimer =
        setTimeout(
            () => {},
            1000
        );
}


/* =========================================================
   EMOJI
========================================================= */

function setupEmoji() {

    const button =
        $("emojiButton");

    const input =
        $("messageInput");

    if (!button || !input) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            input.value +=
                "😊";

            input.focus();
        }
    );
}


/* =========================================================
   ATTACHMENT
========================================================= */

function setupAttachment() {

    const button =
        $("attachButton");

    const fileInput =
        $("fileInput");

    if (!button || !fileInput) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            fileInput.accept =
                "image/*";

            fileInput.removeAttribute(
                "capture"
            );

            fileInput.click();
        }
    );

    fileInput.addEventListener(
        "change",
        async () => {

            if (
                !fileInput.files ||
                !fileInput.files.length
            ) {
                return;
            }

            await sendImage(
                fileInput.files[0]
            );

            fileInput.value = "";
        }
    );
}


/* =========================================================
   CAMERA
========================================================= */

function setupCamera() {

    const button =
        $("cameraButton");

    const fileInput =
        $("fileInput");

    if (!button || !fileInput) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            fileInput.accept =
                "image/*";

            fileInput.setAttribute(
                "capture",
                "environment"
            );

            fileInput.click();
        }
    );
}


/* =========================================================
   SEND IMAGE
========================================================= */

async function sendImage(file) {

    if (
        !file ||
        !chatState.selectedUserId
    ) {
        return;
    }

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Only image files are allowed."
        );

        return;
    }

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        alert(
            "Image must be 10 MB or smaller."
        );

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "receiver_id",
        chatState.selectedUserId
    );

    formData.append(
        "content",
        ""
    );

    formData.append(
        "file",
        file
    );

    try {

        const response =
            await fetch(
                "/api/chat/send",
                {
                    method: "POST",
                    credentials: "include",
                    body: formData
                }
            );

        if (response.status === 401) {

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            const error =
                await response
                    .json()
                    .catch(() => null);

            throw new Error(
                error?.detail ||
                "Image could not be sent."
            );
        }

        const data =
            await response.json();

        if (data?.message) {

            chatState.messages.push(
                data.message
            );

            renderMessages();

            scrollMessages();
        }

    } catch (error) {

        console.error(
            "Image send error:",
            error
        );

        alert(
            error.message ||
            "Unable to send image."
        );
    }
}


/* =========================================================
   HEADER BUTTONS
========================================================= */

function setupHeaderButtons() {

    const menu =
        $("conversationMenu");

    if (menu) {

        menu.addEventListener(
            "click",
            showConversationMenu
        );
    }

    const video =
        $("videoCallButton");

    if (video) {

        video.addEventListener(
            "click",
            () => {

                alert(
                    "Video call will be available soon."
                );
            }
        );
    }

    const voice =
        $("voiceCallButton");

    if (voice) {

        voice.addEventListener(
            "click",
            () => {

                alert(
                    "Voice call will be available soon."
                );
            }
        );
    }

    const avatar =
        $("selectedAvatarButton");

    if (avatar) {

        avatar.addEventListener(
            "click",
            () => {

                if (
                    chatState.selectedUserId
                ) {

                    window.location.href =
                        "/profile?user_id=" +
                        encodeURIComponent(
                            chatState.selectedUserId
                        );
                }
            }
        );
    }
}


/* =========================================================
   MENU
========================================================= */

function showConversationMenu() {

    const oldMenu =
        document.querySelector(
            ".chat-popup-menu"
        );

    if (oldMenu) {
        oldMenu.remove();
        return;
    }

    const menu =
        document.createElement(
            "div"
        );

    menu.className =
        "chat-popup-menu";

    menu.innerHTML = `
        <button type="button">
            Search messages
        </button>

        <button type="button">
            Media
        </button>

        <button type="button">
            Clear chat
        </button>

        <button type="button">
            Block
        </button>

        <button type="button">
            Cancel
        </button>
    `;

    document.body.appendChild(
        menu
    );

    const cancel =
        menu.querySelector(
            "button:last-child"
        );

    cancel?.addEventListener(
        "click",
        () => menu.remove()
    );

    setTimeout(
        () => {

            document.addEventListener(
                "click",
                function closeMenu(event) {

                    if (
                        !menu.contains(
                            event.target
                        )
                    ) {

                        menu.remove();

                        document.removeEventListener(
                            "click",
                            closeMenu
                        );
                    }
                }
            );
        },
        0
    );
}


/* =========================================================
   BACK BUTTON
========================================================= */

function setupBackButton() {

    const button =
        $("backButton");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            stopFastRefresh();

            window.location.href =
                "/home";
        }
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".bottom-nav button[data-page]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        stopFastRefresh();

                        const page =
                            button.dataset.page;

                        if (page) {

                            window.location.href =
                                page;
                        }
                    }
                );
            }
        );
}


/* =========================================================
   EMPTY CHAT
========================================================= */

function showEmptyConversation() {

    const name =
        $("selectedName");

    const status =
        $("selectedStatus");

    if (name) {
        name.textContent =
            "Select a chat";
    }

    if (status) {
        status.textContent =
            "Usanex";
    }

    const messages =
        $("messages");

    if (messages) {

        messages.innerHTML = `
            <div class="empty-chat">
                <div class="empty-chat-icon">
                    💬
                </div>

                <strong>
                    Select a person to chat
                </strong>

                <span>
                    Open a connected user's card from Home.
                </span>
            </div>
        `;
    }
}


/* =========================================================
   ERROR
========================================================= */

function showChatError(message) {

    const container =
        $("messages");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-chat">
            <div class="empty-chat-icon">
                ⚠️
            </div>

            <strong>
                Chat unavailable
            </strong>

            <span>
                ${escapeHtml(
                    message ||
                    "Something went wrong."
                )}
            </span>
        </div>
    `;
}


/* =========================================================
   TIME
========================================================= */

function formatTime(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

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
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "Today";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Today";
    }

    const today =
        new Date();

    if (
        date.toDateString() ===
        today.toDateString()
    ) {
        return "Today";
    }

    return date.toLocaleDateString(
        [],
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   SCROLL
========================================================= */

function scrollMessages() {

    const container =
        $("messages");

    if (!container) {
        return;
    }

    requestAnimationFrame(
        () => {

            container.scrollTop =
                container.scrollHeight;
        }
    );
}


function isNearBottom(container) {

    return (
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight
    ) < 120;
}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopFastRefresh();
    }
);


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Usanex Fast Chat JS loaded."
);
