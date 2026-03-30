# Phase 21: Performance - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Three performance optimizations: (1) cache prose resolver output so reopening an agent panel is fast, (2) profile and document the encounter cache rebuild threshold, (3) code-split large data files out of the initial bundle.

</domain>

<decisions>
## Implementation Decisions

### Prose caching (PERF-01)
- Tick-based invalidation: cache is valid for the current tick number. New tick = cache miss on next panel open
- Multi-agent cache: keyed by `(agentId, tick)`. Multiple agents' prose can coexist. Opening A→B→A within the same tick hits cache for both
- Cache lives in a module-level Map (not React state) — resolvers are pure functions of graph state
- 20+ resolvers in `proseResolvers.ts` all recompute today; the cache wraps the caller (likely `proseGenerator.ts` or wherever resolvers are composed), not each individual resolver

### Encounter cache threshold (PERF-02)
- `CACHE_REBUILD_THRESHOLD = 50` already exists in `agent-behavior-constants.ts:462`
- Already exposed in CMS tunable panel (`tunableConstants.ts:914`) with range [20, 100]
- The gap is profiling: run the game for N ticks, measure rebuild time vs patch time at various thresholds, document the rationale as a code comment
- STATE.md notes this is LOW confidence — must profile empirically before documenting

### Code-splitting (PERF-03)
- Three target files: `encounter-content.ts` (8,483 lines), `unified-action-templates.ts` (2,906 lines), `culture-content.ts` (2,409 lines) — total 13.8K lines
- No `manualChunks` in `vite.config.ts` yet
- STATE.md warns about circular import risk: `unified-action-templates.ts` imports `encounter-content.ts`; need `validateTemplateRegistry()` at game start after split

### Claude's Discretion
- Exact cache data structure (Map vs WeakMap vs LRU)
- Max cache size / eviction policy
- Whether to use Vite `manualChunks` or dynamic `import()` or both for code-splitting
- Profiling methodology for PERF-02 (CLI vs browser, tick count, what to measure)
- Whether `proseGenerator.ts` or a new cache wrapper module is the right integration point

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prose resolver system (PERF-01)
- `src/engine/proseResolvers.ts` — 20+ resolver functions, all pure (nodeId, graph, seed) → ProseLayer[]
- `src/engine/proseGenerator.ts` — Composes resolvers into full prose output
- `Docs/plans/2026-03-09-prose-generator-framework-design.md` — Prose system design doc

### Encounter cache (PERF-02)
- `src/engine/encounterCache.ts` — Cache implementation, uses CACHE_REBUILD_THRESHOLD
- `src/data/agent-behavior-constants.ts:462` — CACHE_REBUILD_THRESHOLD = 50
- `src/components/CMS/tunableConstants.ts:914` — Tunable panel entry with range [20, 100]

### Code-splitting targets (PERF-03)
- `src/data/encounter-content.ts` — 8,483 lines, encounter templates
- `src/data/unified-action-templates.ts` — 2,906 lines, action templates (imports encounter-content)
- `src/data/culture-content.ts` — 2,409 lines, culture data
- `vite.config.ts` — No manualChunks yet

### Requirements
- `.planning/REQUIREMENTS.md` — PERF-01, PERF-02, PERF-03 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CACHE_REBUILD_THRESHOLD` constant: Already named, documented, and tunable via CMS panel
- `mulberry32` PRNG: Used in resolvers for deterministic prose selection — cache must be seed-aware
- `encounterCache.ts`: Existing cache pattern with dirty-count tracking and rebuild logic

### Established Patterns
- Data constants are in `src/data/` with capitalized exports (e.g., `UNIFIED_ACTION_TEMPLATES`)
- Tunable constants are registered in `tunableConstants.ts` with ranges and descriptions
- No existing code-splitting — all data is eagerly imported

### Integration Points
- Prose resolvers are called from `proseGenerator.ts` which is called from UI components (agent detail panel)
- `encounterCache.ts` is called from encounter pipeline phases in the orchestrator
- Data files are imported directly by engine modules — code-split requires switching to dynamic imports at consumption sites

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the success criteria in ROADMAP.md are precise enough. This is optimization work with measurable outcomes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 21-performance*
*Context gathered: 2026-03-30*
