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

/** HuggingFace model ID for browser-side TTS. */
export const NARRATION_WORKER_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

/** ONNX quantization — fp32 for WebGPU (q8 produces garbled audio on GPU). ~326MB download. */
export const NARRATION_WORKER_DTYPE = 'fp32';

/** WebGPU for ~10x faster inference; kokoro-js auto-falls back to WASM if unavailable. */
export const NARRATION_WORKER_DEVICE = 'webgpu';

/** Timeout for probing the Python TTS server (ms). */
export const NARRATION_SERVER_PROBE_TIMEOUT = 5000;

/** Silence duration between sections in worker mode (seconds). */
export const NARRATION_WORKER_SECTION_SILENCE = 0.6;

// ── Encounter narration (THR-348) ───────────────────────────────────
// Consumed by src/services/narration/encounterNarration.ts, which implements
// the D3 interface spec in Docs/plans/2026-05-05-tts-encounter-ui-spec.md.

/** Canonical encounter narration voice (D3 spec line 2). */
export const ENCOUNTER_NARRATION_VOICE = NARRATION_VOICE;

/** Max paragraphs narrated in one encounter utterance — bounds inference time. */
export const ENCOUNTER_NARRATION_MAX_SECTIONS = 12;

/** Max characters per encounter section before truncation. */
export const ENCOUNTER_NARRATION_MAX_SECTION_LENGTH = NARRATION_MAX_TEXT_LENGTH;
