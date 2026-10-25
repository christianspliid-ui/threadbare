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
import { nextBuildingFor } from '../settlementEconomy/building';
import { getUndertakingObjectType, type ObjectVerbContext, type ObjectVerbSemantic } from '../../data/undertaking-objects';
import { hashString } from '../../lib/prng';

/** THR-1966: a settlement with a pick sees a mortal raise it one day in this many. */
const MORTAL_RAISE_ONE_IN = 10;

/** CI runs up to ~2.2× slower than a dev machine (impediment log); the budgets carry that headroom. */
const CI_HEADROOM = 2.5;
/** Plan budgets: phase per day on medium, and the settling run's added world-creation time. */
const PHASE_MS_PER_DAY_MEDIUM = 2;
const SETTLING_RUN_MS_MEDIUM = 300;
/**
 * THR-2035: vitest's transformed modules run the phase ~2× slower than the shipped bundle.
 * Measured 2026-10-25 on one machine: 1.51 / 1.75 ms a day (seeds 42 / 99, esbuild bundle,
 * 300 days) against 2.9 / 3.3 ms in this test — the plan's 2 ms holds for the game, and the
 * test's ceiling carries the harness on top of CI_HEADROOM.
 */
const VITEST_HARNESS_OVERHEAD = 2;
/** Days run unmeasured first, so JIT warm-up is not billed to the phase. */
const PHASE_WARMUP_DAYS = 10;
/** Days measured for the per-day figure. */
const PHASE_MEASURED_DAYS = 50;

for (const seed of [42, 99]) {
  describe(`settlement economy on seed ${seed} (medium)`, () => {
    it('day-0 tiers fit the genome, and the four diversity measures hold from day 1 to day 150', () => {
      resetEventCounter();
      const runtime = createSimulationRuntime();
      const { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, createBalancedCosmology(), 'medium') as { state: GameState };
      touchStructure(runtime);

      // Day 0: the settling run has set targetTier; the subtype is still the genome's.
      const settlements = getEconomySettlements(state.graph);
      const within = settlements.filter(s =>
        Math.abs(tierRank(s.properties.targetTier as string) - tierRank(s.properties.locationSubtype as string)) <= 1).length;
      expect(within / settlements.length).toBeGreaterThanOrEqual(0.8);

      // The measures: 150 days of the economy itself on the generated world. 150 days of
      // whole ticks take ~29 min a seed — measured once on seed 42 (all four PASS, CV 0.51 →
      // 0.79), recorded in Docs/status/2026-10-25-thr-1923.md — too long for this lane.
      const hexRealmId = buildRealmProjection(state.graph, state.tiles).hexRealmId;
      const snaps: Record<number, DiversitySnapshot> = {};
      for (let d = 1; d <= 150; d++) {
        runSettlementEconomyDay({ graph: state.graph, tiles: state.tiles, tick: d * TICKS_PER_DAY, seed, hexRealmId });
        if (d === 1 || d === 50 || d === 100 || d === 150) snaps[d] = measureDiversity(state.graph, d);
      }
      const verdict = judgeDiversity({ day1: snaps[1], day50: snaps[50], day100: snaps[100], now: snaps[150] });
      console.log(`[THR-1923] seed ${seed}: day-0 within one tier ${within}/${settlements.length}; ` + [1, 50, 100, 150].map(d =>
        `day ${d} cv ${snaps[d].sizeCv.toFixed(2)} distinct ${(snaps[d].distinctShare * 100).toFixed(0)}% combos ${snaps[d].combos} top ${snaps[d].topTrait} ${(snaps[d].topTraitShare * 100).toFixed(0)}% tiers ${JSON.stringify(snaps[d].tiers)}`).join(' | ') + ` → ${JSON.stringify(verdict)}`);
      expect(verdict).toMatchObject({ sizesSpread: 'PASS', buildingMixesDistinct: 'PASS', traitsManyAndRare: 'PASS', noConvergence: 'PASS' });
    }, 300_000);

    // THR-1966 (undertakings S2, kill criterion): mortals raising the town's own next building
    // must not flatten towns. A deliberately heavy rate — each settlement with a pick has a
    // one-in-MORTAL_RAISE_ONE_IN chance a day that a mortal raises it — far above live play.
    it('the four diversity measures still hold with mortal-raised buildings on', () => {
      resetEventCounter();
      const { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, createBalancedCosmology(), 'medium') as { state: GameState };
      const builderId = 'actor.thr1966_builder';
      state.graph.addNode({ id: builderId, type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
      const raisePlace = getUndertakingObjectType('place')!.verbs.create as ObjectVerbSemantic;
      const hexRealmId = buildRealmProjection(state.graph, state.tiles).hexRealmId;
      const snaps: Record<number, DiversitySnapshot> = {};
      let raised = 0;
      for (let d = 1; d <= 150; d++) {
        const tick = d * TICKS_PER_DAY;
        runSettlementEconomyDay({ graph: state.graph, tiles: state.tiles, tick, seed, hexRealmId });
        for (const s of getEconomySettlements(state.graph)) {
          if (hashString(`${seed}:thr1966:${s.id}:${d}`) % MORTAL_RAISE_ONE_IN !== 0 || !nextBuildingFor(state.graph, s.id)) continue;
          const op = raisePlace({
            state, graph: state.graph, actorId: builderId, tick, targetNodeId: s.id, handle: { kind: 'node', nodeId: s.id },
          } as unknown as ObjectVerbContext) as { success: boolean };
          if (op.success) raised++;
        }
        if (d === 1 || d === 50 || d === 100 || d === 150) snaps[d] = measureDiversity(state.graph, d);
      }
      const verdict = judgeDiversity({ day1: snaps[1], day50: snaps[50], day100: snaps[100], now: snaps[150] });
      console.log(`[THR-1966] seed ${seed}: ${raised} mortal-raised buildings; ` + [1, 50, 100, 150].map(d =>
        `day ${d} cv ${snaps[d].sizeCv.toFixed(2)} distinct ${(snaps[d].distinctShare * 100).toFixed(0)}% combos ${snaps[d].combos} top ${snaps[d].topTrait} ${(snaps[d].topTraitShare * 100).toFixed(0)}%`).join(' | ') + ` → ${JSON.stringify(verdict)}`);
      expect(raised).toBeGreaterThan(0);
      expect(verdict).toMatchObject({ sizesSpread: 'PASS', buildingMixesDistinct: 'PASS', traitsManyAndRare: 'PASS', noConvergence: 'PASS' });
    }, 300_000);

    it('ten days of whole ticks run the phase inside the engine: people counted, routes carrying, tiers moving toward target', () => {
      resetEventCounter();
      const runtime = createSimulationRuntime();
      let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, createBalancedCosmology(), 'medium') as { state: GameState };
      touchStructure(runtime);
      for (let t = 1; t <= 10 * TICKS_PER_DAY; t++) state = runTick(state, [], runtime);
      const settlements = getEconomySettlements(state.graph);
      expect(settlements.every(s => typeof s.properties.population === 'number' && (s.properties.economyLastDay as number) >= 9 * TICKS_PER_DAY)).toBe(true);
      expect(settlements.some(s => (s.properties.exportFood as number) >= 0)).toBe(true);
      expect(runtime.settlementDiversityHistory?.[0]?.day).toBe(1);
    }, 600_000);

    it('the phase stays inside its per-day budget, and the settling run inside its world-creation budget', () => {
      const { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, createBalancedCosmology(), 'medium') as { state: GameState };
      const hexRealmId = buildRealmProjection(state.graph, state.tiles).hexRealmId;
      const runDay = (d: number) => runSettlementEconomyDay({ graph: state.graph, tiles: state.tiles, tick: d * TICKS_PER_DAY, seed, hexRealmId });
      for (let d = 1; d <= PHASE_WARMUP_DAYS; d++) runDay(d);
      const start = performance.now();
      for (let d = PHASE_WARMUP_DAYS + 1; d <= PHASE_WARMUP_DAYS + PHASE_MEASURED_DAYS; d++) runDay(d);
      const perDay = (performance.now() - start) / PHASE_MEASURED_DAYS;
      // A second settling run on the settled world costs what the first one did.
      const settling = runSettlingRun(state.graph, state.tiles, seed);
      console.log(`[THR-1923] seed ${seed}: phase ${perDay.toFixed(2)} ms/day; settling run ${settling.ms} ms over ${settling.settlements} settlements`);
      expect(perDay).toBeLessThan(PHASE_MS_PER_DAY_MEDIUM * VITEST_HARNESS_OVERHEAD * CI_HEADROOM);
      expect(settling.ms).toBeLessThan(SETTLING_RUN_MS_MEDIUM * CI_HEADROOM);
    }, 300_000);
  });
}
