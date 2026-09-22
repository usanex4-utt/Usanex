"use strict";

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const searchResults =
    document.getElementById("searchResults");

const searchStatus =
    document.getElementById("searchStatus");

const backButton =
    document.getElementById("backButton");


let searchTimer = null;
let currentController = null;


/* =========================
   BACK BUTTON
========================= */

backButton.addEventListener(
    "click",
    () => {
        window.location.href = "/home";
    }
);


/* =========================
   SEARCH INPUT
========================= */

searchInput.addEventListener(
    "input",
    () => {

        const query =
            searchInput.value.trim();

        clearTimeout(searchTimer);

        clearSearch.hidden =
            query.length === 0;

        if (!query) {
            resetSearch();
            return;
        }

        searchTimer = setTimeout(
            () => {
                searchPeople(query);
            },
            350
        );
    }
);


/* =========================
   CLEAR SEARCH
========================= */

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        clearSearch.hidden = true;

        resetSearch();

        searchInput.focus();
    }
);


/* =========================
   RESET
========================= */

function resetSearch() {

    if (currentController) {
        currentController.abort();
        currentController = null;
    }

    searchResults.innerHTML = "";

    searchStatus.textContent =
        "Search people on Usanex";
}


/* =========================
   SEARCH PEOPLE
========================= */

async function searchPeople(query) {

    if (currentController) {
        currentController.abort();
    }

    currentController =
        new AbortController();

    searchStatus.textContent =
        "Searching...";

    searchResults.innerHTML = `
        <div class="search-loading">
            Searching people...
        </div>
    `;

    try {

        const response =
            await fetch(
                `/api/search/people?q=${encodeURIComponent(query)}&limit=20&offset=0`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    },
                    signal:
                        currentController.signal
                }
            );

        if (!response.ok) {

            if (response.status === 401) {
                window.location.href =
                    "/login";
                return;
            }

            throw new Error(
                "Search request failed"
            );
        }

        const data =
            await response.json();

        renderResults(data.users || []);

    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {
            return;
        }

        console.error(
            "Search error:",
            error
        );

        searchStatus.textContent =
            "Something went wrong";

        searchResults.innerHTML = `
            <div class="search-empty">
                Please try again.
            </div>
        `;
    }
}


/* =========================
   RENDER RESULTS
========================= */

function renderResults(users) {

    if (!users.length) {

        searchStatus.textContent =
            "No people found";

        searchResults.innerHTML = `
            <div class="search-empty">
                No matching people found.
            </div>
        `;

        return;
    }

    searchStatus.textContent =
        `${users.length} people found`;

    searchResults.innerHTML = "";

    users.forEach(
        (user) => {

            const card =
                createUserCard(user);

            searchResults.appendChild(
                card
            );
        }
    );
}


/* =========================
   USER CARD
========================= */

function createUserCard(user) {

    const card =
        document.createElement("article");

    card.className =
        "search-user-card";


    /* Avatar */

    const avatar =
        document.createElement("div");

    avatar.className =
        "search-user-avatar";


    if (user.profile_photo) {

        const image =
            document.createElement("img");

        image.src =
            user.profile_photo;

        image.alt =
            user.name || "User";

        image.loading =
            "lazy";

        image.onerror =
            () => {
                image.remove();

                avatar.textContent =
                    getInitial(
                        user.name
                    );
            };

        avatar.appendChild(
            image
        );

    } else {

        avatar.textContent =
            getInitial(
                user.name
            );
    }


    /* User information */

    const info =
        document.createElement("div");

    info.className =
        "search-user-info";


    const name =
        document.createElement("div");

    name.className =
        "search-user-name";

    name.textContent =
        user.name || "User";


    const username =
        document.createElement("div");

    username.className =
        "search-user-username";

    username.textContent =
        user.username || "";


    info.appendChild(name);
    info.appendChild(username);


    /* Follow button */

    const followButton =
        document.createElement("button");

    followButton.type =
        "button";

    followButton.className =
        "search-follow-button";

    followButton.textContent =
        "Follow";


    followButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            /*
             * Follow API next step me connect hoga.
             * Abhi sirf UI action hai.
             */

            if (
                followButton.classList.contains(
                    "requested"
                )
            ) {
                return;
            }

            followButton.textContent =
                "Request Sent";

            followButton.classList.add(
                "requested"
            );
        }
    );


    /* Assemble card */

    card.appendChild(avatar);
    card.appendChild(info);
    card.appendChild(followButton);


    return card;
}


/* =========================
   INITIAL
========================= */

function getInitial(name) {

    if (!name) {
        return "U";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}
