from app.core import config
from conftest import api_request


def test_admin_route_requires_token(monkeypatch):
    monkeypatch.setattr(config, "ADMIN_TOKEN", "test-admin-token")

    response = api_request("GET", "/api/admin/contacts")

    assert response.status_code == 401
    assert response.json()["detail"] == "Valid admin token required"
