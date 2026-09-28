/* =========================================================
   USANEX — CHAT PAGE
   chat.js
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initChat();
});


/* =========================================================
   GLOBAL STATE
========================================================= */

const ChatState = {
    userId: null,
    currentUser: null,
    chatUser: null,

    selectedFile: null,
    selectedPreviewUrl: null,

    sending: false,
    loading: false,

    messages: [],
};


/* =========================================================
   API
========================================================= */

const API = {
    me: "/api/auth/me",

    chat: (userId) =>
        `/api/chat/${encodeURIComponent(userId)}`,

    send: "/api/chat/send",

    read: (userId) =>
        `/api/chat/${encodeURIComponent(userId)}/read`,
};


/* =========================================================
   DOM
========================================================= */

const DOM = {};


function cacheDOM() {

    DOM.messages =
        document.querySelector("#messages") ||
        document.querySelector(".messages");

    DOM.messageInput =
        document.querySelector("#messageInput");

    DOM.sendButton =
        document.querySelector(".send-button") ||
        document.querySelector("#sendButton");

    DOM.fileInput =
        document.querySelector(
            "#fileInput"
        ) ||
        document.querySelector(
            'input[type="file"]'
        );

    DOM.attachmentButton =
        document.querySelector(
            ".attachment-button"
        ) ||
        document.querySelector(
            "#attachmentButton"
        );

    DOM.cameraButton =
        document.querySelector(
            ".camera-button"
        ) ||
        document.querySelector(
            "#cameraButton"
        );

    DOM.emptyChat =
        document.querySelector(
            ".empty-chat"
        );

    DOM.chatUserName =
        document.querySelector(
            "#chatUserName"
        ) ||
        document.querySelector(
            ".selected-info strong"
        );

    DOM.chatUserUsername =
        document.querySelector(
            "#chatUserUsername"
        ) ||
        document.querySelector(
            ".selected-info span"
        );

    DOM.chatAvatar =
        document.querySelector(
            "#chatAvatar"
        ) ||
        document.querySelector(
            ".selected-avatar-wrap img"
        );

    DOM.typingIndicator =
        document.querySelector(
            ".typing-indicator"
        );
}


/* =========================================================
   INITIALIZE
========================================================= */

async function initChat() {

    cacheDOM();

    setupFileInput();

    setupSendButton();

    setupMessageInput();

    setupBackButton();

    setupAttachmentButton();

    setupCameraButton();

    ChatState.userId =
        getChatUserIdFromURL();

    if (!ChatState.userId) {

        showError(
            "Chat user not found."
        );

        return;
    }

    await checkAuthentication();

    await loadChat();
}


/* =========================================================
   GET CHAT USER ID
========================================================= */

function getChatUserIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    let userId =
        params.get("user_id");

    if (!userId) {
        userId =
            params.get("userId");
    }

    if (!userId) {
        userId =
            params.get("id");
    }

    /*
       Also support:
       /chat/u_abc123
    */

    if (!userId) {

        const parts =
            window.location.pathname
                .split("/")
                .filter(Boolean);

        const last =
            parts[parts.length - 1];

        if (
            last &&
            last !== "chat" &&
            last !== "chat.html"
        ) {
            userId = decodeURIComponent(last);
        }
    }

    /*
       Support localStorage fallback
    */

    if (!userId) {

        const storedUser =
            localStorage.getItem(
                "usanexChatUser"
            );

        if (storedUser) {

            try {

                const parsed =
                    JSON.parse(storedUser);

                userId =
                    parsed.user_id ||
                    parsed.userId ||
                    parsed.id;

            } catch (error) {
                console.warn(
                    "Invalid usanexChatUser",
                    error
                );
            }
        }
    }

    return userId
        ? String(userId)
        : null;
}


/* =========================================================
   AUTH CHECK
========================================================= */

async function checkAuthentication() {

    try {

        const response =
            await fetch(
                API.me,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                }
            );

        if (!response.ok) {

            redirectToLogin();

            return false;
        }

        const data =
            await response.json();

        if (
            !data ||
            !data.success ||
            !data.user
        ) {

            redirectToLogin();

            return false;
        }

        ChatState.currentUser =
            data.user;

        return true;

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

        redirectToLogin();

        return false;
    }
}


/* =========================================================
   LOGIN REDIRECT
========================================================= */

function redirectToLogin() {

    /*
       Do not redirect immediately if
       this is a temporary network failure.
    */

    console.warn(
        "Usanex session is not authenticated."
    );

    window.location.href =
        "/static/login.html";
}


/* =========================================================
   LOAD CHAT
========================================================= */

async function loadChat() {

    if (ChatState.loading) {
        return;
    }

    ChatState.loading = true;

    showLoading();

    try {

        const response =
            await fetch(
                API.chat(
                    ChatState.userId
                ),
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                }
            );

        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;
        }

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load chat."
            );
        }

        if (!data.success) {

            throw new Error(
                "Unable to load chat."
            );
        }

        ChatState.chatUser =
            data.user;

        ChatState.messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];

        updateHeader();

        renderMessages();

        scrollToBottom(
            false
        );

    } catch (error) {

        console.error(
            "Load chat error:",
            error
        );

        showError(
            error.message ||
            "Unable to load chat."
        );

    } finally {

        ChatState.loading = false;
    }
}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    if (!DOM.messages) {
        return;
    }

    DOM.messages.innerHTML = `
        <div class="messages-loading">
            Loading messages...
        </div>
    `;
}


/* =========================================================
   HEADER
========================================================= */

function updateHeader() {

    const user =
        ChatState.chatUser;

    if (!user) {
        return;
    }

    if (DOM.chatUserName) {

        DOM.chatUserName.textContent =
            user.name ||
            user.username ||
            "Usanex User";
    }

    if (DOM.chatUserUsername) {

        DOM.chatUserUsername.textContent =
            user.username ||
            user.user_id ||
            "Usanex";
    }

    if (DOM.chatAvatar) {

        if (user.profile_photo) {

            DOM.chatAvatar.src =
                normalizeMediaURL(
                    user.profile_photo
                );

        } else {

            DOM.chatAvatar.src =
                createAvatarPlaceholder(
                    user.name ||
                    user.username ||
                    "U"
                );
        }

        DOM.chatAvatar.onerror =
            function () {

                this.onerror = null;

                this.src =
                    createAvatarPlaceholder(
                        user.name ||
                        "U"
                    );
            };
    }
}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages() {

    if (!DOM.messages) {
        return;
    }

    DOM.messages.innerHTML = "";

    if (
        !ChatState.messages.length
    ) {

        showEmptyChat();

        return;
    }

    hideEmptyChat();

    const fragment =
        document.createDocumentFragment();

    ChatState.messages.forEach(
        (message) => {

            const row =
                createMessageElement(
                    message
                );

            if (row) {
                fragment.appendChild(row);
            }
        }
    );

    DOM.messages.appendChild(
        fragment
    );
}


/* =========================================================
   EMPTY CHAT
========================================================= */

function showEmptyChat() {

    if (DOM.emptyChat) {

        DOM.emptyChat.style.display =
            "flex";
    }

    if (
        DOM.messages &&
        !DOM.messages.querySelector(
            ".empty-chat"
        )
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-chat";

        empty.innerHTML = `
            <div class="empty-chat-icon">
                💬
            </div>

            <strong>
                Start chatting
            </strong>

            <span>
                Send a message or photo to start your conversation.
            </span>
        `;

        DOM.messages.appendChild(
            empty
        );
    }
}


function hideEmptyChat() {

    if (DOM.emptyChat) {

        DOM.emptyChat.style.display =
            "none";
    }
}


/* =========================================================
   CREATE MESSAGE ELEMENT
========================================================= */

function createMessageElement(
    message
) {

    if (!message) {
        return null;
    }

    const currentId =
        ChatState.currentUser
            ? Number(
                ChatState.currentUser.id
            )
            : null;

    const senderId =
        Number(
            message.sender_id
        );

    const isMine =
        currentId !== null &&
        senderId === currentId;

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "message-row " +
        (
            isMine
                ? "mine"
                : "received"
        );

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    /*
       TEXT
    */

    const hasText =
        message.content ||
        message.message;

    if (hasText) {

        const text =
            document.createElement(
                "div"
            );

        text.className =
            "message-text";

        text.textContent =
            message.content ||
            message.message ||
            "";

        bubble.appendChild(
            text
        );
    }

    /*
       IMAGE
    */

    if (
        message.media_url &&
        (
            message.media_type ===
            "image" ||
            !message.media_type
        )
    ) {

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

        image.loading =
            "lazy";

        image.decoding =
            "async";

        image.src =
            normalizeMediaURL(
                message.media_url
            );

        image.alt =
            "Photo";

        /*
           Tap photo = full image
        */

        image.addEventListener(
            "click",
            () => {

                openFullImage(
                    image.src
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

    /*
       META
    */

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
        formatMessageTime(
            message.created_at
        );

    meta.appendChild(
        time
    );

    /*
       TICKS
    */

    if (isMine) {

        const ticks =
            document.createElement(
                "span"
            );

        ticks.className =
            "message-ticks";

        ticks.textContent =
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

    row.appendChild(
        bubble
    );

    return row;
}


/* =========================================================
   IMAGE URL
========================================================= */

function normalizeMediaURL(
    url
) {

    if (!url) {
        return "";
    }

    if (
        url.startsWith(
            "http://"
        ) ||
        url.startsWith(
            "https://"
        )
    ) {

        return url;
    }

    if (
        url.startsWith("/")
    ) {

        return url;
    }

    return "/" + url;
}


/* =========================================================
   OPEN FULL IMAGE
========================================================= */

function openFullImage(
    imageURL
) {

    const overlay =
        document.createElement(
            "div"
        );

    overlay.style.position =
        "fixed";

    overlay.style.inset =
        "0";

    overlay.style.zIndex =
        "99999";

    overlay.style.background =
        "rgba(0,0,0,0.96)";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.style.padding =
        "15px";

    const image =
        document.createElement(
            "img"
        );

    image.src =
        imageURL;

    image.style.maxWidth =
        "100%";

    image.style.maxHeight =
        "100%";

    image.style.objectFit =
        "contain";

    image.style.borderRadius =
        "8px";

    overlay.appendChild(
        image
    );

    overlay.addEventListener(
        "click",
        () => {

            overlay.remove();
        }
    );

    document.body.appendChild(
        overlay
    );
}


/* =========================================================
   FILE INPUT
========================================================= */

function setupFileInput() {

    if (!DOM.fileInput) {

        console.warn(
            "File input not found."
        );

        return;
    }

    DOM.fileInput.accept =
        "image/jpeg,image/png,image/webp,image/gif";

    DOM.fileInput.addEventListener(
        "change",
        handleFileSelection
    );
}


/* =========================================================
   FILE SELECTED
========================================================= */

async function handleFileSelection(
    event
) {

    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }

    if (
        !file.type ||
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please select an image."
        );

        clearSelectedFile();

        return;
    }

    /*
       Browser file size check.

       Backend allows 10 MB.
    */

    const maxInputSize =
        50 * 1024 * 1024;

    if (
        file.size >
        maxInputSize
    ) {

        alert(
            "Photo is too large. Please select a smaller image."
        );

        clearSelectedFile();

        return;
    }

    try {

        /*
           Compress while preserving HD quality.
        */

        const optimizedFile =
            await optimizeImage(
                file
            );

        ChatState.selectedFile =
            optimizedFile;

        showSelectedPhotoPreview(
            optimizedFile
        );

        updateSendButton();

    } catch (error) {

        console.error(
            "Image processing error:",
            error
        );

        /*
           Fallback to original file.
        */

        ChatState.selectedFile =
            file;

        showSelectedPhotoPreview(
            file
        );

        updateSendButton();
    }
}


/* =========================================================
   IMAGE OPTIMIZATION
========================================================= */

async function optimizeImage(
    file
) {

    /*
       GIF is kept as-is.
       This prevents animated GIF from becoming
       a static JPEG.
    */

    if (
        file.type ===
        "image/gif"
    ) {

        return file;
    }

    const image =
        await loadImageFromFile(
            file
        );

    /*
       HD maximum resolution.

       This does NOT make the image tiny.
       It keeps enough resolution for mobile
       viewing while greatly reducing file size.
    */

    const MAX_WIDTH =
        1920;

    const MAX_HEIGHT =
        1920;

    let width =
        image.naturalWidth;

    let height =
        image.naturalHeight;

    const scale =
        Math.min(
            1,
            MAX_WIDTH / width,
            MAX_HEIGHT / height
        );

    width =
        Math.round(
            width * scale
        );

    height =
        Math.round(
            height * scale
        );

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        width;

    canvas.height =
        height;

    const ctx =
        canvas.getContext(
            "2d",
            {
                alpha: false,
            }
        );

    if (!ctx) {
        throw new Error(
            "Canvas is not supported."
        );
    }

    /*
       High-quality rendering.
    */

    ctx.imageSmoothingEnabled =
        true;

    ctx.imageSmoothingQuality =
        "high";

    /*
       White background prevents
       transparent PNG from turning black.
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    ctx.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    const blob =
        await canvasToBlob(
            canvas,
            "image/jpeg",
            0.88
        );

    if (!blob) {

        throw new Error(
            "Image compression failed."
        );
    }

    /*
       Very important:
       Give the Blob a .jpg filename.

       Backend checks extension.
    */

    const originalName =
        file.name
            ? file.name
                .replace(
                    /\.[^/.]+$/,
                    ""
                )
            : "usanex-photo";

    return new File(
        [
            blob
        ],
        `${originalName}.jpg`,
        {
            type:
                "image/jpeg",
            lastModified:
                Date.now(),
        }
    );
}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadImageFromFile(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const url =
                URL.createObjectURL(
                    file
                );

            const image =
                new Image();

            image.onload =
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                    resolve(
                        image
                    );
                };

            image.onerror =
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                    reject(
                        new Error(
                            "Unable to read image."
                        )
                    );
                };

            image.src =
                url;
        }
    );
}


/* =========================================================
   CANVAS TO BLOB
========================================================= */

function canvasToBlob(
    canvas,
    type,
    quality
) {

    return new Promise(
        (
            resolve
        ) => {

            canvas.toBlob(
                resolve,
                type,
                quality
            );
        }
    );
}


/* =========================================================
   PHOTO PREVIEW
========================================================= */

function showSelectedPhotoPreview(
    file
) {

    removeSelectedPhotoPreview();

    const previewURL =
        URL.createObjectURL(
            file
        );

    ChatState.selectedPreviewUrl =
        previewURL;

    const preview =
        document.createElement(
            "div"
        );

    preview.id =
        "selectedPhotoPreview";

    preview.style.position =
        "fixed";

    preview.style.left =
        "12px";

    preview.style.right =
        "12px";

    preview.style.bottom =
        "72px";

    preview.style.zIndex =
        "1000";

    preview.style.display =
        "flex";

    preview.style.alignItems =
        "center";

    preview.style.gap =
        "10px";

    preview.style.padding =
        "8px 10px";

    preview.style.borderRadius =
        "14px";

    preview.style.background =
        "#142638";

    preview.style.border =
        "1px solid rgba(255,255,255,0.10)";

    preview.style.boxShadow =
        "0 8px 25px rgba(0,0,0,0.35)";

    const image =
        document.createElement(
            "img"
        );

    image.src =
        previewURL;

    image.style.width =
        "58px";

    image.style.height =
        "58px";

    image.style.objectFit =
        "cover";

    image.style.borderRadius =
        "10px";

    const info =
        document.createElement(
            "div"
        );

    info.style.flex =
        "1";

    info.style.minWidth =
        "0";

    const title =
        document.createElement(
            "div"
        );

    title.textContent =
        "Photo ready";

    title.style.color =
        "#ffffff";

    title.style.fontSize =
        "13px";

    title.style.fontWeight =
        "600";

    const size =
        document.createElement(
            "div"
        );

    size.textContent =
        formatFileSize(
            file.size
        );

    size.style.color =
        "#8fa2b5";

    size.style.fontSize =
        "11px";

    size.style.marginTop =
        "3px";

    info.appendChild(
        title
    );

    info.appendChild(
        size
    );

    const close =
        document.createElement(
            "button"
        );

    close.type =
        "button";

    close.textContent =
        "✕";

    close.style.width =
        "34px";

    close.style.height =
        "34px";

    close.style.border =
        "0";

    close.style.borderRadius =
        "50%";

    close.style.background =
        "rgba(255,255,255,0.08)";

    close.style.color =
        "#ffffff";

    close.style.cursor =
        "pointer";

    close.addEventListener(
        "click",
        () => {

            clearSelectedFile();
        }
    );

    preview.appendChild(
        image
    );

    preview.appendChild(
        info
    );

    preview.appendChild(
        close
    );

    document.body.appendChild(
        preview
    );
}


/* =========================================================
   REMOVE PHOTO PREVIEW
========================================================= */

function removeSelectedPhotoPreview() {

    const preview =
        document.querySelector(
            "#selectedPhotoPreview"
        );

    if (preview) {
        preview.remove();
    }

    if (
        ChatState.selectedPreviewUrl
    ) {

        URL.revokeObjectURL(
            ChatState.selectedPreviewUrl
        );

        ChatState.selectedPreviewUrl =
            null;
    }
}


/* =========================================================
   CLEAR FILE
========================================================= */

function clearSelectedFile() {

    ChatState.selectedFile =
        null;

    removeSelectedPhotoPreview();

    if (DOM.fileInput) {

        DOM.fileInput.value =
            "";
    }

    updateSendButton();
}


/* =========================================================
   ATTACHMENT BUTTON
========================================================= */

function setupAttachmentButton() {

    if (!DOM.attachmentButton) {
        return;
    }

    DOM.attachmentButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            if (DOM.fileInput) {

                DOM.fileInput.click();
            }
        }
    );
}


/* =========================================================
   CAMERA BUTTON
========================================================= */

function setupCameraButton() {

    if (!DOM.cameraButton) {
        return;
    }

    DOM.cameraButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            if (!DOM.fileInput) {
                return;
            }

            /*
               Open camera on supported phones.
            */

            DOM.fileInput.setAttribute(
                "capture",
                "environment"
            );

            DOM.fileInput.click();

            /*
               Reset so next attachment can
               normally select gallery.
            */

            setTimeout(
                () => {

                    DOM.fileInput.removeAttribute(
                        "capture"
                    );

                },
                500
            );
        }
    );
}


/* =========================================================
   SEND BUTTON
========================================================= */

function setupSendButton() {

    if (!DOM.sendButton) {

        console.warn(
            "Send button not found."
        );

        return;
    }

    DOM.sendButton.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            event.stopPropagation();

            await sendMessage();
        }
    );

    updateSendButton();
}


/* =========================================================
   MESSAGE INPUT
========================================================= */

function setupMessageInput() {

    if (!DOM.messageInput) {
        return;
    }

    DOM.messageInput.addEventListener(
        "keydown",
        async (event) => {

            /*
               Enter = send
               Shift + Enter = new line
            */

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                await sendMessage();
            }

            updateSendButton();
        }
    );

    DOM.messageInput.addEventListener(
        "input",
        updateSendButton
    );
}


/* =========================================================
   UPDATE SEND BUTTON
========================================================= */

function updateSendButton() {

    if (!DOM.sendButton) {
        return;
    }

    const text =
        DOM.messageInput
            ? DOM.messageInput.value.trim()
            : "";

    const hasText =
        Boolean(text);

    const hasFile =
        Boolean(
            ChatState.selectedFile
        );

    DOM.sendButton.disabled =
        ChatState.sending ||
        (
            !hasText &&
            !hasFile
        );
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (ChatState.sending) {
        return;
    }

    if (!ChatState.userId) {

        alert(
            "Chat user not found."
        );

        return;
    }

    const text =
        DOM.messageInput
            ? DOM.messageInput.value.trim()
            : "";

    const file =
        ChatState.selectedFile;

    /*
       Must have either text or photo.
    */

    if (
        !text &&
        !file
    ) {

        return;
    }

    ChatState.sending =
        true;

    updateSendButton();

    /*
       =====================================================
       VERY IMPORTANT
       Backend expects multipart/form-data:

       receiver_id
       content
       file

       DO NOT set Content-Type manually.
       Browser will automatically add boundary.
       =====================================================
    */

    const formData =
        new FormData();

    formData.append(
        "receiver_id",
        String(
            ChatState.userId
        )
    );

    formData.append(
        "content",
        text
    );

    if (file) {

        formData.append(
            "file",
            file,
            file.name ||
                "usanex-photo.jpg"
        );
    }

    try {

        const response =
            await fetch(
                API.send,
                {
                    method: "POST",

                    credentials:
                        "include",

                    body:
                        formData,
                }
            );

        /*
           Read response safely.
        */

        let data = null;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            console.error(
                "Invalid server response:",
                jsonError
            );
        }

        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;
        }

        if (!response.ok) {

            throw new Error(
                data &&
                data.detail
                    ? data.detail
                    : "Message could not be sent."
            );
        }

        if (
            !data ||
            !data.success ||
            !data.message
        ) {

            throw new Error(
                "Server did not confirm the message."
            );
        }

        /*
           =================================================
           SUCCESS
           =================================================
        */

        const sentMessage =
            data.message;

        ChatState.messages.push(
            sentMessage
        );

        /*
           Remove empty state.
        */

        hideEmptyChat();

        /*
           Render the new message
           immediately.
        */

        const messageElement =
            createMessageElement(
                sentMessage
            );

        if (
            messageElement &&
            DOM.messages
        ) {

            DOM.messages.appendChild(
                messageElement
            );
        }

        /*
           Clear text.
        */

        if (DOM.messageInput) {

            DOM.messageInput.value =
                "";
        }

        /*
           Clear selected photo.
        */

        clearSelectedFile();

        /*
           Scroll to latest message.
        */

        scrollToBottom(
            true
        );

    } catch (error) {

        console.error(
            "SEND MESSAGE ERROR:",
            error
        );

        alert(
            error.message ||
            "Message send failed."
        );

    } finally {

        ChatState.sending =
            false;

        updateSendButton();
    }
}


/* =========================================================
   MARK CHAT READ
========================================================= */

async function markChatRead() {

    if (!ChatState.userId) {
        return;
    }

    try {

        await fetch(
            API.read(
                ChatState.userId
            ),
            {
                method: "POST",

                credentials:
                    "include",
            }
        );

    } catch (error) {

        console.warn(
            "Unable to mark chat read:",
            error
        );
    }
}


/* =========================================================
   BACK BUTTON
========================================================= */

function setupBackButton() {

    const button =
        document.querySelector(
            ".back-button"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            if (
                window.history.length >
                1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "/static/home.html";
            }
        }
    );
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToBottom(
    smooth = true
) {

    if (!DOM.messages) {
        return;
    }

    requestAnimationFrame(
        () => {

            DOM.messages.scrollTo(
                {
                    top:
                        DOM.messages.scrollHeight,

                    behavior:
                        smooth
                            ? "smooth"
                            : "auto",
                }
            );
        }
    );
}


/* =========================================================
   MESSAGE TIME
========================================================= */

function formatMessageTime(
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
            minute: "2-digit",
        }
    );
}


/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(
    bytes
) {

    if (
        !Number.isFinite(
            bytes
        )
    ) {

        return "";
    }

    if (
        bytes <
        1024
    ) {

        return `${bytes} B`;
    }

    if (
        bytes <
        1024 * 1024
    ) {

        return (
            `${(
                bytes / 1024
            ).toFixed(1)} KB`
        );
    }

    return (
        `${(
            bytes /
            (1024 * 1024)
        ).toFixed(2)} MB`
    );
}


/* =========================================================
   AVATAR PLACEHOLDER
========================================================= */

function createAvatarPlaceholder(
    name
) {

    const letter =
        String(
            name || "U"
        )
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "U";

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="0 0 100 100"
        >
            <rect
                width="100"
                height="100"
                rx="50"
                fill="#18283a"
            />

            <text
                x="50"
                y="58"
                text-anchor="middle"
                font-family="Arial"
                font-size="42"
                fill="white"
            >
                ${escapeHTML(letter)}
            </text>
        </svg>
    `;

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    if (!DOM.messages) {
        return;
    }

    DOM.messages.innerHTML = `
        <div class="messages-loading">
            ${escapeHTML(
                message ||
                "Something went wrong."
            )}
        </div>
    `;
}


/* =========================================================
   PERIODIC CHAT REFRESH
========================================================= */

let refreshTimer = null;

function startChatRefresh() {

    if (refreshTimer) {
        clearInterval(
            refreshTimer
        );
    }

    refreshTimer =
        setInterval(
            async () => {

                if (
                    ChatState.sending ||
                    ChatState.loading
                ) {
                    return;
                }

                try {

                    const response =
                        await fetch(
                            API.chat(
                                ChatState.userId
                            ),
                            {
                                method:
                                    "GET",

                                credentials:
                                    "include",

                                cache:
                                    "no-store",
                            }
                        );

                    if (
                        response.status ===
                        401
                    ) {

                        return;
                    }

                    if (
                        !response.ok
                    ) {

                        return;
                    }

                    const data =
                        await response.json();

                    if (
                        !data.success
                    ) {

                        return;
                    }

                    const oldLength =
                        ChatState.messages.length;

                    ChatState.messages =
                        Array.isArray(
                            data.messages
                        )
                            ? data.messages
                            : [];

                    /*
                       Only rerender when
                       message count changes.
                    */

                    if (
                        ChatState.messages.length !==
                        oldLength
                    ) {

                        renderMessages();

                        scrollToBottom(
                            true
                        );
                    }

                } catch (error) {

                    console.warn(
                        "Chat refresh error:",
                        error
                    );
                }

            },
            3000
        );
}


/* =========================================================
   VISIBILITY / PAGE RESUME
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            markChatRead();
        }
    }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (refreshTimer) {

            clearInterval(
                refreshTimer
            );
        }

        removeSelectedPhotoPreview();
    }
);


/* =========================================================
   START REFRESH AFTER INIT
========================================================= */

setTimeout(
    () => {

        if (
            ChatState.userId
        ) {

            startChatRefresh();

            markChatRead();
        }

    },
    1500
);
