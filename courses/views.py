from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from accounts.models import UserRole
from accounts.permissions import IsAdmin

from .models import Cours, Resume
from .permissions import CourseAccessPermission
from .serializers import CoursSerializer, ResumeSerializer
from .services.summarizer import SummarizationError, generer_resume
from quizzes.models import Question, Quiz, Reponse
from quizzes.serializers import QuizSerializer
from quizzes.services.quiz_generator import QuizGenerationError, generate_quiz


class CoursViewSet(viewsets.ModelViewSet):
    serializer_class = CoursSerializer
    permission_classes = (CourseAccessPermission,)

    def get_queryset(self):
        user = self.request.user
        queryset = Cours.objects.select_related('enseignant')
        if user.is_superuser or user.role == UserRole.ADMIN:
            return queryset
        if user.role == UserRole.ENSEIGNANT:
            return queryset.filter(enseignant=user)
        return queryset.filter(is_published=True)

    def perform_create(self, serializer):
        serializer.save(enseignant=self.request.user)

    @action(detail=True, methods=('post',), url_path='generer-quiz')
    def generer_quiz(self, request, pk=None):
        if request.user.role != UserRole.ENSEIGNANT:
            return Response(
                {'detail': 'Seul un enseignant peut générer un quiz.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        cours = self.get_object()
        question_count = request.data.get('question_count', 5)
        try:
            generated_quiz = generate_quiz(cours.titre, cours.contenu, question_count)
        except QuizGenerationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        with transaction.atomic():
            quiz = Quiz.objects.create(
                cours=cours,
                enseignant=request.user,
                titre=generated_quiz['titre'],
                description=generated_quiz['description'],
                date_limite=timezone.now() + timedelta(days=7),
                is_published=False,
            )
            for order, generated_question in enumerate(generated_quiz['questions'], start=1):
                question = Question.objects.create(
                    quiz=quiz,
                    texte=generated_question['texte'],
                    ordre=order,
                    points=1,
                )
                for generated_answer in generated_question['reponses']:
                    Reponse.objects.create(
                        question=question,
                        texte=generated_answer['texte'],
                        est_correcte=generated_answer['est_correcte'],
                    )

        return Response(
            QuizSerializer(quiz, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=('post',), url_path='generer-resume')
    def generer_resume(self, request, pk=None):
        cours = self.get_object()
        if not cours.contenu or not cours.contenu.strip():
            return Response(
                {'detail': 'Le cours ne contient aucun texte exploitable pour generer un resume.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            contenu = generer_resume(cours.contenu)
        except SummarizationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        resume, _ = Resume.objects.update_or_create(cours=cours, defaults={'contenu': contenu})
        return Response({'cours_id': cours.id, 'resume': ResumeSerializer(resume).data})

    @action(detail=True, methods=('post',), url_path='generer-resume-preview')
    def generer_resume_preview(self, request, pk=None):
        """Return an AI proposal without changing the official resume."""
        if not (request.user.is_superuser or request.user.role in (UserRole.ADMIN, UserRole.ENSEIGNANT)):
            return Response({'detail': 'Seul un enseignant ou un administrateur peut générer un résumé.'}, status=status.HTTP_403_FORBIDDEN)
        cours = self.get_object()
        if not cours.contenu or not cours.contenu.strip():
            return Response({'detail': 'Le cours ne contient aucun texte exploitable pour generer un resume.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            contenu = generer_resume(cours.contenu)
        except SummarizationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'cours_id': cours.id, 'contenu': contenu})

    @action(detail=True, methods=('get', 'post', 'put', 'patch'), url_path='resume')
    def resume(self, request, pk=None):
        cours = self.get_object()
        if request.method == 'GET':
            try:
                return Response(ResumeSerializer(cours.resume).data)
            except Resume.DoesNotExist:
                return Response({'detail': 'Aucun resume pour ce cours.'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'POST':
            if hasattr(cours, 'resume'):
                raise ValidationError({'detail': 'Un seul resume est autorise par cours.'})
            serializer = ResumeSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(cours=cours)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        try:
            resume = cours.resume
        except Resume.DoesNotExist:
            return Response({'detail': 'Aucun resume pour ce cours.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ResumeSerializer(resume, data=request.data, partial=request.method == 'PATCH')
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ResumeListView(generics.ListAPIView):
    queryset = Resume.objects.select_related('cours').all()
    serializer_class = ResumeSerializer
    permission_classes = (IsAdmin,)
