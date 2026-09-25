/* =========================================================
   USANEX — MY PROFILE
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initMyProfile();
});


/* =========================================================
   STATE
   ========================================================= */

const profileState = {
    user: null,
    activeTab: "reels",
    content: {
        reels: [],
        photos: [],
        saved: [],
        private: []
    }
};


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
    if (value === null || value === undefined) {
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
        return `${(views / 1000000).toFixed(1).replace(".0", "")}M`;
    }

    if (views >= 1000) {
        return `${(views / 1000).toFixed(1).replace(".0", "")}K`;
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
   LOAD CURRENT USER
   ========================================================= */

async function loadMyProfile() {
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load profile.");
        }

        const data = await response.json();

        const user = data.user || data;

        if (!user) {
            throw new Error("Profile data not found.");
        }

        profileState.user = user;

        renderProfile(user);

        /*
         * Content APIs are connected separately.
         * For now the page remains ready for the unified
         * Posts / Saved / Private system.
         */
        renderActiveTab();

    } catch (error) {
        console.error("My Profile:", error);

        renderProfileError(
            "Unable to load your profile. Please refresh and try again."
        );
    }
}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(user) {
    const name = safeText(
        user.name || user.full_name,
        "Usanex User"
    );

    const username = safeText(
        user.username,
        ""
    );

    const userId = safeText(
        user.user_id,
        ""
    );

    const photo = getPhotoUrl(
        user.profile_photo || user.photo_url
    );

    const bio = safeText(
        user.bio,
        ""
    );

    const followers = Number(
        user.followers ??
        user.followers_count ??
        0
    );

    const connected = Number(
        user.connected ??
        user.connected_count ??
        0
    );

    const following = Number(
        user.following ??
        user.following_count ??
        0
    );

    const posts = Number(
        user.posts ??
        user.posts_count ??
        0
    );

    if ($("profileName")) {
        $("profileName").textContent = name;
    }

    if ($("profileDisplayName")) {
        $("profileDisplayName").textContent = name;
    }

    if ($("profileUsername")) {
        $("profileUsername").textContent =
            username
                ? `@${username.replace(/^@/, "")}`
                : "@username";
    }

    if ($("profileUserId")) {
        $("profileUserId").textContent = userId || "u_xxxxxxxx";
    }

    if ($("profilePhoto")) {
        $("profilePhoto").src = photo;
    }

    if ($("editProfilePhotoPreview")) {
        $("editProfilePhotoPreview").src = photo;
    }

    if ($("profileBio")) {
        $("profileBio").textContent =
            bio.trim()
                ? bio
                : "No bio available.";
    }

    if ($("followersCount")) {
        $("followersCount").textContent = followers;
    }

    if ($("connectedCount")) {
        $("connectedCount").textContent = connected;
    }

    if ($("followingCount")) {
        $("followingCount").textContent = following;
    }

    if ($("postsCount")) {
        $("postsCount").textContent = posts;
    }

    renderProfileLinks(user);
}


/* =========================================================
   PROFILE LINKS
   ========================================================= */

function renderProfileLinks(user) {
    const container = $("profileLinks");

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

    links.forEach((link) => {
        const anchor = document.createElement("a");

        anchor.className = "profile-link";
        anchor.href = normalizeUrl(link.url);
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";

        anchor.textContent = link.label;

        container.appendChild(anchor);
    });

    show(container);
}

function normalizeUrl(url) {
    const value = safeText(url).trim();

    if (!value) {
        return "#";
    }

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    return `https://${value}`;
}


/* =========================================================
   HEADER
   ========================================================= */

function setupHeader() {
    const addButton = $("profileAddButton");

    if (addButton) {
        addButton.addEventListener("click", () => {
            /*
             * Reserved for future profile quick actions.
             * No profile-photo + action is attached here.
             */
            console.log("Profile quick actions");
        });
    }
}


/* =========================================================
   PROFILE MENU
   ========================================================= */

function setupMenu() {
    const menuButton = $("profileMenuButton");
    const menu = $("profileMenu");

    if (!menuButton || !menu) {
        return;
    }

    menuButton.addEventListener("click", (event) => {
        event.stopPropagation();

        menu.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
        if (
            !menu.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {
            hide(menu);
        }
    });


    const editButton = $("editProfileButton");

    if (editButton) {
        editButton.addEventListener("click", () => {
            hide(menu);
            openEditProfile();
        });
    }


    const privacyButton = $("privacyButton");

    if (privacyButton) {
        privacyButton.addEventListener("click", () => {
            hide(menu);

            /*
             * Privacy page will be connected later.
             */
            alert("Privacy settings will be available here.");
        });
    }


    const securityButton = $("securityButton");

    if (securityButton) {
        securityButton.addEventListener("click", () => {
            hide(menu);

            alert("Security settings will be available here.");
        });
    }


    const blockedUsersButton = $("blockedUsersButton");

    if (blockedUsersButton) {
        blockedUsersButton.addEventListener("click", () => {
            hide(menu);

            alert("Blocked users will be available here.");
        });
    }


    const accountButton = $("accountButton");

    if (accountButton) {
        accountButton.addEventListener("click", () => {
            hide(menu);

            alert("Account settings will be available here.");
        });
    }


    const helpButton = $("helpButton");

    if (helpButton) {
        helpButton.addEventListener("click", () => {
            hide(menu);

            alert("Help will be available here.");
        });
    }


    const aboutButton = $("aboutButton");

    if (aboutButton) {
        aboutButton.addEventListener("click", () => {
            hide(menu);

            alert("Usanex");
        });
    }


    const logoutButton = $("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            hide(menu);
            await logout();
        });
    }
}


/* =========================================================
   PROFILE PHOTO VIEWER
   ========================================================= */

function setupPhotoViewer() {
    const photoButton = $("profilePhotoButton");
    const viewer = $("profilePhotoViewer");
    const viewerPhoto = $("viewerPhoto");
    const closeButton = $("closePhotoViewer");

    if (!photoButton || !viewer || !viewerPhoto) {
        return;
    }

    photoButton.addEventListener("click", () => {
        const photo = $("profilePhoto")?.src;

        if (!photo) {
            return;
        }

        viewerPhoto.src = photo;

        show(viewer);

        document.body.style.overflow = "hidden";
    });


    if (closeButton) {
        closeButton.addEventListener("click", closePhotoViewer);
    }


    viewer.addEventListener("click", (event) => {
        if (event.target === viewer) {
            closePhotoViewer();
        }
    });


    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePhotoViewer();
        }
    });
}

function closePhotoViewer() {
    const viewer = $("profilePhotoViewer");

    if (!viewer) {
        return;
    }

    hide(viewer);

    document.body.style.overflow = "";
}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function setupEditProfile() {
    const closeButton = $("closeEditProfile");

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeEditProfile
        );
    }


    const modal = $("editProfileModal");

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeEditProfile();
            }
        });
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


    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeEditProfile();
        }
    });
}


/* =========================================================
   OPEN EDIT PROFILE
   ========================================================= */

function openEditProfile() {
    const modal = $("editProfileModal");

    if (!modal) {
        return;
    }

    const user = profileState.user || {};

    if ($("editName")) {
        $("editName").value =
            safeText(user.name, "");
    }

    if ($("editUsername")) {
        $("editUsername").value =
            safeText(user.username, "");
    }

    if ($("editUserId")) {
        $("editUserId").value =
            safeText(user.user_id, "");
    }

    if ($("editBio")) {
        $("editBio").value =
            safeText(user.bio, "");
    }

    if ($("editWebsite")) {
        $("editWebsite").value =
            safeText(user.website, "");
    }

    if ($("editInstagram")) {
        $("editInstagram").value =
            safeText(user.instagram, "");
    }

    if ($("editSocialLink")) {
        $("editSocialLink").value =
            safeText(user.social_link, "");
    }

    if ($("editProfilePhotoPreview")) {
        $("editProfilePhotoPreview").src =
            getPhotoUrl(user.profile_photo);
    }

    if ($("editProfileMessage")) {
        $("editProfileMessage").textContent = "";
    }

    show(modal);

    document.body.style.overflow = "hidden";
}


/* =========================================================
   CLOSE EDIT PROFILE
   ========================================================= */

function closeEditProfile() {
    const modal = $("editProfileModal");

    if (!modal) {
        return;
    }

    hide(modal);

    document.body.style.overflow = "";
}


/* =========================================================
   PROFILE PHOTO SELECTION
   ========================================================= */

function handleProfilePhotoSelection(event) {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
        alert("Profile photo must be 10 MB or smaller.");
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

    preview.src = objectUrl;

    preview.onload = () => {
        URL.revokeObjectURL(objectUrl);
    };
}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile() {
    const saveButton =
        $("saveProfileButton");

    const message =
        $("editProfileMessage");

    const name =
        $("editName")?.value.trim() || "";

    const bio =
        $("editBio")?.value.trim() || "";

    const website =
        $("editWebsite")?.value.trim() || "";

    const instagram =
        $("editInstagram")?.value.trim() || "";

    const socialLink =
        $("editSocialLink")?.value.trim() || "";

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

    if (bio.length > 160) {
        setEditMessage(
            "Bio must be 160 characters or less."
        );
        return;
    }

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    if (message) {
        message.textContent = "";
    }

    try {
        /*
         * This endpoint will be implemented in the
         * profile backend in the next step.
         */
        const response = await fetch(
            "/api/profile/me",
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    name,
                    bio,
                    website,
                    instagram,
                    social_link: socialLink
                })
            }
        );

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            const errorData =
                await response.json()
                    .catch(() => null);

            throw new Error(
                errorData?.detail ||
                "Unable to save profile."
            );
        }

        const data =
            await response.json();

        const updatedUser =
            data.user || data;

        if (profileState.user) {
            profileState.user = {
                ...profileState.user,
                ...updatedUser
            };
        }

        renderProfile(profileState.user);

        setEditMessage(
            "Profile saved successfully."
        );

        setTimeout(() => {
            closeEditProfile();
        }, 700);

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
            saveButton.disabled = false;
            saveButton.textContent =
                "Save Changes";
        }
    }
}

function setEditMessage(message) {
    const element =
        $("editProfileMessage");

    if (element) {
        element.textContent = message;
    }
}


/* =========================================================
   CONTENT TABS
   ========================================================= */

function setupTabs() {
    const tabs = document.querySelectorAll(
        ".profile-content-tab"
    );

    tabs.forEach((tab) => {
        tab.addEventListener(
            "click",
            () => {
                const tabName =
                    tab.dataset.tab;

                if (!tabName) {
                    return;
                }

                setActiveTab(tabName);
            }
        );
    });
}

function setActiveTab(tabName) {
    const validTabs = [
        "reels",
        "photos",
        "saved",
        "private"
    ];

    if (!validTabs.includes(tabName)) {
        return;
    }

    profileState.activeTab = tabName;

    document
        .querySelectorAll(".profile-content-tab")
        .forEach((tab) => {
            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabName
            );
        });

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

    container.innerHTML = "";

    if (!items.length) {
        const empty = document.createElement(
            "div"
        );

        empty.className = "empty-content";

        empty.textContent =
            getEmptyMessage(
                profileState.activeTab
            );

        container.appendChild(empty);

        return;
    }

    items.forEach((item) => {
        container.appendChild(
            createContentCard(item)
        );
    });
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
        document.createElement("article");

    card.className = "content-card";

    const mediaType =
        safeText(
            item.media_type ||
            item.type
        ).toLowerCase();

    const mediaUrl =
        safeText(
            item.media_url ||
            item.url ||
            item.file_url
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
            document.createElement("video");

        video.src = mediaUrl;

        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";

        card.appendChild(video);

    } else if (
        mediaUrl
    ) {
        const image =
            document.createElement("img");

        image.src = mediaUrl;

        image.alt =
            safeText(
                item.caption,
                "Usanex content"
            );

        image.loading = "lazy";

        card.appendChild(image);

    } else {
        const placeholder =
            document.createElement("div");

        placeholder.style.width = "100%";
        placeholder.style.height = "100%";
        placeholder.style.display = "flex";
        placeholder.style.alignItems = "center";
        placeholder.style.justifyContent = "center";
        placeholder.style.padding = "15px";
        placeholder.style.color = "#aab7c9";
        placeholder.style.fontSize = "13px";
        placeholder.style.textAlign = "center";

        placeholder.textContent =
            safeText(
                item.caption,
                "Content"
            );

        card.appendChild(placeholder);
    }


    const overlay =
        document.createElement("div");

    overlay.className =
        "content-card-overlay";

    const viewCount =
        document.createElement("span");

    viewCount.className =
        "content-view-count";

    viewCount.textContent =
        `▶ ${formatViews(views)}`;

    overlay.appendChild(viewCount);

    card.appendChild(overlay);

    return card;
}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function setupBottomNavigation() {
    const home = $("navHome");
    const reels = $("navReels");
    const search = $("navSearch");
    const notifications =
        $("navNotifications");
    const profile = $("navProfile");


    if (home) {
        home.addEventListener(
            "click",
            () => {
                window.location.href = "/home";
            }
        );
    }


    if (reels) {
        reels.addEventListener(
            "click",
            () => {
                window.location.href = "/reels";
            }
        );
    }


    if (search) {
        search.addEventListener(
            "click",
            () => {
                window.location.href = "/search";
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
        const response =
            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

        /*
         * Even if the logout endpoint is not
         * available yet, redirecting to login
         * keeps the user flow clear.
         */
        if (!response.ok) {
            console.warn(
                "Logout endpoint returned:",
                response.status
            );
        }

    } catch (error) {
        console.error(
            "Logout:",
            error
        );

    } finally {
        window.location.href = "/login";
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

    container.innerHTML = "";

    const error =
        document.createElement("div");

    error.className =
        "empty-content";

    error.textContent =
        message;

    container.appendChild(error);
}
