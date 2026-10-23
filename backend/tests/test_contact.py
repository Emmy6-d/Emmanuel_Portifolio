from unittest.mock import Mock

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


def test_contact_sends_notification_and_visitor_acknowledgement(monkeypatch):
    from app.routers import public

    insert = Mock()
    monkeypatch.setattr(public.supabase, "table", lambda _name: Mock(insert=lambda _data: insert))
    monkeypatch.setattr(public, "send_contact_notification", lambda _message: True)
    monkeypatch.setattr(public, "send_contact_acknowledgement", lambda _message: True)

    response = api_request(
        "POST",
        "/api/contact",
        json={"name": "Visitor", "email": "visitor@example.com", "message": "Hello"},
    )

    assert response.status_code == 200
    assert response.json()["email_sent"] is True
    assert response.json()["acknowledgement_sent"] is True
    insert.execute.assert_called_once()


def test_contact_acknowledgement_addresses_the_visitor(monkeypatch):
    from app.schemas import ContactMessage
    from app.services import email

    sent_emails = []
    monkeypatch.setattr(email, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(email, "SMTP_FROM_EMAIL", "portfolio@example.com")
    monkeypatch.setattr(email, "deliver_email", lambda message: sent_emails.append(message) or True)

    sent = email.send_contact_acknowledgement(
        ContactMessage(name="Visitor", email="visitor@example.com", message="Hello")
    )

    assert sent is True
    assert sent_emails[0]["To"] == "visitor@example.com"
    assert sent_emails[0]["Reply-To"] == "portfolio@example.com"
    assert "Hi Visitor" in sent_emails[0].get_content()
