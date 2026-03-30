# Phase 21: Performance - Research

**Researched:** 2026-03-30
**Domain:** TypeScript module-level caching, Vite code-splitting, performance profiling
**Confidence:** HIGH

## Summary

Phase 21 addresses three independent performance improvements. PERF-01 adds a tick-keyed prose
cache at the `generateEntityProse` entry point — the function already has pure inputs
`(nodeId, graph, seed, mode)` so cache key is `"${nodeId}:${tick}:${mode}"`. PERF-02 profiles
the `CACHE_REBUILD_THRESHOLD` constant to establish empirical rationale — the constant already
exists and is CMS-tunable; only a profiling run and comment are missing. PERF-03 splits three
large data files (13.8K lines total) out of the main 3097 kB initial bundle using Vite
`manualChunks` — the CMS chunk is already split this way, so the pattern is proven.

Key constraint: `unified-action-templates.ts` imports `encounter-content.ts` at module level.
Both files are consumed synchronously by the tick-loop engine at game start. True lazy/async
dynamic imports are not viable for engine modules called synchronously in orchestrator phases.
`manualChunks` is the right tool — it splits the files into separate network requests that the
browser can load in parallel but does not defer execution.

**Primary recommendation:** Use `manualChunks` for PERF-03 (not dynamic imports), module-level
Map with `"${nodeId}:${tick}:${mode}"` key for PERF-01, and CLI `run 30` + timing instrumentation
for PERF-02 profiling.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Prose caching (PERF-01)**
- Tick-based invalidation: cache is valid for the current tick number. New tick = cache miss on next panel open
- Multi-agent cache: keyed by `(agentId, tick)`. Multiple agents' prose can coexist. Opening A→B→A within the same tick hits cache for both
- Cache lives in a module-level Map (not React state) — resolvers are pure functions of graph state
- 20+ resolvers in `proseResolvers.ts` all recompute today; the cache wraps the caller (likely `proseGenerator.ts` or wherever resolvers are composed), not each individual resolver

**Encounter cache threshold (PERF-02)**
- `CACHE_REBUILD_THRESHOLD = 50` already exists in `agent-behavior-constants.ts:462`
- Already exposed in CMS tunable panel (`tunableConstants.ts:914`) with range [20, 100]
- The gap is profiling: run the game for N ticks, measure rebuild time vs patch time at various thresholds, document the rationale as a code comment
- STATE.md notes this is LOW confidence — must profile empirically before documenting

**Code-splitting (PERF-03)**
- Three target files: `encounter-content.ts` (8,483 lines), `unified-action-templates.ts` (2,906 lines), `culture-content.ts` (2,409 lines) — total 13.8K lines
- No `manualChunks` in `vite.config.ts` yet
- STATE.md warns about circular import risk: `unified-action-templates.ts` imports `encounter-content.ts`; need `validateTemplateRegistry()` at game start after split

### Claude's Discretion
- Exact cache data structure (Map vs WeakMap vs LRU)
- Max cache size / eviction policy
- Whether to use Vite `manualChunks` or dynamic `import()` or both for code-splitting
- Profiling methodology for PERF-02 (CLI vs browser, tick count, what to measure)
- Whether `proseGenerator.ts` or a new cache wrapper module is the right integration point

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | Prose resolver output cached by agent state hash; cache hit skips re-computation | Cache wraps `generateEntityProse` in `proseGenerator.ts`; key `"${nodeId}:${tick}:${mode}"` |
| PERF-02 | Encounter cache rebuild threshold profiled and tuned with documented rationale | `CACHE_REBUILD_THRESHOLD` constant already exists; profiling via CLI run + timing comment needed |
| PERF-03 | Large data files code-split via Vite manualChunks — encounter-content, action-templates, culture-content loaded on demand | `vite.config.ts` has no `manualChunks` yet; CMS chunk split proves pattern |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite (existing) | 7.3.1 (confirmed in build output) | Bundle splitting via `build.rollupOptions.output.manualChunks` | Already the project bundler; manualChunks is the documented Vite pattern for deterministic chunk assignment |
| TypeScript Map (built-in) | n/a | Module-level prose cache | Simple, O(1) lookup, familiar to the codebase (`encounterCache.ts` uses Map internally) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `performance.now()` (Web API) | n/a | Profiling `buildFullCache` and `buildEntriesForLocationAndSublocations` | PERF-02: measure wall-clock time in CLI/browser for threshold investigation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `manualChunks` | dynamic `import()` at call site | Dynamic imports are async — engine modules called synchronously from orchestrator phases cannot use async imports without a full architectural refactor |
| Plain `Map<string, string>` | LRU cache (e.g., `lru-cache` npm) | LRU adds a dependency and complexity; prose cache is bounded by `(distinct agent count × distinct modes)` which is small (50–200 entries); plain Map with tick-based invalidation is sufficient |
| WeakMap | Plain Map | WeakMap requires object keys; cache key is a composite string, so WeakMap is not applicable |

**Installation:** No new dependencies needed.

---

## Architecture Patterns

### Recommended Project Structure
No new directories needed. Changes are in:
```
src/engine/
├── proseGenerator.ts      # PERF-01: add module-level Map + cache wrapping logic
src/data/
├── agent-behavior-constants.ts  # PERF-02: update comment on CACHE_REBUILD_THRESHOLD
vite.config.ts             # PERF-03: add manualChunks
```

### Pattern 1: Module-Level Prose Cache (PERF-01)

**What:** A `Map<string, string>` lives at module scope in `proseGenerator.ts`. Cache key
encodes `nodeId`, `tick`, and `mode`. On a tick change, old entries become stale and are
naturally evicted by a full-cache-clear call (or left to accumulate — see eviction notes).

**When to use:** Any function with pure inputs that is called repeatedly from UI re-renders.

**Key is `"${nodeId}:${tick}:${mode}"`** — matches the locked decision: (agentId, tick) pair
with mode appended to avoid cross-mode collisions (AgentInfoCard uses `'summary'`,
LocationView uses `'full'`).

**Tick number access:** `generateEntityProse` does not currently receive a tick. The callers
(AgentInfoCard, HexChronicle, LocationView) have access to `gameState.tick` but do not pass it.
The cache needs a tick parameter — options:

1. **Add `tick` param to `generateEntityProse`** (recommended): Clean, explicit, follows existing
   pattern (`seed` already flows from gameState). Signature becomes
   `generateEntityProse(nodeId, graph, seed, mode, tick)`. Callers pass `gameState.tick`.
   Tests need updating to pass tick (easy: pass `0`).

2. **Store tick in a module-level variable set by caller before invocation**: Fragile, hidden
   coupling. Rejected.

**Eviction:** Two options — clear on tick advance vs. unbounded growth:
- Clearing on tick advance requires a `clearProseCache()` export and a call site (e.g.,
  orchestrator tick loop). Adds coupling.
- Unbounded Map with tick-keyed entries: entries from previous ticks remain in memory but are
  never returned (stale). Memory grows as `entries_per_tick × tick_count`. At 50 agents × 2
  modes × 500 ticks = 50,000 string entries ≈ manageable. But a 10-hour session could grow
  large.
- **Recommended**: Clear cache when tick changes (add `clearProseCache()` called from
  orchestrator or detect tick change inside `generateEntityProse` by comparing to a
  module-level `lastSeenTick` variable — auto-clear when tick advances).

**Example:**
```typescript
// src/engine/proseGenerator.ts — module-level cache

/** Prose cache: key = "${nodeId}:${tick}:${mode}" → computed prose string */
const _proseCache = new Map<string, string>();
let _lastCachedTick = -1;

export function generateEntityProse(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
  mode: ProseMode,
  tick: number,
): string {
  // Auto-evict all entries when tick advances
  if (tick !== _lastCachedTick) {
    _proseCache.clear();
    _lastCachedTick = tick;
  }

  const cacheKey = `${nodeId}:${tick}:${mode}`;
  const cached = _proseCache.get(cacheKey);
  if (cached !== undefined) return cached;

  // ... existing resolver logic ...
  const result = mode === 'summary' ? composeSummary(allLayers) : composeProse(allLayers);

  _proseCache.set(cacheKey, result);
  return result;
}

/** For testing: reset cache state between test runs */
export function clearProseCache(): void {
  _proseCache.clear();
  _lastCachedTick = -1;
}
```

**Trace amendment:** The existing `emitTrace` call in `generateEntityProse` fires on every
invocation including cache hits. After caching, move the trace to only fire on cache miss
(actual computation), or add a `cacheHit: boolean` field to the trace payload. The latter is
preferable for inspectability.

### Pattern 2: Vite manualChunks (PERF-03)

**What:** `build.rollupOptions.output.manualChunks` assigns specific modules to named chunks.
Vite/Rollup splits these into separate JS files loaded in parallel (not deferred) — the browser
fetches them as separate resources, improving parallelism and long-term cacheability, but they
are still part of the initial page load critical path unless the consuming code is itself
lazy-loaded.

**Critical insight on "loaded on demand":** The REQUIREMENTS.md says "loaded on demand" but
the CONTEXT.md says "separate lazy chunks". The correct interpretation for synchronously-consumed
engine data is: **parallel-loaded separate chunks** rather than deferred. These chunks will
still be fetched at page load but as separate network requests (parallelizable, cacheable
independently). True deferred loading would require async dynamic imports at engine call sites,
which is a major refactor incompatible with the synchronous tick loop.

**CMS already does this:** `ContentBrowser` is lazy-loaded via `lazy(() => import(...))`.
That works because ContentBrowser is UI-only and never called synchronously by the engine.
The data files being split in PERF-03 are different — they are consumed synchronously.

**manualChunks approach for vite.config.ts:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { constantWriter } from './vite-plugin-constant-writer';

export default defineConfig({
  plugins: [react(), tailwindcss(), constantWriter()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'data-encounter': ['./src/data/encounter-content.ts'],
          'data-action-templates': ['./src/data/unified-action-templates.ts'],
          'data-culture': ['./src/data/culture-content.ts'],
        },
      },
    },
  },
});
```

**Circular import note:** `unified-action-templates.ts` imports `encounter-content.ts`. Vite
handles this correctly — both can be in separate chunks; Rollup resolves the dependency and
ensures `encounter-content` chunk loads first. However, placing them in separate `manualChunks`
entries means Rollup must serialize the dependency. This is expected behavior and not a runtime
bug. The `validateTemplateRegistry()` concern from STATE.md was about dynamic async imports
(where the import promise might not resolve before first use); with `manualChunks` this does
not apply.

**Expected result:** Main bundle drops from ~3097 kB by approximately the size of these three
files. The exact savings depend on tree-shaking — confirmed lines: encounter-content (8,483),
unified-action-templates (2,906), culture-content (2,409). Most content is data arrays unlikely
to be tree-shaken away.

### Pattern 3: CACHE_REBUILD_THRESHOLD Profiling (PERF-02)

**What:** The constant already exists at `agent-behavior-constants.ts:462`. The task is to
run the CLI, measure rebuild time versus patch time at various thresholds, and document the
empirical finding as a code comment.

**Discovery from code review:** `CACHE_REBUILD_THRESHOLD` is imported into `encounterCache.ts`
but is NOT actually used in `EncounterCacheManager`'s own logic. The class rebuilds entries
per location individually (via `buildEntriesForLocationAndSublocations`) and does not have a
"dirty count vs threshold" decision. The threshold constant is exported from `encounterCache.ts`
for consumers, but no consumer was found actually comparing against it. This needs verification
during implementation — the profiling task may need to include identifying the actual decision
point where the threshold matters, or documenting that it's a reserved constant for future use.

**Profiling methodology (recommended):**
1. Run `npm run cli -- --seed 42 --map medium`
2. At the `fws>` prompt: `run 5` (auto-run 30+ ticks)
3. Check `encounters` output for cache rebuild stats
4. Add temporary `console.time('cacheRebuild')` / `console.timeEnd` around `buildFullCache`
5. Compare time at threshold 20 vs 50 vs 100 with 30/60/100 ticks accumulated
6. Document findings as inline comment

### Anti-Patterns to Avoid

- **Caching in React state:** React state triggers re-renders; module-level Map does not.
  The decision to use module-level Map is locked; don't introduce `useState` or `useRef` for
  this cache.
- **Dynamic import() for engine data:** Async imports cannot be awaited in synchronous tick
  phases. Do not introduce `await import(...)` inside orchestrator or engine modules.
- **Adding seed to cache key:** The `seed` param is already captured in the entity-level
  hash inside `generateEntityProse` (`const entitySeed = seed + Math.abs(idHash)`). Since
  the world seed is constant for a game session, it doesn't need to be in the cache key.
  `(nodeId, tick, mode)` is sufficient.
- **Memoizing with `useMemo` instead of module cache:** `AgentInfoCard` already uses
  `useMemo([card.id, graph, seed])`. This memoizes per React component instance, not across
  instances. Opening A→B→A within same tick would still recompute B's prose in A's memo slot.
  Module-level Map correctly handles the cross-instance case.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle splitting | Custom webpack/rollup config | `vite.config.ts` manualChunks | Vite already manages bundling; manualChunks is the official API |
| LRU eviction | Custom doubly-linked list + Map | Plain Map + tick-based auto-clear | Bounded entry count (agents × modes) makes LRU unnecessary complexity |

**Key insight:** All three optimizations layer on top of existing architecture. No new
infrastructure needed — the codebase already has the constant, the pure function, and the
bundler.

---

## Common Pitfalls

### Pitfall 1: Including `tick` in useMemo dependencies without passing to generateEntityProse
**What goes wrong:** If `tick` is added to `useMemo` deps in `AgentInfoCard` but `generateEntityProse`
doesn't receive it, React will re-render on every tick but the module cache won't know to invalidate.
**Why it happens:** Tick tracking in React vs module scope are separate concerns.
**How to avoid:** Extend `generateEntityProse` signature first, then update callers, then update useMemo deps.
**Warning signs:** Stale prose after tick advance.

### Pitfall 2: manualChunks breaks the CMS lazy chunk
**What goes wrong:** Adding `manualChunks` for data files could interact with the existing
`ContentBrowser` lazy split. Vite may merge or re-split chunks unexpectedly.
**Why it happens:** Rollup's chunk assignment is a graph problem; manual overrides can conflict with
automatic splitting.
**How to avoid:** Run `npx vite build` after adding `manualChunks` and verify:
(a) `ContentBrowser-*.js` chunk still exists, (b) new data chunks appear, (c) main `index-*.js` is smaller.
**Warning signs:** Build output missing expected chunk files or ContentBrowser chunk gone.

### Pitfall 3: CACHE_REBUILD_THRESHOLD is exported but possibly unused
**What goes wrong:** Profiling `buildFullCache` timing shows the threshold has no effect because
nothing compares against it in the current code.
**Why it happens:** The constant may be a design placeholder — it's exported and CMS-tunable but
the code review shows it's imported into `encounterCache.ts` without appearing in any conditional logic.
**How to avoid:** Before profiling, search all consumers of the exported constant for actual
comparison usage (`if (dirtyCount > CACHE_REBUILD_THRESHOLD)`). If none exist, the PERF-02
deliverable becomes: document what the constant is *intended* to gate (future incremental vs
full rebuild decision) and add a code comment to that effect.
**Warning signs:** Changing the constant via CMS has no measurable effect on behavior.

### Pitfall 4: Cache key collision between 'summary' and 'full' modes
**What goes wrong:** If mode is omitted from the cache key, a 'full' result would be returned for
a 'summary' request for the same entity on the same tick.
**Why it happens:** Early implementations key only on `(nodeId, tick)`.
**How to avoid:** Always include mode in key: `"${nodeId}:${tick}:${mode}"`.

### Pitfall 5: clearProseCache trace entry emitted on every tick
**What goes wrong:** If the auto-clear logic emits a trace, it produces noise on every tick
even when no prose was computed.
**Why it happens:** Reflexive trace-everything instinct.
**How to avoid:** Do not emit a trace for cache clear. Only trace cache hit/miss at computation time.

---

## Code Examples

### Cache with auto-eviction on tick change
```typescript
// Source: proseGenerator.ts (recommended pattern)
const _proseCache = new Map<string, string>();
let _lastCachedTick = -1;

export function generateEntityProse(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
  mode: ProseMode,
  tick: number,             // NEW param — pass gameState.tick from callers
): string {
  if (tick !== _lastCachedTick) {
    _proseCache.clear();
    _lastCachedTick = tick;
  }
  const key = `${nodeId}:${tick}:${mode}`;
  const hit = _proseCache.get(key);
  if (hit !== undefined) return hit;

  // ... resolver logic unchanged ...

  _proseCache.set(key, result);
  return result;
}

/** Export for test isolation (call between test cases) */
export function clearProseCache(): void {
  _proseCache.clear();
  _lastCachedTick = -1;
}
```

### Trace amendment for cache hits
```typescript
// Add cacheHit boolean to existing trace payload
emitTrace({
  tick: 0,
  category: 'narrative_generation',
  agentId: node.type === 'actor' ? nodeId : undefined,
  summary: `Prose [${mode}] for ${node.name}: cache miss — ${allLayers.length} layers → ${result.length} chars`,
  tier: 'notable',
  sphereWords: [],
  finalProse: result.slice(0, 120),
});
// On cache hit, no trace needed (or a lightweight 'narrative_cache_hit' at 'verbose' tier)
```

### manualChunks in vite.config.ts
```typescript
// Source: Vite 7 docs (rollupOptions.output.manualChunks)
export default defineConfig({
  plugins: [react(), tailwindcss(), constantWriter()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'data-encounter': ['./src/data/encounter-content.ts'],
          'data-action-templates': ['./src/data/unified-action-templates.ts'],
          'data-culture': ['./src/data/culture-content.ts'],
        },
      },
    },
  },
});
```

### Caller update pattern (AgentInfoCard example)
```typescript
// Before:
const agentProse = useMemo(() => {
  if (!graph || seed === undefined) return '';
  return generateEntityProse(card.id, graph, seed, 'summary');
}, [card.id, graph, seed]);

// After (pass tick, add to deps):
const agentProse = useMemo(() => {
  if (!graph || seed === undefined || tick === undefined) return '';
  return generateEntityProse(card.id, graph, seed, 'summary', tick);
}, [card.id, graph, seed, tick]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateEntityProse` recomputes on every call | Cache hit skips 20+ resolver calls | Phase 21 | Visibly faster second panel open for same agent |
| All data in one 3097 kB initial bundle | Data chunks split (estimate: -1.5–2 MB main bundle) | Phase 21 | Faster initial parse/eval time |
| `CACHE_REBUILD_THRESHOLD = 50` (undocumented rationale) | Same value with profiled rationale comment | Phase 21 | Developer confidence when tuning |

---

## Open Questions

1. **Is CACHE_REBUILD_THRESHOLD actually used in any conditional logic?**
   - What we know: Constant is defined, exported from `encounterCache.ts`, CMS-tunable, and
     imported into `encounterCache.ts` module scope. Code review found no `if (x > CACHE_REBUILD_THRESHOLD)` usage.
   - What's unclear: Whether it was intended for future use or whether the conditional was
     accidentally omitted in an earlier refactor.
   - Recommendation: Grep for comparison against the constant as first step of PERF-02 implementation.
     If unused: document it as a design-intent comment and add a TODO for the future incremental
     vs full rebuild decision.

2. **Should `generateEntityProse` signature change affect the test suite?**
   - What we know: 5 test files call `generateEntityProse` with the current 4-param signature.
   - What's unclear: Whether adding `tick` as a required 5th param (vs. optional with default)
     is better. Optional with default `0` means tests need no update and cache still works
     (all tests run at tick 0, same cache entry used — but that's correct for test isolation).
   - Recommendation: Make `tick` optional with default `0`. Add `clearProseCache()` call to
     test setup to guarantee isolation.

3. **How much will manualChunks actually reduce the main bundle?**
   - What we know: Main bundle is 3097 kB. The three files are 13.8K lines. Lines ≠ bytes after
     minification, and tree-shaking may not help (data arrays are fully consumed).
   - What's unclear: Exact byte savings until build runs with the change.
   - Recommendation: Run `npx vite build` with and without manualChunks, compare output sizes,
     document in commit message.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing) |
| Config file | none — detected via package.json scripts |
| Quick run command | `npm test -- --reporter=verbose src/engine/__tests__/proseGenerator.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | Second call same (nodeId, tick, mode) returns cached string, no resolver re-run | unit | `npm test -- src/engine/__tests__/proseGenerator.test.ts` | ✅ (extend existing) |
| PERF-01 | New tick number clears cache (different tick = fresh compute) | unit | `npm test -- src/engine/__tests__/proseGenerator.test.ts` | ✅ (extend existing) |
| PERF-01 | Different mode on same entity is NOT a cache hit | unit | `npm test -- src/engine/__tests__/proseGenerator.test.ts` | ✅ (extend existing) |
| PERF-02 | CACHE_REBUILD_THRESHOLD constant has comment with profiled rationale | manual | n/a — code review | ❌ Wave 0 (comment only) |
| PERF-03 | Build output contains separate data chunks | smoke | `npx vite build` then check dist/ filenames | ❌ Wave 0 (manual verification) |
| PERF-03 | Main bundle is smaller after split | smoke | `npx vite build` + compare sizes | ❌ Wave 0 (manual verification) |

### Sampling Rate
- **Per task commit:** `npm test` (all tests pass) + `npx tsc --noEmit`
- **Per wave merge:** `npm test` + `npx tsc --noEmit` + `npx vite build`
- **Phase gate:** Full suite green + build succeeds + manual verification of bundle sizes

### Wave 0 Gaps
- [ ] Extend `src/engine/__tests__/proseGenerator.test.ts` with cache hit/miss tests and `clearProseCache()` setup
- [ ] No framework gaps — vitest already installed and configured

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `src/engine/proseGenerator.ts` — confirms pure function signature and trace call location
- Direct code inspection of `src/engine/encounterCache.ts` — confirms `CACHE_REBUILD_THRESHOLD` import and `EncounterCacheManager` class structure
- Direct code inspection of `vite.config.ts` — confirms no existing `manualChunks`
- Build output from `npx vite build --mode development` — confirms 3097 kB main bundle, existing ContentBrowser chunk
- Direct code inspection of `src/App.tsx` — confirms `ContentBrowser` lazy split pattern already used
- Direct import graph inspection — confirms `unified-action-templates.ts` → `encounter-content.ts` sync dependency

### Secondary (MEDIUM confidence)
- Vite 7.3.1 build warning output directly references `manualChunks` and `dynamic import()` as the solutions for large chunks — confirms API name and approach

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tooling is existing project tooling (Vite, TypeScript Map)
- Architecture: HIGH — patterns derived from direct code inspection; no external dependencies to research
- Pitfalls: HIGH for PERF-01 and PERF-03; MEDIUM for PERF-02 (depends on profiling discovery about whether threshold is actually used)

**Research date:** 2026-03-30
**Valid until:** 2026-05-15 (stable; only risk is Vite major version bump changing manualChunks API)
