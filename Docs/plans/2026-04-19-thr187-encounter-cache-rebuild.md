# THR-187 — Reduce Encounter Cache Rebuild Frequency on Large Map

**Date:** 2026-04-19
**Author:** Cowork (design handoff)
**Status:** Ready for Dev
**Project:** Repo Health
**Parent:** THR-162 (tick loop scaling investigation, Done)
**Siblings:** THR-185 (lifecycle-born ambient default), THR-186 (O(N) phase caps — Done)

---

## Context

THR-162 split into three follow-up engine-perf issues. THR-186 shipped the O(N) phase caps. This plan covers THR-187: stop rebuilding the full encounter cache on every tick-loop event that calls `touchStructure(runtime)`.

On a large map (~584 locations), `buildFullCache` costs 20–50ms. The orchestrator currently fires `touchStructure(runtime)` from three callsites that happen several times per tick once prosperity is building, so the cache rebuilds every 2–5 ticks even though the structural deltas are tiny.

Crucially, `phaseSublocations` already applies targeted incremental updates to the cache (`onSublocationCreated` / `onSublocationDestroyed`) — but the orchestrator's subsequent `touchStructure(runtime)` call wipes that work by forcing `ensureEncounterCache` to run `buildFullCache` next tick. That is wasted work on top of wasted work.

## Problem

`src/engine/orchestrator.ts` has three `touchStructure(runtime)` callsites:

| Line | Phase | Real mutation kind | Already applies cache update? |
|------|-------|--------------------|-------------------------------|
| 1967 | `phaseInitiativeProgress` | `create_sublocation` outcome (rare) — plus bond edges and `locationBoost` properties that do **not** affect cache | No — `strategicGraphOps.createSublocation` has no cache reference |
| 2185 | `phaseSettlementPromotion` | `locationSubtype` property mutation on promoted/demoted settlement | No — phase has no cache reference |
| 2233 | `phaseSublocations` | Sublocation spawn / dissolve | **Yes** — phase calls `cache.onSublocationCreated` / `onSublocationDestroyed` (lines 201–231) |

`ensureEncounterCache` keys off `encounterCacheBuiltAt < structuralCacheVersion`. `touchStructure` bumps `structuralCacheVersion` → full rebuild next tick. The sibling distance-matrix rebuild is a separate concern, out of scope here (filed as a deferral below).

## Approach

Introduce one helper — `applyEncounterCacheUpdate` — and push invalidation into the phases that own the mutation. The helper applies the incremental update, bumps `structuralCacheVersion` (UI memos and distance matrix still need the bump for now), and syncs `encounterCacheBuiltAt` so `ensureEncounterCache` skips the full rebuild.

### New runtime helper (`src/engine/simulationRuntime.ts`)

```ts
/**
 * Apply an incremental encounter-cache update without forcing a full rebuild
 * next tick. Bumps structuralCacheVersion (for UI memos and distance matrix)
 * and syncs encounterCacheBuiltAt so ensureEncounterCache reuses the cache.
 *
 * If the cache hasn't been built yet (null), the callback is skipped — the
 * lazy build path will still produce a correct cache on demand.
 *
 * Fail-soft: if the callback throws, the cache is invalidated so the next
 * ensureEncounterCache triggers a full rebuild.
 */
export function applyEncounterCacheUpdate(
  runtime: SimulationRuntime,
  update: (cache: EncounterCacheManager) => void,
): void {
  const cache = runtime.encounterCache;
  if (cache) {
    try {
      update(cache);
    } catch (err) {
      console.warn(
        '[applyEncounterCacheUpdate] incremental update failed, falling back to full rebuild',
        err,
      );
      runtime.encounterCache = null;
      runtime.encounterCacheBuiltAt = -1;
    }
  }
  runtime.structuralCacheVersion++;
  runtime.worldVersion++;
  if (runtime.encounterCache) {
    runtime.encounterCacheBuiltAt = runtime.structuralCacheVersion;
  }
}
```

### Callsite 1 — `phaseInitiativeProgress`

The phase-level `touchStructure` is over-eager: the only outcome kind that changes cache-relevant structure is `create_sublocation` inside `executeInitiativeOutcomes`. Bonds (`create_bonds`, `create_edge`), temporary location boosts (`temporary_location_boost`), and faction creation do not affect encounter cache entries.

Thread `runtime` into `phaseInitiativeProgress` → `executeInitiativeOutcomes`, and apply the cache update in the `create_sublocation` branch:

```ts
// src/engine/initiativeOutcomes.ts — create_sublocation branch
case 'create_sublocation': {
  const result = createSublocation(graph, progress.locationId, progress.actorId, name, outcome.sublocationTypeId, state.tick);
  if (result.success && result.nodeId && runtime) {
    applyEncounterCacheUpdate(runtime, cache =>
      cache.onSublocationCreated(graph, result.nodeId!, progress.locationId));
  }
  // ...existing event emission...
  break;
}
```

Drop the orchestrator's line 1967 `touchStructure(runtime)` call entirely. Events from bonds/boosts/factions don't need cache invalidation.

**Side note:** `createSublocation` currently returns `GraphOpResult` but does not expose the created node id. CC should either (a) return `{ success, op, nodeId }` (additive, NFP #6) or (b) reconstruct the id via the deterministic `subloc_${typeId}_${parentId}_${tick}` format used inside the helper. Option (a) is cleaner.

### Callsite 2 — `phaseSettlementPromotion`

Accept `runtime` as an optional second parameter. On every promotion or demotion, after `loc.properties.locationSubtype = <target>`, call:

```ts
if (runtime) {
  applyEncounterCacheUpdate(runtime, cache =>
    cache.onLocationTypeChanged(graph, loc.id));
}
```

Drop the orchestrator's line 2185 `touchStructure(runtime)` call.

### Callsite 3 — `phaseSublocations`

The phase already applies `onSublocationCreated` / `onSublocationDestroyed` directly on the passed cache. The orchestrator's line 2233 `touchStructure(runtime)` is what wipes the work. Replace the orchestrator call with a single version-sync after the phase runs, and rewrite the in-phase direct `cache.xxx` calls to go through `applyEncounterCacheUpdate`:

```ts
// src/engine/phaseSublocations.ts
export function phaseSublocations(
  state: GameState,
  encounterCache?: EncounterCacheManager | null,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  // ...existing logic...
  for (const d of dissolutions) {
    if (runtime) {
      applyEncounterCacheUpdate(runtime, cache =>
        cache.onSublocationDestroyed(d.sublocationId, d.parentLocationId, state.graph));
    } else if (encounterCache) {
      // Legacy path — preserved so existing tests that don't build a runtime still work.
      encounterCache.onSublocationDestroyed(d.sublocationId, d.parentLocationId, state.graph);
    }
  }
  // ...same pattern for spawn...
}
```

`encounterCache` parameter stays on the signature for backward compatibility; the runtime path is preferred. Orchestrator line 2233 is dropped.

### Why bump `structuralCacheVersion` at all?

Three consumers:

1. **`ensureEncounterCache`** — we sync `encounterCacheBuiltAt` immediately after bump, so this stays current without rebuild.
2. **`ensureDistanceMatrix`** — does trigger rebuild. This is over-invalidation for settlement tier changes and sublocation spawns (neither changes location-to-location topology), but distance-matrix rebuild frequency is a separate deferral (see below).
3. **UI memos in `GameView.tsx:781` and `:795`** — these legitimately need to refresh on settlement tier changes (settlement icons) and location topology changes.

So the bump is load-bearing for the UI; the goal is only to skip the encounter-cache full rebuild.

### Tracing

Add a rebuild counter to `SimulationRuntime` and emit a trace when `buildFullCache` runs:

```ts
// src/types/trace.ts — new trace category
export interface EncounterCacheRebuildTrace extends BaseTrace {
  category: 'encounter_cache_rebuild';
  tick: number;
  reason: 'initial' | 'structural_invalidation' | 'fallback_after_failed_update';
  locationCount: number;
  totalRebuildsThisSession: number;
  durationMs?: number;
}

// simulationRuntime.ts: bump counter and emit inside ensureEncounterCache's rebuild branch.
```

Expose via debug bridge:

```ts
// src/debug-bridge.ts
window.__DEBUG.getEncounterCacheRebuildCount(): number
window.__DEBUG.getEncounterCacheRebuildTraces(): EncounterCacheRebuildTrace[]
```

### Verification

**Baseline capture:** before the refactor, run `npm run cli -- --seed 42 --map large` with `tick 30`, dump rebuild trace count. Expectation: 10–20 rebuilds (every 2–5 ticks once prosperity is climbing).

**Post-refactor expectation:** 1 initial build. Additional rebuilds only on location-level create/destroy (initial worldgen already done; ruin transformation from THR-153 would be the only in-game cause once shipped).

## Constants

| Name | Default | Purpose |
|------|---------|---------|
| `ENCOUNTER_CACHE_REBUILD_LOG_THRESHOLD` | 5 | Emit a `console.info` when rebuilds-per-tick exceed this (tunable alarm for over-invalidation regressions). Optional — CC may skip if it feels like premature ceremony. |

No other new constants — this is a refactor of invalidation bookkeeping, not a tuning change.

## Fail-Soft Table

| Failure case | Fallback |
|--------------|----------|
| `applyEncounterCacheUpdate` callback throws | Cache invalidated (set to null), `encounterCacheBuiltAt = -1`; next `ensureEncounterCache` rebuilds fully. Warning logged. |
| `cache.onSublocationCreated` called with bad parent id | Existing method fail-soft: no entry added, no throw. |
| `cache.onLocationTypeChanged` with unknown type | Existing method: removes old entries, `onLocationCreated` skips on `getLocationType() === null`. |
| `runtime` is `undefined` in a phase (legacy call path without runtime) | Phase falls back to the existing direct-cache mutation path or no-ops — behavior same as today. |
| `create_sublocation` outcome fires before cache has been built | `applyEncounterCacheUpdate` no-ops on the update; structuralCacheVersion bump still fires; next `ensureEncounterCache` builds fresh with the new sublocation already in the graph. |

## Tests

### New unit tests in `src/engine/__tests__/contracts/mutation-observability.contract.test.ts`

1. `applyEncounterCacheUpdate(runtime, fn)` on a built cache invokes `fn` with the cache, bumps `structuralCacheVersion`, bumps `worldVersion`, and advances `encounterCacheBuiltAt` to match `structuralCacheVersion`.
2. `applyEncounterCacheUpdate` on a null cache skips `fn`, still bumps `structuralCacheVersion` and `worldVersion`, does not crash.
3. `applyEncounterCacheUpdate` where `fn` throws → cache set to null, `encounterCacheBuiltAt = -1`, warning logged, versions still bumped.
4. After `applyEncounterCacheUpdate` on a built cache, `ensureEncounterCache` does NOT call `buildFullCache` (assert via spy or trace).

### New contract test `src/engine/__tests__/contracts/encounterCacheIncremental.contract.test.ts`

1. `phaseSettlementPromotion`: seed a hamlet, force promotion criteria, run phase. Verify:
   - `locationSubtype` is now `'town'`.
   - `encounterCacheBuiltAt === structuralCacheVersion`.
   - Cache entries for that location reflect the town's template pool (not hamlet's).
   - `buildFullCache` call count is 0 after the phase (only the initial build, captured before the phase).
2. `phaseSublocations`: trigger a market-district spawn, run phase. Verify cache has entries for the new sublocation id; `encounterCacheBuiltAt` synced; no full rebuild.
3. `phaseInitiativeProgress`: resolve an initiative with `create_sublocation` outcome. Verify cache reflects the new sublocation.
4. `phaseInitiativeProgress` with only bond/boost outcomes: assert `structuralCacheVersion` does **not** change.

### Regression

- `npm test` passes.
- `npx tsc --noEmit` clean.
- `npx vite build` succeeds.

### Manual verification

- `npm run cli -- --seed 42 --map large`, run 30 ticks, read `window.__DEBUG.getEncounterCacheRebuildCount()` equivalent CLI hook (or a `cache` status command). Expect rebuild count == 1 (initial build).
- Browser `?view=game&seeded` (large map, the world where THR-162 stalled): run past tick 30, confirm no regression in encounter variety / settlement icons. Rebuild count should stay near 1.

## Three-Pillar Check

| Pillar | Status | Notes |
|--------|--------|-------|
| **Engine** | ✓ | All changes in `simulationRuntime.ts`, `orchestrator.ts`, `phaseSettlementPromotion.ts`, `phaseSublocations.ts`, `phaseInitiativeProgress.ts`, `initiativeOutcomes.ts`, `strategicGraphOps.ts`. |
| **Content** | N/A | Pure invalidation-bookkeeping refactor; no encounter templates, prose, or data tables touched. |
| **UI** | ✓ (verification only) | No new UI surfaces. Must verify that settlement-tier UI memos in `GameView.tsx:781,795` still update on tier changes — we continue to bump `structuralCacheVersion`, so they should. Manual smoke test: promote a hamlet in the dev CLI, confirm the settlement icon updates. Optional: surface `getEncounterCacheRebuildCount()` in the Debug Panel → Diagnostics tab for future profiling. |

## Wiring Check

| Surface | Status |
|---------|--------|
| Orchestrator phases | 3 callsites updated (`phaseInitiativeProgress`, `phaseSettlementPromotion`, `phaseSublocations`) |
| Modal rendered in GameView JSX | N/A |
| GameState fields consumed by UI | No change; `structuralCacheVersion`-keyed memos still refresh correctly |
| Traces emitted | New `encounter_cache_rebuild` trace category |
| Debug bridge | New `getEncounterCacheRebuildCount()` / `getEncounterCacheRebuildTraces()` methods (optional but recommended) |
| Player controls | N/A |
| `Docs/plans/wiring-checklist.md` | Update: add `encounter_cache_rebuild` to trace categories list |

## NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| 1 Tunability | PASS | No new magic numbers introduced; one optional logging threshold if CC opts in. |
| 2 Inspectability | PASS with enhancement | New `encounter_cache_rebuild` trace + debug bridge counter *improve* inspectability vs today. |
| 3 Determinism | PASS | No RNG changes; cache-update order matches tick phase order, which is deterministic. |
| 4 Fail-soft | PASS | `applyEncounterCacheUpdate` has an explicit fallback to full rebuild on callback failure. |
| 5 Narrative over mechanical | PASS (N/A direction) | Invisible to the narrative layer. |
| 6 Additive over destructive | PASS | New helper added; existing `touchStructure` kept for callers outside the three affected phases. `phaseSublocations` signature extended with optional `runtime` param. |
| 7 Performance budget | **Primary motivation** | Expected to remove ~10–20 × 20–50ms rebuilds from a 30-tick large-map run, i.e. ~200–1000ms of tick-loop time reclaimed on the stall window that motivated THR-162. |

## Load-Bearing Decisions Respected

- The graph is mutated in place; version counters remain the single source of truth for change detection.
- `structuralCacheVersion` still over-invalidates the distance matrix (by design for v1). Splitting it into finer-grained version counters is the follow-up below, not this issue's scope.
- Relationships stay as edges; property mutations (locationSubtype, prosperity counters) continue to participate in version bumps.

## Follow-ups to File (deferrals)

1. **Targeted distance-matrix invalidation** — settlement tier changes and sublocation spawns do not change location-to-location topology, yet still force a distance-matrix rebuild via `structuralCacheVersion`. Splitting into `encounterCacheVersion` / `distanceMatrixVersion` would close the remaining over-invalidation. File as `Deferral` in Repo Health. *(Cowork will create this issue at handoff if CC confirms the split makes sense.)*
2. **Rebuild-count regression alarm** — `console.info` if rebuilds-per-100-ticks exceeds a tunable threshold, to catch over-invalidation regressions after future work.

## References

- `src/engine/simulationRuntime.ts` — touchStructure, ensureEncounterCache, buildFullCache sync marker
- `src/engine/orchestrator.ts` — three callsites at L1967, L2185, L2233
- `src/engine/encounterCache.ts` — existing `onLocationCreated` / `onLocationDestroyed` / `onLocationTypeChanged` / `onSublocationCreated` / `onSublocationDestroyed` APIs (already implemented)
- `src/engine/phaseSublocations.ts` — already applies incremental updates (L201, L231)
- `src/engine/phaseSettlementPromotion.ts` — needs incremental-update wiring
- `src/engine/phaseInitiativeProgress.ts` + `initiativeOutcomes.ts` — `create_sublocation` outcome needs wiring
- `src/components/Game/GameView.tsx:781,795` — UI memos that must continue to refresh on structuralCacheVersion bumps
- `src/engine/__tests__/contracts/mutation-observability.contract.test.ts` — extend with new assertions
- `Docs/plans/2026-04-19-tick-loop-scaling.md` — parent investigation, Part 2
- CLAUDE.md — "The world graph is mutated in place" load-bearing decision block
