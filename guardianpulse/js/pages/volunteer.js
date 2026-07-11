// Volunteer Registration Page Controller
document.addEventListener("DOMContentLoaded", async () => {
  const mapElement = document.getElementById("volunteer-map");
  
  // 1. Initialize Map showing active NGOs and Volunteers
  if (mapElement) {
    window.GPMap.initMap("volunteer-map", [12.9716, 77.5946], 12);
    
    // Use real-time subscriptions to keep markers updated
    try {
      // Subscribe to NGOs
      window.GPDB.subscribeToNgos((ngos) => {
        // Re-render NGO markers each time data changes
        window.GPMap.clearNgoMarkers && window.GPMap.clearNgoMarkers();
        ngos.forEach(ngo => window.GPMap.addNgoMarker(ngo));
      });

      // Subscribe to Volunteers
      window.GPDB.subscribeToVolunteers((volunteers) => {
        window.GPMap.clearVolunteerMarkers && window.GPMap.clearVolunteerMarkers();
        volunteers.forEach(vol => window.GPMap.addVolunteerMarker(vol));
        
        // Update volunteer count stat if present
        const volCountEl = document.getElementById("volunteer-total-count");
        if (volCountEl) volCountEl.textContent = volunteers.length;
      });
    } catch (err) {
      console.error("Map subscription failure:", err);
    }
  }

  // 2. Submit volunteer registration
  const volForm = document.getElementById("volunteer-registration-form");
  const submitBtn = volForm ? volForm.querySelector("button[type='submit']") : null;
  
  if (volForm) {
    volForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("vol-name").value.trim();
      const phone = document.getElementById("vol-phone").value.trim();
      const email = document.getElementById("vol-email").value.trim();
      const city = document.getElementById("vol-city").value.trim();

      if (!name || !email) {
        window.GPToast
          ? window.GPToast.warning("Missing Info", "Please fill in all required fields.")
          : alert("Please fill in all required fields.");
        return;
      }

      // Disable button and show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;margin-right:8px;"></span> Registering...';
      }

      // Mock coordinates mapping based on city input (simple fallback)
      let lat = 12.9716 + (Math.random() - 0.5) * 0.1;
      let lng = 77.5946 + (Math.random() - 0.5) * 0.1;

      const volunteerData = {
        name: name,
        phone: phone,
        email: email,
        city: city,
        location: { lat, lng }
      };

      try {
        const savedVol = await window.GPDB.registerVolunteer(volunteerData);
        
        // ✅ Toast instead of alert
        if (window.GPToast) {
          window.GPToast.success(
            "Registration Successful! 🎉",
            `Welcome aboard, ${name}! You are now a ResQPaws volunteer.`,
            6000
          );
        }

        // ✅ Reset form cleanly
        volForm.reset();
        
        // Pan map to new volunteer without full reload
        if (window.GPMap && savedVol.location) {
          window.GPMap.panTo(savedVol.location.lat, savedVol.location.lng, 13);
        }

        // ✅ Show inline success card
        let successCard = document.getElementById("vol-success-card");
        if (!successCard) {
          successCard = document.createElement("div");
          successCard.id = "vol-success-card";
          successCard.className = "glass-card rt-new-item";
          successCard.style.cssText = "margin-top:20px; padding:20px; border-left:4px solid var(--primary); text-align:center;";
          volForm.parentNode.insertBefore(successCard, volForm.nextSibling);
        }
        successCard.innerHTML = `
          <h3 style="color:var(--primary); margin-bottom:8px;">✅ You're now a Volunteer!</h3>
          <p style="color:var(--text-muted);">Thank you <strong>${name}</strong>! You have been added to our network in <strong>${city || "your city"}</strong>.</p>
        `;
        successCard.style.display = "block";
        setTimeout(() => { successCard.style.display = "none"; }, 8000);

      } catch (err) {
        console.error(err);
        if (window.GPToast) {
          window.GPToast.error("Registration Failed", err.message || "Please try again.");
        } else {
          alert("Registration failed. Please try again.");
        }
      } finally {
        // Restore button state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "Register as Volunteer";
        }
      }
    });
  }
});
