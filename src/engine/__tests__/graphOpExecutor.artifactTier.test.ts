/**
 * advance_artifact_tier graph-op tests (THR-996 — the production caller
 * `advanceAttachmentTier` never had).
 *
 * The resolver's own behaviour (scaling, clamping, fail-soft) is covered by
 * `attachmentTierAdvancement.test.ts`. What THR-996 added, and what these tests
 * pin, is the **wiring**: that the resolver is reachable from a real action.
 * Three things had to be true at once and none of them were before:
 *
 *   1. the op exists and routes through `executeGraphOps`, as the action pipeline
 *      fires it (resolution forwards step ops via `graphOnlyOps`);
 *   2. `artifact.enchant` and `artifact.empower` actually carry it in `onSuccess`,
 *      so the templates are not empty-op no-ops that merely charge essence;
 *   3. the effect lands on the **live** substrate — `collectStatContributions`,
 *      the bag `computeRawScore` sums inside its possesses/bonded_to walk — so the
 *      bearer's sheet really moves. Asserting the `tier` numeral alone would pass
 *      against a build where advancement strengthened nothing readable.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { AttachmentEffect } from '../../types/effects';
import { collectStatContributions } from '../effects/effectQueries';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import {
  TIER_ADVANCEMENT_TEMPLATE_IDS,
  TIER_MODIFIER_SCALE_FACTOR,
  MAX_ATTACHMENT_TIER,
} from '../../data/attachment-tier-content';
import { ITEM_STAT_BAND_LEGENDARY } from '../../data/item-stat-bands';

const ascendantId = 'asc.player';
const artifactId = 'art.blade';

const ctx: GraphOpContext = {
  actorId: ascendantId,
  targetId: artifactId,
  locationId: artifactId,
  tick: 42,
};

const advance: GraphOp[] = [{ op: 'advance_artifact_tier', nodeId: '$target' }];

/** An artifact at `tier` carrying one `stat_contribution` of `iron: value`. */
function makeGraph(
  tier = 1,
  value = 0.4,
  artifactType: 'artifact' | 'artifact_legendary' = 'artifact',
): WorldGraph {
  const graph = new WorldGraph();
  resetOpCounter();
  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: 'The Warden',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({
    id: artifactId,
    type: artifactType,
    name: 'Grey Blade',
    properties: {
      tier,
      subcategory: 'arms',
      effects: [
        { type: 'stat_contribution', contributions: { iron: value } },
      ] as AttachmentEffect[],
    },
  });
  return graph;
}

const tierOf = (graph: WorldGraph): number =>
  graph.getNode(artifactId)?.properties.tier as number;

/** Read through the same query `computeRawScore` uses, not the raw effects array. */
const ironOf = (graph: WorldGraph): number =>
  collectStatContributions(graph.getNode(artifactId)).iron ?? 0;

describe('advance_artifact_tier op', () => {
  it('advances the tier and strengthens the live stat substrate', () => {
    const graph = makeGraph(1, 0.4);
    const before = ironOf(graph);

    const result = executeGraphOps(graph, advance, ctx);

    expect(result.allSucceeded).toBe(true);
    expect(tierOf(graph)).toBe(2);
    expect(ironOf(graph)).toBeCloseTo(before * TIER_MODIFIER_SCALE_FACTOR, 5);
    // The assertion that matters: the bearer's readable capability actually rose.
    expect(ironOf(graph)).toBeGreaterThan(before);
  });

  it('compounds across repeated advances, up to the tier cap', () => {
    const graph = makeGraph(1, 0.2);

    for (let i = 0; i < MAX_ATTACHMENT_TIER - 1; i++) {
      expect(executeGraphOps(graph, advance, ctx).allSucceeded).toBe(true);
    }

    expect(tierOf(graph)).toBe(MAX_ATTACHMENT_TIER);
    expect(ironOf(graph)).toBeGreaterThan(0.2);
    // Clamped, so compounding cannot become a back door around the power budget.
    expect(ironOf(graph)).toBeLessThanOrEqual(ITEM_STAT_BAND_LEGENDARY);
  });

  it('reports failure at max tier rather than silently succeeding', () => {
    // The essence is already spent by the time the op runs, so a no-op reporting
    // success would be indistinguishable from a real advance on every surface.
    const graph = makeGraph(MAX_ATTACHMENT_TIER, 0.4);
    const before = ironOf(graph);

    const result = executeGraphOps(graph, advance, ctx);

    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toContain('already_max_tier');
    expect(ironOf(graph)).toBe(before);
  });

  it('is fail-soft on a missing or non-artifact target', () => {
    const graph = makeGraph();
    graph.addNode({
      id: 'not.art',
      type: 'actor',
      name: 'A Person',
      properties: { actorType: 'individual' },
    });

    const missing = executeGraphOps(graph, [{ op: 'advance_artifact_tier', nodeId: 'nope' }], ctx);
    const wrongType = executeGraphOps(graph, [{ op: 'advance_artifact_tier', nodeId: 'not.art' }], ctx);

    expect(missing.allSucceeded).toBe(false);
    expect(wrongType.allSucceeded).toBe(false);
    expect(missing.results[0].error).toContain('advance_artifact_tier');
    expect(wrongType.results[0].error).toContain('is not an artifact');
  });

  it('advances a legendary-tier artifact node too', () => {
    // THR-843 precedent: the artifact verbs act on both artifact node types.
    const graph = makeGraph(1, 0.4, 'artifact_legendary');
    expect(executeGraphOps(graph, advance, ctx).allSucceeded).toBe(true);
    expect(tierOf(graph)).toBe(2);
  });
});

describe('tier-advancement templates fire the op', () => {
  // Guards the wiring itself. Before THR-996 both templates carried `onSuccess: []`
  // — they charged essence, narrated, and changed nothing. This is the assertion
  // that fails against that build.
  it.each([...TIER_ADVANCEMENT_TEMPLATE_IDS])('%s carries advance_artifact_tier in onSuccess', (id) => {
    const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === id);
    expect(template, `${id} must exist in UNIFIED_ACTION_TEMPLATES`).toBeDefined();

    const ops = template!.steps.flatMap((step) =>
      'onSuccess' in step ? step.onSuccess : [],
    );
    expect(ops.map((o) => o.op)).toContain('advance_artifact_tier');
  });

  it('reaches both verbs through different reaches, so they are not duplicates', () => {
    // `attachment-tier-content.ts` authors Enchant as Veil/Rune and Empower as
    // Iron/Stone. Same mechanical move, two different capability rolls — otherwise
    // the second verb is a reskin that adds a catalog row and nothing else.
    const reaches = TIER_ADVANCEMENT_TEMPLATE_IDS.map(
      (id) => UNIFIED_ACTION_TEMPLATES.find((t) => t.id === id)?.reach,
    );
    expect(new Set(reaches).size).toBe(TIER_ADVANCEMENT_TEMPLATE_IDS.length);
  });
});
