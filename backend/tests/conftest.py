import asyncio
import os
from importlib import import_module

from httpx import ASGITransport, AsyncClient

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-only-key")
os.environ.setdefault("PORTFOLIO_ADMIN_TOKEN", "test-only-admin-token")
app = import_module("app.main").app


async def _request_api(method, path, **kwargs):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        return await client.request(method, path, **kwargs)


def api_request(method, path, **kwargs):
    return asyncio.run(_request_api(method, path, **kwargs))
