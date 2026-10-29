from django.core.management.base import BaseCommand

from accounts.models import User, UserRole
from assignments.models import Devoir, Soumission


PENDING_PYTHON_SUBMISSIONS = [
    (
        'hana_grounded_good',
        'Une liste Python est mutable : on peut ajouter, supprimer ou modifier ses éléments après sa création. Un tuple est immuable, donc sa structure ne peut plus être modifiée après sa création.',
    ),
    (
        'hana_grounded_partial',
        'Une liste et un tuple permettent tous les deux de stocker plusieurs valeurs. La principale différence concerne la modification des éléments après leur création.',
    ),
    (
        'hana_grounded_wrong',
        'Une liste Python est immuable tandis qu’un tuple est mutable.',
    ),
    (
        'hana_final_student',
        'Avec une liste, il est possible de remplacer ou d’ajouter des éléments. Un tuple garde les valeurs définies lors de sa création.',
    ),
    (
        'frontend_e2e_student',
        'Les listes et les tuples servent à organiser plusieurs données. Je sais que leur écriture n’est pas exactement la même, mais je dois encore préciser ce qui change après la création.',
    ),
    (
        'student_amine',
        'Un tuple peut être modifié librement après sa création, alors qu’une liste ne peut pas être changée.',
    ),
]


class Command(BaseCommand):
    help = 'Ajoute des soumissions de démonstration vierges et cohérentes, sans créer d’utilisateur ni appeler une IA.'

    def handle(self, *args, **options):
        teacher = User.objects.filter(
            username='frontend_e2e_teacher', role=UserRole.ENSEIGNANT,
        ).first()
        assignment = Devoir.objects.filter(
            enseignant=teacher,
            titre__icontains='listes et les tuples',
        ).select_related('cours').first()
        if not teacher or not assignment:
            self.stdout.write(self.style.ERROR('Le devoir Python de frontend_e2e_teacher est introuvable.'))
            return

        before = Soumission.objects.count()
        created = 0
        for username, response_text in PENDING_PYTHON_SUBMISSIONS:
            student = User.objects.filter(username=username, role=UserRole.ETUDIANT).first()
            if not student:
                self.stdout.write(self.style.WARNING(f'Étudiant ignoré : {username}.'))
                continue
            _, was_created = Soumission.objects.get_or_create(
                devoir=assignment,
                etudiant=student,
                defaults={
                    'reponse_texte': response_text,
                    'note': None,
                    'feedback': '',
                },
            )
            created += int(was_created)

        pending = Soumission.objects.filter(
            devoir__enseignant=teacher,
            note__isnull=True,
            feedback__in=('', None),
        ).count()
        self.stdout.write(self.style.SUCCESS(
            f'Soumissions : {before} -> {Soumission.objects.count()} (+{created})'
        ))
        self.stdout.write(f'Devoir utilisé : {assignment.titre} ({assignment.cours.titre})')
        self.stdout.write(f'Soumissions vierges visibles pour frontend_e2e_teacher : {pending}')
        self.stdout.write('Utilisateurs créés : 0 | Appels IA : 0')
