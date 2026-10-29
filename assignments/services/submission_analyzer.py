"""Deterministic validation of a submission against teacher-approved criteria."""

import re
import unicodedata
from itertools import product


class CriteriaValidationError(ValueError):
    """Raised when correction criteria cannot be evaluated safely."""


def normalize_text(value):
    """Normalize text for case-, accent- and punctuation-insensitive matching."""
    if not isinstance(value, str):
        return ''
    normalized = unicodedata.normalize('NFD', value.lower())
    normalized = ''.join(char for char in normalized if unicodedata.category(char) != 'Mn')
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    return re.sub(r'\s+', ' ', normalized).strip()


def _validate_phrase_groups(groups, field_name):
    if not isinstance(groups, list) or not groups:
        raise CriteriaValidationError(f'{field_name} doit contenir au moins un groupe de variantes.')

    cleaned_groups = []
    for group in groups:
        if not isinstance(group, list) or not group:
            raise CriteriaValidationError(f'Chaque groupe de {field_name} doit être une liste non vide.')
        phrases = [phrase.strip() for phrase in group if isinstance(phrase, str) and phrase.strip()]
        if not phrases:
            raise CriteriaValidationError(f'Chaque groupe de {field_name} doit contenir une variante textuelle.')
        cleaned_groups.append(phrases)
    return cleaned_groups


def validate_criteres_correction(criteres_correction, require_non_empty=True):
    """Validate and normalize the teacher-editable JSON correction criteria."""
    if not isinstance(criteres_correction, list):
        raise CriteriaValidationError('criteres_correction doit être une liste.')
    if require_non_empty and not criteres_correction:
        raise CriteriaValidationError('Au moins un critère de correction est obligatoire.')

    cleaned_criteria = []
    for index, criterion in enumerate(criteres_correction, start=1):
        if not isinstance(criterion, dict):
            raise CriteriaValidationError('Chaque critère doit être un objet JSON.')
        description = criterion.get('description')
        if not isinstance(description, str) or not description.strip():
            raise CriteriaValidationError('Chaque critère doit posséder une description non vide.')

        cleaned = {
            'id': criterion.get('id', index),
            'description': description.strip(),
            'concepts_attendus': _validate_phrase_groups(
                criterion.get('concepts_attendus'),
                'concepts_attendus',
            ),
        }

        contradictions = criterion.get('contradictions', [])
        if contradictions:
            cleaned['contradictions'] = _validate_phrase_groups(contradictions, 'contradictions')
        else:
            cleaned['contradictions'] = []
        cleaned_criteria.append(cleaned)
    return cleaned_criteria


def _contains_phrase(normalized_answer, phrase):
    normalized_phrase = normalize_text(phrase)
    if not normalized_phrase:
        return False
    pattern = r'(?<!\w)' + re.escape(normalized_phrase).replace(r'\ ', r'\s+') + r'(?!\w)'
    return re.search(pattern, normalized_answer) is not None


def _group_is_present(normalized_answer, variants):
    return any(_contains_phrase(normalized_answer, variant) for variant in variants)


def _phrase_positions(tokens, phrase):
    phrase_tokens = normalize_text(phrase).split()
    if not phrase_tokens:
        return []
    length = len(phrase_tokens)
    return [
        index
        for index in range(len(tokens) - length + 1)
        if tokens[index:index + length] == phrase_tokens
    ]


def _contradiction_is_present(normalized_answer, phrases):
    """Require a close association, not two unrelated words in one answer."""
    tokens = normalized_answer.split()
    positions = [_phrase_positions(tokens, phrase) for phrase in phrases]
    if any(not matches for matches in positions):
        return False
    return any(
        max(match_positions) - min(match_positions) <= 2
        and all(match_positions[index] <= match_positions[index + 1] for index in range(len(match_positions) - 1))
        for match_positions in product(*positions)
    )


def analyze_submission(answer_text, criteres_correction):
    """Return a deterministic evaluation without calling an AI model."""
    criteria = validate_criteres_correction(criteres_correction)
    normalized_answer = normalize_text(answer_text)
    valid_criteria = []
    missing_criteria = []
    contradictions = []

    for criterion in criteria:
        criterion_is_valid = all(
            _group_is_present(normalized_answer, variants)
            for variants in criterion['concepts_attendus']
        )
        if criterion_is_valid:
            valid_criteria.append(criterion['description'])
        else:
            missing_criteria.append(criterion['description'])

        for contradiction_group in criterion['contradictions']:
            if _contradiction_is_present(normalized_answer, contradiction_group):
                contradictions.append(
                    f"{criterion['description']} — contradiction détectée : {' + '.join(contradiction_group)}."
                )

    if contradictions or not valid_criteria:
        evaluation = 'incorrecte'
    elif not missing_criteria:
        evaluation = 'correcte'
    else:
        evaluation = 'partiellement_correcte'

    return {
        'evaluation': evaluation,
        'criteres_valides': valid_criteria,
        'criteres_manquants': missing_criteria,
        'contradictions': contradictions,
    }
