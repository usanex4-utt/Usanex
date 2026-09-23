document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       BOTTOM NAVIGATION
    ====================================================== */

    const homeNav =
        document.getElementById("homeNav");

    if (homeNav) {
        homeNav.addEventListener(
            "click",
            () => {
                window.location.href = "/home";
            }
        );
    }


    const reelNav =
        document.getElementById("reelNav");

    if (reelNav) {
        reelNav.addEventListener(
            "click",
            () => {
                window.location.href = "/reels";
            }
        );
    }


    const searchNav =
        document.getElementById("searchNav");

    if (searchNav) {
        searchNav.addEventListener(
            "click",
            () => {
                window.location.href = "/search";
            }
        );
    }


    const notificationNav =
        document.getElementById(
            "notificationNav"
        );

    if (notificationNav) {
        notificationNav.addEventListener(
            "click",
            () => {
                window.location.href =
                    "/notifications";
            }
        );
    }


    const profileNav =
        document.getElementById(
            "profileNav"
        );

    if (profileNav) {
        profileNav.addEventListener(
            "click",
            () => {
                window.location.href =
                    "/profile";
            }
        );
    }


    /* =====================================================
       CREATE REEL BUTTON
    ====================================================== */

    const cameraButton =
        document.getElementById(
            "cameraButton"
        );

    if (cameraButton) {
        cameraButton.addEventListener(
            "click",
            () => {
                alert(
                    "Create Reel will be available soon."
                );
            }
        );
    }


    /* =====================================================
       LIKE BUTTON
    ====================================================== */

    const likeButtons =
        document.querySelectorAll(
            '[data-action="like"]'
        );

    likeButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const countElement =
                        button.querySelector(
                            "span"
                        );

                    let count =
                        Number(
                            countElement?.textContent || 0
                        );

                    const isLiked =
                        button.classList.contains(
                            "liked"
                        );


                    if (isLiked) {

                        count =
                            Math.max(
                                0,
                                count - 1
                            );

                        button.classList.remove(
                            "liked"
                        );

                    } else {

                        count += 1;

                        button.classList.add(
                            "liked"
                        );
                    }


                    if (countElement) {
                        countElement.textContent =
                            count;
                    }

                }
            );

        }
    );


    /* =====================================================
       COMMENT BUTTON
    ====================================================== */

    const commentButtons =
        document.querySelectorAll(
            '[data-action="comment"]'
        );

    commentButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    alert(
                        "Comments will be available soon."
                    );

                }
            );

        }
    );


    /* =====================================================
       SHARE BUTTON
    ====================================================== */

    const shareButtons =
        document.querySelectorAll(
            '[data-action="share"]'
        );

    shareButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const shareData = {
                        title: "Usanex Reel",
                        text: "Check out this reel on Usanex.",
                        url: window.location.href
                    };


                    try {

                        if (
                            navigator.share
                        ) {

                            await navigator.share(
                                shareData
                            );

                        } else if (
                            navigator.clipboard
                        ) {

                            await navigator.clipboard.writeText(
                                window.location.href
                            );

                            alert(
                                "Reel link copied."
                            );

                        } else {

                            alert(
                                "Share is not available on this device."
                            );

                        }

                    } catch (error) {

                        if (
                            error?.name !==
                            "AbortError"
                        ) {

                            console.error(
                                "Share error:",
                                error
                            );

                        }

                    }

                }
            );

        }
    );


    /* =====================================================
       MORE BUTTON
    ====================================================== */

    const moreButtons =
        document.querySelectorAll(
            '[data-action="more"]'
        );

    moreButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    alert(
                        "More options will be available soon."
                    );

                }
            );

        }
    );


    /* =====================================================
       FOLLOW BUTTON
    ====================================================== */

    const followButton =
        document.getElementById(
            "followButton"
        );

    if (followButton) {

        followButton.addEventListener(
            "click",
            () => {

                const isFollowing =
                    followButton.classList.contains(
                        "following"
                    );


                if (isFollowing) {

                    followButton.classList.remove(
                        "following"
                    );

                    followButton.textContent =
                        "Follow";

                } else {

                    followButton.classList.add(
                        "following"
                    );

                    followButton.textContent =
                        "Following";

                }

            }
        );

    }


    /* =====================================================
       REEL VIDEO / SCROLL FOUNDATION
    ====================================================== */

    const reelsContainer =
        document.querySelector(
            ".reels-container"
        );

    if (reelsContainer) {

        let scrolling = false;

        reelsContainer.addEventListener(
            "scroll",
            () => {

                if (scrolling) {
                    return;
                }

                scrolling = true;

                window.requestAnimationFrame(
                    () => {
                        scrolling = false;
                    }
                );

            },
            {
                passive: true
            }
        );

    }


});
