import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Hospital(db.Model):
    __tablename__ = 'hospitals'
    
    id = db.Column(db.Integer, primary_key=True)
    hospital_name = db.Column(db.String(255), nullable=False)
    hospital_image = db.Column(db.String(255), nullable=True)
    address = db.Column(db.String(500), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    emergency_service = db.Column(db.Boolean, default=False, nullable=False)
    opening_hours = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_name": self.hospital_name,
            "hospital_image": self.hospital_image,
            "address": self.address,
            "city": self.city,
            "district": self.district,
            "state": self.state,
            "phone": self.phone,
            "email": self.email,
            "website": self.website,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "emergency_service": self.emergency_service,
            "opening_hours": self.opening_hours,
            "rating": self.rating,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

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
