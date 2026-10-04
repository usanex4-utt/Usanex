/* =========================================================
   USANEX — MY PROFILE JS
   VERSION 41
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const $ = (id) => document.getElementById(id);


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const profileName =
        $("profileName");

    const profileDisplayName =
        $("profileDisplayName");

    const profileUsername =
        $("profileUsername");

    const profileUserId =
        $("profileUserId");

    const profileBio =
        $("profileBio");

    const profilePhoto =
        $("profilePhoto");


    const followersCount =
        $("followersCount");

    const connectedCount =
        $("connectedCount");

    const followingCount =
        $("followingCount");

    const postsCount =
        $("postsCount");


    const profileLinks =
        $("profileLinks");

    const profileContent =
        $("profileContentContainer");


    const profilePhotoButton =
        $("profilePhotoButton");

    const profilePhotoViewer =
        $("profilePhotoViewer");

    const viewerPhoto =
        $("viewerPhoto");

    const closePhotoViewer =
        $("closePhotoViewer");


    const profileMenuButton =
        $("profileMenuButton");

    const profileMenu =
        $("profileMenu");


    const editProfileButton =
        $("editProfileButton");

    const editProfileModal =
        $("editProfileModal");

    const closeEditProfile =
        $("closeEditProfile");


    const editName =
        $("editName");

    const editUsername =
        $("editUsername");

    const editUserId =
        $("editUserId");

    const editBio =
        $("editBio");

    const editWebsite =
        $("editWebsite");

    const editInstagram =
        $("editInstagram");

    const editSocialLink =
        $("editSocialLink");


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
       SAFE VALUE
       ===================================================== */

    function safe(
        value,
        fallback = ""
    ) {

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

    function formatUsername(
        username
    ) {

        username =
            safe(username);

        if (!username) {
            return "@username";
        }

        if (
            username.startsWith("@")
        ) {
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


        if (profilePhoto) {

            profilePhoto.src =
                photoUrl;


            profilePhoto.onerror =
                () => {

                    profilePhoto.onerror =
                        null;

                    profilePhoto.src =
                        DEFAULT_PHOTO;

                };

        }


        if (
            editProfilePhotoPreview
        ) {

            editProfilePhotoPreview.src =
                photoUrl;


            editProfilePhotoPreview.onerror =
                () => {

                    editProfilePhotoPreview.onerror =
                        null;

                    editProfilePhotoPreview.src =
                        DEFAULT_PHOTO;

                };

        }

    }


    /* =====================================================
       LOAD PROFILE
       ===================================================== */

    async function loadProfile() {

        try {

            const response =
                await fetch(
                    "/api/profile/me?_=" +
                    Date.now(),
                    {
                        method: "GET",

                        credentials:
                            "include",

                        cache:
                            "no-store",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                if (
                    response.status === 401
                ) {

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


            if (
                !data.success ||
                !data.user
            ) {

                throw new Error(
                    "Invalid profile response."
                );

            }


            /* =============================================
               RENDER PROFILE
            ============================================= */

            renderProfile(data);


            /* =============================================
               LOAD REAL REELS
            ============================================= */

            await loadProfileReels(
                data.user.user_id
            );


        } catch (error) {

            console.error(
                "Usanex profile error:",
                error
            );


            if (profileContent) {

                profileContent.innerHTML = `
                    <div class="empty-content">
                        Unable to load profile.
                    </div>
                `;

            }

        }

    }


    /* =====================================================
       RENDER PROFILE
       ===================================================== */

    function renderProfile(data) {

        const user =
            data.user || {};

        const stats =
            data.stats || {};


        const name =
            safe(
                user.name,
                "Usanex User"
            );


        /* =============================================
           HEADER NAME
        ============================================= */

        if (profileName) {

            profileName.textContent =
                name;

        }


        /* =============================================
           DISPLAY NAME
        ============================================= */

        if (profileDisplayName) {

            profileDisplayName.textContent =
                name;

        }


        /* =============================================
           USERNAME
        ============================================= */

        if (profileUsername) {

            profileUsername.textContent =
                formatUsername(
                    user.username
                );

        }


        /* =============================================
           USER ID
        ============================================= */

        if (profileUserId) {

            profileUserId.textContent =
                safe(
                    user.user_id,
                    "u_xxxxxxxx"
                );

        }


        /* =============================================
           BIO
        ============================================= */

        if (profileBio) {

            const bio =
                safe(user.bio);


            profileBio.textContent =
                bio
                    ? bio
                    : "No bio available.";

        }


        /* =============================================
           PHOTO
        ============================================= */

        setPhoto(
            user.profile_photo
        );


        /* =============================================
           STATS
        ============================================= */

        if (followersCount) {

            followersCount.textContent =
                Number(
                    stats.followers || 0
                );

        }


        if (connectedCount) {

            connectedCount.textContent =
                Number(
                    stats.connected || 0
                );

        }


        if (followingCount) {

            followingCount.textContent =
                Number(
                    stats.following || 0
                );

        }


        /*
         * Do NOT use profile API's
         * posts count for reels.
         *
         * Actual Reel count will be
         * updated by loadProfileReels().
         */

        if (postsCount) {

            postsCount.textContent =
                "0";

        }


        /* =============================================
           EDIT FORM
        ============================================= */

        if (editName) {

            editName.value =
                safe(user.name);

        }


        if (editUsername) {

            editUsername.value =
                safe(user.username);

        }


        if (editUserId) {

            editUserId.value =
                safe(user.user_id);

        }


        if (editBio) {

            editBio.value =
                safe(user.bio);

        }


        if (editWebsite) {

            editWebsite.value =
                safe(user.website);

        }


        if (editInstagram) {

            editInstagram.value =
                safe(user.instagram);

        }


        if (editSocialLink) {

            editSocialLink.value =
                safe(user.social_link);

        }


        /* =============================================
           LINKS
        ============================================= */

        renderLinks(user);

    }


    /* =====================================================
       LOAD REAL REELS
       ===================================================== */

    async function loadProfileReels(
        userId
    ) {

        if (!userId) {

            renderProfileReels([]);

            return;

        }


        try {

            console.log(
                "Usanex: Loading reels for:",
                userId
            );


            const response =
                await fetch(
                    "/api/reels/user/" +
                    encodeURIComponent(
                        userId
                    ) +
                    "/list?_=" +
                    Date.now(),
                    {
                        method: "GET",

                        credentials:
                            "include",

                        cache:
                            "no-store",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            console.log(
                "Usanex reels status:",
                response.status
            );


            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "Usanex reels API error:",
                    errorText
                );

                throw new Error(
                    "Reels request failed: " +
                    response.status
                );

            }


            const data =
                await response.json();


            console.log(
                "Usanex reels response:",
                data
            );


            const reels =
                Array.isArray(data.reels)
                    ? data.reels
                    : [];


            /* =============================================
               UPDATE REEL COUNT
            ============================================= */

            if (postsCount) {

                postsCount.textContent =
                    Number(
                        data.count ??
                        reels.length ??
                        0
                    );

            }


            /* =============================================
               RENDER
            ============================================= */

            renderProfileReels(
                reels
            );


        } catch (error) {

            console.error(
                "Usanex profile reels error:",
                error
            );


            renderProfileReels([]);

        }

    }


    /* =====================================================
       RENDER PROFILE REELS
       ===================================================== */

    function renderProfileReels(
        reels
    ) {

        if (
            !Array.isArray(reels) ||
            reels.length === 0
        ) {

            profileContent.innerHTML = `
                <div class="empty-content">
                    No reels yet.
                </div>
            `;

            return;

        }


        const grid =
            document.createElement(
                "div"
            );


        grid.className =
            "profile-post-grid";


        reels.forEach(
            (reel) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "profile-post";


                /* =========================================
                   VIDEO
                ========================================= */

                if (reel.video_url) {

                    const video =
                        document.createElement(
                            "video"
                        );


                    video.src =
                        reel.video_url;


                    video.muted =
                        true;


                    video.playsInline =
                        true;


                    video.preload =
                        "metadata";


                    video.setAttribute(
                        "playsinline",
                        ""
                    );


                    video.setAttribute(
                        "webkit-playsinline",
                        ""
                    );


                    /* =====================================
                       THUMBNAIL
                    ===================================== */

                    if (
                        reel.thumbnail_url
                    ) {

                        video.poster =
                            reel.thumbnail_url;

                    }


                    /* =====================================
                       CLICK REEL
                    ===================================== */

                    item.addEventListener(
                        "click",
                        () => {

                            window.location.href =
                                "/reels";

                        }
                    );


                    item.appendChild(
                        video
                    );

                }


                /* =========================================
                   THUMBNAIL ONLY
                ========================================= */

                else if (
                    reel.thumbnail_url
                ) {

                    const img =
                        document.createElement(
                            "img"
                        );


                    img.src =
                        reel.thumbnail_url;


                    img.loading =
                        "lazy";


                    img.alt =
                        "Usanex Reel";


                    item.appendChild(
                        img
                    );

                }


                /* =========================================
                   FALLBACK
                ========================================= */

                else {

                    item.innerHTML = `
                        <div
                            style="
                                width:100%;
                                height:100%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                color:#8995a8;
                                text-align:center;
                                padding:15px;
                            "
                        >
                            Reel
                        </div>
                    `;

                }


                /* =========================================
                   PLAY ICON
                ========================================= */

                const playIcon =
                    document.createElement(
                        "div"
                    );


                playIcon.className =
                    "profile-reel-play-icon";


                playIcon.innerHTML =
                    "▶";


                item.appendChild(
                    playIcon
                );


                grid.appendChild(
                    item
                );

            }
        );


        profileContent.innerHTML =
            "";


        profileContent.appendChild(
            grid
        );

    }


    /* =====================================================
       LINKS
       ===================================================== */

    function renderLinks(
        user
    ) {

        if (!profileLinks) {
            return;
        }


        profileLinks.innerHTML =
            "";


        const links = [];


        /* =============================================
           WEBSITE
        ============================================= */

        if (user.website) {

            links.push({
                label: "Website",

                url:
                    normalizeUrl(
                        user.website
                    )
            });

        }


        /* =============================================
           INSTAGRAM
        ============================================= */

        if (user.instagram) {

            let instagram =
                String(
                    user.instagram
                ).trim();


            if (
                !instagram.startsWith(
                    "http://"
                ) &&
                !instagram.startsWith(
                    "https://"
                )
            ) {

                instagram =
                    "https://instagram.com/" +
                    instagram.replace(
                        /^@/,
                        ""
                    );

            }


            links.push({
                label: "Instagram",
                url: instagram
            });

        }


        /* =============================================
           SOCIAL LINK
        ============================================= */

        if (user.social_link) {

            links.push({
                label: "Social Link",

                url:
                    normalizeUrl(
                        user.social_link
                    )
            });

        }


        if (!links.length) {

            profileLinks.hidden =
                true;

            return;

        }


        profileLinks.hidden =
            false;


        links.forEach(
            (item) => {

                const a =
                    document.createElement(
                        "a"
                    );


                a.href =
                    item.url;


                a.textContent =
                    item.label;


                a.target =
                    "_blank";


                a.rel =
                    "noopener noreferrer";


                profileLinks.appendChild(
                    a
                );

            }
        );

    }


    /* =====================================================
       NORMALIZE URL
       ===================================================== */

    function normalizeUrl(
        url
    ) {

        url =
            String(url).trim();


        if (
            url.startsWith(
                "http://"
            ) ||
            url.startsWith(
                "https://"
            )
        ) {

            return url;

        }


        return "https://" + url;

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(value)
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* =====================================================
       PROFILE PHOTO VIEWER
       ===================================================== */

    profilePhotoButton?.addEventListener(
        "click",
        () => {

            const src =
                profilePhoto?.src;


            if (!src) {
                return;
            }


            viewerPhoto.src =
                src;


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


            viewerPhoto.src =
                "";

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
       PROFILE MENU
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
                event.target ===
                profileMenu
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


            editProfileMessage.textContent =
                "";


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
                URL.createObjectURL(
                    file
                );


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


            saveProfileButton.disabled =
                true;


            try {

                /* =========================================
                   UPDATE PROFILE
                ========================================= */

                const profileResponse =
                    await fetch(
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


                if (
                    !profileResponse.ok
                ) {

                    throw new Error(
                        profileData.detail ||
                        "Unable to update profile."
                    );

                }


                /* =========================================
                   PHOTO UPLOAD
                ========================================= */

                const file =
                    profilePhotoInput
                        .files?.[0];


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

                                credentials:
                                    "include",

                                body:
                                    formData
                            }
                        );


                    const photoData =
                        await photoResponse.json();


                    if (
                        !photoResponse.ok
                    ) {

                        throw new Error(
                            photoData.detail ||
                            "Profile photo upload failed."
                        );

                    }

                }


                editProfileMessage.textContent =
                    "Profile updated successfully.";


                profilePhotoInput.value =
                    "";


                await loadProfile();


                setTimeout(
                    () => {

                        editProfileModal.classList.add(
                            "hidden"
                        );

                    },
                    600
                );


            } catch (error) {

                console.error(
                    "Usanex save profile error:",
                    error
                );


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
        .forEach(
            (tab) => {

                tab.addEventListener(
                    "click",
                    async () => {

                        document
                            .querySelectorAll(
                                ".profile-content-tab"
                            )
                            .forEach(
                                (item) => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        tab.classList.add(
                            "active"
                        );


                        const type =
                            tab.dataset.tab;


                        /* =================================
                           REELS
                        ================================= */

                        if (
                            type ===
                            "reels"
                        ) {

                            await loadProfileReels(
                                profileUserId.textContent.trim()
                            );


                            return;

                        }


                        /* =================================
                           IMAGES
                        ================================= */

                        if (
                            type ===
                            "images"
                        ) {

                            profileContent.innerHTML = `
                                <div class="empty-content">
                                    No images available yet.
                                </div>
                            `;

                            return;

                        }


                        /* =================================
                           SAVED
                        ================================= */

                        if (
                            type ===
                            "saved"
                        ) {

                            profileContent.innerHTML = `
                                <div class="empty-content">
                                    No saved content yet.
                                </div>
                            `;

                            return;

                        }


                        /* =================================
                           PRIVATE
                        ================================= */

                        if (
                            type ===
                            "private"
                        ) {

                            profileContent.innerHTML = `
                                <div class="empty-content">
                                    No private content yet.
                                </div>
                            `;

                        }

                    }
                );

            }
        );


    /* =====================================================
       BOTTOM NAVIGATION
       ===================================================== */

    $("navHome")?.addEventListener(
        "click",
        () => {

            window.location.href =
                "/home";

        }
    );


    $("navReels")?.addEventListener(
        "click",
        () => {

            window.location.href =
                "/reels";

        }
    );


    $("navSearch")?.addEventListener(
        "click",
        () => {

            window.location.href =
                "/search";

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
       PLUS BUTTON
       ===================================================== */

    $("profileAddButton")?.addEventListener(
        "click",
        () => {

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
    ].forEach(
        (id) => {

            $(id)?.addEventListener(
                "click",
                () => {

                    profileMenu.classList.add(
                        "hidden"
                    );


                    console.log(
                        id +
                        " clicked"
                    );

                }
            );

        }
    );


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

            if (
                event.key !==
                "Escape"
            ) {
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
