from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User, UserRole
from .models import Cours, Resume
from quizzes.models import Question, Quiz, Reponse
from quizzes.services.quiz_generator import QuizGenerationError


class CoursesApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='StrongPass123', role=UserRole.ADMIN)
        self.teacher = User.objects.create_user(username='teacher', password='StrongPass123', role=UserRole.ENSEIGNANT)
        self.other_teacher = User.objects.create_user(username='otherteacher', password='StrongPass123', role=UserRole.ENSEIGNANT)
        self.student = User.objects.create_user(username='student', password='StrongPass123', role=UserRole.ETUDIANT)
        self.own_course = Cours.objects.create(titre='My course', description='Description', contenu='Content', enseignant=self.teacher)
        self.other_course = Cours.objects.create(titre='Other course', description='Description', contenu='Content', enseignant=self.other_teacher)
        self.published_course = Cours.objects.create(titre='Published', description='Description', contenu='Content', enseignant=self.other_teacher, is_published=True)

    def test_teacher_creates_course_and_owner_is_forced(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post('/api/cours/', {'titre': 'New course', 'description': 'A description', 'contenu': 'Main content', 'enseignant': self.other_teacher.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Cours.objects.get(id=response.data['id']).enseignant, self.teacher)

    def test_teacher_only_sees_own_courses(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.get('/api/cours/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({course['id'] for course in response.data}, {self.own_course.id})

    def test_teacher_cannot_change_or_delete_another_teachers_course(self):
        self.client.force_authenticate(self.teacher)
        update = self.client.patch(f'/api/cours/{self.other_course.id}/', {'titre': 'Hijacked'}, format='json')
        delete = self.client.delete(f'/api/cours/{self.other_course.id}/')
        self.assertIn(update.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        self.assertIn(delete.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        self.assertTrue(Cours.objects.filter(id=self.other_course.id).exists())

    def test_admin_can_list_and_update_any_course(self):
        self.client.force_authenticate(self.admin)
        listed = self.client.get('/api/cours/')
        updated = self.client.patch(f'/api/cours/{self.own_course.id}/', {'titre': 'Admin edited'}, format='json')
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listed.data), 3)
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.own_course.refresh_from_db()
        self.assertEqual(self.own_course.titre, 'Admin edited')

    def test_student_cannot_create_and_only_sees_published_courses(self):
        self.client.force_authenticate(self.student)
        created = self.client.post('/api/cours/', {'titre': 'Nope', 'contenu': 'Nope'}, format='json')
        listed = self.client.get('/api/cours/')
        hidden_detail = self.client.get(f'/api/cours/{self.own_course.id}/')
        self.assertEqual(created.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual({course['id'] for course in listed.data}, {self.published_course.id})
        self.assertEqual(hidden_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_resume_singleton_and_owner_management(self):
        self.client.force_authenticate(self.teacher)
        created = self.client.post(f'/api/cours/{self.own_course.id}/resume/', {'contenu': 'Short summary'}, format='json')
        duplicate = self.client.post(f'/api/cours/{self.own_course.id}/resume/', {'contenu': 'Another summary'}, format='json')
        updated = self.client.patch(f'/api/cours/{self.own_course.id}/resume/', {'contenu': 'Updated summary'}, format='json')
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(Resume.objects.get(cours=self.own_course).contenu, 'Updated summary')

    def test_other_teacher_cannot_manage_resume(self):
        Resume.objects.create(cours=self.own_course, contenu='Summary')
        self.client.force_authenticate(self.other_teacher)
        response = self.client.patch(f'/api/cours/{self.own_course.id}/resume/', {'contenu': 'Changed'}, format='json')
        self.assertIn(response.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        self.assertEqual(Resume.objects.get(cours=self.own_course).contenu, 'Summary')

    def test_admin_can_list_all_resumes(self):
        Resume.objects.create(cours=self.own_course, contenu='Summary')
        self.client.force_authenticate(self.admin)
        response = self.client.get('/api/resumes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_student_reads_published_resume_but_cannot_change_it(self):
        Resume.objects.create(cours=self.published_course, contenu='Public summary')
        self.client.force_authenticate(self.student)
        fetched = self.client.get(f'/api/cours/{self.published_course.id}/resume/')
        changed = self.client.patch(f'/api/cours/{self.published_course.id}/resume/', {'contenu': 'No access'}, format='json')
        self.assertEqual(fetched.status_code, status.HTTP_200_OK)
        self.assertEqual(fetched.data['contenu'], 'Public summary')
        self.assertEqual(changed.status_code, status.HTTP_403_FORBIDDEN)

    @patch('courses.views.generer_resume', return_value='Generated summary')
    def test_admin_can_generate_and_create_resume(self, mock_generate):
        self.client.force_authenticate(self.admin)
        response = self.client.post(f'/api/cours/{self.own_course.id}/generer-resume/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['cours_id'], self.own_course.id)
        self.assertEqual(Resume.objects.get(cours=self.own_course).contenu, 'Generated summary')
        mock_generate.assert_called_once_with('Content')

    @patch('courses.views.generer_resume', return_value='New generated summary')
    def test_owner_can_generate_and_update_existing_resume(self, mock_generate):
        Resume.objects.create(cours=self.own_course, contenu='Old manual summary')
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{self.own_course.id}/generer-resume/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Resume.objects.filter(cours=self.own_course).count(), 1)
        self.assertEqual(Resume.objects.get(cours=self.own_course).contenu, 'New generated summary')
        mock_generate.assert_called_once()

    @patch('courses.views.generer_resume')
    def test_other_teacher_cannot_generate_and_service_is_not_called(self, mock_generate):
        self.client.force_authenticate(self.other_teacher)
        response = self.client.post(f'/api/cours/{self.own_course.id}/generer-resume/')
        self.assertIn(response.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        mock_generate.assert_not_called()

    @patch('courses.views.generer_resume')
    def test_student_cannot_generate_and_service_is_not_called(self, mock_generate):
        self.client.force_authenticate(self.student)
        response = self.client.post(f'/api/cours/{self.published_course.id}/generer-resume/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_generate.assert_not_called()

    @patch('courses.views.generer_resume')
    def test_unauthenticated_cannot_generate_and_service_is_not_called(self, mock_generate):
        response = self.client.post(f'/api/cours/{self.own_course.id}/generer-resume/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        mock_generate.assert_not_called()

    @patch('courses.views.generer_resume')
    def test_empty_course_returns_400_without_calling_service(self, mock_generate):
        empty_course = Cours.objects.create(titre='Empty', contenu='   ', enseignant=self.teacher)
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{empty_course.id}/generer-resume/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_generate.assert_not_called()

    @patch('courses.views.generer_resume')
    def test_unknown_course_returns_404_without_calling_service(self, mock_generate):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/cours/999999/generer-resume/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        mock_generate.assert_not_called()

    @patch('courses.views.generer_resume', return_value='Preview proposal')
    def test_owner_can_preview_short_draft_course_without_persisting(self, mock_generate):
        Resume.objects.create(cours=self.own_course, contenu='Official summary')
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{self.own_course.id}/generer-resume-preview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['contenu'], 'Preview proposal')
        self.assertEqual(Resume.objects.get(cours=self.own_course).contenu, 'Official summary')
        mock_generate.assert_called_once_with(self.own_course.contenu)

    @patch('courses.views.generer_resume', return_value='Long preview proposal')
    def test_owner_can_preview_long_course_without_modifying_official_resume(self, mock_generate):
        long_course = Cours.objects.create(
            titre='Long Python course',
            contenu=' '.join(['Python utilise des variables, des fonctions et des modules.'] * 900),
            enseignant=self.teacher,
        )
        Resume.objects.create(cours=long_course, contenu='Official long summary')
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{long_course.id}/generer-resume-preview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['contenu'], 'Long preview proposal')
        self.assertEqual(Resume.objects.get(cours=long_course).contenu, 'Official long summary')
        mock_generate.assert_called_once_with(long_course.contenu)

    @patch('courses.views.generer_resume')
    def test_other_teacher_cannot_generate_resume_preview_for_draft(self, mock_generate):
        self.client.force_authenticate(self.other_teacher)
        response = self.client.post(f'/api/cours/{self.own_course.id}/generer-resume-preview/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        mock_generate.assert_not_called()

    @patch('courses.views.generer_resume')
    def test_student_cannot_generate_resume_preview(self, mock_generate):
        self.client.force_authenticate(self.student)
        response = self.client.post(f'/api/cours/{self.published_course.id}/generer-resume-preview/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_generate.assert_not_called()


class SummarizerWorkflowTests(SimpleTestCase):
    class WordTokenizer:
        eos_token_id = 1
        pad_token_id = 0

        def encode(self, text, add_special_tokens=False):
            return text.split()

        def decode(self, token_ids, skip_special_tokens=True):
            return ' '.join(token_ids)

    @patch('courses.services.summarizer.generate_content', return_value='Python présente les variables et les fonctions.')
    def test_gemini_summary_is_cleaned_and_kept_as_a_proposal(self, mock_generate):
        from courses.services import summarizer
        result = summarizer.generer_resume('Python présente les variables et les fonctions dans ce cours.')
        self.assertTrue(result.endswith('.'))
        mock_generate.assert_called_once()

    def test_cleanup_keeps_a_complete_sentence_and_removes_adjacent_repetition(self):
        from courses.services.summarizer import _complete_last_sentence

        result = _complete_last_sentence(
            'Python est polyvalent. École de commerce, école de commerce, école de commerce. Fin incomplète'
        )
        self.assertEqual(result, 'Python est polyvalent. École de commerce.')

    def test_cleanup_removes_a_sentence_without_source_terms(self):
        from courses.services.summarizer import _complete_last_sentence

        result = _complete_last_sentence(
            'Python est interprété et polyvalent. Les astuces secrètes garantissent la réussite.',
            source_text='Python est un langage interprété et polyvalent.',
        )
        self.assertEqual(result, 'Python est interprété et polyvalent.')


class GenerateQuizApiTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(username='quiz-teacher', password='StrongPass123', role=UserRole.ENSEIGNANT)
        self.other_teacher = User.objects.create_user(username='quiz-other-teacher', password='StrongPass123', role=UserRole.ENSEIGNANT)
        self.student = User.objects.create_user(username='quiz-student', password='StrongPass123', role=UserRole.ETUDIANT)
        self.course = Cours.objects.create(titre='Python', contenu='Python utilise des fonctions.', enseignant=self.teacher)
        self.other_course = Cours.objects.create(titre='Autre', contenu='Autre contenu.', enseignant=self.other_teacher)

    def generated_quiz(self, is_published=True):
        return {
            'titre': 'Quiz généré sur Python',
            'description': 'QCM généré.',
            'is_published': is_published,
            'questions': [
                {
                    'texte': 'À quoi sert une fonction ?',
                    'points': 500,
                    'reponses': [
                        {'texte': 'Réutiliser du code', 'est_correcte': True},
                        {'texte': 'Supprimer Python', 'est_correcte': False},
                        {'texte': 'Créer un navigateur', 'est_correcte': False},
                        {'texte': 'Changer le système', 'est_correcte': False},
                    ],
                },
            ],
        }

    @patch('courses.views.generate_quiz')
    def test_owner_generates_unpublished_quiz_with_questions_and_answers(self, mock_generate):
        mock_generate.return_value = self.generated_quiz()
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{self.course.id}/generer-quiz/', format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        quiz = Quiz.objects.get(pk=response.data['id'])
        self.assertEqual(quiz.cours, self.course)
        self.assertEqual(quiz.enseignant, self.teacher)
        self.assertFalse(quiz.is_published)
        question = Question.objects.get(quiz=quiz)
        self.assertEqual((question.ordre, question.points), (1, 1))
        self.assertEqual(question.reponses.count(), 4)
        self.assertEqual(question.reponses.filter(est_correcte=True).count(), 1)

    @patch('courses.views.generate_quiz')
    def test_student_cannot_generate_quiz(self, mock_generate):
        self.client.force_authenticate(self.student)
        response = self.client.post(f'/api/cours/{self.course.id}/generer-quiz/', format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Quiz.objects.filter(cours=self.course).exists())
        mock_generate.assert_not_called()

    @patch('courses.views.generate_quiz')
    def test_other_teacher_cannot_generate_quiz_for_foreign_course(self, mock_generate):
        self.client.force_authenticate(self.other_teacher)
        response = self.client.post(f'/api/cours/{self.course.id}/generer-quiz/', format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(Quiz.objects.filter(cours=self.course).exists())
        mock_generate.assert_not_called()

    @patch('courses.views.generate_quiz')
    def test_question_count_is_forwarded_to_generator(self, mock_generate):
        mock_generate.return_value = self.generated_quiz()
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{self.course.id}/generer-quiz/', {'question_count': 3}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_generate.assert_called_once_with(self.course.titre, self.course.contenu, 3)

    @patch('courses.views.generate_quiz', side_effect=QuizGenerationError('Erreur IA contrôlée.'))
    def test_ai_error_returns_clean_response_without_quiz(self, mock_generate):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{self.course.id}/generer-quiz/', format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['detail'], 'Erreur IA contrôlée.')
        self.assertFalse(Quiz.objects.filter(cours=self.course).exists())
        mock_generate.assert_called_once()

    @patch('courses.views.Question.objects.create', side_effect=RuntimeError('Erreur de sauvegarde'))
    @patch('courses.views.generate_quiz')
    def test_database_error_rolls_back_quiz_creation(self, mock_generate, mock_question_create):
        mock_generate.return_value = self.generated_quiz()
        self.client.force_authenticate(self.teacher)
        with self.assertRaises(RuntimeError):
            self.client.post(f'/api/cours/{self.course.id}/generer-quiz/', format='json')
        self.assertFalse(Quiz.objects.filter(cours=self.course).exists())
        self.assertFalse(Question.objects.exists())
        self.assertFalse(Reponse.objects.exists())
        mock_question_create.assert_called_once()

    @patch('courses.views.generate_quiz', side_effect=QuizGenerationError('Le contenu du cours est vide.'))
    def test_empty_course_service_error_does_not_create_quiz(self, mock_generate):
        empty_course = Cours.objects.create(titre='Vide', contenu='   ', enseignant=self.teacher)
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{empty_course.id}/generer-quiz/', format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertFalse(Quiz.objects.filter(cours=empty_course).exists())
        mock_generate.assert_called_once_with(empty_course.titre, empty_course.contenu, 5)

    @patch('courses.views.generate_quiz')
    def test_generated_publication_flag_is_ignored(self, mock_generate):
        mock_generate.return_value = self.generated_quiz(is_published=True)
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{self.course.id}/generer-quiz/', format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(Quiz.objects.get(pk=response.data['id']).is_published)
