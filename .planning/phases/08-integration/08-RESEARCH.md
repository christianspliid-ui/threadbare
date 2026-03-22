# Phase 8: Integration - Research

**Researched:** 2026-03-22
**Domain:** React component swap, prop threading, V1 code removal, doc cleanup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**V1 code removal:**
- Full delete of all V1 SVG hex map components: HexMap.tsx, HexTile.tsx, AgentDots.tsx, MovementTrails.tsx, CoastlineOverlay.tsx, RiverOverlay.tsx, RegionLabels.tsx, GhostDots.tsx
- Delete V1-only hooks (useCoastline.ts, useRivers.ts) if not referenced by HexMapV2
- Clean break, no archived/disabled code left behind
- CLAUDE.md explicitly mandated this removal

**URL routing:**
- `?view=game` keeps its current behavior (skips worldgen, enters game directly) but now renders HexMapV2 instead of the SVG map. No URL breaking change.
- `?view=hexv2` remains as a standalone test harness — bare HexMapV2 without game chrome (no sidebar, hex chronicle, or game UI). Useful for renderer-only testing.
- Both routes coexist: `?view=game` = full game + HexMapV2, `?view=hexv2` = renderer sandbox

**Documentation cleanup:**
- Update CLAUDE.md, STYLE.md, and all docs that reference V1 SVG map, HexMap.tsx, or the old renderer
- Remove "V1 hex map development is stopped" notes — V1 no longer exists
- Update the rejected approaches list and dev quick-start URLs table

### Claude's Discretion

- Data threading approach for new HexMapV2 props (riverPaths, lakeIds, regionData, locations, agents) — researcher/planner decides how to get WorldGenResult data through useSimulation into GameView
- Agent click handling — whether agents are clickable on the Three.js canvas directly or routed through hex click + hex chronicle
- Fantasy overlay pass (WGEN-14) implementation approach — how sphere alignment transforms base biomes into magical variants
- Which V1 tests need updating vs deleting vs keeping as-is

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTG-01 | New hex map replaces current SVG hex map in GameView | Component swap at GameView line ~554: `<HexMap>` → `<HexMapV2>`. Handle type update needed in useViewNavigation. |
| INTG-02 | Hex click events wire to existing hex chronicle, location view, and agent interaction systems | `onHexClick` signature is identical (HexCoord). handleHexClickMove in useViewNavigation routes clicks. Agent click: via hex click + hex chronicle (not direct canvas click). |
| INTG-03 | Existing game state (agents, locations, encounters) renders on new map without engine changes | Needs agent adapter (graph → AgentRenderData[]) and location adapter (graph → LocationNode[]). `useSimulation` must expose WorldGenResult fields. |
| INTG-04 | Debug panel fog-of-war toggle works with new renderer | GameView already has `fogDisabled` state. HexMapV2 accepts `visibilityMap` + `fogEnabled` props. Invert fogDisabled logic to match new naming. |
| INTG-05 | URL params (?view=game, ?fog) work with new map | `?view=game` route in App.tsx unchanged. `?fog` parsed in HexV2View — for GameView integration, fog toggle is controlled by UI button, not URL (already implemented). |
| INTG-06 | All existing tests pass after integration | V1 HexMap test files delete with V1 code. GameView tests (GameView-interaction, GameView-debug, GameView-progressive) must still pass — they test React DOM UI, not the canvas renderer. Handle type alias needed. |
| WGEN-14 | Fantasy overlay pass converts base biomes to magical variants based on sphere alignment | New pass in WorldGenPipeline or post-process on WorldGenResult. Cosmology/sphere data flows through generateWorld() → needs pass implementation. |
</phase_requirements>

---

## Summary

Phase 8 is a mechanical integration phase. It has three distinct workstreams: (1) the component swap in GameView, (2) prop threading to get WorldGenResult data (riverPaths, lakeIds, regionData) plus live game state (agents, locations) from the graph into HexMapV2, and (3) V1 code removal and doc cleanup.

The biggest complexity lies in prop threading. `useSimulation` currently returns `tiles` (HexTile[]) but discards the rest of `WorldGenResult`. HexMapV2 needs `riverPaths`, `lakeIds`, and `regionData` that only exist in `WorldGenResult`. The fix is to expose them from `useSimulation`. Similarly, agents and locations must be derived from the live `gameState.graph` into `AgentRenderData[]` and `LocationNode[]` shapes — this is an adapter function, not an engine change.

WGEN-14 (fantasy overlay pass) is the only novel engine work in this phase. Sphere alignment data already flows into `generateWorld()` via `CosmologyProfile` but the parameter is currently ignored (`_cosmology`). The pass needs to read cosmology sphere weights and convert certain base biomes to magical variants — similar in structure to the existing biome overrides in pass07-biome.

V1 code removal is straightforward once the swap is complete. The V1 test files (in `src/components/HexMap/__tests__/`) will be deleted along with the V1 components they test. GameView tests will continue to pass because they test the React DOM UI layer, not the canvas renderer itself.

**Primary recommendation:** Execute in this order — (1) thread WorldGenResult data through useSimulation, (2) swap HexMap with HexMapV2 in GameView with adapters, (3) WGEN-14 fantasy overlay, (4) delete V1 code, (5) doc cleanup.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component tree, hooks, forwardRef | Already in use throughout |
| Three.js | r160+ | WebGL renderer (HexMapV2) | Established in Phases 1-7 |
| d3-zoom | 3.x | Pan/zoom camera | Established in HexMapV2 |
| TypeScript | 5.x | Type safety for prop threading | Project standard |

No new dependencies needed. This phase is purely wiring.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest + @testing-library/react | current | Test verification | INTG-06 compliance |

**Installation:** None required. All dependencies already installed.

---

## Architecture Patterns

### Key Existing Structures

```
src/components/
├── Game/
│   ├── GameView.tsx            ← PRIMARY INTEGRATION TARGET (line ~554: HexMap → HexMapV2)
│   └── hooks/
│       ├── useSimulation.ts    ← Must expose riverPaths, lakeIds, regionData
│       ├── useViewNavigation.ts ← hexMapRef must change from HexMapHandle to HexMapV2Handle
│       ├── useAvatarData.ts    ← Provides locationOverlays (Map<string, LocationSubtype>)
│       └── useAgentInteraction.ts ← Provides agent selection callback
├── HexMapV2/
│   ├── HexMapV2.tsx            ← Drop-in replacement target
│   ├── HexV2View.tsx           ← Standalone sandbox (stays as-is)
│   └── agents/agentSpriteTypes.ts ← AgentRenderData interface
└── HexMap/                     ← ENTIRE DIRECTORY DELETED in this phase
    ├── HexMap.tsx
    ├── HexTile.tsx
    ├── AgentDots.tsx
    ├── MovementTrails.tsx
    ├── CoastlineOverlay.tsx
    ├── RiverOverlay.tsx
    ├── RegionLabels.tsx
    ├── GhostDots.tsx
    ├── useCoastline.ts
    └── useRivers.ts
```

### Pattern 1: WorldGenResult Threading

**What:** `useSimulation` calls `initializeGameState()` which calls `generateWorld()` and discards everything except `.tiles`. Must be updated to retain the full `WorldGenResult`.

**Current flow:**
```
generateWorld() → WorldGenResult → .tiles only (rest discarded in gameInit.ts line 71)
```

**Target flow:**
```
generateWorld() → WorldGenResult → { tiles, riverPaths, lakeIds, regionData }
  → returned from initializeGameState()
  → stored in useSimulation state
  → passed as props to HexMapV2
```

**Implementation:** `initializeGameState()` currently only returns `{ state, tiles }`. It must return `{ state, tiles, riverPaths, lakeIds, regionData }`. `useSimulation` must store these and return them. WorldGenResult fields are immutable after world creation — no reactive update needed after initialization.

```typescript
// gameInit.ts — change return type
export function initializeGameState(...): {
  state: GameState;
  tiles: HexTile[];
  riverPaths: RiverPath[];
  lakeIds: Int16Array;
  regionData?: RegionData;
}

// useSimulation.ts — store and expose new fields
const [riverPaths] = useState<RiverPath[]>(initial.riverPaths);
const [lakeIds] = useState<Int16Array>(initial.lakeIds);
const [regionData] = useState<RegionData | undefined>(initial.regionData);
// ... return these
```

### Pattern 2: Graph-to-AgentRenderData Adapter

**What:** HexMapV2 expects `AgentRenderData[]`. The game graph has agent nodes with hex coordinates and faction info. A pure adapter function converts graph nodes to render data. This is NOT an engine change — it is a view-layer adapter.

**Where to put it:** New file `src/components/HexMapV2/agents/agentDataAdapter.ts` or inline in GameView as a `useMemo`.

```typescript
// View-layer adapter — pure function, no side effects
function deriveAgentRenderData(
  graph: WorldGraph,
  ascendantId: string,
): AgentRenderData[] {
  const agents = graph.getNodesByType('actor');
  return agents
    .filter(n => n.properties.hexCol != null && n.properties.hexRow != null)
    .map((n, i) => ({
      id: n.id,
      hexCol: n.properties.hexCol as number,
      hexRow: n.properties.hexRow as number,
      factionIndex: (i % 6) as number, // deterministic faction color by agent index
      isRetinue: isRetinueAgent(graph, n.id, ascendantId),
      name: n.name,
      // portraitUrl: loaded async via loadAgentPortraits
    }));
}
```

### Pattern 3: Graph-to-LocationNode Adapter

**What:** HexMapV2 expects `LocationNode[]`. `useAvatarData` already builds `locationOverlays` (Map<string, LocationSubtype>). A parallel function derives `LocationNode[]` from graph for HexMapV2.

```typescript
function deriveLocationNodes(graph: WorldGraph): LocationNode[] {
  return graph.getNodesByType('location')
    .filter(n => n.properties.hexCol != null && n.properties.hexRow != null)
    .map(n => ({
      locationType: (n.properties.locationSubtype ?? n.properties.locationType ?? 'unexplored_poi') as string,
      hexCol: n.properties.hexCol as number,
      hexRow: n.properties.hexRow as number,
      name: n.name,
      isCapital: n.properties.locationType === 'capital' || n.properties.locationSubtype === 'capital',
    }));
}
```

### Pattern 4: Handle Type Update in useViewNavigation

**What:** `useViewNavigation` imports `HexMapHandle` from V1 and types `hexMapRef`. After V1 deletion, must import `HexMapV2Handle` instead. Both interfaces have `centerOn(x, y, scale?)` — this is a drop-in substitution. `HexMapV2Handle` also adds `setFollowAgent(agentId)`.

```typescript
// Before (V1):
import type { HexMapHandle } from '../../HexMap/HexMap';
const hexMapRef = useRef<HexMapHandle>(null);

// After (V2):
import type { HexMapV2Handle } from '../../HexMapV2/HexMapV2';
const hexMapRef = useRef<HexMapV2Handle>(null);
```

### Pattern 5: Fog Toggle Prop Mapping

**What:** GameView has `fogDisabled` state (true = no fog). HexMapV2 expects `fogEnabled` (true = fog active) and `visibilityMap`. The mapping is:
- When `fogDisabled=true`: pass `visibilityMap=undefined`, `fogEnabled=false`
- When `fogDisabled=false`: pass `visibilityMap={effectiveVisibilityMap}`, `fogEnabled=true`

`effectiveVisibilityMap` already exists in GameView as a memoized proxy (line ~162). This logic already handles the fog-disabled proxy correctly.

### Pattern 6: WGEN-14 Fantasy Overlay Pass

**What:** Convert base biomes to magical variants based on sphere alignment. The `CosmologyProfile` has 8 sphere weights (force, matter, energy, life, mind, spirit, time, entropy). High weights in a sphere should bias certain terrain types toward magical variants.

**Approach (Claude's discretion):** A post-processing step applied after pass07-biome, either as pass10-fantasyOverlay or as a transformation layer in `generateWorld()`. The pass reads sphere alignment and probabilistically upgrades terrain types.

**Implementation skeleton:**
```typescript
// Example: high 'life' sphere → grassland/woodland → enchanted_forest (v2 FANT terrain)
// For Phase 8 (v1 scope), a simpler approach: add magical variant terrain names
// and a lookup table keyed by sphere × biome.

// Constants table (NFP #1):
export const FANTASY_OVERLAY_CONSTANTS = {
  SPHERE_THRESHOLD: 0.65,   // min sphere weight to trigger overlay
  OVERLAY_CHANCE: 0.15,     // probability per eligible hex
  SEED_OFFSET: 9999,        // pass-specific PRNG seed offset (NFP #3)
};

// The simplest compliant approach: apply per-hex noise + sphere weight check
// after biome pass. High entropy → dead_forest, broken_lands variants.
// High life → add boreal_forest, tropical_forest density.
// This stays within existing TerrainType enum (no new types required for v1).
```

**PRNG callout (NFP #3):** Must use `fractalNoise(col * scale, row * scale, seed + SEED_OFFSET)` — same pattern as existing biome sub-type passes. No external PRNG state consumed.

**Fail-soft (NFP #4):** If CosmologyProfile is null/default, pass is a no-op. Terrain unchanged.

### Anti-Patterns to Avoid

- **Modifying engine modules to accommodate renderer:** Don't change WorldGraph, tick loop, or any engine function. Adapters live in the view layer only.
- **Adding new HexMapV2 props that depend on V1 data shapes:** V2 has its own data contracts. Thread data through its established interfaces.
- **Leaving import dead code:** After V1 deletion, search for any remaining imports of V1 components (HexMap, AgentDots, useCoastline, etc.) and remove them.
- **Keeping HexMap-zoom.test.tsx or other V1 component tests:** These test deleted components — delete the test files along with the components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent color assignment | Custom color hash | `FACTION_HERALDIC_COLORS[i % 6]` | Already defined in agentSpriteTypes.ts |
| Fog proxy for fog-disabled | New Map implementation | Existing `effectiveVisibilityMap` proxy at GameView line ~162 | Already handles get() returning { state: 'visible' } |
| Location type mapping | New enum/lookup | `LOCATION_ICON_REGISTRY` keys in locationIconRegistry.ts | Registry already maps all location subtypes |
| Worldgen result caching | Custom memo | `useState` initialized once from `initial.riverPaths` etc. | World gen is run once at game start — immutable |

---

## Common Pitfalls

### Pitfall 1: HexMapHandle vs HexMapV2Handle Type Mismatch
**What goes wrong:** After V1 deletion, TypeScript errors everywhere `hexMapRef.current.centerOn()` is called, because the ref was typed to the deleted `HexMapHandle`.
**Why it happens:** `useViewNavigation` imports `HexMapHandle` from the deleted `HexMap.tsx`.
**How to avoid:** Update `useViewNavigation` import before deleting V1 files.
**Warning signs:** TypeScript error `Cannot find module '../../HexMap/HexMap'`.

### Pitfall 2: useSimulation Returning Stale WorldGenResult Data
**What goes wrong:** `riverPaths` or `lakeIds` are undefined in GameView even after threading fix.
**Why it happens:** `initializeGameState()` currently calls `generateWorld(...).tiles` — the rest of `WorldGenResult` is never captured.
**How to avoid:** Store the full result in `initializeGameState` before extracting `.tiles`. Return all needed fields.
**Warning signs:** HexMapV2 renders terrain but no rivers, no region borders.

### Pitfall 3: Agent Data Adapter Missing Retinue Detection
**What goes wrong:** All agents render with faction colors; retinue agent doesn't get gold ring.
**Why it happens:** `isRetinue` must be derived from graph edges (`worships` edge from agent to ascendant at tier 1), not just agent position.
**How to avoid:** Use `getRetinueAgents()` from `src/engine/retinue.ts` to identify retinue agents. Check if agent id is in the retinue result.
**Warning signs:** Avatar's follower agent renders same color as NPC agents.

### Pitfall 4: V1 Test Files Left Behind After Component Deletion
**What goes wrong:** Test suite fails with import errors for deleted HexMap components.
**Why it happens:** `src/components/HexMap/__tests__/` files import from the deleted V1 components.
**How to avoid:** Delete test files in `src/components/HexMap/__tests__/` as part of V1 removal.
**Warning signs:** `npm test` errors on `HexMap.tsx`, `HexTile.tsx`, etc.

### Pitfall 5: GameView Tests Break Due to Canvas Rendering
**What goes wrong:** GameView-interaction, GameView-debug, GameView-progressive tests fail after swap.
**Why it happens:** These tests render the full GameView in jsdom. HexMapV2 uses Three.js/WebGL which jsdom doesn't support.
**How to avoid:** HexMapV2 must be mocked in test environments. Check if an existing `vi.mock` for Three.js is already in the test setup. If not, add a mock for HexMapV2 that renders a simple `<canvas data-testid="hexmapv2" />`. The GameView tests don't test the canvas content — they test React DOM UI elements like `[data-testid="right-sidebar"]`.
**Warning signs:** `WebGL is not supported` or `Cannot read properties of undefined (reading 'getContext')` in test output.

### Pitfall 6: WGEN-14 Using Hardcoded Terrain Type Strings
**What goes wrong:** Fantasy overlay pass references terrain type strings that don't exist in the `TerrainType` union, causing TypeScript errors or silent mismatches.
**Why it happens:** v2 fantasy terrain types (enchanted_forest, etc.) are defined in REQUIREMENTS but not yet in the type system.
**How to avoid:** For Phase 8 (v1 requirements scope), the overlay must use only existing `TerrainType` values. Map sphere alignment to variation in existing types (e.g., high entropy → more `dead_forest`, `volcanic`, `broken_lands` hexes; high life → more `tropical_forest`, `dense_forest`).
**Warning signs:** TypeScript error on terrain type assignment.

---

## Code Examples

### Component Swap in GameView (INTG-01)

```typescript
// GameView.tsx — line ~554 replacement
// Before:
<HexMap
  ref={hexMapRef}
  tiles={tiles}
  cols={COLS}
  rows={ROWS}
  seed={gameState.seed}
  hoveredHex={hoveredHex}
  selectedHex={selectedHex}
  overlayMode="none"
  visibilityMap={fogDisabled ? undefined : gameState.visibilityMap}
  locationOverlays={locationOverlays}
  avatarHex={avatarPos ?? undefined}
  avatarId={avatarNodeId ?? undefined}
  sphereColor={sphereColor}
  avatarRoute={avatarRoute ?? undefined}
  avatarTargetHex={avatarTargetHex ?? undefined}
  initialCenter={avatarPixelPos ?? undefined}
  initialScale={3.0}
  graph={gameState.graph}
  currentTick={gameState.tick}
  onHexClick={handleHexClickMove}
  onHexHover={setHoveredHex}
  onAgentClick={handleAgentSelect}
/>

// After:
<HexMapV2
  ref={hexMapRef}
  tiles={tiles}
  cols={COLS}
  rows={ROWS}
  seed={gameState.seed}
  hoveredHex={hoveredHex}
  selectedHex={selectedHex}
  riverPaths={riverPaths}
  lakeIds={lakeIds}
  regionData={regionData}
  locations={locationNodes}
  agents={agentRenderData}
  visibilityMap={effectiveVisibilityMap}
  fogEnabled={!fogDisabled}
  onHexClick={handleHexClickMove}
  onHexHover={setHoveredHex}
/>
```

### WorldGenResult Threading in useSimulation (INTG-03 prerequisite)

```typescript
// useSimulation.ts — expose WorldGenResult fields
const initial = useMemo(
  () => initializeGameState(archetype, avatarName, cosmology, seed, COLS, ROWS),
  [archetype, avatarName, cosmology, seed]
);

const [gameState, setGameState] = useState<GameState>(initial.state);
const [tiles] = useState<HexTile[]>(initial.tiles);
const [riverPaths] = useState<RiverPath[]>(initial.riverPaths ?? []);
const [lakeIds] = useState<Int16Array>(initial.lakeIds ?? new Int16Array(0));
const [regionData] = useState<RegionData | undefined>(initial.regionData);

// Return all fields...
return { gameState, setGameState, tiles, riverPaths, lakeIds, regionData, ... };
```

### Fog Toggle Prop Mapping (INTG-04)

```typescript
// GameView.tsx — effectiveVisibilityMap already exists, just pass correctly:
<HexMapV2
  fogEnabled={!fogDisabled}
  visibilityMap={fogDisabled ? undefined : effectiveVisibilityMap}
  // ... other props
/>
// Note: effectiveVisibilityMap already handles the proxy case when fog is toggled off
```

### HexMapV2 Canvas Mock for Tests (INTG-06)

```typescript
// In GameView test files — mock HexMapV2 to avoid WebGL in jsdom:
vi.mock('../../HexMapV2/HexMapV2', () => ({
  default: vi.fn(() => <canvas data-testid="hexmapv2" />),
}));
```

### WGEN-14 Fantasy Overlay — Conceptual Pass

```typescript
// pass10-fantasyOverlay.ts
import { fractalNoise } from '../../../lib/prng';

export const FANTASY_OVERLAY_CONSTANTS = {
  SPHERE_THRESHOLD: 0.65,   // min sphere weight to apply overlay
  OVERLAY_CHANCE: 0.12,     // probability per eligible hex
  SEED_OFFSET: 10001,       // PRNG seed offset (NFP #3)
};

export function runFantasyOverlayPass(
  ctx: WorldGenContext,
  cosmology: CosmologyProfile,
): void {
  const { cols, rows, terrain, seed } = ctx;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const baseTerrain = terrain[idx];
      const noise = (fractalNoise(
        col * 0.1, row * 0.1,
        seed + FANTASY_OVERLAY_CONSTANTS.SEED_OFFSET,
        2, 0.5
      ) + 1) / 2; // normalize to [0,1]

      // High entropy sphere → dead/corrupted terrain variants
      if (cosmology.entropy > FANTASY_OVERLAY_CONSTANTS.SPHERE_THRESHOLD) {
        if (noise < FANTASY_OVERLAY_CONSTANTS.OVERLAY_CHANCE) {
          if (baseTerrain === 'temperate_forest' || baseTerrain === 'dense_forest') {
            ctx.terrain[idx] = 'dead_forest';
            continue;
          }
          if (baseTerrain === 'grassland' || baseTerrain === 'savanna') {
            ctx.terrain[idx] = 'broken_lands';
            continue;
          }
        }
      }

      // High life sphere → richer biomes
      if (cosmology.life > FANTASY_OVERLAY_CONSTANTS.SPHERE_THRESHOLD) {
        if (noise < FANTASY_OVERLAY_CONSTANTS.OVERLAY_CHANCE) {
          if (baseTerrain === 'woodland' || baseTerrain === 'temperate_forest') {
            ctx.terrain[idx] = 'tropical_forest';
            continue;
          }
        }
      }
      // ... other sphere × biome mappings
    }
  }
}
```

---

## Files to Delete (V1 Removal)

### Component files
```
src/components/HexMap/HexMap.tsx
src/components/HexMap/HexTile.tsx
src/components/HexMap/HexTileComponent.tsx   (if exists)
src/components/HexMap/AgentDots.tsx
src/components/HexMap/MovementTrails.tsx
src/components/HexMap/CoastlineOverlay.tsx
src/components/HexMap/RiverOverlay.tsx
src/components/HexMap/RegionLabels.tsx
src/components/HexMap/GhostDots.tsx
src/components/HexMap/HexDefs.tsx            (if V1-only)
src/components/HexMap/useCoastline.ts        (if not used by HexMapV2)
src/components/HexMap/useRivers.ts           (if not used by HexMapV2)
```

### Test files (delete with their components)
```
src/components/HexMap/__tests__/CoastlineOverlay.test.tsx
src/components/HexMap/__tests__/HexDefs.test.tsx
src/components/HexMap/__tests__/HexMap-zoom.test.tsx
src/components/HexMap/__tests__/RegionLabels.test.tsx
src/components/HexMap/__tests__/useCoastline.test.ts
src/components/HexMap/__tests__/AgentDots.test.tsx
src/components/HexMap/__tests__/HexTile-water.test.tsx
src/components/HexMap/__tests__/HexTile.test.tsx
src/components/HexMap/__tests__/MovementTrails.test.tsx
src/components/HexMap/__tests__/RiverOverlay.test.tsx
```

### App.tsx import cleanup
```typescript
// Remove from App.tsx (line 7):
import { HexMap } from './components/HexMap/HexMap';
// Keep the worldgen screen HexMap usage?
// IMPORTANT: App.tsx worldgen screen (lines ~163-174) also uses <HexMap>.
// This must be swapped to <HexMapV2> or removed as part of V1 removal.
```

**Critical finding:** App.tsx uses `<HexMap>` in two places — the worldgen preview screen (lines ~163-174) AND transitively through GameView. The worldgen screen must also be updated. However, `?view=game` bypasses this screen. Decision: since the worldgen screen's HexMap use is in the default `phase: 'worldgen'` path, it must also be replaced, or the worldgen screen simplified to not render a map (it's pre-game and could show static content). This is Claude's discretion to resolve.

---

## Documentation Files to Update

Based on V1 references found in CLAUDE.md and the codebase:

| File | What to Update |
|------|---------------|
| `CLAUDE.md` | Remove "V1 hex map development is stopped" note. Update "Rejected Approaches" — V1 SVG hex map entry now reads "deleted in Phase 8". Update dev quick-start URLs table. Remove HexMap.tsx references. |
| `STYLE.md` | Remove any references to SVG hex map rendering approach |
| `Docs/ui-patterns.md` | Update any hex map component patterns referencing V1 |
| `.planning/REQUIREMENTS.md` | Mark INTG-01 through INTG-06 and WGEN-14 as complete after implementation |
| `Docs/project-status.md` | Update current focus |
| `Docs/changelog.md` | Log Phase 8 integration |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest + @testing-library/react |
| Config file | vitest.config.ts (project root) |
| Quick run command | `npm test -- --run src/components/Game` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | HexMapV2 renders in GameView (no HexMap SVG) | unit | `npm test -- --run src/components/Game/__tests__/GameView-interaction` | ✅ (update mock) |
| INTG-02 | Hex click routes to chronicle/location/agent | unit | `npm test -- --run src/components/Game/__tests__/GameView-interaction` | ✅ |
| INTG-03 | Agents and locations render on map | visual (manual) | `npm test -- --run src/components/HexMapV2` | ✅ (existing V2 tests) |
| INTG-04 | Fog toggle button works | unit | `npm test -- --run src/components/Game/__tests__/GameView-debug` | ✅ |
| INTG-05 | URL params functional | unit | `npm test -- --run src/components/Game/__tests__/GameView-interaction` | ✅ |
| INTG-06 | All existing tests pass | regression | `npm test` | ✅ |
| WGEN-14 | Fantasy overlay applied based on sphere | unit | `npm test -- --run src/engine/worldgen` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run src/components/Game src/components/HexMapV2 src/engine/worldgen`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/engine/worldgen/__tests__/fantasyOverlay.test.ts` — covers WGEN-14 (sphere alignment → terrain transformation)
- [ ] HexMapV2 mock in GameView test setup — needed for INTG-01/04 tests to pass with V2 component
- [ ] Verify `npm test` passes with current codebase before making changes (establish baseline)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG hex map (HexMap.tsx) | Three.js InstancedMesh (HexMapV2.tsx) | Phase 8 | Full visual renderer replacement |
| `?view=game` → SVG map | `?view=game` → HexMapV2 with game chrome | Phase 8 | No URL change, different renderer |
| `useViewNavigation` → `HexMapHandle` | `useViewNavigation` → `HexMapV2Handle` | Phase 8 | `centerOn()` identical, `setFollowAgent()` added |
| `initializeGameState` returns `{state, tiles}` | returns `{state, tiles, riverPaths, lakeIds, regionData}` | Phase 8 | WorldGenResult fully threaded |

**Deprecated/outdated after Phase 8:**
- `HexMapHandle` interface: Deleted with `HexMap.tsx`
- `overlayMode` prop: V1-specific, not on HexMapV2 — remove from GameView usage
- `graph` prop on old HexMap: Not on HexMapV2 — graph usage moves to adapter functions in GameView
- `locationOverlays` prop on old HexMap: Not on HexMapV2 — replaced by `locations: LocationNode[]`
- `avatarHex`, `avatarId`, `avatarRoute`, `avatarTargetHex` props: V1-specific. HexMapV2 handles avatar visualization through `agents` array (retinue agent has `isRetinue: true`)

---

## Open Questions

1. **Worldgen screen (App.tsx) HexMap usage**
   - What we know: App.tsx uses `<HexMap>` in the worldgen preview screen (lines ~163-174), separate from GameView
   - What's unclear: Should this be replaced with HexMapV2 (correct approach but needs WorldGenResult threading in App.tsx too), or should the worldgen preview screen drop the map entirely (simpler)
   - Recommendation: Replace with `<HexMapV2>` since `generateWorld()` already returns `WorldGenResult` in App.tsx and the props can be threaded directly. The worldgen screen already calls `generateWorld()` and stores result in state.

2. **Agent click handling from HexMapV2 canvas**
   - What we know: HexMapV2 does not have an `onAgentClick` prop. V1 HexMap had `onAgentClick`. The CONTEXT.md notes this is Claude's discretion.
   - What's unclear: Should agents be directly clickable on the Three.js canvas, or should clicking a hex with agents open the hex chronicle (which then shows agent interaction)?
   - Recommendation: Route agent clicks through hex click → hex chronicle. This avoids adding new canvas raycasting for agent sprites and keeps the click surface consistent. `handleHexClickMove` already fires on all hex clicks.

3. **useCoastline.ts / useRivers.ts deletion safety**
   - What we know: These are listed for deletion, but confirmation that HexMapV2 doesn't import them is needed
   - What's unclear: The CONTEXT.md says "if not referenced by HexMapV2" — needs verification
   - Recommendation: Search for imports of `useCoastline` and `useRivers` across HexMapV2 before deleting. Based on code inspection, HexMapV2 imports `createCoastlineMesh` and `createRiverMesh` directly (Three.js modules) — not the React hooks. Safe to delete.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `GameView.tsx` lines 1-620
- Direct code inspection of `HexMapV2.tsx` props interface and handle
- Direct code inspection of `useSimulation.ts`, `useViewNavigation.ts`, `useAvatarData.ts`
- Direct code inspection of `gameInit.ts`, `hexGrid.ts`
- Direct code inspection of `agentSpriteTypes.ts`, `LocationIconMesh.ts`
- Direct code inspection of all V1 HexMap test files
- Direct code inspection of GameView test files

### Secondary (MEDIUM confidence)
- WorldGenPipeline pass structure — well-understood from codebase inspection, WGEN-14 pass pattern inferred from existing pass07-biome.ts structure

### Tertiary (LOW confidence)
- None — all findings are directly verified from code inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new dependencies; all libraries already in project
- Architecture: HIGH — All integration points directly verified in source code
- Pitfalls: HIGH — All identified from direct code reading; no speculation
- WGEN-14: MEDIUM — Pass skeleton is clear; exact sphere-to-biome mappings are design decisions, not research findings

**Research date:** 2026-03-22
**Valid until:** Phase 8 implementation complete (stable — no external dependencies)
