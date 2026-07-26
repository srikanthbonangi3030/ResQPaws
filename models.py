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
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
