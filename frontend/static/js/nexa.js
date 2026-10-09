"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("messageInput");
    const conversation = document.getElementById("conversation");
    const menuBtn = document.getElementById("menuBtn");
    const dropdown = document.getElementById("dropdown");
    const micBtn = document.getElementById("micBtn");
    const backBtn = document.getElementById("backBtn");

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    let recognition = null;
    let wakeMode = false;
    let waitingForCommand = false;
    let processing = false;
    let speaking = false;
    let manualListening = false;

    // ---------------- MESSAGE UI ----------------

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
        bubble.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        return bubble;
    }

    // ---------------- VOICE OUTPUT ----------------

    function speakReply(text, onFinished = () => {}) {
        if (!("speechSynthesis" in window)) {
            onFinished();
            return;
        }

        window.speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = "hi-IN";
        speech.rate = 0.95;
        speech.pitch = 1;
        speech.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(voice =>
            voice.lang.toLowerCase().startsWith("hi")
        );

        if (hindiVoice) {
            speech.voice = hindiVoice;
        }

        speaking = true;

        speech.onend = () => {
            speaking = false;
            onFinished();
        };

        speech.onerror = () => {
            speaking = false;
            onFinished();
        };

        window.speechSynthesis.speak(speech);
    }

    // ---------------- WAKE WORD ----------------

    function normalizeSpeech(text) {
        return text
            .toLowerCase()
            .replace(/[.,!?।]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function extractWakeCommand(text) {
        const normalized = normalizeSpeech(text);

        // English and common Hindi recognition variants
        const wakePattern =
            /(?:hey\s*nexa|hey\s*nex[a-z]*|हे\s*नेक्सा|है\s*नेक्सा|नेक्सा)/i;

        const match = wakePattern.exec(normalized);

        if (!match) {
            return null;
        }

        return normalized
            .slice(match.index + match[0].length)
            .trim();
    }

    function updateMicButton() {
        if (wakeMode) {
            micBtn.textContent = "🔴";
            micBtn.setAttribute(
                "aria-label",
                "Stop Hey NEXA listening"
            );
            micBtn.title = "Hey NEXA mode is active";
        } else {
            micBtn.textContent = "🎙";
            micBtn.setAttribute("aria-label", "Enable Hey NEXA");
            micBtn.title = "Start voice assistant";
        }
    }

    function startRecognition() {
        if (
            !recognition ||
            !wakeMode ||
            processing ||
            speaking
        ) {
            return;
        }

        try {
            recognition.start();
        } catch (_) {
            // The browser may already be starting recognition.
        }
    }

    function stopRecognition() {
        if (!recognition) return;

        try {
            recognition.stop();
        } catch (_) {
            // Recognition may already be stopped.
        }
    }

    function enableWakeMode() {
        if (!SpeechRecognition) {
            addMessage(
                "Bhai, is browser mein voice recognition supported nahi hai. " +
                "Android par supported browser mein Usanex kholo."
            );
            return;
        }

        if (!window.isSecureContext) {
            addMessage(
                "Microphone ke liye secure HTTPS connection zaroori hai."
            );
            return;
        }

        if (!recognition) {
            recognition = new SpeechRecognition();
            recognition.lang = "hi-IN";
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.maxAlternatives = 3;

            recognition.onresult = (event) => {
                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {
                    if (!event.results[i].isFinal) continue;

                    let transcript = "";

                    for (
                        let j = 0;
                        j < event.results[i].length;
                        j++
                    ) {
                        const alternative =
                            event.results[i][j].transcript;

                        if (
                            extractWakeCommand(alternative) !== null
                        ) {
                            transcript = alternative;
                            break;
                        }

                        if (!transcript) {
                            transcript = alternative;
                        }
                    }

                    handleRecognizedSpeech(transcript);
                }
            };

            recognition.onerror = (event) => {
                if (
                    event.error === "not-allowed" ||
                    event.error === "service-not-allowed"
                ) {
                    wakeMode = false;
                    waitingForCommand = false;
                    updateMicButton();

                    addMessage(
                        "Microphone permission allow karo, phir NEXA " +
                        "ko dobara start karo."
                    );
                    return;
                }

                if (event.error === "no-speech") {
                    return;
                }

                if (event.error === "network") {
                    addMessage(
                        "Voice recognition service available nahi hai. " +
                        "Internet connection check karke dobara try karo."
                    );
                }
            };

            recognition.onend = () => {
                if (wakeMode && !processing && !speaking) {
                    // Small delay lets the browser finish stopping.
                    window.setTimeout(startRecognition, 350);
                }
            };
        }

        wakeMode = true;
        waitingForCommand = false;
        manualListening = false;
        updateMicButton();

        addMessage(
            'NEXA listening mode on hai. "Hey NEXA" bolo, ' +
            "phir apna sawal poochho. 💙"
        );

        startRecognition();
    }

    function disableWakeMode() {
        wakeMode = false;
        waitingForCommand = false;
        manualListening = false;

        stopRecognition();

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        speaking = false;
        processing = false;

        updateMicButton();
        addMessage("NEXA voice listening band kar di gayi hai.");
    }

    function handleRecognizedSpeech(transcript) {
        if (processing || speaking) return;

        const command = extractWakeCommand(transcript);

        // Waiting for the actual question after the wake phrase
        if (waitingForCommand) {
            waitingForCommand = false;

            if (command !== null && command) {
                sendMessage(command);
                return;
            }

            const cleanText = normalizeSpeech(transcript);

            if (
                cleanText &&
                !/^(hey\s*nexa|हे\s*नेक्सा|नेक्सा)$/.test(cleanText)
            ) {
                sendMessage(cleanText);
            }

            return;
        }

        // Wake word detected
        if (command !== null) {
            if (command.length > 0) {
                // Example: "Hey NEXA, Usanex kya hai?"
                sendMessage(command);
                return;
            }

            // Example: "Hey NEXA" followed by the question
            waitingForCommand = true;

            stopRecognition();

            speakReply("Haan bhai, bolo. Main sun raha hoon.", () => {
                if (wakeMode && waitingForCommand) {
                    startRecognition();
                }
            });

            return;
        }

        // Ignore unrelated speech while waiting for the wake phrase
    }

    // ---------------- CHAT REQUEST ----------------

    async function sendMessage(rawText) {
        const message = rawText.trim();

        if (!message || processing) return;

        processing = true;
        manualListening = false;
        waitingForCommand = false;

        stopRecognition();

        addMessage(message, "user");
        input.value = "";

        const pending = addMessage("Ek pal bhai…");

        let reply = "";

        try {
            const response = await fetch(
                "/api/ai-assistant/chat",
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail || "NEXA backend se jawab nahi mila."
                );
            }

            reply = data.reply || "Abhi jawab nahi mil paya.";
        } catch (error) {
            reply =
                error.message ||
                "Bhai, NEXA se connection nahi ho paya.";
        }

        pending.querySelector("p").textContent = reply;

        if (wakeMode && "speechSynthesis" in window) {
            speakReply(reply, () => {
                processing = false;

                if (wakeMode) {
                    startRecognition();
                }
            });
        } else {
            processing = false;
        }
    }

    // ---------------- MANUAL MICROPHONE ----------------

    micBtn.addEventListener("click", () => {
        if (wakeMode) {
            disableWakeMode();
        } else {
            enableWakeMode();
        }
    });

    // ---------------- CHAT FORM ----------------

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    document.querySelectorAll("[data-prompt]").forEach(button => {
        button.addEventListener("click", () => {
            sendMessage(button.dataset.prompt);
        });
    });

    // ---------------- MENU ----------------

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

    dropdown.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;
            dropdown.hidden = true;
            menuBtn.setAttribute("aria-expanded", "false");

            const responses = {
                chat: "Bhai, neeche message likhkar chat shuru karo.",
                private:
                    "Private Chat ko secure backend se connect karna baaki hai.",
                memory:
                    "Personal Memory feature ko secure backend se connect karna baaki hai.",
                quick:
                    "Couple Chat aur Reels actions ko app routes se connect karna baaki hai.",
                settings: "NEXA settings abhi development mein hain."
            };

            addMessage(
                responses[action] || "Batao bhai, kya help chahiye?"
            );
        });
    });

    // ---------------- BACK BUTTON ----------------

    backBtn.addEventListener("click", () => {
        if (wakeMode) {
            disableWakeMode();
        }

        if (history.length > 1) {
            history.back();
        } else {
            window.location.href = "/home";
        }
    });

    updateMicButton();
});
