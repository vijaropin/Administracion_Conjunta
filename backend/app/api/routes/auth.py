from fastapi import APIRouter, Depends

from app.api.deps.auth import get_current_user
from app.schemas.auth import AuthenticatedUser, AuthenticatedUserResponse

router = APIRouter(prefix="/auth")


@router.get("/me", response_model=AuthenticatedUserResponse)
async def me(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUserResponse:
    return AuthenticatedUserResponse(user=current_user)
