"use strict";

/* =========================================================
   USANEX NOTIFICATIONS
   Version 2
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const backButton =
    document.getElementById("backButton");

const notificationLoading =
    document.getElementById(
        "notificationLoading"
    );

const notificationEmpty =
    document.getElementById(
        "notificationEmpty"
    );

const connectionRequestsSection =
    document.getElementById(
        "connectionRequestsSection"
    );

const connectionRequests =
    document.getElementById(
        "connectionRequests"
    );

const otherNotificationsSection =
    document.getElementById(
        "otherNotificationsSection"
    );

const notificationPopup =
    document.getElementById(
        "notificationPopup"
    );


/* =========================================================
   TOP NOTIFICATION POPUP
========================================================= */

let popupTimer = null;


function showNotificationPopup(
    message,
    duration = 3000
) {

    if (!notificationPopup) {
        return;
    }


    if (popupTimer) {

        clearTimeout(
            popupTimer
        );

    }


    notificationPopup.textContent =
        message;


    notificationPopup.hidden =
        false;


    /*
     * Force browser to apply hidden=false
     * before adding animation class.
     */
    requestAnimationFrame(
        function () {

            notificationPopup.classList.add(
                "show"
            );

        }
    );


    popupTimer =
        setTimeout(
            function () {

                hideNotificationPopup();

            },
            duration
        );

}


function hideNotificationPopup() {

    if (!notificationPopup) {
        return;
    }


    notificationPopup.classList.remove(
        "show"
    );


    setTimeout(
        function () {

            if (
                !notificationPopup.classList.contains(
                    "show"
                )
            ) {

                notificationPopup.hidden =
                    true;

            }

        },
        320
    );

}


/* =========================================================
   BACK BUTTON
========================================================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            if (
                document.referrer &&
                document.referrer.includes(
                    window.location.host
                )
            ) {

                window.history.back();

                return;
            }


            window.location.href =
                "/home";

        }
    );

}


/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    showLoading();


    try {

        const response =
            await fetch(
                "/api/connections/requests",
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

            window.location.replace(
                "/login"
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Notification request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                "Invalid notification response"
            );

        }


        renderConnectionRequests(
            data.requests || []
        );


    } catch (error) {

        console.error(
            "Usanex notification error:",
            error
        );


        showError();

    }

}


/* =========================================================
   SHOW LOADING
========================================================= */

function showLoading() {

    if (notificationLoading) {

        notificationLoading.hidden =
            false;

    }


    if (notificationEmpty) {

        notificationEmpty.hidden =
            true;

    }


    if (connectionRequestsSection) {

        connectionRequestsSection.hidden =
            true;

    }


    if (otherNotificationsSection) {

        otherNotificationsSection.hidden =
            true;

    }

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError() {

    if (notificationLoading) {

        notificationLoading.hidden =
            true;

    }


    if (notificationEmpty) {

        notificationEmpty.hidden =
            true;

    }


    if (connectionRequestsSection) {

        connectionRequestsSection.hidden =
            false;

    }


    if (connectionRequests) {

        connectionRequests.innerHTML = `
            <div class="notification-error">
                Unable to load notifications.
                Please try again.
            </div>
        `;

    }


    showNotificationPopup(
        "Unable to load notifications.",
        3500
    );

}


/* =========================================================
   RENDER CONNECTION REQUESTS
========================================================= */

function renderConnectionRequests(
    requests
) {

    if (notificationLoading) {

        notificationLoading.hidden =
            true;

    }


    if (connectionRequests) {

        connectionRequests.innerHTML =
            "";

    }


    if (
        !requests ||
        requests.length === 0
    ) {

        if (connectionRequestsSection) {

            connectionRequestsSection.hidden =
                true;

        }


        if (notificationEmpty) {

            notificationEmpty.hidden =
                false;

        }


        return;

    }


    if (notificationEmpty) {

        notificationEmpty.hidden =
            true;

    }


    if (connectionRequestsSection) {

        connectionRequestsSection.hidden =
            false;

    }


    requests.forEach(
        function (request) {

            const card =
                createConnectionRequestCard(
                    request
                );


            if (connectionRequests) {

                connectionRequests.appendChild(
                    card
                );

            }

        }
    );

}


/* =========================================================
   CREATE REQUEST CARD
========================================================= */

function createConnectionRequestCard(
    request
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "connection-request-card";


    card.dataset.requestId =
        request.id || "";


    const sender =
        request.sender || {};


    /* -----------------------------------------------------
       AVATAR
    ----------------------------------------------------- */

    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "request-avatar";


    if (sender.profile_photo) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            sender.profile_photo;


        image.alt =
            sender.name || "User";


        image.loading =
            "lazy";


        image.onerror =
            function () {

                image.remove();

                avatar.textContent =
                    getInitial(
                        sender.name
                    );

            };


        avatar.appendChild(
            image
        );

    } else {

        avatar.textContent =
            getInitial(
                sender.name
            );

    }


    /* -----------------------------------------------------
       USER INFORMATION
    ----------------------------------------------------- */

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "request-info";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "request-name";


    name.textContent =
        sender.name ||
        "User";


    const username =
        document.createElement(
            "div"
        );


    username.className =
        "request-username";


    username.textContent =
        sender.username ||
        "";


    const userId =
        document.createElement(
            "div"
        );


    userId.className =
        "request-user-id";


    userId.textContent =
        sender.user_id ||
        "";


    info.appendChild(
        name
    );

    info.appendChild(
        username
    );

    info.appendChild(
        userId
    );


    /* -----------------------------------------------------
       ACTION BUTTONS
    ----------------------------------------------------- */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "request-actions";


    const acceptButton =
        document.createElement(
            "button"
        );


    acceptButton.type =
        "button";


    acceptButton.className =
        "request-action-button accept-button";


    acceptButton.textContent =
        "Accept";


    const rejectButton =
        document.createElement(
            "button"
        );


    rejectButton.type =
        "button";


    rejectButton.className =
        "request-action-button reject-button";


    rejectButton.textContent =
        "Reject";


    acceptButton.addEventListener(
        "click",
        function () {

            handleRequestAction(
                request.id,
                "accept",
                card,
                acceptButton,
                rejectButton,
                sender
            );

        }
    );


    rejectButton.addEventListener(
        "click",
        function () {

            handleRequestAction(
                request.id,
                "reject",
                card,
                acceptButton,
                rejectButton,
                sender
            );

        }
    );


    actions.appendChild(
        acceptButton
    );

    actions.appendChild(
        rejectButton
    );


    /* -----------------------------------------------------
       CARD
    ----------------------------------------------------- */

    card.appendChild(
        avatar
    );

    card.appendChild(
        info
    );

    card.appendChild(
        actions
    );


    return card;

}


/* =========================================================
   ACCEPT / REJECT REQUEST
========================================================= */

async function handleRequestAction(
    requestId,
    action,
    card,
    acceptButton,
    rejectButton,
    sender
) {

    if (!requestId) {

        showNotificationPopup(
            "Request ID is missing."
        );

        return;

    }


    if (
        acceptButton.disabled ||
        rejectButton.disabled
    ) {

        return;

    }


    acceptButton.disabled =
        true;

    rejectButton.disabled =
        true;


    const originalAcceptText =
        acceptButton.textContent;

    const originalRejectText =
        rejectButton.textContent;


    if (action === "accept") {

        acceptButton.textContent =
            "Accepting...";

    } else {

        rejectButton.textContent =
            "Rejecting...";

    }


    try {

        const response =
            await fetch(
                `/api/connections/request/${requestId}/${action}`,
                {
                    method: "POST",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
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


        if (!response.ok) {

            throw new Error(
                data.detail ||
                `Unable to ${action} request.`
            );

        }


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                `Unable to ${action} request.`
            );

        }


        /* -------------------------------------------------
           ACCEPT SUCCESS
        ------------------------------------------------- */

        if (action === "accept") {

            showNotificationPopup(
                `${sender.name || "User"} connected successfully.`,
                3500
            );


            console.log(
                "Usanex: Connection accepted.",
                data.connection
            );

        }


        /* -------------------------------------------------
           REJECT SUCCESS
        ------------------------------------------------- */

        if (action === "reject") {

            showNotificationPopup(
                "Connection request rejected.",
                3000
            );


            console.log(
                "Usanex: Connection rejected.",
                data.request
            );

        }


        /* -------------------------------------------------
           REMOVE CARD
        ------------------------------------------------- */

        if (card) {

            card.style.opacity =
                "0";

            card.style.transform =
                "translateY(-8px) scale(0.98)";

            card.style.transition =
                "opacity 0.22s ease, transform 0.22s ease";


            setTimeout(
                function () {

                    card.remove();

                    checkEmptyState();

                },
                220
            );

        }


    } catch (error) {

        console.error(
            `Usanex ${action} request error:`,
            error
        );


        acceptButton.disabled =
            false;

        rejectButton.disabled =
            false;


        acceptButton.textContent =
            originalAcceptText;

        rejectButton.textContent =
            originalRejectText;


        showNotificationPopup(
            error.message ||
            `Unable to ${action} request. Please try again.`,
            4000
        );

    }

}


/* =========================================================
   CHECK EMPTY STATE
========================================================= */

function checkEmptyState() {

    if (!connectionRequests) {
        return;
    }


    const cards =
        connectionRequests.querySelectorAll(
            ".connection-request-card"
        );


    if (cards.length === 0) {

        if (connectionRequestsSection) {

            connectionRequestsSection.hidden =
                true;

        }


        if (notificationEmpty) {

            notificationEmpty.hidden =
                false;

        }

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
   INITIAL POPUP STATE
========================================================= */

if (notificationPopup) {

    notificationPopup.hidden =
        true;

}


/* =========================================================
   INITIAL LOAD
========================================================= */

loadNotifications();


/* =========================================================
   VERSION
========================================================= */

console.log(
    "Usanex Notifications v2 loaded."
);
