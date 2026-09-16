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
  
  // Modals
  const editModal = document.getElementById("edit-trainer-modal");
  const closeEditBtn = document.getElementById("close-edit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const editForm = document.getElementById("edit-trainer-form");

  const auditModal = document.getElementById("verification-audit-modal");
  const closeAuditBtn = document.getElementById("close-verification-btn");
  const auditModalContent = document.getElementById("audit-modal-content");

  const rejectModal = document.getElementById("rejection-reason-modal");
  const cancelRejectBtn = document.getElementById("cancel-reject-modal-btn");
  const confirmRejectBtn = document.getElementById("confirm-reject-modal-btn");

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

      // Verification score badge colors
      const nameScore = t.name_match_score !== null && t.name_match_score !== undefined ? `${t.name_match_score}%` : "Pending OCR";
      let scoreBg = "rgba(100, 116, 139, 0.15)";
      let scoreColor = "var(--text-muted)";
      if (t.name_match_score >= 85) { scoreBg = "rgba(22, 163, 74, 0.15)"; scoreColor = "var(--primary)"; }
      else if (t.name_match_score >= 60) { scoreBg = "rgba(234, 179, 8, 0.15)"; scoreColor = "#D97706"; }
      else if (t.name_match_score !== null) { scoreBg = "rgba(239, 68, 68, 0.15)"; scoreColor = "var(--danger)"; }

      let vStatusBg = "rgba(59, 130, 246, 0.15)";
      let vStatusColor = "#2563EB";
      if (t.verification_status === "VERIFIED_APPROVED") { vStatusBg = "rgba(22, 163, 74, 0.15)"; vStatusColor = "var(--primary)"; }
      else if (t.verification_status === "VERIFIED_REJECTED") { vStatusBg = "rgba(239, 68, 68, 0.15)"; vStatusColor = "var(--danger)"; }

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
        <div style="flex-grow: 1; min-width: 240px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3 style="font-size: 1.15rem;">${t.name}</h3>
            <span class="badge" style="font-size:0.75rem; background:${t.is_published ? 'rgba(22, 163, 74, 0.15)' : 'rgba(100, 116, 139, 0.15)'}; color:${t.is_published ? 'var(--primary)' : 'var(--text-muted)'};">
              ${t.is_published ? 'Published' : 'Hidden'}
            </span>
            <span class="badge" style="font-size:0.75rem; background:${vStatusBg}; color:${vStatusColor};">
              🛡️ ${t.verification_status || 'PENDING'}
            </span>
            <span class="badge" style="font-size:0.75rem; background:${scoreBg}; color:${scoreColor}; font-weight:600;">
              Name Match: ${nameScore}
            </span>
          </div>
          <p style="color: var(--accent); font-weight: 600; font-size: 0.85rem; margin-top:2px;">🐾 ${t.specialization} (${t.experience} Yrs Exp)</p>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; display:flex; gap:12px; flex-wrap:wrap;">
            <span>📍 ${t.location}</span>
            <span>📞 ${t.phone}</span>
            <span>✉️ ${t.email}</span>
          </div>
          ${t.rejection_reason ? `<p style="color:var(--danger); font-size:0.8rem; margin-top:4px;">⚠️ Rejection Reason: ${t.rejection_reason}</p>` : ''}
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm audit-btn" data-id="${t.id}" style="padding:6px 12px; border-color:var(--primary); color:var(--primary);">🛡️ Audit & Docs</button>
          ${actionButtons}
          <button class="btn btn-outline btn-sm edit-btn" data-id="${t.id}" style="padding:6px 12px;">✏️ Edit</button>
          <button class="btn btn-outline btn-sm delete-btn" data-id="${t.id}" style="padding:6px 12px; border-color:var(--danger); color:var(--danger);">🗑️ Delete</button>
        </div>
      `;

      // Bind button triggers
      const approveBtn = card.querySelector(".approve-btn");
      if (approveBtn) {
        approveBtn.addEventListener("click", () => recordDecision(t.id, "APPROVE"));
      }

      const rejectBtn = card.querySelector(".reject-btn");
      if (rejectBtn) {
        rejectBtn.addEventListener("click", () => openRejectModal(t.id));
      }

      const togglePublishBtn = card.querySelector(".toggle-publish-btn");
      if (togglePublishBtn) {
        togglePublishBtn.addEventListener("click", () => {
          const isPub = togglePublishBtn.getAttribute("data-published") === "true";
          updateTrainerPublish(t.id, !isPub);
        });
      }

      card.querySelector(".audit-btn").addEventListener("click", () => openAuditModal(t));
      card.querySelector(".edit-btn").addEventListener("click", () => openEditModal(t));
      card.querySelector(".delete-btn").addEventListener("click", () => deleteTrainer(t.id));

      listContainer.appendChild(card);
    });
  }

  // 5. Open Audit Verification Modal
  async function openAuditModal(t) {
    if (!auditModal || !auditModalContent) return;
    const serverBase = await getServerBase();

    let ocrParsed = null;
    if (t.ocr_data_json) {
      try {
        ocrParsed = typeof t.ocr_data_json === "string" ? JSON.parse(t.ocr_data_json) : t.ocr_data_json;
      } catch (e) {
        ocrParsed = null;
      }
    }

    const govtLink = t.govt_id_path ? `${serverBase}/${t.govt_id_path}` : null;
    const certLink = t.cert_doc_path ? `${serverBase}/${t.cert_doc_path}` : null;

    const nameScoreText = t.name_match_score !== null && t.name_match_score !== undefined ? `${t.name_match_score}%` : "Not Scanned";
    const expiryText = t.expiry_status || "Not Checked";
    const duplicateText = t.duplicate_status || "Not Checked";
    const contactText = t.contact_status || "Not Checked";

    auditModalContent.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: var(--bg-card); padding: 16px; border-radius: 12px; border: 1px solid var(--border-glass);">
          <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Name Match Score</h4>
          <p style="font-size: 1.4rem; font-weight: 700; color: ${t.name_match_score >= 85 ? 'var(--primary)' : (t.name_match_score >= 60 ? '#D97706' : 'var(--danger)')}; margin: 0;">
            ${nameScoreText}
          </p>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${ocrParsed?.name_match_analysis?.details || 'Fuzzy string match against OCR document name.'}</span>
        </div>

        <div style="background: var(--bg-card); padding: 16px; border-radius: 12px; border: 1px solid var(--border-glass);">
          <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Document Expiry Status</h4>
          <p style="font-size: 1.2rem; font-weight: 700; color: ${expiryText === 'EXPIRED' ? 'var(--danger)' : 'var(--primary)'}; margin: 0;">
            ${expiryText}
          </p>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${ocrParsed?.govt_expiry_analysis?.details || ocrParsed?.cert_expiry_analysis?.details || 'Expiry date validation.'}</span>
        </div>

        <div style="background: var(--bg-card); padding: 16px; border-radius: 12px; border: 1px solid var(--border-glass);">
          <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Duplicate Document Check</h4>
          <p style="font-size: 1.2rem; font-weight: 700; color: ${duplicateText === 'DUPLICATE_FOUND' ? 'var(--danger)' : 'var(--primary)'}; margin: 0;">
            ${duplicateText}
          </p>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${ocrParsed?.govt_duplicate_analysis?.details || 'Database duplicate ID search.'}</span>
        </div>
      </div>

      <!-- Applicant Details vs Uploaded Documents -->
      <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-glass); margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; margin-bottom: 12px;">📁 Submitted Verification Documents</h3>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          ${govtLink ? `<a href="${govtLink}" target="_blank" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:6px;">🪪 View Govt Photo ID (${t.govt_id_path.split('.').pop().toUpperCase()})</a>` : '<span style="color:var(--danger); font-size:0.85rem;">❌ No Government ID Uploaded</span>'}
          ${certLink ? `<a href="${certLink}" target="_blank" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:6px;">📜 View Qualification Cert (${t.cert_doc_path.split('.').pop().toUpperCase()})</a>` : '<span style="color:var(--danger); font-size:0.85rem;">❌ No Certificate Uploaded</span>'}
        </div>
      </div>

      <!-- Extracted OCR Structured Data -->
      <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-glass); margin-bottom: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
          <h3 style="font-size: 1.1rem; margin: 0;">🤖 Gemini Vision OCR Analysis Output</h3>
          <button id="modal-rerun-verify-btn" class="btn btn-outline btn-sm" style="border-color:var(--primary); color:var(--primary);">🔄 Re-Run AI Scan</button>
        </div>
        <pre style="background: var(--bg-card-opaque); padding: 14px; border-radius: 8px; font-size: 0.8rem; overflow-x: auto; max-height: 250px; border: 1px solid var(--border-glass); font-family: monospace;">${ocrParsed ? JSON.stringify(ocrParsed, null, 2) : "No OCR scan data available yet. Click 'Re-Run AI Scan' above to extract document data with Gemini Vision."}</pre>
      </div>

      <!-- Human NGO Admin Final Decision -->
      <div style="border-top: 1px solid var(--border-glass); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <span style="font-size: 0.85rem; color: var(--text-muted);">Audit Status: <strong>${t.verification_status || 'PENDING'}</strong> ${t.verified_by ? `(Audited by ${t.verified_by} on ${t.verified_at})` : ''}</span>
        <div style="display: flex; gap: 12px;">
          <button id="modal-approve-btn" class="btn btn-primary btn-sm">Approve Application</button>
          <button id="modal-reject-btn" class="btn btn-outline btn-sm" style="border-color:var(--danger); color:var(--danger);">Reject Application</button>
        </div>
      </div>
    `;

    auditModal.style.display = "flex";

    // Bind modal actions
    document.getElementById("modal-rerun-verify-btn").addEventListener("click", async () => {
      const btn = document.getElementById("modal-rerun-verify-btn");
      btn.disabled = true;
      btn.textContent = "Scanning with Gemini...";
      try {
        const resp = await fetch(`${serverBase}/api/admin/trainers/${t.id}/verify`, { method: "POST" });
        const resData = await resp.json();
        if (resp.ok && resData.success) {
          if (window.GPToast) window.GPToast.success("OCR Scan Complete", "Gemini document analysis updated.");
          fetchAdminTrainers();
          openAuditModal(resData.trainer);
        } else {
          throw new Error(resData.error || "OCR scan failed.");
        }
      } catch (err) {
        if (window.GPToast) window.GPToast.error("OCR Scan Failed", err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "🔄 Re-Run AI Scan";
      }
    });

    document.getElementById("modal-approve-btn").addEventListener("click", () => {
      hideAuditModal();
      recordDecision(t.id, "APPROVE");
    });

    document.getElementById("modal-reject-btn").addEventListener("click", () => {
      hideAuditModal();
      openRejectModal(t.id);
    });
  }

  const hideAuditModal = () => {
    if (auditModal) auditModal.style.display = "none";
  };

  if (closeAuditBtn) closeAuditBtn.addEventListener("click", hideAuditModal);

  // 6. Rejection Modal Handlers
  function openRejectModal(trainerId) {
    if (!rejectModal) return;
    document.getElementById("reject-trainer-id").value = trainerId;
    document.getElementById("rejection-reason-text").value = "";
    rejectModal.style.display = "flex";
  }

  const hideRejectModal = () => {
    if (rejectModal) rejectModal.style.display = "none";
  };

  if (cancelRejectBtn) cancelRejectBtn.addEventListener("click", hideRejectModal);

  if (confirmRejectBtn) {
    confirmRejectBtn.addEventListener("click", async () => {
      const id = document.getElementById("reject-trainer-id").value;
      const reason = document.getElementById("rejection-reason-text").value.trim();

      if (!reason) {
        if (window.GPToast) window.GPToast.warning("Required", "Please provide a rejection reason.");
        return;
      }

      hideRejectModal();
      await recordDecision(id, "REJECT", reason);
    });
  }

  // 7. Record Human NGO Admin Decision Endpoint
  async function recordDecision(id, action, rejectionReason = "") {
    try {
      const serverBase = await getServerBase();
      const response = await fetch(`${serverBase}/api/admin/trainers/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action,
          verified_by: user.name || user.email || "NGO Rescuer Admin",
          rejection_reason: rejectionReason
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (window.GPToast) {
          window.GPToast.success(
            `Trainer ${action === 'APPROVE' ? 'Approved & Published' : 'Rejected'}`,
            `Application status has been updated to ${action}.`
          );
        }
        fetchAdminTrainers();
      } else {
        throw new Error(data.error || "Decision recording failed.");
      }
    } catch (err) {
      console.error(err);
      if (window.GPToast) window.GPToast.error("Action Failed", err.message);
    }
  }

  // 8. Toggle Profile Publication Visibility
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

  // 9. Delete Trainer profile
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

  // 10. Edit Details Modal Handlers
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
    if (e.target === auditModal) hideAuditModal();
    if (e.target === rejectModal) hideRejectModal();
  });

  // 11. Save Edit Modal Changes
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
