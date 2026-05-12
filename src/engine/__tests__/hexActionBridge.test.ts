import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  resolveHexAction,
  resolveHexActionFull,
  isHexTargetId,
  parseHexTargetId,
  getAgentIdsAtHex,
  AMPLIFY_FLOW_SATURATION_BOOST,
  SHIFT_DOMINION_BOOST,
  SHIFT_DOMINION_REDUCTION,
  HEX_BLESS_INFLUENCE_DELTA,
  HEX_CORRUPT_CORRUPTION_DELTA,
  HEX_SEED_INFLUENCE_DELTA,
  HEX_RAISE_LANDMARK_INFLUENCE_DELTA,
  HEX_SHIFT_SEASON_INFLUENCE_DELTA,
  HEX_SCORCH_EARTH_CORRUPTION_DELTA,
  HEX_REND_EARTH_CORRUPTION_DELTA,
  HEX_ATTUNE_LEYLINE_INFLUENCE_DELTA,
  HEX_SEVER_FLOW_CORRUPTION_DELTA,
  HEX_DISPEL_WILD_INFLUENCE_DELTA,
  HEX_SCATTER_CORRUPTION_DELTA,
  HEX_SMITE_CORRUPTION_DELTA,
  HEX_CONSECRATE_PAST_INFLUENCE_DELTA,
  HEX_BURY_PAST_CORRUPTION_DELTA,
  HEX_DESECRATE_CORRUPTION_DELTA,
} from '../hexActionBridge';

describe('resolveHexAction', () => {
  it('returns divineInfluence mutation for bless_land on success', () => {
    const mutations = resolveHexAction('hex.bless_land', 3, 5, 'success', 10);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_BLESS_INFLUENCE_DELTA);
    expect(mutations[0].col).toBe(3);
    expect(mutations[0].row).toBe(5);
    expect(mutations[0].source).toBe('hex.bless_land');
  });

  it('returns no mutation for bless_land on failure', () => {
    const mutations = resolveHexAction('hex.bless_land', 3, 5, 'failure', 10);
    expect(mutations).toHaveLength(0);
  });

  it('returns corruption mutation for corrupt_land on success', () => {
    const mutations = resolveHexAction('hex.corrupt_land', 1, 2, 'success', 5);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_CORRUPT_CORRUPTION_DELTA);
  });

  it('returns large divineInfluence mutation for seed_life on success', () => {
    const mutations = resolveHexAction('hex.seed_life', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_SEED_INFLUENCE_DELTA);
  });

  it('returns empty array for hex.survey (observation action, no mutation)', () => {
    const mutations = resolveHexAction('hex.survey', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(0);
  });

  it('returns empty array for unknown template ID (fail-soft)', () => {
    const mutations = resolveHexAction('unknown.template', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(0);
  });

  // TB-046: Land one-shot mutations
  it('returns divineInfluence mutation for raise_landmark on success', () => {
    const mutations = resolveHexAction('hex.raise_landmark', 2, 3, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_RAISE_LANDMARK_INFLUENCE_DELTA);
  });

  it('returns divineInfluence mutation for shift_season on success', () => {
    const mutations = resolveHexAction('hex.shift_season', 1, 1, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_SHIFT_SEASON_INFLUENCE_DELTA);
  });

  it('returns corruption mutation for scorch_earth on success', () => {
    const mutations = resolveHexAction('hex.scorch_earth', 4, 2, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SCORCH_EARTH_CORRUPTION_DELTA);
  });

  it('returns corruption mutation for rend_earth on success', () => {
    const mutations = resolveHexAction('hex.rend_earth', 0, 0, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_REND_EARTH_CORRUPTION_DELTA);
  });

  it('returns empty array for dowse_resources (observation only)', () => {
    expect(resolveHexAction('hex.dowse_resources', 0, 0, 'success', 1)).toHaveLength(0);
  });

  // TB-046: Soul one-shot mutations
  it('returns divineInfluence mutation for attune_leyline on success', () => {
    const mutations = resolveHexAction('hex.attune_leyline', 5, 3, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_ATTUNE_LEYLINE_INFLUENCE_DELTA);
  });

  it('returns corruption mutation for sever_flow on success', () => {
    const mutations = resolveHexAction('hex.sever_flow', 2, 2, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SEVER_FLOW_CORRUPTION_DELTA);
  });

  it('returns divineInfluence mutation for dispel_wild on success', () => {
    const mutations = resolveHexAction('hex.dispel_wild', 1, 4, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_DISPEL_WILD_INFLUENCE_DELTA);
  });

  it('returns empty array for read_currents (observation only)', () => {
    expect(resolveHexAction('hex.read_currents', 0, 0, 'success', 1)).toHaveLength(0);
  });

  it('returns no mutations for any new template on failure', () => {
    const templates = [
      'hex.raise_landmark', 'hex.shift_season', 'hex.scorch_earth', 'hex.rend_earth',
      'hex.attune_leyline', 'hex.sever_flow', 'hex.dispel_wild',
    ];
    for (const t of templates) {
      expect(resolveHexAction(t, 0, 0, 'failure', 1)).toHaveLength(0);
    }
  });

  // TB-047: People one-shot mutations
  it('returns corruption mutation for scatter on success', () => {
    const mutations = resolveHexAction('hex.scatter', 3, 1, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SCATTER_CORRUPTION_DELTA);
  });

  it('returns corruption mutation for smite on success', () => {
    const mutations = resolveHexAction('hex.smite', 2, 4, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_SMITE_CORRUPTION_DELTA);
  });

  // TB-047: Ruins one-shot mutations
  it('returns divineInfluence mutation for consecrate_past on success', () => {
    const mutations = resolveHexAction('hex.consecrate_past', 1, 3, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('divineInfluence');
    expect(mutations[0].delta).toBe(HEX_CONSECRATE_PAST_INFLUENCE_DELTA);
  });

  it('returns corruption mutation for bury_past on success', () => {
    const mutations = resolveHexAction('hex.bury_past', 5, 2, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_BURY_PAST_CORRUPTION_DELTA);
  });

  it('returns corruption mutation for desecrate on success', () => {
    const mutations = resolveHexAction('hex.desecrate', 4, 4, 'success', 1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0].field).toBe('corruption');
    expect(mutations[0].delta).toBe(HEX_DESECRATE_CORRUPTION_DELTA);
  });

  it('returns empty array for observation-only ruins templates', () => {
    const observationTemplates = [
      'hex.read_stones', 'hex.whisper_intuition',
    ];
    for (const t of observationTemplates) {
      expect(resolveHexAction(t, 0, 0, 'success', 1)).toHaveLength(0);
    }
  });

  it('returns no mutations for TB-047 templates on failure', () => {
    const templates = [
      'hex.scatter', 'hex.smite', 'hex.consecrate_past',
      'hex.bury_past', 'hex.desecrate',
    ];
    for (const t of templates) {
      expect(resolveHexAction(t, 0, 0, 'failure', 1)).toHaveLength(0);
    }
  });
});

describe('isHexTargetId', () => {
  it('returns true for valid hex target IDs', () => {
    expect(isHexTargetId('hex_0_0')).toBe(true);
    expect(isHexTargetId('hex_12_34')).toBe(true);
    expect(isHexTargetId('hex_100_200')).toBe(true);
  });

  it('returns false for non-hex IDs', () => {
    expect(isHexTargetId('loc_123')).toBe(false);
    expect(isHexTargetId('actor_abc')).toBe(false);
    expect(isHexTargetId('hex_a_b')).toBe(false);
    expect(isHexTargetId('hex_5')).toBe(false);
    expect(isHexTargetId('')).toBe(false);
  });
});

describe('parseHexTargetId', () => {
  it('parses valid hex target IDs', () => {
    expect(parseHexTargetId('hex_3_5')).toEqual({ col: 3, row: 5 });
    expect(parseHexTargetId('hex_0_0')).toEqual({ col: 0, row: 0 });
    expect(parseHexTargetId('hex_12_34')).toEqual({ col: 12, row: 34 });
  });

  it('returns null for invalid IDs', () => {
    expect(parseHexTargetId('loc_123')).toBeNull();
    expect(parseHexTargetId('hex_a_b')).toBeNull();
    expect(parseHexTargetId('')).toBeNull();
  });
});

// ─── TB-081: Dynamic GraphOp Generators ──────────────────────────────────────

describe('TB-081 dynamic GraphOp generators', () => {
  let graph: WorldGraph;

  /** Set up a hex at (3,5) with 2 locations and 2 agents. */
  function setupHexWithLocationsAndAgents() {
    graph = new WorldGraph();
    graph.addNode({ id: 'loc_a', type: 'location', name: 'Village A', properties: { hexCol: 3, hexRow: 5 } });
    graph.addNode({ id: 'loc_b', type: 'location', name: 'Ruins B', properties: { hexCol: 3, hexRow: 5 } });
    graph.addNode({ id: 'loc_other', type: 'location', name: 'Far Away', properties: { hexCol: 9, hexRow: 9 } });
    graph.addNode({ id: 'agent_1', type: 'actor', name: 'Agent One', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'agent_2', type: 'actor', name: 'Agent Two', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'agent_far', type: 'actor', name: 'Far Agent', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e1', source: 'agent_1', target: 'loc_a', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: 'agent_2', target: 'loc_b', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e3', source: 'agent_far', target: 'loc_other', type: 'located_at', properties: {} });
  }

  beforeEach(() => {
    setupHexWithLocationsAndAgents();
  });

  describe('getAgentIdsAtHex helper', () => {
    it('returns agents at locations on the target hex', () => {
      const ids = getAgentIdsAtHex(graph, 3, 5);
      expect(ids).toContain('agent_1');
      expect(ids).toContain('agent_2');
      expect(ids).not.toContain('agent_far');
    });

    it('returns empty for hex with no locations', () => {
      expect(getAgentIdsAtHex(graph, 99, 99)).toHaveLength(0);
    });
  });

  describe('hex.amplify_flow', () => {
    it('generates update_node ops for all locations on hex', () => {
      const result = resolveHexActionFull('hex.amplify_flow', 3, 5, 'success', 10, graph);
      const updateOps = result.graphOps.filter(op => op.op === 'update_node');
      expect(updateOps).toHaveLength(2);
      expect(updateOps[0].nodeId).toBe('loc_a');
      expect(updateOps[0].changes).toEqual({ magicalSaturation: `+${AMPLIFY_FLOW_SATURATION_BOOST}` });
      expect(updateOps[1].nodeId).toBe('loc_b');
    });

    it('returns no graphOps on failure', () => {
      const result = resolveHexActionFull('hex.amplify_flow', 3, 5, 'failure', 10, graph);
      expect(result.graphOps).toHaveLength(0);
    });

    it('returns empty ops for hex with no locations', () => {
      const result = resolveHexActionFull('hex.amplify_flow', 99, 99, 'success', 10, graph);
      expect(result.graphOps).toHaveLength(0);
    });
  });

  describe('hex.shift_dominion', () => {
    it('boosts resonance and reduces dominant sphere on locations', () => {
      // Set up sphere influence on location
      graph.updateNode('loc_a', { properties: { sphereInfluence: { mind: 0.5, entropy: 0.3, resonance: 0.1 } } });
      const result = resolveHexActionFull('hex.shift_dominion', 3, 5, 'success', 10, graph);
      const updateOps = result.graphOps.filter(op => op.op === 'update_node');
      expect(updateOps.length).toBeGreaterThanOrEqual(2); // one per location

      // Check loc_a: mind was dominant, should be reduced; resonance should be boosted
      const locAOp = updateOps.find(op => op.nodeId === 'loc_a');
      expect(locAOp).toBeDefined();
      const si = locAOp!.properties!.sphereInfluence as Record<string, number>;
      expect(si.resonance).toBeCloseTo(0.1 + SHIFT_DOMINION_BOOST);
      expect(si.mind).toBeCloseTo(0.5 - SHIFT_DOMINION_REDUCTION);
    });

    it('handles locations with no existing sphereInfluence', () => {
      const result = resolveHexActionFull('hex.shift_dominion', 3, 5, 'success', 10, graph);
      // Should not throw — returns ops with just resonance boost
      const updateOps = result.graphOps.filter(op => op.op === 'update_node');
      expect(updateOps).toHaveLength(2);
      for (const op of updateOps) {
        const si = op.properties!.sphereInfluence as Record<string, number>;
        expect(si.resonance).toBeCloseTo(SHIFT_DOMINION_BOOST);
      }
    });
  });

  describe('hex.spark_encounter', () => {
    it('creates event node and occurred_at edge', () => {
      const result = resolveHexActionFull('hex.spark_encounter', 3, 5, 'success', 15, graph);
      expect(result.graphOps).toHaveLength(2);

      const addNode = result.graphOps[0];
      expect(addNode.op).toBe('add_node');
      expect(addNode.nodeType).toBe('event');
      expect(addNode.properties?.eventType).toBe('divine_spark');
      expect(addNode.properties?.hexCol).toBe(3);
      expect(addNode.properties?.hexRow).toBe(5);
      expect(addNode.properties?.tick).toBe(15);

      const addEdge = result.graphOps[1];
      expect(addEdge.op).toBe('add_edge');
      expect(addEdge.edgeType).toBe('occurred_at');
      expect(addEdge.target).toBe('loc_a');
    });

    it('returns no ops for hex with no locations', () => {
      const result = resolveHexActionFull('hex.spark_encounter', 99, 99, 'success', 10, graph);
      expect(result.graphOps).toHaveLength(0);
    });
  });

  describe('hex.stir_people', () => {
    it('applies influence to all agents on hex', () => {
      const result = resolveHexActionFull('hex.stir_people', 3, 5, 'success', 10, graph);
      const influenceOps = result.graphOps.filter(op => op.op === 'apply_influence');
      expect(influenceOps).toHaveLength(2);
      expect(influenceOps[0].target).toBe('agent_1');
      expect(influenceOps[1].target).toBe('agent_2');
      expect(influenceOps[0].influence?.interventionType).toBe('stir_people');
      expect(influenceOps[0].influence?.behaviorTag).toBe('stirred');
    });
  });

  describe('hex.summon_congregation', () => {
    it('applies summoned influence to agents on hex', () => {
      const result = resolveHexActionFull('hex.summon_congregation', 3, 5, 'success', 10, graph);
      const influenceOps = result.graphOps.filter(op => op.op === 'apply_influence');
      expect(influenceOps).toHaveLength(2);
      expect(influenceOps[0].influence?.behaviorTag).toBe('summoned');
      expect(influenceOps[0].influence?.sphere).toBe('spirit');
    });
  });

  describe('hex.bestow_vision', () => {
    it('applies visionary influence to first agent on hex (personal scale)', () => {
      const result = resolveHexActionFull('hex.bestow_vision', 3, 5, 'success', 10, graph);
      const influenceOps = result.graphOps.filter(op => op.op === 'apply_influence');
      expect(influenceOps).toHaveLength(1); // personal scale — first agent only
      expect(influenceOps[0].target).toBe('agent_1');
      expect(influenceOps[0].influence?.behaviorTag).toBe('visionary');
      expect(influenceOps[0].influence?.sphere).toBe('mind');
    });

    it('returns no ops when no agents present', () => {
      // Use hex with locations but no agents
      graph.addNode({ id: 'loc_empty', type: 'location', name: 'Empty', properties: { hexCol: 7, hexRow: 7 } });
      const result = resolveHexActionFull('hex.bestow_vision', 7, 7, 'success', 10, graph);
      expect(result.graphOps).toHaveLength(0);
    });
  });

  describe('hex.incite_exodus', () => {
    it('applies exodus_urge influence to all agents on hex', () => {
      const result = resolveHexActionFull('hex.incite_exodus', 3, 5, 'success', 10, graph);
      const influenceOps = result.graphOps.filter(op => op.op === 'apply_influence');
      expect(influenceOps).toHaveLength(2);
      expect(influenceOps[0].influence?.behaviorTag).toBe('exodus_urge');
      expect(influenceOps[0].influence?.sphere).toBe('entropy');
      expect(influenceOps[0].influence?.valueDrifts?.sacrifice_survival).toBe(-0.10);
    });
  });

  describe('hex.plant_dream', () => {
    it('applies dreamer influence to first agent on hex (personal scale)', () => {
      const result = resolveHexActionFull('hex.plant_dream', 3, 5, 'success', 10, graph);
      const influenceOps = result.graphOps.filter(op => op.op === 'apply_influence');
      expect(influenceOps).toHaveLength(1); // personal scale
      expect(influenceOps[0].target).toBe('agent_1');
      expect(influenceOps[0].influence?.behaviorTag).toBe('dreamer');
      expect(influenceOps[0].influence?.valueDrifts?.tradition_novelty).toBe(0.10);
    });
  });

  describe('resolveHexActionFull with generators', () => {
    it('returns no dynamic ops when graph is not provided', () => {
      // Without graph, generator can't run
      const result = resolveHexActionFull('hex.amplify_flow', 3, 5, 'success', 10);
      expect(result.graphOps).toHaveLength(0);
    });

    it('combines static and dynamic ops when both exist', () => {
      // hex.rewrite_history has static ops; no generator. Verify it still works.
      const result = resolveHexActionFull('hex.rewrite_history', 3, 5, 'success', 10, graph);
      expect(result.graphOps).toHaveLength(1);
      expect(result.graphOps[0].op).toBe('update_node');
    });
  });
});
