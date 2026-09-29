/* =========================================================
   USANEX — CHAT PAGE
   Text + HD Image Messaging
   DIRECT PHOTO SEND VERSION
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

    typingTimer: null,

    search: "",

    filter: "all",

    selectedFile: null

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
   HELPERS
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


        updateChatHeader(user);


    } catch (error) {

        console.error(
            "Selected user error:",
            error
        );


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
   HEADER
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

    const onlineDot =
        $("headerOnlineDot");


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


    if (onlineDot) {

        const online =
            user.online === true ||
            user.is_online === true;

        onlineDot.hidden =
            !online;

    }

}


/* =========================================================
   USER STATUS
========================================================= */

function getUserStatus(
    user
) {

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


/* =========================================================
   LAST SEEN
========================================================= */

function formatLastSeen(
    value
) {

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
                "Messages unavailable"
            );

        }


        const data =
            await response.json();


        chatState.messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        renderMessages();

    } catch (error) {

        console.error(
            "Load messages error:",
            error
        );


        chatState.messages = [];

        renderMessages();

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

    if (
        message.media_url
    ) {

        bubble.classList.add(
            "has-image"
        );


        const image =
            document.createElement(
                "img"
            );


        image.src =
            message.media_url;

        image.alt =
            "Photo";

        image.loading =
            "lazy";

        image.decoding =
            "async";

        image.className =
            "chat-message-image";


        image.addEventListener(
            "click",
            () => {

                openImageViewer(
                    message.media_url
                );

            }
        );


        image.addEventListener(
            "error",
            () => {

                console.error(
                    "Chat image failed to load:",
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

    const messageText =
        message.message ||
        message.content ||
        "";


    if (
        safeText(
            messageText
        ).trim()
    ) {

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
   IMAGE VIEWER
========================================================= */

function openImageViewer(
    url
) {

    const viewer =
        document.createElement(
            "div"
        );


    viewer.style.position =
        "fixed";

    viewer.style.inset =
        "0";

    viewer.style.zIndex =
        "99999";

    viewer.style.background =
        "rgba(0,0,0,0.94)";

    viewer.style.display =
        "flex";

    viewer.style.alignItems =
        "center";

    viewer.style.justifyContent =
        "center";

    viewer.style.padding =
        "20px";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        url;

    image.alt =
        "Photo";


    image.style.maxWidth =
        "100%";

    image.style.maxHeight =
        "100%";

    image.style.objectFit =
        "contain";


    viewer.appendChild(
        image
    );


    viewer.addEventListener(
        "click",
        () => {

            viewer.remove();

        }
    );


    document.body.appendChild(
        viewer
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


    const text =
        input.value.trim();


    const file =
        chatState.selectedFile;


    if (
        !text &&
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

        sendButton.textContent =
            "…";

    }


    try {

        /* =================================================
           FORM DATA
        ================================================= */

        const formData =
            new FormData();


        formData.append(
            "receiver_id",
            chatState.selectedUserId
        );


        formData.append(
            "content",
            text
        );


        /* =================================================
           IMAGE
        ================================================= */

        if (file) {

            const optimizedFile =
                await prepareImageForUpload(
                    file
                );


            formData.append(
                "file",
                optimizedFile,
                optimizedFile.name
            );

        }


        /* =================================================
           BACKEND
        ================================================= */

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
                    () => null
                );


        if (!response.ok) {

            throw new Error(
                data?.detail ||
                "Message could not be sent."
            );

        }


        /* =================================================
           SERVER MESSAGE
        ================================================= */

        if (
            data?.message
        ) {

            chatState.messages.push(
                data.message
            );

        }


        /* =================================================
           CLEAR INPUT + PHOTO
        ================================================= */

        input.value = "";

        clearSelectedFile();

        renderMessages();

        scrollMessages();

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

            sendButton.textContent =
                "➤";

        }

    }

}


/* =========================================================
   IMAGE OPTIMIZATION
========================================================= */

async function prepareImageForUpload(
    file
) {

    /*
     * 2 MB se chhoti photo ko
     * original form me bhejenge.
     */

    if (
        file.size <=
        2 * 1024 * 1024
    ) {

        return file;

    }


    /*
     * Browser image decode.
     */

    let bitmap;


    try {

        bitmap =
            await createImageBitmap(
                file
            );

    } catch (error) {

        console.warn(
            "Image compression unavailable. Sending original.",
            error
        );

        return file;

    }


    const maxWidth =
        1920;

    const maxHeight =
        1920;


    let width =
        bitmap.width;

    let height =
        bitmap.height;


    /* =====================================================
       KEEP ASPECT RATIO
    ===================================================== */

    if (
        width > maxWidth ||
        height > maxHeight
    ) {

        const ratio =
            Math.min(
                maxWidth / width,
                maxHeight / height
            );


        width =
            Math.round(
                width * ratio
            );


        height =
            Math.round(
                height * ratio
            );

    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        width;

    canvas.height =
        height;


    const context =
        canvas.getContext(
            "2d",
            {
                alpha: false
            }
        );


    if (!context) {

        bitmap.close();

        return file;

    }


    context.imageSmoothingEnabled =
        true;

    context.imageSmoothingQuality =
        "high";


    context.drawImage(
        bitmap,
        0,
        0,
        width,
        height
    );


    bitmap.close();


    /* =====================================================
       JPEG
    ===================================================== */

    const blob =
        await new Promise(
            resolve => {

                canvas.toBlob(
                    resolve,
                    "image/jpeg",
                    0.88
                );

            }
        );


    if (!blob) {

        return file;

    }


    /*
     * Agar compressed file original se
     * badi ho gayi to original bhejo.
     */

    if (
        blob.size >= file.size
    ) {

        return file;

    }


    return new File(
        [blob],
        "usanex_" +
            Date.now() +
            ".jpg",
        {
            type:
                "image/jpeg",

            lastModified:
                Date.now()
        }
    );

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
            () => {},
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
   ATTACHMENT — GALLERY
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
             * Gallery mode
             */

            fileInput.accept =
                "image/*";


            fileInput.removeAttribute(
                "capture"
            );


            /*
             * Reset value so same photo
             * can be selected again.
             */

            fileInput.value =
                "";


            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        () => {

            handleSelectedFile(
                fileInput
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
             * Camera mode
             */

            fileInput.accept =
                "image/*";


            fileInput.setAttribute(
                "capture",
                "environment"
            );


            fileInput.value =
                "";


            fileInput.click();

        }
    );

}


/* =========================================================
   SELECTED FILE
   IMPORTANT:
   Photo select hote hi DIRECT SEND
========================================================= */

function handleSelectedFile(
    fileInput
) {

    if (
        !fileInput.files ||
        !fileInput.files.length
    ) {

        return;

    }


    const file =
        fileInput.files[0];


    /* =====================================================
       IMAGE CHECK
    ===================================================== */

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please select an image."
        );


        fileInput.value =
            "";


        return;

    }


    /* =====================================================
       SIZE CHECK
    ===================================================== */

    if (
        file.size >
        25 * 1024 * 1024
    ) {

        alert(
            "Photo must be 25 MB or smaller."
        );


        fileInput.value =
            "";


        return;

    }


    /* =====================================================
       STORE FILE
    ===================================================== */

    chatState.selectedFile =
        file;


    /*
     * IMPORTANT:
     *
     * Preview create nahi hoga.
     *
     * Photo directly send hogi.
     */

    sendMessage();

}


/* =========================================================
   CLEAR FILE
========================================================= */

function clearSelectedFile() {

    chatState.selectedFile =
        null;


    const fileInput =
        $("fileInput");


    if (fileInput) {

        fileInput.value =
            "";

    }


    /*
     * Agar old preview DOM me ho,
     * usko bhi remove kar do.
     */

    const preview =
        $("chatFilePreview");


    if (preview) {

        preview.remove();

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
            () => {

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
   EMPTY CONVERSATION
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
    "Usanex Chat JS loaded — DIRECT IMAGE SEND enabled."
);
