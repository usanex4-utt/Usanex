/* =========================================================
   USANEX — CHAT JS
   HD IMAGE + FAST CHAT
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

    refreshTimer: null

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

    await loadCurrentUser();

    const userId =
        getUserIdFromURL();

    if (!userId) {

        showEmptyConversation();

        return;

    }

    chatState.selectedUserId =
        userId;

    await loadChat();

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
   URL USER ID
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

            return false;

        }


        const data =
            await response.json();


        if (data?.user) {

            chatState.currentUser =
                data.user;

            return true;

        }

    } catch (error) {

        console.error(
            "Current user error:",
            error
        );

    }

    return false;

}


/* =========================================================
   LOAD COMPLETE CHAT
========================================================= */

async function loadChat() {

    if (
        !chatState.selectedUserId
    ) {

        return;

    }


    setHeaderLoading();


    try {

        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(
                    chatState.selectedUserId
                )}`,
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
                "Unable to load chat."
            );

        }


        const data =
            await response.json();


        if (data.user) {

            chatState.selectedUser =
                data.user;

            updateChatHeader(
                data.user
            );

        }


        chatState.messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        renderMessages();

    } catch (error) {

        console.error(
            "Load chat error:",
            error
        );


        showChatError(
            error.message
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
        user.profile_photo ||
        user.avatar ||
        user.photo ||
        "";


    const userName =
        user.name ||
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

            if (
                message.is_deleted
            ) {

                return;

            }


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
            message.sender_id || ""
        );


    const currentId =
        String(
            chatState.currentUser?.id ||
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


    /* =====================================================
       IMAGE
    ===================================================== */

    if (
        message.media_url &&
        message.media_type === "image"
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.className =
            "chat-image";


        image.src =
            message.media_url;


        image.alt =
            "Photo";


        image.loading =
            "lazy";


        image.decoding =
            "async";


        image.addEventListener(
            "click",
            () => {

                openFullImage(
                    message.media_url
                );

            }
        );


        bubble.appendChild(
            image
        );

    }


    /* =====================================================
       TEXT
    ===================================================== */

    if (
        message.content ||
        message.message
    ) {

        const text =
            document.createElement(
                "div"
            );


        text.className =
            "message-text";


        text.textContent =
            safeText(
                message.content ||
                message.message
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
   FULL HD IMAGE VIEWER
========================================================= */

function openFullImage(
    imageUrl
) {

    const viewer =
        document.createElement(
            "div"
        );


    viewer.className =
        "usanex-image-viewer";


    viewer.innerHTML = `

        <button
            type="button"
            class="image-viewer-close"
            aria-label="Close"
        >
            ×
        </button>

        <img
            src="${escapeHtml(imageUrl)}"
            alt="HD photo"
        />

    `;


    document.body.appendChild(
        viewer
    );


    const close =
        () => {

            viewer.remove();

        };


    viewer
        .querySelector(
            ".image-viewer-close"
        )
        ?.addEventListener(
            "click",
            close
        );


    viewer.addEventListener(
        "click",
        event => {

            if (
                event.target === viewer
            ) {

                close();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function escapeViewer(event) {

            if (
                event.key === "Escape"
            ) {

                close();

                document.removeEventListener(
                    "keydown",
                    escapeViewer
                );

            }

        }
    );

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
            "Please select a chat first."
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
            await response
                .json()
                .catch(
                    () => null
                );


        if (!response.ok) {

            throw new Error(
                data?.detail ||
                "Message could not be sent."
            );

        }


        if (data?.message) {

            chatState.messages.push(
                data.message
            );

        }


        input.value = "";


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
   SEND HD IMAGE
========================================================= */

async function sendImage(
    file
) {

    if (
        chatState.uploading
    ) {

        return;

    }


    if (
        !chatState.selectedUserId
    ) {

        alert(
            "Please select a chat first."
        );

        return;

    }


    if (
        !file ||
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please select an image."
        );

        return;

    }


    /* -----------------------------------------------------
       25 MB FRONTEND CHECK
    ----------------------------------------------------- */

    const maxSize =
        25 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        alert(
            "Photo must be 25 MB or smaller."
        );

        return;

    }


    chatState.uploading =
        true;


    showUploadStatus(
        "Uploading HD photo..."
    );


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


        /*
         * IMPORTANT:
         *
         * File is appended directly.
         *
         * No resize.
         * No canvas.
         * No compression.
         *
         * Original HD image is preserved.
         */

        formData.append(
            "file",
            file,
            file.name
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
            await response
                .json()
                .catch(
                    () => null
                );


        if (!response.ok) {

            throw new Error(
                data?.detail ||
                "Photo upload failed."
            );

        }


        if (data?.message) {

            chatState.messages.push(
                data.message
            );

        }


        renderMessages();

    } catch (error) {

        console.error(
            "Image upload error:",
            error
        );


        alert(
            error.message ||
            "Unable to upload photo."
        );

    } finally {

        chatState.uploading =
            false;


        hideUploadStatus();

    }

}


/* =========================================================
   UPLOAD STATUS
========================================================= */

function showUploadStatus(
    text
) {

    let status =
        $("chatUploadStatus");


    if (!status) {

        status =
            document.createElement(
                "div"
            );

        status.id =
            "chatUploadStatus";

        status.className =
            "chat-upload-status";

        document.body.appendChild(
            status
        );

    }


    status.textContent =
        text;


    status.style.display =
        "block";

}


function hideUploadStatus() {

    const status =
        $("chatUploadStatus");


    if (status) {

        status.style.display =
            "none";

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

            input.value +=
                "😊";

            input.focus();

        }
    );

}


/* =========================================================
   ATTACHMENT / GALLERY
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

            fileInput.removeAttribute(
                "capture"
            );


            /*
             * Gallery only
             */

            fileInput.accept =
                "image/jpeg,image/png,image/webp,image/gif";


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


            /*
             * Reset input so same
             * photo can be selected again.
             */

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


    const voice =
        $("voiceCallButton");


    if (voice) {

        voice.addEventListener(
            "click",
            () => {

                alert(
                    "Voice calling will be added in the next stage."
                );

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
                    "Video calling will be added in the next stage."
                );

            }
        );

    }

}


/* =========================================================
   MENU
========================================================= */

function showConversationMenu() {

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
   BACK
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
   EMPTY CHAT
========================================================= */

function showEmptyConversation() {

    const name =
        $("selectedName");


    const status =
        $("selectedStatus");


    const messages =
        $("messages");


    if (name) {

        name.textContent =
            "Select a chat";

    }


    if (status) {

        status.textContent =
            "Usanex";

    }


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
   CHAT ERROR
========================================================= */

function showChatError(
    message
) {

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
                Unable to load chat
            </strong>

            <span>
                ${escapeHtml(
                    message ||
                    "Please try again."
                )}
            </span>

            <button
                type="button"
                id="retryChatButton"
            >
                Retry
            </button>

        </div>

    `;


    $("retryChatButton")
        ?.addEventListener(
            "click",
            () => {

                loadChat();

            }
        );

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
    "Usanex HD Chat JS loaded successfully."
);
