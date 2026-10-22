from conftest import api_request


def test_health_endpoint_is_available():
    response = api_request("GET", "/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_contact_rejects_invalid_email():
    response = api_request(
        "POST",
        "/api/contact",
        json={"name": "Visitor", "email": "not-an-email", "message": "Hello"},
    )

    assert response.status_code == 422
