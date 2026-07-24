// resQpaws Centralized API Configuration & Self-Healing Gateway
// Handles dynamic endpoint resolution, caching, auto-recovery, and detailed logging.

const GPApiConfig = {
  endpoints: {
    chat: "/api/chat"
  },

  // Fallback production URL (uses CORS-enabled Cloudflare Worker)
  productionBaseUrl: "https://soft-sun-dafe.srikanthbonangi3030.workers.dev",


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

    // If running in production (on netlify or custom domain), always use relative paths
    const isLocalhost = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1" ||
                        window.location.hostname === ""; // file:// protocol

    if (!isLocalhost || window.location.port === "8000") {
      return relativePath;
    }

    // Try last successfully cached working endpoint first
    const cachedEndpoint = localStorage.getItem(this.CACHE_KEY_ENDPOINT);
    if (cachedEndpoint) {
      const cachedUrl = `${cachedEndpoint}${relativePath}`;
      console.log(`GPApiConfig: Attempting cached endpoint: ${cachedUrl}`);
      
      // Verify cached endpoint is still healthy
      if (await this.checkHealth(cachedUrl)) {
        return cachedUrl;
      }
      console.warn(`GPApiConfig: Cached endpoint ${cachedUrl} is offline. Running full discovery...`);
      localStorage.removeItem(this.CACHE_KEY_ENDPOINT);
    }

    // Run active discovery: Check local backend on port 8000
    const localUrl = `${this.localBaseUrl}${relativePath}`;
    if (await this.checkHealth(localUrl)) {
      console.log(`GPApiConfig: Local backend discovered at ${localUrl}`);
      localStorage.setItem(this.CACHE_KEY_ENDPOINT, this.localBaseUrl);
      return localUrl;
    }

    // Fall back to live production backend
    const productionUrl = `${this.productionBaseUrl}${relativePath}`;
    console.warn(`GPApiConfig: Local backend is offline. Using production fallback: ${productionUrl}`);
    localStorage.setItem(this.CACHE_KEY_ENDPOINT, this.productionBaseUrl);
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

  // Updates stored working URL when a request completes successfully
  updateCachedEndpoint: function(fullUrl) {
    let baseUrl = "";
    if (fullUrl.startsWith("http://") || fullUrl.startsWith("https://")) {
      // Extract origin (e.g. http://127.0.0.1:8000 or https://resqpaws.netlify.app)
      const urlObj = new URL(fullUrl);
      baseUrl = urlObj.origin;
    } else {
      baseUrl = ""; // Relative path
    }
    
    const currentCached = localStorage.getItem(this.CACHE_KEY_ENDPOINT);
    if (currentCached !== baseUrl) {
      if (baseUrl) {
        localStorage.setItem(this.CACHE_KEY_ENDPOINT, baseUrl);
        console.log(`GPApiConfig: Updated cached working API endpoint to: ${baseUrl}`);
      } else {
        localStorage.removeItem(this.CACHE_KEY_ENDPOINT);
      }
    }
  },

  // Singleton background auto-recovery loop (checks every 30 seconds)
  startRecoveryMonitor: function() {
    // Prevent duplicate timers on page navigation/reloads
    if (window.GPApiConfigTimer) {
      return;
    }

    console.log("GPApiConfig: Starting background endpoint recovery monitor (30s interval)...");
    window.GPApiConfigTimer = setInterval(async () => {
      const relativePath = this.endpoints.chat;
      const cachedBase = localStorage.getItem(this.CACHE_KEY_ENDPOINT);

      // If we are currently falling back to production, check if local server has started
      if (cachedBase === this.productionBaseUrl) {
        const localCheckUrl = `${this.localBaseUrl}${relativePath}`;
        const localIsUp = await this.checkHealth(localCheckUrl);
        if (localIsUp) {
          console.log(`GPApiConfig Recovery: Local server is back online! Switching from production to local: ${localCheckUrl}`);
          localStorage.setItem(this.CACHE_KEY_ENDPOINT, this.localBaseUrl);
        }
      }
    }, 30000);
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

// Start singleton recovery loop immediately
GPApiConfig.startRecoveryMonitor();
window.GPApiConfig = GPApiConfig;
