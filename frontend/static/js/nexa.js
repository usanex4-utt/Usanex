
/* =========================================================
   NEXA — CHAT + DIGITAL CLASSROOM
   Complete replacement: static/js/nexa.js
   Keeps chat API, Hindi voice input, menu and quick actions.
========================================================= */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const el = {
    chatForm: $("chatForm"),
    messageInput: $("messageInput"),
    conversation: $("conversation"),
    welcome: $("welcome"),
    chatArea: $("chatArea"),
    sendBtn: $("sendBtn"),
    micBtn: $("micBtn"),
    voiceStatus: $("voiceStatus"),
    menuBtn: $("menuBtn"),
    dropdown: $("dropdown"),
    plusBtn: $("plusBtn"),
    sheetBackdrop: $("sheetBackdrop"),
    sheetContent: $("sheetContent"),
    sheetTitle: $("sheetTitle"),

    classroom: $("digitalClassroom"),
    boardCanvas: $("boardCanvas"),
    boardQuestion: $("boardQuestion"),
    boardWork: $("boardWork"),
    boardAnswer: $("boardAnswer"),
    digitalPen: $("digitalPen"),
    replayBoard: $("replayBoard"),
    closeClassroom: $("closeClassroom"),

    teacherAvatar: $("teacherAvatar"),
    teacherSpeech: $("teacherSpeech"),
    teacherSpeak: $("teacherSpeak"),
    teacherNext: $("teacherNext"),

    classProgress: $("classProgress"),
    yourScore: $("yourScore"),
    answerForm: $("classroomAnswerForm"),
    classroomAnswer: $("classroomAnswer"),
    classroomFeedback: $("classroomFeedback"),
    studentQuestion: $("studentQuestion"),
    studentHint: $("studentHint")
  };

  const API = {
    chat: "/api/ai-assistant/chat"
  };

  let recognition = null;
  let isListening = false;
  let isSending = false;
  let classroomOpen = false;
  let writingTimer = null;
  let currentLessonStep = 0;
  let currentQuiz = null;
  let score = 0;
  let answeredQuestions = 0;
  let speechUtterance = null;

  /* =====================================================
     INITIAL STATE
  ====================================================== */

  if (el.conversation) {
    // Keep the current screen fresh, as the earlier script did.
    el.conversation.innerHTML = "";
  }

  updateWelcome();
  setupSpeechRecognition();
  setupEventListeners();
  setupMenu();
  setupQuickActions();

  /* =====================================================
     CHAT UI
  ====================================================== */

  function updateWelcome() {
    const hasMessages =
      el.conversation && el.conversation.children.length > 0;

    if (el.welcome) {
      el.welcome.hidden = Boolean(hasMessages) || classroomOpen;
    }
  }

  function scrollChatToBottom() {
    if (!el.chatArea) return;
    el.chatArea.scrollTop = el.chatArea.scrollHeight;
  }

  function makeMessage(role, text) {
    const message = document.createElement("div");
    message.className = `message message-${role}`;
    message.setAttribute("role", role === "assistant" ? "status" : "listitem");

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    message.appendChild(bubble);
    return { message, bubble };
  }

  function addMessage(role, text) {
    if (!el.conversation) return null;

    const item = makeMessage(role, text);
    el.conversation.appendChild(item.message);

    updateWelcome();
    scrollChatToBottom();

    return item;
  }

  function setSendingState(sending) {
    isSending = sending;

    if (el.sendBtn) {
      el.sendBtn.disabled = sending;
      el.sendBtn.classList.toggle("is-loading", sending);
      el.sendBtn.setAttribute("aria-busy", String(sending));
    }

    if (el.messageInput) {
      el.messageInput.disabled = sending;
    }
  }

  async function sendMessage(rawText) {
    const messageText = String(rawText || "").trim();

    if (!messageText || isSending) return;

    if (el.messageInput) {
      el.messageInput.value = "";
      el.messageInput.style.height = "";
    }

    addMessage("user", messageText);

    const pending = addMessage("assistant", "Soch raha hoon…");
    if (pending) pending.message.classList.add("message-pending");

    setSendingState(true);

    try {
      const response = await fetch(API.chat, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ message: messageText })
      });

      let data = {};
      const responseText = await response.text();

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { reply: responseText };
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.error ||
          data.message ||
          `Request failed (${response.status})`
        );
      }

      const reply =
        data.reply ??
        data.response ??
        data.answer ??
        data.message ??
        data.text ??
        "Mujhe abhi iska jawab nahi mila. Dobara try karo.";

      if (pending) {
        pending.bubble.textContent = String(reply);
        pending.message.classList.remove("message-pending");
      } else {
        addMessage("assistant", String(reply));
      }
    } catch (error) {
      const errorMessage =
        error && error.message
          ? error.message
          : "Connection mein problem aa gayi.";

      const friendlyMessage =
        "NEXA se connect nahi ho paaya. Internet aur backend check karke dobara try karo.";

      if (pending) {
        pending.bubble.textContent = friendlyMessage;
        pending.message.classList.remove("message-pending");
        pending.message.classList.add("message-error");
        pending.message.title = errorMessage;
      } else {
        addMessage("assistant", friendlyMessage);
      }

      console.error("NEXA chat error:", error);
    } finally {
      setSendingState(false);
      updateWelcome();

      if (el.messageInput) {
        el.messageInput.focus();
      }
    }
  }

  /* =====================================================
     DIGITAL CLASSROOM LESSON DATA
  ====================================================== */

  const lessons = [
    {
      title: "23 × 4",
      steps: [
        {
          work: "Step 1: 23 ko 20 + 3 mein baantte hain.",
          speech: "Chalo, 23 guna 4 ko aasaan banate hain. Sabse pehle 23 ko 20 aur 3 mein baantenge."
        },
        {
          work: "Step 2: 20 × 4 = 80",
          speech: "Ab 20 ko 4 se multiply karo. 20 guna 4, barabar 80 hota hai."
        },
        {
          work: "Step 3: 3 × 4 = 12",
          speech: "Ab bache hue 3 ko 4 se multiply karenge. 3 guna 4, barabar 12."
        },
        {
          work: "Step 4: 80 + 12 = 92",
          speech: "Ab dono results jod do. 80 plus 12 barabar 92. Isliye 23 guna 4 ka answer 92 hai."
        }
      ],
      answer: "92",
      quiz: {
        question: "Ab tumhari baari: 12 × 3 = ?",
        hint: "12 ko 10 + 2 mein baanto. Phir 10 × 3 aur 2 × 3 ko jodo.",
        answer: 36,
        explanation: "12 × 3 = 10 × 3 + 2 × 3 = 30 + 6 = 36."
      }
    },
    {
      title: "Addition: 28 + 15",
      steps: [
        {
          work: "Step 1: 28 + 15",
          speech: "Aaj hum 28 plus 15 solve karenge."
        },
        {
          work: "Step 2: 28 + 10 = 38",
          speech: "Pehle 15 mein se 10 jodo. 28 plus 10, barabar 38."
        },
        {
          work: "Step 3: 38 + 5 = 43",
          speech: "Ab bache hue 5 jodo. 38 plus 5, barabar 43."
        }
      ],
      answer: "43",
      quiz: {
        question: "Ab solve karo: 34 + 8 = ?",
        hint: "34 mein pehle 6 jodo, phir bache hue 2.",
        answer: 42,
        explanation: "34 + 8 = 34 + 6 + 2 = 40 + 2 = 42."
      }
    },
    {
      title: "Subtraction: 52 − 18",
      steps: [
        {
          work: "Step 1: 52 − 18",
          speech: "Chalo 52 mein se 18 ghataate hain."
        },
        {
          work: "Step 2: 52 − 10 = 42",
          speech: "Pehle 10 ghatao. 52 minus 10, barabar 42."
        },
        {
          work: "Step 3: 42 − 8 = 34",
          speech: "Ab 8 aur ghatao. 42 minus 8, barabar 34."
        }
      ],
      answer: "34",
      quiz: {
        question: "Ab solve karo: 65 − 27 = ?",
        hint: "65 − 20 karo, phir 7 aur ghatao.",
        answer: 38,
        explanation: "65 − 27 = 65 − 20 − 7 = 45 − 7 = 38."
      }
    }
  ];

  let activeLesson = lessons[0];

  /* =====================================================
     BOARD WRITING ANIMATION
  ====================================================== */

  function stopBoardAnimation() {
    if (writingTimer) {
      clearInterval(writingTimer);
      writingTimer = null;
    }

    if (el.boardCanvas) {
      el.boardCanvas.classList.remove("writing");
    }
  }

  function animateText(target, text, speed = 24) {
    if (!target) return;

    stopBoardAnimation();

    target.textContent = "";

    if (el.boardCanvas) {
      el.boardCanvas.classList.add("writing");
    }

    let index = 0;
    const content = String(text);

    writingTimer = setInterval(() => {
      target.textContent += content.charAt(index);
      index += 1;

      if (el.digitalPen) {
        const progress = Math.min(index / Math.max(content.length, 1), 1);
        el.digitalPen.style.left = `${8 + progress * 82}%`;
      }

      if (index >= content.length) {
        stopBoardAnimation();
      }
    }, speed);
  }

  function renderBoardStep(stepIndex, shouldSpeak = true) {
    stopBoardAnimation();

    if (!activeLesson) return;

    currentLessonStep = Math.max(
      0,
      Math.min(stepIndex, activeLesson.steps.length - 1)
    );

    if (el.boardQuestion) {
      el.boardQuestion.textContent = activeLesson.title;
    }

    if (el.boardAnswer) {
      el.boardAnswer.textContent = "";
    }

    const step = activeLesson.steps[currentLessonStep];

    animateText(el.boardWork, step.work);

    if (el.teacherSpeech) {
      el.teacherSpeech.textContent = step.speech;
    }

    if (el.teacherNext) {
      el.teacherNext.textContent =
        currentLessonStep >= activeLesson.steps.length - 1
          ? "Quiz shuru karo"
          : "Next Step";
    }

    if (shouldSpeak) {
      speakTeacher(step.speech);
    }

    updateProgress();
  }

  function replayBoard() {
    renderBoardStep(currentLessonStep, true);
  }

  /* =====================================================
     TEACHER SPEECH
  ====================================================== */

  function stopTeacherSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speechUtterance = null;

    if (el.teacherAvatar) {
      el.teacherAvatar.classList.remove("speaking");
    }
  }

  function speakTeacher(text) {
    if (!text) return;

    if (!("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined") {
      if (el.teacherSpeech) {
        el.teacherSpeech.textContent = `${text} (Is browser mein voice available nahi hai.)`;
      }
      return;
    }

    stopTeacherSpeech();

    speechUtterance = new SpeechSynthesisUtterance(String(text));
    speechUtterance.lang = "hi-IN";
    speechUtterance.rate = 0.9;
    speechUtterance.pitch = 1.0;

    speechUtterance.onstart = () => {
      if (el.teacherAvatar) {
        el.teacherAvatar.classList.add("speaking");
      }
    };

    speechUtterance.onend = () => {
      if (el.teacherAvatar) {
        el.teacherAvatar.classList.remove("speaking");
      }
    };

    speechUtterance.onerror = () => {
      if (el.teacherAvatar) {
        el.teacherAvatar.classList.remove("speaking");
      }
    };

    window.speechSynthesis.speak(speechUtterance);
  }

  /* =====================================================
     CLASSROOM OPEN / CLOSE
  ====================================================== */

  function openClassroom() {
    if (!el.classroom) {
      addMessage(
        "assistant",
        "Digital Classroom ka HTML section nahi mila. Nayi nexa.html file save hui hai ya nahi, check karo."
      );
      return;
    }

    classroomOpen = true;
    el.classroom.hidden = false;

    if (el.welcome) el.welcome.hidden = true;
    if (el.conversation) el.conversation.hidden = true;

    if (el.dropdown) el.dropdown.hidden = true;
    closeQuickActions();

    activeLesson = lessons[0];
    score = 0;
    answeredQuestions = 0;
    currentQuiz = null;

    if (el.classroomAnswer) el.classroomAnswer.value = "";
    if (el.classroomFeedback) el.classroomFeedback.textContent = "";
    if (el.studentHint) el.studentHint.textContent = "";

    renderBoardStep(0, false);
    updateProgress();

    if (el.studentQuestion) {
      el.studentQuestion.textContent =
        "Pehle example dekho, phir apna answer do.";
    }

    if (el.teacherSpeech) {
      el.teacherSpeech.textContent =
        "Namaste! Aaj hum maths ko step-by-step seekhenge. Dhyaan se dekho, aur jab ready ho to Next Step dabao.";
    }

    speakTeacher(
      "Namaste! Aaj hum maths ko step by step seekhenge. Dhyaan se dekho, aur jab ready ho to next step dabao."
    );

    if (el.chatArea) {
      el.chatArea.scrollTop = 0;
    }
  }

  function closeClassroom() {
    stopBoardAnimation();
    stopTeacherSpeech();

    classroomOpen = false;

    if (el.classroom) el.classroom.hidden = true;
    if (el.conversation) el.conversation.hidden = false;

    updateWelcome();
  }

  /* =====================================================
     CLASSROOM PROGRESS + QUIZ
  ====================================================== */

  function updateProgress() {
    if (el.classProgress) {
      const total = activeLesson ? activeLesson.steps.length : 1;
      const step = currentLessonStep + 1;
      el.classProgress.textContent = `Lesson step ${step}/${total}`;
    }

    if (el.yourScore) {
      el.yourScore.textContent = `Tumhara score: ${score}/${answeredQuestions}`;
    }
  }

  function showQuiz() {
    if (!activeLesson || !activeLesson.quiz) return;

    currentQuiz = activeLesson.quiz;

    if (el.boardQuestion) {
      el.boardQuestion.textContent = "Your Turn!";
    }

    if (el.boardWork) {
      el.boardWork.textContent = "Apna answer neeche likho.";
    }

    if (el.boardAnswer) {
      el.boardAnswer.textContent = "";
    }

    if (el.studentQuestion) {
      el.studentQuestion.textContent = currentQuiz.question;
    }

    if (el.studentHint) {
      el.studentHint.textContent = "Hint: " + currentQuiz.hint;
    }

    if (el.classroomFeedback) {
      el.classroomFeedback.textContent = "";
      el.classroomFeedback.className = "classroom-feedback";
    }

    if (el.classroomAnswer) {
      el.classroomAnswer.value = "";
      el.classroomAnswer.focus();
    }

    if (el.teacherSpeech) {
      el.teacherSpeech.textContent =
        "Ab tum solve karo. Jaldi karne ki zaroorat nahi hai. Soch kar answer do.";
    }

    if (el.teacherNext) {
      el.teacherNext.textContent = "Next Lesson";
    }

    speakTeacher(
      "Ab tum solve karo. Jaldi karne ki zaroorat nahi hai. Soch kar answer do."
    );

    updateProgress();
  }

  function checkQuizAnswer(rawAnswer) {
    if (!currentQuiz) {
      if (el.classroomFeedback) {
        el.classroomFeedback.textContent =
          "Pehle lesson ke steps complete karo, phir quiz do.";
      }
      return;
    }

    const answerText = String(rawAnswer || "").trim();
    if (!answerText) return;

    const numericAnswer = Number(
      answerText.replace(/,/g, "").replace(/[₹%]/g, "").trim()
    );

    answeredQuestions += 1;

    if (Number.isFinite(numericAnswer) &&
        numericAnswer === Number(currentQuiz.answer)) {
      score += 1;

      const feedback =
        "Bilkul sahi! 🎉 Shabash. " + currentQuiz.explanation;

      if (el.classroomFeedback) {
        el.classroomFeedback.textContent = feedback;
        el.classroomFeedback.className =
          "classroom-feedback feedback-correct";
      }

      if (el.teacherSpeech) {
        el.teacherSpeech.textContent =
          "Bahut achha! Tumhara answer sahi hai. Chalo, solution bhi dekh lete hain.";
      }

      if (el.boardAnswer) {
        el.boardAnswer.textContent = `Correct answer: ${currentQuiz.answer}`;
      }

      speakTeacher(
        "Bahut achha! Tumhara answer sahi hai. " + currentQuiz.explanation
      );
    } else {
      const feedback =
        "Koi baat nahi 🙂 Galti se seekhte hain. " +
        currentQuiz.explanation +
        " Ek baar phir try kar sakte ho.";

      if (el.classroomFeedback) {
        el.classroomFeedback.textContent = feedback;
        el.classroomFeedback.className =
          "classroom-feedback feedback-try-again";
      }

      if (el.teacherSpeech) {
        el.teacherSpeech.textContent =
          "Koi baat nahi. Galti se seekhte hain. Chalo, solution ko saath mein samajhte hain.";
      }

      if (el.boardWork) {
        animateText(el.boardWork, currentQuiz.explanation, 20);
      }

      speakTeacher(
        "Koi baat nahi. Galti se seekhte hain. " + currentQuiz.explanation
      );
    }

    updateProgress();
  }

  function nextClassroomStep() {
    if (currentQuiz) {
      const nextIndex = (lessons.indexOf(activeLesson) + 1) % lessons.length;
      activeLesson = lessons[nextIndex];
      currentQuiz = null;

      if (el.classroomFeedback) {
        el.classroomFeedback.textContent = "";
      }

      if (el.studentHint) {
        el.studentHint.textContent = "";
      }

      if (el.studentQuestion) {
        el.studentQuestion.textContent =
          "Pehle example dekho, phir apna answer do.";
      }

      renderBoardStep(0, true);
      return;
    }

    if (currentLessonStep < activeLesson.steps.length - 1) {
      renderBoardStep(currentLessonStep + 1, true);
    } else {
      showQuiz();
    }
  }

  function handleConfusion() {
    const explanation =
      "Koi baat nahi. Chalo aur aasaan tareeke se samajhte hain. " +
      "23 × 4 ka matlab hai 23 ko chaar baar jodna: " +
      "23 + 23 + 23 + 23 = 92. " +
      "Ab hum ise dheere-dheere dobara dekhenge.";

    if (el.teacherSpeech) {
      el.teacherSpeech.textContent = explanation;
    }

    if (el.boardQuestion) {
      el.boardQuestion.textContent = "Easy Example";
    }

    if (el.boardWork) {
      animateText(
        el.boardWork,
        "23 + 23 + 23 + 23 = 92",
        34
      );
    }

    if (el.classroomFeedback) {
      el.classroomFeedback.textContent =
        "Koi tension nahi. Aaraam se seekhenge. " + explanation;
      el.classroomFeedback.className =
        "classroom-feedback feedback-try-again";
    }

    speakTeacher(explanation);
  }

  /* =====================================================
     EVENT LISTENERS
  ====================================================== */

  function setupEventListeners() {
    if (el.chatForm) {
      el.chatForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (classroomOpen) return;

        sendMessage(el.messageInput ? el.messageInput.value : "");
      });
    }

    if (el.messageInput) {
      el.messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (el.chatForm) {
            el.chatForm.requestSubmit();
          }
        }
      });

      el.messageInput.addEventListener("input", () => {
        el.messageInput.style.height = "auto";
        el.messageInput.style.height =
          `${Math.min(el.messageInput.scrollHeight, 140)}px`;
      });
    }

    document.querySelectorAll("[data-prompt]").forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.getAttribute("data-prompt") || "";
        if (prompt.toLowerCase().includes("digital classroom")) {
          openClassroom();
        } else {
          sendMessage(prompt);
        }
      });
    });

    if (el.menuBtn) {
      el.menuBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        if (!el.dropdown) return;

        el.dropdown.hidden = !el.dropdown.hidden;
      });
    }

    document.addEventListener("click", (event) => {
      if (
        el.dropdown &&
        !el.dropdown.hidden &&
        !el.dropdown.contains(event.target) &&
        event.target !== el.menuBtn
      ) {
        el.dropdown.hidden = true;
      }
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-action");

        if (el.dropdown) el.dropdown.hidden = true;

        switch (action) {
          case "quick-actions":
            openQuickActions();
            break;

          case "memory":
            sendMessage("Mujhe batao NEXA mein memory feature kaise kaam karta hai.");
            break;

          case "private-chat":
            sendMessage("Private chat ke liye safety aur privacy tips batao.");
            break;

          case "settings":
            sendMessage("NEXA ke available settings aur features batao.");
            break;

          case "digital-classroom":
            openClassroom();
            break;

          default:
            break;
        }
      });
    });

    if (el.plusBtn) {
      el.plusBtn.addEventListener("click", openQuickActions);
    }

    if (el.sheetBackdrop) {
      el.sheetBackdrop.addEventListener("click", closeQuickActions);
    }

    if (el.closeClassroom) {
      el.closeClassroom.addEventListener("click", closeClassroom);
    }

    if (el.replayBoard) {
      el.replayBoard.addEventListener("click", replayBoard);
    }

    if (el.teacherSpeak) {
      el.teacherSpeak.addEventListener("click", () => {
        const text = el.teacherSpeech
          ? el.teacherSpeech.textContent
          : "";

        speakTeacher(text);
      });
    }

    if (el.teacherNext) {
      el.teacherNext.addEventListener("click", nextClassroomStep);
    }

    if (el.answerForm) {
      el.answerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const answer = el.classroomAnswer
          ? el.classroomAnswer.value
          : "";

        if (/samajh nahi|samajh nhi|understand nahi|don't understand/i.test(answer)) {
          handleConfusion();
          return;
        }

        if (/break|thak gaya|thak gayi|tired/i.test(answer)) {
          const message =
            "Theek hai, 2–5 minute ka chhota break le lo. Paani piyo, phir ready hone par continue karna.";

          if (el.classroomFeedback) {
            el.classroomFeedback.textContent = message;
            el.classroomFeedback.className = "classroom-feedback";
          }

          if (el.teacherSpeech) {
            el.teacherSpeech.textContent = message;
          }

          speakTeacher(message);
          return;
        }

        checkQuizAnswer(answer);
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopListening();
        stopTeacherSpeech();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeQuickActions();

        if (el.dropdown) el.dropdown.hidden = true;
        if (classroomOpen) closeClassroom();
      }
    });

    const backButton = $("backBtn");
    if (backButton) {
      backButton.addEventListener("click", () => {
        if (classroomOpen) {
          closeClassroom();
          return;
        }

        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/home";
        }
      });
    }

    if (el.micBtn) {
      el.micBtn.addEventListener("click", toggleListening);
    }
  }

  /* =====================================================
     QUICK ACTION SHEET
  ====================================================== */

  function openQuickActions() {
    if (!el.sheetBackdrop || !el.sheetContent) {
      openClassroom();
      return;
    }

    el.sheetBackdrop.hidden = false;
    el.sheetContent.hidden = false;

    if (el.sheetTitle) {
      el.sheetTitle.textContent = "Quick actions";
    }

    el.sheetContent.innerHTML = "";

    const actions = [
      {
        title: "Digital Classroom",
        description: "Smart board, teacher aur maths quiz",
        run: openClassroom
      },
      {
        title: "Ask NEXA",
        description: "AI se koi bhi sawaal poochho",
        run: () => {
          closeQuickActions();

          if (el.messageInput) {
            el.messageInput.focus();
            el.messageInput.placeholder = "NEXA se kuch poochho…";
          }
        }
      },
      {
        title: "Clear chat",
        description: "Is screen ki conversation clear karo",
        run: clearConversation
      }
    ];

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sheet-action";

      const title = document.createElement("strong");
      title.textContent = action.title;

      const description = document.createElement("span");
      description.textContent = action.description;

      button.append(title, description);

      button.addEventListener("click", () => {
        closeQuickActions();
        action.run();
      });

      el.sheetContent.appendChild(button);
    });
  }

  function closeQuickActions() {
    if (el.sheetBackdrop) el.sheetBackdrop.hidden = true;
    if (el.sheetContent) el.sheetContent.hidden = true;
  }

  function clearConversation() {
    if (el.conversation) {
      el.conversation.innerHTML = "";
      el.conversation.hidden = false;
    }

    closeClassroom();
    updateWelcome();
  }

  function setupQuickActions() {
    // Quick actions are created when the plus button is pressed.
  }

  function setupMenu() {
    // Existing [data-action] menu items are wired in setupEventListeners().
  }

  /* =====================================================
     HINDI VOICE INPUT
  ====================================================== */

  function setupSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (el.micBtn) {
        el.micBtn.title = "Is browser mein voice input supported nahi hai";
        el.micBtn.setAttribute("aria-label", "Voice input unsupported");
      }
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;

      if (el.micBtn) {
        el.micBtn.classList.add("is-listening");
        el.micBtn.setAttribute("aria-pressed", "true");
      }

      if (el.voiceStatus) {
        el.voiceStatus.hidden = false;
        el.voiceStatus.textContent = "Sun raha hoon… bolo";
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (el.messageInput) {
        const currentValue = el.messageInput.value.trim();

        if (finalTranscript.trim()) {
          el.messageInput.value =
            `${currentValue} ${finalTranscript}`.trim();
        }

        if (el.voiceStatus) {
          el.voiceStatus.textContent =
            interimTranscript || "Sun raha hoon…";
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn("Voice recognition error:", event.error);

      if (el.voiceStatus) {
        el.voiceStatus.hidden = false;
        el.voiceStatus.textContent =
          event.error === "not-allowed"
            ? "Microphone permission allow karo."
            : "Voice input mein problem. Dobara try karo.";
      }
    };

    recognition.onend = () => {
      isListening = false;

      if (el.micBtn) {
        el.micBtn.classList.remove("is-listening");
        el.micBtn.setAttribute("aria-pressed", "false");
      }

      if (el.voiceStatus) {
        el.voiceStatus.hidden = true;
      }
    };
  }

  function toggleListening() {
    if (!recognition) {
      if (el.voiceStatus) {
        el.voiceStatus.hidden = false;
        el.voiceStatus.textContent =
          "Voice input supported browser mein open karo, ya typing use karo.";
      }
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.warn("Could not start voice recognition:", error);
    }
  }

  function stopListening() {
    if (!recognition || !isListening) return;

    try {
      recognition.stop();
    } catch (error) {
      console.warn("Could not stop voice recognition:", error);
    }
  }
})();
