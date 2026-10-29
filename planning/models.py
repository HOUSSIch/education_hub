from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q

from courses.models import Cours


class PlanningEtude(models.Model):
    etudiant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='plannings_etude')
    titre = models.CharField(max_length=255)
    objectif = models.TextField()
    date_debut = models.DateField()
    date_fin = models.DateField()
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    is_generated_by_ai = models.BooleanField(default=False)

    class Meta:
        ordering = ('date_debut', 'id')
        constraints = [
            models.CheckConstraint(check=Q(date_fin__gte=F('date_debut')), name='planning_date_fin_after_start'),
        ]

    def clean(self):
        if self.date_debut and self.date_fin and self.date_fin < self.date_debut:
            raise ValidationError({'date_fin': 'La date de fin doit être postérieure ou égale à la date de début.'})


class SessionEtude(models.Model):
    planning = models.ForeignKey(PlanningEtude, on_delete=models.CASCADE, related_name='sessions')
    cours = models.ForeignKey(Cours, on_delete=models.CASCADE, related_name='sessions_etude')
    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    date_session = models.DateField()
    heure_debut = models.TimeField()
    duree_minutes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    ordre = models.PositiveIntegerField(default=1)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ('date_session', 'heure_debut', 'ordre', 'id')

    def clean(self):
        if self.planning_id and self.date_session:
            if not self.planning.date_debut <= self.date_session <= self.planning.date_fin:
                raise ValidationError({'date_session': 'La date de session doit être comprise dans la période du planning.'})


class EmploiDuTempsSemaine(models.Model):
    class Statut(models.TextChoices):
        BROUILLON = 'BROUILLON', 'Brouillon'
        PUBLIE = 'PUBLIE', 'Publié'

    titre = models.CharField(max_length=255)
    semaine_debut = models.DateField()
    semaine_fin = models.DateField()
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.BROUILLON)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='emplois_crees')
    is_generated_by_ai = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-semaine_debut', '-id')
        constraints = [models.CheckConstraint(check=Q(semaine_fin__gte=F('semaine_debut')), name='emploi_week_valid')]


class CreneauEmploiDuTemps(models.Model):
    class Jour(models.TextChoices):
        LUNDI = 'LUNDI', 'Lundi'; MARDI = 'MARDI', 'Mardi'; MERCREDI = 'MERCREDI', 'Mercredi'
        JEUDI = 'JEUDI', 'Jeudi'; VENDREDI = 'VENDREDI', 'Vendredi'; SAMEDI = 'SAMEDI', 'Samedi'; DIMANCHE = 'DIMANCHE', 'Dimanche'

    emploi_du_temps = models.ForeignKey(EmploiDuTempsSemaine, on_delete=models.CASCADE, related_name='creneaux')
    cours = models.ForeignKey(Cours, on_delete=models.PROTECT, related_name='creneaux_emploi')
    enseignant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='creneaux_emploi')
    jour = models.CharField(max_length=10, choices=Jour.choices)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    ordre = models.PositiveIntegerField(default=1)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('jour', 'heure_debut', 'ordre', 'id')
        constraints = [
            models.UniqueConstraint(fields=('emploi_du_temps', 'jour', 'heure_debut', 'heure_fin'), name='unique_creneau_timetable_cell'),
        ]

    def clean(self):
        if self.heure_debut and self.heure_fin and self.heure_fin <= self.heure_debut:
            raise ValidationError({'heure_fin': 'L’heure de fin doit être postérieure à l’heure de début.'})
        if self.cours_id and self.enseignant_id and self.cours.enseignant_id != self.enseignant_id:
            raise ValidationError({'enseignant': 'L’enseignant doit être le propriétaire du cours.'})


class ReclamationPlanning(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        ACCEPTEE = 'ACCEPTEE', 'Acceptée'
        REFUSEE = 'REFUSEE', 'Refusée'

    emploi_du_temps = models.ForeignKey(EmploiDuTempsSemaine, on_delete=models.CASCADE, related_name='reclamations')
    creneau = models.ForeignKey(CreneauEmploiDuTemps, null=True, blank=True, on_delete=models.SET_NULL, related_name='reclamations')
    enseignant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reclamations_planning')
    motif = models.CharField(max_length=120)
    message = models.TextField()
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    reponse_admin = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)
