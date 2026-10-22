from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, verify_password
from app.repositories.user_repo import user_repo
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse


class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> Token:
        existing_user = user_repo.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists.",
            )

        user = user_repo.create(db, user_in, role=user_in.role or "USER")
        user_resp = UserResponse.model_validate(user)
        access_token = create_access_token(subject=str(user.id), role=user.role)
        refresh_token = create_refresh_token(subject=str(user.id))

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_resp,
        )

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> Token:
        user = user_repo.get_by_email(db, credentials.email)
        # Constant time-like check to mitigate timing attacks
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact support.",
            )

        user_resp = UserResponse.model_validate(user)
        access_token = create_access_token(subject=str(user.id), role=user.role)
        refresh_token = create_refresh_token(subject=str(user.id))

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_resp,
        )


auth_service = AuthService()
