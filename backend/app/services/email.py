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


def send_contact_acknowledgement(message: ContactMessage) -> bool:
    if not SMTP_HOST or not SMTP_FROM_EMAIL:
        logger.warning("Contact acknowledgement email is not configured")
        return False

    email = EmailMessage()
    email["Subject"] = "Thanks for reaching out"
    email["From"] = f"Emmanuel <{SMTP_FROM_EMAIL}>"
    email["To"] = str(message.email)
    email["Reply-To"] = SMTP_FROM_EMAIL
    email.set_content(
        f"Hi {message.name},\n\n"
        "Thank you for getting in touch through my portfolio. "
        "I've received your message and will get back to you as soon as I can.\n\n"
        "Best,\n"
        "Emmanuel\n"
    )
    return deliver_email(email)
