/**
 * Tests for deriveLocationActivities (THR-22).
 *
 * Tests cover:
 *   - Pulse computation from agent threads
 *   - Familiarity-gated activity prose
 *   - One-pass located_at index
 *   - Murmur template selection (deterministic)
 *   - Fog-hidden hex exclusion
 *   - Fail-soft: empty locations, missing agents
 */

import { describe, it, expect } from 'vitest';
import {
  deriveLocationActivities,
  computeLocationPulse,
  LOCATION_ACTIVITY_CONSTANTS,
} from '../deriveLocationActivities';
import type { AgentActivityThread } from '../../types/locationActivity';
import { WorldGraph } from '../graph';
import type { UnifiedAction } from '../../types/unifiedAction';

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeGraph() {
  return new WorldGraph();
}

function addLocation(graph: WorldGraph, id: string, col: number, row: number, name = 'Test Location') {
  graph.addNode({
    id,
    type: 'location',
    name,
    properties: { hexCol: col, hexRow: row, locationSubtype: 'hamlet' },
  });
  return id;
}

function addAgent(graph: WorldGraph, agentId: string, locationId: string, name = 'TestAgent') {
  graph.addNode({
    id: agentId,
    type: 'actor',
    name,
    properties: { actorType: 'individual' },
  });
  graph.addEdge({
    id: `${agentId}-located`,
    source: agentId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function makeAction(actorId: string, templateId: string, overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: `action-${actorId}`,
    actorId,
    templateId,
    targetId: 'loc-1',
    scale: 'personal',
    source: 'agent',
    startTick: 0,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 3,
    resolved: false,
    stepOutcomes: [],
    ...overrides,
  };
}

const ALL_VISIBLE: ReadonlySet<string> = new Proxy(new Set<string>(), {
  get(target, prop) {
    if (prop === 'has') return () => true;
    return Reflect.get(target, prop);
  },
}) as ReadonlySet<string>;

// ── computeLocationPulse ──────────────────────────────────────────────────────

describe('computeLocationPulse', () => {
  it('returns quiet for empty threads', () => {
    expect(computeLocationPulse([])).toBe('quiet');
  });

  it('returns stirring for one idle agent', () => {
    const threads: AgentActivityThread[] = [{
      agentId: 'a1', agentName: 'Alice', visibleActivity: 'resting', category: 'idle',
      movementPhase: 'present', temperature: 'cool', familiarityScore: 0.5,
    }];
    expect(computeLocationPulse(threads)).toBe('stirring');
  });

  it('returns busy when agent count >= threshold', () => {
    const threads: AgentActivityThread[] = Array.from({ length: LOCATION_ACTIVITY_CONSTANTS.PULSE_BUSY_THRESHOLD }, (_, i) => ({
      agentId: `a${i}`, agentName: `Agent${i}`, visibleActivity: 'idle', category: 'idle' as const,
      movementPhase: 'present' as const, temperature: 'cool' as const, familiarityScore: 0.5,
    }));
    expect(computeLocationPulse(threads)).toBe('busy');
  });

  it('returns tense for one conflict activity', () => {
    const threads: AgentActivityThread[] = [{
      agentId: 'a1', agentName: 'Bob', visibleActivity: 'fighting', category: 'conflict',
      movementPhase: 'present', temperature: 'heated', familiarityScore: 0.8,
    }];
    expect(computeLocationPulse(threads)).toBe('tense');
  });

  it('returns volatile for multiple conflict activities', () => {
    const threads: AgentActivityThread[] = [
      { agentId: 'a1', agentName: 'Bob', visibleActivity: 'fighting', category: 'conflict', movementPhase: 'present', temperature: 'heated', familiarityScore: 0.8 },
      { agentId: 'a2', agentName: 'Eve', visibleActivity: 'attacking', category: 'conflict', movementPhase: 'present', temperature: 'heated', familiarityScore: 0.6 },
    ];
    expect(computeLocationPulse(threads)).toBe('volatile');
  });
});

// ── deriveLocationActivities ──────────────────────────────────────────────────

describe('deriveLocationActivities', () => {
  it('returns empty summaries when no visible locations exist', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);
    const result = deriveLocationActivities({
      graph,
      unifiedActions: [],
      familiarityMap: new Map(),
      visibleHexKeys: new Set(), // no visible hexes
      tick: 1,
    });
    expect(result.summaries.size).toBe(0);
    expect(result.hexPulses.size).toBe(0);
  });

  it('creates a quiet summary for a visible empty location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3, 'Millhaven');

    const result = deriveLocationActivities({
      graph,
      unifiedActions: [],
      familiarityMap: new Map(),
      visibleHexKeys: new Set(['5,3']),
      tick: 1,
    });

    expect(result.summaries.size).toBe(1);
    const summary = result.summaries.get('loc-1')!;
    expect(summary).toBeDefined();
    expect(summary.pulse).toBe('quiet');
    expect(summary.agentThreads).toHaveLength(0);
    expect(summary.locationName).toBe('Millhaven');
    expect(summary.murmurs.length).toBeGreaterThan(0);
  });

  it('creates stirring summary when one agent is present', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);
    addAgent(graph, 'agent-1', 'loc-1', 'Kael');

    const result = deriveLocationActivities({
      graph,
      unifiedActions: [],
      familiarityMap: new Map([['agent-1', 0.9]]), // high familiarity
      visibleHexKeys: new Set(['5,3']),
      tick: 1,
    });

    expect(result.summaries.get('loc-1')?.pulse).toBe('stirring');
    expect(result.summaries.get('loc-1')?.agentThreads).toHaveLength(1);
    const thread = result.summaries.get('loc-1')!.agentThreads[0]!;
    expect(thread.agentName).toBe('Kael');
  });

  it('applies vague description for low-familiarity agents', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);
    addAgent(graph, 'agent-1', 'loc-1', 'Mystery');

    const result = deriveLocationActivities({
      graph,
      unifiedActions: [],
      familiarityMap: new Map([['agent-1', 0.1]]), // below vague threshold
      visibleHexKeys: new Set(['5,3']),
      tick: 1,
    });

    const thread = result.summaries.get('loc-1')!.agentThreads[0]!;
    expect(thread.visibleActivity).not.toContain('Mystery'); // name hidden
    expect(thread.visibleActivity).toContain('business'); // vague prose
  });

  it('shows agent name at medium familiarity', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);
    addAgent(graph, 'agent-1', 'loc-1', 'Serafina');

    const result = deriveLocationActivities({
      graph,
      unifiedActions: [makeAction('agent-1', 'action.gold.trade')],
      familiarityMap: new Map([['agent-1', 0.5]]), // medium familiarity
      visibleHexKeys: new Set(['5,3']),
      tick: 1,
    });

    const thread = result.summaries.get('loc-1')!.agentThreads[0]!;
    expect(thread.visibleActivity).toContain('Serafina');
    expect(thread.category).toBe('commerce');
  });

  it('infers conflict category from iron action template', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);
    addAgent(graph, 'agent-1', 'loc-1', 'Fighter');

    const result = deriveLocationActivities({
      graph,
      unifiedActions: [makeAction('agent-1', 'action.iron.attack')],
      familiarityMap: new Map([['agent-1', 0.9]]),
      visibleHexKeys: new Set(['5,3']),
      tick: 1,
    });

    const thread = result.summaries.get('loc-1')!.agentThreads[0]!;
    expect(thread.category).toBe('conflict');
    expect(result.summaries.get('loc-1')!.pulse).toBe('tense');
  });

  it('derives heated temperature from failed step outcome', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);
    addAgent(graph, 'agent-1', 'loc-1', 'Failed');

    const action = makeAction('agent-1', 'action.heart.negotiate', {
      stepOutcomes: [{ stepIndex: 0, outcome: 'failure', tick: 0, narrative: '' }],
    });

    const result = deriveLocationActivities({
      graph,
      unifiedActions: [action],
      familiarityMap: new Map([['agent-1', 0.9]]),
      visibleHexKeys: new Set(['5,3']),
      tick: 1,
    });

    const thread = result.summaries.get('loc-1')!.agentThreads[0]!;
    expect(thread.temperature).toBe('heated');
  });

  it('builds hex pulse map with max pulse across multiple locations on same hex', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-quiet', 5, 3, 'Quiet');
    addLocation(graph, 'loc-tense', 5, 3, 'Tense'); // same hex
    addAgent(graph, 'fighter-1', 'loc-tense', 'Fighter');

    const result = deriveLocationActivities({
      graph,
      unifiedActions: [makeAction('fighter-1', 'action.iron.duel')],
      familiarityMap: new Map([['fighter-1', 0.9]]),
      visibleHexKeys: new Set(['5,3']),
      tick: 1,
    });

    const hexPulse = result.hexPulses.get('5,3');
    expect(hexPulse).toBeDefined();
    expect(hexPulse!.pulse).toBe('tense'); // max of quiet + tense = tense
  });

  it('produces deterministic murmurs for same tick and location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);

    const result1 = deriveLocationActivities({
      graph, unifiedActions: [], familiarityMap: new Map(),
      visibleHexKeys: new Set(['5,3']), tick: 42,
    });
    const result2 = deriveLocationActivities({
      graph, unifiedActions: [], familiarityMap: new Map(),
      visibleHexKeys: new Set(['5,3']), tick: 42,
    });

    expect(result1.summaries.get('loc-1')!.murmurs).toEqual(
      result2.summaries.get('loc-1')!.murmurs,
    );
  });

  it('produces different murmurs for different ticks (varied output)', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);

    const murmurSets = new Set<string>();
    for (let tick = 0; tick < 20; tick++) {
      const result = deriveLocationActivities({
        graph, unifiedActions: [], familiarityMap: new Map(),
        visibleHexKeys: new Set(['5,3']), tick,
      });
      murmurSets.add(result.summaries.get('loc-1')!.murmurs.join(''));
    }
    // Should see more than 1 unique murmur across 20 ticks (pool has 4 quiet/idle options)
    expect(murmurSets.size).toBeGreaterThan(1);
  });

  it('skips non-individual actors (factions) in agent threads', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);

    // Add a faction node (not individual)
    graph.addNode({
      id: 'faction-1', type: 'actor', name: 'The Guild',
      properties: { actorType: 'faction' },
    });
    graph.addEdge({
      id: 'faction-located', source: 'faction-1', target: 'loc-1',
      type: 'located_at', properties: {},
    });

    const result = deriveLocationActivities({
      graph, unifiedActions: [], familiarityMap: new Map(),
      visibleHexKeys: new Set(['5,3']), tick: 1,
    });

    // Faction should not appear in agent threads
    expect(result.summaries.get('loc-1')!.agentThreads).toHaveLength(0);
  });

  it('falls back to generic murmur when no template matches pulse/category', () => {
    // This test verifies fail-soft: even with unusual combinations, no crash
    const graph = makeGraph();
    addLocation(graph, 'loc-1', 5, 3);
    addAgent(graph, 'agent-1', 'loc-1');
    addAgent(graph, 'agent-2', 'loc-1');

    const result = deriveLocationActivities({
      graph, unifiedActions: [], familiarityMap: new Map(),
      visibleHexKeys: new Set(['5,3']), tick: 1,
    });

    const summary = result.summaries.get('loc-1')!;
    expect(summary.murmurs.length).toBeGreaterThan(0);
    expect(summary.murmurs[0]).toBeTruthy();
  });
});
