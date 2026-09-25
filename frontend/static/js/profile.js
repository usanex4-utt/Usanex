/* =========================================================
   USANEX PROFILE
   ========================================================= */

"use strict";


/* =========================================================
   DOM
   ========================================================= */

const backButton =
    document.getElementById("backButton");

const profileHeaderTitle =
    document.getElementById("profileHeaderTitle");

const profileMenuButton =
    document.getElementById("profileMenuButton");

const profileMenu =
    document.getElementById("profileMenu");

const blockButton =
    document.getElementById("blockButton");

const shareButton =
    document.getElementById("shareButton");

const qrButton =
    document.getElementById("qrButton");

const reportButton =
    document.getElementById("reportButton");

const profilePhoto =
    document.getElementById("profilePhoto");

const profileUsername =
    document.getElementById("profileUsername");

const profileUserId =
    document.getElementById("profileUserId");

const connectionStatus =
    document.getElementById("connectionStatus");

const profileBio =
    document.getElementById("profileBio");

const personalCategory =
    document.getElementById("personalCategory");


/* =========================================================
   URL
   ========================================================= */

const params =
    new URLSearchParams(window.location.search);

const targetUserId =
    params.get("user_id");


/* =========================================================
   HELPERS
   ========================================================= */

function escapeText(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
}


function getProfilePhoto(photo) {

    if (!photo) {
        return "/static/images/default-profile.png";
    }

    return photo;
}


/* =========================================================
   MENU
   ========================================================= */

function openProfileMenu() {

    if (!profileMenu) {
        return;
    }

    profileMenu.classList.remove("hidden");
}


function closeProfileMenu() {

    if (!profileMenu) {
        return;
    }

    profileMenu.classList.add("hidden");
}


function toggleProfileMenu() {

    if (!profileMenu) {
        return;
    }

    profileMenu.classList.toggle("hidden");
}


if (profileMenuButton) {

    profileMenuButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            toggleProfileMenu();
        }
    );
}


document.addEventListener(
    "click",
    function (event) {

        if (!profileMenu) {
            return;
        }

        if (
            !profileMenu.contains(event.target) &&
            !profileMenuButton.contains(event.target)
        ) {
            closeProfileMenu();
        }
    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {
            closeProfileMenu();
        }
    }
);


/* =========================================================
   BACK BUTTON
   ========================================================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "/home";
            }
        }
    );
}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function renderConnectionStatus(profile) {

    if (!connectionStatus) {
        return;
    }

    connectionStatus.classList.add("hidden");
    connectionStatus.textContent = "";

    if (!profile) {
        return;
    }


    if (profile.is_self) {
        return;
    }


    const status =
        String(
            profile.connection_status || ""
        ).toLowerCase();


    if (status === "connected") {

        connectionStatus.textContent =
            "Connected";

        connectionStatus.classList.remove(
            "hidden"
        );

        return;
    }


    if (profile.is_connected === true) {

        connectionStatus.textContent =
            "Connected";

        connectionStatus.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   PERSONAL CATEGORY
   ========================================================= */

function renderPersonalCategory(profile) {

    if (!personalCategory) {
        return;
    }

    let category = null;


    if (
        profile &&
        profile.personal_category
    ) {
        category =
            profile.personal_category;
    }


    if (
        !category &&
        profile &&
        profile.category
    ) {
        category =
            profile.category;
    }


    if (
        !category &&
        profile &&
        profile.connection_category
    ) {
        category =
            profile.connection_category;
    }


    if (!category) {

        personalCategory.textContent =
            "—";

        return;
    }


    const normalized =
        String(category)
            .trim()
            .toLowerCase();


    if (normalized === "friend") {

        personalCategory.textContent =
            "Friend";

        return;
    }


    if (normalized === "family") {

        personalCategory.textContent =
            "Family";

        return;
    }


    personalCategory.textContent =
        category;
}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function renderProfilePhoto(profile) {

    if (!profilePhoto) {
        return;
    }

    profilePhoto.src =
        getProfilePhoto(
            profile.profile_photo
        );


    profilePhoto.onerror =
        function () {

            profilePhoto.onerror = null;

            profilePhoto.src =
                "/static/images/default-profile.png";
        };
}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(profile) {

    if (!profile) {
        return;
    }


    /* Header name */

    if (profileHeaderTitle) {

        profileHeaderTitle.textContent =
            escapeText(
                profile.name || "Profile"
            );
    }


    /* Username */

    if (profileUsername) {

        const username =
            profile.username || "";

        profileUsername.textContent =
            username
                ? `@${username}`
                : "@username";
    }


    /* User ID */

    if (profileUserId) {

        profileUserId.textContent =
            escapeText(
                profile.user_id || ""
            );
    }


    /* Photo */

    renderProfilePhoto(profile);


    /* Connection */

    renderConnectionStatus(profile);


    /* Bio */

    if (profileBio) {

        const bio =
            profile.bio;

        if (
            bio !== null &&
            bio !== undefined &&
            String(bio).trim() !== ""
        ) {

            profileBio.textContent =
                String(bio).trim();

        } else {

            profileBio.textContent =
                "No bio available.";
        }
    }


    /* Category */

    renderPersonalCategory(profile);
}


/* =========================================================
   SHARE
   ========================================================= */

async function shareProfile() {

    if (!targetUserId) {

        alert(
            "Profile link is not available."
        );

        return;
    }


    const shareUrl =
        `${window.location.origin}/profile?user_id=${encodeURIComponent(targetUserId)}`;


    const shareTitle =
        profileHeaderTitle
            ? profileHeaderTitle.textContent.trim()
            : "Usanex Profile";


    closeProfileMenu();


    /* Native share */

    if (
        navigator.share &&
        typeof navigator.share === "function"
    ) {

        try {

            await navigator.share({
                title: shareTitle,
                text: shareTitle,
                url: shareUrl
            });

            return;

        } catch (error) {

            if (
                error &&
                error.name === "AbortError"
            ) {
                return;
            }
        }
    }


    /* Clipboard fallback */

    if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
    ) {

        try {

            await navigator.clipboard.writeText(
                shareUrl
            );

            alert(
                "Profile link copied."
            );

            return;

        } catch (error) {
            // Continue to final fallback.
        }
    }


    /* Final fallback */

    alert(shareUrl);
}


if (shareButton) {

    shareButton.addEventListener(
        "click",
        shareProfile
    );
}


/* =========================================================
   BLOCK
   ========================================================= */

if (blockButton) {

    blockButton.addEventListener(
        "click",
        function () {

            closeProfileMenu();

            alert(
                "Block feature will be available soon."
            );
        }
    );
}


/* =========================================================
   QR CODE
   ========================================================= */

if (qrButton) {

    qrButton.addEventListener(
        "click",
        function () {

            closeProfileMenu();

            alert(
                "QR Code feature will be available soon."
            );
        }
    );
}


/* =========================================================
   REPORT
   ========================================================= */

if (reportButton) {

    reportButton.addEventListener(
        "click",
        function () {

            closeProfileMenu();

            alert(
                "Report feature will be available soon."
            );
        }
    );
}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

    if (!targetUserId) {

        if (profileHeaderTitle) {
            profileHeaderTitle.textContent =
                "Profile";
        }

        if (profileBio) {
            profileBio.textContent =
                "Profile not found.";
        }

        return;
    }


    try {

        const response =
            await fetch(
                `/api/profile/${encodeURIComponent(targetUserId)}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/login";

            return;
        }


        if (response.status === 403) {

            if (profileHeaderTitle) {
                profileHeaderTitle.textContent =
                    "Profile";
            }

            if (profileBio) {
                profileBio.textContent =
                    "This profile is not available.";
            }

            return;
        }


        if (response.status === 404) {

            if (profileHeaderTitle) {
                profileHeaderTitle.textContent =
                    "Profile";
            }

            if (profileBio) {
                profileBio.textContent =
                    "Profile not found.";
            }

            return;
        }


        if (!response.ok) {
            throw new Error(
                `Profile request failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            data.ok !== true ||
            !data.profile
        ) {
            throw new Error(
                "Invalid profile response."
            );
        }


        renderProfile(
            data.profile
        );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        if (profileHeaderTitle) {

            profileHeaderTitle.textContent =
                "Profile";
        }


        if (profileBio) {

            profileBio.textContent =
                "Unable to load profile.";
        }
    }
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadProfile();

    }
);
