// @vitest-lane heavy — builds a seeded-identity world and drives it up to 300 ticks (THR-1781)
/**
 * THR-1781 — a compulsion paid while The First is mid-chapter is spent at its next
 * decision after the chapter, not lost.
 *
 * The warm playtest's quit point: "I paid 3 Force for a Duel … he did a caravan deal
 * instead." The popup shows ten ticks after the decision it was built from, so The
 * First is usually inside an encounter when the player pays; the old override fired
 * only within three ticks of the click, and a busy mortal skips the decision path
 * entirely. This drives a real world: wait for The First to be mid-encounter, pay a
 * compulsion toward a template from its last scored board, and assert that the next
 * full decision after the chapter ends chooses it.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { createSimulationRuntime } from '../simulationRuntime';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import { applyCompulsionChoice } from '../premonitionActions';
import { MULTI_WORLD_SIM_TEST_TIMEOUT_MS } from '../../testing/testTimeouts';
import type { GameState } from '../../types/gameState';
import type { CompulsionCandidate } from '../../types/premonition';

const FIRST_ID = 'ind_dev_the_first';
const MAX_TICKS = 300;

interface ScoringTraceLike {
  category: string;
  agentId?: string;
  tick: number;
  topCandidates?: Array<{ templateId: string; locationId: string }>;
}
interface PremonitionTraceLike { category: string; agentId?: string; outcome?: string; tick: number }

/** Mid-chapter: The First holds an unresolved encounter action — the decision phase skips it. */
function isMidEncounter(state: GameState): boolean {
  return state.unifiedActions.some(a => a.actorId === FIRST_ID && !a.resolved);
}

describe('THR-1781 — a compulsion paid mid-chapter holds until the next decision', () => {
  afterAll(() => { disableTracing(); clearTraces(); });

  it('chooses the compelled template at The First\'s next decision after the encounter ends', () => {
    resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
    const runtime = createSimulationRuntime();
    let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, createBalancedCosmology(), 'medium');
    devSeedTheFirst(state);
    // Pay with an unlimited purse — the test is about the steer, not the economy.
    for (const sphere of Object.keys(state.essencePool) as Array<keyof typeof state.essencePool>) {
      state.essencePool[sphere] = 1000;
    }

    let lastBoard: Array<{ templateId: string; locationId: string }> = [];
    let paid: { templateId: string; tick: number } | null = null;
    let outcome: PremonitionTraceLike | null = null;

    for (let t = 0; t < MAX_TICKS && !outcome; t++) {
      state = runTick(state, [], runtime);
      for (const tr of getTraces() as ReadonlyArray<ScoringTraceLike & PremonitionTraceLike>) {
        if (tr.agentId !== FIRST_ID) continue;
        if (tr.category === 'encounter_scoring' && (tr.topCandidates?.length ?? 0) > 1) {
          lastBoard = tr.topCandidates!;
        }
        if (paid && tr.category === 'divine_premonition' && tr.outcome) outcome = tr;
      }
      clearTraces();

      if (!paid && lastBoard.length > 1 && isMidEncounter(state)) {
        // Steer toward the runner-up of the last board — something it did not pick.
        const target = lastBoard[1];
        const pick: CompulsionCandidate = {
          templateId: target.templateId,
          encounterName: target.templateId,
          encounterHook: '',
          encounterType: 'explore',
          reach: 'iron',
          sphere: 'force',
          threatRating: 'moderate',
          hexDistance: 0,
          score: 0,
          essenceCost: 3,
          locationId: target.locationId,
          locationName: '',
        };
        const result = applyCompulsionChoice(state, FIRST_ID, 'The First', pick);
        expect(result.success).toBe(true);
        paid = { templateId: target.templateId, tick: state.tick };
      }

      // While the chapter runs, the paid steer must still be held.
      if (paid && !outcome && isMidEncounter(state)) {
        expect(state.graph.getNode(FIRST_ID)?.properties.compulsionTargetTemplateId).toBe(paid.templateId);
      }
    }

    expect(paid).not.toBeNull();
    expect(outcome).not.toBeNull();
    // The old window was three ticks; the chapter outlasted it.
    expect(outcome!.tick - paid!.tick).toBeGreaterThan(3);
    expect(outcome!.outcome).toBe('taken');
    const receipt = state.graph.getNode(FIRST_ID)?.properties.motiveReceipt as
      { templateId: string; decidedAtTick: number } | undefined;
    expect(receipt?.decidedAtTick).toBe(outcome!.tick);
    expect(receipt?.templateId).toBe(paid!.templateId);
    // The player hears it: an outcome event reached the tick log.
    expect(state.tickEvents.some(e => e.type === 'divine_premonition' && e.actorId === FIRST_ID)).toBe(true);
    // A compulsion offered at the decision that spends the steer never names the
    // encounter the steer just started — paying for it again could only lapse.
    const offeredAtSpend = (state.premonitionQueue ?? [])
      .filter(p => p.type === 'compulsion' && p.agentId === FIRST_ID && p.tick === outcome!.tick);
    for (const p of offeredAtSpend) {
      expect((p.compulsionCandidates ?? []).map(c => c.templateId)).not.toContain(paid!.templateId);
    }
  }, MULTI_WORLD_SIM_TEST_TIMEOUT_MS);
});
