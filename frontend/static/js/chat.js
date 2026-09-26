
/* =========================================================
   USANEX — CHAT PAGE
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const chatState = {

    currentUser: null,

    activeChat: null,

    messages: [],

    loading: false,

    sending: false

};


/* =========================================================
   DOM READY
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


function formatTime(dateValue) {

    if (!dateValue) {

        return "";

    }

    const date =
        new Date(dateValue);


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


function scrollMessagesToBottom() {

    const container =
        $("chatMessages");


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
   INITIALIZATION
   ========================================================= */

async function initChat() {

    setupBackButton();

    setupChatMenu();

    setupMessageInput();

    setupSendButton();

    setupAttachmentButton();

    setupEmojiButton();

    setupVoiceButton();

    setupSearchButton();

    setupChatList();

    setupMobileChat();

    await loadCurrentUser();

    loadChatFromUrl();

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


        chatState.currentUser =
            data.user ||
            data;


    } catch (error) {

        console.error(
            "Current user:",
            error
        );

    }

}


/* =========================================================
   URL CHAT
   ========================================================= */

function loadChatFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const userId =
        params.get("user_id");


    const username =
        params.get("username");


    const name =
        params.get("name");


    if (
        userId ||
        username ||
        name
    ) {

        openChat({
            user_id: userId || "",
            username: username || "",
            name: name || "User",
            profile_photo:
                params.get(
                    "profile_photo"
                ) || ""
        });

    }

}


/* =========================================================
   CHAT LIST
   ========================================================= */

function setupChatList() {

    const chatList =
        $("chatList");


    if (!chatList) {

        return;

    }


    chatList.addEventListener(
        "click",
        (event) => {

            const item =
                event.target.closest(
                    "[data-chat-user-id]"
                );


            if (!item) {

                return;

            }


            openChat({

                user_id:
                    item.dataset.chatUserId,

                username:
                    item.dataset.chatUsername || "",

                name:
                    item.dataset.chatName ||
                    "User",

                profile_photo:
                    item.dataset.chatPhoto || ""

            });

        }
    );

}


/* =========================================================
   OPEN CHAT
   ========================================================= */

async function openChat(user) {

    chatState.activeChat =
        user;


    updateChatHeader(
        user
    );


    showChatOnMobile();


    clearMessages();


    await loadMessages(
        user.user_id
    );

}


/* =========================================================
   CHAT HEADER
   ========================================================= */

function updateChatHeader(user) {

    const name =
        user.name ||
        user.username ||
        "User";


    const username =
        user.username
            ? `@${String(
                user.username
            ).replace(/^@/, "")}`
            : "";


    if ($("chatUserName")) {

        $("chatUserName").textContent =
            name;

    }


    if ($("chatUserUsername")) {

        $("chatUserUsername").textContent =
            username;

    }


    if ($("chatUserPhoto")) {

        $("chatUserPhoto").src =
            user.profile_photo ||
            "/static/images/default-profile.png";

    }


    if ($("chatOnlineStatus")) {

        $("chatOnlineStatus").textContent =
            "offline";

    }

}


/* =========================================================
   LOAD MESSAGES
   ========================================================= */

async function loadMessages(userId) {

    if (!userId) {

        renderChatWelcome();

        return;

    }


    chatState.loading =
        true;


    try {

        const response =
            await fetch(
                `/api/chat/messages/${encodeURIComponent(
                    userId
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


        if (
            response.status === 404
        ) {

            renderEmptyMessages();

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Unable to load messages."
            );

        }


        const data =
            await response.json();


        chatState.messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : Array.isArray(data)
                    ? data
                    : [];


        renderMessages();


    } catch (error) {

        console.error(
            "Load messages:",
            error
        );


        renderMessageError();

    } finally {

        chatState.loading =
            false;

    }

}


/* =========================================================
   CLEAR MESSAGES
   ========================================================= */

function clearMessages() {

    const container =
        $("chatMessages");


    if (!container) {

        return;

    }


    container.innerHTML = "";

}


/* =========================================================
   RENDER WELCOME
   ========================================================= */

function renderChatWelcome() {

    const container =
        $("chatMessages");


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="chat-welcome">

            <div class="chat-welcome-icon">
                💬
            </div>

            <h3>
                Start a conversation
            </h3>

            <p>
                Send a message to start chatting.
            </p>

        </div>

    `;

}


/* =========================================================
   EMPTY MESSAGES
   ========================================================= */

function renderEmptyMessages() {

    const container =
        $("chatMessages");


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="chat-empty">

            <div class="chat-empty-icon">
                ✦
            </div>

            <div>
                No messages yet
            </div>

            <small>
                Say hello and start chatting.
            </small>

        </div>

    `;

}


/* =========================================================
   MESSAGE ERROR
   ========================================================= */

function renderMessageError() {

    const container =
        $("chatMessages");


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="chat-empty">

            <div>
                Unable to load messages.
            </div>

            <button
                type="button"
                id="retryMessagesButton"
            >
                Try Again
            </button>

        </div>

    `;


    const retry =
        $("retryMessagesButton");


    if (retry) {

        retry.addEventListener(
            "click",
            () => {

                if (
                    chatState.activeChat
                ) {

                    loadMessages(
                        chatState
                            .activeChat
                            .user_id
                    );

                }

            }
        );

    }

}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages() {

    const container =
        $("chatMessages");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        !chatState.messages.length
    ) {

        renderEmptyMessages();

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


    scrollMessagesToBottom();

}


/* =========================================================
   CREATE MESSAGE
   ========================================================= */

function createMessageElement(message) {

    const wrapper =
        document.createElement(
            "div"
        );


    const currentUserId =
        chatState.currentUser?.id;


    const senderId =
        message.sender_id ??
        message.from_user_id;


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
        "message-bubble";


    /*
     * IMAGE
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


        image.alt =
            "Image";


        image.className =
            "chat-message-image";


        bubble.appendChild(
            image
        );

    }


    /*
     * VIDEO
     */

    if (
        message.media_type === "video" &&
        message.media_url
    ) {

        const video =
            document.createElement(
                "video"
            );


        video.src =
            message.media_url;


        video.controls =
            true;


        video.playsInline =
            true;


        video.className =
            "chat-message-video";


        bubble.appendChild(
            video
        );

    }


    /*
     * TEXT
     */

    if (
        message.content ||
        message.text
    ) {

        const text =
            document.createElement(
                "div"
            );


        text.className =
            "message-text";


        text.textContent =
            message.content ||
            message.text;


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


    const time =
        document.createElement(
            "span"
        );


    time.textContent =
        formatTime(
            message.created_at ||
            message.sent_at ||
            message.timestamp
        );


    meta.appendChild(
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
            "message-read-status";


        if (
            message.read ||
            message.is_read
        ) {

            status.textContent =
                "✓✓";

        } else {

            status.textContent =
                "✓";

        }


        meta.appendChild(
            status
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
   MESSAGE INPUT
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
   AUTO RESIZE
   ========================================================= */

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
        sendMessage
    );

}


/* =========================================================
   UPDATE SEND BUTTON
   ========================================================= */

function updateSendButton() {

    const input =
        $("messageInput");


    const button =
        $("sendMessageButton");


    if (!input || !button) {

        return;

    }


    const hasText =
        input.value.trim().length > 0;


    button.disabled =
        !hasText ||
        chatState.sending;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (
        chatState.sending
    ) {

        return;

    }


    if (
        !chatState.activeChat
    ) {

        return;

    }


    const input =
        $("messageInput");


    if (!input) {

        return;

    }


    const text =
        input.value.trim();


    if (!text) {

        return;

    }


    chatState.sending =
        true;


    updateSendButton();


    try {

        const response =
            await fetch(
                "/api/chat/send",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            receiver_id:
                                chatState
                                    .activeChat
                                    .user_id,

                            content:
                                text

                        })

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


        /*
         * Clear input
         */

        input.value = "";

        input.style.height =
            "auto";


        /*
         * Add returned message
         */

        if (data.message) {

            chatState.messages.push(
                data.message
            );

            renderMessages();

        } else {

            await loadMessages(
                chatState
                    .activeChat
                    .user_id
            );

        }


    } catch (error) {

        console.error(
            "Send message:",
            error
        );


        showChatToast(
            error.message ||
            "Unable to send message."
        );

    } finally {

        chatState.sending =
            false;


        updateSendButton();

        input.focus();

    }

}


/* =========================================================
   ATTACHMENT
   ========================================================= */

function setupAttachmentButton() {

    const button =
        $("attachmentButton");


    const input =
        $("chatFileInput");


    if (
        !button ||
        !input
    ) {

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
        handleAttachment
    );

}


/* =========================================================
   HANDLE ATTACHMENT
   ========================================================= */

function handleAttachment(event) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    if (
        !chatState.activeChat
    ) {

        return;

    }


    /*
     * Frontend preview only.
     * Actual upload endpoint can be connected later.
     */

    const url =
        URL.createObjectURL(
            file
        );


    const preview =
        $("attachmentPreview");


    if (preview) {

        preview.src =
            url;

        preview.classList.remove(
            "hidden"
        );

    }


    showChatToast(
        "Attachment selected."
    );


    event.target.value =
        "";

}


/* =========================================================
   EMOJI
   ========================================================= */

function setupEmojiButton() {

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

            input.value += "😊";

            input.focus();

            updateSendButton();

        }
    );

}


/* =========================================================
   VOICE
   ========================================================= */

function setupVoiceButton() {

    const button =
        $("voiceButton");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            showChatToast(
                "Voice messages will be available soon."
            );

        }
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearchButton() {

    const button =
        $("chatSearchButton");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            const input =
                $("chatSearchInput");


            if (!input) {

                return;

            }


            input.classList.toggle(
                "hidden"
            );


            if (
                !input.classList.contains(
                    "hidden"
                )
            ) {

                input.focus();

            }

        }
    );


    const searchInput =
        $("chatSearchInput");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                searchMessages(
                    searchInput.value
                );

            }
        );

    }

}


/* =========================================================
   SEARCH MESSAGES
   ========================================================= */

function searchMessages(query) {

    const value =
        query.trim().toLowerCase();


    document
        .querySelectorAll(
            ".message-row"
        )
        .forEach(
            (row) => {

                if (!value) {

                    row.style.display =
                        "";

                    return;

                }


                const text =
                    row.textContent
                        .toLowerCase();


                row.style.display =
                    text.includes(value)
                        ? ""
                        : "none";

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


    if (
        !button ||
        !menu
    ) {

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


    const clearButton =
        $("clearChatButton");


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                menu.classList.add(
                    "hidden"
                );

                clearChat();

            }
        );

    }


    const blockButton =
        $("blockChatButton");


    if (blockButton) {

        blockButton.addEventListener(
            "click",
            () => {

                menu.classList.add(
                    "hidden"
                );

                showChatToast(
                    "Block option will be available soon."
                );

            }
        );

    }

}


/* =========================================================
   CLEAR CHAT
   ========================================================= */

async function clearChat() {

    if (
        !chatState.activeChat
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Clear this chat?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/chat/clear/${encodeURIComponent(
                    chatState
                        .activeChat
                        .user_id
                )}`,
                {
                    method: "DELETE",

                    credentials: "include"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to clear chat."
            );

        }


        chatState.messages =
            [];


        renderEmptyMessages();


    } catch (error) {

        console.error(
            "Clear chat:",
            error
        );


        showChatToast(
            error.message
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
   MOBILE CHAT
   ========================================================= */

function setupMobileChat() {

    const button =
        $("chatBackButton");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            hideChatOnMobile();

        }
    );

}


function showChatOnMobile() {

    document.body.classList.add(
        "chat-open"
    );

}


function hideChatOnMobile() {

    document.body.classList.remove(
        "chat-open"
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showChatToast(message) {

    let toast =
        $("chatToast");


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "chatToast";


        toast.className =
            "chat-toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toast._timeout
    );


    toast._timeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   OPTIONAL POLLING
   ========================================================= */

let messagePollingTimer =
    null;


function startMessagePolling() {

    stopMessagePolling();


    messagePollingTimer =
        setInterval(
            async () => {

                if (
                    !chatState.activeChat ||
                    chatState.sending
                ) {

                    return;

                }


                await loadMessages(
                    chatState
                        .activeChat
                        .user_id
                );

            },
            5000
        );

}


function stopMessagePolling() {

    if (
        messagePollingTimer
    ) {

        clearInterval(
            messagePollingTimer
        );


        messagePollingTimer =
            null;

    }

}


/* =========================================================
   START POLLING AFTER CHAT OPEN
   ========================================================= */

const originalOpenChat =
    openChat;


openChat =
    async function(user) {

        await originalOpenChat(
            user
        );

        startMessagePolling();

    };


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopMessagePolling();

    }
);
