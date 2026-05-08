# TTS Encounter Discovery Report

**Date:** 2026-05-08  
**Issue:** THR-353  
**Scope:** Discovery report for existing narration/TTS stack and encounter UI adapter seam.

## 1. Files Inventory

| File | Role |
|---|---|
| `src/services/narration/NarrationService.ts` | Singleton orchestration layer for init/probe, backend selection, speech supersession, abort/cancel, and playback queueing. |
| `src/services/narration/TtsBackend.ts` | Strategy contract shared by server and worker backends. |
| `src/services/narration/ServerBackend.ts` | Local Python server adapter (`/health` probe + POST synthesis). |
| `src/services/narration/WorkerBackend.ts` | Browser worker adapter (`kokoro-js`) with streaming chunk callbacks. |
| `src/services/narration/NarrationWorker.ts` | Web Worker runtime that initializes the Kokoro model and streams sentence chunks. |
| `src/services/narration/useNarration.ts` | React hook exposing narration state + command surface (`speak`, `speakSections`, `stop`, etc.). |
| `src/services/narration/narrationConstants.ts` | Tunable constants (voice, speed, model id, probe URL, timeouts, etc.). |

## 2. Public API Surface

Exported symbols (copied verbatim from source):

```ts
// src/services/narration/narrationConstants.ts
export const NARRATION_ENABLED = true;
export const NARRATION_TTS_SERVER_URL = 'http://localhost:3001/api/tts';
export const NARRATION_VOICE = 'bm_george';
export const NARRATION_SPEED = 0.87;
export const NARRATION_MAX_TEXT_LENGTH = 1500;
export const NARRATION_SECTION_PAUSE = '. ';
export const NARRATION_WORKER_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const NARRATION_WORKER_DTYPE = 'fp32';
export const NARRATION_WORKER_DEVICE = 'webgpu';
export const NARRATION_SERVER_PROBE_TIMEOUT = 5000;
export const NARRATION_WORKER_SECTION_SILENCE = 0.6;

// src/services/narration/TtsBackend.ts
export type NarrationStatus = 'idle' | 'loading' | 'available' | 'ready' | 'speaking' | 'error';
export interface TtsBackend {
  readonly type: 'server' | 'worker';
  init(onProgress?: (progress: number) => void): Promise<void>;
  generateAudio(
    sections: string[],
    voice: string,
    speed: number,
    signal: AbortSignal,
    onChunk?: (audio: Float32Array, sampleRate: number) => void,
  ): Promise<ArrayBuffer | null>;
  stop(): void;
  dispose(): void;
}

// src/services/narration/ServerBackend.ts
export class ServerBackend implements TtsBackend {
  async init(): Promise<void>
  async generateAudio(
    sections: string[],
    voice: string,
    speed: number,
    signal: AbortSignal,
    _onChunk?: (audio: Float32Array, sampleRate: number) => void,
  ): Promise<ArrayBuffer>
  stop(): void
  dispose(): void
}

// src/services/narration/WorkerBackend.ts
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer
export class WorkerBackend implements TtsBackend {
  async init(onProgress?: (progress: number) => void): Promise<void>
  async generateAudio(
    sections: string[],
    voice: string,
    speed: number,
    _signal: AbortSignal,
    onChunk?: (audio: Float32Array, sampleRate: number) => void,
  ): Promise<ArrayBuffer | null>
  stop(): void
  dispose(): void
}

// src/services/narration/NarrationService.ts
export type { NarrationStatus };
export type NarrationListener = (state: NarrationState) => void;
export interface NarrationState {
  status: NarrationStatus;
  loadProgress: number;
  error: string | null;
  backendType: 'server' | 'worker' | null;
}
export function getNarrationService(): NarrationServiceImpl
export function _resetNarrationService(): void

// src/services/narration/useNarration.ts
export function useNarration()
```

## 3. Cancellation Contract

Cancellation behavior is layered and deterministic:

- `NarrationServiceImpl.speakSections(...)` increments `speakCounter` and writes `currentSpeakId`; this gives every call a monotonic identity and supersedes older calls.
- Before starting a new synthesis call, the previous `abortController` is aborted and a fresh `AbortController` is installed for the new call.
- `stop()` performs three operations in order: playback stop (`stopPlayback()`), in-flight generation cancellation (`abortController?.abort()`), and backend-level stop (`backend?.stop()`).
- `stopPlayback()` clears queued chunks, resets streaming flags, and stops the currently active `AudioBufferSourceNode` if present.
- `useNarration` registers unmount cleanup; if speaking, it calls `stop()`.

Net effect: new speech requests and explicit stop are both idempotent fail-soft cancellation paths; stale async completions are ignored via `id !== currentSpeakId` guards.

## 4. Backend Selection Flow

Current flow in `NarrationService`:

1. `init()` short-circuits if already `loading` or `ready`.
2. If hostname is not localhost/127.0.0.1, status moves to `available` (worker opt-in path).
3. On localhost, `init()` probes the Python server backend (`ServerBackend.init()` against `/health`) and sets `ready` on success.
4. If server probe fails, status downgrades to `available` (feature available but not initialized).
5. `initWorker()` is explicit opt-in; it sets `loading`, downloads/initializes worker backend, then sets `ready`.
6. Worker init failure is fail-soft: warning + status `available` with error text.

## 5. Voice / Speed Conventions

Narration defaults and tunables are centralized in `narrationConstants.ts`:

- `NARRATION_VOICE = 'bm_george'`
- `NARRATION_SPEED = 0.87`
- `NARRATION_WORKER_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'`
- `NARRATION_WORKER_DTYPE = 'fp32'`
- `NARRATION_WORKER_DEVICE = 'webgpu'`

Per-call overrides:

- `speak(text, voice = NARRATION_VOICE, speed = NARRATION_SPEED)`
- `speakSections(sections, voice = NARRATION_VOICE, speed = NARRATION_SPEED)`

`useNarration` currently surfaces `speak(text)` and `speakSections(sections)` without custom override parameters, so call sites use the defaults unless they call the service layer directly.

## 6. Current Call Sites

Verified via `git grep -n "services/narration" -- src`:

- `src/components/Game/HexChronicle.tsx:14` imports `useNarration`.
- `src/components/Game/HexChronicle.tsx:147` consumes `speakSections`, `narrateChronicle`, `stop`, and status flags.
- `src/components/Game/LocationView.tsx:21` imports `useNarration`.
- `src/components/Game/LocationView.tsx:824` consumes `speak`, `stop`, and status flags.
- `src/components/Game/__tests__/EncounterVeil.test.tsx:7` mocks `useNarration` test-side.

No other `src/` files import `services/narration` at this snapshot.

## 7. Encounter-UI Gap Analysis

| Need | Existing support | Gap |
|---|---|---|
| Narrate encounter prose block on open | `speak(text)` via `useNarration` | None |
| Narrate aftermath prose on resolution | `speak(text)` via `useNarration` | None |
| Narrate detail-page prose sections | `speak(text)` (or `speakSections`) | None |
| Cancel on commit/beat transition | `stop()` + supersession via `speakCounter` | None |
| Avoid narration for hover-only tooltips | Caller-level behavior choice | No API gap; policy lives in encounter UI |
| Surface speaking/loading state to encounter UI | `status`, `isSpeaking`, `isLoading`, `error`, `enabled` | None |
| Global narration disable/mute support | `NARRATION_ENABLED` + derived `enabled` | None |

Conclusion: the current narration surface already covers Phase C/D encounter UI needs. A thin adapter seam is enough for now.

## 8. Naming Correction Note

Encounter docs `Docs/plans/2026-05-04-encounter-experience-design-plan.md` and `Docs/plans/2026-05-04-encounter-ui-canonical.md` mention "Kokomoro". The implemented model id is Kokoro (`onnx-community/Kokoro-82M-v1.0-ONNX`) in `src/services/narration/narrationConstants.ts`. This ticket records the discrepancy only; canonical-doc typo correction remains deferred to F3 per plan.

## 9. References

- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md`
- `Docs/plans/2026-05-07-thr-D3-tts-encounter-discovery.md`
- `Docs/plans/2026-04-06-dual-mode-tts-design.md`
- `Docs/plans/2026-04-06-dual-mode-tts-implementation.md`
- `Docs/plans/2026-03-23-kokoro-tts-narration-prototype.md`
- `src/services/narration/NarrationService.ts`
- `src/services/narration/TtsBackend.ts`
- `src/services/narration/ServerBackend.ts`
- `src/services/narration/WorkerBackend.ts`
- `src/services/narration/NarrationWorker.ts`
- `src/services/narration/useNarration.ts`
- `src/services/narration/narrationConstants.ts`