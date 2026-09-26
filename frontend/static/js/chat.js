/* =========================================================
   USANEX — CHAT
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const chatState = {

    chats: [],

    filteredChats: [],

    selectedChat: null,

    activeFilter: "all",

    searchText: "",

    messages: [],

    loading: false

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


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function getPhoto(photo) {

    if (!photo) {

        return "/static/images/default-profile.png";

    }

    return String(photo);

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initChat() {

    setupNavigation();

    setupSearch();

    setupFilters();

    setupComposer();

    setupBackButton();

    setupHeaderButtons();

    loadChats();

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
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            button.dataset.page;

                        if (!page) {
                            return;
                        }

                        window.location.href =
                            page;

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

            chatState.searchText =
                input.value
                    .trim()
                    .toLowerCase();


            filterAndRenderChats();

        }
    );


    const searchToggle =
        $("searchToggle");


    if (searchToggle) {

        searchToggle.addEventListener(
            "click",
            () => {

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
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".filter"
                            )
                            .forEach(
                                (item) => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        chatState.activeFilter =
                            button.dataset.filter ||
                            "all";


                        filterAndRenderChats();

                    }
                );

            }
        );

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
                "Unable to load chats."
            );

        }


        const data =
            await response.json();


        /*
         * Supported responses:
         *
         * {
         *   "success": true,
         *   "chats": [...]
         * }
         */


        chatState.chats =
            Array.isArray(data.chats)
                ? data.chats
                : [];


        chatState.filteredChats =
            [...chatState.chats];


        filterAndRenderChats();


    } catch (error) {

        console.error(
            "Load chats:",
            error
        );


        /*
         * Temporary empty state.
         *
         * Backend chat API can be connected
         * without changing the UI code.
         */

        chatState.chats = [];

        chatState.filteredChats = [];

        renderEmptyChats();

    }

}


/* =========================================================
   FILTER + RENDER
   ========================================================= */

function filterAndRenderChats() {

    let chats =
        [...chatState.chats];


    /*
     * FILTER
     */

    if (
        chatState.activeFilter ===
        "unread"
    ) {

        chats =
            chats.filter(
                (chat) =>
                    Number(
                        chat.unread_count || 0
                    ) > 0
            );

    }


    if (
        chatState.activeFilter ===
        "contacts"
    ) {

        chats =
            chats.filter(
                (chat) =>
                    chat.is_contact !== false
            );

    }


    if (
        chatState.activeFilter ===
        "groups"
    ) {

        chats =
            chats.filter(
                (chat) =>
                    chat.is_group === true
            );

    }


    /*
     * SEARCH
     */

    if (chatState.searchText) {

        chats =
            chats.filter(
                (chat) => {

                    const name =
                        String(
                            chat.name || ""
                        ).toLowerCase();

                    const username =
                        String(
                            chat.username || ""
                        ).toLowerCase();

                    const lastMessage =
                        String(
                            chat.last_message || ""
                        ).toLowerCase();

                    return (
                        name.includes(
                            chatState.searchText
                        ) ||
                        username.includes(
                            chatState.searchText
                        ) ||
                        lastMessage.includes(
                            chatState.searchText
                        )
                    );

                }
            );

    }


    chatState.filteredChats =
        chats;


    renderChatList();

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


    list.innerHTML =
        "";


    if (
        !chatState.filteredChats.length
    ) {

        renderEmptyChats();

        return;

    }


    chatState.filteredChats
        .forEach(
            (chat) => {

                list.appendChild(
                    createChatItem(chat)
                );

            }
        );

}


/* =========================================================
   EMPTY CHATS
   ========================================================= */

function renderEmptyChats() {

    const list =
        $("chatList");


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="empty-chat">
            <strong>No chats yet</strong>
            Start a conversation from Usanex.
        </div>
    `;

}


/* =========================================================
   CREATE CHAT ITEM
   ========================================================= */

function createChatItem(chat) {

    const item =
        document.createElement(
            "button"
        );


    item.type =
        "button";


    item.className =
        "chat-item";


    item.dataset.chatId =
        chat.id ??
        chat.user_id ??
        "";


    const avatar =
        getPhoto(
            chat.profile_photo ||
            chat.avatar
        );


    const name =
        chat.name ||
        chat.username ||
        "Usanex User";


    const lastMessage =
        chat.last_message ||
        "Start a conversation";


    const time =
        formatChatTime(
            chat.last_message_at ||
            chat.updated_at ||
            chat.created_at
        );


    const unread =
        Number(
            chat.unread_count || 0
        );


    item.innerHTML = `

        <div class="chat-item-avatar">

            <img
                src="${escapeHtml(avatar)}"
                alt="${escapeHtml(name)}"
                loading="lazy"
            >

        </div>


        <div class="chat-item-content">

            <div class="chat-item-top">

                <strong class="chat-item-name">
                    ${escapeHtml(name)}
                </strong>

                <span class="chat-item-time">
                    ${escapeHtml(time)}
                </span>

            </div>


            <div class="chat-item-bottom">

                <span class="chat-item-message">
                    ${escapeHtml(lastMessage)}
                </span>

                ${
                    unread > 0
                        ? `
                            <span class="chat-item-unread">
                                ${unread > 99 ? "99+" : unread}
                            </span>
                        `
                        : ""
                }

            </div>

        </div>

    `;


    item.addEventListener(
        "click",
        () => {

            openChat(chat);

        }
    );


    return item;

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatChatTime(value) {

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


    const now =
        new Date();


    const sameDay =
        date.toDateString() ===
        now.toDateString();


    if (sameDay) {

        return date.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    }


    return date.toLocaleDateString(
        [],
        {
            day: "numeric",
            month: "short"
        }
    );

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


    renderSelectedUser(
        chat
    );


    const app =
        document.querySelector(
            ".chat-app"
        );


    if (app) {

        app.classList.add(
            "chat-open"
        );

    }


    await loadMessages(
        chat
    );

}


/* =========================================================
   SELECTED USER
   ========================================================= */

function renderSelectedUser(chat) {

    const name =
        chat.name ||
        chat.username ||
        "Usanex User";


    const avatar =
        getPhoto(
            chat.profile_photo ||
            chat.avatar
        );


    const status =
        chat.online === true
            ? "Online"
            : (
                chat.status ||
                "Offline"
            );


    const selectedName =
        $("selectedName");


    if (selectedName) {

        selectedName.textContent =
            name;

    }


    const selectedAvatar =
        $("selectedAvatar");


    if (selectedAvatar) {

        selectedAvatar.src =
            avatar;

    }


    const selectedStatus =
        $("selectedStatus");


    if (selectedStatus) {

        selectedStatus.textContent =
            status;

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
        <div class="day-label">
            Today
        </div>

        <div class="chat-loading">
            Loading messages...
        </div>
    `;


    const chatId =
        chat.id ??
        chat.chat_id ??
        chat.user_id;


    if (!chatId) {

        renderMessages([]);

        return;

    }


    try {

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


        if (
            response.status === 401
        ) {

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


        chatState.messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        renderMessages(
            chatState.messages
        );


    } catch (error) {

        console.error(
            "Load messages:",
            error
        );


        /*
         * Do not break the chat page
         * if backend messaging endpoint
         * is not created yet.
         */

        renderMessages([]);

    }

}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages(messages) {

    const container =
        $("messages");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const day =
        document.createElement(
            "div"
        );


    day.className =
        "day-label";


    day.textContent =
        "Today";


    container.appendChild(
        day
    );


    if (!messages.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-chat";


        empty.innerHTML = `
            <strong>Start chatting</strong>
            Send a message to begin.
        `;


        container.appendChild(
            empty
        );


        return;

    }


    messages.forEach(
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


    const outgoing =
        message.is_mine === true ||
        message.sender_is_me === true;


    wrapper.className =
        outgoing
            ? "message outgoing"
            : "message incoming";


    const text =
        message.text ??
        message.content ??
        message.message ??
        "";


    const time =
        message.created_at
            ? formatMessageTime(
                message.created_at
            )
            : "";


    wrapper.innerHTML = `

        <span class="message-text">
            ${escapeHtml(text)}
        </span>

        ${
            time
                ? `
                    <span class="message-time">
                        ${escapeHtml(time)}
                        ${
                            outgoing
                                ? `
                                    <span class="message-status">
                                        ✓
                                    </span>
                                `
                                : ""
                        }
                    </span>
                `
                : ""
        }

    `;


    return wrapper;

}


/* =========================================================
   MESSAGE TIME
   ========================================================= */

function formatMessageTime(value) {

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
            hour: "numeric",
            minute: "2-digit"
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


    if (!composer || !input) {
        return;
    }


    composer.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const text =
                input.value.trim();


            if (!text) {
                return;
            }


            if (
                !chatState.selectedChat
            ) {

                return;

            }


            input.value = "";


            await sendMessage(
                text
            );

        }
    );


    /*
     * ENTER = SEND
     * SHIFT + ENTER = NEW LINE
     *
     * Input is single-line, so ENTER
     * directly sends the message.
     */

    input.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                composer.requestSubmit();

            }

        }
    );


    const emojiButton =
        $("emojiButton");


    if (emojiButton) {

        emojiButton.addEventListener(
            "click",
            () => {

                insertEmoji();

            }
        );

    }


    const attachButton =
        $("attachButton");


    const fileInput =
        $("fileInput");


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


        fileInput.addEventListener(
            "change",
            handleFiles
        );

    }


    const cameraButton =
        $("cameraButton");


    if (cameraButton) {

        cameraButton.addEventListener(
            "click",
            () => {

                openCamera();

            }
        );

    }

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage(text) {

    const chat =
        chatState.selectedChat;


    if (!chat) {
        return;
    }


    /*
     * Optimistic message
     */

    const temporaryMessage = {

        id:
            `temp-${Date.now()}`,

        content:
            text,

        text:
            text,

        is_mine:
            true,

        created_at:
            new Date().toISOString()

    };


    chatState.messages.push(
        temporaryMessage
    );


    renderMessages(
        chatState.messages
    );


    const chatId =
        chat.id ??
        chat.chat_id ??
        chat.user_id;


    if (!chatId) {
        return;
    }


    try {

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

                            message:
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

            throw new Error(
                "Message could not be sent."
            );

        }


        const data =
            await response.json();


        /*
         * Replace temporary message
         * with backend message.
         */

        if (data.message) {

            chatState.messages[
                chatState.messages.length - 1
            ] =
                data.message;


            renderMessages(
                chatState.messages
            );

        }


    } catch (error) {

        console.error(
            "Send message:",
            error
        );


        /*
         * Keep temporary message visible
         * so the UI doesn't suddenly lose it.
         */

        const messages =
            $("messages");


        if (messages) {

            const errorMessage =
                document.createElement(
                    "div"
                );


            errorMessage.style.cssText = `
                text-align:center;
                color:#ff7888;
                font-size:11px;
                margin:4px 0 8px;
            `;


            errorMessage.textContent =
                "Message could not be delivered.";


            messages.appendChild(
                errorMessage
            );


            scrollMessagesToBottom();

        }

    }

}


/* =========================================================
   EMOJI
   ========================================================= */

function insertEmoji() {

    const input =
        $("messageInput");


    if (!input) {
        return;
    }


    const emoji =
        "😊";


    const start =
        input.selectionStart ??
        input.value.length;


    const end =
        input.selectionEnd ??
        input.value.length;


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


    const cursor =
        start + emoji.length;


    input.setSelectionRange(
        cursor,
        cursor
    );

}


/* =========================================================
   FILE ATTACHMENT
   ========================================================= */

function handleFiles(event) {

    const files =
        Array.from(
            event.target.files || []
        );


    if (!files.length) {
        return;
    }


    files.forEach(
        (file) => {

            console.log(
                "Selected file:",
                file.name
            );

        }
    );


    /*
     * Actual server upload will be connected
     * when the media-message API is added.
     */


    event.target.value =
        "";

}


/* =========================================================
   CAMERA
   ========================================================= */

function openCamera() {

    const fileInput =
        $("fileInput");


    if (!fileInput) {
        return;
    }


    /*
     * On supported mobile browsers this
     * opens the camera.
     */

    fileInput.setAttribute(
        "capture",
        "environment"
    );


    fileInput.click();


    setTimeout(
        () => {

            fileInput.removeAttribute(
                "capture"
            );

        },
        1000
    );

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function setupBackButton() {

    const backButton =
        $("backButton");


    if (!backButton) {
        return;
    }


    backButton.addEventListener(
        "click",
        () => {

            closeChat();

        }
    );

}


/* =========================================================
   CLOSE CHAT
   ========================================================= */

function closeChat() {

    const app =
        document.querySelector(
            ".chat-app"
        );


    if (app) {

        app.classList.remove(
            "chat-open"
        );

    }


    chatState.selectedChat =
        null;

}


/* =========================================================
   HEADER BUTTONS
   ========================================================= */

function setupHeaderButtons() {

    const menuButton =
        $("menuButton");


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            () => {

                showChatMenu(
                    menuButton
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

                showConversationMenu(
                    conversationMenu
                );

            }
        );

    }

}


/* =========================================================
   CHAT MENU
   ========================================================= */

function showChatMenu(button) {

    removeExistingMenu();


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "chat-popup-menu";


    menu.innerHTML = `

        <button type="button">
            New chat
        </button>

        <button type="button">
            Mark all as read
        </button>

        <button type="button">
            Chat settings
        </button>

    `;


    document
        .querySelector(
            ".chat-sidebar"
        )
        ?.appendChild(
            menu
        );


    setTimeout(
        () => {

            document.addEventListener(
                "click",
                outsideMenuHandler,
                {
                    once: true
                }
            );

        },
        0
    );


    function outsideMenuHandler(event) {

        if (
            !menu.contains(
                event.target
            ) &&
            event.target !== button
        ) {

            menu.remove();

        }

    }

}


/* =========================================================
   CONVERSATION MENU
   ========================================================= */

function showConversationMenu(button) {

    removeExistingMenu();


    const header =
        document.querySelector(
            ".conversation-header"
        );


    if (!header) {
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
            Media, links and files
        </button>

        <button type="button">
            Clear chat
        </button>

        <button type="button">
            Block user
        </button>

    `;


    header.appendChild(
        menu
    );


    setTimeout(
        () => {

            document.addEventListener(
                "click",
                function handler(event) {

                    if (
                        !menu.contains(
                            event.target
                        ) &&
                        event.target !== button
                    ) {

                        menu.remove();

                        document.removeEventListener(
                            "click",
                            handler
                        );

                    }

                }
            );

        },
        0
    );

}


/* =========================================================
   REMOVE MENU
   ========================================================= */

function removeExistingMenu() {

    document
        .querySelectorAll(
            ".chat-popup-menu"
        )
        .forEach(
            (menu) => {

                menu.remove();

            }
        );

}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollMessagesToBottom() {

    const messages =
        $("messages");


    if (!messages) {
        return;
    }


    requestAnimationFrame(
        () => {

            messages.scrollTop =
                messages.scrollHeight;

        }
    );

}
