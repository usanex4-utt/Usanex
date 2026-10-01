/* =========================================================
   USANEX REELS
   Production Frontend Controller
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

    loaded: false,

    watchSent: new Set(),

    userInteracted: false

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

        initializeUserInteraction();

        loadReels();

    }
);


/* =========================================================
   USER INTERACTION
========================================================= */

function initializeUserInteraction() {

    const unlockAudio =
        () => {

            ReelApp.userInteracted =
                true;


            const activeCard =
                document.querySelector(
                    ".reel-card.active-reel"
                );


            if (activeCard) {

                const video =
                    activeCard.querySelector(
                        "video"
                    );


                if (video) {

                    video.muted =
                        false;


                    video.volume =
                        1;


                    video.play()
                        .catch(
                            () => {}
                        );

                }

            }

        };


    document.addEventListener(
        "click",
        unlockAudio,
        {
            once: true,
            passive: true
        }
    );


    document.addEventListener(
        "touchstart",
        unlockAudio,
        {
            once: true,
            passive: true
        }
    );

}


/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const finalOptions = {

        credentials:
            "include",

        ...options,

        headers: {

            "Content-Type":
                "application/json",

            ...(options.headers || {})

        }

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


    let data =
        null;


    try {

        data =
            await response.json();

    } catch {

        data =
            null;

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


        error.data =
            data;


        throw error;

    }


    return data;

}


/* =========================================================
   LOAD REELS
========================================================= */

async function loadReels() {

    if (
        ReelApp.loading
    ) {

        return;

    }


    ReelApp.loading =
        true;


    const container =
        document.getElementById(
            "reelsContainer"
        );


    if (!container) {

        ReelApp.loading =
            false;

        return;

    }


    try {

        const data =
            await apiRequest(
                "/api/reels/feed"
            );


        const reels =
            normalizeReelResponse(
                data
            );


        if (
            Array.isArray(reels) &&
            reels.length > 0
        ) {

            ReelApp.reels =
                reels;


            renderReels(
                reels
            );


            ReelApp.loaded =
                true;


            initializeReelObserver();


            return;

        }


        showEmptyReels(
            "No reels available yet."
        );

    } catch (error) {

        console.warn(
            "Reels feed error:",
            error
        );


        if (
            error.status === 401
        ) {

            showToast(
                "Please login to view reels"
            );


            return;

        }


        showEmptyReels(
            "Unable to load reels."
        );

    } finally {

        ReelApp.loading =
            false;

    }

}


/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeReelResponse(
    data
) {

    if (
        Array.isArray(data)
    ) {

        return data;

    }


    if (
        data &&
        Array.isArray(
            data.reels
        )
    ) {

        return data.reels;

    }


    if (
        data &&
        Array.isArray(
            data.data
        )
    ) {

        return data.data;

    }


    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.reels
        )
    ) {

        return data.data.reels;

    }


    return [];

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmptyReels(
    message
) {

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
                ${escapeHTML(
                    message
                )}
            </p>

        </div>

    `;

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


    container.innerHTML =
        "";


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
        String(
            index
        );


    article.dataset.tapRating =
        "0";


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
                        d="M20 11.5a7.5 7.5 0 0 1-8 7.5
                           8.7 8.7 0 0 1-3.5-.7L4 20
                           l1.4-3.5A7.3 7.3 0 0 1 4 11.5
                           7.5 7.5 0 0 1 12 4
                           7.5 7.5 0 0 1 20 11.5z"
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
                        d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7
                           A2.5 2.5 0 0 1 18 4.5V21
                           l-6-3.5L6 21V4.5z"
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


        videoContainer.innerHTML =
            "";


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
   VIDEO
   Auto Play + Audio
   Long Press = Mute / Unmute
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
        "auto";


    video.loop =
        true;


    video.autoplay =
        true;


    video.muted =
        false;


    video.volume =
        1;


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


    video.setAttribute(
        "autoplay",
        ""
    );


    if (
        reel.thumbnail_url
    ) {

        video.poster =
            reel.thumbnail_url;

    }


    /* =========================================
       LONG PRESS
    ========================================= */

    let pressTimer =
        null;


    let longPress =
        false;


    const LONG_PRESS_TIME =
        600;


    /* -----------------------------------------
       TOUCH START
    ----------------------------------------- */

    video.addEventListener(
        "touchstart",
        event => {

            longPress =
                false;


            pressTimer =
                setTimeout(
                    () => {

                        longPress =
                            true;


                        toggleVideoAudio(
                            video
                        );

                    },
                    LONG_PRESS_TIME
                );

        },
        {
            passive: true
        }
    );


    /* -----------------------------------------
       TOUCH END
    ----------------------------------------- */

    video.addEventListener(
        "touchend",
        event => {

            clearTimeout(
                pressTimer
            );


            if (longPress) {

                event.preventDefault();

                return;

            }


            /*
             * Normal tap:
             *
             * 1. If video/audio isn't running,
             *    start it.
             *
             * 2. Otherwise rate:
             *    1 -> 2 -> 3 -> 1
             */

            const card =
                video.closest(
                    ".reel-card"
                );


            if (!card) {

                return;

            }


            if (
                video.paused
            ) {

                ReelApp.userInteracted =
                    true;


                video.muted =
                    false;


                video.volume =
                    1;


                video.play()
                    .catch(
                        () => {}
                    );


                return;

            }


            rateByVideoTap(
                card
            );

        },
        {
            passive: false
        }
    );


    /* -----------------------------------------
       DESKTOP MOUSE LONG PRESS
    ----------------------------------------- */

    video.addEventListener(
        "mousedown",
        event => {

            if (
                event.button !== 0
            ) {

                return;

            }


            longPress =
                false;


            pressTimer =
                setTimeout(
                    () => {

                        longPress =
                            true;


                        toggleVideoAudio(
                            video
                        );

                    },
                    LONG_PRESS_TIME
                );

        }
    );


    video.addEventListener(
        "mouseup",
        event => {

            clearTimeout(
                pressTimer
            );

        }
    );


    video.addEventListener(
        "mouseleave",
        () => {

            clearTimeout(
                pressTimer
            );

        }
    );


    /* -----------------------------------------
       TRY AUTOPLAY
    ----------------------------------------- */

    video.addEventListener(
        "loadeddata",
        () => {

            tryPlayVideo(
                video
            );

        }
    );


    /*
     * Also try immediately
     */

    tryPlayVideo(
        video
    );


    return video;

}


/* =========================================================
   TRY PLAY VIDEO
========================================================= */

function tryPlayVideo(
    video
) {

    if (!video) {

        return;

    }


    video.muted =
        false;


    video.volume =
        1;


    video.play()
        .then(
            () => {

                video.muted =
                    false;

            }
        )
        .catch(
            () => {

                /*
                 * Browser blocked autoplay
                 * with sound.
                 *
                 * Start muted so reel still
                 * plays automatically.
                 */

                video.muted =
                    true;


                video.play()
                    .catch(
                        () => {}
                    );

            }
        );

}


/* =========================================================
   TOGGLE AUDIO
========================================================= */

function toggleVideoAudio(
    video
) {

    if (!video) {

        return;

    }


    video.muted =
        !video.muted;


    if (!video.muted) {

        video.volume =
            1;


        video.play()
            .catch(
                () => {}
            );


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
   VIDEO TAP RATING
========================================================= */

function rateByVideoTap(
    card
) {

    let rating =
        Number(
            card.dataset.tapRating ||
            0
        );


    rating++;


    if (
        rating > 3
    ) {

        rating =
            1;

    }


    card.dataset.tapRating =
        String(
            rating
        );


    setRatingUI(
        card,
        rating
    );


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


    apiRequest(
        `/api/reels/${encodeURIComponent(reelId)}/rating`,
        {
            method:
                "POST",

            body: {

                rating:
                    rating

            }

        }
    )
    .catch(
        error => {

            console.warn(
                "Rating API:",
                error
            );

        }
    );

}


/* =========================================================
   CARD EVENTS
========================================================= */

function attachCardEvents(
    card
) {

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
   RATING BUTTONS
========================================================= */

function attachRatingEvents(
    card
) {

    const buttons =
        card.querySelectorAll(
            ".rating-star"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();


                    const rating =
                        Number(
                            button.dataset.rating
                        );


                    if (
                        rating < 1 ||
                        rating > 3
                    ) {

                        return;

                    }


                    card.dataset.tapRating =
                        String(
                            rating
                        );


                    setRatingUI(
                        card,
                        rating
                    );


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
                            `/api/reels/${encodeURIComponent(reelId)}/rating`,
                            {
                                method:
                                    "POST",

                                body: {

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


                        showToast(
                            error.message ||
                            "Unable to rate reel"
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
        star => {

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
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();


                    const action =
                        button.dataset.action;


                    const reelId =
                        getReelId(
                            card
                        );


                    switch (
                        action
                    ) {

                        case "comment":

                            openComment(
                                reelId
                            );

                            break;


                        case "share":

                            await shareReel(
                                reelId,
                                card
                            );

                            break;


                        case "save":

                            await saveReel(
                                reelId,
                                button
                            );

                            break;


                        case "download":

                            await downloadReel(
                                reelId,
                                card,
                                button
                            );

                            break;


                        case "more":

                            openMoreMenu(
                                reelId
                            );

                            break;

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

        return;

    }


    try {

        const data =
            await apiRequest(
                `/api/reels/${encodeURIComponent(reelId)}/save`,
                {
                    method:
                        "POST"
                }
            );


        button.classList.toggle(
            "saved"
        );


        const saved =
            data?.saved ??
            data?.is_saved;


        if (
            typeof saved ===
            "boolean"
        ) {

            button.classList.toggle(
                "saved",
                saved
            );

        }

    } catch (error) {

        console.warn(
            "Save API:",
            error
        );


        showToast(
            error.message ||
            "Unable to save reel"
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

    if (
        !isRealReelId(
            reelId
        )
    ) {

        return;

    }


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


        await apiRequest(
            `/api/reels/${encodeURIComponent(reelId)}/share`,
            {
                method:
                    "POST",

                body: {

                    share_type:
                        "link"

                }

            }
        );

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


    if (
        !video?.src
    ) {

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
            `usanex-reel-${reelId}.mp4`;


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
                `/api/reels/${encodeURIComponent(reelId)}/download`,
                {
                    method:
                        "POST"
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
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();


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


                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "selected"
                            );

                        }
                    );


                    try {

                        let endpoint;


                        if (
                            interest ===
                            "interested"
                        ) {

                            endpoint =
                                `/api/reels/${encodeURIComponent(reelId)}/interested`;

                        } else {

                            endpoint =
                                `/api/reels/${encodeURIComponent(reelId)}/not-interested`;

                        }


                        await apiRequest(
                            endpoint,
                            {
                                method:
                                    "POST"
                            }
                        );


                        button.classList.add(
                            "selected"
                        );

                    } catch (error) {

                        console.warn(
                            "Interest API:",
                            error
                        );


                        showToast(
                            error.message ||
                            "Unable to update interest"
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
            entries => {

                entries.forEach(
                    entry => {

                        const card =
                            entry.target;


                        const video =
                            card.querySelector(
                                "video"
                            );


                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >=
                                0.70
                        ) {

                            ReelApp.currentIndex =
                                Number(
                                    card.dataset.index ??
                                    0
                                );


                            /*
                             * Mark active reel
                             */

                            cards.forEach(
                                item => {

                                    item.classList.remove(
                                        "active-reel"
                                    );

                                }
                            );


                            card.classList.add(
                                "active-reel"
                            );


                            /*
                             * Play current reel
                             */

                            if (video) {

                                playActiveVideo(
                                    video
                                );

                            }


                            startWatchTracking(
                                card
                            );

                        } else {

                            if (video) {

                                video.pause();

                            }


                            card.classList.remove(
                                "active-reel"
                            );


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
        card => {

            ReelApp.observer.observe(
                card
            );

        }
    );

}


/* =========================================================
   PLAY ACTIVE VIDEO
========================================================= */

function playActiveVideo(
    video
) {

    if (!video) {

        return;

    }


    /*
     * If user has already interacted,
     * audio can be enabled.
     */

    if (
        ReelApp.userInteracted
    ) {

        video.muted =
            false;

        video.volume =
            1;

    }


    video.play()
        .catch(
            () => {

                /*
                 * Browser autoplay policy:
                 * play muted if sound is blocked.
                 */

                video.muted =
                    true;


                video.play()
                    .catch(
                        () => {}
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

                    const reelId =
                        getReelId(
                            card
                        );


                    const key =
                        `${reelId}-completed`;


                    if (
                        !ReelApp.watchSent.has(
                            key
                        )
                    ) {

                        ReelApp.watchSent.add(
                            key
                        );


                        sendWatchEvent(
                            card,
                            current,
                            percentage,
                            true
                        );

                    }

                }

            },
            5000
        );

}


/* =========================================================
   STOP WATCH
========================================================= */

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
   WATCH API
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
            `/api/reels/${encodeURIComponent(reelId)}/watch`,
            {
                method:
                    "POST",

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

    } catch (error) {

        console.warn(
            "Watch API:",
            error
        );

    }

}


/* =========================================================
   COMMENT
========================================================= */

function openComment(
    reelId
) {

    if (
        !isRealReelId(
            reelId
        )
    ) {

        return;

    }


    window.location.href =
        "/reels/" +
        encodeURIComponent(
            reelId
        ) +
        "/comments";

}


/* =========================================================
   MORE / REPORT
========================================================= */

function openMoreMenu(
    reelId
) {

    if (
        !isRealReelId(
            reelId
        )
    ) {

        return;

    }


    const choice =
        window.confirm(
            "Report this reel?"
        );


    if (!choice) {

        return;

    }


    apiRequest(
        `/api/reels/${encodeURIComponent(reelId)}/report`,
        {
            method:
                "POST",

            body: {

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
        error => {

            console.warn(
                "Report API:",
                error
            );


            showToast(
                error.message ||
                "Unable to report reel"
            );

        }
    );

}


/* =========================================================
   STATIC INTERACTIONS
========================================================= */

function initializeStaticInteractions() {

    const createButton =
        document.getElementById(
            "createReelButton"
        );


    if (!createButton) {

        return;

    }


    createButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "/reels/create";

        }
    );

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


    /*
     * Prevent duplicate listeners.
     */

    if (
        button.dataset.reelCreateBound ===
        "true"
    ) {

        return;

    }


    button.dataset.reelCreateBound =
        "true";


    button.addEventListener(
        "click",
        () => {

            window.location.href =
                "/reels/create";

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const navigation = {

        home:
            "/home",

        reel:
            "/reels",

        search:
            "/search",

        notification:
            "/notifications",

        profile:
            "/my-profile"

    };


    Object.entries(
        navigation
    ).forEach(
        (
            [
                id,
                url
            ]
        ) => {

            const element =
                document.getElementById(
                    id + "Nav"
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
        String(
            reelId
        ).startsWith(
            "demo"
        )
    ) {

        return false;

    }


    const number =
        Number(
            reelId
        );


    return (
        Number.isInteger(
            number
        ) &&
        number > 0
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


    return (
        String(name)
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "U"
    );

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


/* =========================================================
   TOAST
========================================================= */

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


        toast.style.pointerEvents =
            "none";


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


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.ReelApp =
    ReelApp;
