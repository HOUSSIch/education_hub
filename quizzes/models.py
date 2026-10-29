from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from courses.models import Cours

class Quiz(models.Model):
    titre=models.CharField(max_length=255); description=models.TextField(blank=True)
    cours=models.ForeignKey(Cours,on_delete=models.CASCADE,related_name='quizzes')
    enseignant=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='quizzes')
    date_creation=models.DateTimeField(auto_now_add=True); date_modification=models.DateTimeField(auto_now=True)
    date_limite=models.DateTimeField(); is_published=models.BooleanField(default=False)

class Question(models.Model):
    quiz=models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name='questions')
    texte=models.TextField(); ordre=models.PositiveIntegerField(); points=models.DecimalField(max_digits=5,decimal_places=2,validators=[MinValueValidator(0.01)])
    class Meta: ordering=('ordre',); constraints=[models.UniqueConstraint(fields=('quiz','ordre'),name='unique_question_order')]

class Reponse(models.Model):
    question=models.ForeignKey(Question,on_delete=models.CASCADE,related_name='reponses')
    texte=models.TextField(); est_correcte=models.BooleanField(default=False)

class Resultat(models.Model):
    quiz=models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name='resultats')
    etudiant=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='resultats_quiz')
    score=models.DecimalField(max_digits=7,decimal_places=2); score_max=models.DecimalField(max_digits=7,decimal_places=2); pourcentage=models.DecimalField(max_digits=6,decimal_places=2); date_passage=models.DateTimeField(auto_now_add=True)
    class Meta: constraints=[models.UniqueConstraint(fields=('quiz','etudiant'),name='unique_resultat_quiz_etudiant')]

# Create your models here.
