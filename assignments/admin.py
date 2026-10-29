from django.contrib import admin

from .models import Devoir, Soumission


@admin.register(Devoir)
class DevoirAdmin(admin.ModelAdmin):
    list_display = ('titre', 'cours', 'enseignant', 'date_limite', 'is_published')
    list_filter = ('is_published',)
    list_select_related = ('cours', 'enseignant')


@admin.register(Soumission)
class SoumissionAdmin(admin.ModelAdmin):
    list_display = ('devoir', 'etudiant', 'date_soumission', 'note')
    list_select_related = ('devoir', 'etudiant')

# Register your models here.
