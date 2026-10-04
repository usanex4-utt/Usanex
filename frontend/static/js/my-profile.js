/* =========================================================
   USANEX — MY PROFILE JS
   v50
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
    const shareProfileButton = $("shareProfileButton");

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
       HELPERS
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


    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


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


    function normalizeUrl(url) {

        url = String(url || "").trim();

        if (!url) {
            return "";
        }

        if (
            url.startsWith("http://") ||
            url.startsWith("https://")
        ) {
            return url;
        }

        return "https://" + url;
    }


    /* =====================================================
       PHOTO
    ===================================================== */

    function setPhoto(url) {

        const photoUrl =
            url || DEFAULT_PHOTO;

        profilePhoto.src =
            photoUrl;

        editProfilePhotoPreview.src =
            photoUrl;

        profilePhoto.onerror = () => {

            profilePhoto.onerror = null;

            profilePhoto.src =
                DEFAULT_PHOTO;
        };

        editProfilePhotoPreview.onerror = () => {

            editProfilePhotoPreview.onerror = null;

            editProfilePhotoPreview.src =
                DEFAULT_PHOTO;
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
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {
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

        const user =
            data.user || {};

        const stats =
            data.stats || {};

        const name =
            safe(
                user.name,
                "Usanex User"
            );


        profileName.textContent =
            stylizedName(name);

        profileDisplayName.textContent =
            name;

        profileUsername.textContent =
            formatUsername(
                user.username
            );

        profileUserId.textContent =
            safe(
                user.user_id,
                "u_xxxxxxxx"
            );


        const bio =
            safe(user.bio);

        profileBio.textContent =
            bio ||
            "No bio available.";


        setPhoto(
            user.profile_photo
        );


        followersCount.textContent =
            Number(
                stats.followers || 0
            );

        connectedCount.textContent =
            Number(
                stats.connected || 0
            );

        followingCount.textContent =
            Number(
                stats.following || 0
            );


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


        renderLinks(user);

        /*
         * Important:
         * Reels are loaded separately from
         * /api/reels/me/list
         */
        loadMyReels();

    }


    /* =====================================================
       STYLIZED HEADER NAME
    ===================================================== */

    function stylizedName(name) {

        /*
         * Non-italic / non-slanted style.
         * Selected fourth style.
         */

        const map = {
            A: "𝙰",
            B: "𝙱",
            C: "𝙲",
            D: "𝙳",
            E: "𝙴",
            F: "𝙵",
            G: "𝙶",
            H: "𝙷",
            I: "𝙸",
            J: "𝙹",
            K: "𝙺",
            L: "𝙻",
            M: "𝙼",
            N: "𝙽",
            O: "𝙾",
            P: "𝙿",
            Q: "𝚀",
            R: "𝚁",
            S: "𝚂",
            T: "𝚃",
            U: "𝚄",
            V: "𝚅",
            W: "𝚆",
            X: "𝚇",
            Y: "𝚈",
            Z: "𝚉"
        };

        return String(name)
            .split("")
            .map(char => {

                const upper =
                    char.toUpperCase();

                return map[upper] ||
                    char;

            })
            .join("");
    }


    /* =====================================================
       LINKS
    ===================================================== */

    function renderLinks(user) {

        profileLinks.innerHTML =
            "";

        const links = [];


        if (user.website) {

            links.push({
                label: "Website",
                url:
                    normalizeUrl(
                        user.website
                    )
            });

        }


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


        links.forEach(item => {

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

            profileLinks.appendChild(a);

        });

    }


    /* =====================================================
       LOAD MY REELS
    ===================================================== */

    async function loadMyReels() {

        profileContent.innerHTML = `
            <div class="empty-content">
                Loading reels...
            </div>
        `;


        try {

            const response =
                await fetch(
                    "/api/reels/me/list?limit=50&offset=0",
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

                throw new Error(
                    "Reels request failed: " +
                    response.status
                );

            }


            const data =
                await response.json();


            console.log(
                "Usanex My Reels:",
                data
            );


            const reels =
                Array.isArray(data.reels)
                    ? data.reels
                    : [];


            postsCount.textContent =
                reels.length;


            renderReels(reels);


        } catch (error) {

            console.error(
                "Usanex reels error:",
                error
            );


            profileContent.innerHTML = `
                <div class="empty-content">
                    Unable to load reels.
                </div>
            `;

        }

    }


    /* =====================================================
       RENDER REELS
    ===================================================== */

    function renderReels(reels) {

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


        reels.forEach(reel => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "profile-post";


            const videoUrl =
                reel.video_url ||
                reel.media_url ||
                "";


            const thumbnailUrl =
                reel.thumbnail_url ||
                reel.thumbnail ||
                "";


            const caption =
                reel.caption ||
                "";


            if (!videoUrl) {

                item.innerHTML = `
                    <div class="profile-reel-error">
                        Reel unavailable
                    </div>
                `;

                grid.appendChild(item);

                return;
            }


            const video =
                document.createElement(
                    "video"
                );


            video.src =
                videoUrl;


            if (thumbnailUrl) {

                video.poster =
                    thumbnailUrl;

            }


            video.muted =
                true;

            video.playsInline =
                true;

            video.loop =
                true;

            video.preload =
                "metadata";


            video.setAttribute(
                "webkit-playsinline",
                ""
            );


            item.appendChild(
                video
            );


            const playIcon =
                document.createElement(
                    "div"
                );

            playIcon.className =
                "profile-reel-play";

            playIcon.textContent =
                "▶";

            item.appendChild(
                playIcon
            );


            if (caption) {

                const captionBox =
                    document.createElement(
                        "div"
                    );

                captionBox.className =
                    "profile-reel-caption";

                captionBox.textContent =
                    caption;

                item.appendChild(
                    captionBox
                );

            }


            item.addEventListener(
                "click",
                () => {

                    openReel(
                        videoUrl
                    );

                }
            );


            item.addEventListener(
                "mouseenter",
                () => {

                    video.play()
                        .catch(
                            () => {}
                        );

                }
            );


            item.addEventListener(
                "mouseleave",
                () => {

                    video.pause();

                }
            );


            grid.appendChild(
                item
            );

        });


        profileContent.innerHTML =
            "";

        profileContent.appendChild(
            grid
        );

    }


    /* =====================================================
       OPEN REEL
    ===================================================== */

    function openReel(url) {

        if (!url) {
            return;
        }

        window.location.href =
            "/reels";

    }


    /* =====================================================
       SHARE PROFILE
    ===================================================== */

    async function shareProfile() {

        const userId =
            profileUserId.textContent.trim();

        const username =
            profileUsername.textContent.trim();

        const name =
            profileDisplayName.textContent.trim();


        const profileUrl =
            `${window.location.origin}/profile?user_id=${encodeURIComponent(userId)}`;


        if (
            navigator.share
        ) {

            try {

                await navigator.share({
                    title:
                        `${name} • Usanex`,

                    text:
                        `${name} ka Usanex profile dekhein.`,

                    url:
                        profileUrl
                });

            } catch (error) {

                console.log(
                    "Share cancelled."
                );

            }

            return;
        }


        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            try {

                await navigator.clipboard.writeText(
                    profileUrl
                );

                showMessage(
                    "Profile link copied."
                );

            } catch (error) {

                showMessage(
                    profileUrl
                );

            }

            return;
        }


        showMessage(
            profileUrl
        );

    }


    /* =====================================================
       SMALL MESSAGE
    ===================================================== */

    function showMessage(message) {

        editProfileMessage.textContent =
            message;

        setTimeout(() => {

            if (
                editProfileMessage.textContent ===
                message
            ) {
                editProfileMessage.textContent =
                    "";
            }

        }, 2500);

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
        event => {

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
        event => {

            event.stopPropagation();

            profileMenu.classList.toggle(
                "hidden"
            );

        }
    );


    profileMenu?.addEventListener(
        "click",
        event => {

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

            profileMenu?.classList.add(
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
        event => {

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
       SHARE BUTTON
    ===================================================== */

    shareProfileButton?.addEventListener(
        "click",
        shareProfile
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
                   PHOTO
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


                setTimeout(() => {

                    editProfileModal.classList.add(
                        "hidden"
                    );

                }, 600);


            } catch (error) {

                console.error(
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
       TABS
    ===================================================== */

    document
        .querySelectorAll(
            ".profile-content-tab"
        )
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".profile-content-tab"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });


                    tab.classList.add(
                        "active"
                    );


                    const type =
                        tab.dataset.tab;


                    if (
                        type ===
                        "reels"
                    ) {

                        loadMyReels();

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
       NAVIGATION
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
       PLUS
    ===================================================== */

    $("profileAddButton")?.addEventListener(
        "click",
        () => {

            window.location.href =
                "/create-reel";

        }
    );


    /* =====================================================
       MENU ITEMS
    ===================================================== */

    [
        "privacyButton",
        "securityButton",
        "blockedUsersButton",
        "accountButton",
        "helpButton",
        "aboutButton"
    ].forEach(id => {

        $(id)?.addEventListener(
            "click",
            () => {

                profileMenu.classList.add(
                    "hidden"
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
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

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
