// resQpaws Admin Trainer Management Page Controller
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Authenticate and authorize (Only NGO rescuers are allowed)
  const user = await window.GPAuth.waitForUser();

  if (!user || user.role !== "ngo") {
    if (window.GPToast) {
      window.GPToast.warning("Restricted Access", "Please log in with an NGO Rescuer account to manage trainers.");
    } else {
      alert("Please log in with an NGO Rescuer account to manage trainers.");
    }
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  // Update profile display
  const nameEl = document.getElementById("profile-name-display");
  const avatarEl = document.getElementById("profile-avatar-display");
  if (nameEl) nameEl.textContent = user.name || user.email;
  if (avatarEl) avatarEl.src = user.avatar || "assets/placeholder.png";

  const listContainer = document.getElementById("applications-list-container");
  const tabButtons = document.querySelectorAll(".tab-btn");
  
  // Edit modal elements
  const editModal = document.getElementById("edit-trainer-modal");
  const closeEditBtn = document.getElementById("close-edit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const editForm = document.getElementById("edit-trainer-form");

  let allTrainers = [];
  let currentActiveTab = "Pending"; // Pending, Approved, Rejected

  // Setup tab switcher click listeners
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => {
        b.classList.remove("active");
        b.classList.remove("btn-primary");
        b.classList.add("btn-outline");
      });
      btn.classList.add("active");
      btn.classList.remove("btn-outline");
      btn.classList.add("btn-primary");

      currentActiveTab = btn.getAttribute("data-tab");
      renderActiveTab();
    });
  });

  // Helper to fetch backend server URL
  async function getServerBase() {
    const baseUrl = window.GPApiConfig ? await window.GPApiConfig.resolveEndpoint("reports") : "";
    return baseUrl ? baseUrl.replace("/api/reports", "") : "http://127.0.0.1:8000";
  }

  // 2. Fetch Trainer Records
  async function fetchAdminTrainers() {
    if (listContainer) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <span class="spinner" style="display:inline-block; width:24px; height:24px; margin-bottom:12px;"></span>
          <p>Fetching trainers application log...</p>
        </div>
      `;
    }

    try {
      const serverBase = await getServerBase();
      const response = await fetch(`${serverBase}/api/admin/trainers`);
      const data = await response.json();

      if (response.ok && data.success) {
        allTrainers = data.trainers;
        updateCounts();
        renderActiveTab();
      } else {
        throw new Error(data.error || "Failed to load admin trainer logs.");
      }
    } catch (err) {
      console.error("Admin fetch trainers error:", err);
      if (listContainer) {
        listContainer.innerHTML = `
          <div class="glass-card" style="text-align: center; padding: 40px; border-left: 4px solid var(--danger);">
            <h4 style="color:var(--danger); margin-bottom:4px;">Error Loading Applications</h4>
            <p style="color:var(--text-muted); font-size:0.9rem;">${err.message || 'Check server status.'}</p>
          </div>
        `;
      }
    }
  }

  // 3. Update tab count numbers
  function updateCounts() {
    const pending = allTrainers.filter(t => t.status === "Pending").length;
    const approved = allTrainers.filter(t => t.status === "Approved").length;
    const rejected = allTrainers.filter(t => t.status === "Rejected").length;

    const pendingEl = document.getElementById("count-pending");
    const approvedEl = document.getElementById("count-approved");
    const rejectedEl = document.getElementById("count-rejected");

    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (rejectedEl) rejectedEl.textContent = rejected;
  }

  // 4. Render listings for the active tab
  async function renderActiveTab() {
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const serverBase = await getServerBase();
    const filtered = allTrainers.filter(t => t.status === currentActiveTab);

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <p>No trainers listed under <strong>${currentActiveTab}</strong> status.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(t => {
      const card = document.createElement("div");
      card.className = "glass-card no-lift";
      card.style.cssText = "display: flex; gap: 20px; align-items: center; padding: 20px; flex-wrap: wrap;";

      const photoUrl = t.photo ? `${serverBase}/${t.photo}` : "assets/placeholder.png";

      let actionButtons = "";
      if (t.status === "Pending") {
        actionButtons = `
          <button class="btn btn-primary btn-sm approve-btn" data-id="${t.id}">Approve</button>
          <button class="btn btn-outline btn-sm reject-btn" data-id="${t.id}" style="border-color:var(--danger); color:var(--danger);">Reject</button>
        `;
      } else if (t.status === "Approved") {
        actionButtons = `
          <button class="btn btn-sm toggle-publish-btn ${t.is_published ? 'btn-outline' : 'btn-primary'}" data-id="${t.id}" data-published="${t.is_published}">
            ${t.is_published ? "Unpublish" : "Publish Profile"}
          </button>
        `;
      } else if (t.status === "Rejected") {
        actionButtons = `
          <button class="btn btn-primary btn-sm approve-btn" data-id="${t.id}">Approve</button>
        `;
      }

      card.innerHTML = `
        <img src="${photoUrl}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;" alt="Trainer">
        <div style="flex-grow: 1; min-width: 200px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3 style="font-size: 1.15rem;">${t.name}</h3>
            <span class="badge" style="font-size:0.75rem; background:${t.is_published ? 'rgba(22, 163, 74, 0.15)' : 'rgba(100, 116, 139, 0.15)'}; color:${t.is_published ? 'var(--primary)' : 'var(--text-muted)'};">
              ${t.is_published ? 'Published' : 'Hidden'}
            </span>
          </div>
          <p style="color: var(--accent); font-weight: 600; font-size: 0.85rem; margin-top:2px;">🐾 ${t.specialization}</p>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; display:flex; gap:12px; flex-wrap:wrap;">
            <span>📍 ${t.location}</span>
            <span>🕒 Exp: ${t.experience} Yrs</span>
            <span>📞 ${t.phone}</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${actionButtons}
          <button class="btn btn-outline btn-sm edit-btn" data-id="${t.id}" style="padding:6px 12px;">✏️ Edit</button>
          <button class="btn btn-outline btn-sm delete-btn" data-id="${t.id}" style="padding:6px 12px; border-color:var(--danger); color:var(--danger);">🗑️ Delete</button>
        </div>
      `;

      // Bind button triggers
      const approveBtn = card.querySelector(".approve-btn");
      if (approveBtn) {
        approveBtn.addEventListener("click", () => updateTrainerStatus(t.id, "Approved", true));
      }

      const rejectBtn = card.querySelector(".reject-btn");
      if (rejectBtn) {
        rejectBtn.addEventListener("click", () => updateTrainerStatus(t.id, "Rejected", false));
      }

      const togglePublishBtn = card.querySelector(".toggle-publish-btn");
      if (togglePublishBtn) {
        togglePublishBtn.addEventListener("click", () => {
          const isPub = togglePublishBtn.getAttribute("data-published") === "true";
          updateTrainerPublish(t.id, !isPub);
        });
      }

      card.querySelector(".edit-btn").addEventListener("click", () => openEditModal(t));
      card.querySelector(".delete-btn").addEventListener("click", () => deleteTrainer(t.id));

      listContainer.appendChild(card);
    });
  }

  // 5. Update Status Shortcut
  async function updateTrainerStatus(id, newStatus, autoPublish) {
    try {
      const serverBase = await getServerBase();
      const response = await fetch(`${serverBase}/api/admin/trainers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          is_published: autoPublish
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (window.GPToast) {
          window.GPToast.success(
            "Status Updated",
            `Trainer application marked as ${newStatus} successfully.`
          );
        }
        fetchAdminTrainers();
      } else {
        throw new Error(data.error || "Status update failed.");
      }
    } catch (err) {
      console.error(err);
      if (window.GPToast) window.GPToast.error("Update Error", err.message);
    }
  }

  // 6. Toggle Profile Publication Visibility
  async function updateTrainerPublish(id, isPublished) {
    try {
      const serverBase = await getServerBase();
      const response = await fetch(`${serverBase}/api/admin/trainers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: isPublished })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (window.GPToast) {
          window.GPToast.success(
            isPublished ? "Published Successfully! 🚀" : "Profile Hidden 🔒",
            isPublished ? "Trainer is now visible on the public website." : "Trainer profile has been hidden."
          );
        }
        fetchAdminTrainers();
      } else {
        throw new Error(data.error || "Publication toggle failed.");
      }
    } catch (err) {
      console.error(err);
      if (window.GPToast) window.GPToast.error("Update Error", err.message);
    }
  }

  // 7. Delete Trainer profile
  async function deleteTrainer(id) {
    if (!confirm("Are you sure you want to permanently delete this trainer record? This cannot be undone.")) return;

    try {
      const serverBase = await getServerBase();
      const response = await fetch(`${serverBase}/api/admin/trainers/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (window.GPToast) {
          window.GPToast.success("Trainer Deleted", "Record has been removed permanently.");
        }
        fetchAdminTrainers();
      } else {
        throw new Error(data.error || "Failed to delete trainer.");
      }
    } catch (err) {
      console.error(err);
      if (window.GPToast) window.GPToast.error("Deletion Failed", err.message);
    }
  }

  // 8. Edit Details Modal Handlers
  function openEditModal(t) {
    if (!editModal) return;

    document.getElementById("edit-trainer-id").value = t.id;
    document.getElementById("edit-name").value = t.name;
    document.getElementById("edit-phone").value = t.phone;
    document.getElementById("edit-email").value = t.email;
    document.getElementById("edit-location").value = t.location;
    document.getElementById("edit-specialization").value = t.specialization;
    document.getElementById("edit-experience").value = t.experience;
    document.getElementById("edit-languages").value = t.languages;
    document.getElementById("edit-availability").value = t.availability;
    document.getElementById("edit-certifications").value = t.certifications || "";
    document.getElementById("edit-bio").value = t.bio;
    document.getElementById("edit-status").value = t.status;
    document.getElementById("edit-published").value = String(t.is_published);

    editModal.style.display = "flex";
  }

  const hideEditModal = () => {
    if (editModal) editModal.style.display = "none";
    if (editForm) editForm.reset();
  };

  if (closeEditBtn) closeEditBtn.addEventListener("click", hideEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", hideEditModal);

  window.addEventListener("click", (e) => {
    if (e.target === editModal) hideEditModal();
  });

  // 9. Save Edit Modal Changes
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const saveBtn = document.getElementById("save-edit-btn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      const id = document.getElementById("edit-trainer-id").value;
      const statusVal = document.getElementById("edit-status").value;
      const isPubVal = document.getElementById("edit-published").value === "true";

      // Cannot publish if not approved
      if (isPubVal && statusVal !== "Approved") {
        if (window.GPToast) {
          window.GPToast.warning("Validation Error", "Cannot publish profile if Status is not Approved.");
        } else {
          alert("Cannot publish profile if Status is not Approved.");
        }
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Changes";
        }
        return;
      }

      const payload = {
        name: document.getElementById("edit-name").value.trim(),
        phone: document.getElementById("edit-phone").value.trim(),
        email: document.getElementById("edit-email").value.trim(),
        location: document.getElementById("edit-location").value.trim(),
        specialization: document.getElementById("edit-specialization").value,
        experience: document.getElementById("edit-experience").value,
        languages: document.getElementById("edit-languages").value.trim(),
        availability: document.getElementById("edit-availability").value.trim(),
        certifications: document.getElementById("edit-certifications").value.trim(),
        bio: document.getElementById("edit-bio").value.trim(),
        status: statusVal,
        is_published: isPubVal
      };

      try {
        const serverBase = await getServerBase();
        const response = await fetch(`${serverBase}/api/admin/trainers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (response.ok && data.success) {
          if (window.GPToast) {
            window.GPToast.success("Profile Saved", "Trainer profile updated successfully.");
          }
          hideEditModal();
          fetchAdminTrainers();
        } else {
          throw new Error(data.error || "Save operation failed.");
        }
      } catch (err) {
        console.error(err);
        if (window.GPToast) window.GPToast.error("Save Error", err.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Changes";
        }
      }
    });
  }

  // Fetch initial data
  fetchAdminTrainers();
});
