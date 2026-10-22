import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    phone_number: Mapped[str | None] = mapped_column(
        String(50), index=True, nullable=True
    )
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    service_interested: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    # Valid statuses: New, Contacted, Qualified, Converted, Lost
    status: Mapped[str] = mapped_column(
        String(50), default="New", index=True, nullable=False
    )
    follow_up_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), index=True, nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    owner = relationship("User", back_populates="leads")

    __table_args__ = (
        Index("ix_leads_owner_status", "owner_id", "status"),
        Index("ix_leads_owner_created_at", "owner_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Lead {self.name} - {self.status} (owner: {self.owner_id})>"
