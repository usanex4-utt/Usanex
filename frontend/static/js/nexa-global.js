
/* =====================================================
   USANEX — NEXA GLOBAL VOICE ASSISTANT
   Pink Floating Button + Voice Greeting + Wake Word
===================================================== */

(() => {
    "use strict";

    if (window.__USANEX_NEXA_GLOBAL__) return;
    window.__USANEX_NEXA_GLOBAL__ = true;

    const API_URL = "/api/ai-assistant/chat";
    const SpeechRecognition =
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

    /* ---------- Floating Pink Button ---------- */

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
        right: "22px",
        bottom: "110px",
        zIndex: "99999",
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
        background: "radial-gradient(circle, #7024a9, #16091f 75%)",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "700",
        boxShadow: "0 0 14px #ff36d7, 0 0 30px #ff36d788",
        cursor: "grab",
        touchAction: "none",
        userSelect: "none"
    });

    const orb = widget.querySelector(".nexa-global-orb");
    const label = widget.querySelector(".nexa-global-label");

    orb.style.fontSize = "24px";

    const styles = document.createElement("style");
    styles.textContent = `
        @keyframes nexaPinkPulse {
            0%,100% {
                box-shadow: 0 0 12px #ff36d7, 0 0 24px #ff36d766;
            }
            50% {
                box-shadow: 0 0 22px #ff36d7, 0 0 42px #ff36d7aa;
            }
        }
        #usanexNexaGlobal {
            animation: nexaPinkPulse 2s ease-in-out infinite;
        }
        #usanexNexaStatus {
            position: fixed;
            z-index: 99998;
            left: 50%;
            bottom: 175px;
            transform: translateX(-50%);
            max-width: 85vw;
            padding: 10px 16px;
            border: 1px solid #ff65dc;
            border-radius: 18px;
            background: #170d24;
            color: white;
            font: 14px sans-serif;
            text-align: center;
            box-shadow: 0 0 15px #ff36d766;
        }
    `;
    document.head.appendChild(styles);

    const status = document.createElement("div");
    status.id = "usanexNexaStatus";
    status.style.display = "none";
    document.body.appendChild(widget);
    document.body.appendChild(status);

    function setStatus(message, visible = true) {
        status.textContent = message;
        status.style.display = visible ? "block" : "none";
    }

    function clearTimers() {
        clearTimeout(silenceTimer);
        clearTimeout(restartTimer);
        silenceTimer = null;
        restartTimer = null;
    }

    function stopRecognition() {
        clearTimers();

        if (recognition) {
            const old = recognition;
            recognition = null;
            old.onend = null;

            try {
                old.stop();
            } catch (_) {}
        }
    }

    /* ---------- NEXA Speaks ---------- */

    function speak(text, callback) {
        if (!("speechSynthesis" in window)) {
            setStatus("Is browser mein voice output available nahi hai.");
            if (callback) callback();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "hi-IN";
        utterance.rate = 0.95;
        utterance.pitch = 1.05;

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

    /* ---------- Wake Word Listener ---------- */

    function startWakeListening() {
        if (!enabled || busy || speaking || recognition) return;

        if (!SpeechRecognition) {
            setStatus("Voice recognition supported nahi hai.");
            return;
        }

        mode = "wake";
        setStatus('“Hello NEXA” boliye', false);

        const instance = new SpeechRecognition();
        recognition = instance;
        instance.lang = "en-IN";
        instance.continuous = true;
        instance.interimResults = true;

        instance.onresult = (event) => {
            let heard = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                heard += event.results[i][0].transcript + " ";
            }

            if (/hello\s+nexa|hey\s+nexa|हेलो\s+नेक्सा|हैलो\s+नेक्सा/i.test(heard)) {
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
            if (event.error === "not-allowed" ||
                event.error === "service-not-allowed") {
                enabled = false;
                mode = "idle";
                setStatus("Microphone permission allow karein.");
            }
        };

        instance.onend = () => {
            if (recognition === instance) recognition = null;

            if (enabled && mode === "wake" && !busy && !speaking) {
                restartTimer = setTimeout(startWakeListening, 800);
            }
        };

        try {
            instance.start();
        } catch (_) {
            recognition = null;
            restartTimer = setTimeout(startWakeListening, 1200);
        }
    }

    /* ---------- Listen to User Question ---------- */

    function startCommandListening() {
        if (!enabled || busy || recognition) return;

        mode = "command";
        finalTranscript = "";
        setStatus("Sir, boliye. Main sun raha hoon.");

        if (!SpeechRecognition) return;

        const instance = new SpeechRecognition();
        recognition = instance;
        instance.lang = "hi-IN";
        instance.continuous = true;
        instance.interimResults = true;

        function resetSilenceTimer() {
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => finishCommand(), SILENCE_LIMIT);
        }

        resetSilenceTimer();

        instance.onresult = (event) => {
            let interim = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const words = result[0].transcript.trim();

                if (result.isFinal && words) {
                    finalTranscript +=
                        (finalTranscript ? " " : "") + words;
                } else {
                    interim += words + " ";
                }
            }

            if ((finalTranscript + interim).trim()) {
                setStatus("NEXA sun raha hai...", false);
                resetSilenceTimer();
            }
        };

        instance.onerror = (event) => {
            if (event.error === "not-allowed") {
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
            if (enabled && mode === "command" && !busy) {
                finishCommand();
            }
        };

        try {
            instance.start();
        } catch (_) {
            recognition = null;
            finishCommand(false);
        }
    }

    /* ---------- Send Question to NEXA ---------- */

    async function finishCommand(shouldSend = true) {
        if (mode !== "command") return;

        clearTimeout(silenceTimer);

        const message = finalTranscript.trim();

        stopRecognition();
        mode = "processing";

        if (!shouldSend || !message) {
            mode = "idle";
            setStatus("", false);

            if (enabled) {
                restartTimer = setTimeout(startWakeListening, 700);
            }
            return;
        }

        busy = true;
        setStatus("", false);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

                if (enabled) {
                    restartTimer = setTimeout(startWakeListening, 800);
                }
            });

        } catch (error) {
            console.error("NEXA voice error:", error);
            busy = false;
            mode = "idle";

            speak("Sorry sir, abhi connection mein problem hai.", () => {
                if (enabled) startWakeListening();
            });
        }
    }

    /* ---------- ON / OFF ---------- */

    function turnOn() {
        if (!SpeechRecognition) {
            setStatus("Aapka browser voice recognition support nahi karta.");
            return;
        }

        enabled = true;
        busy = false;
        widget.style.opacity = "1";
        label.textContent = "NEXA";
        orb.textContent = "🎙️";

        // ON karte hi automatic greeting.
        mode = "greeting";
        setStatus("", false);

        speak("Hello sir, kaise hain aap?", () => {
            if (enabled) startWakeListening();
        });
    }

    function turnOff() {
        enabled = false;
        busy = false;
        mode = "idle";
        stopRecognition();

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        speaking = false;
        widget.style.opacity = "0.85";
        label.textContent = "NEXA";
        orb.textContent = "🎙️";

        // No unwanted OFF/listening message.
        setStatus("", false);
    }

    /* ---------- Drag Button Anywhere ---------- */

    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    widget.addEventListener("pointerdown", (event) => {
        startX = event.clientX;
        startY = event.clientY;

        const rect = widget.getBoundingClientRect();
        originX = rect.left;
        originY = rect.top;
        dragged = false;

        widget.setPointerCapture(event.pointerId);
    });

    widget.addEventListener("pointermove", (event) => {
        if (!widget.hasPointerCapture(event.pointerId)) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.abs(dx) > 7 || Math.abs(dy) > 7) dragged = true;
        if (!dragged) return;

        const x = Math.max(0, Math.min(
            window.innerWidth - widget.offsetWidth,
            originX + dx
        ));

        const y = Math.max(0, Math.min(
            window.innerHeight - widget.offsetHeight,
            originY + dy
        ));

        widget.style.left = x + "px";
        widget.style.top = y + "px";
        widget.style.right = "auto";
        widget.style.bottom = "auto";
    });

    widget.addEventListener("pointerup", (event) => {
        if (widget.hasPointerCapture(event.pointerId)) {
            widget.releasePointerCapture(event.pointerId);
        }

        if (!dragged) {
            if (enabled) turnOff();
            else turnOn();
        }
    });

    // Initial state: wait for a tap to enable microphone/audio.
    setStatus("", false);
})();
