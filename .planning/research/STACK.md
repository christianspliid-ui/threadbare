# Technology Stack for Optimization

**Project:** The Fantasy World Simulator (v1.1 Optimization Milestone)

**Researched:** 2026-03-30

**Confidence:** HIGH (Vite 6+ official docs, React 19 patterns, community consensus, v1.0 codebase validation)

---

## Executive Summary

The v1.0 codebase (1,055 files, 85K LOC, Vite 7.3.1 + React 19.2.0) requires four stack enhancements to meet v1.1 optimization targets:

1. **Code splitting for large data files** — Vite dynamic imports + manualChunks strategy
2. **Deterministic PRNG replacement** — Inject seeded generator to replace all Math.random() calls
3. **Cache-driven mutable state** — Content-hash invalidation for prose descriptions and encounter filters
4. **Component extraction without hook breakage** — Extract custom hooks conditionally to preserve React hook call order

This document prescribes specific patterns for each, with rationale and integration points in the existing codebase.

---

## 1. Code Splitting for Large Data Files

### Problem

Currently, all content data files bundle synchronously at app bootstrap:
- `src/data/encounter-content.ts` — 8,480 lines (~200KB uncompressed)
- `src/data/unified-action-templates.ts` — 2,906 lines (~90KB)
- `src/data/culture-content.ts` — 2,409 lines (~75KB)
- Plus 9+ other data files (~700KB total content payload)

This blocks initial render until all content is parsed and evaluated. Scaling to 1000+ encounters or 5000+ prose templates will add 5-10MB to bundle.

### Recommended Stack

**Vite 6+ Dynamic Import Pattern**

Use `import()` with explicit paths at load points, not at app bootstrap.

```typescript
// ❌ BAD: Synchronous import at module level (blocks bootstrap)
import ENCOUNTER_TEMPLATES from './data/encounter-content';

// ✅ GOOD: Lazy import at use point
async function loadEncounterContent(): Promise<typeof ENCOUNTER_TEMPLATES> {
  const module = await import('./data/encounter-content');
  return module.default || module.ENCOUNTER_TEMPLATES;
}
```

**Vite Configuration: manualChunks Strategy**

In `vite.config.ts`, add Rollup output configuration:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Data files → separate chunks by category
          if (id.includes('src/data/encounter-content')) {
            return 'data-encounters';
          }
          if (id.includes('src/data/unified-action-templates')) {
            return 'data-actions';
          }
          if (id.includes('src/data/culture-content')) {
            return 'data-culture';
          }
          if (id.includes('src/data/') && id.endsWith('.ts')) {
            return 'data-other';
          }

          // Vendor dependencies → vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
      // Prevent warnings on large chunks (data files are legitimately large)
      chunkSizeWarningLimit: 1000, // 1MB threshold for data chunks
    },
  },
});
```

**Why this pattern:**

- **Content hash stability**: Each data file has its own chunk. If `encounter-content.ts` doesn't change, its chunk hash stays identical → browser cache hit → zero re-download on new deploy
- **Lazy loading**: Content loads only when needed (orchestrator phase start, not app init)
- **Constraint compliance**: Vite dynamic imports require `.js`/`.ts` extension and `./` or `../` prefix — both are satisfied by import from `src/data/`

### Integration Points

**Phase 1: Lazy Load Strategies** (Small effort, high impact)

1. **Encounter content** — Load on game start (in `GameState.initializeGameState`) or on demand per location
   ```typescript
   // In orchestrator or game initialization
   const encounterModule = await import('./data/encounter-content');
   const templates = encounterModule.ENCOUNTER_TEMPLATES;
   ```

2. **Action templates** — Load when ActionDrawer component mounts
   ```typescript
   // In useActionDrawer hook or ActionDrawer component
   const actionsModule = await import('./data/unified-action-templates');
   const templates = actionsModule.ACTION_TEMPLATES;
   ```

3. **Culture/prose content** — Load when agent detail panel opens
   ```typescript
   // In AgentDetail or useAgentDetail hook
   const cultureModule = await import('./data/culture-content');
   const cultureData = cultureModule.CULTURE_TEMPLATES;
   ```

**Loading states and error handling:**

```typescript
// Reusable hook pattern for data file loading
function useDataModule<T>(
  importFn: () => Promise<{ default: T } | { [key: string]: T }>
): { data: T | null; loading: boolean; error: Error | null } {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    importFn()
      .then((module) => {
        const data = 'default' in module ? module.default : Object.values(module)[0];
        setState({ data: data as T, loading: false, error: null });
      })
      .catch((error) => {
        setState({ data: null, loading: false, error });
      });
  }, []);

  return state;
}

// Usage
function ActionDrawer() {
  const { data: templates, loading, error } = useDataModule(
    () => import('./data/unified-action-templates')
  );

  if (loading) return <div>Loading actions...</div>;
  if (error) return <div>Error loading actions: {error.message}</div>;
  if (!templates) return null;

  return <ActionList templates={templates} />;
}
```

### Current Challenges & Workarounds

**Circular dependency risk:**

The codebase has implicit circular imports (e.g., `unified-action-templates.ts` imports `encounter-content.ts` for validation). When splitting, these must be resolved:

```typescript
// ❌ Current: implicit coupling
import { ENCOUNTER_TEMPLATES } from './encounter-content'; // in unified-action-templates.ts

// ✅ Fix: defer coupling or validate after both load
// Load separately, validate in orchestrator after both are ready
const encounters = await import('./encounter-content');
const actions = await import('./unified-action-templates');
// validateTemplateRegistry(encounters, actions);
```

Add a `validateTemplateRegistry()` function called once at game start to verify all action template encounter references exist.

---

## 2. Deterministic PRNG Replacement

### Problem

Multiple locations generate unseeded randomness, breaking determinism:

- `src/engine/resolution.ts:39` — d100 roll uses `Math.random()` (no seed)
- `src/components/Ascendant/AscendantSelection.tsx:27` — Avatar name generation uses `Math.random()`
- `src/engine/meetingEncounter.ts:422` — Meeting agent ID uses `Math.random()`
- `src/engine/orchestrator.ts:1326` — Event ID uses `Date.now()` (predictable, collision risk)

The codebase already has a seeded PRNG (`mulberry32`) for worldgen, but it's not injected into engine phases.

### Recommended Stack

**Seeded PRNG Library: Stick with Mulberry32 (Already Implemented)**

The codebase already uses `mulberry32` for world generation. Verify it's re-used everywhere:

```typescript
// From existing worldgen code pattern:
function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) as number;
  };
}

// Create seeded instance at game init
const gameRng = mulberry32(gameState.worldSeed); // seed from game state
```

**Why not add a new library:**

- Mulberry32 is already in the codebase → no new dependency
- It's fast and lightweight
- Matches existing worldgen pattern (determinism consistency)
- No TC39 proposal adoption yet; `seedrandom` npm package is larger and less suitable for a tight game loop

### Injection Pattern

Create a **GameRNG context** to pass the seeded generator through the tick loop:

```typescript
// src/engine/gameRng.ts (new file)

export interface GameRNG {
  nextFloat(): number; // 0-1
  nextInt(max: number): number; // 0 to max-1
  nextIntInclusive(min: number, max: number): number; // min to max inclusive
}

function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) as number;
  };
}

export function createGameRNG(seed: number): GameRNG {
  const _rng = mulberry32(seed);

  return {
    nextFloat(): number {
      return _rng();
    },
    nextInt(max: number): number {
      return Math.floor(this.nextFloat() * max);
    },
    nextIntInclusive(min: number, max: number): number {
      return min + Math.floor(this.nextFloat() * (max - min + 1));
    },
  };
}
```

**Tick Loop Injection:**

In `src/engine/orchestrator.ts`, thread the RNG through all phase calls:

```typescript
// At tick loop start
const rng = gameState.rng; // or create if not present

// In each phase call
export function phaseResolution(
  state: GameState,
  rng: GameRNG, // <-- inject as parameter
): TickEvent[] {
  // Replace all Math.random() calls:
  const roll = rng.nextIntInclusive(1, 100); // instead of Math.floor(Math.random() * 100) + 1
  // ...
}

// In orchestrator tick function
const events: TickEvent[] = [];
events.push(...phaseEssence(state, rng));
events.push(...phaseResolution(state, rng));
events.push(...phaseMeeting(state, rng));
// ...
```

### Integration Points

**1. Engine Phases (High Priority)** — All phases that call Math.random():

```typescript
// src/engine/resolution.ts
export function phaseResolution(state: GameState, rng: GameRNG): TickEvent[] {
  for (const encounter of activeEncounters) {
    const roll = rng.nextIntInclusive(1, 100); // d100, was Math.random()
    // ... rest of logic
  }
}

// src/engine/meetingEncounter.ts
export function initiateMeeting(state: GameState, rng: GameRNG, agentId: string) {
  const meetingId = `meeting-${Date.now()}-${rng.nextInt(999999)}`;
  // Creates deterministic ID without Date collision risk
}
```

**2. UI Components (Lower Priority)** — Only affects flavor (avatar names, cosmetic randomness):

```typescript
// src/components/Ascendant/AscendantSelection.tsx
function getRandomAvatarName(rng: GameRNG): string {
  const firstNames = ['...'];
  const lastNames = ['...'];
  const first = firstNames[rng.nextInt(firstNames.length)];
  const last = lastNames[rng.nextInt(lastNames.length)];
  return `${first} ${last}`;
}
```

**3. GameState Initialization:**

```typescript
// In initializeGameState
export function initializeGameState(seed: number): GameState {
  return {
    // ...
    rng: createGameRNG(seed),
    // ...
  };
}
```

### Verification

Add a determinism test that was previously skipped:

```typescript
// src/engine/__tests__/content-layer1-integration.test.ts
test('same seed produces deterministic results', () => {
  const state1 = initializeGameState(42);
  const state2 = initializeGameState(42);

  for (let i = 0; i < 100; i++) {
    runTick(state1);
    runTick(state2);
    expect(state1.events[state1.events.length - 1]).toEqual(
      state2.events[state2.events.length - 1]
    );
  }
});
```

---

## 3. Cache-Driven Mutable State

### Problem

Two systems recompute expensive results on every access:

1. **Prose descriptions** — `src/engine/proseResolvers.ts` (1,039 lines) regenerates agent descriptions every time detail panel opens
2. **Encounter cache** — Full rebuild triggered when location count changes exceed threshold, but rebuild frequency is unknown

Without caching, 10 agents × 100ms prose generation = 1s delay on multi-select.

### Recommended Stack

**Content-Hash Invalidation Pattern (Not React.cache)**

React 19's `cache()` is Server Component–only and invalidates per-request. Game state is client-side and mutable. Use a **manual hash-based cache** instead:

```typescript
// src/engine/caching/contentCache.ts (new file)

export interface CacheEntry<T> {
  value: T;
  hash: string; // content hash of input state
  timestamp: number;
}

export class ContentHashCache<K extends string, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get cached value if hash matches, else execute fn and cache result.
   * Hash should represent all state that affects output.
   */
  get(key: K, contentHash: string, fn: () => V): V {
    const entry = this.cache.get(key);

    if (entry && entry.hash === contentHash) {
      return entry.value; // Cache hit
    }

    // Cache miss: execute and store
    const value = fn();
    this.cache.set(key, { value, hash: contentHash, timestamp: Date.now() });

    // LRU eviction if cache too large
    if (this.cache.size > this.maxSize) {
      const oldest = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0];
      this.cache.delete(oldest[0]);
    }

    return value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}
```

**Hash Strategy for Agents:**

```typescript
// src/engine/proseResolvers.ts (modified)

import { ContentHashCache } from './caching/contentCache';
import { createHash } from 'crypto'; // Node.js built-in, or simple hash for browser

const proseCache = new ContentHashCache<string, string>(100);

function hashAgentState(agent: Agent): string {
  // Include all fields that affect prose output
  return JSON.stringify({
    id: agent.id,
    name: agent.name,
    sphereAffinities: agent.sphereAffinities,
    capabilities: agent.capabilities,
    reputation: agent.reputation,
    status: agent.status,
    // Omit: timestamps, internal IDs, UI state
  });
}

export function resolveAgentProse(agent: Agent): string {
  const hash = hashAgentState(agent);

  return proseCache.get(agent.id, hash, () => {
    // Original prose logic (only runs on cache miss)
    return generateAgentDescription(agent);
  });
}
```

**Encounter Cache Rebuild Tuning:**

```typescript
// src/engine/encounterCache.ts (modified)

interface EncounterCacheMetrics {
  locationChangeCount: number;
  rebuildCount: number;
  lastRebuildTick: number;
}

// Instead of a hard threshold, use adaptive tuning
const CACHE_REBUILD_THRESHOLD = 50; // Empirically determined
const CACHE_REBUILD_MIN_TICKS = 10; // Don't rebuild more than once per 10 ticks

export function updateEncounterCache(
  cache: EncounterCache,
  metrics: EncounterCacheMetrics,
  currentTick: number
): void {
  metrics.locationChangeCount++;

  // Rebuild only if threshold exceeded AND enough ticks have passed
  if (
    metrics.locationChangeCount >= CACHE_REBUILD_THRESHOLD &&
    currentTick - metrics.lastRebuildTick >= CACHE_REBUILD_MIN_TICKS
  ) {
    rebuildCache(cache);
    metrics.rebuildCount++;
    metrics.lastRebuildTick = currentTick;
    metrics.locationChangeCount = 0;
  }
}
```

### Integration Points

**1. Prose Caching** (Immediate, High impact):

In `useAgentDetail` hook (wherever prose is resolved):

```typescript
export function useAgentDetail(agentId: string) {
  // ... existing logic

  const prose = useMemo(() => {
    return resolveAgentProse(agent);
    // useMemo ensures prose doesn't regenerate on every render,
    // but explicit content-hash cache survives re-mounts
  }, [agent]);

  return { ...details, prose };
}
```

**2. Encounter Cache Metrics** (Phase 2, Profiling):

Add a debug view to DebugPanel:

```typescript
// In DebugPanel component
function EncounterCacheMetrics() {
  const metrics = useGameState(s => s.encounterCacheMetrics);

  return (
    <div className="space-y-1">
      <div>Location changes: {metrics.locationChangeCount}</div>
      <div>Total rebuilds: {metrics.rebuildCount}</div>
      <div>Cache size: {metrics.cacheSize}</div>
      <div>Avg rebuild cost (ms): {metrics.avgRebuildMs}</div>
    </div>
  );
}
```

**3. Cache Invalidation on State Changes:**

Mark cache invalid when agent state changes:

```typescript
// In phases that modify agents
export function phaseCapabilityGrowth(state: GameState, rng: GameRNG): TickEvent[] {
  for (const agent of agentsToGrow) {
    agent.capabilities.push(...newCaps);
    // Prose cache will auto-miss next read due to hash change
  }
  // No explicit cache.clear() needed — hash-based invalidation is automatic
}
```

---

## 4. Component Extraction Without Hook Breakage

### Problem

`src/components/Game/DebugPanel.tsx` is 1,774 lines with 48 useState hooks. Large components become hard to read and difficult to refactor. Splitting requires careful hook preservation.

### Recommended Stack

**Custom Hook Extraction Pattern (React 19 + TypeScript)**

Extract data-fetching and state management into custom hooks first, then extract rendering components.

**Phase 1: Identify Hook Groups**

Group related hooks by concern:

```typescript
// DebugPanel.tsx - Current structure
function DebugPanel() {
  // Encounter cache state
  const [cacheExpanded, setCacheExpanded] = useState(false);
  const [selectedCacheEntry, setSelectedCacheEntry] = useState<string | null>(null);

  // Decision breakdown state
  const [decisionExpanded, setDecisionExpanded] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);

  // Encounter timeline state
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [timelineTicks, setTimelineTicks] = useState<number[]>([]);

  // ... 45 more hooks across 5 major sections
}
```

**Phase 2: Extract Custom Hooks**

Each concern becomes a hook:

```typescript
// src/components/Game/debug/useDebugEncounterCache.ts (new file)
export function useDebugEncounterCache() {
  const [expanded, setExpanded] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const cache = useGameState(s => s.encounterCache);

  return {
    expanded,
    setExpanded,
    selectedEntry,
    setSelectedEntry,
    cache,
  };
}

// src/components/Game/debug/useDebugDecisionBreakdown.ts (new file)
export function useDebugDecisionBreakdown() {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const decisions = useGameState(s => s.recentDecisions);

  return {
    expanded,
    setExpanded,
    selectedId,
    setSelectedId,
    decisions,
  };
}

// src/components/Game/debug/useDebugEncounterTimeline.ts (new file)
export function useDebugEncounterTimeline() {
  const [expanded, setExpanded] = useState(false);
  const [ticks, setTicks] = useState<number[]>([]);
  const traces = useGameState(s => s.traces);

  useEffect(() => {
    const newTicks = Array.from(new Set(traces.map(t => t.tick))).sort((a, b) => a - b);
    setTicks(newTicks);
  }, [traces]);

  return { expanded, setExpanded, ticks };
}
```

**Phase 3: Extract Rendering Components**

Each hook maps to a view component:

```typescript
// src/components/Game/debug/EncounterCacheView.tsx (new file)
interface EncounterCacheViewProps {
  expanded: boolean;
  onToggleExpanded: (state: boolean) => void;
  selectedEntry: string | null;
  onSelectEntry: (id: string | null) => void;
  cache: EncounterCache;
}

export function EncounterCacheView({
  expanded,
  onToggleExpanded,
  selectedEntry,
  onSelectEntry,
  cache,
}: EncounterCacheViewProps) {
  return (
    <div className="border-t">
      <div
        className="cursor-pointer p-2 font-bold"
        onClick={() => onToggleExpanded(!expanded)}
      >
        Encounter Cache {expanded ? '▼' : '▶'}
      </div>
      {expanded && (
        <div className="pl-4">
          {/* Render cache entries */}
          {Object.entries(cache.entries).map(([id, entry]) => (
            <div key={id}>
              <div
                onClick={() => onSelectEntry(selectedEntry === id ? null : id)}
                className="cursor-pointer"
              >
                {id}
              </div>
              {selectedEntry === id && (
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(entry, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Similar for DecisionBreakdownView, EncounterTimelineView, etc.
```

**Phase 4: Refactor DebugPanel**

The main panel becomes a composition of views:

```typescript
// src/components/Game/DebugPanel.tsx (after refactoring)
export function DebugPanel() {
  const encounterCache = useDebugEncounterCache();
  const decisionBreakdown = useDebugDecisionBreakdown();
  const encounterTimeline = useDebugEncounterTimeline();
  // ... other hooks

  return (
    <div className="debug-panel h-screen overflow-y-auto">
      <EncounterCacheView {...encounterCache} />
      <DecisionBreakdownView {...decisionBreakdown} />
      <EncounterTimelineView {...encounterTimeline} />
      {/* ... other views */}
    </div>
  );
}
```

**Why this preserves hook ordering:**

- All hooks remain at component top level (unconditional)
- Extract only data-fetching and state logic into custom hooks (which are also called unconditionally)
- Rendering logic moves to child components (no new hooks there)
- React sees same hook call sequence on every render

### Integration Points

**1. Extract EncounterCacheView** (Immediately, highest fragility):

```typescript
// Current issues:
// - 48 useState hooks in one component
// - Cache invalidation logic fragile (CONCERNS.md line 133)
// - No tests for DebugPanel rendering states

// Extract to:
// - src/components/Game/debug/useDebugEncounterCache.ts (hook)
// - src/components/Game/debug/EncounterCacheView.tsx (view)
// - src/components/Game/debug/__tests__/EncounterCacheView.test.tsx (tests)
```

**2. Extract DecisionBreakdownView** (Phase 2):

```typescript
// Move decision state and rendering
// - src/components/Game/debug/useDebugDecisionBreakdown.ts
// - src/components/Game/debug/DecisionBreakdownView.tsx
```

**3. Extract EncounterTimelineView** (Phase 2):

```typescript
// Move timeline state and rendering
// - src/components/Game/debug/useDebugEncounterTimeline.ts
// - src/components/Game/debug/EncounterTimelineView.tsx
```

**Verification:**

```bash
# After extraction, component sizes should be:
# - DebugPanel.tsx: ~100 lines (composition only)
# - EncounterCacheView.tsx: ~200 lines (rendering)
# - useDebugEncounterCache.ts: ~50 lines (hook)
# - Total: Still ~1,774 lines, but distributed and testable

# Run tests
npm test -- DebugPanel
npm test -- EncounterCacheView
```

---

## Dependency Changes Summary

| Change | Reason | Risk |
|--------|--------|------|
| **Keep: mulberry32** (already in use) | Seeded PRNG already implemented for worldgen; reuse for determinism | None — already shipping |
| **Keep: Vite 7.3.1** | Supports dynamic imports + manualChunks; no upgrade needed | None |
| **Remove: Older lodash patterns** (Phase 2) | Replace with native JS where possible; audit import sources | Low — dead-code elimination |
| **Add: crypto/hash (browser-safe)** | Content-hash cache invalidation. Use `JSON.stringify` simple hash or npm `murmurhash` | Low — only used in debug cache, not critical path |
| **No new React dependencies** | React 19 + existing hooks + custom hook extraction | None |

---

## Phase-Specific Recommendations

### v1.1.0 (Immediate)

1. **Code splitting** — Add manualChunks config + lazy load encounter content at game start
2. **PRNG injection** — Replace Math.random() in resolution.ts and meetingEncounter.ts; thread through tick loop
3. **Prose caching** — Add ContentHashCache in proseResolvers.ts; verify with multi-select test

**Effort:** 8-16 hours. High impact on determinism + performance.

### v1.1.1 (Week 2)

4. **Encounter cache tuning** — Profile rebuild frequency; add metrics to DebugPanel; validate hypothesis
5. **Component extraction** — Extract DebugPanel sub-components; add tests; verify hook ordering

**Effort:** 4-8 hours. Improves code quality and fragile-area resilience.

### v1.2+ (Deferred)

- Lodash dedup audit
- Three.js upgrade compatibility testing
- D3-zoom wheel handler robustness testing

---

## Sources

- [Vite Dynamic Imports & Code Splitting](https://vite.dev/guide/features)
- [Vite Build Options](https://vite.dev/config/build-options)
- [Rollup manualChunks Strategy](https://github.com/vitejs/vite/discussions/17730)
- [Vite Code Splitting Best Practices](https://soledadpenades.com/posts/2025/use-manual-chunks-with-vite-to-facilitate-dependency-caching/)
- [seedrandom npm](https://www.npmjs.com/package/seedrandom)
- [React 19 cache() Function](https://react.dev/reference/react/cache)
- [React Component Extraction Patterns (2026)](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4)
- [React Hook Ordering Preservation](https://codescene.com/blog/refactoring-components-in-react-with-custom-hooks)
- [Cache Invalidation Strategies (2026)](https://lukasniessen.medium.com/caching-in-2026-fundamentals-invalidation-and-why-it-matters-more-than-ever-867fee46e98b)

---

*Analysis complete: 2026-03-30. Ready for roadmap integration.*
