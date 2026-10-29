from datetime import date

from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserRole
from courses.models import Cours

from .models import CreneauEmploiDuTemps, EmploiDuTempsSemaine, PlanningEtude, ReclamationPlanning, SessionEtude
from .serializers import (CreneauEmploiDuTempsSerializer, EmploiDuTempsSemaineSerializer,
                          PlanningEtudeSerializer, ReclamationPlanningSerializer, SessionEtudeSerializer)
from .services.study_plan_generator import StudyPlanGenerationError, generate_study_plan
from .services.timetable_generator import TimetableGenerationError, generate_timetable_preview


def _is_admin(user):
    return user.is_superuser or user.role == UserRole.ADMIN


class PlanningEtudeViewSet(viewsets.ModelViewSet):
    serializer_class = PlanningEtudeSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = PlanningEtude.objects.select_related('etudiant').prefetch_related('sessions')
        if _is_admin(user):
            return queryset
        if user.role == UserRole.ETUDIANT:
            return queryset.filter(etudiant=user)
        return queryset.none()

    def _ensure_writable_role(self):
        if not (_is_admin(self.request.user) or self.request.user.role == UserRole.ETUDIANT):
            raise PermissionDenied('Seuls les étudiants et les administrateurs peuvent gérer les plannings.')

    def create(self, request, *args, **kwargs):
        self._ensure_writable_role()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._ensure_writable_role()
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._ensure_writable_role()
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        if self.request.user.role == UserRole.ETUDIANT:
            serializer.save(etudiant=self.request.user)
            return
        if 'etudiant' not in serializer.validated_data:
            raise ValidationError({'etudiant': 'Un étudiant est requis pour créer ce planning.'})
        serializer.save()

    @action(detail=False, methods=('post',), url_path='generer')
    def generer(self, request):
        if request.user.role != UserRole.ETUDIANT:
            raise PermissionDenied('Seul un étudiant peut générer son planning personnel.')

        objectif = request.data.get('objectif')
        date_debut = request.data.get('date_debut')
        date_fin = request.data.get('date_fin')
        cours_ids = request.data.get('cours_ids')
        sessions_per_week = request.data.get('sessions_per_week', 5)

        if not isinstance(cours_ids, list) or not cours_ids:
            raise ValidationError({'cours_ids': 'Au moins un cours publié doit être sélectionné.'})
        if any(isinstance(course_id, bool) or not isinstance(course_id, int) for course_id in cours_ids):
            raise ValidationError({'cours_ids': 'Les identifiants de cours doivent être des entiers.'})
        if len(set(cours_ids)) != len(cours_ids):
            raise ValidationError({'cours_ids': 'Les identifiants de cours ne doivent pas être dupliqués.'})
        try:
            start_date = date.fromisoformat(date_debut)
            end_date = date.fromisoformat(date_fin)
        except (TypeError, ValueError):
            raise ValidationError({'dates': 'Les dates doivent respecter le format YYYY-MM-DD.'})
        if end_date < start_date:
            raise ValidationError({'date_fin': 'La date de fin doit être postérieure ou égale à la date de début.'})

        courses = list(Cours.objects.filter(id__in=cours_ids, is_published=True))
        if len(courses) != len(cours_ids):
            raise ValidationError({'cours_ids': 'Chaque cours sélectionné doit exister et être publié.'})
        course_by_id = {course.id: course for course in courses}
        courses_data = [
            {'id': course_id, 'titre': course_by_id[course_id].titre, 'description': course_by_id[course_id].description}
            for course_id in cours_ids
        ]

        try:
            generated_plan = generate_study_plan(
                objectif,
                date_debut,
                date_fin,
                courses_data,
                sessions_per_week,
            )
        except StudyPlanGenerationError as exc:
            raise ValidationError({'detail': str(exc)})

        with transaction.atomic():
            planning = PlanningEtude.objects.create(
                etudiant=request.user,
                titre=generated_plan['titre'],
                objectif=generated_plan['objectif'],
                date_debut=start_date,
                date_fin=end_date,
                is_generated_by_ai=True,
            )
            for generated_session in generated_plan['sessions']:
                SessionEtude.objects.create(
                    planning=planning,
                    cours=course_by_id[generated_session['cours_id']],
                    titre=generated_session['titre'],
                    description=generated_session['description'],
                    date_session=generated_session['date_session'],
                    heure_debut=generated_session['heure_debut'],
                    duree_minutes=generated_session['duree_minutes'],
                    ordre=generated_session['ordre'],
                    is_completed=False,
                )

        return Response(PlanningEtudeSerializer(planning, context={'request': request}).data, status=status.HTTP_201_CREATED)


class SessionEtudeViewSet(viewsets.ModelViewSet):
    serializer_class = SessionEtudeSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = SessionEtude.objects.select_related('planning', 'cours', 'planning__etudiant')
        if _is_admin(user):
            return queryset
        if user.role == UserRole.ETUDIANT:
            return queryset.filter(planning__etudiant=user)
        return queryset.none()

    def _ensure_writable_role(self):
        if not (_is_admin(self.request.user) or self.request.user.role == UserRole.ETUDIANT):
            raise PermissionDenied('Seuls les étudiants et les administrateurs peuvent gérer les sessions.')

    def create(self, request, *args, **kwargs):
        self._ensure_writable_role()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._ensure_writable_role()
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._ensure_writable_role()
        return super().destroy(request, *args, **kwargs)


class EmploiDuTempsSemaineViewSet(viewsets.ModelViewSet):
    serializer_class = EmploiDuTempsSemaineSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = EmploiDuTempsSemaine.objects.all()
        if _is_admin(user): return queryset.prefetch_related('creneaux')
        if user.role == UserRole.ENSEIGNANT:
            own_slots = CreneauEmploiDuTemps.objects.filter(cours__enseignant=user).select_related('cours', 'cours__enseignant')
            return queryset.filter(statut=EmploiDuTempsSemaine.Statut.PUBLIE, creneaux__cours__enseignant=user).distinct().prefetch_related(Prefetch('creneaux', queryset=own_slots))
        if user.role == UserRole.ETUDIANT: return queryset.filter(statut=EmploiDuTempsSemaine.Statut.PUBLIE).prefetch_related('creneaux')
        return queryset.none()

    def _admin_only(self):
        if not _is_admin(self.request.user): raise PermissionDenied('Seul un administrateur peut gérer les emplois du temps.')

    def create(self, request, *args, **kwargs): self._admin_only(); return super().create(request, *args, **kwargs)
    def update(self, request, *args, **kwargs): self._admin_only(); return super().update(request, *args, **kwargs)
    def destroy(self, request, *args, **kwargs): self._admin_only(); return super().destroy(request, *args, **kwargs)
    def perform_create(self, serializer): serializer.save(created_by=self.request.user)

    @action(detail=True, methods=('post',), url_path='publier')
    def publier(self, request, pk=None):
        self._admin_only(); emploi = self.get_object()
        emploi.statut = EmploiDuTempsSemaine.Statut.PUBLIE; emploi.published_at = timezone.now(); emploi.save(update_fields=('statut', 'published_at', 'updated_at'))
        return Response(self.get_serializer(emploi).data)

    @action(detail=False, methods=('post',), url_path='generer-preview')
    def generer_preview(self, request):
        self._admin_only()
        course_ids = request.data.get('cours_ids')
        if course_ids is not None:
            if not isinstance(course_ids, list):
                raise ValidationError({'cours_ids': 'La sélection des cours doit être une liste.'})
            normalized_ids = []
            for course_id in course_ids:
                if isinstance(course_id, bool):
                    raise ValidationError({'cours_ids': 'Les identifiants de cours doivent être des entiers.'})
                try:
                    normalized_ids.append(int(course_id))
                except (TypeError, ValueError):
                    raise ValidationError({'cours_ids': 'Les identifiants de cours doivent être des entiers.'})
            if len(set(normalized_ids)) != len(normalized_ids):
                raise ValidationError({'cours_ids': 'Les identifiants de cours ne doivent pas être dupliqués.'})
        else:
            normalized_ids = None

        courses_queryset = Cours.objects.filter(is_published=True).select_related('enseignant')
        if normalized_ids is not None:
            courses_queryset = courses_queryset.filter(id__in=normalized_ids)
        courses = list(courses_queryset)
        if normalized_ids is not None and len(courses) != len(normalized_ids):
            raise ValidationError({'cours_ids': 'Chaque cours sélectionné doit exister et être publié.'})
        if not courses:
            raise ValidationError({'cours_ids': 'Aucun cours publié n’est disponible pour la génération.'})
        trusted_courses = [
            {'id': course.id, 'titre': course.titre, 'enseignant_id': course.enseignant_id,
             'enseignant': course.enseignant.username}
            for course in courses
        ]
        try: proposal = generate_timetable_preview(request.data, trusted_courses)
        except TimetableGenerationError as exc: return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(proposal)


class CreneauEmploiDuTempsViewSet(viewsets.ModelViewSet):
    serializer_class = CreneauEmploiDuTempsSerializer
    permission_classes = (IsAuthenticated,)
    def get_queryset(self):
        user = self.request.user; qs = CreneauEmploiDuTemps.objects.select_related('emploi_du_temps', 'cours', 'enseignant')
        if _is_admin(user): return qs
        if user.role == UserRole.ENSEIGNANT: return qs.filter(emploi_du_temps__statut=EmploiDuTempsSemaine.Statut.PUBLIE, cours__enseignant=user)
        if user.role == UserRole.ETUDIANT: return qs.filter(emploi_du_temps__statut=EmploiDuTempsSemaine.Statut.PUBLIE)
        return qs.none()
    def _admin_only(self):
        if not _is_admin(self.request.user): raise PermissionDenied('Seul un administrateur peut gérer les créneaux.')
    def _return_to_draft(self, emploi):
        if emploi.statut == EmploiDuTempsSemaine.Statut.PUBLIE:
            emploi.statut = EmploiDuTempsSemaine.Statut.BROUILLON
            emploi.published_at = None
            emploi.save(update_fields=('statut', 'published_at', 'updated_at'))

    def create(self, request, *args, **kwargs):
        self._admin_only()
        response = super().create(request, *args, **kwargs)
        self._return_to_draft(EmploiDuTempsSemaine.objects.get(pk=response.data['emploi_du_temps']))
        return response

    def update(self, request, *args, **kwargs):
        self._admin_only()
        response = super().update(request, *args, **kwargs)
        self._return_to_draft(EmploiDuTempsSemaine.objects.get(pk=response.data['emploi_du_temps']))
        return response

    def destroy(self, request, *args, **kwargs):
        self._admin_only()
        emploi = self.get_object().emploi_du_temps
        response = super().destroy(request, *args, **kwargs)
        self._return_to_draft(emploi)
        return response


class ReclamationPlanningViewSet(viewsets.ModelViewSet):
    serializer_class = ReclamationPlanningSerializer
    permission_classes = (IsAuthenticated,)
    def get_queryset(self):
        user = self.request.user; qs = ReclamationPlanning.objects.select_related('emploi_du_temps', 'creneau', 'enseignant')
        if _is_admin(user): return qs
        if user.role == UserRole.ENSEIGNANT: return qs.filter(enseignant=user)
        return qs.none()
    def create(self, request, *args, **kwargs):
        if request.user.role != UserRole.ENSEIGNANT: raise PermissionDenied('Seul un enseignant peut créer une réclamation.')
        return super().create(request, *args, **kwargs)
    def perform_create(self, serializer): serializer.save(enseignant=self.request.user)
    def update(self, request, *args, **kwargs):
        if not _is_admin(request.user): raise PermissionDenied('Seul un administrateur peut traiter une réclamation.')
        return super().update(request, *args, **kwargs)
    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied('Une réclamation ne peut pas être supprimée via cette API.')
