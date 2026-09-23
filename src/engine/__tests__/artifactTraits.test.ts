/**
 * THR-1521 — artifact traits: a thing as a trait bearer.
 *
 * The falsifying arms the ticket names, each written against the build that lacked
 * it: the schema admits an artifact (and still refuses what it should); a freehold is
 * refused as a bearer; `#cursed` resolves through the one trait gate where THR-661's
 * `properties.cursed` flag did not; `mintMasterwork` is born Storied at level 1 and
 * climbs with presence; and the content carve never deals a mortal a thing's trait.
 */

import { describe, it, expect, vi } from 'vitest';
import { WorldGraph } from '../graph';
import { EDGE_SCHEMA, validateEdgeEndpoints } from '../../types/edgeSchema';
import type { GraphOpContext } from '../../types/graphOp';
import { executeGraphOps } from '../graphOpExecutor';
import { mintMasterwork } from '../strategicGraphOps';
import { resolveTraitPredicate } from '../traits';
import { ENCOUNTER_TRAIT_DEFINITIONS, seedEncounterTraitDefinitions } from '../traitDefinitionSeeding';
import { nodeContentCatalogs, resolveContentQuery } from '../contentQuery';
import { enableTracing, getTraces, clearTraces } from '../traceBuffer';
import { getAttachmentTemplateNode } from '../attachmentTemplateIndex';
import { entriesOfKind } from '../../data/contentCatalogs';
import { CONDITION_TRAIT_DEFINITIONS, LOCATION_CONDITION_ID_PREFIX } from '../../data/condition-trait-content';
import {
  ARTIFACT_TRAIT_DEFINITIONS,
  ARTIFACT_TRAIT_ID_PREFIX,
  ARTIFACT_STORIED_TRAIT_ID,
  ARTIFACT_CURSED_TRAIT_ID,
  ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL,
  ARTIFACT_STORIED_MAX_LEVEL,
  artifactTraitLevelWord,
} from '../../data/artifact-trait-content';
import {
  assignArtifactTrait,
  removeArtifactTrait,
  recordArtifactEncounterPresence,
  readArtifactTraits,
  describeArtifactTraits,
  isArtifactTraitBearer,
  ensureArtifactTraitDefinitions,
  ARTIFACT_PRESENCE_COUNT_KEY,
} from '../artifactTraits';

const MAKER = 'ind_maker';
const BLADE = 'art_blade';
const FACE = 'art_face';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: MAKER, type: 'actor', name: 'Sila Vane', properties: { actorType: 'individual' } });
  graph.addNode({ id: BLADE, type: 'artifact', name: 'Grey Blade', properties: { subcategory: 'arms', tier: 1 } });
  graph.addNode({
    id: FACE,
    type: 'artifact',
    name: 'Holds Greyford',
    properties: { attachmentCategory: 'holding', tags: ['#holding'], holdingNodeId: 'loc_x' },
  });
  graph.addEdge({ id: `possesses_${MAKER}_${BLADE}`, source: MAKER, target: BLADE, type: 'possesses', properties: {} });
  graph.addEdge({ id: `possesses_${MAKER}_${FACE}`, source: MAKER, target: FACE, type: 'possesses', properties: {} });
  return graph;
}

const ctx: GraphOpContext = { actorId: MAKER, targetId: BLADE, locationId: BLADE, tick: 7 };

// ─── 1. The schema admits a thing ──────────────────────────────────────────

describe('has_trait admits artifacts (schema)', () => {
  it('lists both artifact tiers as legal sources, and the validator agrees', () => {
    const sources = EDGE_SCHEMA.has_trait.sourceNodeType as readonly string[];
    expect(sources).toContain('artifact');
    expect(sources).toContain('artifact_legendary');
    expect(validateEdgeEndpoints('has_trait', 'artifact', 'trait')).toBeNull();
    expect(validateEdgeEndpoints('has_trait', 'artifact_legendary', 'trait')).toBeNull();
    // The validator still refuses a source the row does not name — the widening is a
    // line, not a disabled check.
    expect(validateEdgeEndpoints('has_trait', 'event', 'trait')?.reason).toBe('source_type');
  });

  it('an artifact has_trait edge no longer warns at the graph chokepoint', () => {
    const graph = world();
    ensureArtifactTraitDefinitions(graph);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      graph.addEdge({
        id: 'e.has_trait.probe',
        source: BLADE,
        target: ARTIFACT_STORIED_TRAIT_ID,
        type: 'has_trait',
        properties: { level: 1 },
      });
      const schemaWarnings = warn.mock.calls.filter(c => String(c[0]).includes('[GraphSchema]'));
      expect(schemaWarnings).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });
});

// ─── 2. The holdings carve-out ─────────────────────────────────────────────

describe('a freehold is never a trait bearer', () => {
  it('refuses the holding face and writes no edge', () => {
    const graph = world();
    expect(isArtifactTraitBearer(graph.getNode(FACE))).toBe(false);
    expect(isArtifactTraitBearer(graph.getNode(BLADE))).toBe(true);
    const result = assignArtifactTrait(graph, FACE, ARTIFACT_STORIED_TRAIT_ID, { tick: 1, source: 'test' });
    expect(result).toEqual({ ok: false, reason: 'holding_face' });
    expect(graph.getOutgoingEdges(FACE, 'has_trait')).toEqual([]);
    expect(readArtifactTraits(graph, FACE)).toEqual([]);
  });

  it('refuses a non-artifact and a definition outside the artifact namespace', () => {
    const graph = world();
    expect(assignArtifactTrait(graph, MAKER, ARTIFACT_STORIED_TRAIT_ID, { tick: 1, source: 'test' }))
      .toEqual({ ok: false, reason: 'not_an_artifact' });
    expect(assignArtifactTrait(graph, BLADE, 'trait.condition.cursed', { tick: 1, source: 'test' }))
      .toEqual({ ok: false, reason: 'not_an_artifact_trait' });
    expect(assignArtifactTrait(graph, 'nope', ARTIFACT_STORIED_TRAIT_ID, { tick: 1, source: 'test' }))
      .toEqual({ ok: false, reason: 'artifact_not_found' });
    expect(graph.getOutgoingEdges(BLADE, 'has_trait')).toEqual([]);
  });
});

// ─── 3. #cursed is readable ────────────────────────────────────────────────

describe('#cursed on an artifact resolves through the one trait gate', () => {
  it('the pre-fix shape — the flag alone — satisfies no predicate', () => {
    const graph = world();
    graph.updateNode(BLADE, { properties: { cursed: true, curseConcealed: true } });
    expect(resolveTraitPredicate(graph, BLADE, { traitId: '#cursed' })).toBe(false);
    expect(resolveTraitPredicate(graph, BLADE, { traitId: ARTIFACT_CURSED_TRAIT_ID })).toBe(false);
  });

  it('curse_artifact writes the edge beside the flag; the predicate sees it by tag and by id', () => {
    const graph = world();
    // No definition seeded — the writer must seed on demand (an older save, a fixture).
    expect(graph.getNode(ARTIFACT_CURSED_TRAIT_ID)).toBeUndefined();
    const result = executeGraphOps(graph, [{ op: 'curse_artifact', nodeId: '$target' }], ctx);
    expect(result.allSucceeded).toBe(true);

    expect(graph.getNode(BLADE)?.properties.cursed).toBe(true);
    expect(graph.getNode(ARTIFACT_CURSED_TRAIT_ID)).toBeDefined();
    expect(resolveTraitPredicate(graph, BLADE, { traitId: '#cursed' })).toBe(true);
    expect(resolveTraitPredicate(graph, BLADE, { traitId: ARTIFACT_CURSED_TRAIT_ID })).toBe(true);
    expect(resolveTraitPredicate(graph, BLADE, { traitId: 'Cursed' })).toBe(true);
    const edge = graph.getEdge(`e.has_trait.${BLADE}.${ARTIFACT_CURSED_TRAIT_ID}`);
    expect(edge?.properties.source).toBe('curse_artifact');
    expect(edge?.properties.acquiredTick).toBe(7);
  });

  it('nullify_artifact removes the edge with the flag', () => {
    const graph = world();
    executeGraphOps(graph, [{ op: 'curse_artifact', nodeId: '$target' }], ctx);
    executeGraphOps(graph, [{ op: 'nullify_artifact', nodeId: '$target' }], ctx);
    expect(graph.getNode(BLADE)?.properties.cursed).toBe(false);
    expect(resolveTraitPredicate(graph, BLADE, { traitId: '#cursed' })).toBe(false);
    expect(graph.getEdge(`e.has_trait.${BLADE}.${ARTIFACT_CURSED_TRAIT_ID}`)).toBeUndefined();
  });

  it('cursing a holding face keeps the flag and writes no edge', () => {
    const graph = world();
    const faceCtx: GraphOpContext = { ...ctx, targetId: FACE, locationId: FACE };
    const result = executeGraphOps(graph, [{ op: 'curse_artifact', nodeId: '$target' }], faceCtx);
    expect(result.allSucceeded).toBe(true);
    expect(graph.getNode(FACE)?.properties.cursed).toBe(true);
    expect(graph.getOutgoingEdges(FACE, 'has_trait')).toEqual([]);
  });

  it('a mortal bearing the mortal condition is untouched by the artifact definition', () => {
    // Two definitions share the tag `#cursed`; a gate by tag matches either, and a
    // mortal never holds the artifact one — the bearer decides, not the word.
    const graph = world();
    seedEncounterTraitDefinitions(graph);
    expect(resolveTraitPredicate(graph, MAKER, { traitId: '#cursed' })).toBe(false);
  });
});

// ─── 4. #storied: the producer and the climb ──────────────────────────────

describe('#storied — minted at level 1, climbs with encounter presence', () => {
  it('mintMasterwork output carries Storied at level 1', () => {
    const graph = world();
    const minted = mintMasterwork(graph, MAKER, 'blade', 12);
    expect(minted.success).toBe(true);
    const id = minted.createdId!;
    const edge = graph.getEdge(`e.has_trait.${id}.${ARTIFACT_STORIED_TRAIT_ID}`);
    expect(edge).toBeDefined();
    expect(edge!.properties.level).toBe(1);
    expect(edge!.properties.source).toBe('mint_masterwork');
    expect(edge!.properties.acquiredTick).toBe(12);
    const readings = readArtifactTraits(graph, id);
    expect(readings.map(r => r.name)).toEqual(['Storied']);
    expect(readings[0].levelWord).toBe(artifactTraitLevelWord(ARTIFACT_STORIED_TRAIT_ID, 1));
    expect(readings[0].polarity).toBe('positive');
  });

  it('the level climbs every ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL encounters, to maxLevel, and not sooner', () => {
    const graph = world();
    const id = mintMasterwork(graph, MAKER, 'blade', 12).createdId!;
    const edgeId = `e.has_trait.${id}.${ARTIFACT_STORIED_TRAIT_ID}`;
    const levelNow = () => graph.getEdge(edgeId)!.properties.level as number;

    for (let i = 1; i < ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL; i++) {
      const r = recordArtifactEncounterPresence(graph, MAKER, 20 + i);
      expect(r.artifactsPresent).toBe(1);
      expect(r.climbed).toEqual([]);
      expect(levelNow()).toBe(1);
    }
    const climb = recordArtifactEncounterPresence(graph, MAKER, 40);
    expect(climb.climbed).toEqual([{ artifactId: id, level: 2 }]);
    expect(levelNow()).toBe(2);
    expect(graph.getEdge(edgeId)!.properties[ARTIFACT_PRESENCE_COUNT_KEY]).toBe(ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL);
    expect(graph.getEdge(edgeId)!.properties.lastReinforcedTick).toBe(40);

    for (let i = 0; i < ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL * 10; i++) {
      recordArtifactEncounterPresence(graph, MAKER, 100 + i);
    }
    expect(levelNow()).toBe(ARTIFACT_STORIED_MAX_LEVEL);
    // The count keeps counting past the cap; the level does not.
    expect(graph.getEdge(edgeId)!.properties[ARTIFACT_PRESENCE_COUNT_KEY]).toBeGreaterThan(
      ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL * ARTIFACT_STORIED_MAX_LEVEL,
    );
  });

  it('presence never mints: an unstoried possession stays unstoried, a holding face is skipped', () => {
    const graph = world();
    const r = recordArtifactEncounterPresence(graph, MAKER, 5);
    expect(r).toEqual({ artifactsPresent: 0, climbed: [] });
    expect(graph.getOutgoingEdges(BLADE, 'has_trait')).toEqual([]);
    expect(graph.getOutgoingEdges(FACE, 'has_trait')).toEqual([]);
  });

  it('fails soft on a missing bearer', () => {
    const graph = world();
    expect(recordArtifactEncounterPresence(graph, 'nobody', 5)).toEqual({ artifactsPresent: 0, climbed: [] });
  });

  it('removeArtifactTrait takes the edge away and reports it', () => {
    const graph = world();
    const id = mintMasterwork(graph, MAKER, 'blade', 12).createdId!;
    expect(removeArtifactTrait(graph, id, ARTIFACT_STORIED_TRAIT_ID)).toBe(true);
    expect(removeArtifactTrait(graph, id, ARTIFACT_STORIED_TRAIT_ID)).toBe(false);
    expect(readArtifactTraits(graph, id)).toEqual([]);
  });
});

// ─── 5. The carve ──────────────────────────────────────────────────────────

describe('a condition_template query never deals a mortal a thing\'s trait', () => {
  const nodes = [...CONDITION_TRAIT_DEFINITIONS, ...ARTIFACT_TRAIT_DEFINITIONS];
  const catalogs = nodeContentCatalogs(nodes);
  const artifactIds = ARTIFACT_TRAIT_DEFINITIONS.map(n => n.id);

  it('pre-fix arm: the raw carve does hold the artifact definitions', () => {
    // The exclusion is a filter, not an absence — without this arm the test below
    // would pass against a build that simply never indexed the definitions.
    const raw = catalogs.candidates('condition_template').map(c => c.id);
    for (const id of artifactIds) expect(raw).toContain(id);
  });

  it('an untagged query excludes every trait.artifact.* id (and every place id)', () => {
    const hits = resolveContentQuery({ kind: 'condition_template' }, catalogs).map(h => h.id);
    expect(hits.length).toBeGreaterThan(0);
    for (const id of hits) {
      expect(id.startsWith(ARTIFACT_TRAIT_ID_PREFIX), `${id} dealt to a mortal`).toBe(false);
      expect(id.startsWith(LOCATION_CONDITION_ID_PREFIX), `${id} dealt to a mortal`).toBe(false);
    }
  });

  it('classes: [artifact] returns exactly the thing\'s traits; classes: [location] returns none of them', () => {
    const things = resolveContentQuery({ kind: 'condition_template', classes: ['artifact'] }, catalogs).map(h => h.id);
    expect(things.sort()).toEqual([...artifactIds].sort());
    const places = resolveContentQuery({ kind: 'condition_template', classes: ['location'] }, catalogs).map(h => h.id);
    for (const id of places) expect(id.startsWith(LOCATION_CONDITION_ID_PREFIX)).toBe(true);
  });
});

// ─── 6. Seated: seeding, the tooltip index, the content registry ──────────

describe('the two definitions are seated everywhere a condition is', () => {
  it('seed at world init and on demand', () => {
    for (const id of [ARTIFACT_STORIED_TRAIT_ID, ARTIFACT_CURSED_TRAIT_ID]) {
      expect(ENCOUNTER_TRAIT_DEFINITIONS.some(n => n.id === id)).toBe(true);
    }
    const graph = new WorldGraph();
    seedEncounterTraitDefinitions(graph);
    expect(graph.getNode(ARTIFACT_STORIED_TRAIT_ID)?.properties.subcategory).toBe('condition');
    expect(ensureArtifactTraitDefinitions(graph)).toBe(0);
  });

  it('hover through the attachment tooltip index, and are Condition entries in the content registry', () => {
    expect(getAttachmentTemplateNode(ARTIFACT_STORIED_TRAIT_ID)?.name).toBe('Storied');
    expect(getAttachmentTemplateNode(ARTIFACT_CURSED_TRAIT_ID)?.name).toBe('Cursed');
    const ids = new Set(entriesOfKind('condition_template').map(e => e.id));
    expect(ids.has(ARTIFACT_STORIED_TRAIT_ID)).toBe(true);
    expect(ids.has(ARTIFACT_CURSED_TRAIT_ID)).toBe(true);
  });

  it('level words exist for every level and never carry a numeral', () => {
    for (let level = 1; level <= ARTIFACT_STORIED_MAX_LEVEL; level++) {
      const word = artifactTraitLevelWord(ARTIFACT_STORIED_TRAIT_ID, level);
      expect(word).toBeTruthy();
      expect(word).not.toMatch(/\d/);
    }
    expect(artifactTraitLevelWord('trait.artifact.unknown', 1)).toBeNull();
  });
});

// ─── 7. Inspectability ─────────────────────────────────────────────────────

describe('artifact_trait traces and the readout', () => {
  it('traces the stamp and the climb, and the readout names both with the presence count', () => {
    enableTracing();
    clearTraces();
    const graph = world();
    const id = mintMasterwork(graph, MAKER, 'blade', 12).createdId!;
    for (let i = 0; i < ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL; i++) recordArtifactEncounterPresence(graph, MAKER, 20 + i);

    const traces = getTraces().filter(t => t.category === 'artifact_trait') as Array<{ change: string; level: number; source: string }>;
    expect(traces.map(t => t.change)).toEqual(['stamped', 'climbed']);
    expect(traces[0].source).toBe('mint_masterwork');
    expect(traces[1].level).toBe(2);
    expect(traces[1].source).toBe(`encounter_presence:${ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL}`);

    const rows = describeArtifactTraits(graph, 'blade');
    expect(rows).toHaveLength(1);
    expect(rows[0].artifactId).toBe(id);
    expect(rows[0].level).toBe(2);
    expect(rows[0].encountersPresent).toBe(ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL);
    // The holding face is never listed, even unfiltered.
    expect(describeArtifactTraits(graph).every(r => r.artifactId !== FACE)).toBe(true);
    clearTraces();
  });
});
