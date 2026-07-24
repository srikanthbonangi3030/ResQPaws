// Emergency Reporting Page Controller
document.addEventListener("DOMContentLoaded", async () => {
  // Wait for Auth session to load securely
  const currentUser = await window.GPAuth.waitForUser();
  if (!currentUser) {
    window.GPToast ? window.GPToast.warning("Login Required", "Please login first to report an emergency.") : alert("Please login first to report an emergency.");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
    return;
  }

  // 1. Initialize coordinates selection Leaflet Map
  const mapElement = document.getElementById("report-map");
  if (mapElement) {
    window.GPMap.initMap("report-map");
    window.GPMap.enableCoordinatesPicker((lat, lng) => {
      document.getElementById("report-lat").value = lat.toFixed(6);
      document.getElementById("report-lng").value = lng.toFixed(6);
      document.getElementById("location-coords-display").textContent = `Coords selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    });

    // Capture User Geolocation Automatically on page load
    if (navigator.geolocation) {
      document.getElementById("location-coords-display").textContent = "Requesting GPS Geolocation...";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          document.getElementById("report-lat").value = lat.toFixed(6);
          document.getElementById("report-lng").value = lng.toFixed(6);
          document.getElementById("location-coords-display").textContent = `Coords captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          // Center map and add marker
          window.GPMap.panTo(lat, lng, 14);
          if (window.GPMap.markersGroup) {
            window.GPMap.markersGroup.clearLayers();
            L.marker([lat, lng], {
              icon: window.GPMap._createMarkerIcon('#F97316', 'picker')
            }).addTo(window.GPMap.markersGroup);
          }
        },
        (error) => {
          console.warn("Geolocation denied or unavailable:", error.message);
          document.getElementById("location-coords-display").textContent = "GPS permission denied. Please select on map manually.";
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      document.getElementById("location-coords-display").textContent = "GPS not supported. Please select on map manually.";
    }
  }

  // 2. Image upload preview
  const imageInput = document.getElementById("report-image-input");
  const previewImg = document.getElementById("report-image-preview");
  const uploadContainer = document.getElementById("upload-preview-container");
  
  if (imageInput && previewImg) {
    imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
          uploadContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 3. Form submit & AI Assessment simulation + Backend persistence & Hospital matching
  const reportForm = document.getElementById("report-emergency-form");
  const aiProgressPanel = document.getElementById("ai-progress-panel");
  const reportSubmitBtn = document.getElementById("report-submit-btn");

  if (reportForm) {
    reportForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const animalType = document.getElementById("animal-type").value;
      const emergencyType = document.getElementById("emergency-type").value;
      const severity = document.getElementById("severity").value;
      const contactNumber = document.getElementById("contact-number").value;
      const description = document.getElementById("description").value;
      const latVal = document.getElementById("report-lat").value;
      const lngVal = document.getElementById("report-lng").value;

      if (!latVal || !lngVal) {
        window.GPToast
          ? window.GPToast.warning("Location Required", "Please click on the map to pinpoint the exact rescue coordinates.")
          : alert("Please click on the map to pinpoint the exact rescue coordinates.");
        return;
      }

      const lat = parseFloat(latVal);
      const lng = parseFloat(lngVal);

      // Show AI scanner layout
      aiProgressPanel.style.display = "block";
      reportSubmitBtn.disabled = true;
      reportSubmitBtn.textContent = "Analyzing...";
      
      const scanLaser = document.createElement("div");
      scanLaser.className = "scan-laser";
      const scannerWrapper = document.querySelector(".scanner-container");
      if (scannerWrapper) {
        scannerWrapper.appendChild(scanLaser);
      }
      
      const statusText = document.getElementById("ai-status-text");
      if (statusText) statusText.textContent = "AI-Assisted Assessment: Loading vision parameters...";

      try {
        // Trigger simulated analysis
        const assessment = await window.GPAI.analyzeIncidentDemo(animalType, description, imageInput.files[0]);
        
        if (statusText) statusText.textContent = "Vision scan complete. Mapping assessment variables...";
        
        // Render Simulated AI Results
        document.getElementById("ai-result-severity").textContent = assessment.severity;
        const badge = document.getElementById("ai-result-severity");
        badge.className = `badge badge-${assessment.severity.toLowerCase()}`;
        
        document.getElementById("ai-result-confidence").textContent = `${assessment.confidence}%`;
        document.getElementById("ai-result-injury").textContent = assessment.aiDetails.injuryDetected;
        document.getElementById("ai-result-blood").textContent = assessment.aiDetails.bloodVisible;
        document.getElementById("ai-result-mobility").textContent = assessment.aiDetails.mobilityIssue;
        document.getElementById("ai-result-distress").textContent = assessment.aiDetails.distressLevel;
        document.getElementById("ai-result-condition").textContent = assessment.aiDetails.condition;

        // Show results grid
        document.getElementById("ai-results-grid").style.display = "block";
        if (statusText) statusText.textContent = "Simulated AI Severity Assessment: Complete!";

        // Add a slight delay before saving report to Flask backend to let user view assessment results
        setTimeout(async () => {
          if (statusText) statusText.textContent = "Uploading emergency report and matching nearby clinics...";
          
          // Build Multipart Form Data to support image file uploads
          const formData = new FormData();
          formData.append("user_id", currentUser.uid);
          formData.append("contact_number", contactNumber);
          formData.append("animal_type", animalType);
          formData.append("emergency_type", emergencyType);
          formData.append("severity", severity);
          formData.append("description", description);
          formData.append("latitude", lat);
          formData.append("longitude", lng);
          if (imageInput.files[0]) {
            formData.append("image", imageInput.files[0]);
          }

          try {
            // POST request to Flask reports API
            const response = await fetch("/api/reports", {
              method: "POST",
              body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
              throw new Error(result.message || "Failed to submit emergency report.");
            }

            const savedReport = result.report;
            const top5Hospitals = result.nearby_hospitals;

            if (window.GPToast) {
              window.GPToast.success("Emergency Reported!", `Case ID: ${savedReport.id} successfully created.`, 6000);
            }

            // Hide form and AI panels
            document.getElementById("report-form-panel").style.display = "none";
            document.getElementById("report-page-header").style.display = "none";

            // Configure success screen buttons and track progress target
            document.getElementById("success-track-btn").href = `track.html?id=${savedReport.id}`;

            // Populate nearby hospital cards
            const hospitalsGrid = document.getElementById("hospitals-grid");
            hospitalsGrid.innerHTML = "";

            top5Hospitals.forEach(h => {
              const card = document.createElement("div");
              card.className = "glass-card";
              card.style.position = "relative";
              card.style.overflow = "hidden";
              card.style.display = "flex";
              card.style.flexDirection = "column";

              const stars = "⭐".repeat(Math.round(h.rating));
              const badgeClass = h.emergency_service ? "badge-critical" : "badge-low";
              const badgeText = h.emergency_service ? "🚨 24/7 Emergency Available" : "Standard Hours Only";

              card.innerHTML = `
                <img src="${h.hospital_image || 'assets/hospital_exterior.jpg'}" alt="${h.hospital_name}" style="height: 180px; width: 100%; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px; margin: -24px -24px 16px -24px; display: block;">
                <div style="display: flex; flex-direction: column; flex-grow: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                    <h4 style="margin: 0; font-size: 1.25rem; font-family: var(--font-title);">${h.hospital_name}</h4>
                    <span class="badge ${badgeClass}" style="font-size: 0.75rem; border-radius: 4px; padding: 2px 6px;">${badgeText}</span>
                  </div>
                  
                  <div style="margin-bottom: 12px; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>${stars} <span style="color: var(--text-muted); font-size: 0.85rem;">(${h.rating})</span></div>
                    <span style="color: var(--primary); font-weight: 600;">📍 ${h.distance_km} km away</span>
                  </div>
                  
                  <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">📍 ${h.address}, ${h.city}</p>
                  <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">🕒 ${h.opening_hours}</p>
                  <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 20px;">📞 Phone: ${h.phone}</p>
                  
                  <div style="margin-top: auto;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                      <a href="tel:${h.phone}" class="btn btn-outline btn-sm" style="font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px;">📞 Call Clinic</a>
                      <a href="https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}" target="_blank" class="btn btn-primary btn-sm" style="font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px;">🗺️ Directions</a>
                    </div>
                    <a href="hospital_details.html?id=${h.id}" class="btn btn-outline btn-sm" style="width: 100%; font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px; border-color: var(--primary); color: var(--primary); justify-content: center;">📄 View Details</a>
                  </div>
                </div>
              `;
              hospitalsGrid.appendChild(card);
            });

            // Reveal success panel
            const successPanel = document.getElementById("report-success-panel");
            successPanel.style.display = "block";
            successPanel.scrollIntoView({ behavior: "smooth", block: "start" });

          } catch (submitErr) {
            console.error(submitErr);
            if (window.GPToast) {
              window.GPToast.error("Submission Failed", submitErr.message || "Could not save report. Please try again.");
            } else {
              alert("An error occurred saving the report. Please try again.");
            }
            reportSubmitBtn.disabled = false;
            reportSubmitBtn.textContent = "Submit Emergency Report";
          }
        }, 2000);

      } catch (err) {
        console.error(err);
        if (window.GPToast) {
          window.GPToast.error("Assessment Failed", "An error occurred during AI assessment. Please try again.");
        } else {
          alert("An error occurred during assessment. Please try again.");
        }
        reportSubmitBtn.disabled = false;
        reportSubmitBtn.textContent = "Submit Emergency Report";
        aiProgressPanel.style.display = "none";
        if (scanLaser.parentNode) scanLaser.parentNode.removeChild(scanLaser);
      }
    });
  }

  // Allow user to submit another report without reloading
  window.reportAnotherEmergency = function() {
    document.getElementById("report-success-panel").style.display = "none";
    document.getElementById("report-form-panel").style.display = "block";
    document.getElementById("report-page-header").style.display = "block";
    
    reportForm.reset();
    if (uploadContainer) uploadContainer.style.display = "none";
    if (aiProgressPanel) aiProgressPanel.style.display = "none";
    if (reportSubmitBtn) {
      reportSubmitBtn.disabled = false;
      reportSubmitBtn.textContent = "Submit Emergency Report";
    }
    const resultsGrid = document.getElementById("ai-results-grid");
    if (resultsGrid) resultsGrid.style.display = "none";
    
    // Recapture Geolocation to ensure accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        document.getElementById("report-lat").value = lat.toFixed(6);
        document.getElementById("report-lng").value = lng.toFixed(6);
        document.getElementById("location-coords-display").textContent = `Coords captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        window.GPMap.panTo(lat, lng, 14);
        if (window.GPMap.markersGroup) {
          window.GPMap.markersGroup.clearLayers();
          L.marker([lat, lng], {
            icon: window.GPMap._createMarkerIcon('#F97316', 'picker')
          }).addTo(window.GPMap.markersGroup);
        }
      });
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
});
