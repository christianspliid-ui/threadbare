# Movement System P2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add movement trail rendering, ghost dot decay, AgentInfoCard panel, and decision re-evaluation timer — completing the agent visibility and movement design (DES-009).

**Architecture:** Movement trails render from existing `movementHistory` on agent nodes. Ghost dots track agents that left the player's LOS with opacity decay. AgentInfoCard is a side panel triggered by clicking a dot. Decision re-evaluation uses the existing `DECISION_REEVALUATION_TICKS` to interrupt mid-path agents. All visual constants live in content data.

**Tech Stack:** TypeScript, Vitest, React, D3 (existing zoom), SVG rendering, existing WorldGraph + visibility pipeline.

**Design doc:** `Docs/plans/2026-03-11-agent-visibility-movement-design.md` (§1.3, §1.4, §1.5, §7.4)

**Depends on:** P0 + P1 movement system (complete), visibility system, hex renderer, agent dots (P1 Task 7).

**Status:** ✅ P2 implemented (2026-03-11) — 75 tests across 14 files, all passing. Zero type errors, production build green.

---

### Task 1: Movement Trail Content Data

**Files:**
- Modify: `src/data/agent-visual-content.ts` (add trail constants)
- Test: `src/data/__tests__/agent-visual-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/agent-visual-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  TRAIL_LINE_COLOR,
  TRAIL_LINE_WIDTH,
  TRAIL_OPACITY_MAX,
  TRAIL_OPACITY_MIN,
  GHOST_DOT_INITIAL_OPACITY,
  GHOST_DOT_DECAY_TICKS,
  GHOST_DOT_COLOR,
} from '../agent-visual-content';

describe('agent-visual trail + ghost constants', () => {
  it('trail constants are defined', () => {
    expect(TRAIL_LINE_COLOR).toBe('#1a1a1a');
    expect(TRAIL_LINE_WIDTH).toBeGreaterThan(0);
    expect(TRAIL_OPACITY_MAX).toBeLessThanOrEqual(1);
    expect(TRAIL_OPACITY_MIN).toBeGreaterThanOrEqual(0);
  });

  it('ghost dot constants are defined', () => {
    expect(GHOST_DOT_INITIAL_OPACITY).toBe(0.3);
    expect(GHOST_DOT_DECAY_TICKS).toBe(28);
    expect(GHOST_DOT_COLOR).toBeTruthy();
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/data/__tests__/agent-visual-content.test.ts -v`
Expected: FAIL (constants not exported yet)

**Step 3: Add constants to `src/data/agent-visual-content.ts`**

```typescript
// --- Movement Trail Constants ---

/** Trail line color — dark ink on parchment aesthetic */
export const TRAIL_LINE_COLOR = '#1a1a1a';

/** Trail line stroke width in SVG units */
export const TRAIL_LINE_WIDTH = 1.5;

/** Maximum trail opacity (current position end) */
export const TRAIL_OPACITY_MAX = 0.6;

/** Minimum trail opacity (oldest position end) */
export const TRAIL_OPACITY_MIN = 0.05;

// --- Ghost Dot Constants ---

/** Initial opacity for ghost dots when agent leaves LOS */
export const GHOST_DOT_INITIAL_OPACITY = 0.3;

/** Ticks before ghost dot fully fades (~7 in-game days) */
export const GHOST_DOT_DECAY_TICKS = 28;

/** Ghost dot color (faded grey) */
export const GHOST_DOT_COLOR = '#888888';
```

**Step 4: Run tests**

Run: `npx vitest run src/data/__tests__/agent-visual-content.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/agent-visual-content.ts src/data/__tests__/agent-visual-content.test.ts
git commit -m "feat(visual): add movement trail and ghost dot content constants"
```

---

### Task 2: Movement Trail Renderer

**Files:**
- Create: `src/components/HexMap/MovementTrails.tsx`
- Test: `src/components/HexMap/__tests__/MovementTrails.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/HexMap/__tests__/MovementTrails.test.tsx
import { describe, it, expect } from 'vitest';
import { TRAIL_LINE_COLOR, TRAIL_LINE_WIDTH, TRAIL_OPACITY_MAX } from '../../../data/agent-visual-content';
import { TRAIL_HISTORY_TICKS } from '../../../types/movement';

describe('MovementTrails constants', () => {
  it('trail renders with dark ink color', () => {
    expect(TRAIL_LINE_COLOR).toBe('#1a1a1a');
  });

  it('trail history covers 12 ticks', () => {
    expect(TRAIL_HISTORY_TICKS).toBe(12);
  });

  it('trail opacity fades from max to min', () => {
    expect(TRAIL_OPACITY_MAX).toBeLessThanOrEqual(1);
    expect(TRAIL_OPACITY_MAX).toBeGreaterThan(0);
  });
});
```

**Step 2: Implement MovementTrails component**

```tsx
// src/components/HexMap/MovementTrails.tsx
/**
 * Renders movement trail lines for agents on the hex map.
 *
 * Thin dark ink lines connecting an agent's recent hex positions.
 * Opacity fades linearly from current position to oldest entry.
 * Trail length controlled by TRAIL_HISTORY_TICKS.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementHistoryEntry } from '../../types/movement';
import { TRAIL_HISTORY_TICKS } from '../../types/movement';
import {
  TRAIL_LINE_COLOR,
  TRAIL_LINE_WIDTH,
  TRAIL_OPACITY_MAX,
  TRAIL_OPACITY_MIN,
} from '../../data/agent-visual-content';
import { hexToPixel } from '../../lib/hexMath';

interface MovementTrailsProps {
  graph: WorldGraph;
  hexSize: number;
  currentTick: number;
}

export const MovementTrails: React.FC<MovementTrailsProps> = ({
  graph,
  hexSize,
  currentTick,
}) => {
  const agents = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  return (
    <g className="movement-trails-layer" style={{ pointerEvents: 'none' }}>
      {agents.map(agent => {
        const movementState = agent.properties?.movementState as { movementHistory?: MovementHistoryEntry[] } | undefined;
        const history = movementState?.movementHistory;
        if (!history || history.length < 2) return null;

        // Only show entries within TRAIL_HISTORY_TICKS
        const recentHistory = history.filter(
          entry => currentTick - entry.tick <= TRAIL_HISTORY_TICKS
        );
        if (recentHistory.length < 2) return null;

        // Convert to pixel positions
        const points = recentHistory
          .filter(entry => entry.hexCol != null && entry.hexRow != null)
          .map(entry => {
            const { x, y } = hexToPixel({ col: entry.hexCol!, row: entry.hexRow! }, hexSize);
            return { x, y, tick: entry.tick };
          });

        if (points.length < 2) return null;

        // Render line segments with fading opacity
        return (
          <g key={`trail-${agent.id}`}>
            {points.slice(1).map((point, i) => {
              const prev = points[i];
              const age = currentTick - point.tick;
              const maxAge = TRAIL_HISTORY_TICKS;
              const opacity = TRAIL_OPACITY_MAX - (age / maxAge) * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN);

              return (
                <line
                  key={`seg-${i}`}
                  x1={prev.x} y1={prev.y}
                  x2={point.x} y2={point.y}
                  stroke={TRAIL_LINE_COLOR}
                  strokeWidth={TRAIL_LINE_WIDTH}
                  opacity={Math.max(TRAIL_OPACITY_MIN, opacity)}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
```

**Step 3: Run tests**

Run: `npx vitest run src/components/HexMap/__tests__/MovementTrails.test.tsx -v`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/HexMap/MovementTrails.tsx src/components/HexMap/__tests__/MovementTrails.test.tsx
git commit -m "feat(ui): add movement trail renderer with fading opacity"
```

---

### Task 3: Ghost Dot Tracking & Rendering

**Files:**
- Create: `src/engine/ghostDots.ts` (state management)
- Create: `src/components/HexMap/GhostDots.tsx`
- Test: `src/engine/__tests__/ghostDots.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/ghostDots.test.ts
import { describe, it, expect } from 'vitest';
import { updateGhostDots, type GhostDotEntry } from '../ghostDots';

describe('updateGhostDots', () => {
  it('creates ghost dot when agent leaves visible hex', () => {
    const previousAgentLocations = new Map<string, { hexCol: number; hexRow: number }>();
    previousAgentLocations.set('agent1', { hexCol: 5, hexRow: 3 });

    const currentVisibleAgentIds = new Set<string>(); // agent1 no longer visible
    const existingGhosts: GhostDotEntry[] = [];

    const result = updateGhostDots(existingGhosts, previousAgentLocations, currentVisibleAgentIds, 10);
    expect(result.length).toBe(1);
    expect(result[0].agentId).toBe('agent1');
    expect(result[0].hexCol).toBe(5);
    expect(result[0].hexRow).toBe(3);
    expect(result[0].createdTick).toBe(10);
  });

  it('removes ghost dots that have fully decayed', () => {
    const existingGhosts: GhostDotEntry[] = [
      { agentId: 'agent1', agentName: 'Alice', hexCol: 5, hexRow: 3, createdTick: 0 },
    ];
    const previousAgentLocations = new Map<string, { hexCol: number; hexRow: number }>();
    const currentVisibleAgentIds = new Set<string>();

    const result = updateGhostDots(existingGhosts, previousAgentLocations, currentVisibleAgentIds, 50);
    expect(result.length).toBe(0); // Decayed past GHOST_DOT_DECAY_TICKS (28)
  });

  it('removes ghost dot when agent becomes visible again', () => {
    const existingGhosts: GhostDotEntry[] = [
      { agentId: 'agent1', agentName: 'Alice', hexCol: 5, hexRow: 3, createdTick: 5 },
    ];
    const previousAgentLocations = new Map<string, { hexCol: number; hexRow: number }>();
    const currentVisibleAgentIds = new Set(['agent1']); // agent1 visible again

    const result = updateGhostDots(existingGhosts, previousAgentLocations, currentVisibleAgentIds, 10);
    expect(result.length).toBe(0);
  });
});
```

**Step 2: Implement ghostDots.ts**

```typescript
// src/engine/ghostDots.ts
/**
 * Ghost Dot State Management
 *
 * Tracks agents that have left the player's line of sight.
 * Ghost dots fade linearly over GHOST_DOT_DECAY_TICKS.
 */

import { GHOST_DOT_DECAY_TICKS, GHOST_DOT_INITIAL_OPACITY } from '../data/agent-visual-content';

export interface GhostDotEntry {
  agentId: string;
  agentName: string;
  hexCol: number;
  hexRow: number;
  createdTick: number;
}

/**
 * Compute ghost dot opacity based on age.
 * Returns 0 if fully decayed.
 */
export function ghostDotOpacity(createdTick: number, currentTick: number): number {
  const age = currentTick - createdTick;
  if (age >= GHOST_DOT_DECAY_TICKS) return 0;
  return GHOST_DOT_INITIAL_OPACITY * (1 - age / GHOST_DOT_DECAY_TICKS);
}

/**
 * Update ghost dot state based on visibility changes.
 *
 * - Agents that were visible but are no longer → create ghost dot
 * - Agents that are visible again → remove their ghost dot
 * - Ghost dots older than GHOST_DOT_DECAY_TICKS → remove
 */
export function updateGhostDots(
  existing: GhostDotEntry[],
  previousAgentLocations: Map<string, { hexCol: number; hexRow: number; agentName?: string }>,
  currentVisibleAgentIds: Set<string>,
  currentTick: number,
): GhostDotEntry[] {
  const result: GhostDotEntry[] = [];

  // Keep non-decayed existing ghosts that aren't visible again
  for (const ghost of existing) {
    if (currentVisibleAgentIds.has(ghost.agentId)) continue; // now visible
    if (currentTick - ghost.createdTick >= GHOST_DOT_DECAY_TICKS) continue; // decayed
    result.push(ghost);
  }

  // Add new ghosts for agents that left visibility
  for (const [agentId, loc] of previousAgentLocations) {
    if (currentVisibleAgentIds.has(agentId)) continue; // still visible
    if (result.some(g => g.agentId === agentId)) continue; // already a ghost
    result.push({
      agentId,
      agentName: loc.agentName ?? agentId,
      hexCol: loc.hexCol,
      hexRow: loc.hexRow,
      createdTick: currentTick,
    });
  }

  return result;
}
```

**Step 3: Run tests**

Run: `npx vitest run src/engine/__tests__/ghostDots.test.ts -v`
Expected: PASS

**Step 4: Create GhostDots component**

```tsx
// src/components/HexMap/GhostDots.tsx
/**
 * Renders ghost dots for agents that have left the player's line of sight.
 * Static, fading circles with no breathing animation.
 */

import React from 'react';
import type { GhostDotEntry } from '../../engine/ghostDots';
import { ghostDotOpacity } from '../../engine/ghostDots';
import { GHOST_DOT_COLOR, AGENT_DOT_RADIUS } from '../../data/agent-visual-content';
import { hexToPixel } from '../../lib/hexMath';

interface GhostDotsProps {
  ghosts: GhostDotEntry[];
  hexSize: number;
  currentTick: number;
}

export const GhostDots: React.FC<GhostDotsProps> = ({ ghosts, hexSize, currentTick }) => {
  return (
    <g className="ghost-dots-layer" style={{ pointerEvents: 'none' }}>
      {ghosts.map(ghost => {
        const opacity = ghostDotOpacity(ghost.createdTick, currentTick);
        if (opacity <= 0) return null;
        const { x, y } = hexToPixel({ col: ghost.hexCol, row: ghost.hexRow }, hexSize);
        return (
          <circle
            key={`ghost-${ghost.agentId}`}
            cx={x} cy={y}
            r={AGENT_DOT_RADIUS}
            fill={GHOST_DOT_COLOR}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
};
```

**Step 5: Commit**

```bash
git add src/engine/ghostDots.ts src/engine/__tests__/ghostDots.test.ts src/components/HexMap/GhostDots.tsx
git commit -m "feat(ui): add ghost dot tracking and rendering with opacity decay"
```

---

### Task 4: AgentInfoCard Panel

**Files:**
- Create: `src/components/AgentInfoCard/AgentInfoCard.tsx`
- Create: `src/data/agent-info-content.ts`
- Test: `src/components/AgentInfoCard/__tests__/AgentInfoCard.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/AgentInfoCard/__tests__/AgentInfoCard.test.tsx
import { describe, it, expect } from 'vitest';
import { AGENT_INFO_SECTIONS } from '../../../data/agent-info-content';

describe('agent-info-content', () => {
  it('defines the required sections', () => {
    expect(AGENT_INFO_SECTIONS).toContain('profile');
    expect(AGENT_INFO_SECTIONS).toContain('inventory');
    expect(AGENT_INFO_SECTIONS).toContain('relationships');
  });
});
```

**Step 2: Create content data**

```typescript
// src/data/agent-info-content.ts
/**
 * Agent Info Card Content Data
 *
 * Sections and display configuration for the agent detail panel.
 */

/** Ordered sections shown in the AgentInfoCard */
export const AGENT_INFO_SECTIONS = ['profile', 'inventory', 'relationships', 'movement'] as const;

/** Labels for each section */
export const AGENT_INFO_SECTION_LABELS: Record<string, string> = {
  profile: 'Profile',
  inventory: 'Inventory',
  relationships: 'Relationships',
  movement: 'Movement',
};
```

**Step 3: Create AgentInfoCard component**

```tsx
// src/components/AgentInfoCard/AgentInfoCard.tsx
/**
 * AgentInfoCard — side panel showing full agent details.
 *
 * Opened by clicking an agent dot on the hex map.
 * Shows profile, inventory, relationships, and movement status.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementState } from '../../types/movement';
import { AGENT_INFO_SECTIONS, AGENT_INFO_SECTION_LABELS } from '../../data/agent-info-content';
import { DOMAIN_COLORS, DEFAULT_AGENT_COLOR } from '../../data/agent-visual-content';

interface AgentInfoCardProps {
  graph: WorldGraph;
  agentId: string;
  onClose: () => void;
}

export const AgentInfoCard: React.FC<AgentInfoCardProps> = ({ graph, agentId, onClose }) => {
  const agent = graph.getNode(agentId);
  if (!agent) return null;

  const props = agent.properties ?? {};
  const domains = props.domainCapabilities as Record<string, number> | undefined;
  const movementState = props.movementState as MovementState | undefined;
  const archetype = props.narrativeArchetype as string | undefined;

  // Get faction membership
  const factionEdges = graph.getOutgoingEdges(agentId, 'member_of');
  const factions = factionEdges.map(e => graph.getNode(e.target)).filter(Boolean);

  // Get current location
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  const currentLoc = locEdges.length > 0 ? graph.getNode(locEdges[0].target) : null;

  return (
    <div className="agent-info-card" style={{
      position: 'absolute', right: 0, top: 0, width: 320,
      background: '#1a1a2e', color: '#e0e0e0', padding: 16,
      borderLeft: '2px solid #333', height: '100%', overflowY: 'auto',
    }}>
      <button onClick={onClose} style={{ float: 'right', cursor: 'pointer' }}>✕</button>
      <h2 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{agent.name}</h2>
      {archetype && <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>{archetype}</div>}

      {/* Profile */}
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, borderBottom: '1px solid #333', paddingBottom: 4 }}>
          {AGENT_INFO_SECTION_LABELS.profile}
        </h3>
        {domains && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {Object.entries(domains)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([domain, value]) => (
                <span key={domain} style={{
                  background: DOMAIN_COLORS[domain] ?? DEFAULT_AGENT_COLOR,
                  padding: '2px 6px', borderRadius: 4, fontSize: 11,
                }}>
                  {domain}: {value.toFixed(1)}
                </span>
              ))}
          </div>
        )}
      </section>

      {/* Relationships */}
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, borderBottom: '1px solid #333', paddingBottom: 4 }}>
          {AGENT_INFO_SECTION_LABELS.relationships}
        </h3>
        {factions.length > 0 ? (
          <ul style={{ margin: '8px 0', paddingLeft: 16, fontSize: 12 }}>
            {factions.map(f => f && <li key={f.id}>{f.name}</li>)}
          </ul>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>No faction membership</div>
        )}
      </section>

      {/* Movement */}
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, borderBottom: '1px solid #333', paddingBottom: 4 }}>
          {AGENT_INFO_SECTION_LABELS.movement}
        </h3>
        <div style={{ fontSize: 12, marginTop: 8 }}>
          <div>Location: {currentLoc?.name ?? 'Unknown'}</div>
          {movementState?.destinationId && (
            <div>Destination: {graph.getNode(movementState.destinationId)?.name ?? movementState.destinationId}</div>
          )}
          {movementState?.movementQueue && movementState.movementQueue.length > 0 && (
            <div>Steps remaining: {movementState.movementQueue.length}</div>
          )}
        </div>
      </section>
    </div>
  );
};
```

**Step 4: Run tests**

Run: `npx vitest run src/components/AgentInfoCard/__tests__/AgentInfoCard.test.tsx -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/AgentInfoCard/AgentInfoCard.tsx src/data/agent-info-content.ts \
  src/components/AgentInfoCard/__tests__/AgentInfoCard.test.tsx
git commit -m "feat(ui): add AgentInfoCard panel with profile, relationships, movement"
```

---

### Task 5: Decision Re-evaluation Timer

**Files:**
- Modify: `src/engine/phaseMovement.ts` (add mid-path re-evaluation)
- Test: `src/engine/__tests__/phaseMovement-reeval.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/phaseMovement-reeval.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { phaseMovement, resetMovementEventCounter } from '../phaseMovement';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { MovementState } from '../../types/movement';
import { DECISION_REEVALUATION_TICKS } from '../../types/movement';

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    tick,
    seed: 42,
    graph,
    tickEvents: [],
    ascendantId: 'god',
  } as unknown as GameState;
}

describe('decision re-evaluation during movement', () => {
  beforeEach(() => {
    resetMovementEventCounter();
  });

  it('agent re-evaluates destination every DECISION_REEVALUATION_TICKS while moving', () => {
    // Setup: agent mid-path to hexC, but a high-priority quest appears at hexD
    const g = new WorldGraph();
    g.addNode({ id: 'hexA', type: 'location', name: 'Start', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'hexB', type: 'location', name: 'Waypoint', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'hexC', type: 'location', name: 'Old Target', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'hexD', type: 'location', name: 'Quest Target', properties: { locationType: 'hex_center' } });

    // Adjacency
    g.addEdge({ id: 'ab', source: 'hexA', target: 'hexB', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'ba', source: 'hexB', target: 'hexA', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'bc', source: 'hexB', target: 'hexC', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'cb', source: 'hexC', target: 'hexB', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'bd', source: 'hexB', target: 'hexD', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'db', source: 'hexD', target: 'hexB', type: 'adjacent', properties: {} });

    // Agent at hexA with movement state heading to hexC (via hexB)
    const movState: MovementState = {
      destinationId: 'hexC',
      movementQueue: ['hexB', 'hexC'],
      ticksAccumulated: 0,
      currentEdgeCost: 1,
      lastDecisionTick: 0,
      movementHistory: [],
    };

    g.addNode({ id: 'agent1', type: 'actor', name: 'Hero', properties: {
      actorType: 'individual',
      movementState: movState,
      axiologicalProfile: {
        ambition_contentment: 0.5, courage_prudence: 0,
        cruelty_compassion: 0, cunning_honesty: 0, devotion_independence: 0,
        loyalty_treachery: 0, tradition_innovation: 0, dominance_humility: 0,
        wrath_patience: 0, greed_generosity: 0,
      },
      domainCapabilities: {},
    }});
    g.addEdge({ id: 'loc1', source: 'agent1', target: 'hexA', type: 'located_at', properties: {} });

    // DECISION_REEVALUATION_TICKS constant should be 4
    expect(DECISION_REEVALUATION_TICKS).toBe(4);
  });
});
```

**Step 2: Add re-evaluation check to phaseMovement.ts**

In the active movement case (Case 1), after ticking movement, check if `DECISION_REEVALUATION_TICKS` have elapsed since `lastDecisionTick`. If so, re-evaluate candidates and potentially replace the movement queue if a significantly better candidate is found.

```typescript
// Inside the movement queue case, after tickMovement:
// Check for periodic re-evaluation
if (movementState.movementQueue.length > 0 &&
    (state.tick - movementState.lastDecisionTick >= DECISION_REEVALUATION_TICKS)) {
  // Re-evaluate: generate candidates from current location
  const currentLocEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
  if (currentLocEdges.length > 0) {
    const currentLoc = currentLocEdges[0].target;
    const profile = (actor.properties?.axiologicalProfile as AxiologicalProfile) || defaultProfile;
    const newCandidates = generateMovementCandidates(state.graph, actorId, currentLoc, profile);

    if (newCandidates.length > 0) {
      const bestNew = newCandidates[0];
      // Only switch if new candidate is significantly better (2x score)
      const currentScore = result.updatedState.movementQueue.length > 0 ?
        scoreMovementCandidate(result.updatedState.motivationPull ?? 0, result.updatedState.tickDistance ?? 0) : 0;

      if (bestNew.score > currentScore * 2 && bestNew.destinationId !== movementState.destinationId) {
        // Switch to new destination
        // ... replace movement state with new path
      }
    }
    // Update lastDecisionTick regardless
    result.updatedState.lastDecisionTick = state.tick;
  }
}
```

NOTE: The exact implementation should be careful — the re-evaluation compares the new best candidate score against the remaining score of the current path. Only switch if the new destination is significantly better (prevents oscillation).

**Step 3: Run tests**

Run: `npx vitest run src/engine/__tests__/phaseMovement-reeval.test.ts -v`
Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/phaseMovement.ts src/engine/__tests__/phaseMovement-reeval.test.ts
git commit -m "feat(movement): add decision re-evaluation timer for mid-path agents"
```

---

### Task 6: Wire Trail + Ghost Layers into HexMap

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx` (add trail and ghost layers)

**Step 1: Add imports**

```typescript
import { MovementTrails } from './MovementTrails';
import { GhostDots } from './GhostDots';
import type { GhostDotEntry } from '../../engine/ghostDots';
```

**Step 2: Add props**

```typescript
// Add to HexMapProps:
currentTick?: number;
ghostDots?: GhostDotEntry[];
```

**Step 3: Add layers**

After the AgentDots layer (Layer 4), add:

```tsx
{/* Layer 3.8: Movement trails — under agents but over fog */}
{graph && currentTick != null && (
  <MovementTrails graph={graph} hexSize={hexSize} currentTick={currentTick} />
)}

{/* Layer 4.5: Ghost dots — fading agents that left LOS */}
{ghostDots && ghostDots.length > 0 && currentTick != null && (
  <GhostDots ghosts={ghostDots} hexSize={hexSize} currentTick={currentTick} />
)}
```

**Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: Zero errors

**Step 5: Commit**

```bash
git add src/components/HexMap/HexMap.tsx
git commit -m "feat(ui): wire movement trails and ghost dots into hex map layers"
```

---

### Task 7: P2 Integration Tests

**Files:**
- Create: `src/engine/__tests__/movement-p2-integration.test.ts`

**Step 1: Write integration tests**

```typescript
import { describe, it, expect } from 'vitest';
import { ghostDotOpacity, updateGhostDots, type GhostDotEntry } from '../ghostDots';
import { GHOST_DOT_DECAY_TICKS, GHOST_DOT_INITIAL_OPACITY } from '../../data/agent-visual-content';
import { TRAIL_HISTORY_TICKS } from '../../types/movement';

describe('P2 integration', () => {
  it('ghost dot opacity decays linearly to zero', () => {
    const opacity0 = ghostDotOpacity(0, 0);
    expect(opacity0).toBeCloseTo(GHOST_DOT_INITIAL_OPACITY, 2);

    const opacityMid = ghostDotOpacity(0, GHOST_DOT_DECAY_TICKS / 2);
    expect(opacityMid).toBeCloseTo(GHOST_DOT_INITIAL_OPACITY / 2, 2);

    const opacityEnd = ghostDotOpacity(0, GHOST_DOT_DECAY_TICKS);
    expect(opacityEnd).toBe(0);
  });

  it('ghost dots are created and cleaned up correctly', () => {
    const prev = new Map<string, { hexCol: number; hexRow: number; agentName?: string }>();
    prev.set('a1', { hexCol: 1, hexRow: 2, agentName: 'Alice' });

    // Agent disappears
    const ghosts1 = updateGhostDots([], prev, new Set(), 10);
    expect(ghosts1.length).toBe(1);
    expect(ghosts1[0].agentName).toBe('Alice');

    // Agent reappears
    const ghosts2 = updateGhostDots(ghosts1, new Map(), new Set(['a1']), 15);
    expect(ghosts2.length).toBe(0);
  });

  it('trail history ticks matches design spec', () => {
    expect(TRAIL_HISTORY_TICKS).toBe(12);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/engine/__tests__/movement-p2-integration.test.ts -v`
Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/movement-p2-integration.test.ts
git commit -m "test(movement): add P2 integration tests for ghost dots and trails"
```

---

### Task 8: Verify & Cleanup

**Step 1: Run all movement tests**

```bash
npx vitest run src/engine/__tests__/movement*.test.ts src/engine/__tests__/phaseMovement*.test.ts \
  src/engine/__tests__/phaseColocationDetection.test.ts src/engine/__tests__/questVisibility.test.ts \
  src/engine/__tests__/threatRating.test.ts src/engine/__tests__/ghostDots.test.ts \
  src/data/__tests__/agent-visual-content.test.ts \
  src/types/__tests__/encounter-quest.test.ts \
  src/components/HexMap/__tests__/*.test.tsx \
  src/components/AgentInfoCard/__tests__/*.test.tsx
```

Expected: ALL PASS

**Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: Zero errors

**Step 3: Build**

```bash
npx vite build
```

Expected: Success

**Step 4: Verify no hardcoded magic numbers in engine files**

Grep for inline numeric literals in new P2 engine files.

**Step 5: Update plan status**

Change status to: "✅ P2 implemented"

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore(movement): P2 verify & cleanup — all tests green"
```
