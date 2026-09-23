
// ============================================================
// USANEX - HOME
// Navigation + Menu + Connected People
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================================
    // BASIC HELPERS
    // ========================================================

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


    async function getJson(url, options = {}) {

        const response = await fetch(url, {
            credentials: "include",
            ...options
        });

        if (response.status === 401) {
            window.location.href = "/login";
            return null;
        }

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {

            const message =
                data?.detail ||
                data?.message ||
                "Request failed.";

            throw new Error(message);
        }

        return data;
    }


    // ========================================================
    // HOME NAVIGATION
    // ========================================================

    const homeNav =
        document.getElementById("homeNav");

    if (homeNav) {

        homeNav.addEventListener("click", () => {
            window.location.href = "/home";
        });

    }


    // ========================================================
    // REEL NAVIGATION
    // ========================================================

    const reelNav =
        document.getElementById("reelNav");

    if (reelNav) {

        reelNav.addEventListener("click", () => {
            window.location.href = "/reels";
        });

    }


    // ========================================================
    // SEARCH NAVIGATION
    // ========================================================

    const searchNav =
        document.getElementById("searchNav");

    if (searchNav) {

        searchNav.addEventListener("click", () => {
            window.location.href = "/search";
        });

    }


    // ========================================================
    // NOTIFICATION NAVIGATION
    // ========================================================

    const notificationNav =
        document.getElementById("notificationNav");

    if (notificationNav) {

        notificationNav.addEventListener("click", () => {
            window.location.href = "/notifications";
        });

    }


    // ========================================================
    // PROFILE NAVIGATION
    // ========================================================

    const profileNav =
        document.getElementById("profileNav");

    if (profileNav) {

        profileNav.addEventListener("click", () => {
            window.location.href = "/profile";
        });

    }


    // ========================================================
    // SIDE MENU
    // ========================================================

    const menuButton =
        document.getElementById("menuButton");

    const menuOverlay =
        document.getElementById("menuOverlay");

    const closeMenu =
        document.getElementById("closeMenu");


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


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openMenu
        );

    }


    if (closeMenu) {

        closeMenu.addEventListener(
            "click",
            closeSideMenu
        );

    }


    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            (event) => {

                if (event.target === menuOverlay) {
                    closeSideMenu();
                }

            }
        );

    }


    // ========================================================
    // ESCAPE KEY - CLOSE MENU
    // ========================================================

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {
                closeSideMenu();
            }

        }
    );


    // ========================================================
    // MENU PROFILE
    // ========================================================

    const menuProfile =
        document.getElementById("menuProfile");

    if (menuProfile) {

        menuProfile.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/profile";

            }
        );

    }


    // ========================================================
    // MENU NOTIFICATIONS
    // ========================================================

    const menuNotifications =
        document.getElementById(
            "menuNotifications"
        );

    if (menuNotifications) {

        menuNotifications.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/notifications";

            }
        );

    }


    // ========================================================
    // MENU SETTINGS
    // ========================================================

    const menuSettings =
        document.getElementById("menuSettings");

    if (menuSettings) {

        menuSettings.addEventListener(
            "click",
            () => {

                alert(
                    "Settings will be available soon."
                );

            }
        );

    }


    // ========================================================
    // LOGOUT
    // ========================================================

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                logoutButton.disabled = true;

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

                }

                window.location.href =
                    "/login";

            }
        );

    }


    // ========================================================
    // HEADER PLUS
    // ========================================================

    const headerPlus =
        document.getElementById("headerPlus");

    if (headerPlus) {

        headerPlus.addEventListener(
            "click",
            () => {

                alert(
                    "Create feature will be available soon."
                );

            }
        );

    }


    // ========================================================
    // NEX MOMENT
    // ========================================================

    const momentSeeAll =
        document.getElementById("momentSeeAll");

    if (momentSeeAll) {

        momentSeeAll.addEventListener(
            "click",
            () => {

                alert(
                    "Nex Moment will be available soon."
                );

            }
        );

    }


    // ========================================================
    // CONNECTED PEOPLE
    // ========================================================

    async function loadConnectedPeople() {

        try {

            const data =
                await getJson(
                    "/api/connections"
                );

            if (data === null) {
                return;
            }


            /*
            ----------------------------------------------------
            Backend can return:

            [
                {...}
            ]

            OR

            {
                "connections": [...]
            }

            OR

            {
                "users": [...]
            }
            ----------------------------------------------------
            */

            let connections = [];


            if (Array.isArray(data)) {

                connections = data;

            } else if (
                Array.isArray(data.connections)
            ) {

                connections =
                    data.connections;

            } else if (
                Array.isArray(data.users)
            ) {

                connections =
                    data.users;

            }


            renderConnectedPeople(
                connections
            );


        } catch (error) {

            console.error(
                "Connected people loading error:",
                error
            );

            renderConnectedPeople([]);

        }

    }


    // ========================================================
    // FIND CONNECTED PEOPLE SECTION
    // ========================================================

    function getConnectedPeopleContainer() {

        let section =
            document.getElementById(
                "connectedPeopleSection"
            );


        if (section) {

            return section;
        }


        /*
        --------------------------------------------------------
        Current home.html does not yet contain a connected
        people section.

        So create it automatically between Nex Moment and
        Welcome section.
        --------------------------------------------------------
        */

        const mainArea =
            document.querySelector(
                ".content-scroll"
            );

        if (!mainArea) {

            return null;
        }


        section =
            document.createElement("section");

        section.id =
            "connectedPeopleSection";

        section.className =
            "connected-people-section";


        section.innerHTML = `

            <div class="section-header">

                <h2>
                    Connected People
                </h2>

                <span
                    class="connected-count"
                    id="connectedPeopleCount"
                >
                    0
                </span>

            </div>


            <div
                class="connected-people-list"
                id="connectedPeopleList"
            ></div>

        `;


        const emptySection =
            mainArea.querySelector(
                ".home-empty-section"
            );


        if (emptySection) {

            mainArea.insertBefore(
                section,
                emptySection
            );

        } else {

            mainArea.appendChild(
                section
            );

        }


        return section;

    }


    // ========================================================
    // RENDER CONNECTED PEOPLE
    // ========================================================

    function renderConnectedPeople(
        connections
    ) {

        const section =
            getConnectedPeopleContainer();

        if (!section) {
            return;
        }


        const list =
            section.querySelector(
                "#connectedPeopleList"
            );

        const count =
            section.querySelector(
                "#connectedPeopleCount"
            );


        if (!list) {
            return;
        }


        list.innerHTML = "";


        /*
        --------------------------------------------------------
        Remove duplicate users by user_id
        --------------------------------------------------------
        */

        const uniqueUsers = [];

        const seen =
            new Set();


        connections.forEach(
            (connection) => {

                /*
                Backend may return:

                connection.user
                connection.connected_user
                OR directly user fields
                */

                const user =
                    connection?.user ||
                    connection?.connected_user ||
                    connection;


                if (!user) {
                    return;
                }


                const userId =
                    user.user_id ||
                    connection.user_id ||
                    "";


                const numericId =
                    user.id ||
                    connection.id ||
                    "";


                const uniqueKey =
                    userId ||
                    numericId;


                if (!uniqueKey) {
                    return;
                }


                if (seen.has(uniqueKey)) {
                    return;
                }


                seen.add(uniqueKey);

                uniqueUsers.push(user);

            }
        );


        if (count) {

            count.textContent =
                String(
                    uniqueUsers.length
                );

        }


        /*
        --------------------------------------------------------
        No connected users
        --------------------------------------------------------
        */

        if (uniqueUsers.length === 0) {

            section.hidden = true;

            return;
        }


        section.hidden = false;


        /*
        --------------------------------------------------------
        Render each connected user
        --------------------------------------------------------
        */

        uniqueUsers.forEach(
            (user) => {

                const name =
                    user.name ||
                    user.username ||
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
                    document.createElement(
                        "article"
                    );


                card.className =
                    "connected-person-card";


                card.tabIndex = 0;


                /*
                ------------------------------------------------
                Avatar
                ------------------------------------------------
                */

                let avatar;


                if (photo) {

                    avatar = `
                        <img
                            src="${escapeHtml(photo)}"
                            class="connected-person-avatar"
                            alt="${escapeHtml(name)}"
                            draggable="false"
                        >
                    `;

                } else {

                    avatar = `
                        <div
                            class="connected-person-avatar placeholder"
                        >
                            ${escapeHtml(
                                name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>
                    `;

                }


                /*
                ------------------------------------------------
                Card HTML
                ------------------------------------------------
                */

                card.innerHTML = `

                    <div class="connected-person-avatar-wrap">
                        ${avatar}
                    </div>

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


                /*
                ------------------------------------------------
                Click -> Profile
                ------------------------------------------------
                */

                function openProfile() {

                    if (!userId) {
                        return;
                    }

                    window.location.href =
                        `/profile?user_id=${encodeURIComponent(
                            userId
                        )}`;

                }


                card.addEventListener(
                    "click",
                    openProfile
                );


                card.addEventListener(
                    "keydown",
                    (event) => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();

                            openProfile();

                        }

                    }
                );


                list.appendChild(card);

            }
        );

    }


    // ========================================================
    // NOTIFICATION DOT
    // ========================================================

    async function loadNotificationDot() {

        const dot =
            document.getElementById(
                "notificationDot"
            );

        if (!dot) {
            return;
        }


        try {

            const [
                requestData,
                notificationData
            ] = await Promise.all([

                getJson(
                    "/api/connections/requests"
                ),

                getJson(
                    "/api/connections/notifications"
                )

            ]);


            if (
                requestData === null ||
                notificationData === null
            ) {

                return;
            }


            const requests =
                Array.isArray(
                    requestData?.requests
                )
                    ? requestData.requests
                    : Array.isArray(
                        requestData
                    )
                        ? requestData
                        : [];


            const notifications =
                Array.isArray(
                    notificationData?.notifications
                )
                    ? notificationData.notifications
                    : Array.isArray(
                        notificationData
                    )
                        ? notificationData
                        : [];


            const total =
                requests.length +
                notifications.length;


            dot.hidden =
                total <= 0;


        } catch (error) {

            console.error(
                "Notification dot error:",
                error
            );

            dot.hidden = true;

        }

    }


    // ========================================================
    // INITIAL HOME LOAD
    // ========================================================

    loadConnectedPeople();

    loadNotificationDot();


    // ========================================================
    // AUTO REFRESH CONNECTIONS
    // ========================================================

    /*
    Every 15 seconds backend se connected users
    refresh honge. Isse accept/reject ke baad
    Home manually refresh kiye bina update ho sakta hai.
    */

    setInterval(
        () => {

            loadConnectedPeople();
            loadNotificationDot();

        },
        15000
    );


    // ========================================================
    // IMAGE PROTECTION
    // ========================================================

    document.addEventListener(
        "contextmenu",
        (event) => {

            if (
                event.target &&
                event.target.tagName === "IMG"
            ) {

                event.preventDefault();

            }

        }
    );


    document.addEventListener(
        "dragstart",
        (event) => {

            if (
                event.target &&
                event.target.tagName === "IMG"
            ) {

                event.preventDefault();

            }

        }
    );


    // ========================================================
    // HOME READY
    // ========================================================

    console.log(
        "Usanex Home loaded."
    );

});
