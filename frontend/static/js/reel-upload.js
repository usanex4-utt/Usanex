/* =========================================================
   USANEX REEL UPLOAD
   Production Frontend Controller
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

    let isUploading = false;


    /* =====================================================
       OPEN VIDEO PICKER
    ===================================================== */

    function openVideoPicker() {

        if (!videoInput || isUploading) {
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


            if (
                !file.type ||
                !file.type.startsWith("video/")
            ) {

                showMessage(
                    "Please select a valid video."
                );

                videoInput.value = "";

                return;
            }


            /*
             * Backend limit = 100 MB
             */

            const MAX_SIZE =
                100 * 1024 * 1024;

            if (file.size > MAX_SIZE) {

                showMessage(
                    "Video must be smaller than 100 MB."
                );

                videoInput.value = "";

                return;
            }


            selectedVideoFile = file;

            loadVideo(file);
        }
    );


    /* =====================================================
       LOAD VIDEO PREVIEW
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

        videoDuration.textContent =
            "0:00";


        updatePostButton();
    }


    /* =====================================================
       VIDEO METADATA
    ===================================================== */

    reelVideo?.addEventListener(
        "loadedmetadata",
        () => {

            videoDuration.textContent =
                formatTime(
                    reelVideo.duration
                );
        }
    );


    /* =====================================================
       PLAY / PAUSE
    ===================================================== */

    playPauseButton?.addEventListener(
        "click",
        () => {

            if (
                !reelVideo ||
                !reelVideo.src
            ) {
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

            if (playPauseButton) {

                playPauseButton.textContent =
                    "❚❚";
            }
        }
    );


    reelVideo?.addEventListener(
        "pause",
        () => {

            if (playPauseButton) {

                playPauseButton.textContent =
                    "▶";
            }
        }
    );


    /* =====================================================
       MUTE
    ===================================================== */

    muteButton?.addEventListener(
        "click",
        () => {

            if (!reelVideo) {
                return;
            }

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

            if (isUploading) {
                return;
            }

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


        if (reelVideo) {

            reelVideo.pause();

            reelVideo.removeAttribute(
                "src"
            );

            reelVideo.load();

            reelVideo.hidden = true;
        }


        if (videoEmpty) {
            videoEmpty.hidden = false;
        }

        if (videoControls) {
            videoControls.hidden = true;
        }

        if (videoActions) {
            videoActions.hidden = true;
        }

        if (videoDuration) {
            videoDuration.textContent =
                "0:00";
        }


        if (videoInput) {
            videoInput.value = "";
        }


        updatePostButton();
    }


    /* =====================================================
       CAPTION
    ===================================================== */

    reelCaption?.addEventListener(
        "input",
        () => {

            const value =
                reelCaption.value
                    .slice(0, 40);


            reelCaption.value =
                value;


            if (captionCount) {

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
        }
    );


    /* =====================================================
       LOCATION
    ===================================================== */

    locationButton?.addEventListener(
        "click",
        () => {

            if (isUploading) {
                return;
            }

            locationOverlay.hidden =
                false;


            setTimeout(
                () => {

                    locationInput?.focus();

                },
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
        (event) => {

            if (
                event.target ===
                locationOverlay
            ) {

                closeLocationSheet();
            }
        }
    );


    function closeLocationSheet() {

        if (locationOverlay) {

            locationOverlay.hidden =
                true;
        }
    }


    /* =====================================================
       LOCATION SEARCH
    ===================================================== */

    locationInput?.addEventListener(
        "input",
        () => {

            const query =
                locationInput.value.trim();


            locationResults.innerHTML =
                "";


            if (!query) {
                return;
            }


            const suggestions = [

                query,

                `${query}, India`,

                `${query} City`

            ];


            suggestions.forEach(
                (location) => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "location-result";


                    button.textContent =
                        location;


                    button.addEventListener(
                        "click",
                        () => {

                            selectedLocation =
                                location;


                            if (locationText) {

                                locationText.textContent =
                                    location;
                            }


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

            if (isUploading) {
                return;
            }

            audienceOverlay.hidden =
                false;
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
                event.target ===
                audienceOverlay
            ) {

                closeAudienceSheet();
            }
        }
    );


    function closeAudienceSheet() {

        if (audienceOverlay) {

            audienceOverlay.hidden =
                true;
        }
    }


    audienceOptions.forEach(
        (option) => {

            option.addEventListener(
                "click",
                () => {

                    selectedAudience =
                        option.dataset.audience ||
                        "Everyone";


                    if (audienceText) {

                        audienceText.textContent =
                            selectedAudience;
                    }


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


            reelCaption?.focus();
        }
    );


    /* =====================================================
       REAL REEL UPLOAD
    ===================================================== */

    postReelButton?.addEventListener(
        "click",
        async () => {

            if (isUploading) {
                return;
            }


            if (!selectedVideoFile) {

                showMessage(
                    "Please select a video first."
                );

                return;
            }


            const originalText =
                postReelButton.textContent;


            try {

                isUploading = true;

                postReelButton.disabled =
                    true;

                postReelButton.textContent =
                    "Uploading...";


                /*
                 * FormData is required because
                 * video is a multipart file.
                 */

                const formData =
                    new FormData();


                formData.append(
                    "video",
                    selectedVideoFile
                );


                const caption =
                    reelCaption?.value.trim() ||
                    "";


                if (caption) {

                    formData.append(
                        "caption",
                        caption
                    );
                }


                /*
                 * Backend accepts these fields.
                 */

                if (selectedLocation) {

                    formData.append(
                        "location",
                        selectedLocation
                    );
                }


                formData.append(
                    "category",
                    "general"
                );


                /*
                 * Send authenticated request.
                 */

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

                    data =
                        await response.json();

                } catch {

                    data = null;
                }


                if (!response.ok) {

                    throw new Error(
                        data?.detail ||
                        data?.message ||
                        `Upload failed (${response.status})`
                    );
                }


                if (!data?.success) {

                    throw new Error(
                        data?.message ||
                        "Reel upload failed."
                    );
                }


                /*
                 * Success
                 */

                postReelButton.textContent =
                    "Uploaded ✓";


                showMessage(
                    "Reel uploaded successfully!"
                );


                /*
                 * Give backend a moment,
                 * then return to Reels.
                 */

                setTimeout(
                    () => {

                        window.location.href =
                            "/static/reels.html";

                    },
                    900
                );

            } catch (error) {

                console.error(
                    "USANEX REEL UPLOAD ERROR:",
                    error
                );


                isUploading = false;


                postReelButton.disabled =
                    false;


                postReelButton.textContent =
                    originalText;


                showMessage(
                    error?.message ||
                    "Unable to upload reel."
                );
            }
        }
    );


    /* =====================================================
       BACK
    ===================================================== */

    reelBack?.addEventListener(
        "click",
        () => {

            if (isUploading) {
                return;
            }


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
            !selectedVideoFile ||
            isUploading;
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
            Math.floor(
                seconds / 60
            );


        const remaining =
            Math.floor(
                seconds % 60
            );


        return (
            `${minutes}:${String(
                remaining
            ).padStart(2, "0")}`
        );
    }


    /* =====================================================
       MESSAGE / TOAST
    ===================================================== */

    function showMessage(message) {

        const existing =
            document.querySelector(
                ".reel-message"
            );


        existing?.remove();


        const messageBox =
            document.createElement(
                "div"
            );


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

                transform:
                    "translateX(-50%)",

                zIndex: "10000",

                padding:
                    "11px 16px",

                borderRadius:
                    "12px",

                background:
                    "#151d28",

                border:
                    "1px solid #263447",

                color:
                    "#ffffff",

                fontSize:
                    "12px",

                fontWeight:
                    "600",

                maxWidth:
                    "calc(100vw - 30px)",

                textAlign:
                    "center",

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
            2500
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
                locationOverlay &&
                !locationOverlay.hidden
            ) {

                closeLocationSheet();

                return;
            }


            if (
                audienceOverlay &&
                !audienceOverlay.hidden
            ) {

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

                URL.revokeObjectURL(
                    videoObjectUrl
                );

                videoObjectUrl = null;
            }
        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updatePostButton();

});
