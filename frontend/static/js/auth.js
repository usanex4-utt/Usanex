"use strict";

/* =========================================================
   USANEX AUTH
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


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "error") {

    if (!loginMessage) return;

    loginMessage.textContent = message;

    loginMessage.className =
        `message ${type}`;

    loginMessage.hidden = false;
}


function hideMessage() {

    if (!loginMessage) return;

    loginMessage.textContent = "";

    loginMessage.className = "message";

    loginMessage.hidden = true;
}


/* =========================================================
   LOADING
========================================================= */

function setLoginLoading(loading) {

    if (!loginButton) return;

    loginButton.disabled = loading;

    const buttonText =
        loginButton.querySelector(
            ".login-button-text"
        );

    if (buttonText) {

        buttonText.textContent =
            loading
                ? "Logging in..."
                : "Login";
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

                credentials: "include",

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


    let data = {};

    try {

        data = await response.json();

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
   VERIFY SERVER SESSION
========================================================= */

async function verifyServerSession() {

    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/me`,
            {
                method: "GET",

                credentials: "include",

                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    if (!response.ok) {

        return null;
    }


    const data =
        await response.json();


    if (
        data.success === true &&
        data.user
    ) {

        return data.user;
    }


    return null;
}


/* =========================================================
   SAVE USER
========================================================= */

function saveUserSession(user) {

    if (!user) return;


    const sessionData = {

        id:
            user.id || "",

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
   CLEAR LOCAL USER
========================================================= */

function clearLocalSession() {

    localStorage.removeItem(
        "usanex_user"
    );

    localStorage.removeItem(
        "usanex_logged_in"
    );
}


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

if (
    passwordToggle &&
    passwordInput
) {

    passwordToggle.addEventListener(
        "click",
        function () {

            const isPassword =
                passwordInput.type === "password";


            if (isPassword) {

                passwordInput.type = "text";

                passwordToggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type = "password";

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


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (!identifier) {

                showMessage(
                    "Please enter your username or mobile."
                );

                identifierInput?.focus();

                return;
            }


            if (!password) {

                showMessage(
                    "Please enter your password."
                );

                passwordInput?.focus();

                return;
            }


            /* -----------------------------------------
               LOADING
            ----------------------------------------- */

            setLoginLoading(true);


            try {

                /* -------------------------------------
                   LOGIN
                ------------------------------------- */

                const data =
                    await loginUser(
                        identifier,
                        password
                    );


                /* -------------------------------------
                   CHECK RESPONSE
                ------------------------------------- */

                if (
                    !data ||
                    data.success !== true ||
                    !data.user
                ) {

                    throw new Error(
                        "Login failed."
                    );
                }


                /* -------------------------------------
                   SAVE USER
                ------------------------------------- */

                saveUserSession(
                    data.user
                );


                /* -------------------------------------
                   VERIFY REAL SERVER SESSION
                ------------------------------------- */

                const serverUser =
                    await verifyServerSession();


                if (!serverUser) {

                    clearLocalSession();

                    throw new Error(
                        "Login succeeded, but the server session could not be verified. Please try again."
                    );
                }


                /* -------------------------------------
                   UPDATE USER WITH SERVER DATA
                ------------------------------------- */

                saveUserSession(
                    serverUser
                );


                console.log(
                    "Usanex login successful:",
                    serverUser
                );


                /* -------------------------------------
                   SUCCESS
                ------------------------------------- */

                showMessage(
                    `Welcome back, ${serverUser.name}!`,
                    "success"
                );


                /* -------------------------------------
                   REDIRECT
                ------------------------------------- */

                setTimeout(
                    function () {

                        window.location.href =
                            "/home";

                    },
                    400
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

            event.preventDefault();

            window.location.href =
                "/forgot-password";
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


    verify: async function () {

        try {

            const user =
                await verifyServerSession();


            if (!user) {

                clearLocalSession();

                return null;
            }


            saveUserSession(user);

            return user;

        } catch {

            clearLocalSession();

            return null;
        }
    },


    logout: async function () {

        try {

            await fetch(
                `${API_BASE_URL}/api/auth/logout`,
                {
                    method: "POST",

                    credentials: "include"
                }
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        } finally {

            clearLocalSession();

            window.location.href =
                "/login";
        }
    }
};


/* =========================================================
   READY
========================================================= */

console.log(
    "Usanex Auth v3 loaded successfully."
);
