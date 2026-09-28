/* =========================================================
   USANEX — CHAT PAGE
   frontend/static/js/chat.js
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

    typingTimer: null,

    search: "",

    filter: "all"

};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initChatPage();

    }
);


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

    setupSearch();

    setupFilters();

    await loadCurrentUser();


    const userId =
        getUserIdFromURL();


    if (userId) {

        chatState.selectedUserId =
            userId;


        await loadSelectedUser(
            userId
        );


        await loadMessages(
            userId
        );

    } else {

        showEmptyConversation();

    }

}


/* =========================================================
   BASIC HELPER
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


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return safeText(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   AVATAR
========================================================= */

function getAvatar(photo) {

    return photo ||
        "/static/images/default-profile.png";

}


/* =========================================================
   USER ID FROM URL
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

            return;

        }


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        if (data?.user) {

            chatState.currentUser =
                data.user;

        }

    } catch (error) {

        console.error(
            "Current user error:",
            error
        );

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

        const response =
            await fetch(
                `/api/profile/${encodeURIComponent(userId)}`,
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
                "User profile unavailable"
            );

        }


        const data =
            await response.json();


        const user =
            data?.user ||
            data?.profile ||
            data;


        if (!user) {

            throw new Error(
                "User not found"
            );

        }


        chatState.selectedUser =
            user;


        updateChatHeader(
            user
        );


    } catch (error) {

        console.error(
            "Selected user error:",
            error
        );


        /*
         * Profile endpoint fail होने पर
         * basic header दिखाएँगे.
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
   HEADER LOADING
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


/* =========================================================
   UPDATE HEADER
========================================================= */

function updateChatHeader(
    user
) {

    const avatar =
        $("selectedAvatar");


    const name =
        $("selectedName");


    const status =
        $("selectedStatus");


    const photo =
        user?.profile_photo ||
        user?.avatar ||
        user?.photo ||
        "";


    const userName =
        user?.name ||
        user?.full_name ||
        user?.username ||
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


/* =========================================================
   USER STATUS
========================================================= */

function getUserStatus(
    user
) {

    if (
        user?.online === true ||
        user?.is_online === true
    ) {

        return "Online";

    }


    if (
        user?.last_seen ||
        user?.last_seen_at
    ) {

        return formatLastSeen(
            user.last_seen ||
            user.last_seen_at
        );

    }


    return "Usanex";

}


/* =========================================================
   LAST SEEN
========================================================= */

function formatLastSeen(
    value
) {

    if (!value) {

        return "Usanex";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Usanex";

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
    userId
) {

    const container =
        $("messages");


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="messages-loading">
            Loading messages...
        </div>

    `;


    try {

        /*
         * IMPORTANT:
         *
         * Backend:
         *
         * GET /api/chat/{user_id}
         *
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

            const errorData =
                await response
                    .json()
                    .catch(
                        () => null
                    );


            throw new Error(
                errorData?.detail ||
                "Messages unavailable"
            );

        }


        const data =
            await response.json();


        chatState.messages =
            Array.isArray(
                data?.messages
            )
                ? data.messages
                : [];


        /*
         * Backend current user
         */

        if (data?.current_user) {

            chatState.currentUser =
                data.current_user;

        }


        /*
         * Backend chat user
         */

        if (data?.user) {

            chatState.selectedUser =
                data.user;

            updateChatHeader(
                data.user
            );

        }


        renderMessages();


        /*
         * Mark read
         */

        await markChatRead(
            userId,
            false
        );


    } catch (error) {

        console.error(
            "Load messages error:",
            error
        );


        container.innerHTML = `

            <div class="empty-chat">

                <div class="empty-chat-icon">
                    ⚠️
                </div>

                <strong>
                    Unable to load chat
                </strong>

                <span>
                    ${escapeHtml(
                        error.message ||
                        "Please try again."
                    )}
                </span>

            </div>

        `;

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


    scrollMessages();

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
        senderId &&
        currentId &&
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


    /* =====================================================
       IMAGE
    ===================================================== */

    if (message.media_url) {

        const imageWrap =
            document.createElement(
                "div"
            );


        imageWrap.className =
            "message-image-wrap";


        const image =
            document.createElement(
                "img"
            );


        image.className =
            "message-image";


        image.src =
            message.media_url;


        image.alt =
            "Photo";


        image.loading =
            "lazy";


        image.decoding =
            "async";


        /*
         * Original HD image server पर
         * वैसे ही रहेगी.
         *
         * CSS केवल display size control करेगा.
         */

        image.addEventListener(
            "click",
            () => {

                openFullImage(
                    message.media_url
                );

            }
        );


        imageWrap.appendChild(
            image
        );


        bubble.appendChild(
            imageWrap
        );

    }


    /* =====================================================
       TEXT
    ===================================================== */

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


    /* =====================================================
       META
    ===================================================== */

    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "message-meta";


    const time =
        document.createElement(
            "span"
        );


    time.textContent =
        formatTime(
            message.created_at
        );


    meta.appendChild(
        time
    );


    /* =====================================================
       READ TICKS
    ===================================================== */

    if (isMine) {

        const ticks =
            document.createElement(
                "span"
            );


        ticks.className =
            "message-ticks";


        ticks.textContent =
            message.read ||
            message.is_read
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
   OPEN FULL IMAGE
========================================================= */

function openFullImage(
    imageUrl
) {

    if (!imageUrl) {

        return;

    }


    /*
     * Existing overlay remove
     */

    const oldOverlay =
        document.querySelector(
            ".full-image-overlay"
        );


    if (oldOverlay) {

        oldOverlay.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "full-image-overlay";


    const closeButton =
        document.createElement(
            "button"
        );


    closeButton.className =
        "full-image-close";


    closeButton.type =
        "button";


    closeButton.innerHTML =
        "×";


    const image =
        document.createElement(
            "img"
        );


    image.className =
        "full-image-view";


    image.src =
        imageUrl;


    image.alt =
        "Full size photo";


    image.decoding =
        "async";


    image.loading =
        "eager";


    overlay.appendChild(
        closeButton
    );


    overlay.appendChild(
        image
    );


    document.body.appendChild(
        overlay
    );


    closeButton.addEventListener(
        "click",
        () => {

            overlay.remove();

        }
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                overlay.remove();

            }

        }
    );


    const escapeHandler =
        event => {

            if (
                event.key === "Escape"
            ) {

                overlay.remove();

                document.removeEventListener(
                    "keydown",
                    escapeHandler
                );

            }

        };


    document.addEventListener(
        "keydown",
        escapeHandler
    );

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


    const message =
        input.value.trim();


    const fileInput =
        $("fileInput");


    const file =
        fileInput?.files?.length
            ? fileInput.files[0]
            : null;


    /*
     * Text और photo दोनों खाली हैं
     */

    if (
        !message &&
        !file
    ) {

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


    chatState.sending =
        true;


    const sendButton =
        $("sendButton");


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    try {

        /*
         * Backend /api/chat/send
         *
         * FormData:
         * receiver_id
         * content
         * file
         */

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


        if (file) {

            formData.append(
                "file",
                file
            );

        }


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


        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(
                        () => null
                    );


            throw new Error(
                errorData?.detail ||
                "Message could not be sent."
            );

        }


        const data =
            await response.json();


        if (data?.message) {

            chatState.messages.push(
                data.message
            );

        }


        /*
         * Clear input
         */

        input.value = "";


        if (fileInput) {

            fileInput.value = "";

        }


        renderMessages();


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

        chatState.sending =
            false;


        if (sendButton) {

            sendButton.disabled =
                false;

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
            () => {

                handleTyping();

            }
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
            () => {

                /*
                 * Future WebSocket typing system.
                 */

            },
            1200
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


    if (
        !button ||
        !input
    ) {

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


    if (
        !button ||
        !fileInput
    ) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            /*
             * Gallery
             */

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
        () => {

            if (
                !fileInput.files ||
                !fileInput.files.length
            ) {

                return;

            }


            const file =
                fileInput.files[0];


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Only image files are allowed."
                );


                fileInput.value = "";

                return;

            }


            /*
             * 10 MB backend limit
             */

            const maxSize =
                10 * 1024 * 1024;


            if (
                file.size > maxSize
            ) {

                alert(
                    "Image must be 10 MB or smaller."
                );


                fileInput.value = "";

                return;

            }


            /*
             * Image selected.
             * Message send button se send होगी.
             */

            console.log(
                "Image selected:",
                file.name,
                file.size
            );

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

            /*
             * Mobile camera
             */

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
   HEADER BUTTONS
========================================================= */

function setupHeaderButtons() {

    const menu =
        $("conversationMenu");


    if (menu) {

        menu.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                showConversationMenu();

            }
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
   CONVERSATION MENU
========================================================= */

function showConversationMenu() {

    const oldMenu =
        document.querySelector(
            ".chat-popup-menu"
        );


    if (oldMenu) {

        oldMenu.remove();

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

            const closeMenu =
                event => {

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

                };


            document.addEventListener(
                "click",
                closeMenu
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
   MARK CHAT READ
========================================================= */

async function markChatRead(
    userId,
    showError = false
) {

    if (!userId) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(userId)}/read`,
                {
                    method: "POST",

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


        if (
            !response.ok &&
            showError
        ) {

            console.warn(
                "Unable to mark chat as read."
            );

        }

    } catch (error) {

        console.error(
            "Mark read error:",
            error
        );

    }

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

function formatTime(
    value
) {

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

function formatDate(
    value
) {

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


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Usanex Chat JS loaded successfully."
);
