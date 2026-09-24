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


    /*
       Menu ke bahar click
    */

    menuOverlay?.addEventListener("click", (event) => {

        if (event.target === menuOverlay) {
            closeSideMenu();
        }
    });


    /*
       Escape key
    */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeSideMenu();
        }
    });


    /* =====================================================
       HOME MENU NAVIGATION
       ===================================================== */

    $("menuAllConnected")?.addEventListener(
        "click",
        () => {

            closeSideMenu();

            go("/all-connected");
        }
    );


    $("menuFamily")?.addEventListener(
        "click",
        () => {

            closeSideMenu();

            go("/family");
        }
    );


    $("menuFriends")?.addEventListener(
        "click",
        () => {

            closeSideMenu();

            go("/friends");
        }
    );


    $("menuCoupleChat")?.addEventListener(
        "click",
        () => {

            closeSideMenu();

            go("/couple-chat");
        }
    );


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

            const button = $("logoutButton");

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
       HEADER PLUS
       ===================================================== */

    $("headerPlus")?.addEventListener("click", () => {

        alert(
            "Create feature will be available soon."
        );
    });


    /* =====================================================
       NEX MOMENT
       ===================================================== */

    $("momentSeeAll")?.addEventListener("click", () => {

        alert(
            "Nex Moment will be available soon."
        );
    });


    /* =====================================================
       CONNECTED PEOPLE
       ===================================================== */

    const connectedSection =
        $("connectedPeopleSection");

    const connectedList =
        $("connectedPeopleList");

    const connectedCount =
        $("connectedPeopleCount");


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


    function renderConnectedPeople(users) {

        if (
            !connectedSection ||
            !connectedList
        ) {
            return;
        }

        connectedList.innerHTML = "";


        if (
            !Array.isArray(users) ||
            users.length === 0
        ) {

            connectedSection.hidden = true;

            if (connectedCount) {
                connectedCount.textContent = "0";
            }

            return;
        }


        connectedSection.hidden = false;


        if (connectedCount) {
            connectedCount.textContent =
                String(users.length);
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
                        ${escapeHtml(getInitial(name))}
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
       LOAD CONNECTED PEOPLE
       ===================================================== */

    async function loadConnectedPeople() {

        try {

            const response =
                await fetch(
                    "/api/connections",
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


            /*
               Backend ke different possible
               response formats handle kar rahe hain.
            */

            if (Array.isArray(data)) {

                users = data;

            } else if (
                Array.isArray(data.connections)
            ) {

                users = data.connections;

            } else if (
                Array.isArray(data.users)
            ) {

                users = data.users;

            } else if (
                Array.isArray(data.data)
            ) {

                users = data.data;
            }


            renderConnectedPeople(users);


        } catch (error) {

            console.error(
                "Connected people error:",
                error
            );

            renderConnectedPeople([]);
        }
    }


    /* =====================================================
       START
       ===================================================== */

    loadConnectedPeople();


    console.log(
        "Usanex Home v21 loaded."
    );

});
