import os
import logging
import os
import secrets
import smtplib
from email.message import EmailMessage
from uuid import uuid4
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from supabase import Client, create_client

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ADMIN_TOKEN = os.getenv("PORTFOLIO_ADMIN_TOKEN", "")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
CONTACT_NOTIFICATION_EMAIL = os.getenv("CONTACT_NOTIFICATION_EMAIL", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

logger = logging.getLogger(__name__)

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
TABLES = {"experiences", "projects", "education", "skills", "certifications", "languages", "contacts"}

app = FastAPI(title="Emmanuel Portfolio API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str


class ProfileUpdate(BaseModel):
    name: str
    role: str
    specialty: str
    location: str
    phone: str
    email: EmailStr
    intro: str
    bio: str
    availability: str
    positioning: str
    socials: dict[str, str] = Field(default_factory=dict)
    highlights: list[dict[str, str]] = Field(default_factory=list)
    growth_areas: list[str] = Field(default_factory=list)
    opportunity_tracks: list[str] = Field(default_factory=list)


class Experience(BaseModel):
    company: str
    role: str
    type: str
    period: str
    summary: str = ""
    description: str
    tags: list[str] = Field(default_factory=list)


class Project(BaseModel):
    title: str
    type: str
    description: str
    tags: list[str] = Field(default_factory=list)
    link: str = ""
    caseStudy: str | None = None
    accent: str = "blue"


class Education(BaseModel):
    qualification: str
    institution: str
    period: str
    detail: str = ""


class Item(BaseModel):
    value: str


class Skill(BaseModel):
    value: str
    category: str = "Other"


def normalize_row(row: dict):
    result = dict(row)
    if "case_study" in result:
        result["caseStudy"] = result.pop("case_study")
    result.pop("updated_at", None)
    result.pop("profile_image_path", None)
    result.pop("image_path", None)
    result.pop("company_logo_path", None)
    return result


def rows(table: str):
    if table not in TABLES:
        raise HTTPException(status_code=404, detail="Unknown resource")
    result = supabase.table(table).select("*").order("id").execute()
    return [normalize_row(row) for row in (result.data or [])]


def skill_groups():
    groups = {}
    for skill in rows("skills"):
        category = skill.get("category") or "Other"
        groups.setdefault(category, []).append(skill)
    return [{"name": name, "skills": items} for name, items in groups.items()]


def require_admin(x_admin_token: str | None = Header(default=None)):
    if not ADMIN_TOKEN or not x_admin_token or not secrets.compare_digest(x_admin_token, ADMIN_TOKEN):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid admin token required")


def response_row(response, default_row: dict):
    return normalize_row(response.data[0]) if response.data else default_row


def deliver_email(email: EmailMessage) -> bool:
    if not SMTP_HOST or not SMTP_FROM_EMAIL:
        logger.warning("SMTP email delivery is not configured")
        return False
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            if SMTP_USE_TLS:
                server.starttls()
                server.ehlo()
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(email)
        return True
    except Exception:
        logger.exception("Failed to deliver email")
        return False


def send_contact_notification(message: ContactMessage) -> bool:
    if not SMTP_HOST or not SMTP_FROM_EMAIL or not CONTACT_NOTIFICATION_EMAIL:
        logger.warning("Contact email notification is not configured")
        return False

    email = EmailMessage()
    email["Subject"] = f"New portfolio contact from {message.name}"
    email["From"] = f"Portfolio contact form <{SMTP_FROM_EMAIL}>"
    email["To"] = CONTACT_NOTIFICATION_EMAIL
    email["Reply-To"] = str(message.email)
    email.set_content(
        f"You received a new message through your portfolio contact form.\n\n"
        f"Name: {message.name}\n"
        f"Email: {message.email}\n\n"
        f"Message:\n{message.message}\n"
    )
    return deliver_email(email)


@app.get("/api/portfolio")
def get_portfolio():
    profile_response = supabase.table("profile").select("*").eq("id", 1).limit(1).execute()
    if not profile_response.data:
        raise HTTPException(status_code=503, detail="Portfolio profile is missing from Supabase")
    profile = normalize_row(profile_response.data[0])
    profile.pop("id", None)
    profile["experience"] = rows("experiences")
    profile["projects"] = rows("projects")
    profile["education"] = rows("education")
    for table in ("skills", "certifications", "languages"):
        profile[table] = [item["value"] for item in rows(table)]
    profile["skill_groups"] = skill_groups()
    return profile


@app.post("/api/contact")
def create_contact(message: ContactMessage):
    supabase.table("contacts").insert(message.model_dump()).execute()
    email_sent = send_contact_notification(message)
    return {"ok": True, "email_sent": email_sent, "message": f"Thanks, {message.name}. Your message was received."}


@app.get("/api/health")
def health():
    return {"status": "ok", "database": "supabase"}


@app.get("/api/admin/contacts", dependencies=[Depends(require_admin)])
def list_contacts():
    return rows("contacts")


@app.put("/api/admin/profile", dependencies=[Depends(require_admin)])
def update_profile(profile: ProfileUpdate):
    values = profile.model_dump()
    supabase.table("profile").update(values).eq("id", 1).execute()
    return values


@app.post("/api/admin/profile-image", dependencies=[Depends(require_admin)])
async def upload_profile_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
    extension = Path(file.filename or "image").suffix.lower() or ".bin"
    path = f"profile/{uuid4().hex}{extension}"
    current = supabase.table("profile").select("profile_image_path").eq("id", 1).limit(1).execute()
    old_path = current.data[0].get("profile_image_path") if current.data else None
    if old_path:
        supabase.storage.from_("portfolio-media").remove([old_path])
    supabase.storage.from_("portfolio-media").upload(path, content, {"content-type": file.content_type, "upsert": "true"})
    image_url = supabase.storage.from_("portfolio-media").get_public_url(path)
    supabase.table("profile").update({"profile_image_url": image_url, "profile_image_path": path}).eq("id", 1).execute()
    return {"profile_image_url": image_url}


@app.delete("/api/admin/profile-image", dependencies=[Depends(require_admin)])
def delete_profile_image():
    current = supabase.table("profile").select("profile_image_path").eq("id", 1).limit(1).execute()
    old_path = current.data[0].get("profile_image_path") if current.data else None
    if old_path:
        supabase.storage.from_("portfolio-media").remove([old_path])
    supabase.table("profile").update({"profile_image_url": None, "profile_image_path": None}).eq("id", 1).execute()
    return {"ok": True}


@app.post("/api/admin/projects/{project_id}/image", dependencies=[Depends(require_admin)])
async def upload_project_image(project_id: int, file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
    current = supabase.table("projects").select("id,image_path").eq("id", project_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Project not found")
    old_path = current.data[0].get("image_path")
    if old_path:
        supabase.storage.from_("portfolio-media").remove([old_path])
    extension = Path(file.filename or "image").suffix.lower() or ".bin"
    path = f"projects/{project_id}/{uuid4().hex}{extension}"
    supabase.storage.from_("portfolio-media").upload(path, content, {"content-type": file.content_type, "upsert": "true"})
    image_url = supabase.storage.from_("portfolio-media").get_public_url(path)
    supabase.table("projects").update({"image_url": image_url, "image_path": path}).eq("id", project_id).execute()
    return {"image_url": image_url}


@app.delete("/api/admin/projects/{project_id}/image", dependencies=[Depends(require_admin)])
def delete_project_image(project_id: int):
    current = supabase.table("projects").select("id,image_path").eq("id", project_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Project not found")
    old_path = current.data[0].get("image_path")
    if old_path:
        supabase.storage.from_("portfolio-media").remove([old_path])
    supabase.table("projects").update({"image_url": None, "image_path": None}).eq("id", project_id).execute()
    return {"ok": True}


@app.post("/api/admin/experiences/{experience_id}/images", dependencies=[Depends(require_admin)])
async def upload_experience_images(experience_id: int, files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="Select at least one image")
    current = supabase.table("experiences").select("id,image_urls,image_paths").eq("id", experience_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    existing = current.data[0]
    image_urls = existing.get("image_urls") or []
    image_paths = existing.get("image_paths") or []
    if len(image_urls) + len(files) > 4:
        raise HTTPException(status_code=400, detail="Each experience can have at most 4 images")

    image_content = []
    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"{file.filename or 'Image'} must be 5 MB or smaller")
        image_content.append((file, content))

    uploaded_paths = []
    for file, content in image_content:
        extension = Path(file.filename or "image").suffix.lower() or ".bin"
        path = f"experiences/{experience_id}/{uuid4().hex}{extension}"
        supabase.storage.from_("portfolio-media").upload(path, content, {"content-type": file.content_type, "upsert": "true"})
        uploaded_paths.append(path)
        image_urls.append(supabase.storage.from_("portfolio-media").get_public_url(path))
    image_paths.extend(uploaded_paths)
    supabase.table("experiences").update({"image_urls": image_urls, "image_paths": image_paths}).eq("id", experience_id).execute()
    return {"image_urls": image_urls}


@app.delete("/api/admin/experiences/{experience_id}/images/{image_index}", dependencies=[Depends(require_admin)])
def delete_experience_image(experience_id: int, image_index: int):
    current = supabase.table("experiences").select("id,image_urls,image_paths").eq("id", experience_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    image_urls = current.data[0].get("image_urls") or []
    image_paths = current.data[0].get("image_paths") or []
    if image_index < 0 or image_index >= len(image_urls):
        raise HTTPException(status_code=404, detail="Experience image not found")
    if image_index < len(image_paths) and image_paths[image_index]:
        supabase.storage.from_("portfolio-media").remove([image_paths[image_index]])
        image_paths.pop(image_index)
    image_urls.pop(image_index)
    supabase.table("experiences").update({"image_urls": image_urls, "image_paths": image_paths}).eq("id", experience_id).execute()
    return {"image_urls": image_urls}


@app.post("/api/admin/experiences/{experience_id}/company-logo", dependencies=[Depends(require_admin)])
async def upload_experience_company_logo(experience_id: int, file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Company logo must be 5 MB or smaller")
    current = supabase.table("experiences").select("id,company_logo_path").eq("id", experience_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    old_path = current.data[0].get("company_logo_path")
    extension = Path(file.filename or "logo").suffix.lower() or ".img"
    path = f"experiences/{experience_id}/company-logo-{uuid4().hex}{extension}"
    supabase.storage.from_("portfolio-media").upload(path, content, {"content-type": file.content_type, "upsert": "true"})
    logo_url = supabase.storage.from_("portfolio-media").get_public_url(path)
    supabase.table("experiences").update({"company_logo_url": logo_url, "company_logo_path": path}).eq("id", experience_id).execute()
    if old_path:
        supabase.storage.from_("portfolio-media").remove([old_path])
    return {"company_logo_url": logo_url}


@app.delete("/api/admin/experiences/{experience_id}/company-logo", dependencies=[Depends(require_admin)])
def delete_experience_company_logo(experience_id: int):
    current = supabase.table("experiences").select("id,company_logo_path").eq("id", experience_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    old_path = current.data[0].get("company_logo_path")
    supabase.table("experiences").update({"company_logo_url": None, "company_logo_path": None}).eq("id", experience_id).execute()
    if old_path:
        supabase.storage.from_("portfolio-media").remove([old_path])
    return {"ok": True}


@app.get("/api/admin/{resource}", dependencies=[Depends(require_admin)])
def list_resource(resource: str):
    return rows(resource)


@app.post("/api/admin/{resource}", dependencies=[Depends(require_admin)])
def create_resource(resource: str, payload: dict):
    if resource in {"certifications", "languages"}:
        item = Item.model_validate(payload).model_dump()
    elif resource == "skills":
        item = Skill.model_validate(payload).model_dump()
    elif resource == "experiences":
        item = Experience.model_validate(payload).model_dump()
    elif resource == "projects":
        item = Project.model_validate(payload).model_dump()
        item["case_study"] = item.pop("caseStudy")
    elif resource == "education":
        item = Education.model_validate(payload).model_dump()
    else:
        raise HTTPException(status_code=404, detail="Unknown resource")
    return response_row(supabase.table(resource).insert(item).execute(), item)


@app.put("/api/admin/{resource}/{item_id}", dependencies=[Depends(require_admin)])
def update_resource(resource: str, item_id: int, payload: dict):
    if resource == "skills":
        item = Skill.model_validate(payload).model_dump()
    elif resource == "experiences":
        item = Experience.model_validate(payload).model_dump()
    elif resource == "projects":
        item = Project.model_validate(payload).model_dump()
        item["case_study"] = item.pop("caseStudy")
    elif resource == "education":
        item = Education.model_validate(payload).model_dump()
    else:
        raise HTTPException(status_code=404, detail="Only structured resources can be updated")
    existing = supabase.table(resource).select("id").eq("id", item_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return response_row(supabase.table(resource).update(item).eq("id", item_id).execute(), {"id": item_id, **item})


@app.delete("/api/admin/{resource}/{item_id}", dependencies=[Depends(require_admin)])
def delete_resource(resource: str, item_id: int):
    if resource not in TABLES:
        raise HTTPException(status_code=404, detail="Unknown resource")
    selected_fields = {"projects": "id,image_path", "experiences": "id,image_paths,company_logo_path"}.get(resource, "id")
    existing = supabase.table(resource).select(selected_fields).eq("id", item_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")
    if resource == "projects" and existing.data[0].get("image_path"):
        supabase.storage.from_("portfolio-media").remove([existing.data[0]["image_path"]])
    if resource == "experiences":
        paths = existing.data[0].get("image_paths") or []
        logo_path = existing.data[0].get("company_logo_path")
        if logo_path:
            paths.append(logo_path)
        if paths:
            supabase.storage.from_("portfolio-media").remove(paths)
    supabase.table(resource).delete().eq("id", item_id).execute()
    return {"ok": True}
