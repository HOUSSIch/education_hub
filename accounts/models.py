from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrateur'
    ENSEIGNANT = 'ENSEIGNANT', 'Enseignant'
    ETUDIANT = 'ETUDIANT', 'Etudiant'


class CustomUserManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('role', UserRole.ADMIN)
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.ETUDIANT,
    )

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = UserRole.ADMIN
        super().save(*args, **kwargs)

# Create your models here.
