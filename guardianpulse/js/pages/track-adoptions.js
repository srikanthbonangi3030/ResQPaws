(async function initTrackAdoptions() {
  const user = await window.GPAuth.waitForUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  async function loadUserAdoptions() {
    const tbody = document.getElementById("user-adoptions-list-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const apps = await window.GPDB.getUserAdoptionApplications(user.uid);
    if (apps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">You have not applied for any adoptions yet.</td></tr>`;
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
        <td><strong>${app.animalName}</strong></td>
        <td>${date}</td>
        <td><span class="badge ${statusBadge}">${app.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="alert('Contact the NGO at emergency@resqpaws.org for detailed follow-up.')">Contact NGO</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  await loadUserAdoptions();
})();
