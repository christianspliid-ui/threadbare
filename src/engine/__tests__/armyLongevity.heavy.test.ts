// @vitest-lane heavy — seed 42 medium driven 45 days (540 ticks); ~3.2 min locally (THR-1973, cut THR-2083)
//
// THR-1973 — armies last and are raised again. Before the fix every army bled out
// within a week (a paid, supplied host lost 15 cohesion a day with no way back) and a
// realm or free company whose ambition was not military never raised another: the map
// fielded 0 armies by day 30 on seeds 42 and 99.
//
// Predicates (the ticket's Done-when, run-level):
//   - the map fields at least one army on at least 80% of days;
//   - the largest realm raises again within 12 days of losing its last army, counting
//     only days on which it could afford one.
//
// Why 45 days, not 90 (THR-2083, measured 2026-10-27 on seed 42 medium): a day costs
// ~2.5 s at the start and ~13 s by day 80, so the second half was ~70% of the run —
// 872.7 s on a fast CI runner, and past the 45-min job timeout on a slow one (run
// 40511962211). Over days 1–83 the map fielded 3–6 armies every day and the largest
// realm never lost its army, so days 46–90 added no signal either predicate reads.
// 45 days still spans the original failure (0 armies by day 30) and the 12-day window.
// The re-raise predicate is vacuous on this seed at either length: it guards a
// regression where the realm loses its army and does not re-raise.
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { canAffordArmy, armyReachTier } from '../armySpawning';
import { determineSizeCategory } from '../../types/army';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import type { GameState } from '../../types/gameState';

const SEED = 42;
const DAYS = 45;
const MIN_ARMY_DAY_SHARE = 0.8;
const MAX_RERAISE_AFFORDABLE_DAYS = 12;
/**
 * 45 days measured 191 s locally (2026-10-27); CI runs ~1.4× local and the slowest
 * runner seen ~1.6× the fastest, so ~7 min worst case. 15 min sits well below the
 * 45-min heavy job timeout, so a slow run fails here by name, not as a job cancel.
 */
const BUDGET_MS = 15 * 60_000;

function armiesOf(state: GameState, factionId: string): number {
  return state.graph.getIncomingEdges(factionId, 'member_of')
    .filter(e => state.graph.getNode(e.source)?.properties.armyState != null).length;
}

describe('army longevity (THR-1973)', () => {
  it(`seed ${SEED} medium fields armies on ≥${MIN_ARMY_DAY_SHARE * 100}% of ${DAYS} days and the largest realm re-raises`, () => {
    resetEventCounter();
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.medium;
    let { state } = initializeGameState(archetype, 'ArmyLongevity', createBalancedCosmology(), SEED, preset.cols, preset.rows);

    const largest = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'faction' && n.properties.factionClass === 'realm')
      .map(r => ({ id: r.id, members: state.graph.getIncomingEdges(r.id, 'member_of').length }))
      .sort((a, b) => b.members - a.members || (a.id < b.id ? -1 : 1))[0]?.id;
    expect(largest).toBeDefined();

    let armyDays = 0;
    let affordableDaysWithout = 0;
    let worstGap = 0;
    for (let day = 1; day <= DAYS; day++) {
      for (let t = 0; t < TICKS_PER_DAY; t++) state = runTick(state, [], runtime);
      const armies = state.graph.getNodesByType('actor').filter(n => n.properties.armyState != null).length;
      if (armies > 0) armyDays++;

      if (armiesOf(state, largest!) > 0) {
        affordableDaysWithout = 0;
      } else if (canAffordArmy(state.graph, largest!, determineSizeCategory(armyReachTier(state.graph, largest!, 'gold')))) {
        affordableDaysWithout++;
        worstGap = Math.max(worstGap, affordableDaysWithout);
      }
    }

    expect(armyDays / DAYS).toBeGreaterThanOrEqual(MIN_ARMY_DAY_SHARE);
    expect(worstGap).toBeLessThanOrEqual(MAX_RERAISE_AFFORDABLE_DAYS);
  }, BUDGET_MS);
});
