// resQpaws AI Chat Assistant Widget
// Programmatically injects a floating AI chat assistant onto every page and handles local rule-based smart queries.

const GPaichat = {
  chatContainer: null,
  chatBubble: null,
  messagesList: null,

  init: function() {
    this.injectStyles();
    this.injectHTML();
    this.bindEvents();
    this.addWelcomeMessage();
  },

  // 1. Inject Chat Widget Styles programmatically
  injectStyles: function() {
    const style = document.createElement("style");
    style.id = "gp-ai-chat-styles";
    style.innerHTML = `
      /* Chat Floating Bubble */
      .ai-chat-bubble {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(22, 163, 74, 0.4);
        z-index: 9999;
        transition: transform 0.3s ease, background-color 0.3s ease;
        animation: chat-bounce 3s infinite;
      }
      .ai-chat-bubble:hover {
        transform: scale(1.1) rotate(5deg);
        background-color: var(--primary-hover);
      }
      
      @keyframes chat-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      /* Chat Window Panel */
      .ai-chat-window {
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 380px;
        height: 500px;
        border-radius: 16px;
        background: var(--bg-card);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--border-glass);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      @media (max-width: 480px) {
        .ai-chat-window {
          width: calc(100% - 40px);
          height: 80vh;
          bottom: 90px;
          right: 20px;
        }
      }

      /* Chat Header */
      .ai-chat-header {
        background-color: var(--secondary);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
      }
      .ai-chat-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--font-title);
        font-weight: 700;
        font-size: 1.1rem;
      }

      /* Chat Messages List */
      .ai-chat-messages {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      /* Message bubbles styles */
      .ai-msg {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      .ai-msg-assistant {
        background-color: rgba(22, 163, 74, 0.08);
        border: 1px solid rgba(22, 163, 74, 0.15);
        color: var(--text-main);
        align-self: flex-start;
        border-top-left-radius: 2px;
      }
      .ai-msg-user {
        background-color: var(--primary);
        color: white;
        align-self: flex-end;
        border-top-right-radius: 2px;
      }

      /* Chat Input Form */
      .ai-chat-footer {
        padding: 12px 16px;
        border-top: 1px solid var(--border-glass);
        background-color: rgba(var(--secondary-rgb), 0.02);
      }
      .ai-chat-form {
        display: flex;
        gap: 8px;
      }
      .ai-chat-input {
        flex-grow: 1;
        padding: 10px 14px;
        border-radius: 20px;
        border: 1px solid var(--input-border);
        background-color: var(--input-bg);
        color: var(--text-main);
        outline: none;
        font-family: var(--font-body);
        font-size: 0.9rem;
      }
      .ai-chat-input:focus {
        border-color: var(--primary);
      }
    `;
    document.head.appendChild(style);
  },

  // 2. Inject HTML nodes programmatically
  injectHTML: function() {
    // Bubble
    const bubble = document.createElement("div");
    bubble.className = "ai-chat-bubble";
    bubble.id = "gp-chat-bubble";
    bubble.innerHTML = "🤖";
    document.body.appendChild(bubble);
    this.chatBubble = bubble;

    // Window
    const windowDiv = document.createElement("div");
    windowDiv.className = "ai-chat-window";
    windowDiv.id = "gp-chat-window";
    windowDiv.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-title">
          <span style="font-size:1.3rem;">🐾</span>
          <span>resQpaws AI Assistant</span>
        </div>
        <button id="gp-chat-close-btn" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">×</button>
      </div>
      
      <div class="ai-chat-messages" id="gp-chat-messages-list">
        <!-- Messages loaded here -->
      </div>
      
      <div class="ai-chat-footer">
        <form class="ai-chat-form" id="gp-chat-submit-form">
          <input type="text" id="gp-chat-input-field" class="ai-chat-input" placeholder="Ask first-aid or platform tips..." required autocomplete="off">
          <button type="submit" class="btn btn-primary btn-sm" style="padding: 10px 16px; border-radius: 20px;">Send</button>
        </form>
      </div>
    `;
    document.body.appendChild(windowDiv);
    this.chatContainer = windowDiv;
    this.messagesList = document.getElementById("gp-chat-messages-list");
  },

  // 3. Bind Actions
  bindEvents: function() {
    this.chatBubble.addEventListener("click", () => {
      this.toggleWindow();
    });

    const closeBtn = document.getElementById("gp-chat-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.chatContainer.style.display = "none";
      });
    }

    const form = document.getElementById("gp-chat-submit-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleUserSubmit();
      });
    }
  },

  toggleWindow: function() {
    const isVisible = this.chatContainer.style.display === "flex";
    this.chatContainer.style.display = isVisible ? "none" : "flex";
    if (!isVisible) {
      this.scrollToBottom();
      document.getElementById("gp-chat-input-field").focus();
    }
  },

  addWelcomeMessage: function() {
    this.addMessage("Hi! I am resQpaws AI, your first-aid and coordination helper. How can I help you or local animals today?", "assistant");
  },

  addMessage: function(text, sender) {
    const msg = document.createElement("div");
    msg.className = `ai-msg ai-msg-${sender}`;
    msg.innerHTML = text;
    this.messagesList.appendChild(msg);
    this.scrollToBottom();
  },

  scrollToBottom: function() {
    if (this.messagesList) {
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  },

  // Initialize conversation history array
  history: [],

  handleUserSubmit: async function() {
    const input = document.getElementById("gp-chat-input-field");
    const userText = input.value.trim();
    if (!userText) return;

    // Add user message to UI and history
    this.addMessage(userText, "user");
    this.history.push({ role: "user", text: userText });
    input.value = "";

    // Show AI writing bubble
    const writingMsg = document.createElement("div");
    writingMsg.className = "ai-msg ai-msg-assistant";
    writingMsg.innerHTML = "<em>Typing...</em>";
    this.messagesList.appendChild(writingMsg);
    this.scrollToBottom();

    // Early offline check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      writingMsg.remove();
      this.addMessage(`⚠️ <strong>Offline Mode:</strong> You appear to be offline. Please verify your network connection.`, "assistant");
      return;
    }

    const maxRetries = 3;
    let attempt = 0;
    let response = null;
    let resolvedUrl = "";

    while (attempt < maxRetries) {
      attempt++;
      try {
        if (attempt > 1) {
          writingMsg.innerHTML = `<em>Connection failed. Retrying (Attempt ${attempt}/${maxRetries})...</em>`;
        } else {
          writingMsg.innerHTML = "<em>Connecting to AI server...</em>";
        }

        // 1. Resolve endpoint with auto-recovery/health check
        resolvedUrl = await window.GPApiConfig.resolveEndpoint("chat");

        // 2. Setup 15-second AbortController timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        // 3. Make fetch request
        response = await fetch(resolvedUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: userText,
            history: this.history.slice(0, -1)
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // If fetch succeeds, break the retry loop
        break;

      } catch (err) {
        const errorCategory = err.name === "AbortError" ? "Timeout" : "NetworkError";
        window.GPApiConfig.logError(resolvedUrl || "/api/chat", errorCategory, err, attempt);

        if (attempt >= maxRetries) {
          writingMsg.remove();
          this.addMessage(`⚠️ <strong>Connection Error:</strong> Could not reach the AI server.<br><br>Please verify:<br>1. The backend server is running.<br>2. You are connected to the internet.<br>3. If running locally, access the site via <a href="http://127.0.0.1:8000" style="font-weight:bold;text-decoration:underline;">http://127.0.0.1:8000</a> to avoid CORS issues.`, "assistant");
          return;
        }

        // Wait before next retry (1.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    writingMsg.remove();

    if (!response) {
      this.addMessage(`⚠️ <strong>Network Error:</strong> Received an empty response from the server.`, "assistant");
      return;
    }

    // 1. Read response as text to detect HTML page redirects and avoid JSON parse crashes
    let rawText = "";
    try {
      rawText = await response.text();
    } catch (textReadErr) {
      this.addMessage(`⚠️ <strong>Connection Error:</strong> Failed to read response from server.`, "assistant");
      window.GPApiConfig.logError(resolvedUrl, "PayloadReadError", textReadErr, attempt);
      return;
    }

    // 2. Detect HTML redirect pages (e.g. Netlify/Render 404 fallback page)
    const isHtml = /<!DOCTYPE html>|<html|<\/html>/i.test(rawText);
    if (isHtml) {
      this.addMessage(`⚠️ <strong>Parsing Error:</strong> The server returned an HTML page instead of JSON. This typically indicates a 404 Not Found or a routing configuration error on the hosting provider.`, "assistant");
      window.GPApiConfig.logError(resolvedUrl, "HtmlResponseError", new Error("HTML response received instead of JSON"), attempt);
      return;
    }

    // 3. Safe JSON parsing
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (jsonParseErr) {
      this.addMessage(`⚠️ <strong>Parsing Error:</strong> Received invalid response format from the server.`, "assistant");
      window.GPApiConfig.logError(resolvedUrl, "ParseError", jsonParseErr, attempt);
      return;
    }

    // 4. Validate HTTP status code and response success property
    if (!response.ok || (data && data.success === false)) {
      const errMsg = (data && data.error) || `Server returned error status (${response.status})`;
      
      if (response.status === 405) {
        this.addMessage(`⚠️ <strong>CORS / Method Error:</strong> The server returned Method Not Allowed (405). If running locally, make sure you start <code>server.py</code> instead of a generic static server.`, "assistant");
      } else if (errMsg.includes("API key")) {
        this.addMessage(`⚠️ <strong>Configuration Error:</strong> Gemini API key is missing on the server. Please check your environment variables or <code>.env</code> file.`, "assistant");
      } else if (errMsg.includes("Gemini API Error")) {
        this.addMessage(`⚠️ <strong>Gemini API Error:</strong> ${errMsg.replace("Gemini API Error:", "").trim()}`, "assistant");
      } else {
        this.addMessage(`⚠️ <strong>Error:</strong> ${errMsg}`, "assistant");
      }
      
      window.GPApiConfig.logError(resolvedUrl, `HTTP_${response.status}`, new Error(errMsg), attempt);
      return;
    }

    // 5. Success Path: Extract response text (supporting both data.response and data.reply for backward compatibility)
    const reply = data.response || data.reply;
    if (!reply) {
      this.addMessage(`⚠️ <strong>Parsing Error:</strong> Chat response text was empty or missing from the server payload.`, "assistant");
      window.GPApiConfig.logError(resolvedUrl, "EmptyResponseError", new Error("No response field found"), attempt);
      return;
    }

    // Update cached active endpoint since the request succeeded
    window.GPApiConfig.updateCachedEndpoint(resolvedUrl);

    // Add reply to UI and history
    this.addMessage(reply, "assistant");
    this.history.push({ role: "assistant", text: reply });
  }
};


// Start Chat on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GPaichat.init());
} else {
  GPaichat.init();
}
window.GPaichat = GPaichat;

