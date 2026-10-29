from rest_framework import serializers

from .models import Cours, Resume


class TeacherSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class CoursSerializer(serializers.ModelSerializer):
    enseignant = TeacherSerializer(read_only=True)

    class Meta:
        model = Cours
        fields = ('id', 'titre', 'description', 'contenu', 'fichier', 'enseignant', 'date_creation', 'date_modification', 'is_published')
        read_only_fields = ('id', 'enseignant', 'date_creation', 'date_modification')

    def validate_titre(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Le titre ne peut pas etre vide.')
        return value


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ('id', 'cours', 'contenu', 'date_generation', 'date_modification')
        read_only_fields = ('id', 'cours', 'date_generation', 'date_modification')

    def validate_contenu(self, value):
        if not value.strip():
            raise serializers.ValidationError('Le contenu du resume ne peut pas etre vide.')
        return value
