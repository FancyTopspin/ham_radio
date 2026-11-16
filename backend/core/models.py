import uuid
from django.db import models
from django.conf import settings

class FeedbackSubmission(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General Feedback'),
        ('question_issue', 'Question / Explanation Issue'),
        ('feature_request', 'Feature Request'),
        ('exam_experience', 'Mock Exam Feedback'),
        ('passed_exam', 'I Passed My Exam!'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='general')
    question_code = models.CharField(max_length=16, blank=True, default='', db_index=True)
    rating = models.IntegerField(null=True, blank=True)
    message = models.TextField()
    email = models.EmailField(blank=True, default='')
    device_id = models.CharField(max_length=64, blank=True, default='')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_submissions'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Feedback Submission'
        verbose_name_plural = 'Feedback Submissions'

    def __str__(self):
        code_str = f" [{self.question_code}]" if self.question_code else ""
        user_str = self.email or (self.user.username if self.user else 'Guest')
        return f"{self.get_category_display()}{code_str} from {user_str} ({self.created_at:%Y-%m-%d %H:%M})"

