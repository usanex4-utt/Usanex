/* =========================================================
   USANEX - OTHER USER PROFILE
   ========================================================= */

"use strict";


/* =========================================================
   DOM
   ========================================================= */

const backButton =
    document.getElementById("backButton");

const profileHeaderTitle =
    document.getElementById("profileHeaderTitle");

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

const connectionType =
    document.getElementById("connectionType");

const personalCategory =
    document.getElementById("personalCategory");


/* =========================================================
   GET USER ID FROM URL
   ========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const userId =
    params.get("user_id");


/* =========================================================
   HELPERS
   ========================================================= */

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


function getInitial(name) {

    const value =
        String(name || "U").trim();

    return (
        value.charAt(0).toUpperCase() ||
        "U"
    );
}


function normalizeCategory(category) {

    if (!category) {
        return "";
    }

    const value =
        String(category)
            .trim()
            .toLowerCase();

    if (
        value === "friend" ||
        value === "friends"
    ) {
        return "friend";
    }

    if (
        value === "family" ||
        value === "families"
    ) {
        return "family";
    }

    return "";
}


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
   PROFILE PHOTO
   ========================================================= */

function renderProfilePhoto(user) {

    if (!profilePhoto) {
        return;
    }

    const photo =
        user.profile_photo ||
        user.profilePhoto ||
        user.photo ||
        "";

    const name =
        user.name ||
        user.full_name ||
        "U";


    if (photo) {

        profilePhoto.innerHTML = "";

        const img =
            document.createElement("img");

        img.src = photo;

        img.alt =
            `${name} profile photo`;

        img.onerror = () => {

            profilePhoto.innerHTML =
                escapeHtml(
                    getInitial(name)
                );
        };

        profilePhoto.appendChild(img);

    } else {

        profilePhoto.textContent =
            getInitial(name);
    }
}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function renderConnectionStatus(user) {

    const status =
        String(
            user.connection_status ||
            user.connectionStatus ||
            ""
        ).toLowerCase();

    const connected =
        user.is_connected === true ||
        status === "connected";


    if (!connectionStatus) {
        return;
    }


    if (connected) {

        connectionStatus.textContent =
            "Connected";

        connectionStatus.classList.remove(
            "hidden"
        );

    } else {

        connectionStatus.classList.add(
            "hidden"
        );
    }


    if (connectionType) {

        if (connected) {

            connectionType.textContent =
                "Connected";

        } else if (
            status === "pending_sent"
        ) {

            connectionType.textContent =
                "Request sent";

        } else if (
            status === "pending_received"
        ) {

            connectionType.textContent =
                "Request received";

        } else {

            connectionType.textContent =
                "Not connected";
        }
    }
}


/* =========================================================
   PERSONAL CATEGORY
   ========================================================= */

function renderPersonalCategory(user) {

    if (!personalCategory) {
        return;
    }

    const category =
        normalizeCategory(
            user.category ||
            user.personal_category ||
            user.personalCategory ||
            user.connection_category
        );


    personalCategory.classList.remove(
        "friend",
        "family"
    );


    if (category === "friend") {

        personalCategory.textContent =
            "Friend";

        personalCategory.classList.add(
            "friend"
        );

    } else if (category === "family") {

        personalCategory.textContent =
            "Family";

        personalCategory.classList.add(
            "family"
        );

    } else {

        personalCategory.textContent =
            "—";
    }
}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(user) {

    /* -----------------------------------------------------
       NAME
       ----------------------------------------------------- */

    const name =
        user.name ||
        user.full_name ||
        "Unknown User";


    /* -----------------------------------------------------
       USERNAME
       ----------------------------------------------------- */

    const username =
        user.username ||
        user.user_name ||
        user.handle ||
        "";


    /* -----------------------------------------------------
       USER ID
       ----------------------------------------------------- */

    const returnedUserId =
        user.user_id ||
        user.userId ||
        user.id ||
        userId;


    /* -----------------------------------------------------
       BIO
       ----------------------------------------------------- */

    const bio =
        user.bio ||
        "No bio available.";


    /* =====================================================
       HEADER = ONLY NAME
       ===================================================== */

    if (profileHeaderTitle) {

        profileHeaderTitle.textContent =
            name;
    }


    /* =====================================================
       USERNAME
       ===================================================== */

    if (profileUsername) {

        if (username) {

            profileUsername.textContent =
                username.startsWith("@")
                    ? username
                    : `@${username}`;

        } else {

            profileUsername.textContent =
                "@username";
        }
    }


    /* =====================================================
       USER ID
       ===================================================== */

    if (profileUserId) {

        profileUserId.textContent =
            returnedUserId
                ? String(returnedUserId)
                : "User ID";
    }


    /* =====================================================
       BIO
       ===================================================== */

    if (profileBio) {

        profileBio.textContent =
            bio;
    }


    /* =====================================================
       OTHER DATA
       ===================================================== */

    renderProfilePhoto(user);

    renderConnectionStatus(user);

    renderPersonalCategory(user);
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoading() {

    if (profileHeaderTitle) {

        profileHeaderTitle.textContent =
            "Loading...";
    }


    if (profileUsername) {

        profileUsername.textContent =
            "";
    }


    if (profileUserId) {

        profileUserId.textContent =
            "";
    }


    if (profileBio) {

        profileBio.textContent =
            "Loading profile...";
    }
}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showError(message) {

    if (profileHeaderTitle) {

        profileHeaderTitle.textContent =
            "Profile";
    }


    if (profileUsername) {

        profileUsername.textContent =
            "";
    }


    if (profileUserId) {

        profileUserId.textContent =
            "";
    }


    if (profileBio) {

        profileBio.textContent =
            message ||
            "Unable to load this profile.";

        profileBio.classList.add(
            "profile-error"
        );
    }


    if (connectionStatus) {

        connectionStatus.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   FETCH PROFILE
   ========================================================= */

async function loadProfile() {

    if (!userId) {

        showError(
            "No user was selected."
        );

        return;
    }


    showLoading();


    try {

        const response =
            await fetch(
                `/api/profile/${encodeURIComponent(userId)}`,
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            if (response.status === 403) {

                throw new Error(
                    "This profile is available only to connected users."
                );
            }


            if (response.status === 404) {

                throw new Error(
                    "User profile not found."
                );
            }


            if (response.status === 401) {

                throw new Error(
                    "Please login again."
                );
            }


            throw new Error(
                `Profile request failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        const user =
            data.user ||
            data.profile ||
            data;


        if (
            !user ||
            typeof user !== "object"
        ) {

            throw new Error(
                "Invalid profile response."
            );
        }


        renderProfile(user);


    } catch (error) {

        console.error(
            "Usanex profile error:",
            error
        );


        showError(
            error.message ||
            "Unable to load this profile."
        );
    }
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProfile();

    }
);
