import asyncio
from io import BytesIO

import pytest
from fastapi import UploadFile

from app.services.storage import read_image


def _png(width: int = 1, height: int = 1) -> bytes:
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * 8 + width.to_bytes(4, "big") + height.to_bytes(4, "big")


def test_image_validation_uses_content_not_client_mime_type():
    upload = UploadFile(filename="portrait.txt", file=BytesIO(_png()), headers={"content-type": "text/plain"})

    content = asyncio.run(read_image(upload))

    assert content.content.startswith(b"\x89PNG")
    assert content.content_type == "image/png"
    assert content.extension == ".png"


def test_image_validation_rejects_non_image_content():
    upload = UploadFile(filename="payload.png", file=BytesIO(b"not an image"))

    with pytest.raises(Exception, match="valid JPEG"):
        asyncio.run(read_image(upload))


def test_image_validation_rejects_oversized_dimensions():
    upload = UploadFile(filename="large.png", file=BytesIO(_png(6001, 1)))

    with pytest.raises(Exception, match="6000"):
        asyncio.run(read_image(upload))
