import { describe, it, expect } from 'vitest';
import { evaluateGraphCondition } from '../graphConditions';
import type { GraphCondition } from '../../types/ambition';

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

  // ── agent_in_region / agent_not_in_region ────────────────────
  describe('agent_in_region', () => {
    it('returns true when agent is in the specified region', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: { locationId: 'loc1' } },
          { id: 'loc1', properties: { regionId: 'northlands' } },
        ],
        [],
      );
      const cond: GraphCondition = { type: 'agent_in_region', region: 'northlands' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when agent is in a different region', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: { locationId: 'loc1' } },
          { id: 'loc1', properties: { regionId: 'southlands' } },
        ],
        [],
      );
      const cond: GraphCondition = { type: 'agent_in_region', region: 'northlands' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when agent has no locationId', () => {
      const graph = createMockGraph([{ id: 'a1', properties: {} }], []);
      const cond: GraphCondition = { type: 'agent_in_region', region: 'northlands' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when location node does not exist', () => {
      const graph = createMockGraph(
        [{ id: 'a1', properties: { locationId: 'missing-loc' } }],
        [],
      );
      const cond: GraphCondition = { type: 'agent_in_region', region: 'northlands' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  describe('agent_not_in_region', () => {
    it('returns true when agent is in a different region', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: { locationId: 'loc1' } },
          { id: 'loc1', properties: { regionId: 'southlands' } },
        ],
        [],
      );
      const cond: GraphCondition = { type: 'agent_not_in_region', region: 'northlands' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when agent is in the specified region', () => {
      const graph = createMockGraph(
        [
          { id: 'a1', properties: { locationId: 'loc1' } },
          { id: 'loc1', properties: { regionId: 'northlands' } },
        ],
        [],
      );
      const cond: GraphCondition = { type: 'agent_not_in_region', region: 'northlands' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when agent data is missing (fail-soft)', () => {
      const graph = createMockGraph([], []);
      const cond: GraphCondition = { type: 'agent_not_in_region', region: 'northlands' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });

  // ── target_agent_eliminated ──────────────────────────────────
  describe('target_agent_eliminated', () => {
    it('returns true when target agent is marked eliminated', () => {
      const graph = createMockGraph(
        [{ id: 'villain1', properties: { eliminated: true } }],
        [],
      );
      const cond: GraphCondition = { type: 'target_agent_eliminated', targetRef: 'villain1' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns true when target agent node does not exist', () => {
      const graph = createMockGraph([], []);
      const cond: GraphCondition = { type: 'target_agent_eliminated', targetRef: 'villain1' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(true);
    });

    it('returns false when target agent exists and is not eliminated', () => {
      const graph = createMockGraph(
        [{ id: 'villain1', properties: { eliminated: false } }],
        [],
      );
      const cond: GraphCondition = { type: 'target_agent_eliminated', targetRef: 'villain1' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });

    it('returns false when target agent exists with no eliminated flag', () => {
      const graph = createMockGraph(
        [{ id: 'villain1', properties: {} }],
        [],
      );
      const cond: GraphCondition = { type: 'target_agent_eliminated', targetRef: 'villain1' };
      expect(evaluateGraphCondition(cond, graph, 'a1')).toBe(false);
    });
  });
});
