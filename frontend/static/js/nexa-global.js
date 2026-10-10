/* =========================================================
   USANEX — NEXA GLOBAL VOICE ASSISTANT
   Full Replacement
   Wake Word | Voice Reply | Draggable | Neon UI
========================================================= */

(() => {
    "use strict";

    if (window.__USANEX_NEXA_GLOBAL__) return;
    window.__USANEX_NEXA_GLOBAL__ = true;

    const API_URL = "/api/ai-assistant/chat";
    const SILENCE_LIMIT = 10000;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    const SpeechSynthesisUtteranceClass =
        window.SpeechSynthesisUtterance;

    let enabled = false;
    let mode = "idle";
    let recognition = null;
    let silenceTimer = null;
    let restartTimer = null;
    let finalTranscript = "";
    let busy = false;
    let speaking = false;
    let pointerStart = null;
    let dragged = false;
    let speechGeneration = 0;

    /* ================= UI STYLES ================= */

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
            -webkit-user-select: none;
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

        #usanexNexaStatus {
            position: fixed;
            z-index: 99998;
            left: 50%;
            bottom: 185px;
            transform: translateX(-50%);
            width: max-content;
            max-width: 85vw;
            box-sizing: border-box;
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

    /* ================= CREATE WIDGET ================= */

    const widget = document.createElement("button");
    widget.type = "button";
    widget.id = "usanexNexaGlobal";
    widget.setAttribute(
        "aria-label",
        "Turn NEXA voice assistant on or off"
    );

    widget.innerHTML = `
        <span class="nexa-ring"></span>
        <span class="nexa-core" aria-hidden="true">🎙</span>
        <span class="nexa-label">NEXA</span>
    `;

    const status = document.createElement("div");
    status.id = "usanexNexaStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
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
        document.addEventListener(
            "DOMContentLoaded",
            mountWidget,
            { once: true }
        );
    }

    const core = widget.querySelector(".nexa-core");

    /* ================= UI HELPERS ================= */

    function setStatus(message, visible = true) {
        status.textContent = message || "";
        status.style.display =
            visible && message ? "block" : "none";
    }

    function setVisualState(state) {
        widget.classList.toggle("nexa-on", enabled);
        widget.classList.toggle(
            "nexa-speaking",
            state === "speaking"
        );
        widget.classList.toggle(
            "nexa-listening",
            state === "listening"
        );

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

    function scheduleWakeListening(delay = 800) {
        clearTimeout(restartTimer);

        if (!enabled || busy || speaking) return;

        restartTimer = setTimeout(() => {
            restartTimer = null;
            startWakeListening();
        }, delay);
    }

    function stopRecognition() {
        clearTimeout(silenceTimer);
        silenceTimer = null;

        if (recognition) {
            const old = recognition;
            recognition = null;

            old.onresult = null;
            old.onerror = null;
            old.onend = null;

            try {
                old.abort();
            } catch (_) {
                try {
                    old.stop();
                } catch (_) {}
            }
        }
    }

    /* ================= VOICE OUTPUT ================= */

    function speak(text, callback) {
        const message = String(text || "").trim();

        if (!message) {
            speaking = false;
            if (callback) callback();
            return;
        }

        if (
            !("speechSynthesis" in window) ||
            typeof SpeechSynthesisUtteranceClass !== "function"
        ) {
            console.error(
                "NEXA: Speech synthesis is not supported."
            );

            setStatus(
                "Voice output available nahi hai. Chrome mein try karein."
            );

            speaking = false;
            setVisualState("idle");

            if (callback) callback();
            return;
        }

        const synth = window.speechSynthesis;
        const thisGeneration = ++speechGeneration;

        // Stop any older speech before speaking the new reply.
        try {
            synth.cancel();
        } catch (_) {}

        speaking = true;
        setVisualState("speaking");

        const utterance =
            new SpeechSynthesisUtteranceClass(message);

        utterance.lang = "hi-IN";
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        let finished = false;

        function finishSpeech() {
            if (finished) return;
            finished = true;

            if (thisGeneration !== speechGeneration) return;

            speaking = false;

            setVisualState(
                enabled && mode === "wake"
                    ? "listening"
                    : "idle"
            );

            if (callback) callback();
        }

        utterance.onstart = () => {
            if (thisGeneration !== speechGeneration) return;

            speaking = true;
            setVisualState("speaking");
            console.log("[NEXA] Voice started.");
        };

        utterance.onend = () => {
            console.log("[NEXA] Voice ended.");
            finishSpeech();
        };

        utterance.onerror = (event) => {
            console.error(
                "[NEXA] Speech synthesis error:",
                event.error
            );
            finishSpeech();
        };

        try {
            synth.resume();
            synth.speak(utterance);
        } catch (error) {
            console.error(
                "[NEXA] Could not start speech:",
                error
            );
            finishSpeech();
        }
    }

    /* ================= API REQUEST ================= */

    async function askNexa(message) {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({ message })
        });

        let data;

        try {
            data = await response.json();
        } catch (_) {
            throw new Error(
                "Server returned an invalid response."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                `NEXA API error (${response.status})`
            );
        }

        const reply =
            data.reply ||
            data.response ||
            data.answer ||
            data.message ||
            data.text;

        if (!reply || !String(reply).trim()) {
            throw new Error(
                "NEXA returned an empty reply."
            );
        }

        return String(reply).trim();
    }

    /* ================= WAKE WORD ================= */

    function startWakeListening() {
        if (
            !enabled ||
            busy ||
            speaking ||
            recognition
        ) {
            return;
        }

        if (!SpeechRecognition) {
            setStatus(
                "Voice recognition supported nahi hai. Chrome use karein."
            );
            return;
        }

        mode = "wake";
        setVisualState("listening");
        setStatus("NEXA active hai. 'Hello NEXA' boliye.");

        const instance = new SpeechRecognition();
        recognition = instance;

        instance.lang = "en-IN";
        instance.continuous = true;
        instance.interimResults = true;

        instance.onresult = (event) => {
            let heard = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                heard +=
                    event.results[i][0].transcript + " ";
            }

            const wakePattern =
                /hello\s+nexa|hey\s+nexa|हेलो\s+नेक्सा|हैलो\s+नेक्सा/i;

            if (wakePattern.test(heard)) {
                stopRecognition();
                mode = "greeting";

                setStatus("", false);

                speak(
                    "Yes sir, boliye. Main aapki kya help kar sakta hoon?",
                    () => {
                        if (enabled) {
                            startCommandListening();
                        }
                    }
                );
            }
        };

        instance.onerror = (event) => {
            console.error(
                "[NEXA] Wake recognition error:",
                event.error
            );

            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {
                enabled = false;
                mode = "idle";
                stopRecognition();
                setVisualState("idle");
                setStatus(
                    "Microphone permission allow karein."
                );
            }
        };

        instance.onend = () => {
            if (recognition === instance) {
                recognition = null;
            }

            if (
                enabled &&
                mode === "wake" &&
                !busy &&
                !speaking
            ) {
                scheduleWakeListening(900);
            }
        };

        try {
            instance.start();
        } catch (error) {
            console.warn(
                "[NEXA] Wake listener could not start:",
                error
            );

            if (recognition === instance) {
                recognition = null;
            }

            scheduleWakeListening(1300);
        }
    }

    /* ================= COMMAND LISTENING ================= */

    function startCommandListening() {
        if (!enabled || busy || recognition) return;

        if (!SpeechRecognition) {
            setStatus(
                "Voice recognition supported nahi hai."
            );
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

        let commandFinished = false;

        function resetSilenceTimer() {
            clearTimeout(silenceTimer);

            silenceTimer = setTimeout(() => {
                finishCommand(true, instance);
            }, SILENCE_LIMIT);
        }

        resetSilenceTimer();

        instance.onresult = (event) => {
            let interim = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const result = event.results[i];
                const words =
                    result[0].transcript.trim();

                if (result.isFinal && words) {
                    finalTranscript +=
                        (finalTranscript ? " " : "") +
                        words;
                } else if (words) {
                    interim += words + " ";
                }
            }

            if ((finalTranscript + interim).trim()) {
                setStatus(
                    "Aapki baat sun raha hoon...",
                    true
                );
                resetSilenceTimer();
            }
        };

        instance.onerror = (event) => {
            console.error(
                "[NEXA] Command recognition error:",
                event.error
            );

            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {
                enabled = false;
                mode = "idle";
                stopRecognition();
                setVisualState("idle");
                setStatus(
                    "Microphone permission allow karein."
                );
                return;
            }

            if (event.error !== "aborted") {
                finishCommand(false, instance);
            }
        };

        instance.onend = () => {
            if (recognition === instance) {
                recognition = null;
            }

            if (
                enabled &&
                mode === "command" &&
                !busy &&
                !commandFinished
            ) {
                finishCommand(true, instance);
            }
        };

        // Store command completion locally for duplicate-event protection.
        const originalFinish = finishCommand;

        function finishCurrentCommand(send) {
            if (commandFinished) return;
            commandFinished = true;
            originalFinish(send, instance);
        }

        // Use this instance's one-shot wrapper for all completion paths.
        instance.__finishNexaCommand = finishCurrentCommand;

        try {
            instance.start();
        } catch (error) {
            console.error(
                "[NEXA] Command listener could not start:",
                error
            );

            if (recognition === instance) {
                recognition = null;
            }

            finishCurrentCommand(false);
        }
    }

    /* ================= SEND QUESTION ================= */

    async function finishCommand(
        shouldSend = true,
        sourceInstance = null
    ) {
        if (mode !== "command") return;

        clearTimeout(silenceTimer);

        const message = finalTranscript.trim();

        if (sourceInstance) {
            if (recognition === sourceInstance) {
                recognition = null;
            }

            sourceInstance.onresult = null;
            sourceInstance.onerror = null;
            sourceInstance.onend = null;

            try {
                sourceInstance.stop();
            } catch (_) {}
        } else {
            stopRecognition();
        }

        mode = "processing";
        setStatus("", false);

        if (!shouldSend || !message) {
            mode = "idle";
            setVisualState("idle");
            setStatus(
                message
                    ? ""
                    : "Awaaz samajh nahi aayi. Dobara boliye.",
                Boolean(!message)
            );

            if (enabled) scheduleWakeListening(1200);
            return;
        }

        busy = true;
        setVisualState("speaking");
        setStatus("NEXA jawab taiyar kar raha hai...");

        try {
            const reply = await askNexa(message);

            console.log("[NEXA] Reply received:", reply);

            setStatus("", false);

            speak(reply, () => {
                busy = false;
                mode = "idle";
                setStatus("", false);

                if (enabled) {
                    scheduleWakeListening(900);
                }
            });
        } catch (error) {
            console.error(
                "[NEXA] Voice request failed:",
                error
            );

            busy = false;
            mode = "idle";

            setStatus(
                error.message || "Connection problem."
            );

            speak(
                "Sorry sir, abhi jawab laane mein problem aa rahi hai.",
                () => {
                    setStatus("", false);
                    if (enabled) {
                        scheduleWakeListening(1200);
                    }
                }
            );
        }
    }

    /* ================= TURN ON / OFF ================= */

    function turnOn() {
        if (!SpeechRecognition) {
            setStatus(
                "Is browser mein voice recognition available nahi hai. Chrome use karein."
            );
            return;
        }

        enabled = true;
        busy = false;
        mode = "greeting";

        clearTimers();
        stopRecognition();

        setVisualState("speaking");
        setStatus("", false);

        // Spoken greeting immediately after user interaction.
        speak(
            "Hello sir, kaise hain aap?",
            () => {
                if (enabled) startWakeListening();
            }
        );
    }

    function turnOff() {
        enabled = false;
        busy = false;
        mode = "idle";
        speechGeneration++;

        clearTimers();
        stopRecognition();

        if ("speechSynthesis" in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (_) {}
        }

        speaking = false;
        setVisualState("idle");
        setStatus("", false);
    }

    /* ================= DRAGGABLE BUTTON ================= */

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
        pointerStart = {
            x: startX,
            y: startY
        };

        try {
            widget.setPointerCapture(event.pointerId);
        } catch (_) {}
    });

    widget.addEventListener("pointermove", (event) => {
        if (
            !pointerStart ||
            !widget.hasPointerCapture(event.pointerId)
        ) {
            return;
        }

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.abs(dx) > 7 || Math.abs(dy) > 7) {
            dragged = true;
        }

        if (!dragged) return;

        const x = Math.max(
            4,
            Math.min(
                window.innerWidth - widget.offsetWidth - 4,
                originX + dx
            )
        );

        const y = Math.max(
            4,
            Math.min(
                window.innerHeight - widget.offsetHeight - 24,
                originY + dy
            )
        );

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

        if (enabled) {
            turnOff();
        } else {
            turnOn();
        }
    });

    widget.addEventListener("pointercancel", () => {
        pointerStart = null;
    });

    /* ================= INITIAL STATE ================= */

    setVisualState("idle");
    setStatus("", false);

    console.log("[NEXA] Global voice assistant loaded.");
})();
