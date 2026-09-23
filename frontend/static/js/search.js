"use strict";


/* =========================================================
   USANEX SEARCH
   Follow → Verify → Connected
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


/*
 * When Go Card opens this page, these values are
 * received from the notification page.
 */

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


    info.appendChild(
        name
    );

    info.appendChild(
        username
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


    /*
     * If this page was opened from
     * "Go Card", show VERIFY for the
     * requested user.
     */

    const isVerificationCard =
        verificationUserId &&
        verificationUserId ===
            (
                user.user_id ||
                ""
            );


    if (isVerificationCard) {

        createVerifyAction(
            user,
            actionArea
        );

    } else {

        createFollowAction(
            user,
            actionArea
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
   CREATE FOLLOW ACTION
========================================================= */

function createFollowAction(
    user,
    actionArea
) {

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


    actionArea.appendChild(
        followButton
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

    /*
     * Prevent duplicate verification boxes.
     */

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
            style="
                position:absolute;
                right:12px;
                top:100%;
                margin-top:8px;
                z-index:50;
                width:210px;
                padding:12px;
                border-radius:14px;
                background:#151b25;
                border:1px solid #293342;
                box-shadow:0 12px 30px rgba(0,0,0,.45);
            "
        >

            <input
                type="text"
                class="usanex-code-input"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="Enter 6-digit code"
                style="
                    width:100%;
                    box-sizing:border-box;
                    height:42px;
                    border-radius:10px;
                    border:1px solid #364152;
                    outline:none;
                    background:#0d121a;
                    color:#fff;
                    padding:0 11px;
                    font-size:14px;
                "
            >

            <button
                type="button"
                class="usanex-verify-submit"
                style="
                    width:100%;
                    margin-top:8px;
                    height:40px;
                    border:0;
                    border-radius:10px;
                    background:#2563eb;
                    color:#fff;
                    font-size:14px;
                    font-weight:700;
                    cursor:pointer;
                "
            >
                Verify
            </button>

            <div
                class="usanex-verify-message"
                style="
                    margin-top:7px;
                    min-height:17px;
                    font-size:12px;
                    color:#aab4c3;
                    line-height:1.35;
                "
            ></div>

        </div>
    `;


    /*
     * Make sure the card can contain
     * the floating verification box.
     */

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


        /*
         * Only digits.
         */

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


        /*
         * Enter key submits.
         */

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


    /* -----------------------------------------
       VALIDATE CODE
    ----------------------------------------- */

    if (!/^\d{6}$/.test(code)) {

        if (message) {

            message.textContent =
                "Enter a valid 6-digit code.";

            message.style.color =
                "#ff7b7b";
        }

        if (input) {

            input.focus();

        }

        return;
    }


    /*
     * Verification ID is required.
     */

    if (!verificationId) {

        if (message) {

            message.textContent =
                "Verification session not found.";

            message.style.color =
                "#ff7b7b";
        }

        return;
    }


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Verifying...";

        submitButton.style.opacity =
            "0.7";
    }


    if (message) {

        message.textContent =
            "Checking code...";

        message.style.color =
            "#aab4c3";
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
           SUCCESS
        ----------------------------------------- */

        if (
            response.ok &&
            data.success === true
        ) {

            if (message) {

                message.textContent =
                    "Connected successfully.";

                message.style.color =
                    "#6ee7a0";

            }


            /*
             * Small delay so the user can
             * see successful verification.
             */

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


        /* -----------------------------------------
           ERROR
        ----------------------------------------- */

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

            message.style.color =
                "#ff7b7b";
        }


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Verify";

            submitButton.style.opacity =
                "1";
        }

    }

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


    if (!targetUserId) {

        alert(
            "User ID is missing."
        );

        return;
    }


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
                "Request Sent";

            button.classList.add(
                "requested"
            );

            button.disabled =
                true;

            return;
        }


        if (
            response.status === 409
        ) {

            const message =
                data.detail ||
                "Connection request already exists.";


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
   GO CARD MODE
========================================================= */

/*
 * When coming from Notifications → Go Card,
 * automatically search for that user.
 */

function openVerificationUser() {

    if (
        !verificationUserId ||
        !searchInput
    ) {

        return false;
    }


    /*
     * Search by user ID.
     */

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
   INITIAL STATE
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

        /*
         * Normal search page
         */

        if (
            verificationUserId
        ) {

            openVerificationUser();

        }

    }
);


console.log(
    "Usanex Search v6 - Follow + Go Card + Verification loaded."
);
