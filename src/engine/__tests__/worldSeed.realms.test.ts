/**
 * The Realm mint — THR-1155 slice 2, step 1.
 *
 * A nation used to be one of two or three factions rolled out of a name list, holding
 * whatever Locations a round-robin over the location array handed it. Nothing about
 * that faction was addressable: it carried no `factionDefId`, so `factionAmbitions`,
 * `factionQuestGeneration`, `factionReputation` and the encounter gates all skipped it
 * by construction, and its territory said nothing about who lived there.
 *
 * These tests are on a **generated world**, never a fixture, because everything under
 * test is a property of real worldgen: that culture domains exist at all, that Locations
 * fall inside them, and that the definitions reach the lookup. A fixture would have had
 * to invent all three, and inventing both sides of a check verifies fiction.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { getFactionDefinition } from '../../data/faction-definition-lookup';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import {
  REALM_DEFINITION_ID_PREFIX,
  REALM_RANK_LADDER,
  realmDefinitionId,
} from '../../data/realm-content';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

const SEED = 42;

let state: GameState;
let realms: GraphNode[];
let domainCultureIds: string[];
let domainNames: string[];

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  const built = initializeGameState(
    archetype, 'Realms', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  state = built.state;
  realms = state.graph.getNodesByType('actor')
    .filter(n => n.properties.factionClass === 'realm');
  const domains = (built.regionData?.domains ?? []).filter(d => typeof d.cultureId === 'string');
  domainCultureIds = [...new Set(domains.map(d => d.cultureId as string))];
  domainNames = domains.map(d => d.name);
});

describe('the Realm mint (THR-1155)', () => {
  it('mints one Realm per culture domain, and the map named it', () => {
    // The non-vacuity arm: a medium world seats 2–4 cultures, so if this is 0 the rest
    // of the file is asserting over an empty set and means nothing.
    expect(domainCultureIds.length).toBeGreaterThanOrEqual(2);
    expect(realms.length).toBe(domainCultureIds.length);

    // The Realm's name IS the domain label the border draws — one generator, so the
    // nation in the graph and the words over its ground cannot drift apart.
    expect([...realms.map(r => r.name)].sort()).toEqual([...domainNames].sort());

    for (const realm of realms) {
      expect(realm.properties.actorType).toBe('faction');
      expect(domainCultureIds).toContain(realm.properties.cultureId);
    }
  });

  it('gives every Realm a definition the lookup resolves — the door THR-1322 opened', () => {
    for (const realm of realms) {
      const defId = realm.properties.factionDefId as string;
      expect(defId.startsWith(REALM_DEFINITION_ID_PREFIX)).toBe(true);
      expect(defId).toBe(realmDefinitionId(realm.properties.cultureId as string));

      // Resolvable both ways a consumer can ask: with state in hand, and without it
      // (the overlay `publishDynamicFactionDefinitions` filled at game init).
      expect(getFactionDefinition(defId, state.dynamicFactionDefinitions)).not.toBeNull();
      expect(getFactionDefinition(defId)).not.toBeNull();

      // And never in the static catalogue: that map is what the game ships with.
      expect(FACTION_DEFINITIONS.has(defId)).toBe(false);
    }
  });

  it('carries the court ladder and the ambition weights the faction systems read', () => {
    for (const realm of realms) {
      const def = getFactionDefinition(realm.properties.factionDefId as string)!;
      expect(def.rankTiers.map(t => t.id)).toEqual([...REALM_RANK_LADDER]);
      // `scoreEligibleAmbitions` scores nothing without weights — this is the field
      // whose absence on `foundFaction` left a run-founded order ambitionless
      // (reported on THR-1322 in slice 2 part 1).
      expect(Object.keys(def.ambitionWeights ?? {}).length).toBeGreaterThan(0);
    }
  });

  it('holds towns by culture, not by list position, and never two Realms on one town', () => {
    let heldTotal = 0;
    const offenders: string[] = [];

    for (const realm of realms) {
      const held = state.graph.getOutgoingEdges(realm.id, 'controls');
      heldTotal += held.length;
      for (const edge of held) {
        const cultureEdge = state.graph.getOutgoingEdges(edge.target, 'belongs_to')
          .find(e => e.properties.cultureLayer !== 'historical');
        if (cultureEdge && cultureEdge.target !== realm.properties.cultureId) {
          offenders.push(`${edge.target}<-${realm.id}`);
        }
      }
    }

    expect(offenders).toEqual([]);
    expect(heldTotal).toBeGreaterThan(0);

    // One holder per town: the readers key on `getIncomingEdges(loc, 'controls')[0]`
    // (THR-1297), so two Realms on one Location would make the answer arbitrary.
    for (const location of state.graph.getNodesByType('location')) {
      const realmHolders = state.graph.getIncomingEdges(location.id, 'controls')
        .filter(e => state.graph.getNode(e.source)?.properties.factionClass === 'realm');
      expect(realmHolders.length).toBeLessThanOrEqual(1);
    }
  });

  it('seats each Realm that holds anything on exactly one of its own towns', () => {
    for (const realm of realms) {
      const held = state.graph.getOutgoingEdges(realm.id, 'controls');
      if (held.length === 0) continue;
      const seats = held.filter(e => e.properties.role === 'seat');
      expect(seats.length).toBe(1);
      // The seat is edge-internal data on a holding, not a second relationship.
      expect(state.graph.getNode(seats[0].target)?.type).toBe('location');
    }
  });

  it('belongs to its own culture', () => {
    for (const realm of realms) {
      const cultureEdges = state.graph.getOutgoingEdges(realm.id, 'belongs_to');
      expect(cultureEdges.length).toBeGreaterThanOrEqual(1);
      expect(cultureEdges.map(e => e.target)).toContain(realm.properties.cultureId);
    }
  });

  it('leaves ground outside every domain unheld — wilderness is real', () => {
    const placeTier = state.graph.getNodesByType('location')
      .filter(n => !n.properties.parentLocationId);
    const unheld = placeTier.filter(
      n => state.graph.getIncomingEdges(n.id, 'controls').length === 0,
    );
    // Falsifies the pre-THR-1155 shape directly: the round-robin gave *every* Location
    // in `locationIds` a holder, so this count could not have been positive.
    expect(unheld.length).toBeGreaterThan(0);
    expect(unheld.length).toBeLessThan(placeTier.length);
  });
});
