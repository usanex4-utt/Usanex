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
   PEOPLE - REAL DATABASE USERS
========================================================= */

function findPeopleContainer() {

    return (
        document.getElementById("peopleList") ||
        document.querySelector(".people-list") ||
        document.querySelector(".people-cards") ||
        document.querySelector(".people-container")
    );
}


function findPersonCard(container) {

    if (!container) {
        return null;
    }

    return (
        container.querySelector(".person-card") ||
        container.querySelector(".people-card") ||
        container.querySelector(".user-card") ||
        container.querySelector(".person-item")
    );
}


function setText(
    element,
    selectors,
    value
) {

    if (!element) {
        return;
    }

    for (
        const selector of selectors
    ) {

        const target =
            element.querySelector(selector);

        if (target) {

            target.textContent =
                value || "";

            return;
        }

    }
}


function setAvatar(
    element,
    user
) {

    if (!element) {
        return;
    }

    const image =
        element.querySelector(
            "img"
        );

    const avatar =
        element.querySelector(
            ".avatar, .profile-avatar, .person-avatar, .user-avatar"
        );

    const firstLetter =
        (
            user.name ||
            user.username ||
            "U"
        )
        .trim()
        .charAt(0)
        .toUpperCase();


    if (image) {

        if (user.profile_photo) {

            image.src =
                user.profile_photo;

            image.alt =
                user.name || "User";

            image.hidden = false;

            if (avatar) {
                avatar.textContent = "";
            }

        } else {

            image.removeAttribute(
                "src"
            );

            image.hidden = true;

            if (avatar) {
                avatar.textContent =
                    firstLetter;
            }

        }

        return;
    }


    if (avatar) {

        if (user.profile_photo) {

            avatar.style.backgroundImage =
                `url("${user.profile_photo}")`;

            avatar.style.backgroundSize =
                "cover";

            avatar.style.backgroundPosition =
                "center";

            avatar.textContent = "";

        } else {

            avatar.style.backgroundImage =
                "";

            avatar.textContent =
                firstLetter;

        }

    }
}


function attachFollowButton(
    button
) {

    if (!button) {
        return;
    }

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


function renderPeople(
    users
) {

    const container =
        findPeopleContainer();

    if (!container) {

        console.warn(
            "Usanex: People container not found."
        );

        return;
    }


    const template =
        findPersonCard(container);

    if (!template) {

        console.warn(
            "Usanex: People card template not found."
        );

        return;
    }


    /*
     * Existing HTML card is used as a template.
     * This keeps the current UI/CSS unchanged.
     */

    container.innerHTML = "";


    if (
        !users ||
        users.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "div"
            );

        emptyMessage.className =
            "people-empty";

        emptyMessage.textContent =
            "No people found.";

        container.appendChild(
            emptyMessage
        );

        return;
    }


    users.forEach(
        function (user) {

            const card =
                template.cloneNode(true);


            /* -----------------------------------------
               USER NAME
            ----------------------------------------- */

            setText(
                card,
                [
                    ".person-name",
                    ".people-name",
                    ".user-name",
                    "[data-user-name]"
                ],
                user.name
            );


            /* -----------------------------------------
               USERNAME
            ----------------------------------------- */

            setText(
                card,
                [
                    ".person-username",
                    ".people-username",
                    ".user-username",
                    "[data-user-username]"
                ],
                user.username
            );


            /* -----------------------------------------
               USER ID
            ----------------------------------------- */

            setText(
                card,
                [
                    ".person-id",
                    ".people-id",
                    ".user-id",
                    "[data-user-id]"
                ],
                user.user_id
            );


            /* -----------------------------------------
               PROFILE PHOTO / AVATAR
            ----------------------------------------- */

            setAvatar(
                card,
                user
            );


            /* -----------------------------------------
               FOLLOW BUTTON
            ----------------------------------------- */

            const followButton =
                card.querySelector(
                    ".follow-button"
                );


            if (followButton) {

                followButton.classList.remove(
                    "following"
                );

                followButton.textContent =
                    "Follow";

                followButton.dataset.userId =
                    user.user_id;

                followButton.dataset.username =
                    user.username;

                attachFollowButton(
                    followButton
                );
            }


            /* -----------------------------------------
               USER DATA
            ----------------------------------------- */

            card.dataset.userId =
                user.user_id;

            card.dataset.username =
                user.username;


            container.appendChild(
                card
            );

        }
    );
}


async function loadPeople() {

    const container =
        findPeopleContainer();

    if (!container) {

        console.warn(
            "Usanex: People container not found."
        );

        return;
    }


    const template =
        findPersonCard(container);

    if (!template) {

        console.warn(
            "Usanex: People card template not found."
        );

        return;
    }


    /*
     * Loading state
     */

    const originalHTML =
        container.innerHTML;

    container.dataset.loading =
        "true";


    try {

        const response =
            await fetch(
                "/api/users/people?limit=20&offset=0",
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    },
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `People API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                "Invalid people API response"
            );

        }


        renderPeople(
            data.users || []
        );


        console.log(
            "Usanex: Real users loaded:",
            data.users?.length || 0
        );


    } catch (error) {

        console.error(
            "Usanex: Failed to load people.",
            error
        );


        /*
         * Keep the existing UI if API fails.
         * This prevents a blank Home page.
         */

        container.innerHTML =
            originalHTML;


        const buttons =
            container.querySelectorAll(
                ".follow-button"
            );


        buttons.forEach(
            attachFollowButton
        );

    } finally {

        container.dataset.loading =
            "false";
    }
}


/* =========================================================
   INITIAL LOAD OF REAL USERS
========================================================= */

loadPeople();


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


/* =========================================================
   VERSION
========================================================= */

console.log(
    "Usanex Home v6 - database people loader loaded successfully."
);
