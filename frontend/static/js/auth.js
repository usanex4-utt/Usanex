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

    loginMessage.className = "message";

    loginMessage.hidden = true;
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

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    identifier,
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
   SAVE USER
========================================================= */

function saveUserSession(user) {

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
   PASSWORD SHOW / HIDE
========================================================= */

if (passwordToggle && passwordInput) {

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


            setLoginLoading(true);


            try {

                const data =
                    await loginUser(
                        identifier,
                        password
                    );


                if (
                    !data ||
                    data.success !== true ||
                    !data.user
                ) {

                    throw new Error(
                        "Login failed."
                    );
                }


                saveUserSession(
                    data.user
                );


                showMessage(
                    `Welcome back, ${data.user.name}!`,
                    "success"
                );


                /*
                    Home page abhi create nahi hua hai.
                    Home page banne ke baad yahan:

                    window.location.href = "/home";

                    lagaya jayega.
                */

                console.log(
                    "Usanex login successful:",
                    data.user
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

            alert(
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


        window.location.href =
            "/login";
    }
};
