"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const searchResults =
    document.getElementById("searchResults");

const searchStatus =
    document.getElementById("searchStatus");


/* =========================================================
   SEARCH STATE
========================================================= */

let searchTimer = null;

let currentController = null;


/* =========================================================
   SEARCH INPUT
========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const query =
                searchInput.value.trim();


            clearTimeout(
                searchTimer
            );


            if (clearSearch) {

                clearSearch.hidden =
                    query.length === 0;

            }


            if (!query) {

                resetSearch();

                return;
            }


            searchTimer =
                setTimeout(
                    function () {

                        searchPeople(
                            query
                        );

                    },
                    350
                );

        }
    );

}


/* =========================================================
   CLEAR SEARCH
========================================================= */

if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        function () {

            if (searchInput) {

                searchInput.value = "";

            }


            clearSearch.hidden =
                true;


            resetSearch();


            if (searchInput) {

                searchInput.focus();

            }

        }
    );

}


/* =========================================================
   RESET SEARCH
========================================================= */

function resetSearch() {

    if (currentController) {

        currentController.abort();

        currentController = null;

    }


    if (searchResults) {

        searchResults.innerHTML = "";

    }


    if (searchStatus) {

        searchStatus.textContent =
            "Search people on Usanex";

    }

}


/* =========================================================
   SEARCH PEOPLE
========================================================= */

async function searchPeople(
    query
) {

    if (currentController) {

        currentController.abort();

    }


    currentController =
        new AbortController();


    if (searchStatus) {

        searchStatus.textContent =
            "Searching...";

    }


    if (searchResults) {

        searchResults.innerHTML = `
            <div class="search-loading">
                Searching people...
            </div>
        `;

    }


    try {

        const response =
            await fetch(
                `/api/search/people?q=${encodeURIComponent(query)}&limit=20&offset=0`,
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store",

                    signal:
                        currentController.signal
                }
            );


        /* -----------------------------------------
           LOGIN REQUIRED
        ----------------------------------------- */

        if (
            response.status === 401
        ) {

            window.location.replace(
                "/login"
            );

            return;
        }


        /* -----------------------------------------
           OTHER API ERROR
        ----------------------------------------- */

        if (!response.ok) {

            throw new Error(
                `Search request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                "Invalid search response"
            );

        }


        renderResults(
            data.users || []
        );


    } catch (error) {

        /* -----------------------------------------
           Ignore cancelled search
        ----------------------------------------- */

        if (
            error.name ===
            "AbortError"
        ) {

            return;

        }


        console.error(
            "Usanex search error:",
            error
        );


        if (searchStatus) {

            searchStatus.textContent =
                "Something went wrong";

        }


        if (searchResults) {

            searchResults.innerHTML = `
                <div class="search-empty">
                    Please try again.
                </div>
            `;

        }

    }

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(
    users
) {

    if (!users.length) {

        if (searchStatus) {

            searchStatus.textContent =
                "No people found";

        }


        if (searchResults) {

            searchResults.innerHTML = `
                <div class="search-empty">
                    No matching people found.
                </div>
            `;

        }

        return;
    }


    if (searchStatus) {

        searchStatus.textContent =
            `${users.length} people found`;

    }


    if (searchResults) {

        searchResults.innerHTML = "";

    }


    users.forEach(
        function (user) {

            const card =
                createUserCard(
                    user
                );


            if (searchResults) {

                searchResults.appendChild(
                    card
                );

            }

        }
    );

}


/* =========================================================
   CREATE USER CARD
========================================================= */

function createUserCard(
    user
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "search-user-card";


    /* =====================================================
       AVATAR
    ===================================================== */

    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "search-user-avatar";


    if (user.profile_photo) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            user.profile_photo;


        image.alt =
            user.name || "User";


        image.loading =
            "lazy";


        image.onerror =
            function () {

                image.remove();

                avatar.textContent =
                    getInitial(
                        user.name
                    );

            };


        avatar.appendChild(
            image
        );

    } else {

        avatar.textContent =
            getInitial(
                user.name
            );

    }


    /* =====================================================
       USER INFORMATION
    ===================================================== */

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "search-user-info";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "search-user-name";


    name.textContent =
        user.name || "User";


    const username =
        document.createElement(
            "div"
        );


    username.className =
        "search-user-username";


    username.textContent =
        user.username || "";


    info.appendChild(
        name
    );

    info.appendChild(
        username
    );


    /* =====================================================
       FOLLOW BUTTON
    ===================================================== */

    const followButton =
        document.createElement(
            "button"
        );


    followButton.type =
        "button";


    followButton.className =
        "search-follow-button";


    followButton.textContent =
        "Follow";


    followButton.dataset.userId =
        user.user_id || "";


    followButton.dataset.username =
        user.username || "";


    followButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            /*
             * Follow API next step me connect hoga.
             *
             * Abhi UI state:
             * Follow → Request Sent
             */

            if (
                followButton.classList.contains(
                    "requested"
                )
            ) {

                return;

            }


            followButton.textContent =
                "Request Sent";


            followButton.classList.add(
                "requested"
            );

        }
    );


    /* =====================================================
       CARD DATA
    ===================================================== */

    card.dataset.userId =
        user.user_id || "";


    card.dataset.username =
        user.username || "";


    /*
     * Normal card click intentionally does nothing.
     *
     * Profile opening will later be connected
     * only through the DP.
     */


    /* =====================================================
       ASSEMBLE
    ===================================================== */

    card.appendChild(
        avatar
    );


    card.appendChild(
        info
    );


    card.appendChild(
        followButton
    );


    return card;

}


/* =========================================================
   GET INITIAL
========================================================= */

function getInitial(
    name
) {

    if (!name) {

        return "U";

    }


    return name
        .trim()
        .charAt(0)
        .toUpperCase();

}


/* =========================================================
   INITIAL STATE
========================================================= */

if (searchStatus) {

    searchStatus.textContent =
        "Search people on Usanex";

}


console.log(
    "Usanex Search v4 loaded successfully."
);
