/* =========================================================
   USANEX — CHAT JS
   Optimized real-time-feeling chat
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

    uploading: false,

    search: "",

    filter: "all",

    pollingTimer: null,

    pollingBusy: false,

    initialized: false

};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initChatPage
);


/* =========================================================
   INIT
========================================================= */

async function initChatPage() {

    if (chatState.initialized) {
        return;
    }

    chatState.initialized = true;

    setupBackButton();
    setupComposer();
    setupEmoji();
    setupAttachment();
    setupCamera();
    setupHeaderButtons();
    setupNavigation();
    setupSearch();
    setupFilters();

    const loggedIn =
        await loadCurrentUser();

    if (!loggedIn) {
        return;
    }

    const userId =
        getUserIdFromURL();

    if (!userId) {

        showEmptyConversation();

        return;
    }

    chatState.selectedUserId =
        userId;

    await loadSelectedUser(
        userId
    );

    await loadMessages(
        userId,
        true
    );

    startMessagePolling();

}


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function safeText(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    return String(value);
}


function escapeHtml(value) {

    return safeText(value)
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
   GET USER ID
========================================================= */

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


/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return false;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to load current user."
            );
        }

        const data =
            await response.json();

        if (!data?.user) {

            throw new Error(
                "Current user not found."
            );
        }

        chatState.currentUser =
            data.user;

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
   LOAD SELECTED USER
========================================================= */

async function loadSelectedUser(
    userId
) {

    setHeaderLoading();

    try {

        /*
         * We use chat endpoint itself.
         * This avoids depending on /api/profile/{id}.
         */

        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(userId)}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Chat user unavailable."
            );
        }

        const data =
            await response.json();

        if (!data?.user) {

            throw new Error(
                "Chat user not found."
            );
        }

        chatState.selectedUser =
            data.user;

        updateChatHeader(
            data.user
        );

    } catch (error) {

        console.error(
            "Selected user error:",
            error
        );

        /*
         * Header fallback
         */

        chatState.selectedUser = {

            user_id: userId,

            name: "Usanex User",

            username: "",

            profile_photo: "",

            online: false

        };

        updateChatHeader(
            chatState.selectedUser
        );
    }
}


/* =========================================================
   HEADER
========================================================= */

function setHeaderLoading() {

    const name =
        $("selectedName");

    const status =
        $("selectedStatus");

    if (name) {
        name.textContent =
            "Loading...";
    }

    if (status) {
        status.textContent =
            "Connecting...";
    }
}


function updateChatHeader(user) {

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
            getUserStatus(user);
    }
}


function getUserStatus(user) {

    if (
        user.online === true ||
        user.is_online === true
    ) {
        return "Online";
    }

    if (
        user.last_seen ||
        user.last_seen_at
    ) {

        return formatLastSeen(
            user.last_seen ||
            user.last_seen_at
        );
    }

    return "Offline";
}


function formatLastSeen(value) {

    if (!value) {
        return "Offline";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Offline";
    }

    return (
        "last seen " +
        date.toLocaleString(
            [],
            {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }
        )
    );
}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages(
    userId,
    initial = false
) {

    if (chatState.pollingBusy) {
        return;
    }

    chatState.pollingBusy = true;

    try {

        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(userId)}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept":
                            "application/json"
                    },
                    cache: "no-store"
                }
            );

        if (
            response.status === 401
        ) {

            stopMessagePolling();

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to load messages."
            );
        }

        const data =
            await response.json();

        const serverMessages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];

        /*
         * Initial load:
         * directly use server data.
         */

        if (initial) {

            chatState.messages =
                serverMessages;

            renderMessages();

            return;
        }

        /*
         * Polling:
         * Only update UI if something actually changed.
         */

        const changed =
            messagesChanged(
                chatState.messages,
                serverMessages
            );

        if (changed) {

            chatState.messages =
                mergeMessages(
                    chatState.messages,
                    serverMessages
                );

            renderMessages();
        }

    } catch (error) {

        console.error(
            "Load messages error:",
            error
        );

    } finally {

        chatState.pollingBusy =
            false;
    }
}


/* =========================================================
   MESSAGE COMPARISON
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

    if (
        oldMessages.length === 0
    ) {
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
        String(oldLast?.id || "") !==
        String(newLast?.id || "")
    ) {
        return true;
    }

    if (
        Boolean(oldLast?.read) !==
        Boolean(newLast?.read)
    ) {
        return true;
    }

    return false;
}


/* =========================================================
   MERGE MESSAGES
========================================================= */

function mergeMessages(
    localMessages,
    serverMessages
) {

    const map =
        new Map();

    localMessages.forEach(
        message => {

            if (message.id !== undefined) {

                map.set(
                    String(message.id),
                    message
                );
            }

        }
    );

    serverMessages.forEach(
        message => {

            if (message.id !== undefined) {

                map.set(
                    String(message.id),
                    message
                );
            }

        }
    );

    const result =
        Array.from(
            map.values()
        );

    result.sort(
        (a, b) => {

            const first =
                new Date(
                    a.created_at || 0
                ).getTime();

            const second =
                new Date(
                    b.created_at || 0
                ).getTime();

            return first - second;
        }
    );

    return result;
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

    const wasNearBottom =
        isNearBottom(container);

    container.innerHTML = "";

    if (
        chatState.messages.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-chat">

                <div class="empty-chat-icon">
                    💬
                </div>

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

                lastDate =
                    date;
            }

            container.appendChild(
                createMessageBubble(
                    message
                )
            );
        }
    );

    /*
     * Only force bottom when:
     * - initial chat
     * - user already near bottom
     */

    if (wasNearBottom) {
        scrollMessages();
    }
}


/* =========================================================
   MESSAGE BUBBLE
========================================================= */

function createMessageBubble(
    message
) {

    const wrapper =
        document.createElement(
            "div"
        );

    const senderId =
        String(
            message.sender_id ||
            message.sender_user_id ||
            ""
        );

    const currentId =
        String(
            chatState.currentUser?.id ||
            chatState.currentUser?.user_id ||
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

        image.className =
            "message-image";

        image.src =
            message.media_url;

        image.alt =
            "Image";

        image.loading =
            "lazy";

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

    const messageText =
        message.message ||
        message.content ||
        "";

    if (messageText) {

        const text =
            document.createElement(
                "div"
            );

        text.className =
            "message-text";

        text.textContent =
            safeText(
                messageText
            );

        bubble.appendChild(
            text
        );
    }

    /*
     * META
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

    if (isMine) {

        const ticks =
            document.createElement(
                "span"
            );

        ticks.className =
            "message-ticks";

        ticks.textContent =
            message.read
                ? "✓✓"
                : "✓";

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
   SEND TEXT MESSAGE
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

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    if (
        !chatState.selectedUserId
    ) {

        alert(
            "Please select a user first."
        );

        return;
    }

    /*
     * Clear immediately.
     * This makes the UI feel instant.
     */

    input.value = "";

    input.focus();

    chatState.sending = true;

    const temporaryId =
        "temp_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2);

    const optimisticMessage = {

        id: temporaryId,

        sender_id:
            chatState.currentUser?.id,

        receiver_id:
            chatState.selectedUser?.id,

        content:
            message,

        message:
            message,

        media_url:
            null,

        media_type:
            null,

        read:
            false,

        is_read:
            false,

        is_deleted:
            false,

        created_at:
            new Date().toISOString(),

        temporary:
            true
    };

    /*
     * INSTANT UI
     */

    chatState.messages.push(
        optimisticMessage
    );

    renderMessages();

    scrollMessages();

    try {

        const formData =
            new FormData();

        formData.append(
            "receiver_id",
            chatState.selectedUserId
        );

        formData.append(
            "content",
            message
        );

        const response =
            await fetch(
                "/api/chat/send",
                {
                    method: "POST",
                    credentials: "include",
                    body: formData
                }
            );

        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }

        const data =
            await response.json()
                .catch(
                    () => ({})
                );

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                "Message could not be sent."
            );
        }

        /*
         * Remove optimistic message
         */

        chatState.messages =
            chatState.messages.filter(
                item =>
                    item.id !== temporaryId
            );

        /*
         * Add real database message
         */

        if (data?.message) {

            chatState.messages.push(
                data.message
            );
        }

        renderMessages();

        scrollMessages();

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        /*
         * Remove failed optimistic message
         */

        chatState.messages =
            chatState.messages.filter(
                item =>
                    item.id !== temporaryId
            );

        renderMessages();

        alert(
            error.message ||
            "Unable to send message."
        );

        input.value =
            message;

        input.focus();

    } finally {

        chatState.sending =
            false;
    }
}


/* =========================================================
   SEND IMAGE
========================================================= */

async function sendImage(
    file
) {

    if (
        !file ||
        chatState.uploading
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

    const maxSize =
        10 * 1024 * 1024;

    if (
        file.size > maxSize
    ) {

        alert(
            "Image must be 10 MB or smaller."
        );

        return;
    }

    if (
        !chatState.selectedUserId
    ) {
        return;
    }

    chatState.uploading =
        true;

    try {

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

        const response =
            await fetch(
                "/api/chat/send",
                {
                    method: "POST",
                    credentials: "include",
                    body: formData
                }
            );

        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }

        const data =
            await response.json()
                .catch(
                    () => ({})
                );

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                "Image could not be sent."
            );
        }

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

    } finally {

        chatState.uploading =
            false;
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
    }
}


/* =========================================================
   EMOJI
========================================================= */

function setupEmoji() {

    const button =
        $("emojiButton");

    const input =
        $("messageInput");

    if (
        !button ||
        !input
    ) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const emoji =
                "😊";

            const start =
                input.selectionStart;

            const end =
                input.selectionEnd;

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

            input.selectionStart =
                input.selectionEnd =
                    start +
                    emoji.length;
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

    if (
        !button ||
        !fileInput
    ) {
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

            const file =
                fileInput.files?.[0];

            if (!file) {
                return;
            }

            await sendImage(
                file
            );

            fileInput.value =
                "";
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

    if (
        !button ||
        !fileInput
    ) {
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
   POLLING
========================================================= */

function startMessagePolling() {

    stopMessagePolling();

    /*
     * 2.5 seconds.
     *
     * Later we can replace this with
     * WebSocket for true real-time chat.
     */

    chatState.pollingTimer =
        setInterval(
            () => {

                if (
                    chatState.selectedUserId
                ) {

                    loadMessages(
                        chatState.selectedUserId,
                        false
                    );
                }

            },
            2500
        );
}


function stopMessagePolling() {

    if (
        chatState.pollingTimer
    ) {

        clearInterval(
            chatState.pollingTimer
        );

        chatState.pollingTimer =
            null;
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

    const existing =
        document.querySelector(
            ".chat-popup-menu"
        );

    if (existing) {
        existing.remove();
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
        () => {

            menu.remove();

        }
    );

    setTimeout(
        () => {

            document.addEventListener(
                "click",
                function closeMenu(
                    event
                ) {

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

            stopMessagePolling();

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

                        stopMessagePolling();

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
   SEARCH
========================================================= */

function setupSearch() {

    const input =
        $("chatSearch");

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        () => {

            chatState.search =
                input.value.trim();
        }
    );
}


/* =========================================================
   FILTERS
========================================================= */

function setupFilters() {

    document
        .querySelectorAll(
            ".filter"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".filter"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );
                                }
                            );

                        button.classList.add(
                            "active"
                        );

                        chatState.filter =
                            button.dataset.filter ||
                            "all";
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


function isNearBottom(
    container
) {

    const distance =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight;

    return distance < 180;
}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopMessagePolling();

    }
);


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Usanex optimized Chat JS loaded."
);
