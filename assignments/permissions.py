from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import UserRole


class DevoirAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if view.action == 'create':
            return request.user.is_superuser or request.user.role in (UserRole.ADMIN, UserRole.ENSEIGNANT)
        return True

    def has_object_permission(self, request, view, devoir):
        user = request.user
        if user.is_superuser or user.role == UserRole.ADMIN:
            return True
        if user.role == UserRole.ENSEIGNANT:
            return devoir.enseignant_id == user.id
        return request.method in SAFE_METHODS and devoir.is_published and devoir.cours.is_published


class SoumissionAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if view.action == 'create':
            return request.user.role == UserRole.ETUDIANT
        return True

    def has_object_permission(self, request, view, soumission):
        user = request.user
        if user.is_superuser or user.role == UserRole.ADMIN:
            return True
        if user.role == UserRole.ENSEIGNANT:
            return soumission.devoir.enseignant_id == user.id
        if user.role != UserRole.ETUDIANT or soumission.etudiant_id != user.id:
            return False
        if request.method not in SAFE_METHODS and soumission.devoir.date_limite < __import__('django.utils.timezone', fromlist=['now']).now():
            return False
        return True
