/* =========================================================
   USANEX — MY PROFILE JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const profileName = $("profileName");
    const profileDisplayName = $("profileDisplayName");
    const profileUsername = $("profileUsername");
    const profileUserId = $("profileUserId");
    const profileBio = $("profileBio");
    const profilePhoto = $("profilePhoto");

    const followersCount = $("followersCount");
    const connectedCount = $("connectedCount");
    const followingCount = $("followingCount");
    const postsCount = $("postsCount");

    const profileLinks = $("profileLinks");
    const profileContent = $("profileContentContainer");

    const profilePhotoButton = $("profilePhotoButton");
    const profilePhotoViewer = $("profilePhotoViewer");
    const viewerPhoto = $("viewerPhoto");
    const closePhotoViewer = $("closePhotoViewer");

    const profileMenuButton = $("profileMenuButton");
    const profileMenu = $("profileMenu");

    const editProfileButton = $("editProfileButton");
    const editProfileModal = $("editProfileModal");
    const closeEditProfile = $("closeEditProfile");

    const editName = $("editName");
    const editUsername = $("editUsername");
    const editUserId = $("editUserId");
    const editBio = $("editBio");
    const editWebsite = $("editWebsite");
    const editInstagram = $("editInstagram");
    const editSocialLink = $("editSocialLink");

    const editProfilePhotoPreview =
        $("editProfilePhotoPreview");

    const changeProfilePhotoButton =
        $("changeProfilePhotoButton");

    const profilePhotoInput =
        $("profilePhotoInput");

    const saveProfileButton =
        $("saveProfileButton");

    const editProfileMessage =
        $("editProfileMessage");


    /* =====================================================
       DEFAULT PHOTO
       ===================================================== */

    const DEFAULT_PHOTO =
        "/static/images/default-profile.png";


    /* =====================================================
       SAFE TEXT
       ===================================================== */

    function safe(value, fallback = "") {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return fallback;
        }

        return String(value);
    }


    /* =====================================================
       USERNAME
       ===================================================== */

    function formatUsername(username) {

        username = safe(username);

        if (!username) {
            return "@username";
        }

        if (username.startsWith("@")) {
            return username;
        }

        return "@" + username;
    }


    /* =====================================================
       PHOTO
       ===================================================== */

    function setPhoto(url) {

        const photoUrl =
            url || DEFAULT_PHOTO;

        profilePhoto.src = photoUrl;
        editProfilePhotoPreview.src = photoUrl;

        profilePhoto.onerror = () => {
            profilePhoto.onerror = null;
            profilePhoto.src = DEFAULT_PHOTO;
        };

        editProfilePhotoPreview.onerror = () => {
            editProfilePhotoPreview.onerror = null;
            editProfilePhotoPreview.src = DEFAULT_PHOTO;
        };
    }


    /* =====================================================
       LOAD PROFILE
       ===================================================== */

    async function loadProfile() {

        try {

            const response =
                await fetch(
                    "/api/profile/me",
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

            if (!response.ok) {

                if (response.status === 401) {
                    console.error(
                        "Usanex: authentication required."
                    );
                }

                throw new Error(
                    "Profile request failed: " +
                    response.status
                );
            }

            const data =
                await response.json();

            if (!data.success || !data.user) {
                throw new Error(
                    "Invalid profile response."
                );
            }

            renderProfile(data);

        } catch (error) {

            console.error(
                "Usanex profile error:",
                error
            );

        }

    }


    /* =====================================================
       RENDER PROFILE
       ===================================================== */

    function renderProfile(data) {

        const user = data.user || {};
        const stats = data.stats || {};
        const content = data.content || [];

        const name =
            safe(user.name, "Usanex User");

        profileName.textContent = name;
        profileDisplayName.textContent = name;

        profileUsername.textContent =
            formatUsername(user.username);

        profileUserId.textContent =
            safe(user.user_id, "u_xxxxxxxx");

        const bio =
            safe(user.bio);

        if (bio) {
            profileBio.textContent = bio;
        } else {
            profileBio.textContent =
                "No bio available.";
        }

        setPhoto(user.profile_photo);

        followersCount.textContent =
            Number(stats.followers || 0);

        connectedCount.textContent =
            Number(stats.connected || 0);

        followingCount.textContent =
            Number(stats.following || 0);

        postsCount.textContent =
            Number(stats.posts || content.length || 0);


        /* =================================================
           EDIT FORM
           ================================================= */

        editName.value =
            safe(user.name);

        editUsername.value =
            safe(user.username);

        editUserId.value =
            safe(user.user_id);

        editBio.value =
            safe(user.bio);

        editWebsite.value =
            safe(user.website);

        editInstagram.value =
            safe(user.instagram);

        editSocialLink.value =
            safe(user.social_link);


        /* =================================================
           LINKS
           ================================================= */

        renderLinks(user);


        /* =================================================
           CONTENT
           ================================================= */

        renderContent(content);

    }


    /* =====================================================
       LINKS
       ===================================================== */

    function renderLinks(user) {

        profileLinks.innerHTML = "";

        const links = [];

        if (user.website) {

            links.push({
                label: "Website",
                url: normalizeUrl(
                    user.website
                )
            });

        }

        if (user.instagram) {

            let instagram =
                String(user.instagram).trim();

            if (
                !instagram.startsWith("http://") &&
                !instagram.startsWith("https://")
            ) {

                instagram =
                    "https://instagram.com/" +
                    instagram.replace(/^@/, "");

            }

            links.push({
                label: "Instagram",
                url: instagram
            });

        }

        if (user.social_link) {

            links.push({
                label: "Social Link",
                url: normalizeUrl(
                    user.social_link
                )
            });

        }

        if (!links.length) {

            profileLinks.hidden = true;
            return;
        }

        profileLinks.hidden = false;

        links.forEach((item) => {

            const a =
                document.createElement("a");

            a.href = item.url;
            a.textContent = item.label;
            a.target = "_blank";
            a.rel = "noopener noreferrer";

            profileLinks.appendChild(a);

        });

    }


    /* =====================================================
       URL
       ===================================================== */

    function normalizeUrl(url) {

        url = String(url).trim();

        if (
            url.startsWith("http://") ||
            url.startsWith("https://")
        ) {
            return url;
        }

        return "https://" + url;
    }


    /* =====================================================
       CONTENT
       ===================================================== */

    function renderContent(posts) {

        if (!posts || posts.length === 0) {

            profileContent.innerHTML = `
                <div class="empty-content">
                    No reels yet.
                </div>
            `;

            return;
        }

        const grid =
            document.createElement("div");

        grid.className =
            "profile-post-grid";

        posts.forEach((post) => {

            const item =
                document.createElement("div");

            item.className =
                "profile-post";

            if (post.media_url) {

                if (
                    post.media_type === "video" ||
                    post.media_type === "reel"
                ) {

                    const video =
                        document.createElement("video");

                    video.src =
                        post.media_url;

                    video.muted = true;
                    video.playsInline = true;
                    video.preload = "metadata";

                    item.appendChild(video);

                } else {

                    const img =
                        document.createElement("img");

                    img.src =
                        post.media_url;

                    img.loading = "lazy";

                    item.appendChild(img);
                }

            } else {

                item.innerHTML = `
                    <div style="
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        padding:15px;
                        color:#8995a8;
                        text-align:center;
                    ">
                        ${escapeHtml(
                            safe(post.content, "")
                        )}
                    </div>
                `;

            }

            grid.appendChild(item);

        });

        profileContent.innerHTML = "";
        profileContent.appendChild(grid);

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =====================================================
       PROFILE PHOTO VIEWER
       ===================================================== */

    profilePhotoButton?.addEventListener(
        "click",
        () => {

            const src =
                profilePhoto.src;

            if (!src) {
                return;
            }

            viewerPhoto.src = src;

            profilePhotoViewer.classList.remove(
                "hidden"
            );

        }
    );


    closePhotoViewer?.addEventListener(
        "click",
        () => {

            profilePhotoViewer.classList.add(
                "hidden"
            );

            viewerPhoto.src = "";

        }
    );


    profilePhotoViewer?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                profilePhotoViewer
            ) {

                profilePhotoViewer.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =====================================================
       MENU
       ===================================================== */

    profileMenuButton?.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            profileMenu.classList.toggle(
                "hidden"
            );

        }
    );


    profileMenu?.addEventListener(
        "click",
        (event) => {

            if (
                event.target === profileMenu
            ) {

                profileMenu.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =====================================================
       EDIT PROFILE
       ===================================================== */

    editProfileButton?.addEventListener(
        "click",
        () => {

            profileMenu.classList.add(
                "hidden"
            );

            editProfileMessage.textContent = "";

            editProfileModal.classList.remove(
                "hidden"
            );

        }
    );


    closeEditProfile?.addEventListener(
        "click",
        () => {

            editProfileModal.classList.add(
                "hidden"
            );

        }
    );


    editProfileModal?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                editProfileModal
            ) {

                editProfileModal.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =====================================================
       CHANGE PHOTO
       ===================================================== */

    changeProfilePhotoButton?.addEventListener(
        "click",
        () => {

            profilePhotoInput?.click();

        }
    );


    profilePhotoInput?.addEventListener(
        "change",
        () => {

            const file =
                profilePhotoInput.files?.[0];

            if (!file) {
                return;
            }

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                editProfileMessage.textContent =
                    "Please select an image.";

                return;
            }

            const previewUrl =
                URL.createObjectURL(file);

            editProfilePhotoPreview.src =
                previewUrl;

            editProfileMessage.textContent =
                "Photo selected. Tap Save Changes.";

        }
    );


    /* =====================================================
       SAVE PROFILE
       ===================================================== */

    saveProfileButton?.addEventListener(
        "click",
        async () => {

            editProfileMessage.textContent =
                "Saving...";

            saveProfileButton.disabled = true;

            try {

                /* =========================================
                   UPDATE TEXT PROFILE
                   ========================================= */

                const profileResponse =
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
                            body: JSON.stringify({
                                name:
                                    editName.value.trim(),

                                bio:
                                    editBio.value.trim() ||
                                    null,

                                website:
                                    editWebsite.value.trim() ||
                                    null,

                                instagram:
                                    editInstagram.value.trim() ||
                                    null,

                                social_link:
                                    editSocialLink.value.trim() ||
                                    null
                            })
                        }
                    );

                const profileData =
                    await profileResponse.json();

                if (!profileResponse.ok) {

                    throw new Error(
                        profileData.detail ||
                        "Unable to update profile."
                    );
                }


                /* =========================================
                   UPLOAD PHOTO IF SELECTED
                   ========================================= */

                const file =
                    profilePhotoInput.files?.[0];

                if (file) {

                    const formData =
                        new FormData();

                    formData.append(
                        "photo",
                        file
                    );

                    const photoResponse =
                        await fetch(
                            "/api/profile/me/photo",
                            {
                                method: "POST",
                                credentials: "include",
                                body: formData
                            }
                        );

                    const photoData =
                        await photoResponse.json();

                    if (!photoResponse.ok) {

                        throw new Error(
                            photoData.detail ||
                            "Profile photo upload failed."
                        );
                    }

                }


                editProfileMessage.textContent =
                    "Profile updated successfully.";

                profilePhotoInput.value = "";


                await loadProfile();


                setTimeout(() => {

                    editProfileModal.classList.add(
                        "hidden"
                    );

                }, 600);


            } catch (error) {

                console.error(error);

                editProfileMessage.textContent =
                    error.message ||
                    "Something went wrong.";

            } finally {

                saveProfileButton.disabled =
                    false;

            }

        }
    );


    /* =====================================================
       CONTENT TABS
       ===================================================== */

    document
        .querySelectorAll(
            ".profile-content-tab"
        )
        .forEach((tab) => {

            tab.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".profile-content-tab"
                        )
                        .forEach((item) => {
                            item.classList.remove(
                                "active"
                            );
                        });

                    tab.classList.add(
                        "active"
                    );

                    const type =
                        tab.dataset.tab;

                    if (type === "reels") {

                        loadProfile();

                    } else {

                        profileContent.innerHTML = `
                            <div class="empty-content">
                                No ${escapeHtml(type)}
                                available yet.
                            </div>
                        `;

                    }

                }
            );

        });


    /* =====================================================
       BOTTOM NAVIGATION
       ===================================================== */

    $("navHome")?.addEventListener(
        "click",
        () => {
            window.location.href = "/home";
        }
    );

    $("navReels")?.addEventListener(
        "click",
        () => {
            window.location.href = "/reels";
        }
    );

    $("navSearch")?.addEventListener(
        "click",
        () => {
            window.location.href = "/search";
        }
    );

    $("navNotifications")?.addEventListener(
        "click",
        () => {
            window.location.href =
                "/notifications";
        }
    );


    /* =====================================================
       PLUS
       ===================================================== */

    $("profileAddButton")?.addEventListener(
        "click",
        () => {

            /*
             * Create menu / post / reel
             * can be connected here.
             */

            console.log(
                "Usanex create button clicked"
            );

        }
    );


    /* =====================================================
       OTHER MENU ITEMS
       ===================================================== */

    [
        "privacyButton",
        "securityButton",
        "blockedUsersButton",
        "accountButton",
        "helpButton",
        "aboutButton"
    ].forEach((id) => {

        $(id)?.addEventListener(
            "click",
            () => {

                profileMenu.classList.add(
                    "hidden"
                );

                console.log(
                    id + " clicked"
                );

            }
        );

    });


    /* =====================================================
       LOGOUT
       ===================================================== */

    $("logoutButton")?.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

            localStorage.clear();

            window.location.href =
                "/login";

        }
    );


    /* =====================================================
       ESC KEY
       ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key !== "Escape") {
                return;
            }

            profileMenu?.classList.add(
                "hidden"
            );

            editProfileModal?.classList.add(
                "hidden"
            );

            profilePhotoViewer?.classList.add(
                "hidden"
            );

        }
    );


    /* =====================================================
       START
       ===================================================== */

    loadProfile();

});
