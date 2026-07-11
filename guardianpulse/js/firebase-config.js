// resQpaws Firebase Configuration
// Using Firebase v9 Compat SDK (compatible with all existing auth.js / db.js logic)

const firebaseConfig = {
  apiKey: "AIzaSyCADOeoxa9xpnpTnSyts0Qwin4IW8AotyY",
  authDomain: "guardianpulse-resuce.firebaseapp.com",
  projectId: "guardianpulse-resuce",
  storageBucket: "guardianpulse-resuce.appspot.com",
  messagingSenderId: "183347110421",
  appId: "1:183347110421:web:18422c67c8c747a6d4e41c"
};

// --- Firebase initialization (Compat SDK loaded via HTML script tags) ---
let firebaseApp = null;
let authRef = null;
let dbRef = null;
let storageRef = null;
let isDemoMode = false;

try {
  if (window.firebase) {
    // Initialize app (prevent duplicate initialization)
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      firebaseApp = window.firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = window.firebase.apps[0];
    }

    authRef   = window.firebase.auth();
    dbRef     = window.firebase.firestore();
    storageRef = window.firebase.storage ? window.firebase.storage() : null;
    isDemoMode = false;

    console.log("🔥 Firebase connected successfully to project:", firebaseConfig.projectId);
  } else {
    console.warn("Firebase SDK not loaded. Falling back to Demo Mode.");
    isDemoMode = true;
  }
} catch (error) {
  console.error("Firebase initialization failed:", error.message);
  isDemoMode = true;
}

// --- LocalStorage Demo Mode Initialization (fallback) ---
// IMPORTANT: This runs synchronously so that scripts loaded after this file
// (dashboard.js, report.js, etc.) can immediately find sample data in localStorage.
if (isDemoMode) {
  console.log("✅ resQpaws running in Offline Demo Mode (LocalStorage).");
  
  if (!localStorage.getItem("gp_initialized")) {
    const sample = window.INITIAL_SAMPLE_DATA || {
      ngos: [], volunteers: [], reports: [], lostFound: [], notifications: []
    };
    localStorage.setItem("gp_ngos",          JSON.stringify(sample.ngos));
    localStorage.setItem("gp_volunteers",     JSON.stringify(sample.volunteers));
    localStorage.setItem("gp_reports",        JSON.stringify(sample.reports));
    localStorage.setItem("gp_lostfound",      JSON.stringify(sample.lostFound));
    localStorage.setItem("gp_notifications",  JSON.stringify(sample.notifications));
    localStorage.setItem("gp_adoptions",      JSON.stringify(sample.adoptions || []));
    localStorage.setItem("gp_applications",   JSON.stringify(sample.applications || []));

    localStorage.setItem("gp_initialized", "true");
    // NOTE: We no longer auto-set a default user here. The user should log in
    // via login.html, which calls GPAuth.login() and sets gp_current_user.
  }
}

// --- Global Exports ---
// window.GuardianPulse is used by auth.js, db.js, map.js, etc.
window.GuardianPulse = {
  isDemoMode: isDemoMode,
  firebase:   firebaseApp,
  auth:       authRef,
  firestore:  dbRef,
  storage:    storageRef
};

// window.FirebaseApp is the user-friendly alias matching Firebase v10 naming conventions
window.FirebaseApp = {
  app:     firebaseApp,
  auth:    authRef,
  db:      dbRef,
  storage: storageRef
};
