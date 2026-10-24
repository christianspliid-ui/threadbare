/**
 * The crown — a liege pays for its vassal's raise (THR-2020).
 *
 * A sworn vassal that keeps a standing army, fields none, and is refused a raise only by
 * its purse gets one paid by its liege, from the liege's purse above
 * LIEGE_WAGE_RESERVE_DAYS of its own upkeep, at most once per LIEGE_RAISE_MIN_GAP_DAYS.
 * The seed-level share of armed sworn company-days is measured by
 * `npm run measure:crown-wages`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { ArmyState } from '../../types/army';
import { ARMY_CREATION_GOLD_COST } from '../../types/army';
import { runCrownPhase, swearOathForDebug } from '../crown';
import { readOath, oathOf } from '../crown/crownView';
import { armyRefusal, wouldRaiseSize } from '../armySpawning';
import { armiesOf, upkeepOf } from '../factionPurse/upkeep';
import { commanderFactionOf } from '../warAims/enemy';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';
import { LIEGE_RAISE_MIN_GAP_DAYS, LIEGE_WAGE_RESERVE_DAYS } from '../../data/crown-constants';
import { PURSE_CYCLE_TICKS, ARMY_UPKEEP_PER_DAY } from '../../data/faction-purse-constants';

const R = 'faction_0';     // the liege realm
const CO = 'faction_co';   // a free company
const TOWN = 'loc_town';   // R's seat
const CAMP = 'loc_camp';   // the company's hall town

/** A free company with a Gold tier, a captain and a standing ambition, but no army and no coin. */
function world(liegeWealth: number): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: R, name: 'Hold of Witness Skyfield', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: liegeWealth } });
  g.addNode({
    id: CO, name: 'Scarlet Company', type: 'actor',
    properties: { actorType: 'faction', factionClass: 'mercenary', factionDefId: 'mercenary_company', homeLocationId: CAMP, wealth: 0, domainCapabilities: { gold: 16, iron: 20 } },
  });
  for (const [id, name, col] of [[TOWN, 'Millbrook', 1], [CAMP, 'Ashford', 2]] as const) {
    g.addNode({ id, name, type: 'location', properties: { locationSubtype: 'town', hexCol: col, hexRow: 1, resourceBalance: 10 } });
  }
  g.addEdge({ id: 'e_ctl_town', source: R, target: TOWN, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_road', source: CAMP, target: TOWN, type: 'road', properties: {} });
  g.addNode({ id: 'captain', type: 'actor', name: 'Captain Vey', properties: { actorType: 'individual', domainCapabilities: { iron: 20, gold: 20 } } });
  g.addEdge({ id: 'e_mo_captain', source: 'captain', target: CO, type: 'member_of', properties: { role: 'member', rank: 'sellsword', joinedTick: 0 } });
  g.addEdge({ id: 'e_at_captain', source: 'captain', target: CAMP, type: 'located_at', properties: {} });
  g.addNode({ id: 'amb_co', type: 'ambition', name: 'Sell the sword', properties: { ambitionType: 'resource_acquisition', priority: 0.5, targetNodeId: null, createdTick: 0 } });
  g.addEdge({ id: 'e_pursues_co', source: CO, target: 'amb_co', type: 'pursues', properties: {} });
  return g;
}

function stateAt(graph: WorldGraph, tick: number): GameState {
  return { graph, tick, seed: 42, chronicleEntries: [], tiles: [], ascendantId: 'asc' } as unknown as GameState;
}

/** The company sworn to R at `tick`, refused a raise by its purse alone. */
function sworn(liegeWealth: number, tick = 24): { g: WorldGraph; s: GameState } {
  const g = world(liegeWealth);
  const s = stateAt(g, tick);
  expect(swearOathForDebug(s, CO, R, 'bought')).toBe(true);
  g.getNode(CO)!.properties.wealth = 0;
  expect(armyRefusal(s, CO)).toBe('purse');
  return { g, s };
}

const wealth = (g: WorldGraph, id: string) => Number(g.getNode(id)!.properties.wealth ?? 0);
const raiseCost = (size: ArmyState['size']) => ARMY_CREATION_GOLD_COST + upkeepOf(size);

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('the liege pays for a raise its vassal cannot', () => {
  it('raises an army for the company, from the liege\'s purse, stamped as paid by the liege', () => {
    const { g, s } = sworn(1000);
    const before = wealth(g, R);
    const result = runCrownPhase(s);
    expect(result.raisesFunded).toBe(1);
    const armies = armiesOf(g, CO);
    expect(armies).toHaveLength(1);
    const as = g.getNode(armies[0].id)!.properties.armyState as ArmyState;
    expect(as.liegePaidTick).toBe(s.tick);
    expect(as.paidThroughTick).toBe(s.tick);
    // Stamped before it aims: the army is the liege's from its first objective.
    expect(commanderFactionOf(g, armies[0].id, s.tick)).toBe(R);
    // The vassal's purse is untouched; the liege paid the raise and its first day (plus any tax in).
    expect(wealth(g, CO)).toBe(0);
    const cost = raiseCost(as.size);
    expect(before - wealth(g, R)).toBeCloseTo(cost, 6);
    expect(readOath(oathOf(g, CO)!).liegeRaisedTick).toBe(s.tick);
    const trace = getTraces().find(t => t.category === 'oath_raise_funded') as unknown as { cost: number; armyId: string };
    expect(trace.cost).toBe(cost);
    expect(trace.armyId).toBe(armies[0].id);
  });

  it('never takes the liege below its reserve of its own soldiers\' pay', () => {
    // R fields one host of its own: its reserve is LIEGE_WAGE_RESERVE_DAYS × that host's upkeep.
    const reserve = LIEGE_WAGE_RESERVE_DAYS * ARMY_UPKEEP_PER_DAY.host;
    const { g, s } = sworn(1000);
    // Set after the oath: a bought oath's gift has already left the liege's purse.
    g.getNode(R)!.properties.wealth = reserve + raiseCost(wouldRaiseSize(g, CO)) - 1;
    g.addNode({
      id: 'army_r', type: 'actor', name: 'army_r host',
      properties: { actorType: 'group', groupKind: 'army', armyState: { size: 'host', headcount: 300, objective: null, cohesion: 60, cohesionMax: 60, raisedTick: 0, maintenanceCost: 5, thresholdsFired: [], paidThroughTick: 0 } },
    });
    g.addEdge({ id: 'e_mo_army_r', source: 'army_r', target: R, type: 'member_of', properties: { role: 'army' } });
    g.addEdge({ id: 'e_at_army_r', source: 'army_r', target: TOWN, type: 'located_at', properties: {} });
    expect(runCrownPhase(s).raisesFunded).toBe(0);
    expect(armiesOf(g, CO)).toHaveLength(0);
  });

  it('a vassal refused for anything but coin gets no raise (no captain)', () => {
    const { g, s } = sworn(1000);
    g.removeNode('captain');
    expect(armyRefusal(s, CO)).toBe('no_commander');
    expect(runCrownPhase(s).raisesFunded).toBe(0);
    expect(armiesOf(g, CO)).toHaveLength(0);
  });

  it('one raise per vassal per LIEGE_RAISE_MIN_GAP_DAYS: a host lost at once is not re-bought daily', () => {
    const { g, s } = sworn(1000);
    expect(runCrownPhase(s).raisesFunded).toBe(1);
    g.removeNode(armiesOf(g, CO)[0].id);
    const nextDay = stateAt(g, s.tick + PURSE_CYCLE_TICKS);
    expect(runCrownPhase(nextDay).raisesFunded).toBe(0);
    const afterGap = stateAt(g, s.tick + LIEGE_RAISE_MIN_GAP_DAYS * PURSE_CYCLE_TICKS);
    expect(runCrownPhase(afterGap).raisesFunded).toBe(1);
    expect(armiesOf(g, CO)).toHaveLength(1);
  });

  it('a vassal that holds a town raises from its own land, never from its liege (kill criterion 3)', () => {
    const { g, s } = sworn(1000);
    g.addEdge({ id: 'e_ctl_camp', source: CO, target: CAMP, type: 'controls', properties: { role: 'seat' } });
    expect(armyRefusal(s, CO)).toBe('purse');
    expect(runCrownPhase(s).raisesFunded).toBe(0);
    expect(armiesOf(g, CO)).toHaveLength(0);
  });

  it('a company that can pay its own raise is left to raise it itself', () => {
    const { g, s } = sworn(1000);
    g.getNode(CO)!.properties.wealth = 500;
    expect(armyRefusal(s, CO)).toBeNull();
    expect(runCrownPhase(s).raisesFunded).toBe(0);
  });
});
