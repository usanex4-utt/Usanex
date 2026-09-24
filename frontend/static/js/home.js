document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    const $ = (id) => document.getElementById(id);


    function go(url) {
        window.location.href = url;
    }


    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
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
       BOTTOM NAVIGATION
    ===================================================== */

    $("homeNav")?.addEventListener("click", () => {
        go("/home");
    });


    $("reelNav")?.addEventListener("click", () => {
        go("/reels");
    });


    $("searchNav")?.addEventListener("click", () => {
        go("/search");
    });


    $("notificationNav")?.addEventListener("click", () => {
        go("/notifications");
    });


    $("profileNav")?.addEventListener("click", () => {
        go("/profile");
    });


    /* =====================================================
       SIDE MENU
    ===================================================== */

    const menuButton = $("menuButton");
    const menuOverlay = $("menuOverlay");
    const closeMenu = $("closeMenu");


    function openMenu() {

        if (!menuOverlay) {
            return;
        }

        menuOverlay.hidden = false;

        document.body.classList.add("menu-open");
    }


    function closeSideMenu() {

        if (!menuOverlay) {
            return;
        }

        menuOverlay.hidden = true;

        document.body.classList.remove("menu-open");
    }


    menuButton?.addEventListener("click", (event) => {

        event.preventDefault();
        event.stopPropagation();

        openMenu();
    });


    closeMenu?.addEventListener("click", (event) => {

        event.preventDefault();
        event.stopPropagation();

        closeSideMenu();
    });


    menuOverlay?.addEventListener("click", (event) => {

        if (event.target === menuOverlay) {
            closeSideMenu();
        }
    });


    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeSideMenu();

            closeCategoryPopup();
        }
    });


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
       PERSONAL CATEGORY
       
       This category belongs ONLY to
       the current logged-in user.

       Allowed:
       - friend
       - family
       - null

       Couple is NOT handled here.
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

        /*
         * ALL CONNECTED
         *
         * Only uncategorized people.
         */

        if (currentCategory === "all") {

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


        /*
         * FRIENDS
         */

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


        /*
         * FAMILY
         */

        if (currentCategory === "family") {

            return allConnectedUsers.filter(
                (item) => {

                    const category =
                        getUserCategory(item);

                    return category === "family";
                }
            );
        }


        /*
         * COUPLE CHAT
         *
         * Existing Couple Chat compatibility
         * remains untouched.
         */

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


        if (currentCategory === "all") {

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
       SIMPLE CATEGORY POPUP
       
       IMPORTANT:
       No colored buttons.
       No circles.
       No icons.
       No borders around options.
       No glass effect.
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


        /*
         * Overlay only.
         *
         * The actual popup styling is
         * controlled by home.css.
         */

        const box =
            document.createElement("div");


        box.className =
            "personal-category-popup";


        /*
         * Title
         */

        const title =
            document.createElement("div");


        title.className =
            "simple-category-title";


        title.textContent =
            "Choose category";


        box.appendChild(
            title
        );


        /*
         * FRIEND
         */

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


        /*
         * FAMILY
         */

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


        /*
         * REMOVE
         *
         * Only show if user currently
         * has Friend or Family category.
         */

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


        /*
         * CANCEL
         */

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


        /*
         * Add popup to overlay.
         */

        overlay.appendChild(
            box
        );


        /*
         * Tap outside popup
         * closes popup.
         */

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


        /*
         * Focus first option.
         */

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

            /*
             * REMOVE CATEGORY
             */

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
                    response.status ===
                    401
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


            /*
             * SAVE FRIEND / FAMILY
             */

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

                        body:
                            JSON.stringify({

                                connected_user_id:
                                    connectedUserId,

                                category:
                                    category
                            })
                    }
                );


            if (
                response.status ===
                401
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

                } catch (error) {
                    // Ignore JSON parsing error.
                }


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


        /*
         * Re-render immediately.
         */

        renderConnectedPeople();
    }


    /* =====================================================
       UPDATE LOCAL USER CATEGORY
    ===================================================== */

    function updateLocalUserCategory(
        connectedUserId,
        category
    ) {

        allConnectedUsers =
            allConnectedUsers.map((item) => {

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
            });
    }


    /* =====================================================
       LONG PRESS HANDLER
    ===================================================== */

    function addLongPressToCard(
        card,
        userId,
        userName
    ) {

        let pressTimer =
            null;

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

                pressTimer =
                    null;
            }
        }


        function startLongPress(event) {

            if (!userId) {
                return;
            }


            if (
                event.pointerType ===
                "mouse" &&
                event.button !== 0
            ) {

                return;
            }


            pointerDown =
                true;

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
                                selection.removeAllRanges();
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

            pointerDown =
                false;

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


        card.addEventListener(
            "click",
            (event) => {

                if (
                    longPressTriggered
                ) {

                    event.preventDefault();
                    event.stopPropagation();

                    longPressTriggered =
                        false;

                    return;
                }


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
                        String(currentUserId) ===
                        String(userId)
                    );
                }
            );


        return getUserCategory(item);
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


        users.forEach((item) => {

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


            /*
             * Mobile long press behavior.
             */

            card.style.userSelect =
                "none";

            card.style.webkitUserSelect =
                "none";

            card.style.touchAction =
                "manipulation";


            /* =============================================
               AVATAR
            ============================================= */

            let avatarHtml;


            if (photo) {

                avatarHtml = `

                    <div
                        class="connected-person-avatar"
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
                    >

                        ${escapeHtml(
                            getInitial(name)
                        )}

                    </div>

                `;
            }


            /* =============================================
               USER INFO
            ============================================= */

            const infoHtml = `

                <div
                    class="connected-person-info"
                >

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


            /* =============================================
               ARROW
            ============================================= */

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


            if (userId) {

                addLongPressToCard(
                    card,
                    userId,
                    name
                );
            }


            connectedList.appendChild(
                card
            );

        });
    }


    /* =====================================================
       SHOW CATEGORY ON HOME
    ===================================================== */

    function showCategory(category) {

        currentCategory =
            category;


        closeSideMenu();


        renderConnectedPeople();


        if (connectedSection) {

            connectedSection.hidden =
                false;


            setTimeout(() => {

                connectedSection.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "start"
                });

            }, 50);
        }
    }


    /* =====================================================
       ALL CONNECTED
    ===================================================== */

    $("menuAllConnected")?.addEventListener(
        "click",
        () => {

            showCategory("all");
        }
    );


    /* =====================================================
       FAMILY
    ===================================================== */

    $("menuFamily")?.addEventListener(
        "click",
        () => {

            showCategory("family");
        }
    );


    /* =====================================================
       FRIENDS
    ===================================================== */

    $("menuFriends")?.addEventListener(
        "click",
        () => {

            showCategory("friend");
        }
    );


    /* =====================================================
       COUPLE CHAT
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
                        method:
                            "POST",

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
       HEADER PLUS
    ===================================================== */

    $("headerPlus")?.addEventListener(
        "click",
        () => {

            alert(
                "Create feature will be available soon."
            );
        }
    );


    /* =====================================================
       NEX MOMENT
    ===================================================== */

    $("momentSeeAll")?.addEventListener(
        "click",
        () => {

            alert(
                "Nex Moment will be available soon."
            );
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
                        method:
                            "GET",

                        credentials:
                            "include",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (
                response.status ===
                401
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

                users =
                    data;

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
                users;


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
        "Usanex Home simple Friend/Family category system loaded."
    );

});
