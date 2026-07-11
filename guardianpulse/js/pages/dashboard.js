// GuardianPulse Dashboard Controller
// Handles both Public User and NGO Rescuer dashboards.

(async function initDashboard() {
  // 1. Wait for Auth state initialization
  const user = await window.GPAuth.waitForUser();

  // ðŸš« NOT LOGGED IN â†’ REDIRECT
  if (!user) {
    if (window.GPToast) window.GPToast.warning("Session Expired", "Please login to access the dashboard.");
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
    return;
  }

  console.log("Dashboard loaded for user:", user);

  // ðŸ‘¤ PROFILE CARD UPDATE
  const nameEl = document.getElementById("profile-name-display");
  const roleEl = document.getElementById("profile-role-display");
  const avatarEl = document.getElementById("profile-avatar-display");

  if (nameEl) nameEl.textContent = user.name || user.email;
  if (roleEl) {
    if (user.role === "ngo") {
      roleEl.textContent = "NGO Rescuer (Admin)";
    } else if (user.role === "volunteer") {
      roleEl.textContent = "Registered Volunteer";
    } else {
      roleEl.textContent = "Public Reporter";
    }
  }
  if (avatarEl) avatarEl.src = user.avatar || "assets/placeholder.png";

  // ðŸ”„ Real-time profile sync: update profile display instantly if user data changes
  window.addEventListener("gp-auth-changed", (e) => {
    const updatedUser = e.detail.user;
    if (!updatedUser) return;
    if (nameEl) nameEl.textContent = updatedUser.name || updatedUser.email;
    if (avatarEl) avatarEl.src = updatedUser.avatar || "assets/placeholder.png";
  });

  // ðŸšª LOGOUT BUTTON
  const logoutBtn = document.getElementById("nav-logout-btn");
  if (logoutBtn) {
    logoutBtn.style.display = "inline-block";
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      logoutBtn.textContent = "Logging out...";
      logoutBtn.disabled = true;
      await window.GPAuth.logout();
      window.dispatchEvent(new CustomEvent("gp-auth-changed", { detail: { user: null } }));
      window.location.href = "login.html";
    });
  }

  // ðŸ›  ROUTE DASHBOARD LOGIC BASED ON ROLE
  if (user.role === "ngo") {
    await initNgoDashboard(user);
  } else {
    await initUserDashboard(user);
  }
})();

// ==========================================
// ðŸš¨ NGO DASHBOARD LOGIC
// ==========================================
async function initNgoDashboard(ngoUser) {
  // 1. Availability Status Controls
  const statusSpan = document.getElementById("ngo-availability-status");
  const statusButtons = document.querySelectorAll(".ngo-status-controls .ngo-status-btn");
  
  // Fetch current NGO details from DB
  let ngosList = await window.GPDB.getNgos();
  let currentNgo = ngosList.find(n => n.id === ngoUser.uid);
  
  // If current NGO doesn't exist in the list (e.g. new registration), register default status
  if (!currentNgo) {
    currentNgo = { id: ngoUser.uid, name: ngoUser.name, email: ngoUser.email, status: "Available" };
  }

  function updateStatusUI(status) {
    if (!statusSpan) return;
    statusSpan.textContent = status;
    statusSpan.className = `badge badge-${status.toLowerCase()}`;

    statusButtons.forEach(btn => {
      if (btn.textContent.trim().toLowerCase() === status.toLowerCase()) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  updateStatusUI(currentNgo.status);

  // Status buttons listeners
  statusButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const selectedStatus = btn.textContent.trim();
      try {
        await window.GPDB.updateNgoStatus(ngoUser.uid, selectedStatus);
        updateStatusUI(selectedStatus);
        if (window.GPToast) window.GPToast.success("Status Updated", `Your availability is now: ${selectedStatus}`);
      } catch (err) {
        if (window.GPToast) window.GPToast.error("Update Failed", err.message);
        else alert("Failed to update status: " + err.message);
      }
    });
  });

  // ============================================================
  // ðŸ”´ REAL-TIME: Subscribe to all data sources
  // ============================================================

  // Skeleton helpers
  const alertsPane = document.getElementById("ngo-alerts-pane");
  const activeTableBody = document.getElementById("ngo-active-table-body");
  const volunteersListBody = document.getElementById("ngo-volunteers-list-body");
  const notificationsList = document.getElementById("ngo-notifications-list");

  if (alertsPane) alertsPane.innerHTML = `<div class="section-loading"><div class="spinner"></div> Loading incoming alerts...</div>`;
  if (activeTableBody) activeTableBody.innerHTML = `<tr><td colspan="6"><div class="section-loading"><div class="spinner"></div> Loading active rescues...</div></td></tr>`;

  // Track state for re-rendering
  let _allReports = [];
  let _allVolunteers = [];
  let _allNgos = [];
  let _mapInitialized = false;

  function renderNgoAlerts(newIncidents) {
    if (!alertsPane) return;
    alertsPane.innerHTML = "";
    
    if (newIncidents.length === 0) {
      alertsPane.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:24px; font-size:0.95rem;">No new incoming reports. All quiet!</div>`;
    } else {
      newIncidents.forEach(incident => {
        const card = document.createElement("div");
        card.className = "glass-card no-lift";
        card.style.padding = "16px";
        card.style.marginBottom = "12px";
        card.style.borderLeft = "4px solid " + (incident.severity === 'Critical' ? '#EF4444' : incident.severity === 'High' ? '#F97316' : '#F59E0B');

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:var(--primary); font-size:0.9rem;">${incident.id}</strong>
            <span class="badge badge-${incident.severity.toLowerCase()}">${incident.severity}</span>
          </div>
          <p style="font-size:0.9rem; margin-bottom:6px;"><strong>Animal:</strong> ${incident.animalType}</p>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${incident.description}</p>
          <p style="font-size:0.85rem; margin-bottom:12px;">ðŸ“ <em>${incident.locationName || "Location Coordinates"}</em></p>
          <button class="btn btn-primary btn-sm accept-btn" data-id="${incident.id}" style="width:100%;">Accept Rescue Request</button>
        `;

        alertsPane.appendChild(card);
      });

      // Accept button event listeners
      alertsPane.querySelectorAll(".accept-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          try {
            let updatedNgos = await window.GPDB.getNgos();
            let myNgoDetails = updatedNgos.find(n => n.id === ngoUser.uid);
            if (myNgoDetails && (myNgoDetails.status === "Busy" || myNgoDetails.status === "Offline")) {
              if (window.GPToast) {
                window.GPToast.warning("Cannot Accept", `Your status is ${myNgoDetails.status}. Toggle to Available first.`);
              } else {
                alert(`You cannot accept rescues when your availability is marked as: ${myNgoDetails.status}.`);
              }
              return;
            }

            e.target.disabled = true;
            e.target.textContent = "Accepting...";
            await window.GPDB.acceptRescue(id, ngoUser.uid);
            // Real-time listeners will automatically update the UI
            if (window.GPToast) window.GPToast.success("Rescue Accepted!", `Case ${id} assigned to you.`);
          } catch (err) {
            if (window.GPToast) window.GPToast.error("Accept Failed", err.message);
            else alert("Failed to accept rescue: " + err.message);
            e.target.disabled = false;
            e.target.textContent = "Accept Rescue Request";
          }
        });
      });
    }
  }

  function renderActiveRescues(activeRescues) {
    if (!activeTableBody) return;
    activeTableBody.innerHTML = "";
    
    if (activeRescues.length === 0) {
      activeTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No active rescue cases under coordination.</td></tr>`;
    } else {
      activeRescues.forEach(rescue => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${rescue.id}</strong></td>
          <td>${rescue.animalType}</td>
          <td><span class="badge badge-${rescue.severity.toLowerCase()}">${rescue.severity}</span></td>
          <td>
            <select class="form-control status-select" style="padding:6px; font-size:0.85rem; min-width:140px;">
              <option value="Accepted" ${rescue.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
              <option value="Team Dispatched" ${rescue.status === 'Team Dispatched' ? 'selected' : ''}>Team Dispatched</option>
              <option value="Animal Rescued" ${rescue.status === 'Animal Rescued' ? 'selected' : ''}>Animal Rescued</option>
              <option value="Treatment Ongoing" ${rescue.status === 'Treatment Ongoing' ? 'selected' : ''}>Treatment Ongoing</option>
              <option value="Recovered" ${rescue.status === 'Recovered' ? 'selected' : ''}>Recovered</option>
            </select>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="btn btn-outline btn-sm update-status-btn" data-id="${rescue.id}">Update</button>
              ${rescue.status === 'Recovered' ? `<button class="btn btn-primary btn-sm move-adoption-btn" data-id="${rescue.id}" data-animal="${rescue.animalType}" data-loc="${rescue.locationName}">To Adoption</button>` : ''}
            </div>
          </td>
          <td>
            <a href="track.html?id=${rescue.id}" class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size:0.8rem;">Track Case</a>
          </td>
        `;

        activeTableBody.appendChild(tr);
      });

      // Update Status button listeners
      activeTableBody.querySelectorAll(".update-status-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          const tr = e.target.closest("tr");
          const select = tr.querySelector(".status-select");
          const status = select.value;

          e.target.disabled = true;
          e.target.textContent = "Updating...";

          try {
            await window.GPDB.updateRescueStatus(id, status, ngoUser.uid);
            // Real-time listeners will re-render table automatically
            if (window.GPToast) window.GPToast.success("Status Updated", `Case ${id} â†’ ${status}`);
          } catch (err) {
            if (window.GPToast) window.GPToast.error("Update Failed", err.message);
            else alert("Failed to update rescue case status: " + err.message);
            e.target.disabled = false;
            e.target.textContent = "Update";
          }
        });
      });

      // Move to Adoption button listeners
      activeTableBody.querySelectorAll(".move-adoption-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          const animalType = e.target.getAttribute("data-animal");
          const locationName = e.target.getAttribute("data-loc");
          
          if(confirm(`Generate an adoption profile for Rescue ${id} (${animalType})?`)) {
            e.target.disabled = true;
            e.target.textContent = "...";
            try {
              const newAdoption = {
                name: `Rescue ${id}`,
                species: animalType,
                breed: "Unknown",
                age: "Unknown",
                gender: "Unknown",
                size: "Medium",
                location: locationName || "Local Shelter",
                status: "Available",
                healthStatus: "Fully recovered.",
                traits: ["Friendly", "Rescued"],
                story: `This brave ${animalType} was rescued via GuardianPulse and has now fully recovered and is ready for a forever home!`
              };
              await window.GPDB.addAdoptionListing(newAdoption);
              await window.GPDB.updateRescueStatus(id, "Closed - Adoptable", ngoUser.uid);
              if (window.GPToast) window.GPToast.success("Adoption Profile Created!", `Rescue case ${id} closed.`);
              else alert(`Adoption profile created successfully! Rescue case closed.`);
            } catch(err) {
              if (window.GPToast) window.GPToast.error("Failed", err.message);
              else alert("Failed to create adoption profile: " + err.message);
              e.target.disabled = false;
              e.target.textContent = "To Adoption";
            }
          }
        });
      });
    }
  }

  function renderVolunteersList(allVolunteers) {
    if (!volunteersListBody) return;
    volunteersListBody.innerHTML = "";
    
    if (allVolunteers.length === 0) {
      volunteersListBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No volunteers registered in this region yet.</td></tr>`;
    } else {
      allVolunteers.forEach(vol => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${vol.name}</strong></td>
          <td>${vol.city || "Bangalore"}</td>
          <td>${vol.phone || "Helpline number not given"}</td>
          <td>
            <a href="mailto:${vol.email}" class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.75rem;">Email Contact</a>
          </td>
        `;
        volunteersListBody.appendChild(tr);
      });
    }
  }

  function renderNgoNotifications(notifications) {
    if (!notificationsList) return;
    notificationsList.innerHTML = "";
    
    if (notifications.length === 0) {
      notificationsList.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:24px;">No alerts. Notification log is empty.</div>`;
    } else {
      notifications.forEach(notif => {
        const notifItem = document.createElement("div");
        notifItem.className = "glass-card no-lift";
        notifItem.style.padding = "12px 16px";
        notifItem.style.marginBottom = "8px";
        notifItem.style.opacity = notif.read ? "0.7" : "1.0";
        notifItem.style.backgroundColor = notif.read ? "transparent" : "rgba(22, 163, 74, 0.05)";

        const formattedTime = new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        notifItem.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:0.9rem; color:var(--text-main);">${notif.title}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${formattedTime}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">${notif.message}</p>
        `;
        notificationsList.appendChild(notifItem);
      });
    }
  }

  function updateNgoCounters(allReports, allVolunteers) {
    const newIncidents = allReports.filter(r => r.status === "Reported");
    const activeRescues = allReports.filter(r => r.assignedNgoId === ngoUser.uid && ["Accepted", "Team Dispatched", "Treatment Ongoing"].includes(r.status));
    const completedRescues = allReports.filter(r => r.assignedNgoId === ngoUser.uid && ["Animal Rescued", "Recovered"].includes(r.status));

    const newEl = document.getElementById("stat-ngo-new");
    const activeEl = document.getElementById("stat-ngo-active");
    const compEl = document.getElementById("stat-ngo-completed");
    const volEl = document.getElementById("stat-ngo-volunteers");

    if (newEl) newEl.textContent = newIncidents.length;
    if (activeEl) activeEl.textContent = activeRescues.length;
    if (compEl) compEl.textContent = completedRescues.length;
    if (volEl) volEl.textContent = allVolunteers.length;

    return { newIncidents, activeRescues };
  }

  // ðŸ”´ Subscribe to reports in real-time
  window.GPDB.subscribeToReports((allReports) => {
    _allReports = allReports;
    const { newIncidents, activeRescues } = updateNgoCounters(_allReports, _allVolunteers);
    renderNgoAlerts(newIncidents);
    renderActiveRescues(activeRescues);

    // Update map markers
    const mapEl = document.getElementById("ngo-dash-map");
    if (mapEl && window.GPMap && !_mapInitialized) {
      _mapInitialized = true;
      window.GPMap.initMap("ngo-dash-map");
    }
    if (_mapInitialized) {
      window.GPMap.clearMarkers && window.GPMap.clearMarkers();
      const myNgo = _allNgos.find(n => n.id === ngoUser.uid);
      if (myNgo && myNgo.location) {
        window.GPMap.addNgoMarker(myNgo);
        window.GPMap.panTo(myNgo.location.lat, myNgo.location.lng, 12);
      }
      _allNgos.forEach(ngo => { if (ngo.id !== ngoUser.uid) window.GPMap.addNgoMarker(ngo); });
      _allReports.forEach(report => window.GPMap.addEmergencyMarker(report));
      _allVolunteers.forEach(vol => window.GPMap.addVolunteerMarker(vol));
    }
  });

  // ðŸ”´ Subscribe to volunteers in real-time
  window.GPDB.subscribeToVolunteers((volunteers) => {
    _allVolunteers = volunteers;
    updateNgoCounters(_allReports, _allVolunteers);
    renderVolunteersList(_allVolunteers);
  });

  // ðŸ”´ Subscribe to NGOs in real-time
  window.GPDB.subscribeToNgos((ngos) => {
    _allNgos = ngos;
  });

  // ðŸ”´ Subscribe to notifications in real-time
  window.GPDB.subscribeToNotifications(ngoUser.uid, (notifications) => {
    renderNgoNotifications(notifications);
    // Auto-mark as read
    if (notifications.some(n => !n.read)) {
      window.GPDB.markNotificationsAsRead(ngoUser.uid).catch(() => {});
    }
  });
}
async function initUserDashboard(user) {
  let myReports = [];
  let ngosList = [];
  let allVolunteers = [];

  // ðŸ” Dynamic Search filtering
  const searchBar = document.getElementById("dashboard-search-bar");
  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterReportsTable(query);
    });
  }

  function filterReportsTable(query) {
    const rows = document.querySelectorAll("#user-history-table-body tr");
    rows.forEach(row => {
      if (row.cells.length < 5) return; // skip "no reports" row
      const text = row.textContent.toLowerCase();
      if (text.includes(query)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  // --- MODALS TOGGLE HELPERS ---
  function setupModal(triggerId, modalId, closeId, onOpenCallback) {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);

    if (trigger && modal) {
      trigger.onclick = (e) => {
        e.preventDefault();
        modal.classList.add("open");
        if (onOpenCallback) onOpenCallback();
      };
    }

    if (closeBtn && modal) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.remove("open");
      };
    }

    // Close when clicking outside dialog
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.classList.remove("open");
        }
      };
    }
  }

  // ðŸ“ Nearby Shelters Modal setup
  setupModal("card-btn-shelters", "modal-shelters", "close-modal-shelters", renderSheltersList);

  async function renderSheltersList() {
    const listContainer = document.getElementById("modal-shelters-list");
    if (!listContainer) return;

    listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">Retrieving shelters details...</div>`;
    
    try {
      if (ngosList.length === 0) {
        ngosList = await window.GPDB.getNgos();
      }
      
      const query = searchBar ? searchBar.value.toLowerCase().trim() : "";
      const filteredNgos = ngosList.filter(ngo => {
        if (!query) return true;
        return (ngo.name || "").toLowerCase().includes(query) || (ngo.city || "").toLowerCase().includes(query) || (ngo.status || "").toLowerCase().includes(query);
      });

      listContainer.innerHTML = "";
      if (filteredNgos.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No matching shelters found.</div>`;
        return;
      }

      filteredNgos.forEach(ngo => {
        const item = document.createElement("div");
        item.className = "shelter-card-item";
        
        // coordinates
        const lat = ngo.location ? ngo.location.lat : "N/A";
        const lng = ngo.location ? ngo.location.lng : "N/A";

        item.innerHTML = `
          <div class="shelter-card-header">
            <span class="shelter-name-title">${ngo.name}</span>
            <span class="badge badge-${ngo.status.toLowerCase()}">${ngo.status}</span>
          </div>
          <p style="font-size:0.9rem; color:var(--text-muted); margin: 2px 0;">ðŸ“ Location: ${ngo.city || "Bangalore"} (Lat: ${lat}, Lng: ${lng})</p>
          <p style="font-size:0.9rem; color:var(--text-muted); margin: 2px 0;">ðŸ“ž Helpline: ${ngo.phone || "+91 98765 43210"}</p>
          <p style="font-size:0.9rem; color:var(--text-muted); margin: 2px 0;">âœ‰ï¸ Email: ${ngo.email || "contact@shelter.org"}</p>
        `;
        listContainer.appendChild(item);
      });
    } catch (err) {
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--danger);">Failed to retrieve shelters.</div>`;
    }
  }

  // ðŸ“„ Scroll to Reports
  const myReportsBtn = document.getElementById("card-btn-myreports");
  if (myReportsBtn) {
    myReportsBtn.onclick = (e) => {
      e.preventDefault();
      const section = document.getElementById("reports-history-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  // ðŸ‘¤ Profile Modal setup
  setupModal("card-btn-profile", "modal-profile", "close-modal-profile", () => {
    const avatar = document.getElementById("modal-profile-avatar");
    const name = document.getElementById("modal-profile-name");
    const role = document.getElementById("modal-profile-role");
    const email = document.getElementById("modal-profile-email");
    const uid = document.getElementById("modal-profile-uid");

    if (avatar) avatar.src = user.avatar || "assets/placeholder.png";
    if (name) name.textContent = user.name || "Anonymous User";
    if (role) {
      if (user.role === "volunteer") role.textContent = "Registered Volunteer";
      else if (user.role === "ngo") role.textContent = "NGO Rescuer";
      else role.textContent = "Public Reporter";
    }
    if (email) email.textContent = user.email || "N/A";
    if (uid) uid.textContent = user.uid || "N/A";
  });

  // âš™ï¸ Settings Modal setup
  setupModal("card-btn-settings", "modal-settings", "close-modal-settings", () => {
    // Theme toggle link inside settings modal
    const themeBtn = document.getElementById("modal-theme-toggle-btn");
    if (themeBtn) {
      // Set initial text
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      themeBtn.textContent = currentTheme === "dark" ? "Light Mode" : "Dark Mode";
      
      themeBtn.onclick = () => {
        window.GPUI.toggleTheme();
        const updatedTheme = document.documentElement.getAttribute("data-theme");
        themeBtn.textContent = updatedTheme === "dark" ? "Light Mode" : "Dark Mode";
      };
    }

    // Language switcher select inside settings modal
    const langSelect = document.getElementById("modal-lang-switcher-select");
    if (langSelect) {
      langSelect.value = window.GPUI.currentLang;
      langSelect.onchange = (e) => {
        const selected = e.target.value;
        window.GPUI.currentLang = selected;
        localStorage.setItem("gp_language", selected);
        window.GPUI.translatePage();
        // sync language switcher in navbar
        const navLangSelect = document.getElementById("lang-switcher-select");
        if (navLangSelect) navLangSelect.value = selected;
      };
    }

    // Sync state of notification checkbox settings
    const notifPref = document.getElementById("modal-notif-pref");
    if (notifPref) {
      const savedPref = localStorage.getItem("gp_notif_pref") !== "false";
      notifPref.checked = savedPref;
      notifPref.onchange = (e) => {
        localStorage.setItem("gp_notif_pref", e.target.checked);
      };
    }
  });

  // â”€â”€â”€ RENDER HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function renderUserReports(reports) {
    myReports = reports;

    // --- Stats ---
    const lostFound = window._gpCachedLostFound || [];
    const activeReports = reports.filter(r => !["Recovered", "Closed"].includes(r.status));
    const rescuedReports = reports.filter(r => ["Animal Rescued", "Recovered"].includes(r.status));
    const myLostFound = lostFound.filter(lf => lf.reporterId === user.uid || lf.email === user.email);

    const repEl = document.getElementById("stat-user-reports");
    const actEl = document.getElementById("stat-user-active");
    const rescEl = document.getElementById("stat-user-rescued");
    const lfEl = document.getElementById("stat-user-lostfound");
    const volEl = document.getElementById("stat-user-volunteers");
    const shelterEl = document.getElementById("stat-user-shelters");

    if (repEl) repEl.textContent = reports.length;
    if (actEl) actEl.textContent = activeReports.length;
    if (rescEl) rescEl.textContent = rescuedReports.length;
    if (lfEl) lfEl.textContent = myLostFound.length;
    if (volEl) volEl.textContent = allVolunteers.length > 0 ? `${allVolunteers.length}+` : "320+";
    if (shelterEl) shelterEl.textContent = ngosList.length > 0 ? ngosList.length : "15";

    // --- History Table ---
    const historyTable = document.getElementById("user-history-table-body");
    if (!historyTable) return;

    historyTable.innerHTML = "";
    if (reports.length === 0) {
      historyTable.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No rescue cases reported by you yet.</td></tr>`;
      return;
    }

    reports.forEach(report => {
      const tr = document.createElement("tr");
      const reportDate = new Date(report.createdDate || Date.now()).toLocaleDateString([], {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      tr.innerHTML = `
        <td><strong>${report.id}</strong></td>
        <td>${report.animalType}</td>
        <td>${reportDate}</td>
        <td><span class="badge badge-${report.severity.toLowerCase()}">${report.severity}</span></td>
        <td><span class="badge badge-${report.status.toLowerCase().replace(/ /g, "-")}">${report.status}</span></td>
        <td><a href="track.html?id=${report.id}" class="btn btn-primary btn-sm" style="padding:6px 12px; font-size:0.8rem;">Track Case</a></td>
      `;
      historyTable.appendChild(tr);
    });
  }

  function renderUserNotifications(notifications) {
    const notificationsList = document.getElementById("user-notifications-list");
    if (!notificationsList) return;

    notificationsList.innerHTML = "";
    if (notifications.length === 0) {
      notificationsList.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:24px;">No alerts. Notification log is empty.</div>`;
      return;
    }

    notifications.forEach(notif => {
      const notifItem = document.createElement("div");
      notifItem.className = "glass-card no-lift";
      notifItem.style.padding = "12px 16px";
      notifItem.style.marginBottom = "8px";
      notifItem.style.opacity = notif.read ? "0.7" : "1.0";
      notifItem.style.backgroundColor = notif.read ? "transparent" : "rgba(22, 163, 74, 0.05)";

      const formattedTime = new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      notifItem.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong style="font-size:0.9rem; color:var(--text-main);">${notif.title}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">${formattedTime}</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">${notif.message}</p>
      `;
      notificationsList.appendChild(notifItem);
    });

    // Auto-mark as read
    if (notifications.some(n => !n.read)) {
      window.GPDB.markNotificationsAsRead(user.uid).catch(() => {});
    }
  }

  // â”€â”€â”€ INITIAL ONE-SHOT LOADS (supplementary data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const lostFound = await window.GPDB.getLostFound();
    window._gpCachedLostFound = lostFound;
  } catch (e) { console.warn("getLostFound failed", e); }

  try {
    allVolunteers = await window.GPDB.getVolunteers();
  } catch (e) { console.warn("getVolunteers failed", e); }

  try {
    ngosList = await window.GPDB.getNgos();
    const shelterEl = document.getElementById("stat-user-shelters");
    if (shelterEl) shelterEl.textContent = ngosList.length > 0 ? ngosList.length : "15";
    const volEl = document.getElementById("stat-user-volunteers");
    if (volEl) volEl.textContent = allVolunteers.length > 0 ? `${allVolunteers.length}+` : "320+";
  } catch (e) { console.warn("getNgos failed", e); }

  // â”€â”€â”€ REAL-TIME SUBSCRIPTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // ðŸ”´ Subscribe to this user's reports in real-time
  window.GPDB.subscribeToUserReports(user.uid, (reports) => {
    renderUserReports(reports);
  });

  // ðŸ”´ Subscribe to this user's notifications in real-time
  window.GPDB.subscribeToNotifications(user.uid, (notifications) => {
    renderUserNotifications(notifications);
  });

  // ðŸ”´ Listen for global report changes dispatched by demo-mode or Firestore
  window.addEventListener("gp-reports-updated", () => {
    window.GPDB.getUserReports(user.uid).then(renderUserReports).catch(() => {});
  });
}
