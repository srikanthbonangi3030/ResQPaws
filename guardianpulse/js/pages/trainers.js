// resQpaws Trainers Page Controller
document.addEventListener("DOMContentLoaded", async () => {
  const trainersContainer = document.getElementById("trainers-grid-container");
  const countEl = document.getElementById("results-count");
  const searchInput = document.getElementById("trainer-search-input");
  const specFilter = document.getElementById("specialization-filter");
  const locFilter = document.getElementById("location-filter");
  const searchBtn = document.getElementById("apply-filters-btn");
  
  // Profile Detail Modal elements
  const profileModal = document.getElementById("trainer-profile-modal");
  const closeProfileBtn = document.getElementById("close-profile-btn");
  
  // Enrollment Modal elements
  const enrollmentModal = document.getElementById("enrollment-modal");
  const openEnrollBtn = document.getElementById("open-enrollment-btn");
  const closeEnrollBtn = document.getElementById("close-enrollment-btn");

  let allTrainers = [];

  // 1. Fetch Trainers from Flask API
  async function fetchTrainers(search = "", spec = "", city = "") {
    if (trainersContainer) {
      trainersContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <span class="spinner" style="display:inline-block; width:24px; height:24px; margin-bottom:12px;"></span>
          <p>Querying verified trainers...</p>
        </div>
      `;
    }

    try {
      const baseUrl = window.GPApiConfig ? await window.GPApiConfig.resolveEndpoint("reports") : "";
      // Strip '/api/reports' from resolved URL to get server base
      const serverBase = baseUrl ? baseUrl.replace("/api/reports", "") : "http://127.0.0.1:8000";
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (spec) queryParams.append("specialization", spec);
      if (city) queryParams.append("city", city);

      const requestUrl = `${serverBase}/api/trainers?${queryParams.toString()}`;
      const response = await fetch(requestUrl);
      const data = await response.json();

      if (response.ok && data.success) {
        allTrainers = data.trainers;
        renderTrainers(allTrainers, serverBase);
      } else {
        throw new Error(data.error || "Failed to retrieve trainers");
      }
    } catch (err) {
      console.error("Fetch trainers error:", err);
      if (trainersContainer) {
        trainersContainer.innerHTML = `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-left: 4px solid var(--danger);">
            <span style="font-size:2rem; display:block; margin-bottom:8px;">⚠️</span>
            <h4 style="color:var(--danger); margin-bottom:4px;">Failed to Load Trainers</h4>
            <p style="color:var(--text-muted); font-size:0.9rem;">${err.message || 'The server could not be reached.'}</p>
          </div>
        `;
      }
      if (countEl) countEl.textContent = "Error loading trainers";
    }
  }

  // 2. Render Trainer Cards
  function renderTrainers(trainers, serverBase) {
    if (!trainersContainer) return;
    trainersContainer.innerHTML = "";

    if (countEl) {
      countEl.textContent = trainers.length === 1 
        ? "Found 1 verified animal trainer" 
        : `Found ${trainers.length} verified animal trainers`;
    }

    if (trainers.length === 0) {
      trainersContainer.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <span style="font-size:2rem; display:block; margin-bottom:8px;">🔍</span>
          <h4>No Trainers Found</h4>
          <p style="font-size:0.9rem; margin-top:4px;">Try modifying your search keywords or specialization filters.</p>
        </div>
      `;
      return;
    }

    trainers.forEach(t => {
      const card = document.createElement("div");
      card.className = "glass-card";
      card.style.cssText = "display: flex; flex-direction: column; height: 100%; transition: transform 0.2s ease;";
      
      const photoUrl = t.photo ? `${serverBase}/${t.photo}` : "assets/placeholder.png";

      card.innerHTML = `
        <div style="position: relative; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
          <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${t.name}">
          <span class="pet-card-badge" style="background-color: var(--primary); color: white; top: 12px; left: 12px; font-size:0.8rem; padding: 4px 10px; border-radius:20px;">
            ${t.experience} Years Exp
          </span>
        </div>
        
        <h3 style="margin-bottom: 4px; font-size: 1.25rem;">${t.name}</h3>
        <p style="color: var(--accent); font-weight: 600; font-size: 0.85rem; margin-bottom: 12px; text-transform: uppercase;">
          🐾 ${t.specialization}
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; flex-grow: 1;">
          <span>📍 <strong>Location:</strong> ${t.location}</span>
          <span>🕒 <strong>Availability:</strong> ${t.availability}</span>
          <span>🗣️ <strong>Languages:</strong> ${t.languages}</span>
        </div>
        
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height:1.5;">
          ${t.bio}
        </p>
        
        <button class="btn btn-primary btn-sm view-profile-btn" style="width: 100%; border-radius: 8px;" data-id="${t.id}">
          View Profile
        </button>
      `;

      // Event listener for view profile button
      card.querySelector(".view-profile-btn").addEventListener("click", () => {
        openProfileModal(t, photoUrl);
      });

      trainersContainer.appendChild(card);
    });
  }

  // 3. Profile Detail Modal Handlers
  function openProfileModal(t, photoUrl) {
    if (!profileModal) return;

    document.getElementById("modal-trainer-photo").src = photoUrl;
    document.getElementById("modal-trainer-name").textContent = t.name;
    document.getElementById("modal-trainer-specialization").textContent = `🐾 Specialization: ${t.specialization}`;
    document.getElementById("modal-trainer-experience").textContent = `🎓 Experience: ${t.experience} Years`;
    document.getElementById("modal-trainer-bio").textContent = t.bio;
    document.getElementById("modal-trainer-location").textContent = t.location;
    document.getElementById("modal-trainer-availability").textContent = t.availability;
    document.getElementById("modal-trainer-languages").textContent = t.languages;
    document.getElementById("modal-trainer-certifications").textContent = t.certifications || "None listed";
    
    // Wire contact links
    document.getElementById("modal-trainer-phone").textContent = t.phone;
    document.getElementById("modal-trainer-phone-link").href = `tel:${t.phone}`;
    document.getElementById("modal-trainer-email").textContent = t.email;
    document.getElementById("modal-trainer-email-link").href = `mailto:${t.email}`;

    profileModal.style.display = "flex";
  }

  if (closeProfileBtn) {
    closeProfileBtn.addEventListener("click", () => {
      profileModal.style.display = "none";
    });
  }

  // Close modals clicking outside card
  window.addEventListener("click", (e) => {
    if (e.target === profileModal) {
      profileModal.style.display = "none";
    }
    if (e.target === enrollmentModal) {
      enrollmentModal.style.display = "none";
    }
  });

  // 4. Enrollment Modal Handlers (Become a Trainer)
  if (openEnrollBtn && enrollmentModal) {
    openEnrollBtn.addEventListener("click", () => {
      enrollmentModal.style.display = "flex";
    });
  }

  if (closeEnrollBtn && enrollmentModal) {
    closeEnrollBtn.addEventListener("click", () => {
      enrollmentModal.style.display = "none";
    });
  }

  // 6. Trainer Enrollment Form Submission
  const enrollmentForm = document.getElementById("trainer-enrollment-form");
  const cancelEnrollBtn = document.getElementById("cancel-enrollment-btn");
  
  if (cancelEnrollBtn && enrollmentModal) {
    cancelEnrollBtn.addEventListener("click", () => {
      enrollmentModal.style.display = "none";
    });
  }

  if (enrollmentForm) {
    enrollmentForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById("submit-enrollment-btn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;margin-right:8px;"></span> Submitting...';
      }

      const formData = new FormData(enrollmentForm);

      try {
        const baseUrl = window.GPApiConfig ? await window.GPApiConfig.resolveEndpoint("reports") : "";
        const serverBase = baseUrl ? baseUrl.replace("/api/reports", "") : "http://127.0.0.1:8000";
        
        const response = await fetch(`${serverBase}/api/trainers/enroll`, {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (window.GPToast) {
            window.GPToast.success(
              "Application Submitted! 🎉",
              "Your application has been submitted successfully. After verification by the administrator, your profile may be published in the Animal Trainers section.",
              8000
            );
          } else {
            alert("Your application has been submitted successfully. After verification by the administrator, your profile may be published in the Animal Trainers section.");
          }

          enrollmentForm.reset();
          if (enrollmentModal) enrollmentModal.style.display = "none";
          
          fetchTrainers();
        } else {
          throw new Error(data.error || "Submission failed");
        }
      } catch (err) {
        console.error("Trainer enrollment error:", err);
        if (window.GPToast) {
          window.GPToast.error("Submission Failed", err.message || "An error occurred during enrollment.");
        } else {
          alert(`Error: ${err.message || "An error occurred during enrollment."}`);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Application";
        }
      }
    });
  }

  // 5. Search / Filter Button Listeners
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const search = searchInput ? searchInput.value.trim() : "";
      const spec = specFilter ? specFilter.value : "";
      const city = locFilter ? locFilter.value.trim() : "";
      fetchTrainers(search, spec, city);
    });
  }

  // Triggers search on Enter key inside search fields
  [searchInput, locFilter].forEach(input => {
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          searchBtn.click();
        }
      });
    }
  });

  // Fetch initial list
  fetchTrainers();
});
