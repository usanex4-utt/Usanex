
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const partnerId = params.get("user_id") || params.get("partner_id") || params.get("id");

  const state = {
    partner: null, currentUser: null, messages: [], file: null,
    reply: null, selected: null, zoom: 1, loading: false,
    sending: false, muted: false, search: "", poll: null,
    mediaRecorder: null, audioChunks: [], recording: false
  };

  const EMOJIS = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃",
    "😉","😍","🥰","😘","😗","😋","😛","🤪","🤔","🫡","😎","🥳",
    "😭","😢","🥺","😔","😴","😡","🤬","😱","😮","😌","🤗","🤝",
    "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💕","💞","💖",
    "💗","💓","💘","💝","🔥","✨","⭐","🌹","🌸","🎉","👍","👎",
    "🙏","👏","🙌","💯","✅","❌","💐","🫶","🤍","😏","😜","🤩"
  ];

  const iconFallback = name => (name || "U").trim().charAt(0).toUpperCase() || "U";

  function toast(message, error = false) {
    const node = document.createElement("div");
    node.className = "toast" + (error ? " error" : "");
    node.textContent = message;
    $("toastContainer").appendChild(node);
    setTimeout(() => node.remove(), 3000);
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      throw new Error(data.detail || data.message || `Request failed (${response.status})`);
    }
    return data;
  }

  function setConnectionError(message) {
    $("connectionBanner").hidden = false;
    $("connectionMessage").textContent = message;
    $("retryButton").hidden = false;
  }

  function clearConnectionError() {
    $("connectionBanner").hidden = true;
  }

  function setStatus(text, online = false) {
    $("selectedStatus").textContent = text;
    $("onlineDot").classList.toggle("is-online", online);
  }

  function profileImageUrl(path) {
    if (!path) return "";
    try {
      const url = new URL(path, location.origin);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      return url.href;
    } catch (_) {
      return "";
    }
  }

  function updateProfile(user) {
    state.partner = user || state.partner;
    if (!state.partner) return;

    const name = state.partner.name || state.partner.username || state.partner.user_id || "User";
    $("selectedName").textContent = name;
    $("welcomeName").textContent = name;
    $("dpProfileName").textContent = name;

    const photo = profileImageUrl(state.partner.profile_photo);
    const avatar = $("selectedAvatar");
    const fallback = $("avatarFallback");

    if (photo) {
      avatar.src = photo;
      avatar.hidden = false;
      fallback.hidden = true;
      avatar.onerror = () => {
        avatar.hidden = true;
        fallback.hidden = false;
      };
    } else {
      avatar.removeAttribute("src");
      avatar.hidden = true;
      fallback.hidden = false;
    }

    fallback.textContent = iconFallback(name);
    $("viewerAvatar").textContent = iconFallback(name);
    $("welcomeCard").hidden = state.messages.length > 0;
  }

  function normalizeMessage(raw) {
    return {
      ...raw,
      id: raw.id,
      sender_id: raw.sender_id,
      receiver_id: raw.receiver_id,
      content: raw.content ?? raw.message ?? "",
      media_url: raw.media_url || "",
      media_type: raw.media_type || "",
      is_read: Boolean(raw.is_read ?? raw.read),
      is_deleted: Boolean(raw.is_deleted),
      created_at: raw.created_at || null
    };
  }

  function isMine(message) {
    if (!state.currentUser) return false;
    return String(message.sender_id) === String(state.currentUser.id) ||
      String(message.sender_id) === String(state.currentUser.user_id);
  }

  function messageTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function dateKey(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return "unknown";
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function dateLabel(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (dateKey(d) === dateKey(today)) return "Today";
    if (dateKey(d) === dateKey(yesterday)) return "Yesterday";
    return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function attachmentElement(message) {
    if (!message.media_url) return null;

    const url = profileImageUrl(message.media_url);
    if (!url) return null;

    const wrapper = makeElement("div", "message-attachment");
    const type = (message.media_type || "").toLowerCase();
    const ext = url.split("?")[0].split(".").pop().toLowerCase();

    if (type.startsWith("image/") || ["jpg","jpeg","png","webp","gif"].includes(ext)) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Shared image";
      img.loading = "lazy";
      link.appendChild(img);
      wrapper.appendChild(link);
    } else if (type.startsWith("video/") || ["mp4","mov","webm"].includes(ext)) {
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.preload = "metadata";
      wrapper.appendChild(video);
    } else if (type.startsWith("audio/") || ["mp3","wav","ogg","m4a","aac","opus"].includes(ext)) {
      const audio = document.createElement("audio");
      audio.src = url;
      audio.controls = true;
      wrapper.appendChild(audio);
    } else {
      const card = makeElement("div", "file-card");
      card.appendChild(makeElement("span", "file-card-icon", "▤"));
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = url.split("/").pop() || "Open attachment";
      link.download = "";
      card.appendChild(link);
      wrapper.appendChild(card);
    }
    return wrapper;
  }

  function createMessage(message) {
    const mine = isMine(message);
    const row = makeElement("div", `message-row ${mine ? "mine" : "theirs"}`);
    row.dataset.messageId = String(message.id);

    const bubble = makeElement("article", "message-bubble");
    bubble.dataset.messageId = String(message.id);
    bubble.tabIndex = 0;
    bubble.setAttribute("aria-label", "Message. Long press for options.");

    if (message.reply_to_content || message.reply_message) {
      const quote = makeElement("div", "reply-quote");
      quote.appendChild(makeElement("strong", "", message.reply_to_name || "Reply"));
      quote.appendChild(makeElement("span", "", message.reply_to_content || message.reply_message || ""));
      bubble.appendChild(quote);
    }

    if (message.is_deleted) {
      bubble.appendChild(makeElement("div", "deleted-message", "This message was deleted"));
    } else {
      const attachment = attachmentElement(message);
      if (attachment) bubble.appendChild(attachment);
      if (message.content) bubble.appendChild(makeElement("div", "message-text", message.content));
    }

    if (Array.isArray(message.reactions) && message.reactions.length) {
      const reactions = makeElement("div", "message-reactions");
      message.reactions.forEach(reaction => {
        reactions.appendChild(makeElement("span", "", typeof reaction === "string" ? reaction : reaction.emoji || "❤️"));
      });
      bubble.appendChild(reactions);
    }

    const meta = makeElement("div", "message-meta");
    const time = messageTime(message.created_at);
    meta.appendChild(makeElement("span", "message-time", time));

    if (mine) {
      const ticks = makeElement("span", "message-ticks" + (message.is_read ? " seen" : ""),
        message.is_read ? "✓✓" : "✓");
      ticks.title = message.is_read ? "Seen/read" : "Sent";
      meta.appendChild(ticks);
    }
    bubble.appendChild(meta);

    bubble.addEventListener("contextmenu", event => {
      event.preventDefault();
      openMessageActions(message, event.clientX, event.clientY);
    });

    let pressTimer;
    bubble.addEventListener("touchstart", () => {
      pressTimer = setTimeout(() => openMessageActions(message), 500);
    }, { passive: true });
    ["touchend", "touchmove", "touchcancel"].forEach(name => {
      bubble.addEventListener(name, () => clearTimeout(pressTimer), { passive: true });
    });

    let startX = 0, startY = 0;
    bubble.addEventListener("touchstart", event => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    }, { passive: true });
    bubble.addEventListener("touchend", event => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) {
        setReply(message);
      }
    }, { passive: true });

    bubble.addEventListener("click", event => {
      if (window.getSelection()?.toString()) return;
      if (event.detail === 2) openMessageActions(message);
    });

    row.appendChild(bubble);
    return row;
  }

  function renderMessages(keepPosition = false) {
    const area = $("messagesArea");
    const nearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 140;
    const previousTop = area.scrollTop;
    const list = $("messagesList");
    list.replaceChildren();

    const sorted = [...state.messages].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return da - db;
    });

    let previousDate = "";
    sorted.forEach(message => {
      const key = dateKey(message.created_at);
      if (key !== previousDate) {
        const separator = makeElement("div", "date-separator");
        separator.appendChild(makeElement("span", "", dateLabel(message.created_at)));
        list.appendChild(separator);
        previousDate = key;
      }
      const row = createMessage(message);
      const needle = state.search.trim().toLowerCase();
      if (needle && (message.content || "").toLowerCase().includes(needle)) {
        row.querySelector(".message-bubble").style.outline = "1px solid #a9ccff";
      } else if (needle) {
        row.hidden = true;
      }
      list.appendChild(row);
    });

    $("welcomeCard").hidden = sorted.length > 0;
    if (!keepPosition || nearBottom) area.scrollTop = area.scrollHeight;
    else area.scrollTop = previousTop;
  }

  async function loadMessages(options = {}) {
    if (!partnerId) {
      setConnectionError("Chat partner ID missing. Open chat from a user's profile or connections list.");
      setStatus("User not selected");
      return;
    }
    if (state.loading) return;
    state.loading = true;
    try {
      const data = await request(`/api/chat/${encodeURIComponent(partnerId)}`);
      if (data.success === false) throw new Error(data.message || "Could not load chat");

      state.currentUser = data.current_user || state.currentUser;
      state.partner = data.user || state.partner;
      state.messages = Array.isArray(data.messages) ? data.messages.map(normalizeMessage) : [];

      updateProfile(state.partner);
      clearConnectionError();
      setStatus("Connected");
      renderMessages(options.keepPosition || false);
      $("welcomeCard").hidden = state.messages.length > 0;
    } catch (error) {
      console.error("Chat load failed:", error);
      setConnectionError(error.message || "Could not load messages.");
      if (!state.partner) setStatus("Unable to connect");
    } finally {
      state.loading = false;
    }
  }

  async function markRead() {
    if (!partnerId || document.visibilityState === "hidden") return;
    try {
      await request(`/api/chat/${encodeURIComponent(partnerId)}/read`, { method: "POST" });
    } catch (_) {}
  }

  async function sendMessage(overrideContent) {
    if (!partnerId || state.sending) return;

    const content = typeof overrideContent === "string" ? overrideContent : $("messageInput").value.trim();
    if (!content && !state.file) {
      toast("Type a message or attach a file.");
      return;
    }

    const form = new FormData();
    form.append("receiver_id", partnerId);
    form.append("content", content);
    if (state.file) form.append("file", state.file);

    state.sending = true;
    $("sendButton").disabled = true;

    try {
      const data = await request("/api/chat/send", { method: "POST", body: form });
      if (data.success === false) throw new Error(data.message || "Message not sent");
      $("messageInput").value = "";
      resizeInput();
      clearAttachment();
      clearReply();
      await loadMessages({ keepPosition: false });
      await markRead();
    } catch (error) {
      toast(error.message || "Message could not be sent.", true);
    } finally {
      state.sending = false;
      $("sendButton").disabled = false;
      $("messageInput").focus();
    }
  }

  function resizeInput() {
    const input = $("messageInput");
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  function setAttachment(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const video = file.type.startsWith("video/") || ["mp4","mov","webm"].includes(ext);
    const max = video ? 100 * 1024 * 1024 : 25 * 1024 * 1024;

    if (file.size > max) {
      toast(video ? "Video limit is 100 MB." : "File limit is 25 MB.", true);
      return;
    }
    state.file = file;
    $("previewName").textContent = file.name;
    $("previewSize").textContent = formatBytes(file.size);
    $("previewIcon").textContent = file.type.startsWith("image/") ? "▧" :
      file.type.startsWith("video/") ? "▶" : file.type.startsWith("audio/") ? "♫" : "▤";
    $("uploadPreview").hidden = false;
  }

  function clearAttachment() {
    state.file = null;
    $("fileInput").value = "";
    $("uploadPreview").hidden = true;
  }

  function setReply(message) {
    state.reply = message;
    $("replyPreviewName").textContent = isMine(message) ? "You" : (state.partner?.name || "User");
    $("replyPreviewText").textContent = message.content || "Attachment";
    $("replyPreview").hidden = false;
    hideMessageActions();
    $("messageInput").focus();
    toast("Reply selected. Type your reply below.");
  }

  function clearReply() {
    state.reply = null;
    $("replyPreview").hidden = true;
  }

  function hideMessageActions() {
    $("messageActions").hidden = true;
    state.selected = null;
  }

  function openMessageActions(message) {
    state.selected = message;
    const actions = $("messageActions");
    const del = actions.querySelector('[data-message-action="delete"]');
    del.hidden = false;
    actions.hidden = false;
  }

  async function deleteMessage(mode) {
    const message = state.selected;
    if (!message) return;

    if (mode === "everyone" && !isMine(message)) {
      toast("You can only delete your own message for everyone.", true);
      return;
    }

    try {
      // Existing backend provides delete-for-everyone for the sender.
      if (mode === "everyone") {
        await request(`/api/chat/message/${encodeURIComponent(message.id)}/delete`, { method: "POST" });
      } else {
        // No delete-for-me endpoint is assumed: hide locally for this page session.
        state.messages = state.messages.filter(item => String(item.id) !== String(message.id));
        renderMessages(true);
        toast("Hidden from this chat view. It may reappear after reload because server-side delete-for-me is not configured.");
      }
      hideMessageActions();
      if (mode === "everyone") await loadMessages({ keepPosition: true });
    } catch (error) {
      toast(error.message || "Could not delete message.", true);
    }
  }

  async function reactToMessage(emoji) {
    const message = state.selected;
    hideMessageActions();
    if (!message) return;
    try {
      await navigator.clipboard?.writeText(emoji);
      toast(`Reaction ${emoji} selected. Reaction saving requires a backend endpoint.`);
    } catch (_) {
      toast(`Reaction ${emoji} selected. Reaction saving requires a backend endpoint.`);
    }
  }

  async function copyMessage() {
    const message = state.selected;
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message.content || message.media_url || "");
      toast("Message copied.");
    } catch (_) {
      toast("Clipboard access is not available.", true);
    }
    hideMessageActions();
  }

  function closeMenus() {
    $("chatMenu").hidden = true;
    $("attachMenu").hidden = true;
  }

  function showSheet(title, contentBuilder) {
    closeMenus();
    $("actionSheetTitle").textContent = title;
    const content = $("actionSheetContent");
    content.replaceChildren();
    contentBuilder(content);
    $("actionSheet").hidden = false;
  }

  function option(parent, title, subtitle, callback, danger = false) {
    const button = makeElement("button", "sheet-option" + (danger ? " danger" : ""));
    const text = makeElement("span");
    text.appendChild(makeElement("span", "", title));
    if (subtitle) text.appendChild(makeElement("small", "", subtitle));
    button.appendChild(text);
    button.appendChild(makeElement("span", "", "›"));
    button.addEventListener("click", callback);
    parent.appendChild(button);
    return button;
  }

  function showChatCategories() {
    showSheet("Chat", content => {
      ["Connected", "Friend", "Family"].forEach(category => {
        option(content, category, `Set this conversation as ${category.toLowerCase()}`, () => {
          toast("Category UI selected. Saving categories needs a backend endpoint.");
          $("actionSheet").hidden = true;
        });
      });
    });
  }

  function showPrivacy() {
    showSheet("Privacy for this person", content => {
      const note = makeElement("p", "", "Choose what this person can see. Saving these choices per person requires backend support.");
      note.style.cssText = "font-size:12px;line-height:1.6;color:#9aa9bf";
      content.appendChild(note);
      [
        ["Online status", "online"],
        ["Last seen", "last_seen"],
        ["Typing status", "typing"]
      ].forEach(([label, key]) => {
        const row = makeElement("label", "sheet-option");
        const left = makeElement("span", "", label);
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = true;
        input.dataset.privacy = key;
        row.append(left, input);
        content.appendChild(row);
      });
      option(content, "Apply for this chat", null, () => {
        toast("Privacy choices selected. They are not server-saved yet.");
        $("actionSheet").hidden = true;
      });
    });
  }

  function showMore() {
    showSheet("More", content => {
      option(content, "Report", "Report this account or conversation", () => {
        showSheet("Report", inner => {
          ["Spam", "Harassment", "Fake account", "Inappropriate content", "Other"].forEach(reason => {
            option(inner, reason, null, () => {
              toast("Report submission needs a report endpoint.");
              $("actionSheet").hidden = true;
            });
          });
        });
      });
      option(content, "Block", "Prevent further communication", () => {
        showSheet("Block user?", inner => {
          option(inner, "Cancel", null, () => $("actionSheet").hidden = true);
          option(inner, "Block this user", "Blocking requires a backend endpoint", () => {
            toast("Block feature needs a backend endpoint.", true);
            $("actionSheet").hidden = true;
          }, true);
        });
      });
      option(content, "Clear chat", "Remove conversation history", () => {
        showSheet("Clear chat?", inner => {
          option(inner, "Cancel", null, () => $("actionSheet").hidden = true);
          option(inner, "Clear this chat", "A server-side clear-chat endpoint is required", () => {
            toast("Clear chat endpoint is not configured.", true);
            $("actionSheet").hidden = true;
          }, true);
        });
      });
    });
  }

  function showMedia() {
    const files = state.messages.filter(m => m.media_url);
    showSheet("Media, links & documents", content => {
      if (!files.length) {
        content.appendChild(makeElement("p", "", "No attachments in this conversation yet."));
        return;
      }
      files.forEach(message => {
        const link = makeElement("a", "sheet-option", message.content || message.media_url.split("/").pop());
        link.href = profileImageUrl(message.media_url);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.textDecoration = "none";
        content.appendChild(link);
      });
    });
  }

  function openCallOptions() {
    showSheet("Connect with this person", content => {
      option(content, "Voice call", "Requires WebRTC/calling service", () => {
        toast("Voice calling is not connected yet.");
        $("actionSheet").hidden = true;
      });
      option(content, "Video call", "Requires signaling and video-call service", () => {
        toast("Video calling is not connected yet.");
        $("actionSheet").hidden = true;
      });
      option(content, "Share call link", "Create a link after call service setup", async () => {
        const link = `${location.origin}/call?user_id=${encodeURIComponent(partnerId || "")}`;
        try {
          await navigator.clipboard.writeText(link);
          toast("Link copied, but a real call room must be configured before it can connect.");
        } catch (_) {
          toast(link);
        }
        $("actionSheet").hidden = true;
      });
    });
  }

  function openProfileViewer() {
    const url = profileImageUrl(state.partner?.profile_photo);
    $("viewerImage").style.transform = "scale(1)";
    state.zoom = 1;
    updateZoomLabel();
    $("viewerImage").hidden = !url;
    $("viewerAvatar").hidden = !!url;
    if (url) $("viewerImage").src = url;
    $("dpViewer").hidden = false;
  }

  function updateZoomLabel() {
    $("zoomLevel").textContent = Math.round(state.zoom * 100) + "%";
    $("viewerImage").style.transform = `scale(${state.zoom})`;
  }

  function fillEmojiGrid(filter = "") {
    const grid = $("emojiGrid");
    grid.replaceChildren();
    EMOJIS.filter(emoji => !filter || emoji.includes(filter)).forEach(emoji => {
      const button = makeElement("button", "", emoji);
      button.type = "button";
      button.addEventListener("click", () => {
        insertAtCursor($("messageInput"), emoji);
        $("messageInput").focus();
      });
      grid.appendChild(button);
    });
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.setRangeText(text, start, end, "end");
    resizeInput();
  }

  function toggleEmojiPanel() {
    $("emojiPanel").hidden = !$("emojiPanel").hidden;
    if (!$("emojiPanel").hidden) fillEmojiGrid();
  }

  function startVoiceRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast("Voice recording is not supported in this browser.");
      return;
    }
    if (state.recording) {
      state.mediaRecorder?.stop();
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      state.audioChunks = [];
      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = event => {
        if (event.data.size) state.audioChunks.push(event.data);
      };
      state.mediaRecorder.onstop = () => {
        const blob = new Blob(state.audioChunks, { type: state.mediaRecorder.mimeType || "audio/webm" });
        const ext = blob.type.includes("ogg") ? "ogg" : "webm";
        setAttachment(new File([blob], `voice-message-${Date.now()}.${ext}`, { type: blob.type }));
        stream.getTracks().forEach(track => track.stop());
        state.recording = false;
        $("micButton").classList.remove("recording");
        toast("Voice recording ready. Press Send to upload.");
      };
      state.mediaRecorder.start();
      state.recording = true;
      $("micButton").classList.add("recording");
      toast("Recording… tap microphone again to finish.");
    }).catch(() => toast("Microphone permission denied.", true));
  }

  function setupEvents() {
    $("backButton").addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.href = "/";
    });

    $("selectedAvatarButton").addEventListener("click", openProfileViewer);
    $("closeImageViewer").addEventListener("click", () => $("dpViewer").hidden = true);
    $("zoomIn").addEventListener("click", () => {
      state.zoom = Math.min(3, state.zoom + .25); updateZoomLabel();
    });
    $("zoomOut").addEventListener("click", () => {
      state.zoom = Math.max(.5, state.zoom - .25); updateZoomLabel();
    });
    $("zoomReset").addEventListener("click", () => {
      state.zoom = 1; updateZoomLabel();
    });

    $("coupleButton").addEventListener("click", () => {
      // Change this URL if your actual Couple page uses another route.
      location.href = `/couple-chat?partner_user_id=${encodeURIComponent(partnerId || "")}`;
    });
    $("callButton").addEventListener("click", openCallOptions);

    $("chatMenuButton").addEventListener("click", event => {
      event.stopPropagation();
      $("attachMenu").hidden = true;
      $("chatMenu").hidden = !$("chatMenu").hidden;
    });

    $("chatMenu").addEventListener("click", event => {
      const button = event.target.closest("[data-menu]");
      if (!button) return;
      const action = button.dataset.menu;
      if (action === "chat") showChatCategories();
      else if (action === "privacy") showPrivacy();
      else if (action === "mute") {
        state.muted = !state.muted;
        toast(state.muted ? "Mute selected for this page." : "Mute disabled for this page.");
        closeMenus();
      } else if (action === "search") {
        closeMenus();
        $("searchBar").hidden = false;
        $("messageSearch").focus();
      } else if (action === "media") showMedia();
      else if (action === "more") showMore();
    });

    $("messageSearch").addEventListener("input", event => {
      state.search = event.target.value;
      renderMessages(true);
    });
    $("clearSearch").addEventListener("click", () => {
      $("messageSearch").value = "";
      state.search = "";
      $("searchBar").hidden = true;
      renderMessages(true);
    });

    $("attachButton").addEventListener("click", event => {
      event.stopPropagation();
      $("chatMenu").hidden = true;
      $("attachMenu").hidden = !$("attachMenu").hidden;
    });

    $("attachMenu").addEventListener("click", event => {
      const button = event.target.closest("[data-attach]");
      if (!button) return;
      const type = button.dataset.attach;
      const input = $("fileInput");
      input.accept = type === "image" ? "image/*,video/*" :
        type === "audio" ? "audio/*" :
        ".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
      input.click();
      $("attachMenu").hidden = true;
    });

    $("cameraButton").addEventListener("click", () => {
      $("fileInput").accept = "image/*,video/*";
      $("fileInput").capture = "environment";
      $("fileInput").click();
    });

    $("fileInput").addEventListener("change", event => {
      setAttachment(event.target.files?.[0]);
      event.target.removeAttribute("capture");
    });
    $("removeAttachment").addEventListener("click", clearAttachment);

    $("sendButton").addEventListener("click", () => sendMessage());
    $("messageInput").addEventListener("input", resizeInput);
    $("messageInput").addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        sendMessage();
      }
    });

    $("emojiButton").addEventListener("click", toggleEmojiPanel);
    $("closeEmojiPanel").addEventListener("click", () => $("emojiPanel").hidden = true);
    $("emojiSearch").addEventListener("input", event => fillEmojiGrid(event.target.value.trim()));
    document.querySelectorAll("[data-emoji-tab]").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-emoji-tab]").forEach(tab => tab.classList.toggle("active", tab === button));
        const gif = button.dataset.emojiTab === "gif";
        $("gifPanel").hidden = !gif;
        $("emojiGrid").hidden = gif;
        $("emojiSearch").hidden = gif;
      });
    });
    $("gifSearchButton").addEventListener("click", () => {
      toast("GIF search needs a configured GIF provider API.");
    });

    $("micButton").addEventListener("click", startVoiceRecording);
    $("retryButton").addEventListener("click", () => loadMessages());

    $("closeActionSheet").addEventListener("click", () => $("actionSheet").hidden = true);
    $("actionSheet").addEventListener("click", event => {
      if (event.target === $("actionSheet")) $("actionSheet").hidden = true;
    });

    $("messageActions").addEventListener("click", async event => {
      const reaction = event.target.closest("[data-reaction]");
      if (reaction) {
        await reactToMessage(reaction.dataset.reaction);
        return;
      }
      const button = event.target.closest("[data-message-action]");
      if (!button || !state.selected) return;
      const action = button.dataset.messageAction;
      const message = state.selected;

      if (action === "reply") setReply(message);
      else if (action === "copy") await copyMessage();
      else if (action === "delete") {
        showSheet("Delete message", content => {
          if (isMine(message)) {
            option(content, "Delete for everyone", null, () => deleteMessage("everyone"), true);
          }
          option(content, "Delete for me", null, () => deleteMessage("me"), true);
          option(content, "Cancel", null, () => {
            $("actionSheet").hidden = true;
            hideMessageActions();
          });
        });
      } else if (action === "info") {
        showSheet("Message info", content => {
          option(content, "Sent", messageTime(message.created_at) || "Time unavailable", () => {});
          option(content, "Read status", message.is_read ? "Read" : "Not marked as read", () => {});
          option(content, "Message ID", String(message.id), async () => {
            try { await navigator.clipboard.writeText(String(message.id)); toast("Message ID copied."); } catch (_) {}
          });
        });
        hideMessageActions();
      } else if (action === "pin") {
        toast("Pinning requires a backend endpoint.", true);
        hideMessageActions();
      } else if (action === "share") {
        const text = message.content || message.media_url || "";
        if (navigator.share) {
          navigator.share({ text }).catch(() => {});
        } else {
          navigator.clipboard?.writeText(text).then(() => toast("Message copied to share."))
            .catch(() => toast("Sharing is unavailable.", true));
        }
        hideMessageActions();
      }
    });

    $("cancelReply").addEventListener("click", clearReply);

    document.addEventListener("click", event => {
      if (!event.target.closest("#chatMenu") && !event.target.closest("#chatMenuButton")) {
        $("chatMenu").hidden = true;
      }
      if (!event.target.closest("#attachMenu") && !event.target.closest("#attachButton")) {
        $("attachMenu").hidden = true;
      }
      if (!event.target.closest("#messageActions") && !event.target.closest(".message-bubble")) {
        hideMessageActions();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        loadMessages({ keepPosition: true });
        markRead();
      }
    });

    window.addEventListener("beforeunload", () => {
      if (state.poll) clearInterval(state.poll);
    });
  }

  async function init() {
    setupEvents();
    fillEmojiGrid();
    if (!partnerId) {
      setConnectionError("No chat partner selected. Open a conversation from your connections.");
      setStatus("User not selected");
      return;
    }

    await loadMessages();
    await markRead();

    // The current backend does not expose WebSocket events for normal chat,
    // so periodically refresh the conversation.
    state.poll = setInterval(async () => {
      if (document.visibilityState === "visible") {
        await loadMessages({ keepPosition: true });
        await markRead();
      }
    }, 5000);
  }

  init();
})();
