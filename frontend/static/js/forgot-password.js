"use strict";


/* =========================================================
   USANEX FORGOT PASSWORD
========================================================= */

const API_BASE_URL = "";


/* =========================================================
   ELEMENTS
========================================================= */

const stepIdentifier =
    document.getElementById("stepIdentifier");

const stepOtp =
    document.getElementById("stepOtp");

const stepSuccess =
    document.getElementById("stepSuccess");


const sendOtpForm =
    document.getElementById("sendOtpForm");

const identifierInput =
    document.getElementById("identifier");

const sendOtpButton =
    document.getElementById("sendOtpButton");

const identifierMessage =
    document.getElementById("identifierMessage");


const resetPasswordForm =
    document.getElementById("resetPasswordForm");

const otpInput =
    document.getElementById("otp");

const newPasswordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const resetPasswordButton =
    document.getElementById("resetPasswordButton");

const resetMessage =
    document.getElementById("resetMessage");


const developmentOtpCard =
    document.getElementById("developmentOtpCard");

const developmentOtp =
    document.getElementById("developmentOtp");


const otpTimer =
    document.getElementById("otpTimer");

const resendOtpButton =
    document.getElementById("resendOtpButton");

const backToIdentifier =
    document.getElementById("backToIdentifier");


const newPasswordToggle =
    document.getElementById("newPasswordToggle");

const confirmPasswordToggle =
    document.getElementById(
        "confirmPasswordToggle"
    );


/* =========================================================
   STATE
========================================================= */

let currentIdentifier = "";

let otpCountdown = null;

let remainingSeconds = 0;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `message ${type}`;

    element.hidden = false;
}


function hideMessage(element) {

    if (!element) {
        return;
    }

    element.textContent = "";

    element.className = "message";

    element.hidden = true;
}


/* =========================================================
   STEP CONTROL
========================================================= */

function showStep(step) {

    if (stepIdentifier) {
        stepIdentifier.hidden =
            step !== "identifier";
    }


    if (stepOtp) {
        stepOtp.hidden =
            step !== "otp";
    }


    if (stepSuccess) {
        stepSuccess.hidden =
            step !== "success";
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    normalText,
    loadingText
) {

    if (!button) {
        return;
    }


    button.disabled = loading;


    const textElement =
        button.querySelector("span");


    if (textElement) {

        textElement.textContent =
            loading
                ? loadingText
                : normalText;
    }
}


/* =========================================================
   SEND OTP API
========================================================= */

async function sendForgotPasswordOTP(
    identifier
) {

    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/forgot-password/send-otp`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    identifier
                })
            }
        );


    let data = {};

    try {

        data =
            await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Unable to send OTP."
        );
    }


    return data;
}


/* =========================================================
   RESET PASSWORD API
========================================================= */

async function resetPassword(
    identifier,
    otp,
    newPassword,
    confirmPassword
) {

    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/forgot-password/reset`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    identifier,
                    otp,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            }
        );


    let data = {};

    try {

        data =
            await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Unable to reset password."
        );
    }


    return data;
}


/* =========================================================
   OTP TIMER
========================================================= */

function stopOtpTimer() {

    if (otpCountdown) {

        clearInterval(
            otpCountdown
        );

        otpCountdown = null;
    }
}


function updateOtpTimer() {

    if (!otpTimer) {
        return;
    }


    const minutes =
        Math.floor(
            remainingSeconds / 60
        );


    const seconds =
        remainingSeconds % 60;


    otpTimer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    if (remainingSeconds <= 0) {

        otpTimer.classList.add(
            "expired"
        );


        if (resendOtpButton) {

            resendOtpButton.disabled =
                false;
        }


        return;
    }


    otpTimer.classList.remove(
        "expired"
    );
}


function startOtpTimer() {

    stopOtpTimer();


    remainingSeconds = 120;


    if (resendOtpButton) {

        resendOtpButton.disabled =
            true;
    }


    updateOtpTimer();


    otpCountdown =
        setInterval(
            function () {

                remainingSeconds--;

                updateOtpTimer();


                if (
                    remainingSeconds <= 0
                ) {

                    stopOtpTimer();

                    if (resendOtpButton) {

                        resendOtpButton.disabled =
                            false;
                    }
                }

            },
            1000
        );
}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function setupPasswordToggle(
    button,
    input
) {

    if (!button || !input) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            const isPassword =
                input.type === "password";


            if (isPassword) {

                input.type = "text";

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                input.type = "password";

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

        }
    );
}


setupPasswordToggle(
    newPasswordToggle,
    newPasswordInput
);


setupPasswordToggle(
    confirmPasswordToggle,
    confirmPasswordInput
);


/* =========================================================
   OTP INPUT
========================================================= */

if (otpInput) {

    otpInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
        }
    );
}


/* =========================================================
   SEND OTP
========================================================= */

if (sendOtpForm) {

    sendOtpForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            hideMessage(
                identifierMessage
            );


            const identifier =
                identifierInput
                    ? identifierInput.value.trim()
                    : "";


            if (!identifier) {

                showMessage(
                    identifierMessage,
                    "Please enter your username or mobile."
                );

                identifierInput?.focus();

                return;
            }


            setButtonLoading(
                sendOtpButton,
                true,
                "Get OTP",
                "Sending..."
            );


            try {

                const data =
                    await sendForgotPasswordOTP(
                        identifier
                    );


                currentIdentifier =
                    identifier;


                /*
                    Development mode:
                    Backend OTP response ko
                    screen par show kiya ja raha hai.
                */

                if (
                    data.development_otp &&
                    developmentOtp &&
                    developmentOtpCard
                ) {

                    developmentOtp.textContent =
                        data.development_otp;

                    developmentOtpCard.hidden =
                        false;
                }


                showStep("otp");


                startOtpTimer();


                if (otpInput) {

                    setTimeout(
                        function () {
                            otpInput.focus();
                        },
                        150
                    );
                }


            } catch (error) {

                console.error(
                    "Forgot password OTP error:",
                    error
                );


                showMessage(
                    identifierMessage,
                    error.message ||
                    "Unable to send OTP."
                );


            } finally {

                setButtonLoading(
                    sendOtpButton,
                    false,
                    "Get OTP",
                    "Sending..."
                );
            }

        }
    );
}


/* =========================================================
   RESET PASSWORD
========================================================= */

if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            hideMessage(
                resetMessage
            );


            const otp =
                otpInput
                    ? otpInput.value.trim()
                    : "";


            const newPassword =
                newPasswordInput
                    ? newPasswordInput.value
                    : "";


            const confirmPassword =
                confirmPasswordInput
                    ? confirmPasswordInput.value
                    : "";


            /* ---------------------------------------------
               VALIDATION
            --------------------------------------------- */

            if (!currentIdentifier) {

                showMessage(
                    resetMessage,
                    "Please start the password reset again."
                );

                showStep("identifier");

                return;
            }


            if (otp.length !== 6) {

                showMessage(
                    resetMessage,
                    "Please enter the 6-digit OTP."
                );

                otpInput?.focus();

                return;
            }


            if (newPassword.length < 6) {

                showMessage(
                    resetMessage,
                    "Password must be at least 6 characters."
                );

                newPasswordInput?.focus();

                return;
            }


            if (
                newPassword !==
                confirmPassword
            ) {

                showMessage(
                    resetMessage,
                    "Passwords do not match."
                );

                confirmPasswordInput?.focus();

                return;
            }


            setButtonLoading(
                resetPasswordButton,
                true,
                "Reset Password",
                "Resetting..."
            );


            try {

                const data =
                    await resetPassword(
                        currentIdentifier,
                        otp,
                        newPassword,
                        confirmPassword
                    );


                if (
                    !data ||
                    data.success !== true
                ) {

                    throw new Error(
                        "Password reset failed."
                    );
                }


                stopOtpTimer();


                if (developmentOtpCard) {

                    developmentOtpCard.hidden =
                        true;
                }


                showStep("success");


            } catch (error) {

                console.error(
                    "Password reset error:",
                    error
                );


                showMessage(
                    resetMessage,
                    error.message ||
                    "Unable to reset password."
                );


            } finally {

                setButtonLoading(
                    resetPasswordButton,
                    false,
                    "Reset Password",
                    "Resetting..."
                );
            }

        }
    );
}


/* =========================================================
   RESEND OTP
========================================================= */

if (resendOtpButton) {

    resendOtpButton.addEventListener(
        "click",
        async function () {

            if (
                !currentIdentifier ||
                resendOtpButton.disabled
            ) {
                return;
            }


            hideMessage(
                resetMessage
            );


            resendOtpButton.disabled =
                true;


            resendOtpButton.textContent =
                "Sending...";


            try {

                const data =
                    await sendForgotPasswordOTP(
                        currentIdentifier
                    );


                if (
                    data.development_
