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
       
       IMPORTANT:
       This category belongs to the CURRENT USER.
       It is not a shared connection category.
       
       Allowed:
       - friend
       - family
       - null
       
       Couple is intentionally NOT handled here.
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

        if (currentCategory === "all") {

            return allConnectedUsers;
        }


        return allConnectedUsers.filter((item) => {

            const category =
                getUserCategory(item);


            if (
                currentCategory === "friend"
            ) {

                return (
                    category === "friend" ||
                    category === "friends"
                );
            }


            if (
                currentCategory === "family"
            ) {

                return (
                    category === "family"
                );
            }


            /*
             * Couple filtering is intentionally left
             * compatible with the existing frontend.
             *
             * We are NOT adding or changing any
             * couple database/category system here.
             */

            if (
                currentCategory === "couple"
            ) {

                return (
                    category === "couple" ||
                    category === "couple_chat" ||
                    category === "couple-chat" ||
                    category === "couple chat"
                );
            }


            return false;
        });
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
       PERSONAL CATEGORY API
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
             * Remove personal category
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
                        "Category remove failed: " +
                        response.status
                    );
                }


                return true;
            }


            /*
             * Save Friend / Family
             */

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


                /*
                 * Keep category at top level because
                 * backend /api/connections returns it there.
                 */

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
       CATEGORY SELECTOR
    ===================================================== */

    function createCategorySelector(
        userId,
        currentCategoryValue
    ) {

        const wrapper =
            document.createElement("div");


        wrapper.className =
            "connected-person-category";


        const select =
            document.createElement("select");


        select.className =
            "connected-category-select";


        select.setAttribute(
            "aria-label",
            "Personal connection category"
        );


        const current =
            String(
                currentCategoryValue || ""
            )
                .trim()
                .toLowerCase();


        const options = [
            {
                value: "",
                label: "All Connected"
            },
            {
                value: "friend",
                label: "Friend"
            },
            {
                value: "family",
                label: "Family"
            }
        ];


        options.forEach((optionData) => {

            const option =
                document.createElement("option");


            option.value =
                optionData.value;


            option.textContent =
                optionData.label;


            if (
                optionData.value === current
            ) {

                option.selected =
                    true;
            }


            select.appendChild(option);
        });


        select.addEventListener(
            "click",
            (event) => {

                /*
                 * Do not open profile when
                 * category selector is clicked.
                 */

                event.stopPropagation();
            }
        );


        select.addEventListener(
            "change",
            async (event) => {

                event.stopPropagation();


                const newCategory =
                    select.value;


                const oldCategory =
                    current || "";


                select.disabled =
                    true;


                const success =
                    await savePersonalCategory(
                        userId,
                        newCategory
                    );


                select.disabled =
                    false;


                if (!success) {

                    select.value =
                        oldCategory;

                    return;
                }


                updateLocalUserCategory(
                    userId,
                    newCategory
                );


                /*
                 * Re-render so Friend / Family
                 * lists immediately update.
                 */

                renderConnectedPeople();
            }
        );


        wrapper.appendChild(select);


        return wrapper;
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


        if (
            connectedCount
        ) {

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


            const personalCategory =
                getUserCategory(item);


            const card =
                document.createElement("article");


            card.className =
                "connected-person-card";


            if (userId) {

                card.dataset.userId =
                    userId;
            }


            let avatarHtml;


            if (photo) {

                avatarHtml = `

                    <div class="connected-person-avatar">

                        <img
                            src="${escapeHtml(photo)}"
                            alt="${escapeHtml(name)}"
                            draggable="false"
                        >

                    </div>

                `;

            } else {

                avatarHtml = `

                    <div class="connected-person-avatar">

                        ${escapeHtml(
                            getInitial(name)
                        )}

                    </div>

                `;
            }


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


            const arrowHtml = `

                <div class="connected-person-arrow"
                     aria-hidden="true">

                    ›

                </div>

            `;


            card.innerHTML =
                avatarHtml +
                infoHtml +
                arrowHtml;


            /*
             * Add personal category selector.
             *
             * Only Friend / Family are offered.
             * Couple is intentionally not included.
             */

            if (userId) {

                const selector =
                    createCategorySelector(
                        userId,
                        personalCategory
                    );


                card.appendChild(
                    selector
                );
            }


            /* =================================================
               OPEN CONNECTED PROFILE
            ================================================= */

            card.addEventListener(
                "click",
                () => {

                    if (!userId) {
                        return;
                    }


                    go(
                        "/profile?user_id=" +
                        encodeURIComponent(userId)
                    );
                }
            );


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
                    behavior: "smooth",
                    block: "start"
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

            /*
             * Existing Couple Chat navigation/filter
             * remains untouched.
             */

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
                users;


            /*
             * Default Home:
             * All Connected
             */

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
        "Usanex Home personal category system loaded."
    );

});
