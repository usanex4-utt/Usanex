"use strict";


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


    /* -----------------------------------------------------
       SENDER
    ----------------------------------------------------- */

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
       USER INFO
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
       ACTIONS
    ----------------------------------------------------- */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "request-actions";


    /* -----------------------------------------------------
       ACCEPT
    ----------------------------------------------------- */

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


    acceptButton.addEventListener(
        "click",
        function () {

            handleRequestAction(
                request.id,
                "accept",
                card,
                acceptButton,
                rejectButton
            );

        }
    );


    /* -----------------------------------------------------
       REJECT
    ----------------------------------------------------- */

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


    rejectButton.addEventListener(
        "click",
        function () {

            handleRequestAction(
                request.id,
                "reject",
                card,
                acceptButton,
                rejectButton
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
    rejectButton
) {

    if (!requestId) {

        alert(
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
           REMOVE CARD
        ------------------------------------------------- */

        if (card) {

            card.style.opacity =
                "0";

            card.style.transform =
                "scale(0.98)";

            card.style.transition =
                "opacity 0.2s ease, transform 0.2s ease";


            setTimeout(
                function () {

                    card.remove();

                    checkEmptyState();

                },
                220
            );

        }


        /* -------------------------------------------------
           ACCEPT MESSAGE
        ------------------------------------------------- */

        if (action === "accept") {

            console.log(
                "Usanex: Connection accepted.",
                data.connection
            );

        } else {

            console.log(
                "Usanex: Connection rejected.",
                data.request
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


        alert(
            error.message ||
            `Unable to ${action} request. Please try again.`
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
   INITIAL LOAD
========================================================= */

loadNotifications();


/* =========================================================
   VERSION
========================================================= */

console.log(
    "Usanex Notifications v1 - connection requests loaded successfully."
);
