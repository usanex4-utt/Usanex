"use strict";

/* =========================================================
   USANEX HOME
   Simple Home
   ========================================================= */


/* =========================================================
   HELPERS
========================================================= */

function goTo(url) {
    window.location.href = url;
}


function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   ELEMENTS
========================================================= */

const menuButton =
    getElement("menuButton");

const menuOverlay =
    getElement("menuOverlay");

const closeMenu =
    getElement("closeMenu");

const headerPlus =
    getElement("headerPlus");

const homeSearch =
    getElement("homeSearch");

const homeNav =
    getElement("homeNav");

const reelNav =
    getElement("reelNav");

const searchNav =
    getElement("searchNav");

const notificationNav =
    getElement("notificationNav");

const profileNav =
    getElement("profileNav");

const logoutButton =
    getElement("logoutButton");

const menuProfile =
    getElement("menuProfile");

const menuNotifications =
    getElement("menuNotifications");

const menuSettings =
    getElement("menuSettings");

const momentSeeAll =
    getElement("momentSeeAll");

const peopleSeeAll =
    getElement("peopleSeeAll");


/* =========================================================
   SEARCH PAGE
========================================================= */

function openSearchPage() {
    goTo("/search");
}


/* =========================================================
   HOME SEARCH
========================================================= */

if (homeSearch) {

    homeSearch.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openSearchPage();

        }
    );


    homeSearch.addEventListener(
        "focus",
        function (event) {

            event.preventDefault();

            openSearchPage();

        }
    );


    homeSearch.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                openSearchPage();

            }

        }
    );

}


/* =========================================================
   SEARCH BOTTOM NAV
========================================================= */

if (searchNav) {

    searchNav.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openSearchPage();

        }
    );

}


/* =========================================================
   LEFT EDGE SWIPE → SEARCH
========================================================= */

let touchStartX = 0;
let touchStartY = 0;

const EDGE_ZONE = 35;
const SWIPE_DISTANCE = 80;


document.addEventListener(
    "touchstart",
    function (event) {

        if (!event.touches.length) {
            return;
        }

        touchStartX =
            event.touches[0].clientX;

        touchStartY =
            event.touches[0].clientY;

    },
    {
        passive: true
    }
);


document.addEventListener(
    "touchend",
    function (event) {

        if (!event.changedTouches.length) {
            return;
        }


        const touch =
            event.changedTouches[0];


        const touchEndX =
            touch.clientX;

        const touchEndY =
            touch.clientY;


        const movedX =
            touchEndX - touchStartX;

        const movedY =
            Math.abs(
                touchEndY - touchStartY
            );


        /*
         * Only start from the LEFT EDGE.
         *
         * LEFT EDGE → RIGHT
         */

        const startedFromLeft =
            touchStartX <= EDGE_ZONE;


        const isRightSwipe =
            movedX >= SWIPE_DISTANCE;


        const isMostlyHorizontal =
            movedX > movedY;


        if (
            startedFromLeft &&
            isRightSwipe &&
            isMostlyHorizontal
        ) {

            openSearchPage();

        }

    },
    {
        passive: true
    }
);


/* =========================================================
   MENU
========================================================= */

function openMenu() {

    if (!menuOverlay) {
        return;
    }

    menuOverlay.hidden = false;

    document.body.classList.add(
        "menu-open"
    );
}


function closeMenuPanel() {

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
        function (event) {

            event.preventDefault();

            openMenu();

        }
    );

}


if (closeMenu) {

    closeMenu.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeMenuPanel();

        }
    );

}


if (menuOverlay) {

    menuOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                menuOverlay
            ) {

                closeMenuPanel();

            }

        }
    );

}


/* =========================================================
   HEADER PLUS
========================================================= */

if (headerPlus) {

    headerPlus.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            alert(
                "Create feature will be added next."
            );

        }
    );

}


/* =========================================================
   HOME BUTTON
========================================================= */

if (homeNav) {

    homeNav.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            const contentScroll =
                document.querySelector(
                    ".content-scroll"
                );


            if (contentScroll) {

                contentScroll.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            } else {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function openNotifications() {

    goTo(
        "/notifications"
    );

}


if (notificationNav) {

    notificationNav.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openNotifications();

        }
    );

}


if (menuNotifications) {

    menuNotifications.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeMenuPanel();

            openNotifications();

        }
    );

}


/* =========================================================
   PROFILE
========================================================= */

function openProfile() {

    goTo(
        "/profile"
    );

}


if (profileNav) {

    profileNav.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openProfile();

        }
    );

}


if (menuProfile) {

    menuProfile.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeMenuPanel();

            openProfile();

        }
    );

}


/* =========================================================
   SETTINGS
========================================================= */

if (menuSettings) {

    menuSettings.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeMenuPanel();

            alert(
                "Settings feature will be added next."
            );

        }
    );

}


/* =========================================================
   REELS
========================================================= */

if (reelNav) {

    reelNav.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            alert(
                "Reels feature will be added next."
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

    if (logoutButton) {

        logoutButton.disabled = true;

    }


    try {

        const response =
            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch {

            data = {};

        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Logout failed."
            );

        }


        localStorage.removeItem(
            "usanex_user"
        );

        localStorage.removeItem(
            "usanex_logged_in"
        );


        window.location.replace(
            "/login"
        );


    } catch (error) {

        console.error(
            "Usanex logout error:",
            error
        );


        if (logoutButton) {

            logoutButton.disabled =
                false;

        }


        alert(
            error.message ||
            "Unable to logout. Please try again."
        );

    }

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            const confirmed =
                window.confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {
                return;
            }


            logoutUser();

        }
    );

}


/* =========================================================
   NEX MOMENT
========================================================= */

if (momentSeeAll) {

    momentSeeAll.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            alert(
                "All moments will be added next."
            );

        }
    );

}


/* =========================================================
   PEOPLE → SEARCH
========================================================= */

if (peopleSeeAll) {

    peopleSeeAll.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openSearchPage();

        }
    );

}


/* =========================================================
   REMOVE HOME USER CARDS
========================================================= */

/*
 * Home currently contains old demo/user cards
 * inside #peopleList.
 *
 * We remove them completely.
 *
 * Search page will handle user searching.
 */

const peopleList =
    getElement("peopleList");


if (peopleList) {

    peopleList.innerHTML = "";

}


/* =========================================================
   REMOVE OLD PEOPLE SECTION
========================================================= */

/*
 * There should be no user cards on Home.
 */

const peopleSection =
    document.querySelector(
        ".people-section"
    );


if (peopleSection) {

    peopleSection.remove();

}


/* =========================================================
   START
========================================================= */

if (menuOverlay) {

    menuOverlay.hidden = true;

}


console.log(
    "Usanex Home - simple mode loaded."
);

console.log(
    "Home cards: disabled"
);

console.log(
    "Header search: enabled"
);

console.log(
    "Left edge swipe: enabled"
);
