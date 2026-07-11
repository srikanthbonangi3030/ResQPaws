// resQpaws Leaflet Map Integration Module
// Handles map rendering, custom colored severity pins, NGO buildings, and volunteer pins.

const GPMap = {
  mapInstance: null,
  markersGroup: null,
  
  // Custom marker color icons creator
  _createMarkerIcon: function(color, type = 'emergency') {
    let html = '';
    if (type === 'ngo') {
      html = `<div style="background-color: #0F172A; border: 2px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 1rem;">🏢</div>`;
    } else if (type === 'volunteer') {
      html = `<div style="background-color: #16A34A; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white; font-size: 0.8rem;">🙋</div>`;
    } else {
      // Emergency Color
      html = `<div style="background-color: ${color}; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 1.1rem; animation: pulse-marker 2s infinite;">🐾</div>`;
    }
    
    return L.divIcon({
      html: html,
      className: 'custom-map-icon',
      iconSize: type === 'ngo' ? [36, 36] : (type === 'volunteer' ? [28, 28] : [30, 30]),
      iconAnchor: type === 'ngo' ? [18, 18] : (type === 'volunteer' ? [14, 14] : [15, 15])
    });
  },

  // Initialize Map
  initMap: function(elementId, centerCoords = [12.9716, 77.5946], zoomLevel = 12) {
    if (this.mapInstance) {
      this.mapInstance.remove();
    }
    
    try {
      this.mapInstance = L.map(elementId).setView(centerCoords, zoomLevel);
      
      // Load OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors'
      }).addTo(this.mapInstance);
      
      this.markersGroup = L.layerGroup().addTo(this.mapInstance);
      
      // Inject CSS pulse animations for emergency marker icons
      if (!document.getElementById("map-marker-pulse-css")) {
        const style = document.createElement("style");
        style.id = "map-marker-pulse-css";
        style.innerHTML = `
          @keyframes pulse-marker {
            0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
            100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
          }
          .custom-map-icon { background: none !important; border: none !important; }
        `;
        document.head.appendChild(style);
      }
      
      return this.mapInstance;
    } catch (error) {
      console.error("Map initialization failed. Verify Leaflet libraries are imported.", error);
      return null;
    }
  },

  // Enables click selection of coordinates (useful on Reporting page)
  enableCoordinatesPicker: function(callback) {
    if (!this.mapInstance) return;
    
    let currentSelectMarker = null;
    
    this.mapInstance.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      if (currentSelectMarker) {
        this.markersGroup.removeLayer(currentSelectMarker);
      }
      
      currentSelectMarker = L.marker([lat, lng], {
        icon: this._createMarkerIcon('#F97316', 'picker') // orange pin
      }).addTo(this.markersGroup);
      
      // Trigger callback with coordinates
      callback(lat, lng);
    });
  },

  // Add emergency pins
  addEmergencyMarker: function(report) {
    if (!this.mapInstance || !report.lat || !report.lng) return;
    
    // Choose color based on severity
    let color = '#10B981'; // Green
    if (report.severity === 'Critical') color = '#EF4444'; // Red
    else if (report.severity === 'High') color = '#F97316'; // Orange
    else if (report.severity === 'Medium') color = '#F59E0B'; // Yellow
    
    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
        <h4 style="margin: 0 0 6px 0; font-size: 1rem; color:#0F172A;">${report.id} - ${report.animalType}</h4>
        <span class="badge" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40; padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; display: inline-block; margin-bottom: 6px; font-weight: bold;">
          ${report.severity}
        </span>
        <p style="font-size: 0.85rem; color:#64748B; margin: 0 0 10px 0;">${report.description.substring(0, 50)}...</p>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.8rem; text-transform:uppercase;">${report.status}</strong>
          <a href="track.html?id=${report.id}" style="background-color:#16A34A; color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem; text-decoration:none; font-weight:600;">Track</a>
        </div>
      </div>
    `;
    
    const marker = L.marker([report.lat, report.lng], {
      icon: this._createMarkerIcon(color, 'emergency')
    })
    .bindPopup(popupContent)
    .addTo(this.markersGroup);
    
    return marker;
  },

  // Add NGO pins
  addNgoMarker: function(ngo) {
    if (!this.mapInstance || !ngo.location) return;
    
    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px;">
        <h4 style="margin: 0 0 4px 0; color:#0F172A;">${ngo.name}</h4>
        <p style="font-size: 0.85rem; color:#64748B; margin: 0 0 6px 0;">Phone: ${ngo.phone}</p>
        <span style="font-size:0.8rem; font-weight:bold; color: ${ngo.status === 'Available' ? '#16A34A' : '#EF4444'}">
          ● ${ngo.status}
        </span>
      </div>
    `;
    
    L.marker([ngo.location.lat, ngo.location.lng], {
      icon: this._createMarkerIcon(null, 'ngo')
    })
    .bindPopup(popupContent)
    .addTo(this.markersGroup);
  },

  // Add Volunteer pins
  addVolunteerMarker: function(volunteer) {
    if (!this.mapInstance || !volunteer.location) return;
    
    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px;">
        <h4 style="margin: 0 0 4px 0; color:#0F172A;">Volunteer: ${volunteer.name}</h4>
        <p style="font-size: 0.85rem; color:#64748B; margin: 0;">City: ${volunteer.city}</p>
      </div>
    `;
    
    L.marker([volunteer.location.lat, volunteer.location.lng], {
      icon: this._createMarkerIcon(null, 'volunteer')
    })
    .bindPopup(popupContent)
    .addTo(this.markersGroup);
  },

  // Pan map to center coordinate
  panTo: function(lat, lng, zoom = 14) {
    if (this.mapInstance) {
      this.mapInstance.setView([lat, lng], zoom);
    }
  },

  clearMarkers: function() {
    if (this.markersGroup) {
      this.markersGroup.clearLayers();
    }
  }
};

window.GPMap = GPMap;
