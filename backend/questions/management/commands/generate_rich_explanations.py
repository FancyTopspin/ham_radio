import os
import re
import json
import time
import threading
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.core.management.base import BaseCommand
from django.db import transaction
from questions.models import Question, Explanation

db_lock = threading.Lock()

PROMPT_TEMPLATE = """You are a master Ham Radio instructor and electronics engineer (Extra Class, ARRL VE).
Generate comprehensive, engaging, highly pedagogical study explanations for the following FCC exam questions.

For EACH question, you MUST produce:
1. "question_code": The exact question ID (e.g. T1A01).
2. "explanation_markdown": A rich, detailed explanation structured exactly as follows:
### 💡 Why This Is Correct
[In-depth concept explanation. Explain the physical principle, electronics circuit theory, radio wave propagation, operating protocol, or FCC regulatory purpose. If math/formulas are involved (Ohm's Law V=IR, power P=I^2R, dipole length 468/f, wavelength 300/f, decibels, SWR, reactance, etc.), write out the formula and step-by-step arithmetic explicitly.]

### 🔍 Breakdown of Other Choices
- **[Option Letter and Text]**: [Detailed reason why this is incorrect, or the common trap/misconception it tests]
- **[Option Letter and Text]**: [Detailed reason why this is incorrect]
- **[Option Letter and Text]**: [Detailed reason why this is incorrect]

### ⚡ Practical Operating Tip & Memory Hook
[A memorable real-world operating rule-of-thumb, mnemonic, or practical tip that guarantees retention for exam day.]

Questions to explain:
{questions_text}

Output ONLY a valid JSON array of objects:
[
  {{
    "question_code": "...",
    "explanation_markdown": "..."
  }}
]
Do not include any conversational filler. Return only valid JSON.
"""

def clean_json_response(raw_text: str) -> str:
    text = raw_text.strip()
    match = re.search(r'```(?:json)?\s*(\[\s*\{.*?\}\s*\])\s*```', text, re.DOTALL)
    if match:
        return match.group(1)
    match2 = re.search(r'(\[\s*\{.*\}\s*\])', text, re.DOTALL)
    if match2:
        return match2.group(1)
    return text


def format_questions_for_prompt(questions) -> str:
    blocks = []
    for q in questions:
        choices_text = []
        for c in q.choices.all().order_by('original_letter'):
            choices_text.append(f"{c.original_letter}. {c.choice_text}")
        
        correct_choice = q.choices.filter(is_correct=True).first()
        correct_letter = correct_choice.original_letter if correct_choice else q.correct_letter
        correct_str = f"{correct_letter} ({correct_choice.choice_text if correct_choice else ''})"

        citation_str = f" [Rule: {q.fcc_citation}]" if q.fcc_citation else ""
        sub_group_title = q.sub_group.title if q.sub_group else ""
        sub_elem_title = q.sub_group.sub_element.title if (q.sub_group and q.sub_group.sub_element) else ""

        block = (
            f"Question: {q.question_code}{citation_str}\n"
            f"Topic: {sub_elem_title} - {sub_group_title}\n"
            f"Question Text: {q.question_text}\n"
            f"Correct Answer: {correct_str}\n"
            f"Options:\n" + "\n".join(choices_text)
        )
        blocks.append(block)

    return "\n\n".join(blocks)


def process_question_batch(batch_questions, model_name="Gemini 3.8 Flash (Low)"):
    questions_text = format_questions_for_prompt(batch_questions)
    prompt = PROMPT_TEMPLATE.format(questions_text=questions_text)

    cmd = ["agy", "--model", model_name, "-p", prompt]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        if res.returncode != 0:
            return None, f"agy error {res.returncode}: {res.stderr[:200]}"
        
        cleaned = clean_json_response(res.stdout)
        data = json.loads(cleaned)
        return data, None
    except subprocess.TimeoutExpired:
        return None, "Command timed out"
    except Exception as e:
        return None, f"Parse error: {str(e)}"


class Command(BaseCommand):
    help = "Generates comprehensive, in-depth pedagogical explanations for Ham Radio questions"

    def add_arguments(self, parser):
        parser.add_argument(
            '--class',
            dest='license_class',
            choices=['TECH', 'GEN', 'EXTRA', 'ALL'],
            default='ALL',
            help='Target license class (TECH, GEN, EXTRA, ALL)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=4,
            help='Number of questions per LLM prompt (default: 4)'
        )
        parser.add_argument(
            '--workers',
            type=int,
            default=4,
            help='Number of concurrent worker threads (default: 4)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regenerating explanations even if already comprehensive'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Limit total questions processed (0 = unlimited)'
        )

    def handle(self, *args, **options):
        target_class = options['license_class']
        batch_size = options['batch_size']
        max_workers = options['workers']
        force = options['force']
        limit = options['limit']

        qs = Question.objects.select_related('pool', 'sub_group__sub_element', 'explanation').prefetch_related('choices')
        if target_class != 'ALL':
            qs = qs.filter(pool__class_type=target_class)

        all_questions = list(qs.order_by('question_code'))
        
        pending = []
        for q in all_questions:
            if force:
                pending.append(q)
            else:
                has_explanation = hasattr(q, 'explanation') and q.explanation and q.explanation.explanation_markdown
                is_rich = has_explanation and "### 💡 Why This Is Correct" in q.explanation.explanation_markdown
                if not is_rich:
                    pending.append(q)

        if limit > 0:
            pending = pending[:limit]

        total_pending = len(pending)
        self.stdout.write(self.style.SUCCESS(
            f"Found {len(all_questions)} total questions. {total_pending} questions need rich explanations."
        ))

        if total_pending == 0:
            self.stdout.write(self.style.SUCCESS("All questions already have rich explanations!"))
            return

        batches = [pending[i:i + batch_size] for i in range(0, total_pending, batch_size)]
        self.stdout.write(f"Divided {total_pending} questions into {len(batches)} batches of {batch_size} (using {max_workers} concurrent workers).")

        start_time = time.time()
        completed_count = 0
        failed_count = 0

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_batch = {
                executor.submit(process_question_batch, batch): (idx, batch)
                for idx, batch in enumerate(batches)
            }

            for future in as_completed(future_to_batch):
                b_idx, batch = future_to_batch[future]
                batch_codes = [q.question_code for q in batch]
                batch_q_map = {q.question_code: q for q in batch}

                try:
                    data, err = future.result()
                    if err or not data:
                        # Retry once
                        data, err = process_question_batch(batch)

                    if err or not data:
                        self.stdout.write(self.style.WARNING(f"Batch {b_idx+1} failed: {err}"))
                        failed_count += len(batch)
                        continue

                    # Save with lock to avoid database locked errors
                    with db_lock:
                        with transaction.atomic():
                            for item in data:
                                q_code = item.get('question_code')
                                if q_code in batch_q_map:
                                    self.save_explanation(batch_q_map[q_code], item)
                                    completed_count += 1

                    elapsed = time.time() - start_time
                    percent = (completed_count / total_pending) * 100
                    rate = completed_count / elapsed if elapsed > 0 else 0
                    self.stdout.write(self.style.SUCCESS(
                        f"[{completed_count}/{total_pending} ({percent:.1f}%)] Processed batch {b_idx+1}/{len(batches)} ({', '.join(batch_codes)}) - {rate:.1f} q/s"
                    ))

                except Exception as exc:
                    self.stdout.write(self.style.ERROR(f"Batch {b_idx+1} exception: {exc}"))
                    failed_count += len(batch)

        elapsed_total = time.time() - start_time
        self.stdout.write(self.style.SUCCESS(
            f"Finished generating explanations in {elapsed_total:.1f}s! Successfully updated: {completed_count}, Failed: {failed_count}."
        ))

    def save_explanation(self, question, item):
        explanation_markdown = item.get('explanation_markdown', '').strip()
        if not explanation_markdown:
            return

        fcc_url = ""
        if question.fcc_citation:
            rule_match = re.search(r'97\.(\d+)', question.fcc_citation)
            if rule_match:
                fcc_url = f"https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97#97.{rule_match.group(1)}"

        Explanation.objects.update_or_create(
            question=question,
            defaults={
                'explanation_markdown': explanation_markdown,
                'fcc_citation_url': fcc_url,
                'is_admin_verified': True,
            }
        )
