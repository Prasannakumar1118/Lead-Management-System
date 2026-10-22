import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadPagination, LeadResponse, LeadUpdate
from app.services.lead_service import lead_service

router = APIRouter()


@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead",
)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LeadResponse:
    """Create a new sales lead owned by the current authenticated user."""
    return lead_service.create_lead(db, current_user, lead_in)


@router.get(
    "",
    response_model=LeadPagination,
    status_code=status.HTTP_200_OK,
    summary="List leads with search, filter, sort, and pagination",
)
def list_leads(
    search: str | None = Query(
        None, description="Search across name, email, phone, and company"
    ),
    status: str | None = Query(
        None, description="Comma-separated status values (e.g. 'New,Contacted')"
    ),
    created_after: datetime | None = Query(
        None, description="Filter leads created on or after date"
    ),
    created_before: datetime | None = Query(
        None, description="Filter leads created on or before date"
    ),
    follow_up_after: datetime | None = Query(
        None, description="Filter follow-up on or after date"
    ),
    follow_up_before: datetime | None = Query(
        None, description="Filter follow-up on or before date"
    ),
    sort_by: str = Query(
        "created_at",
        description="Sortable column: created_at, name, company, follow_up_date, status",
    ),
    sort_dir: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    view_all: bool = Query(
        False, description="Admin only: view all leads across all owners"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LeadPagination:
    """Retrieve paginated leads matching search and filter parameters."""
    status_list = (
        [s.strip() for s in status.split(",") if s.strip()] if status else None
    )
    return lead_service.list_leads(
        db=db,
        current_user=current_user,
        search=search,
        statuses=status_list,
        created_after=created_after,
        created_before=created_before,
        follow_up_after=follow_up_after,
        follow_up_before=follow_up_before,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
        view_all=view_all,
    )


@router.get(
    "/export/csv",
    status_code=status.HTTP_200_OK,
    summary="Export filtered leads as CSV",
)
def export_leads_csv(
    search: str | None = None,
    status: str | None = None,
    created_after: datetime | None = None,
    created_before: datetime | None = None,
    follow_up_after: datetime | None = None,
    follow_up_before: datetime | None = None,
    view_all: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and download a CSV file of filtered lead records."""
    status_list = (
        [s.strip() for s in status.split(",") if s.strip()] if status else None
    )
    csv_content = lead_service.export_csv(
        db=db,
        current_user=current_user,
        search=search,
        statuses=status_list,
        created_after=created_after,
        created_before=created_before,
        follow_up_after=follow_up_after,
        follow_up_before=follow_up_before,
        view_all=view_all,
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="leads_export.csv"'},
    )


@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get lead details by ID",
)
def get_lead(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LeadResponse:
    """Retrieve details for a single lead by its UUID."""
    return lead_service.get_lead(db, lead_id, current_user)


@router.patch(
    "/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a lead",
)
def update_lead(
    lead_id: uuid.UUID,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LeadResponse:
    """Update fields of an existing lead owned by the user."""
    return lead_service.update_lead(db, lead_id, lead_in, current_user)


@router.delete(
    "/{lead_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a lead"
)
def delete_lead(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a lead permanently."""
    lead_service.delete_lead(db, lead_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
