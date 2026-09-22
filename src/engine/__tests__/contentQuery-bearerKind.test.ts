/**
 * THR-790 — the bearer-kind carve on `condition_template`.
 *
 * The defect this pins: `condition_template` was every `trait` node of class
 * `condition` / `scar`, which since THR-1143 has included the place's conditions
 * (`trait.condition.location.*`), so an untagged `condition` recipe could deal a
 * mortal *Festival*. The carve excludes ids under `LOCATION_CONDITION_ID_PREFIX`
 * unless the query names the place class.
 *
 * **The pre-fix arm is the load-bearing test.** A guard that only asserts the
 * post-fix set is empty of location ids would pass against a corpus that never had
 * any; the frozen pre-change predicate below proves the location ids *were* in the
 * set the resolver used to return, so the exclusion is measured, not assumed.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { CONDITION_TRAIT_DEFINITIONS, LOCATION_CONDITION_IDS, LOCATION_CONDITION_ID_PREFIX } from '../../data/condition-trait-content';
import { REWARD_CONDITIONS } from '../../data/reward-attachment-catalog';
import { STARTER_CONDITIONS } from '../../data/starter-attachments';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import {
  LOCATION_BEARER_CLASS,
  graphContentCatalogs,
  nodeContentCatalogs,
  resolveContentQuery,
} from '../contentQuery';
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../../data/unified-action-templates';
import { allTemplateRewardRecipes } from '../nudgeGrantLiveness';
import { toContentQuery } from '../rewardPool';

/** Every condition node a seeded world holds — the universe the reward pool draws from. */
const CONDITION_NODES: readonly GraphNode[] = [
  ...CONDITION_TRAIT_DEFINITIONS,
  ...REWARD_CONDITIONS,
  ...STARTER_CONDITIONS,
];

/**
 * The rule as it stood before THR-790, frozen: every `trait` node whose
 * `subcategory` is `condition` or `scar`. Reimplemented rather than imported —
 * importing the resolver would compare it to itself.
 */
function legacyConditionCandidateIds(nodes: readonly GraphNode[]): string[] {
  return nodes
    .filter(n => n.type === 'trait')
    .filter(n => n.properties.subcategory === 'condition' || n.properties.subcategory === 'scar')
    .map(n => n.id)
    .sort();
}

function resolverIds(query: Parameters<typeof resolveContentQuery>[0], nodes: readonly GraphNode[] = CONDITION_NODES): string[] {
  return resolveContentQuery(query, nodeContentCatalogs(nodes)).map(h => h.id).sort();
}

const LOCATION_IDS = [...LOCATION_CONDITION_IDS].sort();

describe('condition_template — the bearer-kind carve (THR-790)', () => {
  it('pre-fix arm: the frozen predicate returned location conditions to an untagged condition query', () => {
    const legacy = legacyConditionCandidateIds(CONDITION_NODES);
    const leaked = legacy.filter(id => id.startsWith(LOCATION_CONDITION_ID_PREFIX));
    // Falsification: this is what a mortal could be dealt. Ten today — the six
    // aftermath-planted and the four minted — and the arm fails if the prefix stops
    // being what declares a place's condition.
    expect(leaked.length).toBeGreaterThanOrEqual(6);
    expect(leaked).toEqual(LOCATION_IDS);
    expect(leaked).toContain('trait.condition.location.festival');
  });

  it('post-fix: an untagged condition_template query returns no location condition, and everything else the legacy set had', () => {
    const legacy = legacyConditionCandidateIds(CONDITION_NODES);
    const resolved = resolverIds({ kind: 'condition_template' });
    expect(resolved.some(id => id.startsWith(LOCATION_CONDITION_ID_PREFIX))).toBe(false);
    expect(resolved).toEqual(legacy.filter(id => !id.startsWith(LOCATION_CONDITION_ID_PREFIX)));
  });

  it("the reward pool's own condition query (classes: ['condition']) excludes them too", () => {
    const resolved = resolverIds({ kind: 'condition_template', classes: ['condition'] });
    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved.some(id => id.startsWith(LOCATION_CONDITION_ID_PREFIX))).toBe(false);
  });

  it("classes: ['location'] is the opt-in path — it admits exactly the place's conditions", () => {
    expect(resolverIds({ kind: 'condition_template', classes: [LOCATION_BEARER_CLASS] })).toEqual(LOCATION_IDS);
    // With the class word beside the subcategory, the subcategory still narrows.
    expect(resolverIds({ kind: 'condition_template', classes: [LOCATION_BEARER_CLASS, 'condition'] })).toEqual(LOCATION_IDS);
    expect(resolverIds({ kind: 'condition_template', classes: [LOCATION_BEARER_CLASS, 'scar'] })).toEqual([]);
  });

  it('a tagged opt-in query narrows the way any query does', () => {
    expect(resolverIds({ kind: 'condition_template', classes: [LOCATION_BEARER_CLASS], tags: ['#social'] })).toEqual(
      ['trait.condition.location.festival', LOCATION_TRAIT_IDS.welcoming].sort(),
    );
  });

  it('the four minted ids are location conditions by construction', () => {
    for (const id of Object.values(LOCATION_TRAIT_IDS)) {
      expect(id.startsWith(LOCATION_CONDITION_ID_PREFIX)).toBe(true);
      expect(LOCATION_CONDITION_IDS).toContain(id);
    }
  });

  it('the live-world view carves the same way as the node view', () => {
    const graph = new WorldGraph();
    for (const node of CONDITION_NODES) if (!graph.getNode(node.id)) graph.addNode(node);
    const live = resolveContentQuery({ kind: 'condition_template' }, graphContentCatalogs(graph)).map(h => h.id).sort();
    expect(live).toEqual(resolverIds({ kind: 'condition_template' }));
    expect(live.some(id => id.startsWith(LOCATION_CONDITION_ID_PREFIX))).toBe(false);
  });

  it('no shipped condition recipe can deal a mortal a place condition any more', () => {
    // The 45-recipe blast the plan measured, swept through the production walker so
    // the sweep cannot miss a route the gate covers.
    const templates = [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES];
    let conditionRecipes = 0;
    const leaks: string[] = [];
    for (const template of templates) {
      for (const { recipe, site } of allTemplateRewardRecipes(template)) {
        if (!recipe.categoryWeights || !('condition' in recipe.categoryWeights)) continue;
        const query = toContentQuery(recipe, 'condition');
        if (!query) continue;
        conditionRecipes += 1;
        for (const id of resolverIds(query)) {
          if (id.startsWith(LOCATION_CONDITION_ID_PREFIX)) leaks.push(`${template.id} ${site} → ${id}`);
        }
      }
    }
    // Anti-vacuity: the sweep read real recipes.
    expect(conditionRecipes).toBeGreaterThan(20);
    expect(leaks).toEqual([]);
  });
});
