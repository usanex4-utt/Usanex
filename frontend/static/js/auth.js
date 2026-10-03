"use strict";

/* =========================================================
   USANEX LOGIN AUTH
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

function showMessage(message, type = "error") {

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

    loginMessage.className = "message";

    loginMessage.hidden = true;
}


/* =========================================================
   LOADING
========================================================= */

function setLoginLoading(loading) {

    if (!loginButton) {
        return;
    }

    loginButton.disabled = loading;

    const text =
        loginButton.querySelector(
            ".login-button-text"
        );

    if (text) {

        text.textContent =
            loading
                ? "Logging in..."
                : "Login";
    }
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

            const isHidden =
                passwordInput.type === "password";


            if (isHidden) {

                passwordInput.type = "text";

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
                    "Accept":
                        "application/json",

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
            "Invalid username/mobile or password."
        );
    }


    return data;
}


/* =========================================================
   SAVE USER
========================================================= */

function saveUser(user) {

    if (!user) {
        return;
    }


    const userData = {

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


    /*
     * Main Usanex storage
     */

    localStorage.setItem(
        "usanex_user",
        JSON.stringify(userData)
    );


    localStorage.setItem(
        "usanex_logged_in",
        "true"
    );


    /*
     * Compatibility storage
     * for existing pages
     */

    localStorage.setItem(
        "currentUser",
        JSON.stringify(userData)
    );


    localStorage.setItem(
        "user",
        JSON.stringify(userData)
    );
}


/* =========================================================
   CLEAR USER
========================================================= */

function clearUser() {

    localStorage.removeItem(
        "usanex_user"
    );

    localStorage.removeItem(
        "usanex_logged_in"
    );

    localStorage.removeItem(
        "currentUser"
    );

    localStorage.removeItem(
        "user"
    );
}


/* =========================================================
   LOGIN FORM
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
               START LOADING
            ----------------------------------------- */

            setLoginLoading(true);


            try {

                /* -------------------------------------
                   LOGIN REQUEST
                ------------------------------------- */

                const data =
                    await loginUser(
                        identifier,
                        password
                    );


                /* -------------------------------------
                   CHECK API RESPONSE
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

                saveUser(
                    data.user
                );


                /* -------------------------------------
                   REMEMBER ME
                ------------------------------------- */

                if (
                    rememberMe &&
                    rememberMe.checked
                ) {

                    localStorage.setItem(
                        "usanex_remember",
                        "true"
                    );

                } else {

                    localStorage.removeItem(
                        "usanex_remember"
                    );
                }


                /* -------------------------------------
                   SUCCESS MESSAGE
                ------------------------------------- */

                showMessage(
                    `Welcome back, ${data.user.name || "to Usanex"}!`,
                    "success"
                );


                console.log(
                    "Usanex login successful:",
                    data.user
                );


                /* -------------------------------------
                   REDIRECT
                ------------------------------------- */

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
   ENTER KEY SUPPORT
========================================================= */

if (identifierInput) {

    identifierInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                passwordInput?.focus();
            }
        }
    );
}


/* =========================================================
   AUTH HELPER
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

        const saved =
            localStorage.getItem(
                "usanex_user"
            );


        if (!saved) {
            return null;
        }


        try {

            return JSON.parse(
                saved
            );

        } catch {

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

            clearUser();

            window.location.href =
                "/login";
        }
    }

};


/* =========================================================
   AUTO CLEAR INVALID OLD DATA
========================================================= */

(function () {

    const saved =
        localStorage.getItem(
            "usanex_user"
        );


    if (!saved) {
        return;
    }


    try {

        const user =
            JSON.parse(saved);


        if (
            !user ||
            !user.username ||
            !user.user_id
        ) {

            clearUser();
        }

    } catch {

        clearUser();
    }

})();


/* =========================================================
   READY
========================================================= */

console.log(
    "Usanex Auth loaded successfully."
);
