
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("messageInput");
  const conversation = document.getElementById("conversation");
  const micBtn = document.getElementById("micBtn");

  function addMessage(text, type) {
    const bubble = document.createElement("div");
    bubble.className = type === "user"
      ? "user-message"
      : "assistant-message";

    if (type === "user") {
      const p = document.createElement("p");
      p.textContent = text;
      bubble.appendChild(p);
    } else {
      const orb = document.createElement("div");
      orb.className = "message-orb";
      orb.textContent = "N";

      const content = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = "NEXA";

      const p = document.createElement("p");
      p.textContent = text;

      content.append(title, p);
      bubble.append(orb, content);
    }

    conversation.appendChild(bubble);
    bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return bubble;
  }

  async function sendMessage(text) {
    const message = text.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";
    input.focus();

    const waiting = addMessage("Bhai, ek pal…", "assistant");

    try {
      // Backend API ko baad mein secure authentication ke saath connect karein.
      const response = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error("Assistant API abhi available nahi hai.");
      }

      const data = await response.json();
      waiting.querySelector("p").textContent =
        data.reply || "Maaf karna bhai, mujhe jawab nahi mila.";
    } catch (error) {
      waiting.querySelector("p").textContent =
        "NEXA ka chat backend abhi connect nahi hai. UI taiyar hai; backend connect hone par main jawab de paunga.";
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.prompt);
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      const messages = {
        chat: "Bhai, neeche message likhkar mujhse baat shuru karo.",
        memory: "Personal Memory screen ko secure backend ke saath banana baaki hai.",
        actions: "Couple Chat aur Reels actions ko app routes se connect karna baaki hai.",
        security: "Private memory dikhane se pehle server-side identity verification zaroori hogi.",
        preferences: "Personal preferences settings ko backend se connect karna baaki hai.",
        voice: "Voice support ke liye browser/device support aur permission zaroori hai."
      };

      addMessage(messages[action] || "Batao bhai, kya help chahiye?", "assistant");

      if (action === "chat") {
        input.focus();
      }
    });
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.location.href = "/";
  });

  document.getElementById("menuBtn").addEventListener("click", () => {
    addMessage(
      "NEXA settings aur memory controls ko secure backend se connect karna baaki hai.",
      "assistant"
    );
  });

  // Browser speech recognition: optional; browser support par depend karta hai.
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micBtn.addEventListener("click", () => {
      addMessage(
        "Is browser mein voice input supported nahi hai. Filhaal type karke baat karein.",
        "assistant"
      );
    });
  } else {
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {
      try {
        recognition.start();
        micBtn.setAttribute("aria-label", "Listening");
      } catch (_) {
        // Recognition already active.
      }
    });

    recognition.onresult = (event) => {
      input.value = event.results[0][0].transcript;
      input.focus();
    };

    recognition.onend = () => {
      micBtn.setAttribute("aria-label", "Voice input");
    };

    recognition.onerror = () => {
      addMessage(
        "Voice input nahi chal paya. Microphone permission check karke dobara try karein.",
        "assistant"
      );
    };
  }

  document.getElementById("attachBtn").addEventListener("click", () => {
    addMessage(
      "File aur image sharing ko backend se connect karna baaki hai.",
      "assistant"
    );
  });
});
