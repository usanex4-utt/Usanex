// =========================================================
// USANEX - NOTIFICATIONS
// Connection Requests + Connection Updates
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const loading =
        document.getElementById("notificationLoading");

    const empty =
        document.getElementById("notificationEmpty");

    const requestsSection =
        document.getElementById("connectionRequestsSection");

    const requestsContainer =
        document.getElementById("connectionRequests");

    const otherSection =
        document.getElementById("otherNotificationsSection");

    const otherContainer =
        document.getElementById("otherNotifications");

    const popup =
        document.getElementById("notificationPopup");

    const notificationDot =
        document.getElementById("notificationDot");


    // =====================================================
    // POPUP
    // =====================================================

    let popupTimer = null;

    function showPopup(message) {

        if (!popup) {
            return;
        }

        popup.textContent = message;
        popup.hidden = false;

        requestAnimationFrame(() => {
            popup.classList.add("show");
        });

        if (popupTimer) {
            clearTimeout(popupTimer);
        }

        popupTimer = setTimeout(() => {

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
    // API JSON HELPER
    // =====================================================

    async function getJson(url, options = {}) {

        const response = await fetch(
            url,
            {
                credentials: "include",
                ...options
            }
        );

        if (response.status === 401) {

            window.location.href = "/login";

            return null;
        }

        let data = null;

        try {
            data = await response.json();
        } catch (_) {
            data = null;
        }

        if (!response.ok) {

            const message =
                data?.detail ||
                data?.message ||
                "Request failed.";

            throw new Error(message);
        }

        return data;
    }


    // =====================================================
    // NORMALIZE ARRAY
    // =====================================================

    function normalizeArray(data, key) {

        if (Array.isArray(data)) {
            return data;
        }

        if (
            data &&
            Array.isArray(data[key])
        ) {
            return data[key];
        }

        return [];
    }


    // =====================================================
    // BOTTOM NAVIGATION
    // =====================================================

    const homeNav =
        document.getElementById("homeNav");

    const reelNav =
        document.getElementById("reelNav");

    const searchNav =
        document.getElementById("searchNav");

    const notificationNav =
        document.getElementById("notificationNav");

    const profileNav =
        document.getElementById("profileNav");


    if (homeNav) {

        homeNav.addEventListener(
            "click",
            () => {
                window.location.href = "/home";
            }
        );

    }


    if (reelNav) {

        reelNav.addEventListener(
            "click",
            () => {
                window.location.href = "/reels";
            }
        );

    }


    if (searchNav) {

        searchNav.addEventListener(
            "click",
            () => {
                window.location.href = "/search";
            }
        );

    }


    if (notificationNav) {

        notificationNav.addEventListener(
            "click",
            () => {
                window.location.href = "/notifications";
            }
        );

    }


    if (profileNav) {

        profileNav.addEventListener(
            "click",
            () => {
                window.location.href = "/profile";
            }
        );

    }


    // =====================================================
    // NOTIFICATION DOT
    // =====================================================

    function updateNotificationDot(
        requestCount,
        notificationCount
    ) {

        if (!notificationDot) {
            return;
        }

        const total =
            Number(requestCount || 0) +
            Number(notificationCount || 0);

        notificationDot.hidden =
            total <= 0;
    }


    // =====================================================
    // EXTRACT USER
    // =====================================================

    function getSender(request) {

        return (
            request?.sender ||
            request?.user ||
            {}
        );
    }


    // =====================================================
    // RENDER CONNECTION REQUESTS
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


        requests.forEach((request) => {

            const sender =
                getSender(request);

            const requestId =
                request.id ||
                request.request_id;

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
                document.createElement("article");

            card.className =
                "notification-card connection-request-card";


            const avatarHtml =
                photo
                    ? `
                        <img
                            src="${escapeHtml(photo)}"
                            class="notification-avatar"
                            alt="${escapeHtml(name)}"
                            draggable="false"
                        >
                    `
                    : `
                        <div class="notification-avatar placeholder">
                            ${escapeHtml(
                                (name || "U")
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>
                    `;


            card.innerHTML = `

                <div class="notification-user">

                    ${avatarHtml}

                    <div class="notification-user-info">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        ${
                            username
                                ? `
                                    <span>
                                        @${escapeHtml(username)}
                                    </span>
                                `
                                : ""
                        }

                        ${
                            userId
                                ? `
                                    <small>
                                        ${escapeHtml(userId)}
                                    </small>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="connection-request-message">
                    <span>
                        wants to connect with you
                    </span>
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


            requestsContainer.appendChild(card);

        });


        // =================================================
        // ACCEPT / REJECT EVENTS
        // =================================================

        requestsContainer
            .querySelectorAll("[data-request-id]")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => handleRequestAction(button)
                );

            });

    }


    // =====================================================
    // ACCEPT / REJECT REQUEST
    // =====================================================

    async function handleRequestAction(button) {

        const requestId =
            button.dataset.requestId;

        const action =
            button.dataset.action;


        if (!requestId || !action) {
            return;
        }


        const card =
            button.closest(".notification-card");

        const actionButtons =
            card
                ? card.querySelectorAll("button")
                : [];


        actionButtons.forEach((item) => {
            item.disabled = true;
        });


        try {

            const response =
                await getJson(
                    `/api/connections/request/${encodeURIComponent(requestId)}/${encodeURIComponent(action)}`,
                    {
                        method: "POST"
                    }
                );


            if (response === null) {
                return;
            }


            if (action === "accept") {

                showPopup(
                    "Connection request accepted."
                );

            } else {

                showPopup(
                    "Connection request rejected."
                );

            }


            // ---------------------------------------------
            // Reload notifications
            // ---------------------------------------------

            await loadNotifications();


        } catch (error) {

            console.error(
                "Connection request action error:",
                error
            );


            showPopup(
                error.message ||
                "Something went wrong."
            );


            actionButtons.forEach((item) => {
                item.disabled = false;
            });

        }

    }


    // =====================================================
    // RENDER OTHER NOTIFICATIONS
    // =====================================================

    function renderOtherNotifications(
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


        notifications.forEach((notification) => {

            const sender =
                notification.sender ||
                {};


            const type =
                String(
                    notification.notification_type ||
                    notification.type ||
                    ""
                ).toLowerCase();


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
                "";


            let message =
                notification.message ||
                "";


            // =============================================
            // CONNECTION ACCEPTED
            // =============================================

            if (
                !message &&
                (
                    type === "connection_accepted" ||
                    type === "accepted"
                )
            ) {

                message =
                    `${senderUsername || senderName} accepted your connection request.`;
            }


            // =============================================
            // CONNECTION REJECTED
            // =============================================

            if (
                !message &&
                (
                    type === "connection_rejected" ||
                    type === "rejected"
                )
            ) {

                message =
                    `${senderUsername || senderName} rejected your connection request.`;
            }


            // =============================================
            // CONNECTION REQUEST
            // =============================================

            if (
                !message &&
                type === "connection_request"
            ) {

                message =
                    `${senderUsername || senderName} sent you a connection request.`;
            }


            // =============================================
            // FALLBACK
            // =============================================

            if (!message) {

                message =
                    notification.text ||
                    "You have a new notification.";
            }


            const card =
                document.createElement("article");

            card.className =
                "notification-card other-notification-card";


            const avatarHtml =
                sender.profile_photo
                    ? `
                        <img
                            src="${escapeHtml(sender.profile_photo)}"
                            class="notification-avatar"
                            alt="${escapeHtml(senderName)}"
                            draggable="false"
                        >
                    `
                    : `
                        <div class="notification-avatar placeholder">
                            ${escapeHtml(
                                (senderName || "U")
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>
                    `;


            card.innerHTML = `

                <div class="notification-user">

                    ${avatarHtml}

                    <div class="notification-user-info">

                        <strong>
                            ${escapeHtml(senderName)}
                        </strong>

                        ${
                            senderUsername
                                ? `
                                    <span>
                                        @${escapeHtml(senderUsername)}
                                    </span>
                                `
                                : ""
                        }

                        ${
                            senderUserId
                                ? `
                                    <small>
                                        ${escapeHtml(senderUserId)}
                                    </small>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="notification-message">

                    ${escapeHtml(message)}

                </div>

            `;


            otherContainer.appendChild(card);

        });

    }


    // =====================================================
    // LOAD NOTIFICATIONS
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


            const [
                requestData,
                notificationData
            ] = await Promise.all([

                getJson(
                    "/api/connections/requests"
                ),

                getJson(
                    "/api/connections/notifications"
                )

            ]);


            if (
                requestData === null ||
                notificationData === null
            ) {
                return;
            }


            const requests =
                normalizeArray(
                    requestData,
                    "requests"
                );


            const notifications =
                normalizeArray(
                    notificationData,
                    "notifications"
                );


            // =============================================
            // RENDER
            // =============================================

            renderConnectionRequests(
                requests
            );


            renderOtherNotifications(
                notifications
            );


            // =============================================
            // NOTIFICATION DOT
            // =============================================

            updateNotificationDot(
                requests.length,
                notifications.length
            );


            // =============================================
            // EMPTY STATE
            // =============================================

            if (
                requests.length === 0 &&
                notifications.length === 0
            ) {

                if (empty) {
                    empty.hidden = false;
                }

            }


            if (loading) {
                loading.hidden = true;
            }


        } catch (error) {

            console.error(
                "Notification loading error:",
                error
            );


            if (loading) {
                loading.hidden = true;
            }


            if (empty) {
                empty.hidden = false;
            }


            updateNotificationDot(0, 0);


            showPopup(
                error.message ||
                "Unable to load notifications."
            );

        }

    }


    // =====================================================
    // CLEAR VISIBLE NOTIFICATIONS
    // =====================================================

    const deleteNotifications =
        document.getElementById(
            "deleteNotifications"
        );


    if (deleteNotifications) {

        deleteNotifications.addEventListener(
            "click",
            () => {

                /*
                 * This only clears the current UI.
                 * Persistent database deletion will be
                 * connected separately.
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

                updateNotificationDot(0, 0);

                showPopup(
                    "Notifications cleared from view."
                );

            }
        );

    }


    // =====================================================
    // START
    // =====================================================

    loadNotifications();

});
