from datetime import date, time
import json
from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User, UserRole
from courses.models import Cours

from .models import CreneauEmploiDuTemps, EmploiDuTempsSemaine, PlanningEtude, ReclamationPlanning, SessionEtude
from .services.study_plan_generator import StudyPlanGenerationError
from .services.timetable_generator import generate_timetable_preview


class PlanningApiTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='planning-student', password='pass', role=UserRole.ETUDIANT)
        self.other_student = User.objects.create_user(username='planning-other', password='pass', role=UserRole.ETUDIANT)
        self.admin = User.objects.create_user(username='planning-admin', password='pass', role=UserRole.ADMIN)
        self.teacher = User.objects.create_user(username='planning-teacher', password='pass', role=UserRole.ENSEIGNANT)
        self.course = Cours.objects.create(titre='Cours publié', contenu='Contenu', enseignant=self.teacher, is_published=True)
        self.unpublished_course = Cours.objects.create(titre='Cours brouillon', contenu='Contenu', enseignant=self.teacher, is_published=False)
        self.planning = PlanningEtude.objects.create(etudiant=self.student, titre='Mon planning', objectif='Réviser', date_debut=date(2026, 1, 1), date_fin=date(2026, 1, 7))
        self.other_planning = PlanningEtude.objects.create(etudiant=self.other_student, titre='Autre planning', objectif='Réviser', date_debut=date(2026, 1, 1), date_fin=date(2026, 1, 7))

    def planning_payload(self, **overrides):
        payload = {'titre': 'Nouveau planning', 'objectif': 'Apprendre', 'date_debut': '2026-02-01', 'date_fin': '2026-02-07'}
        payload.update(overrides)
        return payload

    def session_payload(self, planning=None, cours=None, **overrides):
        payload = {'planning': (planning or self.planning).id, 'cours': (cours or self.course).id, 'titre': 'Révision', 'description': 'Chapitre 1', 'date_session': '2026-01-03', 'heure_debut': '09:00:00', 'duree_minutes': 60, 'ordre': 1}
        payload.update(overrides)
        return payload

    def test_student_creates_planning(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/', self.planning_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlanningEtude.objects.get(pk=response.data['id']).etudiant, self.student)

    def test_student_owner_is_forced(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/', self.planning_payload(etudiant=self.other_student.id), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlanningEtude.objects.get(pk=response.data['id']).etudiant, self.student)

    def test_student_sees_only_own_plannings(self):
        self.client.force_authenticate(self.student)
        response = self.client.get('/api/plannings/')
        self.assertEqual({item['id'] for item in response.data}, {self.planning.id})

    def test_student_cannot_access_other_planning(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(f'/api/plannings/{self.other_planning.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_can_update_own_planning(self):
        self.client.force_authenticate(self.student)
        response = self.client.patch(f'/api/plannings/{self.planning.id}/', {'titre': 'Modifié'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.planning.refresh_from_db()
        self.assertEqual(self.planning.titre, 'Modifié')

    def test_student_can_delete_own_planning(self):
        self.client.force_authenticate(self.student)
        response = self.client.delete(f'/api/plannings/{self.planning.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PlanningEtude.objects.filter(pk=self.planning.id).exists())

    def test_invalid_planning_dates_are_rejected(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/', self.planning_payload(date_debut='2026-02-07', date_fin='2026-02-01'), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_creates_session_in_own_planning(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/sessions-etude/', self.session_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SessionEtude.objects.get(pk=response.data['id']).planning, self.planning)

    def test_session_in_other_student_planning_is_rejected(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/sessions-etude/', self.session_payload(planning=self.other_planning), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(SessionEtude.objects.exists())

    def test_session_outside_planning_period_is_rejected(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/sessions-etude/', self.session_payload(date_session='2026-01-08'), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_zero_duration_is_rejected(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/sessions-etude/', self.session_payload(duree_minutes=0), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unpublished_course_is_rejected_for_student(self):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/sessions-etude/', self.session_payload(cours=self.unpublished_course), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_can_mark_own_session_completed(self):
        session = SessionEtude.objects.create(planning=self.planning, cours=self.course, titre='Session', date_session=date(2026, 1, 3), heure_debut=time(9, 0), duree_minutes=30)
        self.client.force_authenticate(self.student)
        response = self.client.patch(f'/api/sessions-etude/{session.id}/', {'is_completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertTrue(session.is_completed)

    def test_student_cannot_update_other_student_session(self):
        session = SessionEtude.objects.create(planning=self.other_planning, cours=self.course, titre='Session', date_session=date(2026, 1, 3), heure_debut=time(9, 0), duree_minutes=30)
        self.client.force_authenticate(self.student)
        response = self.client.patch(f'/api/sessions-etude/{session.id}/', {'is_completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_manage_plannings_and_sessions(self):
        self.client.force_authenticate(self.admin)
        planning_response = self.client.post('/api/plannings/', self.planning_payload(etudiant=self.student.id), format='json')
        self.assertEqual(planning_response.status_code, status.HTTP_201_CREATED)
        session_response = self.client.post('/api/sessions-etude/', self.session_payload(planning=PlanningEtude.objects.get(pk=planning_response.data['id']), date_session='2026-02-03'), format='json')
        self.assertEqual(session_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.client.get('/api/plannings/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.patch(f'/api/sessions-etude/{session_response.data["id"]}/', {'is_completed': True}, format='json').status_code, status.HTTP_200_OK)

    def test_teacher_cannot_create_student_planning(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post('/api/plannings/', self.planning_payload(etudiant=self.student.id), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_timetable_cell_is_rejected(self):
        emploi = EmploiDuTempsSemaine.objects.create(titre='Semaine', semaine_debut=date(2026, 1, 5), semaine_fin=date(2026, 1, 9), created_by=self.admin)
        CreneauEmploiDuTemps.objects.create(emploi_du_temps=emploi, cours=self.course, enseignant=self.teacher, jour='LUNDI', heure_debut=time(8), heure_fin=time(10))
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/creneaux-planning/', {'emploi_du_temps':emploi.id,'cours':self.course.id,'jour':'LUNDI','heure_debut':'08:00','heure_fin':'10:00','ordre':2,'is_locked':False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class StudyPlanGeneratorServiceTests(SimpleTestCase):
    courses = [
        {'id': 3, 'titre': 'Python', 'description': 'Introduction à Python'},
        {'id': 7, 'titre': 'Bases de données', 'description': 'SQL et modèle relationnel'},
    ]

    def valid_output(self, sessions=None):
        sessions = sessions or [
            {'cours_id': 7, 'titre': 'Révision SQL', 'description': 'Revoir les requêtes.', 'date_session': '2026-10-29', 'heure_debut': '18:00', 'duree_minutes': 60, 'ordre': 999},
            {'cours_id': 3, 'titre': 'Révision Python', 'description': 'Revoir les bases.', 'date_session': '2026-10-28', 'heure_debut': '17:00', 'duree_minutes': 60, 'ordre': 42},
        ]
        return json.dumps({'titre': 'Planning de révision', 'objectif': 'Préparer les examens', 'sessions': sessions})

    def output_with_first_session(self, **changes):
        payload = json.loads(self.valid_output())
        payload['sessions'][0].update(changes)
        return json.dumps(payload)

    def generate(self, output, **kwargs):
        with patch('planning.services.study_plan_generator._resources_for_cpu', return_value=(object(), object())), patch('planning.services.study_plan_generator._generate_raw', return_value=output):
            from planning.services.study_plan_generator import generate_study_plan
            return generate_study_plan('Préparer les examens', '2026-10-28', '2026-11-03', self.courses, sessions_per_week=2, **kwargs)

    def generate_for_period(self, output, start_date, end_date, sessions_per_week):
        with patch('planning.services.study_plan_generator._resources_for_cpu', return_value=(object(), object())), patch('planning.services.study_plan_generator._generate_raw', return_value=output):
            from planning.services.study_plan_generator import generate_study_plan
            return generate_study_plan('Préparer les examens', start_date, end_date, self.courses, sessions_per_week)

    def assert_generation_error(self, output, **kwargs):
        from planning.services.study_plan_generator import StudyPlanGenerationError
        with self.assertRaises(StudyPlanGenerationError):
            self.generate(output, **kwargs)

    def test_valid_output_is_accepted(self):
        result = self.generate('```json\n' + self.valid_output() + '\n```')
        self.assertEqual(result['titre'], 'Planning de révision')
        self.assertEqual(len(result['sessions']), 2)

    def test_unknown_course_id_is_rejected(self):
        self.assert_generation_error(self.output_with_first_session(cours_id=99))

    def test_session_before_start_date_is_rejected(self):
        self.assert_generation_error(self.output_with_first_session(date_session='2026-10-27'))

    def test_session_after_end_date_is_rejected(self):
        self.assert_generation_error(self.output_with_first_session(date_session='2026-11-04'))

    def test_invalid_duration_is_rejected(self):
        for duration in (0, 181):
            self.assert_generation_error(self.output_with_first_session(duree_minutes=duration))

    def test_invalid_json_is_rejected(self):
        self.assert_generation_error('pas du JSON')

    def test_empty_objective_is_rejected_without_loading_model(self):
        from planning.services.study_plan_generator import StudyPlanGenerationError, generate_study_plan
        with patch('planning.services.study_plan_generator._resources_for_cpu') as loader:
            with self.assertRaises(StudyPlanGenerationError):
                generate_study_plan(' ', '2026-10-28', '2026-11-03', self.courses)
        loader.assert_not_called()

    def test_end_date_before_start_date_is_rejected_without_loading_model(self):
        from planning.services.study_plan_generator import StudyPlanGenerationError, generate_study_plan
        with patch('planning.services.study_plan_generator._resources_for_cpu') as loader:
            with self.assertRaises(StudyPlanGenerationError):
                generate_study_plan('Objectif', '2026-11-03', '2026-10-28', self.courses)
        loader.assert_not_called()

    def test_empty_course_list_is_rejected_without_loading_model(self):
        from planning.services.study_plan_generator import StudyPlanGenerationError, generate_study_plan
        with patch('planning.services.study_plan_generator._resources_for_cpu') as loader:
            with self.assertRaises(StudyPlanGenerationError):
                generate_study_plan('Objectif', '2026-10-28', '2026-11-03', [])
        loader.assert_not_called()

    def test_invalid_sessions_per_week_is_rejected_without_loading_model(self):
        from planning.services.study_plan_generator import StudyPlanGenerationError, generate_study_plan
        for value in (0, 15):
            with patch('planning.services.study_plan_generator._resources_for_cpu') as loader:
                with self.assertRaises(StudyPlanGenerationError):
                    generate_study_plan('Objectif', '2026-10-28', '2026-11-03', self.courses, value)
                loader.assert_not_called()

    def test_ai_orders_are_normalized(self):
        result = self.generate(self.valid_output())
        self.assertEqual([session['ordre'] for session in result['sessions']], [1, 2])

    def test_sessions_are_sorted_by_date_and_time(self):
        result = self.generate(self.valid_output())
        self.assertEqual([session['titre'] for session in result['sessions']], ['Révision SQL', 'Révision Python'])

    def test_long_period_sessions_are_spread_across_period(self):
        sessions = [
            {'cours_id': 3 if index % 2 == 0 else 7, 'titre': f'Session {index}', 'description': '', 'date_session': f'2026-10-{28 + index % 3:02d}', 'heure_debut': '18:00', 'duree_minutes': 60}
            for index in range(8)
        ]
        result = self.generate_for_period(self.valid_output(sessions), '2026-10-28', '2026-11-10', 4)
        dates = [session['date_session'] for session in result['sessions']]
        self.assertEqual(len(set(dates)), 8)
        self.assertGreater(max(dates), '2026-11-03')

    def test_sessions_have_distinct_days_when_period_is_long_enough(self):
        result = self.generate(self.valid_output())
        self.assertEqual(len({session['date_session'] for session in result['sessions']}), 2)

    def test_normalized_dates_stay_within_requested_bounds(self):
        sessions = [
            {'cours_id': 3 if index % 2 == 0 else 7, 'titre': f'Borne {index}', 'description': '', 'date_session': '2026-10-28', 'heure_debut': '18:00', 'duree_minutes': 60}
            for index in range(8)
        ]
        result = self.generate_for_period(self.valid_output(sessions), '2026-10-28', '2026-11-10', 4)
        self.assertTrue(all('2026-10-28' <= session['date_session'] <= '2026-11-10' for session in result['sessions']))

    def test_single_session_is_normalized_without_division_by_zero(self):
        session = {'cours_id': 3, 'titre': 'Session unique', 'description': '', 'date_session': '2026-10-28', 'heure_debut': '18:00', 'duree_minutes': 60}
        result = self.generate_for_period(self.valid_output([session]), '2026-10-28', '2026-10-28', 1)
        self.assertEqual(result['sessions'][0]['date_session'], '2026-10-28')
        self.assertEqual(result['sessions'][0]['ordre'], 1)

    def test_more_sessions_than_days_are_balanced_without_overlap(self):
        sessions = [
            {'cours_id': 3 if index % 2 == 0 else 7, 'titre': f'Court {index}', 'description': '', 'date_session': '2026-10-28', 'heure_debut': '18:00', 'duree_minutes': 60}
            for index in range(4)
        ]
        result = self.generate_for_period(self.valid_output(sessions), '2026-10-28', '2026-10-29', 14)
        self.assertEqual({session['date_session'] for session in result['sessions']}, {'2026-10-28', '2026-10-29'})
        for session_date in {'2026-10-28', '2026-10-29'}:
            hours = [session['heure_debut'] for session in result['sessions'] if session['date_session'] == session_date]
            self.assertEqual(hours, sorted(hours))

    def test_normalized_orders_are_sequential(self):
        sessions = [
            {'cours_id': 3 if index % 2 == 0 else 7, 'titre': f'Ordre {index}', 'description': '', 'date_session': '2026-10-28', 'heure_debut': '18:00', 'duree_minutes': 60, 'ordre': 999}
            for index in range(8)
        ]
        result = self.generate_for_period(self.valid_output(sessions), '2026-10-28', '2026-11-10', 4)
        self.assertEqual([session['ordre'] for session in result['sessions']], list(range(1, 9)))


class GeneratePlanningApiTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='generated-plan-student', password='pass', role=UserRole.ETUDIANT)
        self.teacher = User.objects.create_user(username='generated-plan-teacher', password='pass', role=UserRole.ENSEIGNANT)
        self.admin = User.objects.create_user(username='generated-plan-admin', password='pass', role=UserRole.ADMIN)
        self.python = Cours.objects.create(titre='Python', description='Introduction', contenu='Contenu Python', enseignant=self.teacher, is_published=True)
        self.sql = Cours.objects.create(titre='SQL', description='Bases de données', contenu='Contenu SQL', enseignant=self.teacher, is_published=True)
        self.hidden = Cours.objects.create(titre='Brouillon', description='Privé', contenu='Contenu', enseignant=self.teacher, is_published=False)

    def payload(self, **overrides):
        data = {
            'objectif': 'Préparer les examens',
            'date_debut': '2026-10-28',
            'date_fin': '2026-11-03',
            'cours_ids': [self.python.id, self.sql.id],
            'sessions_per_week': 2,
        }
        data.update(overrides)
        return data

    def generated_plan(self, include_sensitive=False):
        result = {
            'titre': 'Planning généré',
            'objectif': 'Préparer les examens',
            'sessions': [
                {'cours_id': self.python.id, 'titre': 'Python', 'description': 'Réviser Python', 'date_session': '2026-10-28', 'heure_debut': '18:00', 'duree_minutes': 60, 'ordre': 1},
                {'cours_id': self.sql.id, 'titre': 'SQL', 'description': 'Réviser SQL', 'date_session': '2026-10-30', 'heure_debut': '18:00', 'duree_minutes': 60, 'ordre': 2},
            ],
        }
        if include_sensitive:
            result.update({'etudiant': 999, 'is_generated_by_ai': False})
            result['sessions'][0]['is_completed'] = True
        return result

    @patch('planning.views.generate_study_plan')
    def test_student_generates_planning_with_forced_fields(self, mock_generate):
        mock_generate.return_value = self.generated_plan(include_sensitive=True)
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        planning = PlanningEtude.objects.get(pk=response.data['id'])
        self.assertEqual(planning.etudiant, self.student)
        self.assertTrue(planning.is_generated_by_ai)
        self.assertEqual(planning.sessions.count(), 2)
        self.assertFalse(planning.sessions.filter(is_completed=True).exists())

    @patch('planning.views.generate_study_plan', return_value={'titre': 'Planning', 'objectif': 'Objectif', 'sessions': []})
    def test_payload_student_is_ignored(self, mock_generate):
        mock_generate.return_value = self.generated_plan()
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(etudiant=999), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlanningEtude.objects.get(pk=response.data['id']).etudiant, self.student)

    @patch('planning.views.generate_study_plan')
    def test_teacher_cannot_generate_planning(self, mock_generate):
        self.client.force_authenticate(self.teacher)
        response = self.client.post('/api/plannings/generer/', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(PlanningEtude.objects.exists())
        mock_generate.assert_not_called()

    @patch('planning.views.generate_study_plan')
    def test_admin_cannot_generate_planning(self, mock_generate):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/plannings/generer/', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(PlanningEtude.objects.exists())
        mock_generate.assert_not_called()

    @patch('planning.views.generate_study_plan')
    def test_unpublished_course_is_rejected_before_ai_call(self, mock_generate):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(cours_ids=[self.hidden.id]), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(PlanningEtude.objects.exists())
        mock_generate.assert_not_called()

    @patch('planning.views.generate_study_plan')
    def test_unknown_course_is_rejected_before_ai_call(self, mock_generate):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(cours_ids=[999999]), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(PlanningEtude.objects.exists())
        mock_generate.assert_not_called()

    @patch('planning.views.generate_study_plan')
    def test_duplicate_course_ids_are_rejected_before_ai_call(self, mock_generate):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(cours_ids=[self.python.id, self.python.id]), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('dupliqués', str(response.data))
        mock_generate.assert_not_called()

    @patch('planning.views.generate_study_plan')
    def test_question_count_is_ignored_and_not_sent_to_planning_service(self, mock_generate):
        mock_generate.return_value = self.generated_plan()
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(question_count=99), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_generate.assert_called_once_with('Préparer les examens', '2026-10-28', '2026-11-03', [
            {'id': self.python.id, 'titre': self.python.titre, 'description': self.python.description},
            {'id': self.sql.id, 'titre': self.sql.titre, 'description': self.sql.description},
        ], 2)

    @patch('planning.views.generate_study_plan')
    def test_sessions_per_week_is_forwarded(self, mock_generate):
        mock_generate.return_value = self.generated_plan()
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(sessions_per_week=4), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mock_generate.call_args.args[-1], 4)

    @patch('planning.views.generate_study_plan', side_effect=StudyPlanGenerationError('Erreur IA contrôlée.'))
    def test_ai_error_returns_clean_response_without_writes(self, mock_generate):
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Erreur IA contrôlée.')
        self.assertFalse(PlanningEtude.objects.exists())
        self.assertFalse(SessionEtude.objects.exists())
        mock_generate.assert_called_once()

    @patch('planning.views.generate_study_plan')
    def test_session_creation_error_rolls_back_all_writes(self, mock_generate):
        mock_generate.return_value = self.generated_plan()
        original_create = SessionEtude.objects.create
        calls = {'count': 0}

        def create_or_fail(*args, **kwargs):
            calls['count'] += 1
            if calls['count'] == 2:
                raise RuntimeError('Erreur de sauvegarde')
            return original_create(*args, **kwargs)

        self.client.force_authenticate(self.student)
        with patch('planning.views.SessionEtude.objects.create', side_effect=create_or_fail):
            with self.assertRaises(RuntimeError):
                self.client.post('/api/plannings/generer/', self.payload(), format='json')
        self.assertFalse(PlanningEtude.objects.exists())
        self.assertFalse(SessionEtude.objects.exists())

    @patch('planning.views.generate_study_plan')
    def test_ia_sensitive_fields_are_ignored(self, mock_generate):
        mock_generate.return_value = self.generated_plan(include_sensitive=True)
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        planning = PlanningEtude.objects.get(pk=response.data['id'])
        self.assertEqual(planning.etudiant, self.student)
        self.assertTrue(planning.is_generated_by_ai)

    @patch('planning.views.generate_study_plan')
    def test_session_completion_is_forced_false(self, mock_generate):
        mock_generate.return_value = self.generated_plan(include_sensitive=True)
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/plannings/generer/', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(SessionEtude.objects.get(planning_id=response.data['id'], ordre=1).is_completed)


class TimetablePreviewServiceTests(SimpleTestCase):
    courses = [
        {'id': 1, 'titre': 'Python', 'enseignant_id': 10, 'enseignant': 'teacher-python'},
        {'id': 2, 'titre': 'SQL', 'enseignant_id': 11, 'enseignant': 'teacher-sql'},
    ]
    payload = {'semaine_debut': '2026-11-23', 'jours': ['LUNDI'], 'horaires': [
        {'heure_debut': '08:00', 'heure_fin': '10:00'}, {'heure_debut': '10:00', 'heure_fin': '12:00'},
    ], 'creneaux_existants': [], 'creneaux_verrouilles': []}

    @patch('planning.services.timetable_generator.generate_json')
    def test_valid_gemini_assignments_fill_all_cases(self, mock_generate):
        mock_generate.return_value = {'affectations': [{'slot_id': 1, 'cours_id': '1'}, {'slot_id': 2, 'cours_id': 2}]}
        result = generate_timetable_preview(self.payload, self.courses)
        self.assertEqual(len(result['creneaux']), 2)
        self.assertEqual({slot['cours_id'] for slot in result['creneaux']}, {1, 2})
        self.assertFalse(result['fallback_used'])

    @patch('planning.services.timetable_generator.generate_json')
    def test_empty_gemini_response_uses_fallback(self, mock_generate):
        mock_generate.return_value = {'affectations': []}
        result = generate_timetable_preview(self.payload, self.courses)
        self.assertTrue(result['fallback_used'])
        self.assertEqual(len(result['creneaux']), 2)

    @patch('planning.services.timetable_generator.generate_json')
    def test_untrusted_course_is_ignored(self, mock_generate):
        mock_generate.return_value = {'affectations': [{'slot_id': 1, 'cours_id': 999}]}
        result = generate_timetable_preview(self.payload, self.courses)
        self.assertEqual(result['ignored_proposals_count'], 1)
        self.assertTrue(result['fallback_used'])

    @patch('planning.services.timetable_generator.generate_json')
    def test_duplicate_slot_is_ignored_then_completed(self, mock_generate):
        mock_generate.return_value = {'affectations': [{'slot_id': 1, 'cours_id': 1}, {'slot_id': 1, 'cours_id': 2}]}
        result = generate_timetable_preview(self.payload, self.courses)
        self.assertEqual(len(result['creneaux']), 2)
        self.assertEqual(result['ignored_proposals_count'], 1)
        self.assertTrue(result['fallback_used'])

    @patch('planning.services.timetable_generator.generate_json')
    def test_locked_case_is_never_proposed(self, mock_generate):
        payload = dict(self.payload, creneaux_verrouilles=[{'jour': 'LUNDI', 'heure_debut': '08:00', 'heure_fin': '10:00'}])
        mock_generate.return_value = {'affectations': [{'slot_id': 1, 'cours_id': 1}]}
        result = generate_timetable_preview(payload, self.courses)
        self.assertEqual(len(result['creneaux']), 1)
        self.assertEqual(result['creneaux'][0]['heure_debut'], '10:00')

    def test_no_available_case_returns_empty_preview_without_gemini(self):
        payload = dict(self.payload, horaires=[])
        with patch('planning.services.timetable_generator.generate_json') as generate:
            result = generate_timetable_preview(payload, self.courses)
        self.assertEqual(result['creneaux'], [])
        generate.assert_not_called()


class WeeklyTimetableApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='timetable-admin', password='pass', role=UserRole.ADMIN)
        self.teacher = User.objects.create_user(username='timetable-teacher', password='pass', role=UserRole.ENSEIGNANT)
        self.other_teacher = User.objects.create_user(username='other-timetable-teacher', password='pass', role=UserRole.ENSEIGNANT)
        self.course = Cours.objects.create(titre='Cours EDT', contenu='Contenu', enseignant=self.teacher, is_published=True)
        self.other_course = Cours.objects.create(titre='Autre cours EDT', contenu='Contenu', enseignant=self.other_teacher, is_published=True)
        self.timetable = EmploiDuTempsSemaine.objects.create(
            titre='Semaine publiée', semaine_debut=date(2026, 11, 23), semaine_fin=date(2026, 11, 29),
            statut=EmploiDuTempsSemaine.Statut.PUBLIE, created_by=self.admin,
        )
        self.slot = CreneauEmploiDuTemps.objects.create(
            emploi_du_temps=self.timetable, cours=self.course, enseignant=self.teacher,
            jour='LUNDI', heure_debut=time(8, 0), heure_fin=time(10, 0), ordre=1,
        )

    def test_published_timetable_list_is_serialized_for_admin_and_teacher(self):
        self.client.force_authenticate(self.admin)
        admin_response = self.client.get('/api/emplois-du-temps/')
        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)
        self.assertEqual(admin_response.data[0]['creneaux'][0]['id'], self.slot.id)
        self.client.force_authenticate(self.teacher)
        teacher_response = self.client.get('/api/emplois-du-temps/')
        self.assertEqual(teacher_response.status_code, status.HTTP_200_OK)
        self.assertEqual(teacher_response.data[0]['creneaux'][0]['enseignant'], self.teacher.id)

    def test_adding_slot_to_published_timetable_returns_it_to_draft(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/creneaux-planning/', {
            'emploi_du_temps': self.timetable.id, 'cours': self.course.id, 'jour': 'MARDI',
            'heure_debut': '08:00', 'heure_fin': '10:00', 'ordre': 2, 'is_locked': False,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.timetable.refresh_from_db()
        self.assertEqual(self.timetable.statut, EmploiDuTempsSemaine.Statut.BROUILLON)

    def test_changing_course_updates_teacher_from_course(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(f'/api/creneaux-planning/{self.slot.id}/', {'cours': self.other_course.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.cours, self.other_course)
        self.assertEqual(self.slot.enseignant, self.other_teacher)

    def test_teacher_sees_only_slots_for_courses_owned_by_them(self):
        CreneauEmploiDuTemps.objects.create(emploi_du_temps=self.timetable, cours=self.other_course, enseignant=self.other_teacher, jour='MARDI', heure_debut=time(8, 0), heure_fin=time(10, 0), ordre=2)
        self.client.force_authenticate(self.teacher)
        response = self.client.get('/api/emplois-du-temps/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([slot['cours'] for slot in response.data[0]['creneaux']], [self.course.id])

    def test_teacher_can_complain_about_own_slot_but_not_another(self):
        foreign = CreneauEmploiDuTemps.objects.create(emploi_du_temps=self.timetable, cours=self.other_course, enseignant=self.other_teacher, jour='MARDI', heure_debut=time(8, 0), heure_fin=time(10, 0), ordre=2)
        self.client.force_authenticate(self.teacher)
        own = self.client.post('/api/reclamations-planning/', {'emploi_du_temps': self.timetable.id, 'creneau': self.slot.id, 'motif': 'Horaire impossible', 'message': 'Conflit'}, format='json')
        self.assertEqual(own.status_code, status.HTTP_201_CREATED)
        foreign_response = self.client.post('/api/reclamations-planning/', {'emploi_du_temps': self.timetable.id, 'creneau': foreign.id, 'motif': 'Horaire impossible', 'message': 'Conflit'}, format='json')
        self.assertEqual(foreign_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_general_complaint_and_admin_reply(self):
        self.client.force_authenticate(self.teacher)
        created = self.client.post('/api/reclamations-planning/', {'emploi_du_temps': self.timetable.id, 'motif': 'Autre', 'message': 'Problème général'}, format='json')
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(self.admin)
        updated = self.client.patch(f'/api/reclamations-planning/{created.data["id"]}/', {'statut': 'ACCEPTEE', 'reponse_admin': 'Pris en compte.'}, format='json')
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data['reponse_admin'], 'Pris en compte.')
