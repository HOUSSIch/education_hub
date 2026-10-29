"""Small, lazy wrapper around the official Google Gen AI SDK.

No client is created at Django startup.  Keeping this boundary central makes
keys module-scoped, prevents accidental frontend exposure, and keeps tests
fully mockable.
"""
import json
import logging
import os
from time import perf_counter

logger = logging.getLogger(__name__)
GEMINI_TIMEOUT_MS = 90_000
GEMINI_MAX_ATTEMPTS = 2
MODULE_MODELS = {
    'GEMINI_API_KEY_COURSES': 'GEMINI_MODEL_COURSES',
    'GEMINI_API_KEY_ASSIGNMENTS': 'GEMINI_MODEL_ASSIGNMENTS',
    'GEMINI_API_KEY_QUIZZES': 'GEMINI_MODEL_QUIZZES',
    'GEMINI_API_KEY_PLANNING': 'GEMINI_MODEL_PLANNING',
}


class GeminiConfigurationError(Exception):
    pass


class GeminiServiceError(Exception):
    pass


def get_model_name(api_key_env):
    """Read the model configured for one module, with a safe shared default."""
    return os.getenv(MODULE_MODELS.get(api_key_env, ''), 'gemini-3.5-flash-lite')


def get_thinking_config(api_key_env):
    """Use the thinking option supported by the selected Gemini family."""
    from google.genai import types
    model = get_model_name(api_key_env).casefold()
    if model.startswith('gemini-3'):
        return types.ThinkingConfig(thinking_level='low')
    return types.ThinkingConfig(thinking_budget=0)


def get_gemini_client(api_key_env):
    key = os.getenv(api_key_env)
    if not key:
        logger.warning('%s configurée : NON', api_key_env)
        raise GeminiConfigurationError("La clé Gemini du module n'est pas configurée.")
    try:
        from google import genai
        from google.genai import types
        logger.info('%s configurée : OUI (suffixe ****%s)', api_key_env, key[-4:])
        return genai.Client(api_key=key, http_options=types.HttpOptions(
            timeout=GEMINI_TIMEOUT_MS,
            retry_options=types.HttpRetryOptions(
                attempts=GEMINI_MAX_ATTEMPTS,
                initial_delay=0.5,
                max_delay=1.0,
                http_status_codes=[408, 500, 502, 503, 504],
            ),
        ))
    except GeminiConfigurationError:
        raise
    except Exception as exc:
        raise GeminiServiceError("Le service Gemini est indisponible. Réessayez plus tard.") from exc


def generate_content(api_key_env, prompt, *, response_schema=None, max_output_tokens=None):
    """Return Gemini text, mapping provider/network failures to safe errors."""
    started_at = perf_counter()
    try:
        from google.genai import types
        client = get_gemini_client(api_key_env)
        config = types.GenerateContentConfig(
            temperature=0,
            max_output_tokens=max_output_tokens or (1024 if response_schema is not None else 512),
            thinking_config=get_thinking_config(api_key_env),
        )
        if response_schema is not None:
            config.response_mime_type = 'application/json'
            config.response_json_schema = response_schema
        response = client.models.generate_content(
            model=get_model_name(api_key_env), contents=prompt, config=config,
        )
        text = getattr(response, 'text', None)
        if not isinstance(text, str) or not text.strip():
            raise GeminiServiceError("Gemini n'a retourné aucun contenu exploitable.")
        logger.info('Gemini %s completed with model %s in %.2fs.', api_key_env, get_model_name(api_key_env), perf_counter() - started_at)
        return text.strip()
    except (GeminiConfigurationError, GeminiServiceError):
        raise
    except Exception as exc:
        message = str(exc).lower()
        logger.warning('Gemini %s failed after %.2fs: %s', api_key_env, perf_counter() - started_at, str(exc)[:500])
        if '429' in message or 'quota' in message or 'rate limit' in message:
            raise GeminiServiceError('Le quota Gemini est temporairement atteint. Réessayez plus tard.') from exc
        if '404' in message or 'not_found' in message:
            raise GeminiServiceError('Le modèle Gemini configuré est indisponible pour cette clé.') from exc
        if '403' in message or 'permission_denied' in message:
            raise GeminiServiceError('La clé Gemini ne possède pas les autorisations nécessaires.') from exc
        if 'timeout' in message or 'timed out' in message:
            raise GeminiServiceError("Gemini n'a pas répondu dans le délai prévu.") from exc
        if '503' in message or 'unavailable' in message:
            raise GeminiServiceError('Gemini est temporairement surchargé.') from exc
        raise GeminiServiceError('Le service Gemini est indisponible. Réessayez plus tard.') from exc


def generate_json(api_key_env, prompt, schema, *, max_output_tokens=None):
    text = generate_content(api_key_env, prompt, response_schema=schema, max_output_tokens=max_output_tokens)
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError("Gemini a retourné une structure JSON invalide.") from exc
    if not isinstance(value, dict):
        raise GeminiServiceError("Gemini a retourné une structure JSON invalide.")
    return value
