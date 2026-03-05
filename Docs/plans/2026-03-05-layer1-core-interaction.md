# Layer 1: Core Interaction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first interactive player layer — RetinuePanel (right sidebar listing influenced agents), AgentWheel (radial context menu), and StrandView (6-strand character deep-dive overlay).

**Architecture:** Three new components wired into GameView. The RetinuePanel queries the graph for all `worships` edges to the ascendant and displays a scrollable agent list. Clicking an entry selects that agent on the map and shows the AgentWheel (radial SVG menu centered on the hex). Choosing "Scry" on the wheel opens the StrandView overlay. All components are read-only display for now — intervention execution is Layer 2.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, Tailwind utility classes, SVG for the wheel, existing WorldGraph API + influence engine.

---

## Task 1: RetinuePanel — Data Helpers

Build pure functions that extract retinue data from the graph. These are the read-only queries the UI will call.

**Files:**
- Create: `src/engine/retinue.ts`
- Create: `src/engine/__tests__/retinue.test.ts`

**Step 1: Write failing tests**

```typescript
// src/engine/__tests__/retinue.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getRetinueAgents, type RetinueAgent } from '../retinue';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';

const VALUE_PAIRS: ValuePair[] = [
  'ambition_contentment', 'courage_prudence', 'cruelty_compassion',
  'cunning_honesty', 'devotion_independence', 'loyalty_treachery',
  'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity',
];

function makeProfile(bias = 0): AxiologicalProfile {
  const p = {} as AxiologicalProfile;
  for (const vp of VALUE_PAIRS) p[vp] = bias;
  return p;
}

function seedGraph(): { graph: WorldGraph; ascId: string } {
  const graph = new WorldGraph();

  graph.addNode({ id: 'asc', type: 'actor', name: 'The Godling', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'loc1', type: 'location', name: 'Iron Gate', properties: { locationType: 'location' } });

  // Agent with influence
  graph.addNode({
    id: 'agent1', type: 'actor', name: 'Kael',
    properties: {
      actorType: 'individual',
      axiologicalProfile: makeProfile(0.5),
      domainCapabilities: { iron: 70, gold: 30 },
      locationId: 'loc1',
    },
  });
  graph.addEdge({ id: 'e_w1', source: 'agent1', target: 'asc', type: 'worships', properties: { tier: 2, ticksAtCurrentTier: 10, establishedTick: 5, totalEssenceSpent: 15 } });
  graph.addEdge({ id: 'e_at1', source: 'agent1', target: 'loc1', type: 'contains', properties: {} });

  // Agent without influence (should not appear)
  graph.addNode({
    id: 'agent2', type: 'actor', name: 'Mara',
    properties: { actorType: 'individual', axiologicalProfile: makeProfile(-0.3), domainCapabilities: { heart: 60 }, locationId: 'loc1' },
  });

  // Agent at tier 0 (also should not appear — tier 0 = Unaware)
  graph.addNode({
    id: 'agent3', type: 'actor', name: 'Dorin',
    properties: { actorType: 'individual', axiologicalProfile: makeProfile(0), domainCapabilities: { eye: 50 }, locationId: 'loc1' },
  });
  graph.addEdge({ id: 'e_w3', source: 'agent3', target: 'asc', type: 'worships', properties: { tier: 0, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0 } });

  return { graph, ascId: 'asc' };
}

describe('getRetinueAgents', () => {
  it('returns only agents with tier >= 1', () => {
    const { graph, ascId } = seedGraph();
    const agents = getRetinueAgents(graph, ascId);
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe('agent1');
    expect(agents[0].name).toBe('Kael');
    expect(agents[0].tier).toBe(2);
  });

  it('includes location name', () => {
    const { graph, ascId } = seedGraph();
    const agents = getRetinueAgents(graph, ascId);
    expect(agents[0].locationName).toBe('Iron Gate');
  });

  it('includes axiological profile', () => {
    const { graph, ascId } = seedGraph();
    const agents = getRetinueAgents(graph, ascId);
    expect(agents[0].profile.ambition_contentment).toBe(0.5);
  });

  it('sorts by tier descending, then name ascending', () => {
    const { graph, ascId } = seedGraph();
    // Add a tier-3 agent
    graph.addNode({
      id: 'agent4', type: 'actor', name: 'Asha',
      properties: { actorType: 'individual', axiologicalProfile: makeProfile(0.2), domainCapabilities: { veil: 80 }, locationId: 'loc1' },
    });
    graph.addEdge({ id: 'e_w4', source: 'agent4', target: 'asc', type: 'worships', properties: { tier: 3, ticksAtCurrentTier: 5, establishedTick: 3, totalEssenceSpent: 30 } });

    const agents = getRetinueAgents(graph, ascId);
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe('Asha');  // tier 3 first
    expect(agents[1].name).toBe('Kael');  // tier 2 second
  });

  it('returns empty array when no influenced agents', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    expect(getRetinueAgents(graph, 'asc')).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/retinue.test.ts`
Expected: FAIL — `getRetinueAgents` not found

**Step 3: Write minimal implementation**

```typescript
// src/engine/retinue.ts
import type { WorldGraph } from './graph';
import type { AxiologicalProfile } from '../types/agent';
import type { InfluenceTier } from '../types/influence';
import { TIER_NAMES } from '../types/influence';

export interface RetinueAgent {
  id: string;
  name: string;
  tier: InfluenceTier;
  tierName: string;
  locationId: string;
  locationName: string;
  profile: AxiologicalProfile;
  domainCapabilities: Record<string, number>;
  factionName: string | null;
}

/**
 * Get all agents the ascendant has influence over (tier >= 1).
 * Sorted by tier descending, then name ascending.
 */
export function getRetinueAgents(graph: WorldGraph, ascendantId: string): RetinueAgent[] {
  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');

  const agents: RetinueAgent[] = [];

  for (const edge of worshipEdges) {
    const tier = (edge.properties.tier ?? 0) as InfluenceTier;
    if (tier < 1) continue;

    const node = graph.getNode(edge.source);
    if (!node || node.type !== 'actor') continue;

    const props = node.properties as Record<string, unknown>;
    const locationId = (props.locationId as string) ?? '';
    const locNode = graph.getNode(locationId);

    // Check faction membership
    const memberEdges = graph.getOutgoingEdges(node.id, 'member_of');
    let factionName: string | null = null;
    if (memberEdges.length > 0) {
      const faction = graph.getNode(memberEdges[0].target);
      if (faction) factionName = faction.name;
    }

    agents.push({
      id: node.id,
      name: node.name,
      tier,
      tierName: TIER_NAMES[tier],
      locationId,
      locationName: locNode?.name ?? 'Unknown',
      profile: (props.axiologicalProfile as AxiologicalProfile) ?? ({} as AxiologicalProfile),
      domainCapabilities: (props.domainCapabilities as Record<string, number>) ?? {},
      factionName,
    });
  }

  agents.sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    return a.name.localeCompare(b.name);
  });

  return agents;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/retinue.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/engine/retinue.ts src/engine/__tests__/retinue.test.ts
git commit -m "feat: add retinue data helpers — query influenced agents from graph"
```

---

## Task 2: RetinuePanel — Component

Display the right sidebar panel with the scrollable agent list.

**Files:**
- Create: `src/components/Game/RetinuePanel.tsx`
- Create: `src/components/Game/__tests__/RetinuePanel.test.tsx`

**Step 1: Write failing tests**

```typescript
// src/components/Game/__tests__/RetinuePanel.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetinuePanel } from '../RetinuePanel';
import type { RetinueAgent } from '../../../engine/retinue';
import type { AxiologicalProfile, ValuePair } from '../../../types/agent';

const VALUE_PAIRS: ValuePair[] = [
  'ambition_contentment', 'courage_prudence', 'cruelty_compassion',
  'cunning_honesty', 'devotion_independence', 'loyalty_treachery',
  'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity',
];

function makeProfile(bias = 0): AxiologicalProfile {
  const p = {} as AxiologicalProfile;
  for (const vp of VALUE_PAIRS) p[vp] = bias;
  return p;
}

const mockAgents: RetinueAgent[] = [
  {
    id: 'agent1', name: 'Kael', tier: 3, tierName: 'Champion',
    locationId: 'loc1', locationName: 'Iron Gate',
    profile: makeProfile(0.5), domainCapabilities: { iron: 70 }, factionName: 'Iron Legion',
  },
  {
    id: 'agent2', name: 'Lyra', tier: 1, tierName: 'Touched',
    locationId: 'loc2', locationName: 'Silver Harbor',
    profile: makeProfile(-0.3), domainCapabilities: { heart: 60 }, factionName: null,
  },
];

describe('RetinuePanel', () => {
  it('renders agent names', () => {
    render(<RetinuePanel agents={mockAgents} selectedAgentId={null} onAgentSelect={vi.fn()} />);
    expect(screen.getByText('Kael')).toBeTruthy();
    expect(screen.getByText('Lyra')).toBeTruthy();
  });

  it('shows tier names', () => {
    render(<RetinuePanel agents={mockAgents} selectedAgentId={null} onAgentSelect={vi.fn()} />);
    expect(screen.getByText(/Champion/)).toBeTruthy();
    expect(screen.getByText(/Touched/)).toBeTruthy();
  });

  it('shows location names', () => {
    render(<RetinuePanel agents={mockAgents} selectedAgentId={null} onAgentSelect={vi.fn()} />);
    expect(screen.getByText(/Iron Gate/)).toBeTruthy();
    expect(screen.getByText(/Silver Harbor/)).toBeTruthy();
  });

  it('calls onAgentSelect when agent is clicked', () => {
    const onSelect = vi.fn();
    render(<RetinuePanel agents={mockAgents} selectedAgentId={null} onAgentSelect={onSelect} />);
    fireEvent.click(screen.getByText('Kael'));
    expect(onSelect).toHaveBeenCalledWith('agent1');
  });

  it('highlights selected agent', () => {
    const { container } = render(
      <RetinuePanel agents={mockAgents} selectedAgentId="agent1" onAgentSelect={vi.fn()} />
    );
    // The selected agent entry should have a distinguishing class or style
    const entries = container.querySelectorAll('[data-testid="retinue-entry"]');
    expect(entries[0].className).toContain('ring');
  });

  it('renders empty state when no agents', () => {
    render(<RetinuePanel agents={[]} selectedAgentId={null} onAgentSelect={vi.fn()} />);
    expect(screen.getByText(/no agents/i)).toBeTruthy();
  });

  it('shows faction name when present', () => {
    render(<RetinuePanel agents={mockAgents} selectedAgentId={null} onAgentSelect={vi.fn()} />);
    expect(screen.getByText(/Iron Legion/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/RetinuePanel.test.tsx`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/components/Game/RetinuePanel.tsx
import type { RetinueAgent } from '../../engine/retinue';
import { TIER_NAMES } from '../../types/influence';

interface RetinuePanelProps {
  agents: RetinueAgent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
}

const TIER_COLORS: Record<number, string> = {
  1: '#6b7280',  // Touched — gray
  2: '#a78bfa',  // Devoted — purple
  3: '#eab308',  // Champion — gold
  4: '#ef4444',  // Aspect — red
};

export function RetinuePanel({ agents, selectedAgentId, onAgentSelect }: RetinuePanelProps) {
  if (agents.length === 0) {
    return (
      <div className="p-4 text-center text-amber-400/40 text-sm italic">
        No agents under your influence yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-full">
      <h2
        className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest px-2 py-1"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        Retinue ({agents.length})
      </h2>
      {agents.map(agent => {
        const isSelected = agent.id === selectedAgentId;
        return (
          <button
            key={agent.id}
            data-testid="retinue-entry"
            onClick={() => onAgentSelect(agent.id)}
            className={`
              text-left px-3 py-2 rounded transition-colors
              ${isSelected
                ? 'bg-amber-900/40 ring-1 ring-amber-500/50'
                : 'hover:bg-stone-700/50'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: TIER_COLORS[agent.tier] ?? '#6b7280' }}
              />
              <span className="text-sm font-medium text-amber-100 truncate">
                {agent.name}
              </span>
              <span
                className="text-xs ml-auto flex-shrink-0"
                style={{ color: TIER_COLORS[agent.tier] ?? '#6b7280' }}
              >
                {agent.tierName}
              </span>
            </div>
            <div className="text-xs text-amber-400/40 mt-0.5 pl-4 truncate">
              {agent.locationName}
              {agent.factionName && <> · {agent.factionName}</>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/RetinuePanel.test.tsx`
Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/components/Game/RetinuePanel.tsx src/components/Game/__tests__/RetinuePanel.test.tsx
git commit -m "feat: add RetinuePanel component — scrollable agent list sidebar"
```

---

## Task 3: AgentWheel — Data & Constants

Define the wheel slot structure and build the data layer that determines which slots are available.

**Files:**
- Create: `src/engine/wheel.ts`
- Create: `src/engine/__tests__/wheel.test.ts`

**Step 1: Write failing tests**

```typescript
// src/engine/__tests__/wheel.test.ts
import { describe, it, expect } from 'vitest';
import { getAgentWheelSlots, type WheelSlot } from '../wheel';
import type { InfluenceTier, EssencePool } from '../../types/influence';
import { createEmptyEssencePool } from '../influence';
import { SPHERE_NAMES } from '../../types';

describe('getAgentWheelSlots', () => {
  const baseParams = {
    tier: 2 as InfluenceTier,
    pool: (() => { const p = createEmptyEssencePool(); p.mind = 20; p.spirit = 20; return p; })(),
    primarySphere: 'mind' as const,
  };

  it('returns 9 action slots plus center info', () => {
    const slots = getAgentWheelSlots(baseParams);
    // 9 action slots + 1 center
    expect(slots).toHaveLength(10);
    expect(slots.find(s => s.id === 'scry')).toBeTruthy();
    expect(slots.find(s => s.id === 'center')).toBeTruthy();
  });

  it('scry is always available at tier >= 1', () => {
    const slots = getAgentWheelSlots({ ...baseParams, tier: 1 as InfluenceTier });
    const scry = slots.find(s => s.id === 'scry')!;
    expect(scry.available).toBe(true);
  });

  it('dream requires tier >= 1', () => {
    const slots = getAgentWheelSlots({ ...baseParams, tier: 1 as InfluenceTier });
    const dream = slots.find(s => s.id === 'dream')!;
    expect(dream.available).toBe(true);
  });

  it('marks slots unavailable when tier too low', () => {
    const slotsT1 = getAgentWheelSlots({ ...baseParams, tier: 1 as InfluenceTier });
    // 'coincidence' requires tier 3
    const coincidence = slotsT1.find(s => s.id === 'coincidence')!;
    expect(coincidence.available).toBe(false);
    expect(coincidence.lockedReason).toContain('tier');
  });

  it('marks slots unavailable when cannot afford', () => {
    const emptyPool = createEmptyEssencePool();
    const slots = getAgentWheelSlots({ ...baseParams, pool: emptyPool });
    const persuade = slots.find(s => s.id === 'persuade')!;
    expect(persuade.available).toBe(false);
    expect(persuade.lockedReason).toContain('essence');
  });

  it('includes essence cost and detection risk per slot', () => {
    const slots = getAgentWheelSlots(baseParams);
    const dream = slots.find(s => s.id === 'dream')!;
    expect(typeof dream.essenceCost).toBe('number');
    expect(dream.essenceCost).toBeGreaterThan(0);
    expect(typeof dream.detectionRisk).toBe('number');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/wheel.test.ts`
Expected: FAIL — `getAgentWheelSlots` not found

**Step 3: Write minimal implementation**

```typescript
// src/engine/wheel.ts
import type { SphereName } from '../types';
import type { InfluenceTier, EssencePool } from '../types/influence';
import type { InterventionType, InterventionDefinition } from '../types/dream';
import { INTERVENTION_DEFINITIONS } from '../types/dream';
import { canAfford } from './influence';

export interface WheelSlot {
  id: string;
  label: string;
  type: 'observation' | 'intervention' | 'info';
  /** Clock position in degrees (0 = 12 o'clock, clockwise) */
  angleDeg: number;
  available: boolean;
  lockedReason: string | null;
  essenceCost: number;
  detectionRisk: number;
  sphere: SphereName | null;
  interventionType: InterventionType | null;
}

interface WheelParams {
  tier: InfluenceTier;
  pool: EssencePool;
  primarySphere: SphereName;
}

/** Wheel slot definitions: id, label, angle, intervention mapping, tier requirement */
const AGENT_WHEEL_LAYOUT: Array<{
  id: string;
  label: string;
  type: 'observation' | 'intervention' | 'info';
  angleDeg: number;
  interventionType: InterventionType | null;
  minTier: InfluenceTier;
}> = [
  { id: 'scry',           label: 'Scry',          type: 'observation',   angleDeg: 0,    interventionType: null,                  minTier: 1 },
  { id: 'dream',          label: 'Dream',         type: 'intervention',  angleDeg: 45,   interventionType: 'dream',               minTier: 1 },
  { id: 'persuade',       label: 'Persuade',      type: 'intervention',  angleDeg: 75,   interventionType: 'persuade',            minTier: 1 },
  { id: 'deceive',        label: 'Deceive',       type: 'intervention',  angleDeg: 105,  interventionType: 'deceive',             minTier: 2 },
  { id: 'intimidate',     label: 'Intimidate',    type: 'intervention',  angleDeg: 150,  interventionType: 'intimidate',          minTier: 2 },
  { id: 'inspire',        label: 'Inspire',       type: 'intervention',  angleDeg: 180,  interventionType: 'inspire_intervention', minTier: 1 },
  { id: 'coincidence',    label: 'Coincidence',   type: 'intervention',  angleDeg: 225,  interventionType: 'coincidence',         minTier: 3 },
  { id: 'omen',           label: 'Omen',          type: 'intervention',  angleDeg: 255,  interventionType: 'omen',                minTier: 2 },
  { id: 'afflict_bless',  label: 'Afflict/Bless', type: 'intervention',  angleDeg: 300,  interventionType: 'afflict_bless',       minTier: 2 },
  { id: 'center',         label: '',              type: 'info',          angleDeg: -1,   interventionType: null,                  minTier: 0 },
];

/**
 * Compute the available wheel slots for an agent, given the player's current
 * tier with that agent, essence pool, and primary sphere.
 */
export function getAgentWheelSlots(params: WheelParams): WheelSlot[] {
  const { tier, pool, primarySphere } = params;

  return AGENT_WHEEL_LAYOUT.map(slot => {
    // Center info slot is always available
    if (slot.id === 'center') {
      return {
        ...slot,
        available: true,
        lockedReason: null,
        essenceCost: 0,
        detectionRisk: 0,
        sphere: null,
        interventionType: null,
      };
    }

    // Scry is free observation
    if (slot.id === 'scry') {
      const available = tier >= slot.minTier;
      return {
        ...slot,
        available,
        lockedReason: available ? null : `Requires tier ${slot.minTier}`,
        essenceCost: 0,
        detectionRisk: 0,
        sphere: null,
        interventionType: null,
      };
    }

    // Intervention slots
    const def = slot.interventionType ? INTERVENTION_DEFINITIONS[slot.interventionType] : null;
    const baseCost = def?.baseCost ?? 1;
    const detectionRisk = def?.detectionRisk ?? 0;
    const sphere = def?.sphereAffinities?.includes(primarySphere)
      ? primarySphere
      : (def?.sphereAffinities?.[0] ?? primarySphere);

    // Check tier
    const tierOk = tier >= slot.minTier;
    // Check affordability
    const affordOk = canAfford(pool, sphere, baseCost);

    let lockedReason: string | null = null;
    if (!tierOk) lockedReason = `Requires tier ${slot.minTier}`;
    else if (!affordOk) lockedReason = `Not enough ${sphere} essence`;

    return {
      id: slot.id,
      label: slot.label,
      type: slot.type,
      angleDeg: slot.angleDeg,
      available: tierOk && affordOk,
      lockedReason,
      essenceCost: baseCost,
      detectionRisk,
      sphere,
      interventionType: slot.interventionType,
    };
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/wheel.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/engine/wheel.ts src/engine/__tests__/wheel.test.ts
git commit -m "feat: add wheel data layer — slot availability based on tier and essence"
```

---

## Task 4: AgentWheel — Component

SVG radial menu that appears on the map centered on a selected agent's hex.

**Files:**
- Create: `src/components/Game/AgentWheel.tsx`
- Create: `src/components/Game/__tests__/AgentWheel.test.tsx`

**Step 1: Write failing tests**

```typescript
// src/components/Game/__tests__/AgentWheel.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentWheel } from '../AgentWheel';
import type { WheelSlot } from '../../../engine/wheel';

const mockSlots: WheelSlot[] = [
  { id: 'scry', label: 'Scry', type: 'observation', angleDeg: 0, available: true, lockedReason: null, essenceCost: 0, detectionRisk: 0, sphere: null, interventionType: null },
  { id: 'dream', label: 'Dream', type: 'intervention', angleDeg: 45, available: true, lockedReason: null, essenceCost: 2, detectionRisk: 0.1, sphere: 'mind', interventionType: 'dream' },
  { id: 'persuade', label: 'Persuade', type: 'intervention', angleDeg: 75, available: false, lockedReason: 'Not enough mind essence', essenceCost: 3, detectionRisk: 0.2, sphere: 'mind', interventionType: 'persuade' },
  { id: 'center', label: '', type: 'info', angleDeg: -1, available: true, lockedReason: null, essenceCost: 0, detectionRisk: 0, sphere: null, interventionType: null },
];

describe('AgentWheel', () => {
  it('renders slot labels', () => {
    render(
      <svg>
        <AgentWheel
          slots={mockSlots}
          agentName="Kael"
          agentTitle={null}
          cx={200} cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );
    expect(screen.getByText('Scry')).toBeTruthy();
    expect(screen.getByText('Dream')).toBeTruthy();
  });

  it('shows agent name in center', () => {
    render(
      <svg>
        <AgentWheel
          slots={mockSlots}
          agentName="Kael"
          agentTitle={null}
          cx={200} cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );
    expect(screen.getByText('Kael')).toBeTruthy();
  });

  it('calls onSlotClick when available slot is clicked', () => {
    const onClick = vi.fn();
    render(
      <svg>
        <AgentWheel
          slots={mockSlots}
          agentName="Kael"
          agentTitle={null}
          cx={200} cy={200}
          onSlotClick={onClick}
          onDismiss={vi.fn()}
        />
      </svg>
    );
    fireEvent.click(screen.getByText('Scry'));
    expect(onClick).toHaveBeenCalledWith('scry');
  });

  it('does not call onSlotClick for unavailable slots', () => {
    const onClick = vi.fn();
    render(
      <svg>
        <AgentWheel
          slots={mockSlots}
          agentName="Kael"
          agentTitle={null}
          cx={200} cy={200}
          onSlotClick={onClick}
          onDismiss={vi.fn()}
        />
      </svg>
    );
    fireEvent.click(screen.getByText('Persuade'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows agent title when present', () => {
    render(
      <svg>
        <AgentWheel
          slots={mockSlots}
          agentName="Kael"
          agentTitle="The Sword of Ashara"
          cx={200} cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );
    expect(screen.getByText(/Sword of Ashara/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/AgentWheel.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

The AgentWheel is an SVG `<g>` group with:
- A translucent dark circle backdrop
- Slot icons placed radially using `angleDeg`
- Labels next to each slot
- Center text with agent name/title
- Available slots are bright; unavailable slots are dimmed with a lock icon

```typescript
// src/components/Game/AgentWheel.tsx
import type { WheelSlot } from '../../engine/wheel';

interface AgentWheelProps {
  slots: WheelSlot[];
  agentName: string;
  agentTitle: string | null;
  cx: number;
  cy: number;
  onSlotClick: (slotId: string) => void;
  onDismiss: () => void;
}

const WHEEL_RADIUS = 80;
const SLOT_RADIUS = 14;

const SLOT_GLYPHS: Record<string, string> = {
  scry: '👁',
  dream: '💭',
  persuade: '🗣',
  deceive: '🎭',
  intimidate: '💀',
  inspire: '✨',
  coincidence: '🎲',
  omen: '🌑',
  afflict_bless: '⚡',
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function AgentWheel({
  slots, agentName, agentTitle, cx, cy, onSlotClick, onDismiss,
}: AgentWheelProps) {
  const actionSlots = slots.filter(s => s.id !== 'center');

  return (
    <g>
      {/* Backdrop circle — click to dismiss */}
      <circle
        cx={cx} cy={cy} r={WHEEL_RADIUS + 30}
        fill="rgba(0,0,0,0.5)"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{ cursor: 'pointer' }}
      />

      {/* Outer ring */}
      <circle
        cx={cx} cy={cy} r={WHEEL_RADIUS}
        fill="none" stroke="#92702a" strokeWidth={1} opacity={0.4}
      />

      {/* Slots */}
      {actionSlots.map(slot => {
        const pos = polarToCartesian(cx, cy, WHEEL_RADIUS, slot.angleDeg);
        const glyph = SLOT_GLYPHS[slot.id] ?? '?';

        return (
          <g
            key={slot.id}
            onClick={(e) => {
              e.stopPropagation();
              if (slot.available) onSlotClick(slot.id);
            }}
            style={{ cursor: slot.available ? 'pointer' : 'not-allowed' }}
            opacity={slot.available ? 1 : 0.3}
          >
            <circle
              cx={pos.x} cy={pos.y} r={SLOT_RADIUS}
              fill={slot.available ? '#1c1917' : '#292524'}
              stroke={slot.available ? '#d4a574' : '#57534e'}
              strokeWidth={1.5}
            />
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={14}
            >
              {glyph}
            </text>
            <text
              x={pos.x}
              y={pos.y + SLOT_RADIUS + 10}
              textAnchor="middle"
              fontSize={9}
              fill={slot.available ? '#fef3c7' : '#78716c'}
              fontFamily="Cinzel, serif"
            >
              {slot.label}
            </text>
          </g>
        );
      })}

      {/* Center — agent name */}
      <text
        x={cx} y={agentTitle ? cy - 6 : cy}
        textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight="bold" fill="#fef3c7"
        fontFamily="Cinzel, serif"
      >
        {agentName}
      </text>
      {agentTitle && (
        <text
          x={cx} y={cy + 8}
          textAnchor="middle" dominantBaseline="central"
          fontSize={8} fill="#d4a574"
          fontFamily="Cinzel, serif"
        >
          {agentTitle}
        </text>
      )}
    </g>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/AgentWheel.test.tsx`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/components/Game/AgentWheel.tsx src/components/Game/__tests__/AgentWheel.test.tsx
git commit -m "feat: add AgentWheel component — SVG radial menu for agent interactions"
```

---

## Task 5: StrandView — Data Helpers

Build pure functions that extract strand data from graph state for a specific agent.

**Files:**
- Create: `src/engine/strands.ts`
- Create: `src/engine/__tests__/strands.test.ts`

**Step 1: Write failing tests**

```typescript
// src/engine/__tests__/strands.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getPresenceStrand,
  getDesiresStrand,
  getBondsStrand,
  getAmbitionsStrand,
  getBeliefsStrand,
  getFearsStrand,
  type StrandData,
} from '../strands';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';

const VALUE_PAIRS: ValuePair[] = [
  'ambition_contentment', 'courage_prudence', 'cruelty_compassion',
  'cunning_honesty', 'devotion_independence', 'loyalty_treachery',
  'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity',
];

function makeProfile(overrides: Partial<Record<ValuePair, number>> = {}): AxiologicalProfile {
  const p = {} as AxiologicalProfile;
  for (const vp of VALUE_PAIRS) p[vp] = overrides[vp] ?? 0;
  return p;
}

function seedGraph() {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc1', type: 'location', name: 'Iron Gate', properties: { locationType: 'location' } });
  graph.addNode({ id: 'faction1', type: 'actor', name: 'Iron Legion', properties: { actorType: 'faction' } });

  const profile = makeProfile({
    ambition_contentment: 0.8,     // Very ambitious
    greed_generosity: -0.6,        // Generous
    loyalty_treachery: 0.7,        // Very loyal
    devotion_independence: 0.5,    // Devoted
    courage_prudence: 0.9,         // Very courageous
    cruelty_compassion: -0.4,      // Compassionate
    cunning_honesty: -0.3,         // Honest-leaning
    dominance_humility: 0.3,       // Slightly dominant
    wrath_patience: -0.2,          // Patient
    tradition_innovation: 0.6,     // Traditional
  });

  graph.addNode({
    id: 'agent1', type: 'actor', name: 'Kael',
    properties: {
      actorType: 'individual',
      axiologicalProfile: profile,
      domainCapabilities: { iron: 70, gold: 30, heart: 45 },
      locationId: 'loc1',
    },
  });

  // Relationships
  graph.addEdge({ id: 'e_at', source: 'agent1', target: 'loc1', type: 'contains', properties: {} });
  graph.addEdge({ id: 'e_member', source: 'agent1', target: 'faction1', type: 'member_of', properties: { role: 'captain' } });

  // Add another agent for relationship testing
  graph.addNode({
    id: 'agent2', type: 'actor', name: 'Lyra',
    properties: { actorType: 'individual', axiologicalProfile: makeProfile(), domainCapabilities: {}, locationId: 'loc1' },
  });
  graph.addEdge({
    id: 'e_rel', source: 'agent1', target: 'agent2', type: 'relates_to',
    properties: { sentiment: 0.7, strength: 0.8, basis: 'friendship' },
  });

  return graph;
}

describe('Presence strand', () => {
  it('returns location and domain capabilities', () => {
    const graph = seedGraph();
    const strand = getPresenceStrand(graph, 'agent1');
    expect(strand.strandName).toBe('Presence');
    expect(strand.locationName).toBe('Iron Gate');
    expect(strand.topDomains).toBeDefined();
    expect(strand.topDomains.length).toBeGreaterThan(0);
    expect(strand.topDomains[0].domain).toBe('iron');
  });
});

describe('Desires strand', () => {
  it('extracts desire-relevant values', () => {
    const graph = seedGraph();
    const strand = getDesiresStrand(graph, 'agent1');
    expect(strand.strandName).toBe('Desires');
    expect(strand.insights.length).toBeGreaterThan(0);
    // Greed/generosity is -0.6 (generous), should show up
    expect(strand.insights.some(i => i.valuePair === 'greed_generosity')).toBe(true);
  });
});

describe('Bonds strand', () => {
  it('returns relationships and faction membership', () => {
    const graph = seedGraph();
    const strand = getBondsStrand(graph, 'agent1');
    expect(strand.strandName).toBe('Bonds');
    expect(strand.relationships).toHaveLength(1);
    expect(strand.relationships[0].targetName).toBe('Lyra');
    expect(strand.relationships[0].sentiment).toBe(0.7);
    expect(strand.factions).toHaveLength(1);
    expect(strand.factions[0].name).toBe('Iron Legion');
  });
});

describe('Ambitions strand', () => {
  it('extracts ambition-relevant values', () => {
    const graph = seedGraph();
    const strand = getAmbitionsStrand(graph, 'agent1');
    expect(strand.strandName).toBe('Ambitions');
    // ambition_contentment = 0.8 (very ambitious)
    expect(strand.insights.some(i => i.valuePair === 'ambition_contentment')).toBe(true);
  });
});

describe('Beliefs strand', () => {
  it('extracts belief-relevant values', () => {
    const graph = seedGraph();
    const strand = getBeliefsStrand(graph, 'agent1');
    expect(strand.strandName).toBe('Beliefs');
    expect(strand.insights.some(i => i.valuePair === 'tradition_innovation')).toBe(true);
  });
});

describe('Fears strand', () => {
  it('derives fears from shadow side of strong values', () => {
    const graph = seedGraph();
    const strand = getFearsStrand(graph, 'agent1');
    expect(strand.strandName).toBe('Fears');
    expect(strand.insights.length).toBeGreaterThan(0);
    // Very ambitious (0.8) → fears failure/irrelevance
    // Very loyal (0.7) → fears betrayal
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/strands.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/engine/strands.ts
import type { WorldGraph } from './graph';
import type { AxiologicalProfile, ValuePair } from '../types/agent';

// ─── Strand Types ─────────────────────────────────────────────

export interface ValueInsight {
  valuePair: ValuePair;
  value: number;
  label: string;
  description: string;
}

export interface RelationshipInfo {
  targetId: string;
  targetName: string;
  sentiment: number;
  strength: number;
  basis: string;
}

export interface FactionInfo {
  id: string;
  name: string;
  role: string;
}

export interface DomainRank {
  domain: string;
  score: number;
}

export interface PresenceStrandData {
  strandName: 'Presence';
  locationName: string;
  locationId: string;
  topDomains: DomainRank[];
  companions: Array<{ id: string; name: string }>;
}

export interface DesiresStrandData {
  strandName: 'Desires';
  insights: ValueInsight[];
}

export interface BondsStrandData {
  strandName: 'Bonds';
  relationships: RelationshipInfo[];
  factions: FactionInfo[];
  insights: ValueInsight[];
}

export interface AmbitionsStrandData {
  strandName: 'Ambitions';
  insights: ValueInsight[];
}

export interface BeliefsStrandData {
  strandName: 'Beliefs';
  insights: ValueInsight[];
}

export interface FearsStrandData {
  strandName: 'Fears';
  insights: ValueInsight[];
}

export type StrandData =
  | PresenceStrandData
  | DesiresStrandData
  | BondsStrandData
  | AmbitionsStrandData
  | BeliefsStrandData
  | FearsStrandData;

// ─── Value Pair Categorization ────────────────────────────────

/** Which strands each value pair is relevant to */
const DESIRE_VALUES: ValuePair[] = ['greed_generosity', 'cruelty_compassion', 'wrath_patience'];
const BOND_VALUES: ValuePair[] = ['loyalty_treachery', 'devotion_independence'];
const AMBITION_VALUES: ValuePair[] = ['ambition_contentment', 'dominance_humility', 'courage_prudence'];
const BELIEF_VALUES: ValuePair[] = ['tradition_innovation', 'cunning_honesty', 'devotion_independence'];

// ─── Value Labels ─────────────────────────────────────────────

const VALUE_LABELS: Record<ValuePair, [string, string]> = {
  ambition_contentment:   ['Ambitious',    'Content'],
  courage_prudence:       ['Courageous',   'Prudent'],
  cruelty_compassion:     ['Cruel',        'Compassionate'],
  cunning_honesty:        ['Cunning',      'Honest'],
  devotion_independence:  ['Devoted',      'Independent'],
  loyalty_treachery:      ['Loyal',        'Treacherous'],
  tradition_innovation:   ['Traditional',  'Innovative'],
  dominance_humility:     ['Dominant',     'Humble'],
  wrath_patience:         ['Wrathful',     'Patient'],
  greed_generosity:       ['Greedy',       'Generous'],
};

const FEAR_DESCRIPTIONS: Record<ValuePair, [string, string]> = {
  ambition_contentment:   ['Fears irrelevance and failure',        'Fears being forced to strive'],
  courage_prudence:       ['Fears showing weakness',               'Fears reckless consequences'],
  cruelty_compassion:     ['Fears vulnerability',                  'Fears becoming heartless'],
  cunning_honesty:        ['Fears being outwitted',                'Fears having to deceive'],
  devotion_independence:  ['Fears abandonment by their cause',     'Fears losing freedom'],
  loyalty_treachery:      ['Fears betrayal by those they trust',   'Fears being bound by loyalty'],
  tradition_innovation:   ['Fears the loss of the old ways',       'Fears stagnation'],
  dominance_humility:     ['Fears losing control',                 'Fears being forced to dominate'],
  wrath_patience:         ['Fears being powerless to act',         'Fears losing their temper'],
  greed_generosity:       ['Fears poverty and scarcity',           'Fears becoming selfish'],
};

// ─── Helpers ──────────────────────────────────────────────────

function getProfile(graph: WorldGraph, agentId: string): AxiologicalProfile {
  const node = graph.getNode(agentId);
  return (node?.properties as Record<string, unknown>)?.axiologicalProfile as AxiologicalProfile ?? {} as AxiologicalProfile;
}

function extractInsights(profile: AxiologicalProfile, valuePairs: ValuePair[]): ValueInsight[] {
  return valuePairs
    .filter(vp => profile[vp] !== undefined)
    .map(vp => {
      const v = profile[vp];
      const [posLabel, negLabel] = VALUE_LABELS[vp];
      const label = v >= 0 ? posLabel : negLabel;
      const strength = Math.abs(v);
      const intensity = strength > 0.7 ? 'Deeply' : strength > 0.3 ? 'Notably' : 'Slightly';
      return {
        valuePair: vp,
        value: v,
        label,
        description: `${intensity} ${label.toLowerCase()}`,
      };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

// ─── Strand Extractors ────────────────────────────────────────

export function getPresenceStrand(graph: WorldGraph, agentId: string): PresenceStrandData {
  const node = graph.getNode(agentId);
  const props = (node?.properties ?? {}) as Record<string, unknown>;
  const locationId = (props.locationId as string) ?? '';
  const locNode = graph.getNode(locationId);
  const caps = (props.domainCapabilities as Record<string, number>) ?? {};

  const topDomains = Object.entries(caps)
    .map(([domain, score]) => ({ domain, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Find companions at same location
  const companions: Array<{ id: string; name: string }> = [];
  if (locationId) {
    const atLoc = graph.getIncomingEdges(locationId, 'contains');
    for (const edge of atLoc) {
      if (edge.source !== agentId) {
        const companion = graph.getNode(edge.source);
        if (companion && companion.type === 'actor') {
          companions.push({ id: companion.id, name: companion.name });
        }
      }
    }
  }

  return {
    strandName: 'Presence',
    locationName: locNode?.name ?? 'Unknown',
    locationId,
    topDomains,
    companions,
  };
}

export function getDesiresStrand(graph: WorldGraph, agentId: string): DesiresStrandData {
  const profile = getProfile(graph, agentId);
  return {
    strandName: 'Desires',
    insights: extractInsights(profile, DESIRE_VALUES),
  };
}

export function getBondsStrand(graph: WorldGraph, agentId: string): BondsStrandData {
  const profile = getProfile(graph, agentId);

  // Relationships
  const relEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  const relationships: RelationshipInfo[] = relEdges.map(edge => {
    const target = graph.getNode(edge.target);
    const p = edge.properties as Record<string, unknown>;
    return {
      targetId: edge.target,
      targetName: target?.name ?? 'Unknown',
      sentiment: (p.sentiment as number) ?? 0,
      strength: (p.strength as number) ?? 0,
      basis: (p.basis as string) ?? 'unknown',
    };
  }).sort((a, b) => b.strength - a.strength);

  // Factions
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  const factions: FactionInfo[] = memberEdges.map(edge => {
    const faction = graph.getNode(edge.target);
    return {
      id: edge.target,
      name: faction?.name ?? 'Unknown',
      role: (edge.properties as Record<string, unknown>).role as string ?? 'member',
    };
  });

  return {
    strandName: 'Bonds',
    relationships,
    factions,
    insights: extractInsights(profile, BOND_VALUES),
  };
}

export function getAmbitionsStrand(graph: WorldGraph, agentId: string): AmbitionsStrandData {
  const profile = getProfile(graph, agentId);
  return {
    strandName: 'Ambitions',
    insights: extractInsights(profile, AMBITION_VALUES),
  };
}

export function getBeliefsStrand(graph: WorldGraph, agentId: string): BeliefsStrandData {
  const profile = getProfile(graph, agentId);
  return {
    strandName: 'Beliefs',
    insights: extractInsights(profile, BELIEF_VALUES),
  };
}

export function getFearsStrand(graph: WorldGraph, agentId: string): FearsStrandData {
  const profile = getProfile(graph, agentId);

  // Fears are derived from the shadow side of strong values
  const allPairs = Object.keys(VALUE_LABELS) as ValuePair[];
  const insights: ValueInsight[] = allPairs
    .filter(vp => profile[vp] !== undefined && Math.abs(profile[vp]) > 0.3)
    .map(vp => {
      const v = profile[vp];
      const [posFear, negFear] = FEAR_DESCRIPTIONS[vp];
      return {
        valuePair: vp,
        value: v,
        label: v >= 0 ? 'Fear' : 'Fear',
        description: v >= 0 ? posFear : negFear,
      };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return {
    strandName: 'Fears',
    insights,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/strands.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/engine/strands.ts src/engine/__tests__/strands.test.ts
git commit -m "feat: add strand data extractors — 6 psyche strands from graph state"
```

---

## Task 6: StrandView — Component

Large overlay showing the 6-strand deep-dive into an agent's psyche.

**Files:**
- Create: `src/components/Game/StrandView.tsx`
- Create: `src/components/Game/__tests__/StrandView.test.tsx`

**Step 1: Write failing tests**

```typescript
// src/components/Game/__tests__/StrandView.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrandView } from '../StrandView';
import type {
  PresenceStrandData,
  DesiresStrandData,
  BondsStrandData,
  AmbitionsStrandData,
  BeliefsStrandData,
  FearsStrandData,
} from '../../../engine/strands';

const mockStrands = {
  presence: {
    strandName: 'Presence',
    locationName: 'Iron Gate',
    locationId: 'loc1',
    topDomains: [{ domain: 'iron', score: 70 }, { domain: 'gold', score: 30 }],
    companions: [{ id: 'agent2', name: 'Lyra' }],
  } as PresenceStrandData,
  desires: {
    strandName: 'Desires',
    insights: [
      { valuePair: 'greed_generosity' as const, value: -0.6, label: 'Generous', description: 'Notably generous' },
    ],
  } as DesiresStrandData,
  bonds: {
    strandName: 'Bonds',
    relationships: [{ targetId: 'agent2', targetName: 'Lyra', sentiment: 0.7, strength: 0.8, basis: 'friendship' }],
    factions: [{ id: 'faction1', name: 'Iron Legion', role: 'captain' }],
    insights: [],
  } as BondsStrandData,
  ambitions: {
    strandName: 'Ambitions',
    insights: [
      { valuePair: 'ambition_contentment' as const, value: 0.8, label: 'Ambitious', description: 'Deeply ambitious' },
    ],
  } as AmbitionsStrandData,
  beliefs: {
    strandName: 'Beliefs',
    insights: [
      { valuePair: 'tradition_innovation' as const, value: 0.6, label: 'Traditional', description: 'Notably traditional' },
    ],
  } as BeliefsStrandData,
  fears: {
    strandName: 'Fears',
    insights: [
      { valuePair: 'ambition_contentment' as const, value: 0.8, label: 'Fear', description: 'Fears irrelevance and failure' },
    ],
  } as FearsStrandData,
};

describe('StrandView', () => {
  it('renders agent name', () => {
    render(
      <StrandView
        agentName="Kael"
        strands={mockStrands}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Kael')).toBeTruthy();
  });

  it('shows all 6 strand tab labels', () => {
    render(
      <StrandView
        agentName="Kael"
        strands={mockStrands}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Presence')).toBeTruthy();
    expect(screen.getByText('Desires')).toBeTruthy();
    expect(screen.getByText('Bonds')).toBeTruthy();
    expect(screen.getByText('Ambitions')).toBeTruthy();
    expect(screen.getByText('Beliefs')).toBeTruthy();
    expect(screen.getByText('Fears')).toBeTruthy();
  });

  it('defaults to Presence strand', () => {
    render(
      <StrandView
        agentName="Kael"
        strands={mockStrands}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Iron Gate')).toBeTruthy();
  });

  it('switches strands when tab clicked', () => {
    render(
      <StrandView
        agentName="Kael"
        strands={mockStrands}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Bonds'));
    expect(screen.getByText('Lyra')).toBeTruthy();
    expect(screen.getByText(/Iron Legion/)).toBeTruthy();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows fear descriptions in Fears tab', () => {
    render(
      <StrandView
        agentName="Kael"
        strands={mockStrands}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Fears'));
    expect(screen.getByText(/irrelevance/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/StrandView.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

The StrandView is a large overlay with:
- Semi-transparent dark backdrop (map peeks through)
- Agent name at top
- 6 strand tabs as a horizontal selector
- Active strand content panel
- Close button

```typescript
// src/components/Game/StrandView.tsx
import { useState } from 'react';
import type {
  PresenceStrandData,
  DesiresStrandData,
  BondsStrandData,
  AmbitionsStrandData,
  BeliefsStrandData,
  FearsStrandData,
  ValueInsight,
} from '../../engine/strands';

interface StrandViewProps {
  agentName: string;
  strands: {
    presence: PresenceStrandData;
    desires: DesiresStrandData;
    bonds: BondsStrandData;
    ambitions: AmbitionsStrandData;
    beliefs: BeliefsStrandData;
    fears: FearsStrandData;
  };
  onClose: () => void;
}

type StrandName = 'Presence' | 'Desires' | 'Bonds' | 'Ambitions' | 'Beliefs' | 'Fears';

const STRAND_ICONS: Record<StrandName, string> = {
  Presence: '👁',
  Desires: '🔥',
  Bonds: '🔗',
  Ambitions: '⭐',
  Beliefs: '📜',
  Fears: '🌑',
};

const STRAND_COLORS: Record<StrandName, string> = {
  Presence: '#d4a574',
  Desires: '#e87534',
  Bonds: '#5c6bc0',
  Ambitions: '#eab308',
  Beliefs: '#7cb342',
  Fears: '#b71c1c',
};

function InsightList({ insights, color }: { insights: ValueInsight[]; color: string }) {
  if (insights.length === 0) {
    return <p className="text-amber-400/30 text-sm italic">No strong tendencies observed.</p>;
  }
  return (
    <div className="space-y-3">
      {insights.map(insight => (
        <div key={insight.valuePair} className="flex items-start gap-3">
          <div
            className="w-1.5 h-8 rounded-full flex-shrink-0 mt-1"
            style={{
              backgroundColor: color,
              opacity: Math.abs(insight.value) * 0.8 + 0.2,
            }}
          />
          <div>
            <span className="text-sm font-medium text-amber-100">
              {insight.label}
            </span>
            <span className="text-xs text-amber-400/50 ml-2">
              ({insight.description})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PresenceContent({ data }: { data: PresenceStrandData }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Location</h4>
        <p className="text-sm text-amber-100">{data.locationName}</p>
      </div>
      {data.topDomains.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Capabilities</h4>
          <div className="space-y-1">
            {data.topDomains.map(d => (
              <div key={d.domain} className="flex items-center gap-2">
                <span className="text-xs text-amber-100 w-16 capitalize">{d.domain}</span>
                <div className="flex-1 h-1.5 bg-stone-700 rounded">
                  <div className="h-full bg-amber-600/60 rounded" style={{ width: `${d.score}%` }} />
                </div>
                <span className="text-xs text-amber-400/40 w-8 text-right">{d.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.companions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Companions</h4>
          <div className="flex flex-wrap gap-1">
            {data.companions.map(c => (
              <span key={c.id} className="text-xs text-amber-100 bg-stone-700/50 px-2 py-0.5 rounded">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BondsContent({ data }: { data: BondsStrandData }) {
  return (
    <div className="space-y-4">
      {data.factions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Allegiances</h4>
          {data.factions.map(f => (
            <div key={f.id} className="text-sm text-amber-100">
              {f.name} <span className="text-amber-400/40">({f.role})</span>
            </div>
          ))}
        </div>
      )}
      {data.relationships.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-1">Relationships</h4>
          <div className="space-y-2">
            {data.relationships.map(r => (
              <div key={r.targetId} className="flex items-center gap-2">
                <span className="text-sm text-amber-100">{r.targetName}</span>
                <span className={`text-xs ${r.sentiment > 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>
                  {r.basis}
                </span>
                <div className="flex-1 h-1 bg-stone-700 rounded ml-2">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${r.strength * 100}%`,
                      backgroundColor: r.sentiment > 0 ? '#4ade80' : '#f87171',
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <InsightList insights={data.insights} color={STRAND_COLORS.Bonds} />
    </div>
  );
}

export function StrandView({ agentName, strands, onClose }: StrandViewProps) {
  const [activeStrand, setActiveStrand] = useState<StrandName>('Presence');
  const strandNames: StrandName[] = ['Presence', 'Desires', 'Bonds', 'Ambitions', 'Beliefs', 'Fears'];

  const renderContent = () => {
    switch (activeStrand) {
      case 'Presence': return <PresenceContent data={strands.presence} />;
      case 'Bonds': return <BondsContent data={strands.bonds} />;
      case 'Desires': return <InsightList insights={strands.desires.insights} color={STRAND_COLORS.Desires} />;
      case 'Ambitions': return <InsightList insights={strands.ambitions.insights} color={STRAND_COLORS.Ambitions} />;
      case 'Beliefs': return <InsightList insights={strands.beliefs.insights} color={STRAND_COLORS.Beliefs} />;
      case 'Fears': return <InsightList insights={strands.fears.insights} color={STRAND_COLORS.Fears} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-[70%] max-w-4xl h-[70%] bg-stone-900/95 border border-amber-900/40 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-amber-900/30">
          <div>
            <h2
              className="text-lg font-bold text-amber-100"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {agentName}
            </h2>
            <p className="text-xs text-amber-400/40 mt-0.5">
              You peer into their soul and see...
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-amber-400/50 hover:text-amber-200 text-lg px-2"
          >
            ✕
          </button>
        </div>

        {/* Strand tabs */}
        <div className="flex border-b border-amber-900/20 px-4">
          {strandNames.map(name => (
            <button
              key={name}
              onClick={() => setActiveStrand(name)}
              className={`
                px-4 py-2 text-xs font-medium transition-colors border-b-2
                ${activeStrand === name
                  ? 'border-current text-amber-100'
                  : 'border-transparent text-amber-400/40 hover:text-amber-400/70'
                }
              `}
              style={activeStrand === name ? { color: STRAND_COLORS[name] } : undefined}
            >
              <span className="mr-1">{STRAND_ICONS[name]}</span>
              {name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/StrandView.test.tsx`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/components/Game/StrandView.tsx src/components/Game/__tests__/StrandView.test.tsx
git commit -m "feat: add StrandView component — 6-strand agent deep-dive overlay"
```

---

## Task 7: Wire Into GameView

Connect RetinuePanel, AgentWheel, and StrandView to the main GameView. Add state management for agent selection, wheel visibility, and strand view.

**Files:**
- Modify: `src/components/Game/GameView.tsx`

**Step 1: Write failing test**

```typescript
// src/components/Game/__tests__/GameView-interaction.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameView } from '../GameView';
import type { AscendantArchetype } from '../../../types/influence';
import type { CosmologyProfile } from '../../../types';
import { SPHERE_NAMES } from '../../../types';

// Build minimal valid props
function makeProfile(): Record<string, number> {
  const p: Record<string, number> = {};
  for (const vp of ['ambition_contentment', 'courage_prudence', 'cruelty_compassion', 'cunning_honesty', 'devotion_independence', 'loyalty_treachery', 'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity']) {
    p[vp] = 0;
  }
  return p;
}

const archetype: AscendantArchetype = {
  id: 'test',
  name: 'Test God',
  title: 'The Tester',
  description: 'A god of testing',
  sphereAlignment: { primary: 'mind', secondary: 'spirit' },
  startingDomainAffinities: {},
  personalitySeed: makeProfile() as any,
  flavorText: 'Testing...',
};

const cosmology: CosmologyProfile = {
  sphereWeights: Object.fromEntries(SPHERE_NAMES.map(s => [s, 1])) as any,
  foundationBalance: { chaosOrder: 0, lightDarkness: 0 },
};

describe('GameView interaction layer', () => {
  it('renders Retinue header in the right sidebar', () => {
    render(<GameView archetype={archetype} avatarName="TestAvatar" cosmology={cosmology} seed={42} />);
    // The retinue panel should be present even if empty
    expect(screen.getByText(/retinue/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/GameView-interaction.test.tsx`
Expected: FAIL — no "Retinue" text found (current GameView doesn't include RetinuePanel)

**Step 3: Modify GameView**

Add the following to `GameView.tsx`:

1. New imports at top:
```typescript
import { RetinuePanel } from './RetinuePanel';
import { AgentWheel } from './AgentWheel';
import { StrandView } from './StrandView';
import { getRetinueAgents } from '../../engine/retinue';
import { getAgentWheelSlots } from '../../engine/wheel';
import {
  getPresenceStrand,
  getDesiresStrand,
  getBondsStrand,
  getAmbitionsStrand,
  getBeliefsStrand,
  getFearsStrand,
} from '../../engine/strands';
```

2. New state variables inside `GameView` component:
```typescript
const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
const [wheelVisible, setWheelVisible] = useState(false);
const [strandViewAgent, setStrandViewAgent] = useState<string | null>(null);
```

3. Derived data:
```typescript
const retinueAgents = useMemo(
  () => getRetinueAgents(gameState.graph, gameState.ascendantId),
  [gameState.graph, gameState.ascendantId, gameState.tick]
);

const wheelSlots = useMemo(() => {
  if (!selectedAgentId || !wheelVisible) return null;
  const tier = retinueAgents.find(a => a.id === selectedAgentId)?.tier;
  if (tier === undefined) return null;
  return getAgentWheelSlots({
    tier,
    pool: gameState.essencePool,
    primarySphere: archetype.sphereAlignment.primary,
  });
}, [selectedAgentId, wheelVisible, gameState.essencePool, retinueAgents, archetype]);
```

4. Handlers:
```typescript
const handleAgentSelect = useCallback((agentId: string) => {
  setSelectedAgentId(agentId);
  setWheelVisible(true);
  setStrandViewAgent(null);
}, []);

const handleWheelSlotClick = useCallback((slotId: string) => {
  if (slotId === 'scry' && selectedAgentId) {
    setStrandViewAgent(selectedAgentId);
    setWheelVisible(false);
  }
  // Other interventions will be handled in Layer 2
}, [selectedAgentId]);

const handleWheelDismiss = useCallback(() => {
  setWheelVisible(false);
}, []);

const handleStrandClose = useCallback(() => {
  setStrandViewAgent(null);
  setWheelVisible(true); // Return to wheel after closing strands
}, []);
```

5. Update layout JSX — add RetinuePanel as right sidebar, AgentWheel into HexMap SVG area, StrandView as overlay.

The updated return JSX structure:
```tsx
<div className="min-h-screen bg-stone-900 flex flex-col">
  <DoomBar ... />
  <div className="flex flex-1 overflow-hidden">
    {/* Left sidebar (unchanged) */}
    <div className="w-80 flex-shrink-0 ...">
      ...existing content...
    </div>

    {/* Center: map + feed */}
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <HexMap ... />
        {/* Wheel goes here as an absolutely positioned SVG overlay */}
      </div>
      <div className="border-t border-amber-900/30 bg-stone-800/80 p-3">
        <NarrativeFeed ... />
      </div>
    </div>

    {/* Right sidebar — Retinue Panel */}
    <div className="w-72 flex-shrink-0 border-l border-amber-900/30 bg-stone-800/90 overflow-y-auto">
      <RetinuePanel
        agents={retinueAgents}
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
      />
    </div>
  </div>

  {harvestResult && <HarvestScreen ... />}

  {/* Strand View overlay */}
  {strandViewAgent && (
    <StrandView
      agentName={gameState.graph.getNode(strandViewAgent)?.name ?? 'Unknown'}
      strands={{
        presence: getPresenceStrand(gameState.graph, strandViewAgent),
        desires: getDesiresStrand(gameState.graph, strandViewAgent),
        bonds: getBondsStrand(gameState.graph, strandViewAgent),
        ambitions: getAmbitionsStrand(gameState.graph, strandViewAgent),
        beliefs: getBeliefsStrand(gameState.graph, strandViewAgent),
        fears: getFearsStrand(gameState.graph, strandViewAgent),
      }}
      onClose={handleStrandClose}
    />
  )}
</div>
```

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (existing + new tests)

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx src/components/Game/__tests__/GameView-interaction.test.tsx
git commit -m "feat: wire RetinuePanel, AgentWheel, StrandView into GameView"
```

---

## Task 8: Visual Polish & Integration Test

Manual review pass: verify the full interaction flow works end-to-end.

**Files:**
- Possibly touch: `src/components/Game/GameView.tsx` (minor fixes)
- Possibly touch: any component needing visual adjustment

**Step 1: Run build to check for type errors**

Run: `npx tsc -b`
Expected: No errors

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

**Step 3: Start dev server and verify visually**

Run: `npm run dev`
Expected: App loads, right sidebar shows Retinue header. After simulation runs a few ticks and agents gain influence, they appear in the list.

**Step 4: Fix any issues found**

(Depends on what comes up — keep changes minimal)

**Step 5: Final commit**

```bash
git add -u
git commit -m "polish: visual refinements and integration fixes for Layer 1"
```

---

## Summary

| Task | What | Tests Added |
|------|------|-------------|
| 1 | Retinue data helpers (`getRetinueAgents`) | 5 |
| 2 | RetinuePanel component | 7 |
| 3 | Wheel data layer (`getAgentWheelSlots`) | 6 |
| 4 | AgentWheel SVG component | 5 |
| 5 | Strand data extractors (6 functions) | 6 |
| 6 | StrandView overlay component | 6 |
| 7 | Wire everything into GameView | 1+ |
| 8 | Polish & integration verification | 0 (manual) |

**Total: 8 tasks, ~36 new tests, 6 new files, 1 modified file**
