"use strict";


/* =========================================================
   USANEX REGISTER
========================================================= */

const API_BASE_URL = "";


/* =========================================================
   ELEMENTS
========================================================= */

const registerStep =
    document.getElementById("registerStep");

const otpStep =
    document.getElementById("otpStep");

const successStep =
    document.getElementById("successStep");


const registerForm =
    document.getElementById("registerForm");

const nameInput =
    document.getElementById("name");

const mobileInput =
    document.getElementById("mobile");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");


const passwordToggle =
    document.getElementById("passwordToggle");


const getOtpButton =
    document.getElementById("getOtpButton");

const getOtpText =
    document.getElementById("getOtpText");


const otpInput =
    document.getElementById("otp");

const verifyOtpButton =
    document.getElementById("verifyOtpButton");

const verifyOtpText =
    document.getElementById("verifyOtpText");


const resendOtpButton =
    document.getElementById("resendOtpButton");

const backToRegisterButton =
    document.getElementById("backToRegisterButton");


const registerMessage =
    document.getElementById("registerMessage");

const otpMessage =
    document.getElementById("otpMessage");


const developmentOtp =
    document.getElementById("developmentOtp");

const developmentOtpValue =
    document.getElementById("developmentOtpValue");


const otpTimer =
    document.getElementById("otpTimer");


const createdUsername =
    document.getElementById("createdUsername");

const createdUserId =
    document.getElementById("createdUserId");


const copyAccountButton =
    document.getElementById("copyAccountButton");

const continueLoginButton =
    document.getElementById("continueLoginButton");


/* =========================================================
   STATE
========================================================= */

let registrationData = null;

let countdownInterval = null;

let secondsRemaining = 120;


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

    registerStep.hidden = true;
    otpStep.hidden = true;
    successStep.hidden = true;

    step.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

if (passwordToggle && passwordInput) {

    passwordToggle.addEventListener(
        "click",
        function () {

            const hidden =
                passwordInput.type === "password";


            if (hidden) {

                passwordInput.type = "text";

                passwordToggle.innerHTML =
                    "<span>Hide</span>";

            } else {

                passwordInput.type =
                    "password";

                passwordToggle.innerHTML =
                    "<span>Show</span>";
            }

        }
    );
}


/* =========================================================
   TIMER
========================================================= */

function updateTimer() {

    const minutes =
        Math.floor(
            secondsRemaining / 60
        );

    const seconds =
        secondsRemaining % 60;


    const formattedMinutes =
        String(minutes).padStart(2, "0");

    const formattedSeconds =
        String(seconds).padStart(2, "0");


    if (otpTimer) {

        otpTimer.textContent =
            `${formattedMinutes}:${formattedSeconds}`;
    }
}


function stopTimer() {

    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );

        countdownInterval = null;
    }
}


function startTimer() {

    stopTimer();

    secondsRemaining = 120;

    updateTimer();

    resendOtpButton.disabled = true;


    countdownInterval =
        setInterval(
            function () {

                secondsRemaining--;

                updateTimer();


                if (secondsRemaining <= 0) {

                    stopTimer();

                    resendOtpButton.disabled =
                        false;

                    otpTimer.textContent =
                        "Expired";
                }

            },
            1000
        );
}


/* =========================================================
   SEND OTP API
========================================================= */

async function sendRegisterOtp() {

    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/register/send-otp`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    name:
                        registrationData.name,

                    mobile:
                        registrationData.mobile,

                    password:
                        registrationData.password
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
   VERIFY OTP API
========================================================= */

async function verifyRegisterOtp() {

    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/register/verify`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    name:
                        registrationData.name,

                    mobile:
                        registrationData.mobile,

                    password:
                        registrationData.password,

                    otp:
                        otpInput.value.trim()
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
            "Invalid or expired OTP."
        );
    }


    return data;
}


/* =========================================================
   REGISTER FORM
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideMessage(registerMessage);


            const name =
                nameInput.value.trim();

            const mobile =
                mobileInput.value.trim();

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            /* NAME */

            if (!name) {

                showMessage(
                    registerMessage,
                    "Please enter your name."
                );

                nameInput.focus();

                return;
            }


            /* MOBILE */

            if (!mobile) {

                showMessage(
                    registerMessage,
                    "Please enter your mobile number."
                );

                mobileInput.focus();

                return;
            }


            /* PASSWORD */

            if (password.length < 6) {

                showMessage(
                    registerMessage,
                    "Password must be at least 6 characters."
                );

                passwordInput.focus();

                return;
            }


            /* CONFIRM */

            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    registerMessage,
                    "Passwords do not match."
                );

                confirmPasswordInput.focus();

                return;
            }


            registrationData = {

                name,
                mobile,
                password
            };


            getOtpButton.disabled = true;

            getOtpText.textContent =
                "Sending OTP...";


            try {

                const data =
                    await sendRegisterOtp();


                showStep(otpStep);

                startTimer();


                /*
                    Current development setup
                    OTP response me mil raha hai.
                    Production SMS setup ke baad
                    is block ko remove kar denge.
                */

                if (
                    data.development_otp
                ) {

                    developmentOtp.hidden =
                        false;

                    developmentOtpValue.textContent =
                        data.development_otp;
                }


            } catch (error) {

                showMessage(
                    registerMessage,
                    error.message ||
                    "Unable to send OTP."
                );


            } finally {

                getOtpButton.disabled =
                    false;

                getOtpText.textContent =
                    "Get OTP";
            }

        }
    );
}


/* =========================================================
   VERIFY OTP
========================================================= */

if (verifyOtpButton) {

    verifyOtpButton.addEventListener(
        "click",
        async function () {

            hideMessage(otpMessage);


            const otp =
                otpInput.value.trim();


            if (!/^\d{6}$/.test(otp)) {

                showMessage(
                    otpMessage,
                    "Please enter the 6-digit OTP."
                );

                otpInput.focus();

                return;
            }


            if (secondsRemaining <= 0) {

                showMessage(
                    otpMessage,
                    "OTP has expired. Please resend OTP."
                );

                return;
            }


            verifyOtpButton.disabled = true;

            verifyOtpText.textContent =
                "Verifying...";


            try {

                const data =
                    await verifyRegisterOtp();


                if (
                    !data ||
                    data.success !== true ||
                    !data.user
                ) {

                    throw new Error(
                        "Account creation failed."
                    );
                }


                stopTimer();


                createdUsername.textContent =
                    data.user.username || "-";


                createdUserId.textContent =
                    data.user.user_id || "-";


                showStep(successStep);


            } catch (error) {

                showMessage(
                    otpMessage,
                    error.message ||
                    "Invalid or expired OTP."
                );


            } finally {

                verifyOtpButton.disabled =
                    false;

                verifyOtpText.textContent =
                    "Verify OTP";
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

            if (!registrationData) {
                return;
            }


            hideMessage(otpMessage);


            resendOtpButton.disabled =
                true;

            resendOtpButton.textContent =
                "Sending...";


            try {

                const data =
                    await sendRegisterOtp();


                if (
                    data.development_otp
                ) {

                    developmentOtp.hidden =
                        false;

                    developmentOtpValue.textContent =
                        data.development_otp;
                }


                otpInput.value = "";

                startTimer();


                showMessage(
                    otpMessage,
                    "A new OTP has been generated.",
                    "success"
                );


            } catch (error) {

                showMessage(
                    otpMessage,
                    error.message ||
                    "Unable to resend OTP."
                );

                resendOtpButton.disabled =
                    false;


            } finally {

                resendOtpButton.textContent =
                    "Resend OTP";
            }

        }
    );
}


/* =========================================================
   CHANGE DETAILS
========================================================= */

if (backToRegisterButton) {

    backToRegisterButton.addEventListener(
        "click",
        function () {

            stopTimer();

            hideMessage(otpMessage);

            showStep(registerStep);
        }
    );
}


/* =========================================================
   COPY ACCOUNT
========================================================= */

if (copyAccountButton) {

    copyAccountButton.addEventListener(
        "click",
        async function () {

            const text =
                `Usanex Username: ${createdUsername.textContent}\n` +
                `Usanex User ID: ${createdUserId.textContent}`;


            try {

                await navigator.clipboard.writeText(
                    text
                );

                copyAccountButton.textContent =
                    "Copied ✓";


                setTimeout(
                    function () {

                        copyAccountButton.textContent =
                            "Copy Account Details";

                    },
                    1800
                );


            } catch {

                alert(text);
            }

        }
    );
}


/* =========================================================
   CONTINUE TO LOGIN
========================================================= */

if (continueLoginButton) {

    continueLoginButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/login";
        }
    );
}


/* =========================================================
   OTP INPUT
========================================================= */

if (otpInput) {

    otpInput.addEventListener(
        "input",
        function () {

            otpInput.value =
                otpInput.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
        }
    );
}
