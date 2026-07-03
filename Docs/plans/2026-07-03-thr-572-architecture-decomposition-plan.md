> **title:** `Architecture decomposition plan — THR-572`
> **linear_issue:** THR-572
> **author:** Cowork
> **created:** 2026-07-03
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Architecture decomposition plan — THR-572

*One sentence: three structural debts (a 3.8k-LOC god-component, a 10.5k-LOC content monolith, and lingering module-scope tick-loop caches) make every future change more expensive; this plan sequences their removal as small, additive, individually-verifiable steps rather than a big-bang refactor.*

## Why this is load-bearing

The 2026-07-02 architecture audit surfaced three couplings that tax every subsequent feature. `GameView.tsx` (3835 LOC, confirmed) coordinates the entire playable state as a single god-component with no defined child hierarchy, so any UI change risks touching the whole surface. `encounter-content.ts` (10545 LOC, confirmed) is a single-file content library that dominates repo LOC and makes content edits collide with unrelated content. And module-scope singleton caches still live in three engine files despite `SimulationRuntime` being the settled load-bearing decision ("Engine caches must be owned per session, not stored at module scope") — a direct correctness risk (cross-session cache bleed) the runtime was created to eliminate. None of these is a game-design change; all three are pure codebase-health work. The cost of deferral is compounding: coupling grows monthly, and the audit notes graph.ts importer count has already drifted from the 370 recorded in CLAUDE.md.

**Governing NFP: #6 (additive over destructive).** No step may delete-and-rewrite; every step adds the new structure, moves callers incrementally, and leaves the tree green. Each step is independently shippable and independently revertible.

## Blast Radius (high-impact files touched)

The GameView split (Phase 2) and any change reaching graph/gameState types touches ≥100-importer files. Authoritative importer counts must come from **codesight** (AST-based), not from `grep` — the sandbox's ripgrep proxy under-counts. CLAUDE.md's stated figures are stale (graph.ts listed as 370; the audit estimates ~497). Refreshing those numbers is a prerequisite deliverable (Phase 0 / THR child B) so every later phase reasons from real blast radius.

| File | CLAUDE.md (stale) | Audit estimate | Cascade risk |
|------|-------------------|----------------|--------------|
| `src/engine/graph.ts` | 370 | ~497 | Schema additions ripple through every node-creation site. Do not touch in Phases 1–2. |
| `src/types/gameState.ts` | 176 | ≥100 | GameView split reads many gameState fields; extraction must not reshape gameState — only relocate JSX/handlers. |
| `src/components/Game/GameView.tsx` | (not listed) | self | 3835 LOC; the split's own surface. Extract leaf-first to keep each step small. |
| `src/data/encounter-content.ts` | (not listed) | ~52 importers | Sharding must preserve the public export barrel so importers are untouched. |

## Engine pillar

### Systems design

The only engine-facing debt is **Phase 1: module-scope cache migration into `SimulationRuntime`.** `SimulationRuntime` (`src/engine/simulationRuntime.ts`) already owns the encounter cache, distance matrix, balance telemetry, eligibility funnel, and foreshadowing cache, with established `resetRuntimeCaches()` / `touchStructure()` invalidation hooks. Three engine modules still hold caches at module scope, which persist across game sessions if the page is not fully reloaded:

- `src/engine/detailPageGenerator.ts` — `_detailCache: Map<string, DetailPage>` + `_lastCachedTick` (line ~49). Consumed via `openDetailPage.ts` (UI-triggered detail rendering).
- `src/engine/proseGenerator.ts` — `_proseCache: Map<string, string>` + `_lastCachedTick` (line ~75).
- `src/engine/kpi/gameplayKpi.ts` — `BRANCHING_TEMPLATE_CACHE: Map<string, boolean>` (line ~178). Keyed by template id (effectively static per content build), lowest bleed risk of the three — migrate last, or leave with a documented justification if it is provably content-static.

Migration pattern (already exemplified by `foreshadowingCache`): add a typed field to the `SimulationRuntime` interface, initialize it in `createSimulationRuntime()`, thread the runtime into the cache's accessor functions (or pass the specific Map), and add a `.clear()` call in `resetRuntimeCaches()`. The `_lastCachedTick` guards fold into the runtime as well so tick-based invalidation is per-session.

### Graph nodes / edges

N/A — no graph schema change. This plan explicitly avoids touching `graph.ts` (highest-impact file) in all near-term phases.

### Tick phases

No new phase. The migrated caches are read during existing detail-page / prose / KPI-scoring paths; their call sites already run inside the current tick and UI-interaction flows. Verification requires the 30-tick engine smoke because `detailPageGenerator`, `proseGenerator`, and `gameplayKpi` sit on the tick-adjacent read path (CLAUDE.md pre-commit rule #6).

### Resolution logic

Unchanged. Cache keys and hit/miss logic are preserved verbatim; only ownership moves from module scope to the per-session runtime object.

### PRNG callouts

None. No randomness added or moved.

## Content pillar

### Encounter templates

**Phase 3: encounter-content sharding.** `encounter-content.ts` (10545 LOC) is split into domain shards under a directory (e.g. `src/data/encounter-content/`), re-exported through an `index.ts` barrel so the existing ~52 importers see an identical public surface (NFP #6 — additive; no importer edits). Suggested shard axis: by encounter family / scale (the same axis the KPI harness decomposes by), so future content work and balance work touch disjoint files. This phase is **content-mechanical, not authorial** — no prose is rewritten, only relocated. It is deliberately sequenced last because it is the largest byte-move and benefits from the cache/GameView patterns landing first (reviewer familiarity, established verification rhythm).

Sharding must be verified by: (a) `npx tsc --noEmit` clean, (b) a diff showing only moves + barrel additions (no content text changes), (c) `npm test` green on encounter-content-dependent suites. A follow-up issue will define the exact shard boundaries once Phase 1 lands.

### Prose tables

N/A — prose content is not edited; `proseGenerator.ts` cache migration (Phase 1) is engine-side and does not alter prose output.

## UI pillar

### Player-facing display

**Phase 2: GameView decomposition.** `GameView.tsx` (3835 LOC) is decomposed leaf-first into a defined component hierarchy. No behavior changes — this is a pure extraction refactor verified by DOM snapshot + a 1920×1080 browser pass (Viewport Contract). Extraction order (each an individually shippable step):

1. Extract self-contained presentational leaves (panels/overlays with no shared local state) into `src/components/Game/GameView/` subcomponents, passing props down. Snapshot-verify per extraction.
2. Extract handler clusters into hooks (`use*`) where a coherent slice of local state + effects can move together, following existing `useAgentInteraction` patterns.
3. Reduce `GameView.tsx` to a composition root that wires the extracted pieces.

Each step must keep `gameState` shape untouched (blast radius: gameState has ≥100 importers — the split relocates JSX and handlers only, never reshapes state). Because HexMapV2/Three.js may be within the render tree, canvas surfaces are verified with Claude-in-Chrome screenshots, DOM surfaces with Playwright (per the Definition of Done browser-verify rule).

### Event notifications

N/A — no new notifications.

### Debug inspection

Phase 1 exposes nothing new, but CC should confirm `encounterCacheRebuildCount`-style counters remain accurate after migration (the debug bridge already reads runtime cache stats). Phase 2 must preserve existing `window.__DEBUG` hooks that reach into GameView-rendered surfaces.

## Wiring section

- **Orchestrator phase:** none added. Phase 1 threads `SimulationRuntime` (already owned by `useSimulation`) into the three cache accessors — the runtime is already passed through the tick pipeline, so this is wiring an existing object into three more call sites.
- **UI component:** Phase 2 registers extracted subcomponents under `src/components/Game/GameView/`; update `Docs/plans/wiring-checklist.md` when new components/hooks are added.
- **GameState flow:** unchanged in all phases (hard constraint).
- **Traces:** no new trace categories.
- **Debug visibility:** preserve existing bridge hooks (Phases 1 & 2).
- **Prose pipeline:** unaffected.
- **Player controls:** unchanged.

## Migration order & sequencing rationale

1. **Phase 0 — CLAUDE.md importer-count refresh (child B).** Prerequisite. Run `npx codesight --wiki`, refresh the high-impact file list with real counts. Mechanical, disjoint from all code phases → parallel-safe with everything.
2. **Phase 1 — module-scope cache migration (child A).** Smallest, highest-correctness-value (kills cross-session bleed), establishes the reviewer rhythm. Engine-only.
3. **Phase 2 — GameView leaf-first split.** UI-only, snapshot- and browser-verified. Filed as a follow-up issue (or a small series) after Phase 1 lands.
4. **Phase 3 — encounter-content sharding.** Content-mechanical, largest byte-move. Filed as a follow-up once Phase 1/2 patterns are proven.

Phases 2 and 3 are intentionally **not** filed as Ready-for-Dev yet — they are larger and should be sized into CC-lane steps after Phase 1 confirms the additive approach. This keeps the executor queue fed with genuinely mechanical work now while deferring the bigger extractions until their shape is de-risked.

## Constants table

No new tunable constants. `MAX_DISTANCE_MATRIX_SIZE` (existing, 1200) is referenced by the runtime but unchanged.

## Tracing

No new trace types. Existing cache-rebuild counters (`encounterCacheRebuildCount`) are preserved.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Migrated cache field null before first init | Accessor treats null as empty (cache miss → recompute), identical to a cold module-scope cache. |
| `resetRuntimeCaches()` not called on session reset | Same risk profile as today for already-migrated caches; the migration strictly reduces bleed, never increases it. |
| GameView subcomponent extraction drops a prop | Caught by DOM snapshot diff + browser pass before merge (Definition of Done browser-verify is binary). |
| encounter-content barrel omits a shard export | Caught by `tsc --noEmit` (importer resolution failure) before merge. |

## NFP Compliance

| NFP | Verdict |
|-----|---------|
| 1. Tunability | PASS — no magic numbers introduced. |
| 2. Inspectability | PASS — debug-bridge cache counters preserved; per-session ownership *improves* inspectability. |
| 3. Determinism | PASS — no PRNG touched. |
| 4. Fail-soft | PASS — see fail-soft table; migration strictly reduces cross-session bleed. |
| 5. Narrative over mechanical | N/A — infrastructure refactor, no narrative surface. |
| 6. Additive over destructive | PASS (load-bearing) — every phase adds structure and moves callers incrementally; barrels/props preserve public surfaces so importers are untouched. |
| 7. Performance budget | PASS — no perf regression; per-session caches have identical hit/miss behavior. Profile GameView split only if snapshot timing regresses. |

## Follow-up issues to file

- **Child A (this handoff):** Phase 1 cache migration → Ready for Dev.
- **Child B (this handoff):** Phase 0 CLAUDE.md importer-count refresh → Ready for Dev.
- **Phase 2 (later):** GameView leaf-first split — file as a small series after Phase 1 lands.
- **Phase 3 (later):** encounter-content shard boundaries — file after Phase 1/2.
