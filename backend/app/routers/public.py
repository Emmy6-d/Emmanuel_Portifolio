from fastapi import APIRouter, HTTPException

from app.core.config import supabase
from app.schemas import ContactMessage
from app.services.data import normalize_row, rows, skill_groups
from app.services.email import send_contact_notification

router = APIRouter()


@router.get("/api/portfolio")
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


@router.post("/api/contact")
def create_contact(message: ContactMessage):
    supabase.table("contacts").insert(message.model_dump()).execute()
    email_sent = send_contact_notification(message)
    return {"ok": True, "email_sent": email_sent, "message": f"Thanks, {message.name}. Your message was received."}


@router.get("/api/health")
def health():
    return {"status": "ok", "database": "supabase"}
