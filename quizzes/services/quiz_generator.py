"""Strict, small Gemini payloads for generated QCMs."""
import json

from GestionEvenement.gemini import GeminiConfigurationError, GeminiServiceError, generate_json

QUIZZES_KEY = 'GEMINI_API_KEY_QUIZZES'


class QuizGenerationError(Exception):
    pass


def _resources_for_cpu():
    """Legacy mock seam; Gemini is the production generator."""
    return (None, None)


def _build_prompt(course_title, course_content, question_count, existing_questions=None):
    existing = ''
    if existing_questions:
        existing = '\nQuestions déjà utilisées (ne pas les répéter) : ' + json.dumps(existing_questions, ensure_ascii=False)
    return (
        f"À partir du cours suivant, génère exactement {question_count} QCM distincts. "
        "Chaque question a exactement 4 réponses textuelles différentes et un seul index correct entre 0 et 3. "
        "Retourne uniquement le JSON demandé, sans Markdown.\n"
        '{"questions":[{"texte":"...","reponses":["...","...","...","..."],"bonne_reponse_index":0}]}\n'
        f"Titre : {course_title}\nCours : {course_content}{existing}"
    )


def _quiz_schema(question_count):
    return {'type': 'object', 'required': ['questions'], 'properties': {
        'questions': {'type': 'array', 'minItems': question_count, 'maxItems': question_count, 'items': {
            'type': 'object', 'required': ['texte', 'reponses', 'bonne_reponse_index'], 'properties': {
                'texte': {'type': 'string'},
                'reponses': {'type': 'array', 'minItems': 4, 'maxItems': 4, 'items': {'type': 'string'}},
                'bonne_reponse_index': {'type': 'integer', 'minimum': 0, 'maximum': 3},
            },
        }},
    }}


def _generate_raw(prompt, schema=None, *_unused):
    try:
        return json.dumps(generate_json(QUIZZES_KEY, prompt, schema or _quiz_schema(5), max_output_tokens=4096), ensure_ascii=False)
    except (GeminiConfigurationError, GeminiServiceError) as exc:
        raise QuizGenerationError(str(exc)) from exc


def _extract_json(raw_output):
    if not isinstance(raw_output, str) or not raw_output.strip():
        raise QuizGenerationError('La génération IA ne contient aucun JSON exploitable.')
    decoder = json.JSONDecoder()
    for index, character in enumerate(raw_output):
        if character == '{':
            try:
                value, _ = decoder.raw_decode(raw_output[index:])
            except json.JSONDecodeError:
                continue
            if isinstance(value, dict):
                return value
    raise QuizGenerationError('Le JSON produit par l’IA est invalide.')


def _text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise QuizGenerationError(f'{label} doit être un texte non vide.')
    return value.strip()


def _normalise_question(question, position):
    if not isinstance(question, dict):
        raise QuizGenerationError(f'La question {position} est invalide.')
    answers = question.get('reponses')
    if not isinstance(answers, list) or len(answers) != 4:
        raise QuizGenerationError(f'La question {position} doit contenir exactement quatre réponses.')
    correct_index = question.get('bonne_reponse_index')
    if isinstance(correct_index, bool) or not isinstance(correct_index, int) or not 0 <= correct_index < 4:
        raise QuizGenerationError(f"L’index de la bonne réponse de la question {position} est invalide.")
    seen, normalized_answers = set(), []
    for answer in answers:
        answer_text = _text(answer, f'Une réponse de la question {position}')
        key = ' '.join(answer_text.split()).casefold()
        if key in seen:
            raise QuizGenerationError(f'La question {position} contient des réponses identiques.')
        seen.add(key)
        normalized_answers.append(answer_text)
    return {'texte': _text(question.get('texte'), f'Le texte de la question {position}'), 'reponses': normalized_answers, 'bonne_reponse_index': correct_index}


def _unique_questions(questions):
    seen, result = set(), []
    for question in questions:
        if not isinstance(question, dict):
            continue
        text = question.get('texte', '')
        key = ' '.join(text.split()).casefold() if isinstance(text, str) else ''
        if key and key not in seen:
            seen.add(key)
            result.append(question)
    return result


def _validate_questions(questions, requested_count):
    if len(questions) != requested_count:
        raise QuizGenerationError('Le nombre de questions générées ne correspond pas au nombre demandé.')
    normalized = []
    for position, question in enumerate(questions, start=1):
        item = _normalise_question(question, position)
        normalized.append({'texte': item['texte'], 'points': 1, 'reponses': [
            {'texte': answer, 'est_correcte': index == item['bonne_reponse_index']}
            for index, answer in enumerate(item['reponses'])
        ]})
    return normalized


def generate_quiz(course_title, course_content, question_count=5):
    if not isinstance(course_content, str) or not course_content.strip():
        raise QuizGenerationError('Le contenu du cours est vide.')
    if isinstance(question_count, bool) or not isinstance(question_count, int) or not 1 <= question_count <= 10:
        raise QuizGenerationError('Le nombre de questions doit être compris entre 1 et 10.')
    title = course_title.strip() if isinstance(course_title, str) and course_title.strip() else 'le cours'
    first = _extract_json(_generate_raw(_build_prompt(title, course_content.strip(), question_count), _quiz_schema(question_count)))
    questions = _unique_questions(first.get('questions', []))
    if len(questions) < question_count:
        missing = question_count - len(questions)
        existing = [question['texte'] for question in questions if isinstance(question, dict) and isinstance(question.get('texte'), str)]
        extra = _extract_json(_generate_raw(_build_prompt(title, course_content.strip(), missing, existing), _quiz_schema(missing)))
        questions = _unique_questions(questions + extra.get('questions', []))
    normalized_questions = _validate_questions(questions[:question_count], question_count)
    return {'titre': f'Quiz sur {title}', 'description': 'Quiz généré automatiquement à partir du cours.', 'questions': normalized_questions}
