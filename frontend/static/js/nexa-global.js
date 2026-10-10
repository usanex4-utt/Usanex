
/* =====================================================
   USANEX — GLOBAL NEXA VOICE ASSISTANT
   Wake word: Hello NEXA
   Works on pages where this script is loaded
===================================================== */

(() => {
    "use strict";

    if (window.__USANEX_NEXA_GLOBAL__) return;
    window.__USANEX_NEXA_GLOBAL__ = true;

    const API_URL = "/api/ai-assistant/chat";
    const WAKE_LANGUAGE = "en-IN";
    const COMMAND_LANGUAGE = "hi-IN";
    const SILENCE_LIMIT = 10000;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    let recognition = null;
    let mode = "idle";
    let enabled = false;
    let speaking = false;
    let busy = false;
    let silenceTimer = null;
    let finalTranscript = "";
    let restartTimer = null;

    // Floating NEXA status indicator
    const widget = document.createElement("button");
    widget.type = "button";
    widget.id = "usanexNexaGlobal";
    widget.innerHTML = `
        <span class="nexa-global-orb"></span>
        <span class="nexa-global-label">NEXA</span>
    `;

    Object.assign(widget.style, {
        position: "fixed",
        right: "18px",
        bottom: "90px",
        zIndex: "99999",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px 15px",
        border: "1px solid #4269ff",
        borderRadius: "30px",
        background: "#10172a",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 4px 22px #4269ff55",
        cursor: "pointer"
    });

    const orb = widget.querySelector(".nexa-global-orb");

    Object.assign(orb.style, {
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "#6885ff",
        boxShadow: "0 0 12px #6885ff"
    });

    const label = widget.querySelector(".nexa-global-label");

    document.body.appendChild(widget);

    // Status message
    const status = document.createElement("div");
    status.id = "usanexNexaStatus";
    status.textContent = "NEXA ready";
    Object.assign(status.style, {
        position: "fixed",
        right: "18px",
        bottom: "145px",
        zIndex: "99999",
        maxWidth: "calc(100vw - 36px)",
        padding: "10px 14px",
        borderRadius: "12px",
        background: "#10172a",
        color: "#ffffff",
        fontSize: "13px",
        display: "none",
        boxShadow: "0 4px 20px #0005"
    });

    document.body.appendChild(status);

    function setStatus(message, color = "#6885ff") {
        status.textContent = message;
        status.style.display = "block";
        orb.style.background = color;
        orb.style.boxShadow = `0 0 12px ${color}`;
    }

    function clearSilenceTimer() {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }

    function stopRecognition() {
        clearTimeout(restartTimer);
        clearSilenceTimer();

        if (recognition) {
            recognition.onend = null;

            try {
                recognition.stop();
            } catch (_) {}

            recognition = null;
        }
    }

    function speak(text, callback) {
        if (!("speechSynthesis" in window)) {
            if (callback) callback();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "hi-IN";
        utterance.rate = 1;
        utterance.pitch = 1;

        speaking = true;

        utterance.onend = () => {
            speaking = false;
            if (callback) callback();
        };

        utterance.onerror = () => {
            speaking = false;
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    function createRecognition(language, continuous = true) {
        const instance = new SpeechRecognition();

        instance.lang = language;
        instance.continuous = continuous;
        instance.interimResults = true;
        instance.maxAlternatives = 1;

        return instance;
    }

    function startWakeListening() {
        if (!enabled || busy || speaking) return;

        if (!SpeechRecognition) {
            setStatus("Is browser mein voice recognition supported nahi hai.", "#ff6464");
            return;
        }

        stopRecognition();
        mode = "wake";
        setStatus('Listening — "Hello NEXA" boliye');

        const instance = createRecognition(WAKE_LANGUAGE, true);
        recognition = instance;

        instance.onresult = (event) => {
            let heard = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                heard += event.results[i][0].transcript + " ";
            }

            const normalized = heard.toLowerCase();

            if (
                /hello\s+nexa|hey\s+nexa|हेलो\s+नेक्सा|हैलो\s+नेक्सा|हे\s+नेक्सा/i
                    .test(normalized)
            ) {
                stopRecognition();
                mode = "greeting";
                setStatus("NEXA is ready", "#41d995");

                speak(
                    "Yes sir, boliye. Main aapki kya help kar sakta hoon?",
                    () => {
                        if (enabled) startCommandListening();
                    }
                );
            }
        };

        instance.onerror = (event) => {
            if (event.error === "not-allowed" ||
                event.error === "service-not-allowed") {
                enabled = false;
                mode = "idle";
                setStatus("Microphone permission allow karein.", "#ff6464");
            }
        };

        instance.onend = () => {
            if (recognition === instance) recognition = null;

            if (enabled && mode === "wake" && !busy && !speaking) {
                restartTimer = setTimeout(startWakeListening, 700);
            }
        };

        try {
            instance.start();
        } catch (_) {
            recognition = null;
            restartTimer = setTimeout(startWakeListening, 1200);
        }
    }

    function startCommandListening() {
        if (!enabled || busy) return;

        stopRecognition();
        finalTranscript = "";
        mode = "command";

        setStatus("Sir, main sun raha hoon...");

        const instance = createRecognition(COMMAND_LANGUAGE, true);
        recognition = instance;

        function resetSilenceTimer() {
            clearSilenceTimer();

            silenceTimer = setTimeout(() => {
                finishCommand();
            }, SILENCE_LIMIT);
        }

        // Silence countdown starts as soon as command mode opens.
        resetSilenceTimer();

        instance.onresult = (event) => {
            let interim = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript.trim();

                if (result.isFinal && text) {
                    finalTranscript +=
                        (finalTranscript ? " " : "") + text;
                } else if (text) {
                    interim += text + " ";
                }
            }

            const currentText = (finalTranscript + " " + interim).trim();

            if (currentText) {
                setStatus("Aap: " + currentText);
                resetSilenceTimer();
            }
        };

        instance.onerror = (event) => {
            if (event.error === "not-allowed") {
                enabled = false;
                mode = "idle";
                stopRecognition();
                setStatus("Microphone permission allow karein.", "#ff6464");
            } else if (event.error !== "aborted") {
                finishCommand(false);
            }
        };

        instance.onend = () => {
            if (recognition === instance) recognition = null;

            if (enabled && mode === "command" && !busy) {
                finishCommand();
            }
        };

        try {
            instance.start();
        } catch (_) {
            finishCommand(false);
        }
    }

    async function finishCommand(shouldSend = true) {
        if (mode !== "command") return;

        clearSilenceTimer();

        const message = finalTranscript.trim();

        stopRecognition();
        mode = "processing";

        if (!shouldSend || !message) {
            setStatus("10 seconds tak awaaz nahi aayi. Mic band hai.");
            mode = "idle";

            if (enabled) {
                setTimeout(startWakeListening, 800);
            }
            return;
        }

        busy = true;
        setStatus("NEXA jawab taiyar kar raha hai...");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    message: message
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || data.message || "NEXA request failed"
                );
            }

            const reply =
                data.reply ||
                data.response ||
                data.answer ||
                data.message ||
                data.text ||
                "Sir, abhi jawab nahi mil paya.";

            setStatus("NEXA: " + reply);
            speak(reply, () => {
                busy = false;
                mode = "idle";

                if (enabled) {
                    setTimeout(startWakeListening, 800);
                }
            });

        } catch (error) {
            console.error("NEXA error:", error);
            setStatus("NEXA se connect nahi ho paya. API check karein.", "#ff6464");
            speak("Sorry sir, abhi connection mein problem hai.", () => {
                busy = false;
                mode = "idle";

                if (enabled) {
                    setTimeout(startWakeListening, 1000);
                }
            });
        }
    }

    widget.addEventListener("click", () => {
        if (!SpeechRecognition) {
            setStatus("Voice recognition supported nahi hai.", "#ff6464");
            return;
        }

        if (enabled) {
            enabled = false;
            mode = "idle";
            busy = false;
            stopRecognition();

            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }

            speaking = false;
            widget.style.opacity = "0.65";
            label.textContent = "NEXA OFF";
            setStatus("NEXA voice listening band hai.");
            return;
        }

        enabled = true;
        manuallyStart();
    });

    function manuallyStart() {
        widget.style.opacity = "1";
        label.textContent = "NEXA ON";

        // Start microphone from this user gesture.
        startWakeListening();
    }

    // Initial state: do not activate microphone without permission/gesture.
    setStatus('NEXA start karne ke liye button dabayein.');
})();
