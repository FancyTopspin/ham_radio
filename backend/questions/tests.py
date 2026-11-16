from django.test import TestCase, Client
from questions.models import LicensePool, Question, Choice, SubElement, SubGroup


class QuestionPoolApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a test pool
        cls.pool = LicensePool.objects.create(
            class_type='TECH',
            pool_version='2026-2030',
            is_active=True
        )
        cls.subelement = SubElement.objects.create(
            pool=cls.pool,
            code='T1',
            title="Commission's Rules",
            exam_questions_count=6
        )
        cls.subgroup = SubGroup.objects.create(
            sub_element=cls.subelement,
            code='T1A',
            title="Basis and Purpose"
        )
        cls.question = Question.objects.create(
            pool=cls.pool,
            sub_group=cls.subgroup,
            question_code='T1A01',
            sub_element_code='T1',
            sub_group_code='T1A',
            question_text='Which of the following is part of the Basis and Purpose?',
            fcc_citation='97.1',
            correct_letter='C',
            has_diagram=False
        )
        cls.choice_a = Choice.objects.create(
            question=cls.question,
            original_letter='A',
            choice_text='Personal radio communications',
            is_correct=False
        )
        cls.choice_b = Choice.objects.create(
            question=cls.question,
            original_letter='B',
            choice_text='International contesting',
            is_correct=False
        )
        cls.choice_c = Choice.objects.create(
            question=cls.question,
            original_letter='C',
            choice_text='Advancing skills in radio art',
            is_correct=True
        )
        cls.choice_d = Choice.objects.create(
            question=cls.question,
            original_letter='D',
            choice_text='All of these choices are correct',
            is_correct=False,
            is_pinned_bottom=True
        )
        cls.question.correct_choice_id = cls.choice_c.id
        cls.question.save()

    def setUp(self):
        self.client = Client()

    def test_list_pools(self):
        response = self.client.get('/api/questions/pools')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        tech = next(p for p in data if p['class_type'] == 'TECH')
        self.assertEqual(tech['pool_version'], '2026-2030')
        self.assertEqual(tech['exam_quota'], 35)

    def test_get_pool_detail(self):
        response = self.client.get('/api/questions/pools/TECH')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['class_type'], 'TECH')
        self.assertEqual(data['pool_version'], '2026-2030')

    def test_get_pool_syllabus(self):
        response = self.client.get('/api/questions/pools/TECH/syllabus')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['code'], 'T1')
        self.assertEqual(len(data[0]['groups']), 1)
        self.assertEqual(data[0]['groups'][0]['code'], 'T1A')

    def test_get_pool_questions(self):
        response = self.client.get('/api/questions/pools/TECH/questions')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        q = data[0]
        self.assertEqual(q['question_code'], 'T1A01')
        self.assertEqual(len(q['choices']), 4)
        
        # Verify choice attributes
        pinned = [c for c in q['choices'] if c['is_pinned_bottom']]
        self.assertEqual(len(pinned), 1)
        self.assertEqual(pinned[0]['original_letter'], 'D')
