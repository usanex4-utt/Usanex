
/* =========================================================
   NEXA — CHAT + DIGITAL CLASSROOM
   Complete replacement: frontend/static/js/nexa.js
   API preserved: /api/ai-assistant/chat
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
  let activeLesson = null;
  let lastMathQuestion = "";
  let lastMathReply = "";
  let chatRequestNumber = 0;
  let voiceTarget = "chat";
  let activeRequestController = null;

  const lessons = [
    {
      title: "23 × 4",
      steps: [
        {
          work: "Step 1: 23 = 20 + 3",
          speech: "Sabse pehle 23 ko 20 aur 3 mein baantte hain."
        },
        {
          work: "Step 2: 20 × 4 = 80",
          speech: "20 ko 4 se multiply karne par 80 milta hai."
        },
        {
          work: "Step 3: 3 × 4 = 12",
          speech: "3 ko 4 se multiply karne par 12 milta hai."
        },
        {
          work: "Step 4: 80 + 12 = 92",
          speech: "Dono results jodo. Final answer 92 hai."
        }
      ],
      answer: "92",
      quiz: {
        question: "Practice: 12 × 3 = ?",
        hint: "12 ko 10 + 2 mein baanto.",
        answer: 36,
        explanation: "12 × 3 = 10 × 3 + 2 × 3 = 30 + 6 = 36."
      }
    },
    {
      title: "Addition: 28 + 15",
      steps: [
        {
          work: "Step 1: 28 + 15",
          speech: "Hum 28 mein 15 jodenge."
        },
        {
          work: "Step 2: 28 + 10 = 38",
          speech: "Pehle 10 jodo. Answer 38 hai."
        },
        {
          work: "Step 3: 38 + 5 = 43",
          speech: "Ab 5 aur jodo. Final answer 43 hai."
        }
      ],
      answer: "43",
      quiz: {
        question: "Practice: 34 + 8 = ?",
        hint: "34 mein pehle 6 jodo, phir 2.",
        answer: 42,
        explanation: "34 + 8 = 34 + 6 + 2 = 40 + 2 = 42."
      }
    },
    {
      title: "Subtraction: 52 − 18",
      steps: [
        {
          work: "Step 1: 52 − 18",
          speech: "Hum 52 mein se 18 ghataayenge."
        },
        {
          work: "Step 2: 52 − 10 = 42",
          speech: "Pehle 10 ghatao. Answer 42 hai."
        },
        {
          work: "Step 3: 42 − 8 = 34",
          speech: "Ab 8 ghatao. Final answer 34 hai."
        }
      ],
      answer: "34",
      quiz: {
        question: "Practice: 65 − 27 = ?",
        hint: "Pehle 20 ghatao, phir 7.",
        answer: 38,
        explanation: "65 − 27 = 65 − 20 − 7 = 45 − 7 = 38."
      }
    }
  ];

  /* -------------------- RUNTIME STYLES -------------------- */

  function addRuntimeStyles() {
    if ($("nexaRuntimeStyles")) return;

    const style = document.createElement("style");
    style.id = "nexaRuntimeStyles";
    style.textContent = `
      .message { max-width:100%; overflow-wrap:anywhere; }
      .message.user {
        align-self:flex-end; width:fit-content; max-width:88%;
        padding:10px 13px 6px; border-radius:17px 17px 4px 17px;
        background:#17253b; color:#f2f6ff;
      }
      .message.assistant {
        align-self:flex-start; width:100%; max-width:100%;
        padding:0; background:transparent; border:0; color:#e2e9f6;
      }
      .message-content {
        line-height:1.75; overflow-wrap:anywhere; white-space:pre-wrap;
      }
      .message-meta {
        display:flex; align-items:center; justify-content:flex-end;
        gap:6px; margin-top:4px; font-size:10px; color:#91a5c4;
      }
      .message.assistant .message-meta { justify-content:flex-start; }
      .message-ticks { color:#77baff; letter-spacing:-2px; }
      .message-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
      .nexa-action-btn {
        display:inline-flex; align-items:center; gap:6px; min-height:34px;
        padding:7px 11px; border:1px solid #344966; border-radius:10px;
        background:transparent; color:#bcdcff; font-size:12px;
      }
      .nexa-action-btn:hover { border-color:#65a7ff; }
      .nexa-classroom-link { background:#101c2e; }
      .message-pending .message-content { color:#91a5c4; }
      .message-error .message-content { color:#ffb6b6; }
      .sheet-action {
        display:flex; flex-direction:column; align-items:flex-start; gap:6px;
        width:100%; padding:14px; margin:7px 0; text-align:left;
        border:1px solid #293b56; border-radius:12px;
        background:#101827; color:#f3f6ff;
      }
      .sheet-action strong { font-size:14px; }
      .sheet-action small { color:#9aa9c2; font-size:12px; }
      .nexa-classroom-ask {
        display:grid; grid-template-columns:minmax(0,1fr) auto auto;
        gap:7px; margin:12px 0 6px; padding:9px;
        border:1px solid #293b56; border-radius:14px; background:#101827;
      }
      .nexa-classroom-ask input {
        width:100%; min-width:0; padding:10px;
        border:1px solid #304563; border-radius:9px;
        background:#080f1b; color:white;
      }
      .nexa-classroom-ask button {
        padding:8px 10px; border:1px solid #304563; border-radius:9px;
        background:#172943; color:#dbeaff;
      }
      .nexa-classroom-status { grid-column:1/-1; color:#a7c9f5; font-size:12px; }
      .is-listening { border-color:#ff7b7b !important; }
      @media(max-width:480px) {
        .message.user { max-width:91%; }
        .nexa-classroom-ask { grid-template-columns:minmax(0,1fr) auto; }
        .nexa-classroom-ask input { grid-column:1/-1; }
      }
    `;
    document.head.appendChild(style);
  }

  /* -------------------- INITIALIZATION -------------------- */

  addRuntimeStyles();

  // Keep any existing conversation instead of clearing it on every load.
  if (el.classroom) el.classroom.hidden = true;
  if (el.sheetBackdrop) el.sheetBackdrop.hidden = true;
  if (el.dropdown) el.dropdown.hidden = true;

  setupSpeechRecognition();
  setupEventListeners();
  updateWelcome();

  function updateWelcome() {
    const hasMessages = Boolean(
      el.conversation && el.conversation.children.length
    );
    if (el.welcome) {
      el.welcome.hidden = hasMessages || classroomOpen;
    }
  }

  function scrollChatToBottom() {
    if (el.chatArea) el.chatArea.scrollTop = el.chatArea.scrollHeight;
  }

  function getTime() {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(new Date());
  }

  function makeMessage(role, text) {
    const message = document.createElement("div");
    message.className = `message ${role}`;

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = String(text ?? "");

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const time = document.createElement("span");
    time.textContent = getTime();
    meta.appendChild(time);

    if (role === "user") {
      const ticks = document.createElement("span");
      ticks.className = "message-ticks";
      ticks.textContent = "✓✓";
      ticks.title = "Sent";
      meta.appendChild(ticks);
    }

    message.append(content, meta);
    return { message, content, meta };
  }

  function addMessage(role, text) {
    if (!el.conversation) return null;

    const item = makeMessage(role, text);
    el.conversation.appendChild(item.message);
    updateWelcome();
    scrollChatToBottom();
    return item;
  }

  function addActionButton(container, label, callback, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nexa-action-btn ${extraClass}`.trim();
    button.textContent = label;
    button.addEventListener("click", callback);
    container.appendChild(button);
    return button;
  }

  function addReplyActions(item, reply, question) {
    if (!item) return;

    const actions = document.createElement("div");
    actions.className = "message-actions";

    if (detectMathQuestion(question)) {
      addActionButton(
        actions,
        "▦ Open NEXA Classroom",
        () => openClassroom(question, reply),
        "nexa-classroom-link"
      );
    }

    addActionButton(actions, "🔊 Listen", () => speakTeacher(reply));
    item.message.appendChild(actions);
  }

  function setSendingState(sending) {
    isSending = sending;
    if (el.sendBtn) el.sendBtn.disabled = sending;
    if (el.messageInput) el.messageInput.disabled = sending;
  }

  /* -------------------- API -------------------- */

  async function requestNexaReply(question, signal) {
    const response = await fetch(API.chat, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ message: question }),
      signal
    });

    const raw = await response.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { reply: raw };
    }

    if (!response.ok) {
      throw new Error(
        data.detail || data.error || data.message ||
        `Request failed (${response.status})`
      );
    }

    const reply = data.reply ?? data.response ?? data.answer ??
      data.message ?? data.text ??
      "Mujhe abhi iska jawab nahi mila. Dobara try karo.";

    return { reply: String(reply), data };
  }

  async function sendMessage(rawText) {
    const question = String(rawText || "").trim();
    if (!question || isSending || classroomOpen) return;

    stopListening();
    if (el.messageInput) {
      el.messageInput.value = "";
      el.messageInput.style.height = "";
    }

    addMessage("user", question);

    const pending = addMessage("assistant", "Soch raha hoon…");
    if (pending) pending.message.classList.add("message-pending");

    const requestId = ++chatRequestNumber;
    activeRequestController = new AbortController();
    setSendingState(true);

    try {
      const result = await requestNexaReply(
        question,
        activeRequestController.signal
      );

      if (requestId !== chatRequestNumber) return;

      if (pending) {
        pending.content.textContent = result.reply;
        pending.message.classList.remove("message-pending");
        addReplyActions(pending, result.reply, question);
      }
    } catch (error) {
      if (error.name !== "AbortError" && pending) {
        pending.content.textContent =
          "NEXA se connect nahi ho paaya. Internet, login aur backend check karke dobara try karo.";
        pending.message.classList.remove("message-pending");
        pending.message.classList.add("message-error");
        console.error("NEXA chat error:", error);
      }
    } finally {
      if (requestId === chatRequestNumber) {
        activeRequestController = null;
        setSendingState(false);
        updateWelcome();
      }
    }
  }

  /* -------------------- MATHS -------------------- */

  function detectMathQuestion(text) {
    const value = String(text || "").trim();
    if (!value) return false;

    return (
      (/\d/.test(value) && /[+\-×÷*/=^%]/.test(value)) ||
      /\b(math|mathematics|calculate|solve|formula|equation|multiply|multiplication|divide|division|addition|subtraction|derivative|integral|algebra|geometry)\b/i.test(value) ||
      /(kitna|ganit|jodo|ghatao|guna|bhaag|solve karo|answer batao)/i.test(value)
    );
  }

  function parseArithmeticQuestion(text) {
    const source = String(text || "")
      .replace(/,/g, "")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/[?=]/g, " ")
      .trim();

    const match = source.match(
      /(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/
    );
    if (!match) return null;

    const a = Number(match[1]);
    const operator = match[2];
    const b = Number(match[3]);

    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    if (operator === "/" && b === 0) return null;

    let result;
    if (operator === "+") result = a + b;
    else if (operator === "-") result = a - b;
    else if (operator === "*") result = a * b;
    else result = a / b;

    if (!Number.isFinite(result)) return null;

    return { a, b, operator, result };
  }

  function formatNumber(number) {
    return Number(number.toPrecision(10)).toLocaleString("en-IN", {
      maximumFractionDigits: 8
    });
  }

  function makeArithmeticLesson(question, reply) {
    const parsed = parseArithmeticQuestion(question);
    if (!parsed) return null;

    const { a, b, operator, result } = parsed;
    const symbol = { "*": "×", "/": "÷", "+": "+", "-": "−" }[operator];
    let steps = [];

    if (operator === "*" && Number.isInteger(a) &&
        a >= 10 && a < 100 && Number.isInteger(b) && b >= 0) {
      const tens = Math.trunc(a / 10) * 10;
      const ones = a - tens;

      steps = [
        {
          work: `Step 1: ${a} = ${tens} + ${ones}`,
          speech: `${a} ko ${tens} aur ${ones} mein baantte hain.`
        },
        {
          work: `Step 2: ${tens} × ${b} = ${formatNumber(tens * b)}`,
          speech: `${tens} ko ${b} se multiply karo.`
        },
        {
          work: `Step 3: ${ones} × ${b} = ${formatNumber(ones * b)}`,
          speech: `${ones} ko ${b} se multiply karo.`
        },
        {
          work: `Step 4: ${formatNumber(tens * b)} + ${formatNumber(ones * b)} = ${formatNumber(result)}`,
          speech: `Dono results jodo. Answer ${formatNumber(result)} hai.`
        }
      ];
    }

    if (!steps.length) {
      const explanation = {
        "+": "Addition mein dono numbers ko jodte hain.",
        "-": "Subtraction mein doosre number ko pehle se ghataate hain.",
        "*": "Multiplication mein numbers ka guna karte hain.",
        "/": "Division mein pehle number ko doosre number se divide karte hain."
      };

      steps = [
        {
          work: `Step 1: ${formatNumber(a)} ${symbol} ${formatNumber(b)}`,
          speech: "Sabse pehle question ko samajhte hain."
        },
        {
          work: `Step 2: ${explanation[operator]}`,
          speech: explanation[operator]
        },
        {
          work: `Step 3: ${formatNumber(a)} ${symbol} ${formatNumber(b)} = ${formatNumber(result)}`,
          speech: `Calculation ke baad answer ${formatNumber(result)} hai.`
        }
      ];
    }

    return {
      title: `${formatNumber(a)} ${symbol} ${formatNumber(b)}`,
      steps,
      answer: formatNumber(result),
      originalQuestion: question,
      originalReply: reply,
      quiz: {
        question: `Practice: ${formatNumber(a)} ${symbol} ${formatNumber(b)} = ?`,
        hint: "Board par diye gaye steps dobara dekho.",
        answer: result,
        explanation: `${formatNumber(a)} ${symbol} ${formatNumber(b)} = ${formatNumber(result)}.`
      }
    };
  }

  function createLessonForQuestion(question, reply) {
    const arithmetic = makeArithmeticLesson(question, reply);
    if (arithmetic) return arithmetic;

    const known = lessons.find((lesson) =>
      String(question).toLowerCase().includes(lesson.title.toLowerCase())
    );
    if (known) return known;

    return {
      title: question,
      steps: [
        {
          work: "Original question",
          speech: "Pehle tumhare original question ko samajhte hain."
        },
        {
          work: String(reply || "NEXA ka answer available nahi hai."),
          speech: "Yeh NEXA ke response ka summary hai. Detail chahiye to follow-up poochho."
        }
      ],
      answer: "",
      originalQuestion: question,
      originalReply: reply,
      quiz: null
    };
  }

  /* -------------------- CLASSROOM BOARD -------------------- */

  function stopBoardAnimation() {
    if (writingTimer) {
      clearInterval(writingTimer);
      writingTimer = null;
    }
    if (el.boardCanvas) el.boardCanvas.classList.remove("writing");
  }

  function animateText(target, text, speed = 18) {
    if (!target) return;

    stopBoardAnimation();
    target.textContent = "";

    const content = String(text);
    let index = 0;

    writingTimer = setInterval(() => {
      target.textContent += content.charAt(index++);
      if (el.digitalPen) {
        el.digitalPen.style.left =
          `${8 + Math.min(index / Math.max(content.length, 1), 1) * 82}%`;
      }
      if (index >= content.length) stopBoardAnimation();
    }, speed);
  }

  function stopTeacherSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (el.teacherAvatar) el.teacherAvatar.classList.remove("speaking");
  }

  function speakTeacher(text) {
    if (!text || !("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined") {
      return;
    }

    stopTeacherSpeech();

    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = "hi-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1;

    utterance.onstart = () => {
      if (el.teacherAvatar) el.teacherAvatar.classList.add("speaking");
    };
    utterance.onend = utterance.onerror = () => {
      if (el.teacherAvatar) el.teacherAvatar.classList.remove("speaking");
    };

    window.speechSynthesis.speak(utterance);
  }

  function updateProgress() {
    if (el.classProgress && activeLesson) {
      el.classProgress.textContent =
        `Lesson step ${currentLessonStep + 1}/${activeLesson.steps.length}`;
    }
    if (el.yourScore) {
      el.yourScore.textContent = `Tumhara score: ${score}/${answeredQuestions}`;
    }
  }

  function renderBoardStep(index, shouldSpeak = true) {
    stopBoardAnimation();
    if (!activeLesson || !activeLesson.steps.length) return;

    currentLessonStep = Math.max(
      0,
      Math.min(index, activeLesson.steps.length - 1)
    );

    if (el.boardQuestion) el.boardQuestion.textContent = activeLesson.title;
    if (el.boardAnswer) el.boardAnswer.textContent = "";

    const step = activeLesson.steps[currentLessonStep];
    animateText(el.boardWork, step.work);

    if (el.teacherSpeech) el.teacherSpeech.textContent = step.speech;
    if (el.teacherNext) {
      el.teacherNext.textContent =
        currentLessonStep < activeLesson.steps.length - 1
          ? "Next Step"
          : activeLesson.quiz ? "Start Practice" : "Finish Lesson";
    }

    if (shouldSpeak) speakTeacher(step.speech);
    updateProgress();
  }

  function openClassroom(question, reply) {
    if (!el.classroom) {
      addMessage("assistant", "Classroom HTML section nahi mila.");
      return;
    }

    stopListening();
    stopTeacherSpeech();
    closeQuickActions();

    classroomOpen = true;
    lastMathQuestion = question || lastMathQuestion || "23 × 4";
    lastMathReply = reply || lastMathReply || "";

    activeLesson = createLessonForQuestion(lastMathQuestion, lastMathReply);
    currentLessonStep = 0;
    currentQuiz = null;
    score = 0;
    answeredQuestions = 0;

    el.classroom.hidden = false;
    if (el.welcome) el.welcome.hidden = true;
    if (el.conversation) el.conversation.hidden = true;
    if (el.dropdown) el.dropdown.hidden = true;

    if (el.classroomAnswer) el.classroomAnswer.value = "";
    if (el.classroomFeedback) el.classroomFeedback.textContent = "";
    if (el.studentHint) el.studentHint.textContent = "";

    if (el.studentQuestion) {
      el.studentQuestion.textContent = activeLesson.quiz
        ? "Pehle example dekho, phir practice karo."
        : "Board ke steps dekho. Naya question bhi poochh sakte ho.";
    }

    ensureClassroomAskBox();
    renderBoardStep(0, false);
    updateProgress();

    if (el.teacherSpeech) {
      el.teacherSpeech.textContent =
        `Chalo, ${activeLesson.title} ko step-by-step samajhte hain.`;
    }

    if (el.chatArea) el.chatArea.scrollTop = 0;
    speakTeacher(`Welcome to NEXA Classroom. ${activeLesson.title} ko samajhte hain.`);
  }

  function closeClassroom() {
    stopBoardAnimation();
    stopTeacherSpeech();
    stopListening();

    classroomOpen = false;
    if (el.classroom) el.classroom.hidden = true;
    if (el.conversation) el.conversation.hidden = false;

    updateWelcome();
  }

  function showQuiz() {
    if (!activeLesson || !activeLesson.quiz) {
      if (el.classroomFeedback) {
        el.classroomFeedback.textContent =
          "Is question ke liye automatic quiz available nahi hai. Neeche naya question poochho.";
      }
      return;
    }

    currentQuiz = activeLesson.quiz;
    if (el.boardQuestion) el.boardQuestion.textContent = "Your Turn!";
    if (el.boardWork) el.boardWork.textContent = "Apna answer neeche likho.";
    if (el.boardAnswer) el.boardAnswer.textContent = "";

    if (el.studentQuestion) el.studentQuestion.textContent = currentQuiz.question;
    if (el.studentHint) el.studentHint.textContent = "Hint: " + currentQuiz.hint;
    if (el.classroomFeedback) el.classroomFeedback.textContent = "";
    if (el.classroomAnswer) {
      el.classroomAnswer.value = "";
      el.classroomAnswer.focus();
    }
    if (el.teacherSpeech) el.teacherSpeech.textContent = "Ab tum solve karo.";
    if (el.teacherNext) el.teacherNext.textContent = "Next Lesson";

    speakTeacher("Ab tum solve karo. Soch kar answer do.");
  }

  function checkQuizAnswer(rawAnswer) {
    if (!currentQuiz) {
      if (el.classroomFeedback) {
        el.classroomFeedback.textContent =
          "Is lesson mein quiz nahi hai. Neeche apna question poochho.";
      }
      return;
    }

    const value = String(rawAnswer || "").trim();
    if (!value) return;

    const number = Number(value.replace(/,/g, "").replace(/[₹%]/g, ""));
    answeredQuestions++;

    if (Number.isFinite(number) && number === Number(currentQuiz.answer)) {
      score++;
      const message = "Bilkul sahi! 🎉 " + currentQuiz.explanation;

      if (el.classroomFeedback) {
        el.classroomFeedback.textContent = message;
        el.classroomFeedback.className = "classroom-feedback feedback-correct";
      }
      if (el.boardAnswer) {
        el.boardAnswer.textContent = `Correct answer: ${currentQuiz.answer}`;
      }
      if (el.teacherSpeech) el.teacherSpeech.textContent = message;
      speakTeacher(message);
    } else {
      const message = "Koi baat nahi. " + currentQuiz.explanation + " Ek baar phir try karo.";
      if (el.classroomFeedback) {
        el.classroomFeedback.textContent = message;
        el.classroomFeedback.className = "classroom-feedback feedback-try-again";
      }
      if (el.boardWork) animateText(el.boardWork, currentQuiz.explanation);
      if (el.teacherSpeech) el.teacherSpeech.textContent = message;
      speakTeacher(message);
    }

    updateProgress();
  }

  function nextClassroomStep() {
    if (!activeLesson) return;

    if (currentQuiz) {
      const index = lessons.indexOf(activeLesson);
      activeLesson = lessons[(index + 1 + lessons.length) % lessons.length];
      currentQuiz = null;
      if (el.studentHint) el.studentHint.textContent = "";
      if (el.classroomFeedback) el.classroomFeedback.textContent = "";
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
    const explanation = activeLesson
      ? activeLesson.steps.map((step) => step.work).join(". ")
      : "Question ko chhote steps mein divide karke samajhte hain.";

    if (el.teacherSpeech) el.teacherSpeech.textContent = explanation;
    if (el.boardQuestion) el.boardQuestion.textContent = "Easy Explanation";
    if (el.boardWork) animateText(el.boardWork, explanation);

    if (el.classroomFeedback) {
      el.classroomFeedback.textContent = explanation;
      el.classroomFeedback.className = "classroom-feedback feedback-try-again";
    }
    speakTeacher(explanation);
  }

  /* -------------------- CLASSROOM ASK BOX -------------------- */

  function ensureClassroomAskBox() {
    if (!el.classroom || $("nexaClassroomAskBox")) return;

    const form = document.createElement("form");
    form.id = "nexaClassroomAskBox";
    form.className = "nexa-classroom-ask";

    const input = document.createElement("input");
    input.id = "nexaClassroomQuestion";
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = "NEXA Teacher se naya question poochho…";
    input.setAttribute("aria-label", "Ask NEXA Classroom");

    const mic = document.createElement("button");
    mic.type = "button";
    mic.id = "nexaClassroomMic";
    mic.textContent = "🎙";
    mic.setAttribute("aria-label", "Speak a classroom question");

    const send = document.createElement("button");
    send.type = "submit";
    send.textContent = "Ask";

    const status = document.createElement("div");
    status.id = "nexaClassroomAskStatus";
    status.className = "nexa-classroom-status";
    status.setAttribute("aria-live", "polite");

    form.append(input, mic, send, status);
    el.classroom.appendChild(form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question) return;
      input.value = "";
      await askClassroomQuestion(question);
    });

    mic.addEventListener("click", () => {
      voiceTarget = "classroom";
      toggleListening();
    });
  }

  async function askClassroomQuestion(question) {
    const status = $("nexaClassroomAskStatus");
    if (status) status.textContent = "NEXA soch raha hai…";

    const requestId = ++chatRequestNumber;
    const controller = new AbortController();

    try {
      const result = await requestNexaReply(question, controller.signal);
      if (requestId !== chatRequestNumber || !classroomOpen) return;

      lastMathQuestion = question;
      lastMathReply = result.reply;
      activeLesson = createLessonForQuestion(question, result.reply);
      currentLessonStep = 0;
      currentQuiz = null;

      if (el.classroomFeedback) el.classroomFeedback.textContent = "";
      if (el.studentHint) el.studentHint.textContent = "";

      if (el.studentQuestion) {
        el.studentQuestion.textContent = activeLesson.quiz
          ? "Example ke baad practice question solve karo."
          : "Explanation dekho. Tum follow-up bhi poochh sakte ho.";
      }

      renderBoardStep(0, false);

      if (el.boardAnswer) {
        el.boardAnswer.textContent = activeLesson.answer
          ? `Answer: ${activeLesson.answer}`
          : "";
      }

      const teacherText = activeLesson.originalReply
        ? `NEXA ka jawab: ${activeLesson.originalReply}`
        : activeLesson.steps[0].speech;

      if (el.teacherSpeech) el.teacherSpeech.textContent = teacherText;
      if (status) {
        status.textContent = activeLesson.answer
          ? `Answer: ${activeLesson.answer}. Neeche steps dekho.`
          : "Jawab board par dikhaya gaya hai. Detail ke liye follow-up poochho.";
      }

      speakTeacher(teacherText);
      updateProgress();
    } catch (error) {
      if (error.name !== "AbortError" && status) {
        status.textContent =
          "NEXA se connect nahi ho paaya. Internet aur login check karo.";
        console.error("Classroom question error:", error);
      }
    }
  }

  /* -------------------- VOICE INPUT -------------------- */

  function showVoiceStatus(message) {
    if (!el.voiceStatus) return;
    el.voiceStatus.hidden = false;
    el.voiceStatus.textContent = message;
  }

  function setupSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (el.micBtn) el.micBtn.title = "Voice input is not supported in this browser";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;
      if (el.micBtn) {
        el.micBtn.classList.add("is-listening");
        el.micBtn.setAttribute("aria-pressed", "true");
      }
      const classroomMic = $("nexaClassroomMic");
      if (classroomMic && voiceTarget === "classroom") classroomMic.textContent = "⏹";
      showVoiceStatus("Sun raha hoon… bolo");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }

      if (finalText.trim()) {
        const target = voiceTarget === "classroom"
          ? $("nexaClassroomQuestion")
          : el.messageInput;

        if (target) {
          target.value = `${target.value} ${finalText}`.trim();
          target.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      if (interimText) showVoiceStatus(interimText);
    };

    recognition.onerror = (event) => {
      showVoiceStatus(
        event.error === "not-allowed"
          ? "Microphone permission allow karo."
          : "Voice input mein problem. Typing se bhi poochh sakte ho."
      );
    };

    recognition.onend = () => {
      isListening = false;
      if (el.micBtn) {
        el.micBtn.classList.remove("is-listening");
        el.micBtn.setAttribute("aria-pressed", "false");
      }
      const classroomMic = $("nexaClassroomMic");
      if (classroomMic) classroomMic.textContent = "🎙";
      if (el.voiceStatus) {
        el.voiceStatus.hidden = true;
        el.voiceStatus.textContent = "";
      }
    };
  }

  function toggleListening() {
    if (!recognition) {
      showVoiceStatus("Is browser mein voice input supported nahi hai. Typing use karo.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.warn("Voice recognition could not start:", error);
      showVoiceStatus("Microphone dobara start karne se pehle ek second ruko.");
    }
  }

  function stopListening() {
    if (!recognition || !isListening) return;
    try {
      recognition.stop();
    } catch (error) {
      console.warn("Voice recognition could not stop:", error);
    }
  }

  /* -------------------- QUICK ACTIONS -------------------- */

  function closeQuickActions() {
    if (el.sheetBackdrop) el.sheetBackdrop.hidden = true;
    if (el.sheetContent) el.sheetContent.hidden = true;
  }

  function clearConversation() {
    chatRequestNumber++;
    if (activeRequestController) activeRequestController.abort();
    activeRequestController = null;
    setSendingState(false);

    if (el.conversation) el.conversation.replaceChildren();
    closeQuickActions();
    closeClassroom();
    updateWelcome();
  }

  function openQuickActions() {
    if (!el.sheetBackdrop || !el.sheetContent) return;

    if (el.dropdown) el.dropdown.hidden = true;

    el.sheetBackdrop.hidden = false;
    el.sheetContent.hidden = false;
    if (el.sheetTitle) el.sheetTitle.textContent = "Quick actions";

    el.sheetContent.replaceChildren();

    const actions = [
      {
        title: "Digital Classroom",
        description: "Smart board, teacher aur practice",
        run: () => openClassroom(lastMathQuestion || "23 × 4", lastMathReply)
      },
      {
        title: "Ask NEXA",
        description: "Chat mein naya sawaal poochho",
        run: () => {
          closeQuickActions();
          if (el.messageInput) el.messageInput.focus();
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

      const description = document.createElement("small");
      description.textContent = action.description;

      button.append(title, description);
      button.addEventListener("click", () => {
        closeQuickActions();
        action.run();
      });
      el.sheetContent.appendChild(button);
    });
  }

  /* -------------------- EVENT LISTENERS -------------------- */

  function setupEventListeners() {
    if (el.chatForm) {
      el.chatForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!classroomOpen) sendMessage(el.messageInput?.value || "");
      });
    }

    if (el.messageInput) {
      el.messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          el.chatForm?.requestSubmit();
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
        sendMessage(button.getAttribute("data-prompt") || "");
      });
    });

    if (el.menuBtn) {
      el.menuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (el.dropdown) el.dropdown.hidden = !el.dropdown.hidden;
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
            openClassroom(lastMathQuestion || "23 × 4", lastMathReply);
            break;
          default:
            break;
        }
      });
    });

    if (el.plusBtn) el.plusBtn.addEventListener("click", openQuickActions);

    if (el.sheetBackdrop) {
      el.sheetBackdrop.addEventListener("click", (event) => {
        if (event.target === el.sheetBackdrop) closeQuickActions();
      });
    }

    if (el.closeSheet) {
      el.closeSheet.addEventListener("click", closeQuickActions);
    }

    if (el.closeClassroom) {
      el.closeClassroom.addEventListener("click", closeClassroom);
    }

    if (el.replayBoard) {
      el.replayBoard.addEventListener("click", () => {
        renderBoardStep(currentLessonStep, true);
      });
    }

    if (el.teacherSpeak) {
      el.teacherSpeak.addEventListener("click", () => {
        speakTeacher(el.teacherSpeech?.textContent || "");
      });
    }

    if (el.teacherNext) {
      el.teacherNext.addEventListener("click", nextClassroomStep);
    }

    if (el.answerForm) {
      el.answerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const answer = el.classroomAnswer?.value || "";

        if (/samajh nahi|samajh nhi|understand nahi|don't understand/i.test(answer)) {
          handleConfusion();
          return;
        }

        if (/break|thak gaya|thak gayi|tired/i.test(answer)) {
          const message = "Theek hai, 2–5 minute ka break le lo. Ready hone par continue karna.";
          if (el.classroomFeedback) el.classroomFeedback.textContent = message;
          if (el.teacherSpeech) el.teacherSpeech.textContent = message;
          speakTeacher(message);
          return;
        }

        checkQuizAnswer(answer);
      });
    }

    if (el.micBtn) {
      el.micBtn.addEventListener("click", () => {
        voiceTarget = "chat";
        toggleListening();
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
        } else if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/home";
        }
      });
    }
  }
})();
