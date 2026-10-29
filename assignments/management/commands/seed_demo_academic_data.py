from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import Sum

from accounts.models import User, UserRole
from assignments.models import Devoir, Soumission
from quizzes.models import Quiz, Resultat


PYTHON_RESPONSES = [
    ('Une liste Python est mutable : ses éléments peuvent être ajoutés, supprimés ou modifiés après sa création, contrairement à un tuple qui est immutable.', Decimal('18.00'), 'Réponse claire et correcte. La distinction entre liste et tuple est bien expliquée.'),
    ('Une liste stocke plusieurs valeurs et peut être modifiée. Un tuple stocke aussi plusieurs valeurs mais reste fixe après sa création.', Decimal('16.00'), ''),
    ('Les listes utilisent des crochets et les tuples des parenthèses. La différence de modification après création pourrait être davantage expliquée.', Decimal('12.00'), 'Bonne compréhension générale, mais il manque une explication précise sur la mutabilité.'),
    ('Une liste et un tuple sont deux conteneurs Python ; je ne suis pas certain de leur différence de comportement.', None, ''),
]
SQL_RESPONSES = [
    ('Une clé primaire identifie de manière unique chaque ligne d’une table. Une clé étrangère référence une clé primaire afin de relier deux tables.', Decimal('18.00'), 'Réponse précise : les deux rôles sont correctement distingués.'),
    ('La clé primaire est unique dans une table ; la clé étrangère sert à représenter une relation entre deux tables.', Decimal('16.00'), ''),
    ('Une clé primaire concerne une table, alors qu’une clé étrangère permet de faire un lien avec une autre table.', Decimal('14.00'), 'Réponse correcte, mais un exemple de relation renforcerait l’explication.'),
    ('Une clé étrangère sert uniquement à supprimer automatiquement une table.', None, ''),
]


class Command(BaseCommand):
    help = 'Ajoute des données académiques de démonstration cohérentes sans jamais créer d’utilisateur.'

    def handle(self, *args, **options):
        submissions_before, results_before = Soumission.objects.count(), Resultat.objects.count()
        teacher = User.objects.filter(username='frontend_e2e_teacher', role=UserRole.ENSEIGNANT).first()
        demo_student = User.objects.filter(username='frontend_e2e_student', role=UserRole.ETUDIANT).first()
        students = list(User.objects.filter(role=UserRole.ETUDIANT).order_by('id'))
        if not teacher or not students:
            self.stdout.write(self.style.WARNING('Données non ajoutées : enseignant ou étudiants existants introuvables.'))
            return

        assignments = list(Devoir.objects.filter(enseignant=teacher).select_related('cours').order_by('-is_published', 'id')[:6])
        quizzes = [quiz for quiz in Quiz.objects.filter(enseignant=teacher, is_published=True).select_related('cours') if quiz.questions.exists()]
        created_submissions = created_results = 0
        for index, devoir in enumerate(assignments):
            responses = PYTHON_RESPONSES if 'python' in f'{devoir.titre} {devoir.cours.titre}'.lower() else SQL_RESPONSES
            for offset, student in enumerate(students[:4]):
                text, note, feedback = responses[(index + offset) % len(responses)]
                submission, created = Soumission.objects.get_or_create(
                    devoir=devoir, etudiant=student,
                    defaults={'reponse_texte': text, 'note': note, 'feedback': feedback},
                )
                created_submissions += int(created)
        for quiz_index, quiz in enumerate(quizzes[:3]):
            maximum = quiz.questions.aggregate(total=Sum('points'))['total'] or Decimal('0')
            if maximum <= 0:
                continue
            for student_index, student in enumerate(students[:6]):
                ratio = (Decimal('1.00'), Decimal('0.80'), Decimal('0.60'), Decimal('0.40'), Decimal('0.80'), Decimal('0.60'))[(quiz_index + student_index) % 6]
                score = (maximum * ratio).quantize(Decimal('0.01'))
                percentage = (score / maximum * Decimal('100')).quantize(Decimal('0.01'))
                _, created = Resultat.objects.get_or_create(
                    quiz=quiz, etudiant=student,
                    defaults={'score': score, 'score_max': maximum, 'pourcentage': percentage},
                )
                created_results += int(created)

        teacher_submissions = Soumission.objects.filter(devoir__enseignant=teacher).count()
        teacher_results = Resultat.objects.filter(quiz__enseignant=teacher).count()
        student_submissions = Soumission.objects.filter(etudiant=demo_student).count() if demo_student else 0
        student_results = Resultat.objects.filter(etudiant=demo_student).count() if demo_student else 0
        self.stdout.write(self.style.SUCCESS(
            f'Soumissions : {submissions_before} -> {Soumission.objects.count()} (+{created_submissions}) | '
            f'Resultats : {results_before} -> {Resultat.objects.count()} (+{created_results})'
        ))
        self.stdout.write(f'Visibles frontend_e2e_teacher : {teacher_submissions} soumissions, {teacher_results} résultats.')
        self.stdout.write(f'Visibles frontend_e2e_student : {student_submissions} soumissions, {student_results} résultats.')
        self.stdout.write('Utilisateurs créés : 0')
