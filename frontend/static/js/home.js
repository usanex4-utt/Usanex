"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    const $ = (id) => document.getElementById(id);

    function go(url) {
        window.location.href = url;
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getInitial(name) {
        if (!name) {
            return "U";
        }

        return String(name)
            .trim()
            .charAt(0)
            .toUpperCase();
    }


    /* =====================================================
       CREATE SHEET
    ===================================================== */

    let createSheet = null;

    function createCreateSheet() {

        if (createSheet) {
            return createSheet;
        }

        const overlay = document.createElement("div");

        overlay.id = "usanexCreateOverlay";
        overlay.className = "usanex-create-overlay";

        overlay.innerHTML = `

            <div
                class="usanex-create-sheet"
                role="dialog"
                aria-modal="true"
                aria-label="Create"
            >

                <div class="usanex-create-handle"></div>

                <div class="usanex-create-header">

                    <div>
                        <h2>Create</h2>
                        <p>What do you want to create?</p>
                    </div>

                    <button
                        type="button"
                        class="usanex-create-close"
                        id="usanexCreateClose"
                        aria-label="Close Create"
                    >
                        ×
                    </button>

                </div>

                <div class="usanex-create-options">

                    <button
                        type="button"
                        class="usanex-create-option"
                        data-create-type="reel"
                    >

                        <span class="create-option-icon reel-icon">
                            ▶
                        </span>

                        <span class="create-option-text">
                            <strong>Reel</strong>
                            <small>Create a short video</small>
                        </span>

                        <span class="create-option-arrow">
                            ›
                        </span>

                    </button>


                    <button
                        type="button"
                        class="usanex-create-option"
                        data-create-type="image"
                    >

                        <span class="create-option-icon image-icon">
                            ▧
                        </span>

                        <span class="create-option-text">
                            <strong>Image</strong>
                            <small>Share photos with people</small>
                        </span>

                        <span class="create-option-arrow">
                            ›
                        </span>

                    </button>


                    <button
                        type="button"
                        class="usanex-create-option"
                        data-create-type="moment"
                    >

                        <span class="create-option-icon moment-icon">
                            ◉
                        </span>

                        <span class="create-option-text">
                            <strong>Nex Moment</strong>
                            <small>Share a moment with your connections</small>
                        </span>

                        <span class="create-option-arrow">
                            ›
                        </span>

                    </button>


                    <button
                        type="button"
                        class="usanex-create-option"
                        data-create-type="private"
                    >

                        <span class="create-option-icon private-icon">
                            ◈
                        </span>

                        <span class="create-option-text">
                            <strong>Private</strong>
                            <small>Share media privately</small>
                        </span>

                        <span class="create-option-arrow">
                            ›
                        </span>

                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        createSheet = overlay;

        return createSheet;
    }


    /* =====================================================
       CREATE SHEET
    ===================================================== */

    function openCreateSheet() {

        const sheet = createCreateSheet();

        sheet.classList.add("open");

        document.body.classList.add(
            "usanex-create-open"
        );
    }


    function closeCreateSheet() {

        if (!createSheet) {
            return;
        }

        createSheet.classList.remove("open");

        document.body.classList.remove(
            "usanex-create-open"
        );
    }


    /* =====================================================
       CREATE ACTION
    ===================================================== */

    function handleCreateOption(type) {

        closeCreateSheet();

        if (type === "reel") {
            go("/reel-upload");
            return;
        }

        if (type === "image") {
            go("/upload?type=image");
            return;
        }

        if (type === "moment") {
            go("/status");
            return;
        }

        if (type === "private") {
            go("/upload?type=private");
            return;
        }
    }


    /* =====================================================
       CREATE EVENTS
    ===================================================== */

    $("headerPlus")?.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            openCreateSheet();
        }
    );


    document.addEventListener(
        "click",
        (event) => {

            const option =
                event.target.closest(
                    ".usanex-create-option"
                );

            if (!option) {
                return;
            }

            const type =
                option.dataset.createType;

            if (type) {
                handleCreateOption(type);
            }
        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                event.target.id ===
                "usanexCreateClose"
            ) {

                closeCreateSheet();

                return;
            }

            if (
                event.target.id ===
                "usanexCreateOverlay"
            ) {

                closeCreateSheet();
            }
        }
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {
                closeCreateSheet();
            }
        }
    );


    window.UsanexCreate = {
        open: openCreateSheet,
        close: closeCreateSheet
    };


    /* =====================================================
       BOTTOM NAVIGATION
    ===================================================== */

    $("homeNav")?.addEventListener(
        "click",
        () => go("/home")
    );

    $("reelNav")?.addEventListener(
        "click",
        () => go("/reels")
    );

    $("searchNav")?.addEventListener(
        "click",
        () => go("/search")
    );

    $("notificationNav")?.addEventListener(
        "click",
        () => go("/notifications")
    );

    $("profileNav")?.addEventListener(
        "click",
        () => go("/my-profile")
    );


    /* =====================================================
       SIDE MENU
    ===================================================== */

    const menuButton =
        $("menuButton");

    const menuOverlay =
        $("menuOverlay");

    const closeMenu =
        $("closeMenu");


    function openMenu() {

        if (!menuOverlay) {
            return;
        }

        closeCreateSheet();

        menuOverlay.hidden = false;

        document.body.classList.add(
            "menu-open"
        );
    }


    function closeSideMenu() {

        if (!menuOverlay) {
            return;
        }

        menuOverlay.hidden = true;

        document.body.classList.remove(
            "menu-open"
        );
    }


    menuButton?.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            openMenu();
        }
    );


    closeMenu?.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            closeSideMenu();
        }
    );


    menuOverlay?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                menuOverlay
            ) {

                closeSideMenu();
            }
        }
    );


    /* =====================================================
       CONNECTION SECTION
    ===================================================== */

    const connectedSection =
        $("connectedPeopleSection");

    const connectedList =
        $("connectedPeopleList");

    const connectedCount =
        $("connectedPeopleCount");

    const connectedTitle =
        $("connectedSectionTitle");


    let allConnectedUsers = [];

    let currentCategory = "all";


    /* =====================================================
       CONNECTION USER
    ===================================================== */

    function getConnectionUser(item) {

        if (!item) {
            return {};
        }

        return (
            item.user ||
            item.connected_user ||
            item.person ||
            item
        );
    }


    /* =====================================================
       CONNECTION STATUS
    ===================================================== */

    function isConnectedUser(item) {

        if (!item) {
            return false;
        }

        const user =
            getConnectionUser(item);

        const status =
            String(
                item.connection_status ??
                item.status ??
                user.connection_status ??
                user.status ??
                "connected"
            )
                .trim()
                .toLowerCase();

        return (
            status === "connected" ||
            status === "accepted" ||
            status === ""
        );
    }


    /* =====================================================
       CATEGORY
    ===================================================== */

    function getUserCategory(item) {

        if (!item) {
            return "";
        }

        const user =
            getConnectionUser(item);

        const category =
            item.category ??
            item.connection_category ??
            item.personal_category ??
            user.category ??
            user.connection_category ??
            user.personal_category ??
            "";

        return String(category || "")
            .trim()
            .toLowerCase();
    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredUsers() {

        if (currentCategory === "all") {

            return allConnectedUsers.filter(
                (item) => {

                    const category =
                        getUserCategory(item);

                    return (
                        category !== "friend" &&
                        category !== "friends" &&
                        category !== "family" &&
                        category !== "couple" &&
                        category !== "couple_chat" &&
                        category !== "couple-chat" &&
                        category !== "couple chat"
                    );
                }
            );
        }


        if (currentCategory === "friend") {

            return allConnectedUsers.filter(
                (item) => {

                    const category =
                        getUserCategory(item);

                    return (
                        category === "friend" ||
                        category === "friends"
                    );
                }
            );
        }


        if (currentCategory === "family") {

            return allConnectedUsers.filter(
                (item) => {

                    return (
                        getUserCategory(item) ===
                        "family"
                    );
                }
            );
        }


        if (currentCategory === "couple") {

            return allConnectedUsers.filter(
                (item) => {

                    const category =
                        getUserCategory(item);

                    return (
                        category === "couple" ||
                        category === "couple_chat" ||
                        category === "couple-chat" ||
                        category === "couple chat"
                    );
                }
            );
        }

        return [];
    }


    /* =====================================================
       SECTION TITLE
    ===================================================== */

    function updateSectionTitle() {

        if (!connectedTitle) {
            return;
        }

        const titles = {
            all: "All Connected",
            friend: "Friends",
            family: "Family",
            couple: "Couple Chat"
        };

        connectedTitle.textContent =
            titles[currentCategory] ||
            "All Connected";
    }


    /* =====================================================
       EMPTY
    ===================================================== */

    function renderEmptyMessage() {

        if (!connectedList) {
            return;
        }

        const messages = {
            all: "No connected people yet.",
            friend: "No friends added yet.",
            family: "No family members added yet.",
            couple: "No couple chat connection yet."
        };

        connectedList.innerHTML = `
            <div class="connected-empty">
                ${escapeHtml(
                    messages[currentCategory] ||
                    messages.all
                )}
            </div>
        `;
    }


    /* =====================================================
       CATEGORY POPUP
    ===================================================== */

    let categoryPopup = null;


    function closeCategoryPopup() {

        if (!categoryPopup) {
            return;
        }

        categoryPopup.remove();

        categoryPopup = null;

        document.body.classList.remove(
            "category-popup-open"
        );
    }


    function createCategoryPopup(
        userId,
        userName,
        currentUserCategory
    ) {

        closeCategoryPopup();

        const overlay =
            document.createElement("div");

        overlay.className =
            "personal-category-overlay";

        overlay.setAttribute(
            "role",
            "dialog"
        );

        overlay.setAttribute(
            "aria-modal",
            "true"
        );


        const box =
            document.createElement("div");

        box.className =
            "personal-category-popup";


        const title =
            document.createElement("div");

        title.className =
            "simple-category-title";

        title.textContent =
            "Choose category";

        box.appendChild(title);


        /* FRIEND */

        const friendButton =
            createCategoryButton(
                "Friend",
                "friend-option"
            );

        friendButton.addEventListener(
            "click",
            async (event) => {

                event.stopPropagation();

                await handleCategorySelection(
                    userId,
                    "friend"
                );
            }
        );

        box.appendChild(friendButton);


        /* FAMILY */

        const familyButton =
            createCategoryButton(
                "Family",
                "family-option"
            );

        familyButton.addEventListener(
            "click",
            async (event) => {

                event.stopPropagation();

                await handleCategorySelection(
                    userId,
                    "family"
                );
            }
        );

        box.appendChild(familyButton);


        /* COUPLE CHAT */

        const coupleButton =
            createCategoryButton(
                "Couple Chat",
                "couple-option"
            );

        coupleButton.addEventListener(
            "click",
            async (event) => {

                event.stopPropagation();

                await handleCategorySelection(
                    userId,
                    "couple"
                );
            }
        );

        box.appendChild(coupleButton);


        /* REMOVE */

        if (
            currentUserCategory === "friend" ||
            currentUserCategory === "friends" ||
            currentUserCategory === "family" ||
            currentUserCategory === "couple" ||
            currentUserCategory === "couple_chat" ||
            currentUserCategory === "couple-chat" ||
            currentUserCategory === "couple chat"
        ) {

            const removeButton =
                createCategoryButton(
                    "Remove",
                    "remove-option"
                );

            removeButton.addEventListener(
                "click",
                async (event) => {

                    event.stopPropagation();

                    await handleCategorySelection(
                        userId,
                        ""
                    );
                }
            );

            box.appendChild(removeButton);
        }


        /* CANCEL */

        const cancelButton =
            createCategoryButton(
                "Cancel",
                "cancel-option"
            );

        cancelButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                closeCategoryPopup();
            }
        );

        box.appendChild(cancelButton);


        overlay.appendChild(box);

        overlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === overlay
                ) {

                    closeCategoryPopup();
                }
            }
        );


        document.body.appendChild(overlay);

        categoryPopup = overlay;

        document.body.classList.add(
            "category-popup-open"
        );


        setTimeout(() => {
            friendButton.focus();
        }, 50);
    }


    function createCategoryButton(
        text,
        className
    ) {

        const button =
            document.createElement("div");

        button.className =
            `simple-category-option ${className}`;

        button.textContent =
            text;

        button.setAttribute(
            "role",
            "button"
        );

        button.setAttribute(
            "tabindex",
            "0"
        );


        button.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    button.click();
                }
            }
        );

        return button;
    }


    /* =====================================================
       SAVE CATEGORY
    ===================================================== */

    async function savePersonalCategory(
        connectedUserId,
        category
    ) {

        if (!connectedUserId) {
            return false;
        }

        try {

            if (
                !category ||
                category === "all" ||
                category === "none"
            ) {

                const response =
                    await fetch(
                        "/api/connections/category/" +
                        encodeURIComponent(
                            connectedUserId
                        ),
                        {
                            method: "DELETE",
                            credentials: "include",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                if (response.status === 401) {
                    go("/login");
                    return false;
                }


                if (!response.ok) {
                    throw new Error(
                        "Category remove failed"
                    );
                }

                return true;
            }


            const response =
                await fetch(
                    "/api/connections/category",
                    {
                        method: "POST",
                        credentials: "include",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body: JSON.stringify({
                            connected_user_id:
                                connectedUserId,

                            category:
                                category
                        })
                    }
                );


            if (response.status === 401) {
                go("/login");
                return false;
            }


            if (!response.ok) {

                let message =
                    "Unable to update category";

                try {

                    const data =
                        await response.json();

                    if (data?.detail) {
                        message =
                            data.detail;
                    }

                } catch (_) {}

                throw new Error(message);
            }


            return true;

        } catch (error) {

            console.error(
                "Category error:",
                error
            );

            alert(
                error.message ||
                "Unable to update category."
            );

            return false;
        }
    }


    /* =====================================================
       CATEGORY SELECTION
    ===================================================== */

    async function handleCategorySelection(
        userId,
        newCategory
    ) {

        if (!userId) {
            return;
        }

        const success =
            await savePersonalCategory(
                userId,
                newCategory
            );

        if (!success) {
            return;
        }

        updateLocalUserCategory(
            userId,
            newCategory
        );

        closeCategoryPopup();

        renderConnectedPeople();
    }


    /* =====================================================
       UPDATE LOCAL CATEGORY
    ===================================================== */

    function updateLocalUserCategory(
        connectedUserId,
        category
    ) {

        allConnectedUsers =
            allConnectedUsers.map(
                (item) => {

                    const user =
                        getConnectionUser(item);

                    const itemUserId =
                        user.user_id ||
                        item.user_id ||
                        "";

                    if (
                        String(itemUserId) !==
                        String(connectedUserId)
                    ) {
                        return item;
                    }

                    return {
                        ...item,

                        category:
                            category || null,

                        connection_category:
                            category || null,

                        personal_category:
                            category || null
                    };
                }
            );
    }


    /* =====================================================
       CURRENT CATEGORY
    ===================================================== */

    function getCurrentCategoryForUser(
        userId
    ) {

        const item =
            allConnectedUsers.find(
                (connection) => {

                    const user =
                        getConnectionUser(
                            connection
                        );

                    const currentUserId =
                        user.user_id ||
                        connection.user_id ||
                        "";

                    return (
                        String(currentUserId) ===
                        String(userId)
                    );
                }
            );

        return getUserCategory(item);
    }


    /* =====================================================
       LONG PRESS
    ===================================================== */

    function addLongPressToCard(
        card,
        userId,
        userName,
        isConnected
    ) {

        if (!isConnected) {
            return;
        }

        let pressTimer = null;

        let pointerDown = false;

        let longPressTriggered = false;

        const LONG_PRESS_TIME = 600;


        function clearPressTimer() {

            if (pressTimer) {

                clearTimeout(
                    pressTimer
                );

                pressTimer = null;
            }
        }


        function startLongPress(event) {

            if (!userId || !isConnected) {
                return;
            }


            if (
                event.pointerType === "mouse" &&
                event.button !== 0
            ) {
                return;
            }


            pointerDown = true;

            longPressTriggered = false;

            clearPressTimer();


            card.classList.remove(
                "long-press-active"
            );


            pressTimer =
                setTimeout(
                    () => {

                        if (!pointerDown) {
                            return;
                        }


                        longPressTriggered =
                            true;


                        card.classList.add(
                            "long-press-active"
                        );


                        if (window.getSelection) {

                            const selection =
                                window.getSelection();

                            selection?.removeAllRanges();
                        }


                        createCategoryPopup(
                            userId,
                            userName,
                            getCurrentCategoryForUser(
                                userId
                            )
                        );

                    },
                    LONG_PRESS_TIME
                );
        }


        function endLongPress() {

            pointerDown = false;

            clearPressTimer();

            setTimeout(
                () => {

                    card.classList.remove(
                        "long-press-active"
                    );

                },
                100
            );
        }


        card.addEventListener(
            "pointerdown",
            startLongPress
        );


        card.addEventListener(
            "pointerup",
            endLongPress
        );


        card.addEventListener(
            "pointercancel",
            endLongPress
        );


        card.addEventListener(
            "pointerleave",
            (event) => {

                if (
                    event.pointerType === "mouse"
                ) {

                    endLongPress();
                }
            }
        );


        card.addEventListener(
            "contextmenu",
            (event) => {

                event.preventDefault();
            }
        );


        card.addEventListener(
            "click",
            (event) => {

                if (longPressTriggered) {

                    event.preventDefault();

                    event.stopPropagation();

                    longPressTriggered = false;
                }
            },
            true
        );
    }


    /* =====================================================
       OPEN PROFILE
    ===================================================== */

    function openConnectedUserProfile(
        userId
    ) {

        if (!userId) {
            return;
        }

        go(
            "/profile?user_id=" +
            encodeURIComponent(userId)
        );
    }


    /* =====================================================
       OPEN CHAT
    ===================================================== */

    function openConnectedUserChat(
        userId
    ) {

        if (!userId) {
            return;
        }

        go(
            "/chat?user_id=" +
            encodeURIComponent(userId)
        );
    }


    /* =====================================================
       RENDER CONNECTED PEOPLE
    ===================================================== */

    function renderConnectedPeople() {

        if (
            !connectedSection ||
            !connectedList
        ) {
            return;
        }


        updateSectionTitle();


        const users =
            getFilteredUsers();


        connectedList.innerHTML = "";


        if (connectedCount) {

            connectedCount.textContent =
                String(users.length);
        }


        connectedSection.hidden = false;


        if (users.length === 0) {

            renderEmptyMessage();

            return;
        }


        users.forEach(
            (item) => {

                if (!isConnectedUser(item)) {
                    return;
                }


                const user =
                    getConnectionUser(item);


                const name =
                    user.name ||
                    user.full_name ||
                    "User";


                const username =
                    user.username ||
                    "";


                const userId =
                    user.user_id ||
                    item.user_id ||
                    "";


                const photo =
                    user.profile_photo ||
                    item.profile_photo ||
                    "";


                const category =
                    getUserCategory(item);


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "connected-person-card";


                if (userId) {
                    card.dataset.userId =
                        userId;
                }


                card.style.userSelect = "none";

                card.style.webkitUserSelect =
                    "none";

                card.style.touchAction =
                    "manipulation";


                /* =================================================
                   AVATAR
                ================================================= */

                let avatarHtml;


                if (photo) {

                    avatarHtml = `
                        <div
                            class="connected-person-avatar"
                            role="button"
                            tabindex="0"
                            aria-label="Open ${escapeHtml(name)} profile"
                        >

                            <img
                                src="${escapeHtml(photo)}"
                                alt="${escapeHtml(name)}"
                                draggable="false"
                            />

                        </div>
                    `;

                } else {

                    avatarHtml = `
                        <div
                            class="connected-person-avatar"
                            role="button"
                            tabindex="0"
                            aria-label="Open ${escapeHtml(name)} profile"
                        >
                            ${escapeHtml(
                                getInitial(name)
                            )}
                        </div>
                    `;
                }


                /* =================================================
                   CATEGORY LABEL
                ================================================= */

                let categoryLabel = "";

                if (category === "friend" ||
                    category === "friends") {

                    categoryLabel =
                        "Friend";

                } else if (
                    category === "family"
                ) {

                    categoryLabel =
                        "Family";

                } else if (
                    category === "couple" ||
                    category === "couple_chat" ||
                    category === "couple-chat" ||
                    category === "couple chat"
                ) {

                    categoryLabel =
                        "Couple Chat";
                }


                /* =================================================
                   INFO
                ================================================= */

                const infoHtml = `
                    <div class="connected-person-info">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        ${
                            username
                                ? `
                                    <span>
                                        @${escapeHtml(username)}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            userId
                                ? `
                                    <small>
                                        ${escapeHtml(userId)}
                                    </small>
                                  `
                                : ""
                        }

                    </div>
                `;


                /* =================================================
                   ARROW
                ================================================= */

                const arrowHtml = `
                    <div
                        class="connected-person-arrow"
                        aria-hidden="true"
                    >
                        ›
                    </div>
                `;


                card.innerHTML =
                    avatarHtml +
                    infoHtml +
                    arrowHtml;


                /* =================================================
                   PROFILE
                ================================================= */

                const avatar =
                    card.querySelector(
                        ".connected-person-avatar"
                    );


                if (avatar) {

                    const openProfile =
                        (event) => {

                            event.preventDefault();

                            event.stopPropagation();

                            openConnectedUserProfile(
                                userId
                            );
                        };


                    avatar.addEventListener(
                        "click",
                        openProfile
                    );


                    avatar.addEventListener(
                        "keydown",
                        (event) => {

                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {

                                openProfile(event);
                            }
                        }
                    );


                    avatar.addEventListener(
                        "contextmenu",
                        (event) => {

                            event.preventDefault();

                            event.stopPropagation();
                        }
                    );
                }


                /* =================================================
                   CARD = CHAT
                ================================================= */

                card.addEventListener(
                    "click",
                    (event) => {

                        if (
                            event.target.closest(
                                ".connected-person-avatar"
                            )
                        ) {
                            return;
                        }


                        if (categoryPopup) {
                            return;
                        }


                        openConnectedUserChat(
                            userId
                        );
                    }
                );


                /* =================================================
                   LONG PRESS
                ================================================= */

                addLongPressToCard(
                    card,
                    userId,
                    name,
                    true
                );


                connectedList.appendChild(card);
            }
        );
    }


    /* =====================================================
       SHOW CATEGORY
    ===================================================== */

    function showCategory(category) {

        currentCategory = category;

        closeSideMenu();

        renderConnectedPeople();


        if (connectedSection) {

            connectedSection.hidden = false;

            setTimeout(
                () => {

                    connectedSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                },
                50
            );
        }
    }


    /* =====================================================
       MENU CATEGORY
    ===================================================== */

    $("menuAllConnected")?.addEventListener(
        "click",
        () => showCategory("all")
    );


    $("menuFamily")?.addEventListener(
        "click",
        () => showCategory("family")
    );


    $("menuFriends")?.addEventListener(
        "click",
        () => showCategory("friend")
    );


    $("menuCoupleChat")?.addEventListener(
        "click",
        () => showCategory("couple")
    );


    /* =====================================================
       SETTINGS
    ===================================================== */

    $("menuSettings")?.addEventListener(
        "click",
        () => {

            closeSideMenu();

            go("/settings");
        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

    $("logoutButton")?.addEventListener(
        "click",
        async () => {

            const button =
                $("logoutButton");


            if (button) {
                button.disabled = true;
            }


            try {

                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            } finally {

                go("/login");
            }
        }
    );


    /* =====================================================
       NEX MOMENT
    ===================================================== */

    $("momentSeeAll")?.addEventListener(
        "click",
        () => go("/status")
    );


    /* =====================================================
       LOAD CONNECTIONS
    ===================================================== */

    async function loadConnectedPeople() {

        try {

            const response =
                await fetch(
                    "/api/connections",
                    {
                        method: "GET",

                        credentials:
                            "include",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (response.status === 401) {

                go("/login");

                return;
            }


            if (!response.ok) {

                throw new Error(
                    "Connections request failed: " +
                    response.status
                );
            }


            const data =
                await response.json();


            let users = [];


            if (Array.isArray(data)) {

                users = data;

            } else if (
                Array.isArray(data.connections)
            ) {

                users =
                    data.connections;

            } else if (
                Array.isArray(data.users)
            ) {

                users =
                    data.users;

            } else if (
                Array.isArray(data.data)
            ) {

                users =
                    data.data;
            }


            allConnectedUsers =
                users.filter(
                    (item) =>
                        isConnectedUser(item)
                );


            currentCategory = "all";


            renderConnectedPeople();

        } catch (error) {

            console.error(
                "Connected people error:",
                error
            );


            allConnectedUsers = [];

            currentCategory = "all";

            renderConnectedPeople();
        }
    }


    /* =====================================================
       GLOBAL ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key !== "Escape") {
                return;
            }

            closeSideMenu();

            closeCategoryPopup();

            closeCreateSheet();
        }
    );


    /* =====================================================
       START
    ===================================================== */

    loadConnectedPeople();


    console.log(
        "Usanex Home loaded successfully."
    );

});
