import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class EmergencyReport(db.Model):
    __tablename__ = 'emergency_reports'
    
    id = db.Column(db.String(50), primary_key=True)  # Format: GP-YYYY-XXX
    user_id = db.Column(db.String(100), nullable=False)
    contact_number = db.Column(db.String(50), nullable=False)
    animal_type = db.Column(db.String(100), nullable=False)
    emergency_type = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Pending', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "contact_number": self.contact_number,
            "animal_type": self.animal_type,
            "emergency_type": self.emergency_type,
            "severity": self.severity,
            "description": self.description,
            "image_path": self.image_path,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Trainer(db.Model):
    __tablename__ = 'trainers'
    
    id = db.Column(db.String(50), primary_key=True)  # Format: TR-YYYY-XXX
    name = db.Column(db.String(100), nullable=False)
    photo = db.Column(db.String(255), nullable=True)  # Profile photo path
    specialization = db.Column(db.String(100), nullable=False)  # Dogs, Cats, Birds, etc.
    experience = db.Column(db.Integer, nullable=False)  # Years of experience
    certifications = db.Column(db.Text, nullable=True)
    languages = db.Column(db.String(255), nullable=False)  # Comma-separated languages
    location = db.Column(db.String(100), nullable=False)  # City/State
    availability = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='Pending', nullable=False)  # Pending, Approved, Rejected
    is_published = db.Column(db.Boolean, default=False, nullable=False)
    
    # Document Verification & BGV Fields
    govt_id_path = db.Column(db.String(255), nullable=True)
    cert_doc_path = db.Column(db.String(255), nullable=True)
    verification_status = db.Column(db.String(50), default='PENDING_VERIFICATION', nullable=False)
    ocr_data_json = db.Column(db.Text, nullable=True)
    name_match_score = db.Column(db.Integer, nullable=True)
    expiry_status = db.Column(db.String(50), nullable=True)
    duplicate_status = db.Column(db.String(50), nullable=True)
    contact_status = db.Column(db.String(50), nullable=True)
    authenticity_status = db.Column(db.String(50), default='UNAUDITED', nullable=True)  # GENUINE, SUSPICIOUS, FAKE_FLAGGED
    risk_score = db.Column(db.Integer, default=0, nullable=True)  # 0 to 100 risk score
    rejection_reason = db.Column(db.Text, nullable=True)
    verified_by = db.Column(db.String(100), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "photo": self.photo,
            "specialization": self.specialization,
            "experience": self.experience,
            "certifications": self.certifications,
            "languages": self.languages,
            "location": self.location,
            "availability": self.availability,
            "phone": self.phone,
            "email": self.email,
            "bio": self.bio,
            "status": self.status,
            "is_published": self.is_published,
            "govt_id_path": self.govt_id_path,
            "cert_doc_path": self.cert_doc_path,
            "verification_status": self.verification_status,
            "ocr_data_json": self.ocr_data_json,
            "name_match_score": self.name_match_score,
            "expiry_status": self.expiry_status,
            "duplicate_status": self.duplicate_status,
            "contact_status": self.contact_status,
            "authenticity_status": self.authenticity_status,
            "risk_score": self.risk_score,
            "rejection_reason": self.rejection_reason,
            "verified_by": self.verified_by,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
