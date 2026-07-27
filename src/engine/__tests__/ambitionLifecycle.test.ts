import { describe, it, expect } from 'vitest';
import {
  checkMilestones,
  checkAbandonment,
  evaluateAmbitionProgress,
} from '../ambitionLifecycle';
import type { AmbitionTemplate, ActiveAmbition } from '../../types/ambition';

// ─── Minimal mock graph ──────────────────────────────────────────

interface MockNode {
  id: string;
  properties: Record<string, unknown>;
}
interface MockEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

function createMockGraph(nodes: MockNode[], edges: MockEdge[]) {
  return {
    getNode: (id: string) => nodes.find((n) => n.id === id) ?? undefined,
    getOutgoingEdges: (id: string, type?: string) =>
      edges.filter((e) => e.source === id && (!type || e.type === type)),
    getIncomingEdges: (id: string, type?: string) =>
      edges.filter((e) => e.target === id && (!type || e.type === type)),
  };
}

// ─── Test template ───────────────────────────────────────────────
// 3 milestones: wealth (gold > 0.7), network (3+ trade_alliance bonds), dominance (controls market)
// Completion: 2 of 3
// Abandonment: gold drops below 0.2

const testTemplate: AmbitionTemplate = {
  id: 'ambition.trade_empire',
  displayName: 'Trade Empire',
  category: 'dominion',
  reachFloors: {},
  requiredTraits: [],
  blockingTraits: [],
  sphereAffinities: [],
  bondModifiers: [],
  boostingTraits: [],
  reachAffinity: {},
  milestones: [
    {
      id: 'wealth',
      condition: { type: 'agent_reach_above', reach: 'gold', threshold: 0.7 },
      prose: ['Wealth accumulated.'],
    },
    {
      id: 'network',
      condition: { type: 'agent_has_bonds', minCount: 3, basis: 'trade_alliance' },
      prose: ['Trade network established.'],
    },
    {
      id: 'dominance',
      condition: { type: 'agent_controls_location', locationType: 'market' },
      prose: ['Market dominance achieved.'],
    },
  ],
  completion: { requires: 2, of: 3 },
  abandonmentTriggers: [
    {
      condition: { type: 'agent_reach_below', reach: 'gold', threshold: 0.2 },
      prose: ['Fortunes have collapsed.'],
    },
  ],
  abandonmentCooldown: 5,
  selectionProse: ['A vision of empire.'],
  milestoneProse: {
    wealth: ['Gold flows freely.'],
    network: ['Allies rally.'],
    dominance: ['Markets bend to your will.'],
  },
  completionProse: ['The trade empire stands.'],
  abandonmentProse: ['Dreams of empire crumble.'],
};

function makeActiveAmbition(overrides: Partial<ActiveAmbition> = {}): ActiveAmbition {
  return {
    templateId: 'ambition.trade_empire',
    priority: 'primary',
    status: 'active',
    assignedTick: 1,
    completedMilestones: [],
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('checkMilestones', () => {
  it('returns newly completed milestones, skips already completed', () => {
    // Agent has gold 0.8 (wealth met) and controls a market (dominance met)
    // but network not met (only 1 trade_alliance bond)
    const graph = createMockGraph(
      [
        { id: 'agent1', properties: { domainCapabilities: { gold: 0.8 } } },
        { id: 'loc1', properties: { locationType: 'market' } },
        { id: 'agent2', properties: {} },
      ],
      [
        { source: 'agent1', target: 'loc1', type: 'controls', properties: {} },
        {
          source: 'agent1',
          target: 'agent2',
          type: 'relates_to',
          properties: { basis: 'trade_alliance' },
        },
      ],
    );

    // wealth is already completed — should be skipped
    const result = checkMilestones(testTemplate, graph, 'agent1', ['wealth']);

    expect(result).toEqual(['dominance']);
    expect(result).not.toContain('wealth');
    expect(result).not.toContain('network');
  });

  it('returns empty array when no new milestones are completed', () => {
    const graph = createMockGraph(
      [{ id: 'agent1', properties: { domainCapabilities: { gold: 0.3 } } }],
      [],
    );

    const result = checkMilestones(testTemplate, graph, 'agent1', []);
    expect(result).toEqual([]);
  });
});

describe('checkAbandonment', () => {
  it('returns true when abandonment trigger fires', () => {
    const graph = createMockGraph(
      [{ id: 'agent1', properties: { domainCapabilities: { gold: 0.1 } } }],
      [],
    );

    expect(checkAbandonment(testTemplate, graph, 'agent1')).toBe(true);
  });

  it('returns false when no triggers fire', () => {
    const graph = createMockGraph(
      [{ id: 'agent1', properties: { domainCapabilities: { gold: 0.5 } } }],
      [],
    );

    expect(checkAbandonment(testTemplate, graph, 'agent1')).toBe(false);
  });
});

describe('evaluateAmbitionProgress', () => {
  it('returns completed when enough milestones met (2 of 3)', () => {
    // Agent has gold 0.8 (wealth) and controls a market (dominance) — 2 of 3
    const graph = createMockGraph(
      [
        { id: 'agent1', properties: { domainCapabilities: { gold: 0.8 } } },
        { id: 'loc1', properties: { locationType: 'market' } },
      ],
      [{ source: 'agent1', target: 'loc1', type: 'controls', properties: {} }],
    );

    const active = makeActiveAmbition();
    const result = evaluateAmbitionProgress(testTemplate, active, graph, 'agent1');

    expect(result.status).toBe('completed');
    expect(result.newMilestones).toContain('wealth');
    expect(result.newMilestones).toContain('dominance');
    expect(result.allCompletedMilestones).toEqual(['wealth', 'dominance']);
  });

  it('returns abandoned when abandonment trigger fires, even with milestones met', () => {
    // Agent has gold 0.1 (below 0.2 trigger) — abandoned takes priority
    // Also controls a market, but doesn't matter
    const graph = createMockGraph(
      [
        { id: 'agent1', properties: { domainCapabilities: { gold: 0.1 } } },
        { id: 'loc1', properties: { locationType: 'market' } },
      ],
      [{ source: 'agent1', target: 'loc1', type: 'controls', properties: {} }],
    );

    const active = makeActiveAmbition({ completedMilestones: ['dominance'] });
    const result = evaluateAmbitionProgress(testTemplate, active, graph, 'agent1');

    expect(result.status).toBe('abandoned');
    expect(result.newMilestones).toEqual([]);
    expect(result.allCompletedMilestones).toEqual(['dominance']);
  });

  it('returns active with updated milestones when in progress (1 milestone, not enough for completion)', () => {
    // Agent has gold 0.8 (wealth met) but no bonds and no market control
    // Only 1 of 3 milestones met — not enough for completion (needs 2)
    const graph = createMockGraph(
      [{ id: 'agent1', properties: { domainCapabilities: { gold: 0.8 } } }],
      [],
    );

    const active = makeActiveAmbition();
    const result = evaluateAmbitionProgress(testTemplate, active, graph, 'agent1');

    expect(result.status).toBe('active');
    expect(result.newMilestones).toEqual(['wealth']);
    expect(result.allCompletedMilestones).toEqual(['wealth']);
  });
});

// ─── THR-812 — vengeance milestone reaches the real death flag ───
//
// Done-when 2 at the lifecycle level, not just the evaluator's. `checkMilestones` is
// the seam that actually decides whether a vengeance ambition advances, and it is what
// `ambitionTick` calls. Before THR-812 this template's `strike` milestone completed on
// the FIRST check regardless of world state, because the condition read a property with
// no writer and returned `true` for the unresolvable ref it was handed.
//
// No shipped template authors `target_agent_eliminated` any more (the two that did were
// repointed at self-predicates), so this uses a synthetic template deliberately: the
// condition remains a supported capability and this pins its contract for whoever wires
// per-instance target binding later.

const vengeanceTemplate: AmbitionTemplate = {
  id: 'ambition.test_vengeance',
  displayName: 'Test Vengeance',
  category: 'vengeance',
  reachFloors: {},
  requiredTraits: [],
  blockingTraits: [],
  sphereAffinities: [],
  bondModifiers: [],
  boostingTraits: [],
  reachAffinity: {},
  milestones: [
    {
      id: 'strike',
      condition: { type: 'target_agent_eliminated', targetRef: 'killer1' },
      prose: ['The blow landed.'],
    },
  ],
  completion: { requires: 1, of: 1 },
  abandonmentTriggers: [],
  abandonmentCooldown: 10,
  selectionProse: ['x'],
  milestoneProse: { strike: ['x'] },
  completionProse: ['x'],
  abandonmentProse: ['x'],
};

describe('vengeance milestone against the engine death flag (THR-812)', () => {
  it('completes when the target node carries deceased: true', () => {
    const graph = createMockGraph(
      [
        { id: 'agent1', properties: {} },
        { id: 'killer1', properties: { deceased: true } },
      ],
      [],
    );

    expect(checkMilestones(vengeanceTemplate, graph, 'agent1', [])).toEqual(['strike']);

    const result = evaluateAmbitionProgress(
      vengeanceTemplate,
      makeActiveAmbition({ templateId: vengeanceTemplate.id }),
      graph,
      'agent1',
    );
    expect(result.status).toBe('completed');
  });

  it('does NOT complete when the target ref is unresolvable', () => {
    // The auto-complete. `killer1` is absent from the graph — the exact state an
    // unbound `$killer` ref produced on every single evaluation.
    const graph = createMockGraph([{ id: 'agent1', properties: {} }], []);

    expect(checkMilestones(vengeanceTemplate, graph, 'agent1', [])).toEqual([]);

    const result = evaluateAmbitionProgress(
      vengeanceTemplate,
      makeActiveAmbition({ templateId: vengeanceTemplate.id }),
      graph,
      'agent1',
    );
    expect(result.status).toBe('active');
    expect(result.allCompletedMilestones).toEqual([]);
  });

  it('does NOT complete while the target is alive', () => {
    const graph = createMockGraph(
      [
        { id: 'agent1', properties: {} },
        { id: 'killer1', properties: { deceased: false } },
      ],
      [],
    );
    expect(checkMilestones(vengeanceTemplate, graph, 'agent1', [])).toEqual([]);
  });
});
