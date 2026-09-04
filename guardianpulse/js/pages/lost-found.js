// Lost and Found Module Controller
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.GPAuth.getCurrentUser();
  
  // Tab selector wiring
  const lostTabBtn = document.getElementById("tab-lost-btn");
  const foundTabBtn = document.getElementById("tab-found-btn");
  const postTabBtn = document.getElementById("tab-post-btn");

  const lostSection = document.getElementById("lost-animals-section");
  const foundSection = document.getElementById("found-animals-section");
  const postSection = document.getElementById("post-listing-section");

  if (lostTabBtn && foundTabBtn && postTabBtn) {
    const switchTab = (activeBtn, activeSection) => {
      [lostTabBtn, foundTabBtn, postTabBtn].forEach(btn => btn.classList.remove("active"));
      [lostSection, foundSection, postSection].forEach(sec => sec.style.display = "none");

      activeBtn.classList.add("active");
      activeSection.style.display = "block";
    };

    lostTabBtn.addEventListener("click", () => switchTab(lostTabBtn, lostSection));
    foundTabBtn.addEventListener("click", () => switchTab(foundTabBtn, foundSection));
    postTabBtn.addEventListener("click", () => {
      const activeUser = window.GPAuth.getCurrentUser();
      if (!activeUser) {
        window.GPToast
          ? window.GPToast.warning("Login Required", "You must be logged in to submit a Lost & Found listing.")
          : alert("You must be logged in to submit a Lost & Found listing.");
        return;
      }
      switchTab(postTabBtn, postSection);
    });
  }

  // Handle post image preview
  const lfImageInput = document.getElementById("lf-image-input");
  const lfPreviewImg = document.getElementById("lf-image-preview");
  
  if (lfImageInput && lfPreviewImg) {
    lfImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          lfPreviewImg.src = event.target.result;
          lfPreviewImg.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle submission form
  const lfForm = document.getElementById("lf-submit-form");
  const lfSubmitBtn = lfForm ? lfForm.querySelector("button[type='submit']") : null;

  if (lfForm) {
    lfForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const activeUser = window.GPAuth.getCurrentUser();
      if (!activeUser) {
        window.GPToast
          ? window.GPToast.warning("Login Required", "Please login to submit posts.")
          : alert("Please login to submit posts.");
        return;
      }

      const type = document.getElementById("lf-type").value;
      const animalType = document.getElementById("lf-animal-type").value;
      const location = document.getElementById("lf-location").value;
      const contact = document.getElementById("lf-contact").value;
      const keywords = document.getElementById("lf-keywords").value;
      const description = document.getElementById("lf-description").value;

      // Loading state
      if (lfSubmitBtn) {
        lfSubmitBtn.disabled = true;
        lfSubmitBtn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;margin-right:8px;"></span> Posting...';
      }

      const recordData = {
        userId: activeUser ? (activeUser.uid || activeUser.id || 'user-1') : 'user-1',
        userName: activeUser ? (activeUser.name || activeUser.displayName || activeUser.email || 'Anonymous') : 'Anonymous',
        type: type,
        animalType: animalType,
        location: location,
        contact: contact,
        keywords: keywords,
        description: description,
        imageUrl: (lfPreviewImg && lfPreviewImg.src && lfPreviewImg.src.length > 5 && !lfPreviewImg.src.endsWith("lost-found.html")) ? lfPreviewImg.src : "assets/placeholder.png"
      };

      try {
        if (!window.GPDB) {
          throw new Error("Database module not loaded. Please hard-refresh your browser page (Ctrl+F5 or Cmd+Shift+R).");
        }
        const newRecord = await window.GPDB.submitLostFound(recordData);
        
        // ✅ Toast instead of alert
        if (window.GPToast) {
          window.GPToast.success(
            "Post Published!",
            `Your ${type} animal post has been uploaded and is now visible to others.`
          );
        }
        
        lfForm.reset();
        if (lfPreviewImg) lfPreviewImg.style.display = "none";
        
        // Switch to the appropriate gallery tab (real-time list will have already updated)
        if (type === "Lost") {
          lostTabBtn && lostTabBtn.click();
        } else {
          foundTabBtn && foundTabBtn.click();
        }
      } catch (err) {
        console.error(err);
        if (window.GPToast) {
          window.GPToast.error("Submission Failed", err.message || "Please try again.");
        } else {
          alert("Submission failed. Try again.");
        }
      } finally {
        if (lfSubmitBtn) {
          lfSubmitBtn.disabled = false;
          lfSubmitBtn.innerHTML = "Submit Post";
        }
      }
    });
  }

  // Loads listings grids and triggers match comparisons
  function renderLostFoundLists(allRecords) {
    const listContainerLost = document.getElementById("lost-grid-container");
    const listContainerFound = document.getElementById("found-grid-container");
    
    if (!listContainerLost || !listContainerFound) return;
    if (!Array.isArray(allRecords)) allRecords = [];

    const lostList = allRecords.filter(r => r.type === "Lost");
    const foundList = allRecords.filter(r => r.type === "Found");

    const renderCard = (record) => {
      // Calculate possible matches
      const matches = (window.GPDB && window.GPDB.findMatchesForRecord) ? window.GPDB.findMatchesForRecord(record, allRecords) : [];
      let matchButtonHtml = '';
      if (matches.length > 0) {
        matchButtonHtml = `
          <button class="btn btn-primary btn-sm" onclick="showMatchesModal('${record.id}')" style="margin-top: 10px; width: 100%;">
            🎯 ${matches.length} Match(es) Found
          </button>
        `;
      }

      return `
        <div class="glass-card lf-card">
          <div style="position: relative;">
            <img src="${record.imageUrl || 'assets/placeholder.png'}" alt="${record.animalType}" class="lf-card-img">
            <span class="badge ${record.type === 'Lost' ? 'badge-danger' : 'badge-success'}" style="position: absolute; top: 12px; right: 12px;">
              ${record.type}
            </span>
          </div>
          <div style="padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h3 style="font-size: 1.1rem; font-weight: 600;">${record.animalType}</h3>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${record.date || ''}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">📍 ${record.location || 'Unknown'}</p>
            <p style="font-size: 0.9rem; margin-bottom: 12px; line-clamp: 2; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;">
              ${record.description || ''}
            </p>
            <div style="font-size: 0.85rem; font-weight: 500; color: var(--accent-color);">
              📞 ${record.contact || 'N/A'} (${record.userName || 'Anonymous'})
            </div>
            ${matchButtonHtml}
          </div>
        </div>
      `;
    };

    if (lostList.length === 0) {
      listContainerLost.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No lost animals reported yet.</div>`;
    } else {
      listContainerLost.innerHTML = lostList.map(renderCard).join('');
    }

    if (foundList.length === 0) {
      listContainerFound.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No found animals reported yet.</div>`;
    } else {
      listContainerFound.innerHTML = foundList.map(renderCard).join('');
    }
  }

  // Skeleton loading state while data loads
  const skeletonHtml = Array(3).fill(`
    <div class="glass-card" style="height: 320px; animation: pulse 1.5s infinite;"></div>
  `).join('');
  
  const listContainerLost = document.getElementById("lost-grid-container");
  const listContainerFound = document.getElementById("found-grid-container");

  if (listContainerLost) listContainerLost.innerHTML = skeletonHtml;
  if (listContainerFound) listContainerFound.innerHTML = skeletonHtml;

  // Subscribe to live updates
  if (!window.GuardianPulse || window.GuardianPulse.isDemoMode || !window.GuardianPulse.firestore) {
    // Demo mode or offline fallback: listen to custom event
    const fireList = async () => {
      try {
        if (!window.GPDB) return;
        const allRecords = await window.GPDB.getLostFound();
        renderLostFoundLists(allRecords);
      } catch (err) {
        console.error("Listing load failure:", err);
        const errHtml = `<div class="section-error" style="grid-column:1/-1;">⚠️ Failed to load listings. Please refresh.</div>`;
        if (listContainerLost) listContainerLost.innerHTML = errHtml;
        if (listContainerFound) listContainerFound.innerHTML = errHtml;
      }
    };
    fireList();
    window.addEventListener("gp-lostfound-updated", fireList);
  } else {
    // Firebase mode: use onSnapshot
    try {
      window.GuardianPulse.firestore.collection("lostfound").onSnapshot((snapshot) => {
        const allRecords = [];
        snapshot.forEach(doc => allRecords.push(doc.data()));
        renderLostFoundLists(allRecords);
      }, async (err) => {
        console.error("Lost Found snapshot error:", err);
        if (window.GPDB) {
          const allRecords = await window.GPDB.getLostFound();
          renderLostFoundLists(allRecords);
        }
      });
    } catch (err) {
      console.error("Firebase snapshot setup failed:", err);
      if (window.GPDB) {
        window.GPDB.getLostFound().then(renderLostFoundLists).catch(() => {});
      }
    }
  }

  // Modal setup to represent match scores
  window.showMatchesModal = async function(recordId) {
    const allRecords = await window.GPDB.getLostFound();
    const record = allRecords.find(r => r.id === recordId);
    if (!record) return;

    const matches = window.GPDB.findMatchesForRecord(record, allRecords);
    
    // Inject dynamic Modal HTML
    let modalEl = document.getElementById("lost-found-matches-modal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "lost-found-matches-modal";
      modalEl.style.position = "fixed";
      modalEl.style.top = "0";
      modalEl.style.left = "0";
      modalEl.style.width = "100%";
      modalEl.style.height = "100%";
      modalEl.style.backgroundColor = "rgba(0,0,0,0.6)";
      modalEl.style.zIndex = "2000";
      modalEl.style.display = "flex";
      modalEl.style.alignItems = "center";
      modalEl.style.justifyContent = "center";
      modalEl.style.padding = "20px";
      document.body.appendChild(modalEl);
    }

    let matchCardsHtml = matches.map(m => `
      <div style="background-color: var(--bg-card-opaque); border: 1px solid var(--border-card); padding: 16px; border-radius: 12px; margin-bottom: 12px; display: flex; gap: 16px; align-items: start;">
        <img src="${m.item.imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">
        <div style="flex-grow: 1;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <h4 style="margin: 0;">${m.item.animalType}</h4>
            <span class="match-percentage" style="font-weight:800; font-size:1.1rem; color:var(--primary);">${m.matchPercentage}% MATCH</span>
          </div>
          <p style="font-size:0.85rem; color:var(--accent); font-weight:600; margin-bottom: 4px;">📍 ${m.item.location}</p>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom: 8px;">${m.item.description}</p>
          <div style="font-size:0.8rem; background-color:rgba(var(--primary-rgb), 0.05); padding: 6px 12px; border-radius: 6px; color: var(--text-main);">
            <strong>Reasoning:</strong> ${m.reasons.join(", ")}
          </div>
          <div style="margin-top: 10px; font-size:0.85rem;">
            <strong>Contact:</strong> ${m.item.contact}
          </div>
        </div>
      </div>
    `).join("");

    modalEl.innerHTML = `
      <div class="glass-card" style="width: 100%; max-width: 600px; max-height: 80vh; overflow-y: auto; background-color: var(--bg-card-opaque);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
          <h2 style="margin: 0;">Potential Matches Found</h2>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('lost-found-matches-modal').style.display='none'">Close</button>
        </div>
        <p style="color:var(--text-muted); margin-bottom: 16px; font-size:0.9rem;">Comparing traits, location overlaps, and details description tags for listing <strong>${record.animalType}</strong> near <strong>${record.location}</strong>.</p>
        <div style="max-height: 50vh; overflow-y: auto; padding-right: 8px;">
          ${matchCardsHtml}
        </div>
      </div>
    `;
    modalEl.style.display = "flex";
  };
});
