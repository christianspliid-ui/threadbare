# THR-251 — Phase-runner GC for completed compositions

**Type:** Deferral (from THR-225 — Event Recipe Phased Activation)
**Project:** Social Systems Expansion
**Status:** Ready for Codex
**Author:** Cowork (2026-04-23)

## Problem

`src/engine/phaseComposition.ts` v1 retains completed compositions in `state.activeCompositions` indefinitely. Only `failed` compositions are garbage-collected, via `COMPOSITION_FAILED_RETENTION_TICKS = 20` (in `src/data/composition-config.ts`). Completed compositions accumulate for the lifetime of the session, bloating state and UI queries.

Additionally, the failed-GC path is currently untested — if someone refactors the filter, regressions could land silently.

## Scope (this ticket)

Add a parallel GC path for `completed` compositions, mirroring the shape of the failed path. Introduce tests that lock both paths down. Keep the patch small and mechanical.

**Out of scope** (do not fix in this ticket):
- Reworking the `Math.min(...)` reference-tick logic used by the failed path (it uses `firedAtTick` in practice since that is always the earliest). An explicit `statusChangedAtTick` refactor would be cleaner but is a schema change — track separately if needed.
- The `TODO(THR-226)` recipe-registry lookup — already tracked.

## Engine

### Constants (`src/data/composition-config.ts`)

Add below the existing `COMPOSITION_FAILED_RETENTION_TICKS`:

```ts
/** Ticks a completed composition persists in activeCompositions before garbage collection.
 *  Longer than failed retention so recent successful phased events remain inspectable in the
 *  DebugPanel composition view (CompositionView.tsx) for roughly one short-beat window. */
export const COMPOSITION_COMPLETED_RETENTION_TICKS = 50;
```

**Rationale for `50`:** Failed retention is 20 ticks — long enough to surface the failure in logs, short enough not to accumulate. Completed compositions are more interesting for inspection (you can reconstruct the story beat sequence from them), and memory pressure from `ActiveComposition` objects is low (~8 fields, no heavy nested state), so a 2.5x window gives debuggers more room without meaningful cost.

### GC filter (`src/engine/phaseComposition.ts`)

**Current (lines 348–353):**

```ts
// Garbage-collect expired failed compositions
updatedCompositions = updatedCompositions.filter((c) => {
  if (c.status !== 'failed') return true;
  const failedAtTick = Math.min(...Object.values(c.phaseActivationTicks ?? {}).concat([c.firedAtTick]));
  return state.tick - failedAtTick < COMPOSITION_FAILED_RETENTION_TICKS;
});
```

**Replace with:**

```ts
// Garbage-collect expired completed/failed compositions. Active compositions never GC.
updatedCompositions = updatedCompositions.filter((c) => {
  if (c.status === 'active') return true;

  const phaseTicks = Object.values(c.phaseActivationTicks ?? {});
  // Completed: reference tick = max activation (all phases fired, so max == completion tick).
  // Failed:    reference tick = earliest of fired/phase-activation (matches v1 behaviour).
  const referenceTick =
    c.status === 'completed'
      ? (phaseTicks.length > 0 ? Math.max(...phaseTicks) : c.firedAtTick)
      : Math.min(...phaseTicks.concat([c.firedAtTick]));

  const retention =
    c.status === 'completed'
      ? COMPOSITION_COMPLETED_RETENTION_TICKS
      : COMPOSITION_FAILED_RETENTION_TICKS;

  return state.tick - referenceTick < retention;
});
```

Update the existing import block at the top of `phaseComposition.ts` to include `COMPOSITION_COMPLETED_RETENTION_TICKS`.

**Behavioural contract:**
- `active` compositions are never dropped by this filter.
- `completed` compositions are dropped when `state.tick - max(phaseActivationTicks, firedAtTick) >= 50`.
- `failed` compositions keep v1 behaviour (drop at `state.tick - min(...) >= 20`).

## Content

N/A — no content tables, prose, or templates changed.

## UI

N/A directly, but note the downstream effect:
- `src/components/Game/debug/CompositionView.tsx` reads `state.activeCompositions`. After this change, completed compositions disappear from that view after 50 ticks. This is the intended behaviour and matches the existing disappearance of failed compositions after 20 ticks. No UI code changes required.

## Testing

Add a `describe('composition GC', ...)` block to `src/engine/__tests__/phaseComposition.test.ts` covering:

1. **`active` compositions are never GC'd** — seed an active composition with `firedAtTick: 0`, advance `state.tick` to 1000, run the phase, assert the composition is still present.
2. **`completed` within retention is kept** — seed a completed composition with `phaseActivationTicks: { p1: 10 }`, `firedAtTick: 5`, advance to `state.tick: 40` (30 after max activation). Assert it is still present.
3. **`completed` beyond retention is dropped** — same seed, advance to `state.tick: 61` (51 after max activation). Assert it is removed.
4. **`failed` within retention is kept** — seed a failed composition with `firedAtTick: 100`, `phaseActivationTicks: {}`. Advance to `state.tick: 115`. Assert present.
5. **`failed` beyond retention is dropped** — same seed, advance to `state.tick: 125` (25 after firedAtTick). Assert removed.
6. **`completed` with empty `phaseActivationTicks`** — degenerate edge case; should fall back to `firedAtTick` as reference. Seed completed composition with `firedAtTick: 10`, empty activation map. Advance to `state.tick: 61`. Assert removed.

Each test uses the existing fixture patterns in `phaseComposition.test.ts`. Keep the tests minimal — no prose, no story beats, just composition lifecycle.

## Constants table

| Constant | Default | File | Purpose |
|----------|---------|------|---------|
| `COMPOSITION_COMPLETED_RETENTION_TICKS` | 50 | `src/data/composition-config.ts` | Ticks to retain completed compositions in `activeCompositions` before GC |
| `COMPOSITION_FAILED_RETENTION_TICKS` | 20 | `src/data/composition-config.ts` | (Existing) Ticks to retain failed compositions before GC |

## Tracing

No new trace categories. Optional enhancement (skip if scope creeps): emit a `composition.gc` trace when a composition is dropped, with fields `{ compositionId, status, ticksHeld }`. Defer to a follow-up if desired.

## Fail-soft

- `phaseActivationTicks` may be undefined or empty — the `?? {}` and `phaseTicks.length > 0` guards handle both.
- `Math.max(...[])` returns `-Infinity`; the `phaseTicks.length > 0` guard prevents this.
- `Math.min(...[firedAtTick])` is always `firedAtTick` (safe).

## NFP compliance

| NFP | Status |
|-----|--------|
| 1 — Tunability | PASS: new constant, named, documented |
| 2 — Inspectability | PASS: behaviour observable via CompositionView and trace buffer; tests lock the contract |
| 3 — Determinism | PASS: no PRNG; pure arithmetic on tick numbers |
| 4 — Fail-soft | PASS: handles empty `phaseActivationTicks`, optional field |
| 5 — Narrative | N/A — infra cleanup |
| 6 — Additive | PASS: adds constant + extends filter, no type-signature changes |
| 7 — Performance | PASS: filter already runs per tick; one extra `Math.max` per composition |

## Acceptance checklist

- [ ] `COMPOSITION_COMPLETED_RETENTION_TICKS = 50` added to `src/data/composition-config.ts` with documenting comment
- [ ] Constant imported in `src/engine/phaseComposition.ts` alongside `COMPOSITION_FAILED_RETENTION_TICKS`
- [ ] GC filter in `phaseComposition.ts` updated per the snippet above; `active` compositions never GC, `completed` and `failed` each use their own retention constant
- [ ] `src/engine/__tests__/phaseComposition.test.ts` adds a `describe('composition GC', ...)` block with the 6 cases listed above; all pass
- [ ] `npx vitest run src/engine/__tests__/phaseComposition.test.ts` — green
- [ ] `npm test` — green (no unrelated regressions)
- [ ] `npx tsc --noEmit` — clean
- [ ] `npx vite build` — succeeds
- [ ] Commit message body includes `Fixes THR-251` so the merge-to-main auto-close fires

## Files to touch

- `src/data/composition-config.ts` (edit — add constant)
- `src/engine/phaseComposition.ts` (edit — extend GC filter, add import)
- `src/engine/__tests__/phaseComposition.test.ts` (edit — add GC test block)

No new files, no deletes.

## Coordination

- **Parallel-safe with:** THR-36, THR-42, THR-245, THR-234, THR-243 (none touch phaseComposition or composition-config)
- **Mutex with:** none — no other in-flight work edits these files
- **Codex review:** no (pure mechanical addition following existing pattern)
