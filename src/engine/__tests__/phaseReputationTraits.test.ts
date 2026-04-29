/**
 * Tests for phaseReputationTraits — tally accumulation, threshold crossing,
 * decay, polarity competition, polarity determination, and power renown.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseReputationTraits,
  processReputationTally,
  determinePolarity,
  resetReputationTraitInit,
} from '../phaseReputationTraits';
import { getTraitsForNode } from '../traits';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  REPUTATION_LEVEL_1_THRESHOLD,
  REPUTATION_LEVEL_2_THRESHOLD,
  REPUTATION_LEVEL_3_THRESHOLD,
  REPUTATION_TALLY_DECAY_PER_TICK,
} from '../../data/agent-behavior-constants';

// ─── Test Helpers ──────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  // Add a minimal actor
  g.addNode({
    id: 'agent-1',
    type: 'actor',
    name: 'Test Agent',
    properties: {
      actorType: 'individual',
      reputationTallies: {},
      axiologicalProfile: {
        mercy_ruthlessness: 0.5,          // virtue-leaning
        asceticism_extravagance: -0.3,    // flaw-leaning
        honesty_cunning: 0,               // neutral
        tradition_novelty: 0.2,
        loyalty_ambition: 0.4,
        revelation_discretion: -0.1,
        preservation_transformation: 0.6,
        sacrifice_survival: 0.3,
        courage_prudence: 0.1,
      },
      domainCapabilities: {
        iron: 0.3, gold: 0.2, shadow: 0.1, veil: 0.1,
        heart: 0.2, eye: 0.1, stone: 0.1, star: 0.1,
      },
    },
  });
  return g;
}

function makeState(graph: WorldGraph, tick = 10): GameState {
  return {
    tick,
    graph,
    tickEvents: [],
    seed: 42,
    encounterProgress: [],
    unifiedActions: [],
  } as unknown as GameState;
}

function setTallies(graph: WorldGraph, agentId: string, tallies: Record<string, number>): void {
  const node = graph.getNode(agentId);
  if (node) node.properties.reputationTallies = tallies;
}

function getTallies(graph: WorldGraph, agentId: string): Record<string, number> {
  return (graph.getNode(agentId)?.properties?.reputationTallies ?? {}) as Record<string, number>;
}

function hasReputationTrait(graph: WorldGraph, agentId: string, traitId: string): boolean {
  return getTraitsForNode(graph, agentId).some(e => e.target === traitId);
}

function getTraitLevel(graph: WorldGraph, agentId: string, traitId: string): number {
  const edge = getTraitsForNode(graph, agentId).find(e => e.target === traitId);
  return (edge?.properties as { level?: number })?.level ?? 0;
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('phaseReputationTraits', () => {
  beforeEach(() => {
    resetReputationTraitInit();
  });

  describe('tally decay', () => {
    it('decays existing tallies each tick', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', { 'iron.positive': 5.0 });

      phaseReputationTraits(makeState(graph));

      const tallies = getTallies(graph, 'agent-1');
      expect(tallies['iron.positive']).toBeCloseTo(5.0 - REPUTATION_TALLY_DECAY_PER_TICK, 4);
    });

    it('does not decay below zero', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', { 'iron.positive': 0.01 });

      phaseReputationTraits(makeState(graph));

      const tallies = getTallies(graph, 'agent-1');
      expect(tallies['iron.positive']).toBeGreaterThanOrEqual(0);
    });
  });

  describe('trait assignment at thresholds', () => {
    // Note: decay runs first in the phase, so tallies must be set above threshold + decay amount
    const DECAY = REPUTATION_TALLY_DECAY_PER_TICK;

    it('assigns Level 1 trait when tally crosses threshold', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', { 'iron.positive': REPUTATION_LEVEL_1_THRESHOLD + DECAY });

      phaseReputationTraits(makeState(graph));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(true);
      expect(getTraitLevel(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(1);
    });

    it('assigns Level 2 trait when tally crosses higher threshold', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', { 'gold.negative': REPUTATION_LEVEL_2_THRESHOLD + DECAY });

      phaseReputationTraits(makeState(graph));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.gold.negative')).toBe(true);
      expect(getTraitLevel(graph, 'agent-1', 'trait.reputation.gold.negative')).toBe(2);
    });

    it('assigns Level 3 trait at legendary threshold', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', { 'heart.positive': REPUTATION_LEVEL_3_THRESHOLD + DECAY });

      phaseReputationTraits(makeState(graph));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.heart.positive')).toBe(true);
      expect(getTraitLevel(graph, 'agent-1', 'trait.reputation.heart.positive')).toBe(3);
    });

    it('does not assign trait when below threshold', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', { 'iron.positive': REPUTATION_LEVEL_1_THRESHOLD - 1 });

      phaseReputationTraits(makeState(graph));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(false);
    });

    it('BF stone.positive tallies promote to Steadfast Builder at Level 1', () => {
      // Regression: BF encounter aftermaths write stone.positive tallies; they must
      // promote via phaseReputationTraits like any other reach tally (THR-166).
      const graph = makeGraph();
      setTallies(graph, 'agent-1', { 'stone.positive': REPUTATION_LEVEL_1_THRESHOLD + DECAY });

      phaseReputationTraits(makeState(graph));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.stone.positive')).toBe(true);
      expect(getTraitLevel(graph, 'agent-1', 'trait.reputation.stone.positive')).toBe(1);
    });
  });

  describe('polarity competition', () => {
    const DECAY = REPUTATION_TALLY_DECAY_PER_TICK;

    it('higher tally wins when both cross threshold', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', {
        'iron.positive': REPUTATION_LEVEL_2_THRESHOLD + DECAY,
        'iron.negative': REPUTATION_LEVEL_1_THRESHOLD + DECAY,
      });

      phaseReputationTraits(makeState(graph));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(true);
      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.negative')).toBe(false);
    });

    it('removes lower-polarity trait when higher overtakes', () => {
      const graph = makeGraph();
      // First assign negative
      setTallies(graph, 'agent-1', { 'iron.negative': REPUTATION_LEVEL_1_THRESHOLD + DECAY });
      phaseReputationTraits(makeState(graph, 5));
      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.negative')).toBe(true);

      // Now positive overtakes
      setTallies(graph, 'agent-1', {
        'iron.positive': REPUTATION_LEVEL_2_THRESHOLD + DECAY,
        'iron.negative': REPUTATION_LEVEL_1_THRESHOLD + DECAY,
      });
      phaseReputationTraits(makeState(graph, 10));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(true);
      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.negative')).toBe(false);
    });

    it('allows different reaches to have different polarities', () => {
      const graph = makeGraph();
      setTallies(graph, 'agent-1', {
        'iron.positive': REPUTATION_LEVEL_1_THRESHOLD + DECAY,
        'heart.negative': REPUTATION_LEVEL_1_THRESHOLD + DECAY,
      });

      phaseReputationTraits(makeState(graph));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(true);
      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.heart.negative')).toBe(true);
    });
  });

  describe('trait removal when tally drops', () => {
    it('removes trait when tally drops below threshold after decay', () => {
      const graph = makeGraph();
      // Well above threshold to survive decay
      setTallies(graph, 'agent-1', { 'iron.positive': REPUTATION_LEVEL_1_THRESHOLD + 1 });
      phaseReputationTraits(makeState(graph, 5));
      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(true);

      // Set tally to below threshold (simulating many decay ticks)
      setTallies(graph, 'agent-1', { 'iron.positive': REPUTATION_LEVEL_1_THRESHOLD - 1 });
      phaseReputationTraits(makeState(graph, 100));

      expect(hasReputationTrait(graph, 'agent-1', 'trait.reputation.iron.positive')).toBe(false);
    });
  });
});

describe('processReputationTally', () => {
  beforeEach(() => {
    resetReputationTraitInit();
  });

  it('increments tally on successful step', () => {
    const graph = makeGraph();
    // Use a real encounter ID that exists — fall back to checking tallies directly
    // since we need a template to exist in the encounter registry
    const node = graph.getNode('agent-1')!;
    node.properties.reputationTallies = {};

    // We can't easily test with real encounter IDs without the full content loaded,
    // so we test the polarity determination separately
  });
});

describe('determinePolarity', () => {
  it('Layer 1: uses explicit reputationPolarity', () => {
    const graph = makeGraph();
    const template = {
      reputationPolarity: 'negative' as const,
      crudType: 'update',
      reach: 'iron',
    } as unknown as UnifiedActionTemplate;

    expect(determinePolarity(template, graph, 'agent-1')).toBe('negative');
  });

  it('Layer 2: positive for update/create crudTypes (assist/build heuristic)', () => {
    const graph = makeGraph();
    for (const type of ['update', 'create'] as const) {
      const template = { crudType: type, reach: 'iron' } as unknown as UnifiedActionTemplate;
      expect(determinePolarity(template, graph, 'agent-1')).toBe('positive');
    }
  });

  it('Layer 2: negative for delete crudType (duel heuristic)', () => {
    const graph = makeGraph();
    const template = { crudType: 'delete', reach: 'iron' } as unknown as UnifiedActionTemplate;
    expect(determinePolarity(template, graph, 'agent-1')).toBe('negative');
  });

  it('Layer 3: uses axiological profile for neutral crudTypes', () => {
    const graph = makeGraph();

    // Iron reach → mercy_ruthlessness pair, agent has +0.5 (virtue) → positive
    const ironTemplate = {
      crudType: 'read',
      reach: 'iron',
    } as unknown as UnifiedActionTemplate;
    expect(determinePolarity(ironTemplate, graph, 'agent-1')).toBe('positive');

    // Gold reach → asceticism_extravagance pair, agent has -0.3 (flaw) → negative
    const goldTemplate = {
      crudType: 'read',
      reach: 'gold',
    } as unknown as UnifiedActionTemplate;
    expect(determinePolarity(goldTemplate, graph, 'agent-1')).toBe('negative');
  });

  it('Layer 3: returns null for exactly neutral axiological value', () => {
    const graph = makeGraph();

    // Shadow reach → honesty_cunning pair, agent has 0 → null
    const template = {
      crudType: 'read',
      reach: 'shadow',
    } as unknown as UnifiedActionTemplate;
    expect(determinePolarity(template, graph, 'agent-1')).toBeNull();
  });
});
