// @vitest-lane heavy — seed 42 medium driven 90 days (1 080 ticks); ~10 min locally (THR-1973)
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
const DAYS = 90;
const MIN_ARMY_DAY_SHARE = 0.8;
const MAX_RERAISE_AFFORDABLE_DAYS = 12;
/** Measured budget: ~10 min locally; CI runners are slower. */
const BUDGET_MS = 40 * 60_000;

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
