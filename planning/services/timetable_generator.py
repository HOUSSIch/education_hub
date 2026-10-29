"""Safe full-grid Gemini previews for the weekly timetable."""
import json
import logging

from GestionEvenement.gemini import GeminiConfigurationError, GeminiServiceError, generate_json

PLANNING_KEY = 'GEMINI_API_KEY_PLANNING'
logger = logging.getLogger(__name__)


class TimetableGenerationError(Exception):
    pass


def _as_int(value):
    if isinstance(value, bool):
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def _available_cases(payload):
    days = payload.get('jours') if isinstance(payload.get('jours'), list) else []
    hours = payload.get('horaires') if isinstance(payload.get('horaires'), list) else []
    unavailable = {
        (item.get('jour'), item.get('heure_debut'), item.get('heure_fin'))
        for collection in ('creneaux_existants', 'creneaux_verrouilles')
        for item in payload.get(collection, []) if isinstance(item, dict)
    }
    cases = []
    for day in days:
        if not isinstance(day, str):
            continue
        for item in hours:
            if not isinstance(item, dict):
                continue
            start, end = item.get('heure_debut'), item.get('heure_fin')
            key = (day, start, end)
            if isinstance(start, str) and isinstance(end, str) and start < end and key not in unavailable:
                cases.append({'slot_id': len(cases) + 1, 'jour': day, 'heure_debut': start, 'heure_fin': end})
    return cases


def _choose_course(courses, counts, previous_course_id):
    """Round-robin fairly; avoid adjacent repetitions whenever possible."""
    ordered = sorted(courses, key=lambda course: (counts[int(course['id'])], int(course['id'])))
    alternatives = [course for course in ordered if int(course['id']) != previous_course_id]
    return (alternatives or ordered)[0]


def _fill_missing(cases, courses, selected):
    """Complete every unassigned trusted case without persisting anything."""
    selected_by_slot = {item['slot_id']: item for item in selected}
    counts = {int(course['id']): 0 for course in courses}
    for item in selected:
        counts[item['cours_id']] += 1
    previous = None
    completed = []
    for case in cases:
        current = selected_by_slot.get(case['slot_id'])
        if current is None:
            course = _choose_course(courses, counts, previous)
            current = {'slot_id': case['slot_id'], 'cours_id': int(course['id'])}
            counts[current['cours_id']] += 1
        previous = current['cours_id']
        completed.append(current)
    return completed


def _validate_assignments(assignments, courses, cases):
    valid_course_ids = {int(course['id']) for course in courses}
    valid_slot_ids = {case['slot_id'] for case in cases}
    used_slots, selected, ignored = set(), [], 0
    for assignment in assignments:
        if not isinstance(assignment, dict):
            ignored += 1
            continue
        slot_id, course_id = _as_int(assignment.get('slot_id')), _as_int(assignment.get('cours_id'))
        if slot_id not in valid_slot_ids or course_id not in valid_course_ids or slot_id in used_slots:
            ignored += 1
            continue
        used_slots.add(slot_id)
        selected.append({'slot_id': slot_id, 'cours_id': course_id})
    return selected, ignored


def generate_timetable_preview(payload, courses):
    """Produce exactly one proposal per free case, without database writes."""
    courses = [course for course in courses if _as_int(course.get('id'))]
    cases = _available_cases(payload)
    logger.info('Chatty preview input: %d trusted courses, %d free cases.', len(courses), len(cases))
    metadata = {'available_courses_count': len(courses), 'available_cases_count': len(cases)}
    if not courses or not cases:
        return {'creneaux': [], 'ignored_proposals_count': 0, 'fallback_used': False,
                'gemini_proposals_count': 0, **metadata}

    gemini_payload = {
        'cours': [{'id': int(course['id']), 'titre': course['titre'], 'enseignant_id': course['enseignant_id']} for course in courses],
        'cases_disponibles': cases,
    }
    prompt = (
        f"Tu dois proposer exactement un cours pour chacune des {len(cases)} cases disponibles. "
        "Retourne uniquement les affectations JSON. Utilise chaque slot_id une seule fois, seulement les cours fournis, "
        "répartis les cours équitablement, varie les cours et évite la même matière dans deux cases consécutives si possible.\n"
        + json.dumps(gemini_payload, ensure_ascii=False)
    )
    schema = {'type': 'object', 'required': ['affectations'], 'properties': {'affectations': {
        'type': 'array', 'minItems': len(cases), 'maxItems': len(cases), 'items': {'type': 'object',
        'required': ['slot_id', 'cours_id'], 'properties': {'slot_id': {'type': 'integer'}, 'cours_id': {'type': 'integer'}}}}}}
    try:
        result = generate_json(PLANNING_KEY, prompt, schema)
    except (GeminiConfigurationError, GeminiServiceError) as exc:
        raise TimetableGenerationError(str(exc)) from exc
    raw = result.get('affectations') if isinstance(result, dict) else None
    if not isinstance(raw, list):
        raise TimetableGenerationError('La proposition Gemini est invalide.')
    selected, ignored = _validate_assignments(raw, courses, cases)
    fallback_used = len(selected) < len(cases)
    assignments = _fill_missing(cases, courses, selected)
    case_by_id = {case['slot_id']: case for case in cases}
    slots = [{**case_by_id[item['slot_id']], 'cours_id': item['cours_id']} for item in assignments]
    logger.info('Chatty preview output: %d Gemini assignments, %d final slots, fallback=%s.', len(raw), len(slots), fallback_used)
    return {'creneaux': slots, 'ignored_proposals_count': ignored, 'fallback_used': fallback_used,
            'gemini_proposals_count': len(raw), **metadata}
