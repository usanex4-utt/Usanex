"use strict";

/* =========================================================
   USANEX PROFILE
   =========================================================
   PROFILE MODES

   1. OWN PROFILE
      /profile

   2. OTHER USER PROFILE
      /profile?user_id=XXXX

   PRIVACY:
      Other user's profile is available only when connected.
      Follow alone does NOT unlock profile.
   ========================================================= */


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

const profileContent =
    document.getElementById("profileContent");

const profileError =
    document.getElementById("profileError");

const profileErrorMessage =
    document.getElementById("profileErrorMessage");

const profileErrorBack =
    document.getElementById("profileErrorBack");

const profilePhoto =
    document.getElementById("profilePhoto");

const profileUsername =
    document.getElementById("profileUsername");

const profileUserId =
    document.getElementById("profileUserId");

const profileBio =
    document.getElementById("profileBio");

const followersCount =
    document.getElementById("followersCount");

const connectedCount =
    document.getElementById("connectedCount");

const followingCount =
    document.getElementById("followingCount");

const postsCount =
    document.getElementById("postsCount");

const reelsTab =
    document.getElementById("reelsTab");

const photosTab =
    document.getElementById("photosTab");

const postsContainer =
    document.getElementById("postsContainer");


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

let isOwnProfile = false;

let targetUserId = null;


/* =========================================================
   GET USER ID FROM URL
   ========================================================= */

function getTargetUserIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const value =
        params.get("user_id");

    if (!value) {
        return null;
    }

    return value.trim() || null;
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                credentials: "include",

                ...options,

                headers: {
                    "Accept":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );

    let data = null;

    try {

        data =
            await response.json();

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

    const result =
        await apiRequest(
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

        profileContent.classList.add(
            "hidden"
        );
    }

    if (profileError) {

        profileError.classList.remove(
            "hidden"
        );
    }

    if (profileErrorMessage) {

        profileErrorMessage.textContent =
            message ||
            "Unable to open profile.";
    }
}


/* =========================================================
   HIDE ERROR
   ========================================================= */

function hideError() {

    if (profileError) {

        profileError.classList.add(
            "hidden"
        );
    }

    if (profileContent) {

        profileContent.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   FORMAT COUNT
   ========================================================= */

function formatCount(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    if (number < 1000) {

        return String(number);
    }

    if (number < 1000000) {

        const result =
            number / 1000;

        return (
            result % 1 === 0
                ? `${result}K`
                : `${result.toFixed(1)}K`
        );
    }

    const result =
        number / 1000000;

    return (
        result % 1 === 0
            ? `${result}M`
            : `${result.toFixed(1)}M`
    );
}


/* =========================================================
   SET PROFILE PHOTO
   ========================================================= */

function setProfilePhoto(photoUrl) {

    if (!profilePhoto) {
        return;
    }

    if (
        typeof photoUrl === "string" &&
        photoUrl.trim() !== ""
    ) {

        profilePhoto.src =
            photoUrl;

    } else {

        profilePhoto.src =
            DEFAULT_PROFILE_IMAGE;
    }

    profilePhoto.onerror = () => {

        profilePhoto.onerror = null;

        profilePhoto.src =
            DEFAULT_PROFILE_IMAGE;
    };
}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(profile) {

    if (!profile) {
        return;
    }

    const user =
        profile.user || {};

    const stats =
        profile.stats || {};

    const relationship =
        profile.relationship || {};


    /* =====================================================
       PROFILE MODE
    ===================================================== */

    isOwnProfile =
        relationship.is_self === true;


    /* =====================================================
       HEADER
    ===================================================== */

    if (profileHeaderTitle) {

        profileHeaderTitle.textContent =
            user.name ||
            user.username ||
            "Profile";
    }


    /* =====================================================
       USERNAME
    ===================================================== */

    if (profileUsername) {

        if (user.username) {

            const username =
                String(user.username);

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
            user.user_id ||
            "user_id";
    }


    /* =====================================================
       PROFILE PHOTO
    ===================================================== */

    setProfilePhoto(
        user.profile_photo
    );


    /* =====================================================
       BIO
    ===================================================== */

    if (profileBio) {

        const bio =
            typeof user.bio === "string"
                ? user.bio.trim()
                : "";

        profileBio.textContent =
            bio || DEFAULT_BIO;
    }


    /* =====================================================
       STATS
    ===================================================== */

    if (followersCount) {

        followersCount.textContent =
            formatCount(
                stats.followers
            );
    }

    if (connectedCount) {

        connectedCount.textContent =
            formatCount(
                stats.connected
            );
    }

    if (followingCount) {

        followingCount.textContent =
            formatCount(
                stats.following
            );
    }

    if (postsCount) {

        postsCount.textContent =
            formatCount(
                stats.posts
            );
    }


    /* =====================================================
       OWN / OTHER PROFILE UI
    ===================================================== */

    updateProfileModeUI(
        isOwnProfile
    );
}


/* =========================================================
   PROFILE MODE UI
   ========================================================= */

function updateProfileModeUI(ownProfile) {

    /*
     * Existing HTML may or may not contain
     * these optional elements.
     *
     * Therefore we check before using them.
     */

    const editButton =
        document.getElementById(
            "editProfileButton"
        );

    const followButton =
        document.getElementById(
            "followButton"
        );

    const connectButton =
        document.getElementById(
            "connectButton"
        );


    /* =====================================================
       OWN PROFILE
    ===================================================== */

    if (ownProfile) {

        if (editButton) {

            editButton.classList.remove(
                "hidden"
            );
        }

        if (followButton) {

            followButton.classList.add(
                "hidden"
            );
        }

        if (connectButton) {

            connectButton.classList.add(
                "hidden"
            );
        }

        return;
    }


    /* =====================================================
       OTHER USER PROFILE
    ===================================================== */

    if (editButton) {

        editButton.classList.add(
            "hidden"
        );
    }

    /*
     * Follow / Connect buttons are intentionally
     * NOT automatically enabled here.
     *
     * The profile endpoint has already verified
     * that the user is connected.
     *
     * Their own APIs will control their state.
     */

}


/* =========================================================
   MEDIA TYPE
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
   IS REEL
   ========================================================= */

function isReel(post) {

    const type =
        normalizeMediaType(post);

    return (
        type === "reel" ||
        type === "video"
    );
}


/* =========================================================
   IS PHOTO
   ========================================================= */

function isPhoto(post) {

    const type =
        normalizeMediaType(post);

    return (
        type === "photo" ||
        type === "image"
    );
}


/* =========================================================
   FILTER POSTS
   ========================================================= */

function getFilteredPosts() {

    if (!profileData) {
        return [];
    }

    const content =
        Array.isArray(
            profileData.content
        )
            ? profileData.content
            : [];

    if (currentTab === "photos") {

        return content.filter(
            isPhoto
        );
    }

    return content.filter(
        isReel
    );
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

    item.className =
        "post-item";

    item.dataset.postId =
        post.id || "";


    /* =====================================================
       MEDIA
    ===================================================== */

    if (post.media_url) {

        /* =================================================
           REEL
        ================================================= */

        if (isReel(post)) {

            const video =
                document.createElement("video");

            video.src =
                post.media_url;

            video.muted =
                true;

            video.playsInline =
                true;

            video.preload =
                "metadata";

            item.appendChild(
                video
            );


            const indicator =
                document.createElement("div");

            indicator.className =
                "post-video-indicator";

            indicator.textContent =
                "Reel";

            item.appendChild(
                indicator
            );

        }

        /* =================================================
           PHOTO
        ================================================= */

        else {

            const image =
                document.createElement("img");

            image.src =
                post.media_url;

            image.alt =
                "Photo post";

            image.loading =
                "lazy";

            image.onerror = () => {

                image.style.display =
                    "none";

                const fallback =
                    document.createElement(
                        "div"
                    );

                fallback.className =
                    "post-item-text";

                fallback.textContent =
                    "Image unavailable";

                item.appendChild(
                    fallback
                );
            };

            item.appendChild(
                image
            );
        }

    }

    /* =====================================================
       TEXT POST
       ===================================================== */

    else {

        const text =
            document.createElement(
                "div"
            );

        text.className =
            "post-item-text";

        text.textContent =
            post.content ||
            "Post";

        item.appendChild(
            text
        );
    }


    /* =====================================================
       OPEN POST
    ===================================================== */

    item.addEventListener(
        "click",
        () => {

            openPostViewer(
                post
            );
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

    postsContainer.innerHTML =
        "";

    const posts =
        getFilteredPosts();


    if (posts.length === 0) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-posts";

        empty.textContent =
            getEmptyMessage();

        postsContainer.appendChild(
            empty
        );

        return;
    }


    posts.forEach(
        (post) => {

            const item =
                createPostItem(
                    post
                );

            postsContainer.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   TAB
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
        document.createElement(
            "div"
        );

    overlay.id =
        "profilePostViewer";

    Object.assign(
        overlay.style,
        {
            position: "fixed",
            inset: "0",
            zIndex: "5000",
            background:
                "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }
    );


    /* =====================================================
       CLOSE
    ===================================================== */

    const close =
        document.createElement(
            "button"
        );

    close.type =
        "button";

    close.textContent =
        "×";

    Object.assign(
        close.style,
        {
            position: "absolute",
            top: "18px",
            right: "18px",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border:
                "1px solid rgba(255,255,255,0.15)",
            background: "#0d1729",
            color: "#ffffff",
            fontSize: "30px",
            cursor: "pointer"
        }
    );

    close.addEventListener(
        "click",
        () => overlay.remove()
    );

    overlay.appendChild(
        close
    );


    /* =====================================================
       REEL
    ===================================================== */

    if (
        post.media_url &&
        isReel(post)
    ) {

        const video =
            document.createElement(
                "video"
            );

        video.src =
            post.media_url;

        video.controls =
            true;

        video.autoplay =
            true;

        video.playsInline =
            true;

        Object.assign(
            video.style,
            {
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "14px"
            }
        );

        overlay.appendChild(
            video
        );
    }


    /* =====================================================
       PHOTO
    ===================================================== */

    else if (
        post.media_url &&
        isPhoto(post)
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            post.media_url;

        image.alt =
            "Photo post";

        Object.assign(
            image.style,
            {
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "14px"
            }
        );

        overlay.appendChild(
            image
        );
    }


    /* =====================================================
       TEXT
    ===================================================== */

    else {

        const text =
            document.createElement(
                "div"
            );

        text.textContent =
            post.content ||
            "No content";

        Object.assign(
            text.style,
            {
                maxWidth: "600px",
                maxHeight: "75vh",
                overflow: "auto",
                padding: "24px",
                borderRadius: "16px",
                background: "#0a1424",
                border:
                    "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: "16px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap"
            }
        );

        overlay.appendChild(
            text
        );
    }


    /* =====================================================
       OUTSIDE CLICK
    ===================================================== */

    overlay.addEventListener(
        "click",
        (event) => {

            if (
                event.target === overlay
            ) {

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

        profileMenu.classList.add(
            "hidden"
        );
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
   SHARE PROFILE
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
         * User cancelled share.
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

    if (isOwnProfile) {

        return;
    }

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

    if (isOwnProfile) {

        return;
    }

    alert(
        "Report feature will be connected next."
    );
}


/* =========================================================
   LOAD OWN PROFILE
   ========================================================= */

async function loadOwnProfile() {

    const result =
        await apiRequest(
            "/api/profile/me"
        );


    if (
        result.response.status === 401
    ) {

        window.location.href =
            "/login";

        return false;
    }


    if (
        !result.response.ok
    ) {

        showError(
            result.data?.detail ||
            "Unable to load your profile."
        );

        return false;
    }


    if (
        !result.data ||
        result.data.success !== true
    ) {

        showError(
            "Invalid profile response."
        );

        return false;
    }


    profileData =
        result.data;

    isOwnProfile =
        true;

    targetUserId =
        profileData.user?.user_id ||
        null;


    renderProfile(
        profileData
    );

    setActiveTab(
        "reels"
    );

    return true;
}


/* =========================================================
   LOAD OTHER USER PROFILE
   ========================================================= */

async function loadOtherProfile(
    userId
) {

    const result =
        await apiRequest(
            `/api/profile/${encodeURIComponent(
                userId
            )}`
        );


    /* =====================================================
       LOGIN REQUIRED
    ===================================================== */

    if (
        result.response.status === 401
    ) {

        window.location.href =
            "/login";

        return false;
    }


    /* =====================================================
       PRIVACY BLOCK
    ===================================================== */

    if (
        result.response.status === 403
    ) {

        showError(
            "This profile is available only to connected users."
        );

        return false;
    }


    /* =====================================================
       USER NOT FOUND
    ===================================================== */

    if (
        result.response.status === 404
    ) {

        showError(
            "User not found."
        );

        return false;
    }


    /* =====================================================
       OTHER ERROR
    ===================================================== */

    if (
        !result.response.ok
    ) {

        showError(
            result.data?.detail ||
            "Unable to load profile."
        );

        return false;
    }


    /* =====================================================
       VALID RESPONSE
    ===================================================== */

    if (
        !result.data ||
        result.data.success !== true
    ) {

        showError(
            "Invalid profile response."
        );

        return false;
    }


    profileData =
        result.data;

    isOwnProfile =
        profileData.relationship?.is_self === true;

    targetUserId =
        profileData.user?.user_id ||
        userId;


    renderProfile(
        profileData
    );

    setActiveTab(
        "reels"
    );

    return true;
}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

    try {

        hideError();


        /* =================================================
           URL USER
        ================================================= */

        const urlUserId =
            getTargetUserIdFromUrl();


        /* =================================================
           NO USER ID
           → OWN PROFILE
        ================================================= */

        if (!urlUserId) {

            await loadOwnProfile();

            return;
        }


        /* =================================================
           USER ID EXISTS
           → OTHER PROFILE
        ================================================= */

        await loadOtherProfile(
            urlUserId
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

            setActiveTab(
                "reels"
            );
        }
    );
}


if (photosTab) {

    photosTab.addEventListener(
        "click",
        () => {

            setActiveTab(
                "photos"
            );
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
            !profileMenu.contains(
                event.target
            ) &&
            event.target !==
                profileMenuButton
        ) {

            closeMenu();
        }
    }
);


/* =========================================================
   START
   ========================================================= */

loadProfile();
