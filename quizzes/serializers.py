from rest_framework import serializers
from .models import Quiz,Question,Reponse,Resultat
class QuizSerializer(serializers.ModelSerializer):
 class Meta: model=Quiz; fields='__all__'; read_only_fields=('enseignant','date_creation','date_modification')
class QuestionSerializer(serializers.ModelSerializer):
 class Meta: model=Question; fields='__all__'
class ReponseSerializer(serializers.ModelSerializer):
 class Meta: model=Reponse; fields=('id','question','texte','est_correcte')
 def to_representation(self,instance):
  data=super().to_representation(instance)
  if self.context['request'].user.role=='ETUDIANT': data.pop('est_correcte',None)
  return data
class ResultatSerializer(serializers.ModelSerializer):
 etudiant_username=serializers.CharField(source='etudiant.username',read_only=True)
 etudiant_nom=serializers.SerializerMethodField()
 quiz_titre=serializers.CharField(source='quiz.titre',read_only=True)
 cours_titre=serializers.CharField(source='quiz.cours.titre',read_only=True)
 def get_etudiant_nom(self,obj): return (f'{obj.etudiant.first_name} {obj.etudiant.last_name}').strip() or obj.etudiant.username
 class Meta: model=Resultat; fields='__all__'; read_only_fields=('id','quiz','etudiant','score','score_max','pourcentage','date_passage')
