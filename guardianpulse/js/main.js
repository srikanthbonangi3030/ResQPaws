// resQpaws Core UI Controller
// Handles PWA Registration, Theme Switching, Language Translations, and Counter animations.

// 1. Translation Dictionary (English, Telugu, Hindi)
const GP_TRANSLATIONS = {
  en: {
    appName: "resQpaws",
    tagline: "Every Life Matters",
    subtagline: "AI-powered animal rescue and NGO coordination platform.",
    navHome: "Home",
    navAbout: "About Us",
    navContact: "Contact Us",
    navReport: "Report Emergency",
    navLostFound: "Lost & Found",
    navVolunteer: "Volunteer",
    navDashboard: "Dashboard",
    navLogout: "Logout",
    navLogin: "Login / Register",
    btnReport: "Report Emergency",
    btnVolunteer: "Become Volunteer",
    sectionHowItWorks: "How It Works",
    step1Title: "1. Report Incident",
    step1Desc: "Upload an image of the injured or stranded animal. Select coordinates on the map.",
    step2Title: "2. Simulated AI Scan",
    step2Desc: "Our simulated AI-Assisted Assessment automatically evaluates injury severity and distress levels.",
    step3Title: "3. NGO Dispatched",
    step3Desc: "Nearby NGOs receive details immediately and send rescue vehicles with status tracking.",
    counterReported: "Animals Reported",
    counterRescued: "Animals Rescued",
    counterNgos: "Active NGOs",
    counterVolunteers: "Volunteers Registered",
    successStoryTitle: "Success Stories",
    footerCopy: "© 2026 resQpaws Animal Welfare Foundation. All rights reserved.",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    emergencyBannerText: "Found an animal in immediate life-threatening distress? Report it instantly.",
    contactTitle: "Get in Touch",
    aboutTitle: "About Our Mission"
  },
  te: {
    appName: "గార్డియన్ పల్స్",
    tagline: "ప్రతి ప్రాణం విలువైనదే",
    subtagline: "AI-ఆధారిత జంతు సంరక్షణ మరియు NGO సమన్వయ ప్లాట్‌ఫారమ్.",
    navHome: "హోమ్",
    navAbout: "మా గురించి",
    navContact: "మమ్మల్ని సంప్రదించండి",
    navLogout: "లాగ్ అవుట్",
    navLogin: "లాగిన్",
    navProfile: "ప్రొఫైల్",
    navNgoDashboard: "NGO డాష్‌బోర్డ్",
    btnReport: "అత్యవసర నివేదిక ఇవ్వండి",
    btnVolunteer: "స్వచ్ఛందంగా చేరండి",
    sectionHowItWorks: "ఇది ఎలా పని చేస్తుంది",
    step1Title: "1. నివేదించండి",
    step1Desc: "గాయపడిన జంతువు చిత్రాన్ని అప్‌లోడ్ చేయండి. మ్యాప్‌లో లొకేషన్ ఎంచుకోండి.",
    step2Title: "2. కృత్రిమ మేధస్సు అంచనా",
    step2Desc: "సిమ్యులేటెడ్ AI-సహాయక విశ్లేషణ గాయం యొక్క తీవ్రతను స్వయంచాలకంగా లెక్కిస్తుంది.",
    step3Title: "3. NGO రెస్క్యూ టీమ్",
    step3Desc: "దగ్గరలోని NGOలు వెంటనే సమాచారం అందుకుని రెస్క్యూ టీమ్‌ను పంపుతాయి.",
    counterReported: "నిвеదించబడిన జంతువులు",
    counterRescued: "కాపాడిన జంతువులు",
    counterNgos: "సక్రియ NGOలు",
    counterVolunteers: "నమోదైన వాలంటీర్లు",
    successStoryTitle: "విజయ గాథలు",
    footerCopy: "© 2026 resQpaws జంతు సంరక్షణ సంస్థ. అన్ని హక్కులు ప్రత్యేకించబడినవి.",
    themeLight: "లైట్ మోడ్",
    themeDark: "డార్క్ మోడ్",
    emergencyBannerText: "జంతువు తీవ్రమైన ప్రాణాపాయ స్థితిలో ఉందా? వెంటనే నివేదించండి.",
    contactTitle: "మమ్మల్ని సంప్రదించండి",
    aboutTitle: "మా లక్ష్యం గురించి"
  },
  hi: {
    appName: "गार्डियन पल्स",
    tagline: "हर जीवन मायने रखता है",
    subtagline: "एआई-संचालित पशु बचाव और एनजीओ समन्वय मंच।",
    navHome: "होम",
    navAbout: "हमारे बारे में",
    navContact: "संपर्क करें",
    navReport: "आपातकालीन रिपोर्ट",
    navLostFound: "खोया और पाया",
    navVolunteer: "स्वयंसेवक",
    navDashboard: "डैशबोर्ड",
    navLogout: "लॉगआउट",
    navLogin: "लॉगिन / रजिस्टर",
    navProfile: "प्रोफ़ाइल",
    navNgoDashboard: "एनजीओ डैशबोर्ड",
    btnReport: "आपातकाल रिपोर्ट करें",
    btnVolunteer: "स्वयंसेवक बनें",
    sectionHowItWorks: "यह कैसे काम करता है",
    step1Title: "1. घटना की रिपोर्ट करें",
    step1Desc: "घायल या फंसे हुए जानवर की तस्वीर अपलोड करें। मानचित्र पर स्थान चुनें।",
    step2Title: "2. एआई-सहायता मूल्यांकन",
    step2Desc: "सिम्युलेटेड एआई मूल्यांकन स्वचालित रूप से चोट की गंभीरता और संकट के स्तर का विश्लेषण करता है।",
    step3Title: "3. एनजीओ प्रस्थान",
    step3Desc: "आस-पास के एनजीओ तुरंत विवरण प्राप्त करते हैं और लाइव ट्रैकिंग के साथ बचाव दल भेजते हैं।",
    counterReported: "पशु जिनकी रिपोर्ट की गई",
    counterRescued: "पशु जिन्हें बचाया गया",
    counterNgos: "सक्रिय एनजीओ",
    counterVolunteers: "पंजीकृत स्वयंसेवक",
    successStoryTitle: "सफलता की कहानियाँ",
    footerCopy: "© 2026 resQpaws पशु कल्याण फाउंडेशन। सर्वाधिकार सुरक्षित।",
    themeLight: "लाइट मोड",
    themeDark: "डार्क मोड",
    emergencyBannerText: "जानवर तत्काल संकट में है? तुरंत रिपोर्ट करें।",
    contactTitle: "संपर्क करें",
    aboutTitle: "हमारे मिशन के बारे में"
  }
};

const GPUI = {
  currentLang: 'en',

  init: function() {
    this.initTheme();
    this.initLanguage();
    this.initPWA();
    this.setupNavbar();
    this.setupNavbarRoleRouting();
    
    // Automatically translate page on DOM load
    document.addEventListener("DOMContentLoaded", () => {
      this.translatePage();
      this.initCounters();
    });
  },

  // --- THEME MANAGEMENT ---
  initTheme: function() {
    const savedTheme = localStorage.getItem("gp_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    // Wire toggle button if exists
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
      toggleBtn.innerHTML = savedTheme === "dark" 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      
      toggleBtn.addEventListener("click", () => this.toggleTheme());
    }
  },

  toggleTheme: function() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("gp_theme", newTheme);
    
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
      toggleBtn.innerHTML = newTheme === "dark" 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    }
  },

  // --- LANGUAGE TRANSLATIONS ---
  initLanguage: function() {
    this.currentLang = localStorage.getItem("gp_language") || "en";
    
    const selector = document.getElementById("lang-switcher-select");
    if (selector) {
      selector.value = this.currentLang;
      selector.addEventListener("change", (e) => {
        this.currentLang = e.target.value;
        localStorage.setItem("gp_language", this.currentLang);
        this.translatePage();
      });
    }
  },

  translatePage: function() {
    const elements = document.querySelectorAll("[data-i18n]");
    const dict = GP_TRANSLATIONS[this.currentLang];
    if (!dict) return;
    
    document.documentElement.lang = this.currentLang;
    
    elements.forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });
  },

  // --- NAVBAR MENUS ---
  setupNavbar: function() {
    const navToggle = document.getElementById("nav-toggle-btn");
    const navLinks = document.getElementById("nav-links-menu");
    
    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => {
        navLinks.classList.toggle("mobile-open");
      });
    }
  },

  // Dynamically switches Dashboard links and Auth buttons based on session state
  setupNavbarRoleRouting: function() {
    document.addEventListener("DOMContentLoaded", async () => {
      // 1. Immediate synchronous render from localStorage cache (prevents flickering)
      const cachedUser = window.GPAuth.getCurrentUser();
      this.updateNavbarUI(cachedUser);
      
      // 2. Wait for the shared auth promise to resolve (safe — won't compete with other scripts)
      try {
        const resolvedUser = await window.GPAuth.waitForUser();
        // Only re-render if the resolved user differs from cache
        if (JSON.stringify(resolvedUser) !== JSON.stringify(cachedUser)) {
          this.updateNavbarUI(resolvedUser);
        }
      } catch (e) {
        console.warn("Navbar auth sync error:", e);
      }

      // 3. 🔴 REAL-TIME: Listen for persistent auth state changes (login/logout/register)
      // This fires instantly without page reload
      window.addEventListener("gp-auth-changed", (e) => {
        this.updateNavbarUI(e.detail.user);
      });
    });
  },

  updateNavbarUI: function(user) {
    const profileLink = document.getElementById("nav-profile-link") || document.getElementById("nav-login-btn");
    const logoutNav = document.getElementById("nav-logout-btn");
    
    if (user) {
      if (profileLink) {
        profileLink.style.display = "inline-flex";
        // Show tiny avatar if available
        const avatarHtml = user.avatar && user.avatar !== "assets/placeholder.png"
          ? `<img src="${user.avatar}" class="nav-user-avatar" alt="" onerror="this.style.display='none'"> `
          : '';
        if (user.role === "ngo") {
          profileLink.innerHTML = avatarHtml + (GP_TRANSLATIONS[this.currentLang].navNgoDashboard || "NGO Dashboard");
          profileLink.setAttribute("data-i18n", "navNgoDashboard");
          profileLink.href = "ngo-dashboard.html";
        } else {
          profileLink.innerHTML = avatarHtml + (GP_TRANSLATIONS[this.currentLang].navProfile || "Profile");
          profileLink.setAttribute("data-i18n", "navProfile");
          profileLink.href = "user-dashboard.html";
        }
        profileLink.className = "btn btn-primary btn-sm";
      }
      if (logoutNav) {
        logoutNav.style.display = "inline-block";
        // Remove old listeners to prevent stacking
        const newLogout = logoutNav.cloneNode(true);
        logoutNav.parentNode.replaceChild(newLogout, logoutNav);
        newLogout.onclick = async (e) => {
          e.preventDefault();
          newLogout.textContent = "Logging out...";
          newLogout.disabled = true;
          await window.GPAuth.logout();
          // Dispatch the event manually for demo mode (Firebase does it automatically)
          window.dispatchEvent(new CustomEvent("gp-auth-changed", { detail: { user: null } }));
          // Redirect only if on a protected page
          const protectedPages = ["user-dashboard.html", "ngo-dashboard.html", "report.html"];
          const currentPage = window.location.pathname.split("/").pop();
          if (protectedPages.includes(currentPage)) {
            window.location.href = "index.html";
          }
        };
      }
    } else {
      if (profileLink) {
        profileLink.style.display = "inline-block";
        profileLink.innerHTML = GP_TRANSLATIONS[this.currentLang].navLogin || "Login";
        profileLink.setAttribute("data-i18n", "navLogin");
        profileLink.href = "login.html";
        profileLink.className = "btn btn-primary btn-sm";
      }
      if (logoutNav) {
        logoutNav.style.display = "none";
      }
    }
  },

  // --- STATS COUNTERS ANIMATIONS ---

  initCounters: function() {
    const counters = document.querySelectorAll(".counter-value");
    if (counters.length === 0) return;

    const runCounters = () => {
      counters.forEach(counter => {
        const target = +counter.getAttribute("data-target");
        const duration = 2000; // milliseconds
        const step = target / (duration / 16); // 60 FPS
        let current = 0;

        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target + (counter.getAttribute("data-suffix") || "");
          }
        };
        updateCounter();
      });
    };

    // Use Intersection Observer to trigger when visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounters();
          observer.disconnect(); // Trigger once
        }
      });
    }, { threshold: 0.1 });

    const statsSection = document.querySelector(".stats-bar");
    if (statsSection) {
      observer.observe(statsSection);
    }
  },

  // --- PWA LOADER ---
  initPWA: function() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => {
            console.log('resQpaws Service Worker registered successfully scope:', reg.scope);
          })
          .catch(err => {
            console.error('resQpaws Service Worker registration failed:', err);
          });
      });
    }
  }
};

GPUI.init();
window.GPUI = GPUI;

// Dynamically load the Centralized API Config and the AI Chat Assistant Widget
const configScript = document.createElement("script");
configScript.src = "js/api-config.js";
configScript.onload = function() {
  const chatScript = document.createElement("script");
  chatScript.src = "js/ai-chat.js";
  document.body.appendChild(chatScript);
};
document.body.appendChild(configScript);


// ============================================
// 🔔 GLOBAL TOAST NOTIFICATION UTILITY
// Usage: GPToast.show('Success!', 'Report submitted.', 'success')
// Types: 'success' | 'error' | 'warning' | 'info'
// ============================================
const GPToast = {
  _container: null,

  _ensureContainer: function() {
    if (!this._container) {
      this._container = document.getElementById("gp-toast-container");
      if (!this._container) {
        this._container = document.createElement("div");
        this._container.id = "gp-toast-container";
        document.body.appendChild(this._container);
      }
    }
    return this._container;
  },

  show: function(title, message, type = "info", duration = 4500) {
    const container = this._ensureContainer();
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };

    const toast = document.createElement("div");
    toast.className = `gp-toast toast-${type}`;
    toast.innerHTML = `
      <span class="gp-toast-icon">${icons[type] || "🔔"}</span>
      <div class="gp-toast-body">
        <div class="gp-toast-title">${title}</div>
        ${message ? `<div class="gp-toast-msg">${message}</div>` : ''}
      </div>
      <button class="gp-toast-close" aria-label="Close">✕</button>
      <div class="gp-toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    container.appendChild(toast);

    // Close button
    toast.querySelector(".gp-toast-close").addEventListener("click", () => {
      this._dismiss(toast);
    });

    // Auto-dismiss
    const timer = setTimeout(() => this._dismiss(toast), duration);

    // Allow pausing on hover
    toast.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      toast.querySelector(".gp-toast-progress").style.animationPlayState = "paused";
    });
    toast.addEventListener("mouseleave", () => {
      const remaining = 1500;
      setTimeout(() => this._dismiss(toast), remaining);
      toast.querySelector(".gp-toast-progress").style.animationPlayState = "running";
    });

    return toast;
  },

  _dismiss: function(toast) {
    if (!toast || toast.classList.contains("toast-exit")) return;
    toast.classList.add("toast-exit");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 320);
  },

  success: function(title, message, duration) {
    return this.show(title, message, "success", duration);
  },
  error: function(title, message, duration) {
    return this.show(title, message, "error", duration);
  },
  warning: function(title, message, duration) {
    return this.show(title, message, "warning", duration);
  },
  info: function(title, message, duration) {
    return this.show(title, message, "info", duration);
  }
};

window.GPToast = GPToast;
