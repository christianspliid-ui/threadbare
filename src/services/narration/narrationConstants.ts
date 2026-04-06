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

/** ONNX quantization level — q8 is ~92MB, good quality/size tradeoff. */
export const NARRATION_WORKER_DTYPE = 'q8';

/** WASM by default; kokoro-js auto-upgrades to WebGPU if available. */
export const NARRATION_WORKER_DEVICE = 'wasm';

/** Timeout for probing the Python TTS server (ms). */
export const NARRATION_SERVER_PROBE_TIMEOUT = 5000;

/** Silence duration between sections in worker mode (seconds). */
export const NARRATION_WORKER_SECTION_SILENCE = 0.6;
