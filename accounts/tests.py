from rest_framework import status
from rest_framework.test import APITestCase

from .models import User, UserRole


class AccountsApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='StrongPass123', role=UserRole.ADMIN)
        self.teacher = User.objects.create_user(username='teacher', password='StrongPass123', role=UserRole.ENSEIGNANT)
        self.student = User.objects.create_user(username='student', password='StrongPass123', role=UserRole.ETUDIANT)

    def registration_payload(self, **overrides):
        payload = {'username': 'newstudent', 'email': 'newstudent@example.com', 'password': 'StrongPass123', 'first_name': 'New', 'last_name': 'Student'}
        payload.update(overrides)
        return payload

    def test_public_registration_creates_student(self):
        response = self.client.post('/api/auth/register/', self.registration_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.get(username='newstudent').role, UserRole.ETUDIANT)

    def test_public_registration_cannot_set_admin_role(self):
        response = self.client.post('/api/auth/register/', self.registration_payload(role=UserRole.ADMIN), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='newstudent').exists())

    def test_public_registration_cannot_set_teacher_role(self):
        response = self.client.post('/api/auth/register/', self.registration_payload(role=UserRole.ENSEIGNANT), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='newstudent').exists())

    def test_login_returns_tokens_and_safe_user_data(self):
        response = self.client.post('/api/auth/login/', {'username': 'student', 'password': 'StrongPass123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], UserRole.ETUDIANT)
        self.assertNotIn('password', response.data['user'])

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {'username': 'student', 'password': 'wrong-password'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_with_token(self):
        login = self.client.post('/api/auth/login/', {'username': 'student', 'password': 'StrongPass123'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'student')

    def test_me_without_token_is_rejected(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_list_users(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)

    def test_student_cannot_list_users(self):
        self.client.force_authenticate(self.student)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_use_admin_endpoints(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_user_role_and_activation(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(f'/api/users/{self.student.id}/', {'first_name': 'Updated', 'role': UserRole.ENSEIGNANT, 'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, 'Updated')
        self.assertEqual(self.student.role, UserRole.ENSEIGNANT)
        self.assertFalse(self.student.is_active)

    def test_admin_cannot_delete_own_account(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete(f'/api/users/{self.admin.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(pk=self.admin.id).exists())
