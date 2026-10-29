from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DevoirViewSet, GenerateAssignmentView, SoumissionViewSet

router = DefaultRouter()
router.register('devoirs', DevoirViewSet, basename='devoir')
router.register('soumissions', SoumissionViewSet, basename='soumission')
urlpatterns = [
    path('cours/<int:cours_id>/generer-devoir/', GenerateAssignmentView.as_view(), name='generate-assignment'),
] + router.urls
