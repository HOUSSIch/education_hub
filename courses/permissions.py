from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import UserRole


class CourseAccessPermission(BasePermission):
    message = 'Vous ne disposez pas des droits necessaires pour cette action.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if view.action == 'create':
            return user.is_superuser or user.role in (UserRole.ADMIN, UserRole.ENSEIGNANT)
        return True

    def has_object_permission(self, request, view, course):
        user = request.user
        if user.is_superuser or user.role == UserRole.ADMIN:
            return True
        if request.method in SAFE_METHODS:
            if user.role == UserRole.ENSEIGNANT:
                return course.enseignant_id == user.id
            return user.role == UserRole.ETUDIANT and course.is_published
        return user.role == UserRole.ENSEIGNANT and course.enseignant_id == user.id
