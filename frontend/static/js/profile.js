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

const connectionStatusText =
    document.getElementById("connectionStatusText");

const connectionCategory =
    document.getElementById("connectionCategory");

const profileBio =
    document.getElementById("profileBio");


/* =========================================================
   URL
   ========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const targetUserId =
    params.get("user_id");


/* =========================================================
   HELPERS
   ========================================================= */

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
   BACK
   ========================================================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            if (window.history.length > 1) {

                window.history.back();

            } else {

                window.location.href =
                    "/home";
            }
        }
    );
}


/* =========================================================
   CATEGORY NORMALIZATION
   ========================================================= */

function getCategory(profile) {

    if (!profile) {
        return "";
    }


    const category =
        profile.personal_category ||
        profile.category ||
        profile.connection_category ||
        "";


    return String(category)
        .trim()
        .toLowerCase();
}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function renderConnectionStatus(profile) {

    if (!connectionStatus) {
        return;
    }


    connectionStatus.classList.add(
        "hidden"
    );


    if (connectionStatusText) {

        connectionStatusText.textContent =
            "Connected";
    }


    if (connectionCategory) {

        connectionCategory.textContent = "";

        connectionCategory.classList.add(
            "hidden"
        );
    }


    if (!profile) {
        return;
    }


    /* Own profile */

    if (profile.is_self === true) {
        return;
    }


    const status =
        String(
            profile.connection_status || ""
        )
        .trim()
        .toLowerCase();


    const isConnected =
        status === "connected" ||
        profile.is_connected === true;


    if (!isConnected) {
        return;
    }


    /* Show Connected */

    connectionStatus.classList.remove(
        "hidden"
    );


    /* Category */

    const category =
        getCategory(profile);


    if (!connectionCategory) {
        return;
    }


    if (category === "friend") {

        connectionCategory.textContent =
            "Friends";

        connectionCategory.classList.remove(
            "hidden"
        );

        return;
    }


    if (category === "family") {

        connectionCategory.textContent =
            "Family";

        connectionCategory.classList.remove(
            "hidden"
        );

        return;
    }


    if (category === "couple") {

        connectionCategory.textContent =
            "Couple";

        connectionCategory.classList.remove(
            "hidden"
        );

        return;
    }


    /*
       No category = All Connected

       Only "Connected" remains visible.
    */
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


    /* Header Name */

    if (profileHeaderTitle) {

        profileHeaderTitle.textContent =
            profile.name ||
            "Profile";
    }


    /* Username */

    if (profileUsername) {

        const username =
            profile.username || "";


        if (username) {

            profileUsername.textContent =
                `@${username}`;

        } else {

            profileUsername.textContent =
                "@username";
        }
    }


    /* User ID */

    if (profileUserId) {

        profileUserId.textContent =
            profile.user_id || "";
    }


    /* Photo */

    renderProfilePhoto(profile);


    /* Connected + Category */

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


    /* Native mobile share */

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


    /* Clipboard */

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
            // Continue to fallback.
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
                        "Accept":
                            "application/json"
                    }
                }
            );


        /* Login required */

        if (response.status === 401) {

            window.location.href =
                "/login";

            return;
        }


        /* Profile unavailable */

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


        /* Not found */

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
