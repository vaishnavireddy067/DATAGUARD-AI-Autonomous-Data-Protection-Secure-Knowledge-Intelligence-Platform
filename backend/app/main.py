from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.services.seed_service import seed_initial_data
import app.models # Register all models with Base.metadata

from app.routers import (
    auth,
    documents,
    dashboard,
    audit_logs,
    users
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables (compatible with PostgreSQL and SQLite)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed default RBAC users (Admin, Manager, Employee)
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)
        
    yield
    # Cleanup on shutdown
    await engine.dispose()

app = FastAPI(
    title="DataGuard AI — Autonomous Data Protection & Secure Knowledge Intelligence Platform",
    description="Enterprise AI platform for document intelligence, pattern-based sensitive data detection, risk assessment, protection actions (mask/redact/restrict), and audit logging.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(audit_logs.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "DataGuard AI Core API",
        "version": settings.VERSION,
        "engine": "FastAPI + LangGraph + Async SQLAlchemy",
        "supported_formats": ["pdf", "docx", "txt", "csv", "xlsx"]
    }
