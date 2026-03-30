// ── Narration Constants ─────────────────────────────────────────────
// All magic numbers for the Kokoro TTS narration system.

/** Feature flag — narration button visible in HexChronicle. */
export const NARRATION_ENABLED = true;

/** Local TTS server endpoint (tts-server.py). */
export const NARRATION_TTS_SERVER_URL = 'http://localhost:3001/api/tts';

/** Default narrator voice — British male, deeper storyteller tone. */
export const NARRATION_VOICE = 'bm_george';

/** Default speaking speed (0.5–2.0). Slower for storyteller cadence. */
export const NARRATION_SPEED = 0.87;

/** Max characters per speak() call — prevents excessively long inference. */
export const NARRATION_MAX_TEXT_LENGTH = 1500;

/** Inserted between chronicle sections for a natural pause. */
export const NARRATION_SECTION_PAUSE = '. ';
