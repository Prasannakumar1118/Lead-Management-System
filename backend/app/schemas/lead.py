import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

LeadStatus = Literal["New", "Contacted", "Qualified", "Converted", "Lost"]


class LeadBase(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=255, description="Lead contact or entity name"
    )
    email: EmailStr | None = Field(None, description="Lead email address")
    phone_number: str | None = Field(
        None, max_length=50, description="Lead phone number"
    )
    company: str | None = Field(
        None, max_length=255, description="Company or organization"
    )
    service_interested: str | None = Field(
        None, max_length=255, description="Service or package of interest"
    )
    status: LeadStatus = Field("New", description="Current lifecycle status")
    follow_up_date: datetime | None = Field(
        None, description="Scheduled follow-up date and time"
    )
    notes: str | None = Field(None, description="Contextual lead notes")


class LeadCreate(LeadBase):
    @model_validator(mode="after")
    def validate_contact_info(self) -> "LeadCreate":
        email_clean = (self.email or "").strip() if self.email else ""
        phone_clean = (self.phone_number or "").strip() if self.phone_number else ""
        if not email_clean and not phone_clean:
            raise ValueError(
                "At least one contact method (Email or Phone Number) must be provided."
            )
        return self


class LeadUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(None, max_length=50)
    company: str | None = Field(None, max_length=255)
    service_interested: str | None = Field(None, max_length=255)
    status: LeadStatus | None = None
    follow_up_date: datetime | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_partial_contact_info(self) -> "LeadUpdate":
        if (
            "email" in self.model_fields_set
            and "phone_number" in self.model_fields_set
            and not self.email
            and not self.phone_number
        ):
            raise ValueError(
                "At least one contact method (Email or Phone Number) must remain."
            )
        return self


class LeadResponse(LeadBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadPagination(BaseModel):
    items: list[LeadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
