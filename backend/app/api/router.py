from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.pagos import router as pagos_router
from app.api.routes.caja_menor import router as caja_menor_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(pagos_router, tags=["pagos"])
api_router.include_router(caja_menor_router, tags=["caja-menor"])
