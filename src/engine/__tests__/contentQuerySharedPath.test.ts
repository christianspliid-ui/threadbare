/**
 * The shared-path test (THR-1487) — the proof that moving the reward pool onto the
 * content-query resolver did not change what the reward pool draws.
 *
 * **Why this file is the whole slice's load-bearing evidence.** THR-1481's Kill criterion
 * is stated as an executable one: *"If the shared-path test cannot be made byte-identical
 * for every shipped `RewardPoolRecipe`, the resolver is wrong."* The resolver is a new
 * matching rule replacing a live one that every prize in the game runs through; the only
 * honest way to ship that is to run both over the whole shipped corpus and compare the
 * candidate sets element by element.
 *
 * **The frozen predicate is a deliberate duplicate.** {@link legacyCandidateIds} below is
 * the pre-change rule — `rewardCategoryNodeQuery`'s node-type/subcategory carve plus
 * `rewardCandidateMatchesTags`' ALL-of filter — reimplemented here rather than imported.
 * That is the opposite of the usual rule against re-stating production logic in a test,
 * and it is correct exactly here: `getCandidateNodes` now *calls the resolver*, so a test
 * that compared the resolver to it would compare the resolver to itself and pass no
 * matter what broke (the `reference_fixture_invents_both_sides` shape). What is pinned is
 * the **historical behaviour**, which has no other home. It is allowed to go stale the
 * day someone deliberately changes what a reward draws — and then this test failing is
 * the notification that they did.
 *
 * **Falsification.** `perturbing one tag` below is the arm that proves the comparison can
 * fail: it takes a shipped recipe, adds a tag the corpus does not carry, and asserts both
 * sides go empty — and takes a recipe with a real filter, drops the filter, and asserts
 * both sides *grow*. A comparison of two empty sets is not evidence, so the corpus sweep
 * additionally asserts that a non-trivial number of recipes resolved to something.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import {
  STARTER_POSSESSIONS,
  STARTER_CONDITIONS,
} from '../../data/starter-attachments';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
  TREASURE_MAPS,
} from '../../data/reward-attachment-catalog';
import {
  ANOMALY_SIGNATURE_ARTIFACTS,
  ANOMALY_BESTOWED_POWERS,
  ANOMALY_CONDITIONS,
} from '../../data/anomaly-reward-catalog';
import { allSpellDefinitionNodes } from '../../data/spell-templates';
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../../data/unified-action-templates';
import { rewardCategoryNodeQuery, rewardCandidateMatchesTags, toContentQuery } from '../rewardPool';
import { resolveContentQuery, graphContentCatalogs } from '../contentQuery';
import { allTemplateRewardRecipes } from '../nudgeGrantLiveness';
import type { AttachmentCategory, RewardPoolRecipe } from '../../types/attachments';
import { ATTACHMENT_CATEGORIES } from '../../types/attachments';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── The world the two sides read ───────────────────────────────────

/**
 * Every attachment node the world seeds, in a real graph.
 *
 * The graph rather than the catalog arrays because the *runtime* path reads the graph,
 * and a comparison over the arrays would prove the gate and leave the thing that pays
 * out prizes unproven.
 */
function seededGraph(): WorldGraph {
  const graph = new WorldGraph();
  const nodes = [
    ...STARTER_POSSESSIONS,
    ...STARTER_CONDITIONS,
    ...REWARD_POSSESSIONS,
    ...TREASURE_MAPS,
    ...REWARD_CONDITIONS,
    ...REWARD_BESTOWED_POWERS,
    ...allSpellDefinitionNodes(),
    ...ANOMALY_SIGNATURE_ARTIFACTS,
    ...ANOMALY_BESTOWED_POWERS,
    ...ANOMALY_CONDITIONS,
  ] as unknown as GraphNode[];
  for (const node of nodes) graph.addNode(node);
  return graph;
}

// ─── The frozen pre-change predicate ────────────────────────────────

/** The rule as it stood before THR-1487, verbatim in behaviour. Do not refactor onto the resolver. */
function legacyCandidateIds(
  graph: WorldGraph,
  category: AttachmentCategory,
  tagFilters?: readonly string[],
): string[] {
  const query = rewardCategoryNodeQuery(category);
  if (!query) return [];
  let nodes = graph.getNodesByType(query.nodeType);
  if (query.subcategory) {
    nodes = nodes.filter(n => n.properties.subcategory === query.subcategory);
  }
  nodes = nodes.filter(n => rewardCandidateMatchesTags(n.properties.tags, tagFilters));
  return nodes.map(n => n.id).sort();
}

/** The new rule, reduced to the same shape: a sorted list of ids. */
function resolverCandidateIds(
  graph: WorldGraph,
  category: AttachmentCategory,
  tagFilters?: readonly string[],
): string[] {
  const query = toContentQuery({ categoryWeights: {}, tagFilters: tagFilters as string[] | undefined }, category);
  if (!query) return [];
  return resolveContentQuery(query, graphContentCatalogs(graph)).map(h => h.id).sort();
}

// ─── Every shipped recipe ───────────────────────────────────────────

const ALL_TEMPLATES: readonly UnifiedActionTemplate[] = [
  ...UNIFIED_ACTION_TEMPLATES,
  ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
];

/**
 * Every `RewardPoolRecipe` in the corpus — reaction effects, band overrides, and the
 * step route — walked by the production walker so the sweep cannot miss a site the gate
 * covers (or cover one the gate does not).
 */
function shippedRecipes(): { templateId: string; site: string; recipe: RewardPoolRecipe }[] {
  const out: { templateId: string; site: string; recipe: RewardPoolRecipe }[] = [];
  for (const template of ALL_TEMPLATES) {
    for (const { recipe, site } of allTemplateRewardRecipes(template)) {
      out.push({ templateId: template.id, site, recipe });
    }
  }
  return out;
}

describe('content query — shared path with the reward pool (THR-1487)', () => {
  const graph = seededGraph();
  const recipes = shippedRecipes();

  it('the corpus actually holds recipes to compare (the sweep is not vacuous)', () => {
    expect(recipes.length).toBeGreaterThan(10);
    // And the graph holds the content they draw from.
    expect(graph.getNodesByType('artifact').length).toBeGreaterThan(50);
    expect(graph.getNodesByType('trait').length).toBeGreaterThan(20);
  });

  it('every shipped recipe resolves an identical candidate set, category by category', () => {
    let compared = 0;
    let nonEmpty = 0;
    const divergences: string[] = [];

    for (const { templateId, site, recipe } of recipes) {
      for (const category of Object.keys(recipe.categoryWeights) as AttachmentCategory[]) {
        const weight = recipe.categoryWeights[category];
        if (!weight || weight <= 0) continue;
        compared++;
        const legacy = legacyCandidateIds(graph, category, recipe.tagFilters);
        const resolved = resolverCandidateIds(graph, category, recipe.tagFilters);
        if (legacy.length > 0) nonEmpty++;
        if (JSON.stringify(legacy) !== JSON.stringify(resolved)) {
          divergences.push(
            `${templateId} @ ${site} [${category}] tags=${JSON.stringify(recipe.tagFilters ?? [])}: `
            + `legacy ${legacy.length} vs resolver ${resolved.length}`,
          );
        }
      }
    }

    expect(divergences).toEqual([]);
    expect(compared).toBeGreaterThan(10);
    // A sweep where every side came up empty would pass trivially.
    expect(nonEmpty).toBeGreaterThan(0);
  });

  it('is identical for every category × every shipped tag filter, not only the pairs authored together', () => {
    // The corpus pairs categories with filters sparsely; this crosses them, so a
    // divergence that happens to sit in an unauthored combination is still caught.
    const filters: (readonly string[] | undefined)[] = [
      undefined,
      [],
      ...new Set(recipes.map(r => JSON.stringify(r.recipe.tagFilters ?? []))),
    ].map(f => (typeof f === 'string' ? (JSON.parse(f) as string[]) : f));

    const divergences: string[] = [];
    for (const category of ATTACHMENT_CATEGORIES) {
      for (const tagFilters of filters) {
        const legacy = legacyCandidateIds(graph, category, tagFilters);
        const resolved = resolverCandidateIds(graph, category, tagFilters);
        if (JSON.stringify(legacy) !== JSON.stringify(resolved)) {
          divergences.push(`${category} tags=${JSON.stringify(tagFilters)}: ${legacy.length} vs ${resolved.length}`);
        }
      }
    }
    expect(divergences).toEqual([]);
  });

  it('a tagless node fails a non-empty filter on both sides, and passes an empty one', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'artifact_untagged', name: 'Untagged', type: 'artifact', properties: { subcategory: 'arms', tier: 2 } } as unknown as GraphNode);
    expect(legacyCandidateIds(g, 'possession', ['#weapon'])).toEqual([]);
    expect(resolverCandidateIds(g, 'possession', ['#weapon'])).toEqual([]);
    expect(legacyCandidateIds(g, 'possession', [])).toEqual(['artifact_untagged']);
    expect(resolverCandidateIds(g, 'possession', [])).toEqual(['artifact_untagged']);
  });

  it('a bestowed-power query never returns a learned spell, on either side', () => {
    // The one place the kind carves and the category does not: `power_template` holds
    // both classes, `bestowed_power` wants one. A resolver that forgot `classes` would
    // widen every bestowed draw to include the spell library.
    const spellIds = new Set(allSpellDefinitionNodes().map(n => n.id));
    expect(spellIds.size).toBeGreaterThan(0);
    const resolved = resolverCandidateIds(graph, 'bestowed_power');
    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved.filter(id => spellIds.has(id))).toEqual([]);
    expect(resolved).toEqual(legacyCandidateIds(graph, 'bestowed_power'));
  });

  describe('the condition pool — the second site moved onto the resolver', () => {
    /** `conditionPool` as it stood before THR-1487. Frozen for the same reason as above. */
    function legacyConditionPool(g: WorldGraph, tag: string, tierCap: number): string[] {
      return g.getNodesByType('trait')
        .filter(n => {
          if (n.properties.subcategory !== 'condition') return false;
          const tags = n.properties.tags;
          if (!Array.isArray(tags) || !tags.includes(tag)) return false;
          const tier = typeof n.properties.tier === 'number' ? n.properties.tier : null;
          return tier === null || tier <= tierCap;
        })
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(n => n.id);
    }

    function resolvedConditionPool(g: WorldGraph, tag: string, tierCap: number): string[] {
      return resolveContentQuery(
        { kind: 'condition_template', classes: ['condition'], tags: [tag], tier: { max: tierCap as 1 | 2 | 3 | 4 } },
        graphContentCatalogs(g),
      ).map(h => h.id);
    }

    // The two tags the undertaking verbs actually pass, at the two caps the bands use.
    it.each([
      ['#blessing', 1], ['#blessing', 2], ['#curse', 1], ['#curse', 2],
    ])('is identical for %s at tier cap %i, in the same order', (tag, cap) => {
      const legacy = legacyConditionPool(graph, tag as string, cap as number);
      expect(legacy.length).toBeGreaterThan(0);
      expect(resolvedConditionPool(graph, tag as string, cap as number)).toEqual(legacy);
    });

    it('an untiered condition passes every cap, on both sides', () => {
      const g = new WorldGraph();
      g.addNode({ id: 'trait_untiered_blessing', name: 'Untiered', type: 'trait', properties: { subcategory: 'condition', tags: ['#blessing'] } } as unknown as GraphNode);
      g.addNode({ id: 'trait_tier4_blessing', name: 'Tier four', type: 'trait', properties: { subcategory: 'condition', tags: ['#blessing'], tier: 4 } } as unknown as GraphNode);
      expect(legacyConditionPool(g, '#blessing', 1)).toEqual(['trait_untiered_blessing']);
      expect(resolvedConditionPool(g, '#blessing', 1)).toEqual(['trait_untiered_blessing']);
    });

    it('a scar is never returned by the condition pool, on either side', () => {
      const g = new WorldGraph();
      g.addNode({ id: 'trait_scar_x', name: 'Scar', type: 'trait', properties: { subcategory: 'scar', tags: ['#curse'], tier: 1 } } as unknown as GraphNode);
      expect(legacyConditionPool(g, '#curse', 2)).toEqual([]);
      expect(resolvedConditionPool(g, '#curse', 2)).toEqual([]);
    });
  });

  describe('falsification — the comparison can fail', () => {
    it('perturbing one tag empties both sides', () => {
      const perturbed = ['#a-tag-no-entry-carries-thr1487'];
      expect(legacyCandidateIds(graph, 'possession', perturbed)).toEqual([]);
      expect(resolverCandidateIds(graph, 'possession', perturbed)).toEqual([]);
    });

    it('dropping a real filter grows both sides by the same amount', () => {
      const filtered = legacyCandidateIds(graph, 'possession', ['#weapon']);
      const unfiltered = legacyCandidateIds(graph, 'possession');
      expect(filtered.length).toBeGreaterThan(0);
      expect(unfiltered.length).toBeGreaterThan(filtered.length);
      expect(resolverCandidateIds(graph, 'possession', ['#weapon'])).toEqual(filtered);
      expect(resolverCandidateIds(graph, 'possession')).toEqual(unfiltered);
    });

    it('the frozen predicate and the resolver disagree when the resolver is asked the wrong question', () => {
      // Proof the equality above is not an artefact of both sides asking the same
      // thing: ask the resolver for the *other* class of Power and the sets differ.
      const bestowed = resolverCandidateIds(graph, 'bestowed_power');
      const spells = resolveContentQuery(
        { kind: 'power_template', classes: ['spell'] },
        graphContentCatalogs(graph),
      ).map(h => h.id).sort();
      expect(spells.length).toBeGreaterThan(0);
      expect(spells).not.toEqual(bestowed);
    });
  });
});
