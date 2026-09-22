"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const menuButton =
    document.getElementById("menuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const closeMenu =
    document.getElementById("closeMenu");

const homeSearch =
    document.getElementById("homeSearch");

const createNav =
    document.getElementById("createNav");

const reelNav =
    document.getElementById("reelNav");

const notificationNav =
    document.getElementById("notificationNav");

const profileNav =
    document.getElementById("profileNav");

const logoutButton =
    document.getElementById("logoutButton");

const menuProfile =
    document.getElementById("menuProfile");

const menuNotifications =
    document.getElementById("menuNotifications");

const menuSettings =
    document.getElementById("menuSettings");

const momentSeeAll =
    document.getElementById("momentSeeAll");

const peopleSeeAll =
    document.getElementById("peopleSeeAll");


/* =========================================================
   MENU
========================================================= */

function openMenu() {

    if (!menuOverlay) {
        return;
    }

    menuOverlay.hidden = false;

    document.body.style.overflow = "hidden";
}


function closeMenuPanel() {

    if (!menuOverlay) {
        return;
    }

    menuOverlay.hidden = true;

    document.body.style.overflow = "";
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
        closeMenuPanel
    );
}


if (menuOverlay) {

    menuOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target === menuOverlay
            ) {
                closeMenuPanel();
            }

        }
    );
}


/* =========================================================
   SEARCH
========================================================= */

if (homeSearch) {

    homeSearch.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !== "Enter"
            ) {
                return;
            }

            const query =
                homeSearch.value.trim();

            if (!query) {
                return;
            }

            console.log(
                "Usanex search:",
                query
            );

        }
    );
}


/* =========================================================
   FOLLOW / UNFOLLOW
========================================================= */

const followButtons =
    document.querySelectorAll(
        ".follow-button"
    );


followButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const following =
                    button.classList.contains(
                        "following"
                    );

                if (following) {

                    button.classList.remove(
                        "following"
                    );

                    button.textContent =
                        "Follow";

                } else {

                    button.classList.add(
                        "following"
                    );

                    button.textContent =
                        "Unfollow";
                }

            }
        );

    }
);


/* =========================================================
   PLUS
========================================================= */

if (createNav) {

    createNav.addEventListener(
        "click",
        function () {

            alert(
                "Create feature will be added next."
            );

        }
    );
}


/* =========================================================
   REEL
========================================================= */

if (reelNav) {

    reelNav.addEventListener(
        "click",
        function () {

            alert(
                "Reels feature will be added next."
            );

        }
    );
}


/* =========================================================
   NOTIFICATION
========================================================= */

if (notificationNav) {

    notificationNav.addEventListener(
        "click",
        function () {

            alert(
                "Notifications feature will be added next."
            );

        }
    );
}


/* =========================================================
   PROFILE
========================================================= */

if (profileNav) {

    profileNav.addEventListener(
        "click",
        function () {

            alert(
                "Profile feature will be added next."
            );

        }
    );
}


/* =========================================================
   MENU ITEMS
========================================================= */

if (menuProfile) {

    menuProfile.addEventListener(
        "click",
        function () {

            closeMenuPanel();

            alert(
                "Profile feature will be added next."
            );

        }
    );
}


if (menuNotifications) {

    menuNotifications.addEventListener(
        "click",
        function () {

            closeMenuPanel();

            alert(
                "Notifications feature will be added next."
            );

        }
    );
}


if (menuSettings) {

    menuSettings.addEventListener(
        "click",
        function () {

            closeMenuPanel();

            alert(
                "Settings feature will be added next."
            );

        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            const confirmed =
                window.confirm(
                    "Are you sure you want to logout?"
                );

            if (!confirmed) {
                return;
            }

            window.location.href =
                "/login";
        }
    );
}


/* =========================================================
   SEE ALL
========================================================= */

if (momentSeeAll) {

    momentSeeAll.addEventListener(
        "click",
        function () {

            alert(
                "All moments will be added next."
            );

        }
    );
}


if (peopleSeeAll) {

    peopleSeeAll.addEventListener(
        "click",
        function () {

            alert(
                "All people will be added next."
            );

        }
    );
}


/* =========================================================
   INITIAL STATE
========================================================= */

if (menuOverlay) {
    menuOverlay.hidden = true;
}

console.log(
    "Usanex Home v3 loaded."
);
