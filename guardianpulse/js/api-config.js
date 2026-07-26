// resQpaws Centralized API Configuration & Self-Healing Gateway
// Handles dynamic endpoint resolution, caching, auto-recovery, and detailed logging.

const GPApiConfig = {
  endpoints: {
    chat: "/api/chat",
    reports: "/api/reports"
  },

  // Fallback production URL (your Render live URL or Cloudflare Worker)
  productionBaseUrl: "https://resqpaws-backend-8ub1.onrender.com",

  // Local development backend URL
  localBaseUrl: "http://127.0.0.1:8000",

  // Local Storage Cache Keys
  CACHE_KEY_ENDPOINT: "gp_active_api_endpoint",

  // Dynamic endpoint resolver
  resolveEndpoint: async function(endpointKey) {
    const relativePath = this.endpoints[endpointKey];
    if (!relativePath) {
      this.logError(endpointKey, "ConfigError", new Error(`Endpoint key "${endpointKey}" is not configured.`), 0);
      throw new Error(`Endpoint key "${endpointKey}" is not configured.`);
    }

    const isLocalhost = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1" ||
                        window.location.hostname === ""; // file:// protocol

    // 1. If running locally, attempt to discover the local Flask server on port 8000 first
    if (isLocalhost) {
      const localUrl = `${this.localBaseUrl}${relativePath}`;
      if (await this.checkHealth(localUrl)) {
        return localUrl;
      }
    }

    // 2. If local is down or we are running in production (Netlify), route directly to the production base URL (Render / Cloudflare Worker)
    const productionUrl = `${this.productionBaseUrl}${relativePath}`;
    return productionUrl;
  },

  // Fast loopback OPTIONS check (bypasses payload generation/costs)
  checkHealth: async function(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

      const response = await fetch(url, {
        method: "OPTIONS",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok || response.status === 200;
    } catch (e) {
      return false;
    }
  },

  // Centralized logging for failed network/API transactions
  logError: function(endpoint, errorType, error, retryCount = 0) {
    const timestamp = new Date().toISOString();
    console.group(`🔴 resQpaws API Connection Error [${timestamp}]`);
    console.error(`Endpoint:    ${endpoint}`);
    console.error(`Error Type:  ${errorType}`);
    console.error(`Message:     ${error.message}`);
    console.error(`Retry Count: ${retryCount}`);
    console.error(`Stack Trace:`, error);
    console.groupEnd();
  }
};

window.GPApiConfig = GPApiConfig;
