from datetime import timedelta
from unittest.mock import patch

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User, UserRole
from courses.models import Cours

from .models import Devoir, Soumission
from .services.assignment_generator import (
    AssignmentGenerationError,
    _extract_json,
    _normalise_generated_assignment,
    _validate_generated_assignment,
)
from .services.feedback_generator import FeedbackError, _parse_feedback_json
from .services.submission_analyzer import analyze_submission


LISTE_TUPLE_CRITERIA = [
    {
        'id': 1,
        'description': "L'étudiant doit indiquer qu'une liste est mutable.",
        'concepts_attendus': [['liste'], ['mutable', 'modifiable']],
        'contradictions': [['liste', 'immutable'], ['liste', 'immuable']],
    },
    {
        'id': 2,
        'description': "L'étudiant doit indiquer qu'un tuple est immutable.",
        'concepts_attendus': [['tuple'], ['immutable', 'immuable', 'non modifiable']],
        'contradictions': [['tuple', 'mutable'], ['tuple', 'modifiable']],
    },
]


class SubmissionAnalyzerTests(SimpleTestCase):
    def test_complete_answer_is_correcte_without_ai(self):
        result = analyze_submission('Une liste est mutable et un tuple est immutable.', LISTE_TUPLE_CRITERIA)

        self.assertEqual(result['evaluation'], 'correcte')
        self.assertEqual(len(result['criteres_valides']), 2)
        self.assertEqual(result['contradictions'], [])

    def test_partial_answer_is_partiellement_correcte_without_ai(self):
        result = analyze_submission('Une liste est mutable.', LISTE_TUPLE_CRITERIA)

        self.assertEqual(result['evaluation'], 'partiellement_correcte')
        self.assertEqual(len(result['criteres_valides']), 1)
        self.assertEqual(len(result['criteres_manquants']), 1)

    def test_contradictory_answer_is_incorrecte_without_ai(self):
        result = analyze_submission('Un tuple est mutable et une liste est immutable.', LISTE_TUPLE_CRITERIA)

        self.assertEqual(result['evaluation'], 'incorrecte')
        self.assertGreaterEqual(len(result['contradictions']), 1)

    def test_answer_without_expected_concepts_is_incorrecte_without_ai(self):
        result = analyze_submission('Python est un langage très populaire.', LISTE_TUPLE_CRITERIA)

        self.assertEqual(result['evaluation'], 'incorrecte')
        self.assertEqual(result['criteres_valides'], [])

    def test_accent_and_variant_can_validate_a_criterion(self):
        result = analyze_submission('Une LISTE est modifiable ; un tuple est immuable !', LISTE_TUPLE_CRITERIA)

        self.assertEqual(result['evaluation'], 'correcte')


class AssignmentsApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admina', password='StrongPass123', role=UserRole.ADMIN)
        self.teacher = User.objects.create_user(username='teachera', password='StrongPass123', role=UserRole.ENSEIGNANT)
        self.other_teacher = User.objects.create_user(username='teacherb', password='StrongPass123', role=UserRole.ENSEIGNANT)
        self.student = User.objects.create_user(username='studenta', password='StrongPass123', role=UserRole.ETUDIANT)
        self.other_student = User.objects.create_user(username='studentb', password='StrongPass123', role=UserRole.ETUDIANT)
        self.course = Cours.objects.create(titre='Published course', contenu='Content', enseignant=self.teacher, is_published=True)
        self.other_course = Cours.objects.create(titre='Other course', contenu='Content', enseignant=self.other_teacher, is_published=True)
        self.private_course = Cours.objects.create(titre='Private course', contenu='Content', enseignant=self.teacher, is_published=False)
        self.deadline = timezone.now() + timedelta(days=2)
        self.devoir = Devoir.objects.create(
            titre='Assignment',
            consigne='Expliquez les listes et les tuples.',
            correction_reference='Une liste est mutable et un tuple est immutable.',
            criteres_correction=LISTE_TUPLE_CRITERIA,
            cours=self.course,
            enseignant=self.teacher,
            date_limite=self.deadline,
            is_published=True,
        )

    def devoir_payload(self, **extra):
        data = {
            'titre': 'New assignment',
            'consigne': 'Do this',
            'correction_reference': 'Reference answer',
            'criteres_correction': LISTE_TUPLE_CRITERIA,
            'cours': self.course.id,
            'date_limite': (timezone.now() + timedelta(days=2)).isoformat(),
            'is_published': True,
        }
        data.update(extra)
        return data

    def test_teacher_creates_only_for_own_course_and_owner_is_forced(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post('/api/devoirs/', self.devoir_payload(enseignant=self.other_teacher.id), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Devoir.objects.get(id=response.data['id']).enseignant, self.teacher)
        forbidden = self.client.post('/api/devoirs/', self.devoir_payload(cours=self.other_course.id), format='json')
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

    def test_devoir_permissions_and_student_visibility(self):
        private = Devoir.objects.create(titre='Private', consigne='No', cours=self.course, enseignant=self.teacher, date_limite=self.deadline, is_published=False)
        hidden_course = Devoir.objects.create(titre='Hidden course', consigne='No', cours=self.private_course, enseignant=self.teacher, date_limite=self.deadline, is_published=True)
        self.client.force_authenticate(self.student)
        listed = self.client.get('/api/devoirs/')
        self.assertEqual({item['id'] for item in listed.data}, {self.devoir.id})
        self.assertEqual(self.client.get(f'/api/devoirs/{private.id}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get(f'/api/devoirs/{hidden_course.id}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.post('/api/devoirs/', self.devoir_payload(), format='json').status_code, status.HTTP_403_FORBIDDEN)

    def test_student_assignment_list_never_exposes_correction_or_criteria(self):
        self.client.force_authenticate(self.student)

        response = self.client.get('/api/devoirs/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertNotIn('correction_reference', response.data[0])
        self.assertNotIn('criteres_correction', response.data[0])

    def test_student_assignment_detail_never_exposes_correction_or_criteria(self):
        self.client.force_authenticate(self.student)

        response = self.client.get(f'/api/devoirs/{self.devoir.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('correction_reference', response.data)
        self.assertNotIn('criteres_correction', response.data)

    def test_teacher_owner_and_admin_keep_assignment_correction_fields(self):
        self.client.force_authenticate(self.teacher)
        teacher_response = self.client.get(f'/api/devoirs/{self.devoir.id}/')
        self.assertEqual(teacher_response.status_code, status.HTTP_200_OK)
        self.assertIn('correction_reference', teacher_response.data)
        self.assertIn('criteres_correction', teacher_response.data)

        self.client.force_authenticate(self.admin)
        admin_response = self.client.get(f'/api/devoirs/{self.devoir.id}/')
        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)
        self.assertIn('correction_reference', admin_response.data)
        self.assertIn('criteres_correction', admin_response.data)

    def test_teacher_can_edit_criteria_and_cannot_publish_without_valid_criteria(self):
        self.client.force_authenticate(self.teacher)
        edited = self.client.patch(
            f'/api/devoirs/{self.devoir.id}/',
            {'criteres_correction': [LISTE_TUPLE_CRITERIA[0]]},
            format='json',
        )
        self.assertEqual(edited.status_code, status.HTTP_200_OK)
        self.assertEqual(edited.data['criteres_correction'][0]['description'], LISTE_TUPLE_CRITERIA[0]['description'])

        draft = Devoir.objects.create(
            titre='Draft',
            consigne='Explain',
            correction_reference='Reference',
            cours=self.course,
            enseignant=self.teacher,
            date_limite=self.deadline,
            is_published=False,
        )
        refused = self.client.patch(f'/api/devoirs/{draft.id}/', {'is_published': True}, format='json')
        self.assertEqual(refused.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('criteres_correction', refused.data)

    def test_student_submission_is_owned_and_unique(self):
        self.client.force_authenticate(self.student)
        payload = {'devoir': self.devoir.id, 'reponse_texte': 'My answer', 'etudiant': self.other_student.id}
        response = self.client.post('/api/soumissions/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post('/api/soumissions/', {'devoir': self.devoir.id, 'reponse_texte': 'My answer'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Soumission.objects.get(id=response.data['id']).etudiant, self.student)
        self.assertEqual(self.client.post('/api/soumissions/', {'devoir': self.devoir.id, 'reponse_texte': 'Again'}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_can_grade_submission_and_note_remains_teacher_controlled(self):
        submission = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Answer')
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(f'/api/soumissions/{submission.id}/', {'note': 20}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(self.teacher)
        corrected = self.client.patch(f'/api/soumissions/{submission.id}/', {'note': 18, 'feedback': 'Good work'}, format='json')
        self.assertEqual(corrected.status_code, status.HTTP_200_OK)
        submission.refresh_from_db()
        self.assertEqual(float(submission.note), 18)

    @patch('assignments.views.generer_feedback')
    def test_feedback_uses_deterministic_evaluation_and_never_changes_note(self, mock_feedback):
        mock_feedback.return_value = {
            'points_corrects': 'La liste est mutable.',
            'probleme': 'Aucun problème important.',
            'conseil': 'Continuez ainsi.',
            'evaluation': 'incorrecte',
        }
        submission = Soumission.objects.create(
            devoir=self.devoir,
            etudiant=self.student,
            reponse_texte='Une liste est mutable et un tuple est immutable.',
            note=15,
        )
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/soumissions/{submission.id}/generer-feedback/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Évaluation : Correcte', response.data['feedback'])
        submission.refresh_from_db()
        self.assertEqual(float(submission.note), 15)
        self.assertEqual(submission.feedback, response.data['feedback'])
        self.assertEqual(mock_feedback.call_args.args[-1]['evaluation'], 'correcte')

    @patch('assignments.views.generer_feedback')
    def test_feedback_endpoint_handles_partial_and_contradictory_answers(self, mock_feedback):
        mock_feedback.return_value = {
            'points_corrects': 'Texte IA.',
            'probleme': 'Texte IA.',
            'conseil': 'Texte IA.',
        }
        partial = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Une liste est mutable.')
        contradictory = Soumission.objects.create(devoir=self.devoir, etudiant=self.other_student, reponse_texte='Une liste est immutable et un tuple est mutable.')
        self.client.force_authenticate(self.teacher)

        partial_response = self.client.post(f'/api/soumissions/{partial.id}/generer-feedback/')
        contradictory_response = self.client.post(f'/api/soumissions/{contradictory.id}/generer-feedback/')

        self.assertEqual(partial_response.status_code, status.HTTP_200_OK)
        self.assertIn('Évaluation : Partiellement correcte', partial_response.data['feedback'])
        self.assertEqual(contradictory_response.status_code, status.HTTP_200_OK)
        self.assertIn('Évaluation : Incorrecte', contradictory_response.data['feedback'])

    @patch('assignments.views.generer_feedback', side_effect=FeedbackError('Gemini indisponible'))
    def test_feedback_falls_back_to_python_when_qwen_fails(self, mock_feedback):
        submission = Soumission.objects.create(
            devoir=self.devoir,
            etudiant=self.student,
            reponse_texte='Une liste est mutable.',
            note=12,
        )
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/soumissions/{submission.id}/generer-feedback/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Évaluation : Partiellement correcte', response.data['feedback'])
        self.assertIn('tuple est immutable', response.data['feedback'])
        submission.refresh_from_db()
        self.assertEqual(float(submission.note), 12)
        self.assertEqual(submission.feedback, response.data['feedback'])
        mock_feedback.assert_called_once()

    def test_feedback_refuses_empty_or_invalid_teacher_criteria(self):
        empty = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='')
        invalid_devoir = Devoir.objects.create(
            titre='Invalid criteria',
            consigne='Explain',
            correction_reference='Reference',
            criteres_correction=[],
            cours=self.course,
            enseignant=self.teacher,
            date_limite=self.deadline,
        )
        invalid = Soumission.objects.create(devoir=invalid_devoir, etudiant=self.other_student, reponse_texte='Answer')
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.post(f'/api/soumissions/{empty.id}/generer-feedback/').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.post(f'/api/soumissions/{invalid.id}/generer-feedback/').status_code, status.HTTP_400_BAD_REQUEST)

    @patch('assignments.views.generate_assignment')
    def test_teacher_generates_unpublished_assignment_with_criteria(self, mock_generate):
        mock_generate.return_value = {
            'titre': 'Generated title',
            'description': 'Generated description',
            'consigne': 'Generated instruction',
            'correction_reference': 'Generated reference',
            'criteres_correction': LISTE_TUPLE_CRITERIA,
        }
        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            f'/api/cours/{self.course.id}/generer-devoir/',
            {'date_limite': (timezone.now() + timedelta(days=4)).isoformat()},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        devoir = Devoir.objects.get(id=response.data['id'])
        self.assertTrue(devoir.is_generated_by_ai)
        self.assertFalse(devoir.is_published)
        self.assertEqual(devoir.criteres_correction, LISTE_TUPLE_CRITERIA)
        self.assertEqual(devoir.enseignant, self.teacher)

    @patch('assignments.views.generate_assignment')
    def test_failed_assignment_generation_creates_nothing(self, mock_generate):
        self.client.force_authenticate(self.teacher)
        count = Devoir.objects.count()
        mock_generate.side_effect = AssignmentGenerationError('JSON invalide')
        response = self.client.post(f'/api/cours/{self.course.id}/generer-devoir/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(Devoir.objects.count(), count)

    def test_admin_can_manage_any_devoir(self):
        other = Devoir.objects.create(
            titre='Other', consigne='Explain', correction_reference='Reference',
            criteres_correction=LISTE_TUPLE_CRITERIA, cours=self.other_course,
            enseignant=self.other_teacher, date_limite=self.deadline, is_published=True,
        )
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(f'/api/devoirs/{other.id}/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.patch(f'/api/devoirs/{other.id}/', {'titre': 'Edited'}, format='json').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.delete(f'/api/devoirs/{other.id}/').status_code, status.HTTP_204_NO_CONTENT)

    def test_teacher_cannot_update_or_delete_other_devoir(self):
        other = Devoir.objects.create(
            titre='Other', consigne='Explain', correction_reference='Reference',
            criteres_correction=LISTE_TUPLE_CRITERIA, cours=self.other_course,
            enseignant=self.other_teacher, date_limite=self.deadline, is_published=True,
        )
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.patch(f'/api/devoirs/{other.id}/', {'titre': 'Hack'}, format='json').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(f'/api/devoirs/{other.id}/').status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_create_update_or_delete_devoir(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/devoirs/', self.devoir_payload(), format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(f'/api/devoirs/{self.devoir.id}/', {'titre': 'Hack'}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(f'/api/devoirs/{self.devoir.id}/').status_code, status.HTTP_403_FORBIDDEN)

    def test_student_sees_only_own_submissions(self):
        own = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Own')
        other = Soumission.objects.create(devoir=self.devoir, etudiant=self.other_student, reponse_texte='Other')
        self.client.force_authenticate(self.student)
        self.assertEqual({item['id'] for item in self.client.get('/api/soumissions/').data}, {own.id})
        self.assertEqual(self.client.get(f'/api/soumissions/{other.id}/').status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_change_feedback(self):
        submission = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Answer')
        self.client.force_authenticate(self.student)
        response = self.client.patch(f'/api/soumissions/{submission.id}/', {'feedback': 'Hack'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_can_update_own_answer_before_deadline(self):
        submission = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Before')
        self.client.force_authenticate(self.student)
        response = self.client.patch(f'/api/soumissions/{submission.id}/', {'reponse_texte': 'After'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        submission.refresh_from_db()
        self.assertEqual(submission.reponse_texte, 'After')

    def test_student_cannot_update_after_deadline(self):
        late = Devoir.objects.create(
            titre='Late', consigne='Explain', correction_reference='Reference',
            criteres_correction=LISTE_TUPLE_CRITERIA, cours=self.course,
            enseignant=self.teacher, date_limite=timezone.now() - timedelta(minutes=1), is_published=True,
        )
        submission = Soumission.objects.create(devoir=late, etudiant=self.student, reponse_texte='Before')
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(f'/api/soumissions/{submission.id}/', {'reponse_texte': 'After'}, format='json').status_code, status.HTTP_403_FORBIDDEN)

    def test_submission_rejects_empty_answer(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/soumissions/', {'devoir': self.devoir.id}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    def test_submission_rejects_late_devoir(self):
        late = Devoir.objects.create(
            titre='Late', consigne='Explain', correction_reference='Reference',
            criteres_correction=LISTE_TUPLE_CRITERIA, cours=self.course,
            enseignant=self.teacher, date_limite=timezone.now() - timedelta(minutes=1), is_published=True,
        )
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/soumissions/', {'devoir': late.id, 'reponse_texte': 'Answer'}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    def test_submission_rejects_unpublished_devoir(self):
        draft = Devoir.objects.create(titre='Draft', consigne='Explain', cours=self.course, enseignant=self.teacher, date_limite=self.deadline)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/soumissions/', {'devoir': draft.id, 'reponse_texte': 'Answer'}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    def test_submission_rejects_devoir_from_unpublished_course(self):
        hidden = Devoir.objects.create(
            titre='Hidden', consigne='Explain', correction_reference='Reference',
            criteres_correction=LISTE_TUPLE_CRITERIA, cours=self.private_course,
            enseignant=self.teacher, date_limite=self.deadline, is_published=True,
        )
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/soumissions/', {'devoir': hidden.id, 'reponse_texte': 'Answer'}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_sees_own_submissions_and_admin_sees_all(self):
        own = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Own')
        other_devoir = Devoir.objects.create(
            titre='Other', consigne='Explain', correction_reference='Reference',
            criteres_correction=LISTE_TUPLE_CRITERIA, cours=self.other_course,
            enseignant=self.other_teacher, date_limite=self.deadline, is_published=True,
        )
        other = Soumission.objects.create(devoir=other_devoir, etudiant=self.other_student, reponse_texte='Other')
        self.client.force_authenticate(self.teacher)
        teacher_list = self.client.get('/api/soumissions/')
        self.assertEqual({item['id'] for item in teacher_list.data}, {own.id})
        self.assertEqual(teacher_list.data[0]['etudiant_info']['username'], self.student.username)
        self.client.force_authenticate(self.admin)
        self.assertEqual({item['id'] for item in self.client.get('/api/soumissions/').data}, {own.id, other.id})

    def test_note_must_be_between_zero_and_twenty(self):
        submission = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Answer')
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.patch(f'/api/soumissions/{submission.id}/', {'note': -1}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.patch(f'/api/soumissions/{submission.id}/', {'note': 21}, format='json').status_code, status.HTTP_400_BAD_REQUEST)

    @patch('assignments.views.generer_feedback')
    def test_feedback_generation_permissions(self, mock_feedback):
        submission = Soumission.objects.create(devoir=self.devoir, etudiant=self.student, reponse_texte='Answer')
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(f'/api/soumissions/{submission.id}/generer-feedback/').status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.other_teacher)
        self.assertEqual(self.client.post(f'/api/soumissions/{submission.id}/generer-feedback/').status_code, status.HTTP_404_NOT_FOUND)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post(f'/api/soumissions/{submission.id}/generer-feedback/').status_code, status.HTTP_401_UNAUTHORIZED)
        mock_feedback.assert_not_called()

    def test_feedback_refuses_missing_reference_correction(self):
        no_reference = Devoir.objects.create(
            titre='No reference', consigne='Explain', criteres_correction=LISTE_TUPLE_CRITERIA,
            cours=self.course, enseignant=self.teacher, date_limite=self.deadline,
        )
        submission = Soumission.objects.create(devoir=no_reference, etudiant=self.student, reponse_texte='Answer')
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.post(f'/api/soumissions/{submission.id}/generer-feedback/').status_code, status.HTTP_400_BAD_REQUEST)

    @patch('assignments.views.generate_assignment')
    def test_assignment_generation_refuses_other_teacher_and_student(self, mock_generate):
        self.client.force_authenticate(self.other_teacher)
        self.assertEqual(self.client.post(f'/api/cours/{self.course.id}/generer-devoir/', {}, format='json').status_code, status.HTTP_404_NOT_FOUND)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(f'/api/cours/{self.course.id}/generer-devoir/', {}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        mock_generate.assert_not_called()

    @patch('assignments.views.generate_assignment')
    def test_assignment_generation_defaults_deadline(self, mock_generate):
        mock_generate.return_value = {
            'titre': 'Generated title', 'description': 'Generated description',
            'consigne': 'Generated instruction', 'correction_reference': 'Generated reference',
            'criteres_correction': LISTE_TUPLE_CRITERIA,
        }
        self.client.force_authenticate(self.teacher)
        before = timezone.now()
        response = self.client.post(f'/api/cours/{self.course.id}/generer-devoir/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        deadline = Devoir.objects.get(id=response.data['id']).date_limite
        self.assertGreater(deadline, before + timedelta(days=6))

    @patch('assignments.views.generate_assignment')
    def test_assignment_generation_rejects_invalid_deadline(self, mock_generate):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/cours/{self.course.id}/generer-devoir/', {'date_limite': 'invalid'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_generate.assert_not_called()

    def test_assignment_generator_accepts_valid_criteria(self):
        result = _validate_generated_assignment({
            'titre': 'T', 'description': 'D', 'consigne': 'C',
            'correction_reference': 'R', 'criteres_correction': LISTE_TUPLE_CRITERIA,
        })
        self.assertEqual(result['criteres_correction'], LISTE_TUPLE_CRITERIA)

    def test_assignment_generator_rejects_invalid_criteria_structure(self):
        with self.assertRaises(AssignmentGenerationError):
            _validate_generated_assignment({
                'titre': 'T', 'description': 'D', 'consigne': 'C',
                'correction_reference': 'R', 'criteres_correction': [{'description': 'Missing concepts'}],
            })

    def test_assignment_generator_normalizes_aliases_flat_phrase_groups_and_missing_ids(self):
        normalized = _normalise_generated_assignment({
            'title': 'Titre',
            'description': 'Description',
            'instruction': 'Consigne',
            'correction': 'Correction',
            'criteres': [
                {'description': 'Critère 1', 'concepts_attendus': ['liste', 'mutable']},
                {'description': 'Critère 2', 'concepts': ['tuple', 'immutable']},
            ],
        })

        result = _validate_generated_assignment(normalized)
        self.assertEqual(result['titre'], 'Titre')
        self.assertEqual(result['criteres_correction'][0]['id'], 1)
        self.assertEqual(result['criteres_correction'][0]['concepts_attendus'], [['liste'], ['mutable']])
        self.assertEqual(result['criteres_correction'][1]['id'], 2)

    def test_assignment_generator_extracts_json_with_surrounding_text(self):
        payload = _extract_json('Voici le devoir : ```json\n{"titre":"OK"}\n``` texte final')
        self.assertEqual(payload, {'titre': 'OK'})

    def test_assignment_generator_rejects_truncated_outer_json_instead_of_nested_criterion(self):
        raw_output = '{"titre":"Devoir","criteres_correction":[{"id":1,"description":"Critère"}]'
        with self.assertRaises(AssignmentGenerationError):
            _extract_json(raw_output)


class FeedbackGeneratorTests(SimpleTestCase):
    def test_model_evaluation_field_is_ignored(self):
        payload = _parse_feedback_json(
            '{"evaluation":"incorrecte","points_corrects":"x","probleme":"Aucun problème important.","conseil":"Continuez ainsi."}'
        )

        self.assertNotIn('evaluation', payload)
        self.assertEqual(payload['points_corrects'], 'x')

    def test_assignment_generator_rejects_missing_criteria(self):
        with self.assertRaises(AssignmentGenerationError):
            _validate_generated_assignment(
                {
                    'titre': 'T',
                    'description': 'D',
                    'consigne': 'C',
                    'correction_reference': 'R',
                }
            )
