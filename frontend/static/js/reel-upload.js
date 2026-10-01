"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const videoInput = document.getElementById("videoInput");
    const videoEmpty = document.getElementById("videoEmpty");
    const reelVideo = document.getElementById("reelVideo");
    const videoControls = document.getElementById("videoControls");
    const videoActions = document.getElementById("videoActions");

    const selectVideoButton = document.getElementById("selectVideoButton");
    const replaceVideo = document.getElementById("replaceVideo");
    const removeVideo = document.getElementById("removeVideo");

    const playPauseButton = document.getElementById("playPauseButton");
    const muteButton = document.getElementById("muteButton");
    const videoDuration = document.getElementById("videoDuration");

    const reelCaption = document.getElementById("reelCaption");
    const captionCount = document.getElementById("captionCount");

    const locationButton = document.getElementById("locationButton");
    const locationOverlay = document.getElementById("locationOverlay");
    const closeLocation = document.getElementById("closeLocation");
    const locationInput = document.getElementById("locationInput");
    const locationResults = document.getElementById("locationResults");
    const locationText = document.getElementById("locationText");

    const audienceButton = document.getElementById("audienceButton");
    const audienceOverlay = document.getElementById("audienceOverlay");
    const closeAudience = document.getElementById("closeAudience");
    const audienceText = document.getElementById("audienceText");
    const audienceOptions =
        document.querySelectorAll(".audience-option");

    const postReelButton = document.getElementById("postReelButton");
    const reelBack = document.getElementById("reelBack");
    const reelNext = document.getElementById("reelNext");

    const commentsToggle =
        document.getElementById("commentsToggle");

    const sharingToggle =
        document.getElementById("sharingToggle");


    let selectedVideoFile = null;
    let videoObjectUrl = null;
    let selectedLocation = "";
    let selectedAudience = "Everyone";
    let uploading = false;


    /* =====================================================
       FILE PICKER
    ===================================================== */

    function openVideoPicker() {
        if (!videoInput || uploading) return;

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

            const file = videoInput.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("video/")) {
                showMessage("Please select a valid video.");
                return;
            }

            if (file.size > 100 * 1024 * 1024) {
                showMessage("Video must be under 100 MB.");
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
            URL.revokeObjectURL(videoObjectUrl);
        }

        videoObjectUrl =
            URL.createObjectURL(file);

        reelVideo.src = videoObjectUrl;

        reelVideo.hidden = false;
        videoEmpty.hidden = true;
        videoControls.hidden = false;
        videoActions.hidden = false;

        reelVideo.muted = false;

        playPauseButton.textContent = "▶";
        muteButton.textContent = "🔊";

        updatePostButton();
    }


    /* =====================================================
       VIDEO METADATA
    ===================================================== */

    reelVideo?.addEventListener(
        "loadedmetadata",
        () => {

            videoDuration.textContent =
                formatTime(reelVideo.duration);
        }
    );


    /* =====================================================
       PLAY / PAUSE
    ===================================================== */

    playPauseButton?.addEventListener(
        "click",
        () => {

            if (!reelVideo.src) return;

            if (reelVideo.paused) {
                reelVideo.play().catch(() => {});
            } else {
                reelVideo.pause();
            }
        }
    );

    reelVideo?.addEventListener(
        "play",
        () => {
            playPauseButton.textContent = "❚❚";
        }
    );

    reelVideo?.addEventListener(
        "pause",
        () => {
            playPauseButton.textContent = "▶";
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
       REMOVE
    ===================================================== */

    removeVideo?.addEventListener(
        "click",
        () => {

            if (videoObjectUrl) {
                URL.revokeObjectURL(videoObjectUrl);
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

            videoDuration.textContent = "0:00";

            updatePostButton();
        }
    );


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
        }
    );


    /* =====================================================
       LOCATION
    ===================================================== */

    locationButton?.addEventListener(
        "click",
        () => {

            locationOverlay.hidden = false;

            setTimeout(
                () => locationInput?.focus(),
                100
            );
        }
    );

    closeLocation?.addEventListener(
        "click",
        closeLocationSheet
    );

    locationOverlay?.addEventListener(
        "click",
        event => {

            if (event.target === locationOverlay) {
                closeLocationSheet();
            }
        }
    );

    function closeLocationSheet() {
        locationOverlay.hidden = true;
    }


    locationInput?.addEventListener(
        "input",
        () => {

            const query =
                locationInput.value.trim();

            locationResults.innerHTML = "";

            if (!query) return;

            [
                query,
                `${query}, India`,
                `${query} City`
            ].forEach(location => {

                const button =
                    document.createElement("button");

                button.type = "button";
                button.className = "location-result";
                button.textContent = location;

                button.addEventListener(
                    "click",
                    () => {

                        selectedLocation = location;

                        locationText.textContent =
                            location;

                        closeLocationSheet();
                    }
                );

                locationResults.appendChild(button);
            });
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
        event => {

            if (event.target === audienceOverlay) {
                closeAudienceSheet();
            }
        }
    );

    function closeAudienceSheet() {
        audienceOverlay.hidden = true;
    }

    audienceOptions.forEach(option => {

        option.addEventListener(
            "click",
            () => {

                selectedAudience =
                    option.dataset.audience ||
                    "Everyone";

                audienceText.textContent =
                    selectedAudience;

                audienceOptions.forEach(item => {
                    item.classList.remove("selected");
                });

                option.classList.add("selected");

                closeAudienceSheet();
            }
        );
    });


    /* =====================================================
       NEXT
    ===================================================== */

    reelNext?.addEventListener(
        "click",
        () => {

            if (!selectedVideoFile) {
                showMessage("Please select a video first.");
                return;
            }

            reelCaption?.focus();
        }
    );


    /* =====================================================
       REAL API UPLOAD
    ===================================================== */

    postReelButton?.addEventListener(
        "click",
        uploadReel
    );


    async function uploadReel() {

        if (uploading) return;

        if (!selectedVideoFile) {
            showMessage("Please select a video first.");
            return;
        }

        uploading = true;

        postReelButton.disabled = true;
        postReelButton.textContent = "Uploading...";


        try {

            const formData = new FormData();

            /*
             * IMPORTANT:
             * These names MUST match backend/routes/reels.py
             */

            formData.append(
                "video",
                selectedVideoFile
            );

            formData.append(
                "caption",
                reelCaption?.value.trim() || ""
            );

            /*
             * Backend currently accepts hashtags,
             * language and category.
             */

            formData.append(
                "hashtags",
                ""
            );

            formData.append(
                "language",
                "en"
            );

            formData.append(
                "category",
                "reels"
            );


            const response =
                await fetch(
                    "/api/reels/upload",
                    {
                        method: "POST",

                        credentials: "include",

                        body: formData
                    }
                );


            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }


            if (!response.ok) {

                throw new Error(
                    data?.detail ||
                    data?.message ||
                    "Reel upload failed"
                );
            }


            if (!data?.success) {

                throw new Error(
                    data?.message ||
                    "Reel upload failed"
                );
            }


            showMessage(
                "Reel uploaded successfully!"
            );


            /*
             * Go back to Reels after successful upload.
             */

            setTimeout(
                () => {

                    window.location.href =
                        "/reels";

                },
                1000
            );


        } catch (error) {

            console.error(
                "REEL UPLOAD ERROR:",
                error
            );

            showMessage(
                error.message ||
                "Unable to upload reel."
            );


        } finally {

            uploading = false;

            if (postReelButton) {

                postReelButton.disabled =
                    !selectedVideoFile;

                postReelButton.textContent =
                    "Post Reel";
            }
        }
    }


    /* =====================================================
       BACK
    ===================================================== */

    reelBack?.addEventListener(
        "click",
        () => {

            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "/reels";
            }
        }
    );


    /* =====================================================
       POST BUTTON
    ===================================================== */

    function updatePostButton() {

        if (!postReelButton) return;

        postReelButton.disabled =
            !selectedVideoFile ||
            uploading;
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
       MESSAGE
    ===================================================== */

    function showMessage(message) {

        document
            .querySelector(".reel-message")
            ?.remove();

        const box =
            document.createElement("div");

        box.className =
            "reel-message";

        box.textContent =
            message;

        Object.assign(
            box.style,
            {
                position: "fixed",
                left: "50%",
                bottom: "85px",
                transform: "translateX(-50%)",
                zIndex: "10000",
                padding: "11px 16px",
                borderRadius: "12px",
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

        document.body.appendChild(box);

        setTimeout(
            () => box.remove(),
            2500
        );
    }


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") return;

            if (!locationOverlay.hidden) {
                closeLocationSheet();
                return;
            }

            if (!audienceOverlay.hidden) {
                closeAudienceSheet();
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
                URL.revokeObjectURL(videoObjectUrl);
            }
        }
    );


    updatePostButton();

});
