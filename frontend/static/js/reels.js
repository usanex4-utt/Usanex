/* =========================================================
   USANEX REELS
   Production Frontend Controller
   ---------------------------------------------------------
   Features:
   • Reel autoplay
   • Audio when browser allows
   • Tap 1 = ⭐
   • Tap 2 = ⭐⭐
   • Tap 3 = ⭐⭐⭐
   • Long press = mute / unmute
   • Previous reel pauses
   • Multiple video URL formats supported
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

    userInteracted: false,

    activeVideo: null

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

    const unlockAudio = () => {

        ReelApp.userInteracted = true;

        const activeCard =
            document.querySelector(
                ".reel-card.active-reel"
            );

        if (!activeCard) {
            return;
        }

        const video =
            activeCard.querySelector(
                "video"
            );

        if (!video) {
            return;
        }

        video.muted = false;

        video.volume = 1;

        video.play().catch(() => {});

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

        ReelApp.loading = false;

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


    if (
        data &&
        data.data &&
        Array.isArray(data.data.reels)
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
                ${escapeHTML(message)}
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
   GET VIDEO URL
========================================================= */

function getVideoURL(
    reel
) {

    if (!reel) {
        return "";
    }


    const possibleUrls = [

        reel.video_url,

        reel.videoUrl,

        reel.video,

        reel.media_url,

        reel.mediaUrl,

        reel.file_url,

        reel.fileUrl,

        reel.video_path,

        reel.videoPath,

        reel.media_path,

        reel.mediaPath,

        reel.url

    ];


    let url =
        possibleUrls.find(
            value =>
                typeof value === "string" &&
                value.trim() !== ""
        );


    if (!url) {
        return "";
    }


    url =
        url.trim();


    /*
     * Already absolute URL
     */

    if (
        /^https?:\/\//i.test(url)
    ) {

        return url;

    }


    /*
     * Blob URL
     */

    if (
        url.startsWith("blob:")
    ) {

        return url;

    }


    /*
     * Data URL
     */

    if (
        url.startsWith("data:")
    ) {

        return url;

    }


    /*
     * Root-relative URL
     */

    if (
        url.startsWith("/")
    ) {

        return url;

    }


    /*
     * Relative URL
     */

    return "/" + url;

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


    article.dataset.tapRating =
        "0";


    article.innerHTML = `

        <div class="reel-video">

            <div class="video-placeholder">

                <div class="placeholder-icon">
                    ▶
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


            <button
                type="button"
                class="reel-action"
                data-action="comment"
            >
                💬
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
            >
                ↗
                <span>Share</span>
            </button>


            <button
                type="button"
                class="reel-action"
                data-action="save"
            >
                🔖
                <span>Save</span>
            </button>


            <button
                type="button"
                class="reel-action"
                data-action="download"
            >
                ↓
                <span>Download</span>
            </button>


            <button
                type="button"
                class="reel-action more-action"
                data-action="more"
            >
                ⋮
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

                🎵

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
        getVideoURL(
            reel
        );


    console.log(
        "Usanex Reel:",
        article.dataset.reelId,
        videoUrl
    );


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

    } else {

        const placeholder =
            article.querySelector(
                ".video-placeholder"
            );


        if (placeholder) {

            placeholder.querySelector(
                "span"
            ).textContent =
                "Video unavailable";

        }

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


    video.className =
        "reel-video-player";


    video.src =
        videoUrl;


    video.preload =
        "auto";


    video.loop =
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


    /*
     * Start muted because mobile browsers
     * normally block autoplay with sound.
     */

    video.muted =
        true;


    video.volume =
        1;


    if (
        reel.thumbnail_url
    ) {

        video.poster =
            reel.thumbnail_url;

    }


    /* -----------------------------------------
       VIDEO LOAD SUCCESS
    ----------------------------------------- */

    video.addEventListener(
        "loadeddata",
        () => {

            console.log(
                "Video loaded:",
                videoUrl
            );

        }
    );


    /* -----------------------------------------
       VIDEO ERROR
    ----------------------------------------- */

    video.addEventListener(
        "error",
        () => {

            console.error(
                "Video failed:",
                videoUrl,
                video.error
            );


            const container =
                video.closest(
                    ".reel-video"
                );


            if (container) {

                container.innerHTML = `

                    <div class="video-placeholder">

                        <div class="placeholder-icon">
                            ⚠
                        </div>

                        <span>
                            Video could not be loaded
                        </span>

                    </div>

                `;

            }

        }
    );


    /* -----------------------------------------
       TOUCH / LONG PRESS
    ----------------------------------------- */

    let pressTimer =
        null;

    let longPress =
        false;

    const LONG_PRESS_TIME =
        600;


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


                        ReelApp.userInteracted =
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


    video.addEventListener(
        "touchmove",
        () => {

            clearTimeout(
                pressTimer
            );

        },
        {
            passive: true
        }
    );


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


            const card =
                video.closest(
                    ".reel-card"
                );


            if (!card) {
                return;
            }


            ReelApp.userInteracted =
                true;


            /*
             * If paused → play.
             */

            if (video.paused) {

                playVideoWithSound(
                    video
                );

                return;

            }


            /*
             * Normal tap while playing:
             *
             * 1 → ⭐
             * 2 → ⭐⭐
             * 3 → ⭐⭐⭐
             */

            rateByVideoTap(
                card
            );

        },
        {
            passive: false
        }
    );


    /* -----------------------------------------
       DESKTOP LONG PRESS
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


                        ReelApp.userInteracted =
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


    return video;

}


/* =========================================================
   PLAY VIDEO
========================================================= */

function playVideoWithSound(
    video
) {

    if (!video) {
        return;
    }


    ReelApp.userInteracted =
        true;


    video.muted =
        false;


    video.volume =
        1;


    video.play()
        .catch(
            error => {

                console.warn(
                    "Sound play blocked:",
                    error
                );


                /*
                 * Fallback:
                 * video still plays muted.
                 */

                video.muted =
                    true;


                video.play()
                    .catch(
                        err => {

                            console.warn(
                                "Video play failed:",
                                err
                            );

                        }
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
     * Stop previous active video.
     */

    if (
        ReelApp.activeVideo &&
        ReelApp.activeVideo !== video
    ) {

        try {

            ReelApp.activeVideo.pause();

        } catch {}

    }


    ReelApp.activeVideo =
        video;


    /*
     * User has interacted:
     * play with sound.
     */

    if (
        ReelApp.userInteracted
    ) {

        video.muted =
            false;

        video.volume =
            1;

        video.play()
            .catch(
                () => {

                    video.muted =
                        true;

                    video.play()
                        .catch(
                            () => {}
                        );

                }
            );

        return;

    }


    /*
     * First automatic play:
     * browser-safe muted mode.
     */

    video.muted =
        true;


    video.volume =
        1;


    video.play()
        .catch(
            error => {

                console.warn(
                    "Autoplay failed:",
                    error
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


    if (video.muted) {

        video.muted =
            false;

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

        video.muted =
            true;


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


    showToast(
        `⭐ ${rating} star${rating > 1 ? "s" : ""}`
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
                rating: rating
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
                                reelId
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

        } else {

            button.classList.toggle(
                "saved"
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
    reelId
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
                    share_type: "link"
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
            video.currentSrc ||
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

                        const endpoint =
                            interest ===
                            "interested"

                                ? `/api/reels/${encodeURIComponent(reelId)}/interested`

                                : `/api/reels/${encodeURIComponent(reelId)}/not-interested`;


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
                                    card.dataset.index ||
                                    0
                                );


                            cards.forEach(
                                item => {

                                    if (
                                        item !==
                                        card
                                    ) {

                                        item.classList.remove(
                                            "active-reel"
                                        );


                                        const oldVideo =
                                            item.querySelector(
                                                "video"
                                            );


                                        if (
                                            oldVideo
                                        ) {

                                            oldVideo.pause();

                                        }

                                    }

                                }
                            );


                            card.classList.add(
                                "active-reel"
                            );


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
   STOP WATCH TRACKING
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
   REPORT
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
                reason: "user_report"
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


    if (
        createButton.dataset.staticBound ===
        "true"
    ) {
        return;
    }


    createButton.dataset.staticBound =
        "true";


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
            "99999";


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
