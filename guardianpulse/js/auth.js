// resQpaws Authentication Module
// Wraps Firebase Auth or LocalStorage mock auth functions with resilient fallbacks.
// Uses a single shared auth-ready promise to prevent race conditions across scripts.

const GPAuth = {
  // Internal: shared promise so multiple callers of waitForUser() all get the same result
  _authReadyPromise: null,
  _resolvedUser: undefined, // undefined = not yet resolved, null = resolved as logged-out

  // 🔐 Check if a user is currently logged in (Synchronous — reads cache)
  getCurrentUser: function() {
    try {
      return JSON.parse(localStorage.getItem("gp_current_user") || "null");
    } catch (e) {
      return null;
    }
  },

  // 🔐 EMAIL LOGIN
  login: async function(email, password) {
    if (window.GuardianPulse.isDemoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // If demo mode, we simulate matching credentials
          const ngos = JSON.parse(localStorage.getItem("gp_ngos") || "[]");
          const volunteers = JSON.parse(localStorage.getItem("gp_volunteers") || "[]");
          
          // Check if it's srikanth@rescue.org or any other NGO in sample data
          const ngo = ngos.find(n => n.email === email);
          if (ngo) {
            const userObj = { uid: ngo.id, name: ngo.name, email: ngo.email, role: "ngo", phone: ngo.phone, city: ngo.city };
            localStorage.setItem("gp_current_user", JSON.stringify(userObj));
            GPAuth._resolvedUser = userObj;
            resolve(userObj);
            return;
          }
          
          // Check volunteers
          const volunteer = volunteers.find(v => v.email === email);
          if (volunteer) {
            const userObj = { uid: volunteer.id, name: volunteer.name, email: volunteer.email, role: "volunteer", phone: volunteer.phone, city: volunteer.city };
            localStorage.setItem("gp_current_user", JSON.stringify(userObj));
            GPAuth._resolvedUser = userObj;
            resolve(userObj);
            return;
          }

          // Otherwise, simulate a normal public user login
          const userObj = {
            uid: "user-demo",
            name: email.split("@")[0],
            email: email,
            role: "user",
            avatar: "assets/placeholder.png"
          };
          localStorage.setItem("gp_current_user", JSON.stringify(userObj));
          GPAuth._resolvedUser = userObj;
          resolve(userObj);
        }, 800);
      });
    } else {
      // Firebase implementation
      try {
        const cred = await window.GuardianPulse.auth.signInWithEmailAndPassword(email, password);
        const user = cred.user;

        let userObj = null;
        try {
          // Fetch user role details from Firestore collection
          const doc = await window.GuardianPulse.firestore.collection("users").doc(user.uid).get();
          if (doc.exists) {
            userObj = doc.data();
          }
        } catch (firestoreErr) {
          console.warn("Firestore user profile fetch failed, using Auth fallback:", firestoreErr.message);
        }

        if (!userObj) {
          // Fallback if profile doesn't exist or Firestore read fails (e.g. Rules delay)
          userObj = {
            uid: user.uid,
            email: user.email,
            role: user.email === "srikanth@rescue.org" ? "ngo" : "user",
            name: user.email.split("@")[0],
            avatar: "assets/placeholder.png"
          };
        }

        localStorage.setItem("gp_current_user", JSON.stringify(userObj));
        GPAuth._resolvedUser = userObj;
        return userObj;
      } catch (err) {
        throw err;
      }
    }
  },

  // 🌐 GOOGLE LOGIN
  loginWithGoogle: async function() {
    if (window.GuardianPulse.isDemoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const userObj = {
            uid: "user-google-demo",
            name: "Google Demo User",
            email: "google-demo@gmail.com",
            role: "user",
            avatar: "assets/placeholder.png"
          };
          localStorage.setItem("gp_current_user", JSON.stringify(userObj));
          GPAuth._resolvedUser = userObj;
          resolve(userObj);
        }, 800);
      });
    } else {
      try {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        const result = await window.GuardianPulse.auth.signInWithPopup(provider);
        const user = result.user;

        const docRef = window.GuardianPulse.firestore.collection("users").doc(user.uid);
        let userObj = null;

        try {
          const doc = await docRef.get();
          if (doc.exists) {
            userObj = doc.data();
          }
        } catch (firestoreErr) {
          console.warn("Firestore fetch failed during Google login, using fallback:", firestoreErr.message);
        }

        if (!userObj) {
          userObj = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "Google User",
            role: user.email === "srikanth@rescue.org" ? "ngo" : "user",
            avatar: user.photoURL || "assets/placeholder.png"
          };
          
          try {
            // Try saving the profile if permissions allow it
            await docRef.set(userObj);
          } catch (writeErr) {
            console.warn("Could not save profile metadata to Firestore:", writeErr.message);
          }
        }

        localStorage.setItem("gp_current_user", JSON.stringify(userObj));
        GPAuth._resolvedUser = userObj;
        return userObj;
      } catch (err) {
        throw err;
      }
    }
  },

  // 🔐 ACCOUNT REGISTRATION
  register: async function(email, password, name, role, additionalDetails = {}) {
    if (window.GuardianPulse.isDemoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const uid = "user-" + Date.now();
          const userObj = {
            uid: uid,
            email: email,
            name: name,
            role: role,
            avatar: "assets/placeholder.png",
            ...additionalDetails
          };
          
          localStorage.setItem("gp_current_user", JSON.stringify(userObj));
          GPAuth._resolvedUser = userObj;

          // Save to local NGO list if registered as NGO
          if (role === "ngo") {
            const ngos = JSON.parse(localStorage.getItem("gp_ngos") || "[]");
            ngos.push({
              id: uid,
              name: name,
              email: email,
              phone: additionalDetails.phone || "",
              city: additionalDetails.city || "",
              status: "Available",
              rating: 5.0,
              rescues: 0
            });
            localStorage.setItem("gp_ngos", JSON.stringify(ngos));
          }

          resolve(userObj);
        }, 800);
      });
    } else {
      try {
        const cred = await window.GuardianPulse.auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user;

        const userObj = {
          uid: user.uid,
          email: email,
          name: name,
          role: role,
          avatar: "assets/placeholder.png",
          ...additionalDetails
        };

        try {
          // Save in Firestore collection
          await window.GuardianPulse.firestore.collection("users").doc(user.uid).set(userObj);

          // If NGO, also register under the ngos collection
          if (role === "ngo") {
            await window.GuardianPulse.firestore.collection("ngos").doc(user.uid).set({
              id: user.uid,
              name: name,
              email: email,
              phone: additionalDetails.phone || "",
              city: additionalDetails.city || "",
              status: "Available",
              rating: 5.0,
              rescues: 0
            });
          }
        } catch (firestoreErr) {
          console.warn("Failed to write profile details to Firestore database:", firestoreErr.message);
        }

        localStorage.setItem("gp_current_user", JSON.stringify(userObj));
        GPAuth._resolvedUser = userObj;
        return userObj;
      } catch (err) {
        throw err;
      }
    }
  },

  // 🚪 LOGOUT
  logout: async function() {
    localStorage.removeItem("gp_current_user");
    GPAuth._resolvedUser = null;
    GPAuth._authReadyPromise = null; // Reset so next page load re-evaluates
    if (!window.GuardianPulse.isDemoMode && window.GuardianPulse.auth) {
      try {
        await window.GuardianPulse.auth.signOut();
      } catch (e) {
        console.error("Firebase logout error:", e);
      }
    }
    return true;
  },

  // 🔐 WAIT FOR AUTH STATE (Shared singleton — safe for multiple concurrent callers)
  //
  // KEY FIX: This now returns a single shared promise. No matter how many scripts
  // call waitForUser() (main.js, dashboard.js, report.js, etc.), they all share
  // the same promise and get the same resolved user. This eliminates the race
  // condition where onAuthStateChanged was consumed by the first caller.
  //
  // Additionally, if localStorage already has a cached user (set by login()),
  // we trust it immediately instead of waiting for Firebase onAuthStateChanged
  // which might initially fire with null on a fresh page navigation.
  waitForUser: function() {
    // If we already resolved, return the cached result immediately
    if (GPAuth._resolvedUser !== undefined) {
      return Promise.resolve(GPAuth._resolvedUser);
    }

    // If a promise is already in-flight, return the same one (no duplicate listeners)
    if (GPAuth._authReadyPromise) {
      return GPAuth._authReadyPromise;
    }

    // FAST PATH: If localStorage has a cached user (just set by login/register),
    // trust it immediately. This is the common case after login → redirect.
    const cachedUser = this.getCurrentUser();
    if (cachedUser) {
      GPAuth._resolvedUser = cachedUser;
      GPAuth._authReadyPromise = Promise.resolve(cachedUser);

      // Optionally, if Firebase is available, do a background sync to update the
      // cache with fresh Firestore data — but don't block on it.
      if (!window.GuardianPulse.isDemoMode && window.GuardianPulse.auth) {
        window.GuardianPulse.auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const doc = await window.GuardianPulse.firestore.collection("users").doc(firebaseUser.uid).get();
              if (doc.exists) {
                const freshProfile = doc.data();
                localStorage.setItem("gp_current_user", JSON.stringify(freshProfile));
                GPAuth._resolvedUser = freshProfile;
              }
            } catch (e) {
              // Silently ignore — cached data is good enough
            }
          }
        });
      }

      return GPAuth._authReadyPromise;
    }

    // SLOW PATH: No cached user. Must wait for Firebase or resolve as null.
    if (window.GuardianPulse.isDemoMode) {
      GPAuth._resolvedUser = null;
      GPAuth._authReadyPromise = Promise.resolve(null);
      return GPAuth._authReadyPromise;
    }

    if (!window.GuardianPulse.auth) {
      GPAuth._resolvedUser = null;
      GPAuth._authReadyPromise = Promise.resolve(null);
      return GPAuth._authReadyPromise;
    }

    // Create a single shared promise for Firebase onAuthStateChanged
    GPAuth._authReadyPromise = new Promise((resolve) => {
      const unsubscribe = window.GuardianPulse.auth.onAuthStateChanged(
        async (firebaseUser) => {
          unsubscribe();
          if (!firebaseUser) {
            localStorage.removeItem("gp_current_user");
            GPAuth._resolvedUser = null;
            resolve(null);
            return;
          }

          let userObj = null;
          try {
            const doc = await window.GuardianPulse.firestore.collection("users").doc(firebaseUser.uid).get();
            if (doc.exists) {
              userObj = doc.data();
            }
          } catch (firestoreErr) {
            console.warn("Firestore fetch failed during auth state sync:", firestoreErr.message);
          }

          if (!userObj) {
            // Fallback profile if Firestore read is blocked (so user can still use layout)
            userObj = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: firebaseUser.email === "srikanth@rescue.org" ? "ngo" : "user",
              name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
              avatar: firebaseUser.photoURL || "assets/placeholder.png"
            };
          }

          localStorage.setItem("gp_current_user", JSON.stringify(userObj));
          GPAuth._resolvedUser = userObj;
          resolve(userObj);
        }
      );
    });

    return GPAuth._authReadyPromise;
  },

  // 📢 Dispatch auth state changed event to all listeners
  _dispatchAuthChanged: function(user) {
    window.dispatchEvent(new CustomEvent("gp-auth-changed", { detail: { user } }));
  },

  // 🔄 Start a persistent Firebase auth state listener (call once at app init)
  // This keeps the navbar and layout synced without page reloads.
  startPersistentListener: function() {
    if (GPAuth._persistentListenerStarted) return;
    GPAuth._persistentListenerStarted = true;

    if (window.GuardianPulse.isDemoMode) {
      // In demo mode, just dispatch once with the current user
      const user = GPAuth.getCurrentUser();
      GPAuth._dispatchAuthChanged(user);
      return;
    }

    if (!window.GuardianPulse.auth) return;

    window.GuardianPulse.auth.onAuthStateChanged(async (firebaseUser) => {
      let userObj = null;

      if (firebaseUser) {
        // Try to get profile from Firestore first
        try {
          const doc = await window.GuardianPulse.firestore.collection("users").doc(firebaseUser.uid).get();
          if (doc.exists) {
            userObj = doc.data();
          }
        } catch (e) {
          // Firestore not available; use Auth data
        }

        if (!userObj) {
          userObj = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: firebaseUser.email === "srikanth@rescue.org" ? "ngo" : "user",
            name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            avatar: firebaseUser.photoURL || "assets/placeholder.png"
          };
        }

        localStorage.setItem("gp_current_user", JSON.stringify(userObj));
        GPAuth._resolvedUser = userObj;
      } else {
        // User signed out
        localStorage.removeItem("gp_current_user");
        GPAuth._resolvedUser = null;
        GPAuth._authReadyPromise = null;
      }

      GPAuth._dispatchAuthChanged(userObj);
    });
  }
};

window.GPAuth = GPAuth;

// Auto-start the persistent listener on load
// Use a small delay so firebase-config.js has time to initialize GuardianPulse
document.addEventListener("DOMContentLoaded", () => {
  // Give firebase-config.js ~50ms to set up before starting the listener
  setTimeout(() => {
    if (window.GuardianPulse) {
      GPAuth.startPersistentListener();
    }
  }, 50);
});