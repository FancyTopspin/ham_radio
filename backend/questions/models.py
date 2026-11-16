import uuid
from django.db import models


class LicenseClass(models.TextChoices):
    TECHNICIAN = 'TECH', 'Technician'
    GENERAL = 'GEN', 'General'
    EXTRA = 'EXTRA', 'Amateur Extra'


class LicensePool(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_type = models.CharField(max_length=10, choices=LicenseClass.choices, db_index=True)
    pool_version = models.CharField(max_length=20, help_text="e.g. 2026-2030", db_index=True)
    effective_start = models.DateField(null=True, blank=True)
    effective_end = models.DateField(null=True, blank=True)
    source_url = models.URLField(max_length=500, blank=True, help_text="Official NCVEC URL for this pool")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('class_type', 'pool_version')
        ordering = ['class_type', '-effective_start']

    def __str__(self):
        return f"{self.get_class_type_display()} ({self.pool_version})"


class SubElement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(LicensePool, on_delete=models.CASCADE, related_name='sub_elements')
    code = models.CharField(max_length=10, help_text="e.g. T1, G1, E1")
    title = models.CharField(max_length=255, help_text="e.g. COMMISSION'S RULES")
    exam_questions_count = models.PositiveSmallIntegerField(default=1, help_text="Number of questions from this subelement on the exam")

    class Meta:
        unique_together = ('pool', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.title}"


class SubGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_element = models.ForeignKey(SubElement, on_delete=models.CASCADE, related_name='groups')
    code = models.CharField(max_length=10, help_text="e.g. T1A, G1A, E1A")
    title = models.TextField(blank=True, help_text="Topic summary for this group")

    class Meta:
        unique_together = ('sub_element', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code}: {self.title[:60]}"


class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(LicensePool, on_delete=models.CASCADE, related_name='questions')
    sub_group = models.ForeignKey(SubGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    question_code = models.CharField(max_length=10, db_index=True, help_text="e.g. T1A01")
    sub_element_code = models.CharField(max_length=10, db_index=True, help_text="e.g. T1")
    sub_group_code = models.CharField(max_length=10, db_index=True, help_text="e.g. T1A")
    
    question_text = models.TextField()
    fcc_citation = models.CharField(max_length=100, blank=True, help_text="e.g. [97.1]")
    correct_letter = models.CharField(max_length=1, help_text="A, B, C, or D")
    correct_choice_id = models.UUIDField(null=True, blank=True, db_index=True)
    
    has_diagram = models.BooleanField(default=False, db_index=True)
    diagram_figure_name = models.CharField(max_length=100, blank=True, help_text="e.g. Figure T-1")
    shuffle_disabled = models.BooleanField(default=False, help_text="True if choices contain cross-letter references like 'Both A and B'")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('pool', 'question_code')
        ordering = ['question_code']

    def __str__(self):
        return f"{self.question_code} ({self.correct_letter})"


class Choice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    original_letter = models.CharField(max_length=1, help_text="A, B, C, or D")
    choice_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    is_pinned_bottom = models.BooleanField(default=False, help_text="True for 'All of the above' / 'None of the above'")

    class Meta:
        ordering = ['original_letter']

    def __str__(self):
        return f"{self.question.question_code} [{self.original_letter}] {self.choice_text[:50]}"


class QuestionDiagram(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='diagrams')
    figure_name = models.CharField(max_length=100, help_text="e.g. Figure T-1")
    image = models.FileField(upload_to='diagrams/', blank=True, null=True)
    is_uploaded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.question.question_code} - {self.figure_name} (Uploaded: {self.is_uploaded})"


class Explanation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.OneToOneField(Question, on_delete=models.CASCADE, related_name='explanation')
    explanation_markdown = models.TextField(help_text="Detailed conceptual explanation and formula derivation")
    fcc_citation_url = models.URLField(max_length=500, blank=True, help_text="Direct link to eCFR Title 47 Part 97 rule")
    is_admin_verified = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Explanation for {self.question.question_code}"
