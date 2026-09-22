"use strict";


/* =========================================================
   USANEX AUTHENTICATION
========================================================= */


/*
    Backend API base.

    Frontend और backend अगर उसी Render service पर
    चल रहे हैं, तो relative URL सबसे सही रहेगा.

    Example:
        /api/auth/login
*/
const API_BASE_URL = "";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginForm = document.getElementById("loginForm");

const identifierInput =
    document.getElementById("identifier");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");

const registerLink =
    document.getElementById("registerLink");

const forgotPasswordLink =
    document.getElementById("forgotPasswordLink");


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = "error"
) {
    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;

    loginMessage.className =
        `message ${type}`;

    loginMessage.hidden = false;
}


function hideMessage() {
    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = "";

    loginMessage.hidden = true;

    loginMessage.className = "message";
}


/* =========================================================
   BUTTON STATE
========================================================= */

function setLoginLoading(
    loading
) {
    if (!loginButton) {
        return;
    }

    loginButton.disabled = loading;

    if (loading) {
        loginButton.textContent =
            "Logging in...";
    } else {
        loginButton.textContent =
            "Login";
    }
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(
    identifier,
    password
) {
    const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                identifier: identifier,
                password: password
            })
        }
    );


    let data;

    try {
        data = await response.json();
    } catch {
        data = {};
    }


    if (!response.ok) {

        const errorMessage =
            data.detail ||
            "Login failed. Please try again.";

        throw new Error(
            errorMessage
        );
    }


    return data;
}


/* =========================================================
   SAVE USER SESSION
========================================================= */

function saveUserSession(
    user
) {
    if (!user) {
        return;
    }


    /*
        Only non-sensitive account information
        is stored here.

        Password is NEVER stored.
    */

    const sessionData = {
        username: user.username || "",
        user_id: user.user_id || "",
        name: user.name || "",
        mobile: user.mobile || "",
        profile_photo:
            user.profile_photo || ""
    };


    localStorage.setItem(
        "usanex_user",
        JSON.stringify(sessionData)
    );


    localStorage.setItem(
        "usanex_logged_in",
        "true"
    );
}


/* =========================================================
   LOGIN FORM SUBMIT
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideMessage();


            const identifier =
                identifierInput
                    ? identifierInput.value.trim()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            /* ---------------------------------------------
               BASIC VALIDATION
            --------------------------------------------- */

            if (!identifier) {

                showMessage(
                    "Please enter your username or mobile number."
                );

                if (identifierInput) {
                    identifierInput.focus();
                }

                return;
            }


            if (!password) {

                showMessage(
                    "Please enter your password."
                );

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            /* ---------------------------------------------
               START LOGIN
            --------------------------------------------- */

            setLoginLoading(true);


            try {

                const data =
                    await loginUser(
                        identifier,
                        password
                    );


                if (
                    !data ||
                    data.success !== true
                ) {

                    throw new Error(
                        "Login failed. Please try again."
                    );
                }


                /* -----------------------------------------
                   SAVE SESSION
                ----------------------------------------- */

                saveUserSession(
                    data.user
                );


                /* -----------------------------------------
                   SUCCESS MESSAGE
                ----------------------------------------- */

                showMessage(
                    "Login successful. Opening Usanex...",
                    "success"
                );


                /*
                    Temporary redirect.

                    Home page will be connected here
                    after we create the frontend home
                    module.
                */

                setTimeout(
                    function () {

                        window.location.href =
                            "/home";

                    },
                    700
                );

            } catch (error) {

                console.error(
                    "Usanex login error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to connect to Usanex."
                );

            } finally {

                setLoginLoading(false);
            }
        }
    );
}


/* =========================================================
   REGISTER LINK
========================================================= */

if (registerLink) {

    registerLink.addEventListener(
        "click",
        function () {

            window.location.href =
                "/register";

        }
    );
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

if (forgotPasswordLink) {

    forgotPasswordLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            /*
                Forgot password page will be created
                in the next authentication step.
            */

            alert(
                "Forgot Password will be available soon."
            );
        }
    );
}


/* =========================================================
   ALREADY LOGGED IN CHECK
========================================================= */

function isUserLoggedIn() {

    return (
        localStorage.getItem(
            "usanex_logged_in"
        ) === "true"
    );
}


/* =========================================================
   DEBUG HELPER
========================================================= */

window.UsanexAuth = {

    isLoggedIn:
        isUserLoggedIn,

    getUser:
        function () {

            const user =
                localStorage.getItem(
                    "usanex_user"
                );

            if (!user) {
                return null;
            }

            try {

                return JSON.parse(user);

            } catch {

                return null;
            }
        },

    logout:
        function () {

            localStorage.removeItem(
                "usanex_user"
            );

            localStorage.removeItem(
                "usanex_logged_in"
            );

            window.location.href =
                "/login";
        }
    };
