import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate


class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        stmt = select(User).where(User.email == email.strip().lower())
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def create(db: Session, user_in: UserCreate, role: str = "USER") -> User:
        user = User(
            id=uuid.uuid4(),
            email=user_in.email.strip().lower(),
            full_name=user_in.full_name.strip(),
            password_hash=get_password_hash(user_in.password),
            role=role if role in ("USER", "ADMIN") else "USER",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


user_repo = UserRepository()
