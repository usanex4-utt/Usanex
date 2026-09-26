"use strict";

/* =========================================================
   USANEX SEARCH
   Search + Connection Requests + DP Viewer
   ========================================================= */

console.log("Usanex Search - Connection Request System loaded.");


/* =========================================================
   DOM
========================================================= */

const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const searchStatus = document.getElementById("searchStatus");
const searchResults = document.getElementById("searchResults");


/* =========================================================
   STATE
========================================================= */

let searchTimer = null;
let currentSearchRequest = null;

let dpViewer = null;
let dpImage = null;

let dpScale = 1;
let dpX = 0;
let dpY = 0;

const DP_MIN_SCALE = 1;
const DP_MAX_SCALE = 4;

let pointers = new Map();

let pinchStartDistance = 0;
let pinchStartScale = 1;

let dragStartX = 0;
let dragStartY = 0;

let dragStartImageX = 0;
let dragStartImageY = 0;

let isDragging = false;


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeHtmlAttribute(value) {
    return escapeHtml(value);
}


function getInitial(name) {
    const text = String(name || "").trim();

    if (!text) {
        return "U";
    }

    return text.charAt(0).toUpperCase();
}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function getConnectionStatus(user) {

    if (
        user.is_self ||
        user.connection_status === "self"
    ) {
        return "self";
    }


    if (
        user.is_connected ||
        user.connection_status === "connected"
    ) {
        return "connected";
    }


    if (
        user.request_sent ||
        user.connection_status === "pending_sent"
    ) {
        return "pending_sent";
    }


    if (
        user.request_received ||
        user.connection_status === "pending_received"
    ) {
        return "pending_received";
    }


    return "none";
}


/* =========================================================
   SEARCH
========================================================= */

async function performSearch() {

    if (!searchInput || !searchResults) {
        return;
    }


    const query =
        searchInput.value.trim();


    if (!query) {

        if (clearSearch) {
            clearSearch.style.display = "none";
        }

        if (searchStatus) {
            searchStatus.textContent =
                "Search people by name, username, user ID or mobile";
        }

        searchResults.innerHTML = "";

        return;
    }


    if (clearSearch) {
        clearSearch.style.display = "flex";
    }


    if (searchStatus) {
        searchStatus.textContent =
            "Searching...";
    }


    searchResults.innerHTML = `
        <div class="search-loading">
            Searching...
        </div>
    `;


    if (currentSearchRequest) {

        try {
            currentSearchRequest.abort();
        } catch (_) {}

    }


    currentSearchRequest =
        new AbortController();


    try {

        const response =
            await fetch(
                `/api/search/people?q=${encodeURIComponent(query)}&limit=50&offset=0`,
                {
                    method: "GET",
                    credentials: "include",
                    signal:
                        currentSearchRequest.signal,
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Search failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        const users =
            Array.isArray(data.users)
                ? data.users
                : [];


        renderSearchResults(users);

    } catch (error) {

        if (
            error.name === "AbortError"
        ) {
            return;
        }


        console.error(
            "Search error:",
            error
        );


        if (searchStatus) {
            searchStatus.textContent =
                "Something went wrong.";
        }


        searchResults.innerHTML = `
            <div class="search-empty">
                Unable to load search results.<br>
                Please try again.
            </div>
        `;
    }
}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderSearchResults(users) {

    if (!searchResults) {
        return;
    }


    if (!users.length) {

        if (searchStatus) {
            searchStatus.textContent =
                "No users found.";
        }


        searchResults.innerHTML = `
            <div class="search-empty">
                No matching users found.
            </div>
        `;

        return;
    }


    if (searchStatus) {

        searchStatus.textContent =
            `${users.length} user${users.length === 1 ? "" : "s"} found`;
    }


    searchResults.innerHTML = "";


    users.forEach(
        user => {

            searchResults.appendChild(
                createUserCard(user)
            );

        }
    );
}


/* =========================================================
   USER CARD
========================================================= */

function createUserCard(user) {

    const card =
        document.createElement("div");


    card.className =
        "search-user-card";


    const status =
        getConnectionStatus(user);


    const name =
        escapeHtml(
            user.name || "User"
        );


    const username =
        escapeHtml(
            user.username || ""
        );


    const userId =
        escapeHtml(
            user.user_id || ""
        );


    const photo =
        user.profile_photo
            ? escapeHtmlAttribute(
                user.profile_photo
            )
            : "";


    const initial =
        escapeHtml(
            getInitial(
                user.name ||
                user.username ||
                user.user_id
            )
        );


    /* =====================================================
       AVATAR
    ===================================================== */

    let avatarHTML = "";


    if (photo) {

        avatarHTML = `
            <div
                class="search-user-avatar"
                role="button"
                tabindex="0"
                aria-label="View profile photo"
            >
                <img
                    src="${photo}"
                    alt="${name}"
                    draggable="false"
                >
            </div>
        `;

    } else {

        avatarHTML = `
            <div
                class="search-user-avatar"
                role="button"
                tabindex="0"
                aria-label="View profile photo"
            >
                ${initial}
            </div>
        `;
    }


    /* =====================================================
       BUTTON STATE
    ===================================================== */

    let buttonText = "Request";

    let buttonClass = "";

    let buttonDisabled = false;


    if (status === "self") {

        buttonText =
            "You";

        buttonDisabled =
            true;

    }

    else if (
        status === "connected"
    ) {

        buttonText =
            "Connected";

        buttonClass =
            "connected";

    }

    else if (
        status === "pending_sent"
    ) {

        buttonText =
            "Requested";

        buttonClass =
            "requested";

        buttonDisabled =
            true;

    }

    else if (
        status === "pending_received"
    ) {

        buttonText =
            "Accept";

        buttonClass =
            "request";

    }


    /* =====================================================
       CARD HTML
    ===================================================== */

    card.innerHTML = `
        ${avatarHTML}

        <div class="search-user-info">

            <div class="search-user-name">
                ${name}
            </div>

            <div class="search-user-username">
                ${
                    username
                        ? "@" + username
                        : userId
                }
            </div>

        </div>

        <button
            type="button"
            class="search-follow-button ${buttonClass}"
            ${buttonDisabled ? "disabled" : ""}
        >
            ${buttonText}
        </button>
    `;


    /* =====================================================
       AVATAR
    ===================================================== */

    const avatar =
        card.querySelector(
            ".search-user-avatar"
        );


    if (avatar) {

        const openAvatar =
            function(event) {

                if (event) {

                    event.preventDefault();

                    event.stopPropagation();
                }


                handleAvatarClick(
                    user,
                    status
                );
            };


        avatar.addEventListener(
            "click",
            openAvatar
        );


        avatar.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    openAvatar(event);
                }
            }
        );


        avatar.addEventListener(
            "contextmenu",
            function(event) {

                event.preventDefault();
            }
        );
    }


    /* =====================================================
       REQUEST BUTTON
    ===================================================== */

    const button =
        card.querySelector(
            ".search-follow-button"
        );


    if (button) {

        button.addEventListener(
            "click",
            async function(event) {

                event.preventDefault();

                event.stopPropagation();


                if (
                    status === "self"
                ) {
                    return;
                }


                if (
                    status === "pending_sent"
                ) {
                    return;
                }


                if (
                    status === "connected"
                ) {

                    openUserProfile(user);

                    return;
                }


                if (
                    status === "pending_received"
                ) {

                    /*
                     * Received request.
                     * Open notifications where
                     * accept/reject can be handled.
                     */

                    window.location.href =
                        "/notifications";

                    return;
                }


                if (
                    status === "none"
                ) {

                    await sendConnectionRequest(
                        user,
                        button
                    );
                }

            }
        );
    }


    return card;
}


/* =========================================================
   AVATAR CLICK
========================================================= */

function handleAvatarClick(
    user,
    status
) {

    if (
        status === "self"
    ) {

        window.location.href =
            "/profile";

        return;
    }


    if (
        status === "connected"
    ) {

        openUserProfile(user);

        return;
    }


    /*
     * Non-connected users:
     * only profile photo viewer.
     */

    openDpViewer(user);
}


/* =========================================================
   OPEN PROFILE
========================================================= */

function openUserProfile(user) {

    if (
        !user ||
        !user.user_id
    ) {
        return;
    }


    window.location.href =
        `/profile?user_id=${encodeURIComponent(
            user.user_id
        )}`;
}


/* =========================================================
   SEND CONNECTION REQUEST
========================================================= */

async function sendConnectionRequest(
    user,
    button
) {

    if (
        !user ||
        !user.user_id
    ) {
        return;
    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Sending...";
    }


    try {

        const response =
            await fetch(
                "/api/connections/request",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            user_id:
                                user.user_id
                        })
                }
            );


        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }


        const data =
            await response
                .json()
                .catch(
                    () => ({})
                );


        if (
            !response.ok
        ) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to send request."
            );
        }


        /*
         * Request successfully sent.
         */

        if (button) {

            button.textContent =
                "Requested";

            button.classList.add(
                "requested"
            );

            button.disabled =
                true;
        }


    } catch (error) {

        console.error(
            "Connection request error:",
            error
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Request";
        }


        alert(
            error.message ||
            "Unable to send request."
        );
    }
}


/* =========================================================
   DP VIEWER
========================================================= */

function openDpViewer(user) {

    if (
        !user ||
        !user.profile_photo
    ) {
        return;
    }


    closeDpViewer();


    dpScale = 1;
    dpX = 0;
    dpY = 0;

    pointers.clear();

    pinchStartDistance = 0;
    pinchStartScale = 1;

    isDragging = false;


    /* =====================================================
       ROOT
    ===================================================== */

    const viewer =
        document.createElement("div");


    viewer.id =
        "usanexDpViewer";


    viewer.className =
        "usanex-dp-viewer";


    viewer.setAttribute(
        "role",
        "dialog"
    );


    viewer.setAttribute(
        "aria-modal",
        "true"
    );


    viewer.setAttribute(
        "aria-label",
        "Profile photo viewer"
    );


    /* =====================================================
       OVERLAY
    ===================================================== */

    const overlay =
        document.createElement("div");


    overlay.className =
        "usanex-dp-overlay";


    /* =====================================================
       CONTENT
    ===================================================== */

    const content =
        document.createElement("div");


    content.className =
        "usanex-dp-content";


    /* =====================================================
       IMAGE
    ===================================================== */

    const image =
        document.createElement("img");


    image.className =
        "usanex-dp-large";


    image.src =
        user.profile_photo;


    image.alt =
        user.name ||
        "Profile photo";


    image.draggable =
        false;


    image.setAttribute(
        "draggable",
        "false"
    );


    /* =====================================================
       CLOSE
    ===================================================== */

    const closeButton =
        document.createElement("button");


    closeButton.type =
        "button";


    closeButton.className =
        "usanex-dp-close";


    closeButton.setAttribute(
        "aria-label",
        "Close"
    );


    closeButton.innerHTML =
        "&times;";


    /* =====================================================
       USER INFO
    ===================================================== */

    const userInfo =
        document.createElement("div");


    userInfo.className =
        "usanex-dp-user-info";


    userInfo.innerHTML = `
        <div class="usanex-dp-user-name">
            ${escapeHtml(
                user.name ||
                "User"
            )}
        </div>
    `;


    content.appendChild(
        image
    );


    overlay.appendChild(
        content
    );

    overlay.appendChild(
        closeButton
    );

    overlay.appendChild(
        userInfo
    );


    viewer.appendChild(
        overlay
    );


    document.body.appendChild(
        viewer
    );


    document.body.classList.add(
        "usanex-dp-open"
    );


    dpViewer =
        viewer;


    dpImage =
        image;


    /* =====================================================
       CLOSE
    ===================================================== */

    closeButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            closeDpViewer();
        }
    );


    /* =====================================================
       OUTSIDE CLICK
    ===================================================== */

    overlay.addEventListener(
        "click",
        function(event) {

            if (
                event.target === overlay
            ) {

                closeDpViewer();
            }
        }
    );


    /* =====================================================
       PROTECTION
    ===================================================== */

    viewer.addEventListener(
        "contextmenu",
        function(event) {

            event.preventDefault();
        }
    );


    image.addEventListener(
        "dragstart",
        function(event) {

            event.preventDefault();
        }
    );


    /* =====================================================
       POINTER EVENTS
    ===================================================== */

    content.addEventListener(
        "pointerdown",
        dpPointerDown
    );


    content.addEventListener(
        "pointermove",
        dpPointerMove
    );


    content.addEventListener(
        "pointerup",
        dpPointerUp
    );


    content.addEventListener(
        "pointercancel",
        dpPointerUp
    );


    content.addEventListener(
        "pointerleave",
        dpPointerUp
    );


    /* =====================================================
       DOUBLE TAP
    ===================================================== */

    let lastTapTime = 0;


    content.addEventListener(
        "pointerup",
        function(event) {

            if (
                pointers.size > 0
            ) {
                return;
            }


            const now =
                Date.now();


            if (
                now - lastTapTime < 300
            ) {

                toggleDpZoom(
                    event.clientX,
                    event.clientY
                );
            }


            lastTapTime =
                now;
        }
    );


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        dpEscapeHandler
    );
}


/* =========================================================
   DP POINTER DOWN
========================================================= */

function dpPointerDown(event) {

    if (
        !dpViewer ||
        !dpImage
    ) {
        return;
    }


    event.preventDefault();


    const content =
        event.currentTarget;


    pointers.set(
        event.pointerId,
        {
            x: event.clientX,
            y: event.clientY
        }
    );


    try {

        content.setPointerCapture(
            event.pointerId
        );

    } catch (_) {}


    if (
        pointers.size === 1
    ) {

        isDragging =
            true;


        dragStartX =
            event.clientX;


        dragStartY =
            event.clientY;


        dragStartImageX =
            dpX;


        dragStartImageY =
            dpY;
    }


    if (
        pointers.size === 2
    ) {

        isDragging =
            false;


        const points =
            Array.from(
                pointers.values()
            );


        pinchStartDistance =
            getPointerDistance(
                points[0],
                points[1]
            );


        pinchStartScale =
            dpScale;
    }
}


/* =========================================================
   DP POINTER MOVE
========================================================= */

function dpPointerMove(event) {

    if (
        !dpViewer ||
        !dpImage
    ) {
        return;
    }


    if (
        !pointers.has(
            event.pointerId
        )
    ) {
        return;
    }


    event.preventDefault();


    pointers.set(
        event.pointerId,
        {
            x: event.clientX,
            y: event.clientY
        }
    );


    /* =====================================================
       PINCH
    ===================================================== */

    if (
        pointers.size >= 2
    ) {

        const points =
            Array.from(
                pointers.values()
            );


        const currentDistance =
            getPointerDistance(
                points[0],
                points[1]
            );


        if (
            pinchStartDistance > 0
        ) {

            const ratio =
                currentDistance /
                pinchStartDistance;


            const nextScale =
                pinchStartScale *
                ratio;


            dpScale =
                clamp(
                    nextScale,
                    DP_MIN_SCALE,
                    DP_MAX_SCALE
                );


            if (
                dpScale ===
                DP_MIN_SCALE
            ) {

                dpX = 0;
                dpY = 0;
            }


            applyDpTransform();
        }


        return;
    }


    /* =====================================================
       DRAG
    ===================================================== */

    if (
        pointers.size === 1 &&
        dpScale > 1 &&
        isDragging
    ) {

        const deltaX =
            event.clientX -
            dragStartX;


        const deltaY =
            event.clientY -
            dragStartY;


        dpX =
            dragStartImageX +
            deltaX;


        dpY =
            dragStartImageY +
            deltaY;


        applyDpTransform();
    }
}


/* =========================================================
   DP POINTER UP
========================================================= */

function dpPointerUp(event) {

    pointers.delete(
        event.pointerId
    );


    if (
        pointers.size === 0
    ) {

        isDragging =
            false;


        pinchStartDistance =
            0;


        pinchStartScale =
            dpScale;

    } else if (
        pointers.size === 1
    ) {

        const remaining =
            Array.from(
                pointers.values()
            )[0];


        isDragging =
            true;


        dragStartX =
            remaining.x;


        dragStartY =
            remaining.y;


        dragStartImageX =
            dpX;


        dragStartImageY =
            dpY;
    }
}


/* =========================================================
   POINTER DISTANCE
========================================================= */

function getPointerDistance(
    pointA,
    pointB
) {

    const dx =
        pointA.x -
        pointB.x;


    const dy =
        pointA.y -
        pointB.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


/* =========================================================
   CLAMP
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.min(
        Math.max(
            value,
            min
        ),
        max
    );
}


/* =========================================================
   TRANSFORM
========================================================= */

function applyDpTransform() {

    if (!dpImage) {
        return;
    }


    dpImage.style.transform =
        `translate3d(${dpX}px, ${dpY}px, 0) scale(${dpScale})`;
}


/* =========================================================
   DOUBLE TAP ZOOM
========================================================= */

function toggleDpZoom(
    clientX,
    clientY
) {

    if (!dpImage) {
        return;
    }


    if (
        dpScale <= 1.05
    ) {

        dpScale = 2;

        dpX = 0;

        dpY = 0;

    } else {

        dpScale = 1;

        dpX = 0;

        dpY = 0;
    }


    applyDpTransform();
}


/* =========================================================
   ESCAPE
========================================================= */

function dpEscapeHandler(event) {

    if (
        event.key === "Escape"
    ) {

        closeDpViewer();
    }
}


/* =========================================================
   CLOSE DP
========================================================= */

function closeDpViewer() {

    if (dpViewer) {

        dpViewer.remove();

        dpViewer = null;

        dpImage = null;
    }


    pointers.clear();


    dpScale = 1;

    dpX = 0;

    dpY = 0;


    pinchStartDistance = 0;

    pinchStartScale = 1;


    isDragging = false;


    document.body.classList.remove(
        "usanex-dp-open"
    );


    document.removeEventListener(
        "keydown",
        dpEscapeHandler
    );
}


/* =========================================================
   CLEAR SEARCH
========================================================= */

if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        function() {

            if (searchInput) {
                searchInput.value = "";
            }


            clearSearch.style.display =
                "none";


            if (searchResults) {
                searchResults.innerHTML = "";
            }


            if (searchStatus) {

                searchStatus.textContent =
                    "Search people by name, username, user ID or mobile";
            }


            if (searchInput) {
                searchInput.focus();
            }
        }
    );
}


/* =========================================================
   SEARCH INPUT
========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            clearTimeout(
                searchTimer
            );


            const query =
                searchInput.value.trim();


            if (!query) {

                if (clearSearch) {
                    clearSearch.style.display =
                        "none";
                }


                if (searchStatus) {

                    searchStatus.textContent =
                        "Search people by name, username, user ID or mobile";
                }


                if (searchResults) {
                    searchResults.innerHTML = "";
                }


                return;
            }


            if (clearSearch) {
                clearSearch.style.display =
                    "flex";
            }


            searchTimer =
                setTimeout(
                    performSearch,
                    300
                );
        }
    );


    searchInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                clearTimeout(
                    searchTimer
                );

                performSearch();
            }
        }
    );
}


/* =========================================================
   BOTTOM NAVIGATION
========================================================= */

function setupBottomNavigation() {

    const homeNav =
        document.getElementById(
            "homeNav"
        );


    const reelNav =
        document.getElementById(
            "reelNav"
        );


    const searchNav =
        document.getElementById(
            "searchNav"
        );


    const notificationNav =
        document.getElementById(
            "notificationNav"
        );


    const profileNav =
        document.getElementById(
            "profileNav"
        );


    if (homeNav) {

        homeNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/home";
            }
        );
    }


    if (reelNav) {

        reelNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/reels";
            }
        );
    }


    if (searchNav) {

        searchNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/search";
            }
        );
    }


    if (notificationNav) {

        notificationNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/notifications";
            }
        );
    }


    if (profileNav) {

        profileNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/profile";
            }
        );
    }
}


/* =========================================================
   IMAGE PROTECTION
========================================================= */

document.addEventListener(
    "contextmenu",
    function(event) {

        const target =
            event.target;


        if (
            target &&
            (
                target.matches(
                    ".search-user-avatar img"
                ) ||
                target.matches(
                    ".usanex-dp-large"
                )
            )
        ) {

            event.preventDefault();
        }
    }
);


document.addEventListener(
    "dragstart",
    function(event) {

        const target =
            event.target;


        if (
            target &&
            (
                target.matches(
                    ".search-user-avatar img"
                ) ||
                target.matches(
                    ".usanex-dp-large"
                )
            )
        ) {

            event.preventDefault();
        }
    }
);


/* =========================================================
   INIT
========================================================= */

setupBottomNavigation();


if (clearSearch) {

    clearSearch.style.display =
        "none";
}


if (searchStatus) {

    searchStatus.textContent =
        "Search people by name, username, user ID or mobile";
}
