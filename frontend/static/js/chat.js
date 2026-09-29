/* =========================================================
   USANEX — CHAT.JS
   Fast WhatsApp-style chat
   Text + HD Image Upload
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const API_BASE = "/api/chat";

    const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

    /*
       HD image settings

       Original gallery image:
       - stays high quality
       - resized only when extremely large
       - JPEG quality 0.88
    */

    const MAX_IMAGE_WIDTH = 2560;
    const MAX_IMAGE_HEIGHT = 2560;
    const JPEG_QUALITY = 0.88;


    /* =====================================================
       DOM HELPERS
    ===================================================== */

    function $(selector) {
        return document.querySelector(selector);
    }

    function $all(selector) {
        return document.querySelectorAll(selector);
    }


    /* =====================================================
       FIND ELEMENTS
    ===================================================== */

    const messageInput =
        $("#messageInput") ||
        document.querySelector(
            'textarea[name="content"], input[name="content"]'
        );

    const messagesContainer =
        $("#messages") ||
        $(".messages");

    const sendButton =
        $(".send-button") ||
        $("#sendButton");

    const fileInput =
        $("#fileInput") ||
        $("#attachmentInput") ||
        $("#imageInput") ||
        document.querySelector(
            'input[type="file"]'
        );

    const attachmentButton =
        $("#attachmentButton") ||
        $(".attachment-button") ||
        document.querySelector(
            '[data-action="attachment"]'
        );

    const chatForm =
        $("#chatForm") ||
        $(".chat-form") ||
        document.querySelector(
            "form"
        );


    /* =====================================================
       GET CHAT USER ID
    ===================================================== */

    function getChatUserId() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        let userId =
            params.get("user_id") ||
            params.get("userid") ||
            params.get("id") ||
            params.get("user");

        if (userId) {
            return userId;
        }

        /*
         * Fallback:
         * /chat/u_xxxxx
         */

        const path =
            window.location.pathname
                .split("/")
                .filter(Boolean);

        if (path.length > 0) {

            const last =
                path[path.length - 1];

            if (
                last !== "chat" &&
                last !== "chat.html"
            ) {
                return decodeURIComponent(
                    last
                );
            }
        }

        /*
         * localStorage fallback
         */

        const saved =
            localStorage.getItem(
                "chatUserId"
            ) ||
            localStorage.getItem(
                "selectedUserId"
            ) ||
            localStorage.getItem(
                "usanexChatUserId"
            );

        return saved;
    }


    const chatUserId =
        getChatUserId();


    /* =====================================================
       STATE
    ===================================================== */

    let selectedFile = null;

    let sending = false;

    let loadingMessages = false;

    let destroyed = false;


    /* =====================================================
       DEBUG
    ===================================================== */

    function log(...args) {

        console.log(
            "[Usanex Chat]",
            ...args
        );
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =====================================================
       FORMAT TIME
    ===================================================== */

    function formatTime(value) {

        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        return date.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit",
            }
        );
    }


    /* =====================================================
       SCROLL TO BOTTOM
    ===================================================== */

    function scrollToBottom(
        smooth = true
    ) {

        if (!messagesContainer) {
            return;
        }

        messagesContainer.scrollTo({
            top:
                messagesContainer.scrollHeight,
            behavior:
                smooth
                    ? "smooth"
                    : "auto",
        });
    }


    /* =====================================================
       SHOW STATUS
    ===================================================== */

    function showStatus(
        message,
        type = "normal"
    ) {

        log(
            `${type}:`,
            message
        );

        /*
         * Browser alert is intentionally avoided
         * for normal messages.
         */

        if (
            type === "error"
        ) {

            let existing =
                document.querySelector(
                    ".chat-error-message"
                );

            if (!existing) {

                existing =
                    document.createElement(
                        "div"
                    );

                existing.className =
                    "chat-error-message";

                existing.style.cssText = `
                    position: fixed;
                    left: 50%;
                    bottom: 90px;
                    transform: translateX(-50%);
                    z-index: 9999;
                    max-width: 90%;
                    padding: 10px 15px;
                    border-radius: 12px;
                    background: #b91c1c;
                    color: white;
                    font-size: 13px;
                    text-align: center;
                    box-shadow: 0 5px 20px rgba(0,0,0,.3);
                `;

                document.body.appendChild(
                    existing
                );
            }

            existing.textContent =
                message;

            clearTimeout(
                existing._timer
            );

            existing._timer =
                setTimeout(() => {

                    existing.remove();

                }, 3000);
        }
    }


    /* =====================================================
       IMAGE COMPRESSION
    ===================================================== */

    async function prepareImage(
        file
    ) {

        /*
         * Non-image should never reach here.
         */

        if (
            !file ||
            !file.type.startsWith(
                "image/"
            )
        ) {

            throw new Error(
                "Please select a valid image."
            );
        }


        /*
         * Small images:
         * keep original file.
         */

        if (
            file.size <=
            MAX_UPLOAD_SIZE
        ) {

            return file;
        }


        /*
         * Large image:
         * load into canvas.
         */

        const objectURL =
            URL.createObjectURL(
                file
            );

        try {

            const image =
                await new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        const img =
                            new Image();

                        img.onload =
                            () => resolve(
                                img
                            );

                        img.onerror =
                            () => reject(
                                new Error(
                                    "Image could not be loaded."
                                )
                            );

                        img.src =
                            objectURL;
                    }
                );


            let width =
                image.naturalWidth;

            let height =
                image.naturalHeight;


            /*
             * Resize only if necessary.
             */

            const scale =
                Math.min(
                    1,
                    MAX_IMAGE_WIDTH /
                        width,
                    MAX_IMAGE_HEIGHT /
                        height
                );

            width =
                Math.round(
                    width * scale
                );

            height =
                Math.round(
                    height * scale
                );


            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                width;

            canvas.height =
                height;


            const ctx =
                canvas.getContext(
                    "2d"
                );

            if (!ctx) {

                throw new Error(
                    "Image processing is not supported."
                );
            }


            /*
             * High quality rendering.
             */

            ctx.imageSmoothingEnabled =
                true;

            ctx.imageSmoothingQuality =
                "high";


            ctx.drawImage(
                image,
                0,
                0,
                width,
                height
            );


            /*
             * Convert to JPEG.
             */

            const blob =
                await new Promise(
                    resolve => {

                        canvas.toBlob(
                            resolve,
                            "image/jpeg",
                            JPEG_QUALITY
                        );
                    }
                );


            if (!blob) {

                throw new Error(
                    "Image compression failed."
                );
            }


            /*
             * If still too large,
             * compress a little more.
             */

            let finalBlob =
                blob;


            if (
                finalBlob.size >
                MAX_UPLOAD_SIZE
            ) {

                finalBlob =
                    await new Promise(
                        resolve => {

                            canvas.toBlob(
                                resolve,
                                "image/jpeg",
                                0.78
                            );
                        }
                    );
            }


            const finalName =
                (
                    file.name
                        ?.replace(
                            /\.[^/.]+$/,
                            ""
                        ) ||
                    "usanex-photo"
                ) +
                ".jpg";


            return new File(
                [finalBlob],
                finalName,
                {
                    type:
                        "image/jpeg",
                    lastModified:
                        Date.now(),
                }
            );

        } finally {

            URL.revokeObjectURL(
                objectURL
            );
        }
    }


    /* =====================================================
       SELECT IMAGE
    ===================================================== */

    function handleFileSelected(
        event
    ) {

        const files =
            event.target.files;

        if (
            !files ||
            !files.length
        ) {
            selectedFile = null;
            return;
        }


        const file =
            files[0];


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showStatus(
                "Sirf image select karein.",
                "error"
            );

            event.target.value = "";

            selectedFile = null;

            return;
        }


        /*
         * We don't reject large images.
         * They will be compressed automatically.
         */

        selectedFile = file;

        log(
            "Photo selected:",
            file.name,
            file.size,
            file.type
        );


        /*
         * Show selected filename
         * if preview element exists.
         */

        const fileNameElement =
            $("#selectedFileName") ||
            $(".selected-file-name");

        if (
            fileNameElement
        ) {

            fileNameElement.textContent =
                file.name;
        }


        /*
         * Optional image preview.
         */

        showSelectedPreview(
            file
        );
    }


    /* =====================================================
       IMAGE PREVIEW
    ===================================================== */

    function showSelectedPreview(
        file
    ) {

        const preview =
            $("#imagePreview") ||
            $(".image-preview");

        if (!preview) {
            return;
        }


        const url =
            URL.createObjectURL(
                file
            );


        if (
            preview.tagName ===
            "IMG"
        ) {

            preview.src =
                url;

            preview.style.display =
                "block";

        } else {

            preview.innerHTML = `
                <img
                    src="${url}"
                    alt="Selected image"
                    style="
                        max-width:120px;
                        max-height:120px;
                        object-fit:cover;
                        border-radius:12px;
                    "
                >
            `;

            preview.style.display =
                "block";
        }


        setTimeout(
            () => {
                URL.revokeObjectURL(
                    url
                );
            },
            10000
        );
    }


    /* =====================================================
       CLEAR FILE
    ===================================================== */

    function clearSelectedFile() {

        selectedFile = null;

        if (fileInput) {
            fileInput.value = "";
        }


        const preview =
            $("#imagePreview") ||
            $(".image-preview");

        if (preview) {

            preview.innerHTML = "";

            preview.style.display =
                "none";
        }


        const fileNameElement =
            $("#selectedFileName") ||
            $(".selected-file-name");

        if (
            fileNameElement
        ) {

            fileNameElement.textContent =
                "";
        }
    }


    /* =====================================================
       OPEN GALLERY
    ===================================================== */

    function openGallery() {

        if (!fileInput) {

            showStatus(
                "Gallery input nahi mila. Chat HTML me file input check karein.",
                "error"
            );

            return;
        }

        fileInput.click();
    }


    /* =====================================================
       CREATE MESSAGE ELEMENT
    ===================================================== */

    function createMessageElement(
        message,
        currentUserId
    ) {

        const senderId =
            Number(
                message.sender_id
            );

        const isMine =
            senderId ===
            Number(
                currentUserId
            );


        const row =
            document.createElement(
                "div"
            );

        row.className =
            "message-row " +
            (
                isMine
                    ? "mine"
                    : "received"
            );


        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "message-bubble";


        /*
         * IMAGE
         */

        if (
            message.media_url
        ) {

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                message.media_url;

            image.alt =
                "Photo";

            image.loading =
                "lazy";

            image.decoding =
                "async";

            image.style.cssText = `
                display:block;
                max-width:100%;
                width:auto;
                height:auto;
                max-height:420px;
                object-fit:contain;
                border-radius:10px;
                cursor:pointer;
            `;


            image.addEventListener(
                "click",
                () => {

                    window.open(
                        message.media_url,
                        "_blank"
                    );
                }
            );


            bubble.appendChild(
                image
            );
        }


        /*
         * TEXT
         */

        const text =
            message.content ||
            message.message;


        if (text) {

            const textElement =
                document.createElement(
                    "div"
                );

            textElement.className =
                "message-text";

            textElement.textContent =
                text;

            bubble.appendChild(
                textElement
            );
        }


        /*
         * META
         */

        const meta =
            document.createElement(
                "div"
            );

        meta.className =
            "message-meta";


        const time =
            document.createElement(
                "span"
            );

        time.textContent =
            formatTime(
                message.created_at
            );


        meta.appendChild(
            time
        );


        if (isMine) {

            const ticks =
                document.createElement(
                    "span"
                );

            ticks.className =
                "message-ticks";

            ticks.textContent =
                message.is_read
                    ? "✓✓"
                    : "✓";

            meta.appendChild(
                ticks
            );
        }


        bubble.appendChild(
            meta
        );


        row.appendChild(
            bubble
        );


        return row;
    }


    /* =====================================================
       RENDER MESSAGES
    ===================================================== */

    function renderMessages(
        data
    ) {

        if (!messagesContainer) {
            return;
        }


        const messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        const currentUser =
            data.current_user ||
            data.currentUser ||
            null;


        const currentUserId =
            currentUser?.id;


        messagesContainer.innerHTML =
            "";


        if (
            messages.length === 0
        ) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "empty-chat";

            empty.innerHTML = `
                <div class="empty-chat-icon">
                    💬
                </div>

                <strong>
                    Start a conversation
                </strong>

                <span>
                    Send a message or photo
                    to start chatting.
                </span>
            `;

            messagesContainer.appendChild(
                empty
            );

            return;
        }


        for (
            const message
            of messages
        ) {

            messagesContainer.appendChild(
                createMessageElement(
                    message,
                    currentUserId
                )
            );
        }


        requestAnimationFrame(
            () => {
                scrollToBottom(
                    false
                );
            }
        );
    }


    /* =====================================================
       LOAD CHAT
    ===================================================== */

    async function loadChat() {

        if (
            loadingMessages ||
            !chatUserId
        ) {
            return;
        }


        loadingMessages = true;


        try {

            const response =
                await fetch(
                    `${API_BASE}/${encodeURIComponent(
                        chatUserId
                    )}`,
                    {
                        method:
                            "GET",

                        credentials:
                            "include",

                        cache:
                            "no-store",
                    }
                );


            if (
                response.status ===
                401
            ) {

                /*
                 * IMPORTANT:
                 * Don't immediately redirect from
                 * every random API failure.
                 *
                 * Only redirect when session is
                 * actually invalid.
                 */

                window.location.href =
                    "/static/login.html";

                return;
            }


            const data =
                await response.json()
                    .catch(
                        () => ({})
                    );


            if (
                !response.ok
            ) {

                throw new Error(
                    data.detail ||
                    "Chat load failed."
                );
            }


            renderMessages(
                data
            );

        } catch (error) {

            console.error(
                "[Usanex Chat] Load error:",
                error
            );

            showStatus(
                error.message ||
                "Chat load nahi ho paaya.",
                "error"
            );

        } finally {

            loadingMessages =
                false;
        }
    }


    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    async function sendMessage() {

        if (sending) {
            return;
        }


        const text =
            messageInput
                ? messageInput.value.trim()
                : "";


        /*
         * Nothing to send
         */

        if (
            !text &&
            !selectedFile
        ) {
            return;
        }


        if (!chatUserId) {

            showStatus(
                "Chat user ID nahi mila.",
                "error"
            );

            return;
        }


        sending = true;


        if (sendButton) {

            sendButton.disabled =
                true;

            sendButton.style.opacity =
                "0.55";
        }


        try {

            let uploadFile =
                selectedFile;


            /*
             * Prepare HD image
             */

            if (
                uploadFile
            ) {

                log(
                    "Original image:",
                    uploadFile.size
                );


                uploadFile =
                    await prepareImage(
                        uploadFile
                    );


                log(
                    "Final image:",
                    uploadFile.size
                );


                if (
                    uploadFile.size >
                    MAX_UPLOAD_SIZE
                ) {

                    throw new Error(
                        "Photo 10 MB se kam nahi ho pa rahi. Dusri photo try karein."
                    );
                }
            }


            /*
             * IMPORTANT
             *
             * FormData automatically sets
             * multipart/form-data boundary.
             *
             * DON'T manually set Content-Type.
             */

            const formData =
                new FormData();


            formData.append(
                "receiver_id",
                chatUserId
            );


            formData.append(
                "content",
                text
            );


            if (
                uploadFile
            ) {

                formData.append(
                    "file",
                    uploadFile,
                    uploadFile.name ||
                    "usanex-photo.jpg"
                );
            }


            log(
                "Sending message...",
                {
                    receiver_id:
                        chatUserId,

                    hasText:
                        Boolean(text),

                    hasFile:
                        Boolean(uploadFile),

                    fileSize:
                        uploadFile
                            ? uploadFile.size
                            : 0,
                }
            );


            const response =
                await fetch(
                    `${API_BASE}/send`,
                    {
                        method:
                            "POST",

                        credentials:
                            "include",

                        /*
                         * DO NOT ADD:
                         *
                         * headers: {
                         *   "Content-Type":
                         *     "multipart/form-data"
                         * }
                         */

                        body:
                            formData,
                    }
                );


            const data =
                await response.json()
                    .catch(
                        () => ({})
                    );


            log(
                "Send response:",
                response.status,
                data
            );


            if (
                response.status ===
                401
            ) {

                throw new Error(
                    "Login session expire ho gayi hai. Please login again."
                );
            }


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    "Message send nahi hua."
                );
            }


            /*
             * Clear input only after
             * successful server response.
             */

            if (messageInput) {
                messageInput.value = "";
            }


            clearSelectedFile();


            /*
             * Add returned message instantly
             */

            if (
                messagesContainer &&
                data.message
            ) {

                /*
                 * Remove empty screen
                 */

                const empty =
                    messagesContainer.querySelector(
                        ".empty-chat"
                    );

                if (empty) {
                    empty.remove();
                }


                /*
                 * We need current user ID.
                 * Get it from localStorage if available.
                 */

                let currentUserId = null;


                try {

                    const saved =
                        localStorage.getItem(
                            "currentUser"
                        ) ||
                        localStorage.getItem(
                            "usanexUser"
                        );


                    if (saved) {

                        const parsed =
                            JSON.parse(
                                saved
                            );

                        currentUserId =
                            parsed.id ||
                            parsed.user_id ||
                            parsed.userId;
                    }

                } catch {
                    currentUserId =
                        null;
                }


                /*
                 * If current ID is not available,
                 * reload chat to render correctly.
                 */

                if (
                    currentUserId ===
                    null
                ) {

                    await loadChat();

                } else {

                    messagesContainer.appendChild(
                        createMessageElement(
                            data.message,
                            currentUserId
                        )
                    );


                    requestAnimationFrame(
                        () => {
                            scrollToBottom(
                                true
                            );
                        }
                    );
                }
            }


            log(
                "Message sent successfully."
            );

        } catch (error) {

            console.error(
                "[Usanex Chat] Send error:",
                error
            );


            showStatus(
                error.message ||
                "Message send nahi hua.",
                "error"
            );

        } finally {

            sending = false;


            if (sendButton) {

                sendButton.disabled =
                    false;

                sendButton.style.opacity =
                    "";
            }
        }
    }


    /* =====================================================
       ENTER TO SEND
    ===================================================== */

    function handleInputKeydown(
        event
    ) {

        if (
            event.key ===
            "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    function handleFormSubmit(
        event
    ) {

        event.preventDefault();

        sendMessage();
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function init() {

        log(
            "Chat initialized.",
            {
                chatUserId,
                messageInput:
                    Boolean(
                        messageInput
                    ),
                messagesContainer:
                    Boolean(
                        messagesContainer
                    ),
                sendButton:
                    Boolean(
                        sendButton
                    ),
                fileInput:
                    Boolean(
                        fileInput
                    ),
            }
        );


        /*
         * Gallery
         */

        if (
            fileInput
        ) {

            fileInput.addEventListener(
                "change",
                handleFileSelected
            );
        }


        /*
         * Attachment button
         */

        if (
            attachmentButton
        ) {

            attachmentButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openGallery();
                }
            );
        }


        /*
         * Send button
         */

        if (
            sendButton
        ) {

            sendButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    sendMessage();
                }
            );
        }


        /*
         * Input Enter
         */

        if (
            messageInput
        ) {

            messageInput.addEventListener(
                "keydown",
                handleInputKeydown
            );
        }


        /*
         * Form
         */

        if (
            chatForm
        ) {

            chatForm.addEventListener(
                "submit",
                handleFormSubmit
            );
        }


        /*
         * Initial chat
         */

        if (
            chatUserId
        ) {

            loadChat();

        } else {

            showStatus(
                "Chat user ID nahi mila.",
                "error"
            );
        }
    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();
