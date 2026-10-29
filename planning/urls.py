from rest_framework.routers import DefaultRouter

from .views import (CreneauEmploiDuTempsViewSet, EmploiDuTempsSemaineViewSet,
                    PlanningEtudeViewSet, ReclamationPlanningViewSet, SessionEtudeViewSet)


router = DefaultRouter()
router.register('plannings', PlanningEtudeViewSet, basename='planning')
router.register('sessions-etude', SessionEtudeViewSet, basename='session-etude')
router.register('emplois-du-temps', EmploiDuTempsSemaineViewSet, basename='emploi-du-temps')
router.register('creneaux-planning', CreneauEmploiDuTempsViewSet, basename='creneau-planning')
router.register('reclamations-planning', ReclamationPlanningViewSet, basename='reclamation-planning')

urlpatterns = router.urls
