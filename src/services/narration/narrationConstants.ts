// ── Narration Constants ─────────────────────────────────────────────
// All magic numbers for the Kokoro TTS narration system.
// Flip NARRATION_ENABLED to true to activate the prototype.

/** Feature flag — narration is opt-in for the prototype. */
export const NARRATION_ENABLED = true;

/** HuggingFace model repository for Kokoro 82M. */
export const NARRATION_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

/** Quantization level — q8 is ~92 MB with minimal quality loss. */
export const NARRATION_DTYPE = 'q8';

/** Inference backend — "webgpu" for speed, falls back to "wasm" in worker if unsupported. */
export const NARRATION_DEVICE = 'webgpu';

/** Default narrator voice — British male, deeper storyteller tone. */
export const NARRATION_VOICE = 'bm_george';

/** Default speaking speed (0.5–2.0). Slower for storyteller cadence. */
export const NARRATION_SPEED = 0.85;

/** Kokoro output sample rate in Hz. */
export const NARRATION_SAMPLE_RATE = 24000;

/** Max characters per speak() call — shorter = faster inference. */
export const NARRATION_MAX_TEXT_LENGTH = 600;

/** Inserted between chronicle sections for a natural pause. */
export const NARRATION_SECTION_PAUSE = '. ';
