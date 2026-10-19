
/* =========================================================
   UTANEXA — NORMAL CHAT
   DP VIEWER + USER NAME + ZOOM + IMAGE ERROR HANDLING
   Couple Chat is not modified.
   ========================================================= */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    currentUser: null,
    partner: null,
    messages: [],
    loading: false,
    zoomed: false
  };

  const IMAGE_FIELDS = [
    "profile_photo_url",
    "profile_image_url",
    "avatar_url",
    "photo_url",
    "profile_picture",
    "profile_pic",
    "profile_image",
    "avatar",
    "photo",
    "image_url",
    "image",
    "dp",
    "picture"
  ];

  function getToken() {
    return localStorage.getItem("access_token")
      || localStorage.getItem("token")
      || sessionStorage.getItem("access_token")
      || sessionStorage.getItem("token")
      || "";
  }

  function getUserId(user) {
    if (!user) return "";
    return String(
      user.user_id ??
      user.id ??
      user.username ??
      user.uid ??
      ""
    );
  }

  function getUserName(user) {
    if (!user) return "UtaNexa User";
    return user.name
      || user.full_name
      || user.username
      || user.user_name
      || user.display_name
      || "UtaNexa User";
  }

  function getPhoto(user) {
    if (!user) return "";
    for (const key of IMAGE_FIELDS) {
      const value = user[key];
      if (typeof value === "string" && value.trim()) {
        const cleaned = value.trim();
        if (cleaned !== "null" && cleaned !== "undefined") {
          return cleaned;
        }
      }
    }
    return "";
  }

  function normaliseURL(url) {
    if (!url) return "";
    const value = String(url).trim();
    if (!value || value === "null" || value === "undefined") return "";

    // Keep absolute URLs and data URLs unchanged.
    if (/^(https?:|data:|blob:)/i.test(value)) return value;

    // Relative URLs such as /static/uploads/user.jpg.
    return value.startsWith("/") ? value : `/${value}`;
  }

  async function api(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(`${response.status} ${message || response.statusText}`);
    }

    const type = response.headers.get("content-type") || "";
    return type.includes("application/json")
      ? response.json()
      : response.text();
  }

  function setAvatar(img, user) {
    if (!img) return;

    const url = normaliseURL(getPhoto(user));
    img.onerror = () => {
      img.onerror = null;
      img.removeAttribute("src");
      img.alt = "Profile photo unavailable";
      img.classList.add("avatar-unavailable");
    };

    img.classList.remove("avatar-unavailable");

    if (url) {
      img.src = url;
      img.alt = getUserName(user);
    } else {
      img.removeAttribute("src");
      img.alt = "No profile photo";
      img.classList.add("avatar-unavailable");
    }
  }

  function updateHeader(user) {
    const name = $("selectedName");
    const status = $("selectedStatus");
    const avatar = $("selectedAvatar");

    if (name) name.textContent = getUserName(user);
    if (status) {
      status.textContent = user?.is_online || user?.online
        ? "Online"
        : "UtaNexa";
    }

    setAvatar(avatar, user);
  }

  function getViewer() {
    return $("imageViewer") || document.querySelector(".image-viewer");
  }

  function openImage(url, owner = state.partner) {
    const viewer = getViewer();
    const img = $("viewerImage");
    const nameEl = $("dpProfileName");

    if (!viewer || !img) {
      console.error("DP viewer elements missing. Check chat.html IDs.");
      return;
    }

    const ownerName = getUserName(owner);
    if (nameEl) nameEl.textContent = ownerName;

    const candidates = [
      url,
      ...IMAGE_FIELDS.map(key => owner?.[key])
    ]
      .filter(value => typeof value === "string" && value.trim())
      .map(normaliseURL)
      .filter(Boolean);

    const uniqueURLs = [...new Set(candidates)];
    let index = 0;

    state.zoomed = false;
    img.classList.remove("zoomed");
    img.alt = ownerName;

    viewer.style.display = "flex";
    viewer.classList.add("active");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("viewer-open");

    img.onerror = () => {
      index += 1;

      if (index < uniqueURLs.length) {
        img.src = uniqueURLs[index];
      } else {
        img.onerror = null;
        img.removeAttribute("src");
        img.alt = `${ownerName} — photo unavailable`;
        console.error("Could not load profile photo:", uniqueURLs);
      }
    };

    if (uniqueURLs.length) {
      img.src = uniqueURLs[0];
    } else {
      img.removeAttribute("src");
      img.alt = `${ownerName} has no profile photo`;
      console.warn("No profile-photo URL found for:", owner);
    }
  }

  function closeImage() {
    const viewer = getViewer();
    const img = $("viewerImage");

    if (viewer) {
      viewer.classList.remove("active");
      viewer.style.display = "none";
      viewer.setAttribute("aria-hidden", "true");
    }

    if (img) img.classList.remove("zoomed");

    state.zoomed = false;
    document.body.classList.remove("viewer-open");
  }

  function toggleZoom() {
    const img = $("viewerImage");
    if (!img || !img.getAttribute("src")) return;

    state.zoomed = !state.zoomed;
    img.classList.toggle("zoomed", state.zoomed);
  }

  function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);
  }

  function renderMessages(items) {
    const box = $("messagesContainer")
      || $("chatMessages")
      || $("messages");

    if (!box || !Array.isArray(items)) return;

    box.replaceChildren();

    for (const message of items) {
      const row = document.createElement("div");
      row.className = "message";

      const content = message.content
        ?? message.message
        ?? message.text
        ?? "";

      const mediaURL = message.media_url
        ?? message.mediaUrl
        ?? "";

      if (mediaURL && /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(mediaURL)) {
        const image = document.createElement("img");
        image.src = normaliseURL(mediaURL);
        image.alt = "Chat image";
        image.loading = "lazy";
        image.className = "message-image";
        image.onerror = () => image.remove();

        image.addEventListener("click", () => {
          const ownId = getUserId(state.currentUser);
          const senderId = String(message.sender_id ?? message.senderId ?? "");
          const owner = senderId && senderId === ownId
            ? state.currentUser
            : state.partner;

          openImage(image.src, owner);
        });

        row.appendChild(image);
      }

      if (content) {
        const text = document.createElement("div");
        text.className = "message-text";
        text.textContent = content;
        row.appendChild(text);
      }

      box.appendChild(row);
    }

    box.scrollTop = box.scrollHeight;
  }

  async function loadCurrentUser() {
    try {
      const data = await api("/api/auth/me");
      state.currentUser = data.user || data.current_user || data;
    } catch (error) {
      console.warn("Could not load current user:", error.message);
    }
  }

  async function loadPartner() {
    const params = new URLSearchParams(location.search);
    const partnerId =
      params.get("user_id") ||
      params.get("partner_id") ||
      params.get("id");

    if (!partnerId) {
      console.warn("Chat URL does not contain a partner ID.");
      return;
    }

    try {
      const data = await api(`/api/profile/${encodeURIComponent(partnerId)}`);
      state.partner = data.user || data.profile || data;
    } catch (error) {
      console.warn("Could not load partner profile:", error.message);
      state.partner = { user_id: partnerId, name: "UtaNexa User" };
    }

    updateHeader(state.partner);
  }

  async function loadMessages() {
    if (state.loading) return;
    state.loading = true;

    try {
      const partnerId = getUserId(state.partner);
      if (!partnerId) return;

      const data = await api(`/api/chat/${encodeURIComponent(partnerId)}`);
      const items = Array.isArray(data)
        ? data
        : data.messages || data.items || [];

      state.messages = items;
      renderMessages(items);
    } catch (error) {
      console.warn("Messages could not be loaded:", error.message);
    } finally {
      state.loading = false;
    }
  }

  function bindEvents() {
    $("selectedAvatarButton")?.addEventListener("click", () => {
      openImage(getPhoto(state.partner), state.partner);
    });

    $("viewerImage")?.addEventListener("click", toggleZoom);

    $("closeImageViewer")?.addEventListener("click", closeImage);

    getViewer()?.addEventListener("click", event => {
      if (event.target === getViewer()) closeImage();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeImage();
    });
  }

  async function init() {
    bindEvents();
    await loadCurrentUser();
    await loadPartner();
    await loadMessages();

    // Refresh normal-chat messages only.
    window.setInterval(loadMessages, 5000);
  }

  // Optional global functions for existing HTML onclick attributes.
  window.openImage = openImage;
  window.closeImage = closeImage;
  window.toggleDPZoom = toggleZoom;
  window.UtaNexaNormalChat = {
    openImage,
    closeImage,
    toggleZoom,
    reloadMessages: loadMessages
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
