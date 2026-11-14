from database import db
from datetime import datetime


# ==========================================
# USER MODEL
# ==========================================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(150), nullable=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    profile_photo = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "company": self.company,
            "email": self.email,
            "role": self.role,
            "profile_photo": self.profile_photo,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==========================================
# CANDIDATE PROFILE MODEL
# ==========================================

class CandidateProfile(db.Model):
    __tablename__ = "candidate_profiles"

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)

    phone = db.Column(db.String(30), nullable=True)
    location = db.Column(db.String(150), nullable=True)
    headline = db.Column(db.String(200), nullable=True)
    summary = db.Column(db.Text, nullable=True)
    date_of_birth = db.Column(db.String(30), nullable=True)

    education = db.Column(db.Text, nullable=True)
    college = db.Column(db.String(200), nullable=True)
    graduation_year = db.Column(db.String(10), nullable=True)
    cgpa = db.Column(db.String(20), nullable=True)

    skills = db.Column(db.Text, nullable=True)
    projects = db.Column(db.Text, nullable=True)
    internships = db.Column(db.Text, nullable=True)

    preferred_roles = db.Column(db.Text, nullable=True)
    preferred_locations = db.Column(db.Text, nullable=True)
    expected_salary = db.Column(db.String(80), nullable=True)
    experience_level = db.Column(db.String(50), nullable=True)

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "candidate_id": self.candidate_id,
            "phone": self.phone or "",
            "location": self.location or "",
            "headline": self.headline or "",
            "summary": self.summary or "",
            "date_of_birth": self.date_of_birth or "",
            "education": self.education or "",
            "college": self.college or "",
            "graduation_year": self.graduation_year or "",
            "cgpa": self.cgpa or "",
            "skills": self.skills or "",
            "projects": self.projects or "",
            "internships": self.internships or "",
            "preferred_roles": self.preferred_roles or "",
            "preferred_locations": self.preferred_locations or "",
            "expected_salary": self.expected_salary or "",
            "experience_level": self.experience_level or "",
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


# ==========================================
# JOB MODEL
# ==========================================

class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    company = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    job_type = db.Column(db.String(50), nullable=False)
    salary = db.Column(db.String(100))
    description = db.Column(db.Text, nullable=False)
    skills = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "recruiter_id": self.recruiter_id,
            "title": self.title, "company": self.company,
            "location": self.location, "job_type": self.job_type,
            "salary": self.salary, "description": self.description,
            "skills": self.skills,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==========================================
# APPLICATION MODEL
# ==========================================

class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)
    status = db.Column(db.String(30), default="Applied", nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("candidate_id", "job_id", name="unique_candidate_job_application"),)

    def to_dict(self):
        return {
            "id": self.id, "candidate_id": self.candidate_id,
            "job_id": self.job_id, "status": self.status,
            "applied_at": self.applied_at.isoformat() if self.applied_at else None
        }


# ==========================================
# SAVED JOB MODEL
# ==========================================

class SavedJob(db.Model):
    __tablename__ = "saved_jobs"

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("candidate_id", "job_id", name="unique_candidate_saved_job"),)

    def to_dict(self):
        return {
            "id": self.id, "candidate_id": self.candidate_id,
            "job_id": self.job_id,
            "saved_at": self.saved_at.isoformat() if self.saved_at else None
        }


# ==========================================
# NOTIFICATION MODEL
# ==========================================

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    application_id = db.Column(db.Integer, db.ForeignKey("applications.id"), nullable=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "candidate_id": self.candidate_id,
            "application_id": self.application_id, "title": self.title,
            "message": self.message, "status": self.status,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==========================================
# INTERVIEW ATTEMPT MODEL
# ==========================================

class InterviewAttempt(db.Model):
    __tablename__ = "interview_attempts"

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(30), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    percentage = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "candidate_id": self.candidate_id,
            "role": self.role, "difficulty": self.difficulty,
            "score": self.score, "total_questions": self.total_questions,
            "percentage": self.percentage,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
