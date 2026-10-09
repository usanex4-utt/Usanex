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
    let listening = false;
    let processing = false;
    let speaking = false;
    let waitingForCommand = false;
    let restartTimer = null;
    let languageIndex = 0;

    const languages = ["hi-IN", "en-IN"];

    // -----------------------------
    // DISPLAY CHAT MESSAGE
    // -----------------------------
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

    // -----------------------------
    // VOICE REPLY
    // -----------------------------
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

        const voices = window.speechSynthesis.getVoices();
        const voice =
            voices.find(v => v.lang.toLowerCase().startsWith("hi")) ||
            voices.find(v => v.lang.toLowerCase().startsWith("en"));

        if (voice) utterance.voice = voice;

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

    // -----------------------------
    // WAKE WORD DETECTION
    // -----------------------------
    function normalize(text) {
        return String(text || "")
            .toLowerCase()
            .replace(/[.,!?।]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getCommand(text) {
        const clean = normalize(text);
        const pattern =
            /\bhey\s+nexa\b|\bhey\s+nex[a-z]*\b|हे\s*नेक्सा|है\s*नेक्सा|नेक्सा/i;

        const match = pattern.exec(clean);

        if (!match) return null;

        return clean.slice(match.index + match[0].length).trim();
    }

    // -----------------------------
    // MICROPHONE BUTTON
    // -----------------------------
    function updateMic() {
        micBtn.textContent = listening ? "🔴" : "🎙";
        micBtn.setAttribute(
            "aria-label",
            listening ? "Stop NEXA voice" : "Start NEXA voice"
        );
        micBtn.title = listening
            ? "NEXA listening — tap to stop"
            : "Start voice assistant";
    }

    // -----------------------------
    // START RECOGNITION
    // -----------------------------
    function startRecognition() {
        if (!recognition || !listening || processing || speaking) return;

        try {
            recognition.start();
        } catch (error) {
            console.log("Recognition start:", error.message);
        }
    }

    function restartRecognition() {
        clearTimeout(restartTimer);

        if (listening && !processing && !speaking) {
            restartTimer = setTimeout(startRecognition, 900);
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

    function createRecognition() {
        if (!SpeechRecognition) {
            addMessage(
                "Voice input supported nahi hai. Updated Google Chrome use karo."
            );
            return false;
        }

        recognition = new SpeechRecognition();
        recognition.lang = languages[languageIndex];
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => {
            console.log("NEXA microphone recognition started.");
        };

        recognition.onresult = event => {
            let finalText = "";
            let interimText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];

                if (result.isFinal) {
                    let selected = result[0].transcript;

                    // Prefer an alternative containing the wake word.
                    for (let j = 0; j < result.length; j++) {
                        if (getCommand(result[j].transcript) !== null) {
                            selected = result[j].transcript;
                            break;
                        }
                    }

                    finalText += " " + selected;
                } else {
                    interimText += " " + result[0].transcript;
                }
            }

            if (interimText.trim()) {
                console.log("NEXA partial transcript:", interimText.trim());
            }

            if (finalText.trim()) {
                console.log("NEXA FINAL TRANSCRIPT:", finalText.trim());
                handleSpeech(finalText.trim());
            }
        };

        recognition.onerror = event => {
            const error = event.error || "unknown";
            console.error("NEXA VOICE ERROR:", error);

            const descriptions = {
                "not-allowed": "Chrome microphone permission Allow karo.",
                "service-not-allowed": "Browser ne speech service block kar di.",
                "audio-capture": "Microphone capture nahi ho pa raha.",
                "network": "Browser speech service ka network error hai.",
                "no-speech": "Awaaz detect nahi hui.",
                "language-not-supported": "Ye recognition language supported nahi hai.",
                "aborted": "Recognition stop hui."
            };

            if (error !== "no-speech" && error !== "aborted") {
                addMessage(
                    "Voice error: " + error + ". " +
                    (descriptions[error] || "Microphone aur Chrome settings check karo.")
                );
            }

            if (error === "language-not-supported") {
                languageIndex = (languageIndex + 1) % languages.length;
                recognition.lang = languages[languageIndex];
                addMessage("Ab voice language " + languages[languageIndex] + " hogi.");
            }

            if (error === "not-allowed" || error === "service-not-allowed") {
                listening = false;
                updateMic();
            }
        };

        // Don't add repeated "could not understand" messages.
        recognition.onnomatch = () => {
            console.log("NEXA: No matching speech result.");
        };

        recognition.onend = () => {
            console.log("NEXA recognition ended.");
            restartRecognition();
        };

        return true;
    }

    // -----------------------------
    // HANDLE SPOKEN COMMAND
    // -----------------------------
    function handleSpeech(transcript) {
        if (processing || speaking) return;

        const text = normalize(transcript);
        if (!text) return;

        // Show the actual words Chrome recognized.
        addMessage("Maine suna: " + transcript);

        const command = getCommand(text);

        if (waitingForCommand) {
            waitingForCommand = false;
            sendMessage(command !== null && command ? command : text);
            return;
        }

        if (command !== null) {
            if (command) {
                sendMessage(command);
            } else {
                waitingForCommand = true;
                stopRecognition();

                speakReply("Haan, bolo. Main sun raha hoon.", () => {
                    if (listening && waitingForCommand) startRecognition();
                });
            }
        }
    }

    // -----------------------------
    // ENABLE / DISABLE VOICE
    // -----------------------------
    function enableVoice() {
        if (!window.isSecureContext) {
            addMessage("Voice ke liye HTTPS zaroori hai.");
            return;
        }

        if (!recognition && !createRecognition()) return;

        listening = true;
        waitingForCommand = false;
        updateMic();

        addMessage('Voice mode ON. "Hey NEXA" bolo, phir apna sawaal poochho.');
        startRecognition();
    }

    function disableVoice() {
        listening = false;
        waitingForCommand = false;
        clearTimeout(restartTimer);
        stopRecognition();

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        speaking = false;
        processing = false;
        updateMic();

        addMessage("NEXA voice mode band hai.");
    }

    // -----------------------------
    // CHAT BACKEND
    // -----------------------------
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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.detail || "NEXA backend se jawab nahi mila.");
            }

            const reply = data.reply || "Abhi jawab nahi mil paya.";
            pending.querySelector("p").textContent = reply;

            if (listening) {
                speakReply(reply, () => {
                    processing = false;
                    restartRecognition();
                });
            } else {
                processing = false;
            }
        } catch (error) {
            pending.querySelector("p").textContent =
                error.message || "NEXA se connection nahi ho paya.";

            processing = false;
            restartRecognition();
        }
    }

    // -----------------------------
    // UI EVENTS
    // -----------------------------
    micBtn.addEventListener("click", () => {
        if (listening) disableVoice();
        else enableVoice();
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        sendMessage(input.value);
    });

    document.querySelectorAll("[data-prompt]").forEach(button => {
        button.addEventListener("click", () => {
            sendMessage(button.dataset.prompt);
        });
    });

    if (menuBtn && dropdown) {
        menuBtn.addEventListener("click", () => {
            dropdown.hidden = !dropdown.hidden;
            menuBtn.setAttribute("aria-expanded", String(!dropdown.hidden));
        });

        document.addEventListener("click", event => {
            if (!event.target.closest(".menu-wrap")) {
                dropdown.hidden = true;
                menuBtn.setAttribute("aria-expanded", "false");
            }
        });

        dropdown.querySelectorAll("[data-action]").forEach(button => {
            button.addEventListener("click", () => {
                const replies = {
                    chat: "Neeche message likhkar chat shuru karo.",
                    private: "Private Chat ko secure backend se connect karna baaki hai.",
                    memory: "Personal Memory feature abhi connect karna baaki hai.",
                    quick: "Couple Chat aur Reels ko app routes se connect karna baaki hai.",
                    settings: "NEXA settings development mein hain."
                };

                dropdown.hidden = true;
                addMessage(replies[button.dataset.action] || "Batao, kya help chahiye?");
            });
        });
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            if (listening) disableVoice();

            if (history.length > 1) history.back();
            else window.location.href = "/home";
        });
    }

    updateMic();
});
