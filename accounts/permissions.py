from rest_framework.permissions import BasePermission

from .models import UserRole


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.role == UserRole.ADMIN))


class IsEnseignant(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == UserRole.ENSEIGNANT)


class IsEtudiant(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == UserRole.ETUDIANT)


class IsAdminOrEnseignant(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role in (UserRole.ADMIN, UserRole.ENSEIGNANT))
        )
