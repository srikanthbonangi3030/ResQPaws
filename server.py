import os
import sys
import json
import math
import datetime
import urllib.request
import urllib.parse
import urllib.error
import concurrent.futures
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from models import db, EmergencyReport, Trainer

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(__file__), "guardianpulse")

app = Flask(__name__, static_folder=DIRECTORY, static_url_path='')
CORS(app)

# Database Configuration
db_path = os.path.join(os.path.dirname(__file__), "resqpaws.db")
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(DIRECTORY, "uploads")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

db.init_app(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Default system instruction for chatbot
SYSTEM_INSTRUCTION = """You are resQpaws AI Assistant, the official in-app chat helper for resQpaws — a web platform that connects citizens, volunteers, and NGOs to rescue stray, injured, or abandoned animals quickly.

Your two responsibilities:
1. Veterinary first-aid guidance — give safe, basic, non-veterinary first-response advice for injured/sick/distressed animals (bleeding, dehydration, heatstroke, fractures, trapped animals, large animals like cattle, etc.). Always end first-aid advice by telling the user to file a report on the platform with the appropriate severity level if the situation is serious.
2. Platform guidance — explain exactly how to use resQpaws features, using the real page names and flows below. Never invent features, pages, or buttons that aren't listed.

PLATFORM FEATURES YOU MUST KNOW:
- Report Emergency (report.html): User selects animal type, writes a description, picks a location by clicking the map, optionally uploads a photo, and submits. The platform's AI-assisted assessment estimates severity (Critical/High/Medium/Low) and confidence %, then alerts nearby NGOs.
- Nearby Animal Hospital Finder (integrated in report.html): After submitting a report, the application automatically finds nearby real-time veterinary clinics using Google Places API (Nearby Search + Place Details) and displays the top 5 nearest clinics on a Leaflet map.
- Lost & Found (lost-found.html): Users post or browse lost/found pet listings.
- Adopt a Pet (adopt.html): Users browse adoptable animals and submit adoption requests.
- Track Adoptions (track-adoptions.html): Users check the status of their adoption requests.
- Manage Adoptions (manage-adoptions.html): NGO/admin view to approve or manage incoming adoption requests.
- Volunteer Registration (volunteer.html): Users sign up with name, email, phone, and city to become a volunteer; their location is shown to NGOs.
- Rescue Tracking (track.html): Users enter a tracking ID (e.g. GP-2026-001) to see a live timeline of their reported rescue.
- NGO Dashboard (ngo-dashboard.html): NGOs view incoming emergency reports, set their availability status (Available/Busy/Offline), and dispatch rescues. Busy/Offline NGOs can't accept new requests.
- User Dashboard (user-dashboard.html): Logged-in users see their own reports, adoption requests, and activity.
- Login/Register (login.html, register.html): Account creation and sign-in, required for dashboards, reporting history, and volunteering.

RULES:
- Be warm, concise, and practical — this is often used in stressful, time-sensitive moments.
- For anything urgent (bleeding, unconscious, hit by vehicle, trapped), prioritize immediate first-aid steps FIRST, then direct them to Report Emergency with the right severity.
- Never give medication dosages or invasive medical instructions — always recommend contacting an NGO/vet for anything beyond basic stabilization.
- If asked about something outside resQpaws (unrelated general topics), politely redirect: explain you're focused on helping with animal rescue and the resQpaws platform.
- If unsure about a platform detail, say so rather than guessing, and suggest the user check the relevant page or contact support via the Contact Us page.
- Keep responses short by default (3–6 lines or steps); only go longer for multi-step first-aid or platform instructions.
- Never output raw file names (like "report.html" or "volunteer.html") as plain text to the user. Instead, always refer to pages by their human-readable names and format them as HTML anchor links targeting the correct file (e.g., use '<a href="report.html">Report Emergency page</a>' instead of "report.html").
- You may use simple HTML tags (<strong>, <br>, <a>) since responses render directly in the chat widget.
"""

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth in km."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Setup database tables
with app.app_context():
    db.create_all()


# Helper function to fetch Google Places Nearby Search
def fetch_nearby_places(lat, lng, radius, keyword, api_key):
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={radius}&keyword={urllib.parse.quote(keyword)}&key={api_key}"
    print(f"GOOGLE PLACES REQUEST: {url.replace(api_key, 'API_KEY_HIDDEN')}")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'resQpaws API Agent'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode('utf-8')
            data = json.loads(res_body)
            print(f"GOOGLE PLACES RESPONSE STATUS: {data.get('status')}")
            if data.get("error_message"):
                print(f"GOOGLE PLACES ERROR DETAIL: {data.get('error_message')}")
            return data
    except Exception as e:
        print(f"Error fetching Google Places Nearby for keyword '{keyword}' in radius {radius}m: {e}")
        return {"status": "HTTP_ERROR", "results": [], "error_message": str(e)}

# Helper function to fetch Google Place Details
def fetch_place_details(place_id, api_key):
    fields = "name,formatted_address,geometry,rating,user_ratings_total,business_status,opening_hours,formatted_phone_number,international_phone_number,website,url,photos"
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields={fields}&key={api_key}"
    print(f"GOOGLE PLACE DETAILS REQUEST: {url.replace(api_key, 'API_KEY_HIDDEN')}")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'resQpaws API Agent'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode('utf-8')
            data = json.loads(res_body)
            print(f"GOOGLE PLACE DETAILS RESPONSE STATUS: {data.get('status')}")
            if data.get("error_message"):
                print(f"GOOGLE PLACE DETAILS ERROR DETAIL: {data.get('error_message')}")
            return data
    except Exception as e:
        print(f"Error fetching Google Place Details for place_id '{place_id}': {e}")
        return {"status": "HTTP_ERROR", "result": {}, "error_message": str(e)}

# Helper function to fetch OpenStreetMap Overpass veterinary places
def fetch_osm_places(lat, lng, radius):
    query = f"""[out:json];(node["amenity"="veterinary"](around:{radius},{lat},{lng});way["amenity"="veterinary"](around:{radius},{lat},{lng});relation["amenity"="veterinary"](around:{radius},{lat},{lng}););out center;"""
    url = f"https://overpass-api.de/api/interpreter?data={urllib.parse.quote(query)}"
    print(f"OSM OVERPASS REQUEST: {url}")
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'resQPawsAnimalRescueApp/1.0 (emergency-dev@resqpaws.org)',
                'Referer': 'https://resqpaws.netlify.app/'
            }
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = response.read().decode('utf-8')
            data = json.loads(res_body)
            elements = data.get("elements", [])
            print(f"OSM OVERPASS RESPONSE: Found {len(elements)} elements")
            return elements
    except Exception as e:
        print(f"Error fetching OpenStreetMap Overpass for lat={lat}, lng={lng}, radius={radius}: {e}")
        return []


# --------------------- CORS GLOBAL FILTER ---------------------
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# --------------------- BACKEND APIS ---------------------

@app.route('/api/reports', methods=['POST', 'OPTIONS'])
def submit_report():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    """Accept and save an Emergency Animal Report, then find the nearest real-time clinics from Google Places API (or OpenStreetMap Fallback)."""
    try:
        # Support both form data (with image file) and JSON payloads
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            image_file = request.files.get('image')
        else:
            data = request.json
            image_file = None

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        user_id = data.get('user_id', 'Anonymous')
        contact_number = data.get('contact_number', '')
        animal_type = data.get('animal_type', '')
        emergency_type = data.get('emergency_type', '')
        severity = data.get('severity', '')
        description = data.get('description', '')
        
        try:
            latitude = float(data.get('latitude', 0.0))
            longitude = float(data.get('longitude', 0.0))
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid latitude/longitude format"}), 400

        # Handle optional image upload
        image_path = None
        if image_file and image_file.filename:
            filename = secure_filename(image_file.filename)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(save_path)
            image_path = f"uploads/{filename}"

        # Generate unique report ID: GP-YYYY-XXX
        year = datetime.datetime.utcnow().year
        prefix = f"GP-{year}-"
        max_report = EmergencyReport.query.filter(EmergencyReport.id.like(f"{prefix}%")).order_by(EmergencyReport.id.desc()).first()
        if max_report:
            try:
                last_num = int(max_report.id.split("-")[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        while True:
            report_id = f"{prefix}{next_num:03d}"
            if not EmergencyReport.query.get(report_id):
                break
            next_num += 1

        # Create emergency report record
        report = EmergencyReport(
            id=report_id,
            user_id=user_id,
            contact_number=contact_number,
            animal_type=animal_type,
            emergency_type=emergency_type,
            severity=severity,
            description=description,
            image_path=image_path,
            latitude=latitude,
            longitude=longitude,
            status="Pending"
        )
        db.session.add(report)
        db.session.commit()

        # 🚀 Google Places API Live Search Setup
        api_key = os.environ.get("GOOGLE_PLACES_API_KEY") or os.environ.get("GOOGLE_MAPS_API_KEY") or os.environ.get("GEMINI_API_KEY")
        
        if not api_key:
            # Check env file fallback
            env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
            if os.path.exists(env_path):
                with open(env_path, "r") as f:
                    for line in f:
                        if line.startswith("GEMINI_API_KEY="):
                            api_key = line.split("=", 1)[1].strip()
                            break
                        elif line.startswith("GOOGLE_PLACES_API_KEY="):
                            api_key = line.split("=", 1)[1].strip()
                            break

        places_map = {}
        last_api_status = "OK"
        last_api_error = None
        google_places_success = False
        google_places_disabled = False

        if api_key:
            # Search queries
            keywords = ["Veterinary Hospital", "Veterinary Clinic", "Veterinary Care", "Animal Hospital", "Pet Hospital"]
            radii = [5000, 10000, 20000, 30000, 50000]

            # Search progressively in parallel for each radius
            for r in radii:
                if google_places_disabled:
                    break
                print(f"Searching Google Places veterinary clinics in {r/1000}km radius...")
                with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                    futures = {executor.submit(fetch_nearby_places, latitude, longitude, r, kw, api_key): kw for kw in keywords}
                    for fut in concurrent.futures.as_completed(futures):
                        data = fut.result()
                        status = data.get("status", "OK")
                        if status not in ["OK", "ZERO_RESULTS"]:
                            last_api_status = status
                            last_api_error = data.get("error_message", "Unknown error")
                            if status in ["REQUEST_DENIED", "INVALID_REQUEST", "HTTP_ERROR"]:
                                google_places_disabled = True
                                google_places_success = False
                        else:
                            google_places_success = True
                        
                        results = data.get("results", [])
                        for p in results:
                            p_id = p.get("place_id")
                            if p_id and p_id not in places_map:
                                places_map[p_id] = p
                
                # If we've gathered at least 5 clinics, stop expanding radius
                if len(places_map) >= 5:
                    break

        # 🌟 OpenStreetMap Fallback Gateway (Triggers if API key is invalid/denied, or zero Google results returned)
        osm_fallback_used = False
        if not google_places_success or len(places_map) == 0:
            print("Google Places query unavailable or empty. Triggering OpenStreetMap Overpass fallback query...")
            osm_fallback_used = True
            
            # Query the maximum radius (50km) once! This avoids sequential slow HTTP requests.
            osm_elements = fetch_osm_places(latitude, longitude, 50000)
            for el in osm_elements:
                p_id = el.get("id")
                if p_id and p_id not in places_map:
                    tags = el.get("tags", {})
                    h_lat = el.get("lat") or el.get("center", {}).get("lat")
                    h_lng = el.get("lon") or el.get("center", {}).get("lon")
                    if h_lat is None or h_lng is None:
                        continue
                        
                    # Build address
                    addr_parts = []
                    for k in ["addr:housenumber", "addr:street", "addr:suburb", "addr:city"]:
                        v = tags.get(k)
                        if v:
                            addr_parts.append(v)
                    addr = ", ".join(addr_parts) if addr_parts else tags.get("addr:full", "Address Unavailable")
                    
                    places_map[p_id] = {
                        "place_id": f"osm_{p_id}",
                        "name": tags.get("name", "Veterinary Clinic"),
                        "vicinity": addr,
                        "geometry": {"location": {"lat": h_lat, "lng": h_lng}},
                        "business_status": "OPERATIONAL",
                        "rating": 0.0,
                        "user_ratings_total": 0,
                        "opening_hours": {"open_now": True},
                        "phone_number": tags.get("phone") or tags.get("contact:phone") or "",
                        "website": tags.get("website") or tags.get("contact:website") or "",
                        "is_osm": True
                    }

        # Filter out closed & validate coords
        valid_hospitals = []
        for p_id, p in places_map.items():
            status = p.get("business_status", "")
            if status == "CLOSED_PERMANENTLY":
                continue
                
            loc = p.get("geometry", {}).get("location", {})
            h_lat = loc.get("lat")
            h_lng = loc.get("lng")
            if h_lat is None or h_lng is None:
                continue

            dist = haversine(latitude, longitude, h_lat, h_lng)
            p['distance_km'] = round(dist, 2)
            valid_hospitals.append(p)

        # Sort dynamically using sorting criteria: 1. Distance, 2. Open Now, 3. Rating, 4. Reviews count
        def sort_key(place):
            dist = place.get("distance_km", 999999.0)
            open_now = place.get("opening_hours", {}).get("open_now")
            open_val = 0 if open_now is True else 1
            rating_val = -place.get("rating", 0.0)
            reviews_val = -place.get("user_ratings_total", 0)
            return (dist, open_val, rating_val, reviews_val)

        valid_hospitals.sort(key=sort_key)
        top_5 = valid_hospitals[:5]

        # Fetch details for Google and OSM places
        detailed_hospitals = []
        google_top_5 = [h for h in top_5 if not h.get("is_osm")]
        osm_top_5 = [h for h in top_5 if h.get("is_osm")]

        if google_top_5:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(fetch_place_details, h.get("place_id"), api_key): h for h in google_top_5}
                for fut in concurrent.futures.as_completed(futures):
                    original_h = futures[fut]
                    data = fut.result()
                    details = data.get("result", {})
                    if not details:
                        details = original_h
                    
                    # Format Photo URL
                    photos = details.get("photos", [])
                    photo_url = None
                    if photos:
                        photo_ref = photos[0].get("photo_reference")
                        if photo_ref:
                            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_ref}&key={api_key}"
                    
                    loc = details.get("geometry", {}).get("location", {})
                    h_lat = loc.get("lat", original_h.get("geometry", {}).get("location", {}).get("lat", 0.0))
                    h_lng = loc.get("lng", original_h.get("geometry", {}).get("location", {}).get("lng", 0.0))

                    open_now = details.get("opening_hours", {}).get("open_now")
                    open_status = "Open Now" if open_now is True else ("Closed" if open_now is False else "Unknown")

                    h_info = {
                        "place_id": original_h.get("place_id"),
                        "name": details.get("name", original_h.get("name", "Veterinary Hospital")),
                        "address": details.get("formatted_address", original_h.get("vicinity", "Address Unavailable")),
                        "latitude": h_lat,
                        "longitude": h_lng,
                        "distance_km": original_h.get("distance_km"),
                        "rating": details.get("rating", original_h.get("rating", 0.0)),
                        "user_ratings_total": details.get("user_ratings_total", original_h.get("user_ratings_total", 0)),
                        "business_status": details.get("business_status", original_h.get("business_status", "OPERATIONAL")),
                        "open_now": open_now,
                        "open_status": open_status,
                        "phone_number": details.get("formatted_phone_number", ""),
                        "international_phone_number": details.get("international_phone_number", ""),
                        "website": details.get("website", ""),
                        "google_maps_url": details.get("url", f"https://www.google.com/maps/place/?q=place_id:{original_h.get('place_id')}"),
                        "photo_url": photo_url,
                        "opening_hours": details.get("opening_hours", {}).get("weekday_text", [])
                    }
                    detailed_hospitals.append(h_info)

        for h in osm_top_5:
            detailed_hospitals.append({
                "place_id": h.get("place_id"),
                "name": h.get("name"),
                "address": h.get("vicinity"),
                "latitude": h.get("geometry", {}).get("location", {}).get("lat"),
                "longitude": h.get("geometry", {}).get("location", {}).get("lng"),
                "distance_km": h.get("distance_km"),
                "rating": 0.0,
                "user_ratings_total": 0,
                "business_status": "OPERATIONAL",
                "open_now": True,
                "open_status": "Open Now",
                "phone_number": h.get("phone_number", ""),
                "international_phone_number": "",
                "website": h.get("website", ""),
                "google_maps_url": f"https://www.google.com/maps/place/?q={h.get('geometry', {}).get('location', {}).get('lat')},{h.get('geometry', {}).get('location', {}).get('lng')}",
                "photo_url": None,
                "opening_hours": []
            })

        # Sort the combined results again by distance/open status
        detailed_hospitals.sort(key=lambda x: (
            x.get("distance_km", 999999.0),
            0 if x.get("open_now") is True else 1,
            -x.get("rating", 0.0),
            -x.get("user_ratings_total", 0)
        ))

        return jsonify({
            "success": True,
            "message": "Emergency report submitted successfully.",
            "report": report.to_dict(),
            "nearby_hospitals": detailed_hospitals,
            "google_places_status": "OK" if not osm_fallback_used else "OSM_FALLBACK"
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error submitting report:", str(e))
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# --------------------- ANIMAL TRAINERS APIS ---------------------

@app.route('/api/trainers/enroll', methods=['POST', 'OPTIONS'])
def enroll_trainer():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    try:
        # Check if request has files (multipart/form-data)
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            photo_file = request.files.get('photo')
            cert_file = request.files.get('certificates')
        else:
            data = request.json
            photo_file = None
            cert_file = None

        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        location = data.get('location') # city
        specialization = data.get('specialization')
        experience_str = data.get('experience')
        availability = data.get('availability', 'Daily')
        bio = data.get('bio', '')
        languages = data.get('languages', 'English')
        certifications = data.get('certifications', '')

        if not name or not email or not phone or not location or not specialization or not experience_str:
            return jsonify({"success": False, "error": "Missing required fields (name, email, phone, location, specialization, experience)"}), 400

        try:
            experience = int(experience_str)
        except ValueError:
            return jsonify({"success": False, "error": "Experience must be a valid number"}), 400

        # Create subfolder for trainers if not exists
        trainers_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], "trainers")
        os.makedirs(trainers_upload_dir, exist_ok=True)

        # Handle Profile Photo upload
        photo_path = None
        if photo_file and photo_file.filename:
            filename = secure_filename(photo_file.filename)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"photo_{timestamp}_{filename}"
            save_path = os.path.join(trainers_upload_dir, filename)
            photo_file.save(save_path)
            photo_path = f"uploads/trainers/{filename}"

        # Handle Certifications File upload (if present)
        cert_path = None
        if cert_file and cert_file.filename:
            filename = secure_filename(cert_file.filename)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"cert_{timestamp}_{filename}"
            save_path = os.path.join(trainers_upload_dir, filename)
            cert_file.save(save_path)
            cert_path = f"uploads/trainers/{filename}"
            # Append cert path to certifications list text
            if certifications:
                certifications += f" | File: {cert_path}"
            else:
                certifications = f"File: {cert_path}"

        # Generate TR-YYYY-XXX ID
        year = datetime.datetime.utcnow().year
        prefix = f"TR-{year}-"
        max_trainer = Trainer.query.filter(Trainer.id.like(f"{prefix}%")).order_by(Trainer.id.desc()).first()
        if max_trainer:
            try:
                last_num = int(max_trainer.id.split("-")[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
            
        while True:
            trainer_id = f"{prefix}{next_num:03d}"
            if not Trainer.query.get(trainer_id):
                break
            next_num += 1

        new_trainer = Trainer(
            id=trainer_id,
            name=name,
            photo=photo_path,
            specialization=specialization,
            experience=experience,
            certifications=certifications,
            languages=languages,
            location=location,
            availability=availability,
            phone=phone,
            email=email,
            bio=bio,
            status='Pending',
            is_published=False
        )

        db.session.add(new_trainer)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Your application has been submitted successfully. After verification by the administrator, your profile may be published in the Animal Trainers section.",
            "trainer": new_trainer.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error enrolling trainer:", str(e))
        return jsonify({"success": False, "error": f"Error: {str(e)}"}), 500


@app.route('/api/trainers', methods=['GET', 'OPTIONS'])
def get_public_trainers():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    try:
        search = request.args.get('search', '').strip()
        specialization = request.args.get('specialization', '').strip()
        city = request.args.get('city', '').strip()

        query = Trainer.query.filter(Trainer.status == 'Approved', Trainer.is_published == True)

        if search:
            query = query.filter(db.or_(
                Trainer.name.like(f"%{search}%"),
                Trainer.bio.like(f"%{search}%"),
                Trainer.certifications.like(f"%{search}%")
            ))
        if specialization:
            query = query.filter(Trainer.specialization.like(f"%{specialization}%"))
        if city:
            query = query.filter(Trainer.location.like(f"%{city}%"))

        trainers = query.order_by(Trainer.created_at.desc()).all()
        return jsonify({
            "success": True,
            "trainers": [t.to_dict() for t in trainers]
        }), 200
    except Exception as e:
        print("Error fetching public trainers:", str(e))
        return jsonify({"success": False, "error": f"Error: {str(e)}"}), 500


@app.route('/api/admin/trainers', methods=['GET', 'OPTIONS'])
def get_admin_trainers():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    try:
        trainers = Trainer.query.order_by(Trainer.created_at.desc()).all()
        return jsonify({
            "success": True,
            "trainers": [t.to_dict() for t in trainers]
        }), 200
    except Exception as e:
        print("Error fetching admin trainers:", str(e))
        return jsonify({"success": False, "error": f"Error: {str(e)}"}), 500


@app.route('/api/admin/trainers/<trainer_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def manage_admin_trainer(trainer_id):
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    
    trainer = Trainer.query.get(trainer_id)
    if not trainer:
        return jsonify({"success": False, "error": f"Trainer '{trainer_id}' not found"}), 404

    if request.method == 'DELETE':
        try:
            db.session.delete(trainer)
            db.session.commit()
            return jsonify({"success": True, "message": f"Trainer '{trainer_id}' deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            print("Error deleting trainer:", str(e))
            return jsonify({"success": False, "error": f"Error: {str(e)}"}), 500

    # PUT request (Update / Approve / Reject / Publish / Unpublish)
    try:
        data = request.json
        if not data:
            # Check if multipart/form-data for updates
            if request.content_type and 'multipart/form-data' in request.content_type:
                data = request.form
            else:
                return jsonify({"success": False, "error": "No data provided"}), 400

        # Update properties if provided
        if 'name' in data: trainer.name = data['name']
        if 'specialization' in data: trainer.specialization = data['specialization']
        if 'experience' in data:
            try:
                trainer.experience = int(data['experience'])
            except ValueError:
                return jsonify({"success": False, "error": "Experience must be a valid number"}), 400
        if 'certifications' in data: trainer.certifications = data['certifications']
        if 'languages' in data: trainer.languages = data['languages']
        if 'location' in data: trainer.location = data['location']
        if 'availability' in data: trainer.availability = data['availability']
        if 'phone' in data: trainer.phone = data['phone']
        if 'email' in data: trainer.email = data['email']
        if 'bio' in data: trainer.bio = data['bio']
        if 'status' in data: 
            status = data['status']
            if status in ['Pending', 'Approved', 'Rejected']:
                trainer.status = status
                # If rejected, unpublish automatically as safety precaution
                if status == 'Rejected':
                    trainer.is_published = False
            else:
                return jsonify({"success": False, "error": "Invalid status value"}), 400
        if 'is_published' in data:
            val = data['is_published']
            if isinstance(val, str):
                trainer.is_published = val.lower() == 'true'
            else:
                trainer.is_published = bool(val)

            # Safety check: Cannot publish if not approved
            if trainer.is_published and trainer.status != 'Approved':
                return jsonify({"success": False, "error": "Cannot publish a profile that is not Approved"}), 400

        # Handle profile photo upload during admin edit (if provided)
        if request.files and request.files.get('photo'):
            photo_file = request.files.get('photo')
            if photo_file.filename:
                trainers_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], "trainers")
                os.makedirs(trainers_upload_dir, exist_ok=True)
                filename = secure_filename(photo_file.filename)
                timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
                filename = f"photo_{timestamp}_{filename}"
                save_path = os.path.join(trainers_upload_dir, filename)
                photo_file.save(save_path)
                trainer.photo = f"uploads/trainers/{filename}"

        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Trainer updated successfully",
            "trainer": trainer.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print("Error updating trainer:", str(e))
        return jsonify({"success": False, "error": f"Error: {str(e)}"}), 500


# --------------------- CHATBOT PROXY ENDPOINT ---------------------

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    """Gemini API chat helper proxy."""
    try:
        request_data = request.get_json(silent=True)
        if not request_data:
            return jsonify({"success": False, "error": "No JSON payload provided or Content-Type is not application/json"}), 400
            
        user_msg = request_data.get("message", "")
        history = request_data.get("history", [])

        # Retrieve API Key
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
            if os.path.exists(env_path):
                with open(env_path, "r") as f:
                    for line in f:
                        if line.startswith("GEMINI_API_KEY="):
                            api_key = line.split("=", 1)[1].strip()
                            break
        
        if not api_key:
            return jsonify({"success": False, "error": "Gemini API key is not configured on the server."}), 500

        # Build contents from history
        contents = []
        for h in history:
            role = "user" if h.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": h.get("text", "")}]
            })
        
        if not contents or contents[-1]["parts"][0]["text"] != user_msg:
            contents.append({
                "role": "user",
                "parts": [{"text": user_msg}]
            })

        gemini_payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": SYSTEM_INSTRUCTION}]
            },
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 800
            }
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(gemini_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = json.loads(response.read().decode('utf-8'))
                candidates = res_body.get("candidates", [])
                reply = ""
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        reply = parts[0].get("text", "")
                
                if not reply:
                    reply = "I'm sorry, I couldn't generate a response at this moment."

                return jsonify({"success": True, "response": reply}), 200

        except urllib.error.HTTPError as e:
            try:
                err_msg = e.read().decode('utf-8')
                print("Gemini API Error Detail:", err_msg)
                err_data = json.loads(err_msg)
                detailed_err = err_data.get("error", {}).get("message", e.reason)
            except:
                detailed_err = e.reason
            return jsonify({"success": False, "error": f"Gemini API Error: {detailed_err}"}), e.code
        except urllib.error.URLError as url_err:
            print("Gemini API Connection Error:", str(url_err))
            return jsonify({"success": False, "error": f"Connection to Gemini API failed: {str(url_err.reason)}"}), 504

    except Exception as ex:
        print("Internal Chatbot Exception:", str(ex))
        return jsonify({"success": False, "error": f"Internal Server Error: {str(ex)}"}), 500


# --------------------- STATIC FILE SERVING ---------------------

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return app.send_static_file(path)


def run_server():
    print("Verifying environment configuration...")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.split("=", 1)[1].strip()
                        break
                        
    if not api_key or api_key == "your_gemini_api_key_here":
        print("\n" + "="*80)
        print("[ERROR] STARTUP ERROR: GEMINI_API_KEY is not configured!")
        print("Please configure your API key either by:")
        print("  1. Setting the GEMINI_API_KEY environment variable.")
        print("  2. Creating a '.env' file in the root directory with: GEMINI_API_KEY=your_key")
        print("="*80 + "\n")
        sys.exit(1)
        
    print("[SUCCESS] GEMINI_API_KEY verified successfully (Key configured).")

    print(f"Starting resQpaws Flask server on port {PORT}...")
    print(f"Serving static files from: {DIRECTORY}")
    print(f"Access URLs:")
    print(f"  Local:    http://127.0.0.1:{PORT}")
    print(f"  Loopback: http://localhost:{PORT}")
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=True, use_reloader=False)
    except Exception as e:
        print(f"[ERROR] Server crash: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
