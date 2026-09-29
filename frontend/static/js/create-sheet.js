/* =========================================================
   USANEX — CREATE SHEET
   create-sheet.js
   ========================================================= */

(function () {
    "use strict";

    /* =======================================================
       ELEMENTS
       ======================================================= */

    const overlay = document.getElementById("createOverlay");
    const sheet = document.getElementById("createSheet");
    const closeButton = document.getElementById("closeCreateSheet");

    if (!overlay || !sheet) {
        console.warn("Usanex Create Sheet: required elements not found.");
        return;
    }


    /* =======================================================
       OPEN
       ======================================================= */

    function openCreateSheet() {
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");

        document.body.classList.add("create-sheet-open");

        // Prevent background scrolling
        document.body.style.overflow = "hidden";

        // Reset animation
        sheet.style.animation = "none";

        requestAnimationFrame(() => {
            sheet.style.animation = "";
        });

        // Focus close button
        setTimeout(() => {
            if (closeButton) {
                closeButton.focus();
            }
        }, 100);
    }


    /* =======================================================
       CLOSE
       ======================================================= */

    function closeCreateSheet() {
        overlay.setAttribute("aria-hidden", "true");

        document.body.classList.remove("create-sheet-open");

        document.body.style.overflow = "";

        overlay.hidden = true;
    }


    /* =======================================================
       CLOSE BUTTON
       ======================================================= */

    if (closeButton) {
        closeButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            closeCreateSheet();
        });
    }


    /* =======================================================
       CLICK OUTSIDE
       ======================================================= */

    overlay.addEventListener("click", function (event) {

        // Only close when clicking dark background
        if (event.target === overlay) {
            closeCreateSheet();
        }
    });


    /* =======================================================
       PREVENT SHEET CLICK FROM CLOSING
       ======================================================= */

    sheet.addEventListener("click", function (event) {
        event.stopPropagation();
    });


    /* =======================================================
       ESCAPE KEY
       ======================================================= */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            if (!overlay.hidden) {
                closeCreateSheet();
            }
        }
    });


    /* =======================================================
       CREATE OPTIONS
       ======================================================= */

    const createOptions =
        document.querySelectorAll(".create-option");


    createOptions.forEach(function (option) {

        option.addEventListener("click", function () {

            const type =
                option.dataset.createType;

            if (!type) {
                return;
            }


            /* ===============================================
               REEL
               =============================================== */

            if (type === "reel") {

                closeCreateSheet();

                window.location.href =
                    "/static/reels.html?create=reel";

                return;
            }


            /* ===============================================
               IMAGE
               =============================================== */

            if (type === "image") {

                closeCreateSheet();

                window.location.href =
                    "/static/create-image.html";

                return;
            }


            /* ===============================================
               PRIVATE
               =============================================== */

            if (type === "private") {

                closeCreateSheet();

                window.location.href =
                    "/static/private.html";

                return;
            }


            /* ===============================================
               NEX MOMENT
               =============================================== */

            if (type === "moment") {

                closeCreateSheet();

                window.location.href =
                    "/static/status.html?create=moment";

                return;
            }

        });

    });


    /* =======================================================
       GLOBAL OPEN FUNCTION
       ======================================================= */

    window.openCreateSheet =
        openCreateSheet;

    window.closeCreateSheet =
        closeCreateSheet;


    /* =======================================================
       HOME CREATE BUTTON SUPPORT
       ======================================================= */

    document.addEventListener("click", function (event) {

        const button =
            event.target.closest(
                ".create-btn, [data-open-create], #openCreateSheet"
            );

        if (!button) {
            return;
        }

        event.preventDefault();

        openCreateSheet();
    });


    /* =======================================================
       TOUCH SWIPE DOWN TO CLOSE
       ======================================================= */

    let touchStartY = 0;
    let touchCurrentY = 0;

    sheet.addEventListener("touchstart", function (event) {

        if (!event.touches.length) {
            return;
        }

        touchStartY =
            event.touches[0].clientY;

        touchCurrentY =
            touchStartY;

    }, { passive: true });


    sheet.addEventListener("touchmove", function (event) {

        if (!event.touches.length) {
            return;
        }

        touchCurrentY =
            event.touches[0].clientY;

    }, { passive: true });


    sheet.addEventListener("touchend", function () {

        const difference =
            touchCurrentY - touchStartY;

        // Swipe down more than 80px
        if (difference > 80) {
            closeCreateSheet();
        }

        touchStartY = 0;
        touchCurrentY = 0;

    });


    /* =======================================================
       INITIAL STATE
       ======================================================= */

    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");


    console.log(
        "Usanex Create Sheet loaded successfully."
    );

})();
