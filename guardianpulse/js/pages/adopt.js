// resQpaws Adoption Page Logic

document.addEventListener("DOMContentLoaded", () => {
  const gridContainer = document.getElementById("pets-grid-container");
  const resultsCount = document.getElementById("results-count");
  const filterCheckboxes = document.querySelectorAll(".filter-cb");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  const sortSelect = document.getElementById("sort-select");

  let allPets = [];
  let currentFilters = {
    species: ["Dog", "Cat", "Other"],
    age: [],
    size: []
  };
  let quizCompleted = false;

  // --- 1. Fetch & Render Pets ---
  async function loadPets() {
    // Show skeleton while loading
    if (gridContainer) {
      gridContainer.innerHTML = Array(6).fill(`<div class="skeleton skeleton-card"></div>`).join("");
    }
    try {
      allPets = await GPDB.getAdoptions();
      applyFilters();
    } catch (err) {
      console.error("Error loading adoptions:", err);
      if (gridContainer) {
        gridContainer.innerHTML = `<div class="section-error" style="grid-column:1/-1;">⚠️ Failed to load pets. Please try again later.</div>`;
      }
      if (window.GPToast) window.GPToast.error("Load Failed", "Could not fetch adoption listings.");
    }
  }

  function renderPets(petsToRender) {
    gridContainer.innerHTML = "";
    
    if (petsToRender.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px;">
        <h3>No matches found</h3>
        <p style="color:var(--text-muted)">Try adjusting your filters to see more animals.</p>
      </div>`;
      resultsCount.textContent = `0 pets found`;
      return;
    }

    resultsCount.textContent = `Showing ${petsToRender.length} pets`;

    petsToRender.forEach(pet => {
      const card = document.createElement("div");
      card.className = "glass-card pet-card";
      card.onclick = () => openProfileModal(pet);
      
      const tagsHtml = (pet.traits || []).slice(0,2).map(t => `<span class="pet-tag">${t}</span>`).join('');
      
      let badgeHtml = `<div class="pet-card-badge">${pet.status || 'Available'}</div>`;
      if (quizCompleted && pet.matchScore !== undefined) {
        let badgeClass = "low-match";
        if (pet.matchScore >= 80) badgeClass = "high-match";
        else if (pet.matchScore >= 60) badgeClass = "medium-match";
        
        badgeHtml = `<div class="match-badge ${badgeClass}">🔥 ${pet.matchScore}% Match</div>`;
      }

      card.innerHTML = `
        <div class="pet-card-img-container">
          ${badgeHtml}
          <img class="pet-card-img" src="${pet.photo || 'assets/placeholder.png'}" alt="${pet.name}" loading="lazy">
        </div>
        <div class="pet-card-content">
          <h3 class="pet-name">${pet.name}</h3>
          <p class="pet-breed">${pet.breed} • ${pet.gender}</p>
          <div class="pet-tags">${tagsHtml}</div>
          <div class="pet-card-footer">
            <span style="font-size: 0.85rem; color: var(--text-muted);">📍 ${pet.location}</span>
            <span style="font-size: 0.85rem; font-weight: 600;">${pet.age}</span>
          </div>
        </div>
      `;
      gridContainer.appendChild(card);
    });
  }

  // --- 2. Filtering Logic ---
  function updateFilterState() {
    currentFilters = { species: [], age: [], size: [] };
    filterCheckboxes.forEach(cb => {
      if (cb.checked) {
        currentFilters[cb.dataset.filter].push(cb.value);
      }
    });
    applyFilters();
  }

  function applyFilters() {
    let filtered = allPets.filter(pet => {
      // Species match
      if (currentFilters.species.length > 0 && !currentFilters.species.includes(pet.species) && !(pet.species !== 'Dog' && pet.species !== 'Cat' && currentFilters.species.includes('Other'))) {
        return false;
      }
      
      // Age group match (simplified text matching for demo)
      if (currentFilters.age.length > 0) {
        const isBaby = pet.age.toLowerCase().includes('month');
        const isSenior = pet.age.toLowerCase().includes('7') || pet.age.toLowerCase().includes('8') || pet.age.toLowerCase().includes('10');
        const isAdult = !isBaby && !isSenior && (pet.age.toLowerCase().includes('year') || pet.age.toLowerCase().includes('yr'));
        
        let ageMatched = false;
        if (currentFilters.age.includes('Baby') && isBaby) ageMatched = true;
        if (currentFilters.age.includes('Adult') && isAdult) ageMatched = true;
        if (currentFilters.age.includes('Senior') && isSenior) ageMatched = true;
        
        if (!ageMatched) return false;
      }

      // Size match
      if (currentFilters.size.length > 0 && pet.size && !currentFilters.size.includes(pet.size)) {
        return false;
      }

      return true;
    });

    // Sorting
    if (quizCompleted) {
      filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortSelect.value === 'newest') {
      filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else {
      filtered.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
    }

    renderPets(filtered);
  }

  filterCheckboxes.forEach(cb => cb.addEventListener("change", updateFilterState));
  sortSelect.addEventListener("change", applyFilters);
  resetFiltersBtn.addEventListener("click", () => {
    filterCheckboxes.forEach(cb => cb.checked = false);
    updateFilterState();
  });

  // --- 3. Profile Modal Logic ---
  const profileModal = document.getElementById("profile-modal");
  const closeProfileBtn = document.getElementById("close-profile-btn");
  let currentSelectedPet = null;

  function openProfileModal(pet) {
    currentSelectedPet = pet;
    document.getElementById("modal-pet-img").src = pet.photo || 'assets/placeholder.png';
    document.getElementById("modal-pet-name").textContent = pet.name;
    document.getElementById("modal-pet-breed").textContent = `${pet.breed} • ${pet.gender}`;
    document.getElementById("modal-pet-age").textContent = pet.age;
    document.getElementById("modal-pet-gender").textContent = pet.gender;
    document.getElementById("modal-pet-size").textContent = pet.size || '--';
    document.getElementById("modal-pet-location").textContent = pet.location;
    document.getElementById("modal-pet-story").textContent = pet.story || "No story provided yet.";
    document.getElementById("modal-pet-vaxxed").textContent = pet.vaccinated ? "Yes" : "No";
    document.getElementById("modal-pet-spayed").textContent = pet.spayed ? "Yes" : "No";
    document.getElementById("modal-pet-health").textContent = pet.healthStatus || "Healthy";
    
    document.getElementById("modal-pet-traits").innerHTML = (pet.traits || []).map(t => `<span class="pet-tag">${t}</span>`).join('');
    
    profileModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeProfileBtn.addEventListener("click", () => {
    profileModal.classList.remove("active");
    document.body.style.overflow = "";
  });

  // --- 4. Application Multi-step Modal ---
  const appModal = document.getElementById("application-modal");
  const closeAppBtn = document.getElementById("close-app-btn");
  const startAppBtn = document.getElementById("start-application-btn");
  const appForm = document.getElementById("adoption-form");

  startAppBtn.addEventListener("click", async () => {
    // Check auth
    const user = await GPAuth.waitForUser();
    if (!user) {
      if (window.GPToast) {
        window.GPToast.warning("Login Required", "Please login to apply for adoption.");
      }
      setTimeout(() => { window.location.href = `login.html?redirect=adopt.html`; }, 1800);
      return;
    }

    // Prefill user data if possible
    document.getElementById("app-name").value = user.displayName || "";
    document.getElementById("app-email").value = user.email || "";

    profileModal.classList.remove("active");
    appModal.classList.add("active");
    document.getElementById("app-pet-name").textContent = currentSelectedPet.name;
    goToStep(1);
  });

  closeAppBtn.addEventListener("click", () => {
    appModal.classList.remove("active");
    document.body.style.overflow = "";
  });

  // Step Navigation
  const nextBtns = document.querySelectorAll(".next-step-btn");
  const prevBtns = document.querySelectorAll(".prev-step-btn");

  function goToStep(stepNum) {
    document.querySelectorAll(".step-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".step-dot").forEach((d, i) => {
      if (i + 1 < stepNum) {
        d.classList.add("completed");
        d.classList.remove("active");
      } else if (i + 1 === stepNum) {
        d.classList.add("active");
        d.classList.remove("completed");
      } else {
        d.classList.remove("active", "completed");
      }
    });
    document.getElementById(`step-pane-${stepNum}`).classList.add("active");
  }

  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = parseInt(btn.dataset.target);
      // Basic validation for current pane
      const currentPane = btn.closest(".step-pane");
      const inputs = currentPane.querySelectorAll("input[required], select[required]");
      let isValid = true;
      inputs.forEach(inp => { if (!inp.value) isValid = false; });
      
      if (isValid) {
        goToStep(target);
      } else {
        if (window.GPToast) {
          window.GPToast.warning("Required Fields", "Please fill in all required fields.");
        } else {
          alert("Please fill in all required fields.");
        }
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      goToStep(parseInt(btn.dataset.target));
    });
  });

  // Submit
  appForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("app-submit-btn");
    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    const user = await GPAuth.getCurrentUser();

    const appData = {
      animalId: currentSelectedPet.id,
      animalName: currentSelectedPet.name,
      applicantName: document.getElementById("app-name").value,
      phone: document.getElementById("app-phone").value,
      email: document.getElementById("app-email").value,
      address: document.getElementById("app-address").value,
      housing: document.getElementById("app-housing").value,
      ownRent: document.getElementById("app-ownrent").value,
      household: document.getElementById("app-household").value,
      otherPets: document.getElementById("app-otherpets").value,
      reason: document.getElementById("app-reason").value,
      status: "Under Review"
    };

    try {
      await GPDB.submitAdoptionApplication(user.uid, appData);
      appModal.classList.remove("active");
      document.body.style.overflow = "";
      if (window.GPToast) {
        window.GPToast.success(
          "Application Submitted! 🐾",
          `Your application for ${currentSelectedPet.name} is now under review.`,
          6000
        );
      }
      appForm.reset();
      goToStep(1);
    } catch (err) {
      console.error(err);
      if (window.GPToast) {
        window.GPToast.error("Submission Failed", "Please try again.");
      } else {
        alert("Failed to submit application. Please try again.");
      }
    } finally {
      submitBtn.textContent = "Submit Application";
      submitBtn.disabled = false;
    }
  });

  // --- 5. Smart Match Quiz Logic ---
  const quizModal = document.getElementById("quiz-modal");
  const takeQuizBtn = document.getElementById("take-quiz-btn");
  const closeQuizBtn = document.getElementById("close-quiz-btn");
  const quizForm = document.getElementById("quiz-form");
  
  if (takeQuizBtn) {
    takeQuizBtn.addEventListener("click", () => {
      quizModal.classList.add("active");
      document.body.style.overflow = "hidden";
      goToQuizStep(1);
    });
  }

  if (closeQuizBtn) {
    closeQuizBtn.addEventListener("click", () => {
      quizModal.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  function goToQuizStep(stepNum) {
    document.querySelectorAll("#quiz-form .step-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll("#quiz-modal .step-dot").forEach((d, i) => {
      if (i + 1 < stepNum) {
        d.classList.add("completed");
        d.classList.remove("active");
      } else if (i + 1 === stepNum) {
        d.classList.add("active");
        d.classList.remove("completed");
      } else {
        d.classList.remove("active", "completed");
      }
    });
    document.getElementById(`quiz-step-pane-${stepNum}`).classList.add("active");
  }

  document.querySelectorAll(".quiz-next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const currentPane = btn.closest(".step-pane");
      const checked = currentPane.querySelector("input[type='radio']:checked");
      if (checked) {
        goToQuizStep(parseInt(btn.dataset.target));
      } else {
        if (window.GPToast) {
          window.GPToast.warning("Selection Required", "Please select an option to proceed.");
        } else {
          alert("Please select an option to proceed.");
        }
      }
    });
  });

  document.querySelectorAll(".quiz-prev-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      goToQuizStep(parseInt(btn.dataset.target));
    });
  });

  if (quizForm) {
    quizForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const formData = new FormData(quizForm);
      const housing = formData.get("quiz_housing");
      const activity = formData.get("quiz_activity");
      const experience = formData.get("quiz_experience");
      const children = formData.get("quiz_children");
      
      // Calculate scores
      allPets.forEach(pet => {
        let score = 80; // Base score
        const traits = (pet.traits || []).map(t => t.toLowerCase());
        
        // 1. Housing Logic
        if (housing === "Apartment" && pet.size === "Large") score -= 20;
        if (housing === "Apartment" && traits.includes("high energy")) score -= 15;
        if (housing === "Apartment" && pet.size === "Small") score += 10;
        if (housing === "House" && pet.size === "Large") score += 10;
        
        // 2. Activity Logic
        if (activity === "Low" && traits.includes("high energy")) score -= 25;
        if (activity === "Low" && traits.includes("calm")) score += 15;
        if (activity === "Low" && pet.age === "Senior") score += 10;
        if (activity === "High" && traits.includes("high energy")) score += 15;
        if (activity === "High" && pet.age === "Senior") score -= 10;
        
        // 3. Experience Logic
        if (experience === "FirstTime" && traits.includes("needs training")) score -= 20;
        if (experience === "FirstTime" && traits.includes("friendly")) score += 10;
        
        // 4. Children Logic
        if (children === "Yes" && traits.includes("good with kids")) score += 15;
        if (children === "Yes" && traits.includes("not good with kids")) score -= 40;
        
        // Normalize score 0-100
        pet.matchScore = Math.max(10, Math.min(100, score));
      });
      
      quizCompleted = true;
      quizModal.classList.remove("active");
      document.body.style.overflow = "";
      
      // Force "All" filters to show best matches across the board
      filterCheckboxes.forEach(cb => cb.checked = true);
      updateFilterState();
      
      if (window.GPToast) {
        window.GPToast.success("Matches Ready! 🎯", "We've ranked pets by compatibility with your lifestyle.");
      }
      
      // Scroll to results
      document.getElementById("pets-grid-container").scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // --- Init ---
  loadPets();
});
