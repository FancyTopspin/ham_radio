import uuid
from datetime import datetime
from typing import List, Optional
from django.utils import timezone
from ninja import Router, Schema
from .models import AttemptEvent

router = Router(tags=["Study & Sync"])

class AttemptIn(Schema):
    id: uuid.UUID
    question_id: str
    question_code: str = ""
    selected_choice_id: str = ""
    is_correct: bool
    mode: str = "study"
    duration_ms: int = 0
    created_at: datetime

class SyncBatchPayload(Schema):
    device_id: str = ""
    attempts: List[AttemptIn]

class SyncBatchResponse(Schema):
    success: bool
    synced_count: int
    server_time: datetime

class AttemptOut(Schema):
    id: uuid.UUID
    question_id: str
    question_code: str
    selected_choice_id: str
    is_correct: bool
    mode: str
    duration_ms: int
    created_at: datetime

class AttemptsListResponse(Schema):
    total: int
    attempts: List[AttemptOut]


@router.post("/sync", response=SyncBatchResponse)
def batch_sync_attempts(request, payload: SyncBatchPayload):
    """
    Append-only bulk ingestion of attempts.
    Uses ignore_conflicts=True to guarantee idempotency across retries.
    """
    user = request.user if request.user.is_authenticated else None
    device_id = payload.device_id.strip()

    attempt_instances = []
    for item in payload.attempts:
        attempt_instances.append(
            AttemptEvent(
                id=item.id,
                user=user,
                device_id=device_id,
                question_id=item.question_id,
                question_code=item.question_code,
                selected_choice_id=item.selected_choice_id,
                is_correct=item.is_correct,
                mode=item.mode,
                duration_ms=item.duration_ms,
                created_at=item.created_at,
            )
        )

    if attempt_instances:
        AttemptEvent.objects.bulk_create(attempt_instances, ignore_conflicts=True)

    return {
        "success": True,
        "synced_count": len(attempt_instances),
        "server_time": timezone.now(),
    }


@router.get("/attempts", response=AttemptsListResponse)
def get_user_attempts(request, since: Optional[datetime] = None):
    """
    Retrieve stored attempts for the authenticated user.
    Enables restoring progress on a new device or browser.
    """
    if not request.user.is_authenticated:
        return {"total": 0, "attempts": []}

    qs = AttemptEvent.objects.filter(user=request.user)
    if since:
        qs = qs.filter(created_at__gt=since)

    qs = qs.order_by("created_at")
    results = [
        AttemptOut(
            id=a.id,
            question_id=a.question_id,
            question_code=a.question_code,
            selected_choice_id=a.selected_choice_id,
            is_correct=a.is_correct,
            mode=a.mode,
            duration_ms=a.duration_ms,
            created_at=a.created_at,
        )
        for a in qs[:5000]
    ]

    return {"total": len(results), "attempts": results}


@router.post("/reset-history")
def reset_user_history(request, class_type: Optional[str] = None):
    """
    Safely reset cloud attempt history for the authenticated user.
    """
    if not request.user.is_authenticated:
        return {"success": False, "message": "Authentication required."}

    qs = AttemptEvent.objects.filter(user=request.user)
    if class_type:
        # e.g., questions starting with T for TECH, G for GEN, E for EXTRA
        prefix_map = {"TECH": "T", "GEN": "G", "EXTRA": "E"}
        prefix = prefix_map.get(class_type.upper())
        if prefix:
            qs = qs.filter(question_code__startswith=prefix)

    deleted_count, _ = qs.delete()
    return {"success": True, "deleted_count": deleted_count}
