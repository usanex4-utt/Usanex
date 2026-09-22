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

const headerPlus =
    document.getElementById("headerPlus");

const homeSearch =
    document.getElementById("homeSearch");

const homeNav =
    document.getElementById("homeNav");

const reelNav =
    document.getElementById("reelNav");

const searchNav =
    document.getElementById("searchNav");

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
   TOP PLUS
========================================================= */

if (headerPlus) {

    headerPlus.addEventListener(
        "click",
        function () {

            alert(
                "Create feature will be added next."
            );

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
   BOTTOM SEARCH
========================================================= */

if (searchNav) {

    searchNav.addEventListener(
        "click",
        function () {

            if (homeSearch) {

                homeSearch.focus();

                homeSearch.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

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

                const isFollowing =
                    button.classList.contains(
                        "following"
                    );

                if (isFollowing) {

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
   HOME
========================================================= */

if (homeNav) {

    homeNav.addEventListener(
        "click",
        function () {

            const contentScroll =
                document.querySelector(
                    ".content-scroll"
                );

            if (contentScroll) {

                contentScroll.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }

        }
    );
}


/* =========================================================
   MENU PROFILE
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


/* =========================================================
   MENU NOTIFICATIONS
========================================================= */

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


/* =========================================================
   MENU SETTINGS
========================================================= */

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
   NEX MOMENT SEE ALL
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


/* =========================================================
   PEOPLE SEE ALL
========================================================= */

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
    "Usanex Home v5 loaded successfully."
);
