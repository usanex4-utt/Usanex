"use strict";

/* =========================================================
   USANEX — CREATE SHEET
========================================================= */

(function () {

    function loadCreateSheet() {

        if (document.getElementById("createOverlay")) {
            return;
        }

        const overlay = document.createElement("div");

        overlay.id = "createOverlay";

        overlay.innerHTML = `
            <div class="create-sheet">

                <div class="create-handle"></div>

                <div class="create-header">

                    <div>
                        <h2>Create</h2>
                        <p>Share something on Usanex</p>
                    </div>

                    <button
                        type="button"
                        class="create-close"
                        id="closeCreateSheet"
                    >
                        ×
                    </button>

                </div>

                <div class="create-options">

                    <button
                        type="button"
                        class="create-option"
                        data-create-type="reel"
                    >
                        <span class="create-line-icon reel-icon">
                            <span></span>
                        </span>

                        <span class="create-option-text">
                            <strong>Reel</strong>
                            <small>Create a video reel</small>
                        </span>

                        <span class="create-arrow">›</span>
                    </button>


                    <button
                        type="button"
                        class="create-option"
                        data-create-type="image"
                    >
                        <span class="create-line-icon image-icon">
                            <span></span>
                        </span>

                        <span class="create-option-text">
                            <strong>Image</strong>
                            <small>Share photos</small>
                        </span>

                        <span class="create-arrow">›</span>
                    </button>


                    <button
                        type="button"
                        class="create-option"
                        data-create-type="moment"
                    >
                        <span class="create-line-icon moment-icon">
                            <span></span>
                        </span>

                        <span class="create-option-text">
                            <strong>Nex Moment</strong>
                            <small>Share your moment</small>
                        </span>

                        <span class="create-arrow">›</span>
                    </button>


                    <button
                        type="button"
                        class="create-option"
                        data-create-type="private"
                    >
                        <span class="create-line-icon private-icon">
                            <span></span>
                        </span>

                        <span class="create-option-text">
                            <strong>Private</strong>
                            <small>Share privately</small>
                        </span>

                        <span class="create-arrow">›</span>
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        setupCreateSheet();

    }


    function setupCreateSheet() {

        const overlay =
            document.getElementById("createOverlay");

        if (!overlay) {
            return;
        }


        const closeButton =
            document.getElementById("closeCreateSheet");


        closeButton?.addEventListener(
            "click",
            closeCreateSheet
        );


        overlay.addEventListener(
            "click",
            function (event) {

                if (event.target === overlay) {
                    closeCreateSheet();
                }

            }
        );


        overlay
            .querySelectorAll(".create-option")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const type =
                            button.dataset.createType;

                        openCreateType(type);

                    }
                );

            });

    }


    function openCreateSheet() {

        loadCreateSheet();

        const overlay =
            document.getElementById("createOverlay");

        if (!overlay) {
            return;
        }

        requestAnimationFrame(function () {

            overlay.classList.add("active");

        });

        document.body.style.overflow = "hidden";

    }


    function closeCreateSheet() {

        const overlay =
            document.getElementById("createOverlay");

        if (!overlay) {
            return;
        }

        overlay.classList.remove("active");

        document.body.style.overflow = "";

    }


    function openCreateType(type) {

        closeCreateSheet();

        /*
         * फिलहाल सभी create options
         * उसी media upload page पर जाएंगे।
         *
         * बाद में अलग-अलग upload flow
         * जोड़ सकते हैं।
         */

        const url =
            "/media-upload?type=" +
            encodeURIComponent(type);

        window.location.href = url;

    }


    /*
     * Global function
     *
     * Home / Reels / Profile /
     * My Profile किसी भी page से:
     *
     * openUsanexCreate()
     */

    window.openUsanexCreate =
        openCreateSheet;


    /*
     * Automatically load CSS
     */

    if (
        !document.querySelector(
            'link[data-usanex-create-css]'
        )
    ) {

        const css =
            document.createElement("link");

        css.rel = "stylesheet";

        css.href =
            "/static/css/create-sheet.css?v=1";

        css.dataset.usanexCreateCss =
            "true";

        document.head.appendChild(css);

    }


    /*
     * Prepare after page loaded
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            loadCreateSheet
        );

    } else {

        loadCreateSheet();

    }

})();
