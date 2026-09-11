/**
 * The realm census, on a generated world — THR-1155 slice 2's census Done-when.
 *
 * *"`census:seeded-world` reports Realms = domains and every Location with a hex inside
 * a domain controlled by its Realm."* The instrument is `scripts/realm-census.ts`; this
 * is the assertion that it reports a true thing, taken against a world real worldgen
 * produced rather than a fixture. A fixture would have verified that the census can
 * count a graph somebody wrote to satisfy it — which is the shape that passes while the
 * mint is broken.
 *
 * The verdict's own falsifiability is pinned separately on built graphs: the vacuous
 * world, the missing Realm, and the unheld town are cases worldgen does not produce,
 * and a gate nobody has seen go red is not a gate.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { WorldGraph } from '../../src/engine/graph';
import { buildRealmCensus, realmCensusVerdict } from '../realm-census';
import { REALM_FACTION_CLASS } from '../../src/data/realm-content';
import type { GameState } from '../../src/types/gameState';

const SEED = 42;

let state: GameState;

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  state = initializeGameState(
    archetype, 'Census', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  ).state;
});

/** One Realm, one culture, one town inside it — the smallest world the verdict reads. */
function buildOneRealmWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'culture_0', type: 'actor', name: 'The Culture',
    properties: { actorType: 'culture' },
  });
  graph.addNode({
    id: 'faction_0', type: 'actor', name: 'The Realm',
    properties: { actorType: 'faction', factionClass: REALM_FACTION_CLASS, cultureId: 'culture_0' },
  });
  graph.addNode({
    id: 'loc_0', type: 'location', name: 'Ashford',
    properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 },
  });
  graph.addEdge({
    id: 'e_culture', source: 'loc_0', target: 'culture_0', type: 'belongs_to',
    properties: { cultureLayer: 'current' },
  });
  graph.addEdge({
    id: 'e_controls', source: 'faction_0', target: 'loc_0', type: 'controls',
    properties: { influence: 0.5, role: 'seat' },
  });
  return graph;
}

describe('the realm census, on a generated world (THR-1155)', () => {
  it('reports one Realm per culture domain', () => {
    const census = buildRealmCensus(state.graph);

    expect(census.domains).toBeGreaterThan(0);
    expect(census.realms).toBe(census.domains);
    // And each Realm names a domain that exists — equal counts alone would pass a
    // world with three Realms and three domains that do not correspond.
    expect(census.realmsWithDomain).toBe(census.realms);
  });

  it('leaves no Location inside a domain held by nobody', () => {
    const census = buildRealmCensus(state.graph);

    expect(census.locationsInDomain).toBeGreaterThan(0);
    expect(census.unheld).toBe(0);
    // The two accounted-for buckets are the whole population, so a Location cannot be
    // counted in the denominator and quietly absent from both.
    expect(census.heldByTheirRealm + census.cededToDefinitionFaction)
      .toBe(census.locationsInDomain);
    // Most of them are the Realm's own — `ceded` is the guild-hall reconciliation's
    // handful, and a world where it had swallowed the political map would pass the
    // `unheld === 0` gate while meaning the opposite.
    expect(census.heldByTheirRealm).toBeGreaterThan(census.cededToDefinitionFaction);
  });

  it('every Realm on a generated world holds at least one town', () => {
    const census = buildRealmCensus(state.graph);
    const holdings = Object.values(census.heldPerRealm);

    expect(holdings).toHaveLength(census.realms);
    expect(holdings.every(n => n > 0)).toBe(true);
  });

  it('the generated world passes the verdict', () => {
    expect(realmCensusVerdict(buildRealmCensus(state.graph))).toEqual({
      ok: true,
      reason: 'one realm per domain; every domain location held',
    });
  });
});

describe('the verdict goes red on the cases worldgen does not produce (THR-1155)', () => {
  it('fails when a domain has no Realm', () => {
    const graph = buildOneRealmWorld();
    graph.removeNode('faction_0');

    const verdict = realmCensusVerdict(buildRealmCensus(graph));
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('realms 0 != domains 1');
  });

  it('fails when a Location inside a domain is held by nobody', () => {
    const graph = buildOneRealmWorld();
    graph.removeEdge('e_controls');

    const verdict = realmCensusVerdict(buildRealmCensus(graph));
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('1 location(s) inside a domain held by nobody');
  });

  it('fails when a Realm names a culture no Location belongs to', () => {
    const graph = buildOneRealmWorld();
    graph.addNode({
      id: 'faction_1', type: 'actor', name: 'The Phantom',
      properties: { actorType: 'faction', factionClass: REALM_FACTION_CLASS, cultureId: 'culture_ghost' },
    });
    graph.addNode({
      id: 'culture_1', type: 'actor', name: 'Second Culture',
      properties: { actorType: 'culture' },
    });
    graph.addNode({
      id: 'loc_1', type: 'location', name: 'Elsewhere',
      properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 },
    });
    graph.addEdge({
      id: 'e_culture_1', source: 'loc_1', target: 'culture_1', type: 'belongs_to',
      properties: { cultureLayer: 'current' },
    });
    graph.addEdge({
      id: 'e_controls_1', source: 'faction_1', target: 'loc_1', type: 'controls',
      properties: { influence: 0.5 },
    });

    // Counts match — 2 Realms, 2 domains — and the world is still wrong, which is why
    // the verdict checks correspondence rather than cardinality.
    const census = buildRealmCensus(graph);
    expect(census.realms).toBe(2);
    expect(census.domains).toBe(2);

    const verdict = realmCensusVerdict(census);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('1 realm(s) name a domain that does not exist');
  });

  it('says so rather than reporting a healthy nil on a world with no domains', () => {
    const verdict = realmCensusVerdict(buildRealmCensus(new WorldGraph()));
    expect(verdict.reason).toContain('vacuous');
  });
});
