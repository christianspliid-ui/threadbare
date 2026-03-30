# Kokoro TTS Narration Prototype

> Created 2026-03-23 by Cowork. Prototype-scoped — minimal viable narration to validate the approach.

## Goal

Add optional, in-browser text-to-speech narration to the game using [Kokoro TTS](https://github.com/hexgrad/kokoro) via the [`kokoro-js`](https://www.npmjs.com/package/kokoro-js) npm package. The model runs 100% client-side (no API key, no server, no recurring cost). This is a prototype — the goal is to prove the integration works and sounds good, not to build the full narration system.

## Why Kokoro

- **82M parameter model** — small enough to run in-browser via WASM or WebGPU
- **Apache 2.0 license** — free for any use
- **kokoro-js npm package** — first-class JS/TS support, ESM entry point, works with Vite
- **High quality** — outperforms models 5-15× its size in benchmarks
- **Quantization-resilient** — q8 model is only ~92 MB download with minimal quality loss
- **Streaming support** — async generator API for chunk-by-chunk audio output
- **24 English voices** (10 American female, 9 American male, 4 British female, 4 British male)

## Model Selection for Prototype

| Option | Size | Quality | Recommendation |
|--------|------|---------|----------------|
| fp32 | 326 MB | Best | Too large for browser |
| fp16 | 163 MB | Excellent | Viable but large |
| **q8** | **92 MB** | **Very good** | **Use this for prototype** |
| q4f16 | 154 MB | Good | Larger than q8, less quality |
| q4 | 305 MB | Acceptable | Surprisingly large, skip |

**Device backend:** Use `"wasm"` for broad compatibility. WebGPU is faster but not universally supported yet. The prototype can default to WASM and upgrade to WebGPU when available.

## Voice Selection for Prototype

Pick **one voice** to start. Recommendation: **`bf_emma`** (British female) — fits the Threadbare storybook aesthetic better than the American voices. The narrator should feel like someone reading from an old book.

Alternative: `bm_george` (British male) for a deeper narrator tone.

The prototype should make voice selectable via a constant so we can A/B test easily.

## Architecture

### Integration Point

The narration system hooks into `TickEvent.message` — the same prose text already displayed in the NarrativeLog. No new prose generation needed.

```
TickEvent.message (string)
       ↓
  NarrationService (new)
       ↓
  kokoro-js (in Web Worker)
       ↓
  AudioBuffer → Web Audio API playback
```

### New Files (Prototype Scope)

```
src/services/
  narration/
    NarrationService.ts      — Public API: init, speak, stop, setVoice, setSpeed
    NarrationWorker.ts       — Web Worker that loads kokoro-js and runs inference
    narrationConstants.ts    — Voice ID, speed, model config, feature flag
    useNarration.ts          — React hook for components

src/components/Game/
  NarrationToggle.tsx        — Simple on/off button + voice/speed controls
```

### NarrationService API

```typescript
interface NarrationService {
  /** Load the model (lazy — only on first use) */
  init(): Promise<void>;

  /** Current loading state */
  status: 'idle' | 'loading' | 'ready' | 'error';

  /** Download progress (0-1) during model load */
  loadProgress: number;

  /** Speak text. Cancels any in-progress speech. */
  speak(text: string): Promise<void>;

  /** Stop current speech */
  stop(): void;

  /** Whether currently speaking */
  isSpeaking: boolean;

  /** Change voice (see VOICES constant) */
  setVoice(voiceId: string): void;

  /** Change speed (0.5–2.0) */
  setSpeed(speed: number): void;
}
```

### Web Worker Strategy

**Critical for performance.** Kokoro inference must NOT run on the main thread — it would block the Three.js render loop and UI.

The worker:
1. Imports `kokoro-js` (the package has a web ESM entry point)
2. Loads the ONNX model on first `init` message
3. On `speak` message: runs `tts.generate()` or `tts.stream()`, posts back `Float32Array` audio chunks
4. Main thread plays chunks via `AudioContext`

Vite supports `new Worker(new URL('./NarrationWorker.ts', import.meta.url), { type: 'module' })` out of the box.

### Streaming vs. Batch

For the prototype, **use batch generation** (`tts.generate()`). It's simpler and the prose texts are short (1-3 sentences). Streaming adds complexity for minimal benefit at this text length.

If we later narrate longer passages (encounter vignettes, lore entries), switch to streaming.

### Playback

Use the Web Audio API directly:
```typescript
const ctx = new AudioContext();
const buffer = ctx.createBuffer(1, audioData.length, 24000); // Kokoro outputs 24kHz
buffer.copyToChannel(audioData, 0);
const source = ctx.createBufferSource();
source.buffer = buffer;
source.connect(ctx.destination);
source.start();
```

### What to Narrate (Prototype)

**Primary target: the HexChronicle panel** (`src/components/Game/HexChronicle.tsx`). This is the narrative panel that appears when the player selects a hex, displaying four prose sections: The Land (biome + resource prose), The Soul (sphere influence prose), The People (culture + faction + location prose), and The Ruins (historical culture + etymology + legacy flavor).

This is a much better narration target than individual tick events because:
- The text is rich, atmospheric, and meant to be savored — exactly the content worth hearing aloud
- The player explicitly chose to inspect this hex, so narration isn't unsolicited
- The sections are short enough for batch generation (1-3 paragraphs each)
- It's deterministic per hex, so the same hex always produces the same narration

**Prototype integration:** Add a "narrate" button (speaker icon) to the HexChronicle header. On click, collect the visible prose text from all four sections and send it to the NarrationService. The sections should be concatenated in order (Land → Soul → People → Ruins) with brief pauses between them (achieved by inserting period-space between sections).

**Text extraction:** The HexChronicle already computes prose strings from the layered prose system (BIOME_PROSE, SPHERE_LOCATION_PROSE, CULTURE_LOCATION_PROSE, etc.) and renders them as paragraphs. The narration hook should extract the same text strings before they're wrapped in JSX — not by scraping the DOM, but by calling the same prose functions and concatenating the results.

Alternatively, the simplest approach: pass a `ref` or callback that collects `innerText` from the chronicle's content container. This is pragmatic for a prototype — it reads exactly what the player sees, including dynamically-generated prose. Keep it simple.

Later iterations can add: narrate individual sections on click, auto-narrate on hex selection, narrate NarrativeLog events, narrate encounter vignettes.

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `NARRATION_ENABLED` | `false` | Feature flag — opt-in for prototype |
| `NARRATION_MODEL_ID` | `"onnx-community/Kokoro-82M-v1.0-ONNX"` | HuggingFace model repo |
| `NARRATION_DTYPE` | `"q8"` | Quantization level |
| `NARRATION_DEVICE` | `"wasm"` | Inference backend |
| `NARRATION_VOICE` | `"bf_emma"` | Default narrator voice |
| `NARRATION_SPEED` | `1.0` | Default speaking speed |
| `NARRATION_SAMPLE_RATE` | `24000` | Kokoro output sample rate (Hz) |
| `NARRATION_MAX_TEXT_LENGTH` | `1500` | Max characters per speak() call (HexChronicle can be long) |
| `NARRATION_SECTION_PAUSE` | `". "` | Inserted between chronicle sections for a natural pause |

## Fail-Soft Table

| Failure | Fallback | Notes |
|---------|----------|-------|
| Model download fails | Show "Narration unavailable" toast, disable button | Don't retry automatically — user's bandwidth choice |
| WebGPU unavailable | Fall back to WASM | Handled by kokoro-js device selection |
| WASM fails to initialize | Set status to 'error', disable narration | Log error for diagnostics |
| Worker crashes | Catch error, set status to 'error', allow re-init | Workers can OOM on low-memory devices |
| AudioContext blocked by browser | Prompt user to click (autoplay policy) | Must init AudioContext from user gesture |
| Text exceeds max length | Truncate at sentence boundary | Prevent excessively long inference times |

## PRNG Callouts

None. TTS is deterministic for a given text + voice + speed — no randomness involved.

## Tracing

Not needed for prototype. If we later integrate narration into the tick loop, emit `NarrationTrace` events.

## NFP Compliance Summary

| Priority | Verdict |
|----------|---------|
| 1. Tunability | PASS — all magic numbers in constants table |
| 2. Inspectability | PASS with note — no trace events yet (prototype scope) |
| 3. Determinism | PASS — TTS is deterministic, no PRNG needed |
| 4. Fail-soft | PASS — every failure case has a graceful fallback |
| 5. Narrative over mechanical | PASS — this IS narrative infrastructure |
| 6. Additive over destructive | PASS — purely new code, touches no existing modules |
| 7. Performance budget | PASS — Web Worker isolates inference from render loop |

### Streaming vs. Batch (Revisited for HexChronicle)

HexChronicle text can be longer than individual tick events (potentially 500-1500 chars across all four sections). For the prototype, still **use batch generation** — even at 1500 chars, Kokoro generates audio in a few seconds on WASM, which is acceptable for a "click to narrate" flow. If latency feels too long during testing, switch to streaming for the production version.

## Prototype Acceptance Criteria

1. Player can click a "narrate" speaker icon button in the HexChronicle header
2. First click triggers lazy model download with progress indicator (spinner replaces icon)
3. After model loads, the chronicle prose (all four sections) is spoken aloud in the selected voice
4. Player can stop playback mid-speech (icon toggles to stop/square)
5. Narration is off by default (`NARRATION_ENABLED = false`) — enable with constant flip
6. No impact on game performance (Web Worker isolation verified)
7. Works on Chrome and Firefox (WASM backend)
8. Selecting a different hex while narration is playing stops the current narration

## Out of Scope (Prototype)

- Auto-narration of event stream
- Voice selection UI (just use the constant)
- Queue management for multiple speak() calls
- Offline/service worker caching of the model
- Non-English voice support
- Integration with encounter vignettes or lore panels
