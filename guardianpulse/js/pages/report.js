// Emergency Reporting Page Controller
document.addEventListener("DOMContentLoaded", async () => {
  // Wait for Auth session to load securely
  const currentUser = await window.GPAuth.waitForUser();
  if (!currentUser) {
    window.GPToast ? window.GPToast.warning("Login Required", "Please login first to report an emergency.") : alert("Please login first to report an emergency.");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
    return;
  }

  // Define location details variables
  let userLatitude = null;
  let userLongitude = null;

  // 1. Initialize coordinates selection Leaflet Map
  const mapElement = document.getElementById("report-map");
  if (mapElement) {
    window.GPMap.initMap("report-map");
    window.GPMap.enableCoordinatesPicker((lat, lng) => {
      userLatitude = lat;
      userLongitude = lng;
      document.getElementById("report-lat").value = lat.toFixed(6);
      document.getElementById("report-lng").value = lng.toFixed(6);
      document.getElementById("location-coords-display").textContent = `Coords selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    });

    // Capture User Geolocation Automatically on page load
    requestBrowserGeolocation();

    // Hook up address search fallback
    const btnAddressSearch = document.getElementById("btn-address-search");
    const inputAddressSearch = document.getElementById("map-address-search");

    if (btnAddressSearch && inputAddressSearch) {
      const performAddressSearch = async () => {
        const query = inputAddressSearch.value.trim();
        if (!query) return;

        document.getElementById("location-coords-display").textContent = "Searching address...";
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const results = await response.json();
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            userLatitude = lat;
            userLongitude = lng;
            
            document.getElementById("report-lat").value = lat.toFixed(6);
            document.getElementById("report-lng").value = lng.toFixed(6);
            document.getElementById("location-coords-display").textContent = `Coords found: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            
            // Center map and add marker
            window.GPMap.panTo(lat, lng, 14);
            if (window.GPMap.markersGroup) {
              window.GPMap.markersGroup.clearLayers();
              L.marker([lat, lng], {
                icon: window.GPMap._createMarkerIcon('#F97316', 'picker')
              }).addTo(window.GPMap.markersGroup);
            }
            if (window.GPToast) window.GPToast.success("Address found", results[0].display_name);
          } else {
            document.getElementById("location-coords-display").textContent = "Address not found. Pin manually on map.";
            if (window.GPToast) window.GPToast.warning("Search Failed", "Address could not be found. Please try picking manually.");
          }
        } catch (err) {
          console.error("Address search error:", err);
          document.getElementById("location-coords-display").textContent = "Search error. Pin manually on map.";
        }
      };

      btnAddressSearch.addEventListener("click", performAddressSearch);
      inputAddressSearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          performAddressSearch();
        }
      });
    }
  }

  function requestBrowserGeolocation() {
    if (navigator.geolocation) {
      document.getElementById("location-coords-display").textContent = "Requesting GPS Geolocation...";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          userLatitude = lat;
          userLongitude = lng;
          
          document.getElementById("report-lat").value = lat.toFixed(6);
          document.getElementById("report-lng").value = lng.toFixed(6);
          document.getElementById("location-coords-display").textContent = `GPS Captured: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Accuracy: ${Math.round(position.coords.accuracy)}m)`;
          
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
          document.getElementById("location-coords-display").textContent = "GPS permission denied. Please pick on map or search by address.";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      document.getElementById("location-coords-display").textContent = "GPS not supported. Please pick on map or search address.";
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

  // Helper to update progressive loading steps UI
  function updateProgressStep(stepId, status, textOverride = null) {
    const stepEl = document.getElementById(stepId);
    if (!stepEl) return;
    const iconEl = document.getElementById(`${stepId}-icon`);
    
    if (status === "active") {
      stepEl.style.color = "var(--primary)";
      stepEl.style.fontWeight = "600";
      if (iconEl) iconEl.textContent = "⏳";
    } else if (status === "success") {
      stepEl.style.color = "var(--text-main)";
      stepEl.style.fontWeight = "500";
      if (iconEl) iconEl.textContent = "✅";
    } else if (status === "error") {
      stepEl.style.color = "var(--danger)";
      stepEl.style.fontWeight = "600";
      if (iconEl) iconEl.textContent = "❌";
    }
    
    if (textOverride) {
      const textSpan = stepEl.querySelector("span:not([id])") || stepEl.querySelector("span");
      if (textSpan) textSpan.textContent = textOverride;
    }
  }

  // 3. Form submit handler
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
          ? window.GPToast.warning("Location Required", "Please select a location on the map or search by address first.")
          : alert("Please select a location on the map or search by address first.");
        return;
      }

      const lat = parseFloat(latVal);
      const lng = parseFloat(lngVal);

      // Show progressive loading interface
      aiProgressPanel.style.display = "block";
      document.getElementById("progressive-loading-steps").style.display = "flex";
      document.getElementById("ai-results-grid").style.display = "none";
      reportSubmitBtn.disabled = true;
      reportSubmitBtn.textContent = "Processing Emergency Dispatch...";

      const scanLaser = document.createElement("div");
      scanLaser.className = "scan-laser";
      const scannerWrapper = document.querySelector(".scanner-container");
      if (scannerWrapper && uploadContainer.style.display === "block") {
        scannerWrapper.appendChild(scanLaser);
      }
      
      const statusText = document.getElementById("ai-status-text");
      if (statusText) statusText.textContent = "Initializing emergency reporting pipeline...";

      try {
        // Step 1: Detect location
        updateProgressStep("step-location", "active");
        if (statusText) statusText.textContent = "Step 1: Fetching location accuracy parameters...";
        await new Promise(resolve => setTimeout(resolve, 100));
        updateProgressStep("step-location", "success", `Location Captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

        // Step 2: Submit report
        updateProgressStep("step-report", "active");
        if (statusText) statusText.textContent = "Step 2: Uploading emergency report to secure cloud database...";
        
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

        const endpointUrl = await window.GPApiConfig.resolveEndpoint("reports");
        const response = await fetch(endpointUrl, {
          method: "POST",
          body: formData
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to submit emergency report.");
        }

        const savedReport = result.report;
        updateProgressStep("step-report", "success", `Report Saved (Case ID: ${savedReport.id})`);

        // Step 3: Search Google Places Nearby API
        updateProgressStep("step-places", "active");
        if (statusText) statusText.textContent = "Step 3: Querying Google Places API for nearby veterinary clinics (5km -> 50km radii)...";
        
        const top5Hospitals = result.nearby_hospitals;
        const placesStatus = result.google_places_status || "OK";
        const placesError = result.google_places_error || "";

        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (placesStatus !== "OK" && placesStatus !== "OSM_FALLBACK" && placesStatus !== "ZERO_RESULTS") {
          updateProgressStep("step-places", "error", `Places API Error: ${placesStatus}`);
          updateProgressStep("step-haversine", "error", "Calculation aborted due to API failure");
          updateProgressStep("step-done", "error", "Unable to retrieve nearby veterinary hospitals.");
        } else {
          updateProgressStep("step-places", "success", `Hospitals Retrieved: Found ${top5Hospitals.length} active listings`);
          
          // Step 4: Calculate distances (Haversine sorting)
          updateProgressStep("step-haversine", "active");
          if (statusText) statusText.textContent = "Step 4: Executing Haversine distance calculations and ranking opening statuses...";
          await new Promise(resolve => setTimeout(resolve, 100));
          updateProgressStep("step-haversine", "success");

          // Step 5: Finalize
          if (top5Hospitals.length === 0) {
            updateProgressStep("step-done", "error", "No nearby veterinary hospitals were found.");
            if (statusText) statusText.textContent = "Google Places search completed. No clinics found within 50km.";
          } else {
            updateProgressStep("step-done", "success", `Found ${top5Hospitals.length} nearby veterinary hospitals.`);
            if (statusText) statusText.textContent = "Real-time clinic routing finalized successfully!";
          }
        }

        // Delay to let the user see the completed checklist
        setTimeout(() => {
          // Hide form and AI panels
          document.getElementById("report-form-panel").style.display = "none";
          document.getElementById("report-page-header").style.display = "none";

          // Configure success screen buttons and track progress target
          document.getElementById("success-track-btn").href = `track.html?id=${savedReport.id}`;

          // Populate nearby hospital cards
          const hospitalsGrid = document.getElementById("hospitals-grid");
          hospitalsGrid.innerHTML = "";

          if (placesStatus !== "OK" && placesStatus !== "OSM_FALLBACK" && placesStatus !== "ZERO_RESULTS") {
            hospitalsGrid.innerHTML = `
              <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-left: 4px solid var(--danger);">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">⚠️</span>
                <h4 style="color: var(--danger); font-size: 1.35rem; margin-bottom: 8px;">Unable to retrieve nearby veterinary hospitals.</h4>
                <p style="color: var(--text-muted); font-size: 0.95rem;">There was an error communicating with the Google Places API (Status: <strong>${placesStatus}</strong>).${placesError ? '<br>Detail: ' + placesError : ''}</p>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 12px;">Please contact our helpline at +91 98765 43210 for emergency phone assistance.</p>
              </div>
            `;
          } else if (top5Hospitals.length === 0) {
            hospitalsGrid.innerHTML = `
              <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-left: 4px solid var(--warning);">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">⚠️</span>
                <h4 style="font-size: 1.35rem; margin-bottom: 8px;">No nearby veterinary hospitals were found.</h4>
                <p style="color: var(--text-muted); font-size: 0.95rem;">No veterinary hospitals exist within 50 km of your selected coordinates on Google Maps.</p>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 12px;">Please contact our helpline at +91 98765 43210 for emergency phone assistance.</p>
              </div>
            `;
          } else {
            top5Hospitals.forEach(h => {
              const card = document.createElement("div");
              card.className = "glass-card";
              card.style.position = "relative";
              card.style.overflow = "hidden";
              card.style.display = "flex";
              card.style.flexDirection = "column";

              const stars = "⭐".repeat(Math.round(h.rating)) || "No Rating";
              const openBadgeStyle = h.open_status === "Open Now" ? "background-color: var(--success); color: white;" : "background-color: var(--danger); color: white;";
              
              const phoneBtn = h.phone_number 
                ? `<a href="tel:${h.phone_number}" class="btn btn-outline btn-sm" style="font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px;">📞 Call Hospital</a>`
                : `<button class="btn btn-outline btn-sm" style="font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px;" disabled>📞 Call Hospital</button>`;

              const websiteBtn = h.website
                ? `<a href="${h.website}" target="_blank" class="btn btn-outline btn-sm" style="font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px; border-color: var(--primary); color: var(--primary);">🌐 Website</a>`
                : "";

              card.innerHTML = `
                <img src="${h.photo_url || 'assets/hospital_exterior.jpg'}" alt="${h.name}" style="height: 180px; width: 100%; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px; margin: -24px -24px 16px -24px; display: block;">
                <div style="display: flex; flex-direction: column; flex-grow: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                    <h4 style="margin: 0; font-size: 1.25rem; font-family: var(--font-title);">${h.name}</h4>
                    <span class="badge" style="font-size: 0.75rem; border-radius: 4px; padding: 2px 6px; ${openBadgeStyle}">${h.open_status}</span>
                  </div>
                  
                  <div style="margin-bottom: 12px; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>${stars} <span style="color: var(--text-muted); font-size: 0.85rem;">(${h.user_ratings_total} reviews)</span></div>
                    <span style="color: var(--primary); font-weight: 600;">📍 ${h.distance_km} km away</span>
                  </div>
                  
                  <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">📍 ${h.address}</p>
                  <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 20px;">📞 Phone: ${h.phone_number || "Not Available"}</p>
                  
                  <div style="margin-top: auto;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                      ${phoneBtn}
                      <a href="https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${h.latitude},${h.longitude}&destination_place_id=${h.place_id}" target="_blank" class="btn btn-primary btn-sm" style="font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px;">🗺️ Get Directions</a>
                    </div>
                    <div style="display: grid; grid-template-columns: ${h.website ? '1fr 1fr' : '1fr'}; gap: 12px;">
                      ${websiteBtn}
                      <a href="${h.google_maps_url}" target="_blank" class="btn btn-outline btn-sm" style="font-size: 0.85rem; padding: 10px; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 6px; justify-content: center;">⭐ Open in Google Maps</a>
                    </div>
                  </div>
                </div>
              `;
              hospitalsGrid.appendChild(card);
            });
          }

          // Reveal success panel
          document.getElementById("report-success-panel").style.display = "block";
          document.getElementById("report-success-panel").scrollIntoView({ behavior: "smooth", block: "start" });

          // Initialize Interactive success map showing user (blue) and clinics (red)
          const successMapElement = document.getElementById("success-map");
          if (successMapElement && top5Hospitals.length > 0) {
            try {
              const successMap = L.map("success-map").setView([lat, lng], 13);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(successMap);

              // User location marker (Blue Circle Pin)
              const blueIcon = L.divIcon({
                html: `<div style="background-color: #3B82F6; border: 2.5px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">📍</div>`,
                className: 'user-location-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              });
              L.marker([lat, lng], { icon: blueIcon })
                .bindPopup("<strong>Your Incident Coordinates</strong>")
                .addTo(successMap);

              // Clinic markers (Red pins)
              const bounds = [[lat, lng]];
              top5Hospitals.forEach(h => {
                const redIcon = L.divIcon({
                  html: `<div style="background-color: #EF4444; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); color: white; font-size: 1.1rem;">🏥</div>`,
                  className: 'clinic-marker-pin',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16]
                });
                L.marker([h.latitude, h.longitude], { icon: redIcon })
                  .bindPopup(`<strong>${h.name}</strong><br>Distance: ${h.distance_km} km<br>${h.address}`)
                  .addTo(successMap);
                bounds.push([h.latitude, h.longitude]);
              });

              // Auto-adjust zoom/bounds to fit all markers nicely
              successMap.fitBounds(bounds, { padding: [40, 40] });
            } catch (mapErr) {
              console.error("Leaflet success map rendering failed:", mapErr);
            }
          }

        }, 100);

      } catch (submitErr) {
        console.error(submitErr);
        updateProgressStep("step-report", "error", "Submission Failed");
        if (window.GPToast) {
          window.GPToast.error("Submission Failed", submitErr.message || "An error occurred during submission. Please try again.");
        } else {
          alert("An error occurred saving the report. Please try again.");
        }
        reportSubmitBtn.disabled = false;
        reportSubmitBtn.textContent = "Submit Emergency Report";
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

    // Reset progress icons
    ["step-location", "step-report", "step-places", "step-haversine", "step-done"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.color = "var(--text-muted)";
        el.style.fontWeight = "500";
        const icon = document.getElementById(`${id}-icon`);
        if (icon) icon.textContent = "⚪";
      }
    });
    
    // Recapture Geolocation to ensure accuracy
    requestBrowserGeolocation();
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
});
