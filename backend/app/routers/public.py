from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, HTTPException, Request

from app.core.config import supabase
from app.schemas import ContactMessage
from app.services.data import normalize_row, rows, skill_groups
from app.services.email import send_contact_acknowledgement, send_contact_notification

router = APIRouter()
CONTACT_WINDOW_SECONDS = 3600
CONTACT_LIMIT = 5
contact_attempts: defaultdict[str, deque[float]] = defaultdict(deque)


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
def create_contact(message: ContactMessage, request: Request):
    if message.website:
        return {"ok": True, "message": "Thanks, your message was received."}
    client_key = request.client.host if request.client else "unknown"
    now = monotonic()
    attempts = contact_attempts[client_key]
    while attempts and now - attempts[0] > CONTACT_WINDOW_SECONDS:
        attempts.popleft()
    if len(attempts) >= CONTACT_LIMIT:
        raise HTTPException(status_code=429, detail="Too many messages from this address. Please try again later.")
    attempts.append(now)
    supabase.table("contacts").insert(message.model_dump(exclude={"website"})).execute()
    email_sent = send_contact_notification(message)
    acknowledgement_sent = send_contact_acknowledgement(message)
    return {
        "ok": True,
        "email_sent": email_sent,
        "acknowledgement_sent": acknowledgement_sent,
        "message": f"Thanks, {message.name}. Your message was received.",
    }


@router.get("/api/health")
def health():
    return {"status": "ok", "database": "supabase"}
