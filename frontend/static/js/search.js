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
           API ERROR
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


            sendConnectionRequest(
                user,
                followButton
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


    /* =====================================================
       ASSEMBLE CARD
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
   SEND REAL CONNECTION REQUEST
========================================================= */

async function sendConnectionRequest(
    user,
    button
) {

    const targetUserId =
        (
            user.user_id ||
            ""
        ).trim();


    /* -----------------------------------------
       Safety check
    ----------------------------------------- */

    if (!targetUserId) {

        alert(
            "User ID is missing."
        );

        return;
    }


    /* -----------------------------------------
       Prevent duplicate clicks
    ----------------------------------------- */

    if (
        button.disabled ||
        button.classList.contains(
            "requested"
        )
    ) {

        return;

    }


    const originalText =
        button.textContent;


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
                                targetUserId
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


        /* -----------------------------------------
           SESSION EXPIRED
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
           REQUEST SUCCESS
        ----------------------------------------- */

        if (
            response.ok &&
            data.success === true
        ) {

            button.textContent =
                "Request Sent";


            button.classList.add(
                "requested"
            );


            button.disabled =
                true;


            return;
        }


        /* -----------------------------------------
           ALREADY PENDING / CONNECTED
        ----------------------------------------- */

        if (
            response.status === 409
        ) {

            const message =
                data.detail ||
                "Connection request already exists.";


            /*
             * If the request is already pending,
             * show the correct UI state.
             */

            if (
                message.toLowerCase()
                    .includes(
                        "already pending"
                    )
            ) {

                button.textContent =
                    "Request Sent";


                button.classList.add(
                    "requested"
                );


                button.disabled =
                    true;


                return;
            }


            if (
                message.toLowerCase()
                    .includes(
                        "already connected"
                    )
            ) {

                button.textContent =
                    "Connected";


                button.classList.add(
                    "requested"
                );


                button.disabled =
                    true;


                return;
            }


            throw new Error(
                message
            );
        }


        /* -----------------------------------------
           OTHER ERROR
        ----------------------------------------- */

        throw new Error(
            data.detail ||
            "Unable to send connection request."
        );


    } catch (error) {

        console.error(
            "Usanex connection request error:",
            error
        );


        button.disabled =
            false;


        button.textContent =
            originalText;


        alert(
            error.message ||
            "Unable to send request. Please try again."
        );

    }

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
    "Usanex Search v5 - real connection request loaded successfully."
);
