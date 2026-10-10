
/* =========================================================
   USANEX — NEXA GLOBAL VOICE ASSISTANT
   Pink Floating Button • Voice Greeting • Wake Word
========================================================= */

(() => {
    "use strict";

    if (window.__USANEX_NEXA_GLOBAL__) return;
    window.__USANEX_NEXA_GLOBAL__ = true;

    const API_URL = "/api/ai-assistant/chat";
    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    const SILENCE_LIMIT = 10000;

    let enabled = false;
    let mode = "idle";
    let recognition = null;
    let silenceTimer = null;
    let restartTimer = null;
    let finalTranscript = "";
    let busy = false;
    let speaking = false;
    let dragged = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let buttonStartX = 0;
    let buttonStartY = 0;

    /* ---------- PINK FLOATING BUTTON ---------- */

    const widget = document.createElement("button");
    widget.type = "button";
    widget.id = "usanexNexaGlobal";
    widget.setAttribute("aria-label", "NEXA Voice Assistant");

    widget.innerHTML = `
        <span class="nexa-global-orb">🎙️</span>
        <span class="nexa-global-label">NEXA</span>
    `;

    Object.assign(widget.style, {
        position: "fixed",
        right: "20px",
        bottom: "115px",
        zIndex: "999999",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        width: "72px",
        height: "72px",
        padding: "0",
        border: "2px solid #ff65dc",
        borderRadius: "50%",
        background: "radial-gradient(circle, #7627ad, #16091f 75%)",
        color: "#fff",
        fontSize: "12px",
        fontWeight: "700",
        boxShadow: "0 0 15px #ff36d7, 0 0 32px #ff36d788",
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent"
    });

    const orb = widget.querySelector(".nexa-global-orb");
    const label = widget.querySelector(".nexa-global-label");
    orb.style.fontSize = "24px";

    const style = document.createElement("style");
    style.textContent = `
        @keyframes nexaPinkPulse {
            0%, 100% {
                box-shadow: 0 0 12px #ff36d7, 0 0 24px #ff36d766;
            }
            50% {
                box-shadow: 0 0 23px #ff36d7, 0 0 42px #ff36d7bb;
            }
        }

        #usanexNexaGlobal {
            animation: nexaPinkPulse 1.8s ease-in-out infinite;
        }

        #usanexNexaGlobal.nexa-active {
            border-color: #ffb0ef;
            background: radial-gradient(circle, #e72ab9, #340b4d 75%);
        }

        #usanexNexaStatus {
            position: fixed;
            z-index: 999998;
            left: 50%;
            bottom: 190px;
            transform: translateX(-50%);
            width: max-content;
            max-width: 82vw;
            padding: 10px 15px;
            border: 1px solid #ff65dc;
            border-radius: 16px;
            background: #170d24;
            color: white;
            font: 14px sans-serif;
            text-align: center;
            box-shadow: 0 0 16px #ff36d766;
        }
    `;

    document.head.appendChild(style);

    const status = document.createElement("div");
    status.id = "usanexNexaStatus";
    status.style.display = "none";

    function mountWidget() {
        if (!document.body.contains(widget)) {
            document.body.appendChild(widget);
        }

        if (!document.body.contains(status)) {
            document.body.appendChild(status);
        }
    }

    if (document.body) {
        mountWidget();
    } else {
        document.addEventListener("DOMContentLoaded", mountWidget, {
            once: true
        });
    }

    function setStatus(message, visible = true) {
        status.textContent = message;
        status.style.display = visible && message ? "block" : "none";
    }

    function clearTimers() {
        clearTimeout(silenceTimer);
        clearTimeout(restartTimer);
        silenceTimer = null;
        restartTimer = null;
    }

    function stopRecognition() {
        clearTimers();

        const old = recognition;
        recognition = null;

        if (old) {
            old.onend = null;
            old.onresult = null;
            old.onerror = null;

            try {
                old.abort();
            } catch (_) {}
        }
    }

    /* ---------- SPEAK OUT LOUD ---------- */

    function speak(message, callback) {
        if (!("speechSynthesis" in window) ||
            typeof SpeechSynthesisUtterance === "undefined") {
            setStatus("Is browser mein voice output available nahi hai.");
            if (callback) callback();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = "hi-IN";
        utterance.rate = 0.92;
        utterance.pitch = 1.08;
        utterance.volume = 1;

        speaking = true;
        widget.classList.add("nexa-active");

        utterance.onend = () => {
            speaking = false;
            widget.classList.remove("nexa-active");
            if (callback) callback();
        };

        utterance.onerror = () => {
            speaking = false;
            widget.classList.remove("nexa-active");
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    /* ---------- RESTART WAKE LISTENING ---------- */

    function scheduleWakeListening(delay = 800) {
        clearTimeout(restartTimer);

        restartTimer = setTimeout(() => {
            if (enabled && !busy && !speaking && !recognition) {
                startWakeListening();
            }
        }, delay);
    }

    /* ---------- WAKE WORD: HELLO NEXA ---------- */

    function startWakeListening() {
        if (!enabled || busy || speaking || recognition) return;

        if (!Recognition) {
            setStatus("Voice recognition ke liye Chrome use karein.");
            return;
        }

        mode = "wake";
        setStatus("", false);

        const instance = new Recognition();
        recognition = instance;

        instance.lang = "en-IN";
        instance.continuous = true;
        instance.interimResults = true;

        instance.onresult = (event) => {
            let heard = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                heard += event.results[i][0].transcript + " ";
            }

            const text = heard.toLowerCase();

            if (
                /hello\s+nexa|hey\s+nexa|हेलो\s+नेक्सा|हैलो\s+नेक्सा/i.test(text)
            ) {
                stopRecognition();
                mode = "greeting";

                speak(
                    "Yes sir, boliye. Main aapki kya help kar sakta hoon?",
                    () => {
                        if (enabled) startCommandListening();
                    }
                );
            }
        };

        instance.onerror = (event) => {
            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {
                enabled = false;
                mode = "idle";
                stopRecognition();
                setStatus("Microphone permission allow karein.");
            }
        };

        instance.onend = () => {
            if (recognition === instance) recognition = null;

            if (enabled && mode === "wake" && !busy && !speaking) {
                scheduleWakeListening(900);
            }
        };

        try {
            instance.start();
        } catch (_) {
            if (recognition === instance) recognition = null;
            scheduleWakeListening(1500);
        }
    }

    /* ---------- LISTEN TO COMMAND: 10 SECOND SILENCE ---------- */

    function startCommandListening() {
        if (!enabled || busy || recognition) return;

        if (!Recognition) {
            scheduleWakeListening();
            return;
        }

        mode = "command";
        finalTranscript = "";
        setStatus("Sir, boliye.");

        const instance = new Recognition();
        recognition = instance;

        instance.lang = "hi-IN";
        instance.continuous = true;
        instance.interimResults = true;

        function resetSilenceTimer() {
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                finishCommand(true);
            }, SILENCE_LIMIT);
        }

        // User ke bolna shuru karne ke liye bhi 10 sec.
        resetSilenceTimer();

        instance.onresult = (event) => {
            let interim = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const words = result[0].transcript.trim();

                if (result.isFinal && words) {
                    finalTranscript +=
                        (finalTranscript ? " " : "") + words;
                } else if (words) {
                    interim += words + " ";
                }
            }

            if ((finalTranscript + interim).trim()) {
                setStatus("", false);
                resetSilenceTimer();
            }
        };

        instance.onerror = (event) => {
            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {
                enabled = false;
                mode = "idle";
                stopRecognition();
                setStatus("Microphone permission allow karein.");
            } else if (event.error !== "aborted") {
                finishCommand(false);
            }
        };

        instance.onend = () => {
            if (recognition === instance) recognition = null;

            // Natural end par final transcript bhejein.
            if (enabled && mode === "command" && !busy) {
                finishCommand(true);
            }
        };

        try {
            instance.start();
        } catch (_) {
            if (recognition === instance) recognition = null;
            finishCommand(false);
        }
    }

    /* ---------- SEND QUESTION TO BACKEND ---------- */

    async function finishCommand(shouldSend = true) {
        if (mode !== "command") return;

        clearTimeout(silenceTimer);

        const message = finalTranscript.trim();

        stopRecognition();
        mode = "processing";

        if (!shouldSend || !message) {
            mode = "idle";
            setStatus("", false);
            scheduleWakeListening(700);
            return;
        }

        busy = true;
        setStatus("", false);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "NEXA request failed");
            }

            const reply =
                data.reply ||
                data.response ||
                data.answer ||
                data.message ||
                data.text ||
                "Sir, abhi jawab nahi mil paya.";

            speak(reply, () => {
                busy = false;
                mode = "idle";
                scheduleWakeListening(800);
            });
        } catch (error) {
            console.error("NEXA voice error:", error);

            busy = false;
            mode = "idle";

            speak("Sorry sir, abhi connection mein problem hai.", () => {
                scheduleWakeListening(800);
            });
        }
    }

    /* ---------- TURN ON ---------- */

    function turnOn() {
        if (enabled) {
            // Active hone par tap = stop.
            turnOff();
            return;
        }

        enabled = true;
        busy = false;
        mode = "greeting";

        widget.style.opacity = "1";
        label.textContent = "NEXA";
        orb.textContent = "🎙️";
        widget.classList.add("nexa-active");

        setStatus("", false);

        // Tap karte hi greeting bolega.
        speak("Hello sir, kaise hain aap?", () => {
            widget.classList.remove("nexa-active");

            if (enabled) {
                if (Recognition) {
                    startWakeListening();
                } else {
                    setStatus("Voice recognition ke liye Chrome use karein.");
                }
            }
        });
    }

    /* ---------- TURN OFF ---------- */

    function turnOff() {
        enabled = false;
        busy = false;
        speaking = false;
        mode = "idle";

        stopRecognition();

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        widget.style.opacity = "0.85";
        widget.classList.remove("nexa-active");
        label.textContent = "NEXA";
        orb.textContent = "🎙️";

        setStatus("", false);
    }

    /* ---------- DRAG ANYWHERE ---------- */

    widget.addEventListener("pointerdown", (event) => {
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;

        const rect = widget.getBoundingClientRect();
        buttonStartX = rect.left;
        buttonStartY = rect.top;

        dragged = false;

        try {
            widget.setPointerCapture(event.pointerId);
        } catch (_) {}
    });

    widget.addEventListener("pointermove", (event) => {
        if (!widget.hasPointerCapture(event.pointerId)) return;

        const dx = event.clientX - pointerStartX;
        const dy = event.clientY - pointerStartY;

        if (Math.abs(dx) > 7 || Math.abs(dy) > 7) {
            dragged = true;
        }

        if (!dragged) return;

        const x = Math.max(
            0,
            Math.min(window.innerWidth - widget.offsetWidth, buttonStartX + dx)
        );

        const y = Math.max(
            0,
            Math.min(window.innerHeight - widget.offsetHeight, buttonStartY + dy)
        );

        widget.style.left = x + "px";
        widget.style.top = y + "px";
        widget.style.right = "auto";
        widget.style.bottom = "auto";
    });

    widget.addEventListener("pointerup", (event) => {
        try {
            if (widget.hasPointerCapture(event.pointerId)) {
                widget.releasePointerCapture(event.pointerId);
            }
        } catch (_) {}

        if (!dragged) {
            turnOn();
        }

        dragged = false;
    });

    widget.addEventListener("pointercancel", () => {
        dragged = false;
    });

    /* ---------- INITIAL STATE ---------- */

    setStatus("", false);

})();
