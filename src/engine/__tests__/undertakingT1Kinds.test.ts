/**
 * Tier 1 shipped whole — THR-1297 §5, slice 5.
 *
 * Five kinds, each with a create verb, an update verb and a motive-gated counter-play,
 * plus the six graph ops their objects are made of. This file proves three things the
 * kind rows alone cannot:
 *
 * 1. **The ops write into economies that already have consumers.** A find that only
 *    the finder can read is a score, not a kind — so each op is asserted against the
 *    edge/possession shape the existing systems consume, required properties included.
 * 2. **The leverage arc is genuinely sequential.** `press_the_mark` refuses without a
 *    held mark, which is what makes cultivate → press → burn an arc rather than three
 *    verbs sharing a noun. The refusal is paired with its flip: the same fixture, the
 *    same call, succeeding once the mark exists.
 * 3. **Nothing authored here is dead content.** Candidate generation runs off ambition
 *    `strategicProfile.templateIds`, so a template in no profile can never be offered
 *    to anyone, ever — invisible by construction rather than merely rare.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  spawnClue,
  seedKnowsOf,
  mintTreasureMap,
  mintLeverageMark,
  pressTheMark,
  mintMasterwork,
} from '../strategicGraphOps';
import { getAllStrategicTemplates, getStrategicTemplate } from '../strategicActionCandidates';
import { UNDERTAKING_KIND_ROWS } from '../../data/undertaking-kinds';
import {
  AMBITION_TEMPLATES,
  REACTIVE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../../data/ambition-templates';
import { EDGE_SCHEMA } from '../../types/edgeSchema';
import type { EdgeType } from '../../types/graph';
import { POSSESSION_SUBCATEGORIES } from '../../types/attachments';
import { getAttachmentArtUrl } from '../../data/artifact-category-art';

const ACTOR = 'actor_wanderer';
const SUBJECT = 'actor_clerk';
const SITE = 'loc_ruin';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR, name: 'Sila Vane', type: 'actor',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: SUBJECT, name: 'Corran Ashe', type: 'actor',
    properties: { actorType: 'individual', npcRole: 'clerk' },
  });
  graph.addNode({
    id: SITE, name: 'The Sunken Vault', type: 'location',
    properties: { locationSubtype: 'ruins', hexCol: 3, hexRow: 4 },
  });
  return graph;
}

/** Every property the edge's schema row declares required must actually be written. */
function assertSchemaSatisfied(graph: WorldGraph, edgeId: string, edgeType: EdgeType) {
  const edge = graph.getEdge(edgeId);
  expect(edge, `edge ${edgeId} was not written`).toBeDefined();
  for (const prop of EDGE_SCHEMA[edgeType]!.requiredProperties) {
    expect(
      prop in edge!.properties,
      `${edgeType} is missing required property '${prop}' — the schema warns, and the consumers read it`,
    ).toBe(true);
  }
}

// ─── The explorer economy ───────────────────────────────────────────

describe('spawn_clue', () => {
  it('writes a clue carrying every property the ruins layer converges on', () => {
    const graph = world();
    const result = spawnClue(graph, ACTOR, SITE, 12, 0.6, 0.7, 'followed from a chart');

    expect(result.success).toBe(true);
    assertSchemaSatisfied(graph, result.createdId!, 'knows_clue_of');
    expect(graph.getEdge(result.createdId!)!.properties.consumed).toBe(false);
  });

  it('refuses a second live clue about the same place', () => {
    // The ruins layer consumes the *first* unconsumed clue, so a pile of duplicates
    // would read as one find repeated forever rather than as deeper knowledge.
    const graph = world();
    spawnClue(graph, ACTOR, SITE, 12, 0.6, 0.7);
    const second = spawnClue(graph, ACTOR, SITE, 13, 0.6, 0.7);

    expect(second.success).toBe(false);
    expect(second.error).toBe('clue_already_held');
  });

  it('re-clues a place whose earlier lead was already spent', () => {
    // The flip of the guard above: idempotence is per *live* clue, not per place —
    // otherwise a site could be surveyed exactly once in a world's lifetime.
    const graph = world();
    const first = spawnClue(graph, ACTOR, SITE, 12, 0.6, 0.7);
    const edge = graph.getEdge(first.createdId!)!;
    graph.updateEdge(edge.id, { properties: { ...edge.properties, consumed: true } });

    expect(spawnClue(graph, ACTOR, SITE, 20, 0.6, 0.7).success).toBe(true);
  });

  it('refuses an actor-to-actor clue — the schema is enforced, not assumed', () => {
    const result = spawnClue(world(), ACTOR, SUBJECT, 12, 0.6, 0.7);
    expect(result.success).toBe(false);
  });
});

describe('seed_knows_of', () => {
  it('stamps familiarity', () => {
    const graph = world();
    const result = seedKnowsOf(graph, ACTOR, SITE, 12);

    expect(result.success).toBe(true);
    expect(graph.getEdge(result.createdId!)!.type).toBe('knows_of');
  });

  it('refuses a duplicate — familiarity is a fact, not a counter', () => {
    const graph = world();
    seedKnowsOf(graph, ACTOR, SITE, 12);
    expect(seedKnowsOf(graph, ACTOR, SITE, 30).error).toBe('already_known');
  });
});

describe('mint_treasure_map', () => {
  it('mints a possession the existing consumption sweep can spend', () => {
    const graph = world();
    const result = mintTreasureMap(graph, ACTOR, SITE, 12);

    expect(result.success).toBe(true);
    const map = graph.getNode(result.createdId!)!;
    // `consumeOnEvent` is the join to `treasureMapConsumption`. Without it the map is
    // minted into a lifecycle nothing ever ends — a possession that can never be spent.
    expect(map.properties.consumeOnEvent).toBe('hidden_site_discovered');
    expect(map.properties.mapsToLocationId).toBe(SITE);
    expect(
      graph.getOutgoingEdges(ACTOR, 'possesses').some(e => e.target === map.id),
      'the map must be *held*, which is what makes it takeable',
    ).toBe(true);
  });

  it('refuses a duplicate map to the same site', () => {
    const graph = world();
    mintTreasureMap(graph, ACTOR, SITE, 12);
    expect(mintTreasureMap(graph, ACTOR, SITE, 40).error).toBe('map_already_held');
  });
});

// ─── The leverage arc ───────────────────────────────────────────────

describe('the leverage mark — cultivate, press, and the order between them', () => {
  it('mints a hold carrying every property Secrets & Favors presses', () => {
    const graph = world();
    const result = mintLeverageMark(graph, ACTOR, SUBJECT, 'indiscretion', 0.6, 12);

    expect(result.success).toBe(true);
    assertSchemaSatisfied(graph, result.createdId!, 'knows_secret_of');
    // An unrevealed secret is the whole value; a revealed one is spent.
    expect(graph.getEdge(result.createdId!)!.properties.revealed).toBe(false);
  });

  it('refuses a mark on oneself', () => {
    expect(mintLeverageMark(world(), ACTOR, ACTOR, 'indiscretion', 0.6, 12).error)
      .toBe('self_target');
  });

  it('refuses to press a mark that was never cultivated', () => {
    // The assertion that makes the arc an arc. Without it, "press" is a verb any
    // actor may aim at any stranger, and the create step buys nothing.
    const result = pressTheMark(world(), ACTOR, SUBJECT, 0.5, 'a silence kept', 20);

    expect(result.success).toBe(false);
    expect(result.error).toBe('no_mark_held');
  });

  it('presses the same fixture successfully once the mark exists — the flip', () => {
    const graph = world();
    mintLeverageMark(graph, ACTOR, SUBJECT, 'indiscretion', 0.6, 12);
    const result = pressTheMark(graph, ACTOR, SUBJECT, 0.5, 'a silence kept', 20);

    expect(result.success).toBe(true);
    assertSchemaSatisfied(graph, result.createdId!, 'owes_favor');

    // Direction matters: the *subject* owes the holder, not the other way round.
    const debt = graph.getEdge(result.createdId!)!;
    expect(debt.source).toBe(SUBJECT);
    expect(debt.target).toBe(ACTOR);
  });

  it('spends part of the hold when it is pressed, without destroying it', () => {
    // A secret used is a secret partly out. Burning it is a separate, deliberate act,
    // so pressing must leave the mark standing or `burn` would have nothing to spend.
    const graph = world();
    const mark = mintLeverageMark(graph, ACTOR, SUBJECT, 'indiscretion', 0.6, 12);
    pressTheMark(graph, ACTOR, SUBJECT, 0.5, 'a silence kept', 20);

    const after = graph.getEdge(mark.createdId!)!;
    expect(after).toBeDefined();
    expect(after.properties.magnitude as number).toBeLessThan(0.6);
    expect(after.properties.magnitude as number).toBeGreaterThanOrEqual(0);
  });

  it('refuses a second identical mark, so pressing is the update path', () => {
    const graph = world();
    mintLeverageMark(graph, ACTOR, SUBJECT, 'indiscretion', 0.6, 12);
    expect(mintLeverageMark(graph, ACTOR, SUBJECT, 'indiscretion', 0.9, 30).error)
      .toBe('mark_already_held');
  });
});

// ─── The masterwork ─────────────────────────────────────────────────

describe('mint_masterwork', () => {
  it('mints an artifact the maker holds — the kind whose object is already an attachment', () => {
    const graph = world();
    const result = mintMasterwork(graph, ACTOR, 'masterwork', 12);

    expect(result.success).toBe(true);
    const item = graph.getNode(result.createdId!)!;
    expect(item.type).toBe('artifact');
    expect(item.properties.craftedBy).toBe(ACTOR);
    expect(graph.getOutgoingEdges(ACTOR, 'possesses').some(e => e.target === item.id)).toBe(true);
  });

  it('lets one maker make more than one thing', () => {
    // Deliberately *not* idempotent per maker: collapsing successive pieces would make
    // a smith's second masterwork silently fail, which is a career-ending guard.
    const graph = world();
    expect(mintMasterwork(graph, ACTOR, 'masterwork', 12).success).toBe(true);
    expect(mintMasterwork(graph, ACTOR, 'masterwork', 40).success).toBe(true);
  });
});

// ─── Minted possessions are real possessions ────────────────────────

describe('every minted artifact is a well-formed possession', () => {
  /**
   * Both artifact-minting ops shipped first with `subcategory: 'tool'` and a string
   * `tier`, neither of which exists: `PossessionSubcategory` has seven members and
   * `AttachmentTier` is numeric 1–4. Nothing threw — the art resolver simply returned
   * `null` forever, so the items would have rendered as blank plates in every surface
   * that shows a possession.
   *
   * It was caught by the seeded-world art-coverage test rather than by anything here,
   * and only because a chart happened to be minted in that world. A masterwork carried
   * the identical bug and was invisible to it, because that world minted none. So this
   * asserts the property directly at the two writers, where it does not depend on
   * whether a given seed happens to exercise them.
   */
  it.each([
    ['treasure map', (g: WorldGraph) => mintTreasureMap(g, ACTOR, SITE, 12)],
    ['masterwork', (g: WorldGraph) => mintMasterwork(g, ACTOR, 'masterwork', 12)],
  ])('%s: canonical subcategory, numeric tier, and art that resolves', (_label, mint) => {
    const graph = world();
    const result = mint(graph);
    expect(result.success).toBe(true);

    const node = graph.getNode(result.createdId!)!;
    const sub = node.properties.subcategory as string;

    expect(POSSESSION_SUBCATEGORIES).toContain(sub);
    expect(typeof node.properties.tier).toBe('number');
    expect(node.properties.tier as number).toBeGreaterThanOrEqual(1);
    expect(node.properties.tier as number).toBeLessThanOrEqual(4);
    // The consequence the subcategory exists for: a non-canonical value resolves null.
    expect(getAttachmentArtUrl(node.id, sub)).not.toBeNull();
  });
});

// ─── No dead content ────────────────────────────────────────────────

describe('the T1 corpus is reachable', () => {
  /**
   * Every template id any ambition profile can offer.
   *
   * **All three arrays, and the omission was a real finding.** Ambitions live in
   * `AMBITION_TEMPLATES`, `REACTIVE_AMBITION_TEMPLATES` (grief, revenge, exile — minted
   * by what happens to an agent) and `EVENT_MINTED_AMBITION_TEMPLATES`; candidate
   * generation resolves a pursued ambition against the first two
   * (`strategicActionCandidates.ts:570`) and `ambitionTick` mints from the third. A
   * first draft of this test read only the base array and reported five templates
   * unreachable that are reachable — which is the same class of false negative the
   * test exists to catch, one level up.
   *
   * What this set proves is *structural* reachability: the template can be offered if
   * the ambition is held. Whether these ambitions are actually assigned in a running
   * world is a behavioural question no unit test can answer, and it is measured by the
   * CLI liveness census instead.
   */
  const offerable = new Set([
    ...AMBITION_TEMPLATES,
    ...REACTIVE_AMBITION_TEMPLATES,
    ...EVENT_MINTED_AMBITION_TEMPLATES,
  ].flatMap(a => a.strategicProfile?.templateIds ?? []));

  it('every template named by a kind row is offerable through some ambition', () => {
    // Candidate generation iterates `profile.templateIds` and nothing else, so a
    // template in no profile is unreachable *by construction* — not rare, impossible.
    // A kind whose counter-play is unreachable has no counter-play at all, which is
    // the same vacuity the registry gate refuses one level up.
    const named = UNDERTAKING_KIND_ROWS.flatMap(r => [
      ...r.createTemplateIds, ...r.updateTemplateIds, ...r.destroyTemplateIds,
    ]);

    expect(named.length).toBeGreaterThan(0);
    expect(named.filter(id => !offerable.has(id))).toEqual([]);
  });

  it('every offerable template id resolves to a real template', () => {
    // The mirror defect: a profile naming an id nobody implements is a rejection
    // emitted every tick forever, and `template_not_found` is easy to never read.
    expect([...offerable].filter(id => !getStrategicTemplate(id))).toEqual([]);
  });

  it('the wanderer pack is registered — the seventh family is live', () => {
    // The family had a presentation row and no pack behind it, so this asserts the
    // pack actually reached the registry rather than merely existing as a file.
    const wanderer = getAllStrategicTemplates()
      .filter(t => t.behaviorFamily === 'wanderer-explorer');

    expect(wanderer.length).toBeGreaterThan(0);
    expect(wanderer.every(t => offerable.has(t.id))).toBe(true);
  });
});
