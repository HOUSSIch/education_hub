from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from django.test import SimpleTestCase
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User,UserRole
from courses.models import Cours
from .models import Quiz,Question,Reponse,Resultat

class QuizPermissionTests(APITestCase):
 def setUp(self):
  self.a=User.objects.create_user(username='a',password='x',role=UserRole.ENSEIGNANT); self.b=User.objects.create_user(username='b',password='x',role=UserRole.ENSEIGNANT); self.s=User.objects.create_user(username='s',password='x',role=UserRole.ETUDIANT)
  self.c=Cours.objects.create(titre='c',contenu='x',enseignant=self.a,is_published=True); self.q=Quiz.objects.create(titre='q',cours=self.c,enseignant=self.a,date_limite=timezone.now(),is_published=True); self.question=Question.objects.create(quiz=self.q,texte='?',ordre=1,points=1); self.r=Reponse.objects.create(question=self.question,texte='x',est_correcte=True)
 def test_owner_and_other_teacher(self):
  self.client.force_authenticate(self.a); self.assertEqual(self.client.patch(f'/api/quizzes/{self.q.id}/',{'titre':'ok'},format='json').status_code,200)
  self.client.force_authenticate(self.b); self.assertEqual(self.client.patch(f'/api/quizzes/{self.q.id}/',{'titre':'bad'},format='json').status_code,404)
 def test_student_sees_no_correct_answer(self):
  self.client.force_authenticate(self.s); r=self.client.get(f'/api/reponses/{self.r.id}/'); self.assertEqual(r.status_code,200); self.assertNotIn('est_correcte',r.data)
 def test_teacher_creation_forces_owner_and_own_course(self):
  self.client.force_authenticate(self.a); data={'titre':'new','cours':self.c.id,'date_limite':timezone.now().isoformat(),'enseignant':self.b.id}
  r=self.client.post('/api/quizzes/',data,format='json'); self.assertEqual(r.status_code,201); self.assertEqual(Quiz.objects.get(pk=r.data['id']).enseignant,self.a)
  other=Cours.objects.create(titre='other',contenu='x',enseignant=self.b)
  self.assertEqual(self.client.post('/api/quizzes/',dict(data,cours=other.id),format='json').status_code,403)
 def test_other_teacher_cannot_delete(self):
  self.client.force_authenticate(self.b); self.assertEqual(self.client.delete(f'/api/quizzes/{self.q.id}/').status_code,404); self.assertTrue(Quiz.objects.filter(pk=self.q.id).exists())
 def test_student_cannot_mutate_quiz(self):
  self.client.force_authenticate(self.s); data={'titre':'bad','cours':self.c.id,'date_limite':timezone.now().isoformat()}
  self.assertEqual(self.client.post('/api/quizzes/',data,format='json').status_code,403)
  self.assertEqual(self.client.patch(f'/api/quizzes/{self.q.id}/',{'titre':'bad'},format='json').status_code,403)
  self.assertEqual(self.client.delete(f'/api/quizzes/{self.q.id}/').status_code,403)
 def test_student_only_sees_published_on_published_course(self):
  hidden=Quiz.objects.create(titre='hidden',cours=self.c,enseignant=self.a,date_limite=timezone.now(),is_published=False)
  private=Cours.objects.create(titre='private',contenu='x',enseignant=self.a,is_published=False)
  Quiz.objects.create(titre='privateq',cours=private,enseignant=self.a,date_limite=timezone.now(),is_published=True)
  self.client.force_authenticate(self.s); r=self.client.get('/api/quizzes/'); self.assertEqual({x['id'] for x in r.data},{self.q.id})
 def test_question_owner_other_teacher_and_student_permissions(self):
  self.client.force_authenticate(self.a); r=self.client.post('/api/questions/',{'quiz':self.q.id,'texte':'new','ordre':2,'points':1},format='json'); self.assertEqual(r.status_code,201)
  self.client.force_authenticate(self.b); self.assertEqual(self.client.post('/api/questions/',{'quiz':self.q.id,'texte':'bad','ordre':3,'points':1},format='json').status_code,403); self.assertEqual(self.client.patch(f'/api/questions/{self.question.id}/',{'texte':'bad'},format='json').status_code,404); self.assertEqual(self.client.delete(f'/api/questions/{self.question.id}/').status_code,404)
  self.client.force_authenticate(self.s); self.assertEqual(self.client.post('/api/questions/',{'quiz':self.q.id,'texte':'bad','ordre':3,'points':1},format='json').status_code,403); self.assertEqual(self.client.patch(f'/api/questions/{self.question.id}/',{'texte':'bad'},format='json').status_code,403); self.assertEqual(self.client.get(f'/api/questions/{self.question.id}/').status_code,200)
 def test_question_points_positive(self):
  self.client.force_authenticate(self.a); self.assertEqual(self.client.post('/api/questions/',{'quiz':self.q.id,'texte':'bad','ordre':4,'points':0},format='json').status_code,400)
 def test_teacher_can_edit_question_answers_and_correct_choice(self):
  answers=[self.r]
  for index in range(3): answers.append(Reponse.objects.create(question=self.question,texte=f'choice {index}',est_correcte=False))
  self.client.force_authenticate(self.a)
  question_response=self.client.patch(f'/api/questions/{self.question.id}/',{'texte':'Question mise à jour','points':'2.50'},format='json')
  self.assertEqual(question_response.status_code,status.HTTP_200_OK)
  answer_response=self.client.patch(f'/api/reponses/{answers[0].id}/',{'texte':'Ancienne réponse','est_correcte':False},format='json')
  self.assertEqual(answer_response.status_code,status.HTTP_200_OK)
  correct_response=self.client.patch(f'/api/reponses/{answers[1].id}/',{'texte':'Nouvelle bonne réponse','est_correcte':True},format='json')
  self.assertEqual(correct_response.status_code,status.HTTP_200_OK)
  self.question.refresh_from_db()
  self.assertEqual((self.question.texte,float(self.question.points)),('Question mise à jour',2.5))
  self.assertEqual(self.question.reponses.filter(est_correcte=True).count(),1)
  self.assertEqual(self.question.reponses.get(est_correcte=True).texte,'Nouvelle bonne réponse')
  self.client.force_authenticate(self.s)
  student_answers=self.client.get('/api/reponses/').data
  self.assertTrue(student_answers)
  self.assertTrue(all('est_correcte' not in answer for answer in student_answers))
 def test_reponse_permissions_and_secret(self):
  self.client.force_authenticate(self.a); created=self.client.post('/api/reponses/',{'question':self.question.id,'texte':'yes','est_correcte':False},format='json'); self.assertEqual(created.status_code,201); self.assertIn('est_correcte',created.data)
  self.assertEqual(self.client.patch(f'/api/reponses/{self.r.id}/',{'texte':'edit'},format='json').status_code,200)
  self.client.force_authenticate(self.b); self.assertEqual(self.client.post('/api/reponses/',{'question':self.question.id,'texte':'bad'},format='json').status_code,403); self.assertEqual(self.client.patch(f'/api/reponses/{self.r.id}/',{'texte':'bad'},format='json').status_code,404); self.assertEqual(self.client.delete(f'/api/reponses/{self.r.id}/').status_code,404)
  self.client.force_authenticate(self.s); self.assertEqual(self.client.post('/api/reponses/',{'question':self.question.id,'texte':'bad'},format='json').status_code,403); self.assertEqual(self.client.patch(f'/api/reponses/{self.r.id}/',{'texte':'bad'},format='json').status_code,403); self.assertEqual(self.client.delete(f'/api/reponses/{self.r.id}/').status_code,403); self.assertNotIn('est_correcte',self.client.get('/api/reponses/').data[0]); self.assertNotIn('est_correcte',self.client.get(f'/api/reponses/{self.r.id}/').data)
 def test_resultat_visibility_and_read_only(self):
  mine=Resultat.objects.create(quiz=self.q,etudiant=self.s,score=1,score_max=1,pourcentage=100)
  other=User.objects.create_user(username='other',password='x',role=UserRole.ETUDIANT); theirs=Resultat.objects.create(quiz=self.q,etudiant=other,score=0,score_max=1,pourcentage=0)
  self.client.force_authenticate(self.s); self.assertEqual({x['id'] for x in self.client.get('/api/resultats/').data},{mine.id}); self.assertEqual(self.client.get(f'/api/resultats/{theirs.id}/').status_code,404)
  for method in ('post','put','patch','delete'): self.assertIn(getattr(self.client,method)('/api/resultats/' if method=='post' else f'/api/resultats/{mine.id}/',{'score':100} if method!='delete' else None,format='json').status_code,(403,405))
  self.client.force_authenticate(self.a); self.assertEqual({x['id'] for x in self.client.get('/api/resultats/').data},{mine.id,theirs.id})
 def test_quiz_creation_publication_flag(self):
  self.client.force_authenticate(self.a); base={'titre':'draft','cours':self.c.id,'date_limite':timezone.now().isoformat()}
  self.assertEqual(self.client.post('/api/quizzes/',dict(base,is_published=False),format='json').status_code,201)
  r=self.client.post('/api/quizzes/',dict(base,titre='bad',is_published=True),format='json'); self.assertEqual(r.status_code,400); self.assertFalse(Quiz.objects.filter(titre='bad',is_published=True).exists())
 def test_publication_refused_with_one_answer(self):
  draft=Quiz.objects.create(titre='draft',cours=self.c,enseignant=self.a,date_limite=timezone.now(),is_published=False); q=Question.objects.create(quiz=draft,texte='q',ordre=1,points=1); Reponse.objects.create(question=q,texte='one',est_correcte=True)
  self.client.force_authenticate(self.a); r=self.client.patch(f'/api/quizzes/{draft.id}/',{'is_published':True},format='json'); self.assertEqual(r.status_code,400); draft.refresh_from_db(); self.assertFalse(draft.is_published); self.assertIn('deux réponses',str(r.data))
 def test_publication_refused_without_correct_answer(self):
  draft=Quiz.objects.create(titre='draft2',cours=self.c,enseignant=self.a,date_limite=timezone.now(),is_published=False); q=Question.objects.create(quiz=draft,texte='q',ordre=1,points=1); Reponse.objects.create(question=q,texte='a',est_correcte=False); Reponse.objects.create(question=q,texte='b',est_correcte=False)
  self.client.force_authenticate(self.a); r=self.client.patch(f'/api/quizzes/{draft.id}/',{'is_published':True},format='json'); self.assertEqual(r.status_code,400); draft.refresh_from_db(); self.assertFalse(draft.is_published); self.assertIn('exactement une réponse correcte',str(r.data))
 def test_publication_refused_with_multiple_correct_answers(self):
  draft=Quiz.objects.create(titre='draft3',cours=self.c,enseignant=self.a,date_limite=timezone.now(),is_published=False); q=Question.objects.create(quiz=draft,texte='q',ordre=1,points=1); Reponse.objects.create(question=q,texte='a',est_correcte=True); Reponse.objects.create(question=q,texte='b',est_correcte=True)
  self.client.force_authenticate(self.a); r=self.client.patch(f'/api/quizzes/{draft.id}/',{'is_published':True},format='json'); self.assertEqual(r.status_code,400); draft.refresh_from_db(); self.assertFalse(draft.is_published); self.assertIn('exactement une réponse correcte',str(r.data))
 def test_valid_quiz_can_be_published(self):
  draft=Quiz.objects.create(titre='valid',cours=self.c,enseignant=self.a,date_limite=timezone.now(),is_published=False); q=Question.objects.create(quiz=draft,texte='q',ordre=1,points=1); Reponse.objects.create(question=q,texte='a',est_correcte=True); Reponse.objects.create(question=q,texte='b',est_correcte=False)
  self.client.force_authenticate(self.a); r=self.client.patch(f'/api/quizzes/{draft.id}/',{'is_published':True},format='json'); self.assertEqual(r.status_code,200); draft.refresh_from_db(); self.assertTrue(draft.is_published)
 def test_student_submission_calculates_server_score(self):
  quiz=Quiz.objects.create(titre='score',cours=self.c,enseignant=self.a,date_limite=timezone.now().replace(year=timezone.now().year+1),is_published=True); q1=Question.objects.create(quiz=quiz,texte='q1',ordre=1,points=2); a=Reponse.objects.create(question=q1,texte='a',est_correcte=True); Reponse.objects.create(question=q1,texte='b',est_correcte=False); q2=Question.objects.create(quiz=quiz,texte='q2',ordre=2,points=3); c=Reponse.objects.create(question=q2,texte='c',est_correcte=False); Reponse.objects.create(question=q2,texte='d',est_correcte=True)
  self.client.force_authenticate(self.s); r=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':q1.id,'reponse_id':a.id},{'question_id':q2.id,'reponse_id':c.id}],'score':100,'score_max':100,'pourcentage':100},format='json'); self.assertEqual(r.status_code,201); result=Resultat.objects.get(quiz=quiz,etudiant=self.s); self.assertEqual((float(result.score),float(result.score_max),float(result.pourcentage)),(2,5,40))
 def test_unanswered_question_scores_zero(self):
  quiz=Quiz.objects.create(titre='partial',cours=self.c,enseignant=self.a,date_limite=timezone.now().replace(year=timezone.now().year+1),is_published=True); q1=Question.objects.create(quiz=quiz,texte='q1',ordre=1,points=2); good=Reponse.objects.create(question=q1,texte='a',est_correcte=True); Reponse.objects.create(question=q1,texte='b',est_correcte=False); q2=Question.objects.create(quiz=quiz,texte='q2',ordre=2,points=3); Reponse.objects.create(question=q2,texte='c',est_correcte=True); Reponse.objects.create(question=q2,texte='d',est_correcte=False)
  self.client.force_authenticate(self.s); r=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':q1.id,'reponse_id':good.id}]},format='json'); self.assertEqual(r.status_code,201); x=Resultat.objects.get(quiz=quiz,etudiant=self.s); self.assertEqual((float(x.score),float(x.score_max),float(x.pourcentage)),(2,5,40))
 def test_question_from_other_quiz_is_refused(self):
  qa=Quiz.objects.create(titre='a',cours=self.c,enseignant=self.a,date_limite=timezone.now().replace(year=timezone.now().year+1),is_published=True); qb=Quiz.objects.create(titre='b',cours=self.c,enseignant=self.a,date_limite=timezone.now().replace(year=timezone.now().year+1),is_published=True); q1=Question.objects.create(quiz=qa,texte='a',ordre=1,points=1); Reponse.objects.create(question=q1,texte='a',est_correcte=True); Reponse.objects.create(question=q1,texte='b',est_correcte=False); q2=Question.objects.create(quiz=qb,texte='b',ordre=1,points=1); x=Reponse.objects.create(question=q2,texte='a',est_correcte=True); Reponse.objects.create(question=q2,texte='b',est_correcte=False)
  self.client.force_authenticate(self.s); r=self.client.post(f'/api/quizzes/{qa.id}/soumettre/',{'reponses':[{'question_id':q2.id,'reponse_id':x.id}]},format='json'); self.assertEqual(r.status_code,400); self.assertFalse(Resultat.objects.filter(quiz=qa,etudiant=self.s).exists())
 def test_answer_from_another_question_is_refused(self):
  quiz=Quiz.objects.create(titre='mauvaise association',cours=self.c,enseignant=self.a,date_limite=timezone.now().replace(year=timezone.now().year+1),is_published=True)
  q1=Question.objects.create(quiz=quiz,texte='q1',ordre=1,points=1); Reponse.objects.create(question=q1,texte='q1 correcte',est_correcte=True); Reponse.objects.create(question=q1,texte='q1 incorrecte',est_correcte=False)
  q2=Question.objects.create(quiz=quiz,texte='q2',ordre=2,points=1); foreign_answer=Reponse.objects.create(question=q2,texte='q2 correcte',est_correcte=True); Reponse.objects.create(question=q2,texte='q2 incorrecte',est_correcte=False)
  self.client.force_authenticate(self.s)
  response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':q1.id,'reponse_id':foreign_answer.id}]},format='json')
  self.assertEqual(response.status_code,status.HTTP_400_BAD_REQUEST)
  self.assertIn('La réponse n’appartient pas à la question.',str(response.data))
  self.assertFalse(Resultat.objects.filter(quiz=quiz,etudiant=self.s).exists())
 def test_duplicate_question_in_submission_is_refused(self):
  quiz=Quiz.objects.create(titre='question dupliquee',cours=self.c,enseignant=self.a,date_limite=timezone.now().replace(year=timezone.now().year+1),is_published=True)
  question=Question.objects.create(quiz=quiz,texte='q',ordre=1,points=1)
  first_answer=Reponse.objects.create(question=question,texte='correcte',est_correcte=True)
  second_answer=Reponse.objects.create(question=question,texte='incorrecte',est_correcte=False)
  self.client.force_authenticate(self.s)
  response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':question.id,'reponse_id':first_answer.id},{'question_id':question.id,'reponse_id':second_answer.id}]},format='json')
  self.assertEqual(response.status_code,status.HTTP_400_BAD_REQUEST)
  self.assertIn('Une question ne peut être soumise qu’une seule fois.',str(response.data))
  self.assertFalse(Resultat.objects.filter(quiz=quiz,etudiant=self.s).exists())
 def test_student_cannot_submit_same_quiz_twice(self):
  quiz=Quiz.objects.create(titre='une seule tentative',cours=self.c,enseignant=self.a,date_limite=timezone.now().replace(year=timezone.now().year+1),is_published=True)
  question=Question.objects.create(quiz=quiz,texte='q',ordre=1,points=2)
  correct_answer=Reponse.objects.create(question=question,texte='correcte',est_correcte=True)
  Reponse.objects.create(question=question,texte='incorrecte',est_correcte=False)
  self.client.force_authenticate(self.s)
  first_response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':question.id,'reponse_id':correct_answer.id}]},format='json')
  self.assertEqual(first_response.status_code,status.HTTP_201_CREATED)
  first_result=Resultat.objects.get(quiz=quiz,etudiant=self.s)
  self.assertEqual(Resultat.objects.filter(quiz=quiz,etudiant=self.s).count(),1)
  second_response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':question.id,'reponse_id':correct_answer.id}]},format='json')
  self.assertEqual(second_response.status_code,status.HTTP_400_BAD_REQUEST)
  self.assertIn('Quiz deja passe.',str(second_response.data))
  self.assertEqual(Resultat.objects.filter(quiz=quiz,etudiant=self.s).count(),1)
  self.assertEqual(Resultat.objects.get(quiz=quiz,etudiant=self.s).pk,first_result.pk)
 def test_expired_quiz_cannot_be_submitted(self):
  quiz=Quiz.objects.create(titre='quiz expire',cours=self.c,enseignant=self.a,date_limite=timezone.now()-timedelta(minutes=1),is_published=True)
  question=Question.objects.create(quiz=quiz,texte='q',ordre=1,points=1)
  correct_answer=Reponse.objects.create(question=question,texte='correcte',est_correcte=True)
  Reponse.objects.create(question=question,texte='incorrecte',est_correcte=False)
  self.client.force_authenticate(self.s)
  response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':question.id,'reponse_id':correct_answer.id}]},format='json')
  self.assertEqual(response.status_code,status.HTTP_400_BAD_REQUEST)
  self.assertIn('Date limite depassee.',str(response.data))
  self.assertFalse(Resultat.objects.filter(quiz=quiz,etudiant=self.s).exists())
 def test_unpublished_quiz_cannot_be_submitted(self):
  quiz=Quiz.objects.create(titre='quiz brouillon',cours=self.c,enseignant=self.a,date_limite=timezone.now()+timedelta(days=1),is_published=False)
  question=Question.objects.create(quiz=quiz,texte='q',ordre=1,points=1)
  correct_answer=Reponse.objects.create(question=question,texte='correcte',est_correcte=True)
  Reponse.objects.create(question=question,texte='incorrecte',est_correcte=False)
  self.client.force_authenticate(self.s)
  response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':question.id,'reponse_id':correct_answer.id}]},format='json')
  self.assertEqual(response.status_code,status.HTTP_404_NOT_FOUND)
  self.assertFalse(Resultat.objects.filter(quiz=quiz,etudiant=self.s).exists())
 def test_quiz_on_unpublished_course_cannot_be_submitted(self):
  unpublished_course=Cours.objects.create(titre='cours brouillon',contenu='x',enseignant=self.a,is_published=False)
  quiz=Quiz.objects.create(titre='quiz publie',cours=unpublished_course,enseignant=self.a,date_limite=timezone.now()+timedelta(days=1),is_published=True)
  question=Question.objects.create(quiz=quiz,texte='q',ordre=1,points=1)
  correct_answer=Reponse.objects.create(question=question,texte='correcte',est_correcte=True)
  Reponse.objects.create(question=question,texte='incorrecte',est_correcte=False)
  self.client.force_authenticate(self.s)
  response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':question.id,'reponse_id':correct_answer.id}]},format='json')
  self.assertEqual(response.status_code,status.HTTP_404_NOT_FOUND)
  self.assertFalse(Resultat.objects.filter(quiz=quiz,etudiant=self.s).exists())
 def test_incoherent_published_quiz_cannot_create_result(self):
  quiz=Quiz.objects.create(titre='publication incoherente',cours=self.c,enseignant=self.a,date_limite=timezone.now()+timedelta(days=1),is_published=True)
  question=Question.objects.create(quiz=quiz,texte='q',ordre=1,points=1)
  answer=Reponse.objects.create(question=question,texte='seule reponse',est_correcte=True)
  self.client.force_authenticate(self.s)
  response=self.client.post(f'/api/quizzes/{quiz.id}/soumettre/',{'reponses':[{'question_id':question.id,'reponse_id':answer.id}]},format='json')
  self.assertEqual(response.status_code,status.HTTP_400_BAD_REQUEST)
  self.assertIn('Chaque question doit contenir au moins deux réponses.',str(response.data))
  self.assertFalse(Resultat.objects.filter(quiz=quiz,etudiant=self.s).exists())

# Create your tests here.


class QuizGeneratorServiceTests(SimpleTestCase):
 def valid_output(self, **overrides):
  question = {
   'texte': 'Quelle est la capitale de la France ?',
   'reponses': ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
   'bonne_reponse_index': 0,
  }
  question.update(overrides)
  return '{"questions":[' + __import__('json').dumps(question) + ']}'

 def generate(self, output, question_count=1):
  values = output if isinstance(output, list) else [output]
  with patch('quizzes.services.quiz_generator._resources_for_cpu', return_value=(object(), object())), patch('quizzes.services.quiz_generator._generate_raw', side_effect=values):
   from quizzes.services.quiz_generator import generate_quiz
   return generate_quiz('France', 'Paris est la capitale de la France.', question_count)

 def test_valid_ai_output_is_accepted_and_points_are_forced(self):
  result = self.generate('```json\n' + self.valid_output() + '\n```')
  self.assertEqual(result['questions'][0]['points'], 1)
  self.assertTrue(result['questions'][0]['reponses'][0]['est_correcte'])

 def test_correct_index_outside_bounds_is_rejected(self):
  from quizzes.services.quiz_generator import QuizGenerationError
  with self.assertRaises(QuizGenerationError): self.generate(self.valid_output(bonne_reponse_index=4))

 def test_answer_count_other_than_four_is_rejected(self):
  from quizzes.services.quiz_generator import QuizGenerationError
  with self.assertRaises(QuizGenerationError): self.generate(self.valid_output(reponses=['Paris', 'Lyon']))

 def test_invalid_json_is_rejected(self):
  from quizzes.services.quiz_generator import QuizGenerationError
  with self.assertRaises(QuizGenerationError): self.generate('pas du json')

 def test_empty_course_content_is_rejected_without_loading_model(self):
  from quizzes.services.quiz_generator import QuizGenerationError, generate_quiz
  with patch('quizzes.services.quiz_generator._resources_for_cpu') as loader:
   with self.assertRaises(QuizGenerationError): generate_quiz('Cours', '   ')
  loader.assert_not_called()

 def test_invalid_question_count_is_rejected_without_loading_model(self):
  from quizzes.services.quiz_generator import QuizGenerationError, generate_quiz
  for count in (0, 11):
   with patch('quizzes.services.quiz_generator._resources_for_cpu') as loader:
    with self.assertRaises(QuizGenerationError): generate_quiz('Cours', 'Contenu', count)
    loader.assert_not_called()

 def test_insufficient_questions_are_completed_once(self):
  second = self.valid_output(texte='Quelle ville est la capitale de la France ?')
  result = self.generate([self.valid_output(), second], question_count=2)
  self.assertEqual(len(result['questions']), 2)

 def test_generated_question_count_must_match_request_after_complement(self):
  from quizzes.services.quiz_generator import QuizGenerationError
  with self.assertRaises(QuizGenerationError): self.generate([self.valid_output(), self.valid_output()], question_count=2)

 def test_duplicate_answers_are_rejected(self):
  from quizzes.services.quiz_generator import QuizGenerationError
  with self.assertRaises(QuizGenerationError): self.generate(self.valid_output(reponses=['Paris', ' paris ', 'Lyon', 'Marseille']))
