# Agent Detail Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full character sheet panel that replaces the right sidebar when an agent is selected, showing archetype, domain capabilities, axiological values, relationships, and action buttons.

**Architecture:** One new content data file (19 archetypes), one new engine aggregator (`getAgentDetail`), one new React component (`AgentDetailPanel`), and wiring changes to `GameView.tsx` + `worldSeed.ts`. All data comes from existing graph queries — no new graph schema changes.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react, Tailwind CSS, Cinzel serif font

**Design doc:** `Docs/plans/2026-03-06-agent-detail-panel-design.md`

---

### Task 1: Archetype Content Data

**Files:**
- Create: `src/data/archetype-content.ts`
- Create: `src/data/__tests__/archetype-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/archetype-content.test.ts
import { describe, it, expect } from 'vitest';
import { NARRATIVE_ARCHETYPES, getArchetype } from '../archetype-content';
import type { NarrativeArchetype } from '../archetype-content';

describe('archetype-content', () => {
  it('exports exactly 19 archetypes', () => {
    expect(NARRATIVE_ARCHETYPES).toHaveLength(19);
  });

  it('each archetype has required fields', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      expect(arch.id).toBeTruthy();
      expect(arch.name).toBeTruthy();
      expect(arch.storyShape).toBeTruthy();
      expect(arch.proseTone).toBeTruthy();
      expect(arch.reachAffinities.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('all archetype ids are unique', () => {
    const ids = NARRATIVE_ARCHETYPES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getArchetype returns correct archetype by id', () => {
    const hero = getArchetype('tragic_hero');
    expect(hero).toBeDefined();
    expect(hero!.name).toBe('Tragic Hero');
  });

  it('getArchetype returns undefined for unknown id', () => {
    expect(getArchetype('nonexistent')).toBeUndefined();
  });

  it('reach affinities use valid ReachDomain values', () => {
    const validDomains = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
    for (const arch of NARRATIVE_ARCHETYPES) {
      for (const reach of arch.reachAffinities) {
        expect(validDomains).toContain(reach);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/archetype-content.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/data/archetype-content.ts
/**
 * Archetype Content Package — 19 narrative archetypes from the content strategy.
 *
 * Each agent is assigned one archetype during world generation. The archetype
 * influences prose tone, story shape, and highlights certain Reach affinities.
 *
 * Source: Docs/plans/2026-03-06-content-strategy.md
 */

import type { ReachDomain } from '../types/traits';

export interface NarrativeArchetype {
  /** Snake_case identifier, e.g. 'tragic_hero' */
  id: string;
  /** Display name, e.g. 'Tragic Hero' */
  name: string;
  /** One-line story shape, e.g. 'Rise, hubris, fall' */
  storyShape: string;
  /** Prose tone keywords, e.g. 'Grand, foreboding, inevitable' */
  proseTone: string;
  /** 2-3 Reach domains this archetype gravitates toward */
  reachAffinities: ReachDomain[];
}

export const NARRATIVE_ARCHETYPES: NarrativeArchetype[] = [
  { id: 'tragic_hero', name: 'Tragic Hero', storyShape: 'Rise, hubris, fall', proseTone: 'Grand, foreboding, inevitable', reachAffinities: ['iron', 'veil', 'heart'] },
  { id: 'trickster', name: 'Trickster', storyShape: 'Schemes, reversals, ironic justice', proseTone: 'Wry, quick, darkly comic', reachAffinities: ['shadow', 'gold', 'heart'] },
  { id: 'coming_of_age', name: 'Coming of Age', storyShape: 'Innocence → hardening → transformation', proseTone: 'Wonder fading to resolve', reachAffinities: ['flesh', 'veil', 'eye'] },
  { id: 'brooding_warrior', name: 'Brooding Warrior', storyShape: 'Burden, endurance, reluctant action', proseTone: 'Terse, heavy, physical', reachAffinities: ['iron', 'stone', 'star'] },
  { id: 'fallen_noble', name: 'Fallen Noble', storyShape: 'Lost glory, bitter wisdom, possible redemption', proseTone: 'Weary, sharp-edged, proud', reachAffinities: ['gold', 'heart', 'shadow'] },
  { id: 'true_believer', name: 'True Believer', storyShape: 'Faith tested, vindicated or shattered', proseTone: 'Fervent, intense, certain', reachAffinities: ['veil', 'star', 'heart'] },
  { id: 'schemer', name: 'Schemer', storyShape: 'Webs of manipulation, delayed payoffs', proseTone: 'Cold, precise, calculating', reachAffinities: ['shadow', 'gold', 'heart'] },
  { id: 'wanderer', name: 'Wanderer', storyShape: 'Rootless, observing, stumbling into consequence', proseTone: 'Detached, laconic, then suddenly urgent', reachAffinities: ['star', 'eye', 'shadow'] },
  { id: 'monster', name: 'Monster', storyShape: 'Inhuman acts, possibly with buried humanity', proseTone: 'Brutal, unflinching, occasionally tender', reachAffinities: ['iron', 'flesh', 'shadow'] },
  { id: 'folk_hero', name: 'Folk Hero', storyShape: 'Unlikely champion, beloved by common people', proseTone: 'Warm, earthy, darkly funny', reachAffinities: ['heart', 'stone', 'gold'] },
  { id: 'reluctant_king', name: 'Reluctant King', storyShape: 'Refuses power → forced to accept → transformed by burden', proseTone: 'Quiet dignity, weight of duty, melancholy', reachAffinities: ['heart', 'iron', 'stone'] },
  { id: 'oathkeeper', name: 'Oathkeeper', storyShape: 'Bound by a vow that costs everything', proseTone: 'Stubborn, grinding, the vow becomes the whole person', reachAffinities: ['iron', 'star', 'heart'] },
  { id: 'poisoned_court', name: 'Poisoned Court', storyShape: 'Power corrupts, alliances shift, trust is a weapon', proseTone: 'Silken, venomous, every word has a second meaning', reachAffinities: ['gold', 'heart', 'shadow'] },
  { id: 'doomed_innocent', name: 'Doomed Innocent', storyShape: 'Good person in a world that will break them', proseTone: 'Tender at first, darkening steadily, no rescue coming', reachAffinities: ['star', 'veil', 'heart'] },
  { id: 'old_power', name: 'Old Power', storyShape: 'Ancient, vast, fading or awakening', proseTone: 'Slow, heavy, elemental — weight not speed', reachAffinities: ['veil', 'eye', 'star'] },
  { id: 'kingmaker', name: 'Kingmaker', storyShape: 'Never rules, always decides who does', proseTone: 'Shrewd, understated, power through others', reachAffinities: ['gold', 'heart', 'shadow'] },
  { id: 'seeker', name: 'Seeker', storyShape: 'Pursues forbidden knowledge, pays the price of knowing', proseTone: 'Obsessive, precise, progressively unhinged', reachAffinities: ['eye', 'veil', 'star'] },
  { id: 'maker', name: 'Maker', storyShape: 'Creates something that outlasts them — or destroys them', proseTone: 'Patient, hands-on, proud — the craft is sacred', reachAffinities: ['stone', 'flesh', 'eye'] },
  { id: 'noble_savage', name: 'Noble Savage', storyShape: 'Primal strength meets civilization, transforms it or is broken', proseTone: 'Raw, physical, elemental — contempt for complexity', reachAffinities: ['iron', 'flesh', 'stone'] },
];

/** Lookup by id. Returns undefined if not found. */
export function getArchetype(id: string): NarrativeArchetype | undefined {
  return NARRATIVE_ARCHETYPES.find(a => a.id === id);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/archetype-content.test.ts`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add src/data/archetype-content.ts src/data/__tests__/archetype-content.test.ts
git commit -m "feat: add 19 narrative archetype content definitions"
```

---

### Task 2: Agent Detail Aggregator Engine

**Files:**
- Create: `src/engine/agentDetail.ts`
- Create: `src/engine/__tests__/agentDetail.test.ts`

**Context:** This aggregator combines data from `retinue.ts`, `strands.ts`, and archetype lookup into one `AgentDetail` object. The component will receive this pre-computed object.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/agentDetail.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentDetail } from '../agentDetail';
import type { AgentDetail } from '../agentDetail';
import type { AxiologicalProfile } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';

const ALL_DOMAINS: ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];

function makeProfile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base: AxiologicalProfile = {
    ambition_contentment: 0,
    courage_prudence: 0,
    cruelty_compassion: 0,
    cunning_honesty: 0,
    devotion_independence: 0,
    loyalty_treachery: 0,
    tradition_innovation: 0,
    dominance_humility: 0,
    wrath_patience: 0,
    greed_generosity: 0,
  };
  return { ...base, ...overrides };
}

function makeDomainCaps(overrides: Partial<Record<ReachDomain, number>> = {}): Record<ReachDomain, number> {
  const base: Record<ReachDomain, number> = {} as any;
  for (const d of ALL_DOMAINS) base[d] = 0;
  return { ...base, ...overrides };
}

describe('getAgentDetail', () => {
  it('returns null for non-existent agent', () => {
    const graph = new WorldGraph();
    expect(getAgentDetail(graph, 'nonexistent', 'asc')).toBeNull();
  });

  it('aggregates basic agent data', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({ ambition_contentment: 0.8, cruelty_compassion: -0.6 }),
        domainCapabilities: makeDomainCaps({ iron: 7, shadow: 5, heart: 3 }),
        locationId: 'loc.1',
        narrativeArchetype: 'tragic_hero',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 2 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc');
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('Kael');
    expect(detail!.tier).toBe(2);
    expect(detail!.locationName).toBe('Ashvale');
    expect(detail!.archetype).toBeDefined();
    expect(detail!.archetype!.name).toBe('Tragic Hero');
  });

  it('returns top 3 axiological values sorted by absolute magnitude', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Test',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile({
          ambition_contentment: 0.9,     // strongest
          cruelty_compassion: -0.7,      // 2nd
          devotion_independence: 0.5,    // 3rd
          wrath_patience: 0.2,           // weak
        }),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.topValues).toHaveLength(3);
    expect(Math.abs(detail.topValues[0].value)).toBeGreaterThanOrEqual(Math.abs(detail.topValues[1].value));
  });

  it('includes top 5 relationships from bonds strand', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });
    // Add some relationship edges
    for (let i = 2; i <= 7; i++) {
      graph.addNode({ id: `agent.${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
      graph.addEdge({
        id: `rel.${i}`,
        source: 'agent.1',
        target: `agent.${i}`,
        type: 'relationship',
        properties: { sentiment: (i % 2 === 0) ? 0.5 : -0.3, strength: 0.4 + i * 0.05, basis: 'friendship' },
      });
    }

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.topBonds.length).toBeLessThanOrEqual(5);
  });

  it('handles missing archetype gracefully', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'NoArch',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 1 } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.archetype).toBeNull();
  });

  it('includes faction name from member_of edge', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Here', properties: {} });
    graph.addNode({ id: 'fac.1', type: 'actor', name: 'Iron Brotherhood', properties: { actorType: 'faction' } });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 3 } });
    graph.addEdge({ id: 'm.1', source: 'agent.1', target: 'fac.1', type: 'member_of', properties: { role: 'member' } });

    const detail = getAgentDetail(graph, 'agent.1', 'asc')!;
    expect(detail.factionName).toBe('Iron Brotherhood');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/agentDetail.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/engine/agentDetail.ts
/**
 * Agent Detail Aggregator — Combines graph data into a single AgentDetail object
 * for the AgentDetailPanel component.
 *
 * Pulls from: graph nodes/edges, archetype-content, strands (bonds).
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier } from '../types/influence';
import { TIER_NAMES } from '../types/influence';
import { getArchetype, type NarrativeArchetype } from '../data/archetype-content';

// ── Value label helpers ──────────────────────────────────────────

/** Human-readable labels for each pole of a value pair */
const VALUE_LABELS: Record<ValuePair, [string, string]> = {
  ambition_contentment: ['Ambitious', 'Content'],
  courage_prudence: ['Courageous', 'Prudent'],
  cruelty_compassion: ['Cruel', 'Compassionate'],
  cunning_honesty: ['Cunning', 'Honest'],
  devotion_independence: ['Devoted', 'Independent'],
  loyalty_treachery: ['Loyal', 'Treacherous'],
  tradition_innovation: ['Traditional', 'Innovative'],
  dominance_humility: ['Dominant', 'Humble'],
  wrath_patience: ['Wrathful', 'Patient'],
  greed_generosity: ['Greedy', 'Generous'],
};

export interface TopValue {
  pair: ValuePair;
  value: number;
  label: string; // e.g., "Deeply Ambitious" or "Compassionate"
}

export interface BondSummary {
  targetId: string;
  targetName: string;
  sentiment: number; // -1 to 1
  strength: number;  // 0 to 1
  basis: string;
}

export interface AgentDetail {
  id: string;
  name: string;
  tier: InfluenceTier;
  tierName: string;
  locationId: string;
  locationName: string;
  factionName: string | null;
  archetype: NarrativeArchetype | null;
  profile: AxiologicalProfile;
  domainCapabilities: Record<ReachDomain, number>;
  topValues: TopValue[];    // top 3 by |value|
  topBonds: BondSummary[];  // top 5 by strength
}

/** Intensity label based on absolute magnitude */
function intensityPrefix(absVal: number): string {
  if (absVal >= 0.8) return 'Deeply ';
  if (absVal >= 0.5) return '';
  return 'Somewhat ';
}

/**
 * Aggregate all display data for a single agent.
 * Returns null if the agent doesn't exist or has no worship edge to the ascendant.
 */
export function getAgentDetail(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string,
): AgentDetail | null {
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return null;

  const props = agentNode.properties as Record<string, unknown>;

  // Find worship edge to this ascendant
  const worshipsEdges = graph.getOutgoingEdges(agentId, 'worships');
  const worshipEdge = worshipsEdges.find(e => e.target === ascendantId);
  if (!worshipEdge) return null;

  const tier = (worshipEdge.properties as Record<string, unknown>).tier as InfluenceTier;
  const profile = (props.axiologicalProfile as AxiologicalProfile) || {} as AxiologicalProfile;
  const domainCapabilities = (props.domainCapabilities as Record<ReachDomain, number>) || {} as Record<ReachDomain, number>;
  const locationId = (props.locationId as string) || '';

  // Location name
  let locationName = '(unknown)';
  if (locationId) {
    const locNode = graph.getNode(locationId);
    if (locNode) locationName = locNode.name;
  }

  // Faction
  let factionName: string | null = null;
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  if (memberEdges.length > 0) {
    const facNode = graph.getNode(memberEdges[0].target);
    if (facNode) factionName = facNode.name;
  }

  // Archetype
  const archetypeId = props.narrativeArchetype as string | undefined;
  const archetype = archetypeId ? getArchetype(archetypeId) ?? null : null;

  // Top 3 values by absolute magnitude
  const valuePairs = Object.keys(profile) as ValuePair[];
  const sortedValues = valuePairs
    .map(pair => ({ pair, value: profile[pair] }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);

  const topValues: TopValue[] = sortedValues.map(({ pair, value }) => {
    const absVal = Math.abs(value);
    const [leftLabel, rightLabel] = VALUE_LABELS[pair] || [pair, pair];
    const label = value >= 0
      ? `${intensityPrefix(absVal)}${leftLabel}`
      : `${intensityPrefix(absVal)}${rightLabel}`;
    return { pair, value, label };
  });

  // Top 5 bonds by strength
  const relEdges = graph.getOutgoingEdges(agentId, 'relationship');
  const bonds: BondSummary[] = relEdges
    .map(edge => {
      const rProps = edge.properties as Record<string, unknown>;
      const targetNode = graph.getNode(edge.target);
      return {
        targetId: edge.target,
        targetName: targetNode?.name ?? '(unknown)',
        sentiment: (rProps.sentiment as number) ?? 0,
        strength: (rProps.strength as number) ?? 0,
        basis: (rProps.basis as string) ?? 'unknown',
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  return {
    id: agentId,
    name: agentNode.name,
    tier,
    tierName: TIER_NAMES[tier] || 'Unknown',
    locationId,
    locationName,
    factionName,
    archetype,
    profile,
    domainCapabilities,
    topValues,
    topBonds: bonds,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/agentDetail.test.ts`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add src/engine/agentDetail.ts src/engine/__tests__/agentDetail.test.ts
git commit -m "feat: add agent detail aggregator engine"
```

---

### Task 3: Agent Detail Panel Component

**Files:**
- Create: `src/components/Game/AgentDetailPanel.tsx`
- Create: `src/components/Game/__tests__/AgentDetailPanel.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/Game/__tests__/AgentDetailPanel.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentDetailPanel } from '../AgentDetailPanel';
import type { AgentDetail } from '../../../engine/agentDetail';

const mockDetail: AgentDetail = {
  id: 'agent.1',
  name: 'Kael the Scorned',
  tier: 3 as any,
  tierName: 'Devoted',
  locationId: 'loc.1',
  locationName: 'Ashvale',
  factionName: 'Iron Brotherhood',
  archetype: {
    id: 'tragic_hero',
    name: 'Tragic Hero',
    storyShape: 'Rise, hubris, fall',
    proseTone: 'Grand, foreboding, inevitable',
    reachAffinities: ['iron', 'veil', 'heart'],
  },
  profile: {
    ambition_contentment: 0.8,
    courage_prudence: 0.3,
    cruelty_compassion: -0.6,
    cunning_honesty: 0.1,
    devotion_independence: 0.5,
    loyalty_treachery: -0.2,
    tradition_innovation: 0.0,
    dominance_humility: 0.4,
    wrath_patience: -0.3,
    greed_generosity: 0.1,
  },
  domainCapabilities: {
    iron: 7, gold: 2, shadow: 5, veil: 3, heart: 4,
    eye: 1, stone: 3, star: 2, flesh: 1,
  },
  topValues: [
    { pair: 'ambition_contentment', value: 0.8, label: 'Deeply Ambitious' },
    { pair: 'cruelty_compassion', value: -0.6, label: 'Compassionate' },
    { pair: 'devotion_independence', value: 0.5, label: 'Devoted' },
  ],
  topBonds: [
    { targetId: 'agent.2', targetName: 'Lyra', sentiment: 0.7, strength: 0.8, basis: 'friendship' },
    { targetId: 'agent.3', targetName: 'Mordach', sentiment: -0.5, strength: 0.6, basis: 'rivalry' },
  ],
};

describe('AgentDetailPanel', () => {
  it('renders agent name and tier', () => {
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    expect(screen.getByText('Kael the Scorned')).toBeTruthy();
    expect(screen.getByText('Devoted')).toBeTruthy();
  });

  it('renders archetype banner', () => {
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    expect(screen.getByText('Tragic Hero')).toBeTruthy();
    expect(screen.getByText('Rise, hubris, fall')).toBeTruthy();
  });

  it('renders faction name', () => {
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    expect(screen.getByText('Iron Brotherhood')).toBeTruthy();
  });

  it('renders domain capabilities grid', () => {
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    // Domain labels should appear
    expect(screen.getByText('Iron')).toBeTruthy();
    expect(screen.getByText('Shadow')).toBeTruthy();
  });

  it('renders top values', () => {
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    expect(screen.getByText('Deeply Ambitious')).toBeTruthy();
    expect(screen.getByText('Compassionate')).toBeTruthy();
  });

  it('renders bonds list', () => {
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    expect(screen.getByText('Lyra')).toBeTruthy();
    expect(screen.getByText('Mordach')).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={onBack}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('back'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('calls onViewPsyche when View Psyche button clicked', () => {
    const onViewPsyche = vi.fn();
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={onViewPsyche}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('View Psyche'));
    expect(onViewPsyche).toHaveBeenCalledOnce();
  });

  it('calls onIntervene when Intervene button clicked', () => {
    const onIntervene = vi.fn();
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={onIntervene}
        onLocationClick={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Intervene'));
    expect(onIntervene).toHaveBeenCalledOnce();
  });

  it('calls onLocationClick when location breadcrumb clicked', () => {
    const onLocationClick = vi.fn();
    render(
      <AgentDetailPanel
        detail={mockDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={onLocationClick}
      />
    );
    fireEvent.click(screen.getByText('Ashvale'));
    expect(onLocationClick).toHaveBeenCalledWith('loc.1');
  });

  it('handles missing archetype gracefully', () => {
    const noArchDetail = { ...mockDetail, archetype: null };
    render(
      <AgentDetailPanel
        detail={noArchDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    // Should still render name without archetype section crashing
    expect(screen.getByText('Kael the Scorned')).toBeTruthy();
  });

  it('handles empty bonds list', () => {
    const noBondsDetail = { ...mockDetail, topBonds: [] };
    render(
      <AgentDetailPanel
        detail={noBondsDetail}
        onBack={vi.fn()}
        onViewPsyche={vi.fn()}
        onIntervene={vi.fn()}
        onLocationClick={vi.fn()}
      />
    );
    expect(screen.getByText(/no known bonds/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/AgentDetailPanel.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/components/Game/AgentDetailPanel.tsx`. The component receives an `AgentDetail` object and renders the full character sheet. Structure:

- **Header bar:** Back ←, name (Cinzel), tier colored dot + label, faction tag
- **Archetype banner:** Name + italic story shape + reach affinity dots (if archetype present)
- **Domain grid:** 3×3 grid of Nine Reaches with horizontal score bars (0-10 scale); archetype affinities get a subtle highlight
- **Values compass:** Top 3 axiological values with labels and small bar
- **Bonds list:** Up to 5 relationships with name, colored sentiment bar (red-to-green), basis tag
- **Location link:** Clickable breadcrumb
- **Action row:** "View Psyche" and "Intervene" buttons

Visual style reference: `STYLE.md` — dark stone backgrounds, amber text, Cinzel headers, sphere colors for accents.

Domain display order (3×3 grid): Iron, Gold, Shadow / Veil, Heart, Eye / Stone, Star, Flesh

Tier colors (from RetinuePanel): 1=#6b7280, 2=#a78bfa, 3=#eab308, 4=#ef4444

Score bar: width% = (score / 10) * 100, capped at 100%. Background bar is stone-700, fill is amber-400.

Archetype affinity highlight: If domain is in archetype.reachAffinities, the domain label gets the tier color instead of default amber-400/50.

The component must be ~250 lines. All sections are inline — no sub-components needed.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/AgentDetailPanel.test.tsx`
Expected: 12 tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/AgentDetailPanel.tsx src/components/Game/__tests__/AgentDetailPanel.test.tsx
git commit -m "feat: add AgentDetailPanel character sheet component"
```

---

### Task 4: Add Archetype Assignment to World Seeding

**Files:**
- Modify: `src/engine/worldSeed.ts:230-240` (inside individual agent creation loop)
- Modify: `src/engine/__tests__/worldSeed.test.ts` (add archetype test)

**Context:** Currently `worldSeed.ts` creates individual agents at line ~230 with `actorType`, `axiologicalProfile`, `domainCapabilities`, and `locationId`. We need to add `narrativeArchetype` using the PRNG to pick from the 19 archetypes.

**Step 1: Write the failing test**

Add to the existing worldSeed test file:

```typescript
it('assigns a narrative archetype to each individual agent', () => {
  // After seeding, every individual actor node should have narrativeArchetype
  const graph = seedWorld(/* use existing test params */);
  const individuals = graph.getAllNodes().filter(
    n => n.properties.actorType === 'individual'
  );
  expect(individuals.length).toBeGreaterThan(0);
  for (const ind of individuals) {
    expect(ind.properties.narrativeArchetype).toBeTruthy();
    expect(typeof ind.properties.narrativeArchetype).toBe('string');
  }
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts`
Expected: FAIL — narrativeArchetype is undefined

**Step 3: Modify worldSeed.ts**

At the top of `worldSeed.ts`, add import:
```typescript
import { NARRATIVE_ARCHETYPES } from '../data/archetype-content';
```

In the individual agent creation loop (around line 230-240), add to the properties object:
```typescript
narrativeArchetype: NARRATIVE_ARCHETYPES[Math.floor(rng() * NARRATIVE_ARCHETYPES.length)].id,
```

This goes right after `locationId` in the properties object at line ~239.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts`
Expected: PASS (existing tests still pass + new test passes)

**Step 5: Commit**

```bash
git add src/engine/worldSeed.ts src/engine/__tests__/worldSeed.test.ts
git commit -m "feat: assign narrative archetype to agents during world seeding"
```

---

### Task 5: Wire AgentDetailPanel into GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx`

**Context:** The right sidebar (lines 600-607) currently always shows `RetinuePanel`. When `selectedAgentId` is set, it should show `AgentDetailPanel` instead. Need to:

1. Import `AgentDetailPanel` and `getAgentDetail`
2. Compute `agentDetail` via useMemo when `selectedAgentId` changes
3. Conditionally render: if `agentDetail` exists → AgentDetailPanel; else → RetinuePanel
4. Wire callbacks: onBack (clear selection), onViewPsyche (open strand overlay), onIntervene (open wheel), onLocationClick (navigate to hex zoom)

**Step 1: Add imports at top of GameView.tsx**

```typescript
import { AgentDetailPanel } from './AgentDetailPanel';
import { getAgentDetail } from '../../engine/agentDetail';
```

**Step 2: Add agentDetail memo** (after the existing retinueAgents memo, around line 250)

```typescript
const agentDetail = useMemo(() => {
  if (!selectedAgentId) return null;
  return getAgentDetail(gameState.graph, selectedAgentId, ascendantId);
}, [selectedAgentId, gameState.graph, ascendantId]);
```

Where `ascendantId` is derived from `gameState` — check how the existing code references the ascendant ID (likely `gameState.ascendantId` or similar).

**Step 3: Replace right sidebar render** (lines 600-607)

Replace:
```tsx
{/* Right sidebar - Retinue Panel */}
<div className="w-72 flex-shrink-0 border-l border-amber-900/30 bg-stone-800/90 overflow-y-auto p-4">
  <RetinuePanel
    agents={retinueAgents}
    selectedAgentId={selectedAgentId}
    onAgentSelect={handleAgentSelect}
  />
</div>
```

With:
```tsx
{/* Right sidebar - Agent Detail or Retinue */}
<div className="w-72 flex-shrink-0 border-l border-amber-900/30 bg-stone-800/90 overflow-y-auto">
  {agentDetail ? (
    <AgentDetailPanel
      detail={agentDetail}
      onBack={() => setSelectedAgentId(null)}
      onViewPsyche={() => setStrandViewAgent(selectedAgentId)}
      onIntervene={() => {
        // Open the wheel for this agent (existing flow)
        setWheelVisible(true);
      }}
      onLocationClick={(locId) => {
        // Navigate to hex zoom for this location's hex
        // Use existing hex navigation if available, or just set selectedAgentId to null
        setSelectedAgentId(null);
      }}
    />
  ) : (
    <div className="p-4">
      <RetinuePanel
        agents={retinueAgents}
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
      />
    </div>
  )}
</div>
```

Note: The `p-4` padding moves to the inner RetinuePanel wrapper since AgentDetailPanel manages its own padding.

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat: wire AgentDetailPanel into GameView right sidebar"
```

---

### Task 6: Integration Test

**Files:**
- Create: `src/engine/__tests__/agentDetail-integration.test.ts`

**Step 1: Write integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentDetail } from '../agentDetail';
import { getRetinueAgents } from '../retinue';
import { NARRATIVE_ARCHETYPES } from '../../data/archetype-content';
import type { AxiologicalProfile } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';

describe('agent detail integration', () => {
  it('full flow: retinue agent → detail with archetype, values, bonds', () => {
    const graph = new WorldGraph();

    // Set up ascendant
    graph.addNode({ id: 'asc', type: 'actor', name: 'The Weaver', properties: { actorType: 'ascendant' } });

    // Set up a location
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Thornhaven', properties: { locationType: 'settlement' } });

    // Set up a faction
    graph.addNode({ id: 'fac.1', type: 'actor', name: 'Seekers of the Veil', properties: { actorType: 'faction' } });

    // Create an agent with full data
    const profile: AxiologicalProfile = {
      ambition_contentment: 0.9,
      courage_prudence: -0.4,
      cruelty_compassion: -0.7,
      cunning_honesty: 0.3,
      devotion_independence: 0.6,
      loyalty_treachery: 0.1,
      tradition_innovation: -0.2,
      dominance_humility: 0.4,
      wrath_patience: -0.1,
      greed_generosity: 0.2,
    };
    const domainCaps: Record<ReachDomain, number> = {
      iron: 3, gold: 1, shadow: 6, veil: 8, heart: 4,
      eye: 7, stone: 2, star: 5, flesh: 1,
    };

    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Selene Ashwhisper',
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
        domainCapabilities: domainCaps,
        locationId: 'loc.1',
        narrativeArchetype: 'seeker',
      },
    });
    graph.addEdge({ id: 'w.1', source: 'agent.1', target: 'asc', type: 'worships', properties: { tier: 3 } });
    graph.addEdge({ id: 'm.1', source: 'agent.1', target: 'fac.1', type: 'member_of', properties: { role: 'adept' } });

    // Add some relationship targets
    graph.addNode({ id: 'agent.2', type: 'actor', name: 'Bram Ironhand', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'rel.1', source: 'agent.1', target: 'agent.2',
      type: 'relationship', properties: { sentiment: -0.4, strength: 0.7, basis: 'rivalry' },
    });

    // 1. Agent appears in retinue
    const retinue = getRetinueAgents(graph, 'asc');
    expect(retinue).toHaveLength(1);
    expect(retinue[0].name).toBe('Selene Ashwhisper');

    // 2. Detail aggregation works
    const detail = getAgentDetail(graph, 'agent.1', 'asc');
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('Selene Ashwhisper');
    expect(detail!.tier).toBe(3);
    expect(detail!.tierName).toBe('Devoted');
    expect(detail!.locationName).toBe('Thornhaven');
    expect(detail!.factionName).toBe('Seekers of the Veil');

    // 3. Archetype resolved
    expect(detail!.archetype).not.toBeNull();
    expect(detail!.archetype!.id).toBe('seeker');
    expect(detail!.archetype!.reachAffinities).toContain('eye');

    // 4. Top values sorted by |value|
    expect(detail!.topValues[0].pair).toBe('ambition_contentment'); // |0.9|
    expect(detail!.topValues[1].pair).toBe('cruelty_compassion');   // |0.7|
    expect(detail!.topValues[2].pair).toBe('devotion_independence'); // |0.6|

    // 5. Bond included
    expect(detail!.topBonds).toHaveLength(1);
    expect(detail!.topBonds[0].targetName).toBe('Bram Ironhand');
    expect(detail!.topBonds[0].basis).toBe('rivalry');
  });

  it('all 19 archetypes are resolvable from getAgentDetail', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Place', properties: {} });

    for (const arch of NARRATIVE_ARCHETYPES) {
      const agentId = `agent.${arch.id}`;
      graph.addNode({
        id: agentId,
        type: 'actor',
        name: `Agent ${arch.name}`,
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            ambition_contentment: 0, courage_prudence: 0, cruelty_compassion: 0,
            cunning_honesty: 0, devotion_independence: 0, loyalty_treachery: 0,
            tradition_innovation: 0, dominance_humility: 0, wrath_patience: 0,
            greed_generosity: 0,
          },
          domainCapabilities: {
            iron: 0, gold: 0, shadow: 0, veil: 0, heart: 0,
            eye: 0, stone: 0, star: 0, flesh: 0,
          },
          locationId: 'loc.1',
          narrativeArchetype: arch.id,
        },
      });
      graph.addEdge({ id: `w.${arch.id}`, source: agentId, target: 'asc', type: 'worships', properties: { tier: 1 } });

      const detail = getAgentDetail(graph, agentId, 'asc');
      expect(detail).not.toBeNull();
      expect(detail!.archetype).not.toBeNull();
      expect(detail!.archetype!.id).toBe(arch.id);
    }
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/agentDetail-integration.test.ts`
Expected: 2 tests PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/agentDetail-integration.test.ts
git commit -m "test: add agent detail integration tests"
```

---

### Task 7: Final Verification

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 2: Full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing ~869 + new ~32 = ~901)

**Step 3: Build check**

Run: `npx vite build`
Expected: Clean build, bundle < 350 kB

---

### Task 8: Documentation Updates

**Files:**
- Modify: `CLAUDE.md` — update project status, engine stats, changelog
- Create: Obsidian `Systems/Agent Detail Panel.md` via MCP
- Update: Obsidian `Index.md` — add Agent Detail Panel link
- Update: Notion backlog — mark Phase 6E task complete

**CLAUDE.md updates:**
- Add "Phase 6E (Agent Detail Panel): ✅ Complete" to project status
- Update engine stats: ~56 modules, ~8,500 lines, ~901 tests
- Add changelog entries for all new files

**Obsidian vault note** (`Systems/Agent Detail Panel.md`):
- Overview: Full character sheet replacing right sidebar on agent selection
- Sections: Header, Archetype Banner, Domain Grid, Values Compass, Bonds List, Location Link, Action Row
- Connected systems: Retinue Panel, Agent Wheel, Psyche Strands, Intervention Delivery
- Data source: `getAgentDetail()` aggregator in `agentDetail.ts`

**Notion backlog:** Mark agent detail panel task complete, add reference docs.

**Commit:**
```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Phase 6E Agent Detail Panel"
```
