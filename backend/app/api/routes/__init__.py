"""API Routes Package.

Provides direct access to versioned and modular route definitions.
"""
from app.api.v1.api import api_router
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.leads import router as leads_router

__all__ = ["api_router", "auth_router", "leads_router", "dashboard_router"]
