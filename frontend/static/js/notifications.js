"use strict";

/* =========================================================
   USANEX NOTIFICATIONS
   ========================================================= */

const API_BASE = "/api/connections";

let popupTimer = null;


/* =========================================================
   DOM
   ========================================================= */

const loadingElement =
    document.getElementById("notificationLoading");

const emptyElement =
    document.getElementById("notificationEmpty");

const connectionRequestsSection =
    document.getElementById(
        "connectionRequestsSection"
    );

const connectionRequestsContainer =
    document.getElementById(
        "connectionRequests"
    );

const otherNotificationsSection =
    document.getElementById(
        "otherNotificationsSection"
    );

const otherNotificationsContainer =
    document.getElementById(
        "otherNotifications"
    );

const popupElement =
    document.getElementById(
        "notificationPopup"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


/* =========================================================
   POPUP
   ========================================================= */

function showPopup(message) {

    if (!popupElement) {
        return;
    }

    popupElement.textContent = message;

    popupElement.hidden = false;

    requestAnimationFrame(() => {
        popupElement.classList.add(
            "show"
        );
    });

    if (popupTimer) {
        clearTimeout(popupTimer);
    }

    popupTimer = setTimeout(() => {

        popupElement.classList.remove(
            "show"
        );

        setTimeout(() => {

            popupElement.hidden = true;

        }, 300);

    }, 3000);
}


/* =========================================================
   API HELPER
   ========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const response = await fetch(
        url,
        {
            credentials: "same-origin",

            headers: {
                "Content-Type":
                    "application/json",

                ...(options.headers || {}),
            },

            ...options,
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        const message =
            data?.detail ||
            data?.message ||
            "Something went wrong";

        throw new Error(message);
    }

    return data;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   PROFILE IMAGE
   ========================================================= */

function getProfileImage(
    profilePhoto,
    name
) {

    if (profilePhoto) {

        return `
            <img
                class="notification-avatar-image"
                src="${escapeHtml(profilePhoto)}"
                alt="${escapeHtml(name || "User")}"
                loading="lazy"
            >
        `;
    }

    const firstLetter =
        (name || "U")
            .trim()
            .charAt(0)
            .toUpperCase();

    return `
        <div class="notification-avatar-fallback">
            ${escapeHtml(firstLetter)}
        </div>
    `;
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function setLoading(
    isLoading
) {

    if (!loadingElement) {
        return;
    }

    loadingElement.hidden =
        !isLoading;
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function updateEmptyState() {

    const requestVisible =
        connectionRequestsSection &&
        !connectionRequestsSection.hidden;

    const otherVisible =
        otherNotificationsSection &&
        !otherNotificationsSection.hidden;

    const hasContent =
        requestVisible ||
        otherVisible;

    if (emptyElement) {
        emptyElement.hidden =
            hasContent;
    }
}


/* =========================================================
   REQUEST BUTTON STATE
   ========================================================= */

function setRequestButtonsDisabled(
    requestId,
    disabled
) {

    const buttons =
        document.querySelectorAll(
            `[data-request-id="${requestId}"]`
        );

    buttons.forEach(
        (button) => {
            button.disabled = disabled;
        }
    );
}


/* =========================================================
   CONNECTION REQUEST CARD
   ========================================================= */

function createConnectionRequestCard(
    item
) {

    const card =
        document.createElement("article");

    card.className =
        "connection-request-card";

    card.dataset.requestId =
        item.id;

    const sender =
        item.sender || {};

    card.innerHTML = `
        <div class="request-card-main">

            <div class="notification-avatar">
                ${getProfileImage(
                    sender.profile_photo,
                    sender.name
                )}
            </div>

            <div class="request-user-info">

                <div class="request-user-name">
                    ${escapeHtml(
                        sender.name || "User"
                    )}
                </div>

                <div class="request-user-username">
                    ${escapeHtml(
                        sender.username || ""
                    )}
                </div>

                <div class="request-user-id">
                    ${escapeHtml(
                        sender.user_id || ""
                    )}
                </div>

                <div class="request-message">
                    wants to connect with you
                </div>

            </div>

        </div>

        <div class="request-actions">

            <button
                type="button"
                class="request-action-button accept-button"
                data-action="accept"
                data-request-id="${item.id}"
            >
                Accept
            </button>

            <button
                type="button"
                class="request-action-button reject-button"
                data-action="reject"
                data-request-id="${item.id}"
            >
                Reject
            </button>

        </div>
    `;

    return card;
}


/* =========================================================
   RENDER CONNECTION REQUESTS
   ========================================================= */

function renderConnectionRequests(
    requests
) {

    if (!connectionRequestsContainer) {
        return;
    }

    connectionRequestsContainer.innerHTML = "";

    if (
        !Array.isArray(requests) ||
        requests.length === 0
    ) {

        if (connectionRequestsSection) {
            connectionRequestsSection.hidden =
                true;
        }

        updateEmptyState();

        return;
    }

    requests.forEach(
        (item) => {

            const card =
                createConnectionRequestCard(
                    item
                );

            connectionRequestsContainer.appendChild(
                card
            );
        }
    );

    if (connectionRequestsSection) {
        connectionRequestsSection.hidden =
            false;
    }

    updateEmptyState();
}


/* =========================================================
   LOAD CONNECTION REQUESTS
   ========================================================= */

async function loadConnectionRequests() {

    const data =
        await apiRequest(
            `${API_BASE}/requests`
        );

    renderConnectionRequests(
        data.requests || []
    );
}


/* =========================================================
   FORMAT VERIFICATION MESSAGE
   ========================================================= */

function getVerificationTitle(
    notification
) {

    const user =
        notification.user || {};

    const name =
        user.name || "User";

    return `${name} accepted your connection request`;
}


/* =========================================================
   CREATE VERIFICATION CARD
   ========================================================= */

function createVerificationCard(
    notification
) {

    const card =
        document.createElement("article");

    card.className =
        "verification-card";

    card.dataset.notificationId =
        notification.notification_id;

    const user =
        notification.user || {};

    const verification =
        notification.verification || {};

    const code =
        verification.code || "";

    const verificationId =
        verification.verification_id;

    const status =
        verification.status || "unknown";

    const expired =
        Boolean(
            verification.is_expired
        );

    let actionHtml = "";

    if (
        !expired &&
        status === "pending" &&
        code
    ) {

        actionHtml = `
            <div class="verification-code-box">

                <div class="verification-code-label">
                    Connection Code
                </div>

                <div
                    class="verification-code"
                    data-code="${escapeHtml(code)}"
                >
                    ${escapeHtml(code)}
                </div>

            </div>

            <div class="verification-actions">

                <button
                    type="button"
                    class="verification-button copy-code-button"
                    data-code="${escapeHtml(code)}"
                >
                    Copy Code
                </button>

                <button
                    type="button"
                    class="verification-button go-card-button"
                    data-user-id="${escapeHtml(
                        user.user_id || ""
                    )}"
                    data-verification-id="${escapeHtml(
                        verificationId || ""
                    )}"
                >
                    Go Card
                </button>

            </div>
        `;

    } else if (
        expired ||
        status === "expired"
    ) {

        actionHtml = `
            <div class="verification-expired">
                This connection code has expired.
            </div>
        `;

    } else if (
        status === "verified"
    ) {

        actionHtml = `
            <div class="verification-success">
                Connection verified successfully.
            </div>
        `;

    } else if (
        status === "blocked"
    ) {

        actionHtml = `
            <div class="verification-expired">
                This verification is blocked.
            </div>
        `;

    } else {

        actionHtml = `
            <div class="verification-expired">
                Verification code is unavailable.
            </div>
        `;
    }

    card.innerHTML = `
        <div class="verification-main">

            <div class="notification-avatar">
                ${getProfileImage(
                    user.profile_photo,
                    user.name
                )}
            </div>

            <div class="verification-user-info">

                <div class="verification-title">
                    ${escapeHtml(
                        getVerificationTitle(
                            notification
                        )
                    )}
                </div>

                <div class="verification-username">
                    ${escapeHtml(
                        user.username || ""
                    )}
                </div>

                <div class="verification-user-id">
                    ${escapeHtml(
                        user.user_id || ""
                    )}
                </div>

            </div>

        </div>

        ${actionHtml}
    `;

    return card;
}


/* =========================================================
   RENDER VERIFICATION NOTIFICATIONS
   ========================================================= */

function renderVerificationNotifications(
    notifications
) {

    if (!otherNotificationsContainer) {
        return;
    }

    otherNotificationsContainer.innerHTML = "";

    const verificationNotifications =
        Array.isArray(notifications)
            ? notifications
            : [];

    if (
        verificationNotifications.length === 0
    ) {

        if (otherNotificationsSection) {
            otherNotificationsSection.hidden =
                true;
        }

        updateEmptyState();

        return;
    }

    verificationNotifications.forEach(
        (notification) => {

            const card =
                createVerificationCard(
                    notification
                );

            otherNotificationsContainer.appendChild(
                card
            );
        }
    );

    if (otherNotificationsSection) {
        otherNotificationsSection.hidden =
            false;
    }

    updateEmptyState();
}


/* =========================================================
   LOAD VERIFICATION NOTIFICATIONS
   ========================================================= */

async function loadVerificationNotifications() {

    const data =
        await apiRequest(
            `${API_BASE}/notifications`
        );

    renderVerificationNotifications(
        data.notifications || []
    );
}


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadNotifications() {

    setLoading(true);

    try {

        await Promise.all([
            loadConnectionRequests(),
            loadVerificationNotifications(),
        ]);

    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

        showPopup(
            error.message ||
            "Unable to load notifications"
        );

    } finally {

        setLoading(false);

        updateEmptyState();
    }
}


/* =========================================================
   ACCEPT REQUEST
   ========================================================= */

async function acceptRequest(
    requestId,
    button
) {

    if (button) {
        button.disabled = true;
    }

    try {

        const data =
            await apiRequest(
                `${API_BASE}/request/${requestId}/accept`,
                {
                    method: "POST",
                }
            );

        showPopup(
            "Connection request accepted."
        );

        const card =
            document.querySelector(
                `.connection-request-card[data-request-id="${requestId}"]`
            );

        if (card) {

            card.classList.add(
                "notification-card-removing"
            );

            setTimeout(() => {

                card.remove();

                if (
                    connectionRequestsContainer &&
                    connectionRequestsContainer
                        .children.length === 0
                ) {

                    if (connectionRequestsSection) {
                        connectionRequestsSection.hidden =
                            true;
                    }

                    updateEmptyState();
                }

            }, 250);
        }

        await loadVerificationNotifications();

        /*
         * The backend creates the verification
         * notification immediately after accept.
         */
        if (
            data &&
            data.verification
        ) {
            showPopup(
                "Verification code is ready."
            );
        }

    } catch (error) {

        console.error(
            "Accept request error:",
            error
        );

        showPopup(
            error.message ||
            "Unable to accept request"
        );

        if (button) {
            button.disabled = false;
        }
    }
}


/* =========================================================
   REJECT REQUEST
   ========================================================= */

async function rejectRequest(
    requestId,
    button
) {

    if (button) {
        button.disabled = true;
    }

    try {

        await apiRequest(
            `${API_BASE}/request/${requestId}/reject`,
            {
                method: "POST",
            }
        );

        showPopup(
            "Connection request rejected."
        );

        const card =
            document.querySelector(
                `.connection-request-card[data-request-id="${requestId}"]`
            );

        if (card) {

            card.classList.add(
                "notification-card-removing"
            );

            setTimeout(() => {

                card.remove();

                if (
                    connectionRequestsContainer &&
                    connectionRequestsContainer
                        .children.length === 0
                ) {

                    if (connectionRequestsSection) {
                        connectionRequestsSection.hidden =
                            true;
                    }

                    updateEmptyState();
                }

            }, 250);
        }

    } catch (error) {

        console.error(
            "Reject request error:",
            error
        );

        showPopup(
            error.message ||
            "Unable to reject request"
        );

        if (button) {
            button.disabled = false;
        }
    }
}


/* =========================================================
   COPY VERIFICATION CODE
   ========================================================= */

async function copyVerificationCode(
    code
) {

    if (!code) {
        showPopup(
            "Verification code is unavailable."
        );
        return;
    }

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                code
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value = code;

            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();
        }

        showPopup(
            "Verification code copied."
        );

    } catch (error) {

        console.error(
            "Copy code error:",
            error
        );

        showPopup(
            "Could not copy the code."
        );
    }
}


/* =========================================================
   GO CARD
   ========================================================= */

function goToUserCard(
    userId,
    verificationId
) {

    if (!userId) {

        showPopup(
            "User card is unavailable."
        );

        return;
    }

    /*
     * The profile/card page will use these
     * query parameters for the verification flow.
     */

    const params =
        new URLSearchParams();

    params.set(
        "user_id",
        userId
    );

    if (verificationId) {

        params.set(
            "verification_id",
            verificationId
        );
    }

    window.location.href =
        `/profile?${params.toString()}`;
}


/* =========================================================
   MARK NOTIFICATION READ
   ========================================================= */

async function markNotificationRead(
    notificationId
) {

    if (!notificationId) {
        return;
    }

    try {

        await apiRequest(
            `${API_BASE}/notifications/${notificationId}/read`,
            {
                method: "POST",
            }
        );

    } catch (error) {

        console.error(
            "Mark notification read error:",
            error
        );
    }
}


/* =========================================================
   CLICK HANDLER
   ========================================================= */

document.addEventListener(
    "click",
    async (event) => {

        const target =
            event.target;

        /*
         * Accept
         */

        const acceptButton =
            target.closest(
                '[data-action="accept"]'
            );

        if (acceptButton) {

            const requestId =
                acceptButton.dataset.requestId;

            if (requestId) {

                await acceptRequest(
                    requestId,
                    acceptButton
                );
            }

            return;
        }


        /*
         * Reject
         */

        const rejectButton =
            target.closest(
                '[data-action="reject"]'
            );

        if (rejectButton) {

            const requestId =
                rejectButton.dataset.requestId;

            if (requestId) {

                await rejectRequest(
                    requestId,
                    rejectButton
                );
            }

            return;
        }


        /*
         * Copy code
         */

        const copyButton =
            target.closest(
                ".copy-code-button"
            );

        if (copyButton) {

            const code =
                copyButton.dataset.code;

            await copyVerificationCode(
                code
            );

            return;
        }


        /*
         * Go Card
         */

        const goCardButton =
            target.closest(
                ".go-card-button"
            );

        if (goCardButton) {

            const userId =
                goCardButton.dataset.userId;

            const verificationId =
                goCardButton.dataset.verificationId;

            const card =
                goCardButton.closest(
                    ".verification-card"
                );

            if (card) {

                const notificationId =
                    card.dataset.notificationId;

                await markNotificationRead(
                    notificationId
                );
            }

            goToUserCard(
                userId,
                verificationId
            );

            return;
        }
    }
);


/* =========================================================
   BACK BUTTON
   ========================================================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "/home";
            }
        }
    );
}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState
            === "visible"
        ) {

            loadNotifications();
        }
    }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadNotifications();

    }
);
