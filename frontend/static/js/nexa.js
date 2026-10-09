
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("messageInput");
    const conversation = document.getElementById("conversation");
    const menuBtn = document.getElementById("menuBtn");
    const dropdown = document.getElementById("dropdown");
    const micBtn = document.getElementById("micBtn");

    function addMessage(text, type = "assistant") {
        const bubble = document.createElement("div");

        if (type === "user") {
            bubble.className = "user-message";
            const p = document.createElement("p");
            p.textContent = text;
            bubble.appendChild(p);
        } else {
            bubble.className = "assistant-message";

            const avatar = document.createElement("div");
            avatar.className = "avatar";
            avatar.textContent = "N";

            const content = document.createElement("div");
            content.className = "message-content";

            const sender = document.createElement("span");
            sender.className = "sender";
            sender.textContent = "NEXA";

            const p = document.createElement("p");
            p.textContent = text;

            content.append(sender, p);
            bubble.append(avatar, content);
        }

        conversation.appendChild(bubble);
        bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return bubble;
    }

    async function sendMessage(rawText) {
        const message = rawText.trim();
        if (!message) return;

        addMessage(message, "user");
        input.value = "";

        const pending = addMessage("Ek pal bhai…");

        try {
            const response = await fetch("/api/ai-assistant/chat", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error("Backend is not ready");
            }

            const data = await response.json();
            pending.querySelector("p").textContent =
                data.reply || "Abhi jawab nahi mil paya.";
        } catch (_) {
            pending.querySelector("p").textContent =
                "Bhai, mera AI backend abhi connect nahi hua hai. Filhaal UI taiyar hai.";
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    document.querySelectorAll("[data-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
            sendMessage(button.dataset.prompt);
        });
    });

    menuBtn.addEventListener("click", () => {
        const isOpen = !dropdown.hidden;
        dropdown.hidden = isOpen;
        menuBtn.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".menu-wrap")) {
            dropdown.hidden = true;
            menuBtn.setAttribute("aria-expanded", "false");
        }
    });

    dropdown.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;
            dropdown.hidden = true;
            menuBtn.setAttribute("aria-expanded", "false");

            const responses = {
                chat: "Bhai, neeche message likhkar chat shuru karo.",
                private: "Private Chat ko secure login verification ke saath connect karna baaki hai.",
                memory: "Personal Memory feature ko secure backend se connect karna baaki hai.",
                quick: "Couple Chat aur Reels actions ko app routes se connect karna baaki hai.",
                settings: "NEXA settings abhi development mein hain."
            };

            addMessage(responses[action] || "Batao bhai, kya help chahiye?");
        });
    });

    document.getElementById("backBtn").addEventListener("click", () => {
        if (history.length > 1) {
            history.back();
        } else {
            window.location.href = "/home";
        }
    });

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "hi-IN";
        recognition.interimResults = false;

        micBtn.addEventListener("click", () => {
            try {
                recognition.start();
            } catch (_) {
                addMessage("Microphone pehle se active hai, bhai.");
            }
        });

        recognition.onresult = (event) => {
            input.value = event.results[0][0].transcript;
            input.focus();
        };

        recognition.onerror = () => {
            addMessage("Microphone permission check karke dobara try karo.");
        };
    } else {
        micBtn.addEventListener("click", () => {
            addMessage("Is browser mein voice input supported nahi hai. Type karke baat karo.");
        });
    }
});
