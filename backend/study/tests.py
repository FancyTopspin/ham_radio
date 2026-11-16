import uuid
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from .models import AttemptEvent

class StudySyncApiTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="radioguy",
            email="radioguy@example.com",
            password="RadioPassword1"
        )

    def test_anonymous_sync(self):
        attempt_id = str(uuid.uuid4())
        payload = {
            "device_id": "test-device-123",
            "attempts": [
                {
                    "id": attempt_id,
                    "question_id": "tech-t1a01",
                    "question_code": "T1A01",
                    "selected_choice_id": "choice-1",
                    "is_correct": True,
                    "mode": "study",
                    "duration_ms": 3200,
                    "created_at": timezone.now().isoformat()
                }
            ]
        }
        response = self.client.post(
            '/api/study/sync',
            data=payload,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["synced_count"], 1)

        # Verify DB object
        self.assertTrue(AttemptEvent.objects.filter(id=attempt_id).exists())
        obj = AttemptEvent.objects.get(id=attempt_id)
        self.assertIsNone(obj.user)
        self.assertEqual(obj.device_id, "test-device-123")
        self.assertTrue(obj.is_correct)

    def test_authenticated_sync_and_retrieve(self):
        self.client.force_login(self.user)
        attempt_id = str(uuid.uuid4())
        payload = {
            "device_id": "test-device-auth",
            "attempts": [
                {
                    "id": attempt_id,
                    "question_id": "tech-t1a02",
                    "question_code": "T1A02",
                    "selected_choice_id": "choice-2",
                    "is_correct": False,
                    "mode": "mock_exam",
                    "duration_ms": 5000,
                    "created_at": timezone.now().isoformat()
                }
            ]
        }
        sync_resp = self.client.post(
            '/api/study/sync',
            data=payload,
            content_type="application/json"
        )
        self.assertEqual(sync_resp.status_code, 200)

        # Idempotency test: duplicate sync should not error
        sync_resp2 = self.client.post(
            '/api/study/sync',
            data=payload,
            content_type="application/json"
        )
        self.assertEqual(sync_resp2.status_code, 200)

        # Retrieve attempts
        get_resp = self.client.get('/api/study/attempts')
        self.assertEqual(get_resp.status_code, 200)
        data = get_resp.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["attempts"][0]["question_code"], "T1A02")
        self.assertFalse(data["attempts"][0]["is_correct"])

    def test_reset_user_history(self):
        self.client.force_login(self.user)
        AttemptEvent.objects.create(
            user=self.user,
            question_id="tech-t1a01",
            question_code="T1A01",
            is_correct=True,
            created_at=timezone.now()
        )
        AttemptEvent.objects.create(
            user=self.user,
            question_id="gen-g1a01",
            question_code="G1A01",
            is_correct=True,
            created_at=timezone.now()
        )

        # Reset only TECH
        reset_resp = self.client.post('/api/study/reset-history?class_type=TECH')
        self.assertEqual(reset_resp.status_code, 200)
        self.assertEqual(reset_resp.json()["deleted_count"], 1)

        # GEN attempt should remain
        self.assertEqual(AttemptEvent.objects.filter(user=self.user).count(), 1)
        self.assertEqual(AttemptEvent.objects.filter(user=self.user).first().question_code, "G1A01")
