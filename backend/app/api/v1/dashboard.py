from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import DashboardCharts, DashboardStats, FollowUpAlerts
from app.services.lead_service import lead_service

router = APIRouter()


@router.get(
    "/stats",
    response_model=DashboardStats,
    status_code=status.HTTP_200_OK,
    summary="Get 6 dashboard metric cards and conversion rate",
)
def get_dashboard_stats(
    view_all: bool = Query(
        False, description="Admin only: aggregate stats across all leads"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardStats:
    """Compute lead status totals and real conversion rate for authorized records."""
    return lead_service.get_dashboard_stats(db, current_user, view_all=view_all)


@router.get(
    "/charts",
    response_model=DashboardCharts,
    status_code=status.HTTP_200_OK,
    summary="Get status distribution and creation velocity trend data",
)
def get_dashboard_charts(
    view_all: bool = Query(False, description="Admin only: chart across all leads"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardCharts:
    """Retrieve aggregation data for donut distribution and creation velocity time series."""
    return lead_service.get_dashboard_charts(db, current_user, view_all=view_all)


@router.get(
    "/follow-ups",
    response_model=FollowUpAlerts,
    status_code=status.HTTP_200_OK,
    summary="Get upcoming and overdue follow-up leads",
)
def get_follow_up_alerts(
    view_all: bool = Query(False, description="Admin only: alerts across all leads"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FollowUpAlerts:
    """Retrieve upcoming and overdue follow-ups for active leads."""
    return lead_service.get_follow_up_alerts(db, current_user, view_all=view_all)
