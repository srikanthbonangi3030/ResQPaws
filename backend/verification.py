import os
import re
import json
import datetime
from difflib import SequenceMatcher

# Import OCR module
from backend.ocr import analyze_document_with_gemini

def normalize_name(name):
    """Normalize name string by stripping titles, special characters, and converting to lowercase."""
    if not name:
        return ""
    name = str(name).lower().strip()
    # Strip common titles
    titles = [r'\bmr\b', r'\bmrs\b', r'\bms\b', r'\bdr\b', r'\btrainer\b', r'\bprof\b', r'\bshri\b', r'\bsmt\b']
    for t in titles:
        name = re.sub(t, '', name)
    # Remove special characters
    name = re.sub(r'[^a-z0-9\s]', '', name)
    # Normalize spaces
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def calculate_name_match(registered_name, document_name):
    """
    Calculate fuzzy similarity score (0 to 100) between registered trainer name and document extracted name.
    """
    if not registered_name or not document_name:
        return {
            "score": 0.0,
            "status": "UNABLE_TO_MATCH",
            "details": "Missing registered or document extracted name"
        }

    norm_reg = normalize_name(registered_name)
    norm_doc = normalize_name(document_name)

    if not norm_reg or not norm_doc:
        return {
            "score": 0.0,
            "status": "UNABLE_TO_MATCH",
            "details": "Name empty after normalization"
        }

    # Exact match after normalization
    if norm_reg == norm_doc:
        return {
            "score": 100.0,
            "status": "EXACT_MATCH",
            "details": f"Exact match between '{registered_name}' and '{document_name}'"
        }

    # Sequence matcher ratio
    ratio = SequenceMatcher(None, norm_reg, norm_doc).ratio() * 100.0
    score = round(ratio, 1)

    # Word set match check for inverted names (e.g., "John Doe" vs "Doe John")
    reg_words = set(norm_reg.split())
    doc_words = set(norm_doc.split())
    if reg_words and doc_words and reg_words == doc_words:
        score = max(score, 95.0)

    # Substring containment check
    if norm_reg in norm_doc or norm_doc in norm_reg:
        score = max(score, 85.0)

    if score >= 85.0:
        status = "HIGH_MATCH"
    elif score >= 60.0:
        status = "PARTIAL_MATCH"
    else:
        status = "LOW_MATCH"

    return {
        "score": score,
        "status": status,
        "details": f"Similarity score {score}% between '{registered_name}' and '{document_name}'"
    }

def validate_expiry(expiry_date_str):
    """
    Check if document expiry date is valid, expiring soon, or expired.
    """
    if not expiry_date_str or expiry_date_str.lower() in ['null', 'none', 'n/a', 'lifetime']:
        return {
            "status": "NO_EXPIRY",
            "is_valid": True,
            "expiry_date": None,
            "details": "No expiry date specified on document (or lifetime validity)"
        }

    # Attempt parsing YYYY-MM-DD
    parsed_date = None
    date_formats = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"]

    for fmt in date_formats:
        try:
            parsed_date = datetime.datetime.strptime(str(expiry_date_str).strip(), fmt).date()
            break
        except ValueError:
            continue

    if not parsed_date:
        return {
            "status": "UNPARSEABLE_DATE",
            "is_valid": True,
            "expiry_date": str(expiry_date_str),
            "details": f"Could not parse expiry date string '{expiry_date_str}'"
        }

    today = datetime.date.today()
    days_left = (parsed_date - today).days

    if days_left < 0:
        return {
            "status": "EXPIRED",
            "is_valid": False,
            "expiry_date": parsed_date.strftime("%Y-%m-%d"),
            "days_left": days_left,
            "details": f"Document expired {abs(days_left)} days ago on {parsed_date}"
        }
    elif days_left <= 30:
        return {
            "status": "EXPIRING_SOON",
            "is_valid": True,
            "expiry_date": parsed_date.strftime("%Y-%m-%d"),
            "days_left": days_left,
            "details": f"Document expires in {days_left} days on {parsed_date}"
        }
    else:
        return {
            "status": "VALID",
            "is_valid": True,
            "expiry_date": parsed_date.strftime("%Y-%m-%d"),
            "days_left": days_left,
            "details": f"Document valid until {parsed_date}"
        }

def check_duplicate_document(doc_number, current_trainer_id, Trainer_model, db_session):
    """
    Check if doc_number already exists in database under another trainer.
    """
    if not doc_number or str(doc_number).lower() in ['null', 'none', 'n/a']:
        return {
            "is_duplicate": False,
            "matched_trainer_id": None,
            "details": "No document number provided for duplicate check"
        }

    doc_num_clean = str(doc_number).strip().lower()

    # Search all trainers
    trainers = Trainer_model.query.filter(Trainer_model.id != current_trainer_id).all()
    for t in trainers:
        if t.ocr_data_json:
            try:
                ocr_data = json.loads(t.ocr_data_json) if isinstance(t.ocr_data_json, str) else t.ocr_data_json
                # Check govt ID and cert doc OCR records
                govt_ocr = ocr_data.get("govt_id_ocr", {}).get("extracted_data", {})
                cert_ocr = ocr_data.get("cert_doc_ocr", {}).get("extracted_data", {})

                existing_nums = [
                    str(govt_ocr.get("document_number") or "").strip().lower(),
                    str(cert_ocr.get("document_number") or "").strip().lower()
                ]

                if doc_num_clean in existing_nums and doc_num_clean != "":
                    return {
                        "is_duplicate": True,
                        "matched_trainer_id": t.id,
                        "matched_trainer_name": t.name,
                        "details": f"Document number '{doc_number}' matches existing Trainer {t.id} ({t.name})"
                    }
            except Exception:
                continue

    return {
        "is_duplicate": False,
        "matched_trainer_id": None,
        "details": "No duplicate document number found"
    }

def check_contact_validity(phone, email):
    """
    Validate contact information format.
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    phone_clean = re.sub(r'[^\d+]', '', str(phone or ''))

    email_valid = bool(re.match(email_regex, str(email or '').strip()))
    phone_valid = bool(len(phone_clean) >= 10 and len(phone_clean) <= 15)

    return {
        "email_valid": email_valid,
        "phone_valid": phone_valid,
        "details": f"Email valid: {email_valid}, Phone valid: {phone_valid}"
    }

def process_trainer_verification(trainer, Trainer_model, db_session):
    """
    Runs Gemini Vision OCR on uploaded documents and computes granular verification metrics.
    Updates trainer database model directly.
    """
    govt_ocr_result = None
    cert_ocr_result = None

    # 1. OCR Govt Photo ID if uploaded
    if trainer.govt_id_path:
        govt_ocr_result = analyze_document_with_gemini(trainer.govt_id_path, doc_category="Government Photo ID")

    # 2. OCR Qualification Certificate if uploaded
    if trainer.cert_doc_path:
        cert_ocr_result = analyze_document_with_gemini(trainer.cert_doc_path, doc_category="Qualification Certificate")

    # 3. Extract names and evaluate name matching
    govt_extracted_name = None
    if govt_ocr_result and govt_ocr_result.get("success") and govt_ocr_result.get("extracted_data"):
        govt_extracted_name = govt_ocr_result["extracted_data"].get("extracted_name")

    cert_extracted_name = None
    if cert_ocr_result and cert_ocr_result.get("success") and cert_ocr_result.get("extracted_data"):
        cert_extracted_name = cert_ocr_result["extracted_data"].get("extracted_name")

    # Primary document for name match: Govt ID first, then Certificate
    best_doc_name = govt_extracted_name or cert_extracted_name
    name_match_res = calculate_name_match(trainer.name, best_doc_name)

    # 4. Expiry Check
    govt_expiry_res = None
    if govt_ocr_result and govt_ocr_result.get("success") and govt_ocr_result.get("extracted_data"):
        govt_expiry_res = validate_expiry(govt_ocr_result["extracted_data"].get("expiry_date"))

    cert_expiry_res = None
    if cert_ocr_result and cert_ocr_result.get("success") and cert_ocr_result.get("extracted_data"):
        cert_expiry_res = validate_expiry(cert_ocr_result["extracted_data"].get("expiry_date"))

    expiry_status_str = "VALID"
    if (govt_expiry_res and govt_expiry_res["status"] == "EXPIRED") or (cert_expiry_res and cert_expiry_res["status"] == "EXPIRED"):
        expiry_status_str = "EXPIRED"
    elif (govt_expiry_res and govt_expiry_res["status"] == "EXPIRING_SOON") or (cert_expiry_res and cert_expiry_res["status"] == "EXPIRING_SOON"):
        expiry_status_str = "EXPIRING_SOON"

    # 5. Duplicate Check
    govt_doc_num = govt_ocr_result["extracted_data"].get("document_number") if (govt_ocr_result and govt_ocr_result.get("success") and govt_ocr_result.get("extracted_data")) else None
    cert_doc_num = cert_ocr_result["extracted_data"].get("document_number") if (cert_ocr_result and cert_ocr_result.get("success") and cert_ocr_result.get("extracted_data")) else None

    dup_govt_res = check_duplicate_document(govt_doc_num, trainer.id, Trainer_model, db_session)
    dup_cert_res = check_duplicate_document(cert_doc_num, trainer.id, Trainer_model, db_session)

    is_duplicate = dup_govt_res["is_duplicate"] or dup_cert_res["is_duplicate"]
    duplicate_status_str = "DUPLICATE_FOUND" if is_duplicate else "UNIQUE"

    # 6. Contact Validity Check
    contact_res = check_contact_validity(trainer.phone, trainer.email)
    contact_status_str = "VALID" if (contact_res["email_valid"] and contact_res["phone_valid"]) else "INVALID_FORMAT"

    # Aggregate OCR payload
    combined_ocr_payload = {
        "processed_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "govt_id_ocr": govt_ocr_result,
        "cert_doc_ocr": cert_ocr_result,
        "name_match_analysis": name_match_res,
        "govt_expiry_analysis": govt_expiry_res,
        "cert_expiry_analysis": cert_expiry_res,
        "govt_duplicate_analysis": dup_govt_res,
        "cert_duplicate_analysis": dup_cert_res,
        "contact_analysis": contact_res
    }

    # Update database record
    trainer.ocr_data_json = json.dumps(combined_ocr_payload)
    trainer.name_match_score = name_match_res["score"]
    trainer.expiry_status = expiry_status_str
    trainer.duplicate_status = duplicate_status_str
    trainer.contact_status = contact_status_str
    trainer.verification_status = "PENDING_ADMIN_REVIEW"

    try:
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        print(f"Error saving trainer verification result for {trainer.id}: {str(e)}")

    return combined_ocr_payload
