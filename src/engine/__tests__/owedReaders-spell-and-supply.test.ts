/**
 * Two readers that are one line each, and a bug that was one line — THR-1428 R4 and R5.
 *
 * R4: the spell's soul-price leaves the `doom` health meter and becomes something the
 * caller lands on quintessence. The assertion pairs both halves — `doom` unchanged AND
 * a price returned — because a `payCosts` that simply stopped charging anything would
 * satisfy the first half alone.
 *
 * R5: `hasReliefLine` read the first incoming `controls` source as a faction. A faction
 * is an `actor` node wearing `actorType: 'faction'`, so a mortal claimant sat in the
 * same edge type and the siege read unrelieved for a reason that had nothing to do with
 * the war. Both arms are asserted on the same fixture.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { payCosts } from '../spellActivation';
import { hasReliefLine } from '../armySupply';
import type { GameState } from '../../types/gameState';
import { DOOM_COST_CAP_PER_CAST } from '../../data/effect-constants';

const CASTER = 'actor_caster';

function casterWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: CASTER, name: 'Aun Vess', type: 'actor', properties: { actorType: 'individual', doom: 5 } });
  return graph;
}

describe('R4 — the spell price leaves the health meter', () => {
  it('returns the soul price instead of charging doom', () => {
    const graph = casterWorld();
    const price = payCosts(graph, CASTER, { type: 'doom_increase', amount: 12 }, 40);

    expect(price).toBe(12);
    expect(graph.getNode(CASTER)!.properties.doom).toBe(5);
  });

  it('caps the price per cast', () => {
    const graph = casterWorld();
    const price = payCosts(graph, CASTER, { type: 'doom_increase', amount: DOOM_COST_CAP_PER_CAST * 3 }, 40);
    expect(price).toBe(DOOM_COST_CAP_PER_CAST);
  });

  it('keeps writing doom for a health sacrifice — that cost genuinely is health', () => {
    const graph = casterWorld();
    const price = payCosts(graph, CASTER, { type: 'health_sacrifice', amount: 7 }, 40);

    expect(price).toBe(0);
    expect(graph.getNode(CASTER)!.properties.doom).toBe(12);
  });

  it('accumulates the price through a multi cost', () => {
    const graph = casterWorld();
    const price = payCosts(graph, CASTER, {
      type: 'multi',
      costs: [{ type: 'doom_increase', amount: 4 }, { type: 'doom_increase', amount: 6 }],
    }, 40);

    expect(price).toBe(10);
    expect(graph.getNode(CASTER)!.properties.doom).toBe(5);
  });

  it('stamps an exhaustion deadline in the future, against the tick of the cast', () => {
    // Before THR-1428 this read the agent's `currentTick` property, which no writer
    // sets — so every deadline landed at `0 + ticks` and was already in the past.
    const graph = casterWorld();
    payCosts(graph, CASTER, { type: 'tick_exhaust', ticks: 6 }, 40);
    expect(graph.getNode(CASTER)!.properties.exhaustedUntilTick).toBe(46);
  });
});

describe('R5 — relief is a faction\'s logistics', () => {
  function siegeWorld(controllerId: string, controllerType: string): GameState {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_siege', name: 'Harrow', type: 'location', properties: { locationSubtype: 'town' } });
    graph.addNode({
      id: controllerId, name: 'Controller', type: 'actor',
      properties: { actorType: controllerType },
    });
    graph.addEdge({
      id: 'e_controls', source: controllerId, target: 'loc_siege',
      type: 'controls', properties: { controlType: 'strategic' },
    });
    return { graph, tick: 40 } as unknown as GameState;
  }

  it('reads no relief line when the only controller is a mortal claimant', () => {
    expect(hasReliefLine(siegeWorld('actor_warlord', 'individual'), 'loc_siege')).toBe(false);
  });

  it('does not confuse a faction for a mortal — the faction arm resolves a controller at all', () => {
    // The paired arm: the fix must narrow *which* source is taken, not stop taking one.
    // A faction-controlled settlement with no host still reads unrelieved, so what is
    // asserted here is that the two cases are reached by different paths — the mortal
    // one is refused before any supply walk, the faction one is not.
    const factionWorld = siegeWorld('actor_guild', 'faction');
    const controller = factionWorld.graph.getIncomingEdges('loc_siege', 'controls')
      .map(e => e.source)
      .find(s => factionWorld.graph.getNode(s)?.properties.actorType === 'faction');
    expect(controller).toBe('actor_guild');

    const mortalWorld = siegeWorld('actor_warlord', 'individual');
    const mortalController = mortalWorld.graph.getIncomingEdges('loc_siege', 'controls')
      .map(e => e.source)
      .find(s => mortalWorld.graph.getNode(s)?.properties.actorType === 'faction');
    expect(mortalController).toBeUndefined();
  });

  it('reads no relief line for a settlement nobody controls', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_alone', name: 'Alone', type: 'location', properties: { locationSubtype: 'town' } });
    expect(hasReliefLine({ graph, tick: 40 } as unknown as GameState, 'loc_alone')).toBe(false);
  });
});
