"use strict";

/* =========================================================
   USANEX PROFILE
   ========================================================= */


/* =========================================================
   DOM
   ========================================================= */

const backButton = document.getElementById("backButton");
const profileHeaderTitle = document.getElementById("profileHeaderTitle");

const profileMenuButton = document.getElementById("profileMenuButton");
const profileMenu = document.getElementById("profileMenu");

const blockButton = document.getElementById("blockButton");
const shareButton = document.getElementById("shareButton");
const qrButton = document.getElementById("qrButton");
const reportButton = document.getElementById("reportButton");

const profileContent = document.getElementById("profileContent");

const profileError = document.getElementById("profileError");
const profileErrorMessage = document.getElementById("profileErrorMessage");
const profileErrorBack = document.getElementById("profileErrorBack");

const profilePhoto = document.getElementById("profilePhoto");
const profileUsername = document.getElementById("profileUsername");
const profileUserId = document.getElementById("profileUserId");
const profileBio = document.getElementById("profileBio");

const followersCount = document.getElementById("followersCount");
const connectedCount = document.getElementById("connectedCount");
const followingCount = document.getElementById("followingCount");
const postsCount = document.getElementById("postsCount");

const reelsTab = document.getElementById("reelsTab");
const photosTab = document.getElementById("photosTab");

const postsContainer = document.getElementById("postsContainer");


/* =========================================================
   CONSTANTS
   ========================================================= */

const DEFAULT_PROFILE_IMAGE =
    "/static/images/default-profile.png";

const DEFAULT_BIO =
    "No bio available.";


/* =========================================================
   STATE
   ========================================================= */

let profileData = null;
let currentTab = "reels";


/* =========================================================
   GET USER ID
   ========================================================= */

function getTargetUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("user_id");
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            "Accept": "application/json",
            ...(options.headers || {})
        }
    });

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    return {
        response,
        data
    };
}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

async function getCurrentUser() {
    const result = await apiRequest(
        "/api/auth/me"
    );

    if (!result.response.ok) {
        return null;
    }

    return result.data;
}


/* =========================================================
   SHOW ERROR
   ========================================================= */

function showError(message) {
    if (profileContent) {
        profileContent.classList.add("hidden");
    }

    if (profileError) {
        profileError.classList.remove("hidden");
    }

    if (profileErrorMessage) {
        profileErrorMessage.textContent =
            message || "Unable to open profile.";
    }
}


/* =========================================================
   HIDE ERROR
   ========================================================= */

function hideError() {
    if (profileError) {
        profileError.classList.add("hidden");
    }

    if (profileContent) {
        profileContent.classList.remove("hidden");
    }
}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatCount(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    if (number < 1000) {
        return String(number);
    }

    if (number < 1000000) {
        const result = number / 1000;

        return (
            result % 1 === 0
                ? `${result}K`
                : `${result.toFixed(1)}K`
        );
    }

    const result = number / 1000000;

    return (
        result % 1 === 0
            ? `${result}M`
            : `${result.toFixed(1)}M`
    );
}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function setProfilePhoto(photoUrl) {
    if (!profilePhoto) {
        return;
    }

    if (
        typeof photoUrl === "string" &&
        photoUrl.trim() !== ""
    ) {
        profilePhoto.src = photoUrl;
    } else {
        profilePhoto.src = DEFAULT_PROFILE_IMAGE;
    }

    profilePhoto.onerror = () => {
        profilePhoto.onerror = null;
        profilePhoto.src = DEFAULT_PROFILE_IMAGE;
    };
}


/* =========================================================
   RENDER BASIC PROFILE
   ========================================================= */

function renderProfile(profile) {
    if (!profile) {
        return;
    }

    const user = profile.user || {};
    const stats = profile.stats || {};

    /* -----------------------------------------
       Header
    ----------------------------------------- */

    profileHeaderTitle.textContent =
        user.name ||
        user.username ||
        "Profile";


    /* -----------------------------------------
       Username
    ----------------------------------------- */

    if (user.username) {
        const username =
            String(user.username).startsWith("@")
                ? user.username
                : `@${user.username}`;

        profileUsername.textContent = username;
    } else {
        profileUsername.textContent = "@username";
    }


    /* -----------------------------------------
       User ID
    ----------------------------------------- */

    profileUserId.textContent =
        user.user_id ||
        "user_id";


    /* -----------------------------------------
       Profile Photo
    ----------------------------------------- */

    setProfilePhoto(
        user.profile_photo
    );


    /* -----------------------------------------
       Bio
    ----------------------------------------- */

    const bio =
        typeof user.bio === "string"
            ? user.bio.trim()
            : "";

    profileBio.textContent =
        bio || DEFAULT_BIO;


    /* -----------------------------------------
       Stats
    ----------------------------------------- */

    followersCount.textContent =
        formatCount(stats.followers);

    connectedCount.textContent =
        formatCount(stats.connected);

    followingCount.textContent =
        formatCount(stats.following);

    postsCount.textContent =
        formatCount(stats.posts);
}


/* =========================================================
   NORMALIZE MEDIA TYPE
   ========================================================= */

function normalizeMediaType(post) {
    if (!post) {
        return "";
    }

    return String(
        post.media_type || ""
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   CHECK REEL
   ========================================================= */

function isReel(post) {
    const type = normalizeMediaType(post);

    return (
        type === "reel" ||
        type === "video"
    );
}


/* =========================================================
   CHECK PHOTO
   ========================================================= */

function isPhoto(post) {
    const type = normalizeMediaType(post);

    return type === "photo" ||
        type === "image";
}


/* =========================================================
   FILTER CONTENT
   ========================================================= */

function getFilteredPosts() {
    if (!profileData) {
        return [];
    }

    const content =
        Array.isArray(profileData.content)
            ? profileData.content
            : [];

    if (currentTab === "photos") {
        return content.filter(isPhoto);
    }

    return content.filter(isReel);
}


/* =========================================================
   EMPTY MESSAGE
   ========================================================= */

function getEmptyMessage() {
    if (currentTab === "photos") {
        return "No photos yet.";
    }

    return "No reels yet.";
}


/* =========================================================
   CREATE POST ITEM
   ========================================================= */

function createPostItem(post) {
    const item =
        document.createElement("div");

    item.className = "post-item";

    item.dataset.postId =
        post.id || "";


    /* =====================================================
       MEDIA
    ===================================================== */

    if (post.media_url) {

        if (isReel(post)) {

            const video =
                document.createElement("video");

            video.src = post.media_url;

            video.muted = true;
            video.playsInline = true;
            video.preload = "metadata";

            item.appendChild(video);


            /* ---------------------------------------------
               Reel indicator
            --------------------------------------------- */

            const indicator =
                document.createElement("div");

            indicator.className =
                "post-video-indicator";

            indicator.textContent =
                "Reel";

            item.appendChild(indicator);

        } else {

            const image =
                document.createElement("img");

            image.src =
                post.media_url;

            image.alt =
                "Photo post";

            image.loading =
                "lazy";

            image.onerror = () => {
                image.style.display = "none";

                const fallback =
                    document.createElement("div");

                fallback.className =
                    "post-item-text";

                fallback.textContent =
                    "Image unavailable";

                item.appendChild(fallback);
            };

            item.appendChild(image);
        }

    } else {

        /* =================================================
           TEXT CONTENT
        ================================================= */

        const text =
            document.createElement("div");

        text.className =
            "post-item-text";

        text.textContent =
            post.content ||
            "Post";

        item.appendChild(text);
    }


    /* =====================================================
       CLICK
    ===================================================== */

    item.addEventListener(
        "click",
        () => {
            openPostViewer(post);
        }
    );

    return item;
}


/* =========================================================
   RENDER POSTS
   ========================================================= */

function renderPosts() {
    if (!postsContainer) {
        return;
    }

    postsContainer.innerHTML = "";

    const posts =
        getFilteredPosts();


    if (posts.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-posts";

        empty.textContent =
            getEmptyMessage();

        postsContainer.appendChild(empty);

        return;
    }


    posts.forEach((post) => {

        const item =
            createPostItem(post);

        postsContainer.appendChild(item);
    });
}


/* =========================================================
   TAB STATE
   ========================================================= */

function setActiveTab(tab) {
    currentTab =
        tab === "photos"
            ? "photos"
            : "reels";


    if (reelsTab) {
        reelsTab.classList.toggle(
            "active",
            currentTab === "reels"
        );
    }

    if (photosTab) {
        photosTab.classList.toggle(
            "active",
            currentTab === "photos"
        );
    }

    renderPosts();
}


/* =========================================================
   POST VIEWER
   ========================================================= */

function openPostViewer(post) {
    if (!post) {
        return;
    }

    const existing =
        document.getElementById(
            "profilePostViewer"
        );

    if (existing) {
        existing.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "profilePostViewer";

    overlay.style.position =
        "fixed";

    overlay.style.inset =
        "0";

    overlay.style.zIndex =
        "5000";

    overlay.style.background =
        "rgba(0, 0, 0, 0.92)";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.style.padding =
        "20px";


    /* =====================================================
       CLOSE BUTTON
    ===================================================== */

    const close =
        document.createElement("button");

    close.type =
        "button";

    close.textContent =
        "×";

    close.style.position =
        "absolute";

    close.style.top =
        "18px";

    close.style.right =
        "18px";

    close.style.width =
        "44px";

    close.style.height =
        "44px";

    close.style.borderRadius =
        "50%";

    close.style.border =
        "1px solid rgba(255,255,255,0.15)";

    close.style.background =
        "#0d1729";

    close.style.color =
        "#ffffff";

    close.style.fontSize =
        "30px";

    close.style.cursor =
        "pointer";

    close.addEventListener(
        "click",
        () => overlay.remove()
    );

    overlay.appendChild(close);


    /* =====================================================
       CONTENT
    ===================================================== */

    if (
        post.media_url &&
        isReel(post)
    ) {

        const video =
            document.createElement("video");

        video.src =
            post.media_url;

        video.controls =
            true;

        video.autoplay =
            true;

        video.playsInline =
            true;

        video.style.maxWidth =
            "100%";

        video.style.maxHeight =
            "85vh";

        video.style.borderRadius =
            "14px";

        overlay.appendChild(video);

    } else if (
        post.media_url &&
        isPhoto(post)
    ) {

        const image =
            document.createElement("img");

        image.src =
            post.media_url;

        image.alt =
            "Photo post";

        image.style.maxWidth =
            "100%";

        image.style.maxHeight =
            "85vh";

        image.style.objectFit =
            "contain";

        image.style.borderRadius =
            "14px";

        overlay.appendChild(image);

    } else {

        const text =
            document.createElement("div");

        text.textContent =
            post.content ||
            "No content";

        text.style.maxWidth =
            "600px";

        text.style.maxHeight =
            "75vh";

        text.style.overflow =
            "auto";

        text.style.padding =
            "24px";

        text.style.borderRadius =
            "16px";

        text.style.background =
            "#0a1424";

        text.style.border =
            "1px solid rgba(255,255,255,0.08)";

        text.style.color =
            "#ffffff";

        text.style.fontSize =
            "16px";

        text.style.lineHeight =
            "1.6";

        text.style.whiteSpace =
            "pre-wrap";

        overlay.appendChild(text);
    }


    /* =====================================================
       OUTSIDE CLICK
    ===================================================== */

    overlay.addEventListener(
        "click",
        (event) => {

            if (event.target === overlay) {
                overlay.remove();
            }
        }
    );


    /* =====================================================
       ESCAPE
    ===================================================== */

    const escapeHandler =
        (event) => {

            if (
                event.key === "Escape"
            ) {

                overlay.remove();

                document.removeEventListener(
                    "keydown",
                    escapeHandler
                );
            }
        };

    document.addEventListener(
        "keydown",
        escapeHandler
    );


    document.body.appendChild(
        overlay
    );
}


/* =========================================================
   MENU
   ========================================================= */

function closeMenu() {
    if (profileMenu) {
        profileMenu.classList.add("hidden");
    }
}

function toggleMenu() {
    if (!profileMenu) {
        return;
    }

    profileMenu.classList.toggle(
        "hidden"
    );
}


/* =========================================================
   BACK
   ========================================================= */

function goBack() {
    if (
        window.history.length > 1
    ) {
        window.history.back();
    } else {
        window.location.href =
            "/home";
    }
}


/* =========================================================
   SHARE
   ========================================================= */

async function shareProfile() {
    if (!profileData) {
        return;
    }

    const user =
        profileData.user || {};

    const shareUrl =
        window.location.href;

    const shareText =
        `${user.name || user.username || "Usanex user"}\n${shareUrl}`;


    try {

        if (
            navigator.share
        ) {

            await navigator.share({
                title:
                    user.name ||
                    user.username ||
                    "Usanex Profile",

                text:
                    shareText,

                url:
                    shareUrl
            });

            return;
        }

        if (
            navigator.clipboard
        ) {

            await navigator.clipboard.writeText(
                shareUrl
            );

            alert(
                "Profile link copied."
            );

            return;
        }

        alert(
            shareUrl
        );

    } catch (error) {

        /*
         * User cancelled native share.
         * No error message needed.
         */

    } finally {
        closeMenu();
    }
}


/* =========================================================
   BLOCK
   ========================================================= */

function handleBlock() {
    closeMenu();

    alert(
        "Block feature will be connected next."
    );
}


/* =========================================================
   QR
   ========================================================= */

function handleQR() {
    closeMenu();

    alert(
        "QR Code feature will be connected next."
    );
}


/* =========================================================
   REPORT
   ========================================================= */

function handleReport() {
    closeMenu();

    alert(
        "Report feature will be connected next."
    );
}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

    try {

        hideError();


        /* =================================================
           GET TARGET USER
        ================================================= */

        let targetUserId =
            getTargetUserIdFromUrl();


        /*
         * If no user_id is present,
         * open current user's profile.
         */

        if (!targetUserId) {

            const me =
                await getCurrentUser();

            if (!me) {

                showError(
                    "Please login again."
                );

                return;
            }


            /*
             * /api/auth/me may return user
             * directly or inside user.
             */

            const currentUser =
                me.user || me;


            targetUserId =
                currentUser.user_id;
        }


        if (!targetUserId) {

            showError(
                "User profile could not be found."
            );

            return;
        }


        /* =================================================
           FETCH PROFILE
        ================================================= */

        const result =
            await apiRequest(
                `/api/profile/${encodeURIComponent(
                    targetUserId
                )}`
            );


        /* =================================================
           UNAUTHORIZED
        ================================================= */

        if (
            result.response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }


        /* =================================================
           FORBIDDEN
        ================================================= */

        if (
            result.response.status === 403
        ) {

            showError(
                "This profile is available only to connected users."
            );

            return;
        }


        /* =================================================
           NOT FOUND
        ================================================= */

        if (
            result.response.status === 404
        ) {

            showError(
                "User not found."
            );

            return;
        }


        /* =================================================
           OTHER ERROR
        ================================================= */

        if (
            !result.response.ok
        ) {

            showError(
                result.data?.detail ||
                "Unable to load profile."
            );

            return;
        }


        /* =================================================
           VALIDATE RESPONSE
        ================================================= */

        if (
            !result.data ||
            result.data.success !== true
        ) {

            showError(
                "Invalid profile response."
            );

            return;
        }


        /* =================================================
           SAVE STATE
        ================================================= */

        profileData =
            result.data;


        /* =================================================
           RENDER
        ================================================= */

        renderProfile(
            profileData
        );

        setActiveTab(
            "reels"
        );

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showError(
            "Something went wrong while loading the profile."
        );
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

if (backButton) {
    backButton.addEventListener(
        "click",
        goBack
    );
}


if (profileErrorBack) {
    profileErrorBack.addEventListener(
        "click",
        goBack
    );
}


if (profileMenuButton) {
    profileMenuButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            toggleMenu();
        }
    );
}


if (reelsTab) {
    reelsTab.addEventListener(
        "click",
        () => {
            setActiveTab("reels");
        }
    );
}


if (photosTab) {
    photosTab.addEventListener(
        "click",
        () => {
            setActiveTab("photos");
        }
    );
}


if (shareButton) {
    shareButton.addEventListener(
        "click",
        shareProfile
    );
}


if (blockButton) {
    blockButton.addEventListener(
        "click",
        handleBlock
    );
}


if (qrButton) {
    qrButton.addEventListener(
        "click",
        handleQR
    );
}


if (reportButton) {
    reportButton.addEventListener(
        "click",
        handleReport
    );
}


/* =========================================================
   CLOSE MENU OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    (event) => {

        if (
            profileMenu &&
            !profileMenu.contains(event.target) &&
            event.target !== profileMenuButton
        ) {
            closeMenu();
        }
    }
);


/* =========================================================
   START
========================================================= */

loadProfile();
