/* =========================================================
   USANEX — REAL CHAT
   ========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const chatState = {

    chats: [],

    selectedChat: null,

    messages: [],

    filter: "all",

    search: "",

    currentUser: null,

    sending: false

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
   INIT
========================================================= */

async function initChat() {

    setupNavigation();

    setupSearch();

    setupFilters();

    setupComposer();

    setupButtons();

    setupBackButton();

    await loadCurrentUser();

    await loadChats();

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
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/api/profile/me",
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

            return;

        }


        const data =
            await response.json();


        if (data.success) {

            chatState.currentUser =
                data.user || null;

        }

    } catch (error) {

        console.error(
            "Current user:",
            error
        );

    }

}


/* =========================================================
   LOAD CHATS
========================================================= */

async function loadChats() {

    const list =
        $("chatList");


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="chat-loading">
            Loading chats...
        </div>
    `;


    try {

        /*
         * Backend endpoint.
         *
         * Agar tumhara backend baad me
         * /api/chat/chats provide karega,
         * isi endpoint se real chats load honge.
         */

        const response =
            await fetch(
                "/api/chat/chats",
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

            throw new Error(
                "Unable to load chats"
            );

        }


        const data =
            await response.json();


        chatState.chats =
            Array.isArray(data.chats)
                ? data.chats
                : [];


        renderChatList();


    } catch (error) {

        console.error(
            "Load chats:",
            error
        );


        /*
         * Backend ready hone tak
         * empty state.
         */

        chatState.chats = [];


        renderChatList();

    }

}


/* =========================================================
   RENDER CHAT LIST
========================================================= */

function renderChatList() {

    const list =
        $("chatList");


    if (!list) {
        return;
    }


    list.innerHTML = "";


    let chats =
        [...chatState.chats];


    /*
     * SEARCH
     */

    const search =
        chatState.search
            .trim()
            .toLowerCase();


    if (search) {

        chats =
            chats.filter(
                chat => {

                    const name =
                        safeText(
                            chat.name
                        )
                        .toLowerCase();


                    const username =
                        safeText(
                            chat.username
                        )
                        .toLowerCase();


                    return (
                        name.includes(search) ||
                        username.includes(search)
                    );

                }
            );

    }


    /*
     * FILTER
     */

    if (
        chatState.filter ===
        "unread"
    ) {

        chats =
            chats.filter(
                chat =>
                    Number(
                        chat.unread_count || 0
                    ) > 0
            );

    }


    if (
        chatState.filter ===
        "groups"
    ) {

        chats =
            chats.filter(
                chat =>
                    chat.is_group === true
            );

    }


    if (
        chatState.filter ===
        "contacts"
    ) {

        chats =
            chats.filter(
                chat =>
                    chat.is_group !== true
            );

    }


    if (!chats.length) {

        list.innerHTML = `
            <div class="chat-empty">
                <div class="chat-empty-icon">
                    💬
                </div>

                <strong>
                    No chats yet
                </strong>

                <span>
                    Start a conversation from Search.
                </span>
            </div>
        `;

        return;

    }


    chats.forEach(
        chat => {

            list.appendChild(
                createChatItem(chat)
            );

        }
    );

}


/* =========================================================
   CREATE CHAT ITEM
========================================================= */

function createChatItem(chat) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "chat-item";


    if (
        chat.id ===
        chatState.selectedChat?.id
    ) {

        button.classList.add(
            "active"
        );

    }


    const avatar =
        getAvatar(
            chat.profile_photo ||
            chat.avatar
        );


    const name =
        safeText(
            chat.name,
            "Usanex User"
        );


    const lastMessage =
        safeText(
            chat.last_message,
            "Start chatting"
        );


    const unread =
        Number(
            chat.unread_count || 0
        );


    button.innerHTML = `

        <div class="chat-avatar-wrap">

            <img
                class="chat-avatar"
                src="${escapeHtml(avatar)}"
                alt=""
            >

            ${
                chat.online
                    ? `<span class="online-dot"></span>`
                    : ""
            }

        </div>


        <div class="chat-item-content">

            <div class="chat-item-top">

                <strong>
                    ${escapeHtml(name)}
                </strong>

                <time>
                    ${escapeHtml(
                        formatTime(
                            chat.last_message_at
                        )
                    )}
                </time>

            </div>


            <div class="chat-item-bottom">

                <span>
                    ${escapeHtml(lastMessage)}
                </span>

                ${
                    unread > 0
                        ? `
                            <b class="unread-count">
                                ${unread}
                            </b>
                          `
                        : ""
                }

            </div>

        </div>

    `;


    button.addEventListener(
        "click",
        () => {

            openChat(chat);

        }
    );


    return button;

}


/* =========================================================
   OPEN CHAT
========================================================= */

async function openChat(chat) {

    if (!chat) {
        return;
    }


    chatState.selectedChat =
        chat;


    updateSelectedUser(
        chat
    );


    renderChatList();


    /*
     * Mobile:
     * sidebar hide
     * conversation show
     */

    document.body.classList.add(
        "chat-open"
    );


    await loadMessages(
        chat
    );

}


/* =========================================================
   SELECTED USER
========================================================= */

function updateSelectedUser(chat) {

    const avatar =
        $("selectedAvatar");


    const name =
        $("selectedName");


    const status =
        $("selectedStatus");


    if (avatar) {

        avatar.src =
            getAvatar(
                chat.profile_photo ||
                chat.avatar
            );

    }


    if (name) {

        name.textContent =
            safeText(
                chat.name,
                "Usanex User"
            );

    }


    if (status) {

        if (chat.online) {

            status.textContent =
                "Online";

        } else {

            status.textContent =
                safeText(
                    chat.last_seen,
                    "Offline"
                );

        }

    }

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages(chat) {

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

        const chatId =
            chat.chat_id ||
            chat.id;


        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(chatId)}/messages`,
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load messages"
            );

        }


        const data =
            await response.json();


        chatState.messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];


        renderMessages();


    } catch (error) {

        console.error(
            "Load messages:",
            error
        );


        /*
         * Empty chat is normal for a
         * newly created conversation.
         */

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


    if (!chatState.messages.length) {

        container.innerHTML = `

            <div class="empty-chat">

                <div class="empty-chat-icon">
                    💬
                </div>

                <strong>
                    No messages yet
                </strong>

                <span>
                    Send a message to start the conversation.
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

                const dateLabel =
                    document.createElement(
                        "div"
                    );


                dateLabel.className =
                    "day-label";


                dateLabel.textContent =
                    date;


                container.appendChild(
                    dateLabel
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


    scrollMessagesToBottom();

}


/* =========================================================
   MESSAGE BUBBLE
========================================================= */

function createMessageBubble(message) {

    const wrapper =
        document.createElement(
            "div"
        );


    const isMine =
        message.sender_id ===
        chatState.currentUser?.id;


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


    const text =
        document.createElement(
            "div"
        );


    text.className =
        "message-text";


    text.textContent =
        safeText(
            message.message ||
            message.content
        );


    bubble.appendChild(
        text
    );


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


    if (!message) {
        return;
    }


    if (!chatState.selectedChat) {

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

        const chatId =
            chatState.selectedChat.chat_id ||
            chatState.selectedChat.id;


        const response =
            await fetch(
                `/api/chat/${encodeURIComponent(chatId)}/messages`,
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
                            message
                        })

                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login";

            return;

        }


        if (!response.ok) {

            const data =
                await response
                    .json()
                    .catch(() => null);


            throw new Error(
                data?.detail ||
                "Message could not be sent."
            );

        }


        const data =
            await response.json();


        if (data.message) {

            chatState.messages.push(
                data.message
            );

        } else {

            /*
             * Temporary optimistic message.
             */

            chatState.messages.push({

                id:
                    Date.now(),

                sender_id:
                    chatState.currentUser?.id,

                message,

                created_at:
                    new Date().toISOString(),

                read:
                    false

            });

        }


        input.value = "";


        renderMessages();


        updateChatPreview(
            message
        );


    } catch (error) {

        console.error(
            "Send message:",
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


        input.focus();

    }

}


/* =========================================================
   UPDATE CHAT PREVIEW
========================================================= */

function updateChatPreview(message) {

    if (!chatState.selectedChat) {
        return;
    }


    chatState.selectedChat.last_message =
        message;


    chatState.selectedChat.last_message_at =
        new Date().toISOString();


    renderChatList();

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
   SEARCH
========================================================= */

function setupSearch() {

    const input =
        $("chatSearch");


    const toggle =
        $("searchToggle");


    if (input) {

        input.addEventListener(
            "input",
            () => {

                chatState.search =
                    input.value;


                renderChatList();

            }
        );

    }


    if (toggle) {

        toggle.addEventListener(
            "click",
            () => {

                if (!input) {
                    return;
                }


                input.focus();

            }
        );

    }

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
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        chatState.filter =
                            button.dataset.filter ||
                            "all";


                        renderChatList();

                    }
                );

            }
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

            document.body.classList.remove(
                "chat-open"
            );

            chatState.selectedChat =
                null;

            renderChatList();

        }
    );

}


/* =========================================================
   EXTRA BUTTONS
========================================================= */

function setupButtons() {

    const emojiButton =
        $("emojiButton");


    const attachButton =
        $("attachButton");


    const cameraButton =
        $("cameraButton");


    const fileInput =
        $("fileInput");


    if (emojiButton) {

        emojiButton.addEventListener(
            "click",
            () => {

                const input =
                    $("messageInput");


                if (!input) {
                    return;
                }


                input.value += " 😊";

                input.focus();

            }
        );

    }


    if (
        attachButton &&
        fileInput
    ) {

        attachButton.addEventListener(
            "click",
            () => {

                fileInput.click();

            }
        );

    }


    if (
        cameraButton &&
        fileInput
    ) {

        cameraButton.addEventListener(
            "click",
            () => {

                fileInput.accept =
                    "image/*";

                fileInput.capture =
                    "environment";

                fileInput.click();

            }
        );

    }


    const menuButton =
        $("menuButton");


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            () => {

                console.log(
                    "Chat menu"
                );

            }
        );

    }


    const conversationMenu =
        $("conversationMenu");


    if (conversationMenu) {

        conversationMenu.addEventListener(
            "click",
            () => {

                console.log(
                    "Conversation menu"
                );

            }
        );

    }

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

function scrollMessagesToBottom() {

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
