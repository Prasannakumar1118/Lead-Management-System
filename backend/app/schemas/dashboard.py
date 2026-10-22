from pydantic import BaseModel

from app.schemas.lead import LeadResponse


class DashboardStats(BaseModel):
    total_leads: int
    new_leads: int
    contacted_leads: int
    qualified_leads: int
    converted_leads: int
    lost_leads: int
    conversion_rate: float  # Percentage, e.g. 25.5 (0.0 if total is 0)


class ChartStatusItem(BaseModel):
    status: str
    count: int
    percentage: float


class ChartTrendItem(BaseModel):
    date: str
    count: int


class DashboardCharts(BaseModel):
    distribution: list[ChartStatusItem]
    trend: list[ChartTrendItem]


class FollowUpAlerts(BaseModel):
    upcoming: list[LeadResponse]
    overdue: list[LeadResponse]
