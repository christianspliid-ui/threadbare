# Phase 6C: Hex Zoom Level — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the three-level view state machine (world → hex-zoom → location) with HexZoomView showing polygon-layout locations inside a single hex, and LocationView showing location detail with agents and ordeal placeholder.

**Architecture:** GameView gains a `viewLevel` state that swaps the main content area between HexMap, HexZoomView, and LocationView. Engine query functions in `hexZoom.ts` extract location/agent data per hex from the graph. A pure-math `polygonLayout.ts` utility computes vertex positions for inscribing N locations inside the hex outline.

**Tech Stack:** React + TypeScript, Vitest for tests, SVG for hex zoom rendering, Tailwind + inline styles for Threadbare aesthetic.

**Design Doc:** `Docs/plans/2026-03-06-hex-zoom-level-design.md`

---

### Task 1: Polygon Layout Utility

Pure geometry — no game logic. Computes N evenly-spaced points on a regular polygon inscribed in a circle.

**Files:**
- Create: `src/lib/polygonLayout.ts`
- Create: `src/lib/__tests__/polygonLayout.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/__tests__/polygonLayout.test.ts
import { describe, it, expect } from 'vitest';
import { getPolygonVertices } from '../polygonLayout';

describe('getPolygonVertices', () => {
  it('returns empty array for count 0', () => {
    expect(getPolygonVertices(0, 100, 100, 50)).toEqual([]);
  });

  it('returns center point for count 1', () => {
    const pts = getPolygonVertices(1, 100, 100, 50);
    expect(pts).toHaveLength(1);
    expect(pts[0].x).toBeCloseTo(100);
    expect(pts[0].y).toBeCloseTo(100);
  });

  it('returns 2 points on horizontal line for count 2', () => {
    const pts = getPolygonVertices(2, 200, 200, 80);
    expect(pts).toHaveLength(2);
    // Points should be at opposite ends of a horizontal diameter
    expect(pts[0].y).toBeCloseTo(pts[1].y);
    expect(Math.abs(pts[0].x - pts[1].x)).toBeCloseTo(160); // 2 * radius
  });

  it('returns equilateral triangle for count 3', () => {
    const pts = getPolygonVertices(3, 0, 0, 100);
    expect(pts).toHaveLength(3);
    // All points should be at distance 100 from center
    for (const p of pts) {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeCloseTo(100);
    }
    // All inter-point distances should be equal
    const d01 = Math.sqrt((pts[1].x - pts[0].x) ** 2 + (pts[1].y - pts[0].y) ** 2);
    const d12 = Math.sqrt((pts[2].x - pts[1].x) ** 2 + (pts[2].y - pts[1].y) ** 2);
    const d20 = Math.sqrt((pts[0].x - pts[2].x) ** 2 + (pts[0].y - pts[2].y) ** 2);
    expect(d01).toBeCloseTo(d12);
    expect(d12).toBeCloseTo(d20);
  });

  it('returns 6 hexagonal points for count 6', () => {
    const pts = getPolygonVertices(6, 0, 0, 100);
    expect(pts).toHaveLength(6);
    for (const p of pts) {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeCloseTo(100);
    }
  });

  it('first vertex points upward (top of circle)', () => {
    const pts = getPolygonVertices(4, 0, 0, 100);
    // First vertex at -90° → top of circle (x≈0, y≈-100)
    expect(pts[0].x).toBeCloseTo(0);
    expect(pts[0].y).toBeCloseTo(-100);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/polygonLayout.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/polygonLayout.ts

export interface Point {
  x: number;
  y: number;
}

/**
 * Compute N points at regular polygon vertices inscribed in a circle.
 * First vertex points upward (top of circle, -90°).
 *
 * Special cases:
 * - count 0 → empty array
 * - count 1 → center point
 * - count 2 → horizontal line through center
 */
export function getPolygonVertices(
  count: number,
  centerX: number,
  centerY: number,
  radius: number,
): Point[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: centerX, y: centerY }];

  const points: Point[] = [];
  const startAngle = -Math.PI / 2; // Start pointing up

  for (let i = 0; i < count; i++) {
    const angle = startAngle + (2 * Math.PI * i) / count;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }

  return points;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/polygonLayout.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add src/lib/polygonLayout.ts src/lib/__tests__/polygonLayout.test.ts
git commit -m "feat: add polygon layout utility for hex zoom positioning"
```

---

### Task 2: Hex Zoom Engine Queries

Five pure query functions that extract hex-scoped data from the graph. These follow the same pattern as `src/engine/retinue.ts` — import WorldGraph, query nodes/edges, return DTOs.

**Files:**
- Create: `src/engine/hexZoom.ts`
- Create: `src/engine/__tests__/hexZoom.test.ts`

**Reference files for patterns:**
- `src/engine/retinue.ts` — query pattern (getIncomingEdges, getOutgoingEdges, property extraction)
- `src/engine/graph.ts` — WorldGraph API (getNode, getNodesByType, getOutgoingEdges, getIncomingEdges)
- `src/types/graph.ts` — GraphNode, GraphEdge, NodeType, EdgeType
- `src/lib/hexMath.ts` — hexDistance, hexNeighbors (for line-of-sight)
- `src/engine/worldSeed.ts` — how location nodes store `hexCol`/`hexRow` in properties

**Step 1: Write failing tests**

```typescript
// src/engine/__tests__/hexZoom.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
} from '../hexZoom';

describe('hexZoom engine queries', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // Create 3 locations: 2 in hex (3,4), 1 in hex (5,5)
    graph.addNode({
      id: 'loc.tavern',
      type: 'location',
      name: 'The Rusty Tankard',
      properties: { locationType: 'location', hexCol: 3, hexRow: 4, terrain: 'grassland', sphereBiases: { mind: 0.3 } },
    });
    graph.addNode({
      id: 'loc.temple',
      type: 'location',
      name: 'Sunken Temple',
      properties: { locationType: 'location', hexCol: 3, hexRow: 4, terrain: 'grassland', sphereBiases: { spirit: 0.5 } },
    });
    graph.addNode({
      id: 'loc.forge',
      type: 'location',
      name: 'The Forge',
      properties: { locationType: 'location', hexCol: 5, hexRow: 5, terrain: 'mountains', sphereBiases: { force: 0.4 } },
    });

    // Adjacency between tavern and temple (same hex)
    graph.addEdge({
      id: 'adj.tavern-temple',
      source: 'loc.tavern',
      target: 'loc.temple',
      type: 'adjacent',
      properties: {},
    });

    // Agents at tavern
    graph.addNode({
      id: 'actor.kael',
      type: 'actor',
      name: 'Kael',
      properties: { actorType: 'individual', locationId: 'loc.tavern' },
    });
    graph.addEdge({
      id: 'edge.kael-tavern',
      source: 'actor.kael',
      target: 'loc.tavern',
      type: 'located_at',
      properties: {},
    });

    graph.addNode({
      id: 'actor.mirael',
      type: 'actor',
      name: 'Mirael',
      properties: { actorType: 'individual', locationId: 'loc.temple' },
    });
    graph.addEdge({
      id: 'edge.mirael-temple',
      source: 'actor.mirael',
      target: 'loc.temple',
      type: 'located_at',
      properties: {},
    });

    // Ascendant + avatar in hex (3,4)
    graph.addNode({
      id: 'ascendant.test',
      type: 'actor',
      name: 'Test God',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'avatar.test',
      type: 'actor',
      name: 'Avatar',
      properties: { actorType: 'individual', locationId: 'loc.tavern' },
    });
    graph.addEdge({
      id: 'edge.avatar-link',
      source: 'avatar.test',
      target: 'ascendant.test',
      type: 'avatar_of',
      properties: {},
    });
    graph.addEdge({
      id: 'edge.avatar-loc',
      source: 'avatar.test',
      target: 'loc.tavern',
      type: 'located_at',
      properties: {},
    });
  });

  // ── getLocationsInHex ──

  describe('getLocationsInHex', () => {
    it('returns locations matching hex coordinates', () => {
      const locs = getLocationsInHex(graph, 3, 4);
      expect(locs).toHaveLength(2);
      expect(locs.map(l => l.id).sort()).toEqual(['loc.tavern', 'loc.temple']);
    });

    it('returns empty array for hex with no locations', () => {
      expect(getLocationsInHex(graph, 0, 0)).toEqual([]);
    });

    it('only returns location-type nodes', () => {
      // Actor node happens to have hexCol/hexRow — should not be returned
      graph.addNode({
        id: 'actor.wanderer',
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual', hexCol: 3, hexRow: 4 },
      });
      const locs = getLocationsInHex(graph, 3, 4);
      expect(locs).toHaveLength(2); // Still just the two locations
    });
  });

  // ── getAgentsAtLocation ──

  describe('getAgentsAtLocation', () => {
    it('returns agents with located_at edge to location', () => {
      const agents = getAgentsAtLocation(graph, 'loc.tavern');
      // Kael + avatar are at the tavern
      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.name).sort()).toEqual(['Avatar', 'Kael']);
    });

    it('returns empty array for location with no agents', () => {
      graph.addNode({
        id: 'loc.empty',
        type: 'location',
        name: 'Empty Place',
        properties: { locationType: 'location', hexCol: 9, hexRow: 9, terrain: 'desert' },
      });
      expect(getAgentsAtLocation(graph, 'loc.empty')).toEqual([]);
    });
  });

  // ── getHexSphereInfluence ──

  describe('getHexSphereInfluence', () => {
    it('aggregates sphere biases from locations in the hex', () => {
      const influence = getHexSphereInfluence(graph, 3, 4);
      // Tavern has mind: 0.3, Temple has spirit: 0.5
      expect(influence.mind).toBeCloseTo(0.3);
      expect(influence.spirit).toBeCloseTo(0.5);
    });

    it('returns zero influence for hex with no locations', () => {
      const influence = getHexSphereInfluence(graph, 0, 0);
      expect(influence.mind).toBe(0);
      expect(influence.spirit).toBe(0);
    });
  });

  // ── getLineOfSight ──

  describe('getLineOfSight', () => {
    it('returns full when avatar is in the same hex', () => {
      // Avatar is at loc.tavern in hex (3,4)
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('full');
    });

    it('returns partial when avatar is in adjacent hex', () => {
      // Move avatar to hex (4,4) — 1 hex away from (3,4)
      graph.removeEdge('edge.avatar-loc');
      graph.addNode({
        id: 'loc.nearby',
        type: 'location',
        name: 'Nearby',
        properties: { locationType: 'location', hexCol: 4, hexRow: 4, terrain: 'grassland' },
      });
      graph.addEdge({
        id: 'edge.avatar-nearby',
        source: 'avatar.test',
        target: 'loc.nearby',
        type: 'located_at',
        properties: {},
      });
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('partial');
    });

    it('returns none when avatar is distant', () => {
      // Move avatar to hex (10,10) — far from (3,4)
      graph.removeEdge('edge.avatar-loc');
      graph.addNode({
        id: 'loc.faraway',
        type: 'location',
        name: 'Far Away',
        properties: { locationType: 'location', hexCol: 10, hexRow: 10, terrain: 'grassland' },
      });
      graph.addEdge({
        id: 'edge.avatar-far',
        source: 'avatar.test',
        target: 'loc.faraway',
        type: 'located_at',
        properties: {},
      });
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('none');
    });

    it('returns none when no avatar found', () => {
      graph.removeEdge('edge.avatar-link');
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('none');
    });
  });

  // ── getLocationConnections ──

  describe('getLocationConnections', () => {
    it('returns adjacency edges between specified locations', () => {
      const edges = getLocationConnections(graph, ['loc.tavern', 'loc.temple']);
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('loc.tavern');
      expect(edges[0].target).toBe('loc.temple');
    });

    it('excludes edges to locations outside the set', () => {
      // Add edge from tavern to forge (different hex)
      graph.addEdge({
        id: 'adj.tavern-forge',
        source: 'loc.tavern',
        target: 'loc.forge',
        type: 'adjacent',
        properties: {},
      });
      const edges = getLocationConnections(graph, ['loc.tavern', 'loc.temple']);
      expect(edges).toHaveLength(1); // Only tavern↔temple, not tavern→forge
    });

    it('returns empty for locations with no connections', () => {
      expect(getLocationConnections(graph, ['loc.forge'])).toEqual([]);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/hexZoom.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/engine/hexZoom.ts

/**
 * Hex Zoom Engine Queries — Pure functions for hex-zoom and location views.
 *
 * These extract per-hex and per-location data from the world graph
 * for rendering HexZoomView and LocationView.
 */

import type { WorldGraph } from './graph';
import type { GraphNode, GraphEdge } from '../types/graph';
import type { HexCoord, SphereName } from '../types';
import { SPHERE_NAMES } from '../types';
import { hexDistance } from '../lib/hexMath';

/** Sphere influence totals for a hex. */
export type SphereInfluence = Record<SphereName, number>;

/** Line-of-sight level based on avatar distance. */
export type LineOfSight = 'full' | 'partial' | 'none';

/** Adjacent hex distance threshold for partial sight. */
const PARTIAL_SIGHT_RANGE = 1;

/**
 * All location nodes in the given hex.
 * Filters by node type 'location' and matching hexCol/hexRow properties.
 */
export function getLocationsInHex(graph: WorldGraph, col: number, row: number): GraphNode[] {
  return graph.getNodesByType('location').filter(node => {
    const props = node.properties as Record<string, unknown>;
    return props.hexCol === col && props.hexRow === row;
  });
}

/**
 * All actor nodes with a 'located_at' edge to the given location.
 */
export function getAgentsAtLocation(graph: WorldGraph, locationId: string): GraphNode[] {
  const edges = graph.getIncomingEdges(locationId, 'located_at');
  const agents: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.source);
    if (node) agents.push(node);
  }
  return agents;
}

/**
 * Aggregated sphere biases from all locations in the hex.
 * Sums sphereBiases from each location's properties.
 */
export function getHexSphereInfluence(graph: WorldGraph, col: number, row: number): SphereInfluence {
  const influence = {} as SphereInfluence;
  for (const s of SPHERE_NAMES) influence[s] = 0;

  const locations = getLocationsInHex(graph, col, row);
  for (const loc of locations) {
    const biases = (loc.properties as Record<string, unknown>).sphereBiases as Record<string, number> | undefined;
    if (biases) {
      for (const s of SPHERE_NAMES) {
        if (biases[s]) influence[s] += biases[s];
      }
    }
  }

  return influence;
}

/**
 * Determine line of sight based on avatar position relative to target hex.
 *
 * Finds the ascendant's avatar via 'avatar_of' edge, then the avatar's
 * location via 'located_at' edge, then computes hex distance.
 *
 * - Same hex → 'full'
 * - Adjacent hex (distance 1) → 'partial'
 * - Farther or no avatar → 'none'
 */
export function getLineOfSight(
  graph: WorldGraph,
  ascendantId: string,
  hexCoord: HexCoord,
): LineOfSight {
  // Find avatar: incoming 'avatar_of' edge to ascendant
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return 'none';

  const avatarId = avatarEdges[0].source;
  const avatarNode = graph.getNode(avatarId);
  if (!avatarNode) return 'none';

  // Find avatar's location
  const locEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  if (locEdges.length === 0) return 'none';

  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return 'none';

  const locProps = locNode.properties as Record<string, unknown>;
  const avatarHex: HexCoord = {
    col: locProps.hexCol as number,
    row: locProps.hexRow as number,
  };

  if (avatarHex.col === undefined || avatarHex.row === undefined) return 'none';

  const dist = hexDistance(avatarHex, hexCoord);
  if (dist === 0) return 'full';
  if (dist <= PARTIAL_SIGHT_RANGE) return 'partial';
  return 'none';
}

/**
 * All adjacency edges between locations in the given set.
 * Only returns edges where BOTH source and target are in locationIds.
 */
export function getLocationConnections(graph: WorldGraph, locationIds: string[]): GraphEdge[] {
  const idSet = new Set(locationIds);
  const connections: GraphEdge[] = [];

  for (const locId of locationIds) {
    const outEdges = graph.getOutgoingEdges(locId, 'adjacent');
    for (const edge of outEdges) {
      if (idSet.has(edge.target)) {
        connections.push(edge);
      }
    }
  }

  return connections;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/hexZoom.test.ts`
Expected: All 12 tests PASS

**Step 5: Commit**

```bash
git add src/engine/hexZoom.ts src/engine/__tests__/hexZoom.test.ts
git commit -m "feat: add hex zoom engine queries (locations, agents, sight, connections)"
```

---

### Task 3: View State Types + GameView State Machine

Add the `ViewLevel` type and new state variables to GameView. Wire hex click to transition into hex-zoom. Conditionally render a placeholder for hex-zoom/location views.

**Files:**
- Modify: `src/components/Game/GameView.tsx`

**Reference files:**
- `src/components/Game/GameView.tsx` — current state at lines 131-151 (state declarations), line 376 (onHexClick handler)
- `Docs/plans/2026-03-06-hex-zoom-level-design.md` — Decision 1 transitions table

**Step 1: Add ViewLevel type and state**

At the top of GameView.tsx, after the existing imports, add:

```typescript
type ViewLevel = 'world' | 'hex-zoom' | 'location';
```

Inside the `GameView` component, after the existing `useState` declarations (~line 151), add:

```typescript
const [viewLevel, setViewLevel] = useState<ViewLevel>('world');
const [focusedHex, setFocusedHex] = useState<{ col: number; row: number } | null>(null);
const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
```

**Step 2: Add navigation handlers**

After the existing handler declarations (~line 317), add:

```typescript
const handleHexClick = useCallback((coord: { col: number; row: number }) => {
  setSelectedHex(coord);
  setViewLevel('hex-zoom');
  setFocusedHex(coord);
}, []);

const handleLocationDoubleClick = useCallback((locationId: string) => {
  setViewLevel('location');
  setFocusedLocationId(locationId);
}, []);

const handleBackToWorld = useCallback(() => {
  setViewLevel('world');
  setFocusedHex(null);
  setFocusedLocationId(null);
}, []);

const handleBackToHex = useCallback(() => {
  setViewLevel('hex-zoom');
  setFocusedLocationId(null);
}, []);
```

**Step 3: Replace onHexClick and conditionally render views**

Change the HexMap `onHexClick` prop from `setSelectedHex` to `handleHexClick`.

Replace the main content area rendering (the `<div className="flex-1 p-4 ...">` block containing HexMap + overlays) with conditional rendering:

```tsx
{/* Main content area */}
<div className="flex-1 flex flex-col overflow-hidden relative">
  <div className="flex-1 p-4 flex items-center justify-center overflow-hidden relative">
    {viewLevel === 'world' && (
      <>
        <HexMap
          tiles={tiles}
          cols={COLS}
          rows={ROWS}
          hoveredHex={hoveredHex}
          selectedHex={selectedHex}
          overlayMode="none"
          onHexClick={handleHexClick}
          onHexHover={setHoveredHex}
        />

        {/* Agent Wheel overlay */}
        {wheelSlots && wheelVisible && selectedAgentId && (
          <svg className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
            <AgentWheel
              slots={wheelSlots}
              agentName={retinueAgents.find(a => a.id === selectedAgentId)?.name ?? ''}
              agentTitle={retinueAgents.find(a => a.id === selectedAgentId)?.tierName ?? ''}
              cx={300}
              cy={200}
              onSlotClick={handleWheelSlotClick}
              onDismiss={handleWheelDismiss}
            />
          </svg>
        )}

        {/* Intervention confirmation popover */}
        {pendingIntervention && wheelSlots && (() => {
          const slot = wheelSlots.find(s => s.id === pendingIntervention.slotId);
          if (!slot) return null;
          return (
            <InterventionConfirm
              interventionType={pendingIntervention.interventionType}
              label={slot.label}
              deliveryMode={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].deliveryMode}
              essenceCost={slot.essenceCost}
              sphere={slot.sphere ?? 'mind'}
              detectionRisk={slot.detectionRisk}
              rangeStatus={slot.rangeStatus}
              hexDistance={slot.hexDistance}
              description={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].description}
              onConfirm={handleInterventionConfirm}
              onCancel={handleInterventionCancel}
            />
          );
        })()}
      </>
    )}

    {viewLevel === 'hex-zoom' && focusedHex && (
      <div className="text-amber-200 text-center">
        <p className="text-lg">Hex Zoom: ({focusedHex.col}, {focusedHex.row})</p>
        <button
          onClick={handleBackToWorld}
          className="mt-4 px-4 py-2 bg-amber-900/50 text-amber-200 rounded hover:bg-amber-800/50"
        >
          ← Back to World
        </button>
      </div>
    )}

    {viewLevel === 'location' && focusedLocationId && (
      <div className="text-amber-200 text-center">
        <p className="text-lg">Location: {focusedLocationId}</p>
        <button
          onClick={handleBackToHex}
          className="mt-4 px-4 py-2 bg-amber-900/50 text-amber-200 rounded hover:bg-amber-800/50"
        >
          ← Back to Hex
        </button>
      </div>
    )}
  </div>

  {/* Narrative feed at bottom */}
  <div className="border-t border-amber-900/30 bg-stone-800/80 p-3">
    <NarrativeFeed events={gameState.recentEvents} />
  </div>
</div>
```

**Step 4: Verify app compiles and navigation works**

Run: `npx vitest run` (ensure no regressions)
Then manually: click hex → see "Hex Zoom" placeholder → click back → see world map

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat: add view state machine with world/hex-zoom/location transitions"
```

---

### Task 4: HexBreadcrumb Component

Header bar with back navigation, hex terrain indicator, hex name, and sphere influence dots.

**Files:**
- Create: `src/components/Game/HexBreadcrumb.tsx`
- Create: `src/components/Game/__tests__/HexBreadcrumb.test.tsx`

**Reference files:**
- `src/components/Game/RetinuePanel.tsx` — Cinzel font, amber styling patterns
- `Docs/plans/2026-03-06-hex-zoom-level-design.md` — Decision 2 "Header Bar"
- `src/types/index.ts` — TerrainType, TERRAIN_COLORS (or compute from terrain type)

**Step 1: Write failing test**

```typescript
// src/components/Game/__tests__/HexBreadcrumb.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexBreadcrumb } from '../HexBreadcrumb';

describe('HexBreadcrumb', () => {
  const defaultProps = {
    hexCol: 5,
    hexRow: 3,
    terrain: 'forest' as const,
    locationCount: 3,
    agentCount: 7,
    lineOfSight: 'full' as const,
    sphereInfluence: { force: 0, matter: 0, energy: 0, life: 0.2, mind: 0.3, spirit: 0, time: 0, entropy: 0 },
    onBack: vi.fn(),
  };

  it('renders hex name with coordinates', () => {
    render(<HexBreadcrumb {...defaultProps} />);
    expect(screen.getByText(/Forest Hex/)).toBeTruthy();
    expect(screen.getByText(/5, 3/)).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<HexBreadcrumb {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows location and agent counts', () => {
    render(<HexBreadcrumb {...defaultProps} />);
    expect(screen.getByText(/3 locations/i)).toBeTruthy();
    expect(screen.getByText(/7 agents/i)).toBeTruthy();
  });

  it('shows line of sight indicator', () => {
    render(<HexBreadcrumb {...defaultProps} lineOfSight="partial" />);
    expect(screen.getByText(/Partial Sight/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/HexBreadcrumb.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/components/Game/HexBreadcrumb.tsx
import type { SphereName } from '../../types';
import type { SphereInfluence, LineOfSight } from '../../engine/hexZoom';

// Sphere display colors (matches STYLE.md)
const SPHERE_COLORS: Record<SphereName, string> = {
  force: '#cc3333',
  matter: '#8b7355',
  energy: '#ffcc00',
  life: '#33cc66',
  mind: '#6699ff',
  spirit: '#cc99ff',
  time: '#ff9933',
  entropy: '#666666',
};

const SIGHT_LABELS: Record<LineOfSight, string> = {
  full: 'Full Sight',
  partial: 'Partial Sight',
  none: 'No Sight',
};

const SIGHT_COLORS: Record<LineOfSight, string> = {
  full: '#d4af37',
  partial: '#d4af3780',
  none: '#666666',
};

interface HexBreadcrumbProps {
  hexCol: number;
  hexRow: number;
  terrain: string;
  locationCount: number;
  agentCount: number;
  lineOfSight: LineOfSight;
  sphereInfluence: SphereInfluence;
  onBack: () => void;
}

export function HexBreadcrumb({
  hexCol,
  hexRow,
  terrain,
  locationCount,
  agentCount,
  lineOfSight,
  sphereInfluence,
  onBack,
}: HexBreadcrumbProps) {
  const terrainLabel = terrain.charAt(0).toUpperCase() + terrain.slice(1).replace(/_/g, ' ');
  const activeSpheres = (Object.entries(sphereInfluence) as [SphereName, number][])
    .filter(([, v]) => v > 0);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-stone-800/90 border-b border-amber-900/30">
      <button
        onClick={onBack}
        aria-label="back"
        className="text-amber-400 hover:text-amber-200 transition-colors text-lg px-2"
      >
        ←
      </button>

      {/* Terrain dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: '#6b8e23' }}
        title={terrainLabel}
      />

      <h2
        className="text-amber-100 text-sm font-semibold tracking-wide"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        {terrainLabel} Hex ({hexCol}, {hexRow})
      </h2>

      {/* Sphere influence dots */}
      {activeSpheres.length > 0 && (
        <div className="flex gap-1 ml-2">
          {activeSpheres.map(([sphere]) => (
            <div
              key={sphere}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SPHERE_COLORS[sphere] }}
              title={sphere}
            />
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Stats */}
      <span className="text-amber-400/60 text-xs">
        {locationCount} locations · {agentCount} agents
      </span>

      {/* Line of sight */}
      <span
        className="text-xs font-medium px-2 py-0.5 rounded"
        style={{ color: SIGHT_COLORS[lineOfSight], borderColor: SIGHT_COLORS[lineOfSight], borderWidth: 1 }}
      >
        {SIGHT_LABELS[lineOfSight]}
      </span>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Game/__tests__/HexBreadcrumb.test.tsx`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/HexBreadcrumb.tsx src/components/Game/__tests__/HexBreadcrumb.test.tsx
git commit -m "feat: add HexBreadcrumb header with terrain, sphere dots, line of sight"
```

---

### Task 5: HexZoomView Component

The main hex-zoom screen. Large hex outline centered on screen, location circles at polygon vertices, agent squares near locations, glowing travel lines between connected locations.

**Files:**
- Create: `src/components/Game/HexZoomView.tsx`
- Create: `src/components/Game/__tests__/HexZoomView.test.tsx`

**Reference files:**
- `src/components/Game/AgentWheel.tsx` — SVG rendering pattern, polar→cartesian
- `src/lib/hexMath.ts` — `hexPolygonPoints` for hex outline
- `src/lib/polygonLayout.ts` — `getPolygonVertices` for location placement
- `src/engine/hexZoom.ts` — query functions
- `Docs/plans/2026-03-06-hex-zoom-level-design.md` — Decision 2 full layout spec

**Step 1: Write failing tests**

```typescript
// src/components/Game/__tests__/HexZoomView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexZoomView } from '../HexZoomView';
import type { GraphNode, GraphEdge } from '../../../types/graph';

const mockLocations: GraphNode[] = [
  { id: 'loc.1', type: 'location', name: 'Tavern', properties: { hexCol: 3, hexRow: 4, terrain: 'grassland' } },
  { id: 'loc.2', type: 'location', name: 'Temple', properties: { hexCol: 3, hexRow: 4, terrain: 'grassland' } },
  { id: 'loc.3', type: 'location', name: 'Market', properties: { hexCol: 3, hexRow: 4, terrain: 'grassland' } },
];

const mockAgentsByLocation: Record<string, GraphNode[]> = {
  'loc.1': [{ id: 'a.1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } }],
  'loc.2': [],
  'loc.3': [
    { id: 'a.2', type: 'actor', name: 'Mirael', properties: { actorType: 'individual' } },
    { id: 'a.3', type: 'actor', name: 'Thorne', properties: { actorType: 'individual' } },
  ],
};

const mockConnections: GraphEdge[] = [
  { id: 'e.1', source: 'loc.1', target: 'loc.2', type: 'adjacent', properties: {} },
];

describe('HexZoomView', () => {
  const defaultProps = {
    locations: mockLocations,
    agentsByLocation: mockAgentsByLocation,
    connections: mockConnections,
    lineOfSight: 'full' as const,
    onLocationClick: vi.fn(),
    onLocationDoubleClick: vi.fn(),
  };

  it('renders location names', () => {
    render(<HexZoomView {...defaultProps} />);
    expect(screen.getByText('Tavern')).toBeTruthy();
    expect(screen.getByText('Temple')).toBeTruthy();
    expect(screen.getByText('Market')).toBeTruthy();
  });

  it('renders agent initials near locations', () => {
    render(<HexZoomView {...defaultProps} />);
    expect(screen.getByText('K')).toBeTruthy();  // Kael
    expect(screen.getByText('M')).toBeTruthy();  // Mirael
    expect(screen.getByText('T')).toBeTruthy();  // Thorne
  });

  it('calls onLocationClick on single click', () => {
    const onLocationClick = vi.fn();
    render(<HexZoomView {...defaultProps} onLocationClick={onLocationClick} />);
    fireEvent.click(screen.getByText('Tavern'));
    expect(onLocationClick).toHaveBeenCalledWith('loc.1');
  });

  it('calls onLocationDoubleClick on double click', () => {
    const onLocationDoubleClick = vi.fn();
    render(<HexZoomView {...defaultProps} onLocationDoubleClick={onLocationDoubleClick} />);
    fireEvent.doubleClick(screen.getByText('Tavern'));
    expect(onLocationDoubleClick).toHaveBeenCalledWith('loc.1');
  });

  it('dims locations when line of sight is none', () => {
    const { container } = render(<HexZoomView {...defaultProps} lineOfSight="none" />);
    // Location names should be replaced with "?"
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('renders with zero locations without crashing', () => {
    render(<HexZoomView {...defaultProps} locations={[]} agentsByLocation={{}} connections={[]} />);
    // Should render the hex outline but no location circles
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Game/__tests__/HexZoomView.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/components/Game/HexZoomView.tsx

import { useMemo } from 'react';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { LineOfSight } from '../../engine/hexZoom';
import { getPolygonVertices } from '../../lib/polygonLayout';
import { hexPolygonPoints } from '../../lib/hexMath';

interface HexZoomViewProps {
  locations: GraphNode[];
  agentsByLocation: Record<string, GraphNode[]>;
  connections: GraphEdge[];
  lineOfSight: LineOfSight;
  onLocationClick: (locationId: string) => void;
  onLocationDoubleClick: (locationId: string) => void;
}

// Layout constants
const HEX_RADIUS = 260;
const LOCATION_RADIUS = 40;
const AGENT_SIZE = 28;
const POLYGON_FRACTION = 0.65; // inscribed polygon radius as fraction of hex radius
const VIEW_SIZE = 600; // SVG viewBox size
const CENTER = VIEW_SIZE / 2;

// Agent colors by initial (simple hash for variety)
function agentColor(name: string): string {
  const colors = ['#cc3333', '#33cc66', '#6699ff', '#cc99ff', '#ff9933', '#ffcc00', '#8b7355', '#666666'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

export function HexZoomView({
  locations,
  agentsByLocation,
  connections,
  lineOfSight,
  onLocationClick,
  onLocationDoubleClick,
}: HexZoomViewProps) {
  const polygonRadius = HEX_RADIUS * POLYGON_FRACTION;
  const vertices = useMemo(
    () => getPolygonVertices(locations.length, CENTER, CENTER, polygonRadius),
    [locations.length, polygonRadius],
  );

  // Map location IDs to their SVG positions
  const locationPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    locations.forEach((loc, i) => {
      if (vertices[i]) {
        map.set(loc.id, vertices[i]);
      }
    });
    return map;
  }, [locations, vertices]);

  const hexPoints = hexPolygonPoints(CENTER, CENTER, HEX_RADIUS);
  const isHidden = lineOfSight === 'none';
  const isDimmed = lineOfSight === 'partial';

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className="w-full h-full max-w-[600px] max-h-[600px]"
    >
      {/* Glow filter for travel lines */}
      <defs>
        <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Hex outline */}
      <polygon
        points={hexPoints}
        fill="#2a2a2e"
        stroke="#d4af37"
        strokeWidth="1.5"
        strokeOpacity={0.3}
      />

      {/* Travel lines between connected locations */}
      {connections.map(edge => {
        const from = locationPositions.get(edge.source);
        const to = locationPositions.get(edge.target);
        if (!from || !to) return null;
        return (
          <line
            key={edge.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#d4af37"
            strokeWidth="1"
            strokeOpacity={0.4}
            filter="url(#glow-line)"
          />
        );
      })}

      {/* Location circles */}
      {locations.map((loc, i) => {
        const pos = vertices[i];
        if (!pos) return null;
        const agents = agentsByLocation[loc.id] ?? [];

        return (
          <g key={loc.id}>
            {/* Location circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={LOCATION_RADIUS}
              fill={isHidden ? '#1a1a1e' : '#3a3a3e'}
              stroke="#d4af37"
              strokeWidth="1.5"
              strokeOpacity={isHidden ? 0.2 : 0.6}
              opacity={isDimmed ? 0.6 : 1}
              style={{ cursor: 'pointer' }}
              onClick={() => onLocationClick(loc.id)}
              onDoubleClick={() => onLocationDoubleClick(loc.id)}
            />

            {/* Location name */}
            <text
              x={pos.x}
              y={pos.y + LOCATION_RADIUS + 16}
              textAnchor="middle"
              fill={isHidden ? '#666' : '#d4af37'}
              fontSize="12"
              fontFamily="Cinzel, serif"
              style={{ cursor: 'pointer' }}
              onClick={() => onLocationClick(loc.id)}
              onDoubleClick={() => onLocationDoubleClick(loc.id)}
            >
              {isHidden ? '?' : loc.name}
            </text>

            {/* Agent squares */}
            {!isHidden && agents.map((agent, ai) => {
              // Position agents in a small arc above the location circle
              const angleOffset = ((ai - (agents.length - 1) / 2) * 35) * (Math.PI / 180);
              const agentDist = LOCATION_RADIUS + AGENT_SIZE * 0.8;
              const ax = pos.x + agentDist * Math.sin(angleOffset);
              const ay = pos.y - agentDist * Math.cos(angleOffset);

              return (
                <g key={agent.id}>
                  <rect
                    x={ax - AGENT_SIZE / 2}
                    y={ay - AGENT_SIZE / 2}
                    width={AGENT_SIZE}
                    height={AGENT_SIZE}
                    rx="3"
                    fill={agentColor(agent.name)}
                    opacity={isDimmed ? 0.4 : 0.85}
                  />
                  <text
                    x={ax}
                    y={ay + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {agent.name.charAt(0)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Game/__tests__/HexZoomView.test.tsx`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/HexZoomView.tsx src/components/Game/__tests__/HexZoomView.test.tsx
git commit -m "feat: add HexZoomView with polygon layout, agent squares, travel lines"
```

---

### Task 6: LocationView Component

Location detail view: establishing shot placeholder, agents present list, ordeals placeholder.

**Files:**
- Create: `src/components/Game/LocationView.tsx`
- Create: `src/components/Game/__tests__/LocationView.test.tsx`

**Reference files:**
- `src/components/Game/RetinuePanel.tsx` — agent list rendering pattern
- `Docs/plans/2026-03-06-hex-zoom-level-design.md` — Decision 3 layout

**Step 1: Write failing tests**

```typescript
// src/components/Game/__tests__/LocationView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationView } from '../LocationView';
import type { GraphNode } from '../../../types/graph';

const mockLocation: GraphNode = {
  id: 'loc.tavern',
  type: 'location',
  name: 'The Rusty Tankard',
  properties: { locationType: 'location', hexCol: 3, hexRow: 4, terrain: 'forest' },
};

const mockAgents: GraphNode[] = [
  { id: 'a.1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } },
  { id: 'a.2', type: 'actor', name: 'Mirael', properties: { actorType: 'individual' } },
];

describe('LocationView', () => {
  const defaultProps = {
    location: mockLocation,
    agents: mockAgents,
    hexTerrain: 'forest',
    hexCol: 3,
    hexRow: 4,
    onAgentClick: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders location name', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText('The Rusty Tankard')).toBeTruthy();
  });

  it('renders agents present', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText('Kael')).toBeTruthy();
    expect(screen.getByText('Mirael')).toBeTruthy();
  });

  it('calls onAgentClick when agent clicked', () => {
    const onAgentClick = vi.fn();
    render(<LocationView {...defaultProps} onAgentClick={onAgentClick} />);
    fireEvent.click(screen.getByText('Kael'));
    expect(onAgentClick).toHaveBeenCalledWith('a.1');
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<LocationView {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows hex context label', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText(/Forest Hex/)).toBeTruthy();
    expect(screen.getByText(/3, 4/)).toBeTruthy();
  });

  it('shows ordeal placeholder', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText(/No active Ordeals/i)).toBeTruthy();
  });

  it('renders with empty agents list', () => {
    render(<LocationView {...defaultProps} agents={[]} />);
    expect(screen.getByText(/no agents present/i)).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Game/__tests__/LocationView.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/components/Game/LocationView.tsx

import type { GraphNode } from '../../types/graph';

interface LocationViewProps {
  location: GraphNode;
  agents: GraphNode[];
  hexTerrain: string;
  hexCol: number;
  hexRow: number;
  onAgentClick: (agentId: string) => void;
  onBack: () => void;
}

// Agent color by name hash (same as HexZoomView)
function agentColor(name: string): string {
  const colors = ['#cc3333', '#33cc66', '#6699ff', '#cc99ff', '#ff9933', '#ffcc00', '#8b7355', '#666666'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

export function LocationView({
  location,
  agents,
  hexTerrain,
  hexCol,
  hexRow,
  onAgentClick,
  onBack,
}: LocationViewProps) {
  const terrainLabel = hexTerrain.charAt(0).toUpperCase() + hexTerrain.slice(1).replace(/_/g, ' ');
  const locType = (location.properties as Record<string, unknown>).locationType as string || 'location';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-stone-800/90 border-b border-amber-900/30">
        <button
          onClick={onBack}
          aria-label="back"
          className="text-amber-400 hover:text-amber-200 transition-colors text-lg px-2"
        >
          ←
        </button>

        {/* Location icon placeholder */}
        <div className="w-8 h-8 rounded-full bg-stone-700 border border-amber-900/40 flex-shrink-0" />

        <div>
          <h2
            className="text-amber-100 text-sm font-semibold tracking-wide"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {location.name}
          </h2>
          <p className="text-amber-400/50 text-xs">
            {locType} · in {terrainLabel} Hex ({hexCol}, {hexRow})
          </p>
        </div>
      </div>

      {/* Establishing shot placeholder */}
      <div
        className="mx-4 mt-4 rounded border border-amber-900/20 bg-stone-800/60 flex items-center justify-center"
        style={{ aspectRatio: '16/9', maxHeight: '200px' }}
      >
        <span
          className="text-amber-400/30 text-sm"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          {location.name}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left: Agents Present */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Agents Present
          </h3>

          {agents.length === 0 ? (
            <p className="text-amber-400/30 text-xs italic">No agents present</p>
          ) : (
            <div className="space-y-1">
              {agents.map(agent => {
                const props = agent.properties as Record<string, unknown>;
                const actorType = props.actorType as string || 'unknown';

                return (
                  <button
                    key={agent.id}
                    onClick={() => onAgentClick(agent.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-amber-900/20 transition-colors group"
                  >
                    {/* Agent square */}
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: agentColor(agent.name) }}
                    >
                      <span className="text-white text-xs font-bold">
                        {agent.name.charAt(0)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-amber-100 text-sm truncate group-hover:text-amber-50">
                        {agent.name}
                      </p>
                      <p className="text-amber-400/40 text-xs">
                        {actorType}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Ordeals placeholder */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Ordeals
          </h3>
          <p className="text-amber-400/30 text-xs italic">No active Ordeals</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Game/__tests__/LocationView.test.tsx`
Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/LocationView.tsx src/components/Game/__tests__/LocationView.test.tsx
git commit -m "feat: add LocationView with agents list, establishing shot, ordeal placeholder"
```

---

### Task 7: Wire Everything into GameView

Replace the placeholders from Task 3 with real HexZoomView, LocationView, and HexBreadcrumb. Compute derived data (locations in hex, agents, connections, line of sight) and pass as props.

**Files:**
- Modify: `src/components/Game/GameView.tsx`

**Reference files:**
- `src/engine/hexZoom.ts` — getLocationsInHex, getAgentsAtLocation, getHexSphereInfluence, getLineOfSight, getLocationConnections
- `src/components/Game/HexBreadcrumb.tsx` — props interface
- `src/components/Game/HexZoomView.tsx` — props interface
- `src/components/Game/LocationView.tsx` — props interface

**Step 1: Add imports**

At the top of GameView.tsx, add:

```typescript
import { HexZoomView } from './HexZoomView';
import { LocationView } from './LocationView';
import { HexBreadcrumb } from './HexBreadcrumb';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
} from '../../engine/hexZoom';
```

**Step 2: Add derived data computations**

After the existing `useMemo` blocks (retinueAgents, wheelSlots), add:

```typescript
// Hex zoom derived data
const hexLocations = useMemo(() => {
  if (!focusedHex) return [];
  return getLocationsInHex(gameState.graph, focusedHex.col, focusedHex.row);
}, [gameState.graph, focusedHex, gameState.tick]);

const hexAgentsByLocation = useMemo(() => {
  const map: Record<string, ReturnType<typeof getAgentsAtLocation>> = {};
  for (const loc of hexLocations) {
    map[loc.id] = getAgentsAtLocation(gameState.graph, loc.id);
  }
  return map;
}, [gameState.graph, hexLocations, gameState.tick]);

const hexConnections = useMemo(() => {
  return getLocationConnections(gameState.graph, hexLocations.map(l => l.id));
}, [gameState.graph, hexLocations]);

const hexSphereInfluence = useMemo(() => {
  if (!focusedHex) return null;
  return getHexSphereInfluence(gameState.graph, focusedHex.col, focusedHex.row);
}, [gameState.graph, focusedHex, gameState.tick]);

const hexLineOfSight = useMemo(() => {
  if (!focusedHex) return 'none' as const;
  return getLineOfSight(gameState.graph, gameState.ascendantId, focusedHex);
}, [gameState.graph, gameState.ascendantId, focusedHex, gameState.tick]);

const hexTotalAgents = useMemo(() => {
  return Object.values(hexAgentsByLocation).reduce((sum, agents) => sum + agents.length, 0);
}, [hexAgentsByLocation]);

const focusedLocation = useMemo(() => {
  if (!focusedLocationId) return null;
  return gameState.graph.getNode(focusedLocationId) ?? null;
}, [gameState.graph, focusedLocationId]);

const focusedLocationAgents = useMemo(() => {
  if (!focusedLocationId) return [];
  return getAgentsAtLocation(gameState.graph, focusedLocationId);
}, [gameState.graph, focusedLocationId, gameState.tick]);
```

**Step 3: Add location click handler for info tooltip**

```typescript
const handleLocationClick = useCallback((locationId: string) => {
  // For now: just select the location (tooltip can be added later)
  setFocusedLocationId(locationId);
}, []);
```

Note: update `handleLocationDoubleClick` to not use `setFocusedLocationId` if click already does — or keep click as "select/highlight" and double-click as "navigate". The design says single-click = info tooltip, double-click = navigate. For now, single-click does nothing special (placeholder), double-click navigates.

Update the click handler:

```typescript
const handleLocationClick = useCallback((_locationId: string) => {
  // Future: show info tooltip
}, []);
```

**Step 4: Replace hex-zoom placeholder with real components**

Replace the `viewLevel === 'hex-zoom'` block with:

```tsx
{viewLevel === 'hex-zoom' && focusedHex && hexSphereInfluence && (
  <div className="flex flex-col h-full">
    <HexBreadcrumb
      hexCol={focusedHex.col}
      hexRow={focusedHex.row}
      terrain={tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row)?.terrain ?? 'grassland'}
      locationCount={hexLocations.length}
      agentCount={hexTotalAgents}
      lineOfSight={hexLineOfSight}
      sphereInfluence={hexSphereInfluence}
      onBack={handleBackToWorld}
    />
    <div className="flex-1 flex items-center justify-center">
      <HexZoomView
        locations={hexLocations}
        agentsByLocation={hexAgentsByLocation}
        connections={hexConnections}
        lineOfSight={hexLineOfSight}
        onLocationClick={handleLocationClick}
        onLocationDoubleClick={handleLocationDoubleClick}
      />
    </div>
  </div>
)}
```

**Step 5: Replace location placeholder with real component**

Replace the `viewLevel === 'location'` block with:

```tsx
{viewLevel === 'location' && focusedLocation && focusedHex && (
  <LocationView
    location={focusedLocation}
    agents={focusedLocationAgents}
    hexTerrain={tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row)?.terrain ?? 'grassland'}
    hexCol={focusedHex.col}
    hexRow={focusedHex.row}
    onAgentClick={handleAgentSelect}
    onBack={handleBackToHex}
  />
)}
```

**Step 6: Verify everything compiles and works**

Run: `npx vitest run` (full test suite — ensure no regressions)

**Step 7: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat: wire hex zoom views into GameView with derived data + navigation"
```

---

### Task 8: Integration Test

End-to-end test verifying the full view transition flow and data queries work together.

**Files:**
- Create: `src/engine/__tests__/hexZoom-integration.test.ts`

**Step 1: Write integration test**

```typescript
// src/engine/__tests__/hexZoom-integration.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
} from '../hexZoom';
import { getPolygonVertices } from '../../lib/polygonLayout';

describe('Hex Zoom integration', () => {
  it('full hex zoom flow: locations → agents → layout → connections → sight', () => {
    const graph = new WorldGraph();

    // Create 3 locations in hex (5, 3)
    const locIds = ['loc.a', 'loc.b', 'loc.c'];
    for (const id of locIds) {
      graph.addNode({
        id,
        type: 'location',
        name: `Location ${id}`,
        properties: { locationType: 'location', hexCol: 5, hexRow: 3, terrain: 'forest', sphereBiases: { mind: 0.1 } },
      });
    }

    // Connect a→b, b→c
    graph.addEdge({ id: 'adj.ab', source: 'loc.a', target: 'loc.b', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'adj.bc', source: 'loc.b', target: 'loc.c', type: 'adjacent', properties: {} });

    // Place agents
    graph.addNode({ id: 'actor.1', type: 'actor', name: 'Agent1', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.1', source: 'actor.1', target: 'loc.a', type: 'located_at', properties: {} });

    // Ascendant + avatar in same hex
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avt.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.avt', source: 'avt.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.avt.loc', source: 'avt.1', target: 'loc.a', type: 'located_at', properties: {} });

    // 1. Query locations
    const locs = getLocationsInHex(graph, 5, 3);
    expect(locs).toHaveLength(3);

    // 2. Query agents per location
    const agentsA = getAgentsAtLocation(graph, 'loc.a');
    expect(agentsA).toHaveLength(2); // Agent1 + Avatar

    // 3. Compute polygon layout
    const vertices = getPolygonVertices(locs.length, 300, 300, 170);
    expect(vertices).toHaveLength(3);
    // Triangle: all points equidistant from center
    for (const v of vertices) {
      const dist = Math.sqrt((v.x - 300) ** 2 + (v.y - 300) ** 2);
      expect(dist).toBeCloseTo(170);
    }

    // 4. Get connections
    const connections = getLocationConnections(graph, locIds);
    expect(connections).toHaveLength(2); // a→b and b→c

    // 5. Check line of sight
    expect(getLineOfSight(graph, 'asc.1', { col: 5, row: 3 })).toBe('full');

    // 6. Sphere influence
    const influence = getHexSphereInfluence(graph, 5, 3);
    expect(influence.mind).toBeCloseTo(0.3); // 3 locations × 0.1
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/engine/__tests__/hexZoom-integration.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/hexZoom-integration.test.ts
git commit -m "test: add hex zoom integration test covering full data flow"
```

---

### Task 9: Post-Implementation Documentation

Update all documentation layers after code is complete.

**Step 1: Update Obsidian vault**

Using Obsidian MCP:
- Create `Systems/Hex Zoom View.md` — system note for HexZoomView component
- Create `Systems/Location View.md` — system note for LocationView component
- Update `Systems/View Levels.md` — add implementation status, file paths

**Step 2: Update Notion backlog**

Using Notion MCP:
- Mark Phase 6C as complete
- Add reference links to design doc and plan
- Verify Phase 6D/6E ordering

**Step 3: Update CLAUDE.md**

- Add Phase 6C to project status (complete)
- Update engine stats (new modules, test count)
- Append changelog entries for all new files

**Step 4: Commit documentation updates**

```bash
git add CLAUDE.md
git commit -m "docs: update project status for Phase 6C hex zoom completion"
```

---

## Summary

| Task | Description | New Files | Tests |
|------|-------------|-----------|-------|
| 1 | Polygon layout utility | `polygonLayout.ts` | 6 |
| 2 | Hex zoom engine queries | `hexZoom.ts` | 12 |
| 3 | View state machine in GameView | (modify) | 0 (visual) |
| 4 | HexBreadcrumb component | `HexBreadcrumb.tsx` | 4 |
| 5 | HexZoomView component | `HexZoomView.tsx` | 6 |
| 6 | LocationView component | `LocationView.tsx` | 7 |
| 7 | Wire into GameView | (modify) | 0 (regression) |
| 8 | Integration test | `hexZoom-integration.test.ts` | 1 |
| 9 | Documentation | vault + Notion + CLAUDE.md | 0 |
| **Total** | | **7 new files** | **~36 new tests** |
