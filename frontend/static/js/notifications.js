// =========================================================
// USANEX - NOTIFICATIONS
// Connection Requests + Verification Notifications
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const loading = document.getElementById(
        "notificationLoading"
    );

    const empty = document.getElementById(
        "notificationEmpty"
    );

    const requestsSection = document.getElementById(
        "connectionRequestsSection"
    );

    const requestsContainer = document.getElementById(
        "connectionRequests"
    );

    const otherSection = document.getElementById(
        "otherNotificationsSection"
    );

    const otherContainer = document.getElementById(
        "otherNotifications"
    );

    const popup = document.getElementById(
        "notificationPopup"
    );

    const backButton = document.getElementById(
        "backButton"
    );


    // =====================================================
    // BACK
    // =====================================================

    if (backButton) {
        backButton.addEventListener(
            "click",
            () => {
                window.location.href = "/home";
            }
        );
    }


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

        if (value === null || value === undefined) {
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
    // LOAD ALL NOTIFICATIONS
    // =====================================================

    async function loadNotifications() {

        try {

            loading.hidden = false;
            empty.hidden = true;

            requestsSection.hidden = true;
            otherSection.hidden = true;

            requestsContainer.innerHTML = "";
            otherContainer.innerHTML = "";


            // ---------------------------------------------
            // CONNECTION REQUESTS
            // ---------------------------------------------

            const requestResponse = await fetch(
                "/api/connections/requests",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


            if (requestResponse.status === 401) {

                window.location.href = "/login";
                return;
            }


            let requestData = [];

            if (requestResponse.ok) {

                requestData =
                    await requestResponse.json();

            }


            // ---------------------------------------------
            // VERIFICATION NOTIFICATIONS
            // ---------------------------------------------

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

                window.location.href = "/login";
                return;
            }


            let notificationData = [];

            if (notificationResponse.ok) {

                notificationData =
                    await notificationResponse.json();

            }


            // ---------------------------------------------
            // NORMALIZE DATA
            // ---------------------------------------------

            if (!Array.isArray(requestData)) {

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


            if (!Array.isArray(notificationData)) {

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


            // ---------------------------------------------
            // RENDER
            // ---------------------------------------------

            renderConnectionRequests(
                requestData
            );

            renderVerificationNotifications(
                notificationData
            );


            loading.hidden = true;


            const hasRequests =
                requestData.length > 0;

            const hasNotifications =
                notificationData.length > 0;


            if (
                !hasRequests &&
                !hasNotifications
            ) {

                empty.hidden = false;
            }


        } catch (error) {

            console.error(
                "Notification error:",
                error
            );

            loading.hidden = true;

            empty.hidden = false;

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

        requestsContainer.innerHTML = "";


        if (!requests.length) {

            requestsSection.hidden = true;

            return;
        }


        requestsSection.hidden = false;


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
                            data-request-id="${requestId}"
                            data-action="accept"
                        >
                            Accept
                        </button>


                        <button
                            type="button"
                            class="reject-button"
                            data-request-id="${requestId}"
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


        // ---------------------------------------------
        // ACCEPT / REJECT
        // ---------------------------------------------

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


                            button.disabled = true;


                            try {

                                const response =
                                    await fetch(
                                        `/api/connections/request/${requestId}/${action}`,
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
                                    action === "accept"
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

        otherContainer.innerHTML = "";


        if (!notifications.length) {

            otherSection.hidden = true;

            return;
        }


        otherSection.hidden = false;


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
                                ${escapeHtml(code || "------")}
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


                // -----------------------------------------
                // COPY CODE
                // -----------------------------------------

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

                                await navigator.clipboard.writeText(
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


                // -----------------------------------------
                // GO CARD
                // -----------------------------------------

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


                            // Mark notification as read
                            // before going to Search.

                            if (notificationId) {

                                try {

                                    await fetch(
                                        `/api/connections/notifications/${notificationId}/read`,
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


                            // IMPORTANT:
                            // Go Card MUST return to SEARCH,
                            // NOT PROFILE.

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
    // START
    // =====================================================

    loadNotifications();

});
