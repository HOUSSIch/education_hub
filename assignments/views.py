from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView

from accounts.models import UserRole
from courses.models import Cours

from .models import Devoir, Soumission
from .permissions import DevoirAccessPermission, SoumissionAccessPermission
from .serializers import (
    CorrectionSerializer,
    DevoirSerializer,
    DevoirStudentSerializer,
    SoumissionSerializer,
)
from .services.feedback_generator import (
    FeedbackError,
    build_fallback_feedback,
    format_feedback,
    generer_feedback,
)
from .services.assignment_generator import AssignmentGenerationError, generate_assignment
from .services.submission_analyzer import CriteriaValidationError, analyze_submission


class DevoirViewSet(viewsets.ModelViewSet):
    serializer_class = DevoirSerializer
    permission_classes = (DevoirAccessPermission,)

    def get_serializer_class(self):
        """Use the safe public shape for students on both list and detail."""
        user = self.request.user
        if user.is_authenticated and user.role == UserRole.ETUDIANT:
            return DevoirStudentSerializer
        return DevoirSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Devoir.objects.select_related('cours', 'enseignant')
        if user.is_superuser or user.role == UserRole.ADMIN:
            return qs
        if user.role == UserRole.ENSEIGNANT:
            return qs.filter(enseignant=user)
        return qs.filter(is_published=True, cours__is_published=True)

    def perform_create(self, serializer):
        cours = serializer.validated_data['cours']
        user = self.request.user
        if not (user.is_superuser or user.role == UserRole.ADMIN) and cours.enseignant_id != user.id:
            raise PermissionDenied('Vous ne pouvez creer un devoir que pour votre propre cours.')
        serializer.save(enseignant=user)


class GenerateAssignmentView(APIView):
    def post(self, request, cours_id):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentification requise.'}, status=status.HTTP_401_UNAUTHORIZED)
        if request.user.role != UserRole.ENSEIGNANT:
            return Response({'detail': 'Seul un enseignant peut générer un devoir.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            cours = Cours.objects.get(pk=cours_id, enseignant=request.user)
        except Cours.DoesNotExist:
            return Response({'detail': 'Cours introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        raw_deadline = request.data.get('date_limite')
        if raw_deadline is None:
            date_limite = timezone.now() + timedelta(days=7)
        else:
            date_limite = parse_datetime(raw_deadline) if isinstance(raw_deadline, str) else None
            if date_limite is None:
                return Response({'date_limite': 'La date limite est invalide.'}, status=status.HTTP_400_BAD_REQUEST)
            if timezone.is_naive(date_limite):
                date_limite = timezone.make_aware(date_limite)

        try:
            generated = generate_assignment(cours.titre, cours.contenu)
        except AssignmentGenerationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        devoir = Devoir.objects.create(
            cours=cours, enseignant=request.user, titre=generated['titre'],
            description=generated['description'], consigne=generated['consigne'],
            correction_reference=generated['correction_reference'],
            criteres_correction=generated['criteres_correction'], date_limite=date_limite,
            is_generated_by_ai=True, is_published=False,
        )
        return Response(DevoirSerializer(devoir, context={'request': request}).data, status=status.HTTP_201_CREATED)


class SoumissionViewSet(viewsets.ModelViewSet):
    permission_classes = (SoumissionAccessPermission,)

    def get_queryset(self):
        user = self.request.user
        qs = Soumission.objects.select_related('devoir', 'devoir__cours', 'etudiant', 'devoir__enseignant')
        if user.is_superuser or user.role == UserRole.ADMIN:
            return qs
        if user.role == UserRole.ENSEIGNANT:
            return qs.filter(devoir__enseignant=user)
        return qs.filter(etudiant=user)

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update') and self.request.user.role in (UserRole.ADMIN, UserRole.ENSEIGNANT):
            return CorrectionSerializer
        return SoumissionSerializer

    def perform_create(self, serializer):
        devoir = serializer.validated_data['devoir']
        if not devoir.is_published or not devoir.cours.is_published:
            raise ValidationError({'devoir': 'Ce devoir ne peut pas recevoir de soumission.'})
        if timezone.now() > devoir.date_limite:
            raise ValidationError({'date_limite': 'La date limite est depassee.'})
        if Soumission.objects.filter(devoir=devoir, etudiant=self.request.user).exists():
            raise ValidationError({'devoir': 'Vous avez deja une soumission pour ce devoir.'})
        serializer.save(etudiant=self.request.user)

    @action(detail=True, methods=('post',), url_path='generer-feedback')
    def generer_feedback(self, request, pk=None):
        soumission = self.get_object()
        user = request.user
        if not (user.is_superuser or user.role == UserRole.ADMIN or (user.role == UserRole.ENSEIGNANT and soumission.devoir.enseignant_id == user.id)):
            return Response({'detail': 'Vous ne pouvez pas generer ce feedback.'}, status=status.HTTP_403_FORBIDDEN)
        if not soumission.reponse_texte or not soumission.reponse_texte.strip():
            return Response({'detail': 'La soumission ne contient aucune reponse texte exploitable.'}, status=status.HTTP_400_BAD_REQUEST)
        if not soumission.devoir.correction_reference.strip():
            return Response(
                {'detail': 'La correction de reference doit etre renseignee avant de generer un feedback.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            analysis = analyze_submission(
                soumission.reponse_texte,
                soumission.devoir.criteres_correction,
            )
        except CriteriaValidationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            generated_feedback = generer_feedback(
                soumission.devoir.titre,
                soumission.devoir.consigne,
                soumission.reponse_texte,
                soumission.devoir.correction_reference,
                analysis,
            )
            feedback = format_feedback(analysis['evaluation'], generated_feedback)
        except FeedbackError:
            feedback = build_fallback_feedback(analysis)
        soumission.feedback = feedback
        soumission.save(update_fields=('feedback', 'date_modification'))
        return Response({'soumission_id': soumission.id, 'feedback': feedback})
