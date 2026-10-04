/* =========================================================
   USANEX — MY PROFILE JS
   VERSION 41
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

    /* NEW */
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
       PHOTO
    ===================================================== */

    function setPhoto(url) {

        const photoUrl =
            url || DEFAULT_PHOTO;

        profilePhoto.src = photoUrl;

        if (editProfilePhotoPreview) {
            editProfilePhotoPreview.src = photoUrl;
        }

        profilePhoto.onerror = () => {

            profilePhoto.onerror = null;

            profilePhoto.src =
                DEFAULT_PHOTO;
        };

        if (editProfilePhotoPreview) {

            editProfilePhotoPreview.onerror = () => {

                editProfilePhotoPreview.onerror = null;

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

        const content =
            data.content || [];

        const name =
            safe(
                user.name,
                "Usanex User"
            );

        profileName.textContent =
            name;

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


        /* BIO */

        const bio =
            safe(user.bio);

        profileBio.textContent =
            bio
                ? bio
                : "No bio available.";


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
                stats.posts ||
                content.length ||
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

        renderLinks(user);


        /* CONTENT */

        renderContent(content);
    }


    /* =====================================================
       LINKS
    ===================================================== */

    function renderLinks(user) {

        if (!profileLinks) {
            return;
        }

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

            profileLinks.hidden = true;

            return;
        }


        profileLinks.hidden = false;


        links.forEach((item) => {

            const a =
                document.createElement("a");

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
       CONTENT / REELS
    ===================================================== */

    function renderContent(posts) {

        if (
            !posts ||
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


        posts.forEach((post) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "profile-post";


            if (post.media_url) {

                const isVideo =
                    post.media_type === "video" ||
                    post.media_type === "reel";


                if (isVideo) {

                    const video =
                        document.createElement(
                            "video"
                        );

                    video.src =
                        post.media_url;

                    video.muted =
                        true;

                    video.playsInline =
                        true;

                    video.preload =
                        "metadata";

                    video.loop =
                        true;

                    item.appendChild(
                        video
                    );


                    /* PLAY ICON */

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


                    /* VIDEO CLICK */

                    item.addEventListener(
                        "click",
                        () => {

                            if (
                                video.paused
                            ) {

                                video.play()
                                    .catch(
                                        () => {}
                                    );

                                play.style.display =
                                    "none";

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
                        post.media_url;

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

                const text =
                    document.createElement(
                        "div"
                    );

                text.style.width =
                    "100%";

                text.style.height =
                    "100%";

                text.style.display =
                    "flex";

                text.style.alignItems =
                    "center";

                text.style.justifyContent =
                    "center";

                text.style.padding =
                    "15px";

                text.style.color =
                    "#8995a8";

                text.style.textAlign =
                    "center";

                text.textContent =
                    safe(
                        post.content,
                        ""
                    );

                item.appendChild(
                    text
                );
            }


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
       PHOTO VIEWER
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
       EDIT PROFILE BUTTON
       PROFILE ROW BUTTON
    ===================================================== */

    function openEditProfile() {

        if (!editProfileModal) {
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
    }


    editProfileButton?.addEventListener(
        "click",
        () => {

            openEditProfile();

        }
    );


    /* =====================================================
       CLOSE EDIT PROFILE
    ===================================================== */

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
       CHANGE PROFILE PHOTO
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

            if (
                !editName ||
                !editBio
            ) {
                return;
            }


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


                /* =========================================
                   PHOTO UPLOAD
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
                    "Usanex save profile:",
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
       SHARE PROFILE
    ===================================================== */

    shareProfileButton?.addEventListener(
        "click",
        async () => {

            const username =
                safe(
                    profileUsername?.textContent
                ).replace(
                    /^@/,
                    ""
                );


            const profileUrl =
                window.location.origin +
                "/profile/" +
                encodeURIComponent(
                    username
                );


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({

                        title:
                            profileDisplayName?.textContent ||
                            "Usanex Profile",

                        text:
                            "Check out this profile on Usanex.",

                        url:
                            profileUrl
                    });

                    return;
                }


                if (
                    navigator.clipboard
                ) {

                    await navigator.clipboard.writeText(
                        profileUrl
                    );

                    showShareMessage(
                        "Profile link copied!"
                    );

                    return;
                }


                window.prompt(
                    "Copy profile link:",
                    profileUrl
                );


            } catch (error) {

                if (
                    error.name ===
                    "AbortError"
                ) {
                    return;
                }

                console.error(
                    "Share profile error:",
                    error
                );

            }

        }
    );


    /* =====================================================
       SHARE MESSAGE
    ===================================================== */

    function showShareMessage(message) {

        const old =
            document.querySelector(
                ".usanex-share-message"
            );

        if (old) {
            old.remove();
        }


        const box =
            document.createElement(
                "div"
            );

        box.className =
            "usanex-share-message";

        box.textContent =
            message;


        Object.assign(
            box.style,
            {
                position: "fixed",
                left: "50%",
                bottom: "82px",
                transform: "translateX(-50%)",
                zIndex: "9999",
                padding: "10px 18px",
                borderRadius: "20px",
                background: "#162338",
                border: "1px solid #263b58",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                boxShadow:
                    "0 8px 25px rgba(0,0,0,.35)",
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


    $("navProfile")?.addEventListener(
        "click",
        () => {

            window.location.href =
                "/profile";

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
       NO EDIT PROFILE HERE
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

    loadProfile();

});
