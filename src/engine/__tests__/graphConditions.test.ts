import { describe, it, expect } from 'vitest';
import { evaluateGraphCondition } from '../graphConditions';
import type { GraphCondition } from '../../types/ambition';

// ─── Minimal mock graph ──────────────────────────────────────────
interface MockNode {
  id: string;
  /** Node type. Optional to keep every pre-THR-841 fixture valid; the region walk needs it. */
  type?: string;
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

// ─── Tests ───────────────────────────────────────────────────────

describe('evaluateGraphCondition', () => {
  // ── agent_reach_above / agent_reach_below ────────────────────
  describe('agent_reach_above', () => {
    it('returns true when reach meets threshold', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: { domainCapabilities: { iron: 5 } } }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns true when reach exceeds threshold', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: { domainCapabilities: { iron: 8 } } }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when reach is below threshold', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: { domainCapabilities: { iron: 3 } } }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when agent node is missing', () => {
      const graph = createMockGraph([], []);
      const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when domainCapabilities is missing', () => {
      const graph = createMockGraph([{ id: 'a1', properties: {} }], []);
      const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  describe('agent_reach_below', () => {
    it('returns true when reach is below threshold', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: { domainCapabilities: { gold: 2 } } }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_reach_below', reach: 'gold', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when reach meets threshold', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: { domainCapabilities: { gold: 5 } } }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_reach_below', reach: 'gold', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when agent is missing (fail-soft)', () => {
      const graph = createMockGraph([], []);
      const cond: GraphCondition = { type: 'agent_reach_below', reach: 'gold', threshold: 5 };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  // ── agent_has_trait / agent_lacks_trait ───────────────────────
  describe('agent_has_trait', () => {
    it('returns true when agent has trait via traitId property', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: {} },
          { id: 'trait.brave', properties: { traitId: 'brave' } },
        ],
        [{ source: 'a1', target: 'trait.brave', type: 'has_trait', properties: {} }],
      );
      const cond: GraphCondition = { type: 'agent_has_trait', trait: 'brave' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns true when agent has trait via node id convention', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: {} },
          { id: 'trait.cunning', properties: {} },
        ],
        [{ source: 'a1', target: 'trait.cunning', type: 'has_trait', properties: {} }],
      );
      const cond: GraphCondition = { type: 'agent_has_trait', trait: 'cunning' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when agent lacks the trait', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: {} }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_has_trait', trait: 'brave' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  describe('agent_lacks_trait', () => {
    it('returns true when agent does not have the trait', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: {} }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_lacks_trait', trait: 'cowardly' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when agent has the trait', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: {} },
          { id: 'trait.cowardly', properties: { traitId: 'cowardly' } },
        ],
        [{ source: 'a1', target: 'trait.cowardly', type: 'has_trait', properties: {} }],
      );
      const cond: GraphCondition = { type: 'agent_lacks_trait', trait: 'cowardly' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  // ── agent_has_bonds ──────────────────────────────────────────
  describe('agent_has_bonds', () => {
    it('returns true when bond count meets minCount', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: {} }],
        [
          { source: 'a1', target: 'a2', type: 'relates_to', properties: { basis: 'loyalty' } },
          { source: 'a1', target: 'a3', type: 'relates_to', properties: { basis: 'loyalty' } },
        ],
      );
      const cond: GraphCondition = { type: 'agent_has_bonds', minCount: 2, basis: 'loyalty' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when bond count is below minCount', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: {} }],
        [
          { source: 'a1', target: 'a2', type: 'relates_to', properties: { basis: 'loyalty' } },
        ],
      );
      const cond: GraphCondition = { type: 'agent_has_bonds', minCount: 3, basis: 'loyalty' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('only counts bonds matching the specified basis', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: {} }],
        [
          { source: 'a1', target: 'a2', type: 'relates_to', properties: { basis: 'loyalty' } },
          { source: 'a1', target: 'a3', type: 'relates_to', properties: { basis: 'rivalry' } },
        ],
      );
      const cond: GraphCondition = { type: 'agent_has_bonds', minCount: 2, basis: 'loyalty' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  // ── agent_controls_location ──────────────────────────────────
  describe('agent_controls_location', () => {
    it('returns true when agent controls a location of matching type', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: {} },
          { id: 'loc1', properties: { locationType: 'settlement' } },
        ],
        [{ source: 'a1', target: 'loc1', type: 'controls', properties: {} }],
      );
      const cond: GraphCondition = { type: 'agent_controls_location', locationType: 'settlement' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when controlled location has different type', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: {} },
          { id: 'loc1', properties: { locationType: 'wilderness' } },
        ],
        [{ source: 'a1', target: 'loc1', type: 'controls', properties: {} }],
      );
      const cond: GraphCondition = { type: 'agent_controls_location', locationType: 'settlement' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when agent controls no locations', () => {
      const graph = createMockGraph([{ id: 'a1', properties: {} }], []);
      const cond: GraphCondition = { type: 'agent_controls_location', locationType: 'settlement' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  // ── Region conditions (THR-841) ──────────────────────────────
  //
  // These fixtures build region membership the way the world actually builds it: a
  // `contains` edge from a `region`-typed node. Until THR-841 they stamped a
  // `regionId` property onto the location instead — a property with no writer anywhere
  // in `src/`, so all eight tests passed against a condition that was false for every
  // agent in every real world. The fixture invented both sides of the contract.
  //
  // `agentAt` therefore takes the region as an *edge*, and there is no way to express
  // the phantom property through it.

  /**
   * Agent `a1` standing at `loc1`; `loc1` inside `region_n` when `regionId` is given.
   * `origin` seeds the residence origin the origin-region conditions read.
   */
  function agentAt(
    opts: { regionId?: string; origin?: string; extraNodes?: MockNode[]; extraEdges?: MockEdge[] } = {},
  ) {
    const nodes: MockNode[] = [
      { id: 'a1', type: 'actor', properties: opts.origin ? { originLocationId: opts.origin } : {} },
      { id: 'loc1', type: 'location', properties: {} },
      ...(opts.extraNodes ?? []),
    ];
    const edges: MockEdge[] = [
      { source: 'a1', target: 'loc1', type: 'located_at', properties: {} },
      ...(opts.extraEdges ?? []),
    ];
    if (opts.regionId) {
      nodes.push({ id: opts.regionId, type: 'region', properties: {} });
      edges.push({ source: opts.regionId, target: 'loc1', type: 'contains', properties: {} });
    }
    return createMockGraph(nodes, edges);
  }

  describe('agent_in_region', () => {
    const cond: GraphCondition = { type: 'agent_in_region', region: 'region_1' };

    it('resolves the region from the contains edge, not from a location property', () => {
      expect(evaluateGraphCondition(cond, agentAt({ regionId: 'region_1' }), 'a1')).toBe(true);
    });

    it('returns false when the agent is in a different region', () => {
      expect(evaluateGraphCondition(cond, agentAt({ regionId: 'region_2' }), 'a1')).toBe(false);
    });

    it('returns false when the location belongs to no region', () => {
      expect(evaluateGraphCondition(cond, agentAt(), 'a1')).toBe(false);
    });

    it('ignores a stamped regionId property — it has no writer and must not resolve', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', type: 'actor', properties: {} },
          { id: 'loc1', type: 'location', properties: { regionId: 'region_1' } },
        ],
        [{ source: 'a1', target: 'loc1', type: 'located_at', properties: {} }],
      );
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('does not mistake a parent location for a region (contains is shared)', () => {
      // sub1 is inside loc1 by `contains`; loc1 is a location, not a region.
      const graph = createMockGraph(
        [
          { id: 'a1', type: 'actor', properties: {} },
          { id: 'loc1', type: 'location', properties: {} },
          { id: 'sub1', type: 'location', properties: {} },
        ],
        [
          { source: 'a1', target: 'sub1', type: 'located_at', properties: {} },
          { source: 'loc1', target: 'sub1', type: 'contains', properties: {} },
        ],
      );
      expect(evaluateGraphCondition({ type: 'agent_in_region', region: 'loc1' }, graph, 'a1')).toBe(false);
    });

    it('resolves a sublocation through its parentLocationId', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', type: 'actor', properties: {} },
          { id: 'loc1', type: 'location', properties: {} },
          { id: 'sub1', type: 'location', properties: { parentLocationId: 'loc1' } },
          { id: 'region_1', type: 'region', properties: {} },
        ],
        [
          { source: 'a1', target: 'sub1', type: 'located_at', properties: {} },
          { source: 'region_1', target: 'loc1', type: 'contains', properties: {} },
        ],
      );
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('terminates on a parentLocationId cycle rather than hanging the tick loop', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', type: 'actor', properties: {} },
          { id: 'x', type: 'location', properties: { parentLocationId: 'y' } },
          { id: 'y', type: 'location', properties: { parentLocationId: 'x' } },
        ],
        [{ source: 'a1', target: 'x', type: 'located_at', properties: {} }],
      );
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when the agent has no located_at edge', () => {
      const graph = createMockGraph([{ id: 'a1', type: 'actor', properties: {} }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  describe('agent_not_in_region', () => {
    const cond: GraphCondition = { type: 'agent_not_in_region', region: 'region_1' };

    it('returns true when the agent is in a different region', () => {
      expect(evaluateGraphCondition(cond, agentAt({ regionId: 'region_2' }), 'a1')).toBe(true);
    });

    it('returns false when the agent is in the named region', () => {
      expect(evaluateGraphCondition(cond, agentAt({ regionId: 'region_1' }), 'a1')).toBe(false);
    });

    it('returns false — not true — when the region is unresolvable', () => {
      // A negative condition must not read "we do not know" as "somewhere else", or
      // every unplaceable agent completes the milestone for free.
      expect(evaluateGraphCondition(cond, agentAt(), 'a1')).toBe(false);
      expect(evaluateGraphCondition(cond, createMockGraph([], []), 'a1')).toBe(false);
    });
  });

  // ── agent_in_origin_region / agent_not_in_origin_region (THR-841) ──
  describe('agent_in_origin_region', () => {
    const cond: GraphCondition = { type: 'agent_in_origin_region' };

    it('is true when the current region is the origin region', () => {
      const graph = agentAt({
        regionId: 'region_1',
        origin: 'loc_home',
        extraNodes: [{ id: 'loc_home', type: 'location', properties: {} }],
        extraEdges: [{ source: 'region_1', target: 'loc_home', type: 'contains', properties: {} }],
      });
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('is true from a different location in the same region — the point of region-coarse', () => {
      // loc1 !== loc_home, but both sit in region_1. `agent_away_from_origin` (exact)
      // would read this agent as away; this condition reads them as home.
      const graph = agentAt({
        regionId: 'region_1',
        origin: 'loc_home',
        extraNodes: [{ id: 'loc_home', type: 'location', properties: {} }],
        extraEdges: [{ source: 'region_1', target: 'loc_home', type: 'contains', properties: {} }],
      });
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
      expect(evaluateGraphCondition({ type: 'agent_not_in_origin_region' }, graph, 'a1')).toBe(false);
    });

    it('is false when the origin region differs from the current one', () => {
      const graph = agentAt({
        regionId: 'region_1',
        origin: 'loc_home',
        extraNodes: [
          { id: 'loc_home', type: 'location', properties: {} },
          { id: 'region_2', type: 'region', properties: {} },
        ],
        extraEdges: [{ source: 'region_2', target: 'loc_home', type: 'contains', properties: {} }],
      });
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
      expect(evaluateGraphCondition({ type: 'agent_not_in_origin_region' }, graph, 'a1')).toBe(true);
    });

    it('both directions are false when no origin was ever observed', () => {
      const graph = agentAt({ regionId: 'region_1' });
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
      expect(evaluateGraphCondition({ type: 'agent_not_in_origin_region' }, graph, 'a1')).toBe(false);
    });

    it('both directions are false when the current region is unresolvable', () => {
      const graph = agentAt({
        origin: 'loc_home',
        extraNodes: [
          { id: 'loc_home', type: 'location', properties: {} },
          { id: 'region_2', type: 'region', properties: {} },
        ],
        extraEdges: [{ source: 'region_2', target: 'loc_home', type: 'contains', properties: {} }],
      });
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
      expect(evaluateGraphCondition({ type: 'agent_not_in_origin_region' }, graph, 'a1')).toBe(false);
    });
  });

  // ── agent_deceased (THR-808) ─────────────────────────────────
  describe('agent_deceased', () => {
    const cond: GraphCondition = { type: 'agent_deceased' };

    it('returns true when the agent carries the engine death flag', () => {
      const graph = createMockGraph([{ id: 'a1', properties: { deceased: true } }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false for a living agent', () => {
      const graph = createMockGraph([{ id: 'a1', properties: { deceased: false } }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when the agent has no death flag at all', () => {
      const graph = createMockGraph([{ id: 'a1', properties: {} }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('fails soft to false on a missing node', () => {
      // `phaseAmbitionProgress` reaches this by walking live `actor` nodes, so absence
      // is unreachable in production; treating it as death would be an auto-complete.
      // THR-812 brought `target_agent_eliminated` onto the same rule, so the two
      // siblings now agree — this used to be a documented divergence.
      const graph = createMockGraph([], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('reads `deceased` and not the never-written `eliminated` spelling', () => {
      // `properties.eliminated` has no writer anywhere in the repo (THR-812). Pinning
      // this stops a future edit from quietly widening the predicate onto a phantom.
      const graph = createMockGraph([{ id: 'a1', properties: { eliminated: true } }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  // ── target_agent_eliminated (repointed in THR-812) ────────────
  describe('target_agent_eliminated', () => {
    const cond: GraphCondition = { type: 'target_agent_eliminated', targetRef: 'villain1' };

    it('returns true when the target carries the engine death flag', () => {
      // The case THR-812 unblocked. Before it, a target that genuinely died kept its
      // node with `deceased: true` and this stayed false forever — the vengeance
      // milestone could never complete for the one reason it exists.
      const graph = createMockGraph([{ id: 'villain1', properties: { deceased: true } }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when the target ref is unresolvable', () => {
      // The auto-complete this ticket killed. `!target` used to return `true`, and every
      // shipped author passed an unbindable `$`-ref, so this was the ONLY true-path any
      // of them ever took — the milestone completed against a node that never existed.
      const graph = createMockGraph([], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false for a $-ref, the exact shape that used to auto-complete', () => {
      const dollarRef: GraphCondition = { type: 'target_agent_eliminated', targetRef: '$killer' };
      const graph = createMockGraph([{ id: 'villain1', properties: { deceased: true } }], []);
      expect(evaluateGraphCondition(dollarRef, graph, 'a1')).toBe(false);
    });

    it('returns false when the target is alive', () => {
      const graph = createMockGraph([{ id: 'villain1', properties: { deceased: false } }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when the target has no death flag at all', () => {
      const graph = createMockGraph([{ id: 'villain1', properties: {} }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('reads `deceased` and not the never-written `eliminated` spelling', () => {
      // `properties.eliminated` had exactly one reference in the repo — this case's own
      // read — and zero writers. Pinning the negative stops a revert from restoring the
      // phantom, which would look green under any test that only asserted the positive.
      const graph = createMockGraph([{ id: 'villain1', properties: { eliminated: true } }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  // ── agent_settled_since / agent_away_from_origin (THR-822) ───
  //
  // Both are durational: they read recorded residence plus a clock from the evaluation
  // context. The negative cases matter more than the positive ones here — these are
  // abandonment triggers, so a false positive ends an ambition that should still be
  // running, and the whole reason the concept was blocked was tick-one firing.

  /** An agent settled at `far` since tick 100, having started at `home`. */
  function settledGraph(position = 'far') {
    return createMockGraph(
      [{
        id: 'a1',
        properties: {
          originLocationId: 'home',
          residencePositionId: position,
          residenceArrivedTick: 100,
        },
      }],
      [],
    );
  }

  describe('agent_settled_since', () => {
    const cond: GraphCondition = { type: 'agent_settled_since', minTicks: 50 };

    it('returns true once dwell reaches the threshold', () => {
      expect(evaluateGraphCondition(cond, settledGraph(), 'a1', { currentTick: 150 })).toBe(true);
    });

    it('returns false below the threshold', () => {
      expect(evaluateGraphCondition(cond, settledGraph(), 'a1', { currentTick: 149 })).toBe(false);
    });

    it('measures from the window start, not from arrival', () => {
      // The agent has been stationary for 100 ticks, but the asking ambition is 10 ticks
      // old. This is the case that made the concept unsafe before THR-822: without the
      // window it reads 100 >= 50 and abandons on the first evaluation.
      expect(evaluateGraphCondition(cond, settledGraph(), 'a1', { currentTick: 200, windowStartTick: 190 })).toBe(false);
      expect(evaluateGraphCondition(cond, settledGraph(), 'a1', { currentTick: 240, windowStartTick: 190 })).toBe(true);
    });

    it('cannot hold at the window start, whatever the agent was doing before', () => {
      for (const start of [0, 100, 500, 5000]) {
        expect(
          evaluateGraphCondition(cond, settledGraph(), 'a1', { currentTick: start, windowStartTick: start }),
        ).toBe(false);
      }
    });

    it('returns false with no clock in the context', () => {
      expect(evaluateGraphCondition(cond, settledGraph(), 'a1')).toBe(false);
      expect(evaluateGraphCondition(cond, settledGraph(), 'a1', {})).toBe(false);
      expect(evaluateGraphCondition(cond, settledGraph(), 'a1', { windowStartTick: 0 })).toBe(false);
    });

    it('returns false when residence was never observed', () => {
      const graph = createMockGraph([{ id: 'a1', properties: {} }], []);
      expect(evaluateGraphCondition(cond, graph, 'a1', { currentTick: 9999 })).toBe(false);
    });

    it('returns false when the agent node is missing', () => {
      expect(evaluateGraphCondition(cond, createMockGraph([], []), 'a1', { currentTick: 9999 })).toBe(false);
    });
  });

  describe('agent_away_from_origin', () => {
    const cond: GraphCondition = { type: 'agent_away_from_origin', minTicks: 50 };

    it('returns true when settled long enough somewhere that is not the origin', () => {
      expect(evaluateGraphCondition(cond, settledGraph('far'), 'a1', { currentTick: 150 })).toBe(true);
    });

    it('returns false when the agent is settled at its origin', () => {
      // Long enough, but home — the distinguishing half of this condition versus
      // `agent_settled_since`.
      expect(evaluateGraphCondition(cond, settledGraph('home'), 'a1', { currentTick: 9999 })).toBe(false);
    });

    it('returns false when away but not yet settled', () => {
      expect(evaluateGraphCondition(cond, settledGraph('far'), 'a1', { currentTick: 149 })).toBe(false);
    });

    it('obeys the same window rule', () => {
      expect(evaluateGraphCondition(cond, settledGraph('far'), 'a1', { currentTick: 200, windowStartTick: 190 })).toBe(false);
      expect(evaluateGraphCondition(cond, settledGraph('far'), 'a1', { currentTick: 240, windowStartTick: 190 })).toBe(true);
    });

    it('returns false when no origin was ever recorded', () => {
      // Unmeasured is not the same as away. An agent whose origin was never observed
      // must not be treated as an exile.
      const graph = createMockGraph(
        [{ id: 'a1', properties: { residencePositionId: 'far', residenceArrivedTick: 100 } }],
        [],
      );
      expect(evaluateGraphCondition(cond, graph, 'a1', { currentTick: 9999 })).toBe(false);
    });

    it('returns false with no clock in the context', () => {
      expect(evaluateGraphCondition(cond, settledGraph('far'), 'a1')).toBe(false);
    });
  });
});
