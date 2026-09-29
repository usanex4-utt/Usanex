/* =========================================================
   USANEX — COMMON CREATE SHEET
   Home / Reels / Profile / My Profile
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const createSheetState = {
    initialized: false
};


/* =========================================================
   INITIALIZE
========================================================= */

function initCreateSheet() {

    if (createSheetState.initialized) {
        return;
    }

    createSheetState.initialized = true;

    injectCreateSheet();

    bindCreateButtons();

    bindCreateSheetEvents();

}


/* =========================================================
   INJECT CREATE SHEET
========================================================= */

function injectCreateSheet() {

    if (
        document.getElementById("createSheet")
    ) {
        return;
    }


    const wrapper =
        document.createElement("div");


    wrapper.innerHTML = `

        <!-- =================================================
             BACKDROP
        ================================================== -->

        <div
            id="createSheetBackdrop"
            aria-hidden="true"
        ></div>


        <!-- =================================================
             CREATE BOTTOM SHEET
        ================================================== -->

        <section
            id="createSheet"
            aria-hidden="true"
            role="dialog"
            aria-modal="true"
            aria-labelledby="createSheetTitle"
        >

            <!-- DRAG HANDLE -->

            <div class="create-sheet-handle"></div>


            <!-- HEADER -->

            <div class="create-sheet-header">

                <h2
                    id="createSheetTitle"
                    class="create-sheet-title"
                >
                    Create
                </h2>


                <button
                    type="button"
                    id="createSheetClose"
                    class="create-sheet-close"
                    aria-label="Close Create"
                >
                    ×
                </button>

            </div>


            <!-- =================================================
                 CREATE OPTIONS
            ================================================== -->

            <div class="create-options">


                <!-- =================================================
                     REEL
                ================================================== -->

                <button
                    type="button"
                    class="create-option"
                    data-create-type="reel"
                >

                    <span
                        class="create-option-icon"
                        aria-hidden="true"
                    >

                        <svg
                            viewBox="0 0 24 24"
                        >

                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="16"
                                rx="3"
                            ></rect>

                            <path
                                d="M8 4l3 4"
                            ></path>

                            <path
                                d="M13 4l3 4"
                            ></path>

                            <path
                                d="M10 10l5 3-5 3z"
                            ></path>

                        </svg>

                    </span>


                    <span class="create-option-name">
                        Reel
                    </span>

                </button>


                <!-- =================================================
                     IMAGE
                ================================================== -->

                <button
                    type="button"
                    class="create-option"
                    data-create-type="image"
                >

                    <span
                        class="create-option-icon"
                        aria-hidden="true"
                    >

                        <svg
                            viewBox="0 0 24 24"
                        >

                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="16"
                                rx="3"
                            ></rect>

                            <circle
                                cx="8.5"
                                cy="9"
                                r="1.5"
                            ></circle>

                            <path
                                d="M4 17l5-5 3.5 3.5 2.5-2.5 5 5"
                            ></path>

                        </svg>

                    </span>


                    <span class="create-option-name">
                        Image
                    </span>

                </button>


                <!-- =================================================
                     NEX MOMENT
                ================================================== -->

                <button
                    type="button"
                    class="create-option"
                    data-create-type="moment"
                >

                    <span
                        class="create-option-icon"
                        aria-hidden="true"
                    >

                        <svg
                            viewBox="0 0 24 24"
                        >

                            <circle
                                cx="12"
                                cy="12"
                                r="8.5"
                            ></circle>

                            <circle
                                cx="12"
                                cy="12"
                                r="5.5"
                            ></circle>

                            <circle
                                cx="12"
                                cy="12"
                                r="2"
                            ></circle>

                        </svg>

                    </span>


                    <span class="create-option-name">
                        Nex Moment
                    </span>

                </button>


                <!-- =================================================
                     PRIVATE
                ================================================== -->

                <button
                    type="button"
                    class="create-option"
                    data-create-type="private"
                >

                    <span
                        class="create-option-icon"
                        aria-hidden="true"
                    >

                        <svg
                            viewBox="0 0 24 24"
                        >

                            <rect
                                x="5"
                                y="10"
                                width="14"
                                height="10"
                                rx="2"
                            ></rect>

                            <path
                                d="M8 10V7a4 4 0 018 0v3"
                            ></path>

                            <circle
                                cx="12"
                                cy="15"
                                r="1"
                            ></circle>

                            <path
                                d="M12 16v2"
                            ></path>

                        </svg>

                    </span>


                    <span class="create-option-name">
                        Private
                    </span>

                </button>


            </div>

        </section>

    `;


    while (
        wrapper.firstElementChild
    ) {

        document.body.appendChild(
            wrapper.firstElementChild
        );

    }

}


/* =========================================================
   FIND EXISTING + BUTTONS
========================================================= */

function bindCreateButtons() {

    const selectors = [

        "#createButton",

        "#addButton",

        "#plusButton",

        ".create-button",

        ".add-button",

        ".plus-button",

        "[data-action='create']",

        "[data-action='add']",

        "[data-create='true']"

    ];


    const buttons = [];


    selectors.forEach(
        selector => {

            document
                .querySelectorAll(selector)
                .forEach(button => {

                    if (
                        !buttons.includes(button)
                    ) {

                        buttons.push(button);

                    }

                });

        }
    );


    buttons.forEach(
        button => {

            if (
                button.dataset.createSheetBound ===
                "true"
            ) {

                return;

            }


            button.dataset.createSheetBound =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    openCreateSheet();

                }
            );

        }
    );

}


/* =========================================================
   SHEET EVENTS
========================================================= */

function bindCreateSheetEvents() {

    const backdrop =
        document.getElementById(
            "createSheetBackdrop"
        );


    const closeButton =
        document.getElementById(
            "createSheetClose"
        );


    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closeCreateSheet
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeCreateSheet
        );

    }


    document
        .querySelectorAll(
            "[data-create-type]"
        )
        .forEach(
            option => {

                option.addEventListener(
                    "click",
                    () => {

                        const type =
                            option.dataset.createType;


                        handleCreateType(
                            type
                        );

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeCreateSheet();

            }

        }
    );

}


/* =========================================================
   OPEN CREATE SHEET
========================================================= */

function openCreateSheet() {

    const sheet =
        document.getElementById(
            "createSheet"
        );


    const backdrop =
        document.getElementById(
            "createSheetBackdrop"
        );


    if (
        !sheet ||
        !backdrop
    ) {

        return;

    }


    sheet.classList.add(
        "active"
    );


    backdrop.classList.add(
        "active"
    );


    sheet.setAttribute(
        "aria-hidden",
        "false"
    );


    backdrop.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE CREATE SHEET
========================================================= */

function closeCreateSheet() {

    const sheet =
        document.getElementById(
            "createSheet"
        );


    const backdrop =
        document.getElementById(
            "createSheetBackdrop"
        );


    if (sheet) {

        sheet.classList.remove(
            "active"
        );


        sheet.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (backdrop) {

        backdrop.classList.remove(
            "active"
        );


        backdrop.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   HANDLE CREATE OPTION
========================================================= */

function handleCreateType(
    type
) {

    closeCreateSheet();


    switch (type) {


        /* =================================================
           REEL
        ================================================== */

        case "reel":

            window.location.href =
                "/media-upload?type=reel";

            break;


        /* =================================================
           IMAGE
        ================================================== */

        case "image":

            window.location.href =
                "/media-upload?type=image";

            break;


        /* =================================================
           NEX MOMENT
        ================================================== */

        case "moment":

            window.location.href =
                "/media-upload?type=moment";

            break;


        /* =================================================
           PRIVATE
        ================================================== */

        case "private":

            window.location.href =
                "/media-upload?type=private";

            break;


        default:

            console.warn(
                "Unknown create type:",
                type
            );

    }

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initCreateSheet
    );

} else {

    initCreateSheet();

}


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Usanex Create Sheet loaded — Reel, Image, Nex Moment, Private."
);
