/* =========================================================
   USANEX REELS
   Production Frontend Controller

   Responsibilities:
   - Load reels
   - Render videos
   - Auto play / pause
   - Watch tracking
   - 3-star rating
   - Save
   - Share
   - Download
   - Interest
   - Follow
   - Navigation
========================================================= */

"use strict";


/* =========================================================
   GLOBAL STATE
========================================================= */

const ReelApp = {

    reels: [],

    currentIndex: 0,

    sessionId:
        window.crypto &&
        crypto.randomUUID
            ? crypto.randomUUID()
            : (
                "session-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2)
            ),

    watchStartedAt: null,

    watchTimer: null,

    observer: null,

    loading: false,

    loaded: false
};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeNavigation();

        initializeCreateReel();

        initializeStaticInteractions();

        initializeReelObserver();

        loadReels();

    }
);


/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const defaultOptions = {

        credentials: "include",

        headers: {
            "Content-Type":
                "application/json"
        }

    };


    const finalOptions = {
        ...defaultOptions,
        ...options
    };


    if (
        options.body &&
        typeof options.body !== "string"
    ) {

        finalOptions.body =
            JSON.stringify(
                options.body
            );

    }


    const response =
        await fetch(
            url,
            finalOptions
        );


    let data = null;


    try {

        data =
            await response.json();

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

        error.status =
            response.status;

        error.data = data;

        throw error;
    }


    return data;
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

        /*
         * Main production endpoint.
         */

        const data =
            await apiRequest(
                "/api/reels"
            );


        const reels =
            normalizeReelResponse(
                data
            );


        if (
            Array.isArray(reels) &&
            reels.length > 0
        ) {

            ReelApp.reels = reels;

            renderReels(
                reels
            );

            ReelApp.loaded = true;

            initializeReelObserver();

            return;
        }


        /*
         * If API returns no reels,
         * keep demo card instead of
         * breaking the page.
         */

        setupDemoReel();

    } catch (error) {

        console.warn(
            "Reels API unavailable:",
            error
        );


        /*
         * Do not break UI if backend
         * endpoint is temporarily unavailable.
         */

        setupDemoReel();

    } finally {

        ReelApp.loading = false;

    }
}


/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeReelResponse(
    data
) {

    if (Array.isArray(data)) {
        return data;
    }


    if (
        data &&
        Array.isArray(data.reels)
    ) {

        return data.reels;

    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    return [];
}


/* =========================================================
   DEMO REEL
========================================================= */

function setupDemoReel() {

    const container =
        document.getElementById(
            "reelsContainer"
        );


    if (!container) {
        return;
    }


    const card =
        container.querySelector(
            ".reel-card"
        );


    if (!card) {
        return;
    }


    card.dataset.demo =
        "true";


    attachCardEvents(
        card
    );
}


/* =========================================================
   RENDER REELS
========================================================= */

function renderReels(
    reels
) {

    const container =
        document.getElementById(
            "reelsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    reels.forEach(
        (
            reel,
            index
        ) => {

            const card =
                createReelCard(
                    reel,
                    index
                );


            container.appendChild(
                card
            );

        }
    );


    initializeReelObserver();
}


/* =========================================================
   CREATE REEL CARD
========================================================= */

function createReelCard(
    reel,
    index
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "reel-card";


    article.dataset.reelId =
        String(
            reel.id ??
            reel.reel_id ??
            ""
        );


    article.dataset.index =
        String(index);


    article.innerHTML = `

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


        <div class="reel-actions">

            <div
                class="reel-rating"
                aria-label="Rate this reel"
            >

                <button
                    type="button"
                    class="rating-star"
                    data-rating="1"
                    aria-label="1 star"
                >★</button>

                <button
                    type="button"
                    class="rating-star"
                    data-rating="2"
                    aria-label="2 stars"
                >★</button>

                <button
                    type="button"
                    class="rating-star"
                    data-rating="3"
                    aria-label="3 stars"
                >★</button>

                <span class="rating-label">
                    Rate
                </span>

            </div>


            <button
                type="button"
                class="reel-action"
                data-action="comment"
                aria-label="Comment"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                >

                    <path
                        d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.5-.7L4 20l1.4-3.5A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5z"
                    ></path>

                </svg>

                <span class="comment-count">
                    ${escapeHTML(
                        reel.comment_count ??
                        reel.comments_count ??
                        0
                    )}
                </span>

            </button>


            <button
                type="button"
                class="reel-action"
                data-action="share"
                aria-label="Share"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                >

                    <path
                        d="M21 3L10 14"
                    ></path>

                    <path
                        d="M21 3l-7 18-4-7-7-4 18-7z"
                    ></path>

                </svg>

                <span>
                    Share
                </span>

            </button>


            <button
                type="button"
                class="reel-action"
                data-action="save"
                aria-label="Save"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                >

                    <path
                        d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5z"
                    ></path>

                </svg>

                <span>
                    Save
                </span>

            </button>


            <button
                type="button"
                class="reel-action"
                data-action="download"
                aria-label="Download"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                >

                    <path
                        d="M12 3v12"
                    ></path>

                    <path
                        d="M7 10l5 5 5-5"
                    ></path>

                    <path
                        d="M5 21h14"
                    ></path>

                </svg>

                <span>
                    Download
                </span>

            </button>


            <button
                type="button"
                class="reel-action more-action"
                data-action="more"
                aria-label="More"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >

                    <circle
                        cx="5"
                        cy="12"
                        r="1"
                    ></circle>

                    <circle
                        cx="12"
                        cy="12"
                        r="1"
                    ></circle>

                    <circle
                        cx="19"
                        cy="12"
                        r="1"
                    ></circle>

                </svg>

            </button>

        </div>


        <div class="reel-info">

            <div class="reel-user-row">

                <div class="reel-avatar">
                    ${escapeHTML(
                        getAvatarLetter(
                            reel
                        )
                    )}
                </div>

                <div class="reel-user-details">

                    <strong>
                        ${escapeHTML(
                            reel.creator_name ??
                            reel.user_name ??
                            reel.name ??
                            "Usanex User"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            reel.username ??
                            reel.creator_username ??
                            "@usanex"
                        )}
                    </span>

                </div>

                <button
                    type="button"
                    class="follow-button"
                >
                    Follow
                </button>

            </div>


            <p class="reel-caption">

                ${escapeHTML(
                    reel.caption ??
                    ""
                )}

            </p>


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


            <div class="reel-audio">

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                >

                    <path
                        d="M9 18V6l10-2v12"
                    ></path>

                    <circle
                        cx="6"
                        cy="18"
                        r="3"
                    ></circle>

                    <circle
                        cx="16"
                        cy="16"
                        r="3"
                    ></circle>

                </svg>

                <span>
                    ${escapeHTML(
                        reel.audio_name ??
                        "Original audio"
                    )}
                </span>

            </div>

        </div>

    `;


    const videoUrl =
        reel.video_url ??
        reel.video ??
        reel.media_url ??
        null;


    if (videoUrl) {

        const video =
            createVideoElement(
                videoUrl,
                reel
            );


        const videoContainer =
            article.querySelector(
                ".reel-video"
            );


        videoContainer.innerHTML = "";

        videoContainer.appendChild(
            video
        );

    }


    attachCardEvents(
        article
    );


    return article;
}


/* =========================================================
   VIDEO ELEMENT
========================================================= */

function createVideoElement(
    videoUrl,
    reel
) {

    const video =
        document.createElement(
            "video"
        );


    video.src =
        videoUrl;


    video.preload =
        "metadata";


    video.loop =
        true;


    video.muted =
        true;


    video.playsInline =
        true;


    video.setAttribute(
        "playsinline",
        ""
    );


    video.setAttribute(
        "webkit-playsinline",
        ""
    );


    if (reel.thumbnail_url) {

        video.poster =
            reel.thumbnail_url;

    }


    video.addEventListener(
        "click",
        () => {

            if (video.paused) {

                video.play()
                    .catch(() => {});

            } else {

                video.pause();

            }

        }
    );


    return video;
}


/* =========================================================
   CARD EVENTS
========================================================= */

function attachCardEvents(
    card
) {

    if (!card) {
        return;
    }


    attachRatingEvents(
        card
    );


    attachActionEvents(
        card
    );


    attachInterestEvents(
        card
    );


    attachFollowEvent(
        card
    );

}


/* =========================================================
   RATING
========================================================= */

function attachRatingEvents(
    card
) {

    const buttons =
        card.querySelectorAll(
            ".rating-star"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async (event) => {

                    event.stopPropagation();


                    const rating =
                        Number(
                            button.dataset.rating
                        );


                    if (
                        !rating ||
                        rating < 1 ||
                        rating > 3
                    ) {
                        return;
                    }


                    setRatingUI(
                        card,
                        rating
                    );


                    const reelId =
                        getReelId(
                            card
                        );


                    if (!isRealReelId(reelId)) {
                        return;
                    }


                    try {

                        await apiRequest(
                            "/api/reels/rating",
                            {
                                method: "POST",

                                body: {
                                    reel_id:
                                        Number(
                                            reelId
                                        ),

                                    rating:
                                        rating
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
            );

        }
    );

}


/* =========================================================
   RATING UI
========================================================= */

function setRatingUI(
    card,
    rating
) {

    const stars =
        card.querySelectorAll(
            ".rating-star"
        );


    stars.forEach(
        (star) => {

            const value =
                Number(
                    star.dataset.rating
                );


            star.classList.toggle(
                "active",
                value <= rating
            );

        }
    );

}


/* =========================================================
   ACTION EVENTS
========================================================= */

function attachActionEvents(
    card
) {

    const buttons =
        card.querySelectorAll(
            ".reel-action"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async (event) => {

                    event.stopPropagation();


                    const action =
                        button.dataset.action;


                    const reelId =
                        getReelId(
                            card
                        );


                    if (
                        action ===
                        "comment"
                    ) {

                        openComment(
                            reelId
                        );

                        return;
                    }


                    if (
                        action ===
                        "share"
                    ) {

                        await shareReel(
                            reelId,
                            card
                        );

                        return;
                    }


                    if (
                        action ===
                        "save"
                    ) {

                        await saveReel(
                            reelId,
                            button
                        );

                        return;
                    }


                    if (
                        action ===
                        "download"
                    ) {

                        await downloadReel(
                            reelId,
                            card,
                            button
                        );

                        return;
                    }


                    if (
                        action ===
                        "more"
                    ) {

                        openMoreMenu(
                            reelId
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   SAVE
========================================================= */

async function saveReel(
    reelId,
    button
) {

    if (
        !isRealReelId(
            reelId
        )
    ) {
        button.classList.toggle(
            "saved"
        );

        return;
    }


    try {

        await apiRequest(
            "/api/reels/save",
            {
                method: "POST",

                body: {
                    reel_id:
                        Number(
                            reelId
                        )
                }
            }
        );


        button.classList.toggle(
            "saved"
        );

    } catch (error) {

        console.warn(
            "Save API:",
            error
        );

    }

}


/* =========================================================
   SHARE
========================================================= */

async function shareReel(
    reelId,
    card
) {

    const shareUrl =
        window.location.origin +
        "/reels?reel=" +
        encodeURIComponent(
            reelId
        );


    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Usanex Reel",

                text:
                    "Check this reel on Usanex",

                url:
                    shareUrl

            });

        } else if (
            navigator.clipboard
        ) {

            await navigator.clipboard.writeText(
                shareUrl
            );

            showToast(
                "Reel link copied"
            );

        }


        if (
            isRealReelId(
                reelId
            )
        ) {

            await apiRequest(
                "/api/reels/share",
                {
                    method: "POST",

                    body: {
                        reel_id:
                            Number(
                                reelId
                            ),

                        share_type:
                            "link"
                    }
                }
            );

        }

    } catch (error) {

        console.warn(
            "Share API:",
            error
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
        card.querySelector(
            "video"
        );


    if (!video?.src) {

        showToast(
            "Video not available"
        );

        return;
    }


    try {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            video.src;


        link.download =
            "usanex-reel-" +
            reelId +
            ".mp4";


        link.target =
            "_blank";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        button.classList.add(
            "downloaded"
        );


        if (
            isRealReelId(
                reelId
            )
        ) {

            await apiRequest(
                "/api/reels/download",
                {
                    method: "POST",

                    body: {
                        reel_id:
                            Number(
                                reelId
                            )
                    }
                }
            );

        }

    } catch (error) {

        console.warn(
            "Download API:",
            error
        );

    }

}


/* =========================================================
   INTEREST
========================================================= */

function attachInterestEvents(
    card
) {

    const buttons =
        card.querySelectorAll(
            ".interest-button"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async (event) => {

                    event.stopPropagation();


                    buttons.forEach(
                        (item) => {

                            item.classList.remove(
                                "selected"
                            );

                        }
                    );


                    button.classList.add(
                        "selected"
                    );


                    const interest =
                        button.dataset.interest;


                    const reelId =
                        getReelId(
                            card
                        );


                    if (
                        !isRealReelId(
                            reelId
                        )
                    ) {
                        return;
                    }


                    try {

                        await apiRequest(
                            "/api/reels/interest",
                            {
                                method: "POST",

                                body: {
                                    reel_id:
                                        Number(
                                            reelId
                                        ),

                                    interested:
                                        interest ===
                                        "interested",

                                    not_interested:
                                        interest ===
                                        "not_interested"
                                }
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

        }
    );

}


/* =========================================================
   FOLLOW
========================================================= */

function attachFollowEvent(
    card
) {

    const button =
        card.querySelector(
            ".follow-button"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async (event) => {

            event.stopPropagation();


            const currentlyFollowing =
                button.classList.contains(
                    "following"
                );


            button.classList.toggle(
                "following"
            );


            button.textContent =
                currentlyFollowing
                    ? "Follow"
                    : "Following";

        }
    );

}


/* =========================================================
   WATCH OBSERVER
========================================================= */

function initializeReelObserver() {

    if (
        ReelApp.observer
    ) {

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


    if (!cards.length) {
        return;
    }


    ReelApp.observer =
        new IntersectionObserver(
            (
                entries
            ) => {

                entries.forEach(
                    (entry) => {

                        const card =
                            entry.target;


                        const video =
                            card.querySelector(
                                "video"
                            );


                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.70
                        ) {

                            ReelApp.currentIndex =
                                Number(
                                    card.dataset.index ??
                                    0
                                );


                            if (video) {

                                video.play()
                                    .catch(
                                        () => {}
                                    );

                            }


                            startWatchTracking(
                                card
                            );

                        } else {

                            if (video) {

                                video.pause();

                            }


                            stopWatchTracking(
                                card
                            );

                        }

                    }
                );

            },
            {
                root:
                    container,

                threshold:
                    [
                        0.25,
                        0.50,
                        0.70,
                        0.90
                    ]

            }
        );


    cards.forEach(
        (card) => {

            ReelApp.observer.observe(
                card
            );

        }
    );

}


/* =========================================================
   WATCH TRACKING
========================================================= */

function startWatchTracking(
    card
) {

    stopWatchTracking(
        card
    );


    ReelApp.watchStartedAt =
        Date.now();


    ReelApp.watchTimer =
        window.setInterval(
            () => {

                const video =
                    card.querySelector(
                        "video"
                    );


                if (!video) {
                    return;
                }


                const duration =
                    Number(
                        video.duration
                    );


                const current =
                    Number(
                        video.currentTime
                    );


                if (
                    !duration ||
                    !Number.isFinite(
                        duration
                    )
                ) {
                    return;
                }


                const percentage =
                    Math.min(
                        100,
                        (
                            current /
                            duration
                        ) * 100
                    );


                if (
                    percentage >= 90
                ) {

                    sendWatchEvent(
                        card,
                        current,
                        percentage,
                        true
                    );

                }

            },
            5000
        );

}


function stopWatchTracking(
    card
) {

    if (
        ReelApp.watchTimer
    ) {

        clearInterval(
            ReelApp.watchTimer
        );

        ReelApp.watchTimer =
            null;

    }


    if (
        ReelApp.watchStartedAt
    ) {

        const watchedSeconds =
            (
                Date.now() -
                ReelApp.watchStartedAt
            ) / 1000;


        if (
            watchedSeconds >= 1
        ) {

            sendWatchEvent(
                card,
                watchedSeconds,
                0,
                false
            );

        }

    }


    ReelApp.watchStartedAt =
        null;

}


/* =========================================================
   SEND WATCH EVENT
========================================================= */

async function sendWatchEvent(
    card,
    watchTime,
    completion,
    completed
) {

    const reelId =
        getReelId(
            card
        );


    if (
        !isRealReelId(
            reelId
        )
    ) {
        return;
    }


    try {

        await apiRequest(
            "/api/reels/interaction",
            {
                method: "POST",

                body: {

                    reel_id:
                        Number(
                            reelId
                        ),

                    event_type:
                        "watch",

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

    } catch (error) {

        console.warn(
            "Watch tracking:",
            error
        );

    }

}


/* =========================================================
   STATIC INTERACTIONS
========================================================= */

function initializeStaticInteractions() {

    /*
     * Create reel
     */

    const createButton =
        document.getElementById(
            "createReelButton"
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/reels/create";

            }
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const home =
        document.getElementById(
            "homeNav"
        );


    const reel =
        document.getElementById(
            "reelNav"
        );


    const search =
        document.getElementById(
            "searchNav"
        );


    const notification =
        document.getElementById(
            "notificationNav"
        );


    const profile =
        document.getElementById(
            "profileNav"
        );


    if (home) {

        home.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/home";

            }
        );

    }


    if (reel) {

        reel.addEventListener(
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


    if (notification) {

        notification.addEventListener(
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


    button.addEventListener(
        "click",
        () => {

            window.location.href =
                "/reels/create";

        }
    );

}


/* =========================================================
   COMMENT
========================================================= */

function openComment(
    reelId
) {

    /*
     * Comment page/modal will be connected
     * with the real comment route later.
     */

    if (
        isRealReelId(
            reelId
        )
    ) {

        window.location.href =
            "/reels/" +
            encodeURIComponent(
                reelId
            ) +
            "/comments";

    }

}


/* =========================================================
   MORE MENU
========================================================= */

function openMoreMenu(
    reelId
) {

    const choice =
        window.confirm(
            "Report this reel?"
        );


    if (
        !choice ||
        !isRealReelId(
            reelId
        )
    ) {
        return;
    }


    apiRequest(
        "/api/reels/report",
        {
            method: "POST",

            body: {

                reel_id:
                    Number(
                        reelId
                    ),

                reason:
                    "user_report"

            }
        }
    )
    .then(
        () => {

            showToast(
                "Report submitted"
            );

        }
    )
    .catch(
        (error) => {

            console.warn(
                "Report API:",
                error
            );

        }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function getReelId(
    card
) {

    return (
        card?.dataset?.reelId ??
        ""
    );

}


function isRealReelId(
    reelId
) {

    if (!reelId) {
        return false;
    }


    if (
        String(reelId)
            .startsWith("demo")
    ) {
        return false;
    }


    return (
        Number.isInteger(
            Number(reelId)
        ) &&
        Number(reelId) > 0
    );

}


function getAvatarLetter(
    reel
) {

    const name =
        reel.creator_name ??
        reel.user_name ??
        reel.name ??
        "U";


    return String(
        name
    )
        .trim()
        .charAt(0)
        .toUpperCase() ||
        "U";

}


function escapeHTML(
    value
) {

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


function showToast(
    message
) {

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


        toast.style.position =
            "fixed";


        toast.style.left =
            "50%";


        toast.style.bottom =
            "85px";


        toast.style.transform =
            "translateX(-50%)";


        toast.style.zIndex =
            "9999";


        toast.style.padding =
            "10px 16px";


        toast.style.borderRadius =
            "10px";


        toast.style.background =
            "rgba(20,20,20,.94)";


        toast.style.color =
            "#fff";


        toast.style.fontSize =
            "13px";


        toast.style.boxShadow =
            "0 5px 25px rgba(0,0,0,.4)";


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
        setTimeout(
            () => {

                toast.hidden =
                    true;

            },
            2200
        );

}
