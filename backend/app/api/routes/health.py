from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/health")


@router.get("")
async def health_v1() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name, "env": settings.app_env}
