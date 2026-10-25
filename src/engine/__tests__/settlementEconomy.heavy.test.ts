// @vitest-lane heavy
/**
 * THR-1923 — the settlement economy's acceptance test on generated worlds.
 *
 * Seeds 42 and 99 (medium): the worldgen settling run, then 150 game days of real ticks.
 * The four diversity measures (THR-1866) must all PASS; at least 80% of settlements start
 * within one tier of their genome tier; the phase's own cost is recorded per day and the
 * settling run's added world-creation time is measured (plan § Done when, § Kill criteria).
 *
 * Heavy (generated worlds, 1800 ticks each): runs in `npm run test:heavy`.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameStateFromIdentity, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { runTick, resetEventCounter } from '../orchestrator';
import { createSimulationRuntime, touchStructure } from '../simulationRuntime';
import { runSettlementEconomyDay, runSettlingRun } from '../phases/settlementEconomy';
import { buildRealmProjection } from '../realmProjection';
import { measureDiversity, judgeDiversity, type DiversitySnapshot } from '../settlementEconomy/measures';
import { getEconomySettlements } from '../settlementEconomy/land';
import { tierRank } from '../settlementEconomy/tier';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import type { GameState } from '../../types/gameState';

/** CI runs up to ~2.2× slower than a dev machine (impediment log); the budgets carry that headroom. */
const CI_HEADROOM = 2.5;
/** Plan budgets: phase per day on medium, and the settling run's added world-creation time. */
const PHASE_MS_PER_DAY_MEDIUM = 2;
const SETTLING_RUN_MS_MEDIUM = 300;

for (const seed of [42, 99]) {
  describe(`settlement economy on seed ${seed} (medium)`, () => {
    it('day-0 tiers fit the genome, and the four diversity measures hold from day 1 to day 150 of real ticks', () => {
      resetEventCounter();
      const runtime = createSimulationRuntime();
      let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, createBalancedCosmology(), 'medium') as { state: GameState };
      touchStructure(runtime);

      // Day 0: the settling run has set targetTier; the subtype is still the genome's.
      const settlements = getEconomySettlements(state.graph);
      const within = settlements.filter(s =>
        Math.abs(tierRank(s.properties.targetTier as string) - tierRank(s.properties.locationSubtype as string)) <= 1).length;
      expect(within / settlements.length).toBeGreaterThanOrEqual(0.8);

      const snaps: Record<number, DiversitySnapshot> = {};
      for (let t = 1; t <= 150 * TICKS_PER_DAY; t++) {
        state = runTick(state, [], runtime);
        const day = state.tick / TICKS_PER_DAY;
        if (Number.isInteger(day) && (day === 1 || day === 50 || day === 100 || day === 150)) snaps[day] = measureDiversity(state.graph, day);
      }
      const verdict = judgeDiversity({ day1: snaps[1], day50: snaps[50], day100: snaps[100], now: snaps[150] });
      console.log(`[THR-1923] seed ${seed}: day-0 within one tier ${within}/${settlements.length}; ` + [1, 50, 100, 150].map(d =>
        `day ${d} cv ${snaps[d].sizeCv.toFixed(2)} distinct ${(snaps[d].distinctShare * 100).toFixed(0)}% combos ${snaps[d].combos} top ${snaps[d].topTrait} ${(snaps[d].topTraitShare * 100).toFixed(0)}% tiers ${JSON.stringify(snaps[d].tiers)}`).join(' | ') + ` → ${JSON.stringify(verdict)}`);
      expect(verdict).toMatchObject({ sizesSpread: 'PASS', buildingMixesDistinct: 'PASS', traitsManyAndRare: 'PASS', noConvergence: 'PASS' });
    }, 900_000);

    it('the phase stays inside its per-day budget, and the settling run inside its world-creation budget', () => {
      const { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, createBalancedCosmology(), 'medium') as { state: GameState };
      const hexRealmId = buildRealmProjection(state.graph, state.tiles).hexRealmId;
      const start = Date.now();
      for (let d = 1; d <= 50; d++) runSettlementEconomyDay({ graph: state.graph, tiles: state.tiles, tick: d * TICKS_PER_DAY, seed, hexRealmId });
      const perDay = (Date.now() - start) / 50;
      // A second settling run on the settled world costs what the first one did.
      const settling = runSettlingRun(state.graph, state.tiles, seed);
      console.log(`[THR-1923] seed ${seed}: phase ${perDay.toFixed(2)} ms/day; settling run ${settling.ms} ms over ${settling.settlements} settlements`);
      expect(perDay).toBeLessThan(PHASE_MS_PER_DAY_MEDIUM * CI_HEADROOM);
      expect(settling.ms).toBeLessThan(SETTLING_RUN_MS_MEDIUM * CI_HEADROOM);
    }, 300_000);
  });
}
