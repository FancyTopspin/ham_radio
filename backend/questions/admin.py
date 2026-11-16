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
    fields = ('figure_name', 'image', 'is_uploaded')


class ExplanationInline(admin.StackedInline):
    model = Explanation
    extra = 0
    fields = ('explanation_markdown', 'fcc_citation_url', 'is_admin_verified')


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        'question_code', 'pool', 'sub_element_code', 'sub_group_code',
        'correct_letter', 'has_diagram_badge', 'shuffle_disabled'
    )
    list_filter = ('pool__class_type', 'sub_element_code', 'has_diagram', 'shuffle_disabled')
    search_fields = ('question_code', 'question_text', 'fcc_citation')
    inlines = [ChoiceInline, QuestionDiagramInline, ExplanationInline]
    readonly_fields = ('created_at', 'updated_at')

    def has_diagram_badge(self, obj):
        if obj.has_diagram:
            uploaded = obj.diagrams.filter(is_uploaded=True).exists()
            if uploaded:
                return format_html('<span style="color: green; font-weight: bold;">✔ Diagram Uploaded</span>')
            return format_html('<span style="color: red; font-weight: bold;">⚠ Diagram Missing</span>')
        return format_html('<span style="color: gray;">None</span>')
    has_diagram_badge.short_description = 'Diagram Status'


@admin.register(QuestionDiagram)
class QuestionDiagramAdmin(admin.ModelAdmin):
    list_display = ('question', 'figure_name', 'is_uploaded', 'created_at')
    list_filter = ('is_uploaded', 'question__pool__class_type')
    search_fields = ('question__question_code', 'figure_name')
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
