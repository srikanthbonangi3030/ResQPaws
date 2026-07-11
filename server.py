import os
import sys
import json
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(__file__), "guardianpulse")

# Default system instruction as requested
SYSTEM_INSTRUCTION = """You are resQpaws AI Assistant, the official in-app chat helper for resQpaws — a web platform that connects citizens, volunteers, and NGOs to rescue stray, injured, or abandoned animals quickly.

Your two responsibilities:
1. Veterinary first-aid guidance — give safe, basic, non-veterinary first-response advice for injured/sick/distressed animals (bleeding, dehydration, heatstroke, fractures, trapped animals, large animals like cattle, etc.). Always end first-aid advice by telling the user to file a report on the platform with the appropriate severity level if the situation is serious.
2. Platform guidance — explain exactly how to use resQpaws features, using the real page names and flows below. Never invent features, pages, or buttons that aren't listed.

PLATFORM FEATURES YOU MUST KNOW:
- Report Emergency (report.html): User selects animal type, writes a description, picks a location by clicking the map, optionally uploads a photo, and submits. The platform's AI-assisted assessment estimates severity (Critical/High/Medium/Low) and confidence %, then alerts nearby NGOs.
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

class SecureAIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve from the guardianpulse directory
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add CORS headers to support running frontend on another port (e.g., Live Server)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        # Handle CORS preflight request
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        # Match path with or without trailing slash
        if self.path.rstrip('/') == "/api/chat":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                request_data = json.loads(post_data.decode('utf-8'))
                user_msg = request_data.get("message", "")
                history = request_data.get("history", [])

                # Retrieve API Key from env or .env file
                api_key = os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    # Check for .env file as fallback
                    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
                    if os.path.exists(env_path):
                        with open(env_path, "r") as f:
                            for line in f:
                                if line.startswith("GEMINI_API_KEY="):
                                    api_key = line.split("=", 1)[1].strip()
                                    break
                
                if not api_key:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "error": "Gemini API key is not configured on the server. Please set the GEMINI_API_KEY environment variable."
                    }).encode('utf-8'))
                    return


                # Map history roles to Gemini roles
                contents = []
                for h in history:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": h.get("text", "")}]
                    })
                
                # Append current message if not already in history
                if not contents or contents[-1]["parts"][0]["text"] != user_msg:
                    contents.append({
                        "role": "user",
                        "parts": [{"text": user_msg}]
                    })

                # Build Gemini API Payload
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

                # Use Gemini 2.5 Flash model on the v1beta endpoint (fully supports systemInstruction)
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                req = urllib.request.Request(
                    url,
                    data=json.dumps(gemini_payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )

                try:
                    with urllib.request.urlopen(req) as response:
                        res_body = json.loads(response.read().decode('utf-8'))
                        
                        # Extract candidates
                        candidates = res_body.get("candidates", [])
                        reply = ""
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                reply = parts[0].get("text", "")
                        
                        if not reply:
                            reply = "I'm sorry, I couldn't generate a response at this moment."

                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"reply": reply}).encode('utf-8'))

                except urllib.error.HTTPError as e:
                    try:
                        err_msg = e.read().decode('utf-8')
                        print("Gemini API Error Detail:", err_msg)
                        err_data = json.loads(err_msg)
                        detailed_err = err_data.get("error", {}).get("message", e.reason)
                    except:
                        detailed_err = e.reason
                    
                    self.send_response(e.code)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Gemini API Error: {detailed_err}"}).encode('utf-8'))

            except Exception as ex:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(ex)}).encode('utf-8'))
        else:
            # Fallback to serving static files via SimpleHTTPRequestHandler
            super().do_POST()

def run_server():
    # 1. Audit core python dependencies
    print("Auditing server dependencies...")
    try:
        import sys
        import os
        import json
        import urllib.request
        import urllib.error
        from http.server import SimpleHTTPRequestHandler, HTTPServer
        print("[SUCCESS] Dependencies verified successfully.")
    except ImportError as e:
        print(f"[ERROR] Dependency Audit Failed: Missing core library: {e}")
        sys.exit(1)

    # 2. Verify GEMINI_API_KEY is configured
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

    print(f"Starting resQpaws secure server on port {PORT}...")
    print(f"Serving static files from: {DIRECTORY}")
    print(f"Access URLs:")
    print(f"  Local:    http://127.0.0.1:{PORT}")
    print(f"  Loopback: http://localhost:{PORT}")
    
    try:
        server = HTTPServer(('0.0.0.0', PORT), SecureAIHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        server.server_close()
    except Exception as e:
        print(f"[ERROR] Server crash: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()

