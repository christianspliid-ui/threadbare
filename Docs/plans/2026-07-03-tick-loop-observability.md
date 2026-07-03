# Tick-Loop Observability — per-phase timing + large-map stall diagnosis

**Date:** 2026-07-03
**Linear:** THR-570 (Engine Observability & Performance)
**Status:** Design complete, three-pillar compliant → Ready for Dev
**Author:** Cowork (keep-work-flowing PM pass)

---

## TL;DR

The issue's premise — "the tick loop runs 50+ phases with *zero* per-phase timing instrumentation" — is **only half true**, and the correction is the whole point of this design. Timing already exists for *registered* phases; it is missing for *inline* phases, which is where the heavy stall suspects live. This plan closes that asymmetry, adds a per-tick rollup, surfaces distance-matrix rebuilds (currently completely dark), gives the timing stream its own ring buffer so it stops evicting real traces, and exposes the data through a CLI `profile` command and `__DEBUG.getPhaseTimings()`. Then it lays out the methodology (and ranked code-reading hypotheses) to diagnose the large-map stall **with evidence**, which becomes tractable only once inline phases are timed.

---

## Current-state audit (read this before designing anything)

A blind "add timing from scratch" implementation would duplicate infrastructure that already exists and miss the actual gap. Verified against `origin/main`-adjacent working tree (HEAD `ca29e1e3`) on 2026-07-03:

**What already exists:**

| Capability | Location | Notes |
|---|---|---|
| `tick_phase_profile` trace type | `src/types/trace.ts:1836` (`TickPhaseProfileTrace`) | Typed. Carries `phase`, optional `durationMs`, `eventDelta`, and legacy actor-counter fields. |
| Per-**registered**-phase timing | `src/engine/phaseRegistry.ts:249` `runRegisteredPhases()` | Wraps `phase.run` in `performance.now()`, emits `tick_phase_profile` with `durationMs` + `eventDelta`. Already fail-soft (catches, emits `tick_crash`). |
| DebugPanel "Phases" tab | `src/components/Game/debug/PhasesDebugTab.tsx`, wired at `DebugTabContent.tsx:71,195` | Derives last-tick profile per phase from the trace buffer, grouped by slot. |
| Encounter-cache rebuild timing | `src/engine/simulationRuntime.ts:206-214` | Emits `encounter_cache_rebuild` with `durationMs` + `totalRebuildsThisSession`. |
| Inline event-count capture | `src/engine/orchestrator.ts:1930` `phaseEventCounts` | ~50 inline phases record event deltas; folded into the tick return at `:2550` (surfaced to debug state). |

**What is actually missing (the real gap):**

1. **Inline-phase timing.** `runTick` runs ~8 registered-phase slots interleaved with ~50 **inline** phase calls (`phaseAgentDecision`, `phaseMovement`, `phaseInitiativeProgress`, `phaseMentorship`, the rival/stealth/essence/economy clusters, etc.). Inline phases capture `phaseEventCounts` (event deltas) but **no wall-clock time** — except three legacy emitters (`familiarity_gain`, `effect_tick`, `mastery_decay`) that emit `tick_phase_profile` with the *actor-counter* payload and **no `durationMs`**. The inline sequence is the bulk of `runTick` and is a timing blind spot. **The prime stall suspects are all inline and untimed.**
2. **Distance-matrix rebuild is completely dark.** `ensureDistanceMatrix()` (`simulationRuntime.ts:231-239`) builds the matrix with **no trace and no timing** — asymmetric with `ensureEncounterCache()` right above it. `buildDistanceMatrix()` (`distanceMatrix.ts:89`) is O(L·(L+E)) BFS-per-location (~585 locations on `large`) and only ever `console.warn`s on cap overflow. This is the single most likely stall driver and we cannot currently see it fire.
3. **No per-tick rollup.** Nothing aggregates a whole tick: total tick ms, slowest phase, phase count, whether a cache rebuild fired this tick. You can't answer "which tick got slow and why" from the current stream.
4. **No aggregate accessor.** `PhasesDebugTab` derives *last-tick* values inline; there is no reusable aggregator (avg/max/last/p95 over a window) and nothing the CLI can call.
5. **No CLI `profile` command.** `scripts/cli.ts` has `tick`/`run` but no timing rollup command.
6. **Timing pollutes the shared trace ring.** `emitTrace` is a no-op unless tracing is enabled, but *when* it's enabled, ~65 phase-profile traces/tick evict the 2000-entry ring (`traceBuffer.ts:14`) in ~30 ticks — drowning the encounter/choice traces you enabled tracing to read in the first place. Profiling and semantic tracing currently cannibalize each other.

**Determinism note (load-bearing):** the seeded PRNG is `mulberry32(state.seed + state.tick * <prime>)`, re-seeded per phase (`orchestrator.ts:1969,2146,2154,2162`). `performance.now()` is already used for timing inside `runRegisteredPhases` and does **not** feed any RNG. All new timing must preserve this: measure *around* phase calls, never let a timing value influence a seed, a branch, or state. This keeps `--seed 42` reproducible (NFP #3).

---

## Engine pillar

### E1 — Time the inline phases (the core fix)

Introduce one small helper in `orchestrator.ts` that mirrors the registered-phase contract, so inline phases get identical `tick_phase_profile` timing without restructuring `runTick`:

```ts
// orchestrator.ts — internal helper, not exported
function runInlinePhase<T extends Partial<GameState>>(
  phaseId: string,
  s: GameState,
  run: () => T,
): { next: GameState; eventDelta: number } {
  const start = PROFILING_ENABLED ? performance.now() : 0;
  const prevEvents = s.tickEvents.length;
  const delta = run();
  const next = { ...s, ...delta };
  const eventDelta = next.tickEvents.length - prevEvents;
  if (PROFILING_ENABLED) {
    emitPhaseTiming({
      tick: next.tick,
      phase: phaseId,
      durationMs: performance.now() - start,
      eventDelta,
    });
  }
  return { next, eventDelta };
}
```

Migrate the inline call sites incrementally to `runInlinePhase('agent_decision', s, () => phaseAgentDecision(...))`. This preserves the existing `{ ...s, ...delta }` merge and `phaseEventCounts` semantics (event delta returned for callers that still populate `phaseEventCounts`), so it is an **additive** change (NFP #6). Migration order: the four heaviest suspects first (`agent_decision`, `agent_movement`, `unified_action_progress`, `encounter_progression`), then the rest. Phases with awkward signatures (extra RNG/context args) wrap the same way — the helper only cares about the `() => Partial<GameState>` thunk.

**Fold `phaseEventCounts` into the timing, don't duplicate it.** Since `runInlinePhase` already returns `eventDelta`, keep populating `phaseEventCounts[phaseId] = eventDelta` at the call site during migration (zero behavior change to the `:2550` return), or have the helper write into a passed-in counter map. Do not maintain two parallel event-delta mechanisms after migration completes.

### E2 — Trace distance-matrix rebuilds (close the dark spot)

Give `ensureDistanceMatrix()` the same treatment `ensureEncounterCache()` already has. Add a `distance_matrix_rebuild` trace with `durationMs`, `locationCount`, and a session rebuild counter on `SimulationRuntime` (`distanceMatrixRebuildCount`, mirroring `encounterCacheRebuildCount`):

```ts
// simulationRuntime.ts, ensureDistanceMatrix — additive
const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
runtime.distanceMatrix = buildDistanceMatrix(graph);
const durationMs = typeof performance !== 'undefined' ? performance.now() - t0 : undefined;
runtime.distanceMatrixRebuildCount++;
emitTrace({
  category: 'distance_matrix_rebuild',
  tick,                       // thread `tick` into ensureDistanceMatrix (it currently lacks it)
  locationCount: runtime.distanceMatrix.locationCount,
  totalRebuildsThisSession: runtime.distanceMatrixRebuildCount,
  durationMs,
  summary: `distance matrix rebuilt: ${runtime.distanceMatrix.locationCount} locations in ${durationMs?.toFixed(1)}ms`,
});
```

This alone may surface the stall: if `distance_matrix_rebuild` fires every tick past ~tick 60, the culprit is `touchStructure()` over-invalidation (a documented v1 tradeoff — see the load-bearing decision on `structuralCacheVersion`), not raw agent count.

### E3 — Per-tick rollup trace

Emit one `tick_profile` at the end of `runTick` summarizing the whole tick. This is the "which tick got slow and why" record:

```ts
export interface TickProfileTrace extends TraceBase {
  category: 'tick_profile';
  tick: number;
  totalMs: number;             // wall-clock for the whole runTick
  phaseCount: number;          // phases timed this tick
  slowestPhase: string;        // phase id with max durationMs
  slowestPhaseMs: number;
  agentCount: number;          // from graph — the stall's independent variable
  encounterCacheRebuilt: boolean;
  distanceMatrixRebuilt: boolean;
}
```

Wrap the whole `runTick` body in a `performance.now()` bracket (outside RNG seeding). `slowestPhase` is computed from the phase timings collected this tick.

### E4 — Dedicated timing ring buffer (stop the mutual eviction)

Add a small, separate ring in `traceBuffer.ts` for the timing categories so profiling and semantic tracing don't evict each other, each independently toggleable:

```ts
// traceBuffer.ts — additive, sibling to the existing buffer
const TIMING_BUFFER_SIZE = 4000;             // ~60 ticks at ~65 phases/tick
let timingBuffer: TraceEntry[] = [];
let profilingEnabled = false;

const TIMING_CATEGORIES = new Set(['tick_phase_profile', 'tick_profile',
  'encounter_cache_rebuild', 'distance_matrix_rebuild']);

export function emitPhaseTiming(entry: Omit<TickPhaseProfileTrace,'id'|'timestamp'|'category'>): void { /* routes to timingBuffer if profilingEnabled */ }
export function getTimingTraces(): ReadonlyArray<TraceEntry> { return timingBuffer; }
export function enableProfiling(): void { profilingEnabled = true; }
export function disableProfiling(): void { profilingEnabled = false; }
export function isProfilingEnabled(): boolean { return profilingEnabled; }
export function clearTimingTraces(): void { timingBuffer = []; }
```

`PROFILING_ENABLED` in the orchestrator reads `isProfilingEnabled()` (cached per tick to avoid a module round-trip in the hot loop). **Back-compat:** `runRegisteredPhases` currently routes phase profiles through `emitTrace` (the shared buffer). Switch it to `emitPhaseTiming` so registered and inline phases land in the same timing ring; keep `emitTrace` accepting the category as a fallback so existing tests that read `getTraces()` for `tick_phase_profile` still pass, OR update those tests to `getTimingTraces()` (they are contract tests in `phaseRegistry.test.ts:186`, `familiarityPhase.contract.test.ts:119` — this is the destructive edge; see Blast Radius).

### E5 — Aggregator

One pure function, consumed by both the CLI and the DebugPanel (no duplicate derivation logic):

```ts
export interface PhaseTimingAggregate {
  phase: string;
  lastMs: number; avgMs: number; maxMs: number; p95Ms: number;
  samples: number; lastEventDelta: number; crashed: boolean;
}
export function aggregatePhaseTimings(
  traces: readonly TraceEntry[], windowTicks?: number,
): PhaseTimingAggregate[];
```

### Constants table (NFP #1)

| Constant | Default | Purpose | File |
|---|---|---|---|
| `TIMING_BUFFER_SIZE` | 4000 | Dedicated timing ring capacity (~60 ticks) | `traceBuffer.ts` |
| `PROFILE_DEFAULT_WINDOW_TICKS` | 30 | Aggregation window when unspecified | `traceBuffer.ts` |
| `SLOW_PHASE_WARN_MS` | 8 | DebugPanel/CLI highlight threshold for a slow phase | `orchestrator.ts` |
| `SLOW_TICK_WARN_MS` | 50 | `tick_profile` "slow tick" highlight threshold | `orchestrator.ts` |
| `profilingEnabled` | `false` | Master toggle; profiling off by default (zero hot-loop cost) | `traceBuffer.ts` |

All timing capture is gated behind `PROFILING_ENABLED`; when off, the only added cost is one boolean check per phase (NFP #7 — no premature overhead in the default path).

### Fail-soft table (NFP #4)

| Failure case | Fallback |
|---|---|
| `performance.now()` undefined (non-browser/older node) | Guard `typeof performance !== 'undefined'`; `durationMs` omitted, phase still runs |
| Timing ring overflow | Ring eviction (same shift pattern as main buffer) |
| Inline phase throws | `runInlinePhase` does **not** swallow (parity with today's inline behavior — inline phases are not currently wrapped in try/catch; do not change crash semantics in this issue). Timing emit is skipped on throw. |
| Aggregator receives malformed/legacy trace | Skip entries missing `durationMs`; never throw |
| Profiling toggled mid-run | Buffers are independent; enabling mid-run simply starts collecting |

### Blast Radius (high-impact files touched)

- **`src/engine/traceBuffer.ts` — imported by ~106 files.** Changes here are additive (new exports, new ring); the one destructive edge is re-routing `tick_phase_profile` from the shared buffer to the timing ring, which touches contract tests that read `getTraces()` for that category (`phaseRegistry.test.ts:186,196`, `familiarityPhase.contract.test.ts:119-138`, `phaseRegistry.equivalence.test.ts:106`). Those tests must migrate to `getTimingTraces()` in the same PR. No production reader outside `PhasesDebugTab` consumes `tick_phase_profile`.
- **`src/engine/orchestrator.ts` — the tick loop.** `runInlinePhase` migration is mechanical but touches ~50 call sites; migrate incrementally and keep the CLI equivalence smoke green between batches. Engine-smoke gate applies (see Verification).
- **`src/engine/simulationRuntime.ts`** — new counter field + `ensureDistanceMatrix` signature gains `tick`. All call sites of `ensureDistanceMatrix` must pass `tick` (grep before editing).

---

## Content pillar — N/A

No encounter templates, prose tables, attachment content, or data tables are involved. This is engine instrumentation and developer-facing UI. Marked N/A with rationale per the three-pillar rule.

---

## UI pillar

### U1 — Extend the existing `PhasesDebugTab` (do not build a new tab)

The "Phases" tab already exists and groups per-slot. Extend it, don't replace it:
- Read from `getTimingTraces()` + the new `aggregatePhaseTimings()` instead of deriving inline.
- Add columns: `avgMs`, `maxMs`, `p95Ms` alongside the existing last-tick `durationMs`/`eventDelta`.
- Render **inline phases** (now timed) interleaved with registered phases; today the tab only shows registry phases + the 3 legacy inline emitters. Group inline phases under a synthetic "inline (runTick)" section since they have no slot.
- Highlight rows over `SLOW_PHASE_WARN_MS` (gold/red per existing `debugPanelStyles`).
- Add a compact `tick_profile` header row: last tick total ms, slowest phase, agent count, rebuild flags.
- Add a "Profiling: on/off" toggle wired to `enableProfiling()`/`disableProfiling()`.

### U2 — CLI `profile` command

Add to the `scripts/cli.ts` switch (no registry; direct case per existing pattern):

```
fws> profile [N]        run N ticks with profiling on, print per-phase avg/max/p95 + slowest ticks
fws> profile phases     print the aggregate table for ticks already run
```

Implementation: `enableProfiling()`, run N ticks, call `aggregatePhaseTimings(getTimingTraces())`, print a sorted table (slowest first) plus the `tick_profile` rollup for the slowest 3 ticks. Add to `help` text.

### U3 — `__DEBUG.getPhaseTimings()`

Following the debug-bridge pattern (`debug-bridge.ts`, typed in `debug-bridge.d.ts`):

```ts
getPhaseTimings: (windowTicks?: number) =>
  Promise.all([
    import('./engine/traceBuffer').then(m => m.getTimingTraces()),
    import('./engine/traceBuffer').then(m => m.aggregatePhaseTimings),
  ]).then(([traces, agg]) => agg(traces, windowTicks)),
enableProfiling: () => import('./engine/traceBuffer').then(m => m.enableProfiling()),
disableProfiling: () => import('./engine/traceBuffer').then(m => m.disableProfiling()),
```

Add matching signatures to `debug-bridge.d.ts` `DebugBridge`.

### Browser-verify tool (Definition of Done)

The DebugPanel "Phases" tab is a **DOM** surface (not WebGL) → verify with **Playwright**: `preview_resize(1920,1080)` → open `?view=game&seeded&size=medium` → `F1` (DebugPanel → CLI) or backtick → Phases tab → screenshot + `browser_console_messages`. State assertion: `window.__DEBUG.getPhaseTimings()` returns a non-empty array after `enableProfiling()` + a few ticks. Paste screenshot + console block + the `getPhaseTimings()` output in the closing comment.

---

## Wiring section

| Module | Orchestrator | UI | GameState | Traces | Debug | Player controls |
|---|---|---|---|---|---|---|
| `runInlinePhase` | inline, all slots | PhasesDebugTab | none (no schema change) | `tick_phase_profile` | Phases tab + `__DEBUG.getPhaseTimings` | n/a (dev-only) |
| `tick_profile` | end of `runTick` | PhasesDebugTab header | none | `tick_profile` | Phases tab | n/a |
| `distance_matrix_rebuild` | `ensureDistanceMatrix` | PhasesDebugTab (rebuild flag) | `SimulationRuntime.distanceMatrixRebuildCount` | `distance_matrix_rebuild` | existing cache inspector | n/a |
| timing ring + toggle | — | toggle in Phases tab | none | — | `__DEBUG.enableProfiling` | n/a |

Update `Docs/plans/wiring-checklist.md` (new trace categories `tick_profile`, `distance_matrix_rebuild`) and the systemic-wiring guide is **not** required (no new content-facing capability).

---

## Phase 2 — Large-map stall diagnosis methodology

The issue's "Done when" asks for the stall root cause **with evidence, not hypothesized**. That is only achievable once E1/E2/E3 land — you cannot evidence a per-phase cost that isn't measured. So Phase 2 is gated on Phase 1 and proceeds as:

1. `npm run cli -- --seed 42 --map large`, then `profile 80` (drives past the ~tick-72 stall point).
2. Read the `tick_profile` series: find the tick where `totalMs` inflects upward and read its `slowestPhase` + rebuild flags.
3. Confirm the driver against the ranked hypotheses below.

**Ranked code-reading hypotheses (evidence to confirm, in priority order):**

1. **Distance-matrix rebuild storm (most likely).** `buildDistanceMatrix` is O(L·(L+E)) BFS-per-location, ~585 locations on `large`, and `ensureDistanceMatrix` rebuilds whenever `structuralCacheVersion` advances. `touchStructure()` bumps that counter *and* is called on subtype changes / node adds, which spike as settlements promote and agents/sublocations spawn mid-run. If `distance_matrix_rebuild` (new in E2) fires most ticks past ~tick 60, this is it. **Confirm:** `distanceMatrixRebuildCount` climbing ~1/tick.
2. **Encounter-cache rebuild coupled to the same over-invalidation.** `ensureEncounterCache` is O(L·T·S). It already traces `durationMs`; correlate its rebuild ticks with the `tick_profile` inflection. **Confirm:** `encounter_cache_rebuild.totalRebuildsThisSession` climbing per tick.
3. **`phaseAgentDecision` / `phaseMovement` super-linear scaling** at ~1010 agents (per-agent × per-location distance lookups). Now inline-timed by E1. **Confirm:** their `avgMs` growing with `agentCount` in `tick_profile`.
4. **Awareness scan fallback** (`encounterAwareness.ts`) iterating all locations when the matrix is momentarily null after invalidation — a second-order effect of hypothesis 1.

If hypothesis 1 confirms, the **fix plan** (staged as a follow-on CC issue, not this one) is to split `structuralCacheVersion` into finer-grained versions (distance-topology vs. encounter-scoring), so a subtype change that only affects encounter scoring no longer forces a distance-matrix rebuild — exactly the split the load-bearing decision anticipated ("split into finer-grained versions only if profiling shows unnecessary rebuilds are costly"). This design produces that profiling evidence.

---

## Implementation breakdown (for the executor)

Sized as one issue (THR-570) with an internal sequence; the stall-fix is a deliberate follow-on:

1. **E4 timing ring + toggle** (traceBuffer) — foundational, additive; migrate the 4 contract tests.
2. **E1 `runInlinePhase` + migrate 4 heavy suspects** (orchestrator) — CLI equivalence smoke between batches.
3. **E2 distance-matrix trace + counter** (simulationRuntime) — thread `tick` through `ensureDistanceMatrix`.
4. **E3 `tick_profile` rollup** (orchestrator).
5. **E5 aggregator** (traceBuffer, pure fn).
6. **U1/U2/U3** (PhasesDebugTab, CLI, debug-bridge).
7. Migrate remaining inline phases to `runInlinePhase` (mechanical tail).
8. **Phase 2 diagnosis** → produce evidence + a **new** follow-on issue with the fix plan (do not bundle the fix into THR-570).

## NFP compliance

| NFP | Verdict | Note |
|---|---|---|
| 1 Tunability | PASS | All thresholds/sizes are named constants |
| 2 Inspectability | PASS (this is the point) | Closes the inline-phase + distance-matrix blind spots; adds tick rollup |
| 3 Determinism | PASS | Timing measured around phases; never feeds RNG/seed/branch. `--seed 42` unaffected |
| 4 Fail-soft | PASS | Guards for missing `performance`; aggregator skips malformed; no crash-semantics change |
| 5 Narrative > mechanical | N/A | Dev tooling |
| 6 Additive > destructive | PASS with note | Additive except re-routing `tick_phase_profile` to the timing ring (4 contract tests migrate) |
| 7 Performance budget | PASS | Profiling off by default; one boolean check per phase when off; measure-before-optimize is the entire premise |

## Open decisions made autonomously (scheduled run — no human present)

- **Reshaped the issue from "add timing" to "close the inline/distance gap + rollup + dedicated ring"** based on the current-state audit. The design still satisfies every "Done when" checkbox.
- **Separate timing ring** (E4) over reusing the main buffer, because 65 profiles/tick otherwise evict semantic traces in ~30 ticks.
- **Stall *fix* deferred to a follow-on issue**, keeping THR-570 to instrumentation + evidence. Diagnosis (Phase 2) stays in scope; the structural-version split is a separate, larger change.
- **Suggested model: opus** — engine work touching a 106-importer file with determinism constraints and a ~50-call-site migration.
