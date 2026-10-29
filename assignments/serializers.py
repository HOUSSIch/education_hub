from rest_framework import serializers

from .models import Devoir, Soumission
from .services.submission_analyzer import CriteriaValidationError, validate_criteres_correction


class DevoirSerializer(serializers.ModelSerializer):
    class Meta:
        model = Devoir
        fields = ('id', 'titre', 'description', 'consigne', 'correction_reference', 'criteres_correction', 'cours', 'enseignant', 'fichier', 'date_creation', 'date_modification', 'date_limite', 'is_published', 'is_generated_by_ai')
        read_only_fields = ('id', 'enseignant', 'date_creation', 'date_modification', 'is_generated_by_ai')

    def validate_titre(self, value):
        if not value.strip():
            raise serializers.ValidationError('Le titre ne peut pas etre vide.')
        return value.strip()

    def validate_criteres_correction(self, value):
        if value == []:
            return value
        try:
            return validate_criteres_correction(value)
        except CriteriaValidationError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate(self, attrs):
        instance = self.instance
        is_published = attrs.get('is_published', instance.is_published if instance else False)
        correction_reference = attrs.get(
            'correction_reference',
            instance.correction_reference if instance else '',
        )
        criteres_correction = attrs.get(
            'criteres_correction',
            instance.criteres_correction if instance else [],
        )
        if is_published:
            if not isinstance(correction_reference, str) or not correction_reference.strip():
                raise serializers.ValidationError(
                    {'correction_reference': 'Une correction de reference est obligatoire avant publication.'}
                )
            try:
                validate_criteres_correction(criteres_correction)
            except CriteriaValidationError as exc:
                raise serializers.ValidationError({'criteres_correction': str(exc)}) from exc
        return attrs


class DevoirStudentSerializer(serializers.ModelSerializer):
    """Public representation of a published assignment.

    The teacher reference answer and deterministic correction criteria are never
    sent to students, including when they call the REST API directly.
    """

    class Meta:
        model = Devoir
        fields = (
            'id', 'titre', 'description', 'consigne', 'cours', 'fichier',
            'date_creation', 'date_modification', 'date_limite',
            'is_published', 'is_generated_by_ai',
        )
        read_only_fields = fields


class SoumissionSerializer(serializers.ModelSerializer):
    etudiant_info = serializers.SerializerMethodField()

    def get_etudiant_info(self, obj):
        """Small display-only identity for the teacher/admin correction views."""
        return {
            'id': obj.etudiant_id,
            'username': obj.etudiant.username,
            'first_name': obj.etudiant.first_name,
            'last_name': obj.etudiant.last_name,
        }

    class Meta:
        model = Soumission
        fields = ('id', 'devoir', 'etudiant', 'etudiant_info', 'reponse_texte', 'fichier', 'date_soumission', 'date_modification', 'note', 'feedback')
        read_only_fields = ('id', 'etudiant', 'date_soumission', 'date_modification', 'note', 'feedback')

    def validate(self, attrs):
        if self.instance is None and not attrs.get('reponse_texte', '').strip() and not attrs.get('fichier'):
            raise serializers.ValidationError('Une reponse texte ou un fichier est obligatoire.')
        for field in ('etudiant', 'note', 'feedback'):
            if field in self.initial_data:
                raise serializers.ValidationError({field: 'Ce champ ne peut pas etre defini par un etudiant.'})
        return attrs


class CorrectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Soumission
        fields = ('id', 'note', 'feedback')
        read_only_fields = ('id',)
