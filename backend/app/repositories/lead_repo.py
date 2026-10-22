import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.dashboard import (
    ChartStatusItem,
    ChartTrendItem,
    DashboardCharts,
    DashboardStats,
    FollowUpAlerts,
)
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate

SORTABLE_COLUMNS = {
    "created_at": Lead.created_at,
    "name": Lead.name,
    "company": Lead.company,
    "follow_up_date": Lead.follow_up_date,
    "status": Lead.status,
}


class LeadRepository:
    @staticmethod
    def get_by_id(db: Session, lead_id: uuid.UUID) -> Lead | None:
        return db.get(Lead, lead_id)

    @staticmethod
    def get_multi(
        db: Session,
        owner_id: uuid.UUID | None = None,
        search: str | None = None,
        statuses: list[str] | None = None,
        created_after: datetime | None = None,
        created_before: datetime | None = None,
        follow_up_after: datetime | None = None,
        follow_up_before: datetime | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Lead], int]:
        query = select(Lead)

        # Scoped by owner if provided (multi-tenancy)
        if owner_id:
            query = query.where(Lead.owner_id == owner_id)

        # Search across name, email, phone_number
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Lead.name.ilike(term),
                    Lead.email.ilike(term),
                    Lead.phone_number.ilike(term),
                    Lead.company.ilike(term),
                )
            )

        # Filter by status list
        if statuses and len(statuses) > 0:
            query = query.where(Lead.status.in_(statuses))

        # Filter by created_at range
        if created_after:
            query = query.where(Lead.created_at >= created_after)
        if created_before:
            query = query.where(Lead.created_at <= created_before)

        # Filter by follow_up_date range
        if follow_up_after:
            query = query.where(Lead.follow_up_date >= follow_up_after)
        if follow_up_before:
            query = query.where(Lead.follow_up_date <= follow_up_before)

        # Count total matching records
        count_stmt = select(func.count()).select_from(query.subquery())
        total = db.execute(count_stmt).scalar() or 0

        # Sorting
        sort_column = SORTABLE_COLUMNS.get(sort_by, Lead.created_at)
        query = (
            query.order_by(asc(sort_column))
            if sort_dir.lower() == "asc"
            else query.order_by(desc(sort_column))
        )

        # Pagination
        query = query.offset(skip).limit(limit)
        items = list(db.execute(query).scalars().all())

        return items, total

    @staticmethod
    def create(db: Session, owner_id: uuid.UUID, lead_in: LeadCreate) -> Lead:
        lead = Lead(
            id=uuid.uuid4(),
            owner_id=owner_id,
            name=lead_in.name.strip(),
            email=lead_in.email.strip().lower() if lead_in.email else None,
            phone_number=lead_in.phone_number.strip() if lead_in.phone_number else None,
            company=lead_in.company.strip() if lead_in.company else None,
            service_interested=lead_in.service_interested.strip()
            if lead_in.service_interested
            else None,
            status=lead_in.status,
            follow_up_date=lead_in.follow_up_date,
            notes=lead_in.notes.strip() if lead_in.notes else None,
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead

    @staticmethod
    def update(db: Session, db_lead: Lead, lead_in: LeadUpdate) -> Lead:
        update_data = lead_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "email" and value:
                value = value.strip().lower()
            elif isinstance(value, str):
                value = value.strip()
            setattr(db_lead, field, value)

        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        return db_lead

    @staticmethod
    def delete(db: Session, db_lead: Lead) -> None:
        db.delete(db_lead)
        db.commit()

    @staticmethod
    def get_dashboard_stats(
        db: Session, owner_id: uuid.UUID | None = None
    ) -> DashboardStats:
        query = select(Lead.status, func.count(Lead.id)).group_by(Lead.status)
        if owner_id:
            query = query.where(Lead.owner_id == owner_id)

        rows = db.execute(query).all()
        counts = {status: count for status, count in rows}

        new_count = counts.get("New", 0)
        contacted_count = counts.get("Contacted", 0)
        qualified_count = counts.get("Qualified", 0)
        converted_count = counts.get("Converted", 0)
        lost_count = counts.get("Lost", 0)

        total_leads = sum(counts.values())
        conversion_rate = (
            round((converted_count / total_leads * 100), 2) if total_leads > 0 else 0.0
        )

        return DashboardStats(
            total_leads=total_leads,
            new_leads=new_count,
            contacted_leads=contacted_count,
            qualified_leads=qualified_count,
            converted_leads=converted_count,
            lost_leads=lost_count,
            conversion_rate=conversion_rate,
        )

    @staticmethod
    def get_dashboard_charts(
        db: Session, owner_id: uuid.UUID | None = None
    ) -> DashboardCharts:
        # Status distribution
        query_dist = select(Lead.status, func.count(Lead.id)).group_by(Lead.status)
        if owner_id:
            query_dist = query_dist.where(Lead.owner_id == owner_id)

        dist_rows = db.execute(query_dist).all()
        counts = {status: count for status, count in dist_rows}
        total = sum(counts.values())

        all_statuses = ["New", "Contacted", "Qualified", "Converted", "Lost"]
        distribution = []
        for st in all_statuses:
            c = counts.get(st, 0)
            pct = round((c / total * 100), 1) if total > 0 else 0.0
            distribution.append(ChartStatusItem(status=st, count=c, percentage=pct))

        # Lead creation trend (past 14 days)
        now = datetime.now(UTC)
        start_date = now - timedelta(days=13)
        query_trend = select(Lead.created_at)
        if owner_id:
            query_trend = query_trend.where(Lead.owner_id == owner_id)
        query_trend = query_trend.where(Lead.created_at >= start_date)

        created_dates = db.execute(query_trend).scalars().all()

        # Aggregate by calendar day (YYYY-MM-DD)
        trend_map = {}
        for i in range(14):
            day_str = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            trend_map[day_str] = 0

        for dt in created_dates:
            if dt:
                d_str = dt.strftime("%Y-%m-%d")
                if d_str in trend_map:
                    trend_map[d_str] += 1

        trend = [ChartTrendItem(date=k, count=v) for k, v in trend_map.items()]

        return DashboardCharts(distribution=distribution, trend=trend)

    @staticmethod
    def get_follow_up_alerts(
        db: Session, owner_id: uuid.UUID | None = None
    ) -> FollowUpAlerts:
        now = datetime.now(UTC)
        upcoming_window = now + timedelta(days=7)

        # Overdue: follow_up_date < now, not in (Converted, Lost)
        overdue_stmt = select(Lead).where(
            Lead.follow_up_date < now,
            Lead.status.not_in(["Converted", "Lost"]),
        )
        if owner_id:
            overdue_stmt = overdue_stmt.where(Lead.owner_id == owner_id)
        overdue_stmt = overdue_stmt.order_by(asc(Lead.follow_up_date)).limit(10)
        overdue_items = list(db.execute(overdue_stmt).scalars().all())

        # Upcoming: follow_up_date >= now and <= upcoming_window, not in (Converted, Lost)
        upcoming_stmt = select(Lead).where(
            Lead.follow_up_date >= now,
            Lead.follow_up_date <= upcoming_window,
            Lead.status.not_in(["Converted", "Lost"]),
        )
        if owner_id:
            upcoming_stmt = upcoming_stmt.where(Lead.owner_id == owner_id)
        upcoming_stmt = upcoming_stmt.order_by(asc(Lead.follow_up_date)).limit(10)
        upcoming_items = list(db.execute(upcoming_stmt).scalars().all())

        return FollowUpAlerts(
            upcoming=[LeadResponse.model_validate(item) for item in upcoming_items],
            overdue=[LeadResponse.model_validate(item) for item in overdue_items],
        )


lead_repo = LeadRepository()
