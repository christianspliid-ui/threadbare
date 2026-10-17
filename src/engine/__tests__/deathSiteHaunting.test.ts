/**
 * THR-1925 — death-site haunting is bounded pressure, not a per-tick add.
 *
 * Before: Reckoning (+3/tick) against decay 1/tick pinned a town with one death at 100
 * forever. After: the town settles at or below DEATH_SITE_UNREST_TARGET_MAX and decays
 * back to 0 once the haunting window since the last death has passed.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseProsperity } from '../phaseProsperity';
import { phaseUnrest } from '../phaseUnrest';
import { readUnrestInputs } from '../unrestPressure/inputs';
import { computeDeathSiteUnrestTarget, readLastDeathTick } from '../deathSiteHaunting';
import {
  DEATH_SITE_UNREST_TARGET_MAX,
  DEATH_SITE_UNREST_TARGET_SCALE,
  DEATH_SITE_HAUNTING_WINDOW_TICKS,
  DEATH_SITE_UNREST_TARGET_PROPERTY,
} from '../../data/death-site-unrest-constants';
import type { GameState } from '../../types/gameState';

const RECKONING_BONUS = 3;

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    tick,
    graph,
    tiles: [],
    doomIdentityMatrix: {
      locationPressure: { frontierDelta: 0, centerDelta: 0, deathSiteUnrestBonus: RECKONING_BONUS },
    },
  } as unknown as GameState;
}

function addTown(graph: WorldGraph, props: Record<string, unknown>): void {
  graph.addNode({
    id: 'loc.town', type: 'location', name: 'Ashfield',
    // prosperity 50 keeps the prosperity damper off, so decay is exactly 1/tick
    properties: { locationSubtype: 'town', prosperity: 50, populationHealth: 100, unrest: 0, ...props },
  });
}

function unrestOf(graph: WorldGraph): number {
  return graph.getNode('loc.town')!.properties.unrest as number;
}

describe('computeDeathSiteUnrestTarget (THR-1925)', () => {
  it('peaks at bonus × scale, capped at the max', () => {
    const props = { deathCount: 1, lastDeathTick: 100 };
    expect(computeDeathSiteUnrestTarget(props, 1, 100)).toBe(DEATH_SITE_UNREST_TARGET_SCALE);
    expect(computeDeathSiteUnrestTarget(props, 99, 100)).toBe(DEATH_SITE_UNREST_TARGET_MAX);
  });

  it('fades linearly and reaches 0 at the window', () => {
    const props = { deathCount: 5, lastDeathTick: 0 };
    const peak = computeDeathSiteUnrestTarget(props, RECKONING_BONUS, 0);
    expect(computeDeathSiteUnrestTarget(props, RECKONING_BONUS, DEATH_SITE_HAUNTING_WINDOW_TICKS / 2)).toBeCloseTo(peak / 2);
    expect(computeDeathSiteUnrestTarget(props, RECKONING_BONUS, DEATH_SITE_HAUNTING_WINDOW_TICKS)).toBe(0);
  });

  it('is 0 with no dead, no bonus, or dead that predate the stamp', () => {
    expect(computeDeathSiteUnrestTarget({ deathCount: 0, lastDeathTick: 5 }, RECKONING_BONUS, 5)).toBe(0);
    expect(computeDeathSiteUnrestTarget({ deathCount: 5, lastDeathTick: 5 }, 0, 5)).toBe(0);
    expect(computeDeathSiteUnrestTarget({ deathCount: 5 }, RECKONING_BONUS, 5)).toBe(0);
  });

  it('takes the latest of the death, fight and battle stamps', () => {
    expect(readLastDeathTick({ lastDeathTick: 10, lastFightTick: 30, lastBattleTick: 20 })).toBe(30);
    expect(readLastDeathTick({})).toBeUndefined();
  });
});

describe('phaseProsperity death-site unrest under Reckoning (THR-1925)', () => {
  it('a place with deathCount 5 settles at or below the cap, then decays back after the window', () => {
    const graph = new WorldGraph();
    addTown(graph, { deathCount: 5, lastDeathTick: 0 });

    let peak = 0;
    // Ten days inside the window: never above the cap (the old code reached 100 in ~50 ticks).
    for (let tick = 0; tick < DEATH_SITE_HAUNTING_WINDOW_TICKS; tick++) {
      phaseProsperity(makeState(graph, tick));
      phaseUnrest(makeState(graph, tick));
      peak = Math.max(peak, unrestOf(graph));
    }
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual(DEATH_SITE_UNREST_TARGET_MAX);

    // Past the window the haunting is gone: THR-1934's deathSite input reads 0 and the
    // town settles on what it lives through without its dead.
    for (let tick = DEATH_SITE_HAUNTING_WINDOW_TICKS; tick < DEATH_SITE_HAUNTING_WINDOW_TICKS * 2; tick++) {
      phaseProsperity(makeState(graph, tick));
      phaseUnrest(makeState(graph, tick));
    }
    const town = graph.getNode('loc.town')!;
    expect(readUnrestInputs(town)?.deathSite).toBe(0);
    expect(unrestOf(graph)).toBeCloseTo(town.properties.unrestTarget as number, 5);
    expect(graph.getNode('loc.town')!.properties[DEATH_SITE_UNREST_TARGET_PROPERTY]).toBe(0);
  });

  it('never lowers unrest that other causes raised above the haunting target', () => {
    const graph = new WorldGraph();
    addTown(graph, { deathCount: 5, lastDeathTick: 0, unrest: 60 });
    phaseProsperity(makeState(graph, 0));
    expect(unrestOf(graph)).toBe(60);
  });

  it('an old death with no stamp adds nothing', () => {
    const graph = new WorldGraph();
    addTown(graph, { deathCount: 5 });
    for (let tick = 0; tick < 48; tick++) phaseProsperity(makeState(graph, tick));
    expect(unrestOf(graph)).toBe(0);
  });
});

describe('markMortalDead stamps the outer-tier Location (THR-1925)', () => {
  it('a death in a tavern counts for its town', async () => {
    const { markMortalDead } = await import('../agentLifecycle');
    const graph = new WorldGraph();
    addTown(graph, {});
    graph.addNode({ id: 'loc.tavern', type: 'location', name: 'The Gilded Cup', properties: { parentLocationId: 'loc.town', locationSubtype: 'tavern' } });
    graph.addNode({ id: 'agent.1', type: 'actor', name: 'Mara', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.at', source: 'agent.1', target: 'loc.tavern', type: 'located_at', properties: {} });

    const result = markMortalDead(graph, 'agent.1', 40, { cause: 'lifecycle', mode: 'retain' });
    expect(result.outcome).not.toBe('not_a_mortal');
    const town = graph.getNode('loc.town')!.properties;
    expect(town.deathCount).toBe(1);
    expect(town.lastDeathTick).toBe(40);
    expect(graph.getNode('loc.tavern')!.properties.deathCount).toBeUndefined();
  });
});
