import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from io import BytesIO

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from werkzeug.utils import secure_filename
from sqlalchemy import inspect, text
from pypdf import PdfReader

from database import db
from models import (
    User,
    Job,
    Application,
    SavedJob,
    Notification,
    InterviewAttempt,
    CandidateProfile
)


# ==========================================
# CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

PROFILE_FOLDER = BASE_DIR / "uploads" / "profiles"
RESUME_FOLDER = BASE_DIR / "uploads" / "resumes"

PROFILE_FOLDER.mkdir(parents=True, exist_ok=True)
RESUME_FOLDER.mkdir(parents=True, exist_ok=True)

INSTANCE_FOLDER = BASE_DIR / "instance"
INSTANCE_FOLDER.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{INSTANCE_FOLDER / 'nexora.db'}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

# JWT configuration. Set JWT_SECRET_KEY as an environment variable
# before deployment. The fallback is only for local development.
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

if not app.config["JWT_SECRET_KEY"]:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is not configured."
    )
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour

jwt = JWTManager(app)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"]
        }
    },
    supports_credentials=False
)
db.init_app(app)


# ==========================================
# RESUME DOCUMENT MODEL
# ==========================================

class ResumeDocument(db.Model):
    __tablename__ = "resume_documents"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)

    uploaded_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# ==========================================
# SKILL DICTIONARY
# ==========================================

SKILLS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "node.js",
    "flask",
    "django",
    "sql",
    "mysql",
    "mongodb",
    "html",
    "css",
    "bootstrap",
    "power bi",
    "excel",
    "pandas",
    "numpy",
    "machine learning",
    "data analysis",
    "data visualization",
    "git",
    "rest api",
    "express.js",
    "next.js",
    "firebase",
    "aws",
    "docker",
    "kubernetes",
    "communication",
    "problem solving",
    "agile",
    "testing",
    "pytest",
    "selenium",
    "c++",
    "c",
    "rust",
    "linux"
]


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def allowed_photo(photo):
    """Check the photo extension and its file signature."""
    filename = secure_filename(photo.filename or "").lower()

    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1]

    if extension not in {"png", "jpg", "jpeg", "webp"}:
        return False

    header = photo.read(12)
    photo.seek(0)

    if extension == "png":
        return header.startswith(b"\\x89PNG\\r\\n\\x1a\\n")

    if extension in {"jpg", "jpeg"}:
        return header.startswith(b"\\xff\\xd8\\xff")

    if extension == "webp":
        return header.startswith(b"RIFF") and header[8:12] == b"WEBP"

    return False


def extract_pdf_text(file_path):
    try:
        reader = PdfReader(str(file_path))
        text_content = ""

        for page in reader.pages:
            text_content += page.extract_text() or ""

        return text_content.lower()

    except Exception:
        return ""


def extract_skills(text_content):
    found = []

    for skill in SKILLS:
        pattern = (
            r"(?<![a-z0-9])"
            + re.escape(skill)
            + r"(?![a-z0-9])"
        )

        if re.search(pattern, text_content, re.IGNORECASE):
            found.append(skill)

    return found


def calculate_match(resume_text, job):
    candidate_skills = set(extract_skills(resume_text))

    job_text = (
        f"{job.title} {job.description} {job.skills}"
    ).lower()

    required_skills = extract_skills(job_text)

    if not required_skills:
        return {
            "match_percentage": 0,
            "matched_skills": [],
            "missing_skills": [],
            "message": "No recognizable skills found in this job description."
        }

    matched = [
        skill for skill in required_skills
        if skill in candidate_skills
    ]

    missing = [
        skill for skill in required_skills
        if skill not in candidate_skills
    ]

    percentage = round(
        len(matched) / len(required_skills) * 100
    )

    return {
        "match_percentage": percentage,
        "matched_skills": matched,
        "missing_skills": missing,
        "message": (
            "Strong match" if percentage >= 75
            else "Moderate match" if percentage >= 45
            else "Skills gap identified"
        )
    }


def get_profile_photo_url(user):
    if user.profile_photo:
        return f"/uploads/profiles/{user.profile_photo}"

    return None


def get_resume_document(user_id):
    return ResumeDocument.query.filter_by(
        user_id=user_id
    ).first()


def user_response(user):
    data = user.to_dict()

    data["profile_photo_url"] = get_profile_photo_url(user)

    resume = get_resume_document(user.id)

    data["has_resume"] = resume is not None

    return data


def get_application_details(application):
    job = db.session.get(Job, application.job_id)
    candidate = db.session.get(User, application.candidate_id)

    return {
        "application": application.to_dict(),
        "job": job.to_dict() if job else None,
        "candidate": user_response(candidate) if candidate else None
    }


def get_resume_for_candidate(candidate_id):
    document = get_resume_document(candidate_id)

    if not document:
        return None

    path = RESUME_FOLDER / document.filename

    if not path.is_file():
        return None

    return document, path


# ==========================================
# HOME AND HEALTH
# ==========================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Welcome to NEXORA AI Backend",
        "status": "Running"
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "application": "NEXORA AI",
        "database": "SQLite"
    })

@app.route("/api/auth-check", methods=["GET"])
@jwt_required()
def auth_check():

    current_user_id = get_jwt_identity()
    claims = get_jwt()

    return jsonify({
        "message": "JWT authentication successful!",
        "user_id": current_user_id,
        "role": claims.get("role")
    }), 200


# ==========================================
# REGISTRATION
# ==========================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "").strip().lower()
    company = data.get("company", "").strip()

    if not name or not email or not password or not role:
        return jsonify({
            "message": "Please fill all required fields."
        }), 400

    if role not in ["candidate", "recruiter"]:
        return jsonify({
            "message": "Invalid user role."
        }), 400

    if len(password) < 6:
        return jsonify({
            "message": "Password must contain at least 6 characters."
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "message": "Email already registered."
        }), 409

    new_user = User(
        name=name,
        email=email,
        company=company if role == "recruiter" else None,
        password_hash=generate_password_hash(password),
        role=role
    )

    try:
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": "Registration successful!",
            "user": user_response(new_user)
        }), 201

    except Exception as error:
        db.session.rollback()
        print("Registration error:", error)

        return jsonify({
            "message": "Registration failed."
        }), 500


# ==========================================
# LOGIN
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(
        user.password_hash, password
    ):
        return jsonify({
            "message": "Invalid email or password."
        }), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    return jsonify({
        "message": "Login successful!",
        "access_token": access_token,
        "user": user_response(user)
    }), 200
# ==========================================
# PROFILE PHOTO UPLOAD
# ==========================================

@app.route("/api/profile-photo/<int:user_id>", methods=["POST"])
@jwt_required()
def upload_profile_photo(user_id):
    current_user_id = get_jwt_identity()

    if str(user_id) != str(current_user_id):
        return jsonify({
            "message": "You are not authorized to update this profile."
        }), 403

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"message": "User not found."}), 404

    photo = request.files.get("photo")

    if not photo or not photo.filename:
        return jsonify({
            "message": "Please select a profile photo."
        }), 400

    if not allowed_photo(photo):
        return jsonify({
            "message": "Only JPG, JPEG, PNG and WEBP images are allowed."
        }), 400

    extension = secure_filename(photo.filename).rsplit(".", 1)[1].lower()
    filename = f"user_{user.id}_{uuid.uuid4().hex}.{extension}"
    file_path = PROFILE_FOLDER / filename

    try:
        photo.save(file_path)

        old_photo = user.profile_photo
        user.profile_photo = filename

        db.session.commit()

        if old_photo:
            old_path = PROFILE_FOLDER / old_photo

            if old_path.is_file():
                old_path.unlink()

        return jsonify({
            "message": "Profile photo uploaded successfully!",
            "user": user_response(user)
        }), 200

    except Exception as error:
        db.session.rollback()

        if file_path.exists():
            file_path.unlink()

        print("Profile photo error:", error)

        return jsonify({
            "message": "Unable to upload profile photo."
        }), 500


# ==========================================
# GET PROFILE
# ==========================================

@app.route("/api/profile/<int:user_id>", methods=["GET"])
@jwt_required()
def get_profile(user_id):
    current_user_id = get_jwt_identity()
    if str(user_id) != str(current_user_id):
        return jsonify({"message": "You are not authorized to view this profile."}), 403

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"message": "User not found."}), 404

    return jsonify({
        "user": user_response(user)
    }), 200


@app.route("/api/profile/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_profile(user_id):
    current_user_id = get_jwt_identity()

    if str(user_id) != str(current_user_id):
        return jsonify({
            "message": "You are not authorized to update this account."
        }), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    company = str(data.get("company", "")).strip()
    email = str(data.get("email", "")).strip().lower()

    if not name or not company or not email:
        return jsonify({
            "message": "Name, company, and email are required."
        }), 400

    if "@" not in email:
        return jsonify({"message": "Please enter a valid email address."}), 400

    existing_user = User.query.filter(
        User.email == email,
        User.id != user_id
    ).first()

    if existing_user:
        return jsonify({
            "message": "This email address is already registered."
        }), 409

    user.name = name
    user.company = company
    user.email = email

    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully.",
        "user": user_response(user)
    }), 200



# ==========================================
# SERVE PROFILE PHOTOS
# ==========================================

@app.route("/uploads/profiles/<path:filename>", methods=["GET"])
def serve_profile_photo(filename):
    return send_from_directory(PROFILE_FOLDER, filename)


# ==========================================
# CANDIDATE RESUME UPLOAD
# ==========================================

@app.route("/api/resume/<int:user_id>", methods=["POST"])
@jwt_required()
def upload_resume(user_id):

    current_user_id = get_jwt_identity()

    if str(user_id) != str(current_user_id):
        return jsonify({
            "message": "You are not authorized to upload a resume for this account."
        }), 403

    user = db.session.get(User, user_id)

    if not user or user.role != "candidate":
        return jsonify({
            "message": "Candidate account not found."
        }), 404

    resume = request.files.get("resume")

    if not resume or not resume.filename:
        return jsonify({
            "message": "Please select your resume PDF."
        }), 400

    if not resume.filename.lower().endswith(".pdf"):
        return jsonify({
            "message": "Only PDF resumes are supported."
        }), 400

    content = resume.read()

    if len(content) > 5 * 1024 * 1024:
        return jsonify({
            "message": "Resume must be smaller than 5 MB."
        }), 400

    if not content.startswith(b"%PDF-"):
        return jsonify({
            "message": "The uploaded file is not a valid PDF."
        }), 400

    try:
        reader = PdfReader(BytesIO(content))

        resume_text = "".join(
            page.extract_text() or ""
            for page in reader.pages
        )

        if not resume_text.strip():
            return jsonify({
                "message": "This PDF contains no readable text."
            }), 400

    except Exception:
        return jsonify({
            "message": "Unable to read this PDF."
        }), 400

    original_filename = secure_filename(resume.filename)
    filename = f"candidate_{user.id}_{uuid.uuid4().hex}.pdf"
    file_path = RESUME_FOLDER / filename

    old_document = get_resume_document(user.id)
    old_filename = old_document.filename if old_document else None

    try:
        file_path.write_bytes(content)

        if old_document:
            old_document.filename = filename
            old_document.original_filename = original_filename
            old_document.uploaded_at = datetime.utcnow()
        else:
            db.session.add(ResumeDocument(
                user_id=user.id,
                filename=filename,
                original_filename=original_filename
            ))

        db.session.commit()

        if old_filename:
            old_path = RESUME_FOLDER / old_filename

            if old_path.is_file():
                old_path.unlink()

        return jsonify({
            "message": "Resume uploaded successfully!",
            "original_filename": original_filename,
            "uploaded_at": datetime.utcnow().isoformat()
        }), 200

    except Exception as error:
        db.session.rollback()

        if file_path.exists():
            file_path.unlink()

        print("Resume upload error:", error)

        return jsonify({
            "message": "Unable to upload resume."
        }), 500


# ==========================================
# VIEW / DOWNLOAD CANDIDATE RESUME
# ==========================================

@app.route(
    "/api/resumes/<int:candidate_id>/download",
    methods=["GET"]
)
@jwt_required()
def download_candidate_resume(candidate_id):
    recruiter_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "recruiter":
        return jsonify({"message": "Recruiter access required."}), 403

    recruiter = db.session.get(User, recruiter_id)

    if not recruiter or recruiter.role != "recruiter":
        return jsonify({
            "message": "Valid recruiter account required."
        }), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({
            "message": "Candidate not found."
        }), 404

    has_applied = (
        db.session.query(Application.id)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.candidate_id == candidate_id,
            Job.recruiter_id == recruiter_id
        )
        .first()
    )

    if not has_applied:
        return jsonify({
            "message": "You cannot access this candidate's resume."
        }), 403

    resume_data = get_resume_for_candidate(candidate_id)

    if not resume_data:
        return jsonify({
            "message": "Candidate has not uploaded a resume."
        }), 404

    document, file_path = resume_data

    return send_from_directory(
        RESUME_FOLDER,
        document.filename,
        as_attachment=request.args.get("download") == "1",
        download_name=document.original_filename,
        mimetype="application/pdf"
    )


# ==========================================
# CREATE JOB
# ==========================================

@app.route("/api/jobs", methods=["POST"])
@jwt_required()
def create_job():
    current_user_id = get_jwt_identity()
    claims = get_jwt()

    if claims.get("role") != "recruiter":
        return jsonify({"message": "Recruiter access required."}), 403

    recruiter = db.session.get(User, int(current_user_id))
    if not recruiter or recruiter.role != "recruiter":
        return jsonify({"message": "Valid recruiter account required."}), 403

    data = request.get_json(silent=True) or {}

    required_fields = [
        "title",
        "company",
        "location",
        "job_type",
        "description",
        "skills"
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({
                "message": f"{field} is required."
            }), 400

    new_job = Job(
        recruiter_id=recruiter.id,
        title=data["title"],
        company=data["company"],
        location=data["location"],
        job_type=data["job_type"],
        salary=data.get("salary", ""),
        description=data["description"],
        skills=data["skills"]
    )

    try:
        db.session.add(new_job)
        db.session.commit()

        return jsonify({
            "message": "Job posted successfully!",
            "job": new_job.to_dict()
        }), 201

    except Exception as error:
        db.session.rollback()
        print("Job creation error:", error)

        return jsonify({
            "message": "Unable to create job."
        }), 500


# ==========================================
# GET ALL JOBS
# ==========================================

@app.route("/api/jobs", methods=["GET"])
def get_jobs():

    jobs = Job.query.order_by(
        Job.created_at.desc()
    ).all()

    return jsonify([
        job.to_dict() for job in jobs
    ]), 200


# ==========================================
# GET SINGLE JOB
# ==========================================

@app.route("/api/jobs/<int:job_id>", methods=["GET"])
def get_single_job(job_id):

    job = db.session.get(Job, job_id)

    if not job:
        return jsonify({
            "message": "Job not found."
        }), 404

    return jsonify(job.to_dict()), 200


# ==========================================
# GET RECRUITER JOBS
# ==========================================

@app.route(
    "/api/recruiter/<int:recruiter_id>/jobs",
    methods=["GET"]
)
@jwt_required()
def get_recruiter_jobs(recruiter_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    if str(recruiter_id) != str(current_user_id) or claims.get("role") != "recruiter":
        return jsonify({"message": "You are not authorized to view these jobs."}), 403

    jobs = Job.query.filter_by(
        recruiter_id=recruiter_id
    ).order_by(Job.created_at.desc()).all()

    return jsonify([
        job.to_dict() for job in jobs
    ]), 200


# ==========================================
# APPLY FOR JOB
# ==========================================

@app.route("/api/applications", methods=["POST"])
@jwt_required()
def apply_for_job():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    if claims.get("role") != "candidate":
        return jsonify({"message": "Candidate access required."}), 403

    candidate_id = int(current_user_id)
    data = request.get_json(silent=True) or {}
    job_id = data.get("job_id")

    if not job_id:
        return jsonify({"message": "Job ID is required."}), 400

    candidate = db.session.get(User, candidate_id)
    job = db.session.get(Job, job_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({
            "message": "Valid candidate account required."
        }), 403

    if not job:
        return jsonify({
            "message": "Job not found."
        }), 404

    existing = Application.query.filter_by(
        candidate_id=candidate_id,
        job_id=job_id
    ).first()

    if existing:
        return jsonify({
            "message": "You have already applied for this job."
        }), 409

    application = Application(
        candidate_id=candidate_id,
        job_id=job_id,
        status="Applied"
    )

    try:
        db.session.add(application)
        db.session.commit()

        return jsonify({
            "message": "Job application submitted successfully!",
            "application": application.to_dict()
        }), 201

    except Exception as error:
        db.session.rollback()
        print("Application error:", error)

        return jsonify({
            "message": "Unable to submit application."
        }), 500
    # ==========================================
# CANDIDATE APPLICATIONS
# ==========================================

@app.route(
    "/api/candidate/<int:candidate_id>/applications",
    methods=["GET"]
)
@jwt_required()
def get_candidate_applications(candidate_id):
    claims = get_jwt()
    if str(candidate_id) != str(get_jwt_identity()) or claims.get("role") != "candidate":
        return jsonify({"message": "You are not authorized to view these applications."}), 403

    applications = Application.query.filter_by(
        candidate_id=candidate_id
    ).order_by(Application.applied_at.desc()).all()

    result = []

    for application in applications:
        details = get_application_details(application)

        if details["job"]:
            result.append({
                "application": details["application"],
                "job": details["job"]
            })

    return jsonify(result), 200


# ==========================================
# RECRUITER APPLICANTS + MATCH SCORE
# ==========================================

@app.route(
    "/api/recruiter/<int:recruiter_id>/applicants",
    methods=["GET"]
)
@jwt_required()
def get_recruiter_applicants(recruiter_id):
    claims = get_jwt()
    if str(recruiter_id) != str(get_jwt_identity()) or claims.get("role") != "recruiter":
        return jsonify({"message": "You are not authorized to view these applicants."}), 403

    recruiter = db.session.get(User, recruiter_id)

    if not recruiter or recruiter.role != "recruiter":
        return jsonify({
            "message": "Recruiter not found."
        }), 404

    jobs = Job.query.filter_by(
        recruiter_id=recruiter_id
    ).all()

    job_ids = [job.id for job in jobs]

    applications = (
        Application.query.filter(
            Application.job_id.in_(job_ids)
        )
        .order_by(Application.applied_at.desc())
        .all()
        if job_ids else []
    )

    result = []

    for application in applications:
        details = get_application_details(application)

        if not details["job"] or not details["candidate"]:
            continue

        candidate = db.session.get(
            User,
            application.candidate_id
        )

        job = db.session.get(Job, application.job_id)

        resume_data = get_resume_for_candidate(candidate.id)

        if resume_data:
            _, resume_path = resume_data
            resume_text = extract_pdf_text(resume_path)

            if resume_text.strip():
                match = calculate_match(resume_text, job)
            else:
                match = {
                    "match_percentage": None,
                    "matched_skills": [],
                    "missing_skills": [],
                    "message": "Resume text could not be extracted."
                }
        else:
            match = {
                "match_percentage": None,
                "matched_skills": [],
                "missing_skills": [],
                "message": "Resume not uploaded."
            }

        result.append({
            "application": details["application"],
            "job": details["job"],
            "candidate": details["candidate"],
            "match": match
        })

    return jsonify(result), 200


# ==========================================
# UPDATE APPLICATION STATUS
# ==========================================

@app.route(
    "/api/applications/<int:application_id>/status",
    methods=["PATCH"]
)
@jwt_required()
def update_application_status(application_id):
    recruiter_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get("role") != "recruiter":
        return jsonify({"message": "Recruiter access required."}), 403

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    allowed_statuses = [
        "Applied",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "message": "Invalid application status."
        }), 400

    application = db.session.get(
        Application,
        application_id
    )

    if not application:
        return jsonify({
            "message": "Application not found."
        }), 404

    job = db.session.get(Job, application.job_id)

    if not job or job.recruiter_id != recruiter_id:
        return jsonify({
            "message": "You are not authorized to update this application."
        }), 403

    old_status = application.status

    try:
        application.status = new_status

        if old_status != new_status:
            notification = Notification(
                candidate_id=application.candidate_id,
                application_id=application.id,
                title="Application Status Updated",
                message=(
                    f"Your application for {job.title} at "
                    f"{job.company} has been updated to {new_status}."
                ),
                status=new_status
            )
            db.session.add(notification)

        db.session.commit()

        return jsonify({
            "message": "Application status updated successfully!",
            "application": application.to_dict()
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Status update error:", error)

        return jsonify({
            "message": "Unable to update application status."
        }), 500


# ==========================================
# AI JOB MATCHING API
# ==========================================

@app.route(
    "/api/match-job/<int:job_id>/<int:candidate_id>",
    methods=["GET"]
)
@jwt_required()
def match_candidate_to_job(job_id, candidate_id):
    claims = get_jwt()
    if str(candidate_id) != str(get_jwt_identity()) or claims.get("role") != "candidate":
        return jsonify({"message": "You are not authorized to match this resume."}), 403

    job = db.session.get(Job, job_id)
    candidate = db.session.get(User, candidate_id)

    if not job:
        return jsonify({"message": "Job not found."}), 404

    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    resume_data = get_resume_for_candidate(candidate_id)

    if not resume_data:
        return jsonify({
            "message": "Please upload a resume before matching."
        }), 404

    _, resume_path = resume_data
    resume_text = extract_pdf_text(resume_path)

    if not resume_text.strip():
        return jsonify({
            "message": "Unable to extract readable resume text."
        }), 400

    match = calculate_match(resume_text, job)

    return jsonify({
        "job_id": job.id,
        "candidate_id": candidate.id,
        "job_title": job.title,
        "candidate_name": candidate.name,
        **match
    }), 200


# ==========================================
# RESUME ANALYSIS
# ==========================================

@app.route("/api/analyze-resume", methods=["POST"])
@jwt_required()
def analyze_resume():
    if get_jwt().get("role") != "candidate":
        return jsonify({
            "message": "Candidate access required."
        }), 403

    resume = request.files.get("resume")

    if not resume or not resume.filename:
        return jsonify({
            "message": "Please upload your resume PDF."
        }), 400

    if not resume.filename.lower().endswith(".pdf"):
        return jsonify({
            "message": "Only PDF resumes are supported."
        }), 400

    content = resume.read()

    if len(content) > 5 * 1024 * 1024:
        return jsonify({
            "message": "Resume must be smaller than 5 MB."
        }), 400

    if not content.startswith(b"%PDF-"):
        return jsonify({
            "message": "The uploaded file is not a valid PDF."
        }), 400

    try:
        pdf_reader = PdfReader(BytesIO(content))

        resume_text = "".join(
            page.extract_text() or ""
            for page in pdf_reader.pages
        ).lower()

        if not resume_text.strip():
            return jsonify({
                "message": "No readable text found in this PDF."
            }), 400

        matched_skills = extract_skills(resume_text)

        missing_skills = [
            skill for skill in SKILLS
            if skill not in matched_skills
        ]

        ats_score = round(
            len(matched_skills) / len(SKILLS) * 100
        )

        suggestions = []

        if "project" not in resume_text:
            suggestions.append(
                "Add relevant academic or personal projects."
            )

        if not any(
            word in resume_text
            for word in ["experience", "internship"]
        ):
            suggestions.append(
                "Include internship or practical experience if available."
            )

        if "education" not in resume_text:
            suggestions.append(
                "Include a clear education section."
            )

        if not suggestions:
            suggestions.append(
                "Tailor your resume to each job description."
            )

        return jsonify({
            "message": "Resume analyzed successfully.",
            "ats_score": ats_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "suggestions": suggestions,
            "summary": (
                f"Your resume contains {len(matched_skills)} "
                f"of the {len(SKILLS)} skills in our keyword list."
            )
        }), 200

    except Exception as error:
        print("Resume analysis error:", error)

        return jsonify({
            "message": "Unable to analyze this PDF."
        }), 400


# ==========================================\n# SAVED JOBS API
# ==========================================

@app.route("/api/saved-jobs", methods=["POST"])
@jwt_required()
def save_job():
    if get_jwt().get("role") != "candidate":
        return jsonify({"message": "Candidate access required."}), 403

    candidate_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    job_id = data.get("job_id")
    if not job_id:
        return jsonify({"message": "Job ID is required."}), 400

    candidate = db.session.get(User, candidate_id)
    job = db.session.get(Job, job_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Valid candidate account required."}), 403

    if not job:
        return jsonify({"message": "Job not found."}), 404

    existing = SavedJob.query.filter_by(
        candidate_id=candidate_id,
        job_id=job_id
    ).first()

    if existing:
        return jsonify({"message": "This job is already saved."}), 409

    saved_job = SavedJob(candidate_id=candidate_id, job_id=job_id)

    try:
        db.session.add(saved_job)
        db.session.commit()

        return jsonify({
            "message": "Job saved successfully!",
            "saved_job": saved_job.to_dict()
        }), 201

    except Exception as error:
        db.session.rollback()
        print("Save job error:", error)
        return jsonify({"message": "Unable to save this job."}), 500


@app.route("/api/saved-jobs/<int:candidate_id>", methods=["GET"])
@jwt_required()
def get_saved_jobs(candidate_id):
    if str(candidate_id) != str(get_jwt_identity()) or get_jwt().get("role") != "candidate":
        return jsonify({"message": "You are not authorized to view saved jobs."}), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    saved_jobs = SavedJob.query.filter_by(
        candidate_id=candidate_id
    ).order_by(SavedJob.saved_at.desc()).all()

    result = []

    for saved_job in saved_jobs:
        job = db.session.get(Job, saved_job.job_id)

        if job:
            result.append({
                "saved_job": saved_job.to_dict(),
                "job": job.to_dict()
            })

    return jsonify(result), 200


@app.route(
    "/api/saved-jobs/<int:candidate_id>/<int:job_id>",
    methods=["DELETE"]
)
@jwt_required()
def remove_saved_job(candidate_id, job_id):
    if str(candidate_id) != str(get_jwt_identity()) or get_jwt().get("role") != "candidate":
        return jsonify({"message": "You are not authorized to remove saved jobs."}), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    saved_job = SavedJob.query.filter_by(
        candidate_id=candidate_id,
        job_id=job_id
    ).first()

    if not saved_job:
        return jsonify({"message": "Saved job not found."}), 404

    try:
        db.session.delete(saved_job)
        db.session.commit()

        return jsonify({
            "message": "Job removed from saved jobs."
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Remove saved job error:", error)

        return jsonify({
            "message": "Unable to remove saved job."
        }), 500


# ==========================================
# PERMANENT NOTIFICATIONS API
# ==========================================

@app.route("/api/notifications/<int:candidate_id>", methods=["GET"])
@jwt_required()
def get_candidate_notifications(candidate_id):
    if str(candidate_id) != str(get_jwt_identity()) or get_jwt().get("role") != "candidate":
        return jsonify({"message": "You are not authorized to view these notifications."}), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    notifications = Notification.query.filter_by(
        candidate_id=candidate_id
    ).order_by(Notification.created_at.desc()).all()

    return jsonify([
        notification.to_dict()
        for notification in notifications
    ]), 200


@app.route(
    "/api/notifications/<int:candidate_id>/read-all",
    methods=["PATCH"]
)
@jwt_required()
def mark_all_notifications_read(candidate_id):
    if str(candidate_id) != str(get_jwt_identity()) or get_jwt().get("role") != "candidate":
        return jsonify({"message": "You are not authorized to update these notifications."}), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    try:
        Notification.query.filter_by(
            candidate_id=candidate_id,
            is_read=False
        ).update({"is_read": True})

        db.session.commit()

        return jsonify({
            "message": "All notifications marked as read."
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Mark all notifications read error:", error)

        return jsonify({
            "message": "Unable to update notifications."
        }), 500


@app.route(
    "/api/notifications/<int:candidate_id>/<int:notification_id>/read",
    methods=["PATCH"]
)
@jwt_required()
def mark_notification_read(candidate_id, notification_id):
    if str(candidate_id) != str(get_jwt_identity()) or get_jwt().get("role") != "candidate":
        return jsonify({"message": "You are not authorized to update this notification."}), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    notification = Notification.query.filter_by(
        id=notification_id,
        candidate_id=candidate_id
    ).first()

    if not notification:
        return jsonify({"message": "Notification not found."}), 404

    try:
        notification.is_read = True
        db.session.commit()

        return jsonify({
            "message": "Notification marked as read."
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Mark notification read error:", error)

        return jsonify({
            "message": "Unable to update notification."
        }), 500


# ==========================================
# INTERVIEW PREPARATION HISTORY API
# ==========================================

# SAVE INTERVIEW RESULT
@app.route("/api/interview-attempts", methods=["POST"])
@jwt_required()
def save_interview_attempt():
    if get_jwt().get("role") != "candidate":
        return jsonify({"message": "Candidate access required."}), 403

    candidate_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    role = data.get("role")
    difficulty = data.get("difficulty")
    score = data.get("score")
    total_questions = data.get("total_questions")

    if not all([
        role,
        difficulty,
        score is not None,
        total_questions is not None
    ]):
        return jsonify({
            "message": "All interview result fields are required."
        }), 400

    try:
        candidate_id = int(candidate_id)
        score = int(score)
        total_questions = int(total_questions)
    except (ValueError, TypeError):
        return jsonify({
            "message": "Invalid interview result values."
        }), 400

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({
            "message": "Valid candidate account required."
        }), 404

    if (
        not isinstance(role, str)
        or not role.strip()
        or not isinstance(difficulty, str)
        or difficulty not in [
            "All", "Beginner", "Intermediate", "Advanced"
        ]
    ):
        return jsonify({
            "message": "Invalid role or difficulty."
        }), 400

    if (
        total_questions <= 0
        or score < 0
        or score > total_questions
    ):
        return jsonify({
            "message": "Invalid score or question count."
        }), 400

    percentage = round(
        (score / total_questions) * 100,
        2
    )

    attempt = InterviewAttempt(
        candidate_id=candidate_id,
        role=role.strip(),
        difficulty=difficulty,
        score=score,
        total_questions=total_questions,
        percentage=percentage
    )

    try:
        db.session.add(attempt)
        db.session.commit()

        return jsonify({
            "message": "Interview result saved successfully!",
            "attempt": attempt.to_dict()
        }), 201

    except Exception as error:
        db.session.rollback()
        print("Interview save error:", error)

        return jsonify({
            "message": "Unable to save interview result."
        }), 500


# GET CANDIDATE INTERVIEW HISTORY
@app.route(
    "/api/interview-attempts/<int:candidate_id>",
    methods=["GET"]
)
@jwt_required()
def get_interview_attempts(candidate_id):
    if str(candidate_id) != str(get_jwt_identity()) or get_jwt().get("role") != "candidate":
        return jsonify({"message": "You are not authorized to view this interview history."}), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({
            "message": "Candidate not found."
        }), 404

    attempts = InterviewAttempt.query.filter_by(
        candidate_id=candidate_id
    ).order_by(
        InterviewAttempt.created_at.desc()
    ).all()

    return jsonify([
        attempt.to_dict()
        for attempt in attempts
    ]), 200


# GET CANDIDATE INTERVIEW STATISTICS
@app.route(
    "/api/interview-stats/<int:candidate_id>",
    methods=["GET"]
)
@jwt_required()
def get_interview_stats(candidate_id):
    if str(candidate_id) != str(get_jwt_identity()) or get_jwt().get("role") != "candidate":
        return jsonify({"message": "You are not authorized to view these interview statistics."}), 403

    candidate = db.session.get(User, candidate_id)

    if not candidate or candidate.role != "candidate":
        return jsonify({
            "message": "Candidate not found."
        }), 404

    attempts = InterviewAttempt.query.filter_by(
        candidate_id=candidate_id
    ).all()

    total_attempts = len(attempts)

    if total_attempts == 0:
        return jsonify({
            "total_attempts": 0,
            "average_score": 0,
            "best_score": 0,
            "total_questions_answered": 0,
            "total_correct_answers": 0
        }), 200

    percentages = [
        attempt.percentage for attempt in attempts
    ]

    return jsonify({
        "total_attempts": total_attempts,
        "average_score": round(
            sum(percentages) / total_attempts, 2
        ),
        "best_score": max(percentages),
        "total_questions_answered": sum(
            attempt.total_questions for attempt in attempts
        ),
        "total_correct_answers": sum(
            attempt.score for attempt in attempts
        )
    }), 200


# ==========================================


# ==========================================
# CANDIDATE PROFILE API
# ==========================================

@app.route("/api/candidate-profile/<int:candidate_id>", methods=["GET"])
@jwt_required()
def get_candidate_profile(candidate_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()

    if str(candidate_id) != str(current_user_id) or claims.get("role") != "candidate":
        return jsonify({"message": "You are not authorized to view this profile."}), 403

    candidate = db.session.get(User, candidate_id)
    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    profile = CandidateProfile.query.filter_by(candidate_id=candidate_id).first()
    return jsonify({
        "user": user_response(candidate),
        "profile": profile.to_dict() if profile else {
            "candidate_id": candidate_id,
            "phone": "", "location": "", "headline": "", "summary": "",
            "date_of_birth": "", "education": "", "college": "",
            "graduation_year": "", "cgpa": "", "skills": "",
            "projects": "", "internships": "", "preferred_roles": "",
            "preferred_locations": "", "expected_salary": "",
            "experience_level": "Fresher"
        }
    }), 200


@app.route("/api/candidate-profile/<int:candidate_id>", methods=["PUT"])
@jwt_required()
def update_candidate_profile(candidate_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()

    if str(candidate_id) != str(current_user_id) or claims.get("role") != "candidate":
        return jsonify({"message": "You are not authorized to update this profile."}), 403

    candidate = db.session.get(User, candidate_id)
    if not candidate or candidate.role != "candidate":
        return jsonify({"message": "Candidate not found."}), 404

    data = request.get_json(silent=True) or {}
    allowed_fields = [
        "phone", "location", "headline", "summary", "date_of_birth",
        "education", "college", "graduation_year", "cgpa", "skills",
        "projects", "internships", "preferred_roles",
        "preferred_locations", "expected_salary", "experience_level"
    ]

    profile = CandidateProfile.query.filter_by(candidate_id=candidate_id).first()
    if profile is None:
        profile = CandidateProfile(candidate_id=candidate_id)
        db.session.add(profile)

    for field in allowed_fields:
        value = data.get(field, "")
        if value is None:
            value = ""
        if not isinstance(value, str):
            return jsonify({"message": f"{field} must be text."}), 400
        setattr(profile, field, value.strip())

    try:
        db.session.commit()
        return jsonify({
            "message": "Candidate profile saved successfully!",
            "profile": profile.to_dict()
        }), 200
    except Exception as error:
        db.session.rollback()
        print("Candidate profile save error:", error)
        return jsonify({"message": "Unable to save candidate profile."}), 500


# DATABASE INITIALIZATION
# ==========================================

with app.app_context():

    db.create_all()

    inspector = inspect(db.engine)

    columns = [
        column["name"]
        for column in inspector.get_columns("users")
    ]

    if "profile_photo" not in columns:
        with db.engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN profile_photo VARCHAR(255)"
                )
            )

        print("Profile photo column added successfully!")

    print("NEXORA AI database initialized successfully!")


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )