/**
 * The place answers — THR-1173.
 *
 * THR-1172 built the location link tier end to end and nothing walked through
 * it. `location` was in the kind union, `EncounterVeil.openEntity` routed it,
 * `GameView` mapped it to `LocationProfileModal` — and the producer that names
 * a place in prose still handed the renderer a name with no id behind it. So
 * "Sacred Grove" matched the scan, took a `referenceId`, and stopped: scene
 * bookkeeping that opens nothing. The door existed; nobody was walking through.
 *
 * **The load-bearing assertions here are the two negatives**, for the reason
 * `narrativeSegmentTiers.test.tsx` states about its own: a producer that
 * stamped `entityKind: 'location'` onto everything would satisfy every positive
 * assertion below while being a worse bug than the one being fixed. So:
 *
 *  - a **cast member** must come back with **no** kind — absent means agent, and
 *    that back-compatibility rule is load-bearing for every pre-THR-1004 entry;
 *  - a **non-place scene target** must come back with **no** kind, because the
 *    target arm is exactly where a blanket stamp would land.
 *
 * The target arm carries its own regression: before this ticket a *location*
 * target pushed an `entityId` with no kind, and an absent kind routes to
 * `onSelectAgent`. A place-target therefore opened the agent drawer — a wrong
 * sheet, which Law 21 rates below no sheet at all.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import type { GraphNode } from '../../../../types/graph';
import type { EncounterSupportBinding } from '../../../../types/encounter';
import {
  autoLinkNarrative,
  buildLinkedParagraph,
  buildLocationTooltipId,
  collectSupportBundleEntities,
} from '../narrativeLinker';

const GROVE_ID = 'loc.sacred_grove';
const KEEPER_ID = 'actor.keeper';

/**
 * `grove` is a real `location.*` concept in world-model.json. Pinned as a
 * constant with the assertion below so this fixture cannot quietly become a
 * subtype that names nothing — which would turn every tooltip expectation here
 * into a vacuous `undefined === undefined`.
 */
const GROVE_SUBTYPE = 'grove';

function node(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type' | 'name'>): GraphNode {
  return { properties: {}, ...partial };
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode(
    node({
      id: GROVE_ID,
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationSubtype: GROVE_SUBTYPE },
    }),
  );
  graph.addNode(node({ id: KEEPER_ID, type: 'actor', name: 'Maren Ironhewn' }));
  graph.addNode(
    node({
      id: 'loc.nameless',
      type: 'location',
      name: 'The Hollow',
      properties: { locationSubtype: 'no_such_subtype_exists' },
    }),
  );
  return graph;
}

// No `as EncounterSupportBinding` here on purpose: a cast on a fixture hides
// invented union members from the compiler, which is how the first draft of this
// helper shipped `delivery: 'existing'` and `persistence: 'ephemeral'` — neither
// of which is a member of either union.
function binding(key: string, nodeId: string, kind: 'actor' | 'location'): EncounterSupportBinding {
  return { key, nodeId, kind, delivery: 'pre-seeded', persistence: 'scene-only', reused: false };
}

const GROVE_SPEC = { kind: 'location', key: 'grove', sublocationTypeId: 'grove' } as const;
const KEEPER_SPEC = { kind: 'actor', key: 'keeper', supportRole: 'keeper' } as const;

describe('THR-1173 — a named place reaches link tier', () => {
  it('the fixture subtype really is a registered concept', () => {
    // Guards every `toBe(...)` below from passing on a shared undefined.
    expect(buildLocationTooltipId({ properties: { locationSubtype: GROVE_SUBTYPE } })).toBe(
      `location.${GROVE_SUBTYPE}`,
    );
  });

  it('a bound location carries its node id and kind, not just a referenceId', () => {
    const graph = makeGraph();
    const { linkEntries } = collectSupportBundleEntities(
      graph,
      [GROVE_SPEC],
      [binding('grove', GROVE_ID, 'location')],
    );

    const grove = linkEntries.find(e => e.name === 'Sacred Grove');
    expect(grove).toBeDefined();
    // The whole ticket, in three fields.
    expect(grove!.entityId).toBe(GROVE_ID);
    expect(grove!.entityKind).toBe('location');
    expect(grove!.tooltipId).toBe(`location.${GROVE_SUBTYPE}`);
  });

  it('the id and kind survive the prose scan into the segment', () => {
    const graph = makeGraph();
    const { linkEntries } = collectSupportBundleEntities(
      graph,
      [GROVE_SPEC],
      [binding('grove', GROVE_ID, 'location')],
    );

    const para = autoLinkNarrative('p1', 'They came to Sacred Grove at dusk.', linkEntries);
    const seg = para.segments.find(s => s.text === 'Sacred Grove');

    expect(seg).toBeDefined();
    expect(seg!.entityId).toBe(GROVE_ID);
    expect(seg!.entityKind).toBe('location');
    expect(seg!.tooltipId).toBe(`location.${GROVE_SUBTYPE}`);
  });

  it('NEGATIVE: a cast member comes back with no kind — absent still means agent', () => {
    const graph = makeGraph();
    const { linkEntries } = collectSupportBundleEntities(
      graph,
      [KEEPER_SPEC],
      [binding('keeper', KEEPER_ID, 'actor')],
    );

    const keeper = linkEntries.find(e => e.name === 'Maren Ironhewn');
    expect(keeper).toBeDefined();
    expect(keeper!.entityId).toBe(KEEPER_ID);
    expect(keeper!.entityKind).toBeUndefined();
  });

  it('a location scene target is a place, not a person', () => {
    // The regression: this arm used to push an id with no kind, and no kind
    // routes to the agent drawer. A place opened a person's sheet.
    const graph = makeGraph();
    const { linkEntries } = collectSupportBundleEntities(graph, [], [], GROVE_ID);

    const grove = linkEntries.find(e => e.name === 'Sacred Grove');
    expect(grove).toBeDefined();
    expect(grove!.entityId).toBe(GROVE_ID);
    expect(grove!.entityKind).toBe('location');

    // ...and no first-name entry: splitting a place name would link the bare
    // word "Sacred" to the grove.
    expect(linkEntries.some(e => e.name === 'Sacred')).toBe(false);
  });

  it('NEGATIVE: a non-place scene target keeps its absent kind', () => {
    const graph = makeGraph();
    const { linkEntries } = collectSupportBundleEntities(graph, [], [], KEEPER_ID);

    const keeper = linkEntries.find(e => e.name === 'Maren Ironhewn');
    expect(keeper).toBeDefined();
    expect(keeper!.entityKind).toBeUndefined();
    // A person still gets the first-name entry.
    expect(linkEntries.some(e => e.name === 'Maren')).toBe(true);
  });

  it('a subtype naming no concept yields no tooltipId, and the link still stands', () => {
    // Fail-soft, not fail-shut: a worldgen subtype outside the committed concept
    // set is an outcome, not an authoring error. The place still opens.
    const graph = makeGraph();
    const { linkEntries } = collectSupportBundleEntities(graph, [], [], 'loc.nameless');

    const hollow = linkEntries.find(e => e.name === 'The Hollow');
    expect(hollow).toBeDefined();
    expect(hollow!.entityKind).toBe('location');
    expect(hollow!.tooltipId).toBeUndefined();
  });

  it('buildLinkedParagraph carries a token id and kind through to the segment', () => {
    // The Gate Duty path: explicit {{token}} markup rather than a prose scan.
    const para = buildLinkedParagraph('p1', '{{location}} is already in motion.', {
      location: {
        text: 'Sacred Grove',
        referenceId: 'location',
        emphasis: 'accent',
        entityId: GROVE_ID,
        entityKind: 'location',
        tooltipId: `location.${GROVE_SUBTYPE}`,
      },
    });

    const seg = para.segments.find(s => s.text === 'Sacred Grove');
    expect(seg).toBeDefined();
    expect(seg!.entityId).toBe(GROVE_ID);
    expect(seg!.entityKind).toBe('location');
  });

  it('NEGATIVE: a token with no id stays text-tier', () => {
    const para = buildLinkedParagraph('p1', '{{location}} waits.', {
      location: { text: 'Somewhere', referenceId: 'location', emphasis: 'accent' },
    });

    const seg = para.segments.find(s => s.text === 'Somewhere');
    expect(seg).toBeDefined();
    expect(seg!.entityId).toBeUndefined();
    expect(seg!.entityKind).toBeUndefined();
  });
});
