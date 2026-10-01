"use strict";

/* =========================================================
   USANEX REELS
   Production Reels Player
   API: /api/reels/feed
========================================================= */

const ReelApp = {
    reels: [],
    currentIndex: 0,
    loading: false,
    observer: null,

    userInteracted: false,

    commentReelId: null,

    sessionId:
        window.crypto && crypto.randomUUID
            ? crypto.randomUUID()
            : "usanex-" + Date.now(),

    watchStartedAt: null,
    watchTimer: null,

    watchSent: new Set()
};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeNavigation();
    initializeCreateReel();
    initializeUserInteraction();
    initializeCommentSystem();

    loadReels();

});


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(url, options = {}) {

    const config = {
        credentials: "include",
        ...options,
        headers: {
            ...(options.headers || {})
        }
    };

    if (
        options.body &&
        typeof options.body !== "string"
    ) {
        config.headers["Content-Type"] =
            "application/json";

        config.body =
            JSON.stringify(options.body);
    }

    const response =
        await fetch(url, config);

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        const error =
            new Error(
                data?.detail ||
                data?.message ||
                "Request failed"
            );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}


/* =========================================================
   USER INTERACTION
========================================================= */

function initializeUserInteraction() {

    const unlock = () => {

        ReelApp.userInteracted = true;

        const active =
            document.querySelector(
                ".reel-card.active-reel video"
            );

        if (active) {

            active.muted = false;
            active.volume = 1;

            active.play().catch(() => {});

        }

    };

    document.addEventListener(
        "click",
        unlock,
        { once: true }
    );

    document.addEventListener(
        "touchstart",
        unlock,
        {
            once: true,
            passive: true
        }
    );

}


/* =========================================================
   LOAD REELS
========================================================= */

async function loadReels() {

    if (ReelApp.loading) {
        return;
    }

    ReelApp.loading = true;

    const container =
        document.getElementById(
            "reelsContainer"
        );

    if (!container) {
        ReelApp.loading = false;
        return;
    }

    try {

        const data =
            await apiRequest(
                "/api/reels/feed"
            );

        console.log(
            "USANEX REELS API:",
            data
        );

        const reels =
            normalizeReels(data);

        if (
            Array.isArray(reels) &&
            reels.length > 0
        ) {

            ReelApp.reels = reels;

            renderReels(reels);

            return;
        }

        showEmpty(
            "No reels available yet."
        );

    } catch (error) {

        console.error(
            "USANEX REELS ERROR:",
            error
        );

        if (error.status === 401) {

            showEmpty(
                "Please login to view reels."
            );

        } else {

            showEmpty(
                "Unable to load reels."
            );

        }

    } finally {

        ReelApp.loading = false;

    }

}


/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeReels(data) {

    /*
     * Your API:
     *
     * {
     *   success: true,
     *   reels: [...]
     * }
     */

    if (
        data &&
        Array.isArray(data.reels)
    ) {
        return data.reels;
    }

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data?.data &&
        Array.isArray(data.data.reels)
    ) {
        return data.data.reels;
    }

    return [];
}


/* =========================================================
   EMPTY
========================================================= */

function showEmpty(message) {

    const container =
        document.getElementById(
            "reelsContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="reels-empty">

            <div class="reels-empty-icon">
                ▶
            </div>

            <h3>
                No Reels
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;
}


/* =========================================================
   RENDER
========================================================= */

function renderReels(reels) {

    const container =
        document.getElementById(
            "reelsContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    reels.forEach((reel, index) => {

        const card =
            createReelCard(
                reel,
                index
            );

        container.appendChild(card);

    });

    initializeReelObserver();

}


/* =========================================================
   CREATE REEL CARD
========================================================= */

function createReelCard(reel, index) {

    const card =
        document.createElement("article");

    card.className = "reel-card";

    card.dataset.reelId =
        String(
            reel.id ??
            reel.reel_id ??
            ""
        );

    card.dataset.index =
        String(index);

    card.dataset.tapRating = "0";


    /* =====================================================
       CREATOR
    ===================================================== */

    const creator =
        reel.creator || {};

    const creatorName =
        creator.name ||
        reel.creator_name ||
        reel.user_name ||
        reel.name ||
        "Usanex User";

    const username =
        creator.username ||
        reel.username ||
        reel.creator_username ||
        "@usanex";

    const profilePhoto =
        creator.profile_photo ||
        reel.profile_photo ||
        null;


    /* =====================================================
       VIDEO
    ===================================================== */

    const videoUrl =
        getVideoUrl(reel);


    card.innerHTML = `

        <div class="reel-video">

            <div class="video-placeholder">

                <div class="placeholder-icon">

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                    >

                        <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="3"
                        ></rect>

                        <path
                            d="M9 8l7 4-7 4V8z"
                        ></path>

                    </svg>

                </div>

                <span>
                    Loading...
                </span>

            </div>

        </div>


        <!-- ============================================
             RIGHT ACTIONS
        ============================================= -->

        <div class="reel-actions">


            <!-- RATING -->

            <div
                class="reel-rating"
                aria-label="Rate this reel"
            >

                <button
                    type="button"
                    class="rating-star"
                    data-rating="1"
                >★</button>

                <button
                    type="button"
                    class="rating-star"
                    data-rating="2"
                >★</button>

                <button
                    type="button"
                    class="rating-star"
                    data-rating="3"
                >★</button>

                <span class="rating-label">
                    Rate
                </span>

            </div>


            <!-- COMMENT -->

            <button
                type="button"
                class="reel-action"
                data-action="comment"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                >

                    <path
                        d="M20 11.2c0 4.55-3.58 8.23-8 8.23-1.15 0-2.24-.25-3.22-.69L4 20l1.22-3.77A8.46 8.46 0 0 1 4 11.2C4 6.68 7.58 3 12 3s8 3.68 8 8.2Z"
                    />

                </svg>

                <span class="comment-count">
                    ${escapeHTML(
                        reel.comment_count ?? 0
                    )}
                </span>

            </button>


            <!-- SHARE -->

            <button
                type="button"
                class="reel-action"
                data-action="share"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                >

                    <path d="M21 3L10 14"></path>

                    <path
                        d="M21 3l-7 18-4-7-7-4 18-7Z"
                    ></path>

                </svg>

                <span>
                    Share
                </span>

            </button>


            <!-- SAVE -->

            <button
                type="button"
                class="reel-action"
                data-action="save"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                >

                    <path
                        d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"
                    ></path>

                </svg>

                <span>
                    Save
                </span>

            </button>


            <!-- DOWNLOAD -->

            <button
                type="button"
                class="reel-action"
                data-action="download"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                >

                    <path d="M12 3v12"></path>

                    <path d="m7 10 5 5 5-5"></path>

                    <path d="M5 21h14"></path>

                </svg>

                <span>
                    Download
                </span>

            </button>


            <!-- MORE -->

            <button
                type="button"
                class="reel-action more-action"
                data-action="more"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >

                    <circle
                        cx="5"
                        cy="12"
                        r="1.5"
                    ></circle>

                    <circle
                        cx="12"
                        cy="12"
                        r="1.5"
                    ></circle>

                    <circle
                        cx="19"
                        cy="12"
                        r="1.5"
                    ></circle>

                </svg>

            </button>

        </div>


        <!-- ============================================
             USER INFORMATION
        ============================================= -->

        <div class="reel-info">

            <div class="reel-user-row">


                <!-- PROFILE -->

                ${
                    profilePhoto
                        ? `
                            <img
                                class="reel-avatar reel-avatar-image"
                                src="${escapeHTML(
                                    normalizeMediaUrl(
                                        profilePhoto
                                    )
                                )}"
                                alt=""
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="reel-avatar">
                                ${escapeHTML(
                                    String(
                                        creatorName
                                    )
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase() ||
                                    "U"
                                )}
                            </div>
                        `
                }


                <!-- NAME -->

                <div class="reel-user-details">

                    <strong>
                        ${escapeHTML(
                            creatorName
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            username
                        )}
                    </span>

                </div>


                <!-- FOLLOW -->

                <button
                    type="button"
                    class="follow-button"
                >
                    Follow
                </button>

            </div>


            <!-- CAPTION -->

            ${
                reel.caption
                    ? `
                        <p class="reel-caption">
                            ${escapeHTML(
                                reel.caption
                            )}
                        </p>
                    `
                    : ""
            }


            <!-- INTEREST -->

            <div class="interest-controls">

                <button
                    type="button"
                    class="interest-button"
                    data-interest="interested"
                >
                    Interested
                </button>

                <button
                    type="button"
                    class="interest-button"
                    data-interest="not_interested"
                >
                    Not interested
                </button>

            </div>


            <!-- AUDIO -->

            <div class="reel-audio">

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                >

                    <path
                        d="M4 9v6h4l5 4V5L8 9H4Z"
                    ></path>

                    <path
                        d="M16 9.5a4 4 0 0 1 0 5"
                    ></path>

                </svg>

                <span>
                    Original audio
                </span>

            </div>

        </div>

    `;


    /* =====================================================
       CREATE VIDEO
    ===================================================== */

    if (videoUrl) {

        const video =
            createVideo(
                videoUrl,
                reel
            );

        const videoBox =
            card.querySelector(
                ".reel-video"
            );

        videoBox.innerHTML = "";

        videoBox.appendChild(
            video
        );

    }


    attachCardEvents(card);

    return card;

}


/* =========================================================
   VIDEO URL
========================================================= */

function getVideoUrl(reel) {

    let url =
        reel.video_url ||
        reel.videoUrl ||
        reel.video ||
        reel.media_url ||
        reel.mediaUrl ||
        reel.file_url ||
        reel.fileUrl ||
        reel.video_path ||
        reel.videoPath ||
        reel.media_path ||
        reel.url ||
        "";


    if (
        typeof url !== "string"
    ) {
        return null;
    }


    url = url.trim();


    if (!url) {
        return null;
    }


    /*
     * Your backend sends:
     *
     * /static/uploads/reels/file.mp4
     */

    if (
        url.startsWith("/")
    ) {
        return url;
    }


    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("blob:")
    ) {
        return url;
    }


    return "/" +
        url.replace(
            /^\/+/,
            ""
        );

}


/* =========================================================
   MEDIA URL
========================================================= */

function normalizeMediaUrl(url) {

    if (
        !url ||
        typeof url !== "string"
    ) {
        return "";
    }

    url = url.trim();

    if (
        url.startsWith("/") ||
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return "/" +
        url.replace(/^\/+/, "");

}


/* =========================================================
   CREATE VIDEO
========================================================= */

function createVideo(url, reel) {

    const video =
        document.createElement("video");


    video.src = url;

    video.preload = "auto";

    video.loop = true;

    video.playsInline = true;

    video.setAttribute(
        "playsinline",
        ""
    );

    video.setAttribute(
        "webkit-playsinline",
        ""
    );

    video.setAttribute(
        "controlslist",
        "nodownload"
    );


    /*
     * Start muted for browser autoplay.
     * It will unmute after user interaction.
     */

    video.muted = true;

    video.volume = 1;


    if (reel.thumbnail_url) {

        video.poster =
            normalizeMediaUrl(
                reel.thumbnail_url
            );

    }


    video.addEventListener(
        "loadedmetadata",
        () => {

            console.log(
                "Video loaded:",
                url,
                "duration:",
                video.duration
            );

        }
    );


    video.addEventListener(
        "canplay",
        () => {

            const card =
                video.closest(
                    ".reel-card"
                );

            if (
                card &&
                card.classList.contains(
                    "active-reel"
                )
            ) {

                playActiveVideo(video);

            }

        }
    );


    video.addEventListener(
        "error",
        () => {

            console.error(
                "VIDEO ERROR:",
                url,
                video.error
            );

        }
    );


    setupLongPress(video);


    return video;

}


/* =========================================================
   LONG PRESS MUTE
========================================================= */

function setupLongPress(video) {

    let timer = null;

    let longPressed = false;

    const LONG_PRESS = 600;


    const start = () => {

        longPressed = false;

        clearTimeout(timer);

        timer =
            setTimeout(
                () => {

                    longPressed = true;

                    toggleMute(video);

                },
                LONG_PRESS
            );

    };


    const cancel = () => {

        clearTimeout(timer);

    };


    video.addEventListener(
        "touchstart",
        start,
        {
            passive: true
        }
    );


    video.addEventListener(
        "touchend",
        event => {

            cancel();

            if (longPressed) {

                event.preventDefault();

            }

        },
        {
            passive: false
        }
    );


    video.addEventListener(
        "touchcancel",
        cancel
    );


    video.addEventListener(
        "mousedown",
        event => {

            if (event.button === 0) {
                start();
            }

        }
    );


    video.addEventListener(
        "mouseup",
        cancel
    );


    video.addEventListener(
        "mouseleave",
        cancel
    );

}


/* =========================================================
   MUTE / UNMUTE
========================================================= */

function toggleMute(video) {

    if (!video) {
        return;
    }


    video.muted =
        !video.muted;


    if (!video.muted) {

        ReelApp.userInteracted =
            true;

        video.volume = 1;

        video.play()
            .catch(() => {});

        showToast(
            "🔊 Audio on"
        );

    } else {

        showToast(
            "🔇 Audio muted"
        );

    }

}


/* =========================================================
   CARD EVENTS
========================================================= */

function attachCardEvents(card) {

    attachRatingEvents(card);

    attachActionEvents(card);

    attachInterestEvents(card);

    attachFollowEvent(card);

}


/* =========================================================
   RATING
========================================================= */

function attachRatingEvents(card) {

    const buttons =
        card.querySelectorAll(
            ".rating-star"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                const rating =
                    Number(
                        button.dataset.rating
                    );


                animateStar(
                    event.clientX,
                    event.clientY,
                    rating
                );


                card.dataset.tapRating =
                    String(rating);


                setRatingUI(
                    card,
                    rating
                );


                sendRating(
                    card,
                    rating
                );

            }
        );

    });

}


/* =========================================================
   VIDEO DOUBLE / TAP RATING
========================================================= */

function attachVideoRating(card) {

    const video =
        card.querySelector("video");

    if (!video) {
        return;
    }


    let lastTap = 0;


    video.addEventListener(
        "click",
        event => {

            const now =
                Date.now();


            if (
                now - lastTap < 350
            ) {
                return;
            }


            lastTap = now;


            let rating =
                Number(
                    card.dataset.tapRating ||
                    0
                );


            rating++;


            if (rating > 3) {
                rating = 1;
            }


            animateStar(
                event.clientX,
                event.clientY,
                rating
            );


            card.dataset.tapRating =
                String(rating);


            setRatingUI(
                card,
                rating
            );


            sendRating(
                card,
                rating
            );

        }
    );

}


/* =========================================================
   STAR ANIMATION
========================================================= */

function animateStar(x, y, rating) {

    const star =
        document.createElement("div");

    star.className =
        "star-fly";

    star.textContent =
        "★";

    star.style.left =
        `${x}px`;

    star.style.top =
        `${y}px`;


    if (rating === 3) {

        star.style.animation =
            "starFlyUp .45s ease-out forwards";

    }


    document.body.appendChild(
        star
    );


    if (rating === 3) {

        setTimeout(() => {

            const burst =
                document.createElement("div");

            burst.className =
                "star-burst";

            burst.style.left =
                `${x}px`;

            burst.style.top =
                `${y - 60}px`;


            document.body.appendChild(
                burst
            );


            setTimeout(
                () => burst.remove(),
                500
            );

        }, 300);

    }


    setTimeout(
        () => star.remove(),
        850
    );

}


/* =========================================================
   RATING UI
========================================================= */

function setRatingUI(card, rating) {

    card.querySelectorAll(
        ".rating-star"
    ).forEach(star => {

        const value =
            Number(
                star.dataset.rating
            );

        star.classList.toggle(
            "active",
            value <= rating
        );

    });

}


/* =========================================================
   RATING API
========================================================= */

async function sendRating(card, rating) {

    const reelId =
        getReelId(card);

    if (!isRealReelId(reelId)) {
        return;
    }


    try {

        await apiRequest(
            `/api/reels/${encodeURIComponent(
                reelId
            )}/rating`,
            {
                method: "POST",

                body: {
                    rating: rating
                }
            }
        );

    } catch (error) {

        console.warn(
            "Rating API:",
            error
        );

    }

}


/* =========================================================
   ACTIONS
========================================================= */

function attachActionEvents(card) {

    card.querySelectorAll(
        ".reel-action"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const action =
                    button.dataset.action;


                const reelId =
                    getReelId(card);


                if (
                    action === "comment"
                ) {

                    openComments(
                        reelId
                    );

                }


                if (
                    action === "share"
                ) {

                    shareReel(
                        reelId
                    );

                }


                if (
                    action === "save"
                ) {

                    saveReel(
                        reelId,
                        button
                    );

                }


                if (
                    action === "download"
                ) {

                    downloadReel(
                        reelId,
                        card,
                        button
                    );

                }


                if (
                    action === "more"
                ) {

                    reportReel(
                        reelId
                    );

                }

            }
        );

    });

}


/* =========================================================
   SHARE
========================================================= */

async function shareReel(reelId) {

    if (!isRealReelId(reelId)) {
        return;
    }


    const url =
        `${location.origin}/reels?reel=${encodeURIComponent(
            reelId
        )}`;


    try {

        if (navigator.share) {

            await navigator.share({

                title:
                    "Usanex Reel",

                text:
                    "Check this reel on Usanex",

                url:
                    url

            });

        } else if (
            navigator.clipboard
        ) {

            await navigator.clipboard.writeText(
                url
            );

            showToast(
                "Reel link copied"
            );

        }


        apiRequest(
            `/api/reels/${encodeURIComponent(
                reelId
            )}/share`,
            {
                method: "POST",

                body: {
                    share_type: "link"
                }
            }
        ).catch(() => {});


    } catch (error) {

        console.warn(
            "Share:",
            error
        );

    }

}


/* =========================================================
   SAVE
========================================================= */

async function saveReel(reelId, button) {

    if (!isRealReelId(reelId)) {
        return;
    }


    try {

        const data =
            await apiRequest(
                `/api/reels/${encodeURIComponent(
                    reelId
                )}/save`,
                {
                    method: "POST"
                }
            );


        const saved =
            data?.saved ??
            data?.is_saved;


        if (
            typeof saved === "boolean"
        ) {

            button.classList.toggle(
                "saved",
                saved
            );

        } else {

            button.classList.toggle(
                "saved"
            );

        }


    } catch (error) {

        showToast(
            error.message ||
            "Unable to save"
        );

    }

}


/* =========================================================
   DOWNLOAD
========================================================= */

async function downloadReel(
    reelId,
    card,
    button
) {

    const video =
        card.querySelector("video");


    if (
        !video ||
        !video.src
    ) {

        showToast(
            "Video not available"
        );

        return;

    }


    try {

        const link =
            document.createElement("a");


        link.href =
            video.src;


        link.download =
            `usanex-reel-${
                reelId || Date.now()
            }.mp4`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        button.classList.add(
            "downloaded"
        );


        if (
            isRealReelId(reelId)
        ) {

            apiRequest(
                `/api/reels/${encodeURIComponent(
                    reelId
                )}/download`,
                {
                    method: "POST"
                }
            ).catch(() => {});

        }


    } catch (error) {

        console.warn(
            "Download:",
            error
        );

    }

}


/* =========================================================
   INTEREST
========================================================= */

function attachInterestEvents(card) {

    const buttons =
        card.querySelectorAll(
            ".interest-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            async event => {

                event.stopPropagation();


                const reelId =
                    getReelId(card);


                if (
                    !isRealReelId(reelId)
                ) {
                    return;
                }


                const type =
                    button.dataset.interest;


                buttons.forEach(
                    b =>
                        b.classList.remove(
                            "selected"
                        )
                );


                button.classList.add(
                    "selected"
                );


                const endpoint =
                    type === "interested"
                        ? "interested"
                        : "not-interested";


                try {

                    await apiRequest(
                        `/api/reels/${encodeURIComponent(
                            reelId
                        )}/${endpoint}`,
                        {
                            method: "POST"
                        }
                    );

                } catch (error) {

                    console.warn(
                        "Interest API:",
                        error
                    );

                }

            }
        );

    });

}


/* =========================================================
   FOLLOW
========================================================= */

function attachFollowEvent(card) {

    const button =
        card.querySelector(
            ".follow-button"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            const following =
                button.classList.contains(
                    "following"
                );


            button.classList.toggle(
                "following",
                !following
            );


            button.textContent =
                following
                    ? "Follow"
                    : "Following";

        }
    );

}


/* =========================================================
   REEL OBSERVER
========================================================= */

function initializeReelObserver() {

    if (ReelApp.observer) {

        ReelApp.observer.disconnect();

    }


    const container =
        document.getElementById(
            "reelsContainer"
        );


    if (!container) {
        return;
    }


    const cards =
        container.querySelectorAll(
            ".reel-card"
        );


    ReelApp.observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    const card =
                        entry.target;


                    const video =
                        card.querySelector(
                            "video"
                        );


                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= .70
                    ) {

                        ReelApp.currentIndex =
                            Number(
                                card.dataset.index ||
                                0
                            );


                        cards.forEach(c => {

                            c.classList.remove(
                                "active-reel"
                            );

                        });


                        card.classList.add(
                            "active-reel"
                        );


                        if (video) {

                            playActiveVideo(
                                video
                            );

                        }


                        startWatch(
                            card
                        );


                    } else {

                        if (video) {

                            video.pause();

                        }


                        card.classList.remove(
                            "active-reel"
                        );


                        stopWatch(
                            card
                        );

                    }

                });

            },
            {
                root: container,

                threshold: [
                    .25,
                    .50,
                    .70,
                    .90
                ]

            }
        );


    cards.forEach(card => {

        ReelApp.observer.observe(
            card
        );


        attachVideoRating(
            card
        );

    });

}


/* =========================================================
   ACTIVE VIDEO
========================================================= */

function playActiveVideo(video) {

    if (!video) {
        return;
    }


    if (ReelApp.userInteracted) {

        video.muted = false;
        video.volume = 1;

    } else {

        /*
         * Required for autoplay.
         */

        video.muted = true;

    }


    video.play()
        .catch(() => {

            video.muted = true;

            video.play()
                .catch(() => {});

        });

}


/* =========================================================
   WATCH
========================================================= */

function startWatch(card) {

    stopWatch(card);


    ReelApp.watchStartedAt =
        Date.now();


    ReelApp.watchTimer =
        setInterval(() => {

            const video =
                card.querySelector(
                    "video"
                );


            if (!video) {
                return;
            }


            if (
                !Number.isFinite(
                    video.duration
                ) ||
                !video.duration
            ) {
                return;
            }


            const percent =
                (
                    video.currentTime /
                    video.duration
                ) * 100;


            if (percent >= 90) {

                const id =
                    getReelId(card);


                const key =
                    `${id}-completed`;


                if (
                    !ReelApp.watchSent.has(
                        key
                    )
                ) {

                    ReelApp.watchSent.add(
                        key
                    );


                    sendWatch(
                        card,
                        video.currentTime,
                        percent,
                        true
                    );

                }

            }

        }, 5000);

}


/* =========================================================
   STOP WATCH
========================================================= */

function stopWatch() {

    if (ReelApp.watchTimer) {

        clearInterval(
            ReelApp.watchTimer
        );

        ReelApp.watchTimer =
            null;

    }


    ReelApp.watchStartedAt =
        null;

}


/* =========================================================
   WATCH API
========================================================= */

async function sendWatch(
    card,
    watchTime,
    completion,
    completed
) {

    const id =
        getReelId(card);


    if (!isRealReelId(id)) {
        return;
    }


    try {

        await apiRequest(
            `/api/reels/${encodeURIComponent(
                id
            )}/watch`,
            {
                method: "POST",

                body: {

                    watch_time_seconds:
                        Number(
                            watchTime || 0
                        ),

                    completion_percent:
                        Number(
                            completion || 0
                        ),

                    completed:
                        Boolean(
                            completed
                        ),

                    session_id:
                        ReelApp.sessionId

                }

            }
        );

    } catch {}

}


/* =========================================================
   COMMENTS
========================================================= */

function initializeCommentSystem() {

    if (
        document.getElementById(
            "usanexCommentOverlay"
        )
    ) {
        return;
    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "usanexCommentOverlay";


    overlay.className =
        "comment-overlay";


    overlay.innerHTML = `

        <section
            class="comment-panel"
            role="dialog"
            aria-modal="true"
        >

            <header class="comment-header">

                <strong>
                    Comments
                </strong>

                <button
                    type="button"
                    class="comment-close"
                    id="commentClose"
                >
                    ×
                </button>

            </header>


            <div
                class="comment-list"
                id="commentList"
            >

                <div class="comment-empty">
                    Loading comments...
                </div>

            </div>


            <form
                class="comment-form"
                id="commentForm"
            >

                <input
                    type="text"
                    class="comment-input"
                    id="commentInput"
                    maxlength="500"
                    autocomplete="off"
                    placeholder="Add a comment..."
                >


                <button
                    type="submit"
                    class="comment-send"
                >
                    ➤
                </button>

            </form>

        </section>

    `;


    document.body.appendChild(
        overlay
    );


    document.getElementById(
        "commentClose"
    ).addEventListener(
        "click",
        closeComments
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closeComments();

            }

        }
    );


    document.getElementById(
        "commentForm"
    ).addEventListener(
        "submit",
        submitComment
    );

}


/* =========================================================
   OPEN COMMENTS
========================================================= */

async function openComments(reelId) {

    if (!reelId) {
        return;
    }


    const overlay =
        document.getElementById(
            "usanexCommentOverlay"
        );


    if (!overlay) {
        return;
    }


    ReelApp.commentReelId =
        reelId;


    overlay.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";


    const list =
        document.getElementById(
            "commentList"
        );


    list.innerHTML = `
        <div class="comment-empty">
            Loading comments...
        </div>
    `;


    await loadComments(
        reelId
    );

}


/* =========================================================
   CLOSE COMMENTS
========================================================= */

function closeComments() {

    const overlay =
        document.getElementById(
            "usanexCommentOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "open"
        );

    }


    document.body.style.overflow =
        "";


    ReelApp.commentReelId =
        null;

}


/* =========================================================
   LOAD COMMENTS
========================================================= */

async function loadComments(reelId) {

    const list =
        document.getElementById(
            "commentList"
        );


    if (!list) {
        return;
    }


    try {

        const data =
            await apiRequest(
                `/api/reels/${encodeURIComponent(
                    reelId
                )}/comments`
            );


        const comments =
            Array.isArray(data)
                ? data
                : data?.comments ||
                  data?.data ||
                  [];


        renderComments(
            comments
        );


    } catch {

        list.innerHTML = `
            <div class="comment-empty">
                No comments yet.
            </div>
        `;

    }

}


/* =========================================================
   RENDER COMMENTS
========================================================= */

function renderComments(comments) {

    const list =
        document.getElementById(
            "commentList"
        );


    if (!list) {
        return;
    }


    if (
        !Array.isArray(comments) ||
        !comments.length
    ) {

        list.innerHTML = `
            <div class="comment-empty">
                No comments yet. Be the first to comment.
            </div>
        `;

        return;

    }


    list.innerHTML =
        comments
            .map(createCommentHTML)
            .join("");


    list.querySelectorAll(
        ".comment-like"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                likeComment(
                    button
                );

            }
        );

    });

}


/* =========================================================
   COMMENT HTML
========================================================= */

function createCommentHTML(comment) {

    const id =
        comment.id ??
        comment.comment_id ??
        "";


    const username =
        comment.username ??
        comment.user_username ??
        "@user";


    const text =
        comment.comment ??
        comment.text ??
        comment.content ??
        "";


    const likes =
        comment.likes_count ??
        comment.like_count ??
        0;


    const liked =
        Boolean(
            comment.liked ??
            comment.is_liked
        );


    return `

        <article
            class="comment-item"
            data-comment-id="${escapeHTML(id)}"
        >

            <div class="comment-avatar">

                ${escapeHTML(
                    String(username)
                        .replace("@", "")
                        .charAt(0)
                        .toUpperCase() ||
                    "U"
                )}

            </div>


            <div class="comment-content">

                <span class="comment-user">
                    ${escapeHTML(username)}
                </span>


                <div class="comment-text">
                    ${escapeHTML(text)}
                </div>


                <div class="comment-meta">

                    <button
                        type="button"
                        class="comment-like ${
                            liked
                                ? "liked"
                                : ""
                        }"
                    >

                        ♥
                        <span
                            class="comment-like-count"
                        >
                            ${escapeHTML(likes)}
                        </span>

                    </button>


                    <button
                        type="button"
                        class="comment-reply"
                    >
                        Reply
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   COMMENT LIKE
========================================================= */

async function likeComment(button) {

    const item =
        button.closest(
            ".comment-item"
        );


    if (!item) {
        return;
    }


    const commentId =
        item.dataset.commentId;


    if (!commentId) {
        return;
    }


    const liked =
        button.classList.contains(
            "liked"
        );


    const count =
        button.querySelector(
            ".comment-like-count"
        );


    let number =
        Number(
            count?.textContent || 0
        );


    if (liked) {

        number =
            Math.max(
                0,
                number - 1
            );

    } else {

        number++;

    }


    button.classList.toggle(
        "liked",
        !liked
    );


    if (count) {

        count.textContent =
            String(number);

    }


    try {

        await apiRequest(
            `/api/comments/${encodeURIComponent(
                commentId
            )}/like`,
            {
                method: "POST"
            }
        );

    } catch {}

}


/* =========================================================
   SUBMIT COMMENT
========================================================= */

async function submitComment(event) {

    event.preventDefault();


    const input =
        document.getElementById(
            "commentInput"
        );


    const text =
        input?.value.trim();


    const reelId =
        ReelApp.commentReelId;


    if (
        !text ||
        !reelId
    ) {
        return;
    }


    const sendButton =
        event.target.querySelector(
            ".comment-send"
        );


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    try {

        await apiRequest(
            `/api/reels/${encodeURIComponent(
                reelId
            )}/comments`,
            {
                method: "POST",

                body: {
                    comment: text,
                    text: text,
                    content: text
                }

            }
        );


        input.value = "";


        await loadComments(
            reelId
        );


        updateCommentCount(
            reelId
        );


    } catch (error) {

        showToast(
            error.message ||
            "Unable to comment"
        );

    } finally {

        if (sendButton) {

            sendButton.disabled =
                false;

        }

    }

}


/* =========================================================
   COMMENT COUNT
========================================================= */

function updateCommentCount(reelId) {

    const cards =
        document.querySelectorAll(
            ".reel-card"
        );


    cards.forEach(card => {

        if (
            String(
                card.dataset.reelId
            ) !== String(reelId)
        ) {
            return;
        }


        const count =
            card.querySelector(
                ".comment-count"
            );


        if (!count) {
            return;
        }


        const current =
            Number(
                count.textContent || 0
            );


        count.textContent =
            String(
                current + 1
            );

    });

}


/* =========================================================
   REPORT
========================================================= */

async function reportReel(reelId) {

    if (!isRealReelId(reelId)) {
        return;
    }


    const confirmed =
        window.confirm(
            "Report this reel?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/api/reels/${encodeURIComponent(
                reelId
            )}/report`,
            {
                method: "POST",

                body: {
                    reason:
                        "user_report"
                }

            }
        );


        showToast(
            "Report submitted"
        );


    } catch (error) {

        showToast(
            error.message ||
            "Unable to report reel"
        );

    }

}


/* =========================================================
   CREATE REEL
========================================================= */

function initializeCreateReel() {

    const button =
        document.getElementById(
            "createReelButton"
        );


    if (!button) {
        return;
    }


    button.onclick = () => {

        window.location.href =
            "/reels/create";

    };

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const routes = {

        homeNav:
            "/home",

        reelNav:
            "/reels",

        searchNav:
            "/search",

        notificationNav:
            "/notifications",

        profileNav:
            "/my-profile"

    };


    Object.entries(routes)
        .forEach(([id, url]) => {

            const element =
                document.getElementById(
                    id
                );


            if (!element) {
                return;
            }


            element.addEventListener(
                "click",
                () => {

                    window.location.href =
                        url;

                }
            );

        });

}


/* =========================================================
   HELPERS
========================================================= */

function getReelId(card) {

    return (
        card?.dataset?.reelId ||
        ""
    );

}


function isRealReelId(id) {

    if (!id) {
        return false;
    }


    const value =
        Number(id);


    return (
        Number.isInteger(value) &&
        value > 0
    );

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    let toast =
        document.getElementById(
            "usanexReelToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "usanexReelToast";


        Object.assign(
            toast.style,
            {
                position: "fixed",
                left: "50%",
                bottom: "85px",
                transform:
                    "translateX(-50%)",
                zIndex: "99999",
                padding:
                    "10px 16px",
                borderRadius:
                    "12px",
                background:
                    "rgba(20,20,20,.95)",
                color: "#fff",
                fontSize: "13px",
                pointerEvents: "none"
            }
        );


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.hidden =
        false;


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(() => {

            toast.hidden =
                true;

        }, 2200);

}


/* =========================================================
   EXPORT
========================================================= */

window.ReelApp =
    ReelApp;
