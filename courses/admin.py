from django.contrib import admin

from .models import Cours, Resume


@admin.register(Cours)
class CoursAdmin(admin.ModelAdmin):
    list_display = ('titre', 'enseignant', 'is_published', 'date_creation', 'date_modification')
    list_filter = ('is_published', 'date_creation')
    search_fields = ('titre', 'description', 'enseignant__username')
    list_select_related = ('enseignant',)


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('cours', 'date_generation', 'date_modification')
    search_fields = ('cours__titre', 'contenu')
    list_select_related = ('cours',)

# Register your models here.
