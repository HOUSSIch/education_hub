from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CoursViewSet, ResumeListView

router = DefaultRouter()
router.register('cours', CoursViewSet, basename='cours')

urlpatterns = [
    path('resumes/', ResumeListView.as_view(), name='resume-list'),
] + router.urls
