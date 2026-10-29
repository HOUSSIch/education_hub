from datetime import timedelta, time

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User, UserRole
from assignments.models import Devoir, Soumission
from courses.models import Cours, Resume
from planning.models import PlanningEtude, SessionEtude
from quizzes.models import Quiz, Question, Reponse, Resultat


PYTHON_CRITERIA = [
    {'id': 1, 'description': 'Identifier qu’une liste est mutable.', 'concepts_attendus': [['liste'], ['mutable', 'modifiable']], 'contradictions': [['liste', 'immutable']]},
    {'id': 2, 'description': 'Identifier qu’un tuple est immutable.', 'concepts_attendus': [['tuple'], ['immutable', 'immuable', 'non modifiable']], 'contradictions': [['tuple', 'mutable']]},
]
DATABASE_CRITERIA = [
    {'id': 1, 'description': 'Expliquer la clé primaire.', 'concepts_attendus': [['clé primaire'], ['identifier', 'unique']], 'contradictions': []},
    {'id': 2, 'description': 'Expliquer la clé étrangère.', 'concepts_attendus': [['clé étrangère'], ['relation', 'référence']], 'contradictions': []},
]


class Command(BaseCommand):
    help = 'Crée ou met à jour un jeu de données de démonstration cohérent.'

    def handle(self, *args, **options):
        today = timezone.localdate()
        users = self._users()
        courses = self._courses(users)
        self._resumes(courses)
        assignments = self._assignments(users, courses, today)
        self._submissions(users, assignments)
        quizzes = self._quizzes(users, courses, today)
        self._results(users, quizzes)
        self._planning(users, courses, today)
        self.stdout.write(self.style.SUCCESS('Données de démonstration créées ou mises à jour.'))
        self._counts()

    def _user(self, username, role, first_name, last_name, email):
        user, created = User.objects.get_or_create(username=username, defaults={'role': role, 'first_name': first_name, 'last_name': last_name, 'email': email})
        user.role, user.first_name, user.last_name, user.email, user.is_active = role, first_name, last_name, email, True
        user.set_password('Demo1234!')
        user.save()
        return user

    def _users(self):
        return {
            'admin': self._user('admin_demo', UserRole.ADMIN, 'Admin', 'Démonstration', 'admin.demo@example.com'),
            'python': self._user('teacher_python', UserRole.ENSEIGNANT, 'Nadia', 'Python', 'nadia.python@example.com'),
            'database': self._user('teacher_database', UserRole.ENSEIGNANT, 'Karim', 'Database', 'karim.database@example.com'),
            'amine': self._user('student_amine', UserRole.ETUDIANT, 'Amine', 'Ben Salem', 'amine.demo@example.com'),
            'sarra': self._user('student_sarra', UserRole.ETUDIANT, 'Sarra', 'Trabelsi', 'sarra.demo@example.com'),
            'youssef': self._user('student_youssef', UserRole.ETUDIANT, 'Youssef', 'Mansour', 'youssef.demo@example.com'),
        }

    def _course(self, teacher, title, description, content, published=True):
        course, _ = Cours.objects.update_or_create(enseignant=teacher, titre=title, defaults={'description': description, 'contenu': content, 'is_published': published})
        return course

    def _courses(self, u):
        return {
            'intro_python': self._course(u['python'], 'Introduction à Python', 'Découverte de Python, variables, conditions, boucles, fonctions et structures de données.', 'Python permet de créer des programmes lisibles. Ce cours introduit les variables, les types int et str, les conditions, les boucles for et while, les fonctions, les listes, les tuples et les dictionnaires.'),
            'oop_python': self._course(u['python'], 'Programmation orientée objet en Python', 'Classes, objets, méthodes, héritage et encapsulation.', 'La programmation orientée objet organise le code avec des classes et des objets. Les méthodes définissent les comportements, l’héritage réutilise les fonctionnalités et l’encapsulation protège les attributs.'),
            'relational': self._course(u['database'], 'Bases de données relationnelles', 'Tables, clés, SQL et relations.', 'Une base relationnelle organise les données en tables. Une clé primaire identifie une ligne de manière unique. Une clé étrangère référence une autre table. SQL permet de consulter et modifier les données.'),
            'sql': self._course(u['database'], 'SQL avancé', 'JOIN, GROUP BY, sous-requêtes, agrégations et index.', 'SQL avancé utilise les jointures JOIN pour relier des tables, GROUP BY pour regrouper, les agrégations COUNT et SUM, les sous-requêtes et les index pour améliorer les performances.'),
            'draft': self._course(u['python'], 'Atelier Python : projet final', 'Brouillon réservé à l’enseignant.', 'Ce cours brouillon prépare un projet final Python.', False),
        }

    def _resumes(self, c):
        values = {
            'intro_python': 'Python permet de manipuler des variables, conditions, boucles, fonctions et structures de données telles que les listes et les tuples.',
            'relational': 'Les bases relationnelles organisent les données dans des tables liées par des clés primaires et étrangères ; SQL sert à les interroger.',
            'sql': 'Les jointures, agrégations, regroupements, sous-requêtes et index sont les principaux outils du SQL avancé.',
        }
        for key, content in values.items(): Resume.objects.update_or_create(cours=c[key], defaults={'contenu': content})

    def _assignment(self, course, teacher, title, instruction, reference, criteria, deadline, generated=False):
        return Devoir.objects.update_or_create(cours=course, enseignant=teacher, titre=title, defaults={'description': 'Devoir de démonstration à réaliser individuellement.', 'consigne': instruction, 'correction_reference': reference, 'criteres_correction': criteria, 'date_limite': deadline, 'is_published': True, 'is_generated_by_ai': generated})[0]

    def _assignments(self, u, c, today):
        return {
            'python': self._assignment(c['intro_python'], u['python'], 'Listes et tuples', 'Expliquez la différence entre une liste et un tuple en Python, notamment concernant leur modification après création.', 'Une liste est mutable et ses éléments peuvent être modifiés après création. Un tuple est immutable et ses éléments ne peuvent pas être modifiés après création.', PYTHON_CRITERIA, timezone.now() + timedelta(days=12), True),
            'database': self._assignment(c['relational'], u['database'], 'Clé primaire et clé étrangère', "Expliquez le rôle d'une clé primaire et d'une clé étrangère.", 'Une clé primaire identifie chaque ligne de manière unique. Une clé étrangère crée une relation en référençant une clé primaire dans une autre table.', DATABASE_CRITERIA, timezone.now() + timedelta(days=18), False),
        }

    def _submissions(self, u, a):
        examples = [(u['amine'], 'Une liste est mutable : ses éléments peuvent être modifiés. Un tuple est immutable et ne peut pas être modifié.', 'Évaluation : Correcte\n\nPoints corrects : Vous distinguez correctement la mutabilité de la liste et l’immuabilité du tuple.\n\nConseil : Continuez ainsi.', 17), (u['sarra'], 'Une liste utilise des crochets et un tuple utilise des parenthèses.', 'Évaluation : Partiellement correcte\n\nPoints corrects : La différence de syntaxe est exacte.\n\nÀ améliorer : Expliquez aussi la mutabilité.\n\nConseil : Ajoutez que la liste peut être modifiée.', 13), (u['youssef'], 'Un tuple est mutable alors qu’une liste est immutable.', 'Évaluation : Incorrecte\n\nÀ améliorer : Les notions sont inversées.\n\nConseil : Une liste est mutable tandis qu’un tuple est immutable.', 8)]
        for student, answer, feedback, note in examples: Soumission.objects.update_or_create(devoir=a['python'], etudiant=student, defaults={'reponse_texte': answer, 'feedback': feedback, 'note': note})

    def _quiz(self, course, teacher, title, description, deadline, questions, published=True):
        quiz, _ = Quiz.objects.update_or_create(cours=course, enseignant=teacher, titre=title, defaults={'description': description, 'date_limite': deadline, 'is_published': published})
        for order, (text, choices, correct) in enumerate(questions, 1):
            question, _ = Question.objects.update_or_create(quiz=quiz, ordre=order, defaults={'texte': text, 'points': 1})
            for choice in choices: Reponse.objects.update_or_create(question=question, texte=choice, defaults={'est_correcte': choice == correct})
        return quiz

    def _quizzes(self, u, c, today):
        py = [('Quel type Python est mutable ?', ['tuple', 'list', 'str', 'int'], 'list'), ('Quel mot-clé définit une fonction ?', ['def', 'class', 'return', 'import'], 'def'), ('Quel type stocke une séquence immuable ?', ['list', 'dict', 'tuple', 'set'], 'tuple'), ('Quelle boucle parcourt une séquence ?', ['for', 'try', 'with', 'pass'], 'for'), ('Quel symbole commence une liste ?', ['[', '(', '{', '<'], '[')]
        sql = [('Quelle clause relie deux tables ?', ['JOIN', 'ORDER', 'DROP', 'CREATE'], 'JOIN'), ('Quelle fonction compte les lignes ?', ['COUNT', 'SUM', 'INDEX', 'FROM'], 'COUNT'), ('Quelle clause regroupe les résultats ?', ['GROUP BY', 'WHERE', 'SELECT', 'VALUES'], 'GROUP BY'), ('Quel mot-clé filtre les lignes ?', ['WHERE', 'JOIN', 'ALTER', 'GRANT'], 'WHERE'), ('Quel objet améliore certaines recherches ?', ['index', 'tuple', 'view', 'trigger'], 'index')]
        return {'python': self._quiz(c['intro_python'], u['python'], 'Quiz Python — Bases', 'Vérification des fondamentaux Python.', timezone.now() + timedelta(days=16), py), 'sql': self._quiz(c['relational'], u['database'], 'Quiz Bases de données relationnelles', 'Vérification des concepts relationnels et SQL.', timezone.now() + timedelta(days=20), sql), 'draft': self._quiz(c['oop_python'], u['python'], 'Quiz Python — POO (brouillon)', 'Quiz non publié.', timezone.now() + timedelta(days=25), py[:2], False)}

    def _results(self, u, q):
        for student, score in [(u['amine'], 4), (u['sarra'], 5), (u['youssef'], 2)]: Resultat.objects.update_or_create(quiz=q['python'], etudiant=student, defaults={'score': score, 'score_max': 5, 'pourcentage': score * 20})

    def _planning(self, u, c, today):
        plan, _ = PlanningEtude.objects.update_or_create(etudiant=u['amine'], titre='Révisions examens Python et SQL', defaults={'objectif': 'Préparer les examens de fin de semestre.', 'date_debut': today, 'date_fin': today + timedelta(days=14), 'is_generated_by_ai': True})
        sessions = [('Révision variables Python', c['intro_python'], 0, True), ('Conditions et boucles', c['intro_python'], 2, True), ('Fonctions Python', c['intro_python'], 4, False), ('SQL SELECT', c['relational'], 6, False), ('JOIN et relations', c['sql'], 8, False), ('Révision générale', c['intro_python'], 12, False)]
        for order, (title, course, offset, done) in enumerate(sessions, 1): SessionEtude.objects.update_or_create(planning=plan, ordre=order, defaults={'cours': course, 'titre': title, 'description': f'Session de révision : {title}.', 'date_session': today + timedelta(days=offset), 'heure_debut': time(18, 0), 'duree_minutes': 60, 'is_completed': done})
        sarra, _ = PlanningEtude.objects.update_or_create(etudiant=u['sarra'], titre='Plan SQL hebdomadaire', defaults={'objectif': 'Consolider les requêtes SQL avant le contrôle.', 'date_debut': today + timedelta(days=1), 'date_fin': today + timedelta(days=8), 'is_generated_by_ai': False})
        SessionEtude.objects.update_or_create(planning=sarra, ordre=1, defaults={'cours': c['relational'], 'titre': 'Tables et clés', 'description': 'Révision des clés et relations.', 'date_session': today + timedelta(days=2), 'heure_debut': time(17, 30), 'duree_minutes': 45, 'is_completed': False})

    def _counts(self):
        values = [('utilisateurs', User.objects.count()), ('cours', Cours.objects.count()), ('résumés', Resume.objects.count()), ('devoirs', Devoir.objects.count()), ('soumissions', Soumission.objects.count()), ('quiz', Quiz.objects.count()), ('questions', Question.objects.count()), ('réponses', Reponse.objects.count()), ('résultats', Resultat.objects.count()), ('plannings', PlanningEtude.objects.count()), ('sessions', SessionEtude.objects.count())]
        self.stdout.write('\n'.join(f'{name}: {count}' for name, count in values))
