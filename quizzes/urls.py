from rest_framework.routers import DefaultRouter
from .views import QuizViewSet,QuestionViewSet,ReponseViewSet,ResultatViewSet
router=DefaultRouter(); router.register('quizzes',QuizViewSet,basename='quiz'); router.register('questions',QuestionViewSet,basename='question'); router.register('reponses',ReponseViewSet,basename='reponse'); router.register('resultats',ResultatViewSet,basename='resultat')
urlpatterns=router.urls
