/**
 * THR-1974 rollback — with `CROWN_WAGES_ENABLED = false` every hire rule is off: the
 * price reads income, no wage is paid, an old stamp is ignored, and an army commands and
 * eats for its own faction only. (The 300-tick identity run on seed 42 is in
 * `npm run measure:crown-wages -- --rollback`.)
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../data/crown-constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/crown-constants')>()),
  CROWN_WAGES_ENABLED: false,
}));

import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { ArmyState } from '../../types/army';
import { runCrownPhase, swearOathForDebug } from '../crown';
import { oathValueOf } from '../crown/eligibility';
import { commanderFactionOf } from '../warAims/enemy';
import { supplyFactionsOf } from '../armySupply';
import { PURSE_LAST_DAY_PROP } from '../factionPurse';

describe('CROWN_WAGES_ENABLED = false', () => {
  it('prices on income, pays no wage, and ignores a stamp already on an army', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'r', name: 'Hold', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 1000 } });
    g.addNode({ id: 'co', name: 'Company', type: 'actor', properties: { actorType: 'faction', factionDefId: 'mercenary_company', wealth: 0 } });
    g.addNode({ id: 'town', name: 'Town', type: 'location', properties: { locationSubtype: 'town' } });
    g.addEdge({ id: 'e_ctl', source: 'r', target: 'town', type: 'controls', properties: {} });
    g.addNode({
      id: 'army_co', name: 'Host', type: 'actor',
      properties: { actorType: 'group', armyState: { size: 'host', headcount: 300, objective: null, cohesion: 60, cohesionMax: 60, raisedTick: 0, maintenanceCost: 5, thresholdsFired: [], liegePaidTick: 24 } },
    });
    g.addEdge({ id: 'e_mo', source: 'army_co', target: 'co', type: 'member_of', properties: {} });
    const s = { graph: g, tick: 24, seed: 42, chronicleEntries: [], tiles: [], ascendantId: 'asc' } as unknown as GameState;
    expect(swearOathForDebug(s, 'co', 'r', 'bought')).toBe(true);
    for (const id of ['co', 'r']) {
      g.getNode(id)!.properties[PURSE_LAST_DAY_PROP] = {
        tick: 24, income: { townTax: 0.4, placeYield: 0, landRent: 0, tolls: 0, guildWork: 0, guildTaxIn: 0, guildTaxOut: 0 },
        topSources: [], paysTo: null, upkeepOwed: 0, upkeepPaid: 0, armiesPaid: [], armiesUnpaid: id === 'co' ? ['army_co'] : [],
        brokeSinceTick: null, taxHolderOf: [], paidBy: [],
      };
    }

    expect(oathValueOf(g, 'co', 0.4)).toBe(0.4);
    expect(commanderFactionOf(g, 'army_co', 24)).toBe('co');
    expect(supplyFactionsOf(g, 'army_co', 24)).toEqual(['co']);
    const result = runCrownPhase(s);
    expect(result.wagesPaid).toBe(0);
    expect((g.getNode('army_co')!.properties.armyState as ArmyState).paidThroughTick).toBeUndefined();
  });
});
