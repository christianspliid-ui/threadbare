import { describe, it, expect, beforeEach } from 'vitest';
import {
  instantiateReward,
  getTierCurveForOutcome,
  resolveRewardRecipe,
  TIER_CURVE_CRITICAL_SUCCESS,
  TIER_CURVE_SUCCESS,
  TIER_CURVE_FAILURE,
  TIER_CURVE_CRITICAL_FAILURE,
  BAD_OUTCOME_CHANCE_CRIT_SUCCESS,
  BAD_OUTCOME_CHANCE_SUCCESS,
  BAD_OUTCOME_CHANCE_FAILURE,
  BAD_OUTCOME_CHANCE_CRIT_FAILURE,
  REWARD_INSTANTIATE_PREFIX,
  REWARD_EDGE_SOURCE,
  REWARD_CONDITION_DEFAULT_TICKS,
} from '../rewardPool';
import { WorldGraph } from '../graph';

describe('instantiateReward', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // Agent node
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Test Agent',
      properties: {},
    });

    // Artifact template (possession)
    graph.addNode({
      id: 'template_sword',
      type: 'artifact',
      name: 'Iron Sword',
      properties: {
        subcategory: 'arms',
        tier: 1,
        tags: ['#iron', '#weapon'],
        mechanicalSummary: '+Iron',
        reachBonus: { iron: 0.05 },
        lossCondition: 'breakable',
      },
    });

    // Condition template (wound)
    graph.addNode({
      id: 'template_wound',
      type: 'trait',
      name: 'Broken Ribs',
      properties: {
        subcategory: 'condition',
        tier: 1,
        tags: ['#wound', '#physical'],
        description: 'Cracked ribs',
        maxLevel: 1,
        visibility: 'public',
        domainContributions: { iron: -0.05 },
      },
    });

    // Bestowed power template
    graph.addNode({
      id: 'template_bestowed',
      type: 'trait',
      name: 'Spirit Sight',
      properties: {
        subcategory: 'bestowed',
        tier: 2,
        tags: ['#bestowed', '#eye'],
        description: 'See beyond the veil',
        maxLevel: 1,
        visibility: 'discoverable',
        domainContributions: { eye: 0.10 },
      },
    });
  });

  describe('artifact instantiation', () => {
    it('clones artifact node and creates possesses edge', () => {
      const result = instantiateReward(graph, 'template_sword', 'agent_1', 5);

      expect(result).not.toBeNull();
      expect(result!.category).toBe('possession');
      expect(result!.displayName).toBe('Iron Sword');

      // Instance node exists
      const instance = graph.getNode(result!.instanceId);
      expect(instance).toBeDefined();
      expect(instance!.name).toBe('Iron Sword');
      expect(instance!.type).toBe('artifact');
      expect(instance!.properties.source).toBe(REWARD_EDGE_SOURCE);
      expect(instance!.properties.acquiredTick).toBe(5);

      // Edge exists
      const edge = graph.getEdge(result!.edgeId);
      expect(edge).toBeDefined();
      expect(edge!.type).toBe('possesses');
      expect(edge!.source).toBe('agent_1');
      expect(edge!.target).toBe(result!.instanceId);
      expect(edge!.properties.modifiers).toEqual({ iron: 0.05 });
    });

    it('uses deterministic instance ID', () => {
      const result = instantiateReward(graph, 'template_sword', 'agent_1', 10);
      expect(result!.instanceId).toBe(`${REWARD_INSTANTIATE_PREFIX}_agent_1_10_template_sword`);
    });
  });

  describe('condition instantiation', () => {
    it('creates has_trait edge with ticksRemaining', () => {
      const result = instantiateReward(graph, 'template_wound', 'agent_1', 3);

      expect(result).not.toBeNull();
      expect(result!.category).toBe('condition');
      expect(result!.displayName).toBe('Broken Ribs');

      const edge = graph.getEdge(result!.edgeId);
      expect(edge!.type).toBe('has_trait');
      expect(edge!.properties.level).toBe(1);
      expect(edge!.properties.acquiredTick).toBe(3);
      expect(edge!.properties.ticksRemaining).toBe(REWARD_CONDITION_DEFAULT_TICKS);
      expect(edge!.properties.totalTicks).toBe(REWARD_CONDITION_DEFAULT_TICKS);
      expect(edge!.properties.source).toBe(REWARD_EDGE_SOURCE);
      expect(edge!.properties.modifiers).toEqual({ iron: -0.05 });
    });
  });

  describe('bestowed power instantiation', () => {
    it('creates has_trait edge with null ticksRemaining (permanent)', () => {
      const result = instantiateReward(graph, 'template_bestowed', 'agent_1', 7);

      expect(result).not.toBeNull();
      expect(result!.category).toBe('bestowed');
      expect(result!.displayName).toBe('Spirit Sight');

      const edge = graph.getEdge(result!.edgeId);
      expect(edge!.type).toBe('has_trait');
      expect(edge!.properties.ticksRemaining).toBeNull();
      expect(edge!.properties.modifiers).toEqual({ eye: 0.10 });
    });

    it('resolves service rewards into granted content while preserving service category', () => {
      graph.addNode({
        id: 'template_patrons_backing',
        type: 'trait',
        name: "Patron's Backing",
        properties: {
          subcategory: 'bestowed',
          tier: 1,
          tags: ['#bestowed', '#gold'],
          description: 'A network of favors.',
          maxLevel: 1,
          visibility: 'discoverable',
          domainContributions: { gold: 0.04 },
          effects: [
            {
              type: 'test_shaper',
              reach: 'gold',
              trigger: 'near_miss',
              steps: 1,
              maxMargin: 8,
            },
          ],
        },
      });

      graph.addNode({
        id: 'template_letters_of_introduction',
        type: 'artifact',
        name: 'Letters of Introduction',
        properties: {
          subcategory: 'tomes_scrolls',
          tier: 1,
          tags: ['#gold', '#service'],
          rewardMode: 'service',
          effects: [
            {
              type: 'content_grant',
              templateIds: ['template_patrons_backing'],
              selection: 'first',
            },
          ],
        },
      });

      const result = instantiateReward(graph, 'template_letters_of_introduction', 'agent_1', 9);

      expect(result).not.toBeNull();
      expect(result!.category).toBe('service');
      expect(result!.displayName).toBe("Patron's Backing");

      const grantedNode = graph.getNode(result!.instanceId);
      expect(grantedNode?.name).toBe("Patron's Backing");
      expect(grantedNode?.type).toBe('trait');

      const edge = graph.getEdge(result!.edgeId);
      expect(edge?.type).toBe('has_trait');
      expect(edge?.target).toBe(result!.instanceId);
      expect(edge?.source).toBe('agent_1');
    });
  });

  describe('fail-soft', () => {
    it('returns null for missing template node', () => {
      const result = instantiateReward(graph, 'nonexistent', 'agent_1', 1);
      expect(result).toBeNull();
    });

    it('returns null for missing agent node', () => {
      const result = instantiateReward(graph, 'template_sword', 'nonexistent_agent', 1);
      expect(result).toBeNull();
    });
  });

  describe('template stays unmodified', () => {
    it('does not modify the template node', () => {
      instantiateReward(graph, 'template_sword', 'agent_1', 5);
      const template = graph.getNode('template_sword');
      expect(template!.properties.source).toBeUndefined();
      expect(template!.properties.acquiredTick).toBeUndefined();
    });
  });
});

describe('getTierCurveForOutcome', () => {
  it('returns critical success curve for critical_success', () => {
    const { tierCurve, badOutcomeChance } = getTierCurveForOutcome('critical_success');
    expect(tierCurve).toEqual(TIER_CURVE_CRITICAL_SUCCESS);
    expect(badOutcomeChance).toBe(BAD_OUTCOME_CHANCE_CRIT_SUCCESS);
  });

  it('returns success curve for success', () => {
    const { tierCurve, badOutcomeChance } = getTierCurveForOutcome('success');
    expect(tierCurve).toEqual(TIER_CURVE_SUCCESS);
    expect(badOutcomeChance).toBe(BAD_OUTCOME_CHANCE_SUCCESS);
  });

  it('returns failure curve for failure', () => {
    const { tierCurve, badOutcomeChance } = getTierCurveForOutcome('failure');
    expect(tierCurve).toEqual(TIER_CURVE_FAILURE);
    expect(badOutcomeChance).toBe(BAD_OUTCOME_CHANCE_FAILURE);
  });

  it('returns critical failure curve for critical_failure', () => {
    const { tierCurve, badOutcomeChance } = getTierCurveForOutcome('critical_failure');
    expect(tierCurve).toEqual(TIER_CURVE_CRITICAL_FAILURE);
    expect(badOutcomeChance).toBe(BAD_OUTCOME_CHANCE_CRIT_FAILURE);
  });

  it('critical success has 0% bad outcome chance', () => {
    expect(BAD_OUTCOME_CHANCE_CRIT_SUCCESS).toBe(0.0);
  });

  it('critical failure has 85% bad outcome chance', () => {
    expect(BAD_OUTCOME_CHANCE_CRIT_FAILURE).toBe(0.85);
  });

  it('tier curves favor higher tiers on better outcomes', () => {
    const crit = TIER_CURVE_CRITICAL_SUCCESS;
    const success = TIER_CURVE_SUCCESS;
    // Critical success gives more T3+T4 weight than regular success
    expect(crit[3] + crit[4]).toBeGreaterThan(success[3] + success[4]);
  });
});

describe('resolveRewardRecipe', () => {
  it('combines template recipe with outcome tier curve', () => {
    const template = { categoryWeights: { possession: 0.8, condition: 0.2 } };
    const resolved = resolveRewardRecipe(template, 'success');

    expect(resolved.categoryWeights).toEqual(template.categoryWeights);
    expect(resolved.tierCurve).toEqual(TIER_CURVE_SUCCESS);
    expect(resolved.badOutcomeChance).toBe(BAD_OUTCOME_CHANCE_SUCCESS);
  });

  it('preserves tagFilters from template', () => {
    const template = {
      categoryWeights: { possession: 1.0 },
      tagFilters: ['#ancient', '#cursed'],
    };
    const resolved = resolveRewardRecipe(template, 'critical_success');
    expect(resolved.tagFilters).toEqual(['#ancient', '#cursed']);
  });
});
