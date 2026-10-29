from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models


class Cours(models.Model):
    titre = models.CharField(max_length=255, validators=[MinLengthValidator(1)])
    description = models.TextField(blank=True)
    contenu = models.TextField()
    fichier = models.FileField(upload_to='cours_files/', blank=True, null=True)
    enseignant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cours')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ('-date_creation',)

    def __str__(self):
        return self.titre


class Resume(models.Model):
    cours = models.OneToOneField(Cours, on_delete=models.CASCADE, related_name='resume')
    contenu = models.TextField()
    date_generation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Resume: {self.cours.titre}'

# Create your models here.
