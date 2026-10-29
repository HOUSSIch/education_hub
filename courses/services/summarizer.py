"""Gemini-based French summarization; legacy text cleanup helpers remain pure."""

from __future__ import annotations

import re
from threading import Lock
from GestionEvenement.gemini import GeminiConfigurationError, GeminiServiceError, generate_content


COURSES_KEY = 'GEMINI_API_KEY_COURSES'
INPUT_TOKEN_BUDGET = 896
MAX_NEW_TOKENS = 192
MIN_NEW_TOKENS = 48
FINAL_SUMMARY_TOKEN_BUDGET = 320
_STOP_WORDS = {
    'avec', 'aussi', 'cela', 'cette', 'comme', 'dans', 'des', 'elle', 'elles',
    'leur', 'leurs', 'mais', 'pour', 'plus', 'sont', 'sous', 'sur', 'tous',
    'toute', 'toutes', 'une', 'votre', 'vous', 'être', 'afin', 'alors', 'avant',
    'aux', 'ces', 'cet', 'cette', 'chaque', 'chez', 'dans', 'dont', 'entre',
    'est', 'ils', 'les', 'leurs', 'lors', 'par', 'pas', 'peut', 'plus', 'que',
    'qui', 'ses', 'son', 'sont', 'sur', 'the', 'une', 'vers', 'voici',
}
_resources = None
_resource_lock = Lock()


class SummarizationError(Exception):
    """A controlled error safe to expose through the API."""


class ModelLoadError(SummarizationError):
    pass


class GenerationError(SummarizationError):
    pass


def _get_resources():
    """Legacy test seam; no model is loaded locally anymore."""
    return (None, None)


def _max_input_tokens(tokenizer, model):
    configured_limit = getattr(model.config, 'max_position_embeddings', INPUT_TOKEN_BUDGET + 2)
    return max(64, min(INPUT_TOKEN_BUDGET, configured_limit - 2))


def _sentences(text):
    """Split prose on sentence boundaries without an additional NLP dependency."""
    normalized = re.sub(r'\s+', ' ', text).strip()
    return [sentence.strip() for sentence in re.split(r'(?<=[.!?…])\s+', normalized) if sentence.strip()]


def _token_length(text, tokenizer):
    return len(tokenizer.encode(text, add_special_tokens=False))


def _split_overlong_sentence(sentence, tokenizer, max_tokens):
    """Only split inside a sentence when that sentence alone exceeds the limit."""
    token_ids = tokenizer.encode(sentence, add_special_tokens=False)
    return [
        tokenizer.decode(token_ids[index:index + max_tokens], skip_special_tokens=True).strip()
        for index in range(0, len(token_ids), max_tokens)
        if token_ids[index:index + max_tokens]
    ]


def _sentence_token_chunks(text, tokenizer, max_tokens):
    """Build model-safe chunks while preserving complete sentences whenever possible."""
    chunks, current = [], []
    current_tokens = 0
    for sentence in _sentences(text):
        sentence_tokens = _token_length(sentence, tokenizer)
        if sentence_tokens > max_tokens:
            if current:
                chunks.append(' '.join(current))
                current, current_tokens = [], 0
            chunks.extend(_split_overlong_sentence(sentence, tokenizer, max_tokens))
            continue
        separator_tokens = 1 if current else 0
        if current and current_tokens + separator_tokens + sentence_tokens > max_tokens:
            chunks.append(' '.join(current))
            current, current_tokens = [sentence], sentence_tokens
        else:
            current.append(sentence)
            current_tokens += separator_tokens + sentence_tokens
    if current:
        chunks.append(' '.join(current))
    return chunks


def _collapse_obvious_repetitions(text):
    """Remove only adjacent duplicate sentences and obvious repeated word groups."""
    text = re.sub(r'(?i)\b[ée]clairage\.\s*', '', text)
    text = re.sub(r'(?:---\s*)?(?:#+\s*)?\b\d+\.\s*', '', text)
    unique_sentences = []
    previous = None
    for sentence in _sentences(text):
        comparable = re.sub(r'\W+', ' ', sentence.casefold()).strip()
        if comparable and comparable != previous:
            unique_sentences.append(sentence)
        previous = comparable
    cleaned = ' '.join(unique_sentences) or re.sub(r'\s+', ' ', text).strip()
    # A frequent decoding artefact is a short phrase repeated three or more
    # times in succession (for example: "école de commerce" x3).
    return re.sub(
        r'(?P<phrase>\b[\wÀ-ÿ]+(?:\s+[\wÀ-ÿ]+){0,5})(?:,\s*(?P=phrase)){2,}',
        r'\g<phrase>',
        cleaned,
        flags=re.IGNORECASE,
    )


def _meaningful_terms(text):
    return {
        word.casefold()
        for word in re.findall(r"[\wÀ-ÿ'-]+", text)
        if len(word) >= 3 and word.casefold() not in _STOP_WORDS
    }


def _filter_ungrounded_sentences(text, source_text, allow_empty=False):
    """Keep model sentences tied to the source instead of generic additions."""
    source_terms = _meaningful_terms(source_text)
    if not source_terms:
        return text

    grounded = []
    for sentence in _sentences(text):
        terms = _meaningful_terms(sentence)
        overlap = len(terms & source_terms)
        # Short factual sentences need one source term; longer sentences must
        # substantially overlap the source vocabulary.
        if terms and (overlap >= 1 if len(terms) <= 3 else overlap / len(terms) >= 0.5):
            grounded.append(sentence)
    if not grounded:
        if allow_empty:
            return ''
        raise GenerationError('Le modele n a produit aucun resume suffisamment lie au cours.')
    return ' '.join(grounded)


def _complete_last_sentence(text, source_text=None):
    """Never expose a partial trailing sentence produced at the token limit."""
    cleaned = _collapse_obvious_repetitions(text).strip()
    if source_text is not None:
        cleaned = _filter_ungrounded_sentences(cleaned, source_text)
    if not cleaned:
        raise GenerationError('Le modele n a produit aucun resume exploitable.')
    if re.search(r'[.!?…][”»]?$', cleaned):
        return cleaned
    last_end = max(cleaned.rfind('.'), cleaned.rfind('!'), cleaned.rfind('?'), cleaned.rfind('…'))
    if last_end >= 0:
        completed = cleaned[:last_end + 1].strip()
        if completed:
            return completed
    # Rare fallback for an otherwise complete clause without punctuation.
    return f'{cleaned}.'


def _summarize_block(text, tokenizer, model, max_tokens):
    raise GenerationError('Le modèle local de résumé a été remplacé par Gemini.')


def _reduce_summaries(summaries, tokenizer, model, max_tokens):
    """Synthesize only when the fused summaries are still too long to keep."""
    current = summaries
    while len(current) > 1:
        merged = _complete_last_sentence(' '.join(current))
        # A compact fusion already preserves information from every source
        # block. Running it through the model again would needlessly discard
        # topics, particularly with a short course made of several sections.
        if _token_length(merged, tokenizer) <= min(FINAL_SUMMARY_TOKEN_BUDGET, max_tokens):
            return merged
        groups = _sentence_token_chunks(merged, tokenizer, max_tokens)
        next_summaries = [_summarize_block(group, tokenizer, model, max_tokens) for group in groups]
        current = [summary for summary in next_summaries if summary]
        if not current:
            return merged
    return current[0]


def generer_resume(texte):
    """Generate a non-persistent Gemini proposal; persistence remains view-owned."""
    if not isinstance(texte, str) or not texte.strip():
        raise SummarizationError('Le cours ne contient aucun texte exploitable.')
    prompt = (
        "Résume le cours suivant en français. Le résumé doit être structuré, fidèle, "
        "nettement plus court, en phrases complètes et ne rien inventer.\n\nCours :\n" + texte.strip()
    )
    try:
        result = generate_content(COURSES_KEY, prompt)
    except (GeminiConfigurationError, GeminiServiceError) as exc:
        raise GenerationError(str(exc)) from exc
    return _complete_last_sentence(result, source_text=texte)
