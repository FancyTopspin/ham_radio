from django.contrib import admin
from .models import AttemptEvent, UserClassProgress

@admin.register(AttemptEvent)
class AttemptEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'question_code', 'is_correct', 'mode', 'duration_ms', 'created_at')
    list_filter = ('is_correct', 'mode', 'created_at')
    search_fields = ('question_code', 'question_id', 'user__username', 'user__email')
    readonly_fields = ('id', 'server_received_at')

@admin.register(UserClassProgress)
class UserClassProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'class_type', 'last_synced_at')
    list_filter = ('class_type',)
    search_fields = ('user__username', 'user__email')
