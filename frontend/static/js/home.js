document.addEventListener("DOMContentLoaded", () => {


    /*
    ============================================================
    HOME
    ============================================================
    */

    const homeNav =
        document.getElementById("homeNav");


    if (homeNav) {

        homeNav.addEventListener(
            "click",
            () => {

                window.location.href = "/home";

            }
        );

    }


    /*
    ============================================================
    SEARCH
    ============================================================

    Bottom Search opens the dedicated Search page.
    */

    const searchNav =
        document.getElementById("searchNav");


    if (searchNav) {

        searchNav.addEventListener(
            "click",
            () => {

                window.location.href = "/search";

            }
        );

    }


    /*
    ============================================================
    REEL
    ============================================================
    */

    const reelNav =
        document.getElementById("reelNav");


    if (reelNav) {

        reelNav.addEventListener(
            "click",
            () => {

                window.location.href = "/reels";

            }
        );

    }


    /*
    ============================================================
    NOTIFICATIONS
    ============================================================
    */

    const notificationNav =
        document.getElementById(
            "notificationNav"
        );


    if (notificationNav) {

        notificationNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/notifications";

            }
        );

    }


    /*
    ============================================================
    PROFILE
    ============================================================
    */

    const profileNav =
        document.getElementById(
            "profileNav"
        );


    if (profileNav) {

        profileNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/profile";

            }
        );

    }


    /*
    ============================================================
    SIDE MENU
    ============================================================
    */

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const menuOverlay =
        document.getElementById(
            "menuOverlay"
        );


    const closeMenu =
        document.getElementById(
            "closeMenu"
        );


    function openMenu() {

        if (!menuOverlay) {
            return;
        }

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

                if (
                    event.target ===
                    menuOverlay
                ) {

                    closeSideMenu();

                }

            }
        );

    }


    /*
    ============================================================
    MENU PROFILE
    ============================================================
    */

    const menuProfile =
        document.getElementById(
            "menuProfile"
        );


    if (menuProfile) {

        menuProfile.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/profile";

            }
        );

    }


    /*
    ============================================================
    MENU NOTIFICATIONS
    ============================================================
    */

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


    /*
    ============================================================
    MENU SETTINGS
    ============================================================
    */

    const menuSettings =
        document.getElementById(
            "menuSettings"
        );


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


    /*
    ============================================================
    LOGOUT
    ============================================================
    */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

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


    /*
    ============================================================
    HEADER PLUS
    ============================================================
    */

    const headerPlus =
        document.getElementById(
            "headerPlus"
        );


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


    /*
    ============================================================
    NEX MOMENT
    ============================================================
    */

    const momentSeeAll =
        document.getElementById(
            "momentSeeAll"
        );


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

});
