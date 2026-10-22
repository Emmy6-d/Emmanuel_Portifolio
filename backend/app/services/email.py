import logging
import smtplib
from email.message import EmailMessage

from app.core.config import CONTACT_NOTIFICATION_EMAIL, SMTP_FROM_EMAIL, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USE_TLS, SMTP_USERNAME
from app.schemas import ContactMessage

logger = logging.getLogger(__name__)


def deliver_email(email: EmailMessage) -> bool:
    if not SMTP_HOST or not SMTP_FROM_EMAIL:
        logger.warning("SMTP email delivery is not configured")
        return False
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            if SMTP_USE_TLS:
                server.starttls()
                server.ehlo()
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(email)
        return True
    except Exception:
        logger.exception("Failed to deliver email")
        return False


def send_contact_notification(message: ContactMessage) -> bool:
    if not SMTP_HOST or not SMTP_FROM_EMAIL or not CONTACT_NOTIFICATION_EMAIL:
        logger.warning("Contact email notification is not configured")
        return False

    email = EmailMessage()
    email["Subject"] = f"New portfolio contact from {message.name}"
    email["From"] = f"Portfolio contact form <{SMTP_FROM_EMAIL}>"
    email["To"] = CONTACT_NOTIFICATION_EMAIL
    email["Reply-To"] = str(message.email)
    email.set_content(
        f"You received a new message through your portfolio contact form.\n\n"
        f"Name: {message.name}\n"
        f"Email: {message.email}\n\n"
        f"Message:\n{message.message}\n"
    )
    return deliver_email(email)
