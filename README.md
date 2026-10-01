# resQpaws 🐾
### AI-Powered Animal Rescue, Medical Triage & Shelter Coordination System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-10B981?style=for-the-badge&logo=render)](https://resqpaws-bchr.onrender.com)
[![Python](https://img.shields.io/badge/Backend-Python%20%7C%20Flask-3776AB?style=for-the-badge&logo=python)](https://flask.palletsprojects.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20SQLAlchemy-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![AI Vision](https://img.shields.io/badge/AI%20Vision-Google%20Gemini-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Frontend](https://img.shields.io/badge/Frontend-JS%20%7C%20Leaflet%20%7C%20CSS3-F7DF1E?style=for-the-badge&logo=javascript)](https://leafletjs.com/)

---

## 📌 Project Overview

**resQpaws** is an end-to-end community animal welfare platform designed to streamline stray animal emergency reporting, automated AI-assisted medical triage, nearest NGO dispatch routing, verified trainer accreditation, and intelligent pet adoption matching.

Built for fast response in critical situations, **resQpaws** connects citizens, local volunteers, veterinary clinics, and registered NGOs in real time.

---

## 🌟 Key Features

- 🚨 **Emergency Incident Reporting:** Interactive map pinboard with geolocation coordinate picker, OSM Nominatim address geocoding, and image uploads.
- 🤖 **AI-Assisted Severity Assessment:** Automated emergency triage categorizing incidents into **Critical**, **High**, **Medium**, and **Low** response priorities.
- 🏢 **NGO Coordination Desk:** Live dashboard allowing NGOs to toggle status (*Available*, *Busy*, *Offline*), monitor incoming emergencies, and dispatch rescue teams.
- 📜 **AI Document Verification & Fraud Detection:** Gemini Vision OCR and forensic analysis for animal trainer accreditation, calculating name match similarity and overall **Fraud Risk Scores (0–100%)**.
- 🐕 **Pet Adoption Compatibility Matching Engine:** Dynamic quiz engine scoring adoption applicants against shelter pet traits (housing, activity, experience, children).
- 🌐 **Multi-Language (i18n) Engine:** Dynamic instant language translation supporting **English**, **Telugu (తెలుగు)**, and **Hindi (हिन्दी)**.
- 🌗 **Global Theme Engine:** Seamless instant Dark and Light mode switching powered by CSS Custom Properties (`var(--bg-main)`, `var(--bg-card)`, `var(--text-main)`).
- 💬 **AI First-Aid Assistant:** Context-aware chatbot providing immediate stabilization steps for injured animals.

---

## 🗂️ Project Directory & File Structure

```text
resqpaws/
├── server.py                     # Flask REST API server & routing controller
├── models.py                     # SQLAlchemy database schemas & ORM models
├── resqpaws.db                   # SQLite database instance
├── requirements.txt              # Python dependency manifest
├── .gitignore                    # Git version control exclusions
│
├── backend/                      # Backend AI & Document Verification Module
│   ├── ocr.py                    # Gemini Vision API OCR integration
│   └── verification.py           # Fuzzy name matching & document fraud risk scoring
│
└── guardianpulse/                # Frontend Application (Web Root)
    ├── index.html                # Landing page & emergency action hub
    ├── report.html               # Emergency reporting form & AI assessment
    ├── ngo-dashboard.html        # NGO rescue coordination dashboard
    ├── user-dashboard.html       # Citizen reporter activity dashboard
    ├── trainers.html             # Public verified trainers directory
    ├── admin-trainers.html       # NGO Admin trainer verification workspace
    ├── adopt.html                # Pet adoption listings & compatibility quiz
    ├── lost-found.html           # Community lost & found pet board
    ├── volunteer.html            # Volunteer registration network
    ├── donate.html               # Donation portal
    ├── contact.html              # Contact support page
    ├── about.html                # Platform mission & team details
    │
    ├── css/                      # Stylesheets
    │   ├── style.css             # Global theme engine & CSS custom properties
    │   ├── components.css        # Reusable UI components (buttons, navbar, cards, footer)
    │   └── pages.css             # Page-specific layout grid styles
    │
    ├── js/                       # Core JavaScript Controllers
    │   ├── main.js               # Theme switcher, i18n engine, navigation
    │   ├── map.js                # Leaflet map integration & marker rendering
    │   ├── db.js                 # LocalStorage persistence & sync engine
    │   ├── auth.js               # Firebase authentication handler
    │   ├── firebase-config.js    # Firebase app credentials
    │   └── pages/                # Page controllers (report.js, dashboard.js, adopt.js, etc.)
    │
    ├── data/
    │   └── sample-data.js        # Initial demonstration data (NGOs, reports, pets, volunteers)
    │
    └── uploads/                  # User uploaded media & documents
```

---

## ⚙️ Algorithms Implemented

1. **Haversine Great-Circle Distance Algorithm:**
   $$\Delta \sigma = 2 \cdot \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1) \cdot \cos(\phi_2) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
   Calculates precise geographic distances between user coordinates and nearby veterinary hospitals.

2. **Nearest-Neighbor Search & Geolocation Ranking:**
   Queries Google Places and OpenStreetMap Overpass APIs, filtering and ranking nearest open clinics by distance.

3. **Gestalt Fuzzy Sequence Matching:**
   Uses `difflib.SequenceMatcher` with string normalization to match applicant names against OCR document text.

4. **Multi-Signal Document Fraud Risk Scoring:**
   Computes an aggregated risk rating (0–100%) flagging suspicious documents based on name variance, expiry date checks, and forgery indicators.

5. **Heuristic Pet Compatibility Scoring Matrix:**
   Calculates adoption match percentages based on housing type, experience, activity level, and family environment.

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.8+ installed
- Node.js (optional, for static syntax checks)

### Installation
1. **Clone Repository:**
   ```bash
   git clone https://github.com/srikanthbonangi3030/ResQPaws.git
   cd ResQPaws
   ```

2. **Install Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start Flask Server:**
   ```bash
   python server.py
   ```
   The application will run at `http://127.0.0.1:5000` (or `http://localhost:5000`).

---

## 🌐 Live Cloud Deployment

- **Live URL:** [https://resqpaws-bchr.onrender.com](https://resqpaws-bchr.onrender.com)
- **Deployment Platform:** Render Cloud Web Service
- **Continuous Integration:** Auto-deploys on push to `main` branch.

---

## 📝 License & Copyright

© 2026 resQpaws Animal Welfare Foundation. All rights reserved.
