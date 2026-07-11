// Rescue Tracking Page Controller
document.addEventListener("DOMContentLoaded", async () => {
  // Extract report tracking ID from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get("id");

  const searchContainer = document.getElementById("track-search-container");
  const trackContent = document.getElementById("track-content-panel");
  const notFoundPanel = document.getElementById("track-notfound-panel");

  if (!reportId) {
    // Show manual search box if no ID is passed in the URL
    if (searchContainer) searchContainer.style.display = "block";
    if (trackContent) trackContent.style.display = "none";
    
    const searchForm = document.getElementById("manual-track-form");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchInput = document.getElementById("manual-track-input").value.trim();
        if (searchInput) {
          window.location.search = `?id=${searchInput}`;
        }
      });
    }
    return;
  }

  // Load report data
  try {
    const report = await window.GPDB.getReportById(reportId);
    if (!report) {
      if (searchContainer) searchContainer.style.display = "none";
      if (trackContent) trackContent.style.display = "none";
      if (notFoundPanel) notFoundPanel.style.display = "block";
      document.getElementById("notfound-id-text").textContent = reportId;
      return;
    }

    // Hide search and show content panel
    if (searchContainer) searchContainer.style.display = "none";
    if (trackContent) trackContent.style.display = "block";

    // Populate Report Details
    document.getElementById("track-id-header").textContent = report.id;
    document.getElementById("track-animal-type").textContent = report.animalType;
    document.getElementById("track-date").textContent = new Date(report.createdDate).toLocaleString();
    document.getElementById("track-location").textContent = report.locationName;
    document.getElementById("track-description").textContent = report.description;
    
    const imageEl = document.getElementById("track-image");
    if (imageEl) imageEl.src = report.imageUrl || "assets/placeholder.png";

    // AI summary details
    if (report.aiDetails) {
      document.getElementById("track-ai-severity").textContent = report.severity;
      document.getElementById("track-ai-severity").className = `badge badge-${report.severity.toLowerCase()}`;
      document.getElementById("track-ai-confidence").textContent = `${report.confidence}%`;
      document.getElementById("track-ai-injury").textContent = report.aiDetails.injuryDetected || "No";
      document.getElementById("track-ai-blood").textContent = report.aiDetails.bloodVisible || "No";
      document.getElementById("track-ai-mobility").textContent = report.aiDetails.mobilityIssue || "Normal";
      document.getElementById("track-ai-distress").textContent = report.aiDetails.distressLevel || "Low";
    }

    // Load Assigned NGO Details
    const ngoDetailsContainer = document.getElementById("assigned-ngo-details");
    if (report.assignedNgoId) {
      const ngos = await window.GPDB.getNgos();
      const assignedNgo = ngos.find(n => n.id === report.assignedNgoId);
      if (assignedNgo && ngoDetailsContainer) {
        ngoDetailsContainer.innerHTML = `
          <div class="glass-card no-lift">
            <h3 style="margin-bottom: 8px;">Secured by NGO</h3>
            <h4 style="color:var(--primary); margin-bottom: 4px;">${assignedNgo.name}</h4>
            <p style="font-size:0.9rem; color:var(--text-muted);">Phone: ${assignedNgo.phone}</p>
            <p style="font-size:0.9rem; color:var(--text-muted);">Email: ${assignedNgo.email}</p>
          </div>
        `;
      }
    } else if (ngoDetailsContainer) {
      ngoDetailsContainer.innerHTML = `
        <div class="glass-card no-lift" style="text-align: center; border-style: dashed;">
          <p style="color:var(--text-muted);">Under Review. Waiting for a nearby NGO to accept the rescue.</p>
        </div>
      `;
    }

    // Set timeline progression states
    const statusWorkflow = ["Reported", "Under Review", "Accepted", "Team Dispatched", "Animal Rescued", "Treatment Ongoing", "Recovered"];
    const currentStatusIdx = statusWorkflow.indexOf(report.status);

    const timelineSteps = document.querySelectorAll(".timeline-step");
    timelineSteps.forEach(step => {
      const stepStatus = step.getAttribute("data-status");
      const stepIdx = statusWorkflow.indexOf(stepStatus);

      if (stepIdx === currentStatusIdx) {
        step.classList.add("active");
        step.classList.remove("completed");
      } else if (stepIdx < currentStatusIdx) {
        step.classList.add("completed");
        step.classList.remove("active");
      } else {
        step.classList.remove("active", "completed");
      }
    });

    // NGO-Admin quick updates panel
    const currentUser = window.GPAuth.getCurrentUser();
    const ngoControls = document.getElementById("ngo-track-controls");
    
    if (ngoControls) {
      if (currentUser && currentUser.role === 'ngo' && report.assignedNgoId === currentUser.uid) {
        ngoControls.style.display = "block";
        const selectEl = document.getElementById("ngo-status-select");
        if (selectEl) {
          selectEl.value = report.status;
          
          document.getElementById("ngo-update-status-btn").onclick = async () => {
            const newStatus = selectEl.value;
            await window.GPDB.updateRescueStatus(report.id, newStatus, currentUser.uid);
            alert("Rescue status updated successfully!");
            window.location.reload();
          };
        }
      } else {
        ngoControls.style.display = "none";
      }
    }

    // Initialize Map tracking
    window.GPMap.initMap("track-map", [report.lat, report.lng], 14);
    window.GPMap.addEmergencyMarker(report);

    // If NGO coordinates are known, plot the NGO and draw map boundaries
    if (report.assignedNgoId) {
      const ngos = await window.GPDB.getNgos();
      const assignedNgo = ngos.find(n => n.id === report.assignedNgoId);
      if (assignedNgo && assignedNgo.location) {
        window.GPMap.addNgoMarker(assignedNgo);
        // Draw travel path line between animal and NGO on Leaflet
        const map = window.GPMap.mapInstance;
        if (map) {
          const latlngs = [
            [report.lat, report.lng],
            [assignedNgo.location.lat, assignedNgo.location.lng]
          ];
          L.polyline(latlngs, {color: '#16A34A', dashArray: '5, 10'}).addTo(map);
        }
      }
    }

  } catch (err) {
    console.error("Tracking rendering failure:", err);
  }
});
