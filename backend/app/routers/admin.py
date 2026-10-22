from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import TABLES, supabase
from app.schemas import Education, Experience, Item, ProfileUpdate, Project, Skill
from app.services.data import require_admin, response_row, rows
from app.services.storage import delete_images, image_path, read_image, upload_image

router = APIRouter()


@router.get("/api/admin/contacts", dependencies=[Depends(require_admin)])
def list_contacts():
    return rows("contacts")


@router.put("/api/admin/profile", dependencies=[Depends(require_admin)])
def update_profile(profile: ProfileUpdate):
    values = profile.model_dump()
    supabase.table("profile").update(values).eq("id", 1).execute()
    return values


@router.post("/api/admin/profile-image", dependencies=[Depends(require_admin)])
async def upload_profile_image(file: UploadFile = File(...)):
    content = await read_image(file)
    path = image_path("profile", file.filename)
    current = supabase.table("profile").select("profile_image_path").eq("id", 1).limit(1).execute()
    old_path = current.data[0].get("profile_image_path") if current.data else None
    if old_path:
        delete_images([old_path])
    image_url = upload_image(path, content, file.content_type)
    supabase.table("profile").update({"profile_image_url": image_url, "profile_image_path": path}).eq("id", 1).execute()
    return {"profile_image_url": image_url}


@router.delete("/api/admin/profile-image", dependencies=[Depends(require_admin)])
def delete_profile_image():
    current = supabase.table("profile").select("profile_image_path").eq("id", 1).limit(1).execute()
    old_path = current.data[0].get("profile_image_path") if current.data else None
    if old_path:
        delete_images([old_path])
    supabase.table("profile").update({"profile_image_url": None, "profile_image_path": None}).eq("id", 1).execute()
    return {"ok": True}


@router.post("/api/admin/projects/{project_id}/image", dependencies=[Depends(require_admin)])
async def upload_project_image(project_id: int, file: UploadFile = File(...)):
    content = await read_image(file)
    current = supabase.table("projects").select("id,image_path").eq("id", project_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Project not found")
    old_path = current.data[0].get("image_path")
    if old_path:
        delete_images([old_path])
    path = image_path(f"projects/{project_id}", file.filename)
    image_url = upload_image(path, content, file.content_type)
    supabase.table("projects").update({"image_url": image_url, "image_path": path}).eq("id", project_id).execute()
    return {"image_url": image_url}


@router.delete("/api/admin/projects/{project_id}/image", dependencies=[Depends(require_admin)])
def delete_project_image(project_id: int):
    current = supabase.table("projects").select("id,image_path").eq("id", project_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Project not found")
    old_path = current.data[0].get("image_path")
    if old_path:
        delete_images([old_path])
    supabase.table("projects").update({"image_url": None, "image_path": None}).eq("id", project_id).execute()
    return {"ok": True}


@router.post("/api/admin/experiences/{experience_id}/images", dependencies=[Depends(require_admin)])
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
        content = await read_image(file)
        image_content.append((file, content))

    uploaded_paths = []
    for file, content in image_content:
        path = image_path(f"experiences/{experience_id}", file.filename)
        uploaded_paths.append(path)
        image_urls.append(upload_image(path, content, file.content_type))
    image_paths.extend(uploaded_paths)
    supabase.table("experiences").update({"image_urls": image_urls, "image_paths": image_paths}).eq("id", experience_id).execute()
    return {"image_urls": image_urls}


@router.delete("/api/admin/experiences/{experience_id}/images/{image_index}", dependencies=[Depends(require_admin)])
def delete_experience_image(experience_id: int, image_index: int):
    current = supabase.table("experiences").select("id,image_urls,image_paths").eq("id", experience_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    image_urls = current.data[0].get("image_urls") or []
    image_paths = current.data[0].get("image_paths") or []
    if image_index < 0 or image_index >= len(image_urls):
        raise HTTPException(status_code=404, detail="Experience image not found")
    if image_index < len(image_paths) and image_paths[image_index]:
        delete_images([image_paths[image_index]])
        image_paths.pop(image_index)
    image_urls.pop(image_index)
    supabase.table("experiences").update({"image_urls": image_urls, "image_paths": image_paths}).eq("id", experience_id).execute()
    return {"image_urls": image_urls}


@router.post("/api/admin/experiences/{experience_id}/company-logo", dependencies=[Depends(require_admin)])
async def upload_experience_company_logo(experience_id: int, file: UploadFile = File(...)):
    content = await read_image(file)
    current = supabase.table("experiences").select("id,company_logo_path").eq("id", experience_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    old_path = current.data[0].get("company_logo_path")
    path = image_path(f"experiences/{experience_id}", f"company-logo-{file.filename or 'logo'}", ".img")
    logo_url = upload_image(path, content, file.content_type)
    supabase.table("experiences").update({"company_logo_url": logo_url, "company_logo_path": path}).eq("id", experience_id).execute()
    if old_path:
        delete_images([old_path])
    return {"company_logo_url": logo_url}


@router.delete("/api/admin/experiences/{experience_id}/company-logo", dependencies=[Depends(require_admin)])
def delete_experience_company_logo(experience_id: int):
    current = supabase.table("experiences").select("id,company_logo_path").eq("id", experience_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    old_path = current.data[0].get("company_logo_path")
    supabase.table("experiences").update({"company_logo_url": None, "company_logo_path": None}).eq("id", experience_id).execute()
    if old_path:
        delete_images([old_path])
    return {"ok": True}


@router.get("/api/admin/{resource}", dependencies=[Depends(require_admin)])
def list_resource(resource: str):
    return rows(resource)


@router.post("/api/admin/{resource}", dependencies=[Depends(require_admin)])
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


@router.put("/api/admin/{resource}/{item_id}", dependencies=[Depends(require_admin)])
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


@router.delete("/api/admin/{resource}/{item_id}", dependencies=[Depends(require_admin)])
def delete_resource(resource: str, item_id: int):
    if resource not in TABLES:
        raise HTTPException(status_code=404, detail="Unknown resource")
    selected_fields = {"projects": "id,image_path", "experiences": "id,image_paths,company_logo_path"}.get(resource, "id")
    existing = supabase.table(resource).select(selected_fields).eq("id", item_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")
    if resource == "projects" and existing.data[0].get("image_path"):
        delete_images([existing.data[0]["image_path"]])
    if resource == "experiences":
        paths = existing.data[0].get("image_paths") or []
        logo_path = existing.data[0].get("company_logo_path")
        if logo_path:
            paths.append(logo_path)
        if paths:
            delete_images(paths)
    supabase.table(resource).delete().eq("id", item_id).execute()
    return {"ok": True}
