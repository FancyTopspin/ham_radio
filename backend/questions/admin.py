from django.contrib import admin
from django.utils.html import format_html
from .models import (
    LicensePool, SubElement, SubGroup,
    Question, Choice, QuestionDiagram, Explanation
)


class SubGroupInline(admin.TabularInline):
    model = SubGroup
    extra = 0
    fields = ('code', 'title')


@admin.register(SubElement)
class SubElementAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'pool', 'exam_questions_count')
    list_filter = ('pool__class_type', 'pool__pool_version')
    search_fields = ('code', 'title')
    inlines = [SubGroupInline]


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0
    fields = ('original_letter', 'choice_text', 'is_correct', 'is_pinned_bottom')


class QuestionDiagramInline(admin.StackedInline):
    model = QuestionDiagram
    extra = 0
    fields = ('figure_name', 'remote_url', 'image', 'is_uploaded')


class ExplanationInline(admin.StackedInline):
    model = Explanation
    extra = 0
    fields = ('explanation_markdown', 'fcc_citation_url', 'is_admin_verified')


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        'question_code', 'pool', 'sub_element_code', 'sub_group_code',
        'correct_letter', 'has_diagram_badge', 'diagram_thumbnail', 'shuffle_disabled'
    )
    list_filter = ('pool__class_type', 'sub_element_code', 'has_diagram', 'shuffle_disabled')
    search_fields = ('question_code', 'question_text', 'fcc_citation', 'diagram_figure_name')
    inlines = [ChoiceInline, QuestionDiagramInline, ExplanationInline]
    readonly_fields = ('created_at', 'updated_at', 'diagram_preview')
    fieldsets = (
        ('Question Identity', {
            'fields': (
                'question_code', 'pool', 'sub_element_code', 'sub_group_code',
                'question_text', 'fcc_citation', 'correct_letter', 'correct_choice_id', 'shuffle_disabled'
            )
        }),
        ('Diagram & Schematic Configuration', {
            'fields': (
                'has_diagram', 'diagram_figure_name', 'diagram_image_url',
                'diagram_override_image', 'diagram_preview'
            ),
            'description': 'Configure official diagram sources. You can view the retrieved online URL or upload an image file to manually override it.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_diagram_badge(self, obj):
        if obj.has_diagram:
            if obj.diagram_override_image or obj.diagrams.filter(is_uploaded=True).exists():
                return format_html('<span style="color: #16a34a; font-weight: bold;">✔ Overridden (Local File)</span>')
            if obj.effective_diagram_url:
                return format_html('<span style="color: #2563eb; font-weight: bold;">🌐 Online URL Active</span>')
            return format_html('<span style="color: #dc2626; font-weight: bold;">⚠ Diagram Missing</span>')
        return format_html('<span style="color: #94a3b8;">None</span>')
    has_diagram_badge.short_description = 'Diagram Status'

    def diagram_thumbnail(self, obj):
        url = obj.effective_diagram_url
        if url:
            return format_html(
                '<a href="{}" target="_blank">'
                '<img src="{}" style="width: 44px; height: 32px; object-fit: contain; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc;" />'
                '</a>',
                url, url
            )
        return format_html('<span style="color: #94a3b8; font-size: 11px;">—</span>')
    diagram_thumbnail.short_description = 'Diagram'

    def diagram_preview(self, obj):
        url = obj.effective_diagram_url
        if url:
            is_override = bool(obj.diagram_override_image or obj.diagrams.filter(is_uploaded=True).exists())
            status_badge = (
                '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">Manual Upload Override</span>'
                if is_override else
                '<span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">Retrieved Official Online URL</span>'
            )
            return format_html(
                '<div style="margin: 8px 0; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 620px;">'
                '<div style="margin-bottom: 8px;">{} <strong style="margin-left: 8px; color: #334155;">{}</strong></div>'
                '<img src="{}" style="max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 6px; border: 1px solid #cbd5e1; display: block; margin-bottom: 8px; background: white;" />'
                '<div style="font-size: 12px; color: #64748b;">Direct Link: <a href="{}" target="_blank" style="color: #2563eb; text-decoration: underline;">{}</a></div>'
                '</div>',
                format_html(status_badge),
                obj.diagram_figure_name or 'Exam Figure',
                url, url, url
            )
        return format_html('<span style="color: #94a3b8; font-style: italic;">No diagram configured or uploaded.</span>')
    diagram_preview.short_description = 'Diagram Preview'


@admin.register(QuestionDiagram)
class QuestionDiagramAdmin(admin.ModelAdmin):
    list_display = ('question', 'figure_name', 'remote_url', 'is_uploaded', 'created_at')
    list_filter = ('is_uploaded', 'question__pool__class_type')
    search_fields = ('question__question_code', 'figure_name', 'remote_url')
    list_editable = ('is_uploaded',)



@admin.register(Explanation)
class ExplanationAdmin(admin.ModelAdmin):
    list_display = ('question', 'is_admin_verified', 'fcc_citation_url', 'updated_at')
    list_filter = ('is_admin_verified', 'question__pool__class_type')
    search_fields = ('question__question_code', 'explanation_markdown')
    list_editable = ('is_admin_verified',)


@admin.register(LicensePool)
class LicensePoolAdmin(admin.ModelAdmin):
    list_display = (
        'class_type', 'pool_version', 'is_active',
        'question_count', 'missing_diagrams_alert', 'source_url'
    )
    list_filter = ('class_type', 'is_active')
    search_fields = ('pool_version', 'source_url')
    fields = (
        'class_type', 'pool_version', 'is_active',
        'effective_start', 'effective_end', 'source_url'
    )

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Total Questions'

    def missing_diagrams_alert(self, obj):
        missing = obj.questions.filter(has_diagram=True, diagrams__is_uploaded=False).count()
        if missing > 0:
            return format_html(
                '<span style="background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-weight: bold;">'
                '⚠ {} figures to upload</span>',
                missing
            )
        return format_html('<span style="color: green;">All figures uploaded</span>')
    missing_diagrams_alert.short_description = 'Diagram Alerts'
