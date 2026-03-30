# Architecture Research

**Domain:** React + TypeScript simulation game (v1.0 → v1.1 optimization)
**Researched:** 2026-03-30
**Confidence:** HIGH (direct codebase inspection)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React UI Layer                           │
│  ┌──────────────┐  ┌────────────┐  ┌───────────────────┐    │
│  │  GameView    │  │ DebugPanel │  │   HexMapV2        │    │
│  │  (1774 lines)│  │ (12 tabs)  │  │  (Three.js canvas)│    │
│  └──────┬───────┘  └─────┬──────┘  └────────┬──────────┘    │
├─────────┼────────────────┼──────────────────┼───────────────┤
│         │       UI Hooks Layer               │               │
│  ┌──────▼───────────────────────────────┐   │               │
│  │  useSimulation / useAvatarData       │   │               │
│  │  useNotifications / useTargetActions │   │               │
│  └──────────────────┬───────────────────┘   │               │
├─────────────────────┼─────────────────────────────────────── │
│                Game Engine Layer                             │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │        orchestrator.ts  runTick()                    │   │
│  │   ~40 pure phase functions in sequence               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ resolution.ts│  │ encounter.ts│  │ meetingEncounter   │   │
│  │ (Math.random)│  │ (tick path) │  │ (Math.random ID)  │   │
│  └──────────────┘  └─────────────┘  └───────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│                   Data Layer                                 │
│  ┌────────────────────────┐  ┌──────────────────────────┐   │
│  │ encounter-content.ts   │  │ unified-action-templates  │   │
│  │ (336KB / 8480 lines)   │  │ (122KB / 2906 lines)      │   │
│  └────────────────────────┘  └──────────────────────────┘   │
│  ┌────────────────────────┐  ┌──────────────────────────┐   │
│  │ culture-content.ts     │  │ prose-layer-content.ts    │   │
│  │ (112KB / 2409 lines)   │  │ (98KB)                    │   │
│  └────────────────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Integration Surface |
|-----------|----------------|---------------------|
| `orchestrator.ts` | Sequence ~40 tick phases, merge partial GameState updates | Imports data files directly; called by `useSimulation` |
| `resolution.ts` | d100 roll + outcome classification | `rollD100()` calls `Math.random()` — no PRNG injection point yet |
| `meetingEncounter.ts` | Create agent nodes from meeting encounters | Uses `Math.random()` for agent ID generation (line 422) |
| `encounterCache.ts` | Pre-score location-template pairs | Rebuilt when location count delta > `CACHE_REBUILD_THRESHOLD` |
| `proseResolvers.ts` | 20+ resolver functions producing ProseLayer fragments | Recomputed on every agent detail panel open — no cache |
| `DebugPanel.tsx` | 12-tab debug viewer, 1774 lines | 8 `useState` hooks in main component; sub-components partially extracted |
| `encounter-content.ts` | 94 encounter templates, lookup functions | Imported synchronously by orchestrator, encounterCache, phaseAgentDecision |

## Recommended Project Structure

The existing structure is sound. Changes for v1.1 are surgical additions, not reorganization:

```
src/
├── engine/
│   ├── resolution.ts          # Add: rng?: () => number parameter to resolveAction()
│   ├── meetingEncounter.ts    # Add: rng parameter to createAgentFromMeeting()
│   ├── proseCache.ts          # NEW: keyed prose cache module
│   └── encounterCache.ts      # Tune: CACHE_REBUILD_THRESHOLD value
├── components/Game/
│   ├── DebugPanel.tsx         # Extract remaining tab content to debug/
│   └── debug/
│       ├── FeedTab.tsx        # NEW: trace feed tab content (~400 lines)
│       ├── FactionsTab.tsx    # NEW: factions tab content (~300 lines)
│       ├── ArmiesTab.tsx      # NEW: armies tab content (~200 lines)
│       ├── SphereStateTab.tsx # NEW: sphere state tab content (~150 lines)
│       └── JourneyDebugTab.tsx # NEW: journey debug content (~100 lines)
└── data/
    └── [files unchanged]      # Code splitting deferred — see notes below
```

### Structure Rationale

- **`debug/` directory:** Already used for `EncounterCacheView`, `DecisionBreakdown`, `RelationshipGraph`, `WebGLDebugTab`, `RevelationLogTab`, `KnowledgeComparisonTab`. The remaining heavy tabs (`FeedTab`, `FactionsTab`, `ArmiesTab`) follow the same pattern.
- **`proseCache.ts`:** New module rather than inline Map in proseResolvers.ts — keeps resolver functions pure (cache is a side effect injected at call site).
- **Data files unchanged structurally:** Dynamic import of data files would require async load paths. Since `orchestrator.ts` is called synchronously each tick, switching data imports to dynamic would require converting phase functions to async — a large refactor. Better to leave structure and instead rely on Vite's tree-shaking per chunk.

## Architectural Patterns

### Pattern 1: PRNG Injection via Optional Parameter

**What:** Add an optional `rng?: () => number` parameter to functions that currently call `Math.random()`. When provided, use it; when absent, fall back to `Math.random()` for backward compatibility.

**When to use:** `resolution.ts:rollD100()`, `meetingEncounter.ts:createAgentFromMeeting()`, `agentSelection.ts` (2 call sites), `dream.ts`, `rival.ts`.

**Trade-offs:**
- PRO: Non-breaking — all existing callers without `rng` keep working.
- PRO: Test suite can pass deterministic roll values via `deterministicRoll` (already done in encounter.ts).
- CON: Each call site in orchestrator needs to construct and pass the rng. Use `mulberry32(state.seed + state.tick * PRIME + hashString(actorId))` — the pattern already used in 30+ other engine modules.

**Example:**
```typescript
// resolution.ts — before
function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}
export function resolveAction(probability: number, deterministicRoll?: number): ResolutionResult {
  const roll = deterministicRoll ?? rollD100();

// resolution.ts — after
export function resolveAction(
  probability: number,
  deterministicRoll?: number,
  rng?: () => number,
): ResolutionResult {
  const roll = deterministicRoll ?? (rng ? Math.floor(rng() * 100) + 1 : rollD100());
```

Callers in `encounter.ts` (line 139) already pass `deterministicRoll` — they stay unchanged. New callers in the orchestrator pass `rng`.

### Pattern 2: Prose Cache with State-Hash Key

**What:** Memoize `proseResolvers.*` output keyed by `nodeId + relevant state hash`. Invalidate when agent state changes (capability growth, status, sphere).

**When to use:** `HexChronicle.tsx` calls `historicalCultureResolver`, `regionEtymologyResolver`, `geographicRegionResolver` on render. The agent detail panel calls multiple resolvers per open.

**Trade-offs:**
- PRO: Eliminates repeated graph walks and template string construction for unchanged agents.
- CON: Cache is a module-level Map — it is a side effect in an otherwise pure system. Must be cleared on game reset (hook into `resetDecisionCache()`).
- CON: Cache key must include all graph state that affects prose output. Using `nodeId + tick` is too aggressive (invalidates every tick). Better: `nodeId + agentCapabilityHash + agentStatusFlags`.

**Example:**
```typescript
// proseCache.ts
const cache = new Map<string, ProseLayer[]>();

export function getCachedProse(
  key: string,
  compute: () => ProseLayer[],
): ProseLayer[] {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const result = compute();
  cache.set(key, result);
  return result;
}

export function invalidateProseCache(nodeId?: string): void {
  if (nodeId) {
    // Remove all keys starting with nodeId
    for (const k of cache.keys()) {
      if (k.startsWith(nodeId)) cache.delete(k);
    }
  } else {
    cache.clear();
  }
}
```

Call site in resolver:
```typescript
export function biomeResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const terrain = graph.getNode(nodeId)?.properties?.terrain as string | undefined;
  const key = `biome:${nodeId}:${terrain ?? 'none'}`;
  return getCachedProse(key, () => { /* existing logic */ });
}
```

### Pattern 3: DebugPanel Tab Extraction

**What:** Extract each `ViewMode` case's render logic into a dedicated `React.memo` component in `src/components/Game/debug/`.

**When to use:** Remaining inline tabs: `FeedTab` (trace filter UI + trace list ~400 lines), `FactionsTab` (~200 lines), `ArmiesTab` (~200 lines), `SphereStateTab` (~150 lines), `JourneyDebugTab` (already a function, needs `React.memo`).

**Trade-offs:**
- PRO: Each tab component only re-renders when its own props change, not on every `currentTick` update.
- PRO: DebugPanel's main component shrinks from 1774 lines to ~400 lines.
- CON: Props drilling increases — each tab gets a subset of DebugPanel's 20+ props. Not a problem given static prop shape.
- Already partially done: `SocialTabContent`, `JourneyDebugContent`, `WebGLDebugTab`, `EncounterCacheView` are extracted. The trace feed (largest section, ~400 lines) remains inline.

**Pattern:**
```typescript
// debug/FeedTab.tsx
interface FeedTabProps {
  currentTick: number;
  viewMode: ViewMode;
  enabledCategories: Set<TraceCategory>;
  // ... only the props this tab needs
}
export const FeedTab = React.memo(function FeedTab(props: FeedTabProps) {
  // Move trace filter UI + trace list here
});
```

### Pattern 4: Event ID Determinism

**What:** Replace `Date.now()` in event ID generators with `tick + counter` scheme.

**When to use:** `phaseMandate.ts:32`, `phaseDoom.ts:28`, `phaseControlEffects.ts:53`, `orchestrator.ts` crash log entries (1326, 1346 — these are timestamps, not IDs, so they stay as `Date.now()`).

**Trade-offs:**
- PRO: Eliminates the cross-session collision risk. Same tick + same counter = same ID = deterministic replay.
- PRO: The `eventCounter` pattern already exists in `orchestrator.ts` (line 152-158) with a `resetEventCounter()` export. The other three modules (`phaseMandate`, `phaseDoom`, `phaseControlEffects`) have local counters that follow the same shape but use `Date.now()` as prefix.
- CON: Module-level counters must be reset between games. `resetDecisionCache()` is the existing reset hook — add `resetEventCounters()` call there or export a unified reset.

**Example:**
```typescript
// phaseDoom.ts — before
return `doom_evt_${Date.now()}_${eventCounter++}`;

// phaseDoom.ts — after
return `doom_evt_${tick}_${eventCounter++}`;
// or pass tick in as parameter
```

## Data Flow

### Tick Loop (Critical Path)

```
useSimulation.doTick()
    ↓
orchestrator.runTick(gameState)
    ↓ imports synchronously at module load time
[encounter-content.ts] ← 336KB, loaded once, referenced by 5 engine modules
[unified-action-templates.ts] ← 122KB, loaded once
    ↓ executes ~40 pure phase functions in sequence
resolveAction(probability, deterministicRoll?)  ← Math.random() if no deterministicRoll
createAgentFromMeeting(...)                      ← Math.random() for ID
    ↓
returns Partial<GameState>
    ↓
setGameState(newState) → React re-render
```

**Key invariant:** All data imports are synchronous ES module imports. They execute once at app startup (not per tick). The bundle cost is paid at load time, not at runtime. This is why "code splitting data files" is lower impact than the CONCERNS.md suggests — the data is already in memory after first load.

### Prose Resolution Path (UI-Triggered)

```
User opens agent detail panel
    ↓
HexChronicle.tsx or AgentDetail renders
    ↓
proseResolvers.biomeResolver(nodeId, graph, seed)
    ↓ graph walk: getNode() → properties.terrain → BIOME_PROSE lookup → pickTemplate()
returns ProseLayer[]
    ↓ (no cache — recomputed on every render)
```

**Optimization target:** Cache keyed by `nodeId + terrain + seed` eliminates recomputation for unchanged agents. The graph walk is cheap but `pickTemplate()` with `mulberry32` has fixed cost; more importantly, the 20+ resolver calls compound.

### Encounter Cache Data Flow

```
game start:
    encounterCache.buildFullCache(graph) ← one-time O(locations × templates)

each tick:
    encounterCache built? ↓ no → build now
                         ↓ yes
    location delta > CACHE_REBUILD_THRESHOLD? ↓ yes → full rebuild
                                              ↓ no  → use cached entries

callbacks:
    onLocationCreated(id) → add entries for new location
    onLocationDestroyed(id) → remove entries
    onLocationTypeChanged(id) → remove + re-add
```

**Fragile point:** If `phaseSettlementPromotion` changes a location's type without calling `onLocationTypeChanged`, cache becomes stale. The callbacks are the single integration point — all location mutation paths must route through them.

## Scaling Considerations

| Scale | Architecture Adjustment |
|-------|-------------------------|
| v1.1 (current, ~100 ticks/session) | Tune CACHE_REBUILD_THRESHOLD; add prose cache; fix determinism |
| v1.2 (longer sessions, 500+ ticks) | Trace buffer rotation (already has rolling buffer, verify limit) |
| M3+ (economy content growth) | Data file splitting becomes meaningful if encounter-content exceeds 600KB |

### Scaling Priorities

1. **First bottleneck (now):** Determinism failure breaks test coverage confidence. Prose recomputation is minor CPU waste. Cache rebuild threshold is unknown — profile first before tuning.
2. **Second bottleneck (M3):** If encounter-content.ts grows past 500KB, initial bundle parse time on slow devices becomes noticeable. At that point, split by encounter category using dynamic import with Vite's `/*@vite-ignore*/` or manual chunk config.

## Anti-Patterns

### Anti-Pattern 1: Async Phase Functions

**What people do:** Convert data imports to `dynamic import()` to enable code splitting, making phase functions async.

**Why it's wrong:** `runTick()` is synchronous by design. The entire phase pipeline runs to completion in one call before returning new state. Async phases would require `await runTick()` which propagates async through `useSimulation.doTick()`, the interval callback, and every test. The refactor surface is 40+ modules.

**Do this instead:** Accept that content data loads synchronously at app start. For genuine bundle size concerns, put large data arrays in JSON files (Vite handles JSON imports with tree-shaking). For the current content sizes (336KB encounter-content.ts), startup parse time is under 50ms on modern hardware — not worth the async refactor.

### Anti-Pattern 2: Global Prose Cache Without Reset

**What people do:** Add `const cache = new Map()` at module level in `proseResolvers.ts` and never clear it.

**Why it's wrong:** When the user starts a new game (or uses the headless CLI to run multiple seeds), the cache from the previous game persists. `nodeId` strings are reused across games because they are deterministic (e.g., `loc_town_42`). Cached prose from seed 42 returns for seed 99.

**Do this instead:** Hook cache invalidation into `resetDecisionCache()` in `orchestrator.ts`. This function is already called on game restart. Add `invalidateProseCache()` there.

### Anti-Pattern 3: Removing the deterministicRoll Escape Hatch

**What people do:** Remove the `deterministicRoll?` parameter from `resolveAction()` when adding `rng` injection, thinking they are redundant.

**Why it's wrong:** `deterministicRoll` is used by tests to pass exact roll values (e.g., `resolveAction(0.7, 50)` forces a success). The `rng` parameter is for seeded production randomness. They serve different purposes. Keep both.

### Anti-Pattern 4: Lodash (Not Applicable Here)

The CONCERNS.md flags lodash as a risk. Actual inspection: **lodash is not in `package.json` and has zero imports in the codebase.** This concern is stale and can be closed. No action needed.

## Integration Points

### PRNG Injection Integration Map

| File | Location | Current | Fix | Callers to Update |
|------|----------|---------|-----|-------------------|
| `resolution.ts` | line 39 | `Math.random()` | Add `rng?` to `resolveAction()` | `encounter.ts:139` (no change, uses deterministicRoll), `unifiedActionResolution.ts:115` (already uses rng) |
| `meetingEncounter.ts` | line 422 | `Math.random()` in agent ID | Add `rng` param to `createAgentFromMeeting()` | `orchestrator.ts` caller of this function |
| `agentSelection.ts` | lines 108, 282 | `Math.random()` | Add `rng?` param | Phase function callers |
| `dream.ts` | line 254 | `Math.random()` | Add `rng?` param | Orchestrator dream phase |
| `rival.ts` | line 134 | `Math.random()` | Add `rng?` param | Orchestrator rival phase |
| `phaseMandate.ts` | line 32 | `Date.now()` in ID | Use `tick` instead | Internal — self-contained |
| `phaseDoom.ts` | line 28 | `Date.now()` in ID | Use `tick` instead | Internal — self-contained |
| `phaseControlEffects.ts` | line 53 | `Date.now()` in ID | Use `tick` instead | Internal — self-contained |

### Encounter Cache Rebuild Threshold Integration

The threshold `CACHE_REBUILD_THRESHOLD` lives in `agent-behavior-constants.ts` (already centralized). The consumer is `encounterCache.ts` which re-exports it. The value is currently unknown — must be read from the file before tuning.

Integration: No code changes needed. Profile first:
1. Add a trace emit in `buildFullCache()` with `Date.now()` delta.
2. Run CLI `run 5` for 100 ticks, then check encounter traces for rebuild frequency.
3. Set threshold to tolerate one rebuild per 20-30 ticks as a starting point.

### DebugPanel Extraction Integration

The 8 `useState` hooks in the main `DebugPanel` component (lines 1442-1452) are:
- `viewMode`, `enabledCategories`, `expandedTraceId`, `selectedTick`, `isScrolledUp` — belong to the trace feed tab
- `showBonds`, `showDecisionVectors` — passed down to `SocialTabContent` (already extracted)
- `overrideAgentId` — belongs to the agent follow tab

After extraction, the main component drops to ~5 state hooks (`viewMode`, `overrideAgentId`, `showBonds`, `showDecisionVectors`, `prevFollowAgentId` ref). Each extracted tab manages its own filter/scroll state.

**No behavioral changes.** Extraction is pure component boundary refactoring — same props in, same output.

## Build Order (Dependency Analysis)

Order matters because some optimizations share integration points or share test scope.

```
Phase 1 (Independent — no shared dependencies)
├── 1A: Event ID determinism (phaseMandate, phaseDoom, phaseControlEffects)
│       Touch: 3 files, no callers to update, add test to skipped determinism test
├── 1B: DebugPanel tab extraction
│       Touch: DebugPanel.tsx + new debug/ files, no engine changes
└── 1C: Encounter cache threshold profiling
        Touch: agent-behavior-constants.ts (value only), no logic changes

Phase 2 (Depends on Phase 1A — determinism groundwork)
└── 2A: PRNG injection into resolution.ts + meetingEncounter.ts
        Touch: resolution.ts, meetingEncounter.ts, agentSelection.ts, dream.ts, rival.ts
        Then: Re-enable the skipped determinism integration test

Phase 3 (Depends on Phase 2A — game restart reset path must exist)
└── 3A: Prose cache
        Touch: new proseCache.ts, proseResolvers.ts (wrap calls), orchestrator.ts (add reset)
        Prerequisite: resetDecisionCache() is the reset hook — Phase 2A may touch this
```

**Rationale for this order:**
- 1A before 2A: Event IDs and PRNG injection are both determinism fixes. Do the simpler (ID-only) fix first to establish the pattern and partially re-enable the skipped test. Full PRNG injection is the harder fix.
- 1B is fully independent — no engine touching, just React component splits. Can be done in parallel with 1A.
- 1C is observation-only (profiling). Do it before committing to a threshold value, but the code change is trivial once the number is known.
- Prose cache last: it depends on the reset hook being stable. If Phase 2A modifies `resetDecisionCache()`, Phase 3A must come after.

## Sources

- Direct codebase inspection: `src/engine/orchestrator.ts`, `src/engine/resolution.ts`, `src/engine/meetingEncounter.ts`, `src/engine/encounterCache.ts`, `src/engine/proseResolvers.ts`, `src/components/Game/DebugPanel.tsx`
- `.planning/codebase/CONCERNS.md` — codebase analysis 2026-03-30
- `.planning/codebase/ARCHITECTURE.md` — architecture analysis 2026-03-30
- `package.json` — dependency audit (lodash: absent)

---
*Architecture research for: TheFantasyWorldSimulator v1.1 optimization*
*Researched: 2026-03-30*
