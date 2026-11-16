from django.test import TestCase, Client

class HealthCheckTest(TestCase):
    def test_api_health_check(self):
        client = Client()
        response = client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("version"), "1.0.0")
