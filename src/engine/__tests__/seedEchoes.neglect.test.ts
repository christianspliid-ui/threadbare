// @vitest-lane heavy — builds medium worlds (seeds 42 / 99 / 7) and drives the Dominion phase 300 ticks each (THR-1843)
/**
 * THR-1843 — a kin monument's lift fades untended; an opposed one stands (plan
 * `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` § Done when, slice 2).
 */
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { AscendantIdentity } from '../../types/remembrance';
import { DEV_ASCENDANT_IDENTITY, initializeGameStateFromIdentity } from '../gameInit';
import { sampleAccount } from '../accountStore';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { dominionOf } from '../dominion';
import { phaseDominion } from '../phaseDominion';
import { DOMINION_BAND_RANK } from '../../data/dominion-content';

const KIN: AscendantIdentity = { ...DEV_ASCENDANT_IDENTITY, sphereAlignment: { primary: 'life', secondary: 'spirit' }, spherePoints: { life: 3, spirit: 2 } };
const OPPOSED: AscendantIdentity = { ...DEV_ASCENDANT_IDENTITY, sphereAlignment: { primary: 'entropy', secondary: 'energy' }, spherePoints: { entropy: 3, energy: 2 } };

function world(identity: AscendantIdentity, seed: number): GameState {
  resetEventCounter();
  resetDecisionCache();
  return initializeGameStateFromIdentity(identity, seed, undefined, 'medium', undefined, sampleAccount()).state;
}

function godId(state: GameState): string {
  return state.graph.getNodesByType('actor').find(n => n.properties.actorType === 'ascendant')!.id;
}

describe.each([42, 99, 7])('THR-1843 — neglect on seed %i', seed => {
  it('fades a kin monument untended for 300 ticks; an opposed one still stands Hostile', () => {
    const untended = (state: GameState): void => {
      for (let t = 1; t <= 300; t++) {
        state.tick = t;
        phaseDominion(state);
      }
    };
    const kin = world(KIN, seed);
    const kinGod = godId(kin);
    const warm = kin.seededEchoes!.seeded.find(e => e.kind === 'monument')!;
    const before = dominionOf(kin.graph, kinGod, warm.hostId).band;
    untended(kin);
    const after = dominionOf(kin.graph, kinGod, warm.hostId).band;
    expect(DOMINION_BAND_RANK[after]).toBeLessThan(DOMINION_BAND_RANK[before]);

    const opp = world(OPPOSED, seed);
    const oppGod = godId(opp);
    const m = opp.seededEchoes!.seeded.find(e => e.kind === 'monument')!;
    const oppBefore = dominionOf(opp.graph, oppGod, m.hostId).band;
    untended(opp);
    expect(dominionOf(opp.graph, oppGod, m.hostId).band).toBe(oppBefore);
  });

});
