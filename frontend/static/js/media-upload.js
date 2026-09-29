
"use strict";


/* =========================================================
   STATE
========================================================= */

const uploadState = {

    type: "photo",

    visibility: "public",

    photos: [],

    reel: null,

    privateMedia: []

};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initUploadPage();

    }
);


/* =========================================================
   INIT
========================================================= */

function initUploadPage() {

    setupBackButton();

    setupMediaTypes();

    setupPhotos();

    setupReel();

    setupPrivateMedia();

    setupCaption();

    setupVisibility();

    updatePostButton();

}


/* =========================================================
   BACK
========================================================= */

function setupBackButton() {

    const button =
        document.getElementById(
            "backButton"
        );

    button?.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );

}


/* =========================================================
   MEDIA TYPES
========================================================= */

function setupMediaTypes() {

    document
        .querySelectorAll(
            ".media-type"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const type =
                            button.dataset.type;

                        uploadState.type =
                            type;


                        document
                            .querySelectorAll(
                                ".media-type"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        showUploadSection(
                            type
                        );

                        updatePostButton();

                    }
                );

            }
        );

}


/* =========================================================
   SHOW SECTION
========================================================= */

function showUploadSection(
    type
) {

    const photo =
        document.getElementById(
            "photoSection"
        );

    const reel =
        document.getElementById(
            "reelSection"
        );

    const privateSection =
        document.getElementById(
            "privateSection"
        );


    photo.hidden =
        type !== "photo";

    reel.hidden =
        type !== "reel";

    privateSection.hidden =
        type !== "private";

}


/* =========================================================
   PHOTOS
========================================================= */

function setupPhotos() {

    const button =
        document.getElementById(
            "selectPhotosButton"
        );

    const addMore =
        document.getElementById(
            "addMorePhotos"
        );

    const input =
        document.getElementById(
            "photoInput"
        );


    button?.addEventListener(
        "click",
        () => input.click()
    );


    addMore?.addEventListener(
        "click",
        () => input.click()
    );


    input?.addEventListener(
        "change",
        event => {

            const files =
                Array.from(
                    event.target.files || []
                );


            addPhotos(
                files
            );


            input.value = "";

        }
    );

}


/* =========================================================
   ADD PHOTOS
========================================================= */

function addPhotos(
    files
) {

    const imageFiles =
        files.filter(
            file =>
                file.type.startsWith(
                    "image/"
                )
        );


    uploadState.photos.push(
        ...imageFiles
    );


    renderPhotos();

    updatePostButton();

}


/* =========================================================
   RENDER PHOTOS
========================================================= */

function renderPhotos() {

    const section =
        document.getElementById(
            "photoPreviewSection"
        );

    const grid =
        document.getElementById(
            "photoGrid"
        );

    const count =
        document.getElementById(
            "photoCount"
        );


    if (!uploadState.photos.length) {

        section.hidden = true;

        return;

    }


    section.hidden = false;


    count.textContent =
        uploadState.photos.length +
        (
            uploadState.photos.length === 1
                ? " photo"
                : " photos"
        );


    grid.innerHTML = "";


    uploadState.photos.forEach(
        (
            file,
            index
        ) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "photo-item";


            const image =
                document.createElement(
                    "img"
                );

            const url =
                URL.createObjectURL(
                    file
                );

            image.src =
                url;


            image.onload = () => {

                URL.revokeObjectURL(
                    url
                );

            };


            const number =
                document.createElement(
                    "span"
                );

            number.className =
                "photo-number";

            number.textContent =
                "#" +
                (index + 1);


            const remove =
                document.createElement(
                    "button"
                );

            remove.type =
                "button";

            remove.className =
                "remove-photo";

            remove.textContent =
                "×";


            remove.addEventListener(
                "click",
                () => {

                    uploadState.photos.splice(
                        index,
                        1
                    );

                    renderPhotos();

                    updatePostButton();

                }
            );


            item.appendChild(
                image
            );

            item.appendChild(
                number
            );

            item.appendChild(
                remove
            );


            grid.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   REEL
========================================================= */

function setupReel() {

    const button =
        document.getElementById(
            "selectReelButton"
        );

    const input =
        document.getElementById(
            "reelInput"
        );

    button?.addEventListener(
        "click",
        () => input.click()
    );


    input?.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];

            if (!file) {

                return;

            }


            if (
                !file.type.startsWith(
                    "video/"
                )
            ) {

                alert(
                    "Please select a video."
                );

                return;

            }


            uploadState.reel =
                file;


            renderVideo();

            updatePostButton();

        }
    );

}


/* =========================================================
   VIDEO PREVIEW
========================================================= */

function renderVideo() {

    const container =
        document.getElementById(
            "videoPreview"
        );


    if (!uploadState.reel) {

        container.hidden = true;

        container.innerHTML = "";

        return;

    }


    container.hidden = false;

    container.innerHTML = "";


    const video =
        document.createElement(
            "video"
        );


    video.controls = true;

    video.playsInline = true;

    video.src =
        URL.createObjectURL(
            uploadState.reel
        );


    container.appendChild(
        video
    );

}


/* =========================================================
   PRIVATE MEDIA
========================================================= */

function setupPrivateMedia() {

    const button =
        document.getElementById(
            "selectPrivateButton"
        );

    const input =
        document.getElementById(
            "privateInput"
        );


    button?.addEventListener(
        "click",
        () => input.click()
    );


    input?.addEventListener(
        "change",
        event => {

            uploadState.privateMedia =
                Array.from(
                    event.target.files || []
                );

            updatePostButton();

        }
    );

}


/* =========================================================
   CAPTION
========================================================= */

function setupCaption() {

    const input =
        document.getElementById(
            "captionInput"
        );

    const counter =
        document.getElementById(
            "captionCount"
        );


    input?.addEventListener(
        "input",
        () => {

            counter.textContent =
                input.value.length;

            updatePostButton();

        }
    );

}


/* =========================================================
   VISIBILITY
========================================================= */

function setupVisibility() {

    document
        .querySelectorAll(
            ".visibility-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        uploadState.visibility =
                            button.dataset.visibility;


                        document
                            .querySelectorAll(
                                ".visibility-option"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        const privateUsers =
                            document.getElementById(
                                "privateUsers"
                            );


                        privateUsers.hidden =
                            uploadState.visibility !==
                            "private";

                    }
                );

            }
        );

}


/* =========================================================
   POST BUTTON
========================================================= */

function updatePostButton() {

    const button =
        document.getElementById(
            "postButton"
        );


    let hasMedia = false;


    if (
        uploadState.type ===
        "photo"
    ) {

        hasMedia =
            uploadState.photos.length >
            0;

    }


    if (
        uploadState.type ===
        "reel"
    ) {

        hasMedia =
            Boolean(
                uploadState.reel
            );

    }


    if (
        uploadState.type ===
        "private"
    ) {

        hasMedia =
            uploadState.privateMedia.length >
            0;

    }


    button.disabled =
        !hasMedia;

}


/* =========================================================
   CREATE POST
========================================================= */

document
    .getElementById(
        "postButton"
    )
    ?.addEventListener(
        "click",
        () => {

            const caption =
                document.getElementById(
                    "captionInput"
                ).value.trim();


            console.log(
                "USANEX UPLOAD DATA",
                {
                    type:
                        uploadState.type,

                    visibility:
                        uploadState.visibility,

                    photos:
                        uploadState.photos,

                    reel:
                        uploadState.reel,

                    privateMedia:
                        uploadState.privateMedia,

                    caption
                }
            );


            alert(
                "Frontend ready. Backend upload will be connected next."
            );

        }
    );
