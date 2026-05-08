---
status: current
title: Phase D3 — TTS integration discovery + 5-line spec for encounter UI
date: 2026-05-07
parent_plan: 2026-05-05-encounter-ui-implementation-phasing.md §3 Phase D3
related_plans:
  - 2026-04-06-dual-mode-tts-design.md
  - 2026-04-06-dual-mode-tts-implementation.md
  - 2026-03-23-kokoro-tts-narration-prototype.md
  - 2026-05-04-encounter-experience-design-plan.md
  - 2026-05-04-encounter-ui-canonical.md
audience: Codex executor picking up the Linear ticket
---

# Phase D3 — TTS integration discovery + 5-line spec for encounter UI

## 1. Goal

Produce a **discovery report** documenting the existing narration / TTS infrastructure already in the repo, and a **5-line TypeScript interface spec** that the encounter UI (Phase C/D components) will call. This is foundation only — no encounter-UI wiring yet (that lands in post-v1 H3).

The work is **mechanical data-extraction** from existing source files plus contract authoring. No design judgment about what the TTS system should be — the infrastructure is settled and shipping in `HexChronicle` and `LocationView` today. The job is to capture what exists, identify gaps for encounter-UI use, and write a tight interface so H3 can wire encounter prose without re-architecting.

## 2. Background — why this ticket exists

The Encounter Experience design plan (`2026-05-04-encounter-experience-design-plan.md`) referenced a "Kokomoro voice" (typo — actual model is **Kokoro**) for TTS narration of encounter prose and detail-page prose. The phasing plan (§2.3) chose to split the work into three: discovery → spec → implementation, deferring implementation to post-v1 (H3) but locking the spec now so encounter-UI components can build against it from day one.

Phase D3 is the discovery + spec step. The implementation step (H3) consumes this spec.

## 3. Existing infrastructure — what Codex will find

This section is what the discovery report should confirm, expand, and correct. It exists here so the Codex ticket is concrete; the deliverable is a fuller version of it written to a discovery report file.

### 3.1 Files in `src/services/narration/`

| File | Role |
|---|---|
| `NarrationService.ts` | Singleton orchestrator — dual-mode (server / worker), streaming chunk queue, speakCounter race-tracking, AbortController per call, dispose lifecycle. |
| `TtsBackend.ts` | Strategy interface — `type: 'server' \| 'worker'`, `init`, `generateAudio(sections, voice, speed, signal, onChunk?)`, `stop`, `dispose`. |
| `ServerBackend.ts` | Local Python TTS server probe (`http://localhost:3001/api/tts`) — returns full WAV. |
| `WorkerBackend.ts` | Browser `kokoro-js` worker — streams audio chunks per sentence via `onChunk` callback. |
| `NarrationWorker.ts` | The Web Worker entry. |
| `useNarration.ts` | React hook — exposes `speak`, `speakSections`, `narrateChronicle`, `stop`, status flags. Auto-init on mount, auto-stop on unmount. |
| `narrationConstants.ts` | All tunables — `NARRATION_VOICE='bm_george'`, `NARRATION_SPEED=0.87`, `NARRATION_MAX_TEXT_LENGTH=1500`, model id, server probe URL, etc. |

### 3.2 Current call sites

- `src/components/Game/LocationView.tsx:824` — uses `speak(text)` for single-string narration of location prose.
- `src/components/Game/HexChronicle.tsx:147` — uses `speakSections(sections[])` / `narrateChronicle(containerEl)` for chronicle entries.

### 3.3 Cancellation contract (load-bearing)

- `NarrationService` tracks `speakCounter` and `currentSpeakId` — every new `speak`/`speakSections` increments the counter and supersedes the previous call.
- An `AbortController` is created per call and aborted by the next call or by `stop()`.
- `stop()` clears the chunk queue, aborts the in-flight backend request, and stops the currently-playing `AudioBufferSourceNode`.
- `useNarration` auto-stops on component unmount.

### 3.4 Backend selection

- On `init()`: probe local Python server on `localhost`/`127.0.0.1` (5s timeout); fall back to `'available'` status (player can opt-in to worker download).
- On `initWorker()` (player gesture required): downloads ~92MB ONNX model, runs in a Web Worker, streams audio chunks back.
- `getNarrationService()` returns the singleton; `_resetNarrationService()` exists for tests only.

### 3.5 Voice / speed conventions

- `voice: string` — Kokoro voice id. Default `'bm_george'` (British male, deeper storyteller). Per-call override via the third argument.
- `speed: number` — 0.5–2.0. Default `0.87` for storyteller cadence.

## 4. What the encounter UI specifically needs (gap analysis)

The encounter UI surface (Phase C/D) introduces narration patterns the existing surface doesn't exercise:

| Need | Existing support | Gap |
|---|---|---|
| Read encounter prose (situation block) on encounter open | `speak(text)` works | None — direct call. |
| Read aftermath prose on resolution | `speak(text)` works | None — direct call. |
| Read detail-page section prose (Actor / Item / Faction / Place / Event) | `speak(text)` works | None — direct call. |
| Cancel narration on choice commit / beat advance | `stop()` exists; new `speak()` supersedes | None — call `stop()` on transition, or rely on supersession. |
| Skip narration on hover-only tooltip | Not currently invoked from tooltips | Spec must clarify: tooltips do **not** narrate; only click-to-open detail pages narrate. Behavioral, not API. |
| Player can mute/disable narration globally | `NARRATION_ENABLED` flag exists; `useNarration` returns `enabled: boolean` | None — encounter UI just respects `enabled`. |
| TTS state visibility in encounter UI (loading / speaking / error indicator) | `useNarration` returns `status`, `isSpeaking`, `isLoading`, `error` | None — encounter UI consumes these flags. |

**Conclusion of gap analysis:** the existing surface is sufficient for encounter-UI integration. The 5-line spec is a thin re-export / convention layer, not new infrastructure.

## 5. Deliverables

### 5.1 Discovery report

**File:** `Docs/plans/2026-05-07-tts-encounter-discovery-report.md`

**Contents (sections required):**
1. **Files inventory** — table of every file in `src/services/narration/` with its role (one row per file).
2. **Public API surface** — the exact exported symbols (functions, hooks, types, constants) with their signatures, copied verbatim from the source. Treat this as a reference card.
3. **Cancellation contract** — narrative description of how `speakCounter`, `AbortController`, and `stop()` interact. Confirm or refine §3.3 above.
4. **Backend selection flow** — describe `init()` vs `initWorker()`, the localhost probe, the opt-in worker download.
5. **Voice / speed conventions** — list the constants in `narrationConstants.ts`, document the per-call override mechanism.
6. **Current call sites** — list every file under `src/` that imports from `services/narration/`, with the line number and which API symbol it uses (`speak` / `speakSections` / `narrateChronicle` / `stop` / etc.). Use grep — do not enumerate by hand.
7. **Encounter-UI gap analysis** — confirm or refine the table in §4 above. If the encounter UI needs are fully met by the existing API, say so explicitly.
8. **Naming correction note** — the design plan (`2026-05-04-encounter-experience-design-plan.md`) and canonical UI spec (`2026-05-04-encounter-ui-canonical.md`) refer to "Kokomoro" voice; the actual model is **Kokoro** (`onnx-community/Kokoro-82M-v1.0-ONNX`, see `narrationConstants.ts`). Note the typo for F3 (canonical doc updates) to fix; do **not** edit those design plans in this ticket.
9. **References** — link to existing TTS plan docs (§related_plans in this file's frontmatter).

### 5.2 5-line interface spec

**File:** `src/services/narration/encounterNarration.ts` (new)

**Shape:** a thin re-export and convention layer. The whole point is that encounter UI components import from this file rather than reaching directly into `useNarration` or `NarrationService`, giving us a single seam to evolve later.

**Contract (this is the literal spec — Codex implements it as written):**

```ts
// ── Encounter UI narration adapter ─────────────────────────────
// 5-line spec consumed by encounter UI (Phase C/D components).
// Implementation in H3 (post-v1) wires real call sites; this file
// exists now so encounter UI can build against the contract.

import { useNarration } from './useNarration';

export interface EncounterNarrationApi {
  /** True iff narration is enabled and not in terminal error. */
  readonly enabled: boolean;
  /** True while audio is actively playing. */
  readonly isSpeaking: boolean;
  /** Speak a single block of prose. Cancels any in-flight narration. */
  speak(text: string): Promise<void>;
  /** Stop any in-flight narration. Idempotent. */
  stop(): void;
}

export function useEncounterNarration(): EncounterNarrationApi {
  const { enabled, isSpeaking, speak, stop } = useNarration();
  return { enabled, isSpeaking, speak, stop };
}
```

That's it — five **public** lines (the interface members + the hook return). The hook is a pass-through today; H3 will extend it with encounter-specific behaviors (per-beat supersession discipline, hover-skip, prose-section sequencing).

### 5.3 No call-site wiring

Codex must **not** wire any encounter UI component to `useEncounterNarration` in this ticket. The encounter UI components don't exist yet (Phase C/D) — wiring lands in H3.

### 5.4 Trivial unit test

**File:** `src/services/narration/__tests__/encounterNarration.test.ts` (new)

A single smoke test confirming `useEncounterNarration` returns an object with the four documented fields (`enabled`, `isSpeaking`, `speak`, `stop`) of the right types. Mock `useNarration` if needed; pattern `NarrationService.test.ts` for vitest usage. This guards against accidental contract drift.

## 6. Three-pillar coverage

- **Engine pillar:** N/A (no engine modules touched). Narration lives in the services layer.
- **Content pillar:** N/A (no content authored). The discovery report is process documentation, not game content.
- **UI pillar:** UI is the consumer. The spec exists for Phase C/D UI components to import; the actual UI integration is Phase D3's downstream (H3, post-v1).

This ticket is intentionally one-pillar — it produces the contract that the UI pillar will consume in H3. Per the phasing plan §5: "Codex for: discovery work where the answer is data-extraction not judgment (D3)."

## 7. Constants table

No new constants in this ticket. The existing `narrationConstants.ts` already covers the tunable surface. `NFP #1 — Tunability:` PASS by inheritance from the existing module.

## 8. Tracing

No new traces in this ticket. Narration state is exposed via `useNarration` for UI consumption; debug visibility ships through the React hook, not through the trace buffer. `NFP #2 — Inspectability:` PASS by inheritance.

## 9. Fail-soft

| Failure | Behavior |
|---|---|
| `NARRATION_ENABLED === false` | Hook returns `enabled: false`; `speak`/`stop` are no-ops. |
| Server probe times out | `useNarration().status === 'available'`; `enabled === true` but `speak` no-ops until `initWorker()` succeeds. |
| Worker model download fails | `status === 'error'`; hook's `enabled` is `false`. |
| `speak` called during `loading` | Returns early without throwing (existing `NarrationService.speakSections` guards this). |

`NFP #4 — Fail-soft:` PASS by inheritance from the existing service.

## 10. NFP compliance summary

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | ✅ PASS | All tunables in existing `narrationConstants.ts`; no new magic numbers introduced. |
| 2. Inspectability | ✅ PASS | `useNarration` exposes status flags for UI; this ticket adds nothing requiring trace plumbing. |
| 3. Determinism | ✅ N/A | TTS audio output is non-deterministic by design; not a sim system. |
| 4. Fail-soft | ✅ PASS | Inherits guards from `NarrationService`; new hook is a thin pass-through. |
| 5. Narrative over mechanical | ✅ N/A | Process / discovery ticket. |
| 6. Additive over destructive | ✅ PASS | Two new files (`encounterNarration.ts`, test). Zero edits to existing narration code. |
| 7. Performance | ✅ N/A | No new work at runtime — pass-through hook. |

## 11. Done when (binary checklist)

- [ ] `Docs/plans/2026-05-07-tts-encounter-discovery-report.md` exists with all 9 sections from §5.1.
- [ ] All file paths and line numbers in the report's "Current call sites" section verified by grep against `src/`.
- [ ] `src/services/narration/encounterNarration.ts` exists, exports `EncounterNarrationApi` interface and `useEncounterNarration` hook, body matches §5.2 verbatim.
- [ ] `src/services/narration/__tests__/encounterNarration.test.ts` exists with at least one test asserting the four fields exist and have the right `typeof`.
- [ ] No edits to any file in `src/components/`. No edits to any encounter-UI component.
- [ ] No edits to `2026-05-04-encounter-experience-design-plan.md` or `2026-05-04-encounter-ui-canonical.md` (Kokomoro→Kokoro typo correction is filed for F3, not this ticket).
- [ ] `npm test` passes locally.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] Closing commit body includes `Fixes THR-XXX` (Linear auto-close).

## 12. Files to touch

**Create:**
- `Docs/plans/2026-05-07-tts-encounter-discovery-report.md`
- `src/services/narration/encounterNarration.ts`
- `src/services/narration/__tests__/encounterNarration.test.ts`

**Edit:** none.

**Delete:** none.

## 13. References

- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §3 Phase D3 — parent phasing plan
- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — encounter UI design (mentions "Kokomoro" — typo)
- `Docs/plans/2026-05-04-encounter-ui-canonical.md` — canonical UI spec
- `Docs/plans/2026-04-06-dual-mode-tts-design.md` — original dual-mode TTS design
- `Docs/plans/2026-04-06-dual-mode-tts-implementation.md` — original implementation plan
- `Docs/plans/2026-03-23-kokoro-tts-narration-prototype.md` — initial prototype
- `src/services/narration/` — the existing infrastructure
