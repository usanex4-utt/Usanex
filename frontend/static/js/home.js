"use strict";


/* =========================================================
   USANEX HOME
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const homeSearch =
    document.getElementById("homeSearch");

const clearSearch =
    document.getElementById("clearSearch");

const peopleList =
    document.getElementById("peopleList");

const emptySearch =
    document.getElementById("emptySearch");

const addMomentButton =
    document.getElementById("addMomentButton");

const notificationButton =
    document.getElementById(
        "notificationButton"
    );

const notificationDot =
    document.getElementById(
        "notificationDot"
    );

const menuButton =
    document.getElementById("menuButton");

const closeMenu =
    document.getElementById("closeMenu");

const menuOverlay =
    document.getElementById("menuOverlay");

const logoutButton =
    document.getElementById("logoutButton");

const searchNav =
    document.getElementById("searchNav");

const profileNav =
    document.getElementById("profileNav");

const reelNav =
    document.getElementById("reelNav");

const createButton =
    document.getElementById("createButton");


/* =========================================================
   SEARCH
========================================================= */

function filterPeople() {

    if (!peopleList) {
        return;
    }


    const query =
        homeSearch
            ? homeSearch.value
                .trim()
                .toLowerCase()
            : "";


    const cards =
        peopleList.querySelectorAll(
            ".user-card"
        );


    let visibleCount = 0;


    cards.forEach(
        function (card) {

            const name =
                (
                    card.dataset.name ||
                    ""
                ).toLowerCase();


            const username =
                (
                    card.dataset.username ||
                    ""
                ).toLowerCase();


            const text =
                card.textContent
                    .toLowerCase();


            const match =
                !query ||
                name.includes(query) ||
                username.includes(query) ||
                text.includes(query);


            if (match) {

                card.style.display =
                    "flex";

                visibleCount++;

            } else {

                card.style.display =
                    "none";
            }

        }
    );


    if (emptySearch) {

        emptySearch.hidden =
            visibleCount !== 0;
    }


    if (clearSearch) {

        clearSearch.hidden =
            !query;
    }
}


if (homeSearch) {

    homeSearch.addEventListener(
        "input",
        filterPeople
    );
}


/* =========================================================
   CLEAR SEARCH
========================================================= */

if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        function () {

            if (homeSearch) {

                homeSearch.value = "";

                homeSearch.focus();
            }

            filterPeople();
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
                        "Following";
                }

            }
        );

    }
);


/* =========================================================
   NEX MOMENT
========================================================= */

if (addMomentButton) {

    addMomentButton.addEventListener(
        "click",
        function () {

            alert(
                "Nex Moment creation will be added next."
            );

        }
    );
}


/* =========================================================
   NOTIFICATION
========================================================= */

if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/notifications";

        }
    );
}


/* =========================================================
   MENU
========================================================= */

function openMenu() {

    if (!menuOverlay) {
        return;
    }

    menuOverlay.hidden = false;

    document.body.style.overflow =
        "hidden";
}


function hideMenu() {

    if (!menuOverlay) {
        return;
    }

    menuOverlay.hidden = true;

    document.body.style.overflow =
        "";
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
        hideMenu
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

                hideMenu();
            }

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

            /*
             * Authentication session will be
             * connected here later.
             */

            window.location.href =
                "/login";

        }
    );
}


/* =========================================================
   BOTTOM NAVIGATION
========================================================= */

if (reelNav) {

    reelNav.addEventListener(
        "click",
        function () {

            window.location.href =
                "/reels";

        }
    );
}


if (searchNav) {

    searchNav.addEventListener(
        "click",
        function () {

            if (homeSearch) {

                homeSearch.focus();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }

        }
    );
}


if (profileNav) {

    profileNav.addEventListener(
        "click",
        function () {

            window.location.href =
                "/profile";

        }
    );
}


if (createButton) {

    createButton.addEventListener(
        "click",
        function () {

            alert(
                "Create options will be added next."
            );

        }
    );
}


/* =========================================================
   INITIAL STATE
========================================================= */

if (notificationDot) {

    notificationDot.hidden =
        true;
}


filterPeople();
