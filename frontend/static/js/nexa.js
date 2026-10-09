"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("messageInput");
    const conversation = document.getElementById("conversation");
    const menuBtn = document.getElementById("menuBtn");
    const dropdown = document.getElementById("dropdown");
    const micBtn = document.getElementById("micBtn");
    const backBtn = document.getElementById("backBtn");

    if (!form || !input || !conversation || !micBtn) {
        console.error("NEXA: Required HTML elements missing.");
        return;
    }

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    let recognition = null;
    let wakeMode = false;
    let waitingForCommand = false;
    let processing = false;
    let speaking = false;
    let restartTimer = null;
    let lastError = "";

    // -------------------------------
    // MESSAGE UI
    // -------------------------------
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

    // -------------------------------
    // VOICE OUTPUT
    // -------------------------------
    function speakReply(text, callback = () => {}) {
        if (!("speechSynthesis" in window)) {
            callback();
            return;
        }

        window.speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = "hi-IN";
        speech.rate = 0.95;
        speech.pitch = 1;
        speech.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const voice =
            voices.find(v => v.lang.toLowerCase().startsWith("hi")) ||
            voices.find(v => v.lang.toLowerCase().startsWith("en"));

        if (voice) speech.voice = voice;

        speaking = true;

        speech.onend = () => {
            speaking = false;
            callback();
        };

        speech.onerror = () => {
            speaking = false;
            callback();
        };

        window.speechSynthesis.speak(speech);
    }

    // -------------------------------
    // WAKE WORD
    // -------------------------------
    function normalizeSpeech(text) {
        return text
            .toLowerCase()
            .replace(/[.,!?।]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function extractWakeCommand(text) {
        const normalized = normalizeSpeech(text);

        const wakePattern =
            /\bhey\s+nexa\b|\bhey\s+nex[a-z]*\b|हे\s*नेक्सा|है\s*नेक्सा|नेक्सा/i;

        const match = wakePattern.exec(normalized);

        if (!match) return null;

        return normalized
            .slice(match.index + match[0].length)
            .trim();
    }

    function updateMicButton() {
        micBtn.textContent = wakeMode ? "🔴" : "🎙";

        micBtn.setAttribute(
            "aria-label",
            wakeMode
                ? "Stop NEXA voice listening"
                : "Start NEXA voice listening"
        );

        micBtn.title = wakeMode
            ? "NEXA listening is ON — tap to stop"
            : "Start Hey NEXA voice mode";
    }

    function startRecognition() {
        if (!recognition || !wakeMode || processing || speaking) {
            return;
        }

        try {
            recognition.start();
        } catch (error) {
            // Recognition may already be starting.
            console.log("NEXA start:", error.message);
        }
    }

    function scheduleRecognitionRestart() {
        clearTimeout(restartTimer);

        if (wakeMode && !processing && !speaking) {
            restartTimer = setTimeout(startRecognition, 700);
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

    // -------------------------------
    // SPEECH RECOGNITION SETUP
    // -------------------------------
    function createRecognition() {
        if (!SpeechRecognition) {
            addMessage(
                "Is Chrome/browser mein voice recognition available nahi hai. Chrome update karke dobara try karo."
            );
            return false;
        }

        recognition = new SpeechRecognition();

        // English and Hindi phrases are both supported as attempts.
        recognition.lang = "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => {
            console.log("NEXA: Speech recognition started.");
            lastError = "";
            addMessage(
                'NEXA sun raha hai. "Hey NEXA" bolo, phir apna sawaal bolo.'
            );
        };

        recognition.onresult = (event) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];

                if (result.isFinal) {
                    finalTranscript += " " + result[0].transcript;
                } else {
                    interimTranscript += " " + result[0].transcript;
                }
            }

            if (interimTranscript.trim()) {
                console.log("NEXA heard (interim):", interimTranscript.trim());
            }

            if (finalTranscript.trim()) {
                console.log("NEXA heard:", finalTranscript.trim());
                handleRecognizedSpeech(finalTranscript.trim());
            }
        };

        recognition.onerror = (event) => {
            lastError = event.error || "unknown";
            console.error("NEXA voice error:", lastError);

            const messages = {
                "not-allowed":
                    "Microphone permission blocked hai. Chrome site settings mein Microphone Allow karo.",
                "service-not-allowed":
                    "Browser ne speech service block ki hai. Chrome settings check karo.",
                "audio-capture":
                    "Microphone access nahi mil raha. Phone settings mein mic permission check karo.",
                "network":
                    "Speech recognition network service fail hui. Internet check karo; browser speech service unavailable bhi ho sakti hai.",
                "no-speech":
                    "Awaaz detect nahi hui. Mic ke paas saaf aur thoda zor se bolo.",
                "language-not-supported":
                    "Selected speech language supported nahi hai. Chrome update karke try karo.",
                "aborted":
                    "Voice listening stop hui."
            };

            addMessage(
                "NEXA voice error: " +
                lastError +
                ". " +
                (messages[lastError] || "Chrome microphone aur speech recognition service check karo.")
            );

            if (
                lastError === "not-allowed" ||
                lastError === "service-not-allowed"
            ) {
                wakeMode = false;
                waitingForCommand = false;
                updateMicButton();
            }
        };

        recognition.onnomatch = () => {
            console.log("NEXA: Speech detected but not understood.");
            addMessage(
                "Awaaz mili, lekin samajh nahi aayi. Dheere aur saaf bolo."
            );
        };

        recognition.onspeechend = () => {
            console.log("NEXA: Speech ended.");
        };

        recognition.onend = () => {
            console.log("NEXA: Recognition ended.");

            // Keep trying while voice mode is enabled.
            // Some browser speech services may still stop working.
            scheduleRecognitionRestart();
        };

        return true;
    }

    // -------------------------------
    // START / STOP VOICE MODE
    // -------------------------------
    function enableWakeMode() {
        if (!window.isSecureContext) {
            addMessage(
                "Microphone ke liye HTTPS zaroori hai. Usanex ko secure HTTPS URL par kholo."
            );
            return;
        }

        if (!SpeechRecognition) {
            addMessage(
                "Voice input is browser mein supported nahi hai. Updated Google Chrome try karo."
            );
            return;
        }

        if (!recognition && !createRecognition()) return;

        wakeMode = true;
        waitingForCommand = false;
        updateMicButton();

        // Ask for microphone permission through the browser.
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
        addMessage("NEXA voice listening band kar di gayi hai.");
    }

    // -------------------------------
    // HANDLE SPOKEN COMMAND
    // -------------------------------
    function handleRecognizedSpeech(transcript) {
        if (processing || speaking) return;

        const command = extractWakeCommand(transcript);

        if (waitingForCommand) {
            waitingForCommand = false;

            if (command !== null && command) {
                sendMessage(command);
                return;
            }

            const cleanText = normalizeSpeech(transcript);

            if (cleanText) {
                sendMessage(cleanText);
            }

            return;
        }

        // Only respond to commands containing the wake word.
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

    // -------------------------------
    // SEND MESSAGE TO NEXA BACKEND
    // -------------------------------
    async function sendMessage(rawText) {
        const message = String(rawText || "").trim();

        if (!message || processing) return;

        processing = true;
        waitingForCommand = false;
        stopRecognition();

        addMessage(message, "user");
        input.value = "";

        const pending = addMessage("Ek pal, bhai…");

        try {
            const response = await fetch("/api/ai-assistant/chat", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail || "NEXA backend se jawab nahi mila."
                );
            }

            pending.querySelector("p").textContent =
                data.reply || "Abhi jawab nahi mil paya.";

            const reply = pending.querySelector("p").textContent;

            if (wakeMode) {
                speakReply(reply, () => {
                    processing = false;
                    scheduleRecognitionRestart();
                });
            } else {
                processing = false;
            }
        } catch (error) {
            pending.querySelector("p").textContent =
                error.message || "NEXA se connection nahi ho paya.";

            processing = false;
            scheduleRecognitionRestart();
        }
    }

    // -------------------------------
    // BUTTONS / MENU
    // -------------------------------
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
                    responses[action] || "Batao bhai, kya help chahiye?"
                );
            });
        });
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            if (wakeMode) disableWakeMode();

            if (history.length > 1) {
                history.back();
            } else {
                window.location.href = "/home";
            }
        });
    }

    updateMicButton();
});
