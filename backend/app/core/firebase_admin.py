from pathlib import Path

import firebase_admin
from firebase_admin import credentials

from app.core.config import settings


def init_firebase_admin() -> None:
    if firebase_admin._apps:
        return

    if settings.firebase_service_account_path:
        service_account = Path(settings.firebase_service_account_path)
        cred = credentials.Certificate(str(service_account))
        firebase_admin.initialize_app(
            cred,
            {"projectId": settings.firebase_project_id},
        )
        return

    firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})
