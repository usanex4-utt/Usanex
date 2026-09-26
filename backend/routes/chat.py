/* =========================================================
   USANEX — CHAT PAGE
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const chatState = {
    currentUser: null,
    currentChat: null,
    messages: [],
    isSending: false
};


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initChat();
    }
);


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


function escapeHtml(value) {

    return safeText(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getPhotoUrl(photo) {

    if (!photo) {
        return "/static/images/default-profile.png";
    }

    return String(photo);
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initChat() {

    setupBackButton();

    setupChatMenu();

    setupMessageInput();

    setupSendButton();

    setupAttachmentButton();

    setupEmojiButton();

    setupImagePreview();

    setupKeyboard();

    setupChatActions();

    await loadChat();

}


/* =========================================================
   LOAD CHAT
   ========================================================= */

async function loadChat() {

    try {

        /*
         * Chat partner can be passed as:
         *
         * /chat?user_id=xxxx
         */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const userId =
            params.get("user_id");


        if (!userId) {

            showChatError(
                "No chat selected."
            );

            return;

        }


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


            throw new Error(
                errorData?.detail ||
                "Unable to load chat."
            );

        }


        const data =
            await response.json();


        if (!data?.success) {

            throw new Error(
                "Invalid chat response."
            );

        }


        chatState.currentUser =
            data.current_user || null;


        chatState.currentChat =
            data.user || data.chat_user || null;


        chatState.messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];


        renderChatHeader();

        renderMessages();

        scrollToBottom();


    } catch (error) {

        console.error(
            "Load chat:",
            error
        );


        /*
         * Backend may not yet have the
         * chat API. Keep the UI usable.
         */

        renderChatHeader();

        renderMessages();

    }

}


/* =========================================================
   CHAT HEADER
   ========================================================= */

function renderChatHeader() {

    const user =
        chatState.currentChat || {};


    const name =
        safeText(
            user.name,
            "Usanex User"
        );


    const username =
        safeText(
            user.username,
            ""
        );


    const photo =
        getPhotoUrl(
            user.profile_photo
        );


    if ($("chatUserName")) {

        $("chatUserName").textContent =
            name;

    }


    if ($("chatUserUsername")) {

        $("chatUserUsername").textContent =
            username
                ? `@${username.replace(/^@/, "")}`
                : "";

    }


    if ($("chatUserPhoto")) {

        $("chatUserPhoto").src =
            photo;

    }


    if ($("chatUserStatus")) {

        $("chatUserStatus").textContent =
            "online";

    }

}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages() {

    const container =
        $("messagesContainer");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!chatState.messages.length) {

        renderEmptyChat();

        return;

    }


    chatState.messages.forEach(
        (message) => {

            container.appendChild(
                createMessageElement(
                    message
                )
            );

        }
    );

}


/* =========================================================
   EMPTY CHAT
   ========================================================= */

function renderEmptyChat() {

    const container =
        $("messagesContainer");


    if (!container) {
        return;
    }


    const empty =
        document.createElement(
            "div"
        );


    empty.className =
        "chat-empty";


    empty.innerHTML = `
        <div class="chat-empty-icon">
            💬
        </div>

        <div class="chat-empty-title">
            Start a conversation
        </div>

        <div class="chat-empty-text">
            Send a message to start chatting.
        </div>
    `;


    container.appendChild(
        empty
    );

}


/* =========================================================
   MESSAGE ELEMENT
   ========================================================= */

function createMessageElement(message) {

    const wrapper =
        document.createElement(
            "div"
        );


    const senderId =
        message.sender_id ??
        message.senderId;


    const currentUserId =
        chatState.currentUser?.id ??
        chatState.currentUser?.user_id;


    const isMine =
        String(senderId) ===
        String(currentUserId);


    wrapper.className =
        isMine
            ? "message-row message-row-me"
            : "message-row message-row-other";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        isMine
            ? "message-bubble message-me"
            : "message-bubble message-other";


    /*
     * IMAGE MESSAGE
     */

    if (
        message.media_type === "image" &&
        message.media_url
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            message.media_url;


        image.className =
            "message-image";


        image.alt =
            "Image";


        bubble.appendChild(
            image
        );

    }


    /*
     * TEXT
     */

    if (message.content) {

        const text =
            document.createElement(
                "div"
            );


        text.className =
            "message-text";


        text.textContent =
            message.content;


        bubble.appendChild(
            text
        );

    }


    /*
     * TIME
     */

    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "message-footer";


    const time =
        document.createElement(
            "span"
        );


    time.className =
        "message-time";


    time.textContent =
        formatMessageTime(
            message.created_at ||
            message.timestamp
        );


    footer.appendChild(
        time
    );


    /*
     * READ STATUS
     */

    if (isMine) {

        const status =
            document.createElement(
                "span"
            );


        status.className =
            "message-status";


        status.textContent =
            message.read
                ? "✓✓"
                : "✓";


        footer.appendChild(
            status
        );

    }


    bubble.appendChild(
        footer
    );


    wrapper.appendChild(
        bubble
    );


    return wrapper;

}


/* =========================================================
   MESSAGE TIME
   ========================================================= */

function formatMessageTime(value) {

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
   INPUT
   ========================================================= */

function setupMessageInput() {

    const input =
        $("messageInput");


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            autoResizeInput(
                input
            );

            updateSendButton();

        }
    );

}


function autoResizeInput(input) {

    input.style.height =
        "auto";


    input.style.height =
        Math.min(
            input.scrollHeight,
            120
        ) + "px";

}


/* =========================================================
   SEND BUTTON
   ========================================================= */

function setupSendButton() {

    const button =
        $("sendMessageButton");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            sendMessage();

        }
    );

}


function updateSendButton() {

    const input =
        $("messageInput");


    const button =
        $("sendMessageButton");


    if (!input || !button) {
        return;
    }


    button.disabled =
        !input.value.trim() &&
        !selectedImageFile;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (chatState.isSending) {
        return;
    }


    const input =
        $("messageInput");


    if (!input) {
        return;
    }


    const text =
        input.value.trim();


    if (!text && !selectedImageFile) {
        return;
    }


    chatState.isSending =
        true;


    const button =
        $("sendMessageButton");


    if (button) {

        button.disabled =
            true;

    }


    try {

        /*
         * First try real backend.
         */

        const receiverId =
            chatState.currentChat?.user_id ||
            chatState.currentChat?.id;


        if (!receiverId) {

            throw new Error(
                "Chat user not found."
            );

        }


        const formData =
            new FormData();


        formData.append(
            "receiver_id",
            receiverId
        );


        if (text) {

            formData.append(
                "content",
                text
            );

        }


        if (selectedImageFile) {

            formData.append(
                "file",
                selectedImageFile
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


        if (response.status === 401) {

            window.location.href =
                "/login";

            return;

        }


        if (!response.ok) {

            /*
             * If backend endpoint is not ready,
             * still show the message locally.
             */

            addLocalMessage(
                text
            );

        } else {

            const data =
                await response.json();


            if (data?.message) {

                chatState.messages.push(
                    data.message
                );

            } else {

                addLocalMessage(
                    text
                );

            }

        }


        input.value = "";

        input.style.height =
            "auto";


        clearSelectedImage();

        renderMessages();

        scrollToBottom();


    } catch (error) {

        console.error(
            "Send message:",
            error
        );


        /*
         * Local fallback
         */

        addLocalMessage(
            text
        );


        input.value = "";

        input.style.height =
            "auto";


        clearSelectedImage();

        renderMessages();

        scrollToBottom();

    } finally {

        chatState.isSending =
            false;


        updateSendButton();

    }

}


/* =========================================================
   LOCAL MESSAGE
   ========================================================= */

function addLocalMessage(text) {

    if (!text && !selectedImageFile) {
        return;
    }


    chatState.messages.push({

        id:
            `local-${Date.now()}`,

        sender_id:
            chatState.currentUser?.id ||
            chatState.currentUser?.user_id,

        content:
            text,

        created_at:
            new Date().toISOString(),

        read:
            false

    });

}


/* =========================================================
   ENTER KEY
   ========================================================= */

function setupKeyboard() {

    const input =
        $("messageInput");


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        (event) => {

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


/* =========================================================
   ATTACHMENT
   ========================================================= */

let selectedImageFile =
    null;


function setupAttachmentButton() {

    const button =
        $("attachmentButton");


    const input =
        $("attachmentInput");


    if (!button || !input) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            input.click();

        }
    );


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image."
                );


                input.value =
                    "";


                return;

            }


            if (
                file.size >
                10 * 1024 * 1024
            ) {

                alert(
                    "Image must be 10 MB or smaller."
                );


                input.value =
                    "";


                return;

            }


            selectedImageFile =
                file;


            showImagePreview(
                file
            );


            updateSendButton();

        }
    );

}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function setupImagePreview() {

    const close =
        $("closeImagePreview");


    if (close) {

        close.addEventListener(
            "click",
            clearSelectedImage
        );

    }

}


function showImagePreview(file) {

    const previewBox =
        $("imagePreview");


    const previewImage =
        $("imagePreviewImage");


    if (
        !previewBox ||
        !previewImage
    ) {
        return;
    }


    const url =
        URL.createObjectURL(
            file
        );


    previewImage.src =
        url;


    previewImage.onload =
        () => {

            URL.revokeObjectURL(
                url
            );

        };


    previewBox.classList.remove(
        "hidden"
    );

}


function clearSelectedImage() {

    selectedImageFile =
        null;


    const input =
        $("attachmentInput");


    if (input) {

        input.value =
            "";

    }


    const preview =
        $("imagePreview");


    if (preview) {

        preview.classList.add(
            "hidden"
        );

    }


    const previewImage =
        $("imagePreviewImage");


    if (previewImage) {

        previewImage.src =
            "";

    }

}


/* =========================================================
   EMOJI
   ========================================================= */

function setupEmojiButton() {

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

            updateSendButton();

        }
    );

}


/* =========================================================
   CHAT MENU
   ========================================================= */

function setupChatMenu() {

    const button =
        $("chatMenuButton");


    const menu =
        $("chatMenu");


    if (!button || !menu) {
        return;
    }


    button.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            menu.classList.toggle(
                "hidden"
            );

        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                !menu.contains(
                    event.target
                ) &&
                !button.contains(
                    event.target
                )
            ) {

                menu.classList.add(
                    "hidden"
                );

            }

        }
    );

}


/* =========================================================
   CHAT ACTIONS
   ========================================================= */

function setupChatActions() {

    const viewProfile =
        $("chatViewProfile");


    if (viewProfile) {

        viewProfile.addEventListener(
            "click",
            () => {

                const userId =
                    chatState.currentChat
                        ?.user_id;


                if (!userId) {
                    return;
                }


                window.location.href =
                    `/profile/${encodeURIComponent(userId)}`;

            }
        );

    }


    const clearChat =
        $("clearChat");


    if (clearChat) {

        clearChat.addEventListener(
            "click",
            () => {

                if (
                    !confirm(
                        "Clear this chat?"
                    )
                ) {
                    return;
                }


                chatState.messages =
                    [];


                renderMessages();

            }
        );

    }


    const blockUser =
        $("blockUser");


    if (blockUser) {

        blockUser.addEventListener(
            "click",
            () => {

                alert(
                    "Block feature will be connected to the backend."
                );

            }
        );

    }

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function setupBackButton() {

    const button =
        $("chatBackButton");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "/home";

            }

        }
    );

}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {

    const container =
        $("messagesContainer");


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
   ERROR
   ========================================================= */

function showChatError(message) {

    const container =
        $("messagesContainer");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "chat-empty";


    error.textContent =
        message;


    container.appendChild(
        error
    );

}
