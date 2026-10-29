import json
import logging
from time import perf_counter

from .submission_analyzer import CriteriaValidationError, validate_criteres_correction


from GestionEvenement.gemini import GeminiConfigurationError, GeminiServiceError, generate_json

ASSIGNMENTS_KEY = 'GEMINI_API_KEY_ASSIGNMENTS'
logger = logging.getLogger(__name__)


class AssignmentGenerationError(Exception):
    pass


def _resources_for_cpu():
    """Deprecated test seam kept while Gemini replaces local CPU models."""
    return (None, None)


def _build_prompt(course_title, course_content):
    return f'''Crée un devoir pédagogique français uniquement à partir du cours. Retourne seulement un JSON valide, sans Markdown.
{{"titre":"Question de cours","description":"Objectif du devoir","consigne":"Expliquez une notion du cours.","correction_reference":"Réponse attendue issue du cours.","criteres_correction":[{{"description":"Premier élément attendu","concepts_attendus":["notion", "explication"],"contradictions":[]}},{{"description":"Second élément attendu","concepts_attendus":["notion", "exemple"],"contradictions":[]}}]}}
Remplace toutes les valeurs de cet exemple par du contenu réellement lié au cours. N'utilise jamais une chaîne vide. Produis exactement deux critères courts. Chaque critère contient description, concepts_attendus et contradictions. La correction répond directement à la consigne.

Cours : {course_title}
Contenu : {course_content}'''


_ASSIGNMENT_SCHEMA = {
    'type': 'object', 'required': ['titre', 'description', 'consigne', 'correction_reference', 'criteres_correction'],
    'properties': {
        'titre': {'type': 'string'}, 'description': {'type': 'string'}, 'consigne': {'type': 'string'},
        'correction_reference': {'type': 'string'},
        # Gemini receives a flat, reliable representation; the existing
        # deterministic normalizer converts phrase lists into its nested form.
        'criteres_correction': {'type': 'array', 'minItems': 2, 'items': {'type': 'object', 'required': ['description', 'concepts_attendus', 'contradictions'], 'properties': {
            'description': {'type': 'string'},
            'concepts_attendus': {'type': 'array', 'items': {'type': 'string'}},
            'contradictions': {'type': 'array', 'items': {'type': 'string'}},
        }}},
    },
}


def _generate_raw(prompt, *_unused):
    """Compatibility seam for mocked tests; production uses Gemini structured JSON."""
    try:
        return json.dumps(generate_json(ASSIGNMENTS_KEY, prompt, _ASSIGNMENT_SCHEMA), ensure_ascii=False)
    except (GeminiConfigurationError, GeminiServiceError) as exc:
        raise AssignmentGenerationError(str(exc)) from exc


def _extract_json(raw_output):
    if not isinstance(raw_output, str) or not raw_output.strip():
        raise AssignmentGenerationError('La generation IA ne contient aucun JSON exploitable.')
    decoder = json.JSONDecoder()
    start = raw_output.find('{')
    if start == -1:
        raise AssignmentGenerationError('La generation IA ne contient aucun JSON exploitable.')
    try:
        payload, _ = decoder.raw_decode(raw_output[start:])
    except json.JSONDecodeError as exc:
        raise AssignmentGenerationError('Le JSON produit par l IA est invalide ou tronqué.') from exc
    if not isinstance(payload, dict):
        raise AssignmentGenerationError('Le JSON produit par l IA est invalide.')
    return payload


def _normalise_phrase_groups(value):
    """Accept the small model's flat phrase lists without weakening validation."""
    if isinstance(value, str) and value.strip():
        return [[value.strip()]]
    if not isinstance(value, list):
        return value
    normalized = []
    for item in value:
        if isinstance(item, str) and item.strip():
            normalized.append([item.strip()])
        elif isinstance(item, list):
            normalized.append(item)
        else:
            normalized.append(item)
    return normalized


def _normalise_generated_assignment(payload):
    """Normalize only unambiguous variants to the established assignment schema."""
    if not isinstance(payload, dict):
        return payload
    normalized = dict(payload)
    aliases = {
        'title': 'titre',
        'instruction': 'consigne',
        'correction': 'correction_reference',
        'reference_answer': 'correction_reference',
        'criteres': 'criteres_correction',
        'criteria': 'criteres_correction',
    }
    for source, target in aliases.items():
        if target not in normalized and source in normalized:
            normalized[target] = normalized[source]

    criteria = normalized.get('criteres_correction')
    if isinstance(criteria, dict):
        criteria = [criteria]
    if isinstance(criteria, list):
        clean_criteria = []
        for index, criterion in enumerate(criteria, start=1):
            if not isinstance(criterion, dict):
                clean_criteria.append(criterion)
                continue
            clean = dict(criterion)
            clean.setdefault('id', index)
            if 'concepts_attendus' not in clean and 'concepts' in clean:
                clean['concepts_attendus'] = clean['concepts']
            clean['concepts_attendus'] = _normalise_phrase_groups(clean.get('concepts_attendus'))
            clean['contradictions'] = _normalise_phrase_groups(clean.get('contradictions', []))
            clean_criteria.append(clean)
        normalized['criteres_correction'] = clean_criteria
    return normalized


def _validate_generated_assignment(payload):
    if not isinstance(payload, dict):
        raise AssignmentGenerationError('La structure IA du devoir est invalide.')
    result = {}
    for field in ('titre', 'description', 'consigne', 'correction_reference'):
        value = payload.get(field)
        if not isinstance(value, str) or not value.strip():
            raise AssignmentGenerationError(f'Le champ {field} doit etre un texte non vide.')
        result[field] = value.strip()
    try:
        result['criteres_correction'] = validate_criteres_correction(payload.get('criteres_correction'))
    except CriteriaValidationError as exc:
        raise AssignmentGenerationError('Les critères de correction générés sont invalides.') from exc
    if len(result['criteres_correction']) < 2:
        raise AssignmentGenerationError('La génération IA doit contenir au moins deux critères de correction.')
    return result


def generate_assignment(course_title, course_content):
    if not isinstance(course_content, str) or not course_content.strip():
        raise AssignmentGenerationError('Le contenu du cours est vide.')
    clean_title = course_title.strip() if isinstance(course_title, str) and course_title.strip() else 'le cours'
    started_at = perf_counter()
    raw_output = _generate_raw(_build_prompt(clean_title, course_content.strip()))
    logger.info(
        'Hana assignment generation completed in %.2fs with %d generated characters.',
        perf_counter() - started_at,
        len(raw_output),
    )
    try:
        extracted = _extract_json(raw_output)
        normalized = _normalise_generated_assignment(extracted)
        return _validate_generated_assignment(normalized)
    except AssignmentGenerationError as exc:
        logger.warning('Hana assignment generation validation failed: %s', exc)
        raise
