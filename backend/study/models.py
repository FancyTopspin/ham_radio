import uuid
from django.db import models
from django.conf import settings

class AttemptEvent(models.Model):
    """
    Append-only attempt event log for offline-first sync.
    Client UUIDs ensure idempotency during bulk syncing.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='attempts'
    )
    device_id = models.CharField(max_length=64, blank=True, default='')
    question_id = models.CharField(max_length=64, db_index=True)
    question_code = models.CharField(max_length=16, blank=True, default='', db_index=True)
    selected_choice_id = models.CharField(max_length=64, blank=True, default='')
    is_correct = models.BooleanField(default=False)
    mode = models.CharField(max_length=32, default='study')  # 'study', 'mock_exam', 'mistake_drill'
    duration_ms = models.IntegerField(default=0)
    created_at = models.DateTimeField(db_index=True)
    server_received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['question_id']),
            models.Index(fields=['question_code']),
        ]

    def __str__(self):
        return f"{self.user.username if self.user else 'Guest'} - {self.question_code or self.question_id} ({'✓' if self.is_correct else '✗'})"


class UserClassProgress(models.Model):
    """
    Aggregated or snapshot progress for a user per license class.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='license_progress'
    )
    class_type = models.CharField(
        max_length=10,
        choices=[('TECH', 'Technician'), ('GEN', 'General'), ('EXTRA', 'Extra')]
    )
    last_synced_at = models.DateTimeField(auto_now=True)
    summary_json = models.JSONField(default=dict)

    class Meta:
        unique_together = ('user', 'class_type')

    def __str__(self):
        return f"{self.user.username} - {self.class_type} Progress"
