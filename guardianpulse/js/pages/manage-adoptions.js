(async function initManageAdoptions() {
  const user = await window.GPAuth.waitForUser();

  if (!user || user.role !== "ngo") {
    alert("Unauthorized. Only NGOs can manage adoptions.");
    window.location.href = "index.html";
    return;
  }

  async function loadNgoAdoptions() {
    const tbody = document.getElementById("ngo-adoptions-list-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const apps = await window.GPDB.getAllAdoptionApplications();
    if (apps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No adoption applications received yet.</td></tr>`;
      return;
    }
    
    apps.forEach(app => {
      const tr = document.createElement("tr");
      const date = new Date(app.dateSubmitted).toLocaleDateString();
      
      let statusBadge = "status-review";
      if (app.status === "Approved") statusBadge = "status-rescued";
      if (app.status === "Rejected") statusBadge = "status-dispatched";
      if (app.status === "Meet & Greet Scheduled") statusBadge = "status-accepted";

      tr.innerHTML = `
        <td><strong>${app.applicantName}</strong><br><small style="color:var(--text-muted)">${app.email}</small></td>
        <td>${app.animalName}</td>
        <td>${date}</td>
        <td><span class="badge ${statusBadge}">${app.status}</span></td>
        <td>
          <select class="form-control app-status-select" style="padding:4px 8px; font-size:0.8rem; margin-bottom:4px; min-width: 130px;">
            <option value="Under Review" ${app.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
            <option value="Meet & Greet Scheduled" ${app.status === 'Meet & Greet Scheduled' ? 'selected' : ''}>Meet & Greet Scheduled</option>
            <option value="Approved" ${app.status === 'Approved' ? 'selected' : ''}>Approved</option>
            <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
          <button class="btn btn-primary btn-sm update-app-btn" data-id="${app.id}" data-applicant="${app.userId}" style="padding:4px 12px;">Update</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".update-app-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const appId = e.target.getAttribute("data-id");
        const applicantId = e.target.getAttribute("data-applicant");
        const select = e.target.closest("td").querySelector(".app-status-select");
        const newStatus = select.value;
        
        e.target.disabled = true;
        e.target.textContent = "...";
        
        try {
          await window.GPDB.updateApplicationStatus(appId, newStatus, null, applicantId);
          window.GPUI && window.GPUI.showToast("Application status updated!");
          await loadNgoAdoptions();
        } catch (err) {
          console.error(err);
          alert("Failed to update status.");
          e.target.disabled = false;
          e.target.textContent = "Update";
        }
      });
    });
  }

  await loadNgoAdoptions();
})();
