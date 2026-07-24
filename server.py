import os
import sys
import json
import math
import datetime
import urllib.request
import urllib.error
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from models import db, Hospital, EmergencyReport

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
- Nearby Animal Hospital Finder (integrated in report.html & hospital_details.html): After submitting a report, the application automatically finds nearby hospitals using the browser Geolocation API, calculates distance using the Haversine formula, and displays the top 5 nearest hospitals. (hospitals never receive any alerts or notifications - this is user facing only).
- Hospital Management (admin_hospitals.html): Admin panel to Add, Edit, Delete, Search, and View veterinary hospitals.
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

# Seeder function
def seed_hospitals():
    if Hospital.query.first() is not None:
        return
    
    print("Seeding default hospitals...")
    hospitals_data = [
        {
            "hospital_name": "resQpaws Indiranagar Care Clinic",
            "hospital_image": "assets/hospital_exterior.jpg",
            "address": "12, 100 Feet Rd, Hal 2nd Stage, Indiranagar",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "phone": "+91 98450 12345",
            "email": "indiranagar@resqpaws.org",
            "website": "https://indiranagar.resqpaws.org",
            "latitude": 12.9719,
            "longitude": 77.6412,
            "emergency_service": True,
            "opening_hours": "24 Hours",
            "rating": 4.8
        },
        {
            "hospital_name": "Koramangala Veterinary Hospital",
            "hospital_image": "assets/hospital_exterior.jpg",
            "address": "432, 80 Feet Rd, 4th Block, Koramangala",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "phone": "+91 98450 54321",
            "email": "koramangala.vet@gmail.com",
            "website": "https://koramangalavets.com",
            "latitude": 12.9279,
            "longitude": 77.6271,
            "emergency_service": True,
            "opening_hours": "08:00 AM - 10:00 PM",
            "rating": 4.5
        },
        {
            "hospital_name": "Hebbal Animal Rescue Shelter & Clinic",
            "hospital_image": "assets/hospital_exterior.jpg",
            "address": "Veterinary College Campus, Bellary Rd, Hebbal",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "phone": "+91 98450 98765",
            "email": "hebbal.shelter@animalwelfare.in",
            "website": "https://hebbalanimalrescue.org",
            "latitude": 13.0354,
            "longitude": 77.5988,
            "emergency_service": False,
            "opening_hours": "09:00 AM - 06:00 PM",
            "rating": 4.2
        },
        {
            "hospital_name": "Whitefield Pet & Wildlife Clinic",
            "hospital_image": "assets/hospital_exterior.jpg",
            "address": "88, Whitefield Main Rd, Opposite Columbia Asia",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "phone": "+91 98450 11111",
            "email": "contact@whitefieldpetclinic.com",
            "website": "https://whitefieldpetclinic.com",
            "latitude": 12.9698,
            "longitude": 77.7500,
            "emergency_service": True,
            "opening_hours": "24 Hours",
            "rating": 4.6
        },
        {
            "hospital_name": "Jayanagar Vet Services",
            "hospital_image": "assets/hospital_exterior.jpg",
            "address": "15, 9th Main Rd, 3rd Block, Jayanagar",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "phone": "+91 98450 22222",
            "email": "jayanagarvet@yahoo.com",
            "website": "",
            "latitude": 12.9308,
            "longitude": 77.5838,
            "emergency_service": False,
            "opening_hours": "09:00 AM - 08:00 PM",
            "rating": 4.0
        },
        {
            "hospital_name": "HSR Emergency Animal Clinic",
            "hospital_image": "assets/hospital_exterior.jpg",
            "address": "22nd Cross Rd, Sector 3, HSR Layout",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "phone": "+91 98450 33333",
            "email": "hsr.emergency@gmail.com",
            "website": "https://hsranimalclinic.com",
            "latitude": 12.9100,
            "longitude": 77.6450,
            "emergency_service": True,
            "opening_hours": "24 Hours",
            "rating": 4.7
        }
    ]
    
    for h in hospitals_data:
        hospital = Hospital(**h)
        db.session.add(hospital)
    db.session.commit()
    print("Database seeded successfully.")

# Setup database and seeder
with app.app_context():
    db.create_all()
    seed_hospitals()


# --------------------- BACKEND APIS ---------------------

@app.route('/api/hospitals', methods=['GET'])
def get_hospitals():
    """Return all hospitals."""
    hospitals = Hospital.query.all()
    return jsonify([h.to_dict() for h in hospitals]), 200

@app.route('/api/hospitals/<int:hospital_id>', methods=['GET'])
def get_hospital_detail(hospital_id):
    """Return details of a specific hospital."""
    hospital = Hospital.query.get_or_404(hospital_id)
    return jsonify(hospital.to_dict()), 200

@app.route('/api/reports', methods=['POST'])
def submit_report():
    """Accept and save an Emergency Animal Report, then find the nearest hospitals."""
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

        # Handle image upload
        image_path = None
        if image_file and image_file.filename:
            filename = secure_filename(image_file.filename)
            # Add unique timestamp to filename to prevent collisions
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(save_path)
            image_path = f"uploads/{filename}"

        # Generate unique report ID: GP-YYYY-XXX
        year = datetime.datetime.utcnow().year
        prefix = f"GP-{year}-"
        count = EmergencyReport.query.filter(EmergencyReport.id.like(f"{prefix}%")).count()
        report_id = f"{prefix}{count + 1:03d}"

        # Create emergency report
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

        # Calculate distances to all hospitals
        hospitals = Hospital.query.all()
        hospitals_with_distance = []
        for h in hospitals:
            dist = haversine(latitude, longitude, h.latitude, h.longitude)
            h_dict = h.to_dict()
            h_dict['distance_km'] = round(dist, 2)
            hospitals_with_distance.append(h_dict)

        # Sort hospitals by distance ascending
        hospitals_with_distance.sort(key=lambda x: x['distance_km'])

        # Keep top 5
        top_5_hospitals = hospitals_with_distance[:5]

        return jsonify({
            "success": True,
            "message": "Emergency report submitted successfully.",
            "report": report.to_dict(),
            "nearby_hospitals": top_5_hospitals
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error submitting report:", str(e))
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# --------------------- ADMIN CRUD FOR HOSPITALS ---------------------

@app.route('/api/admin/hospitals', methods=['POST'])
def admin_add_hospital():
    """Add a new veterinary hospital."""
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            image_file = request.files.get('hospital_image')
        else:
            data = request.json
            image_file = None

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # Handle image upload
        image_path = "assets/hospital_exterior.jpg"
        if image_file and image_file.filename:
            filename = secure_filename(image_file.filename)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"hosp_{timestamp}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(save_path)
            image_path = f"uploads/{filename}"

        hospital = Hospital(
            hospital_name=data.get('hospital_name', ''),
            hospital_image=image_path,
            address=data.get('address', ''),
            city=data.get('city', ''),
            district=data.get('district', ''),
            state=data.get('state', ''),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            website=data.get('website', ''),
            latitude=float(data.get('latitude', 0.0)),
            longitude=float(data.get('longitude', 0.0)),
            emergency_service=data.get('emergency_service', 'false').lower() == 'true',
            opening_hours=data.get('opening_hours', ''),
            rating=float(data.get('rating', 0.0))
        )
        db.session.add(hospital)
        db.session.commit()
        return jsonify({"success": True, "message": "Hospital added successfully.", "hospital": hospital.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/admin/hospitals/<int:h_id>', methods=['PUT'])
def admin_edit_hospital(h_id):
    """Edit an existing veterinary hospital."""
    try:
        hospital = Hospital.query.get_or_404(h_id)
        
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            image_file = request.files.get('hospital_image')
        else:
            data = request.json
            image_file = None

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # Handle image upload if provided
        if image_file and image_file.filename:
            filename = secure_filename(image_file.filename)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"hosp_{timestamp}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(save_path)
            hospital.hospital_image = f"uploads/{filename}"

        hospital.hospital_name = data.get('hospital_name', hospital.hospital_name)
        hospital.address = data.get('address', hospital.address)
        hospital.city = data.get('city', hospital.city)
        hospital.district = data.get('district', hospital.district)
        hospital.state = data.get('state', hospital.state)
        hospital.phone = data.get('phone', hospital.phone)
        hospital.email = data.get('email', hospital.email)
        hospital.website = data.get('website', hospital.website)
        hospital.latitude = float(data.get('latitude', hospital.latitude))
        hospital.longitude = float(data.get('longitude', hospital.longitude))
        
        if 'emergency_service' in data:
            val = data.get('emergency_service')
            if isinstance(val, str):
                hospital.emergency_service = val.lower() == 'true'
            else:
                hospital.emergency_service = bool(val)
                
        hospital.opening_hours = data.get('opening_hours', hospital.opening_hours)
        hospital.rating = float(data.get('rating', hospital.rating))

        db.session.commit()
        return jsonify({"success": True, "message": "Hospital updated successfully.", "hospital": hospital.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/admin/hospitals/<int:h_id>', methods=['DELETE'])
def admin_delete_hospital(h_id):
    """Delete a veterinary hospital."""
    try:
        hospital = Hospital.query.get_or_404(h_id)
        db.session.delete(hospital)
        db.session.commit()
        return jsonify({"success": True, "message": "Hospital deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------- CHATBOT PROXY ENDPOINT ---------------------

@app.route('/api/chat', methods=['POST'])
def chat():
    """Gemini API chat helper proxy."""
    try:
        request_data = request.json
        if not request_data:
            return jsonify({"error": "No JSON payload provided"}), 400
            
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
            return jsonify({"error": "Gemini API key is not configured on the server."}), 500

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
            with urllib.request.urlopen(req) as response:
                res_body = json.loads(response.read().decode('utf-8'))
                candidates = res_body.get("candidates", [])
                reply = ""
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        reply = parts[0].get("text", "")
                
                if not reply:
                    reply = "I'm sorry, I couldn't generate a response at this moment."

                return jsonify({"reply": reply}), 200

        except urllib.error.HTTPError as e:
            try:
                err_msg = e.read().decode('utf-8')
                print("Gemini API Error Detail:", err_msg)
                err_data = json.loads(err_msg)
                detailed_err = err_data.get("error", {}).get("message", e.reason)
            except:
                detailed_err = e.reason
            return jsonify({"error": f"Gemini API Error: {detailed_err}"}), e.code

    except Exception as ex:
        return jsonify({"error": str(ex)}), 400


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
