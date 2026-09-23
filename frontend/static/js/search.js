"use strict";

/* =========================================================
   USANEX SEARCH
   Search:
   - Name
   - Username
   - User ID
   - Mobile Number

   Connection status:
   - You
   - Follow
   - Requested
   - Connected
========================================================= */


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
   VERIFICATION / GO CARD PARAMETERS
========================================================= */

const pageParams =
    new URLSearchParams(
        window.location.search
    );

const verificationUserId =
    (
        pageParams.get("user_id") ||
        ""
    ).trim();

const verificationId =
    (
        pageParams.get("verification_id") ||
        ""
    ).trim();


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
                `/api/search/people?q=${encodeURIComponent(query)}&limit=50&offset=0`,
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


        /* =================================================
           LOGIN REQUIRED
        ================================================= */

        if (
            response.status === 401
        ) {

            window.location.replace(
                "/login"
            );

            return;
        }


        /* =================================================
           API ERROR
        ================================================= */

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


    card.dataset.userId =
        user.user_id || "";


    card.dataset.username =
        user.username || "";


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


    /*
     * Show user ID also.
     */

    const userId =
        document.createElement(
            "div"
        );

    userId.className =
        "search-user-id";

    userId.textContent =
        user.user_id || "";


    info.appendChild(
        name
    );

    info.appendChild(
        username
    );

    info.appendChild(
        userId
    );


    /* =====================================================
       ACTION AREA
    ===================================================== */

    const actionArea =
        document.createElement(
            "div"
        );

    actionArea.className =
        "search-user-action-area";


    /* =====================================================
       CONNECTION STATUS
    ===================================================== */

    const connectionStatus =
        getConnectionStatus(
            user
        );


    /*
     * GO CARD / VERIFICATION
     */

    const isVerificationCard =
        verificationUserId &&
        verificationUserId ===
            (
                user.user_id ||
                ""
            );


    if (
        isVerificationCard &&
        connectionStatus !== "connected" &&
        connectionStatus !== "self"
    ) {

        createVerifyAction(
            user,
            actionArea
        );

    } else {

        createStatusAction(
            user,
            actionArea,
            connectionStatus
        );

    }


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
        actionArea
    );


    return card;

}


/* =========================================================
   GET CONNECTION STATUS
========================================================= */

function getConnectionStatus(
    user
) {

    /*
     * Backend should return:
     *
     * connection_status:
     * self
     * none
     * pending_sent
     * pending_received
     * connected
     *
     * We also support common alternative names
     * so the frontend is tolerant.
     */

    const status =
        String(
            user.connection_status ||
            user.status ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        user.is_self === true ||
        status === "self"
    ) {

        return "self";

    }


    if (
        user.is_connected === true ||
        status === "connected"
    ) {

        return "connected";

    }


    if (
        user.request_sent === true ||
        status === "pending_sent" ||
        status === "requested" ||
        status === "pending"
    ) {

        return "pending_sent";

    }


    if (
        user.request_received === true ||
        status === "pending_received"
    ) {

        return "pending_received";

    }


    return "none";

}


/* =========================================================
   CREATE STATUS ACTION
========================================================= */

function createStatusAction(
    user,
    actionArea,
    status
) {

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "search-follow-button";


    /* =====================================================
       SELF
    ===================================================== */

    if (
        status === "self"
    ) {

        button.textContent =
            "You";

        button.classList.add(
            "you"
        );

        button.disabled =
            true;

        actionArea.appendChild(
            button
        );

        return;

    }


    /* =====================================================
       CONNECTED
    ===================================================== */

    if (
        status === "connected"
    ) {

        button.textContent =
            "Connected";

        button.classList.add(
            "connected"
        );

        button.disabled =
            false;


        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                openUserProfile(
                    user
                );

            }
        );


        actionArea.appendChild(
            button
        );

        return;

    }


    /* =====================================================
       REQUEST ALREADY SENT
    ===================================================== */

    if (
        status === "pending_sent"
    ) {

        button.textContent =
            "Requested";

        button.classList.add(
            "requested"
        );

        button.disabled =
            true;

        actionArea.appendChild(
            button
        );

        return;

    }


    /* =====================================================
       REQUEST RECEIVED
    ===================================================== */

    if (
        status === "pending_received"
    ) {

        button.textContent =
            "Requested";

        button.classList.add(
            "requested"
        );

        button.disabled =
            true;

        actionArea.appendChild(
            button
        );

        return;

    }


    /* =====================================================
       NO CONNECTION
    ===================================================== */

    button.textContent =
        "Follow";


    button.dataset.userId =
        user.user_id || "";


    button.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            sendConnectionRequest(
                user,
                button
            );

        }
    );


    actionArea.appendChild(
        button
    );

}


/* =========================================================
   CREATE VERIFY ACTION
========================================================= */

function createVerifyAction(
    user,
    actionArea
) {

    const verifyButton =
        document.createElement(
            "button"
        );

    verifyButton.type =
        "button";

    verifyButton.className =
        "search-follow-button";

    verifyButton.textContent =
        "VERIFY";

    verifyButton.dataset.userId =
        user.user_id || "";


    verifyButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            openVerificationBox(
                user,
                actionArea
            );

        }
    );


    actionArea.appendChild(
        verifyButton
    );

}


/* =========================================================
   OPEN VERIFICATION BOX
========================================================= */

function openVerificationBox(
    user,
    actionArea
) {

    if (
        actionArea.querySelector(
            ".usanex-verify-box"
        )
    ) {

        return;
    }


    actionArea.innerHTML = `
        <div
            class="usanex-verify-box"
        >

            <input
                type="text"
                class="usanex-code-input"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="Enter 6-digit code"
            >

            <button
                type="button"
                class="usanex-verify-submit"
            >
                Verify
            </button>

            <div
                class="usanex-verify-message"
            ></div>

        </div>
    `;


    const card =
        actionArea.closest(
            ".search-user-card"
        );


    if (card) {

        card.style.position =
            "relative";

        card.style.overflow =
            "visible";

    }


    const input =
        actionArea.querySelector(
            ".usanex-code-input"
        );

    const submitButton =
        actionArea.querySelector(
            ".usanex-verify-submit"
        );

    const message =
        actionArea.querySelector(
            ".usanex-verify-message"
        );


    if (input) {

        input.focus();


        input.addEventListener(
            "input",
            function () {

                input.value =
                    input.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            6
                        );

            }
        );


        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    verifyConnectionCode(
                        user,
                        input,
                        submitButton,
                        message
                    );

                }

            }
        );

    }


    if (submitButton) {

        submitButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                verifyConnectionCode(
                    user,
                    input,
                    submitButton,
                    message
                );

            }
        );

    }

}


/* =========================================================
   VERIFY CONNECTION CODE
========================================================= */

async function verifyConnectionCode(
    user,
    input,
    submitButton,
    message
) {

    const code =
        (
            input?.value ||
            ""
        ).trim();


    if (
        !/^\d{6}$/.test(code)
    ) {

        if (message) {

            message.textContent =
                "Enter a valid 6-digit code.";

            message.className =
                "usanex-verify-message error";

        }

        return;

    }


    if (!verificationId) {

        if (message) {

            message.textContent =
                "Verification session not found.";

            message.className =
                "usanex-verify-message error";

        }

        return;

    }


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Verifying...";

    }


    try {

        const response =
            await fetch(
                "/api/connections/verify",
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
                            verification_id:
                                Number(
                                    verificationId
                                ),

                            code:
                                code
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

            window.location.replace(
                "/login"
            );

            return;

        }


        if (
            response.ok &&
            data.success === true
        ) {

            if (message) {

                message.textContent =
                    "Connected successfully.";

                message.className =
                    "usanex-verify-message success";

            }


            setTimeout(
                function () {

                    window.location.replace(
                        "/home"
                    );

                },
                500
            );

            return;

        }


        throw new Error(
            data.detail ||
            "Verification failed."
        );


    } catch (error) {

        console.error(
            "Usanex verification error:",
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Invalid verification code.";

            message.className =
                "usanex-verify-message error";

        }


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Verify";

        }

    }

}


/* =========================================================
   SEND CONNECTION REQUEST
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


    if (!targetUserId) {

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


        if (
            response.status === 401
        ) {

            window.location.replace(
                "/login"
            );

            return;

        }


        if (
            response.ok &&
            data.success === true
        ) {

            button.textContent =
                "Requested";

            button.classList.add(
                "requested"
            );

            button.disabled =
                true;

            return;

        }


        /*
         * Backend may return 409 when
         * request already exists or user
         * is already connected.
         */

        if (
            response.status === 409
        ) {

            const detail =
                String(
                    data.detail ||
                    ""
                ).toLowerCase();


            if (
                detail.includes(
                    "connected"
                )
            ) {

                button.textContent =
                    "Connected";

                button.classList.add(
                    "connected"
                );

                button.disabled =
                    false;

                return;

            }


            if (
                detail.includes(
                    "pending"
                ) ||
                detail.includes(
                    "request"
                )
            ) {

                button.textContent =
                    "Requested";

                button.classList.add(
                    "requested"
                );

                button.disabled =
                    true;

                return;

            }

        }


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
            "Follow";


        alert(
            error.message ||
            "Unable to send request. Please try again."
        );

    }

}


/* =========================================================
   OPEN USER PROFILE
========================================================= */

function openUserProfile(
    user
) {

    const userId =
        (
            user.user_id ||
            ""
        ).trim();


    if (!userId) {

        return;

    }


    /*
     * Profile route will be connected
     * when profile page is completed.
     */

    window.location.href =
        `/profile?user_id=${encodeURIComponent(
            userId
        )}`;

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
   GO CARD MODE
========================================================= */

function openVerificationUser() {

    if (
        !verificationUserId ||
        !searchInput
    ) {

        return false;

    }


    searchInput.value =
        verificationUserId;


    if (clearSearch) {

        clearSearch.hidden =
            false;

    }


    searchPeople(
        verificationUserId
    );


    return true;

}


/* =========================================================
   INITIAL STATUS
========================================================= */

if (searchStatus) {

    searchStatus.textContent =
        "Search people on Usanex";

}


/* =========================================================
   INITIAL PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (
            verificationUserId
        ) {

            openVerificationUser();

        }

    }
);


console.log(
    "Usanex Search v7 loaded."
);
