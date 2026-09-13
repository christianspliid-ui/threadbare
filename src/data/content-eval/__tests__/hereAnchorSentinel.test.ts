/**
 * THR-1462 — `$here`, so a `place` consequence can link the place it landed on.
 *
 * THR-1446 added `$here` to `SCENE_SENTINEL_FIELDS`, which let an aftermath **effect**
 * land on the place a scene happens at: `apply_condition` with
 * `targetLocationId: '$here'` writes the condition onto the shrine. The **chip**
 * reporting that write could not point at the shrine — `classifyAnchorDeclaration`
 * resolved five forms and refused every other `$`-prefixed string — so the two halves
 * disagreed about what an author may name. `$target` is the actor on a self-targeted
 * encounter (most of them, and the reason `$here` exists at all), and a literal location
 * node id is minted per world and correctly refused.
 *
 * ## Falsification
 *
 * Every arm here is written against a specific wrong answer, not against "something
 * else" — a test that only ever sees good anchors has proven nothing:
 *
 *   1. **A junk sentinel is still refused.** `$where` is one character from plausible.
 *      If the new arm were written as "any unrecognised sentinel now passes", this fails.
 *   2. **A Place does not pass as the Location.** The actor stands in a shrine *inside*
 *      a town; a walk that returned the node it found would answer with the shrine's id
 *      and look correct. The arm pins the parent's id, so the wrong tier is a failure
 *      rather than a plausible-looking pass.
 *   3. **Fail-soft returns `undefined`, never a wrong id.** An actor with no
 *      `located_at` resolves to nothing — NFP #4 — rather than falling through to the
 *      actor's own id, which is the shape that would render a link to a person under a
 *      place tile.
 *
 * The walk itself is deliberately *not* re-implemented here: `resolveAnchorDeclaration`
 * reads `resolveSceneHere`, the same function `encounterAftermath` binds effects with,
 * so these arms exercise the shipped rule rather than a copy that could agree with a
 * broken original.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import {
  ANCHOR_SENTINEL_HERE,
  classifyAnchorDeclaration,
  resolveAnchorDeclaration,
} from '../chipAnchorDeclarations';

const noCastKeys = { supportKeys: new Set<string>() };

/**
 * A world shaped like the one `shrine_offering` resolves in: the actor stands at a
 * Place (the shrine) that sits inside a Location (the town).
 *
 * `standsAt` chooses which node the `located_at` edge points at, so one builder covers
 * the Place-tier walk, the Location-tier passthrough and the no-position arm.
 */
function buildWorld(options: { readonly standsAt?: string } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-pilgrim', type: 'actor', name: 'Ilse',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc-town', type: 'location', name: 'Ashfall',
    properties: { locationSubtype: 'town', hexCol: 4, hexRow: 7 },
  });
  // Canonical Place shape (THR-1183): `type: 'location'` discriminated by `parentLocationId`.
  graph.addNode({
    id: 'loc-shrine', type: 'location', name: 'The Roadside Stones',
    properties: { parentLocationId: 'loc-town' },
  });
  const standsAt = options.standsAt;
  if (standsAt) {
    graph.addEdge({
      id: `located_at_actor-pilgrim_${standsAt}`,
      source: 'actor-pilgrim', target: standsAt, type: 'located_at',
      properties: {},
    });
  }
  return graph;
}

function context(graph: WorldGraph, over: Record<string, unknown> = {}) {
  return {
    graph,
    actorId: 'actor-pilgrim',
    targetId: undefined,
    castNodeIdByKey: new Map<string, string>(),
    encounterTemplateId: 'encounter.shrine_offering',
    ...over,
  } as Parameters<typeof resolveAnchorDeclaration>[1];
}

describe('THR-1462 — `$here` as a chip anchor', () => {
  describe('classification (the static half)', () => {
    it('accepts `$here`', () => {
      expect(classifyAnchorDeclaration(ANCHOR_SENTINEL_HERE, noCastKeys)).toEqual({
        ok: true,
        form: 'here',
      });
    });

    it('still refuses a sentinel this build does not resolve', () => {
      // Falsification arm 1. `$where` is one character from plausible, so a change that
      // opened the gate to any unrecognised sentinel passes the arm above and fails here.
      const verdict = classifyAnchorDeclaration('$where', noCastKeys);
      expect(verdict.ok).toBe(false);
      expect(verdict.ok === false && verdict.reason).toContain('not a sentinel this build resolves');
      // And the refusal names the new form, so an author who typo'd it is told what to write.
      expect(verdict.ok === false && verdict.reason).toContain(ANCHOR_SENTINEL_HERE);
    });

    it('accepts `$here` with no world in hand — the static half asks "could this ever resolve"', () => {
      // Unlike `$artifact`, there is no authoring mistake to catch: every encounter
      // happens somewhere. A scene whose actor stands nowhere is a world outcome, and
      // the runtime half below is what fails it soft.
      expect(classifyAnchorDeclaration(ANCHOR_SENTINEL_HERE, { supportKeys: new Set(['keeper']) }))
        .toEqual({ ok: true, form: 'here' });
    });
  });

  describe('resolution (the runtime half)', () => {
    it('walks a Place up to the Location that holds it', () => {
      // Falsification arm 2: the actor is standing at `loc-shrine`, so a walk that
      // returned the node it found would answer `loc-shrine` and look entirely correct.
      // The Location tier is what `targetLocationId` binds, so anchoring anywhere else
      // would point the chip at a different node than the effect it reports wrote to.
      const graph = buildWorld({ standsAt: 'loc-shrine' });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_HERE, context(graph))).toBe('loc-town');
    });

    it('returns the Location itself when the actor stands at one', () => {
      const graph = buildWorld({ standsAt: 'loc-town' });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_HERE, context(graph))).toBe('loc-town');
    });

    it('returns undefined, not a wrong id, when the actor stands nowhere', () => {
      // Falsification arm 3 (NFP #4). The wrong answer this pins is `actor-pilgrim`:
      // falling through to the actor's own id would draw a place tile over a person.
      const graph = buildWorld();
      const resolved = resolveAnchorDeclaration(ANCHOR_SENTINEL_HERE, context(graph));
      expect(resolved).toBeUndefined();
      expect(resolved).not.toBe('actor-pilgrim');
    });

    it('returns undefined when there is no actor at all', () => {
      const graph = buildWorld({ standsAt: 'loc-shrine' });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_HERE, context(graph, { actorId: undefined })))
        .toBeUndefined();
    });

    it('resolves through the avatar when the actor is the ascendant', () => {
      // The hop that motivated `$here`: an ascendant carries no `located_at` of its own,
      // and the divine self-targeted encounter is the shape that could not wire `place`.
      const graph = buildWorld({ standsAt: 'loc-shrine' });
      graph.addNode({
        id: 'asc.witness', type: 'actor', name: 'The Witness',
        properties: { actorType: 'ascendant', avatarId: 'actor-pilgrim' },
      });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_HERE, context(graph, { actorId: 'asc.witness' })))
        .toBe('loc-town');
    });
  });
});
