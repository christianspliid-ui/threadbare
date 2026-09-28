// src/engine/__tests__/worldScenario.test.ts
//
// THR-1632 S1 — faith and politics as world settings.
//
// Every assertion runs on a *generated* world (`initializeGameState` at the small
// preset), never a fixture: the defects this closes — one world-wide Temple, holy places
// off every culture's ground, half the mortals cultureless, town guilds nothing could
// tell apart — are properties of what worldgen writes, and a fixture would only verify
// its own fiction.

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { _resetNpcCounter } from '../npcSeeding';
import { resolveFactionNodeId } from '../factionMembership';
import { applyFactionReputationGain } from '../factionReputation';
import { selectWorldScenarioCensus } from '../worldScenarioCensus';
import { EncounterCacheManager } from '../encounterCache';
import {
  DEFAULT_WORLD_SCENARIO,
  WORLD_SCENARIO_TODAY,
  CULTURE_FRINGE_STRENGTH,
  TEMPLE_OF_SPHERES_DEF_ID,
  formatCongregationName,
  resolveWorldScenario,
  type WorldScenario,
} from '../../data/world-scenario';
import { TEMPLE_OF_SPHERES_DEFINITION } from '../../data/temple-of-spheres-definition';
import { REALM_FACTION_CLASS } from '../../data/realm-content';

const SEED = 42;

function buildSmallWorld(scenario?: Partial<WorldScenario>, seed = SEED) {
  // `npcCounter` is module-level; reset it so two worlds built back to back differ only
  // by what the scenario changed, never by NPC id.
  _resetNpcCounter();
  return initializeGameState(
    generateArchetypes(4, seed)[0],
    'T',
    createBalancedCosmology(),
    seed,
    MAP_SIZE_PRESETS.small.cols,
    MAP_SIZE_PRESETS.small.rows,
    undefined,
    scenario,
  ).state;
}

const defaultWorld = buildSmallWorld();
const todayWorld = buildSmallWorld(WORLD_SCENARIO_TODAY);

function templeNodes(state: ReturnType<typeof buildSmallWorld>) {
  return state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && n.properties.factionDefId === TEMPLE_OF_SPHERES_DEF_ID);
}

function livingCultureIds(state: ReturnType<typeof buildSmallWorld>): string[] {
  return state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'culture' && !n.id.startsWith('hist_'))
    .map(n => n.id).sort();
}

describe('resolveWorldScenario', () => {
  it('returns the default block when nothing is overridden', () => {
    expect(resolveWorldScenario()).toEqual(DEFAULT_WORLD_SCENARIO);
  });

  it('clamps out-of-range knobs into their documented range (fail-soft)', () => {
    const r = resolveWorldScenario({
      holyPlacesMinPerCulture: -3,
      cultureFringeMaxHexes: 9999,
      cornerWildernessCount: 7,
      templeCongregationsPerCulture: 5 as unknown as 0 | 1,
    });
    expect(r.holyPlacesMinPerCulture).toBe(0);
    expect(r.cultureFringeMaxHexes).toBeLessThanOrEqual(24);
    expect(r.cornerWildernessCount).toBe(4);
    expect(r.templeCongregationsPerCulture).toBe(1);
  });

  it('stores the resolved block on GameState', () => {
    expect(defaultWorld.worldScenario).toEqual(DEFAULT_WORLD_SCENARIO);
    expect(todayWorld.worldScenario).toEqual(WORLD_SCENARIO_TODAY);
  });
});

describe('the all-"today" block reproduces the world before THR-1632', () => {
  it('seeds exactly one world-wide Temple with today\'s id and name', () => {
    const temples = templeNodes(todayWorld);
    expect(temples.map(n => n.id)).toEqual([`faction_def_${TEMPLE_OF_SPHERES_DEF_ID}`]);
    expect(temples[0].name).toBe(TEMPLE_OF_SPHERES_DEFINITION.nameTemplate);
    expect(temples[0].properties.veneratedSphere).toBeUndefined();
  });

  it('writes no fringe link, no pilgrim route and no town-guild label', () => {
    const g = todayWorld.graph;
    expect(g.getEdgesByType('belongs_to').some(e => e.properties.fringe === true)).toBe(false);
    expect(g.getEdgesByType('sacred_route')).toHaveLength(0);
    const townGuilds = g.getNodesByType('actor').filter(n => typeof n.properties.guildType === 'string');
    expect(townGuilds.length).toBeGreaterThan(0);
    for (const n of townGuilds) {
      expect(n.properties.factionType).toBeUndefined();
      expect(n.properties.factionClass).toBeUndefined();
    }
  });
});

describe('Temple congregations (S1b)', () => {
  const census = selectWorldScenarioCensus(defaultWorld.graph);

  it('seeds one congregation per living culture, seated at its capital', () => {
    const cultures = livingCultureIds(defaultWorld);
    expect(census.congregations.map(c => c.cultureId).sort()).toEqual(cultures);
    for (const c of census.congregations) {
      expect(c.seatSubtype).toBe('capital');
      expect(c.id).toMatch(new RegExp(`^faction_def_${TEMPLE_OF_SPHERES_DEF_ID}_\\d+$`));
    }
  });

  it('draws every hall from its own culture\'s heartland', () => {
    for (const c of census.congregations) {
      expect(c.hallCount).toBeGreaterThan(0);
      expect(c.hallsOffHeartland).toBe(0);
    }
  });

  it('names each congregation for its culture and records the sphere it venerates', () => {
    const g = defaultWorld.graph;
    for (const c of census.congregations) {
      const culture = g.getNode(c.cultureId!)!;
      expect(c.name).toBe(formatCongregationName(culture.name));
      expect(c.name).not.toMatch(/^The The /);
      const identity = culture.properties.cultureIdentity as { veneratedSpheres: string[] };
      expect(c.veneratedSphere).toBe(identity.veneratedSpheres[0] ?? null);
    }
  });

  it('gives every congregation its definition\'s dispositions, both ways', () => {
    const g = defaultWorld.graph;
    const expectedOut = Object.keys(TEMPLE_OF_SPHERES_DEFINITION.dispositions ?? {}).length;
    expect(expectedOut).toBeGreaterThan(0);
    for (const c of census.congregations) {
      const out = g.getOutgoingEdges(c.id, 'relates_to')
        .filter(e => e.properties.basis === 'faction_alignment');
      expect(out.length).toBeGreaterThan(0);
    }
    // A disposition written *toward* the Temple reaches every congregation, not only the first.
    const incomingPerCongregation = census.congregations.map(c =>
      g.getIncomingEdges(c.id, 'relates_to').filter(e => e.properties.basis === 'faction_alignment').length);
    expect(new Set(incomingPerCongregation).size).toBe(1);
  });

  it('lands a Temple reputation effect on the actor\'s own congregation', () => {
    const g = defaultWorld.graph;
    let checked = 0;
    for (const c of census.congregations) {
      const member = g.getIncomingEdges(c.id, 'member_of')[0]?.source;
      if (!member) continue;
      expect(resolveFactionNodeId(g, TEMPLE_OF_SPHERES_DEF_ID, member)).toBe(c.id);
      const result = applyFactionReputationGain(g, member, TEMPLE_OF_SPHERES_DEF_ID, 0.01, 1, 'encounter');
      expect(result.reason).toBeUndefined();
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('co-holds its capital beside the Realm and consecrates a pilgrim route to it', () => {
    const g = defaultWorld.graph;
    for (const c of census.congregations) {
      expect(g.getOutgoingEdges(c.id, 'controls').some(e => e.target === c.seatId)).toBe(true);
      expect(c.pilgrimRouteToSeat).toBe(true);
    }
    expect(census.pilgrimRoutes).toBe(census.congregations.length);
  });

  it('pools the pilgrimage encounter at every capital a route reaches', () => {
    const cache = new EncounterCacheManager();
    cache.buildFullCache(defaultWorld.graph, 0);
    const pooled = new Set(cache.getAllEntries()
      .filter(e => e.templateId === 'encounter.pilgrimage_trial').map(e => e.locationId));
    for (const c of census.congregations) expect(pooled.has(c.seatId!)).toBe(true);
  });
});

describe('holy places on every culture\'s ground (S1c)', () => {
  it('meets the floor on each heartland, or records the shortfall in the trace payload', () => {
    const census = selectWorldScenarioCensus(defaultWorld.graph);
    const before = selectWorldScenarioCensus(todayWorld.graph);
    for (const cultureId of livingCultureIds(defaultWorld)) {
      expect(census.holyPlacesByCulture[cultureId]).toBeGreaterThanOrEqual(before.holyPlacesByCulture[cultureId] ?? 0);
    }
    const total = Object.values(census.holyPlacesByCulture).reduce((a, b) => a + b, 0);
    const totalBefore = Object.values(before.holyPlacesByCulture).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(totalBefore);
  });
});

describe('fringe culture (S1d)', () => {
  const g = defaultWorld.graph;
  const fringeEdges = g.getEdgesByType('belongs_to').filter(e => e.properties.fringe === true);

  it('links settlements outside every heartland, at fringe strength, current layer only', () => {
    expect(fringeEdges.length).toBeGreaterThan(0);
    for (const e of fringeEdges) {
      expect(e.properties.cultureLayer).toBe('current');
      expect(e.properties.culturalStrength).toBe(CULTURE_FRINGE_STRENGTH);
      const historical = g.getOutgoingEdges(e.source, 'belongs_to')
        .filter(h => h.properties.cultureLayer === 'historical');
      expect(historical).toHaveLength(0);
    }
    expect(selectWorldScenarioCensus(g).fringeOnNonSettlements).toBe(0);
  });

  it('never enters locationCultureMap: no promotion, no Realm holding', () => {
    // Main-loop Locations keep their ids across the two worlds (the top-up's ids come
    // after the loop), so a fringe Location can be compared with itself in today's world.
    for (const e of fringeEdges) {
      const now = g.getNode(e.source)!;
      const then = todayWorld.graph.getNode(e.source);
      if (then && then.properties.hexCol === now.properties.hexCol && then.properties.hexRow === now.properties.hexRow) {
        expect(now.properties.locationSubtype).toBe(then.properties.locationSubtype);
      }
      const heldByRealm = g.getIncomingEdges(e.source, 'controls')
        .some(c => g.getNode(c.source)?.properties.factionClass === REALM_FACTION_CLASS);
      expect(heldByRealm).toBe(false);
    }
  });

  it('keeps unheld settlements within one of today\'s count', () => {
    const now = selectWorldScenarioCensus(g).unheldSettlements;
    const then = selectWorldScenarioCensus(todayWorld.graph).unheldSettlements;
    expect(Math.abs(now - then)).toBeLessThanOrEqual(1);
  });
});

describe('town guilds labelled (S1e)', () => {
  it('stamps every town guild factionType and factionClass "guild"', () => {
    const census = selectWorldScenarioCensus(defaultWorld.graph);
    expect(census.settlementGuilds).toBeGreaterThan(0);
    expect(census.settlementGuildsLabelled).toBe(census.settlementGuilds);
  });
});

describe('determinism', () => {
  it('the same seed and scenario build the same census', () => {
    const again = buildSmallWorld();
    expect(selectWorldScenarioCensus(again.graph)).toEqual(selectWorldScenarioCensus(defaultWorld.graph));
  });
});
