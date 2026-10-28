from pathlib import Path
from dataclasses import dataclass
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import supabase

MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_WIDTH = 6000
MAX_IMAGE_HEIGHT = 6000
IMAGE_TYPES = {
    b"\xff\xd8\xff": ("image/jpeg", ".jpg"),
    b"\x89PNG\r\n\x1a\n": ("image/png", ".png"),
    b"GIF87a": ("image/gif", ".gif"),
    b"GIF89a": ("image/gif", ".gif"),
}


@dataclass(frozen=True)
class ValidatedImage:
    content: bytes
    content_type: str
    extension: str


def _image_metadata(content: bytes) -> tuple[str, str] | None:
    for signature, metadata in IMAGE_TYPES.items():
        if content.startswith(signature):
            return metadata
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp", ".webp"
    return None


def _image_dimensions(content: bytes, content_type: str) -> tuple[int, int] | None:
    if content_type == "image/jpeg":
        index = 2
        while index + 9 < len(content):
            if content[index] != 0xFF:
                index += 1
                continue
            marker = content[index + 1]
            index += 2
            if marker in {0xD8, 0xD9}:
                continue
            if index + 2 > len(content):
                break
            segment_length = int.from_bytes(content[index:index + 2], "big")
            if segment_length < 2 or index + segment_length > len(content):
                break
            if marker in set(range(0xC0, 0xC4)) | set(range(0xC5, 0xC8)) | set(range(0xC9, 0xCC)) | set(range(0xCD, 0xD0)):
                if segment_length >= 7:
                    return int.from_bytes(content[index + 5:index + 7], "big"), int.from_bytes(content[index + 3:index + 5], "big")
                break
            index += segment_length
    if content_type == "image/png" and len(content) >= 24:
        return int.from_bytes(content[16:20], "big"), int.from_bytes(content[20:24], "big")
    if content_type == "image/gif" and len(content) >= 10:
        return int.from_bytes(content[6:8], "little"), int.from_bytes(content[8:10], "little")
    if content_type == "image/webp" and len(content) >= 30 and content[12:16] == b"VP8X":
        return 1 + int.from_bytes(content[24:27], "little"), 1 + int.from_bytes(content[27:30], "little")
    return None


async def read_image(file: UploadFile) -> ValidatedImage:
    content = await file.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"{file.filename or 'Image'} must be 5 MB or smaller")
    metadata = _image_metadata(content)
    if not metadata:
        raise HTTPException(status_code=400, detail="Upload a valid JPEG, PNG, GIF, or WebP image")
    detected_type, detected_extension = metadata
    dimensions = _image_dimensions(content, detected_type)
    if dimensions and (dimensions[0] < 1 or dimensions[1] < 1 or dimensions[0] > MAX_IMAGE_WIDTH or dimensions[1] > MAX_IMAGE_HEIGHT):
        raise HTTPException(status_code=400, detail="Image dimensions must be no larger than 6000 by 6000 pixels")
    return ValidatedImage(content, detected_type, detected_extension)


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
