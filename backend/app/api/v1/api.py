from fastapi import APIRouter

from app.api.v1 import auth, dashboard, leads

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
