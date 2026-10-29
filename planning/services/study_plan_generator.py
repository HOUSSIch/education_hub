import json
import re
from datetime import date, datetime, time, timedelta
from math import ceil
from GestionEvenement.gemini import GeminiConfigurationError, GeminiServiceError, generate_json


PLANNING_KEY = 'GEMINI_API_KEY_PLANNING'


class StudyPlanGenerationError(Exception):
    """Erreur contrôlée produite par le service de génération de planning."""


def _resources_for_cpu():
    """Deprecated test seam kept for the legacy personal-planning API."""
    return (None, None)


def _coerce_date(value, label):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError as exc:
            raise StudyPlanGenerationError(f'{label} est invalide.') from exc
    raise StudyPlanGenerationError(f'{label} est invalide.')


def _required_text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise StudyPlanGenerationError(f'{label} doit être un texte non vide.')
    return value.strip()


def _validate_courses(courses):
    if not isinstance(courses, list) or not courses:
        raise StudyPlanGenerationError('Au moins un cours disponible est requis.')
    normalized_courses = []
    course_ids = set()
    for course in courses:
        if not isinstance(course, dict) or isinstance(course.get('id'), bool) or not isinstance(course.get('id'), int):
            raise StudyPlanGenerationError('Chaque cours doit posséder un identifiant entier valide.')
        if course['id'] in course_ids:
            raise StudyPlanGenerationError('Les identifiants de cours disponibles doivent être uniques.')
        course_ids.add(course['id'])
        normalized_courses.append(
            {
                'id': course['id'],
                'titre': _required_text(course.get('titre'), 'Le titre du cours'),
                'description': course.get('description', '') if isinstance(course.get('description', ''), str) else '',
            }
        )
    return normalized_courses, course_ids


def _session_count(start_date, end_date, sessions_per_week):
    period_days = (end_date - start_date).days + 1
    return min(30, max(1, ceil(period_days * sessions_per_week / 7)))


def _build_prompt(objective, start_date, end_date, courses, session_count):
    courses_text = '\n'.join(
        f"ID {course['id']} = {course['titre']} : {course['description']}" for course in courses
    )
    return (
        'Crée un planning pédagogique réaliste à partir de l’objectif et des cours disponibles. '
        f'Génère exactement {session_count} sessions, sans jamais dépasser les dates demandées. '
        'Utilise uniquement les cours fournis et leurs vrais cours_id. Répartis les sessions entre les cours, '
        'espace-les raisonnablement et évite de surcharger une seule journée. Chaque durée doit être comprise '
        'entre 20 et 180 minutes. Répartis les séances sur toute la période demandée et ne concentre pas '
        'toutes les séances sur les premiers jours. Respecte approximativement le nombre de séances par semaine '
        'demandé. Réponds uniquement avec un objet JSON, sans explication avant ou après.\n\n'
        'Structure JSON obligatoire :\n'
        '{"titre":"...","objectif":"...","sessions":[{"cours_id":3,"titre":"...",'
        '"description":"...","date_session":"YYYY-MM-DD","heure_debut":"HH:MM",'
        '"duree_minutes":60,"ordre":1}]}\n\n'
        f'Objectif étudiant : {objective}\n'
        f'Période : du {start_date.isoformat()} au {end_date.isoformat()}\n'
        f'Cours disponibles :\n{courses_text}'
    )


_STUDY_PLAN_SCHEMA = {'type': 'object', 'required': ['titre', 'objectif', 'sessions'], 'properties': {
    'titre': {'type': 'string'}, 'objectif': {'type': 'string'}, 'sessions': {'type': 'array', 'items': {'type': 'object'}}}}


def _generate_raw(prompt, *_unused):
    try:
        return json.dumps(generate_json(PLANNING_KEY, prompt, _STUDY_PLAN_SCHEMA), ensure_ascii=False)
    except (GeminiConfigurationError, GeminiServiceError) as exc:
        raise StudyPlanGenerationError(str(exc)) from exc


def _extract_json(raw_output):
    if not isinstance(raw_output, str) or not raw_output.strip():
        raise StudyPlanGenerationError('La génération IA ne contient aucun JSON exploitable.')
    decoder = json.JSONDecoder()
    for index, character in enumerate(raw_output):
        if character != '{':
            continue
        try:
            value, _ = decoder.raw_decode(raw_output[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    raise StudyPlanGenerationError('Le JSON produit par l’IA est invalide.')


def _distributed_dates(start_date, end_date, session_count):
    total_days = (end_date - start_date).days + 1
    if session_count == 1:
        return [start_date]
    return [
        start_date + timedelta(days=round(index * (total_days - 1) / (session_count - 1)))
        for index in range(session_count)
    ]


def _normalize_schedule(sessions, start_date, end_date):
    distributed_dates = _distributed_dates(start_date, end_date, len(sessions))
    sessions_by_day = {}
    for session, session_date in zip(sessions, distributed_dates):
        session['date_session'] = session_date
        sessions_by_day.setdefault(session_date, []).append(session)

    for session_date, daily_sessions in sessions_by_day.items():
        if len(daily_sessions) == 1:
            continue
        next_available = datetime.combine(session_date, time(9, 0))
        for session in daily_sessions:
            session['heure_debut'] = next_available.time()
            next_available += timedelta(minutes=session['duree_minutes'] + 30)
            if next_available.date() != session_date:
                raise StudyPlanGenerationError('Les sessions ne peuvent pas être réparties sans chevauchement.')

    sessions.sort(key=lambda session: (session['date_session'], session['heure_debut']))
    return sessions


def _validate_generated_plan(payload, start_date, end_date, allowed_course_ids, expected_count):
    if not isinstance(payload, dict):
        raise StudyPlanGenerationError('La structure IA du planning est invalide.')
    title = _required_text(payload.get('titre'), 'Le titre du planning')
    objective = _required_text(payload.get('objectif'), 'L’objectif du planning')
    sessions = payload.get('sessions')
    if not isinstance(sessions, list) or not sessions:
        raise StudyPlanGenerationError('Le planning doit contenir au moins une session.')
    if len(sessions) > 30 or len(sessions) != expected_count:
        raise StudyPlanGenerationError('Le nombre de sessions générées est invalide.')

    normalized_sessions = []
    seen_sessions = set()
    for index, session in enumerate(sessions, start=1):
        if not isinstance(session, dict):
            raise StudyPlanGenerationError(f'La session {index} est invalide.')
        course_id = session.get('cours_id')
        if isinstance(course_id, bool) or not isinstance(course_id, int) or course_id not in allowed_course_ids:
            raise StudyPlanGenerationError(f'La session {index} utilise un cours non autorisé.')
        session_date = _coerce_date(session.get('date_session'), f'La date de la session {index}')
        if not start_date <= session_date <= end_date:
            raise StudyPlanGenerationError(f'La session {index} est hors de la période demandée.')
        time_value = session.get('heure_debut')
        if not isinstance(time_value, str) or not re.fullmatch(r'\d{2}:\d{2}', time_value):
            raise StudyPlanGenerationError(f"L'heure de la session {index} est invalide.")
        try:
            session_time = datetime.strptime(time_value, '%H:%M').time()
        except ValueError as exc:
            raise StudyPlanGenerationError(f"L'heure de la session {index} est invalide.") from exc
        duration = session.get('duree_minutes')
        if isinstance(duration, bool) or not isinstance(duration, int) or not 20 <= duration <= 180:
            raise StudyPlanGenerationError(f'La durée de la session {index} doit être comprise entre 20 et 180 minutes.')
        session_title = _required_text(session.get('titre'), f'Le titre de la session {index}')
        description = session.get('description', '')
        if not isinstance(description, str):
            raise StudyPlanGenerationError(f'La description de la session {index} est invalide.')
        duplicate_key = (course_id, session_title.casefold(), session_date, session_time, duration)
        if duplicate_key in seen_sessions:
            raise StudyPlanGenerationError(f'La session {index} est dupliquée.')
        seen_sessions.add(duplicate_key)
        normalized_sessions.append(
            {
                'cours_id': course_id,
                'titre': session_title,
                'description': description.strip(),
                'date_session': session_date,
                'heure_debut': session_time,
                'duree_minutes': duration,
            }
        )

    normalized_sessions = _normalize_schedule(normalized_sessions, start_date, end_date)
    return {
        'titre': title,
        'objectif': objective,
        'sessions': [
            {
                **session,
                'date_session': session['date_session'].isoformat(),
                'heure_debut': session['heure_debut'].strftime('%H:%M'),
                'ordre': order,
            }
            for order, session in enumerate(normalized_sessions, start=1)
        ],
    }


def generate_study_plan(objectif, date_debut, date_fin, cours, sessions_per_week=5):
    """Génère un dictionnaire de planning validé sans aucun accès à la base de données."""
    clean_objective = _required_text(objectif, 'L’objectif')
    start_date = _coerce_date(date_debut, 'La date de début')
    end_date = _coerce_date(date_fin, 'La date de fin')
    if end_date < start_date:
        raise StudyPlanGenerationError('La date de fin doit être postérieure ou égale à la date de début.')
    if isinstance(sessions_per_week, bool) or not isinstance(sessions_per_week, int) or not 1 <= sessions_per_week <= 14:
        raise StudyPlanGenerationError('Le nombre de sessions par semaine doit être compris entre 1 et 14.')
    normalized_courses, allowed_course_ids = _validate_courses(cours)
    expected_count = _session_count(start_date, end_date, sessions_per_week)
    raw_output = _generate_raw(
        _build_prompt(clean_objective, start_date, end_date, normalized_courses, expected_count),
    )
    return _validate_generated_plan(_extract_json(raw_output), start_date, end_date, allowed_course_ids, expected_count)
