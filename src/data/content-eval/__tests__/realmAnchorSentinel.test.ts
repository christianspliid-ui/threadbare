/**
 * THR-1499 — `$realm`, so a realm standing chip can link the Realm it moved.
 *
 * THR-1155 shipped `$realm` on the **effect** side: `faction_reputation_gain` with
 * `factionId: '$realm'` is the realm-court family's whole spine, and it works. The
 * **chip** side never gained the sentinel — `$faction:<defId>` takes a *shipped*
 * definition id, and a Realm's definition is minted per world as `realm.<cultureId>`
 * over a generated culture — so all nine standing chips across the three realm-court
 * encounters named the state and none could link the crown.
 *
 * ## Falsification
 *
 * Every arm here is written against a specific wrong answer:
 *
 *   1. **A junk sentinel is still refused.** `$realms` is one character from plausible;
 *      an arm that opened the gate to any unrecognised sentinel fails here.
 *   2. **The static half rejects a template that binds no `$realm`.** The Done-when's
 *      own rejection arm: an accept-only classifier passes against a resolver that
 *      accepts everything.
 *   3. **The map answers, not the town's holder.** The town's `controls` edge points at a
 *      guild; the projection says a Realm holds the hex. The arm pins the Realm, so a
 *      resolver that read the holder would answer with the guild and fail by name.
 *   4. **An unclaimed hex resolves to `undefined`, never a wrong id** — NFP #4, and the
 *      Done-when's fail-soft arm. The wrong answer pinned is the actor's own id.
 *   5. **A Realm the projection names but the graph no longer holds is dropped**, rather
 *      than becoming a link into nothing.
 *
 * The lookup itself is deliberately *not* re-implemented here: `resolveAnchorDeclaration`
 * reads `resolveSceneRealm`, the same function `encounterAftermath` binds effects with.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { chipAnchorViolations } from '../compositionContract';
import type { RealmProjection } from '../../../engine/realmProjection';
import { emptyRealmProjection } from '../../../engine/realmProjection';
import {
  ANCHOR_SENTINEL_REALM,
  classifyAnchorDeclaration,
  resolveAnchorDeclaration,
} from '../chipAnchorDeclarations';

const noCastKeys = { supportKeys: new Set<string>() };

const TOWN_HEX = { col: 4, row: 7 } as const;
const TOWN_HEX_KEY = `${TOWN_HEX.col},${TOWN_HEX.row}`;

/**
 * A world shaped like the one the court summons resolves in: the actor stands at a
 * Place (the hall) inside a Location (the town), the town is *held* by a guild, and the
 * political map says a Realm claims the town's hex. Holder ≠ Realm on purpose — see
 * falsification arm 3.
 */
function buildWorld(options: { readonly standsAt?: string; readonly realmNode?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-subject', type: 'actor', name: 'Ilse',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc-town', type: 'location', name: 'Ashfall',
    properties: { locationSubtype: 'town', hexCol: TOWN_HEX.col, hexRow: TOWN_HEX.row },
  });
  // Canonical Place shape (THR-1183): `type: 'location'` discriminated by `parentLocationId`.
  graph.addNode({
    id: 'loc-hall', type: 'location', name: 'The Long Hall',
    properties: { parentLocationId: 'loc-town' },
  });
  graph.addNode({
    id: 'faction-guild', type: 'actor', name: 'The Salt Consortium',
    properties: { actorType: 'faction', factionDefId: 'merchant_consortium', factionClass: 'guild' },
  });
  graph.addEdge({
    id: 'controls_faction-guild_loc-town',
    source: 'faction-guild', target: 'loc-town', type: 'controls',
    properties: {},
  });
  if (options.realmNode !== false) {
    graph.addNode({
      id: 'faction-realm', type: 'actor', name: 'The Crown of Ashfall',
      properties: { actorType: 'faction', factionDefId: 'realm.ashfall', factionClass: 'realm' },
    });
  }
  const standsAt = options.standsAt;
  if (standsAt) {
    graph.addEdge({
      id: `located_at_actor-subject_${standsAt}`,
      source: 'actor-subject', target: standsAt, type: 'located_at',
      properties: {},
    });
  }
  return graph;
}

/** A political map claiming the town's hex for the Realm, and nothing else. */
function claimedProjection(): RealmProjection {
  return {
    realms: [],
    hexRealmId: new Map([[TOWN_HEX_KEY, 'faction-realm']]),
    unclaimedHexes: 0,
  };
}

function context(graph: WorldGraph, over: Record<string, unknown> = {}) {
  return {
    graph,
    actorId: 'actor-subject',
    targetId: undefined,
    castNodeIdByKey: new Map<string, string>(),
    encounterTemplateId: 'encounter.realm.court_summons',
    realmProjection: () => claimedProjection(),
    ...over,
  } as Parameters<typeof resolveAnchorDeclaration>[1];
}

/** A template with one standing chip on its fallback, and the effects it is told to author. */
function chipShape(
  entityId: string,
  effects: readonly Record<string, unknown>[],
): UnifiedActionTemplate {
  return {
    id: 'encounter.test.thr1499_fixture',
    name: 'THR-1499 fixture',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The crown named them useful.',
        changes: [{
          id: 'fixture.counted_useful',
          kind: 'faction_reputation',
          title: 'Counted useful',
          detail: 'Their standing with the crown rose.',
          polarity: 'gain',
          category: 'boon',
          direction: 'gain',
          stateNoun: { text: 'court standing', entityId, visualKind: 'faction', tooltipId: 'ui.standing' },
        }],
        reactions: [{ id: 'fixture.bow', label: 'Bow', intent: 'Take the errand.', effects }],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

const BINDS_REALM = [{ kind: 'faction_reputation_gain', factionId: '$realm', magnitude: 0.1 }];
const BINDS_NO_REALM = [{ kind: 'favor_creation', magnitudeRange: [0.2, 0.4], context: 'a debt' }];

describe('THR-1499 — `$realm` as a chip anchor', () => {
  describe('the shipping gate (`chipAnchorViolations`)', () => {
    it('passes a `$realm` chip on a template whose effects bind `$realm`', () => {
      expect(chipAnchorViolations(chipShape(ANCHOR_SENTINEL_REALM, BINDS_REALM))).toEqual([]);
    });

    it('fails a `$realm` chip on a template authoring no realm-scoped effect — through the path that ships', () => {
      // The Done-when's rejection arm on the gate itself, not only on the classifier:
      // deleting the `bindsRealm === false` branch, or forgetting to compute `bindsRealm`
      // in `chipAnchorViolations`, turns this green-by-omission and the sentinel becomes a
      // fail-open that renders as text and looks like a styling choice (Law 21).
      const violations = chipAnchorViolations(chipShape(ANCHOR_SENTINEL_REALM, BINDS_NO_REALM));
      expect(violations).toHaveLength(1);
      expect(violations[0]).toContain('fixture.counted_useful');
      expect(violations[0]).toContain('authors no effect binding `$realm`');
    });

    it('is not what rejects a chip on the same template that anchors something else', () => {
      // Controlled arm: the fixture without `$realm` effects is otherwise lawful, so the
      // violation above is the realm gate and not some other defect in the fixture.
      expect(chipAnchorViolations(chipShape('$actor', BINDS_NO_REALM))).toEqual([]);
    });
  });

  describe('classification (the static half)', () => {
    it('accepts `$realm` when the caller cannot say whether the template binds it', () => {
      // `bindsRealm` absent means "the caller cannot say", the `mintsArtifact` contract.
      expect(classifyAnchorDeclaration(ANCHOR_SENTINEL_REALM, noCastKeys)).toEqual({
        ok: true,
        form: 'realm',
      });
    });

    it('accepts `$realm` on a template whose effects bind it', () => {
      expect(classifyAnchorDeclaration(ANCHOR_SENTINEL_REALM, { ...noCastKeys, bindsRealm: true }))
        .toEqual({ ok: true, form: 'realm' });
    });

    it('rejects `$realm` on a template authoring no realm-scoped effect', () => {
      // Falsification arm 2 — the Done-when's rejection arm. A standing chip claiming the
      // crown moved on a template that never writes to the crown has nothing to report.
      const verdict = classifyAnchorDeclaration(ANCHOR_SENTINEL_REALM, { ...noCastKeys, bindsRealm: false });
      expect(verdict.ok).toBe(false);
      expect(verdict.ok === false && verdict.reason).toContain('authors no effect binding `$realm`');
    });

    it('still refuses a sentinel this build does not resolve, and names `$realm` in the refusal', () => {
      // Falsification arm 1. `$realms` is one character from plausible.
      const verdict = classifyAnchorDeclaration('$realms', noCastKeys);
      expect(verdict.ok).toBe(false);
      expect(verdict.ok === false && verdict.reason).toContain('not a sentinel this build resolves');
      expect(verdict.ok === false && verdict.reason).toContain(ANCHOR_SENTINEL_REALM);
    });
  });

  describe('resolution (the runtime half)', () => {
    it('resolves to the Realm the political map says holds the scene\'s hex — not the town\'s holder', () => {
      // Falsification arm 3. The town's `controls` edge points at `faction-guild`; the
      // map says `faction-realm`. A resolver that read the holder answers with the guild.
      const graph = buildWorld({ standsAt: 'loc-hall' });
      const resolved = resolveAnchorDeclaration(ANCHOR_SENTINEL_REALM, context(graph));
      expect(resolved).toBe('faction-realm');
      expect(resolved).not.toBe('faction-guild');
    });

    it('walks a Place up to its Location before reading the hex', () => {
      // The hall carries no `hexCol`/`hexRow` of its own; only the town does. A resolver
      // that read the node it found would see no hex and drop.
      const atHall = resolveAnchorDeclaration(ANCHOR_SENTINEL_REALM, context(buildWorld({ standsAt: 'loc-hall' })));
      const atTown = resolveAnchorDeclaration(ANCHOR_SENTINEL_REALM, context(buildWorld({ standsAt: 'loc-town' })));
      expect(atHall).toBe('faction-realm');
      expect(atTown).toBe('faction-realm');
    });

    it('returns undefined, not a wrong id, when no Realm claims the hex', () => {
      // Falsification arm 4 (NFP #4) — the Done-when's fail-soft arm. The chip stays
      // `named`; it must never become a link to the actor or to the guild that holds the town.
      const graph = buildWorld({ standsAt: 'loc-hall' });
      const resolved = resolveAnchorDeclaration(
        ANCHOR_SENTINEL_REALM,
        context(graph, { realmProjection: () => emptyRealmProjection() }),
      );
      expect(resolved).toBeUndefined();
      expect(resolved).not.toBe('actor-subject');
      expect(resolved).not.toBe('faction-guild');
    });

    it('returns undefined when the caller hands in no map at all', () => {
      const graph = buildWorld({ standsAt: 'loc-hall' });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_REALM, context(graph, { realmProjection: undefined })))
        .toBeUndefined();
    });

    it('returns undefined when the map throws — a sentinel lookup never breaks a render', () => {
      const graph = buildWorld({ standsAt: 'loc-hall' });
      expect(resolveAnchorDeclaration(
        ANCHOR_SENTINEL_REALM,
        context(graph, { realmProjection: () => { throw new Error('projection build failed'); } }),
      )).toBeUndefined();
    });

    it('returns undefined when the actor stands nowhere', () => {
      const graph = buildWorld();
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_REALM, context(graph))).toBeUndefined();
    });

    it('drops a Realm the map names but the graph no longer holds', () => {
      // Falsification arm 5. The projection is rebuilt on structural change, so this is
      // not the expected case — but a link into a node that is gone is worse than none.
      const graph = buildWorld({ standsAt: 'loc-hall', realmNode: false });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_REALM, context(graph))).toBeUndefined();
    });

    it('resolves through the avatar when the actor is the ascendant', () => {
      // Inherited from `resolveSceneHere`: an ascendant carries no `located_at` of its
      // own, and a divine encounter on claimed ground should still name the crown.
      const graph = buildWorld({ standsAt: 'loc-hall' });
      graph.addNode({
        id: 'asc.witness', type: 'actor', name: 'The Witness',
        properties: { actorType: 'ascendant', avatarId: 'actor-subject' },
      });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_REALM, context(graph, { actorId: 'asc.witness' })))
        .toBe('faction-realm');
    });
  });
});
