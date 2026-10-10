/* =====================================================
   USANEX — NEXA GLOBAL VOICE ASSISTANT
   Blue Neon UI | Draggable | Voice Greeting
   Wake Word: Hello NEXA
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
    let pointerStart = null;

    /* ---------- UI ---------- */

    const style = document.createElement("style");

    style.textContent = `
        #usanexNexaGlobal {
            position: fixed;
            right: 22px;
            bottom: 110px;
            z-index: 99999;
            width: 66px;
            height: 66px;
            padding: 0;
            border: 1.5px solid #52647f;
            border-radius: 50%;
            background: linear-gradient(145deg,#172033,#080d18);
            color: #dceaff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            touch-action: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 4px 15px #0008;
            transition: border-color .25s, box-shadow .25s,
                        background .25s, transform .2s;
        }

        #usanexNexaGlobal .nexa-core {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111b2d;
            border: 1px solid #344663;
            color: #b9d5ff;
            font-size: 22px;
            transition: all .25s;
        }

        #usanexNexaGlobal .nexa-ring {
            position: absolute;
            inset: -5px;
            border: 2px solid transparent;
            border-radius: 50%;
            pointer-events: none;
        }

        #usanexNexaGlobal .nexa-label {
            position: absolute;
            bottom: -19px;
            left: 50%;
            transform: translateX(-50%);
            font: 700 10px Arial,sans-serif;
            letter-spacing: 1.5px;
            color: #9baac1;
            white-space: nowrap;
            text-shadow: none;
        }

        #usanexNexaGlobal.nexa-on {
            border-color: #48a0ff;
            background: radial-gradient(circle,#153b76 0%,#10182b 72%);
            box-shadow: 0 0 10px #1684ff,
                        0 0 25px #167affaa,
                        inset 0 0 12px #1684ff44;
        }

        #usanexNexaGlobal.nexa-on .nexa-core {
            background: radial-gradient(circle,#398dff,#123d91 75%);
            border-color: #9bcbff;
            color: white;
            box-shadow: 0 0 12px #2e91ff,
                        inset 0 0 9px #b5d8ff77;
        }

        #usanexNexaGlobal.nexa-on .nexa-ring {
            border-color: #4da3ff;
            animation: usanexNexaRing 1.8s ease-out infinite;
        }

        #usanexNexaGlobal.nexa-on .nexa-label {
            color: #72baff;
            text-shadow: 0 0 9px #238cff;
        }

        #usanexNexaGlobal.nexa-on.nexa-speaking .nexa-core {
            animation: usanexNexaSpeak .55s ease-in-out infinite alternate;
        }

        #usanexNexaGlobal.nexa-on.nexa-listening .nexa-ring {
            animation-duration: 1.05s;
            border-color: #8dc7ff;
        }

        #usanexNexaGlobal:active {
            transform: scale(.96);
        }

        #usanexNexaStatus {
            position: fixed;
            z-index: 99998;
            left: 50%;
            bottom: 185px;
            transform: translateX(-50%);
            max-width: 85vw;
            padding: 10px 15px;
            border: 1px solid #408cff;
            border-radius: 16px;
            background: #0d1930;
            color: #eaf4ff;
            font: 14px/1.45 Arial,sans-serif;
            text-align: center;
            box-shadow: 0 0 16px #167aff66;
        }

        @keyframes usanexNexaRing {
            0% { transform: scale(.94); opacity: 1; }
            100% { transform: scale(1.28); opacity: 0; }
        }

        @keyframes usanexNexaSpeak {
            from { transform: scale(.96); }
            to { transform: scale(1.07); }
        }

        @media (prefers-reduced-motion: reduce) {
            #usanexNexaGlobal,
            #usanexNexaGlobal * {
                animation-duration: 0.01ms !important;
            }
        }
    `;

    document.head.appendChild(style);

    const widget = document.createElement("button");
    widget.type = "button";
    widget.id = "usanexNexaGlobal";
    widget.setAttribute("aria-label", "Turn NEXA voice assistant on or off");

    widget.innerHTML = `
        <span class="nexa-ring"></span>
        <span class="nexa-core" aria-hidden="true">🎙</span>
        <span class="nexa-label">NEXA</span>
    `;

    const status = document.createElement("div");
    status.id = "usanexNexaStatus";
    status.setAttribute("role", "status");
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
        document.addEventListener("DOMContentLoaded", mountWidget, { once: true });
    }

    const core = widget.querySelector(".nexa-core");

    function setStatus(message, visible = true) {
        status.textContent = message;
        status.style.display = visible && message ? "block" : "none";
    }

    function setVisualState(state) {
        widget.classList.toggle("nexa-on", enabled);
        widget.classList.toggle("nexa-speaking", state === "speaking");
        widget.classList.toggle("nexa-listening", state === "listening");

        if (!enabled) {
            core.textContent = "🎙";
        } else if (state === "speaking") {
            core.textContent = "🔊";
        } else if (state === "listening") {
            core.textContent = "🎙";
        } else {
            core.textContent = "🔵";
        }
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
            old.onerror = null;
            try { old.stop(); } catch (_) {}
        }
    }

    /* ---------- SPEAK ---------- */

    function speak(text, callback) {
        if (!("speechSynthesis" in window)) {
            setStatus("Voice output is not supported by this browser.");
            if (callback) callback();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "hi-IN";
        utterance.rate = 0.95;
        utterance.pitch = 1.05;

        speaking = true;
        setVisualState("speaking");

        utterance.onend = () => {
            speaking = false;
            setVisualState(mode === "wake" || mode === "command"
                ? "listening" : "idle");
            if (callback) callback();
        };

        utterance.onerror = () => {
            speaking = false;
            setVisualState("idle");
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    /* ---------- WAKE WORD ---------- */

    function startWakeListening() {
        if (!enabled || busy || speaking || recognition) return;

        if (!SpeechRecognition) {
            setStatus("Please use a browser that supports voice recognition.");
            return;
        }

        mode = "wake";
        setVisualState("listening");

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

                speak("Yes sir, boliye. Main aapki kya help kar sakta hoon?", () => {
                    if (enabled) startCommandListening();
                });
            }
        };

        instance.onerror = (event) => {
            if (event.error === "not-allowed" ||
                event.error === "service-not-allowed") {
                enabled = false;
                mode = "idle";
                setVisualState("idle");
                setStatus("Microphone permission allow karein.");
            }
        };

        instance.onend = () => {
            if (recognition === instance) recognition = null;

            if (enabled && mode === "wake" && !busy && !speaking) {
                restartTimer = setTimeout(startWakeListening, 900);
            }
        };

        try {
            instance.start();
        } catch (_) {
            recognition = null;
            restartTimer = setTimeout(startWakeListening, 1300);
        }
    }

    /* ---------- COMMAND LISTENING ---------- */

    function startCommandListening() {
        if (!enabled || busy || recognition) return;

        if (!SpeechRecognition) {
            startWakeListening();
            return;
        }

        mode = "command";
        finalTranscript = "";
        setVisualState("listening");
        setStatus("Sir, boliye. Main sun raha hoon.");

        const instance = new SpeechRecognition();
        recognition = instance;
        instance.lang = "hi-IN";
        instance.continuous = true;
        instance.interimResults = true;

        function resetSilenceTimer() {
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => finishCommand(true), SILENCE_LIMIT);
        }

        resetSilenceTimer();

        instance.onresult = (event) => {
            let interim = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const words = result[0].transcript.trim();

                if (result.isFinal && words) {
                    finalTranscript += (finalTranscript ? " " : "") + words;
                } else {
                    interim += words + " ";
                }
            }

            if ((finalTranscript + interim).trim()) {
                setStatus("Aapki baat samajh raha hoon...", false);
                resetSilenceTimer();
            }
        };

        instance.onerror = (event) => {
            if (event.error === "not-allowed" ||
                event.error === "service-not-allowed") {
                enabled = false;
                mode = "idle";
                stopRecognition();
                setVisualState("idle");
                setStatus("Microphone permission allow karein.");
            } else if (event.error !== "aborted") {
                finishCommand(false);
            }
        };

        instance.onend = () => {
            if (recognition === instance) recognition = null;
            if (enabled && mode === "command" && !busy) {
                finishCommand(true);
            }
        };

        try {
            instance.start();
        } catch (_) {
            recognition = null;
            finishCommand(false);
        }
    }

    /* ---------- SEND VOICE QUESTION TO API ---------- */

    async function finishCommand(shouldSend = true) {
        if (mode !== "command") return;

        clearTimeout(silenceTimer);

        const message = finalTranscript.trim();

        stopRecognition();
        mode = "processing";

        if (!shouldSend || !message) {
            mode = "idle";
            setStatus("", false);
            setVisualState("idle");

            if (enabled) {
                restartTimer = setTimeout(startWakeListening, 800);
            }
            return;
        }

        busy = true;
        setVisualState("speaking");
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
                setStatus("", false);

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
            setStatus("Is browser mein voice recognition available nahi hai.");
            return;
        }

        enabled = true;
        busy = false;
        mode = "greeting";

        widget.classList.add("nexa-on");
        setVisualState("speaking");
        setStatus("", false);

        // ON karte hi greeting.
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
        widget.classList.remove("nexa-on", "nexa-speaking", "nexa-listening");
        setVisualState("idle");
        setStatus("", false);
    }

    /* ---------- DRAG ANYWHERE ---------- */

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
        pointerStart = { x: startX, y: startY };

        try { widget.setPointerCapture(event.pointerId); } catch (_) {}
    });

    widget.addEventListener("pointermove", (event) => {
        if (!pointerStart ||
            !widget.hasPointerCapture(event.pointerId)) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.abs(dx) > 7 || Math.abs(dy) > 7) dragged = true;
        if (!dragged) return;

        const x = Math.max(4, Math.min(
            window.innerWidth - widget.offsetWidth - 4,
            originX + dx
        ));

        const y = Math.max(4, Math.min(
            window.innerHeight - widget.offsetHeight - 24,
            originY + dy
        ));

        widget.style.left = x + "px";
        widget.style.top = y + "px";
        widget.style.right = "auto";
        widget.style.bottom = "auto";
    });

    widget.addEventListener("pointerup", (event) => {
        pointerStart = null;

        try {
            if (widget.hasPointerCapture(event.pointerId)) {
                widget.releasePointerCapture(event.pointerId);
            }
        } catch (_) {}

        if (dragged) return;

        if (enabled) turnOff();
        else turnOn();
    });

    widget.addEventListener("pointercancel", () => {
        pointerStart = null;
    });

    setVisualState("idle");
    setStatus("", false);
})();
