from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.routers import admin, public


def create_app() -> FastAPI:
    application = FastAPI(title="Emmanuel Portfolio API", version="2.0.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(public.router)
    application.include_router(admin.router)
    return application


app = create_app()
