from typing import List, Optional
from uuid import UUID
from ninja import Router, Schema
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import LicensePool, Question, SubElement, SubGroup, Choice, Explanation

router = Router(tags=["Question Pools & Ingestion"])


class ChoiceOut(Schema):
    id: UUID
    original_letter: str
    choice_text: str
    is_pinned_bottom: bool


class ExplanationOut(Schema):
    explanation_markdown: str
    fcc_citation_url: str
    is_admin_verified: bool


class QuestionOut(Schema):
    id: UUID
    question_code: str
    sub_element_code: str
    sub_group_code: str
    question_text: str
    fcc_citation: str
    has_diagram: bool
    diagram_figure_name: str
    diagram_image_url: Optional[str] = None
    shuffle_disabled: bool
    correct_choice_id: Optional[UUID] = None
    choices: List[ChoiceOut]
    explanation: Optional[ExplanationOut] = None

    @staticmethod
    def resolve_diagram_image_url(obj):
        url = obj.effective_diagram_url
        return url if url else None


class ChoiceAdminUpdate(Schema):
    id: UUID
    choice_text: str
    is_correct: Optional[bool] = None


class AdminQuestionUpdateIn(Schema):
    question_text: Optional[str] = None
    fcc_citation: Optional[str] = None
    choices: Optional[List[ChoiceAdminUpdate]] = None
    correct_letter: Optional[str] = None
    explanation_markdown: Optional[str] = None
    fcc_citation_url: Optional[str] = None
    is_admin_verified: Optional[bool] = None


class SubGroupOut(Schema):
    id: UUID
    code: str
    title: str


class SubElementOut(Schema):
    id: UUID
    code: str
    title: str
    exam_questions_count: int
    groups: List[SubGroupOut]


class LicensePoolOut(Schema):
    id: UUID
    class_type: str
    class_name: str
    pool_version: str
    is_active: bool
    total_questions: int
    exam_quota: int

    @staticmethod
    def resolve_class_name(obj):
        return obj.get_class_type_display()

    @staticmethod
    def resolve_total_questions(obj):
        return obj.questions.count()

    @staticmethod
    def resolve_exam_quota(obj):
        return 50 if obj.class_type == 'EXTRA' else 35


@router.get("/pools", response=List[LicensePoolOut])
def list_pools(request):
    """Returns all active license pools (Technician, General, Extra)."""
    return LicensePool.objects.filter(is_active=True).order_by('class_type')


@router.get("/pools/{class_type}", response=LicensePoolOut)
def get_pool_detail(request, class_type: str):
    """Returns metadata for a specific license class (TECH, GEN, EXTRA)."""
    pool = get_object_or_404(LicensePool, class_type=class_type.upper(), is_active=True)
    return pool


@router.get("/pools/{class_type}/syllabus", response=List[SubElementOut])
def get_pool_syllabus(request, class_type: str):
    """Returns the sub-elements and sub-groups with topic descriptions."""
    pool = get_object_or_404(LicensePool, class_type=class_type.upper(), is_active=True)
    return pool.sub_elements.prefetch_related('groups').all()


@router.get("/pools/{class_type}/questions", response=List[QuestionOut])
def get_pool_questions(request, class_type: str):
    """
    Returns all questions, choices, diagrams, and explanations for client-side
    IndexedDB (Dexie.js) hydration.
    """
    pool = get_object_or_404(LicensePool, class_type=class_type.upper(), is_active=True)
    questions = (
        Question.objects.filter(pool=pool)
        .prefetch_related('choices', 'diagrams')
        .select_related('explanation')
        .order_by('question_code')
    )
    return questions


@router.patch("/questions/{question_id}/admin-update", response=QuestionOut)
def admin_update_question(request, question_id: UUID, payload: AdminQuestionUpdateIn):
    """
    In-place admin update of question text, choices, correct letter, and explanation.
    Guarded by request.user.is_staff check.
    """
    if not request.user.is_authenticated or not request.user.is_staff:
        raise HttpError(403, "Staff credentials required to edit questions.")

    question = get_object_or_404(
        Question.objects.select_related('pool', 'explanation').prefetch_related('choices'),
        id=question_id
    )

    with transaction.atomic():
        if payload.question_text is not None:
            question.question_text = payload.question_text.strip()
        if payload.fcc_citation is not None:
            question.fcc_citation = payload.fcc_citation.strip()

        # Update choices if provided
        if payload.choices:
            for c_update in payload.choices:
                choice = question.choices.filter(id=c_update.id).first()
                if choice:
                    choice.choice_text = c_update.choice_text.strip()
                    if c_update.is_correct is not None:
                        choice.is_correct = c_update.is_correct
                    choice.save()

        # Update correct_letter if provided
        if payload.correct_letter is not None:
            c_letter = payload.correct_letter.strip().upper()
            question.correct_letter = c_letter
            # Update is_correct on choices according to correct_letter
            for ch in question.choices.all():
                is_curr = (ch.original_letter == c_letter)
                if ch.is_correct != is_curr:
                    ch.is_correct = is_curr
                    ch.save(update_fields=['is_correct'])
            # Set correct_choice_id
            matched_choice = question.choices.filter(original_letter=c_letter).first()
            if matched_choice:
                question.correct_choice_id = matched_choice.id

        question.save()

        # Update or create Explanation
        if payload.explanation_markdown is not None or payload.fcc_citation_url is not None or payload.is_admin_verified is not None:
            explanation, _ = Explanation.objects.get_or_create(question=question)
            if payload.explanation_markdown is not None:
                explanation.explanation_markdown = payload.explanation_markdown
            if payload.fcc_citation_url is not None:
                explanation.fcc_citation_url = payload.fcc_citation_url.strip()
            if payload.is_admin_verified is not None:
                explanation.is_admin_verified = payload.is_admin_verified
            explanation.save()

        # Bump pool updated_at
        if question.pool:
            question.pool.updated_at = timezone.now()
            question.pool.save(update_fields=['updated_at'])

    # Refresh question from DB
    question = (
        Question.objects.filter(id=question.id)
        .prefetch_related('choices', 'diagrams')
        .select_related('explanation')
        .first()
    )
    return question
