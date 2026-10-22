import csv
import io
import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.lead_repo import lead_repo
from app.schemas.dashboard import DashboardCharts, DashboardStats, FollowUpAlerts
from app.schemas.lead import LeadCreate, LeadPagination, LeadResponse, LeadUpdate


def sanitize_csv_cell(val: object) -> str:
    """Mitigate CSV / Formula Injection (CWE-1236).

    Prefix cells starting with formula characters (=, +, -, @, tab, cr) with a single quote.
    """
    if val is None:
        return ""
    s = str(val).strip()
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{s}"
    return s


class LeadService:
    @staticmethod
    def create_lead(db: Session, owner: User, lead_in: LeadCreate) -> LeadResponse:
        lead = lead_repo.create(db, owner.id, lead_in)
        return LeadResponse.model_validate(lead)

    @staticmethod
    def get_lead(db: Session, lead_id: uuid.UUID, current_user: User) -> LeadResponse:
        lead = lead_repo.get_by_id(db, lead_id)
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found.",
            )

        # Enforce record ownership (unless current_user is ADMIN)
        if current_user.role != "ADMIN" and lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found.",
            )

        return LeadResponse.model_validate(lead)

    @staticmethod
    def update_lead(
        db: Session, lead_id: uuid.UUID, lead_in: LeadUpdate, current_user: User
    ) -> LeadResponse:
        lead = lead_repo.get_by_id(db, lead_id)
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found.",
            )

        if current_user.role != "ADMIN" and lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found.",
            )

        updated_lead = lead_repo.update(db, lead, lead_in)
        return LeadResponse.model_validate(updated_lead)

    @staticmethod
    def delete_lead(db: Session, lead_id: uuid.UUID, current_user: User) -> None:
        lead = lead_repo.get_by_id(db, lead_id)
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found.",
            )

        if current_user.role != "ADMIN" and lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found.",
            )

        lead_repo.delete(db, lead)

    @staticmethod
    def list_leads(
        db: Session,
        current_user: User,
        search: str | None = None,
        statuses: list[str] | None = None,
        created_after: datetime | None = None,
        created_before: datetime | None = None,
        follow_up_after: datetime | None = None,
        follow_up_before: datetime | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        page_size: int = 10,
        view_all: bool = False,
    ) -> LeadPagination:
        owner_id = (
            None if (current_user.role == "ADMIN" and view_all) else current_user.id
        )
        skip = (page - 1) * page_size
        items, total = lead_repo.get_multi(
            db=db,
            owner_id=owner_id,
            search=search,
            statuses=statuses,
            created_after=created_after,
            created_before=created_before,
            follow_up_after=follow_up_after,
            follow_up_before=follow_up_before,
            sort_by=sort_by,
            sort_dir=sort_dir,
            skip=skip,
            limit=page_size,
        )

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return LeadPagination(
            items=[LeadResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @staticmethod
    def get_dashboard_stats(
        db: Session, current_user: User, view_all: bool = False
    ) -> DashboardStats:
        owner_id = (
            None if (current_user.role == "ADMIN" and view_all) else current_user.id
        )
        return lead_repo.get_dashboard_stats(db, owner_id)

    @staticmethod
    def get_dashboard_charts(
        db: Session, current_user: User, view_all: bool = False
    ) -> DashboardCharts:
        owner_id = (
            None if (current_user.role == "ADMIN" and view_all) else current_user.id
        )
        return lead_repo.get_dashboard_charts(db, owner_id)

    @staticmethod
    def get_follow_up_alerts(
        db: Session, current_user: User, view_all: bool = False
    ) -> FollowUpAlerts:
        owner_id = (
            None if (current_user.role == "ADMIN" and view_all) else current_user.id
        )
        return lead_repo.get_follow_up_alerts(db, owner_id)

    @staticmethod
    def export_csv(
        db: Session,
        current_user: User,
        search: str | None = None,
        statuses: list[str] | None = None,
        created_after: datetime | None = None,
        created_before: datetime | None = None,
        follow_up_after: datetime | None = None,
        follow_up_before: datetime | None = None,
        view_all: bool = False,
    ) -> str:
        owner_id = (
            None if (current_user.role == "ADMIN" and view_all) else current_user.id
        )
        items, _ = lead_repo.get_multi(
            db=db,
            owner_id=owner_id,
            search=search,
            statuses=statuses,
            created_after=created_after,
            created_before=created_before,
            follow_up_after=follow_up_after,
            follow_up_before=follow_up_before,
            skip=0,
            limit=10000,
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "ID",
                "Name",
                "Email",
                "Phone Number",
                "Company",
                "Service Interested",
                "Source",
                "Status",
                "Follow-up Date",
                "Notes",
                "Created At",
            ]
        )
        for lead in items:
            writer.writerow(
                [
                    sanitize_csv_cell(str(lead.id)),
                    sanitize_csv_cell(lead.name),
                    sanitize_csv_cell(lead.email),
                    sanitize_csv_cell(lead.phone_number),
                    sanitize_csv_cell(lead.company),
                    sanitize_csv_cell(lead.service_interested),
                    sanitize_csv_cell(lead.source),
                    sanitize_csv_cell(lead.status),
                    sanitize_csv_cell(
                        lead.follow_up_date.isoformat() if lead.follow_up_date else ""
                    ),
                    sanitize_csv_cell(lead.notes),
                    sanitize_csv_cell(
                        lead.created_at.isoformat() if lead.created_at else ""
                    ),
                ]
            )

        return output.getvalue()


lead_service = LeadService()
