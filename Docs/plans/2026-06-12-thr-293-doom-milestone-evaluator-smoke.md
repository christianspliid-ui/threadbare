# THR-293 — Doom Milestone Evaluator + Archetype-Pinned 30-Tick Smoke

**Status:** Plan (Ready for Dev)
**Date:** 2026-06-12
**Issue:** [THR-293](https://linear.app/threadbare/issue/THR-293)
**Project:** Thematic Pressure & Living World
**Parent deferral:** THR-79 (Doom Identity Matrix — Remaining Archetypes)
**Suggested model:** `model:sonnet`

---

## 1. Summary

THR-79 shipped four archetype matrices (`changing`, `sundering`, `failing`, plus existing `breach` / `ascension` / etc.) but the acceptance criterion §5 (per-archetype 30-tick CLI smoke confirming the 0.10 and 0.35 thresholds fire by tick 20) could not be met because:

1. **No runtime evaluator.** `IdentityMilestone.triggered` is declared on the type (`src/types/doomIdentity.ts:99`) and the Debug Panel renders the `✓` / `○` glyph based on it (`DebugTabContent.tsx:511`), but no code in `src/engine/` ever flips the flag. The Debug Panel currently shows every archetype with all milestones `○` regardless of doom progress.
2. **Archetype hardcoded at init.** `src/engine/gameInit.ts:269-270` unconditionally seeds `'breach'`. Headless smokes against `changing` / `sundering` / `failing` / `ascension` / `withering` / `forgetting` / `corruption` need a pin path.

This plan ships (a) a small milestone-evaluator that runs inside `phaseDoom`, (b) an opt-in archetype pin through `initializeGameState`, and (c) a Vitest suite at `src/engine/__tests__/doomIdentityMilestones.test.ts` that asserts all seven archetypes fire the 0.10 and 0.35 thresholds by tick 20 at seed 42 / map medium.

---

## 2. Three-pillar coverage

| Pillar | Status | What ships |
| --- | --- | --- |
| **Engine** | Full | (a) `evaluateIdentityMilestones()` walking `state.doomIdentityMatrix.identityMilestones` against `state.doomClock.progress`, called once per tick from `phaseDoom`. (b) Optional `doomArchetype?: DoomClockArchetype` parameter on `initializeGameState()` — defaults to `'breach'` to preserve current behaviour. (c) New `MilestoneTriggeredTrace` emitted on first transition `triggered: undefined → true`. |
| **Content** | N/A | No new vocabulary, prose, or matrix entries. The seven archetype matrices in `src/data/doom-identity-matrices.ts` are already populated by THR-79 / earlier work. |
| **UI** | N/A — render already correct | `DebugTabContent.tsx:511-519` already keys on `m.triggered` to switch glyph and colour. After the evaluator wires, the panel lights up automatically. Closeout screenshot at 1920×1080 confirms the gold ✓ appears past 10 % / 35 % doom progress for the seeded archetype. |
| **Wiring** | Full | Evaluator slot inside `phaseDoom` (post-advance, pre-event-emit). Trace channel `'doom_milestone'`. CLI consumer: new `scripts/` script is unnecessary — the Vitest suite is the smoke. Browser sees it via the Debug Panel rerender that already exists. |

No new orchestrator phase. The work piggybacks on the existing `phaseDoom` invocation that runs every tick in `orchestrator.ts`.

---

## 3. Blast radius (high-impact file note)

Codesight high-impact files in scope:

| File | Importers | Cascade-risk note |
| --- | --- | --- |
| `src/types/trace.ts` | (high; trace union root) | **Additive only** — add `MilestoneTriggeredTrace` to the discriminated union. Existing callers don't pattern-match exhaustively; no signature changes to any importer. |
| `src/engine/traceBuffer.ts` | 106 | **Pure consumer** — `emitTrace(state, traceEntry)` accepts the new variant via union widening. No exported-API change. |
| `src/types/gameState.ts` | 176 | **Not touched.** The evaluator reads existing fields (`doomClock.progress`, `doomIdentityMatrix.identityMilestones`) and mutates the `triggered` flag in place. No new top-level GameState field. |

Net new exported symbols: `evaluateIdentityMilestones`, `MilestoneTriggeredTrace`. Net new optional parameter: `initializeGameState({ ..., doomArchetype })`. Default-preserving on every existing call site.

---

## 4. Engine — milestone evaluator

### 4.1 Function signature

```ts
// src/engine/doomIdentityMilestones.ts (new file)

import type { GameState } from '../types/gameState';
import type { TraceEntry } from '../types/trace';
import { emitTrace } from './traceBuffer';

/**
 * Walk the active doom identity matrix milestones, mark first crossing of
 * each `progressThreshold` against `state.doomClock.progress`. Mutates
 * `state.doomIdentityMatrix.identityMilestones[i].triggered` in place and
 * emits one trace per first-crossing.
 *
 * Idempotent: subsequent calls with already-triggered milestones are no-ops.
 * Fail-soft: returns silently if `doomIdentityMatrix` is absent.
 */
export function evaluateIdentityMilestones(state: GameState): void;
```

### 4.2 Call site (inside `phaseDoom.ts`)

`phaseDoom` already calls `advanceDoomClock(state.doomClock, ...)` at the top of its body. Add `evaluateIdentityMilestones(state)` immediately after the advance, before any event emission. Rationale: the evaluator inspects the post-advance progress and must run before `phaseProsperity` / downstream phases that might react to a triggered milestone (none today, but the ordering is the cheap-correct one).

### 4.3 Algorithm

```
for milestone in state.doomIdentityMatrix.identityMilestones:
  if milestone.triggered:        continue                      # idempotent
  if state.doomClock.progress < milestone.progressThreshold: continue
  milestone.triggered = true
  emitTrace(state, {
    type: 'doom_milestone',
    tick: state.currentTick,
    archetype: state.doomIdentityMatrix.archetype,
    label: milestone.label,
    threshold: milestone.progressThreshold,
    progress: state.doomClock.progress,
  })
```

No PRNG involved (NFP #3). Pure function of input state.

### 4.4 Archetype pin path

`src/engine/gameInit.ts:269-270` currently:

```ts
const doomDef = generateDoomClock('breach', DEFAULT_DOOM_TICKS, seed);
const doomState = createDoomClockState('breach', DEFAULT_DOOM_TICKS);
```

becomes (signature extension only — keyword arg, default preserved):

```ts
// signature: initializeGameState(seed: number, options?: { mapSize?: MapSize; doomArchetype?: DoomClockArchetype; ... })
const archetype: DoomClockArchetype = options?.doomArchetype ?? 'breach';
const doomDef = generateDoomClock(archetype, DEFAULT_DOOM_TICKS, seed);
const doomState = createDoomClockState(archetype, DEFAULT_DOOM_TICKS);
```

All existing callers (`useSimulation`, CLI, contract tests) continue to work with no change. The Vitest suite is the only new caller that exercises the option.

---

## 5. Smoke / regression test

### 5.1 File

`src/engine/__tests__/doomIdentityMilestones.test.ts`

### 5.2 Shape

```ts
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import type { DoomClockArchetype } from '../../types/doomClock';

const ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'ascension', 'changing', 'sundering',
  'failing', 'withering', 'forgetting',
];

describe('doom identity milestones — archetype-pinned 30-tick smoke', () => {
  for (const archetype of ARCHETYPES) {
    it(`fires 0.10 and 0.35 thresholds by tick 20 for archetype="${archetype}"`, () => {
      let state = initializeGameState(42, { mapSize: 'medium', doomArchetype: archetype });
      for (let t = 0; t < 30; t++) state = runTick(state);

      const m = state.doomIdentityMatrix?.identityMilestones ?? [];
      const t10 = m.find(x => x.progressThreshold <= 0.11);
      const t35 = m.find(x => x.progressThreshold >= 0.30 && x.progressThreshold <= 0.40);

      expect(t10?.triggered, `${archetype} 0.10 milestone`).toBe(true);
      expect(t35?.triggered, `${archetype} 0.35 milestone`).toBe(true);
    });
  }
});
```

Threshold tolerance (`<= 0.11`, `0.30–0.40`) accommodates per-archetype matrix variation around the canonical 0.10 / 0.35 anchors; the implementer should confirm the actual values in `doom-identity-matrices.ts` and tighten the matchers to exact thresholds if every archetype lands on identical numbers.

### 5.3 Pass criterion

`npx vitest run src/engine/__tests__/doomIdentityMilestones.test.ts` is green for all seven archetypes. Suite runtime budget: ≤ 30 s on the standard CI runner (7 × 30-tick runs, medium map).

---

## 6. Constants table (NFP #1)

| Constant | Value | Source / purpose |
| --- | --- | --- |
| `DEFAULT_DOOM_TICKS` | 200 | Existing in `src/data/game-config.ts`. Unchanged. |
| Smoke-test tick budget | 30 | Hardcoded in the new test only — explicit per THR-79 acceptance criterion #5. |
| Smoke-test seed | 42 | Canonical CLI seed (see CLAUDE.md §Headless CLI). |
| Map size for smoke | `'medium'` | Cheapest reproducible map per CLI conventions. |
| Threshold-0.10 lower tolerance | `<= 0.11` | Allows ±0.01 matrix-author drift on the first milestone. |
| Threshold-0.35 window | `0.30–0.40` | Allows reasonable matrix-author latitude on the second milestone. |

No new tunables in product code. The smoke constants live alongside the test and are not user-facing.

---

## 7. Trace schema (NFP #2)

New variant added to the trace union in `src/types/trace.ts`:

```ts
export interface MilestoneTriggeredTrace {
  type: 'doom_milestone';
  tick: number;
  archetype: DoomClockArchetype;
  label: string;
  threshold: number;
  progress: number;
}
```

Emitted exactly once per milestone per game (idempotent on `triggered = true`). Visible in the Debug Panel trace tab and in `traceBuffer` exports. The `__DEBUG.getTraces()` debug-bridge consumer surfaces it without code change (it reads the union).

---

## 8. Fail-soft table (NFP #4)

| Failure case | Fallback behaviour |
| --- | --- |
| `state.doomIdentityMatrix` is `undefined` (e.g. legacy save, archetype not generated) | Evaluator returns silently. No throw. Tick loop continues. |
| `identityMilestones` array is empty | Evaluator returns silently. No throw. |
| A milestone has `progressThreshold` outside [0, 1] | Comparison still well-defined (will trigger immediately if ≤ progress, never if > 1.0). No throw. |
| `emitTrace` throws (e.g. buffer overflow) | Trace dropped. `triggered = true` still persists. Tick loop continues. (Existing `emitTrace` is best-effort.) |
| Test asserts a threshold that no matrix declares (e.g. archetype matrix omits the 0.35 anchor) | Test fails with a clear `expected true got undefined`. Test failure surfaces matrix author drift — desired signal, not a fail-soft case. |

---

## 9. NFP compliance

| # | Priority | Status | Note |
| --- | --- | --- | --- |
| 1 | Tunability | PASS | No new product-code tunables. Existing `DEFAULT_DOOM_TICKS` honoured. |
| 2 | Inspectability | PASS | New `doom_milestone` trace type emitted on first crossing. DebugPanel Omens tab already renders milestone state — gains real signal. |
| 3 | Determinism | PASS | Evaluator is pure (no PRNG). Same seed + same archetype → same milestone-trigger ticks. Suite uses seed 42 explicitly. |
| 4 | Fail-soft | PASS | Missing matrix / empty array / bad thresholds all return silently. Tick loop cannot crash. |
| 5 | Narrative-over-mechanical | PASS with note | Milestone vocabulary (verbs, atmospheres) is content-side and unchanged; this work activates the existing narrative substrate without rewriting it. |
| 6 | Additive | PASS | New file (`doomIdentityMilestones.ts`), new test file, additive options arg, additive trace variant. No deletions or refactors. |
| 7 | Performance | PASS | O(milestones-per-archetype × phaseDoom) ≈ O(5 × 1) per tick. Negligible. |

---

## 10. Wiring checklist

- [x] **Orchestrator phase:** No new phase. Reuses `phaseDoom`.
- [x] **GameState fields:** None added. Existing `state.doomIdentityMatrix.identityMilestones[i].triggered` mutated in place.
- [x] **Trace category:** `'doom_milestone'` added to union, emitted from new evaluator.
- [x] **DebugPanel:** Already renders triggered state (`DebugTabContent.tsx:511`). No change required.
- [x] **CLI command:** No new command. Vitest suite is the smoke.
- [x] **UI player controls:** None — milestones are debug surface, not player-facing.
- [x] **`enrichProse()` placeholders:** Milestone-trigger ticks are not yet surfaced in prose enrichment; out of scope for this ticket (separate deferral if appetite).
- [x] **`Docs/plans/wiring-checklist.md`:** Add a row for `evaluateIdentityMilestones` under the engine-module column.

---

## 11. Done when

- [ ] `src/engine/doomIdentityMilestones.ts` shipped with `evaluateIdentityMilestones()` matching §4.1.
- [ ] `phaseDoom.ts` calls the evaluator immediately after `advanceDoomClock` and before event emission.
- [ ] `initializeGameState()` accepts optional `doomArchetype` and threads it through to `generateDoomClock` / `createDoomClockState`. Existing callers unchanged.
- [ ] `MilestoneTriggeredTrace` added to the trace union; one trace emitted per first-crossing.
- [ ] `src/engine/__tests__/doomIdentityMilestones.test.ts` ships and is green for all 7 archetypes (seed 42, map medium, 30 ticks).
- [ ] `npm test` green; `npx tsc --noEmit` clean; `npx vite build` succeeds.
- [ ] **Engine smoke** (CLAUDE.md §Pre-commit minimum #6): `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` reaches tick 30 with non-zero agent count; last ~10 status lines pasted in closeout.
- [ ] **Browser-verify** (CLAUDE.md §Browser-verify UI changes): 1920×1080 screenshot of Debug Panel Omens tab past ~tick 25 showing at least one gold ✓ milestone, console output filtered to errors+warnings, and `window.__DEBUG.getTraces()` filtered to `type === 'doom_milestone'` showing ≥ 1 entry.
- [ ] `Docs/plans/wiring-checklist.md` updated with the new evaluator row.
- [ ] Closing commit body: `Fixes THR-293` plus verification evidence (raw test / typecheck / build output, or a CI-run link for the same commit).

---

## 12. Coordination block

* **Suggested model:** `model:sonnet` — pure engineering, well-bounded, no novel design judgement required. Apply the matching `model:sonnet` label.
* **Parallel-safe with:** any content authoring, prose authoring, UI work that doesn't touch `phaseDoom.ts`, `gameInit.ts`, `src/types/trace.ts`, or `src/data/doom-identity-matrices.ts`.
* **Mutex with:** any other in-flight change that touches `phaseDoom.ts` body, `gameInit.ts:269-270` lines, or the trace-union root. (None currently in flight per the 2026-06-12 board scan.)
* **Codex review:** no — small, contained engine change; CC self-review plus standard PR review is sufficient.
* **Files to touch:**
  - `src/engine/doomIdentityMilestones.ts` (new)
  - `src/engine/phaseDoom.ts` (add 1-line call)
  - `src/engine/gameInit.ts` (extend options arg, thread archetype)
  - `src/types/trace.ts` (add variant)
  - `src/engine/__tests__/doomIdentityMilestones.test.ts` (new)
  - `Docs/plans/wiring-checklist.md` (add row)
* **Plan doc:** this file.
