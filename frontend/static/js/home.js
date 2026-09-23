"use strict";

/* =========================================================
   USANEX HOME
   Version 9
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
   HOME SEARCH
========================================================= */

function openSearchPage() {

    goTo("/search");

}


if (homeSearch) {

    homeSearch.addEventListener(
        "click",
        function () {

            openSearchPage();

        }
    );


    homeSearch.addEventListener(
        "focus",
        function () {

            openSearchPage();

        }
    );


    homeSearch.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                openSearchPage();

            }

        }
    );

}


/* =========================================================
   BOTTOM HOME
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
   SEARCH NAVIGATION
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
   NOTIFICATION NAVIGATION
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
   MENU NOTIFICATIONS
========================================================= */

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
   MENU SETTINGS
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

        logoutButton.disabled =
            true;

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
   PEOPLE SEE ALL
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
   PEOPLE DATABASE
========================================================= */

function findPeopleContainer() {

    return (
        getElement("peopleList") ||
        document.querySelector(
            ".people-list"
        ) ||
        document.querySelector(
            ".people-cards"
        ) ||
        document.querySelector(
            ".people-container"
        )
    );

}


function findPersonCard(
    container
) {

    if (!container) {
        return null;
    }

    return (
        container.querySelector(
            ".person-card"
        ) ||
        container.querySelector(
            ".people-card"
        ) ||
        container.querySelector(
            ".user-card"
        ) ||
        container.querySelector(
            ".person-item"
        )
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
            element.querySelector(
                selector
            );


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
                user.name ||
                "User";

            image.hidden =
                false;


            if (avatar) {

                avatar.textContent =
                    "";

            }

        } else {

            image.removeAttribute(
                "src"
            );

            image.hidden =
                true;


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

            avatar.textContent =
                "";

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
        async function (event) {

            event.preventDefault();

            event.stopPropagation();


            const userId =
                (
                    button.dataset.userId ||
                    ""
                ).trim();


            if (!userId) {

                alert(
                    "User ID is missing."
                );

                return;

            }


            if (
                button.disabled
            ) {

                return;

            }


            button.disabled =
                true;

            button.textContent =
                "Sending...";


            try {

                const response =
                    await fetch(
                        "/api/connections/request",
                        {
                            method: "POST",

                            credentials:
                                "same-origin",

                            headers: {
                                "Accept":
                                    "application/json",

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    user_id:
                                        userId
                                })
                        }
                    );


                let data = {};


                try {

                    data =
                        await response.json();

                } catch {

                    data = {};

                }


                if (
                    response.status === 401
                ) {

                    goTo(
                        "/login"
                    );

                    return;

                }


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Unable to send request."
                    );

                }


                button.textContent =
                    "Request Sent";

                button.classList.add(
                    "requested"
                );


            } catch (error) {

                console.error(
                    "Usanex follow error:",
                    error
                );


                button.disabled =
                    false;

                button.textContent =
                    "Follow";


                alert(
                    error.message ||
                    "Unable to send request."
                );

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
        return;
    }


    const template =
        findPersonCard(
            container
        );


    if (!template) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !users ||
        users.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "people-empty";


        empty.textContent =
            "No people found.";


        container.appendChild(
            empty
        );


        return;

    }


    users.forEach(
        function (user) {

            const card =
                template.cloneNode(
                    true
                );


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


            setAvatar(
                card,
                user
            );


            const followButton =
                card.querySelector(
                    ".follow-button"
                );


            if (followButton) {

                followButton.disabled =
                    false;

                followButton.textContent =
                    "Follow";

                followButton.classList.remove(
                    "following",
                    "requested"
                );


                followButton.dataset.userId =
                    user.user_id || "";


                attachFollowButton(
                    followButton
                );

            }


            card.dataset.userId =
                user.user_id || "";


            card.dataset.username =
                user.username || "";


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
        return;
    }


    try {

        const response =
            await fetch(
                "/api/users/people?limit=20&offset=0",
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        if (
            response.status === 401
        ) {

            goTo(
                "/login"
            );

            return;

        }


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
                "Invalid people response"
            );

        }


        renderPeople(
            data.users || []
        );


    } catch (error) {

        console.error(
            "Usanex people error:",
            error
        );

    }

}


/* =========================================================
   INITIAL STATE
========================================================= */

if (menuOverlay) {

    menuOverlay.hidden =
        true;

}


loadPeople();


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Usanex Home v9 loaded."
);

console.log(
    "Search:",
    !!homeSearch
);

console.log(
    "Notification:",
    !!notificationNav
);

console.log(
    "Logout:",
    !!logoutButton
);

console.log(
    "Profile:",
    !!profileNav
);
