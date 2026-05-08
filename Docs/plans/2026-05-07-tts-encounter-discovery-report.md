---
status: current
title: TTS Encounter Discovery Report
date: 2026-05-07
linear: THR-353
parent_plan: 2026-05-07-thr-D3-tts-encounter-discovery.md
phasing_plan: 2026-05-05-encounter-ui-implementation-phasing.md
---

# TTS Encounter Discovery Report (2026-05-07)

**Purpose.** Document the existing narration / TTS infrastructure under `src/services/narration/` so the encounter UI components introduced in Phase C/D can call narration through a single, stable seam (`useEncounterNarration`). H3 (post-v1) consumes this discovery + the 5-line interface to wire encounter prose, beat narration, and detail-page prose to the same backbone the chronicle and location prose already use.

**Scope.** This is the discovery half of THR-353. The seam itself ships in `src/services/narration/encounterNarration.ts` (a thin pass-through re-export of `useNarration`); no encounter-UI component is wired in this ticket — wiring is H3.

---

## 1. Files inventory

All paths relative to repository root.

| File | Role | Lines |
|---|---|---|
| `src/services/narration/NarrationService.ts` | Singleton service. Owns `AudioContext`, backend selection, listener notification, chunk queue for streaming playback, abort plumbing. Exports `getNarrationService()`, `_resetNarrationService()` (test only), and the `NarrationState` / `NarrationListener` / `NarrationStatus` types. | 348 |
| `src/services/narration/TtsBackend.ts` | Strategy interface. Defines `TtsBackend` (`type`, `init`, `generateAudio`, `stop`, `dispose`) and `NarrationStatus` union (`'idle' \| 'loading' \| 'available' \| 'ready' \| 'speaking' \| 'error'`). | 18 |
| `src/services/narration/ServerBackend.ts` | Implements `TtsBackend` against the local Python TTS server (`tts-server.py`) at `NARRATION_TTS_SERVER_URL`. Single-shot WAV response — no streaming. Cancellation via `AbortSignal` on the `fetch`. | 47 |
| `src/services/narration/WorkerBackend.ts` | Implements `TtsBackend` against a Web Worker running `kokoro-js` (ONNX). Streaming: posts `audio-chunk` messages per sentence, joined into the `NarrationService` chunk queue. Also exports `encodeWav` (Float32 PCM → WAV `ArrayBuffer`). Best-effort `stop()` flips a worker-side aborted flag; main thread cuts playback instantly. | 185 |
| `src/services/narration/NarrationWorker.ts` | The `kokoro-js` worker entrypoint. Receives `init` / `speak` / `stop` messages, posts back `init-progress` / `init-done` / `audio-chunk` / `audio-done` / `speak-error` / `stopped`. | (worker) |
| `src/services/narration/useNarration.ts` | React hook. Subscribes to `NarrationService` state, runs `init()` on mount, stops playback on unmount, and exposes the current public surface — see §2. | 105 |
| `src/services/narration/narrationConstants.ts` | All tunable constants — feature flag, server URL, voice, speed, max text length, section pause, worker model id / dtype / device, server probe timeout, worker section silence. | 36 |
| `src/services/narration/__tests__/NarrationService.test.ts` | Service-level unit tests (status transitions, listener notification, abort plumbing, chunk-queue ordering). | (tests) |
| `src/services/narration/__tests__/ServerBackend.test.ts` | ServerBackend unit tests. | (tests) |
| `src/services/narration/__tests__/WorkerBackend.test.ts` | WorkerBackend unit tests. | (tests) |

---

## 2. Public API surface

The encounter UI consumes narration through the React hook `useNarration()`. The full hook return — verified against [src/services/narration/useNarration.ts:88-103](src/services/narration/useNarration.ts) — is:

```ts
{
  enabled: boolean;            // NARRATION_ENABLED flag AND status !== 'error'
  status: NarrationStatus;     // 'idle' | 'loading' | 'available' | 'ready' | 'speaking' | 'error'
  backendType: 'server' | 'worker' | null;
  loadProgress: number;        // 0..1 — model download progress (worker) or server probe (server)
  error: string | null;
  isSpeaking: boolean;         // status === 'speaking'
  isLoading: boolean;          // status === 'loading'
  isAvailable: boolean;        // status === 'available'
  init: () => Promise<void>;            // Probes server on localhost; sets 'available' otherwise
  initWorker: () => Promise<void>;      // Opt-in: downloads ~92MB Kokoro model to browser
  speak: (text: string) => Promise<void>;
  speakSections: (sections: string[]) => Promise<void>;
  stop: () => void;
  narrateChronicle: (containerEl: HTMLElement | null) => Promise<void>;
}
```

The four fields encounter UI cares about for v1 are `enabled`, `isSpeaking`, `speak`, and `stop`. Everything else is plumbing for the chronicle's UX (download gating, progress UI, sectioned playback, container scraping). H3 may extend the encounter seam to consume more of these later (e.g. `speakSections` for per-beat sequencing) — see §7.

---

## 3. Cancellation contract

Three layers of cancellation, top to bottom:

1. **`useNarration().stop()`** — calls `NarrationService.stop()`. Synchronous from the caller's perspective. Status flips to `'ready'` immediately. Subsequent `speak()` calls are accepted normally.
2. **`NarrationService.stop()`** ([NarrationService.ts:220-227](src/services/narration/NarrationService.ts:220)) — clears the chunk queue, aborts any in-flight `AbortController`, calls `backend.stop()`, and silences the active `AudioBufferSourceNode` via `stopPlayback()`.
3. **Backend `stop()`**:
   - **ServerBackend** ([ServerBackend.ts:39-42](src/services/narration/ServerBackend.ts:39)) is a no-op — cancellation rides entirely on the `AbortSignal` passed to `fetch()`.
   - **WorkerBackend** ([WorkerBackend.ts:119-121](src/services/narration/WorkerBackend.ts:119)) posts `{ type: 'stop' }` to the worker; the worker's `stopped` reply rejects the pending `speak` promise with `Error('Stopped')`. `NarrationService` swallows that specific error string and sets status to `'ready'`.

**Idempotence.** `stop()` is safe to call when not speaking — no-op path. `stop()` followed by `speak()` is the documented cancel-then-replay flow used by `HexChronicle` and `LocationView` today.

**Speak-counter race guard.** `NarrationService` uses a monotonically incremented `speakCounter` ([NarrationService.ts:38-39](src/services/narration/NarrationService.ts:38)) as a per-call id. Audio chunks and decode results check the id against `currentSpeakId` and bail out if stale; this prevents a slow decode from playing into a freshly-started speak. Encounter UI does not need to participate in this — `speak()` already does this internally — but H3 should be aware when chaining beats so it does not leak old chunks into a new beat.

---

## 4. Backend selection

`NarrationService.init()` ([NarrationService.ts:95-117](src/services/narration/NarrationService.ts:95)) implements automatic, origin-keyed backend selection:

- **`localhost` / `127.0.0.1`** → probe Python server at `NARRATION_TTS_SERVER_URL` (default `http://localhost:3001/api/tts`) with a `${NARRATION_SERVER_PROBE_TIMEOUT}ms` (5000) `/health` request. On 2xx, attach `ServerBackend` and set status `'ready'`. On any error, fall through to `'available'`.
- **All other origins** (Vercel preview, prod, staging) → set status `'available'` and stop. The browser worker is opt-in: the player must click "download narrator" UI which calls `initWorker()`.

`initWorker()` ([NarrationService.ts:119-139](src/services/narration/NarrationService.ts:119)) attaches a `WorkerBackend` and emits load progress through the existing listener channel. Failure sets status `'available'` (not `'error'`) so the UI can re-prompt.

**Rationale for encounter UI.** Encounter narration inherits the same dual-mode behavior automatically — there is nothing for the encounter seam to decide here. Whichever backend the chronicle is using is the backend the encounter is using. The `enabled` boolean from `useNarration()` already encodes "narration usable for this surface right now."

---

## 5. Voice / speed conventions

All defaults live in [src/services/narration/narrationConstants.ts](src/services/narration/narrationConstants.ts):

| Constant | Default | Purpose |
|---|---|---|
| `NARRATION_VOICE` | `'bm_george'` | Default narrator voice — British male, deeper storyteller tone. |
| `NARRATION_SPEED` | `0.87` | Speaking speed. Slower than 1.0 for storyteller cadence. Range 0.5–2.0. |
| `NARRATION_MAX_TEXT_LENGTH` | `1500` | Soft cap per `speak()` call. Not currently enforced by the service; callers should chunk via `speakSections()` instead of trimming. |
| `NARRATION_SECTION_PAUSE` | `'. '` | Inserted between sections to encourage a natural pause. Used by `WorkerBackend.generateAudio` via `sections.join('. ')`. |
| `NARRATION_WORKER_SECTION_SILENCE` | `0.6` (seconds) | Silence padding between sections in worker mode. |

`NarrationService.speak(text, voice?, speed?)` accepts overrides positionally ([NarrationService.ts:152-154](src/services/narration/NarrationService.ts:152)) — the React hook does not expose these overrides today; if H3 needs per-encounter voice variation (cosmology accent? boss vs ambient narrator?), `useEncounterNarration` is the place to add that surface, not `useNarration`.

**Naming.** The browser-side model is **Kokoro** (`onnx-community/Kokoro-82M-v1.0-ONNX`, [narrationConstants.ts:23](src/services/narration/narrationConstants.ts:23)). See §8.

---

## 6. Current call sites

Two callers in `src/components/Game/`. All paths and line numbers verified by grep against `src/`.

### 6.1 `HexChronicle.tsx`

- **Import:** [src/components/Game/HexChronicle.tsx:14](src/components/Game/HexChronicle.tsx:14)
  ```ts
  import { useNarration } from '../../services/narration/useNarration';
  ```
- **Hook destructure:** [src/components/Game/HexChronicle.tsx:147](src/components/Game/HexChronicle.tsx:147)
  ```ts
  const {
    enabled: narrationEnabled, status: narrationStatus,
    isLoading, isSpeaking, isAvailable, initWorker,
    speakSections, narrateChronicle, stop: stopNarration,
  } = useNarration();
  ```
- **Behaviors:**
  - Stops narration on hex change ([:151-159](src/components/Game/HexChronicle.tsx:151)).
  - `handleNarrateChapter(ref)` toggles narration for a chapter `ref` ([:161-167](src/components/Game/HexChronicle.tsx:161)).
  - Per-soul prose narration around line 169+.
  - `narrateChronicle()` scrapes `.chronicle-prose` elements out of a container — encounter UI does **not** want this path; see §7.

### 6.2 `LocationView.tsx`

- **Import:** [src/components/Game/LocationView.tsx:21](src/components/Game/LocationView.tsx:21)
  ```ts
  import { useNarration } from '../../services/narration/useNarration';
  ```
- **Hook destructure:** [src/components/Game/LocationView.tsx:824](src/components/Game/LocationView.tsx:824)
  ```ts
  const {
    enabled: narrationEnabled, status: narrationStatus,
    isLoading, isSpeaking, isAvailable, initWorker,
    speak, stop: stopNarration,
  } = useNarration();
  ```
- **Behavior:** `handleNarrateProse()` ([:826-832](src/components/Game/LocationView.tsx:826)) toggles `speak(locationProse)` against the current location prose string.

### 6.3 Test stub

`src/components/Game/__tests__/EncounterVeil.test.tsx:7-8` mocks `useNarration` directly (the EncounterVeil component is encounter-adjacent but predates the encounter UI rebuild). When H3 wires encounter components to `useEncounterNarration`, the recommended pattern is to mock the new seam instead of `useNarration`, so encounter tests do not have to know about the underlying hook surface.

---

## 7. Encounter-UI gap analysis

The chronicle and location callers want different things from narration than the encounter UI will. The seam exists to gate that drift.

| Behavior | Chronicle / Location today | Encounter UI v1 (per `2026-05-04-encounter-ui-canonical.md`) | Encounter UI H3 (post-v1) |
|---|---|---|---|
| **Trigger** | Player click on narrate-chapter button | Beat reveal sequence (auto on commit) and authored prose blocks | Same |
| **Cancellation** | Hex change / button toggle | Beat advance, choice commit, modal close | Same |
| **Sectioning** | `speakSections([chronicle chapter texts])` | Per-beat: `speak(beatProse)`. Detail page: per-section `speakSections(...)`. | Same; may add hover-skip to advance section. |
| **Supersession** | New `speak()` cancels old via internal counter | Each new beat must cleanly cancel the prior beat's audio before its own first chunk plays. | Same — must be enforced by the seam, not by every encounter component. |
| **`narrateChronicle` (DOM scrape)** | Used | **Not used.** Encounter prose is passed in as strings, not scraped from DOM. | Same. |
| **`initWorker` UI** | Owned by the chronicle's "download narrator" affordance | **Not owned by encounter UI.** Encounter components rely on whatever state `init` / `initWorker` already produced via the chronicle/settings. | Same. |
| **Per-beat voice variation** | None | None v1. | Possible — pass a voice param to the seam, plumb into `NarrationService.speak()`. |

**Why a thin seam.** The encounter UI's needs are a strict subset of `useNarration`'s today. H3 may grow that subset (per-beat supersession discipline, hover-skip, per-section sequencing), and we want one place to extend rather than touching every encounter component. The seam is the contract H3 extends; encounter components only ever import `useEncounterNarration`.

**v1 contract.** Per the THR-353 done-when checklist, the v1 hook body is a literal pass-through:

```ts
import { useNarration } from './useNarration';

export interface EncounterNarrationApi {
  enabled: boolean;
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export function useEncounterNarration(): EncounterNarrationApi {
  const { enabled, isSpeaking, speak, stop } = useNarration();
  return { enabled, isSpeaking, speak, stop };
}
```

Five lines of body (function + return). Four fields. No new behavior; the seam is the future-proofing.

---

## 8. Naming correction note

The design plan and canonical UI spec call the browser TTS model **"Kokomoro"** (e.g. `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` decision 2.3, `Docs/plans/2026-05-05-tts-encounter-ui-spec.md`). The actual model is **Kokoro** — `onnx-community/Kokoro-82M-v1.0-ONNX`, declared in [narrationConstants.ts:23](src/services/narration/narrationConstants.ts:23). Same model. Same voice. Just a typo in the design-side docs.

**Filed for F3.** Per the THR-353 done-when checklist, this report **does not** edit the canonical docs — that correction sweep is part of Phase F3 (canonical doc updates) so it lands as one batch with the other typo / supersession edits the encounter UI spec needs. Future readers of those docs should mentally substitute Kokoro until F3 ships.

---

## 9. References

- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — long-form encounter design plan; §11 deferred phasing.
- `Docs/plans/2026-05-04-encounter-ui-canonical.md` — canonical UI spec; §3 (Moment 1 tension reveal), §4 (Moment 2 aftermath registration), prose narration triggers.
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` — phasing plan; §3 Phase D3, §4 (D3 fully independent), §5 (CC vs Codex audience rationale).
- `Docs/plans/2026-05-05-tts-encounter-ui-spec.md` — original TTS UI spec; useful background on the chronicle's download UX.
- `Docs/plans/2026-04-06-dual-mode-tts-design.md` — original dual-mode (server + worker) design.
- `Docs/plans/2026-04-06-dual-mode-tts-implementation.md` — implementation notes for the existing infrastructure.
- `Docs/plans/2026-03-23-kokoro-tts-narration-prototype.md` — original Kokoro prototype.
- Source files inventoried in §1.
