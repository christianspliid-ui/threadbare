// ── Narration Constants ─────────────────────────────────────────────
// All magic numbers for the Kokoro TTS narration system.
// Flip NARRATION_ENABLED to true to activate the prototype.

/** Feature flag — narration is opt-in for the prototype. */
export const NARRATION_ENABLED = false;

/** HuggingFace model repository for Kokoro 82M. */
export const NARRATION_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

/** Quantization level — q8 is ~92 MB with minimal quality loss. */
export const NARRATION_DTYPE = 'q8';

/** Inference backend — "wasm" for broad compatibility. */
export const NARRATION_DEVICE = 'wasm';

/** Default narrator voice — British female, fits storybook aesthetic. */
export const NARRATION_VOICE = 'bf_emma';

/** Default speaking speed (0.5–2.0). */
export const NARRATION_SPEED = 1.0;

/** Kokoro output sample rate in Hz. */
export const NARRATION_SAMPLE_RATE = 24000;

/** Max characters per speak() call — prevents excessively long inference. */
export const NARRATION_MAX_TEXT_LENGTH = 1500;

/** Inserted between chronicle sections for a natural pause. */
export const NARRATION_SECTION_PAUSE = '. ';
