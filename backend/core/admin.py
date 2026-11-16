from django.contrib import admin
from .models import FeedbackSubmission

@admin.register(FeedbackSubmission)
class FeedbackSubmissionAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'category', 'question_code', 'rating', 'email', 'user', 'is_resolved')
    list_filter = ('category', 'is_resolved', 'rating', 'created_at')
    search_fields = ('message', 'question_code', 'email', 'user__username', 'device_id')
    readonly_fields = ('id', 'created_at', 'ip_address', 'user_agent', 'device_id')
    list_editable = ('is_resolved',)
