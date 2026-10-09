"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("messageInput");
    const conversation = document.getElementById("conversation");
    const micBtn = document.getElementById("micBtn");
    const menuBtn = document.getElementById("menuBtn");
    const dropdown = document.getElementById("dropdown");
    const backBtn = document.getElementById("backBtn");

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    let recognition = null;
    let wakeMode = false;
    let waitingForCommand = false;
    let processing = false;
    let speaking = false;
    let restartTimer = null;
    let lastShownTranscript = "";
    let lastShownTime = 0;

    // =========================================
    // DISPLAY MESSAGE
    // =========================================
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

    // =========================================
    // SPEAK REPLY
    // =========================================
    function speakReply(text, callback = () => {}) {
        if (!("speechSynthesis" in window)) {
            callback();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "hi-IN";
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();

        const voice =
            voices.find(v => v.lang.toLowerCase().startsWith("hi")) ||
            voices.find(v => v.lang.toLowerCase().startsWith("en"));

        if (voice) {
            utterance.voice = voice;
        }

        speaking = true;

        utterance.onend = () => {
            speaking = false;
            callback();
        };

        utterance.onerror = () => {
            speaking = false;
            callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    // =========================================
    // TEXT NORMALIZATION
    // =========================================
    function normalizeText(text) {
        return String(text || "")
            .toLowerCase()
            .replace(/[.,!?।]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // Supports English and common Hindi wake-word spellings.
    function extractWakeCommand(text) {
        const normalized = normalizeText(text);

        const pattern =
            /\bhey\s+nexa\b|\bhey\s+nex[a-z]*\b|हे\s*नेक्सा|है\s*नेक्सा|नेक्सा/i;

        const match = pattern.exec(normalized);

        if (!match) {
            return null;
        }

        return normalized
            .slice(match.index + match[0].length)
            .trim();
    }

    // =========================================
    // MICROPHONE BUTTON
    // =========================================
    function updateMicButton() {
        micBtn.textContent = wakeMode ? "🔴" : "🎙";

        micBtn.setAttribute(
            "aria-label",
            wakeMode
                ? "Stop NEXA voice listening"
                : "Start NEXA voice listening"
        );

        micBtn.title = wakeMode
            ? "NEXA listening is ON"
            : "Start NEXA voice assistant";
    }

    // =========================================
    // SPEECH RECOGNITION
    // =========================================
    function createRecognition() {
        if (!SpeechRecognition) {
            addMessage(
                "Voice input is browser mein supported nahi hai. Updated Google Chrome mein Usanex kholo."
            );
            return false;
        }

        recognition = new SpeechRecognition();

        // Hindi is the primary recognition language.
        recognition.lang = "hi-IN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => {
            console.log("NEXA: Microphone recognition started.");
        };

        recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const result = event.results[i];

                // Log interim words for troubleshooting.
                if (!result.isFinal) {
                    interimText += " " + result[0].transcript;
                    continue;
                }

                // Check alternatives in case the first one is incorrect.
                let chosenText = result[0].transcript;

                for (let j = 0; j < result.length; j++) {
                    const alternative = result[j].transcript;

                    if (extractWakeCommand(alternative) !== null) {
                        chosenText = alternative;
                        break;
                    }
                }

                finalText += " " + chosenText;
            }

            if (interimText.trim()) {
                console.log("NEXA hearing:", interimText.trim());
            }

            if (finalText.trim()) {
                console.log("NEXA recognized:", finalText.trim());
                handleRecognizedSpeech(finalText.trim());
            }
        };

        recognition.onerror = (event) => {
            const error = event.error || "unknown";

            console.error("NEXA voice error:", error);

            const explanations = {
                "not-allowed":
                    "Chrome mein microphone permission Allow karo.",
                "service-not-allowed":
                    "Browser speech recognition service ne request block ki.",
                "audio-capture":
                    "Microphone available nahi hai. Phone ki mic settings check karo.",
                "network":
                    "Speech recognition service ka network error hai. Internet aur Chrome speech service check karo.",
                "no-speech":
                    "Awaaz detect nahi hui. Mic ke paas saaf bolo.",
                "language-not-supported":
                    "Hindi recognition language available nahi hai.",
                "aborted":
                    "Voice recognition stop hui."
            };

            // Do not spam messages for repeated no-speech events.
            if (error !== "no-speech" && error !== "aborted") {
                addMessage(
                    "Voice error: " +
                    error +
                    ". " +
                    (explanations[error] ||
                        "Chrome aur microphone settings check karo.")
                );
            }

            if (
                error === "not-allowed" ||
                error === "service-not-allowed"
            ) {
                wakeMode = false;
                waitingForCommand = false;
                updateMicButton();
            }
        };

        recognition.onnomatch = () => {
            // Log only; don't repeatedly add confusing chat messages.
            console.log("NEXA: Speech could not be matched.");
        };

        recognition.onspeechend = () => {
            console.log("NEXA: Speech ended.");
        };

        recognition.onend = () => {
            console.log("NEXA: Recognition ended.");
            scheduleRestart();
        };

        return true;
    }

    // =========================================
    // START / RESTART LISTENING
    // =========================================
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
        } catch (error) {
            // Chrome may report that recognition is already active.
            console.log("NEXA start:", error.message);
        }
    }

    function scheduleRestart() {
        clearTimeout(restartTimer);

        if (wakeMode && !processing && !speaking) {
            restartTimer = setTimeout(() => {
                startRecognition();
            }, 800);
        }
    }

    function stopRecognition() {
        clearTimeout(restartTimer);

        if (recognition) {
            try {
                recognition.stop();
            } catch (_) {}
        }
    }

    function enableWakeMode() {
        if (!window.isSecureContext) {
            addMessage(
                "Microphone ke liye secure HTTPS website zaroori hai."
            );
            return;
        }

        if (!recognition && !createRecognition()) {
            return;
        }

        wakeMode = true;
        waitingForCommand = false;
        updateMicButton();

        addMessage(
            'NEXA voice mode ON hai. "Hey NEXA" bolo, phir apna sawaal bolo.'
        );

        startRecognition();
    }

    function disableWakeMode() {
        wakeMode = false;
        waitingForCommand = false;

        clearTimeout(restartTimer);
        stopRecognition();

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        speaking = false;
        processing = false;

        updateMicButton();

        addMessage("NEXA voice mode band kar diya hai.");
    }

    // =========================================
    // PROCESS SPOKEN WORDS
    // =========================================
    function handleRecognizedSpeech(transcript) {
        if (processing || speaking) {
            return;
        }

        const text = normalizeText(transcript);

        if (!text) {
            return;
        }

        // Show what the browser actually understood.
        const now = Date.now();

        if (
            text !== lastShownTranscript ||
            now - lastShownTime > 5000
        ) {
            console.log("NEXA understood:", transcript);
            lastShownTranscript = text;
            lastShownTime = now;
        }

        const command = extractWakeCommand(text);

        // If NEXA has already asked the user to speak,
        // accept the next words even if wake word is absent.
        if (waitingForCommand) {
            waitingForCommand = false;

            if (command !== null && command) {
                sendMessage(command);
            } else {
                sendMessage(text);
            }

            return;
        }

        // Wake word required for hands-free commands.
        if (command !== null) {
            if (command.length > 0) {
                sendMessage(command);
                return;
            }

            waitingForCommand = true;
            stopRecognition();

            speakReply("Haan, bolo. Main sun raha hoon.", () => {
                if (wakeMode && waitingForCommand) {
                    startRecognition();
                }
            });
        }
    }

    // =========================================
    // SEND MESSAGE TO BACKEND
    // =========================================
    async function sendMessage(rawText) {
        const message = String(rawText || "").trim();

        if (!message || processing) {
            return;
        }

        processing = true;
        waitingForCommand = false;
        stopRecognition();

        addMessage(message, "user");
        input.value = "";

        const pending = addMessage("Ek pal, bhai…");

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
                    data.detail ||
                    "NEXA backend se jawab nahi mila."
                );
            }

            const reply =
                data.reply || "Abhi jawab nahi mil paya.";

            pending.querySelector("p").textContent = reply;

            if (wakeMode) {
                speakReply(reply, () => {
                    processing = false;
                    scheduleRestart();
                });
            } else {
                processing = false;
            }
        } catch (error) {
            pending.querySelector("p").textContent =
                error.message ||
                "NEXA se connection nahi ho paya.";

            processing = false;
            scheduleRestart();
        }
    }

    // =========================================
    // BUTTON EVENTS
    // =========================================
    micBtn.addEventListener("click", () => {
        if (wakeMode) {
            disableWakeMode();
        } else {
            enableWakeMode();
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    document.querySelectorAll("[data-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
            sendMessage(button.dataset.prompt);
        });
    });

    if (menuBtn && dropdown) {
        menuBtn.addEventListener("click", () => {
            const open = !dropdown.hidden;
            dropdown.hidden = open;
            menuBtn.setAttribute("aria-expanded", String(!open));
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
                    private: "Private Chat ko secure backend se connect karna baaki hai.",
                    memory: "Personal Memory feature ko secure backend se connect karna baaki hai.",
                    quick: "Couple Chat aur Reels actions ko app routes se connect karna baaki hai.",
                    settings: "NEXA settings abhi development mein hain."
                };

                addMessage(
                    responses[action] ||
                    "Batao bhai, kya help chahiye?"
                );
            });
        });
    }

    if (backBtn) {
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
    }

    updateMicButton();
});
