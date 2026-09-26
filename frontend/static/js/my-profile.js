/* =========================================================
   USANEX — MY PROFILE
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const profileState = {

    user: null,

    stats: {
        followers: 0,
        connected: 0,
        following: 0,
        posts: 0
    },

    activeTab: "reels",

    content: {
        reels: [],
        photos: [],
        saved: [],
        private: []
    }

};


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initMyProfile();

    }
);


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {

    return document.getElementById(id);

}


function show(element) {

    if (element) {
        element.classList.remove("hidden");
    }

}


function hide(element) {

    if (element) {
        element.classList.add("hidden");
    }

}


function safeText(value, fallback = "") {

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    return String(value);

}


function escapeHtml(value) {

    return safeText(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function getPhotoUrl(photo) {

    if (!photo) {

        return "/static/images/default-profile.png";

    }

    return String(photo);

}


function formatViews(value) {

    const views = Number(value || 0);

    if (views >= 1000000) {

        return (
            (views / 1000000)
                .toFixed(1)
                .replace(".0", "") +
            "M"
        );

    }

    if (views >= 1000) {

        return (
            (views / 1000)
                .toFixed(1)
                .replace(".0", "") +
            "K"
        );

    }

    return String(views);

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initMyProfile() {

    setupHeader();

    setupMenu();

    setupPhotoViewer();

    setupEditProfile();

    setupTabs();

    setupBottomNavigation();

    await loadMyProfile();

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadMyProfile() {

    try {

        const response = await fetch(
            "/api/profile/me",
            {
                method: "GET",

                credentials: "include",

                headers: {
                    "Accept": "application/json"
                }
            }
        );


        if (response.status === 401) {

            window.location.href = "/login";

            return;

        }


        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => null);

            throw new Error(
                errorData?.detail ||
                "Unable to load profile."
            );

        }


        const data =
            await response.json();


        if (!data || !data.success) {

            throw new Error(
                "Invalid profile response."
            );

        }


        profileState.user =
            data.user || {};


        profileState.stats = {

            followers:
                Number(
                    data.stats?.followers || 0
                ),

            connected:
                Number(
                    data.stats?.connected || 0
                ),

            following:
                Number(
                    data.stats?.following || 0
                ),

            posts:
                Number(
                    data.stats?.posts || 0
                )

        };


        processUnifiedContent(
            data.content || []
        );


        renderProfile(
            profileState.user
        );


        renderActiveTab();


    } catch (error) {

        console.error(
            "My Profile:",
            error
        );


        renderProfileError(
            error.message ||
            "Unable to load your profile."
        );

    }

}


/* =========================================================
   PROCESS CONTENT
   ========================================================= */

function processUnifiedContent(posts) {

    profileState.content.reels = [];

    profileState.content.photos = [];

    posts.forEach(
        (post) => {

            const mediaType =
                safeText(
                    post.media_type
                ).toLowerCase();


            if (
                mediaType === "video" ||
                mediaType === "reel"
            ) {

                profileState
                    .content
                    .reels
                    .push(post);

                return;

            }


            if (
                mediaType === "image" ||
                mediaType === "photo"
            ) {

                profileState
                    .content
                    .photos
                    .push(post);

            }

        }
    );


    profileState.content.saved = [];

    profileState.content.private = [];

}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(user) {

    const name =
        safeText(
            user.name,
            "Usanex User"
        );


    const username =
        safeText(
            user.username,
            ""
        );


    const userId =
        safeText(
            user.user_id,
            ""
        );


    const photo =
        getPhotoUrl(
            user.profile_photo
        );


    const bio =
        safeText(
            user.bio,
            ""
        );


    /*
     * HEADER NAME
     */

    if ($("profileName")) {

        $("profileName").textContent =
            name;

    }


    /*
     * PROFILE USERNAME
     */

    if ($("profileUsername")) {

        $("profileUsername").textContent =
            username
                ? `@${username.replace(/^@/, "")}`
                : "@username";

    }


    /*
     * USER ID
     */

    if ($("profileUserId")) {

        $("profileUserId").textContent =
            userId || "u_xxxxxxxx";

    }


    /*
     * PROFILE PHOTO
     */

    if ($("profilePhoto")) {

        $("profilePhoto").src =
            photo;

    }


    if ($("editProfilePhotoPreview")) {

        $("editProfilePhotoPreview").src =
            photo;

    }


    /*
     * BIO
     */

    if ($("profileBio")) {

        $("profileBio").textContent =
            bio.trim()
                ? bio
                : "No bio available.";

    }


    /*
     * STATS
     */

    if ($("followersCount")) {

        $("followersCount").textContent =
            profileState.stats.followers;

    }


    if ($("connectedCount")) {

        $("connectedCount").textContent =
            profileState.stats.connected;

    }


    if ($("followingCount")) {

        $("followingCount").textContent =
            profileState.stats.following;

    }


    if ($("postsCount")) {

        $("postsCount").textContent =
            profileState.stats.posts;

    }


    renderProfileLinks(user);

}


/* =========================================================
   PROFILE LINKS
   ========================================================= */

function renderProfileLinks(user) {

    const container =
        $("profileLinks");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const links = [];


    if (user.website) {

        links.push({
            label: "Website",
            url: user.website
        });

    }


    if (user.instagram) {

        links.push({
            label: "Instagram",
            url: user.instagram
        });

    }


    if (user.social_link) {

        links.push({
            label: "Social Link",
            url: user.social_link
        });

    }


    if (!links.length) {

        hide(container);

        return;

    }


    links.forEach(
        (link) => {

            const anchor =
                document.createElement("a");


            anchor.className =
                "profile-link";


            anchor.href =
                normalizeUrl(
                    link.url
                );


            anchor.target =
                "_blank";


            anchor.rel =
                "noopener noreferrer";


            anchor.textContent =
                link.label;


            container.appendChild(
                anchor
            );

        }
    );


    show(container);

}


function normalizeUrl(url) {

    const value =
        safeText(url).trim();


    if (!value) {
        return "#";
    }


    if (
        /^https?:\/\//i.test(value)
    ) {

        return value;

    }


    return `https://${value}`;

}


/* =========================================================
   HEADER
   ========================================================= */

function setupHeader() {

    const addButton =
        $("profileAddButton");


    if (!addButton) {
        return;
    }


    addButton.addEventListener(
        "click",
        () => {

            /*
             * Future:
             * Create post / reel / moment
             */

            console.log(
                "Usanex create button"
            );

        }
    );

}


/* =========================================================
   THREE LINE MENU
   ========================================================= */

function setupMenu() {

    const menuButton =
        $("profileMenuButton");


    const menu =
        $("profileMenu");


    if (!menuButton || !menu) {
        return;
    }


    menuButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            menu.classList.toggle(
                "hidden"
            );

        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                !menu.contains(
                    event.target
                ) &&
                !menuButton.contains(
                    event.target
                )
            ) {

                hide(menu);

            }

        }
    );


    /*
     * EDIT PROFILE
     */

    const editButton =
        $("editProfileButton");


    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {

                hide(menu);

                openEditProfile();

            }
        );

    }


    /*
     * PRIVACY
     */

    const privacyButton =
        $("privacyButton");


    if (privacyButton) {

        privacyButton.addEventListener(
            "click",
            () => {

                hide(menu);

                alert(
                    "Privacy settings will be available here."
                );

            }
        );

    }


    /*
     * SECURITY
     */

    const securityButton =
        $("securityButton");


    if (securityButton) {

        securityButton.addEventListener(
            "click",
            () => {

                hide(menu);

                alert(
                    "Security settings will be available here."
                );

            }
        );

    }


    /*
     * BLOCKED USERS
     */

    const blockedUsersButton =
        $("blockedUsersButton");


    if (blockedUsersButton) {

        blockedUsersButton.addEventListener(
            "click",
            () => {

                hide(menu);

                alert(
                    "Blocked users will be available here."
                );

            }
        );

    }


    /*
     * ACCOUNT
     */

    const accountButton =
        $("accountButton");


    if (accountButton) {

        accountButton.addEventListener(
            "click",
            () => {

                hide(menu);

                alert(
                    "Account settings will be available here."
                );

            }
        );

    }


    /*
     * HELP
     */

    const helpButton =
        $("helpButton");


    if (helpButton) {

        helpButton.addEventListener(
            "click",
            () => {

                hide(menu);

                alert(
                    "Help will be available here."
                );

            }
        );

    }


    /*
     * ABOUT
     */

    const aboutButton =
        $("aboutButton");


    if (aboutButton) {

        aboutButton.addEventListener(
            "click",
            () => {

                hide(menu);

                alert(
                    "Usanex"
                );

            }
        );

    }


    /*
     * LOGOUT
     */

    const logoutButton =
        $("logoutButton");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                hide(menu);

                await logout();

            }
        );

    }

}


/* =========================================================
   PROFILE PHOTO VIEWER
   ========================================================= */

function setupPhotoViewer() {

    const photoButton =
        $("profilePhotoButton");


    const viewer =
        $("profilePhotoViewer");


    const viewerPhoto =
        $("viewerPhoto");


    const closeButton =
        $("closePhotoViewer");


    if (
        !photoButton ||
        !viewer ||
        !viewerPhoto
    ) {

        return;

    }


    photoButton.addEventListener(
        "click",
        () => {

            const photo =
                $("profilePhoto")?.src;


            if (!photo) {
                return;
            }


            viewerPhoto.src =
                photo;


            show(viewer);


            document.body.style.overflow =
                "hidden";

        }
    );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePhotoViewer
        );

    }


    viewer.addEventListener(
        "click",
        (event) => {

            if (
                event.target === viewer
            ) {

                closePhotoViewer();

            }

        }
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape"
            ) {

                closePhotoViewer();

            }

        }
    );

}


function closePhotoViewer() {

    const viewer =
        $("profilePhotoViewer");


    if (!viewer) {
        return;
    }


    hide(viewer);


    document.body.style.overflow =
        "";

}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function setupEditProfile() {

    const closeButton =
        $("closeEditProfile");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeEditProfile
        );

    }


    const modal =
        $("editProfileModal");


    if (modal) {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal
                ) {

                    closeEditProfile();

                }

            }
        );

    }


    const changePhotoButton =
        $("changeProfilePhotoButton");


    const photoInput =
        $("profilePhotoInput");


    if (
        changePhotoButton &&
        photoInput
    ) {

        changePhotoButton.addEventListener(
            "click",
            () => {

                photoInput.click();

            }
        );


        photoInput.addEventListener(
            "change",
            handleProfilePhotoSelection
        );

    }


    const saveButton =
        $("saveProfileButton");


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveProfile
        );

    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape"
            ) {

                closeEditProfile();

            }

        }
    );

}


/* =========================================================
   OPEN EDIT PROFILE
   ========================================================= */

function openEditProfile() {

    const modal =
        $("editProfileModal");


    if (!modal) {
        return;
    }


    const user =
        profileState.user || {};


    if ($("editName")) {

        $("editName").value =
            safeText(user.name);

    }


    if ($("editUsername")) {

        $("editUsername").value =
            safeText(user.username);

    }


    if ($("editUserId")) {

        $("editUserId").value =
            safeText(user.user_id);

    }


    if ($("editBio")) {

        $("editBio").value =
            safeText(user.bio);

    }


    if ($("editWebsite")) {

        $("editWebsite").value =
            safeText(user.website);

    }


    if ($("editInstagram")) {

        $("editInstagram").value =
            safeText(user.instagram);

    }


    if ($("editSocialLink")) {

        $("editSocialLink").value =
            safeText(user.social_link);

    }


    if ($("editProfilePhotoPreview")) {

        $("editProfilePhotoPreview").src =
            getPhotoUrl(
                user.profile_photo
            );

    }


    if ($("editProfileMessage")) {

        $("editProfileMessage").textContent =
            "";

    }


    show(modal);


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE EDIT PROFILE
   ========================================================= */

function closeEditProfile() {

    const modal =
        $("editProfileModal");


    if (!modal) {
        return;
    }


    hide(modal);


    document.body.style.overflow =
        "";

}


/* =========================================================
   PHOTO SELECTION
   ========================================================= */

function handleProfilePhotoSelection(event) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    if (
        !file.type.startsWith("image/")
    ) {

        alert(
            "Please select an image file."
        );


        event.target.value =
            "";


        return;

    }


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        alert(
            "Profile photo must be 10 MB or smaller."
        );


        event.target.value =
            "";


        return;

    }


    const preview =
        $("editProfilePhotoPreview");


    if (!preview) {
        return;
    }


    const objectUrl =
        URL.createObjectURL(file);


    preview.src =
        objectUrl;


    preview.onload = () => {

        URL.revokeObjectURL(
            objectUrl
        );

    };

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile() {

    const saveButton =
        $("saveProfileButton");


    const name =
        $("editName")?.value.trim() ||
        "";


    const bio =
        $("editBio")?.value.trim() ||
        "";


    const website =
        $("editWebsite")?.value.trim() ||
        "";


    const instagram =
        $("editInstagram")?.value.trim() ||
        "";


    const socialLink =
        $("editSocialLink")?.value.trim() ||
        "";


    if (!name) {

        setEditMessage(
            "Name cannot be empty."
        );

        return;

    }


    if (name.length > 100) {

        setEditMessage(
            "Name must be 100 characters or less."
        );

        return;

    }


    if (bio.length > 500) {

        setEditMessage(
            "Bio must be 500 characters or less."
        );

        return;

    }


    if (saveButton) {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";

    }


    setEditMessage("");


    try {

        const response =
            await fetch(
                "/api/profile/me",
                {
                    method: "PUT",

                    credentials: "include",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name,

                            bio,

                            website,

                            instagram,

                            social_link:
                                socialLink

                        })

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

            const errorData =
                await response
                    .json()
                    .catch(() => null);


            throw new Error(
                errorData?.detail ||
                "Unable to save profile."
            );

        }


        const data =
            await response.json();


        profileState.user = {

            ...profileState.user,

            ...(data.user || {})

        };


        renderProfile(
            profileState.user
        );


        setEditMessage(
            "Profile saved successfully."
        );


        setTimeout(
            () => {

                closeEditProfile();

            },
            700
        );


    } catch (error) {

        console.error(
            "Save profile:",
            error
        );


        setEditMessage(
            error.message ||
            "Unable to save profile."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Changes";

        }

    }

}


function setEditMessage(message) {

    const element =
        $("editProfileMessage");


    if (element) {

        element.textContent =
            message;

    }

}


/* =========================================================
   CONTENT TABS
   ========================================================= */

function setupTabs() {

    const tabs =
        document.querySelectorAll(
            ".profile-content-tab"
        );


    tabs.forEach(
        (tab) => {

            tab.addEventListener(
                "click",
                () => {

                    const tabName =
                        tab.dataset.tab;


                    if (!tabName) {
                        return;
                    }


                    setActiveTab(
                        tabName
                    );

                }
            );

        }
    );

}


function setActiveTab(tabName) {

    const validTabs = [
        "reels",
        "photos",
        "saved",
        "private"
    ];


    if (
        !validTabs.includes(tabName)
    ) {

        return;

    }


    profileState.activeTab =
        tabName;


    document
        .querySelectorAll(
            ".profile-content-tab"
        )
        .forEach(
            (tab) => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.tab ===
                        tabName
                );

            }
        );


    renderActiveTab();

}


/* =========================================================
   RENDER ACTIVE CONTENT
   ========================================================= */

function renderActiveTab() {

    const container =
        $("profileContentContainer");


    if (!container) {
        return;
    }


    const items =
        profileState.content[
            profileState.activeTab
        ] || [];


    container.innerHTML =
        "";


    if (!items.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-content";


        empty.textContent =
            getEmptyMessage(
                profileState.activeTab
            );


        container.appendChild(
            empty
        );


        return;

    }


    items.forEach(
        (item) => {

            container.appendChild(
                createContentCard(item)
            );

        }
    );

}


function getEmptyMessage(tab) {

    switch (tab) {

        case "reels":
            return "No reels yet.";

        case "photos":
            return "No photos yet.";

        case "saved":
            return "No saved content yet.";

        case "private":
            return "No private content yet.";

        default:
            return "No content yet.";

    }

}


/* =========================================================
   CONTENT CARD
   ========================================================= */

function createContentCard(item) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "content-card";


    const mediaType =
        safeText(
            item.media_type
        ).toLowerCase();


    const mediaUrl =
        safeText(
            item.media_url
        );


    const views =
        Number(
            item.views ??
            item.view_count ??
            0
        );


    if (
        mediaType === "video" ||
        mediaType === "reel"
    ) {

        const video =
            document.createElement(
                "video"
            );


        video.src =
            mediaUrl;


        video.muted =
            true;


        video.playsInline =
            true;


        video.preload =
            "metadata";


        card.appendChild(
            video
        );


    } else if (
        mediaType === "image" ||
        mediaType === "photo"
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            mediaUrl;


        image.alt =
            "Usanex content";


        image.loading =
            "lazy";


        card.appendChild(
            image
        );


    } else {

        const placeholder =
            document.createElement(
                "div"
            );


        placeholder.className =
            "content-text-preview";


        placeholder.textContent =
            safeText(
                item.content,
                "Content"
            );


        card.appendChild(
            placeholder
        );

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "content-card-overlay";


    const viewCount =
        document.createElement(
            "span"
        );


    viewCount.className =
        "content-view-count";


    viewCount.textContent =
        `▶ ${formatViews(views)}`;


    overlay.appendChild(
        viewCount
    );


    card.appendChild(
        overlay
    );


    return card;

}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function setupBottomNavigation() {

    const home =
        $("navHome");


    const reels =
        $("navReels");


    const search =
        $("navSearch");


    const notifications =
        $("navNotifications");


    const profile =
        $("navProfile");


    if (home) {

        home.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/home";

            }
        );

    }


    if (reels) {

        reels.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/reels";

            }
        );

    }


    if (search) {

        search.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/search";

            }
        );

    }


    if (notifications) {

        notifications.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/notifications";

            }
        );

    }


    if (profile) {

        profile.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/my-profile";

            }
        );

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    const confirmed =
        window.confirm(
            "Do you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST",

                credentials: "include",

                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );

    } catch (error) {

        console.error(
            "Logout:",
            error
        );

    } finally {

        window.location.href =
            "/login";

    }

}


/* =========================================================
   PROFILE ERROR
   ========================================================= */

function renderProfileError(message) {

    const container =
        $("profileContentContainer");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "empty-content";


    error.textContent =
        message;


    container.appendChild(
        error
    );

}
