from django.test import TestCase, Client
from django.contrib.auth.models import User

class HealthCheckTest(TestCase):
    def test_api_health_check(self):
        client = Client()
        response = client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("version"), "1.0.0")


class AuthApiTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_get_current_user_unauthenticated(self):
        response = self.client.get('/api/auth/me')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["authenticated"])
        self.assertIsNone(data["user"])

    def test_register_and_me(self):
        register_data = {
            "username": "hamuser",
            "email": "hamuser@example.com",
            "password": "Password123!"
        }
        response = self.client.post(
            '/api/auth/register',
            data=register_data,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["authenticated"])
        self.assertEqual(data["user"]["username"], "hamuser")
        self.assertEqual(data["user"]["email"], "hamuser@example.com")

        # Session should persist
        me_resp = self.client.get('/api/auth/me')
        self.assertEqual(me_resp.status_code, 200)
        self.assertTrue(me_resp.json()["authenticated"])

    def test_login_and_logout(self):
        User.objects.create_user(
            username="existingham",
            email="existing@example.com",
            password="SecurePassword456"
        )

        # Login with email
        login_resp = self.client.post(
            '/api/auth/login',
            data={
                "username_or_email": "existing@example.com",
                "password": "SecurePassword456"
            },
            content_type="application/json"
        )
        self.assertEqual(login_resp.status_code, 200)
        self.assertTrue(login_resp.json()["authenticated"])

        # Logout
        logout_resp = self.client.post('/api/auth/logout')
        self.assertEqual(logout_resp.status_code, 200)

        # Me should now be unauthenticated
        me_resp = self.client.get('/api/auth/me')
        self.assertFalse(me_resp.json()["authenticated"])
