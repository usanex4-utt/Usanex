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
    typingTimer: null
};


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initChatPage();
});


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

    await loadCurrentUser();

    const userId = getUserIdFromURL();

    if (!userId) {
        showEmptyConversation();
        return;
    }

    chatState.selectedUserId = userId;

    await loadChat(userId);
}


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function safeText(value, fallback = "") {

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    return String(value);
}


function getAvatar(photo) {

    return photo ||
        "/static/images/default-profile.png";
}


function escapeHtml(value) {

    return safeText(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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

        const response = await fetch(
            "/api/profile/me",
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (response.status === 401) {

            window.location.href = "/login";
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
   LOAD CHAT
========================================================= */

async function loadChat(userId) {

    const container =
        $("messages");

    if (container) {

        container.innerHTML = `
            <div class="messages-loading">
                Loading messages...
            </div>
        `;

    }

    try {

        /*
         * IMPORTANT:
         *
         * Backend:
         * GET /api/chat/{user_id}
         */

        const response = await fetch(
            `/api/chat/${encodeURIComponent(userId)}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        if (response.status === 401) {

            window.location.href = "/login";
            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.detail ||
                "Unable to load chat."
            );

        }


        chatState.selectedUser =
            data.user || null;


        chatState.messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];


        if (chatState.selectedUser) {

            updateChatHeader(
                chatState.selectedUser
            );

        }


        renderMessages();

    } catch (error) {

        console.error(
            "Load chat error:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="empty-chat">
                    <div class="empty-chat-icon">
                        ⚠️
                    </div>

                    <strong>
                        Unable to load chat
                    </strong>

                    <span>
                        ${escapeHtml(error.message)}
                    </span>
                </div>
            `;

        }

    }
}


/* =========================================================
   HEADER
========================================================= */

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
            "Offline";

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


            if (date !== lastDate) {

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

function createMessageBubble(message) {

    const wrapper =
        document.createElement("div");


    const senderId =
        String(
            message.sender_id || ""
        );


    const currentId =
        String(
            chatState.currentUser?.id || ""
        );


    const isMine =
        senderId === currentId;


    wrapper.className =
        isMine
            ? "message-row mine"
            : "message-row received";


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";


    /*
     * IMAGE MESSAGE
     */

    if (
        message.media_url &&
        message.media_type === "image"
    ) {

        const image =
            document.createElement("img");

        image.src =
            message.media_url;

        image.className =
            "chat-image";

        image.alt =
            "Image";

        bubble.appendChild(
            image
        );

    }


    /*
     * TEXT MESSAGE
     */

    if (message.content) {

        const text =
            document.createElement("div");

        text.className =
            "message-text";

        text.textContent =
            message.content;

        bubble.appendChild(
            text
        );

    }


    /*
     * META
     */

    const meta =
        document.createElement("div");

    meta.className =
        "message-meta";

    meta.textContent =
        formatTime(
            message.created_at
        );


    if (isMine) {

        const ticks =
            document.createElement("span");

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


    if (!chatState.selectedUserId) {

        alert(
            "Please select a user first."
        );

        return;
    }


    chatState.sending = true;


    const sendButton =
        $("sendButton");


    if (sendButton) {
        sendButton.disabled = true;
    }


    try {

        /*
         * IMPORTANT:
         *
         * Backend expects:
         *
         * POST /api/chat/send
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
            content
        );


        const fileInput =
            $("fileInput");


        if (
            fileInput &&
            fileInput.files &&
            fileInput.files.length > 0
        ) {

            formData.append(
                "file",
                fileInput.files[0]
            );

        }


        const response =
            await fetch(
                "/api/chat/send",
                {
                    method: "POST",
                    credentials: "include",

                    /*
                     * DO NOT manually set
                     * Content-Type.
                     *
                     * Browser creates multipart/form-data
                     * boundary automatically.
                     */

                    body: formData
                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (response.status === 401) {

            window.location.href =
                "/login";

            return;
        }


        if (!response.ok) {

            throw new Error(
                data?.detail ||
                "Message could not be sent."
            );

        }


        /*
         * Add returned message
         */

        if (data?.message) {

            chatState.messages.push(
                data.message
            );

        }


        /*
         * Clear input
         */

        input.value = "";


        /*
         * Clear selected file
         */

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

        chatState.sending = false;


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

                clearTimeout(
                    chatState.typingTimer
                );

                chatState.typingTimer =
                    setTimeout(
                        () => {},
                        1000
                    );

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


    if (!button || !input) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            input.value += "😊";

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
   HEADER BUTTONS
========================================================= */

function setupHeaderButtons() {

    const voice =
        $("voiceCallButton");


    if (voice) {

        voice.addEventListener(
            "click",
            () => {

                alert(
                    "Voice call feature will be added next."
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
                    "Video call feature will be added next."
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


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Usanex Chat JS loaded — API matched."
);
