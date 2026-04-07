# Dual-Mode TTS: Server + Browser Worker

**Date:** 2026-04-06
**Status:** Design
**Goal:** Make Kokoro TTS narration work on Vercel (deployed) by adding a client-side browser worker backend alongside the existing Python GPU server, with automatic fallback and explicit player opt-in for the ~92MB model download.

## Context

The narration system currently calls a local Python TTS server (`tts-server.py` at `localhost:3001`) for GPU-accelerated speech. This works on the developer's machine but not on Vercel where there's no Python backend.

A `NarrationWorker.ts` already exists with full client-side `kokoro-js` inference in a Web Worker, but it was orphaned when the service migrated to the Python server. The npm dependency `kokoro-js@^1.2.1` is already installed.

The browser worker downloads the ~92MB q8 ONNX model from the Hugging Face CDN on first use, caches it in the browser's Cache API, and runs inference entirely client-side via WASM (with automatic WebGPU upgrade when available).

## Architecture

### Strategy Pattern

`NarrationService` uses a `TtsBackend` interface with two implementations:

```
NarrationService (singleton, owns AudioContext + state machine + playback)
  └─ TtsBackend (interface: init, generateAudio, stop, dispose)
       ├─ ServerBackend  → POST to NARRATION_TTS_SERVER_URL (absolute localhost URL)
       └─ WorkerBackend  → Web Worker + kokoro-js from HF CDN
```

### Server Endpoint Strategy

The server backend always uses the **absolute URL** from `NARRATION_TTS_SERVER_URL` (`http://localhost:3001/api/tts`). There is no Vite proxy and no relative `/api/tts` path — the Python server is a separate process on a fixed port, only reachable in local dev. This is intentional: on Vercel there is no server, so the probe fails and the worker backend takes over. No proxy configuration needed.

### Consumer Contract Changes

The `useNarration` hook API **does change** — the review correctly identified that consumers currently gate on `enabled` (the feature flag) rather than backend availability. The new hook contract is defined in the Hook Contract section below. All four UI surfaces and the existing test mock must update to match.

### TtsBackend Interface

```typescript
interface TtsBackend {
  readonly type: 'server' | 'worker';
  init(onProgress?: (progress: number) => void): Promise<void>;
  generateAudio(sections: string[], voice: string, speed: number, signal: AbortSignal): Promise<ArrayBuffer>;
  stop(): void;
  dispose(): void;
}
```

Both backends return a WAV `ArrayBuffer`. NarrationService owns all AudioContext/playback logic (unchanged from current).

### Init Flow

1. `NarrationService.init()` checks the page origin first:
   - If origin hostname is `localhost` or `127.0.0.1` → probe the Python server (`/health`, 5s timeout)
   - **Any other origin** (Vercel, staging, etc.) → **skip the probe entirely**, go straight to step 3. A `fetch` to `http://localhost:3001` from an HTTPS origin is mixed-content-blocked by the browser — it will never succeed and generates console noise.
2. **Server responds** → create `ServerBackend`, status = `ready`
3. **Server unavailable or probe skipped** → status = `available` (worker download offered but not started)
4. **Player clicks opt-in** → `NarrationService.initWorker()` → creates `WorkerBackend` → downloads model with progress callback → status = `ready`

Origin check implementation: `new URL(window.location.href).hostname` against `['localhost', '127.0.0.1']`. Simple string check, no regex.

Once a backend is selected for the session, it stays. No mid-session switching.

### State Machine

```
idle ──init()──► [origin check]
                    │
                    ├─ non-localhost ──────────► available ──opt-in──► loading ──done──► ready ◄──► speaking
                    │                              ▲          │
                    │                              │          │ worker init fails
                    │                              │          ▼
                    │                              │        error (or back to available with retry)
                    │                              │
                    └─ localhost ──► loading ──┬─ server OK ──► ready
                                              │
                                              └─ server unavailable ──► available
```

States:
- `idle` — no backend probed yet
- `loading` — probing server or downloading worker model (progress tracked)
- `available` — no live backend; worker download offered but not started (also set after worker crash — re-enable is fast because model is cached)
- `ready` — a live backend is initialized and can speak. **Invariant:** `status === 'ready'` implies `this.backend !== null` and the backend's `init()` has completed successfully.
- `speaking` — audio playing
- `error` — unrecoverable failure (narration buttons hidden)

## ServerBackend

Extracts the current `fetch` logic from `NarrationService.speakSections()` into a class implementing `TtsBackend`. Sends `POST` to `NARRATION_TTS_SERVER_URL` (absolute `http://localhost:3001/api/tts`) with `{ sections, voice, speed }`, returns the WAV response `ArrayBuffer`.

## WorkerBackend

Wraps the existing `NarrationWorker.ts`:
- Creates worker via `new Worker(new URL('./NarrationWorker.ts', import.meta.url), { type: 'module' })`
- `init()` sends `{ type: 'init', modelId, dtype, device }`, relays `init-progress` to the progress callback
- `generateAudio()` sends `{ type: 'speak', text, voice, speed, id }`, receives `{ type: 'audio', audio: Float32Array, sampleRate, id }`
- Converts `Float32Array` + sampleRate to WAV `ArrayBuffer` (simple PCM WAV header + data)
- Handles `speak-error` and `stopped` messages
- `stop()` — **best-effort, not true cancellation.** `kokoro-js`'s `generate()` has no abort signal; the ONNX inference runs to completion. `stop()` sends `{ type: 'stop' }` to flip the worker's `aborted` flag so it discards the result when inference finishes. The service immediately stops audio playback and returns to `ready` state — the player sees instant stop even though the worker finishes silently in the background. If the worker is iterating over multiple sections, the abort flag prevents subsequent sections from starting.
- Worker `onerror` event → set `available` state (not `ready` — there's no live backend, so `ready` would be a lie; not `error` — a single crash shouldn't permanently disable narration). Clean up worker reference. The player sees the "Enable Voice" opt-in button again. If they click it, `initWorker()` recreates the worker and re-downloads/re-initializes. This is correct because the browser cache likely still has the model — re-init is fast.

For multiple sections, WorkerBackend generates audio for each section individually via the worker's `speak` message, then concatenates the resulting `Float32Array` buffers with configurable silence gaps (`NARRATION_WORKER_SECTION_SILENCE`) between them before encoding the final WAV.

## UI Changes

The narration buttons in `HexChronicle`, `EncounterStage`, `LocationView`, and `TieredEncounterModal` currently render based on `status`. New behavior for the `available` state:

- `available` → show "Enable Voice Narration (~90MB download)" button/link
- `loading` → show progress bar with percentage (works for both server probe and model download)
- `ready` / `speaking` → same as today (play/stop toggle)
- `error` → hide narration buttons entirely (silent degradation)
- `idle` → hidden (same as today)

The opt-in button calls `initWorker()` exposed via `useNarration`.

## Vercel Configuration

Add COOP/COEP headers for optimal WASM multi-threading:

```json
{
  "buildCommand": "vite build",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
      ]
    }
  ]
}
```

Using `credentialless` instead of `require-corp` to avoid breaking cross-origin resources (images, fonts) that may lack explicit CORS headers. If `credentialless` doesn't enable `SharedArrayBuffer`, the WASM runtime falls back to single-threaded mode automatically — slower but functional.

## Fail-Soft Design

Narration is a non-essential enhancement. If anything fails, the game continues with no narration UI visible. No thrown exceptions, no error modals, no console spam beyond a single `console.warn`.

| Failure | Detection | Fallback | Player sees |
|---------|-----------|----------|-------------|
| Deployed origin (non-localhost) | `window.location.hostname` check | Skip server probe entirely, go straight to `available` | "Enable Voice" button (no console noise) |
| Python server not running (localhost) | `/health` probe times out (5s) | Switch to `available`, offer worker | "Enable Voice" button |
| HF CDN blocked (firewall, region) | Worker `init-error` | Stay `available`, show tooltip | "Download failed — check connection" |
| WASM fails to load (old browser) | Worker `init-error` | Set `error`, hide narration UI | Buttons disappear silently |
| COOP/COEP insufficient | WASM detects automatically | Single-threaded fallback | Slower narration, no visible diff |
| WebGPU unavailable | `kokoro-js` handles internally | WASM fallback | Slower inference, transparent |
| Cached model corrupted | Worker `init-error` on reload | Could clear cache and retry | Brief re-download |
| AudioContext blocked (autoplay) | `audioCtx.state === 'suspended'` | `ensureAudioContext()` resumes on gesture | Already handled |
| Mid-speech worker crash | Worker `onerror` event | Set `available`, stop playback, clean up worker. Player can re-enable (cache makes re-init fast). | Audio stops, "Enable Voice" button returns |
| Player stops during inference | `stop()` flips abort flag, suppresses result | Playback stops immediately; worker finishes silently in background | Instant stop response |
| `SharedArrayBuffer` unavailable | WASM runtime detects | Single-threaded mode | Works, just slower |
| Inference slow (low-end device) | No timeout — let it complete | Show loading spinner | Spinner until done |

### Error Logging

All failures log a single `console.warn('[Narration]', ...)` with the error message. No `console.error` (not a crash), no repeated logs, no user-facing error dialogs.

## Constants

New constants in `narrationConstants.ts`:

```typescript
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
```

## Files

| File | Action | What |
|------|--------|------|
| `src/services/narration/TtsBackend.ts` | **New** | Interface definition |
| `src/services/narration/ServerBackend.ts` | **New** | Extract server fetch logic from NarrationService |
| `src/services/narration/WorkerBackend.ts` | **New** | Wrap NarrationWorker with message protocol |
| `src/services/narration/narrationConstants.ts` | **Edit** | Add worker constants |
| `src/services/narration/NarrationService.ts` | **Edit** | Refactor to use TtsBackend, add `available` state, add `initWorker()` |
| `src/services/narration/NarrationWorker.ts` | **No change** | Already correct |
| `src/services/narration/useNarration.ts` | **Edit** | Expose `initWorker()` and `available` state |
| UI components (4 files) | **Edit** | Add "Enable Voice" button for `available` state |
| `vercel.json` | **Edit** | Add COOP/COEP headers |

## Hook Contract (`useNarration`)

The hook return type changes. Current vs new:

```typescript
// ── Current return shape ──
{
  enabled: boolean;      // just NARRATION_ENABLED feature flag
  status: NarrationStatus;
  loadProgress: number;
  error: string | null;
  isSpeaking: boolean;
  isLoading: boolean;
  init: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  speakSections: (sections: string[]) => Promise<void>;
  stop: () => void;
  narrateChronicle: (el: HTMLElement | null) => Promise<void>;
}

// ── New return shape ──
{
  enabled: boolean;        // NARRATION_ENABLED AND (status !== 'error')
  status: NarrationStatus; // now includes 'available'
  backendType: 'server' | 'worker' | null;  // which backend is active
  loadProgress: number;
  error: string | null;
  isSpeaking: boolean;
  isLoading: boolean;
  isAvailable: boolean;    // NEW — true when worker download is offered
  init: () => Promise<void>;
  initWorker: () => Promise<void>;  // NEW — explicit worker opt-in
  speak: (text: string) => Promise<void>;
  speakSections: (sections: string[]) => Promise<void>;
  stop: () => void;
  narrateChronicle: (el: HTMLElement | null) => Promise<void>;
}
```

**Key behavioral changes:**
- `enabled` is now **derived**: `NARRATION_ENABLED && status !== 'error'`. When the feature flag is on but TTS failed irrecoverably, `enabled` becomes false and UI hides buttons.
- `isAvailable` is true when `status === 'available'` — used by UI to show the opt-in download button.
- `init()` still auto-runs on mount. It probes the server; if unavailable, sets `available` (not `error`).
- `initWorker()` is called by the opt-in button to trigger the model download.

### UI Surface Migration

All four components currently destructure `useNarration()` and gate on `enabled`:

| Component | Current pattern | New pattern |
|-----------|----------------|-------------|
| `HexChronicle.tsx:145` | `{ enabled: narrationEnabled, isLoading, isSpeaking, narrateChronicle, stop }` | Add `isAvailable, initWorker`. Show download button when `isAvailable`. |
| `LocationView.tsx:805` | `{ enabled: narrationEnabled, isLoading, isSpeaking, speak, stop }` | Same additions. |
| `EncounterStage.tsx:134` | `{ enabled: narrationEnabled, isLoading, isSpeaking, speak, stop }` | Same additions. |
| `TieredEncounterModal.tsx:614` | `{ isSpeaking, narrateChronicle, stop, enabled }` | Same additions. |

Each surface gets a small conditional block: when `isAvailable`, render the opt-in button with download size. When `isLoading`, show progress bar. The existing play/stop logic stays unchanged for `ready`/`speaking` states.

### Test Mock Update

`EncounterStage.test.tsx:10-16` mocks `useNarration` with the old shape. Must add `isAvailable: false`, `initWorker: vi.fn()`, `backendType: null` to the mock. Any other test files mocking this hook need the same update.

## What Doesn't Change

- `NarrationWorker.ts` (already correct)
- Audio playback logic (stays in NarrationService)
- Voice/speed configuration
- `narrateChronicle()` DOM text extraction
- Feature flag constant (`NARRATION_ENABLED` still exists, now feeds into derived `enabled`)

## Wiring

### Service ↔ Backend

| Surface | Connection |
|---------|-----------|
| `NarrationService.init()` | Checks origin: localhost → probe `NARRATION_TTS_SERVER_URL/health`; non-localhost → skip probe. Either way, failure/skip sets `available` state |
| `NarrationService.initWorker()` | Creates `WorkerBackend`, sends `init` to worker, relays progress |
| `NarrationService.speakSections()` | Delegates to `backend.generateAudio()`, plays returned WAV |
| `NarrationService.stop()` | Calls `backend.stop()` (best-effort), stops AudioContext playback |

### Hook ↔ Service

| Surface | Connection |
|---------|-----------|
| `useNarration().init` | Calls `service.init()` on mount (auto-probe) |
| `useNarration().initWorker` | Calls `service.initWorker()` (explicit opt-in) |
| `useNarration().enabled` | Derived: `NARRATION_ENABLED && status !== 'error'` |
| `useNarration().isAvailable` | `status === 'available'` |
| State subscription | `service.subscribe()` → `setState()` (existing pattern, unchanged) |

### UI ↔ Hook

| Component | Narration UI | Gate |
|-----------|-------------|------|
| `HexChronicle` | Per-section narrate buttons + opt-in + progress | `enabled && status !== 'idle'` (visible for `available`, `loading`, `ready`, `speaking`; hidden for `idle` and `error`) |
| `LocationView` | Prose narrate button + opt-in + progress | Same |
| `EncounterStage` | Step narrate button + opt-in + progress | Same |
| `TieredEncounterModal` | `NarrateButton` component + opt-in + progress | Same |

The gate is expressed as "visible for every state except `idle` and `error`" — this ensures the progress bar remains visible during both the initial server probe (`loading`) and the model download (`loading` after opt-in).

### Vercel ↔ Headers

| Surface | Connection |
|---------|-----------|
| `vercel.json` headers | COOP/COEP for `SharedArrayBuffer` → WASM multi-threading |
| Fallback if insufficient | Single-threaded WASM, transparent to player |

### Debug Visibility

- `backendType` exposed on hook return — visible in React DevTools
- `console.warn('[Narration] ...')` on all failures — visible in browser console and debug panel console tab
- No new trace types (narration is not part of the engine tick loop)

### Tests

| Test file | What changes |
|-----------|-------------|
| `EncounterStage.test.tsx` | Update `useNarration` mock with new fields (`isAvailable`, `initWorker`, `backendType`) |
| Any other `useNarration` mocks | Same mock shape update |
| New: `WorkerBackend` unit test | Message protocol: init → progress → done, speak → audio, stop → suppression |
| New: `ServerBackend` unit test | Fetch mock: success → WAV, server down → throw, abort → no-op |
| New: `NarrationService` integration test | Dual-mode: server available → ServerBackend, server down → available state, initWorker → WorkerBackend |

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — all new values are named constants |
| 2 | Inspectability | PASS — `console.warn` on failures, backend type visible in service state |
| 3 | Determinism | N/A — TTS is non-deterministic by nature, doesn't affect game state |
| 4 | Fail-soft | PASS — comprehensive fail-soft table, silent degradation, no crashes |
| 5 | Narrative over mechanical | PASS — narration enhances narrative |
| 6 | Additive | PASS — adds WorkerBackend and interface, refactors service internals only |
| 7 | Performance budget | PASS — worker runs off main thread, no impact on render loop |
