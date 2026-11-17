import uuid
from datetime import date, datetime
from typing import List, Optional
from django.utils import timezone
from ninja import Router, Schema
from .models import AttemptEvent, DailyChallengeRecord, LeaderboardProfile

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


# --- Leaderboard & Daily Challenge Schemas & Endpoints ---

class LeaderboardEntryOut(Schema):
    rank: int
    user_id: Optional[int] = None
    username: str
    callsign: str
    display_name: str
    avatar_color: str
    xp: int
    mastered_count: int
    streak_days: int
    accuracy: float
    primary_class: str
    is_current_user: bool


class LeaderboardResponse(Schema):
    class_type: str
    metric: str
    rankings: List[LeaderboardEntryOut]
    user_standing: Optional[LeaderboardEntryOut] = None


class DailyChallengeIn(Schema):
    device_id: str = ""
    class_type: str = "TECH"
    challenge_date: str  # YYYY-MM-DD
    score: int
    total: int = 5
    streak_count: int = 1
    xp_earned: int = 50


class DailyChallengeResponse(Schema):
    success: bool
    streak_count: int
    xp_earned: int
    total_xp: int
    message: str


class ProfileUpdateIn(Schema):
    callsign: Optional[str] = None
    display_name: Optional[str] = None
    avatar_color: Optional[str] = None
    device_id: Optional[str] = ""


class ProfileUpdateResponse(Schema):
    success: bool
    callsign: str
    display_name: str
    avatar_color: str
    xp: int


class StatsSyncIn(Schema):
    device_id: str = ""
    class_type: str = "TECH"
    mastered_count: int = 0
    streak_days: int = 0
    accuracy: float = 0.0
    xp: int = 0


@router.get("/leaderboard", response=LeaderboardResponse)
def get_leaderboard(
    request,
    class_type: Optional[str] = None,
    metric: str = "xp",
    device_id: Optional[str] = None
):
    """
    Get top community rankings sorted by XP, streak, or mastered questions.
    Includes user standing if logged in or identified by device_id.
    """
    qs = LeaderboardProfile.objects.all()
    if class_type and class_type.upper() in ["TECH", "GEN", "EXTRA"]:
        qs = qs.filter(primary_class=class_type.upper())

    order_map = {
        "streak": ["-streak_days", "-xp", "-mastered_count"],
        "mastered": ["-mastered_count", "-xp", "-accuracy"],
        "xp": ["-xp", "-streak_days", "-mastered_count"],
    }
    order_fields = order_map.get(metric.lower(), ["-xp", "-streak_days"])
    sorted_profiles = list(qs.order_by(*order_fields))

    user_profile = None
    if request.user.is_authenticated:
        user_profile, _ = LeaderboardProfile.objects.get_or_create(
            user=request.user,
            defaults={"display_name": request.user.username}
        )
    elif device_id:
        user_profile = LeaderboardProfile.objects.filter(device_id=device_id).first()

    rankings: List[LeaderboardEntryOut] = []
    user_standing: Optional[LeaderboardEntryOut] = None

    for idx, p in enumerate(sorted_profiles, start=1):
        is_curr = False
        if request.user.is_authenticated and p.user_id == request.user.id:
            is_curr = True
        elif not request.user.is_authenticated and device_id and p.device_id == device_id:
            is_curr = True

        entry = LeaderboardEntryOut(
            rank=idx,
            user_id=p.user_id,
            username=p.user.username if p.user else (p.callsign or p.display_name),
            callsign=p.callsign,
            display_name=p.display_name or (p.user.username if p.user else 'Ham Cadet'),
            avatar_color=p.avatar_color or 'blue',
            xp=p.xp,
            mastered_count=p.mastered_count,
            streak_days=p.streak_days,
            accuracy=round(p.accuracy, 1),
            primary_class=p.primary_class,
            is_current_user=is_curr,
        )

        if idx <= 25:
            rankings.append(entry)

        if is_curr:
            user_standing = entry

    # If current user is not in the top 25, compute their rank specifically
    if user_profile and not user_standing:
        for idx, p in enumerate(sorted_profiles, start=1):
            if (user_profile.id == p.id):
                user_standing = LeaderboardEntryOut(
                    rank=idx,
                    user_id=p.user_id,
                    username=p.user.username if p.user else (p.callsign or p.display_name),
                    callsign=p.callsign,
                    display_name=p.display_name or (p.user.username if p.user else 'Ham Cadet'),
                    avatar_color=p.avatar_color or 'blue',
                    xp=p.xp,
                    mastered_count=p.mastered_count,
                    streak_days=p.streak_days,
                    accuracy=round(p.accuracy, 1),
                    primary_class=p.primary_class,
                    is_current_user=True,
                )
                break

    return {
        "class_type": class_type.upper() if class_type else "ALL",
        "metric": metric,
        "rankings": rankings,
        "user_standing": user_standing,
    }


@router.post("/daily-challenge", response=DailyChallengeResponse)
def submit_daily_challenge(request, payload: DailyChallengeIn):
    """
    Records a completed daily challenge and credits user streak & XP.
    """
    user = request.user if request.user.is_authenticated else None
    device_id = payload.device_id.strip()

    try:
        challenge_dt = datetime.strptime(payload.challenge_date, "%Y-%m-%d").date()
    except ValueError:
        challenge_dt = timezone.now().date()

    # Save challenge attempt record
    DailyChallengeRecord.objects.create(
        user=user,
        device_id=device_id,
        class_type=payload.class_type.upper(),
        challenge_date=challenge_dt,
        score=payload.score,
        total=payload.total,
        streak_count=payload.streak_count,
        xp_earned=payload.xp_earned,
    )

    # Update or get LeaderboardProfile
    profile = None
    if user:
        profile, _ = LeaderboardProfile.objects.get_or_create(
            user=user,
            defaults={"display_name": user.username}
        )
    elif device_id:
        profile, _ = LeaderboardProfile.objects.get_or_create(
            device_id=device_id,
            defaults={"display_name": f"Guest-{device_id[:6]}"}
        )

    total_xp = payload.xp_earned
    if profile:
        profile.xp += payload.xp_earned
        profile.streak_days = max(profile.streak_days, payload.streak_count)
        profile.primary_class = payload.class_type.upper()
        profile.save()
        total_xp = profile.xp

    return {
        "success": True,
        "streak_count": payload.streak_count,
        "xp_earned": payload.xp_earned,
        "total_xp": total_xp,
        "message": f"Daily challenge completed! +{payload.xp_earned} XP earned.",
    }


@router.post("/profile", response=ProfileUpdateResponse)
def update_leaderboard_profile(request, payload: ProfileUpdateIn):
    """
    Update ham radio callsign, display name, and avatar color.
    """
    user = request.user if request.user.is_authenticated else None
    device_id = payload.device_id.strip() if payload.device_id else ""

    profile = None
    if user:
        profile, _ = LeaderboardProfile.objects.get_or_create(
            user=user,
            defaults={"display_name": user.username}
        )
    elif device_id:
        profile, _ = LeaderboardProfile.objects.get_or_create(
            device_id=device_id,
            defaults={"display_name": f"Guest-{device_id[:6]}"}
        )
    else:
        profile = LeaderboardProfile.objects.create(display_name="Ham Cadet")

    if payload.callsign is not None:
        profile.callsign = payload.callsign.strip().upper()[:16]
    if payload.display_name is not None and payload.display_name.strip():
        profile.display_name = payload.display_name.strip()[:64]
    if payload.avatar_color is not None:
        profile.avatar_color = payload.avatar_color.strip()[:32]

    profile.save()

    return {
        "success": True,
        "callsign": profile.callsign,
        "display_name": profile.display_name,
        "avatar_color": profile.avatar_color,
        "xp": profile.xp,
    }


@router.post("/sync-stats")
def sync_user_stats(request, payload: StatsSyncIn):
    """
    Sync client Dexie progress (mastered questions, streak, accuracy) to leaderboard.
    """
    user = request.user if request.user.is_authenticated else None
    device_id = payload.device_id.strip() if payload.device_id else ""

    profile = None
    if user:
        profile, _ = LeaderboardProfile.objects.get_or_create(
            user=user,
            defaults={"display_name": user.username}
        )
    elif device_id:
        profile, _ = LeaderboardProfile.objects.get_or_create(
            device_id=device_id,
            defaults={"display_name": f"Guest-{device_id[:6]}"}
        )

    if profile:
        if payload.mastered_count > 0:
            profile.mastered_count = max(profile.mastered_count, payload.mastered_count)
        if payload.streak_days > 0:
            profile.streak_days = max(profile.streak_days, payload.streak_days)
        if payload.accuracy > 0:
            profile.accuracy = payload.accuracy
        if payload.xp > 0:
            profile.xp = max(profile.xp, payload.xp)
        if payload.class_type:
            profile.primary_class = payload.class_type.upper()
        profile.save()

    return {"success": True}

