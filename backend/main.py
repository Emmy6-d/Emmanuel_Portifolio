"""Compatibility entry point for `uvicorn main:app` deployments."""

from app.main import app, create_app

__all__ = ["app", "create_app"]
