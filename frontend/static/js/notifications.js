// =========================================================
// USANEX - NOTIFICATIONS
// Connection Requests + Verification Notifications
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const loading =
        document.getElementById(
            "notificationLoading"
        );

    const empty =
        document.getElementById(
            "notificationEmpty"
        );

    const requestsSection =
        document.getElementById(
            "connectionRequestsSection"
        );

    const requestsContainer =
        document.getElementById(
            "connectionRequests"
        );

    const otherSection =
        document.getElementById(
            "otherNotificationsSection"
        );

    const otherContainer =
        document.getElementById(
            "otherNotifications"
        );

    const popup =
        document.getElementById(
            "notificationPopup"
        );


    // =====================================================
    // POPUP
    // =====================================================

    function showPopup(message) {

        if (!popup) {
            return;
        }

        popup.textContent = message;

        popup.hidden = false;

        requestAnimationFrame(() => {

            popup.classList.add("show");

        });


        setTimeout(() => {

            popup.classList.remove("show");


            setTimeout(() => {

                popup.hidden = true;

            }, 300);

        }, 2500);
    }


    // =====================================================
    // HTML ESCAPE
    // =====================================================

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =====================================================
    // BOTTOM NAVIGATION
    // =====================================================

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


    // -----------------------------------------------------
    // HOME
    // -----------------------------------------------------

    if (homeNav) {

        homeNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/home";

            }
        );

    }


    // -----------------------------------------------------
    // REEL
    // -----------------------------------------------------

    if (reelNav) {

        reelNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/reels";

            }
        );

    }


    // -----------------------------------------------------
    // SEARCH
    // -----------------------------------------------------

    if (searchNav) {

        searchNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/search";

            }
        );

    }


    // -----------------------------------------------------
    // NOTIFICATION
    // -----------------------------------------------------

    if (notificationNav) {

        notificationNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/notifications";

            }
        );

    }


    // -----------------------------------------------------
    // PROFILE
    // -----------------------------------------------------

    if (profileNav) {

        profileNav.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/profile";

            }
        );

    }


    // =====================================================
    // LOAD ALL NOTIFICATIONS
    // =====================================================

    async function loadNotifications() {

        try {

            if (loading) {
                loading.hidden = false;
            }

            if (empty) {
                empty.hidden = true;
            }

            if (requestsSection) {
                requestsSection.hidden = true;
            }

            if (otherSection) {
                otherSection.hidden = true;
            }

            if (requestsContainer) {
                requestsContainer.innerHTML = "";
            }

            if (otherContainer) {
                otherContainer.innerHTML = "";
            }


            // =================================================
            // CONNECTION REQUESTS
            // =================================================

            const requestResponse =
                await fetch(
                    "/api/connections/requests",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (
                requestResponse.status === 401
            ) {

                window.location.href =
                    "/login";

                return;
            }


            let requestData = [];


            if (requestResponse.ok) {

                requestData =
                    await requestResponse.json();

            }


            // =================================================
            // VERIFICATION NOTIFICATIONS
            // =================================================

            const notificationResponse =
                await fetch(
                    "/api/connections/notifications",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (
                notificationResponse.status === 401
            ) {

                window.location.href =
                    "/login";

                return;
            }


            let notificationData = [];


            if (notificationResponse.ok) {

                notificationData =
                    await notificationResponse.json();

            }


            // =================================================
            // NORMALIZE REQUEST DATA
            // =================================================

            if (
                !Array.isArray(
                    requestData
                )
            ) {

                if (
                    requestData &&
                    Array.isArray(
                        requestData.requests
                    )
                ) {

                    requestData =
                        requestData.requests;

                } else {

                    requestData = [];

                }

            }


            // =================================================
            // NORMALIZE NOTIFICATION DATA
            // =================================================

            if (
                !Array.isArray(
                    notificationData
                )
            ) {

                if (
                    notificationData &&
                    Array.isArray(
                        notificationData.notifications
                    )
                ) {

                    notificationData =
                        notificationData.notifications;

                } else {

                    notificationData = [];

                }

            }


            // =================================================
            // RENDER
            // =================================================

            renderConnectionRequests(
                requestData
            );


            renderVerificationNotifications(
                notificationData
            );


            if (loading) {
                loading.hidden = true;
            }


            const hasRequests =
                requestData.length > 0;


            const hasNotifications =
                notificationData.length > 0;


            if (
                !hasRequests &&
                !hasNotifications
            ) {

                if (empty) {
                    empty.hidden = false;
                }

            }


        } catch (error) {

            console.error(
                "Notification error:",
                error
            );


            if (loading) {
                loading.hidden = true;
            }


            if (empty) {
                empty.hidden = false;
            }


            showPopup(
                "Unable to load notifications."
            );

        }

    }


    // =====================================================
    // CONNECTION REQUESTS
    // =====================================================

    function renderConnectionRequests(
        requests
    ) {

        if (!requestsContainer) {
            return;
        }


        requestsContainer.innerHTML = "";


        if (!requests.length) {

            if (requestsSection) {
                requestsSection.hidden = true;
            }

            return;
        }


        if (requestsSection) {
            requestsSection.hidden = false;
        }


        requests.forEach(
            (request) => {

                const sender =
                    request.sender || {};


                const requestId =
                    request.id;


                const name =
                    sender.name ||
                    request.name ||
                    "User";


                const username =
                    sender.username ||
                    request.username ||
                    "";


                const userId =
                    sender.user_id ||
                    request.user_id ||
                    "";


                const photo =
                    sender.profile_photo ||
                    request.profile_photo ||
                    "";


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "notification-card";


                card.innerHTML = `

                    <div class="notification-user">

                        ${
                            photo
                            ?
                            `
                            <img
                                src="${escapeHtml(photo)}"
                                class="notification-avatar"
                                alt=""
                            >
                            `
                            :
                            `
                            <div class="notification-avatar placeholder">
                                U
                            </div>
                            `
                        }


                        <div class="notification-user-info">

                            <strong>
                                ${escapeHtml(name)}
                            </strong>


                            ${
                                username
                                ?
                                `
                                <span>
                                    ${escapeHtml(username)}
                                </span>
                                `
                                :
                                ""
                            }


                            ${
                                userId
                                ?
                                `
                                <small>
                                    ${escapeHtml(userId)}
                                </small>
                                `
                                :
                                ""
                            }

                        </div>

                    </div>


                    <div class="notification-actions">

                        <button
                            type="button"
                            class="accept-button"
                            data-request-id="${escapeHtml(requestId)}"
                            data-action="accept"
                        >
                            Accept
                        </button>


                        <button
                            type="button"
                            class="reject-button"
                            data-request-id="${escapeHtml(requestId)}"
                            data-action="reject"
                        >
                            Reject
                        </button>

                    </div>

                `;


                requestsContainer.appendChild(
                    card
                );

            }
        );


        // =================================================
        // ACCEPT / REJECT
        // =================================================

        requestsContainer
            .querySelectorAll(
                "[data-request-id]"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const requestId =
                                button.dataset.requestId;


                            const action =
                                button.dataset.action;


                            if (!requestId) {
                                return;
                            }


                            button.disabled =
                                true;


                            try {

                                const response =
                                    await fetch(
                                        `/api/connections/request/${encodeURIComponent(requestId)}/${action}`,
                                        {
                                            method: "POST",
                                            credentials: "include"
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

                                    let message =
                                        "Action failed.";


                                    try {

                                        const data =
                                            await response.json();


                                        message =
                                            data.detail ||
                                            message;

                                    } catch (_) {}


                                    showPopup(
                                        message
                                    );


                                    button.disabled =
                                        false;

                                    return;
                                }


                                if (
                                    action ===
                                    "accept"
                                ) {

                                    showPopup(
                                        "Connection request accepted."
                                    );

                                } else {

                                    showPopup(
                                        "Connection request rejected."
                                    );

                                }


                                await loadNotifications();


                            } catch (error) {

                                console.error(
                                    "Request action error:",
                                    error
                                );


                                showPopup(
                                    "Something went wrong."
                                );


                                button.disabled =
                                    false;

                            }

                        }
                    );

                }
            );

    }


    // =====================================================
    // VERIFICATION NOTIFICATIONS
    // =====================================================

    function renderVerificationNotifications(
        notifications
    ) {

        if (!otherContainer) {
            return;
        }


        otherContainer.innerHTML = "";


        if (!notifications.length) {

            if (otherSection) {
                otherSection.hidden = true;
            }

            return;
        }


        if (otherSection) {
            otherSection.hidden = false;
        }


        notifications.forEach(
            (notification) => {

                const sender =
                    notification.sender || {};


                const notificationId =
                    notification.id;


                const senderName =
                    sender.name ||
                    notification.sender_name ||
                    "User";


                const senderUsername =
                    sender.username ||
                    notification.sender_username ||
                    "";


                const senderUserId =
                    sender.user_id ||
                    notification.sender_user_id ||
                    notification.user_id ||
                    "";


                const code =
                    notification.code ||
                    notification.verification_code ||
                    "";


                const verificationId =
                    notification.verification_id ||
                    notification.connection_verification_id ||
                    "";


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "notification-card verification-card";


                card.innerHTML = `

                    <div class="notification-user">

                        <div class="notification-avatar placeholder">
                            U
                        </div>


                        <div class="notification-user-info">

                            <strong>
                                ${escapeHtml(senderName)}
                            </strong>


                            ${
                                senderUsername
                                ?
                                `
                                <span>
                                    ${escapeHtml(senderUsername)}
                                </span>
                                `
                                :
                                ""
                            }


                            ${
                                senderUserId
                                ?
                                `
                                <small>
                                    ${escapeHtml(senderUserId)}
                                </small>
                                `
                                :
                                ""
                            }

                        </div>

                    </div>


                    <div class="verification-message">

                        <div class="verification-title">
                            Connection verification code
                        </div>


                        <div class="verification-code-row">

                            <strong class="verification-code">
                                ${escapeHtml(
                                    code || "------"
                                )}
                            </strong>


                            <button
                                type="button"
                                class="copy-code-button"
                            >
                                Copy Code
                            </button>

                        </div>


                        <button
                            type="button"
                            class="go-card-button"
                        >
                            Go Card
                        </button>

                    </div>

                `;


                otherContainer.appendChild(
                    card
                );


                // =================================================
                // COPY CODE
                // =================================================

                const copyButton =
                    card.querySelector(
                        ".copy-code-button"
                    );


                if (copyButton) {

                    copyButton.addEventListener(
                        "click",
                        async () => {

                            if (!code) {

                                showPopup(
                                    "Verification code unavailable."
                                );

                                return;
                            }


                            try {

                                await navigator
                                    .clipboard
                                    .writeText(
                                        code
                                    );


                                showPopup(
                                    "Code copied."
                                );

                            } catch (error) {

                                console.error(
                                    error
                                );


                                showPopup(
                                    "Copy failed."
                                );

                            }

                        }
                    );

                }


                // =================================================
                // GO CARD
                // =================================================

                const goCardButton =
                    card.querySelector(
                        ".go-card-button"
                    );


                if (goCardButton) {

                    goCardButton.addEventListener(
                        "click",
                        async () => {

                            if (!senderUserId) {

                                showPopup(
                                    "User information unavailable."
                                );

                                return;
                            }


                            if (!verificationId) {

                                showPopup(
                                    "Verification information unavailable."
                                );

                                return;
                            }


                            // -----------------------------------------
                            // MARK NOTIFICATION AS READ
                            // -----------------------------------------

                            if (notificationId) {

                                try {

                                    await fetch(
                                        `/api/connections/notifications/${encodeURIComponent(notificationId)}/read`,
                                        {
                                            method: "POST",
                                            credentials: "include"
                                        }
                                    );

                                } catch (error) {

                                    console.warn(
                                        "Could not mark notification read:",
                                        error
                                    );

                                }

                            }


                            // -----------------------------------------
                            // GO TO SEARCH
                            // -----------------------------------------

                            const searchUrl =
                                "/search" +
                                "?user_id=" +
                                encodeURIComponent(
                                    senderUserId
                                ) +
                                "&verification_id=" +
                                encodeURIComponent(
                                    verificationId
                                );


                            window.location.href =
                                searchUrl;

                        }
                    );

                }

            }
        );

    }


    // =====================================================
    // DELETE ALL NOTIFICATIONS
    // =====================================================

    const deleteNotifications =
        document.getElementById(
            "deleteNotifications"
        );


    if (deleteNotifications) {

        deleteNotifications.addEventListener(
            "click",
            async () => {

                const confirmed =
                    window.confirm(
                        "Delete all notifications?"
                    );


                if (!confirmed) {
                    return;
                }


                deleteNotifications.disabled =
                    true;


                try {

                    /*
                     * Backend delete endpoint can be
                     * connected here later.
                     *
                     * For now we clear the visible
                     * notifications after confirmation.
                     */


                    if (requestsContainer) {
                        requestsContainer.innerHTML = "";
                    }


                    if (otherContainer) {
                        otherContainer.innerHTML = "";
                    }


                    if (requestsSection) {
                        requestsSection.hidden = true;
                    }


                    if (otherSection) {
                        otherSection.hidden = true;
                    }


                    if (empty) {
                        empty.hidden = false;
                    }


                    showPopup(
                        "Notifications cleared."
                    );


                } catch (error) {

                    console.error(
                        "Delete notifications error:",
                        error
                    );


                    showPopup(
                        "Unable to delete notifications."
                    );

                } finally {

                    deleteNotifications.disabled =
                        false;

                }

            }
        );

    }


    // =====================================================
    // START
    // =====================================================

    loadNotifications();

});
