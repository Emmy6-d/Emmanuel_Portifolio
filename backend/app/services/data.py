import secrets

from fastapi import Header, HTTPException, status

from app.core import config
from app.core.config import TABLES, supabase


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
    if not config.ADMIN_TOKEN or not x_admin_token or not secrets.compare_digest(x_admin_token, config.ADMIN_TOKEN):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid admin token required")


def response_row(response, default_row: dict):
    return normalize_row(response.data[0]) if response.data else default_row
