/* =========================================================
   USANEX — MY PROFILE
   PROFILE + REELS VIEWER
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
        images: [],
        saved: [],
        private: []
    },

    loading: false,
    saving: false

};


const CACHE_KEY = "usanex_my_profile_cache";


/* =========================================================
   REEL VIEWER STATE
========================================================= */

const reelViewerState = {

    open: false,

    index: 0,

    items: [],

    touchStartY: 0,

    touchStartX: 0

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


async function initMyProfile() {

    setupHeader();

    setupMenu();

    setupPhotoViewer();

    setupEditProfile();

    setupTabs();

    setupBottomNavigation();

    setupReelViewer();

    loadCachedProfile();

    await loadMyProfile();

}


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


function safeText(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {

        return fallback;

    }

    return String(value);

}


function getPhotoUrl(photo) {

    if (!photo) {

        return "/static/images/default-profile.png";

    }

    return String(photo);

}


function formatViews(value) {

    const views =
        Number(value || 0);


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
   MEDIA TYPE
========================================================= */

function isVideoPost(post) {

    const type =
        safeText(
            post?.media_type
        ).toLowerCase();


    return (
        type === "video" ||
        type === "reel" ||
        type === "mp4" ||
        type === "mov" ||
        type === "webm"
    );

}


function isImagePost(post) {

    const type =
        safeText(
            post?.media_type
        ).toLowerCase();


    return (
        type === "image" ||
        type === "photo"
    );

}


/* =========================================================
   CACHE
========================================================= */

function saveProfileCache() {

    try {

        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({

                user:
                    profileState.user,

                stats:
                    profileState.stats,

                content:
                    profileState.content

            })
        );

    } catch (error) {

        console.warn(
            "Profile cache save:",
            error
        );

    }

}


function loadCachedProfile() {

    try {

        const raw =
            localStorage.getItem(
                CACHE_KEY
            );


        if (!raw) {

            return;

        }


        const cached =
            JSON.parse(raw);


        if (!cached) {

            return;

        }


        if (cached.user) {

            profileState.user =
                cached.user;


            profileState.stats =
                cached.stats ||
                profileState.stats;


            profileState.content =
                cached.content ||
                profileState.content;


            renderProfile(
                profileState.user
            );


            renderActiveTab();

        }

    } catch (error) {

        console.warn(
            "Profile cache load:",
            error
        );

    }

}


/* =========================================================
   LOAD MY PROFILE
========================================================= */

async function loadMyProfile() {

    if (profileState.loading) {

        return;

    }


    profileState.loading = true;


    try {

        const response =
            await fetch(
                "/api/profile/me",
                {

                    method: "GET",

                    credentials:
                        "include",

                    cache: "no-store",

                    headers: {

                        "Accept":
                            "application/json"

                    }

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
                    .catch(
                        () => null
                    );


            throw new Error(
                errorData?.detail ||
                "Unable to load profile."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                "Invalid profile response."
            );

        }


        profileState.user =
            data.user || {};


        profileState.stats = {

            followers:
                Number(
                    data.stats?.followers ||
                    0
                ),

            connected:
                Number(
                    data.stats?.connected ||
                    0
                ),

            following:
                Number(
                    data.stats?.following ||
                    0
                ),

            posts:
                Number(
                    data.stats?.posts ||
                    0
                )

        };


        processUnifiedContent(
            Array.isArray(data.content)
                ? data.content
                : []
        );


        renderProfile(
            profileState.user
        );


        renderActiveTab();


        saveProfileCache();


    } catch (error) {

        console.error(
            "My Profile:",
            error
        );


        if (!profileState.user) {

            renderProfileError(
                error.message ||
                "Unable to load your profile."
            );

        }

    } finally {

        profileState.loading =
            false;

    }

}


/* =========================================================
   PROCESS CONTENT
========================================================= */

function processUnifiedContent(
    posts
) {

    const reels = [];

    const images = [];


    for (
        const post of posts
    ) {

        if (!post) {

            continue;

        }


        if (
            isVideoPost(post)
        ) {

            reels.push(post);

            continue;

        }


        if (
            isImagePost(post)
        ) {

            images.push(post);

        }

    }


    profileState.content.reels =
        reels;


    profileState.content.images =
        images;


    profileState.content.saved =
        [];


    profileState.content.private =
        [];

}


/* =========================================================
   RENDER PROFILE
========================================================= */

function renderProfile(user) {

    if (!user) {

        return;

    }


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


    const profileName =
        $("profileName");


    if (profileName) {

        profileName.textContent =
            name;

    }


    const displayName =
        $("profileDisplayName");


    if (displayName) {

        displayName.textContent =
            name;

    }


    const usernameElement =
        $("profileUsername");


    if (usernameElement) {

        usernameElement.textContent =
            username
                ? `@${username.replace(
                    /^@/,
                    ""
                )}`
                : "@username";

    }


    const userIdElement =
        $("profileUserId");


    if (userIdElement) {

        userIdElement.textContent =
            userId ||
            "u_xxxxxxxx";

    }


    const profilePhoto =
        $("profilePhoto");


    if (profilePhoto) {

        profilePhoto.src =
            photo;


        profilePhoto.onerror =
            () => {

                profilePhoto.onerror =
                    null;

                profilePhoto.src =
                    "/static/images/default-profile.png";

            };

    }


    const editPreview =
        $("editProfilePhotoPreview");


    if (editPreview) {

        editPreview.src =
            photo;


        editPreview.onerror =
            () => {

                editPreview.onerror =
                    null;

                editPreview.src =
                    "/static/images/default-profile.png";

            };

    }


    const bioElement =
        $("profileBio");


    if (bioElement) {

        bioElement.textContent =
            bio.trim()
                ? bio
                : "No bio available.";

    }


    updateStats();

    renderProfileLinks(user);

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const values = {

        followersCount:
            profileState.stats.followers,

        connectedCount:
            profileState.stats.connected,

        followingCount:
            profileState.stats.following,

        postsCount:
            profileState.stats.posts

    };


    for (
        const [id, value]
        of Object.entries(values)
    ) {

        const element =
            $(id);


        if (element) {

            element.textContent =
                Number(value || 0);

        }

    }

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

        container.hidden = true;

        return;

    }


    for (
        const link of links
    ) {

        const anchor =
            document.createElement(
                "a"
            );


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


    container.hidden = false;

}


function normalizeUrl(url) {

    const value =
        safeText(url)
            .trim();


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

            console.log(
                "Usanex Create"
            );

        }
    );

}


/* =========================================================
   MENU
========================================================= */

function setupMenu() {

    const menuButton =
        $("profileMenuButton");


    const menu =
        $("profileMenu");


    if (
        !menuButton ||
        !menu
    ) {

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


    menu.addEventListener(
        "click",
        (event) => {

            if (
                event.target === menu
            ) {

                hide(menu);

            }

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


    const simpleButtons = {

        privacyButton:
            "Privacy settings will be available here.",

        securityButton:
            "Security settings will be available here.",

        blockedUsersButton:
            "Blocked users will be available here.",

        accountButton:
            "Account settings will be available here.",

        helpButton:
            "Help will be available here.",

        aboutButton:
            "Usanex"

    };


    for (
        const [id, message]
        of Object.entries(
            simpleButtons
        )
    ) {

        const button =
            $(id);


        if (!button) {

            continue;

        }


        button.addEventListener(
            "click",
            () => {

                hide(menu);

                alert(message);

            }
        );

    }


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
   PHOTO VIEWER
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

            const profilePhoto =
                $("profilePhoto");


            if (
                !profilePhoto?.src
            ) {

                return;

            }


            viewerPhoto.src =
                profilePhoto.src;


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
                event.key === "Escape" &&
                modal &&
                !modal.classList.contains(
                    "hidden"
                )
            ) {

                closeEditProfile();

            }

        }
    );

}


/* =========================================================
   OPEN EDIT
========================================================= */

function openEditProfile() {

    const modal =
        $("editProfileModal");


    if (!modal) {

        return;

    }


    const user =
        profileState.user || {};


    const fields = {

        editName:
            safeText(user.name),

        editUsername:
            safeText(user.username),

        editUserId:
            safeText(user.user_id),

        editBio:
            safeText(user.bio),

        editWebsite:
            safeText(user.website),

        editInstagram:
            safeText(user.instagram),

        editSocialLink:
            safeText(user.social_link)

    };


    for (
        const [id, value]
        of Object.entries(fields)
    ) {

        const element =
            $(id);


        if (element) {

            element.value =
                value;

        }

    }


    const preview =
        $("editProfilePhotoPreview");


    if (preview) {

        preview.src =
            getPhotoUrl(
                user.profile_photo
            );

    }


    const input =
        $("profilePhotoInput");


    if (input) {

        input.value = "";

    }


    setEditMessage("");

    show(modal);


    document.body.style.overflow =
        "hidden";


    requestAnimationFrame(
        () => {

            $("editName")?.focus();

        }
    );

}


/* =========================================================
   CLOSE EDIT
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

function handleProfilePhotoSelection(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        setEditMessage(
            "Please select an image file."
        );


        event.target.value = "";

        return;

    }


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        setEditMessage(
            "Profile photo must be 10 MB or smaller."
        );


        event.target.value = "";

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


    preview.onload =
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveProfile() {

    if (profileState.saving) {

        return;

    }


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


    const photoInput =
        $("profilePhotoInput");


    const selectedPhoto =
        photoInput?.files?.[0] ||
        null;


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


    profileState.saving = true;


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";

    }


    setEditMessage("");


    try {

        const textRequest =
            fetch(
                "/api/profile/me",
                {

                    method: "PUT",

                    credentials:
                        "include",

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


        let photoRequest =
            null;


        if (selectedPhoto) {

            const formData =
                new FormData();


            formData.append(
                "photo",
                selectedPhoto
            );


            photoRequest =
                fetch(
                    "/api/profile/me/photo",
                    {

                        method: "POST",

                        credentials:
                            "include",

                        body:
                            formData

                    }
                );

        }


        const [
            profileResponse,
            photoResponse
        ] = await Promise.all([

            textRequest,

            photoRequest

        ]);


        if (
            profileResponse.status ===
                401 ||
            photoResponse?.status ===
                401
        ) {

            window.location.href =
                "/login";

            return;

        }


        if (!profileResponse.ok) {

            const errorData =
                await profileResponse
                    .json()
                    .catch(
                        () => null
                    );


            throw new Error(
                errorData?.detail ||
                "Unable to save profile."
            );

        }


        const profileData =
            await profileResponse.json();


        if (
            profileData?.user
        ) {

            profileState.user = {

                ...profileState.user,

                ...profileData.user

            };

        }


        if (photoResponse) {

            if (!photoResponse.ok) {

                const errorData =
                    await photoResponse
                        .json()
                        .catch(
                            () => null
                        );


                throw new Error(
                    errorData?.detail ||
                    "Unable to save profile photo."
                );

            }


            const photoData =
                await photoResponse.json();


            if (
                photoData?.success
            ) {

                profileState.user = {

                    ...profileState.user,

                    ...(photoData.user || {}),

                    profile_photo:
                        photoData.profile_photo ||
                        photoData.user?.profile_photo ||
                        profileState.user.profile_photo

                };

            }

        }


        renderProfile(
            profileState.user
        );


        saveProfileCache();


        if (photoInput) {

            photoInput.value = "";

        }


        setEditMessage(
            "Profile saved successfully."
        );


        setTimeout(
            closeEditProfile,
            650
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

        profileState.saving =
            false;


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
   TABS
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


function setActiveTab(
    tabName
) {

    const validTabs = [

        "reels",

        "images",

        "saved",

        "private"

    ];


    if (
        !validTabs.includes(
            tabName
        )
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
   CONTENT
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


    const fragment =
        document.createDocumentFragment();


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


        fragment.appendChild(
            empty
        );

    } else {

        for (
            let index = 0;
            index < items.length;
            index++
        ) {

            fragment.appendChild(
                createContentCard(
                    items[index],
                    index
                )
            );

        }

    }


    container.replaceChildren(
        fragment
    );

}


/* =========================================================
   EMPTY
========================================================= */

function getEmptyMessage(tab) {

    switch (tab) {

        case "reels":

            return "No reels yet.";

        case "images":

            return "No images yet.";

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

function createContentCard(
    item,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "content-card";


    card.dataset.index =
        String(index);


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


    /* =====================================================
       VIDEO / REEL
    ===================================================== */

    if (
        isVideoPost(item)
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


        video.loop =
            true;


        video.setAttribute(
            "aria-label",
            "Usanex reel"
        );


        /*
         * Mobile browser autoplay preview.
         */
        video.addEventListener(
            "loadeddata",
            () => {

                video.play()
                    .catch(
                        () => {}
                    );

            },
            {
                once: true
            }
        );


        /*
         * Reel click.
         */
        card.addEventListener(
            "click",
            () => {

                openReelViewer(
                    index
                );

            }
        );


        card.classList.add(
            "reel-card"
        );


        card.appendChild(
            video
        );


    }

    /* =====================================================
       IMAGE
    ===================================================== */

    else if (
        isImagePost(item)
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            mediaUrl;


        image.alt =
            "Usanex post";


        image.loading =
            "lazy";


        image.decoding =
            "async";


        card.appendChild(
            image
        );

    }

    /* =====================================================
       TEXT
    ===================================================== */

    else {

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


    /* =====================================================
       VIEW COUNT
    ===================================================== */

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
   REEL VIEWER
========================================================= */

function setupReelViewer() {

    createReelViewer();

}


/* =========================================================
   CREATE REEL VIEWER
========================================================= */

function createReelViewer() {

    if (
        $("usanexReelViewer")
    ) {

        return;

    }


    const viewer =
        document.createElement(
            "div"
        );


    viewer.id =
        "usanexReelViewer";


    viewer.className =
        "usanex-reel-viewer hidden";


    viewer.innerHTML = `

        <button
            type="button"
            class="usanex-reel-close"
            id="usanexReelClose"
            aria-label="Close reel"
        >
            ×
        </button>


        <button
            type="button"
            class="usanex-reel-prev"
            id="usanexReelPrev"
            aria-label="Previous reel"
        >
            ‹
        </button>


        <div
            class="usanex-reel-stage"
            id="usanexReelStage"
        >

            <video
                id="usanexReelVideo"
                playsinline
                controls
                preload="metadata"
            ></video>


            <div
                class="usanex-reel-info"
                id="usanexReelInfo"
            ></div>

        </div>


        <button
            type="button"
            class="usanex-reel-next"
            id="usanexReelNext"
            aria-label="Next reel"
        >
            ›
        </button>

    `;


    document.body.appendChild(
        viewer
    );


    const close =
        $("usanexReelClose");


    const previous =
        $("usanexReelPrev");


    const next =
        $("usanexReelNext");


    const stage =
        $("usanexReelStage");


    close.addEventListener(
        "click",
        closeReelViewer
    );


    previous.addEventListener(
        "click",
        () => {

            showReelAt(
                reelViewerState.index - 1
            );

        }
    );


    next.addEventListener(
        "click",
        () => {

            showReelAt(
                reelViewerState.index + 1
            );

        }
    );


    viewer.addEventListener(
        "click",
        (event) => {

            if (
                event.target === viewer
            ) {

                closeReelViewer();

            }

        }
    );


    document.addEventListener(
        "keydown",
        handleReelKeyboard
    );


    stage.addEventListener(
        "touchstart",
        handleReelTouchStart,
        {
            passive: true
        }
    );


    stage.addEventListener(
        "touchend",
        handleReelTouchEnd,
        {
            passive: true
        }
    );

}


/* =========================================================
   OPEN REEL
========================================================= */

function openReelViewer(
    index
) {

    const reels =
        profileState.content.reels;


    if (!reels.length) {

        return;

    }


    reelViewerState.items =
        reels;


    reelViewerState.index =
        Math.max(
            0,
            Math.min(
                index,
                reels.length - 1
            )
        );


    const viewer =
        $("usanexReelViewer");


    if (!viewer) {

        return;

    }


    viewer.classList.remove(
        "hidden"
    );


    viewer.classList.add(
        "open"
    );


    reelViewerState.open =
        true;


    document.body.style.overflow =
        "hidden";


    showReelAt(
        reelViewerState.index
    );

}


/* =========================================================
   SHOW REEL
========================================================= */

function showReelAt(
    index
) {

    const items =
        reelViewerState.items;


    if (!items.length) {

        return;

    }


    /*
     * Loop around.
     */

    if (index < 0) {

        index =
            items.length - 1;

    }


    if (
        index >= items.length
    ) {

        index = 0;

    }


    reelViewerState.index =
        index;


    const item =
        items[index];


    const video =
        $("usanexReelVideo");


    const info =
        $("usanexReelInfo");


    const previous =
        $("usanexReelPrev");


    const next =
        $("usanexReelNext");


    if (!video) {

        return;

    }


    video.pause();


    video.removeAttribute(
        "src"
    );


    video.load();


    video.src =
        safeText(
            item.media_url
        );


    video.currentTime = 0;


    video.load();


    if (info) {

        const views =
            Number(
                item.views ??
                item.view_count ??
                0
            );


        info.textContent =
            `${index + 1} / ${items.length}   •   ▶ ${formatViews(views)}`;

    }


    /*
     * Buttons hide when only one reel.
     */

    if (previous) {

        previous.hidden =
            items.length <= 1;

    }


    if (next) {

        next.hidden =
            items.length <= 1;

    }


    video.onloadeddata =
        () => {

            video.play()
                .catch(
                    () => {}
                );

        };

}


/* =========================================================
   CLOSE REEL VIEWER
========================================================= */

function closeReelViewer() {

    const viewer =
        $("usanexReelViewer");


    const video =
        $("usanexReelVideo");


    if (video) {

        video.pause();

        video.removeAttribute(
            "src"
        );

        video.load();

    }


    if (viewer) {

        viewer.classList.add(
            "hidden"
        );

        viewer.classList.remove(
            "open"
        );

    }


    reelViewerState.open =
        false;


    document.body.style.overflow =
        "";

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleReelKeyboard(
    event
) {

    if (
        !reelViewerState.open
    ) {

        return;

    }


    if (
        event.key === "Escape"
    ) {

        closeReelViewer();

        return;

    }


    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft"
    ) {

        showReelAt(
            reelViewerState.index - 1
        );

        return;

    }


    if (
        event.key === "ArrowDown" ||
        event.key === "ArrowRight"
    ) {

        showReelAt(
            reelViewerState.index + 1
        );

        return;

    }

}


/* =========================================================
   TOUCH
========================================================= */

function handleReelTouchStart(
    event
) {

    const touch =
        event.changedTouches?.[0];


    if (!touch) {

        return;

    }


    reelViewerState.touchStartY =
        touch.clientY;


    reelViewerState.touchStartX =
        touch.clientX;

}


function handleReelTouchEnd(
    event
) {

    const touch =
        event.changedTouches?.[0];


    if (!touch) {

        return;

    }


    const deltaY =
        touch.clientY -
        reelViewerState.touchStartY;


    const deltaX =
        touch.clientX -
        reelViewerState.touchStartX;


    /*
     * Ignore small movement.
     */

    if (
        Math.abs(deltaY) < 60 &&
        Math.abs(deltaX) < 60
    ) {

        return;

    }


    /*
     * Vertical swipe.
     */

    if (
        Math.abs(deltaY) >
        Math.abs(deltaX)
    ) {

        if (deltaY < 0) {

            showReelAt(
                reelViewerState.index + 1
            );

        } else {

            showReelAt(
                reelViewerState.index - 1
            );

        }

        return;

    }


    /*
     * Horizontal swipe.
     */

    if (deltaX < 0) {

        showReelAt(
            reelViewerState.index + 1
        );

    } else {

        showReelAt(
            reelViewerState.index - 1
        );

    }

}


/* =========================================================
   BOTTOM NAVIGATION
========================================================= */

function setupBottomNavigation() {

    const routes = {

        navHome:
            "/home",

        navReels:
            "/reels",

        navSearch:
            "/search",

        navNotifications:
            "/notifications",

        navProfile:
            "/my-profile"

    };


    for (
        const [id, url]
        of Object.entries(routes)
    ) {

        const element =
            $(id);


        if (!element) {

            continue;

        }


        element.addEventListener(
            "click",
            () => {

                if (
                    window.location.pathname ===
                    url
                ) {

                    return;

                }


                window.location.href =
                    url;

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

                credentials:
                    "include",

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

        try {

            localStorage.removeItem(
                CACHE_KEY
            );

        } catch (_) {}


        window.location.href =
            "/login";

    }

}


/* =========================================================
   ERROR
========================================================= */

function renderProfileError(
    message
) {

    const container =
        $("profileContentContainer");


    if (!container) {

        return;

    }


    container.innerHTML = "";


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
