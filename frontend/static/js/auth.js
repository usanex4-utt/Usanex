"use strict";


/* =========================================================
   USANEX AUTHENTICATION
========================================================= */

const API_BASE_URL = "";


/* =========================================================
   ELEMENTS
========================================================= */

const loginForm =
    document.getElementById("loginForm");

const identifierInput =
    document.getElementById("identifier");

const passwordInput =
    document.getElementById("password");

const passwordToggle =
    document.getElementById("passwordToggle");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");

const registerLink =
    document.getElementById("registerLink");

const forgotPasswordLink =
    document.getElementById("forgotPasswordLink");

const rememberMe =
    document.getElementById("rememberMe");


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


    loginMessage.textContent =
        message;


    loginMessage.className =
        `message ${type}`;


    loginMessage.hidden =
        false;
}


function hideMessage() {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent = "";

    loginMessage.className =
        "message";

    loginMessage.hidden =
        true;
}


/* =========================================================
   LOADING
========================================================= */

function setLoginLoading(
    loading
) {

    if (!loginButton) {
        return;
    }


    loginButton.disabled =
        loading;


    const buttonText =
        loginButton.querySelector(
            ".login-button-text"
        );


    const buttonArrow =
        loginButton.querySelector(
            ".login-arrow"
        );


    if (buttonText) {

        buttonText.textContent =
            loading
                ? "Logging in..."
                : "Login";
    }


    if (buttonArrow) {

        buttonArrow.textContent =
            loading
                ? "..."
                : "→";
    }
}


/* =========================================================
   LOGIN API
========================================================= */

async function loginUser(
    identifier,
    password
) {

    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    identifier:
                        identifier,

                    password:
                        password
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
            "Invalid username/mobile or password"
        );
    }


    return data;
}


/* =========================================================
   SAVE USER SESSION
========================================================= */

function saveUserSession(
    user,
    remember
) {

    if (!user) {
        return;
    }


    const sessionData = {

        username:
            user.username || "",

        user_id:
            user.user_id || "",

        name:
            user.name || "",

        mobile:
            user.mobile || "",

        profile_photo:
            user.profile_photo || ""
    };


    /*
     * Main session
     */
    localStorage.setItem(
        "usanex_user",
        JSON.stringify(sessionData)
    );


    localStorage.setItem(
        "usanex_logged_in",
        "true"
    );


    /*
     * Remember preference
     */
    localStorage.setItem(
        "usanex_remember_me",
        remember
            ? "true"
            : "false"
    );
}


/* =========================================================
   LOAD SAVED IDENTIFIER
========================================================= */

function loadSavedIdentifier() {

    if (!identifierInput) {
        return;
    }


    const remember =
        localStorage.getItem(
            "usanex_remember_me"
        );


    const savedUser =
        localStorage.getItem(
            "usanex_user"
        );


    if (
        remember === "true" &&
        savedUser
    ) {

        try {

            const user =
                JSON.parse(savedUser);


            if (user && user.username) {

                identifierInput.value =
                    user.username;
            }


            if (rememberMe) {

                rememberMe.checked =
                    true;
            }

        } catch {

            localStorage.removeItem(
                "usanex_user"
            );
        }
    }
}


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

function setupPasswordToggle() {

    if (
        !passwordInput ||
        !passwordToggle
    ) {

        return;
    }


    passwordToggle.addEventListener(
        "click",
        function () {

            const isPassword =
                passwordInput.type ===
                "password";


            if (isPassword) {

                passwordInput.type =
                    "text";


                passwordToggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type =
                    "password";


                passwordToggle.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }
        }
    );
}


/* =========================================================
   LOGIN
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


            const remember =
                rememberMe
                    ? rememberMe.checked
                    : false;


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

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


            /* -----------------------------------------
               LOADING
            ----------------------------------------- */

            setLoginLoading(true);


            try {

                /* -------------------------------------
                   API
                ------------------------------------- */

                const data =
                    await loginUser(
                        identifier,
                        password
                    );


                /* -------------------------------------
                   RESPONSE VALIDATION
                ------------------------------------- */

                if (
                    !data ||
                    data.success !== true ||
                    !data.user
                ) {

                    throw new Error(
                        "Login failed. Please try again."
                    );
                }


                /* -------------------------------------
                   SAVE SESSION
                ------------------------------------- */

                saveUserSession(
                    data.user,
                    remember
                );


                /* -------------------------------------
                   SUCCESS
                ------------------------------------- */

                showMessage(
                    `Welcome back, ${data.user.name}!`,
                    "success"
                );


                /*
                 * Home page is now the next destination.
                 */
                setTimeout(
                    function () {

                        window.location.href =
                            "/home";

                    },
                    500
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
   REGISTER
========================================================= */

if (registerLink) {

    registerLink.addEventListener(
        "click",
        function (event) {

            /*
             * Let browser open /register.
             */
            event.preventDefault();

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

            /*
             * Forgot-password page अभी नहीं बनाया गया है.
             */
            event.preventDefault();

            showMessage(
                "Forgot Password will be available soon."
            );
        }
    );
}


/* =========================================================
   AUTH HELPERS
========================================================= */

window.UsanexAuth = {

    isLoggedIn: function () {

        return (
            localStorage.getItem(
                "usanex_logged_in"
            ) === "true"
        );
    },


    getUser: function () {

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


    logout: function () {

        localStorage.removeItem(
            "usanex_user"
        );


        localStorage.removeItem(
            "usanex_logged_in"
        );


        localStorage.removeItem(
            "usanex_remember_me"
        );


        window.location.href =
            "/login";
    }
};


/* =========================================================
   INITIALIZE
========================================================= */

setupPasswordToggle();

loadSavedIdentifier();


console.log(
    "Usanex authentication loaded successfully."
);
