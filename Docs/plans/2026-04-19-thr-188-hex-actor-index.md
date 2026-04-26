# THR-188 — Hex→Actor Index for Phase-Scoped Iteration

**Status:** Implementation Planning → Ready for Dev
**Parent:** THR-186 (Ambient agent phase caps — shipped)
**Project:** Repo Health
**Labels:** Engine, Deferral, Performance
**Filed:** 2026-04-19
**Author:** Cowork

## 1. Context

THR-186 added processed/skipped counters and a proximity gate to the familiarity-gain phase so ambient agents outside the avatar's hex no longer accrue proximity familiarity. The implementation deliberately left an O(N_actors) walk in place each tick, with an early-continue when `hexDistance > FAMILIARITY_PROXIMITY_HEX_RANGE`.

From the THR-186 plan doc:

> Per-tick cost profile: still O(N_all) for the actor iteration, but the inner work is now a hex-distance compare + `continue`. Per-actor work shrinks from ~5 µs (map ops + trace) to a handful of arithmetic ops + two graph node lookups. **Follow-up (separate issue):** resolve hex once, then iterate only actors in the avatar's hex via a hex→actor index. Defer until profiling shows the inner lookup is still hot.

THR-188 is that follow-up. The inner lookup is still hot: `phaseFamiliarityGain` currently calls `state.graph.getNode(locationId)` for every actor in the world on every tick, even though (with `FAMILIARITY_PROXIMITY_HEX_RANGE = 0`) it only ever processes agents sharing the avatar's hex — typically 2–20 out of ~1010 on a large map.

This plan replaces the O(N_all) walk with an O(N_hex) walk backed by a per-tick hex-keyed index.

## 2. Goals / Non-Goals

**Goals:**

1. Drop `phaseFamiliarityGain` from O(N_all) to O(N_avatar_hex) for the actual familiarity work.
2. Preserve existing per-phase trace fields (`totalActors`, `processedActors`, `skippedActors`) so dashboards and the TickPhaseProfile view don't regress.
3. Expose the index as a reusable helper so future hex-scoped phases (colocation, visibility, encounter prospecting) can adopt it without re-implementing the walk.
4. Stay deterministic — no hashed iteration order, no cross-tick state that could desync from the graph.

**Non-goals:**

1. Incremental maintenance of the index across ticks. A per-tick rebuild is correct, cheap, and avoids invalidation risk.
2. Converting `phaseColocationDetection` to the new index. It already maintains its own `Map<locationId, actorId[]>` tuned to its pairwise-detection needs; migrating it is a separate ticket if profiling justifies it.
3. Extending to multi-hex neighborhoods (range > 1). The data structure supports it trivially, but no caller needs it today.
4. Persisting the index on `SimulationRuntime`. The index is cheap enough to rebuild per tick, and keeping it off-runtime means zero invalidation surface.

## 3. Three-Pillar Scope

| Pillar | Scope |
|--------|-------|
| **Engine** | New `buildHexActorIndex(graph)` helper + call site in `phaseFamiliarityGain`. Trace emission updated. |
| **Content** | **N/A** — pure engine optimization. No encounters, prose, or templates touched. No tunable knobs affecting game feel. |
| **UI** | **N/A** — no player-facing surface. Profiling signal continues to flow through the existing `tick_phase_profile` trace and TickPhaseProfile dev overlay. |

The three-pillar rule requires explicit N/A marking with rationale — done above.

## 4. Engine Design

### 4.1 Data structure

```ts
// src/engine/hexActorIndex.ts
export type HexKey = string; // `${col},${row}`

export interface HexActorIndex {
  /** Map from hex key to actor ids present on that hex. */
  readonly byHex: ReadonlyMap<HexKey, readonly string[]>;
  /** Total actors indexed (matches totalActors in the caller's trace). */
  readonly totalActors: number;
  /** Actors whose location could not be resolved to a hex (for fail-soft trace). */
  readonly unresolvedCount: number;
}

export function hexKey(col: number, row: number): HexKey {
  return `${col},${row}`;
}

export function buildHexActorIndex(graph: WorldGraph): HexActorIndex;

export function getActorsOnHex(
  index: HexActorIndex,
  col: number,
  row: number,
): readonly string[];
```

### 4.2 Index construction

`buildHexActorIndex` walks `graph.getNodesByType('actor')` once and, for each individual actor:

1. Reads `actor.properties.locationId`. If absent → unresolved.
2. Looks up the location node. If missing or not of type `location` → unresolved.
3. Reads `hexCol` / `hexRow` from the location's properties. If undefined → unresolved.
4. Computes `hexKey(col, row)` and appends the actor id to the hex's bucket.

Iteration order matches `graph.getNodesByType('actor')` order, which is insertion order (stable for a given seed). Bucket arrays retain that order. This preserves determinism of any caller that iterates `getActorsOnHex()` results.

Sublocation support: if `locationId` points to a sublocation (type `'sublocation'`), resolve up to `parentLocationId` before reading hex properties. This matches the three-tier location model from CLAUDE.md. Fail-soft: if the chain can't be resolved, the actor goes to `unresolvedCount`.

### 4.3 Caller change

`phaseFamiliarityGain` becomes:

```ts
export function phaseFamiliarityGain(state: GameState): Partial<GameState> {
  const avatarHex = getAvatarHexPosition(state.graph, state.ascendantId);
  if (!avatarHex) return { familiarityMap: state.familiarityMap };

  const index = buildHexActorIndex(state.graph);
  const nearbyActorIds = getActorsOnHex(index, avatarHex.col, avatarHex.row);

  let map = state.familiarityMap;
  let processedFamiliarityActors = 0;

  for (const actorId of nearbyActorIds) {
    const actor = state.graph.getNode(actorId);
    if (!actor) continue;  // fail-soft: actor deleted between index build and read

    processedFamiliarityActors++;
    // ... existing familiarity gain + trace emission unchanged ...
  }

  emitTrace({
    tick: state.tick,
    category: 'tick_phase_profile',
    phase: 'familiarity_gain',
    totalActors: index.totalActors,
    processedActors: processedFamiliarityActors,
    skippedActors: index.totalActors - processedFamiliarityActors,
    summary: `familiarity_gain: ${processedFamiliarityActors}/${index.totalActors} actors processed`,
  });

  return { familiarityMap: map };
}
```

The existing `FAMILIARITY_PROXIMITY_HEX_RANGE = 0` check is gone — the index already answers "actors on the avatar's hex" exactly. If the constant ever increases, the call site becomes a neighborhood walk over the hex ring; the index exposes `byHex` directly so the caller can unionize buckets.

### 4.4 Where the code lives

- **New file:** `src/engine/hexActorIndex.ts` — pure function, no module-level state, no runtime dependency.
- **Edit:** `src/engine/orchestrator.ts` — import and call from `phaseFamiliarityGain`. Remove the stale TODO.
- **Edit:** `src/engine/__tests__/hexActorIndex.test.ts` — unit tests for the builder (determinism, sublocation resolution, unresolved counter).

Kept off `SimulationRuntime` deliberately. The rebuild is O(N_all) and runs at most once per tick per consumer; adding it to the runtime creates invalidation surface (locationId edits, movement, node deletion) for no measurable gain. This matches the Fail-soft NFP — no caches to go stale, no hooks to miss.

### 4.5 Constants

| Constant | Value | Purpose | Where |
|----------|-------|---------|-------|
| `FAMILIARITY_PROXIMITY_HEX_RANGE` | `0` (unchanged) | Hex radius around avatar that accrues proximity familiarity. Still the authoritative knob — this plan doesn't change it. | `src/data/agent-behavior-constants.ts` (existing) |

No new constants. The index has no tunables.

### 4.6 Tracing

Trace shape continues to use the existing `tick_phase_profile` category with `phase: 'familiarity_gain'`:

```ts
interface TickPhaseProfileTrace {
  tick: number;
  category: 'tick_phase_profile';
  phase: 'familiarity_gain';
  totalActors: number;       // from index.totalActors
  processedActors: number;   // actors whose familiarity was updated
  skippedActors: number;     // totalActors - processedActors
  summary: string;
}
```

Additionally, when `index.unresolvedCount > 0` on a tick, emit one `category: 'engine_warning'` trace per tick (rate-limited to once per session via a module-level flag, per the fail-soft pattern used elsewhere in the engine):

```ts
interface EngineWarningTrace {
  tick: number;
  category: 'engine_warning';
  source: 'hex_actor_index';
  unresolvedCount: number;
  summary: string;
}
```

### 4.7 Fail-soft

| Failure case | Behavior |
|--------------|----------|
| Avatar has no hex position (ascendant not bonded / not placed) | Phase returns early with unchanged `familiarityMap`. Matches today's behavior. |
| Actor's `locationId` missing / points to a deleted node | Actor goes to `unresolvedCount`. Not processed. Warning trace if `unresolvedCount > 0`. |
| Location's `hexCol` / `hexRow` undefined | Same as above. |
| Sublocation's `parentLocationId` missing | Same as above. |
| Actor id in bucket but node disappears before caller reads (race across phases) | Caller `getNode(actorId)` returns undefined → `continue`. No throw. |
| `buildHexActorIndex` itself throws (should not happen — pure function) | Caught at the phase boundary by the orchestrator's existing phase-level try/catch; phase is skipped, tick continues. Matches NFP #4. |

The index never modifies graph state, so there is no corrupted-cache recovery path.

## 5. NFP Compliance

| NFP | Verdict | Notes |
|-----|---------|-------|
| #1 Tunability | **PASS** | No new magic numbers. `FAMILIARITY_PROXIMITY_HEX_RANGE` remains the single knob. |
| #2 Inspectability | **PASS** | Existing `tick_phase_profile` trace fields preserved. New `engine_warning` trace on unresolved actors. |
| #3 Determinism | **PASS** | Pure function, no PRNG, iteration order driven by `graph.getNodesByType('actor')` (stable insertion order). Verification: `npm run cli -- --seed 42 --map medium` → run 200 ticks, compare full trace stream before/after — must match byte-for-byte. |
| #4 Fail-soft | **PASS** | Every lookup has an unresolved path; phase never throws; actors deleted mid-tick are tolerated via `getNode` null-check. |
| #5 Narrative-first | **PASS (N/A)** | No narrative surface changed. Processed/skipped counters used by UI remain semantically identical. |
| #6 Additive | **PASS** | New helper file; one call-site edit in orchestrator removes a TODO and a dead `hexDistance` check but preserves all external behavior. No existing API signatures changed. |
| #7 Performance budget | **PASS** | This issue **is** the performance work. Gain measured on `large` map (~1010 actors): familiarity-gain phase drops from ~1010 graph lookups + 1010 `hexDistance` calls to one actor-enumeration pass + typically 2–20 familiarity updates. Expected phase duration reduction: ~85–95% (to be confirmed in the verification step). |

## 6. Wiring

Per `Docs/plans/wiring-checklist.md`:

- [x] **Orchestrator phase** — `phaseFamiliarityGain` at `orchestrator.ts:~1371`. Existing phase, no new invocation required.
- [x] **GameState flow** — Only `familiarityMap` is read/written; unchanged from today.
- [x] **Traces** — `tick_phase_profile` category with `phase: 'familiarity_gain'` preserved. New `engine_warning` trace (rate-limited).
- [x] **Debug visibility** — TickPhaseProfile overlay already consumes the trace; no change needed. The `processedActors` line will now trivially match "agents sharing avatar hex" — visually verifiable on the dev overlay.
- [x] **Player controls** — N/A (no player-facing surface).
- [x] **UI component** — N/A.
- [x] **Prose pipeline** — N/A.
- [x] **Wiring checklist update** — no new surface types added; no checklist update required.

## 7. Test Surface

Unit tests (`src/engine/__tests__/hexActorIndex.test.ts`):

1. **Empty graph** — `buildHexActorIndex` on a fresh graph returns an empty map, `totalActors: 0`, `unresolvedCount: 0`.
2. **Single actor on a location** — index contains one bucket at the location's hex, one actor id.
3. **Multiple actors same hex** — bucket ordering matches `getNodesByType('actor')` insertion order (determinism).
4. **Actor on a sublocation** — resolves through `parentLocationId` to the parent location's hex. Bucket keyed on parent hex.
5. **Actor with missing `locationId`** — counted in `unresolvedCount`, not in any bucket.
6. **Actor whose location lacks hexCol/hexRow** — same as above.
7. **Non-individual actors** — `actorType !== 'individual'` actors are excluded (matches current phase filter).

Contract test (`src/engine/__tests__/contracts/familiarityPhase.contract.test.ts`):

- **Before/after parity** — for a fixed seed (42, medium map), run 200 ticks with a recorded trace stream from the pre-change implementation (checked in as a fixture), then assert the post-change trace stream for the `familiarity_change` and `tick_phase_profile` categories is byte-identical to the fixture. This is the wall-clock determinism guard carried forward from THR-186.

CLI smoke test (manual verification step in the PR):

```bash
npm run cli -- --seed 42 --map medium
fws> run 100
fws> traces 5
# Confirm tick_phase_profile for familiarity_gain shows processedActors <= 20 on most ticks.
```

## 8. Rejected Alternatives

- ❌ **Store the index on `SimulationRuntime`.** Adds invalidation surface (movement phase, locationId edits, node deletion) for no win — the per-tick rebuild is already cheap. The runtime pattern is justified for caches reused *across* ticks (encounter cache, distance matrix); this index is used once per tick then discarded.
- ❌ **Reuse `phaseColocationDetection`'s location-keyed map.** That map is location-keyed, not hex-keyed, and is built after the familiarity phase runs. Reordering the phases couples two unrelated systems and makes the colocation map authoritative for a system it wasn't designed for. A standalone helper is cleaner and makes the dependency explicit.
- ❌ **Add a same-hex-only fast path without generalizing to a hex index.** Works today but locks in `FAMILIARITY_PROXIMITY_HEX_RANGE = 0`. A Map keyed by hex costs the same to build and trivially supports ring-K lookups if the constant ever grows. NFP #1 (Tunability) favors the general structure.
- ❌ **Maintain the index incrementally from the movement phase.** Movement is already an established hot phase; threading an index update through it risks correctness bugs (race between movement and property edits, missed edges for teleport paths, sublocation transitions). Per-tick rebuild is O(N_all) once and deterministic by construction.

## 9. Code Pointers

- `src/engine/orchestrator.ts:1371-1436` — current `phaseFamiliarityGain` implementation.
- `src/engine/orchestrator.ts:1395` — the TODO(THR-188) marker this plan resolves.
- `src/engine/phaseColocationDetection.ts:60-70` — reference pattern for per-tick location-keyed indexing (instructive, not reused).
- `src/engine/simulationRuntime.ts` — reference for the versioned-cache pattern explicitly **not** used here.
- `src/data/agent-behavior-constants.ts:475` — `FAMILIARITY_PROXIMITY_HEX_RANGE` definition.
- `Docs/plans/2026-04-19-thr-186-ambient-agent-phase-caps.md` — parent plan with the follow-up note this doc answers.

## 10. Definition of Done (for the CC implementer)

- [ ] `src/engine/hexActorIndex.ts` created with `buildHexActorIndex`, `getActorsOnHex`, `hexKey` exports.
- [ ] `phaseFamiliarityGain` in `orchestrator.ts` switched to index-based lookup; TODO(THR-188) removed.
- [ ] Unit tests in `src/engine/__tests__/hexActorIndex.test.ts` cover the seven cases above.
- [ ] Contract test for familiarity phase determinism (fixture + byte-identical trace assertion).
- [ ] `npm test` clean, `npx tsc --noEmit` clean, `npx vite build` clean.
- [ ] CLI smoke (seed 42, medium map, 100 ticks) — manually verify `processedActors` in familiarity_gain trace stays small.
- [ ] Commit with `Fixes THR-188` in the body so Linear auto-close fires on merge to `main`.
- [ ] `project-history.md` + `changelog.md` + Linear issue completion comment per the Definition of Done in CLAUDE.md.
