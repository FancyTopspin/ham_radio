import os
import re
import urllib.request
from pathlib import Path
from datetime import date
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.conf import settings
from questions.models import (
    LicenseClass, LicensePool, SubElement, SubGroup,
    Question, Choice, QuestionDiagram, Explanation
)


class Command(BaseCommand):
    help = "Import and parse official NCVEC question pools (Technician, General, Extra) into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--class',
            dest='license_class',
            type=str,
            choices=['TECH', 'GEN', 'EXTRA', 'ALL'],
            default='ALL',
            help='License class to import (TECH, GEN, EXTRA, or ALL)'
        )
        parser.add_argument(
            '--file',
            type=str,
            help='Path to a local NCVEC question pool .txt file'
        )
        parser.add_argument(
            '--url',
            type=str,
            help='Direct URL to download the NCVEC question pool file'
        )
        parser.add_argument(
            '--pool-version',
            dest='pool_version',
            type=str,
            help='Pool version override (e.g. 2026-2030)'
        )

    def handle(self, *args, **options):
        license_class = options['license_class']
        file_path = options['file']
        url = options['url']
        version_override = options['pool_version']

        classes_to_import = ['TECH', 'GEN', 'EXTRA'] if license_class == 'ALL' else [license_class]

        for cls in classes_to_import:
            self.stdout.write(self.style.MIGRATE_HEADING(f"\n--- Processing License Class: {cls} ---"))
            self.import_class_pool(cls, file_path, url, version_override)

    def import_class_pool(self, cls, file_path=None, url=None, version_override=None):
        # Determine source
        class_file_map = {
            'TECH': 'Technician.txt',
            'GEN': 'General.txt',
            'EXTRA': 'Extra.txt',
        }
        class_version_defaults = {
            'TECH': '2026-2030',
            'GEN': '2023-2027',
            'EXTRA': '2024-2028',
        }

        raw_text = ""
        source_url = url or ""

        if url:
            self.stdout.write(f"Fetching pool from URL: {url}...")
            req = urllib.request.Request(url, headers={'User-Agent': 'HamRadioExamApp/1.0'})
            try:
                with urllib.request.urlopen(req) as resp:
                    raw_text = resp.read().decode('utf-8', errors='ignore')
            except Exception as e:
                raise CommandError(f"Failed to download pool from {url}: {e}")
        elif file_path:
            p = Path(file_path)
            if not p.exists():
                raise CommandError(f"File not found: {file_path}")
            raw_text = p.read_text(encoding='utf-8', errors='ignore')
        else:
            default_path = settings.BASE_DIR / 'data' / 'pools' / class_file_map[cls]
            if not default_path.exists():
                raise CommandError(f"Default pool file not found at {default_path}")
            self.stdout.write(f"Reading from local file: {default_path}")
            raw_text = default_path.read_text(encoding='utf-8', errors='ignore')

        # Detect version from text or default
        version = version_override
        if not version:
            version_match = re.search(r'(\d{4}[-–]\d{4})', raw_text[:500])
            version = version_match.group(1).replace('–', '-') if version_match else class_version_defaults[cls]

        self.stdout.write(f"Using Pool Version: {version}")

        # Transactional import
        with transaction.atomic():
            pool, created = LicensePool.objects.update_or_create(
                class_type=cls,
                pool_version=version,
                defaults={
                    'is_active': True,
                    'source_url': source_url,
                }
            )

            # 1. Parse Syllabus SubElements and SubGroups
            self.parse_syllabus(pool, raw_text)

            # 2. Parse Questions & Choices
            q_count, diag_count, pinned_count, freeze_count = self.parse_questions(pool, raw_text)

        self.stdout.write(self.style.SUCCESS(
            f"Successfully imported {pool}: {q_count} questions ({diag_count} requiring diagrams, "
            f"{pinned_count} pinned choices, {freeze_count} shuffle-frozen questions)"
        ))

    def parse_syllabus(self, pool, text):
        subelement_re = re.compile(
            r'SUBELEMENT\s+([TGE][0-9])\s*[-–]\s*(.+?)\s*\[(\d+)\s*Exam Questions.*?[\]\n]',
            re.IGNORECASE
        )
        subgroup_re = re.compile(r'^([TGE][0-9][A-Z])\s+(.+)$', re.MULTILINE)

        # Parse SubElements
        current_subelement = None
        for line in text.splitlines():
            se_match = subelement_re.search(line)
            if se_match:
                code, title, count = se_match.groups()
                current_subelement, _ = SubElement.objects.update_or_create(
                    pool=pool,
                    code=code.upper(),
                    defaults={
                        'title': title.strip().strip('-– '),
                        'exam_questions_count': int(count)
                    }
                )
                continue

            if current_subelement:
                sg_match = subgroup_re.match(line.strip())
                if sg_match:
                    g_code, g_title = sg_match.groups()
                    if g_code.startswith(current_subelement.code):
                        SubGroup.objects.update_or_create(
                            sub_element=current_subelement,
                            code=g_code.upper(),
                            defaults={'title': g_title.strip()}
                        )

    def parse_questions(self, pool, text):
        q_header_re = re.compile(r'^([TGE][0-9][A-Z][0-9]{2})\s+\(([A-D])\)\s*(?:\[(.*?)\])?', re.MULTILINE)
        pinned_re = re.compile(r'(?i)(all\s+(?:of\s+)?(?:these\s+|the\s+)?choices|none\s+of\s+(?:the\s+above|these))')
        freeze_re = re.compile(r'(?i)(both\s+[A-D]\s+and\s+[A-D]|choice(?:s)?\s+[A-D]\s+and\s+[A-D])')
        diagram_re = re.compile(r'(?i)(?:figure|schematic|diagram)\s+([A-Z0-9\-]+)')

        blocks = [b.strip() for b in text.split('~~') if b.strip()]

        q_count = 0
        diag_count = 0
        pinned_count = 0
        freeze_count = 0

        # Cache subgroups
        subgroups = {sg.code: sg for sg in SubGroup.objects.filter(sub_element__pool=pool)}

        for b in blocks:
            header_match = q_header_re.search(b)
            if not header_match:
                continue

            q_code, correct_letter, citation = header_match.groups()
            header_end = header_match.end()
            rest = b[header_end:].strip()

            first_choice_match = re.search(r'^[A-D]\.\s*', rest, re.MULTILINE)
            if not first_choice_match:
                continue

            q_text = rest[:first_choice_match.start()].strip()
            choices_text = rest[first_choice_match.start():].strip()

            # Extract raw choices
            raw_choices = re.split(r'^([A-D])\.\s*', choices_text, flags=re.MULTILINE)
            if len(raw_choices) < 9:
                continue

            se_code = q_code[:2]
            sg_code = q_code[:3]
            subgroup = subgroups.get(sg_code)

            diag_match = diagram_re.search(q_text)
            has_diagram = bool(diag_match)
            fig_name = diag_match.group(0) if diag_match else ""

            # Check shuffle freeze
            has_freeze = bool(freeze_re.search(q_text))

            cleaned_citation = (citation or '').strip()

            question, _ = Question.objects.update_or_create(
                pool=pool,
                question_code=q_code,
                defaults={
                    'sub_group': subgroup,
                    'sub_element_code': se_code,
                    'sub_group_code': sg_code,
                    'question_text': q_text,
                    'fcc_citation': cleaned_citation,
                    'correct_letter': correct_letter,
                    'has_diagram': has_diagram,
                    'diagram_figure_name': fig_name,
                    'shuffle_disabled': has_freeze,
                }
            )

            # Replace or update choices
            Choice.objects.filter(question=question).delete()
            correct_choice_uuid = None

            for i in range(1, len(raw_choices), 2):
                letter = raw_choices[i].strip()
                c_text = raw_choices[i+1].strip()
                is_correct = (letter == correct_letter)
                is_pinned = bool(pinned_re.search(c_text))
                if freeze_re.search(c_text):
                    question.shuffle_disabled = True
                    question.save(update_fields=['shuffle_disabled'])

                choice = Choice.objects.create(
                    question=question,
                    original_letter=letter,
                    choice_text=c_text,
                    is_correct=is_correct,
                    is_pinned_bottom=is_pinned
                )
                if is_correct:
                    correct_choice_uuid = choice.id
                if is_pinned:
                    pinned_count += 1

            if correct_choice_uuid:
                question.correct_choice_id = correct_choice_uuid
                question.save(update_fields=['correct_choice_id'])

            # Diagram tracking
            if has_diagram:
                QuestionDiagram.objects.get_or_create(
                    question=question,
                    figure_name=fig_name,
                )
                diag_count += 1

            if question.shuffle_disabled:
                freeze_count += 1

            # Explanation generation
            fcc_url = ""
            if cleaned_citation:
                rule_match = re.search(r'97\.(\d+)', cleaned_citation)
                if rule_match:
                    fcc_url = f"https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97#97.{rule_match.group(1)}"

            explanation_text = self.generate_initial_explanation(question, cleaned_citation, fcc_url)
            Explanation.objects.update_or_create(
                question=question,
                defaults={
                    'explanation_markdown': explanation_text,
                    'fcc_citation_url': fcc_url,
                }
            )

            q_count += 1

        return q_count, diag_count, pinned_count, freeze_count

    def generate_initial_explanation(self, question, citation, fcc_url):
        # Finds the correct choice
        correct_choice = question.choices.filter(is_correct=True).first()
        correct_text = correct_choice.choice_text if correct_choice else "See answer key."
        
        explanation_parts = [
            f"**Correct Answer:** Option {question.correct_letter} — *{correct_text}*\n"
        ]
        
        if citation:
            explanation_parts.append(f"**FCC Part 97 Reference:** Section [{citation}]")
            if fcc_url:
                explanation_parts.append(f"[Read full rule on eCFR]({fcc_url})\n")

        explanation_parts.append(
            f"**Technical Summary:** This question covers sub-element **{question.sub_element_code}**, group **{question.sub_group_code}**. "
            f"Reviewing the exact wording of the rule and memorizing the core principle ensures full retention for the exam."
        )

        return "\n".join(explanation_parts)
