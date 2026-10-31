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
import { runTick, resetEventCounter, resetDecisionCache } from '../orchestrator';
import { unattended } from '../playerStepHold';
import { createBalancedCosmology } from '../cosmology';
import { createSimulationRuntime } from '../simulationRuntime';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import { applyCompulsionChoice } from '../premonitionActions';
import { resolveCompulsionEncounterName } from '../premonitionCompulsion';
import { MULTI_WORLD_SIM_TEST_TIMEOUT_MS } from '../../testing/testTimeouts';
import type { GameState } from '../../types/gameState';
import type { CompulsionCandidate } from '../../types/premonition';

const FIRST_ID = 'ind_dev_the_first';
const MAX_TICKS = 300;

interface ScoringTraceLike {
  category: string;
  agentId?: string;
  tick: number;
  topCandidates?: BoardEntry[];
}
/** `isLocal` is the scorer's own verdict: the scene is on The First's hex (`start_local`). */
interface BoardEntry { templateId: string; locationId: string; isLocal?: boolean }
interface PremonitionTraceLike { category: string; agentId?: string; outcome?: string; tick: number }

/** Mid-chapter: The First holds an unresolved encounter action — the decision phase skips it. */
function isMidEncounter(state: GameState): boolean {
  return state.unifiedActions.some(a => a.actorId === FIRST_ID && !a.resolved);
}

/**
 * THR-2085: the steer target is a lower-ranked scene on the last board that is NOT on
 * The First's hex, so the compelled choice needs travel and exercises the journey +
 * arrival path. Picking the bare runner-up let a board-context change (THR-2071) move
 * the premise silently — the runner-up landed in The First's own town and the tests
 * failed as `undefined` instead of on the precondition. A remote-attempt entry (no
 * presence needed) can still pass this filter; the named premise assertion in
 * `driveToTaken` catches that case loudly.
 */
function pickTravelTarget(board: BoardEntry[]): BoardEntry | undefined {
  return board.slice(1).find(c => c.isLocal === false);
}

/** Seed 42: pay a compulsion mid-chapter and tick until it resolves at the next decision. */
function driveToTaken() {
  // THR-2107: both tests build a world in one process — reset the run-scoped id
  // counters (npc_N et al.) so the second world is the first one, not an offset of it.
  resetDecisionCache();
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const runtime = createSimulationRuntime();
  let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, createBalancedCosmology(), 'medium');
  devSeedTheFirst(state);
  // Pay with an unlimited purse — the test is about the steer, not the economy.
  for (const sphere of Object.keys(state.essencePool) as Array<keyof typeof state.essencePool>) {
    state.essencePool[sphere] = 1000;
  }

  let lastBoard: BoardEntry[] = [];
  let paid: { templateId: string; tick: number } | null = null;
  let outcome: PremonitionTraceLike | null = null;

  for (let t = 0; t < MAX_TICKS && !outcome; t++) {
    state = unattended(runTick(state, [], runtime)); // THR-2052: no player answers
    for (const tr of getTraces() as ReadonlyArray<ScoringTraceLike & PremonitionTraceLike>) {
      if (tr.agentId !== FIRST_ID) continue;
      if (tr.category === 'encounter_scoring' && (tr.topCandidates?.length ?? 0) > 1) {
        lastBoard = tr.topCandidates!;
      }
      if (paid && tr.category === 'divine_premonition' && tr.outcome) outcome = tr;
    }
    clearTraces();

    const target: BoardEntry | undefined = !paid && lastBoard.length > 1 && isMidEncounter(state)
      ? pickTravelTarget(lastBoard) : undefined;
    if (target) {
      // Steer toward a lower-ranked scene of the last board — something it did not
      // pick — in another place, so the steer must travel (THR-2085).
      const pick: CompulsionCandidate = {
        templateId: target.templateId,
        // THR-1852 — the real name, as the builder resolves it; never the id.
        encounterName: resolveCompulsionEncounterName(target.templateId),
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
  // THR-2085 premise, by name: both tests need the steer spent on a journey. If a
  // trajectory change makes the seed-42 target start in place or remotely, fail here.
  expect(paid, 'premise: a travel-needing steer target was found mid-encounter').not.toBeNull();
  if (outcome?.outcome === 'taken') {
    expect(state.graph.getNode(FIRST_ID)?.properties.compelledJourneyTemplateId,
      'premise: the seed-42 steer target needs travel (compelled journey held)').toBe(paid!.templateId);
  }
  return { state, runtime, paid: paid!, outcome: outcome! };
}

describe('THR-1781 — a compulsion paid mid-chapter holds until the next decision', () => {
  afterAll(() => { disableTracing(); clearTraces(); });

  it('chooses the compelled template at The First\'s next decision after the encounter ends', () => {
    let { state, runtime, paid, outcome } = driveToTaken();
    expect(paid).not.toBeNull();
    expect(outcome).not.toBeNull();
    // The old window was three ticks; the chapter outlasted it.
    expect(outcome.tick - paid.tick).toBeGreaterThan(3);
    expect(outcome.outcome).toBe('taken');
    const receipt = state.graph.getNode(FIRST_ID)?.properties.motiveReceipt as
      { templateId: string; decidedAtTick: number } | undefined;
    expect(receipt?.decidedAtTick).toBe(outcome.tick);
    expect(receipt?.templateId).toBe(paid.templateId);
    // The player hears it: an outcome event reached the tick log.
    expect(state.tickEvents.some(e => e.type === 'divine_premonition' && e.actorId === FIRST_ID)).toBe(true);
    // THR-2068: no compulsion is offered at the decision that spends the steer — the
    // steer may become a compelled journey, and a second paid steer would take its
    // arrival decision and lapse the first with a false "beyond reach".
    const offeredAtSpend = (state.premonitionQueue ?? [])
      .filter(p => p.type === 'compulsion' && p.agentId === FIRST_ID && p.tick === outcome.tick);
    expect(offeredAtSpend).toEqual([]);

    // THR-2068: the compelled scene's action carries the mark — started here, or
    // started on arrival when the scene needed travel (the journey keeps it).
    const compelledAction = (s: GameState) =>
      s.unifiedActions.find(a => a.actorId === FIRST_ID && a.templateId === paid.templateId && a.startTick >= outcome.tick);
    let arrivalTake: PremonitionTraceLike | undefined;
    for (let t = 0; t < MAX_TICKS && !compelledAction(state); t++) {
      state = unattended(runTick(state, [], runtime));
      arrivalTake ??= (getTraces() as ReadonlyArray<PremonitionTraceLike & { agentId?: string; templateId?: string }>)
        .find(tr => tr.agentId === FIRST_ID && tr.category === 'divine_premonition'
          && tr.outcome === 'taken' && tr.templateId === paid.templateId);
      clearTraces();
    }
    expect(compelledAction(state)?.compelledByGod).toBe(true);
    // The seed-42 target needs travel: the arrival override is traced, not silent.
    expect(arrivalTake).toBeDefined();
  }, MULTI_WORLD_SIM_TEST_TIMEOUT_MS);

  it('THR-2068 — a compelled journey whose scene is gone on arrival lapses aloud', () => {
    let { state, runtime, paid } = driveToTaken();
    // The seed-42 target needs travel: the steer is held on the mortal for the journey.
    expect(state.graph.getNode(FIRST_ID)?.properties.compelledJourneyTemplateId).toBe(paid.templateId);
    // The scene vanishes mid-journey (GUARD 5's target_invalid shape): the goal is cleared.
    const ms = state.graph.getNode(FIRST_ID)?.properties.movementState as { targetEncounterId?: string } | undefined;
    expect(ms?.targetEncounterId).toBe(paid.templateId);
    ms!.targetEncounterId = undefined;
    let lapse: string | undefined;
    for (let t = 0; t < MAX_TICKS && state.graph.getNode(FIRST_ID)?.properties.compelledJourneyTemplateId; t++) {
      state = unattended(runTick(state, [], runtime));
      lapse ??= state.tickEvents.find(e => e.id.startsWith('divine_steer_journey_') && e.actorId === FIRST_ID)?.message;
      clearTraces();
    }
    expect(state.graph.getNode(FIRST_ID)?.properties.compelledJourneyTemplateId).toBeUndefined();
    const firstName = state.graph.getNode(FIRST_ID)?.name;
    expect(lapse).toBe(`Your will finds no purchase: ${resolveCompulsionEncounterName(paid.templateId)} is beyond ${firstName}'s reach now.`);
    // No action of the paid scene carries the mark.
    expect(state.unifiedActions.some(a => a.actorId === FIRST_ID && a.compelledByGod)).toBe(false);
  }, MULTI_WORLD_SIM_TEST_TIMEOUT_MS);
});
