/* =========================================================
   USANEX — MY PROFILE JS
   FINAL VERSION 42
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

    const profileUserRow = document.querySelector(
        ".profile-user-row"
    );

    const profilePhotoButton = $("profilePhotoButton");
    const profilePhotoViewer = $("profilePhotoViewer");
    const viewerPhoto = $("viewerPhoto");
    const closePhotoViewer = $("closePhotoViewer");

    const profileMenuButton = $("profileMenuButton");
    const profileMenu = $("profileMenu");

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

    const DEFAULT_PHOTO =
        "/static/images/default-profile.png";


    /* =====================================================
       SAFE
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

        return username.startsWith("@")
            ? username
            : "@" + username;
    }


    /* =====================================================
       CREATE PROFILE ACTION BUTTONS
       EDIT + SHARE
    ===================================================== */

    function createProfileActionButtons() {

        if (!profileUserRow) {
            console.error(
                "Usanex: profile user row not found."
            );
            return;
        }

        let actionBox =
            document.getElementById(
                "profileActionButtons"
            );

        if (actionBox) {
            return;
        }

        actionBox =
            document.createElement("div");

        actionBox.id =
            "profileActionButtons";

        actionBox.innerHTML = `
            <button
                type="button"
                id="profileEditButton"
                class="profile-action-button profile-edit-button"
            >
                Edit Profile
            </button>

            <button
                type="button"
                id="profileShareButton"
                class="profile-action-button profile-share-button"
            >
                Share Profile
            </button>
        `;

        profileUserRow.appendChild(
            actionBox
        );


        /* =================================================
           EDIT BUTTON
        ================================================= */

        const editButton =
            $("profileEditButton");

        editButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                openEditProfile();

            }
        );


        /* =================================================
           SHARE BUTTON
        ================================================= */

        const shareButton =
            $("profileShareButton");

        shareButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                shareProfile();

            }
        );

    }


    /* =====================================================
       OPEN EDIT PROFILE
    ===================================================== */

    function openEditProfile() {

        if (!editProfileModal) {

            console.error(
                "Usanex: Edit Profile modal not found."
            );

            return;
        }

        profileMenu?.classList.add(
            "hidden"
        );

        if (editProfileMessage) {

            editProfileMessage.textContent =
                "";
        }

        editProfileModal.classList.remove(
            "hidden"
        );

        document.body.style.overflow =
            "hidden";
    }


    /* =====================================================
       CLOSE EDIT PROFILE
    ===================================================== */

    function closeEditProfileModal() {

        if (!editProfileModal) {
            return;
        }

        editProfileModal.classList.add(
            "hidden"
        );

        document.body.style.overflow =
            "";
    }


    /* =====================================================
       SHARE PROFILE
    ===================================================== */

    async function shareProfile() {

        const username =
            safe(
                profileUsername?.textContent,
                ""
            )
            .replace(/^@/, "")
            .trim();

        const userId =
            safe(
                profileUserId?.textContent,
                ""
            ).trim();


        /*
         * Username is preferred.
         * User ID is fallback.
         */

        const identifier =
            username ||
            userId ||
            "user";


        const profileUrl =
            window.location.origin +
            "/profile/" +
            encodeURIComponent(
                identifier
            );


        const shareData = {

            title:
                profileDisplayName?.textContent ||
                "Usanex Profile",

            text:
                "Check out this profile on Usanex.",

            url:
                profileUrl
        };


        try {

            if (
                navigator.share
            ) {

                await navigator.share(
                    shareData
                );

                return;
            }


            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                await navigator.clipboard.writeText(
                    profileUrl
                );

                showMessage(
                    "Profile link copied!"
                );

                return;
            }


            const temp =
                document.createElement(
                    "textarea"
                );

            temp.value =
                profileUrl;

            temp.style.position =
                "fixed";

            temp.style.opacity =
                "0";

            document.body.appendChild(
                temp
            );

            temp.select();

            document.execCommand(
                "copy"
            );

            temp.remove();

            showMessage(
                "Profile link copied!"
            );


        } catch (error) {

            console.error(
                "Usanex share error:",
                error
            );

        }

    }


    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(message) {

        const old =
            document.querySelector(
                ".usanex-profile-message"
            );

        if (old) {
            old.remove();
        }


        const box =
            document.createElement(
                "div"
            );

        box.className =
            "usanex-profile-message";

        box.textContent =
            message;


        Object.assign(
            box.style,
            {
                position: "fixed",
                left: "50%",
                bottom: "82px",
                transform: "translateX(-50%)",
                zIndex: "99999",
                padding: "10px 18px",
                borderRadius: "20px",
                background: "#162338",
                border: "1px solid #29415f",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                boxShadow:
                    "0 8px 25px rgba(0,0,0,.4)",
                whiteSpace: "nowrap"
            }
        );


        document.body.appendChild(
            box
        );


        setTimeout(
            () => {

                box.remove();

            },
            1800
        );

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


        if (editProfilePhotoPreview) {

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


            console.log(
                "USANEX PROFILE DATA:",
                data
            );


            if (
                !data ||
                !data.user
            ) {

                throw new Error(
                    "Invalid profile response."
                );
            }


            renderProfile(
                data
            );


        } catch (error) {

            console.error(
                "USANEX PROFILE ERROR:",
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


        /*
         * IMPORTANT:
         * Support content / reels / posts.
         */

        let content = [];

        if (
            Array.isArray(
                data.content
            )
        ) {

            content =
                data.content;

        } else if (
            Array.isArray(
                data.reels
            )
        ) {

            content =
                data.reels;

        } else if (
            Array.isArray(
                data.posts
            )
        ) {

            content =
                data.posts;
        }


        /* NAME */

        const name =
            safe(
                user.name,
                "Usanex User"
            );


        profileName.textContent =
            name;

        profileDisplayName.textContent =
            name;


        /* USERNAME */

        profileUsername.textContent =
            formatUsername(
                user.username
            );


        /* USER ID */

        profileUserId.textContent =
            safe(
                user.user_id,
                "u_xxxxxxxx"
            );


        /* BIO */

        const bio =
            safe(
                user.bio
            );

        profileBio.textContent =
            bio ||
            "No bio available.";


        /* PHOTO */

        setPhoto(
            user.profile_photo
        );


        /* STATS */

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


        postsCount.textContent =
            Number(
                stats.posts ??
                content.length ??
                0
            );


        /* EDIT FORM */

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


        /* LINKS */

        renderLinks(
            user
        );


        /* REELS */

        renderContent(
            content
        );

    }


    /* =====================================================
       LINKS
    ===================================================== */

    function renderLinks(user) {

        if (!profileLinks) {
            return;
        }

        profileLinks.innerHTML =
            "";


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
                url: normalizeUrl(
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
       URL
    ===================================================== */

    function normalizeUrl(url) {

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
       RENDER REELS
    ===================================================== */

    function renderContent(posts) {

        if (
            !Array.isArray(posts) ||
            posts.length === 0
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


        posts.forEach(
            (post) => {

                /*
                 * Support multiple backend names.
                 */

                const mediaUrl =
                    post.media_url ||
                    post.video_url ||
                    post.file_url ||
                    post.url ||
                    post.media ||
                    null;


                const mediaType =
                    String(
                        post.media_type ||
                        post.type ||
                        ""
                    ).toLowerCase();


                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "profile-post";


                if (mediaUrl) {

                    const isVideo =
                        mediaType === "video" ||
                        mediaType === "reel" ||
                        mediaType === "mp4" ||
                        /\.(mp4|webm|mov|m4v)(\?|$)/i.test(
                            String(mediaUrl)
                        );


                    if (isVideo) {

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
                            "playsinline",
                            ""
                        );


                        item.appendChild(
                            video
                        );


                        const play =
                            document.createElement(
                                "div"
                            );

                        play.className =
                            "profile-reel-play";

                        play.textContent =
                            "▶";


                        item.appendChild(
                            play
                        );


                        item.addEventListener(
                            "click",
                            () => {

                                if (
                                    video.paused
                                ) {

                                    video.play()
                                        .then(
                                            () => {
                                                play.style.display =
                                                    "none";
                                            }
                                        )
                                        .catch(
                                            () => {}
                                        );

                                } else {

                                    video.pause();

                                    play.style.display =
                                        "flex";
                                }

                            }
                        );


                    } else {

                        const img =
                            document.createElement(
                                "img"
                            );

                        img.src =
                            mediaUrl;

                        img.loading =
                            "lazy";

                        img.style.width =
                            "100%";

                        img.style.height =
                            "100%";

                        img.style.objectFit =
                            "cover";

                        item.appendChild(
                            img
                        );
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
                                post.content ||
                                post.caption ||
                                ""
                            )}
                        </div>
                    `;
                }


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
       PHOTO VIEWER
    ===================================================== */

    profilePhotoButton?.addEventListener(
        "click",
        () => {

            if (
                !profilePhotoViewer ||
                !viewerPhoto
            ) {
                return;
            }


            viewerPhoto.src =
                profilePhoto.src;


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

                viewerPhoto.src =
                    "";

            }

        }
    );


    /* =====================================================
       THREE DOT MENU
    ===================================================== */

    profileMenuButton?.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            profileMenu?.classList.toggle(
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
       OLD EDIT BUTTON IF IT EXISTS
       HIDDEN/REMOVED FROM MENU
    ===================================================== */

    const oldEditButton =
        $("editProfileButton");

    if (oldEditButton) {

        oldEditButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                openEditProfile();

            }
        );

    }


    /* =====================================================
       CLOSE EDIT MODAL
    ===================================================== */

    closeEditProfile?.addEventListener(
        "click",
        closeEditProfileModal
    );


    editProfileModal?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                editProfileModal
            ) {

                closeEditProfileModal();

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
                                        editWebsite?.value.trim() ||
                                        null,

                                    instagram:
                                        editInstagram?.value.trim() ||
                                        null,

                                    social_link:
                                        editSocialLink?.value.trim() ||
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


                /* PHOTO */

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


                setTimeout(
                    () => {

                        closeEditProfileModal();

                    },
                    600
                );


            } catch (error) {

                console.error(
                    "Save profile error:",
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
                    () => {

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


                        if (
                            type ===
                            "reels"
                        ) {

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

            }
        );


    /* =====================================================
       BOTTOM NAV
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


    $("navProfile")?.addEventListener(
        "click",
        () => {

            window.location.href =
                "/profile";

        }
    );


    /* =====================================================
       PLUS
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
       MENU ITEMS
       EDIT PROFILE NOT NEEDED HERE
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

                    profileMenu?.classList.add(
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
       ESC
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

            closeEditProfileModal();

            profilePhotoViewer?.classList.add(
                "hidden"
            );

        }
    );


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

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
       START
    ===================================================== */

    createProfileActionButtons();

    loadProfile();

});
