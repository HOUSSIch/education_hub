"""Gemini formatting for deterministic submission analyses.

The model may only improve the wording. It never chooses the evaluation.
"""

import json
import re
from GestionEvenement.gemini import GeminiConfigurationError, GeminiServiceError, generate_json


ASSIGNMENTS_KEY = 'GEMINI_API_KEY_ASSIGNMENTS'


class FeedbackError(Exception):
    pass


def _resources_for_cpu():
    """Deprecated test seam kept while Gemini replaces local CPU models."""
    return (None, None)


def _prompt(titre_devoir, consigne, reponse, correction_reference, analysis):
    analysis_json = json.dumps(analysis, ensure_ascii=False)
    return f'''Titre du devoir : {titre_devoir}

Consigne :
{consigne}

Correction de référence validée par l'enseignant :
{correction_reference}

Réponse de l'étudiant :
{reponse}

Résultat déterministe du backend :
{analysis_json}

Rédige seulement un feedback clair et pédagogique à partir de ce résultat déterministe.
Tu ne dois jamais choisir, modifier, proposer ou retourner une évaluation. Tu ne donnes aucune note.
Retourne uniquement un objet JSON valide avec exactement ces trois champs :
{{
  "points_corrects": "texte non vide",
  "probleme": "texte non vide",
  "conseil": "texte non vide"
}}

Règles :
- ne valorise que les critères réellement présents dans le résultat déterministe ;
- explique les contradictions ou critères manquants lorsqu'ils existent ;
- pour une réponse entièrement correcte, indique qu'il n'y a aucun problème important ;
- n'invente aucun concept, aucune erreur et aucune note.
'''


def _extract_json_object(result):
    """Return the first complete JSON object from a model response."""
    if not isinstance(result, str):
        raise FeedbackError('Le modele a retourne un JSON de feedback invalide ou incomplet.')
    without_fences = re.sub(r'^\s*```(?:json)?\s*$', '', result, flags=re.MULTILINE)
    decoder = json.JSONDecoder()
    for index, character in enumerate(without_fences):
        if character != '{':
            continue
        try:
            payload, _ = decoder.raw_decode(without_fences[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict):
            return payload
    raise FeedbackError('Le modele a retourne un JSON de feedback invalide ou incomplet.')


def _parse_feedback_json(result):
    """Extract only prose fields; any model-provided evaluation is ignored."""
    try:
        payload = _extract_json_object(result)
    except FeedbackError as exc:
        raise FeedbackError('Le modele a retourne un JSON de feedback invalide ou incomplet.') from exc

    required_fields = ('points_corrects', 'probleme', 'conseil')
    if not isinstance(payload, dict) or any(field not in payload for field in required_fields):
        raise FeedbackError('Le modele a retourne une structure de feedback incomplete.')
    if any(not isinstance(payload[field], str) for field in required_fields):
        raise FeedbackError('Le modele a retourne un champ de feedback invalide.')

    feedback = {field: payload[field].strip() for field in required_fields}
    if not feedback['conseil']:
        raise FeedbackError('Le modele a retourne un champ de feedback vide ou invalide.')
    return feedback


def format_feedback(evaluation, payload):
    labels = {
        'correcte': 'Correcte',
        'partiellement_correcte': 'Partiellement correcte',
        'incorrecte': 'Incorrecte',
    }
    if evaluation not in labels:
        raise FeedbackError('L evaluation déterministe est invalide.')
    return (
        f"Évaluation : {labels[evaluation]}\n\n"
        f"Points corrects :\n{payload['points_corrects']}\n\n"
        f"Point à améliorer :\n{payload['probleme']}\n\n"
        f"Conseil :\n{payload['conseil']}"
    )


def build_fallback_feedback(analysis):
    """Build useful feedback when the remote formatter is unavailable."""
    valid = analysis['criteres_valides']
    missing = analysis['criteres_manquants']
    contradictions = analysis['contradictions']
    payload = {
        'points_corrects': '; '.join(valid) if valid else 'Aucun critère essentiel validé.',
        'probleme': (
            '; '.join(contradictions)
            if contradictions
            else ('; '.join(missing) if missing else 'Aucun problème important.')
        ),
        'conseil': (
            'Revoir les critères indiqués dans la correction du devoir.'
            if contradictions or missing
            else 'La réponse satisfait les critères validés par l’enseignant.'
        ),
    }
    return format_feedback(analysis['evaluation'], payload)


_FEEDBACK_SCHEMA = {'type': 'object', 'required': ['points_corrects', 'probleme', 'conseil'], 'properties': {
    'points_corrects': {'type': 'string'}, 'probleme': {'type': 'string'}, 'conseil': {'type': 'string'}}}


def _generate(prompt, *_unused):
    try:
        return json.dumps(generate_json(ASSIGNMENTS_KEY, prompt, _FEEDBACK_SCHEMA), ensure_ascii=False)
    except (GeminiConfigurationError, GeminiServiceError) as exc:
        raise FeedbackError(str(exc)) from exc


def generer_feedback(titre_devoir, consigne, reponse, correction_reference, analysis):
    if not isinstance(reponse, str) or not reponse.strip():
        raise FeedbackError('La soumission ne contient aucune reponse texte exploitable.')
    if not isinstance(correction_reference, str) or not correction_reference.strip():
        raise FeedbackError('La correction de reference est indisponible.')
    result = _generate(
        _prompt(titre_devoir, consigne, reponse.strip(), correction_reference.strip(), analysis),
    )
    return _parse_feedback_json(result)
