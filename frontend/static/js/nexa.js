(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const form = $("chatForm");
    const input = $("messageInput");
    const conversation = $("conversation");
    const welcome = $("welcome");
    const chatArea = $("chatArea");
    const sendBtn = $("sendBtn");
    const micBtn = $("micBtn");
    const voiceStatus = $("voiceStatus");
    const menuBtn = $("menuBtn");
    const dropdown = $("dropdown");
    const plusBtn = $("plusBtn");
    const sheetBackdrop = $("sheetBackdrop");
    const sheetContent = $("sheetContent");
    const sheetTitle = $("sheetTitle");

    let busy = false;
    let recognition = null;
    let isListening = false;
    let finalTranscript = "";
    let interimTranscript = "";
    let savedInput = "";
    let manualStop = false;

    // New screen = fresh conversation.
    // Messages are not persisted by this frontend.
    conversation.replaceChildren();
    welcome.hidden = false;
    input.value = "";

    function setStatus(message) {
        voiceStatus.textContent = message || "";
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function updateWelcome() {
        welcome.hidden = conversation.children.length > 0;
    }

    function addMessage(text, role, extraClass = "") {
        const message = document.createElement("div");
        message.className =
            `message ${role} ${extraClass}`.trim();

        if (role === "assistant") {
            const label = document.createElement("span");
            label.className = "message-label";
            label.textContent = "NEXA";
            message.appendChild(label);
        }

        const content = document.createElement("span");
        content.textContent = text;
        message.appendChild(content);

        conversation.appendChild(message);
        updateWelcome();
        scrollToBottom();

        return { element: message, content };
    }

    function autoResizeInput() {
        input.style.height = "auto";
        input.style.height =
            Math.min(input.scrollHeight, 120) + "px";
    }

    input.addEventListener("input", autoResizeInput);

    input.addEventListener("keydown", (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.isComposing
        ) {
            event.preventDefault();
            form.requestSubmit();
        }
    });

    async function sendMessage(text) {
        const messageText = String(text || "").trim();

        if (!messageText || busy) return;

        if (isListening) {
            stopListening();
        }

        busy = true;
        sendBtn.disabled = true;
        input.value = "";
        autoResizeInput();
        setStatus("");

        addMessage(messageText, "user");

        const pending = addMessage(
            "Soch raha hoon...",
            "assistant",
            "pending"
        );

        try {
            const response = await fetch(
                "/api/ai-assistant/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        message: messageText
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    `Request failed (${response.status})`
                );
            }

            const reply =
                data.reply ??
                data.response ??
                data.answer ??
                data.message ??
                data.text;

            if (
                typeof reply === "string" &&
                reply.trim()
            ) {
                pending.content.textContent = reply;
                pending.element.classList.remove("pending");
            } else {
                pending.content.textContent =
                    "Server se reply format nahi mila. " +
                    "Backend response check karein.";

                pending.element.classList.remove("pending");
                pending.element.classList.add("error");
            }
        } catch (error) {
            console.error("NEXA chat error:", error);

            pending.content.textContent =
                "NEXA se connect nahi ho paaya. Internet, login " +
                "aur /api/ai-assistant/chat endpoint check karein.";

            pending.element.classList.remove("pending");
            pending.element.classList.add("error");
        } finally {
            busy = false;
            sendBtn.disabled = false;
            input.focus();
            scrollToBottom();
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    // Suggestions
    document.querySelectorAll("[data-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.prompt || "";
            input.value = prompt;
            autoResizeInput();
            sendMessage(prompt);
        });
    });

    // Back button
    $("backBtn").addEventListener("click", () => {
        if (isListening) stopListening();

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "/home";
        }
    });

    // Menu
    menuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        dropdown.hidden = !dropdown.hidden;
    });

    document.addEventListener("click", (event) => {
        if (
            !dropdown.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {
            dropdown.hidden = true;
        }
    });

    function openSheet(title, actions) {
        sheetTitle.textContent = title;
        sheetContent.replaceChildren();

        actions.forEach((action) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "sheet-action";

            const heading = document.createElement("span");
            heading.textContent = action.title;
            button.appendChild(heading);

            if (action.description) {
                const small = document.createElement("small");
                small.textContent = action.description;
                button.appendChild(small);
            }

            button.addEventListener("click", () => {
                sheetBackdrop.hidden = true;

                if (action.prompt) {
                    input.value = action.prompt;
                    autoResizeInput();
                    sendMessage(action.prompt);
                } else if (action.run) {
                    action.run();
                }
            });

            sheetContent.appendChild(button);
        });

        sheetBackdrop.hidden = false;
        dropdown.hidden = true;
    }

    $("closeSheet").addEventListener("click", () => {
        sheetBackdrop.hidden = true;
    });

    sheetBackdrop.addEventListener("click", (event) => {
        if (event.target === sheetBackdrop) {
            sheetBackdrop.hidden = true;
        }
    });

    function clearConversation() {
        if (isListening) stopListening();

        conversation.replaceChildren();
        welcome.hidden = false;
        input.value = "";
        autoResizeInput();
        setStatus("");
        input.focus();
    }

    // Plus menu
    plusBtn.addEventListener("click", () => {
        openSheet("Quick actions", [
            {
                title: "Usanex help",
                description: "Usanex ke features",
                prompt:
                    "Mujhe Usanex ke features aur unka use samjhao."
            },
            {
                title: "Study assistant",
                description: "Study aur AI learning",
                prompt:
                    "Meri padhai aur AI learning ke liye ek practical plan banao."
            },
            {
                title: "New chat",
                description: "Current screen clear karein",
                run: clearConversation
            }
        ]);
    });

    // Menu actions
    dropdown.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;

            if (action === "memory") {
                openSheet("Memory", [
                    {
                        title: "Ask about memory",
                        description: "NEXA se available memory poochhein",
                        prompt:
                            "Tumhe meri kaun si baatein yaad hain? " +
                            "Sirf available memory ke baare mein batao."
                    },
                    {
                        title: "Memory feature",
                        description: "Personal memory ke baare mein",
                        prompt:
                            "Usanex mein private memory feature kaise design karein?"
                    }
                ]);
            }

            if (action === "private-chat") {
                openSheet("Private Chat", [
                    {
                        title: "Private chat",
                        description: "Usanex private conversation",
                        prompt:
                            "Usanex ke private chat feature ke baare mein batao."
                    },
                    {
                        title: "Privacy",
                        description: "Privacy aur data security",
                        prompt:
                            "Usanex chat ko secure banane ke liye kya features chahiye?"
                    }
                ]);
            }

            if (action === "quick-actions") {
                openSheet("Quick actions", [
                    {
                        title: "Usanex help",
                        description: "App ke features",
                        prompt: "Usanex ke features samjhao."
                    },
                    {
                        title: "Study help",
                        description: "AI aur programming",
                        prompt: "Mujhe AI seekhne mein help karo."
                    },
                    {
                        title: "New chat",
                        description: "Current conversation clear karein",
                        run: clearConversation
                    }
                ]);
            }

            if (action === "settings") {
                openSheet("Settings", [
                    {
                        title: "Voice input help",
                        description: "Hindi speech recognition",
                        prompt:
                            "NEXA voice input ko Hindi aur Hinglish ke liye kaise improve karein?"
                    },
                    {
                        title: "Clear conversation",
                        description: "Screen se current messages hatayein",
                        run: clearConversation
                    }
                ]);
            }
        });
    });

    // Voice recognition
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    function showVoiceError(error) {
        const messages = {
            "not-allowed":
                "Microphone permission allow karein.",
            "service-not-allowed":
                "Browser speech service allow nahi hai.",
            "network":
                "Speech recognition network error. Internet check karein.",
            "no-speech":
                "Awaaz detect nahi hui. Dobara bolkar try karein.",
            "audio-capture":
                "Microphone nahi mil raha. Device mic check karein.",
            "aborted":
                "Voice input rok diya gaya."
        };

        setStatus(
            messages[error] || `Voice error: ${error}`
        );
    }

    function startListening() {
        if (!SpeechRecognition) {
            setStatus(
                "Is browser mein voice recognition available nahi hai. " +
                "Android Chrome mein try karein."
            );
            return;
        }

        if (isListening) {
            stopListening();
            return;
        }

        try {
            recognition = new SpeechRecognition();
            recognition.lang = "hi-IN";
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            finalTranscript = "";
            interimTranscript = "";
            savedInput = input.value.trim();
            manualStop = false;

            recognition.onstart = () => {
                isListening = true;
                micBtn.classList.add("listening");
                micBtn.setAttribute("aria-pressed", "true");
                setStatus("Sun raha hoon... Ab boliye.");
            };

            recognition.onresult = (event) => {
                interimTranscript = "";

                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {
                    const result = event.results[i];
                    const transcript = result[0].transcript;

                    if (result.isFinal) {
                        finalTranscript += transcript + " ";
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const liveText =
                    (savedInput ? savedInput + " " : "") +
                    finalTranscript +
                    interimTranscript;

                // Live text while speaking
                input.value = liveText;
                autoResizeInput();

                if (interimTranscript.trim()) {
                    setStatus("Aapki baat text mein likh raha hoon...");
                } else if (finalTranscript.trim()) {
                    setStatus("Text likh diya. Send dabakar bhejein.");
                }

                input.focus();
            };

            recognition.onerror = (event) => {
                console.error("NEXA voice error:", event.error);
                showVoiceError(event.error);
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.classList.remove("listening");
                micBtn.setAttribute("aria-pressed", "false");

                if (
                    finalTranscript.trim() ||
                    interimTranscript.trim()
                ) {
                    setStatus(
                        "Voice band. Text check karke Send dabayein."
                    );
                } else if (!manualStop) {
                    setStatus(
                        "Voice input band ho gaya. Dobara try karein."
                    );
                }

                recognition = null;
            };

            recognition.start();
        } catch (error) {
            isListening = false;
            micBtn.classList.remove("listening");
            console.error("Could not start voice recognition:", error);
            setStatus(
                "Mic start nahi hua. Browser permission check karein."
            );
        }
    }

    function stopListening() {
        manualStop = true;

        if (recognition && isListening) {
            recognition.stop();
        } else {
            isListening = false;
            micBtn.classList.remove("listening");
            micBtn.setAttribute("aria-pressed", "false");
        }
    }

    micBtn.addEventListener("click", () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && isListening) {
            stopListening();
        }
    });
})();
