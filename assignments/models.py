from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from courses.models import Cours


class Devoir(models.Model):
    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    consigne = models.TextField()
    cours = models.ForeignKey(Cours, on_delete=models.CASCADE, related_name='devoirs')
    enseignant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devoirs')
    fichier = models.FileField(upload_to='devoirs/', blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_limite = models.DateTimeField()
    is_published = models.BooleanField(default=False)
    correction_reference = models.TextField(blank=True)
    criteres_correction = models.JSONField(default=list, blank=True)
    is_generated_by_ai = models.BooleanField(default=False)

    class Meta:
        ordering = ('-date_creation',)

    def __str__(self):
        return self.titre


class Soumission(models.Model):
    devoir = models.ForeignKey(Devoir, on_delete=models.CASCADE, related_name='soumissions')
    etudiant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='soumissions')
    reponse_texte = models.TextField(blank=True)
    fichier = models.FileField(upload_to='soumissions/', blank=True, null=True)
    date_soumission = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    note = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(20)])
    feedback = models.TextField(blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=('devoir', 'etudiant'), name='unique_soumission_par_etudiant')]
        ordering = ('-date_soumission',)

# Create your models here.
