/**
 * THR-1520 — draw-by-trait completion, the pool half.
 *
 * Two things are pinned, each with a falsifying arm:
 *
 * 1. **Dedup against what the bearer holds.** Before this slice `assembleRewardPool`
 *    filtered per-bearer only for companions; a possession, condition or power could be
 *    dealt to the same mortal twice. The pre-fix arm proves the template *was* in the
 *    set the resolver returned for the recipe (so the exclusion is measured, not
 *    assumed); the post-fix arm proves a bearer holding X is never offered X, while a
 *    bearer who does not hold it still is, and a bearer-less assembly still is.
 *
 * 2. **The bearer-trait term is judged at the call site, never by the resolver.** The
 *    resolver returns the same hits with the term and without it (it is pure and
 *    bearer-blind); the pool is empty for a bearer lacking the trait, full once they
 *    hold it, and empty with no bearer to judge.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { ResolvedRewardRecipe } from '../../types/attachments';
import {
  REWARD_INSTANTIATE_PREFIX,
  assembleRewardPool,
  assembleRewardPoolDetailed,
  drawSeededReward,
  heldTemplateIdsOf,
  instantiateReward,
  templateIdOfHeldInstance,
  toContentQuery,
} from '../rewardPool';
import {
  describeContentQuery,
  graphContentCatalogs,
  resolveContentQuery,
  resolveContentQueryDetailed,
} from '../contentQuery';
import { contentQueryAdmitsBearer } from '../contentQueryBearer';
import { assignTrait, reinforceTrait } from '../traits';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';

const FLAT_CURVE = { 1: 1, 2: 1, 3: 1, 4: 1 } as const;

function possessionRecipe(extra: Partial<ResolvedRewardRecipe> = {}): ResolvedRewardRecipe {
  return { categoryWeights: { possession: 1 }, tierCurve: { ...FLAT_CURVE }, badOutcomeChance: 0, ...extra };
}

function poolIds(graph: WorldGraph, recipe: ResolvedRewardRecipe, bearerId?: string): string[] {
  return assembleRewardPool(graph, recipe, bearerId).map(e => e.nodeId).sort();
}

describe('reward pool dedup against what the bearer holds (THR-1520)', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    for (const id of ['reward_arms_blade', 'reward_arms_spear']) {
      graph.addNode({
        id, type: 'artifact', name: id,
        properties: { subcategory: 'arms', tier: 1, tags: ['#weapon', '#iron'], mechanicalSummary: 'test' },
      });
    }
    graph.addNode({
      id: 'trait.condition.test_wound', type: 'trait', name: 'Test Wound',
      properties: { subcategory: 'condition', tier: 1, tags: ['#wound', '#negative'], maxLevel: 1, visibility: 'public', domainContributions: {} },
    });
    graph.addNode({
      id: 'reward_bestowed_sight', type: 'trait', name: 'Sight',
      properties: { subcategory: 'bestowed', tier: 1, tags: ['#bestowed'], maxLevel: 1, visibility: 'public', domainContributions: {} },
    });
    graph.addNode({
      id: 'trait.mastery.smithing', type: 'trait', name: 'Master Smith',
      properties: { subcategory: 'mastery', tags: ['#mastery', '#craft'], maxLevel: 3, visibility: 'public', domainContributions: {} },
    });
    for (const id of ['agent_a', 'agent_b']) {
      graph.addNode({ id, type: 'actor', name: id, properties: { subtype: 'individual' } });
    }
  });

  it('pre-fix arm: the recipe resolves to the template the bearer is about to be dealt', () => {
    const query = toContentQuery(possessionRecipe(), 'possession')!;
    const ids = resolveContentQuery(query, graphContentCatalogs(graph)).map(h => h.id);
    expect(ids).toContain('reward_arms_blade');
    // And the frozen behaviour: a bearer-less assembly offers it, dedup or no dedup.
    expect(poolIds(graph, possessionRecipe())).toEqual(['reward_arms_blade', 'reward_arms_spear']);
  });

  it('a bearer who already holds template X is never dealt X again; a bearer who does not still is', () => {
    const minted = instantiateReward(graph, 'reward_arms_blade', 'agent_a', 5);
    expect(minted?.category).toBe('possession');

    expect(poolIds(graph, possessionRecipe(), 'agent_a')).toEqual(['reward_arms_spear']);
    expect(poolIds(graph, possessionRecipe(), 'agent_b')).toEqual(['reward_arms_blade', 'reward_arms_spear']);
    // No bearer, no dedup — there is nobody to dedup against.
    expect(poolIds(graph, possessionRecipe())).toEqual(['reward_arms_blade', 'reward_arms_spear']);

    const detailed = assembleRewardPoolDetailed(graph, possessionRecipe(), 'agent_a');
    expect(detailed.excludedIds).toEqual(['reward_arms_blade']);
    expect(detailed.heldTemplateIds).toContain('reward_arms_blade');
    expect(detailed.bearerAdmitted).toBe(true);
  });

  it('pre-fix arm: a cloned prize wore its template\'s type and tags, so the by-type scan offered it as a candidate; the carve now skips it', () => {
    const minted = instantiateReward(graph, 'reward_arms_blade', 'agent_a', 5)!;
    const clone = graph.getNode(minted.instanceId)!;
    // The frozen pre-THR-1520 world carve: every node of the kind's type. The clone is one.
    const legacy = graph.getNodesByType('artifact').map(n => n.id);
    expect(legacy).toContain(minted.instanceId);
    expect(clone.properties.source).toBe('encounter_reward');
    // The resolver no longer returns it — to anyone.
    const ids = resolveContentQuery(toContentQuery(possessionRecipe(), 'possession')!, graphContentCatalogs(graph)).map(h => h.id);
    expect(ids).not.toContain(minted.instanceId);
    expect(ids).toEqual(['reward_arms_blade', 'reward_arms_spear']);
    // Falsification: strip the stamp and the clone is a candidate again.
    delete clone.properties.source;
    const stripped = resolveContentQuery(toContentQuery(possessionRecipe(), 'possession')!, graphContentCatalogs(graph)).map(h => h.id);
    expect(stripped).toContain(minted.instanceId);
  });

  it('a definition held directly on a has_trait edge is excluded too — conditions and powers, not only prizes', () => {
    const conditionRecipe = possessionRecipe({ categoryWeights: { condition: 1 } });
    expect(poolIds(graph, conditionRecipe, 'agent_a')).toEqual(['trait.condition.test_wound']);
    assignTrait(graph, 'agent_a', 'trait.condition.test_wound', { tick: 1, source: 'test' });
    expect(poolIds(graph, conditionRecipe, 'agent_a')).toEqual([]);
    expect(poolIds(graph, conditionRecipe, 'agent_b')).toEqual(['trait.condition.test_wound']);

    const powerRecipe = possessionRecipe({ categoryWeights: { bestowed_power: 1 } });
    expect(poolIds(graph, powerRecipe, 'agent_b')).toEqual(['reward_bestowed_sight']);
    instantiateReward(graph, 'reward_bestowed_sight', 'agent_b', 9);
    expect(poolIds(graph, powerRecipe, 'agent_b')).toEqual([]);
  });

  it('recovers the template id from the instance form instantiateReward writes — round-trip, not assumption', () => {
    const minted = instantiateReward(graph, 'reward_arms_blade', 'agent_a', 12)!;
    expect(minted.instanceId.startsWith(`${REWARD_INSTANTIATE_PREFIX}_agent_a_12_`)).toBe(true);
    expect(templateIdOfHeldInstance(minted.instanceId, 'agent_a')).toBe('reward_arms_blade');
    // The held list carries the instance *and* its template: the instance is an artifact
    // node the world view would otherwise offer back as a candidate.
    expect(heldTemplateIdsOf(graph, 'agent_a')).toEqual([minted.instanceId, 'reward_arms_blade'].sort());
    // Template ids carry underscores of their own; only the leading `<prefix>_<bearer>_<tick>_` is stripped.
    expect(templateIdOfHeldInstance(`${REWARD_INSTANTIATE_PREFIX}_agent_a_3_reward_arms_iron_long_blade`, 'agent_a')).toBe('reward_arms_iron_long_blade');
    // A definition held directly is already the template id.
    expect(templateIdOfHeldInstance('trait.condition.test_wound', 'agent_a')).toBe('trait.condition.test_wound');
    // Falsification: the wrong bearer's prefix is not stripped, so a form change cannot
    // silently pass by matching the prefix alone.
    expect(templateIdOfHeldInstance(`${REWARD_INSTANTIATE_PREFIX}_agent_b_3_reward_arms_blade`, 'agent_a'))
      .toBe(`${REWARD_INSTANTIATE_PREFIX}_agent_b_3_reward_arms_blade`);
  });

  it('the detailed resolve names what exclude removed, and the plain resolve is its hits', () => {
    const query = { ...toContentQuery(possessionRecipe(), 'possession')!, exclude: ['reward_arms_blade', 'not_a_candidate'] };
    const detailed = resolveContentQueryDetailed(query, graphContentCatalogs(graph));
    expect(detailed.hits.map(h => h.id)).toEqual(['reward_arms_spear']);
    // Only a candidate that matched every other term counts as removed.
    expect(detailed.excludedIds).toEqual(['reward_arms_blade']);
    expect(resolveContentQuery(query, graphContentCatalogs(graph))).toEqual(detailed.hits);
  });

  describe('traces', () => {
    beforeEach(() => { enableTracing(); clearTraces(); });
    afterEach(() => { clearTraces(); disableTracing(); });

    it('content.query_resolved carries the exclude count and the held list', () => {
      instantiateReward(graph, 'reward_arms_blade', 'agent_a', 5);
      const draw = drawSeededReward(graph, {
        recipe: { categoryWeights: { possession: 1 } }, outcomeType: 'critical_success',
        seed: 42, tick: 6, actorId: 'agent_a', templateId: 'encounter.test',
      });
      expect(draw.poolSize).toBe(1);
      expect(draw.drawnTemplateId).toBe('reward_arms_spear');
      const trace = getTraces().find(t => t.category === 'content.query_resolved') as
        { excludedCount?: number; query?: { exclude?: readonly string[] } } | undefined;
      expect(trace).toBeDefined();
      // One removed: the template. The bearer's own instance never matched — the carve
      // skips cloned prizes before exclude is consulted — so it is not counted twice.
      expect(trace!.excludedCount).toBe(1);
      expect(trace!.query?.exclude).toContain('reward_arms_blade');
    });

    it('content.query_empty distinguishes "already holds everything" from "matches nothing"', () => {
      instantiateReward(graph, 'reward_arms_blade', 'agent_a', 5);
      instantiateReward(graph, 'reward_arms_spear', 'agent_a', 6);
      const draw = drawSeededReward(graph, {
        recipe: { categoryWeights: { possession: 1 } }, outcomeType: 'critical_success',
        seed: 42, tick: 7, actorId: 'agent_a', templateId: 'encounter.test',
      });
      expect(draw.poolSize).toBe(0);
      const empty = getTraces().find(t => t.category === 'content.query_empty') as { excludedCount?: number; summary?: string } | undefined;
      expect(empty).toBeDefined();
      expect(empty!.excludedCount).toBe(2);
      expect(empty!.summary).toContain('already held');
    });
  });

  describe('the bearer-trait term (requiresBearerTrait)', () => {
    const gated = () => possessionRecipe({ requiresBearerTrait: { traitId: 'trait.mastery.smithing' } });

    it('the resolver is bearer-blind: identical hits with the term and without it', () => {
      const withTerm = toContentQuery(gated(), 'possession')!;
      const without = toContentQuery(possessionRecipe(), 'possession')!;
      expect(withTerm.requiresBearerTrait).toEqual({ traitId: 'trait.mastery.smithing' });
      const catalogs = graphContentCatalogs(graph);
      expect(resolveContentQuery(withTerm, catalogs)).toEqual(resolveContentQuery(without, catalogs));
      expect(describeContentQuery(withTerm)).toContain('?bearer:trait.mastery.smithing');
      expect(describeContentQuery(without)).not.toContain('?bearer');
    });

    it('rejects a bearer without the trait, admits one with it, and offers nothing with no bearer to judge', () => {
      expect(poolIds(graph, gated(), 'agent_a')).toEqual([]);
      expect(assembleRewardPoolDetailed(graph, gated(), 'agent_a').bearerAdmitted).toBe(false);
      // Unjudgeable: no bearer. Nothing offered rather than offered wrongly.
      expect(poolIds(graph, gated())).toEqual([]);
      expect(assembleRewardPoolDetailed(graph, gated()).bearerAdmitted).toBe(false);

      assignTrait(graph, 'agent_a', 'trait.mastery.smithing', { tick: 1, source: 'test' });
      expect(poolIds(graph, gated(), 'agent_a')).toEqual(['reward_arms_blade', 'reward_arms_spear']);
      expect(assembleRewardPoolDetailed(graph, gated(), 'agent_a').bearerAdmitted).toBe(true);
      // The other bearer is still refused — the term is judged per recipient.
      expect(poolIds(graph, gated(), 'agent_b')).toEqual([]);
    });

    it('routes through the one trait gate: tag refs and minLevel behave as every other predicate does', () => {
      assignTrait(graph, 'agent_a', 'trait.mastery.smithing', { tick: 1, source: 'test' });
      expect(contentQueryAdmitsBearer(graph, 'agent_a', { requiresBearerTrait: { traitId: '#craft' } })).toBe(true);
      expect(contentQueryAdmitsBearer(graph, 'agent_a', { requiresBearerTrait: { traitId: 'Master Smith' } })).toBe(true);
      expect(contentQueryAdmitsBearer(graph, 'agent_a', { requiresBearerTrait: { traitId: 'trait.mastery.smithing', minLevel: 2 } })).toBe(false);
      reinforceTrait(graph, 'agent_a', 'trait.mastery.smithing', 2);
      expect(contentQueryAdmitsBearer(graph, 'agent_a', { requiresBearerTrait: { traitId: 'trait.mastery.smithing', minLevel: 2 } })).toBe(true);
      // No term: everyone is admitted, bearer or not.
      expect(contentQueryAdmitsBearer(graph, undefined, {})).toBe(true);
      expect(contentQueryAdmitsBearer(graph, 'agent_b', {})).toBe(true);
    });

    it('the bad-outcome flip drops the term: a mortal who lacks the trait is not spared the wound', () => {
      const recipe = { categoryWeights: { possession: 1 }, requiresBearerTrait: { traitId: 'trait.mastery.smithing' } };
      // critical_failure flips to the harm table at BAD_OUTCOME_CHANCE_CRIT_FAILURE = 0.85;
      // find a seed whose first roll flips, then assert the harm pool was not gated.
      let sawBad = false;
      for (let seed = 0; seed < 40 && !sawBad; seed++) {
        const draw = drawSeededReward(graph, { recipe, outcomeType: 'critical_failure', seed, tick: 3, actorId: 'agent_a', templateId: 'encounter.test' });
        if (draw.isBadOutcome) {
          sawBad = true;
          expect(draw.poolSize).toBeGreaterThan(0);
          expect(draw.drawnTemplateId).toBe('trait.condition.test_wound');
        }
      }
      expect(sawBad).toBe(true);
    });
  });
});
