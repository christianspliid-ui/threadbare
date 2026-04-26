# Divine Proximity Importance Accumulation (THR-25)

**Status:** Implementation Planning → Ready for Codex
**Owner:** Codex executor
**Parent:** Rarity Model project
**Date:** 2026-04-19

## Problem

The rarity system has a constant `IMPORTANCE_DIVINE_PROXIMITY` (value `1`) in `src/data/rarity-constants.ts` and a helper pair `accumulateImportance(node, delta)` + `getImportanceDelta(category)` in `src/engine/rarity.ts`, but nothing in the tick loop actually calls them for divine proximity. As a result, entities that sit near an active ascendant never accumulate importance from that adjacency, so their rarity never graduates for the "the god cared about this place" reason we scaffolded for.

The PHASE-DEFERRED marker in `src/engine/orchestrator.ts` (search for the divine-proximity TODO between the intelligence reliability decay phase and the trade route decay phase) documents the intended hook.

## Goal

Add a per-tick orchestrator phase that scans nodes near each active ascendant's hex and calls `accumulateImportance(node, getImportanceDelta('divine_proximity'))` on each. Keep the scan cheap (hex-bounded, not graph-wide) and traceable.

## Scope

- New orchestrator phase inserted between Phase 6.71 (Intelligence Reliability Decay) and Phase 6.62 (Trade Route Decay). Anchor by surrounding phase names, not line numbers — the file drifts.
- Per-tick spatial scan: for each active ascendant, enumerate nodes within `DIVINE_PROXIMITY_RADIUS_HEXES` hex distance and accumulate importance on each.
- One trace per phase run summarising scan/accumulate counts. One structured trace per affected node if volume stays reasonable.
- `phaseEventCounts` entry so the phase shows up in the orchestrator's per-tick accounting.

Out of scope: defining what "active ascendant" means beyond the existing selector (reuse whatever the orchestrator already uses to locate ascendants — do not invent a new definition), changing `accumulateImportance` behaviour, adding new rarity tier thresholds, UI surfacing of the accumulation.

## Three-Pillar Coverage

### Engine pillar

**Phase insertion.** New phase between Phase 6.71 and Phase 6.62. Suggested name: `Phase 6.715: Divine Proximity Importance`. The orchestrator's existing structure is:

```
Phase 6.71 Intelligence Reliability Decay
Phase 6.715 Divine Proximity Importance   ← new
Phase 6.62 Trade Route Decay
```

**Scan algorithm (pseudocode).**

```ts
function divineProximityPhase(state: GameState, traces: TraceBuffer) {
  const ascendants = getActiveAscendants(state);  // reuse existing selector
  if (ascendants.length === 0) return { scanCount: 0, accumulatedCount: 0 };

  const radius = DIVINE_PROXIMITY_RADIUS_HEXES;
  const delta = getImportanceDelta('divine_proximity');  // already exists
  let scanCount = 0;
  let accumulatedCount = 0;

  for (const ascendant of ascendants) {
    const hex = resolveAscendantHex(ascendant, state);
    if (!hex) continue;  // fail-soft: ascendant not currently on-map

    const nearby = state.graph.queryNodesWithinHexRadius(hex.col, hex.row, radius);
    scanCount += nearby.length;

    for (const node of nearby) {
      if (shouldAccumulateDivineProximity(node)) {
        accumulateImportance(node, delta);
        accumulatedCount++;
      }
    }
  }

  return { scanCount, accumulatedCount };
}
```

`queryNodesWithinHexRadius` is the only piece that may not already exist. Check `src/engine/graph.ts` first: if there is already a hex-radius query (agent awareness uses one), reuse it. If not, add a helper that walks hexes within `radius` via axial coordinates and returns nodes whose `located_at` resolves to those hexes. Do not add a general-purpose graph method without a second look — prefer the narrowest helper that does the job.

`shouldAccumulateDivineProximity(node)` filters out nodes that should never accumulate (e.g. the ascendant itself, nodes flagged as non-rarity-tracked). Start with the simplest filter: skip if `node.id === ascendant.id` and skip if `node.properties.rarityTracked === false`. Expand only if bugs show otherwise.

**Ascendant hex resolution.** Use the standard three-tier resolution (sublocation → location → hex) already used elsewhere. If the ascendant is currently off-map (no `located_at` edge), skip that ascendant — do not treat origin `(0,0)` as a default.

### Content pillar

N/A. No new content, no new templates. This phase only mutates `importanceScore` (or equivalent property) on existing nodes, which is the input for the existing rarity graduation system written in a previous issue. No new events fire directly from this phase — rarity graduations elsewhere will consume the accumulated importance on their own cadence.

### UI pillar

N/A for v1. Importance accumulation is invisible by design — its effect surfaces when rarity graduation fires existing events (which already have UI surfacing). Add debug visibility only if the phase misbehaves and you need to diagnose; in that case, extend DebugPanel's phase view with the `scanCount` / `accumulatedCount` numbers from the trace. Log a `// TODO(THR-xx)` if deferring.

## Wiring

- **Orchestrator phase:** new `runDivineProximityPhase` function in the orchestrator (or colocated helper module), called between intelligence decay and trade route decay.
- **UI component:** none.
- **GameState flow:** reads `state.graph` and ascendant selector; writes node importance properties via existing `accumulateImportance` helper.
- **Traces:** see Tracing.
- **Debug visibility:** none for v1; accessible via trace buffer if needed.
- **Prose pipeline:** unaffected.
- **Player controls:** none.

Update `Docs/plans/wiring-checklist.md` under "Orchestrator phases" to include the new phase.

## Constants table

Add to `src/data/rarity-constants.ts` (which already exports `IMPORTANCE_DIVINE_PROXIMITY`):

| Constant | Default | Purpose |
|---|---|---|
| `DIVINE_PROXIMITY_RADIUS_HEXES` | `5` | Hex distance within which a node accumulates importance from an active ascendant. Tunable for how "wide" a god's presence feels. |
| `IMPORTANCE_DIVINE_PROXIMITY` | `1` (existing) | Per-tick importance delta applied to each nearby node. Kept at 1 so accumulation is legible; tune alongside rarity graduation thresholds if the phase fires too aggressively. |

Do not hardcode the radius inside the phase function — every call site reads the constant.

## Tracing

Two trace categories. Add to `TRACE_CATEGORIES`.

**Phase summary (always emitted once per tick the phase runs):**

```ts
interface DivineProximityPhaseTrace {
  category: 'divine_proximity_phase';
  tick: number;
  ascendantCount: number;
  scanCount: number;         // total nodes inspected across ascendants
  accumulatedCount: number;  // nodes that actually received a delta
  skippedAscendantCount: number;  // ascendants with no resolvable hex
}
```

**Per-node accumulation (conditional — see below):**

```ts
interface DivineProximityAccumulationTrace {
  category: 'divine_proximity_accumulation';
  tick: number;
  nodeId: string;
  ascendantId: string;
  hexDistance: number;
  delta: number;
  newImportance: number;
}
```

Per-node traces risk flooding the buffer on a large map. Gate them behind `phaseEventCounts.divineProximityAccumulations < DIVINE_PROXIMITY_TRACE_CAP` (suggest `20` per tick); once the cap hits, stop emitting per-node traces for that tick but still emit the phase summary. This keeps inspectability for small/medium maps without nuking the buffer on large.

Update `phaseEventCounts` in the orchestrator's per-tick stats to include `divineProximityScanned` and `divineProximityAccumulated` counters.

## Fail-soft table

| Failure case | Fallback behaviour |
|---|---|
| No active ascendants | Skip phase entirely; emit phase trace with `ascendantCount: 0` |
| Active ascendant with no resolvable hex | Skip that ascendant; increment `skippedAscendantCount`; do not throw |
| `queryNodesWithinHexRadius` returns empty | Normal path — `scanCount: 0`, phase trace still emitted |
| `accumulateImportance` throws | Catch per-node, increment a local error count, continue with next node; surface count in phase trace |
| `DIVINE_PROXIMITY_RADIUS_HEXES` misconfigured (`<= 0` or non-integer) | Fall back to `1` and `console.warn` once per session |

The orchestrator must not crash because of this phase. If the whole phase fails, log and continue to Phase 6.62.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Radius and delta are both named constants |
| 2. Inspectability | PASS | Phase summary trace always; per-node traces up to a cap; `phaseEventCounts` entries |
| 3. Determinism | PASS | No PRNG — scan order is deterministic by graph iteration order |
| 4. Fail-soft | PASS with note | Per-node errors caught; missing hexes skipped; phase never throws. Note: if `queryNodesWithinHexRadius` returns in non-deterministic order, sort by nodeId before accumulating so trace output stays stable across runs. |
| 5. Narrative over mechanical perfection | PASS | The whole mechanic exists so rare things accumulate near gods — that's narrative causality |
| 6. Additive over destructive | PASS | New phase, new constants, new traces. No existing phases or helpers rewritten. |
| 7. Performance budget | PASS with note | Bounded by hex radius (default 5 = up to ~91 hexes per ascendant). On a large map with rare ascendants this is cheap; profile if ascendant count grows or radius increases. |

## Done when

- [ ] `DIVINE_PROXIMITY_RADIUS_HEXES` exported from `src/data/rarity-constants.ts`
- [ ] New phase `runDivineProximityPhase` inserted between Phase 6.71 and Phase 6.62 in orchestrator
- [ ] Phase uses existing `accumulateImportance` + `getImportanceDelta('divine_proximity')` helpers; no reimplementation
- [ ] Ascendant hex resolution reuses the standard three-tier resolution path
- [ ] `divine_proximity_phase` trace category registered and emitted every tick the phase runs
- [ ] `divine_proximity_accumulation` trace category registered, gated by `DIVINE_PROXIMITY_TRACE_CAP`
- [ ] `phaseEventCounts` gains `divineProximityScanned` and `divineProximityAccumulated`
- [ ] Unit test: with 1 ascendant on a small map, nodes inside radius get importance accumulated and nodes outside don't
- [ ] Unit test: ascendant with no `located_at` edge is skipped and increments `skippedAscendantCount`
- [ ] Unit test: per-node trace cap honoured (emit up to cap, then stop per-node traces but keep summary)
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all clean
- [ ] PHASE-DEFERRED comment in orchestrator removed once wired
- [ ] Commit message body contains `Fixes THR-25`
