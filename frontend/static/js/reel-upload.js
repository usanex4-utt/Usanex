/* =========================================================
   USANEX REEL UPLOAD
========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const videoInput =
        document.getElementById("videoInput");

    const videoEmpty =
        document.getElementById("videoEmpty");

    const reelVideo =
        document.getElementById("reelVideo");

    const videoControls =
        document.getElementById("videoControls");

    const videoActions =
        document.getElementById("videoActions");

    const selectVideoButton =
        document.getElementById("selectVideoButton");

    const replaceVideo =
        document.getElementById("replaceVideo");

    const removeVideo =
        document.getElementById("removeVideo");

    const playPauseButton =
        document.getElementById("playPauseButton");

    const muteButton =
        document.getElementById("muteButton");

    const videoDuration =
        document.getElementById("videoDuration");

    const reelCaption =
        document.getElementById("reelCaption");

    const captionCount =
        document.getElementById("captionCount");

    const locationButton =
        document.getElementById("locationButton");

    const locationOverlay =
        document.getElementById("locationOverlay");

    const closeLocation =
        document.getElementById("closeLocation");

    const locationInput =
        document.getElementById("locationInput");

    const locationResults =
        document.getElementById("locationResults");

    const locationText =
        document.getElementById("locationText");

    const audienceButton =
        document.getElementById("audienceButton");

    const audienceOverlay =
        document.getElementById("audienceOverlay");

    const closeAudience =
        document.getElementById("closeAudience");

    const audienceText =
        document.getElementById("audienceText");

    const audienceOptions =
        document.querySelectorAll(".audience-option");

    const postReelButton =
        document.getElementById("postReelButton");

    const reelBack =
        document.getElementById("reelBack");

    const reelNext =
        document.getElementById("reelNext");


    /* =====================================================
       STATE
    ===================================================== */

    let selectedVideoFile = null;

    let videoObjectUrl = null;

    let selectedLocation = "";

    let selectedAudience = "Everyone";


    /* =====================================================
       OPEN FILE PICKER
    ===================================================== */

    function openVideoPicker() {

        if (!videoInput) {
            return;
        }

        videoInput.value = "";

        videoInput.click();
    }


    selectVideoButton?.addEventListener(
        "click",
        openVideoPicker
    );

    replaceVideo?.addEventListener(
        "click",
        openVideoPicker
    );


    /* =====================================================
       VIDEO SELECT
    ===================================================== */

    videoInput?.addEventListener(
        "change",
        () => {

            const file =
                videoInput.files?.[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("video/")) {

                showMessage(
                    "Please select a video file."
                );

                return;
            }

            selectedVideoFile = file;

            loadVideo(file);
        }
    );


    /* =====================================================
       LOAD VIDEO
    ===================================================== */

    function loadVideo(file) {

        if (videoObjectUrl) {

            URL.revokeObjectURL(
                videoObjectUrl
            );

            videoObjectUrl = null;
        }

        videoObjectUrl =
            URL.createObjectURL(file);

        reelVideo.src =
            videoObjectUrl;

        reelVideo.hidden = false;

        videoEmpty.hidden = true;

        videoControls.hidden = false;

        videoActions.hidden = false;

        reelVideo.muted = false;

        muteButton.textContent = "🔊";

        playPauseButton.textContent = "▶";

        updatePostButton();
    }


    /* =====================================================
       VIDEO METADATA
    ===================================================== */

    reelVideo?.addEventListener(
        "loadedmetadata",
        () => {

            const duration =
                reelVideo.duration;

            videoDuration.textContent =
                formatTime(duration);
        }
    );


    /* =====================================================
       PLAY / PAUSE
    ===================================================== */

    playPauseButton?.addEventListener(
        "click",
        () => {

            if (!reelVideo.src) {
                return;
            }

            if (reelVideo.paused) {

                reelVideo
                    .play()
                    .catch(() => {});

            } else {

                reelVideo.pause();
            }
        }
    );


    reelVideo?.addEventListener(
        "play",
        () => {

            playPauseButton.textContent =
                "❚❚";
        }
    );


    reelVideo?.addEventListener(
        "pause",
        () => {

            playPauseButton.textContent =
                "▶";
        }
    );


    /* =====================================================
       MUTE
    ===================================================== */

    muteButton?.addEventListener(
        "click",
        () => {

            reelVideo.muted =
                !reelVideo.muted;

            muteButton.textContent =
                reelVideo.muted
                    ? "🔇"
                    : "🔊";
        }
    );


    /* =====================================================
       REMOVE VIDEO
    ===================================================== */

    removeVideo?.addEventListener(
        "click",
        () => {

            removeSelectedVideo();
        }
    );


    function removeSelectedVideo() {

        if (videoObjectUrl) {

            URL.revokeObjectURL(
                videoObjectUrl
            );

            videoObjectUrl = null;
        }

        selectedVideoFile = null;

        reelVideo.pause();

        reelVideo.removeAttribute("src");

        reelVideo.load();

        reelVideo.hidden = true;

        videoEmpty.hidden = false;

        videoControls.hidden = true;

        videoActions.hidden = true;

        videoDuration.textContent =
            "0:00";

        updatePostButton();
    }


    /* =====================================================
       CAPTION
    ===================================================== */

    reelCaption?.addEventListener(
        "input",
        () => {

            const value =
                reelCaption.value.slice(0, 40);

            reelCaption.value = value;

            captionCount.textContent =
                `${value.length}/40`;

            if (value.length >= 40) {

                captionCount.classList.add(
                    "limit-reached"
                );

            } else {

                captionCount.classList.remove(
                    "limit-reached"
                );
            }
        }
    );


    /* =====================================================
       LOCATION
    ===================================================== */

    locationButton?.addEventListener(
        "click",
        () => {

            locationOverlay.hidden = false;

            setTimeout(() => {

                locationInput?.focus();

            }, 100);
        }
    );


    closeLocation?.addEventListener(
        "click",
        closeLocationSheet
    );


    locationOverlay?.addEventListener(
        "click",
        (event) => {

            if (
                event.target === locationOverlay
            ) {

                closeLocationSheet();
            }
        }
    );


    function closeLocationSheet() {

        locationOverlay.hidden = true;
    }


    /* =====================================================
       LOCATION SEARCH
    ===================================================== */

    locationInput?.addEventListener(
        "input",
        () => {

            const query =
                locationInput.value.trim();

            locationResults.innerHTML = "";

            if (!query) {
                return;
            }

            /*
             * Frontend demo suggestions.
             * Real location API can be connected later.
             */

            const suggestions = [
                query,
                `${query}, India`,
                `${query} City`
            ];

            suggestions.forEach(
                (location) => {

                    const button =
                        document.createElement("button");

                    button.type = "button";

                    button.className =
                        "location-result";

                    button.textContent =
                        location;

                    button.addEventListener(
                        "click",
                        () => {

                            selectedLocation =
                                location;

                            locationText.textContent =
                                location;

                            closeLocationSheet();
                        }
                    );

                    locationResults.appendChild(
                        button
                    );
                }
            );
        }
    );


    /* =====================================================
       AUDIENCE
    ===================================================== */

    audienceButton?.addEventListener(
        "click",
        () => {

            audienceOverlay.hidden = false;
        }
    );


    closeAudience?.addEventListener(
        "click",
        closeAudienceSheet
    );


    audienceOverlay?.addEventListener(
        "click",
        (event) => {

            if (
                event.target === audienceOverlay
            ) {

                closeAudienceSheet();
            }
        }
    );


    function closeAudienceSheet() {

        audienceOverlay.hidden = true;
    }


    audienceOptions.forEach(
        (option) => {

            option.addEventListener(
                "click",
                () => {

                    selectedAudience =
                        option.dataset.audience ||
                        "Everyone";

                    audienceText.textContent =
                        selectedAudience;

                    audienceOptions.forEach(
                        (item) => {

                            item.classList.remove(
                                "selected"
                            );
                        }
                    );

                    option.classList.add(
                        "selected"
                    );

                    closeAudienceSheet();
                }
            );
        }
    );


    /* =====================================================
       NEXT
    ===================================================== */

    reelNext?.addEventListener(
        "click",
        () => {

            if (!selectedVideoFile) {

                showMessage(
                    "Please select a video first."
                );

                return;
            }

            document
                .getElementById("reelCaption")
                ?.focus();
        }
    );


    /* =====================================================
       POST REEL
    ===================================================== */

    postReelButton?.addEventListener(
        "click",
        () => {

            if (!selectedVideoFile) {

                showMessage(
                    "Please select a video first."
                );

                return;
            }

            /*
             * Backend upload API will be connected here.
             */

            showMessage(
                "Reel is ready to upload."
            );
        }
    );


    /* =====================================================
       BACK
    ===================================================== */

    reelBack?.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "/static/home.html";
            }
        }
    );


    /* =====================================================
       POST BUTTON STATE
    ===================================================== */

    function updatePostButton() {

        if (!postReelButton) {
            return;
        }

        postReelButton.disabled =
            !selectedVideoFile;
    }


    /* =====================================================
       FORMAT TIME
    ===================================================== */

    function formatTime(seconds) {

        if (
            !Number.isFinite(seconds) ||
            seconds < 0
        ) {

            return "0:00";
        }

        const minutes =
            Math.floor(seconds / 60);

        const remaining =
            Math.floor(seconds % 60);

        return (
            `${minutes}:${String(
                remaining
            ).padStart(2, "0")}`
        );
    }


    /* =====================================================
       SIMPLE MESSAGE
    ===================================================== */

    function showMessage(message) {

        /*
         * Temporary frontend message.
         * Can later be replaced with Usanex toast system.
         */

        const existing =
            document.querySelector(
                ".reel-message"
            );

        existing?.remove();

        const messageBox =
            document.createElement("div");

        messageBox.className =
            "reel-message";

        messageBox.textContent =
            message;

        Object.assign(
            messageBox.style,
            {
                position: "fixed",
                left: "50%",
                bottom: "75px",
                transform: "translateX(-50%)",
                zIndex: "10000",
                padding: "10px 15px",
                borderRadius: "10px",
                background: "#151d28",
                border: "1px solid #263447",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "600",
                whiteSpace: "nowrap",
                boxShadow:
                    "0 10px 30px rgba(0,0,0,.35)"
            }
        );

        document.body.appendChild(
            messageBox
        );

        setTimeout(
            () => {

                messageBox.remove();

            },
            2200
        );
    }


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key !== "Escape") {
                return;
            }

            if (
                !locationOverlay.hidden
            ) {

                closeLocationSheet();

                return;
            }

            if (
                !audienceOverlay.hidden
            ) {

                closeAudienceSheet();

                return;
            }
        }
    );


    /* =====================================================
       CLEANUP
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        () => {

            if (videoObjectUrl) {

                URL.revokeObjectURL(
                    videoObjectUrl
                );
            }
        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updatePostButton();

});
