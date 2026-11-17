from typing import List, Optional
from uuid import UUID
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from .models import LicensePool, Question, SubElement, SubGroup

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
