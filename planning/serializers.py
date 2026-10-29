from rest_framework import serializers

from accounts.models import UserRole

from .models import (CreneauEmploiDuTemps, EmploiDuTempsSemaine, PlanningEtude,
                     ReclamationPlanning, SessionEtude)


class SessionEtudeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionEtude
        fields = ('id', 'planning', 'cours', 'titre', 'description', 'date_session', 'heure_debut', 'duree_minutes', 'ordre', 'is_completed')
        read_only_fields = ('id',)

    def validate(self, attrs):
        planning = attrs.get('planning', getattr(self.instance, 'planning', None))
        cours = attrs.get('cours', getattr(self.instance, 'cours', None))
        date_session = attrs.get('date_session', getattr(self.instance, 'date_session', None))
        user = self.context['request'].user

        if planning and date_session and not planning.date_debut <= date_session <= planning.date_fin:
            raise serializers.ValidationError({'date_session': 'La date de session doit être comprise dans la période du planning.'})
        if user.role == UserRole.ETUDIANT:
            if planning and planning.etudiant_id != user.id:
                raise serializers.ValidationError({'planning': 'Ce planning ne vous appartient pas.'})
            if cours and not cours.is_published:
                raise serializers.ValidationError({'cours': 'Un étudiant ne peut utiliser qu’un cours publié.'})
        return attrs


class PlanningEtudeSerializer(serializers.ModelSerializer):
    sessions = SessionEtudeSerializer(many=True, read_only=True)

    class Meta:
        model = PlanningEtude
        fields = ('id', 'etudiant', 'titre', 'objectif', 'date_debut', 'date_fin', 'date_creation', 'date_modification', 'is_generated_by_ai', 'sessions')
        read_only_fields = ('id', 'date_creation', 'date_modification', 'is_generated_by_ai', 'sessions')
        extra_kwargs = {'etudiant': {'required': False}}

    def validate(self, attrs):
        date_debut = attrs.get('date_debut', getattr(self.instance, 'date_debut', None))
        date_fin = attrs.get('date_fin', getattr(self.instance, 'date_fin', None))
        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError({'date_fin': 'La date de fin doit être postérieure ou égale à la date de début.'})
        if self.context['request'].user.role == UserRole.ETUDIANT:
            attrs.pop('etudiant', None)
        return attrs


class CreneauEmploiDuTempsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreneauEmploiDuTemps
        fields = ('id', 'emploi_du_temps', 'cours', 'enseignant', 'jour', 'heure_debut', 'heure_fin', 'ordre', 'is_locked', 'created_at', 'updated_at')
        read_only_fields = ('id', 'enseignant', 'created_at', 'updated_at')

    def validate(self, attrs):
        emploi = attrs.get('emploi_du_temps', getattr(self.instance, 'emploi_du_temps', None))
        cours = attrs.get('cours', getattr(self.instance, 'cours', None))
        debut = attrs.get('heure_debut', getattr(self.instance, 'heure_debut', None))
        fin = attrs.get('heure_fin', getattr(self.instance, 'heure_fin', None))
        if debut and fin and fin <= debut:
            raise serializers.ValidationError({'heure_fin': 'L’heure de fin doit être postérieure à l’heure de début.'})
        if cours and not cours.is_published:
            raise serializers.ValidationError({'cours': 'Seul un cours publié peut être planifié.'})
        if emploi and debut and fin:
            duplicate = CreneauEmploiDuTemps.objects.filter(emploi_du_temps=emploi, jour=attrs.get('jour', getattr(self.instance, 'jour', None)), heure_debut=debut, heure_fin=fin)
            if self.instance:
                duplicate = duplicate.exclude(pk=self.instance.pk)
            if duplicate.exists():
                raise serializers.ValidationError({'heure_debut': 'Un créneau existe déjà pour cette cellule de l’emploi du temps.'})
        return attrs

    def create(self, validated_data):
        validated_data['enseignant'] = validated_data['cours'].enseignant
        return super().create(validated_data)

    def update(self, instance, validated_data):
        cours = validated_data.get('cours', instance.cours)
        validated_data['enseignant'] = cours.enseignant
        return super().update(instance, validated_data)


class EmploiDuTempsSemaineSerializer(serializers.ModelSerializer):
    creneaux = CreneauEmploiDuTempsSerializer(many=True, read_only=True)

    class Meta:
        model = EmploiDuTempsSemaine
        fields = ('id', 'titre', 'semaine_debut', 'semaine_fin', 'statut', 'created_by', 'is_generated_by_ai', 'created_at', 'updated_at', 'published_at', 'creneaux')
        read_only_fields = ('id', 'created_by', 'is_generated_by_ai', 'created_at', 'updated_at', 'published_at', 'creneaux')


class ReclamationPlanningSerializer(serializers.ModelSerializer):
    enseignant_username = serializers.CharField(source='enseignant.username', read_only=True)
    cours_titre = serializers.CharField(source='creneau.cours.titre', read_only=True, default=None)

    class Meta:
        model = ReclamationPlanning
        fields = ('id', 'emploi_du_temps', 'creneau', 'enseignant', 'enseignant_username', 'cours_titre', 'motif', 'message', 'statut', 'reponse_admin', 'created_at', 'updated_at')
        read_only_fields = ('id', 'enseignant', 'created_at', 'updated_at')

    def validate(self, attrs):
        creneau = attrs.get('creneau')
        emploi = attrs.get('emploi_du_temps', getattr(self.instance, 'emploi_du_temps', None))
        user = self.context['request'].user
        if user.role != UserRole.ADMIN and ("statut" in attrs or "reponse_admin" in attrs):
            raise serializers.ValidationError('Seul un administrateur peut traiter une réclamation.')
        if creneau and (creneau.emploi_du_temps_id != emploi.id or creneau.cours.enseignant_id != user.id):
            raise serializers.ValidationError({'creneau': 'Vous ne pouvez réclamer que sur votre propre créneau.'})
        return attrs
