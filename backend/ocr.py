import os
import sys
import json
import base64
import urllib.request
import urllib.error
import mimetypes

def get_gemini_api_key():
    """Retrieve GEMINI_API_KEY from environment or .env file."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Search root directory .env file
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        env_path = os.path.join(base_dir, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.split("=", 1)[1].strip()
                        break
    if api_key and api_key != "your_gemini_api_key_here":
        return api_key
    return None

def analyze_document_with_gemini(file_path, doc_category="Government Photo ID / Certificate"):
    """
    Sends document image/PDF to Gemini Vision API for OCR and structured data extraction.
    Returns dict with extracted fields.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return {
            "success": False,
            "error": "GEMINI_API_KEY is not configured.",
            "extracted_data": None
        }

    # Resolve absolute path if relative
    if not os.path.isabs(file_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(base_dir, file_path)

    if not os.path.exists(file_path):
        return {
            "success": False,
            "error": f"Document file not found at path: {file_path}",
            "extracted_data": None
        }

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in ['.jpg', '.jpeg']:
            mime_type = 'image/jpeg'
        elif ext == '.png':
            mime_type = 'image/png'
        elif ext == '.webp':
            mime_type = 'image/webp'
        elif ext == '.pdf':
            mime_type = 'application/pdf'
        else:
            mime_type = 'image/jpeg'

    try:
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
        
        base64_data = base64.b64encode(file_bytes).decode('utf-8')
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to read file bytes: {str(e)}",
            "extracted_data": None
        }

    prompt = (
        f"You are an AI Document Verification Specialist analyzing a submission for category '{doc_category}'. "
        "Perform OCR and structured extraction from this document. "
        "Extract the following fields carefully in strict JSON format:\n"
        "{\n"
        '  "document_type": "<e.g., Aadhaar, Driving License, Passport, Vet Degree, Pet Trainer Certificate, Government Photo ID, Unknown>",\n'
        '  "extracted_name": "<full name of the person shown on document, or null if unreadable>",\n'
        '  "document_number": "<ID number, license number, registration number, or certificate number, or null>",\n'
        '  "issuing_authority": "<issuing organization, university, or government authority, or null>",\n'
        '  "issue_date": "<YYYY-MM-DD or null>",\n'
        '  "expiry_date": "<YYYY-MM-DD or null>",\n'
        '  "is_readable": true or false,\n'
        '  "confidence_score": <number from 0 to 100 representing clarity and legibility>,\n'
        '  "raw_text_summary": "<brief summary of key visible text on document>"\n'
        "}\n"
        "Do not include markdown codeblocks around JSON. Return raw JSON string only."
    )

    gemini_payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_data
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }

    # Vision candidate models
    candidate_models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-3.6-flash"
    ]

    last_error_msg = None

    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(gemini_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = json.loads(response.read().decode('utf-8'))
                candidates = res_body.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        raw_json_str = parts[0].get("text", "").strip()
                        # Clean up markdown code blocks if model added them
                        if raw_json_str.startswith("```"):
                            lines = raw_json_str.splitlines()
                            if lines[0].startswith("```"):
                                lines = lines[1:]
                            if lines and lines[-1].startswith("```"):
                                lines = lines[:-1]
                            raw_json_str = "\n".join(lines).strip()
                        
                        extracted_json = json.loads(raw_json_str)
                        return {
                            "success": True,
                            "model_used": model,
                            "extracted_data": extracted_json
                        }
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode('utf-8')
                err_data = json.loads(err_body)
                detailed_err = err_data.get("error", {}).get("message", e.reason)
            except:
                detailed_err = e.reason
            last_error_msg = f"HTTP {e.code} ({model}): {detailed_err}"
            if e.code in [503, 429, 404]:
                continue
            else:
                break
        except urllib.error.URLError as url_err:
            last_error_msg = f"Connection error ({model}): {str(url_err.reason)}"
            continue
        except json.JSONDecodeError as json_err:
            last_error_msg = f"JSON parse error ({model}): {str(json_err)}"
            continue
        except Exception as ex:
            last_error_msg = f"Error ({model}): {str(ex)}"
            continue

    return {
        "success": False,
        "error": last_error_msg or "All Gemini models failed to process document.",
        "extracted_data": None
    }
