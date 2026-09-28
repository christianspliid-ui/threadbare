// src/engine/__tests__/worldPast.test.ts
//
// THR-1631 S1 — the past on the graph. Asserted on a *generated* small world
// (`initializeGameState`), never a fixture: the pass derives everything from what
// worldgen already placed, so a fixture would only verify its own fiction.

import { describe, it, expect, afterEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { _resetNpcCounter } from '../npcSeeding';
import { resetEventCounter } from '../orchestrator';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { readWorldPast, getPlacePast, isSeededDead, realmNeighbourPairs, TICKS_PER_YEAR } from '../worldPast';
import { selectClueRecipient } from '../ruins/clueLifecycle';
import { getAgentsAtLocation } from '../graphQueries';
import { pickTargetAgent } from '../phases/routeEvents';
import { WORLD_PAST_DEFAULTS } from '../../data/world-past-constants';
import type { WorldGraph } from '../graph';
import type { WorldPastDescentStratum } from '../../types/worldPast';

const SEED = 42;

function buildWorld(seed = SEED) {
  _resetNpcCounter();
  resetEventCounter();
  resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS.small;
  return initializeGameState(generateArchetypes(4, seed)[0], 'T', createBalancedCosmology(), seed, preset.cols, preset.rows).state;
}

const PAST_PROPS = ['foundedYearsAgo', 'backstoryStrata', 'originCultureId'] as const;

/** The graph minus everything the past pass writes — the "today's t0" projection. */
function withoutPast(graph: WorldGraph) {
  const pastNodeIds = new Set(graph.getAllNodes().filter(n => n.properties.pastOrigin === 'worldgen').map(n => n.id));
  const nodes = graph.getAllNodes()
    .filter(n => !pastNodeIds.has(n.id))
    .map(n => {
      const props: Record<string, unknown> = { ...n.properties };
      for (const k of PAST_PROPS) {
        // Ruins carry their own `originCultureId` from ruin seeding; only individuals gain it here.
        if (k === 'originCultureId' && props.actorType !== 'individual') continue;
        delete props[k];
      }
      return JSON.stringify([n.id, n.type, n.name, props]);
    })
    .sort();
  const edges = graph.getAllEdges()
    .filter(e => !pastNodeIds.has(e.source) && !pastNodeIds.has(e.target))
    .map(e => JSON.stringify([e.id, e.type, e.source, e.target, e.properties]))
    .sort();
  return { nodes, edges };
}

afterEach(() => { WORLD_PAST_DEFAULTS.enabled = true; });

describe('worldPast — the past on the graph (THR-1631 S1)', () => {
  it('is deterministic: the same seed reads back the same past', () => {
    const a = readWorldPast(buildWorld().graph);
    const b = readWorldPast(buildWorld().graph);
    expect(a).toEqual(b);
    expect(a.settling.length).toBeGreaterThan(0);
  });

  it('with the pass disabled, the t0 graph is exactly today’s — and enabling it moves nothing that existed', () => {
    WORLD_PAST_DEFAULTS.enabled = false;
    const off = buildWorld().graph;
    expect(off.getAllNodes().some(n => n.properties.pastOrigin === 'worldgen')).toBe(false);
    expect(off.getAllNodes().some(n => n.properties.foundedYearsAgo != null || n.properties.backstoryStrata != null)).toBe(false);
    WORLD_PAST_DEFAULTS.enabled = true;
    const on = buildWorld().graph;
    // Own PRNG stream, run after every other draw: stripping the pass's writes
    // recovers the disabled world byte for byte.
    expect(withoutPast(on)).toEqual(withoutPast(off));
  });

  it('writes at most six events and ten dead, in the run-time death shape', () => {
    const g = buildWorld().graph;
    const events = g.getNodesByType('event').filter(n => n.properties.pastOrigin === 'worldgen');
    expect(events.length).toBeLessThanOrEqual(WORLD_PAST_DEFAULTS.eventsMax);
    for (const ev of events) {
      expect(['past_elder_war', 'past_war']).toContain(ev.properties.eventType);
      expect(ev.properties.tick).toBe(-(ev.properties.pastYearsAgo as number) * TICKS_PER_YEAR);
    }
    const dead = g.getNodesByType('actor').filter(isSeededDead);
    expect(dead.length).toBeGreaterThan(0);
    expect(dead.length).toBeLessThanOrEqual(WORLD_PAST_DEFAULTS.deadMax);
    for (const d of dead) {
      expect(d.properties.actorType).toBe('individual');
      expect(d.properties.spotlightTier).toBe('ambient');
      expect(d.properties.deceased).toBe(true);
      expect(d.properties.deceasedTick as number).toBeLessThan(0);
      expect(['battle', 'lifecycle']).toContain(d.properties.deathCause);
      expect(['founder', 'fallen_commander', 'wonder_finder']).toContain(d.properties.pastRole);
      // No second death spelling.
      expect(d.properties.alive).toBeUndefined();
      expect(d.properties.status).toBeUndefined();
      expect(g.getOutgoingEdges(d.id, 'located_at')).toHaveLength(1);
    }
  });

  it('gives every settlement a founding age, and each Realm seat the oldest of its Realm plus a named founder', () => {
    const g = buildWorld().graph;
    const view = readWorldPast(g);
    const founders = view.settling.filter(s => s.founderId);
    expect(founders.length).toBeGreaterThan(0);
    for (const s of founders) {
      const founder = g.getNode(s.founderId!);
      expect(founder?.properties.pastRole).toBe('founder');
      expect(typeof founder?.name).toBe('string');
      expect(founder?.name).not.toMatch(/^actor\./);
      const edge = g.getOutgoingEdges(s.settlementId, 'constructed_by').find(e => e.target === s.founderId);
      expect(edge?.properties.structureType).toBe('founding');
      // Builder's Legacy counts only edges stamped since the mandate began (THR-1618).
      expect(edge?.properties.tick).toBeUndefined();
    }
    if (view.elderAge.war) {
      for (const s of view.settling) expect(s.yearsAgo).toBeLessThan(view.elderAge.war.yearsAgo);
    }
  });

  it('stores who won a living-memory war on the Realms’ participated_in edges', () => {
    const g = buildWorld().graph;
    for (const war of readWorldPast(g).livingMemory) {
      expect(war.winnerId).not.toBe(war.loserId);
      const roles = g.getIncomingEdges(war.eventId, 'participated_in')
        .filter(e => war.realmIds.includes(e.source))
        .map(e => e.properties.role).sort();
      expect(roles).toEqual(['loser', 'winner']);
      expect(g.getNode(war.eventId)?.properties.winnerId).toBeUndefined();
      for (const fallen of war.fallenIds) {
        const member = g.getOutgoingEdges(fallen, 'member_of').find(e => e.target === war.loserId);
        expect(member?.properties.rank).toBe(WORLD_PAST_DEFAULTS.commanderRank);
      }
    }
    // Pairs are symmetric-free and sorted.
    for (const [a, b] of realmNeighbourPairs(g)) expect(a < b).toBe(true);
  });

  it('getPlacePast claims a fall only where an engine fact backs it', () => {
    const g = buildWorld().graph;
    const view = readWorldPast(g);
    const sites = new Set([...(view.elderAge.war?.siteIds ?? []), ...view.livingMemory.flatMap(w => (w.burnedTownId ? [w.burnedTownId] : []))]);
    for (const loc of g.getNodesByType('location')) {
      const past = getPlacePast(g, loc.id);
      if (past?.fellInEventId) expect(sites.has(loc.id)).toBe(true);
    }
  });

  it('the dead are not residents: location readers and seed targeting skip them', () => {
    const state = buildWorld();
    const g = state.graph;
    const dead = g.getNodesByType('actor').filter(isSeededDead);
    expect(dead.length).toBeGreaterThan(0);
    for (const d of dead) {
      const at = g.getOutgoingEdges(d.id, 'located_at')[0].target;
      expect(getAgentsAtLocation(g, at).map(n => n.id)).not.toContain(d.id);
      // Seed 99 drew a seeded founder for a scarcity quest before this reader skipped the dead.
      expect(pickTargetAgent(state, [at])).not.toBe(d.id);
    }
  });

  it('writes descent on some mortals on old land, and clue scoring reads the seeded stratum', () => {
    const state = buildWorld();
    const g = state.graph;
    const descended = g.getNodesByType('actor').filter(n =>
      Array.isArray(n.properties.backstoryStrata)
      && (n.properties.backstoryStrata as WorldPastDescentStratum[]).some(s => s.relation === 'descent'));
    expect(descended.length).toBeGreaterThan(0);
    const mortal = descended[0];
    const stratum = (mortal.properties.backstoryStrata as WorldPastDescentStratum[])[0];
    // Prove the *stratum* is what is read, not the sibling `originCultureId`.
    delete mortal.properties.originCultureId;
    const pick = (ruinCulture: string) => selectClueRecipient({
      candidatePool: [mortal.id],
      ruinMagnitude: 0,
      ruinSphereAlignment: 'none',
      ruinOriginCultureId: ruinCulture,
      ascendantId: 'none',
      tick: 0,
      graph: g,
      encounterProgress: [],
      rng: () => 0.5,
    });
    expect(pick(stratum.cultureId).scores[0].cultureBackstoryTieBonus).toBeGreaterThan(0);
    expect(pick('hist_culture_nobody').scores[0].cultureBackstoryTieBonus).toBe(0);
  });
});
