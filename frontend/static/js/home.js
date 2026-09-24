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
       CATEGORY DETECTION
    ===================================================== */

    function getUserCategory(item) {

        const user =
            getConnectionUser(item);


        const category =
            user.connection_type ||
            user.category ||
            user.connection_category ||
            user.relationship_type ||
            item.connection_type ||
            item.category ||
            item.connection_category ||
            item.relationship_type ||
            "";


        return String(category)
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


        connectedSection.hidden = false;


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
                "";


            const photo =
                user.profile_photo ||
                "";


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


            card.innerHTML = `

                ${avatarHtml}

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

                <div class="connected-person-arrow">
                    ›
                </div>

            `;


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


            connectedList.appendChild(card);

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
               Default Home:
               All Connected
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
        "Usanex Home v22 loaded."
    );

});
