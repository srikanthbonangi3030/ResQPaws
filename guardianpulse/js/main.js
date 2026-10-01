// resQpaws Core UI Controller
// Handles PWA Registration, Theme Switching, Language Translations, and Counter animations.

// // 1. Translation Dictionary (English, Telugu, Hindi)
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
    navTrainers: "Trainers",
    navDonate: "Donate",
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
    aboutTitle: "About Our Mission",

    // Report Emergency Page Keys
    reportTitle: "Report Animal Emergency",
    reportSubtitle: "Submit details of injured, trapped, or sick animals. Our simulated AI system will assess severity and alert nearby NGOs.",
    incidentDetailsTitle: "Incident Details",
    lblAnimalType: "Animal Type",
    lblEmergencyType: "Emergency Type",
    lblSeverity: "Severity Level",
    lblContact: "Reporter Contact Number",
    lblLocation: "Location Address Description",
    lblMap: "Select Pin Location on Map",
    btnAddressSearch: "Search",
    lblUploadImg: "Upload Animal Image (Optional)",
    lblDescription: "Incident Description & Animal Condition",
    btnSubmitReport: "Submit Report & Run AI Scan",
    rulesInfoBtn: "Rules Info",
    diagnosticRulesTitle: "Diagnostic Rules Guide",
    ruleCriticalTitle: "Critical:",
    ruleCriticalDesc: "Severe open fractures, heavy blood discharge, or unconscious state. Immediate dispatch triggered.",
    ruleHighTitle: "High:",
    ruleHighDesc: "Noticeable bleeding cuts or severe limping issues. NGO requested within 1 hour.",
    ruleMediumTitle: "Medium:",
    ruleMediumDesc: "Rashes, sickness, malnutrition or dehydration signs. NGO requested within 24 hours.",
    ruleLowTitle: "Low:",
    ruleLowDesc: "Found healthy but stranded in observation regions.",
    btnGotIt: "Got It",

    // NGO Dashboard Keys
    ngoDashTitle: "NGO Dashboard",
    ngoProfileRole: "NGO Rescuer",
    lblAvailStatus: "Availability Status",
    lblCurrent: "Current:",
    btnAvailable: "Available",
    btnBusy: "Busy",
    btnOffline: "Offline",
    statNewEmergencies: "New Emergencies",
    statActiveRescues: "Active Rescues",
    statRescuesCompleted: "Rescues Completed",
    statLocalVolunteers: "Local Volunteers",
    titlePinboardMap: "Active Incidents Pinboard Map",
    titleIncomingAlerts: "Incoming Emergency Alerts",
    titleActiveCoordDesk: "Active Rescue Coordination Desk",
    titleVolunteerContacts: "Regional Volunteer Contacts",
    titleNotificationCenter: "NGO Alerts Notification Center"
  },
  te: {
    appName: "resQpaws",
    tagline: "ప్రతి ప్రాణం విలువైనదే",
    subtagline: "AI-ఆధారిత జంతు సంరక్షణ మరియు NGO సమన్వయ ప్లాట్‌ఫారమ్.",
    navHome: "హోమ్",
    navAbout: "మా గురించి",
    navContact: "మమ్మల్ని సంప్రదించండి",
    navReport: "అత్యవసర నివేదిక",
    navLostFound: "కోల్పోయినవి & దొరికినవి",
    navVolunteer: "స్వచ్ఛంద కార్యకర్త",
    navDashboard: "డాష్‌బోర్డ్",
    navLogout: "లాగ్ అవుట్",
    navLogin: "లాగిన్",
    navTrainers: "శిక్షకులు",
    navDonate: "విరాళం",
    btnReport: "అత్యవసర నివేదిక ఇవ్వండి",
    btnVolunteer: "స్వచ్ఛందంగా చేరండి",
    sectionHowItWorks: "ఇది ఎలా పని చేస్తుంది",
    step1Title: "1. నివేదించండి",
    step1Desc: "గాయపడిన జంతువు చిత్రాన్ని అప్‌లోడ్ చేయండి. మ్యాప్‌లో లొకేషన్ ఎంచుకోండి.",
    step2Title: "2. కృత్రిమ మేధస్సు అంచనా",
    step2Desc: "సిమ్యులేటెడ్ AI-సహాయక విశ్లేషణ గాయం యొక్క తీవ్రతను స్వయంచాలకంగా లెక్కిస్తుంది.",
    step3Title: "3. NGO రెస్క్యూ టీమ్",
    step3Desc: "దగ్గరలోని NGOలు వెంటనే సమాచారం అందుకుని రెస్క్యూ టీమ్‌ను పంపుతాయి.",
    counterReported: "నివేదించబడిన జంతువులు",
    counterRescued: "కాపాడిన జంతువులు",
    counterNgos: "సక్రియ NGOలు",
    counterVolunteers: "నమోదైన వాలంటీర్లు",
    successStoryTitle: "విజయ గాథలు",
    footerCopy: "© 2026 resQpaws జంతు సంరక్షణ సంస్థ. అన్ని హక్కులు ప్రత్యేకించబడినవి.",
    themeLight: "లైట్ మోడ్",
    themeDark: "డార్క్ మోడ్",
    emergencyBannerText: "జంతువు తీవ్రమైన ప్రాణాపాయ స్థితిలో ఉందా? వెంటనే నివేదించండి.",
    contactTitle: "మమ్మల్ని సంప్రదించండి",
    aboutTitle: "మా లక్ష్యం గురించి",

    // Report Emergency Page Keys
    reportTitle: "జంతు అత్యవసర నివేదిక",
    reportSubtitle: "గాయపడిన, చిక్కుకున్న లేదా అనారోగ్యంతో ఉన్న జంతువుల వివరాలను సమర్పించండి. AI వ్యవస్థ తీవ్రతను అంచనా వేసి NGOలకు సమాచారం ఇస్తుంది.",
    incidentDetailsTitle: "సంఘటన వివరాలు",
    lblAnimalType: "జంతువు రకం",
    lblEmergencyType: "అత్యవసర రకం",
    lblSeverity: "తీవ్రత స్థాయి",
    lblContact: "నివేదిక దారుని ఫోన్ నంబర్",
    lblLocation: "చిరునామా వివరాలు",
    lblMap: "మ్యాప్‌లో స్థానాన్ని ఎంచుకోండి",
    btnAddressSearch: "శోధించండి",
    lblUploadImg: "జంతువు చిత్రం అప్‌లోడ్ చేయండి (ఐచ్ఛికం)",
    lblDescription: "సంఘటన వివరణ మరియు జంతువు స్థితి",
    btnSubmitReport: "నివేదికను సమర్పించండి & AI స్కాన్ రన్ చేయండి",
    rulesInfoBtn: "నియమాలు",
    diagnosticRulesTitle: "రోగనిర్ధారణ నిబంధనల మార్గదర్శి",
    ruleCriticalTitle: "తీవ్రమైన:",
    ruleCriticalDesc: "తీవ్రమైన గాయాలు, రక్తం కారడం లేదా స్పృహ లేని స్థితి. తక్షణ వాహనం పంపబడుతుంది.",
    ruleHighTitle: "అధికం:",
    ruleHighDesc: "రక్తస్రావం గాయాలు లేదా తీవ్రమైన కుంటితనం. 1 గంటలో NGO సహాయం.",
    ruleMediumTitle: "మధ్యస్థం:",
    ruleMediumDesc: "అనారోగ్యం, పోషకాహార లోపం లేదా నీటి కొరత సంకేతాలు. 24 గంటల్లో NGO స్పందన.",
    ruleLowTitle: "తక్కువ:",
    ruleLowDesc: "ఆరోగ్యంగా ఉన్నప్పటికీ చిక్కుకున్న జంతువులు.",
    btnGotIt: "అర్థమైంది",

    // NGO Dashboard Keys
    ngoDashTitle: "NGO డాష్‌బోర్డ్",
    ngoProfileRole: "NGO రెస్క్యూయర్",
    lblAvailStatus: "లభ్యత స్థితి",
    lblCurrent: "ప్రస్తుత స్థానం:",
    btnAvailable: "అందుబాటులో ఉన్నారు",
    btnBusy: "బిజీగా ఉన్నారు",
    btnOffline: "ఆఫ్‌లైన్",
    statNewEmergencies: "కొత్త అత్యవసర పరిస్థితులు",
    statActiveRescues: "ప్రస్తుత రెస్క్యూలు",
    statRescuesCompleted: "పూర్తయిన రెస్క్యూలు",
    statLocalVolunteers: "స్థానిక వాలంటీర్లు",
    titlePinboardMap: "సక్రియ సంఘటనల మ్యాప్",
    titleIncomingAlerts: "వచ్చే అత్యవసర హెచ్చరికలు",
    titleActiveCoordDesk: "సక్రియ రెస్క్యూ సమన్వయ కేంద్రం",
    titleVolunteerContacts: "ప్రాంతీయ వాలంటీర్ పరిచయాలు",
    titleNotificationCenter: "NGO హెచ్చరికల నోటిఫికేషన్ కేంద్రం"
  },
  hi: {
    appName: "resQpaws",
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
    navLogin: "लॉगिन",
    navTrainers: "ट्रेनर्स",
    navDonate: "दान करें",
    btnReport: "आपातकाल रिपोर्ट करें",
    btnVolunteer: "स्वयंसेवक बनें",
    sectionHowItWorks: "यह कैसे काम करता है",
    step1Title: "1. घटना की रिपोर्ट करें",
    step1Desc: "घायल या फंसे हुए जानवर की तस्वीर अपलोड करें। मानचित्र पर स्थान चुनें।",
    step2Title: "2. एआई मूल्यांकन",
    step2Desc: "सिम्युलेटेड एआई मूल्यांकन चोट की गंभीरता और संकट के स्तर का विश्लेषण करता है।",
    step3Title: "3. एनजीओ प्रस्थान",
    step3Desc: "आस-पास के एनजीओ विवरण प्राप्त करते हैं और बचाव दल भेजते हैं।",
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
    aboutTitle: "हमारे मिशन के बारे में",

    // Report Emergency Page Keys
    reportTitle: "पशु आपातकालीन रिपोर्ट",
    reportSubtitle: "घायल, फंसे या बीमार जानवरों का विवरण जमा करें। एआई प्रणाली गंभीरता का आकलन करके एनजीओ को सूचित करेगी।",
    incidentDetailsTitle: "घटना का विवरण",
    lblAnimalType: "पशु का प्रकार",
    lblEmergencyType: "आपातकाल का प्रकार",
    lblSeverity: "गंभीरता का स्तर",
    lblContact: "रिपोर्टर का फोन नंबर",
    lblLocation: "स्थान का पता",
    lblMap: "मानचित्र पर स्थान चुनें",
    btnAddressSearch: "खोजें",
    lblUploadImg: "पशु की छवि अपलोड करें (वैकल्पिक)",
    lblDescription: "घटना का विवरण और पशु की स्थिति",
    btnSubmitReport: "रिपोर्ट जमा करें और एआई स्कैन चलाएं",
    rulesInfoBtn: "नियम",
    diagnosticRulesTitle: "निदान नियम मार्गदर्शिका",
    ruleCriticalTitle: "गंभीर:",
    ruleCriticalDesc: "गंभीर खुले फ्रैक्चर, अत्यधिक रक्तस्राव या बेहोशी की स्थिति। तत्काल प्रस्थान।",
    ruleHighTitle: "उच्च:",
    ruleHighDesc: "खून बहने वाले घाव या गंभीर लंगड़ापन। 1 घंटे में एनजीओ अनुरोध।",
    ruleMediumTitle: "मध्यम:",
    ruleMediumDesc: "बीमारी, कुपोषण या डिहाइड्रेशन के लक्षण। 24 घंटे में एनजीओ प्रतिक्रिया।",
    ruleLowTitle: "कम:",
    ruleLowDesc: "स्वस्थ पाया गया लेकिन अवलोकन क्षेत्रों में फंसा हुआ।",
    btnGotIt: "समझ आ गया",

    // NGO Dashboard Keys
    ngoDashTitle: "एनजीओ डैशबोर्ड",
    ngoProfileRole: "एनजीओ रेस्क्यूअर",
    lblAvailStatus: "उपलब्धता की स्थिति",
    lblCurrent: "वर्तमान स्थिति:",
    btnAvailable: "उपलब्ध हैं",
    btnBusy: "व्यस्त हैं",
    btnOffline: "ऑफ़लाइन",
    statNewEmergencies: "नई आपात स्थिति",
    statActiveRescues: "सक्रिय बचाव",
    statRescuesCompleted: "पूरे किए गए बचाव",
    statLocalVolunteers: "स्थानीय स्वयंसेवक",
    titlePinboardMap: "सक्रिय घटनाओं का नक्शा",
    titleIncomingAlerts: "आने वाले आपातकालीन अलर्ट",
    titleActiveCoordDesk: "सक्रिय बचाव समन्वय डेस्क",
    titleVolunteerContacts: "क्षेत्रीय स्वयंसेवक संपर्क",
    titleNotificationCenter: "एनजीओ अलर्ट अधिसूचना केंद्र"
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

// --- FAST LINK PREFETCHING & SMOOTH PAGE TRANSITIONS (Flipkart-Style Smooth Navigation) ---
(function initSmoothTransitions() {
  const prefetched = new Set();
  const prefetch = (url) => {
    if (!url || prefetched.has(url) || url.startsWith("#") || url.startsWith("javascript:") || url.startsWith("http") || url.startsWith("tel:") || url.startsWith("mailto:")) return;
    prefetched.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  };

  document.addEventListener("DOMContentLoaded", () => {
    // Prefetch links on hover/touch and apply smooth exit animation on click
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) return;

      a.addEventListener("mouseenter", () => prefetch(href), { passive: true });
      a.addEventListener("touchstart", () => prefetch(href), { passive: true });

      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
        const target = a.href;
        if (target && target !== window.location.href && !target.includes("#")) {
          e.preventDefault();
          document.body.classList.add("page-fading-out");
          setTimeout(() => {
            window.location.href = target;
          }, 120);
        }
      });
    });
  });
})();
