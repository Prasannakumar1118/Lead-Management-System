from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, oauth2_scheme
from app.core.security import revoke_token
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse
from app.services.auth_service import auth_service

router = APIRouter()


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Token:
    """Register a new user, hashes password, and issues JWT access/refresh tokens."""
    return auth_service.register_user(db, user_in)


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User login with email and password",
)
def login(credentials: UserLogin, db: Session = Depends(get_db)) -> Token:
    """Authenticate user with credentials and issue JWT tokens."""
    return auth_service.authenticate_user(db, credentials)


@router.post("/logout", status_code=status.HTTP_200_OK, summary="User logout")
def logout(
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
):
    """Logout endpoint actively revoking current JWT access token."""
    if token:
        revoke_token(token)
    return {"message": "Successfully logged out and session revoked."}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Fetch profile data for the active authenticated user."""
    return UserResponse.model_validate(current_user)
