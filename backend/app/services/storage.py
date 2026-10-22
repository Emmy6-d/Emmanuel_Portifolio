from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import supabase

MAX_IMAGE_BYTES = 5 * 1024 * 1024


async def read_image(file: UploadFile) -> bytes:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    content = await file.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"{file.filename or 'Image'} must be 5 MB or smaller")
    return content


def image_path(folder: str, filename: str | None, fallback_extension: str = ".bin") -> str:
    extension = Path(filename or "image").suffix.lower() or fallback_extension
    return f"{folder}/{uuid4().hex}{extension}"


def upload_image(path: str, content: bytes, content_type: str | None) -> str:
    supabase.storage.from_("portfolio-media").upload(
        path,
        content,
        {"content-type": content_type or "application/octet-stream", "upsert": "true"},
    )
    return supabase.storage.from_("portfolio-media").get_public_url(path)


def delete_images(paths: list[str]) -> None:
    existing_paths = [path for path in paths if path]
    if existing_paths:
        supabase.storage.from_("portfolio-media").remove(existing_paths)
