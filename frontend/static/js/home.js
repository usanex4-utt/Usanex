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
       HOME + BUTTON
    ===================================================== */

    let createSheet = null;

    function createCreateSheet() {

        if (createSheet) {
            return createSheet;
        }

        const overlay =
            document.createElement("div");

        overlay.id =
            "usanexCreateOverlay";

        overlay.className =
            "usanex-create-overlay";

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

        addCreateSheetStyles();

        return createSheet;
    }


    /* =====================================================
       CREATE SHEET CSS
       Injected from JS so home.css ko change
       karne ki zarurat nahi.
    ===================================================== */

    function addCreateSheetStyles() {

        if (
            document.getElementById(
                "usanexCreateSheetStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "usanexCreateSheetStyles";

        style.textContent = `

            .usanex-create-overlay {
                position: fixed;
                inset: 0;
                z-index: 99999;

                display: flex;
                align-items: flex-end;
                justify-content: center;

                background: rgba(0, 0, 0, 0.58);

                opacity: 0;
                visibility: hidden;

                transition:
                    opacity 0.25s ease,
                    visibility 0.25s ease;

                overscroll-behavior: contain;
            }


            .usanex-create-overlay.open {
                opacity: 1;
                visibility: visible;
            }


            .usanex-create-sheet {
                width: 100%;
                max-width: 650px;

                max-height: 72vh;

                background:
                    linear-gradient(
                        180deg,
                        #0d1d2d 0%,
                        #071322 100%
                    );

                border-top:
                    1px solid rgba(255,255,255,0.08);

                border-radius:
                    26px 26px 0 0;

                padding:
                    10px 18px
                    calc(20px + env(safe-area-inset-bottom))
                    18px;

                box-sizing: border-box;

                transform:
                    translateY(100%);

                transition:
                    transform 0.30s
                    cubic-bezier(.22,.61,.36,1);

                box-shadow:
                    0 -15px 45px
                    rgba(0,0,0,0.40);

                overflow-y: auto;

                -webkit-overflow-scrolling: touch;
            }


            .usanex-create-overlay.open
            .usanex-create-sheet {
                transform:
                    translateY(0);
            }


            .usanex-create-handle {
                width: 42px;
                height: 5px;

                margin:
                    2px auto 15px;

                border-radius: 20px;

                background:
                    rgba(255,255,255,0.28);
            }


            .usanex-create-header {
                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 15px;

                margin-bottom: 18px;
            }


            .usanex-create-header h2 {
                margin: 0;

                color: #ffffff;

                font-size: 25px;
                font-weight: 750;

                letter-spacing: -0.3px;
            }


            .usanex-create-header p {
                margin:
                    4px 0 0;

                color:
                    #91a2b5;

                font-size: 13px;
            }


            .usanex-create-close {
                width: 42px;
                height: 42px;

                flex: 0 0 42px;

                border: 0;
                border-radius: 50%;

                background:
                    rgba(255,255,255,0.07);

                color: #ffffff;

                font-size: 28px;
                line-height: 1;

                cursor: pointer;

                -webkit-tap-highlight-color:
                    transparent;
            }


            .usanex-create-close:active {
                transform: scale(0.94);
            }


            .usanex-create-options {
                display: flex;
                flex-direction: column;

                gap: 10px;
            }


            .usanex-create-option {
                width: 100%;

                min-height: 72px;

                display: flex;
                align-items: center;

                gap: 14px;

                padding:
                    12px 14px;

                border:
                    1px solid
                    rgba(255,255,255,0.07);

                border-radius: 18px;

                background:
                    rgba(255,255,255,0.035);

                color: #ffffff;

                text-align: left;

                cursor: pointer;

                transition:
                    transform 0.15s ease,
                    background 0.15s ease,
                    border-color 0.15s ease;

                -webkit-tap-highlight-color:
                    transparent;
            }


            .usanex-create-option:active {
                transform: scale(0.985);

                background:
                    rgba(30,145,255,0.13);

                border-color:
                    rgba(30,145,255,0.45);
            }


            .create-option-icon {
                width: 48px;
                height: 48px;

                flex: 0 0 48px;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 15px;

                font-size: 25px;
                font-weight: 700;

                color: #ffffff;
            }


            .reel-icon {
                background:
                    rgba(255,76,110,0.16);
            }


            .image-icon {
                background:
                    rgba(30,145,255,0.16);
            }


            .moment-icon {
                background:
                    rgba(76,210,145,0.15);
            }


            .private-icon {
                background:
                    rgba(175,110,255,0.16);
            }


            .create-option-text {
                min-width: 0;

                flex: 1;

                display: flex;
                flex-direction: column;

                gap: 3px;
            }


            .create-option-text strong {
                color: #ffffff;

                font-size: 17px;
                font-weight: 700;
            }


            .create-option-text small {
                color: #8fa1b4;

                font-size: 12px;

                line-height: 1.35;
            }


            .create-option-arrow {
                color:
                    #73879b;

                font-size: 28px;

                line-height: 1;

                padding-left: 5px;
            }


            body.usanex-create-open {
                overflow: hidden;
            }


            @media (min-width: 700px) {

                .usanex-create-sheet {
                    margin-bottom: 0;

                    border-radius:
                        28px 28px 0 0;
                }

            }

        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       OPEN CREATE SHEET
    ===================================================== */

    function openCreateSheet() {

        const sheet =
            createCreateSheet();

        sheet.classList.add("open");

        document.body.classList.add(
            "usanex-create-open"
        );

        const closeButton =
            $("usanexCreateClose");

        setTimeout(() => {

            closeButton?.focus();

        }, 250);
    }


    /* =====================================================
       CLOSE CREATE SHEET
    ===================================================== */

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
       CREATE OPTION ACTION
    ===================================================== */

    function handleCreateOption(type) {

    closeCreateSheet();

    if (type === "reel") {
        window.location.href = "/reel-upload";
        return;
    }

    if (type === "image") {
        go("/upload?type=image");
        return;
    }

    if (type === "private") {
        go("/upload?type=private");
        return;
    }

    if (type === "moment") {
        go("/status");
        return;
    }
    }


    /* =====================================================
       CREATE EVENTS
    ===================================================== */

    const headerPlus =
        $("headerPlus");

    headerPlus?.addEventListener(
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

            if (!type) {
                return;
            }

            handleCreateOption(type);
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

            if (
                event.key === "Escape"
            ) {

                closeCreateSheet();
            }
        }
    );


    /*
     * Android/browser back button
     * support.
     */
    window.addEventListener(
        "popstate",
        () => {

            closeCreateSheet();
        }
    );


    /*
     * Make Create available to other
     * page scripts if needed later.
     */
    window.UsanexCreate = {
        open: openCreateSheet,
        close: closeCreateSheet
    };


    /* =====================================================
       BOTTOM NAVIGATION
    ===================================================== */

    $("homeNav")?.addEventListener(
        "click",
        () => {
            go("/home");
        }
    );


    $("reelNav")?.addEventListener(
        "click",
        () => {
            go("/reels");
        }
    );


    $("searchNav")?.addEventListener(
        "click",
        () => {
            go("/search");
        }
    );


    $("notificationNav")?.addEventListener(
        "click",
        () => {
            go("/notifications");
        }
    );


    $("profileNav")?.addEventListener(
        "click",
        () => {
            go("/my-profile");
        }
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


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape"
            ) {

                closeSideMenu();
                closeCategoryPopup();
                closeCreateSheet();
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
       CHECK ACTUAL CONNECTION
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

        if (!status) {
            return true;
        }

        return (
            status === "connected" ||
            status === "accepted"
        );
    }


    /* =====================================================
       PERSONAL CATEGORY
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
       FILTER USERS
    ===================================================== */

    function getFilteredUsers() {

        if (
            currentCategory === "all"
        ) {

            return allConnectedUsers.filter(
                (item) => {

                    const category =
                        getUserCategory(item);

                    return (
                        category !== "friend" &&
                        category !== "friends" &&
                        category !== "family"
                    );
                }
            );
        }


        if (
            currentCategory === "friend"
        ) {

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


        if (
            currentCategory === "family"
        ) {

            return allConnectedUsers.filter(
                (item) => {

                    const category =
                        getUserCategory(item);

                    return (
                        category === "family"
                    );
                }
            );
        }


        if (
            currentCategory === "couple"
        ) {

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

        if (
            currentCategory === "all"
        ) {

            connectedTitle.textContent =
                "All Connected";

        } else if (
            currentCategory === "friend"
        ) {

            connectedTitle.textContent =
                "Friends";

        } else if (
            currentCategory === "family"
        ) {

            connectedTitle.textContent =
                "Family";

        } else if (
            currentCategory === "couple"
        ) {

            connectedTitle.textContent =
                "Couple Chat";
        }
    }


    /* =====================================================
       EMPTY MESSAGE
    ===================================================== */

    function renderEmptyMessage() {

        if (!connectedList) {
            return;
        }

        let message =
            "No connected people yet.";

        if (
            currentCategory === "friend"
        ) {

            message =
                "No friends added yet.";

        } else if (
            currentCategory === "family"
        ) {

            message =
                "No family members added yet.";

        } else if (
            currentCategory === "couple"
        ) {

            message =
                "No couple chat connection yet.";
        }

        connectedList.innerHTML = `
            <div class="connected-empty">
                ${escapeHtml(message)}
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
            document.createElement("div");

        friendButton.className =
            "simple-category-option friend-option";

        friendButton.textContent =
            "Friend";

        friendButton.setAttribute(
            "role",
            "button"
        );

        friendButton.setAttribute(
            "tabindex",
            "0"
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


        friendButton.addEventListener(
            "keydown",
            async (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    await handleCategorySelection(
                        userId,
                        "friend"
                    );
                }
            }
        );


        box.appendChild(
            friendButton
        );


        /* FAMILY */

        const familyButton =
            document.createElement("div");

        familyButton.className =
            "simple-category-option family-option";

        familyButton.textContent =
            "Family";

        familyButton.setAttribute(
            "role",
            "button"
        );

        familyButton.setAttribute(
            "tabindex",
            "0"
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


        familyButton.addEventListener(
            "keydown",
            async (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    await handleCategorySelection(
                        userId,
                        "family"
                    );
                }
            }
        );


        box.appendChild(
            familyButton
        );


        /* REMOVE */

        if (
            currentUserCategory === "friend" ||
            currentUserCategory === "friends" ||
            currentUserCategory === "family"
        ) {

            const removeButton =
                document.createElement("div");

            removeButton.className =
                "simple-category-option remove-option";

            removeButton.textContent =
                "Remove";

            removeButton.setAttribute(
                "role",
                "button"
            );

            removeButton.setAttribute(
                "tabindex",
                "0"
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


            removeButton.addEventListener(
                "keydown",
                async (event) => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        await handleCategorySelection(
                            userId,
                            ""
                        );
                    }
                }
            );


            box.appendChild(
                removeButton
            );
        }


        /* CANCEL */

        const cancelButton =
            document.createElement("div");

        cancelButton.className =
            "simple-category-option cancel-option";

        cancelButton.textContent =
            "Cancel";

        cancelButton.setAttribute(
            "role",
            "button"
        );

        cancelButton.setAttribute(
            "tabindex",
            "0"
        );


        cancelButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                closeCategoryPopup();
            }
        );


        cancelButton.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    closeCategoryPopup();
                }
            }
        );


        box.appendChild(
            cancelButton
        );


        overlay.appendChild(box);


        overlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeCategoryPopup();
                }
            }
        );


        document.body.appendChild(
            overlay
        );


        categoryPopup =
            overlay;


        document.body.classList.add(
            "category-popup-open"
        );


        setTimeout(() => {

            friendButton.focus();

        }, 50);
    }


    /* =====================================================
       SAVE PERSONAL CATEGORY
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

                            credentials:
                                "include",

                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                if (
                    response.status === 401
                ) {

                    go("/login");

                    return false;
                }


                if (!response.ok) {

                    throw new Error(
                        "Category remove failed: " +
                        response.status
                    );
                }


                return true;
            }


            const response =
                await fetch(
                    "/api/connections/category",
                    {
                        method: "POST",

                        credentials:
                            "include",

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


            if (
                response.status === 401
            ) {

                go("/login");

                return false;
            }


            if (!response.ok) {

                let errorMessage =
                    "Unable to update category";

                try {

                    const errorData =
                        await response.json();

                    if (
                        errorData &&
                        errorData.detail
                    ) {

                        errorMessage =
                            errorData.detail;
                    }

                } catch (_) {}


                throw new Error(
                    errorMessage
                );
            }


            return true;

        } catch (error) {

            console.error(
                "Personal category error:",
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
       HANDLE CATEGORY SELECTION
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
                        getConnectionUser(
                            item
                        );


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
       LONG PRESS HANDLER
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

        let longPressTriggered =
            false;

        let pointerDown =
            false;

        const LONG_PRESS_TIME =
            600;


        function clearPressTimer() {

            if (pressTimer) {

                clearTimeout(
                    pressTimer
                );

                pressTimer = null;
            }
        }


        function startLongPress(event) {

            if (
                !userId ||
                !isConnected
            ) {
                return;
            }


            if (
                event.pointerType ===
                    "mouse" &&
                event.button !== 0
            ) {

                return;
            }


            pointerDown = true;

            longPressTriggered =
                false;

            clearPressTimer();


            pressTimer =
                setTimeout(
                    () => {

                        if (!pointerDown) {
                            return;
                        }


                        longPressTriggered =
                            true;


                        if (
                            window.getSelection
                        ) {

                            const selection =
                                window.getSelection();

                            if (selection) {

                                selection
                                    .removeAllRanges();
                            }
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
                    event.pointerType ===
                    "mouse"
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
    }


    /* =====================================================
       GET CURRENT CATEGORY
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
                        String(
                            currentUserId
                        ) ===
                        String(userId)
                    );
                }
            );


        return getUserCategory(item);
    }


    /* =====================================================
       OPEN CONNECTED USER PROFILE
    ===================================================== */

    function openConnectedUserProfile(
        userId
    ) {

        if (!userId) {
            return;
        }

        go(
            "/profile?user_id=" +
            encodeURIComponent(
                userId
            )
        );
    }


    /* =====================================================
       OPEN CONNECTED USER CHAT
    ===================================================== */

    function openConnectedUserChat(
        userId
    ) {

        if (!userId) {
            return;
        }

        go(
            "/chat?user_id=" +
            encodeURIComponent(
                userId
            )
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


        connectedList.innerHTML =
            "";


        if (connectedCount) {

            connectedCount.textContent =
                String(users.length);
        }


        connectedSection.hidden =
            false;


        if (users.length === 0) {

            renderEmptyMessage();

            return;
        }


        users.forEach(
            (item) => {

                if (
                    !isConnectedUser(item)
                ) {
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


                card.style.userSelect =
                    "none";


                card.style.webkitUserSelect =
                    "none";


                card.style.touchAction =
                    "manipulation";


                /* AVATAR */

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
                            >
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


                /* INFO */

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


                /* ARROW */

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


                /* DP = PROFILE */

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
                                event.key ===
                                    "Enter" ||
                                event.key ===
                                    " "
                            ) {

                                openProfile(
                                    event
                                );
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


                /* CARD = CHAT */

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


                        if (
                            categoryPopup
                        ) {

                            return;
                        }


                        openConnectedUserChat(
                            userId
                        );
                    }
                );


                /* LONG PRESS */

                addLongPressToCard(
                    card,
                    userId,
                    name,
                    true
                );


                connectedList.appendChild(
                    card
                );
            }
        );
    }


    /* =====================================================
       SHOW CATEGORY
    ===================================================== */

    function showCategory(
        category
    ) {

        currentCategory =
            category;

        closeSideMenu();

        renderConnectedPeople();


        if (connectedSection) {

            connectedSection.hidden =
                false;


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
       MENU - ALL CONNECTED
    ===================================================== */

    $("menuAllConnected")?.addEventListener(
        "click",
        () => {

            showCategory("all");
        }
    );


    /* =====================================================
       MENU - FAMILY
    ===================================================== */

    $("menuFamily")?.addEventListener(
        "click",
        () => {

            showCategory("family");
        }
    );


    /* =====================================================
       MENU - FRIENDS
    ===================================================== */

    $("menuFriends")?.addEventListener(
        "click",
        () => {

            showCategory("friend");
        }
    );


    /* =====================================================
       MENU - COUPLE CHAT
    ===================================================== */

    $("menuCoupleChat")?.addEventListener(
        "click",
        () => {

            showCategory("couple");
        }
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

                button.disabled =
                    true;
            }


            try {

                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST",

                        credentials:
                            "include"
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
       NEX MOMENT SEE ALL
    ===================================================== */

    $("momentSeeAll")?.addEventListener(
        "click",
        () => {

            /*
             * Existing Nex Moment page.
             */
            go("/status");
        }
    );


    /* =====================================================
       LOAD CONNECTED PEOPLE
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


            if (
                response.status === 401
            ) {

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


            if (
                Array.isArray(data)
            ) {

                users = data;

            } else if (
                Array.isArray(
                    data.connections
                )
            ) {

                users =
                    data.connections;

            } else if (
                Array.isArray(
                    data.users
                )
            ) {

                users =
                    data.users;

            } else if (
                Array.isArray(
                    data.data
                )
            ) {

                users =
                    data.data;
            }


            allConnectedUsers =
                users.filter(
                    (item) =>
                        isConnectedUser(
                            item
                        )
                );


            currentCategory =
                "all";


            renderConnectedPeople();

        } catch (error) {

            console.error(
                "Connected people error:",
                error
            );


            allConnectedUsers =
                [];


            currentCategory =
                "all";


            renderConnectedPeople();
        }
    }


    /* =====================================================
       START
    ===================================================== */

    loadConnectedPeople();


    console.log(
        "Usanex Home loaded - Create sheet enabled."
    );

});
