from django.utils import timezone
from rest_framework import status,viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied,ValidationError
from rest_framework.response import Response
from accounts.models import UserRole
from .models import Quiz,Question,Reponse,Resultat
from .serializers import QuizSerializer,QuestionSerializer,ReponseSerializer,ResultatSerializer

def staff(user): return user.is_superuser or user.role in (UserRole.ADMIN,UserRole.ENSEIGNANT)
def validate_quiz_structure(quiz):
 questions=list(quiz.questions.all())
 if not questions: raise ValidationError({'is_published':'Le quiz doit contenir au moins une question.'})
 for q in questions:
  if q.points<=0: raise ValidationError({'is_published':'Chaque question doit avoir des points positifs.'})
  answers=q.reponses.all()
  if answers.count()<2: raise ValidationError({'is_published':'Chaque question doit contenir au moins deux réponses.'})
  if answers.filter(est_correcte=True).count()!=1: raise ValidationError({'is_published':'Chaque question doit contenir exactement une réponse correcte.'})
class QuizViewSet(viewsets.ModelViewSet):
 serializer_class=QuizSerializer
 def get_queryset(self):
  u=self.request.user; q=Quiz.objects.select_related('cours','enseignant')
  if u.is_superuser or u.role==UserRole.ADMIN:return q
  if u.role==UserRole.ENSEIGNANT:return q.filter(enseignant=u)
  return q.filter(is_published=True,cours__is_published=True)
 def perform_create(self,s):
  u=self.request.user; c=s.validated_data['cours']
  if not staff(u) or (u.role==UserRole.ENSEIGNANT and c.enseignant_id!=u.id):raise PermissionDenied()
  if s.validated_data.get('is_published') is True:
   raise ValidationError({'is_published':'Le quiz doit contenir au moins une question.'})
  s.save(enseignant=u)
 def perform_update(self,s):
  if not staff(self.request.user) or (self.request.user.role==UserRole.ENSEIGNANT and s.instance.enseignant_id!=self.request.user.id):raise PermissionDenied()
  if s.validated_data.get('is_published') is True: validate_quiz_structure(s.instance)
  s.save()
 def perform_destroy(self,i):
  if not staff(self.request.user) or (self.request.user.role==UserRole.ENSEIGNANT and i.enseignant_id!=self.request.user.id):raise PermissionDenied()
  i.delete()
 @action(detail=True,methods=('post',),url_path='soumettre')
 def soumettre(self,request,pk=None):
  quiz=self.get_object(); u=request.user
  if u.role!=UserRole.ETUDIANT:raise PermissionDenied()
  validate_quiz_structure(quiz)
  if timezone.now()>quiz.date_limite:raise ValidationError({'date_limite':'Date limite depassee.'})
  if Resultat.objects.filter(quiz=quiz,etudiant=u).exists():raise ValidationError({'detail':'Quiz deja passe.'})
  entries=request.data.get('reponses',[]); questions=list(quiz.questions.all())
  score=0; submitted_question_ids=set()
  for e in entries:
   question_id=e.get('question_id')
   if question_id in submitted_question_ids:raise ValidationError({'reponses':'Une question ne peut être soumise qu’une seule fois.'})
   submitted_question_ids.add(question_id)
   try:q=next(x for x in questions if x.id==e.get('question_id'))
   except StopIteration:raise ValidationError({'reponses':'La question n’appartient pas au quiz.'})
   try:r=Reponse.objects.get(pk=e.get('reponse_id'))
   except Reponse.DoesNotExist:raise ValidationError({'reponses':'Réponse invalide.'})
   if r.question_id!=q.id:raise ValidationError({'reponses':'La réponse n’appartient pas à la question.'})
   if r.est_correcte:score+=q.points
  maximum=sum(q.points for q in questions); pct=(score/maximum*100) if maximum else 0
  result=Resultat.objects.create(quiz=quiz,etudiant=u,score=score,score_max=maximum,pourcentage=pct)
  return Response(ResultatSerializer(result).data,status=status.HTTP_201_CREATED)
class QuestionViewSet(viewsets.ModelViewSet):
 serializer_class=QuestionSerializer; queryset=Question.objects.all()
 def get_queryset(self):
  u=self.request.user; q=Question.objects.select_related('quiz','quiz__cours')
  if u.is_superuser or u.role==UserRole.ADMIN:return q
  if u.role==UserRole.ENSEIGNANT:return q.filter(quiz__enseignant=u)
  return q.filter(quiz__is_published=True,quiz__cours__is_published=True)
 def perform_create(self,s):
  if not staff(self.request.user) or (self.request.user.role==UserRole.ENSEIGNANT and s.validated_data['quiz'].enseignant_id!=self.request.user.id):raise PermissionDenied()
  s.save()
 def perform_update(self,s):
  if not staff(self.request.user):raise PermissionDenied()
  s.save()
 def perform_destroy(self,i):
  if not staff(self.request.user):raise PermissionDenied()
  i.delete()
class ReponseViewSet(viewsets.ModelViewSet):
 serializer_class=ReponseSerializer; queryset=Reponse.objects.all()
 def get_queryset(self):
  u=self.request.user; q=Reponse.objects.select_related('question__quiz__cours')
  if u.is_superuser or u.role==UserRole.ADMIN:return q
  if u.role==UserRole.ENSEIGNANT:return q.filter(question__quiz__enseignant=u)
  return q.filter(question__quiz__is_published=True,question__quiz__cours__is_published=True)
 def perform_create(self,s):
  if not staff(self.request.user) or (self.request.user.role==UserRole.ENSEIGNANT and s.validated_data['question'].quiz.enseignant_id!=self.request.user.id):raise PermissionDenied()
  s.save()
 def perform_update(self,s):
  if not staff(self.request.user):raise PermissionDenied()
  s.save()
 def perform_destroy(self,i):
  if not staff(self.request.user):raise PermissionDenied()
  i.delete()
class ResultatViewSet(viewsets.ReadOnlyModelViewSet):
 serializer_class=ResultatSerializer
 def get_queryset(self):
  u=self.request.user; q=Resultat.objects.select_related('quiz','quiz__cours','etudiant')
  if u.is_superuser or u.role==UserRole.ADMIN:return q
  if u.role==UserRole.ENSEIGNANT:return q.filter(quiz__enseignant=u)
  return q.filter(etudiant=u)
