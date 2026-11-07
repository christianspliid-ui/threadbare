// @vitest-lane heavy — builds a seeded-identity world and drives it up to 300 ticks (THR-1926)
/**
 * THR-1926 — The Crossroads on a real world (seed 42, the bonded First).
 *
 * 1. The First's full decisions write a `crossroads` snapshot of the deciding board.
 * 2. A lean placed on that snapshot resolves at The First's next full decision with
 *    exactly one outcome trace and one toast event, and the property is cleared.
 * 3. With `COMPULSION_PREMONITION_ENABLED` forced `false`, 30 ticks queue no
 *    `compulsion` premonition — and a save already holding `compulsionTargetTemplateId`
 *    still resolves it through the old path.
 * 4. THR-2188: a lean whose road is on no list waits (traced `crossroads_lean_waiting`,
 *    still held); with `CROSSROADS_LEAN_WAITS_FOR_ROAD` forced `false` it lapses
 *    `lapsed_unavailable` at the first full decision, as before.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';

const compulsionFlag = vi.hoisted(() => ({ value: undefined as boolean | undefined }));
const waitFlag = vi.hoisted(() => ({ value: undefined as boolean | undefined }));
vi.mock('../../data/premonition-constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    get COMPULSION_PREMONITION_ENABLED() { return compulsionFlag.value ?? actual.COMPULSION_PREMONITION_ENABLED; },
    get CROSSROADS_LEAN_WAITS_FOR_ROAD() { return waitFlag.value ?? actual.CROSSROADS_LEAN_WAITS_FOR_ROAD; },
  };
});

import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../orchestrator';
import { unattended } from '../playerStepHold';
import { createBalancedCosmology } from '../cosmology';
import { createSimulationRuntime } from '../simulationRuntime';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import { readCrossroadsSnapshot, readCrossroadsLean } from '../crossroads';
import { placeCrossroadsLean } from '../crossroadsActions';
import { MULTI_WORLD_SIM_TEST_TIMEOUT_MS } from '../../testing/testTimeouts';

const FIRST_ID = 'ind_dev_the_first';
const MAX_TICKS = 300;

vi.mock('../intentionReading', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  // The reading's gate is THR-1433's and tested there; this test is about the board.
  return { ...actual, canReadIntention: () => ({ readable: true, through: 'familiarity', secret: false }) };
});

function freshWorld() {
  resetDecisionCache();
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const runtime = createSimulationRuntime();
  const { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, createBalancedCosmology(), 'medium');
  devSeedTheFirst(state);
  for (const sphere of Object.keys(state.essencePool) as Array<keyof typeof state.essencePool>) {
    state.essencePool[sphere] = 1000;
  }
  return { state, runtime };
}

interface TraceLike { category: string; agentId?: string; tick: number; outcome?: string; subtype?: string }

describe('THR-1926 — The Crossroads on seed 42', () => {
  afterAll(() => { disableTracing(); clearTraces(); compulsionFlag.value = undefined; waitFlag.value = undefined; });

  it('writes the snapshot, and a placed lean resolves once with one trace and one toast', () => {
    let { state, runtime } = freshWorld();
    let placedTick: number | null = null;
    let outcomes: TraceLike[] = [];
    let toasts = 0;
    let snapshotSeen = false;

    for (let t = 0; t < MAX_TICKS && outcomes.length === 0; t++) {
      state = unattended(runTick(state, [], runtime));
      const traces = getTraces() as ReadonlyArray<TraceLike>;
      outcomes = traces.filter(tr => tr.category === 'crossroads_lean_outcome' && tr.agentId === FIRST_ID);
      toasts += state.tickEvents.filter(e => e.id.startsWith(`divine_crossroads_${FIRST_ID}`)).length;
      clearTraces();

      const node = state.graph.getNode(FIRST_ID);
      const snapshot = readCrossroadsSnapshot(node?.properties.crossroads);
      if (snapshot && snapshot.options.length > 0) snapshotSeen = true;
      if (placedTick === null && snapshot && snapshot.options.length > 0) {
        const road = snapshot.options[Math.min(1, snapshot.options.length - 1)];
        const r = placeCrossroadsLean(state, FIRST_ID, road, 'toward');
        expect(r.success, r.message).toBe(true);
        placedTick = state.tick;
      }
    }

    expect(snapshotSeen, 'premise: The First wrote a crossroads snapshot').toBe(true);
    expect(placedTick).not.toBeNull();
    expect(outcomes.length).toBe(1);
    expect(['followed', 'resisted', 'lapsed_unavailable', 'lapsed_expired']).toContain(outcomes[0].outcome);
    expect(toasts).toBe(1);
    expect(readCrossroadsLean(state.graph.getNode(FIRST_ID)?.properties.crossroadsLean)).toBeNull();
  }, MULTI_WORLD_SIM_TEST_TIMEOUT_MS);

  it('with God\'s Will off, 30 ticks queue no compulsion; a held compulsion still resolves', () => {
    compulsionFlag.value = false;
    let { state, runtime } = freshWorld();
    // A save holding a paid compulsion (the old path stays for held saves).
    const first = state.graph.getNode(FIRST_ID)!;
    first.properties.compulsionTargetTemplateId = 'no_such_template';
    first.properties.compulsionTick = 0;
    first.properties.compulsionTargetName = 'the old steer';
    let compulsionResolved = false;
    for (let t = 0; t < 30; t++) {
      state = unattended(runTick(state, [], runtime));
      expect((state.premonitionQueue ?? []).some((p: { type?: string }) => p.type === 'compulsion')).toBe(false);
      for (const tr of getTraces() as ReadonlyArray<TraceLike>) {
        if (tr.category === 'divine_premonition' && tr.subtype === 'compulsion_outcome' && tr.agentId === FIRST_ID) compulsionResolved = true;
      }
      clearTraces();
    }
    expect(compulsionResolved).toBe(true);
    expect(state.graph.getNode(FIRST_ID)?.properties.compulsionTargetTemplateId).toBeUndefined();
    compulsionFlag.value = undefined;
  }, MULTI_WORLD_SIM_TEST_TIMEOUT_MS);
  /** A well-formed lean on a template no board will ever hold. */
  function leanOnNothing(tick: number) {
    return {
      family: 'encounter', templateId: 'no_such_template_thr2188', targetId: null, direction: 'toward',
      tick, sphere: 'Order', essencePaid: 0, rankWhenPlaced: 1, forecastAtPlacement: 'likely',
    };
  }

  it('THR-2188: a lean whose road is on no list waits for it, and stays held', () => {
    waitFlag.value = true;
    let { state, runtime } = freshWorld();
    state.graph.getNode(FIRST_ID)!.properties.crossroadsLean = leanOnNothing(state.tick);
    let waits = 0;
    let outcomes = 0;
    for (let t = 0; t < 40; t++) {
      state = unattended(runTick(state, [], runtime));
      for (const tr of getTraces() as ReadonlyArray<TraceLike>) {
        if (tr.agentId !== FIRST_ID) continue;
        if (tr.category === 'crossroads_lean_waiting') waits++;
        if (tr.category === 'crossroads_lean_outcome') outcomes++;
      }
      clearTraces();
    }
    expect(waits, 'premise: The First made a full decision with the lean held').toBeGreaterThan(0);
    expect(outcomes).toBe(0);
    expect(readCrossroadsLean(state.graph.getNode(FIRST_ID)?.properties.crossroadsLean)?.templateId).toBe('no_such_template_thr2188');
    waitFlag.value = undefined;
  }, MULTI_WORLD_SIM_TEST_TIMEOUT_MS);

  it('THR-2188: with the wait off, the same lean lapses unavailable at the first decision', () => {
    waitFlag.value = false;
    let { state, runtime } = freshWorld();
    state.graph.getNode(FIRST_ID)!.properties.crossroadsLean = leanOnNothing(state.tick);
    const outcomes: TraceLike[] = [];
    let waits = 0;
    for (let t = 0; t < 40 && outcomes.length === 0; t++) {
      state = unattended(runTick(state, [], runtime));
      for (const tr of getTraces() as ReadonlyArray<TraceLike>) {
        if (tr.agentId !== FIRST_ID) continue;
        if (tr.category === 'crossroads_lean_waiting') waits++;
        if (tr.category === 'crossroads_lean_outcome') outcomes.push(tr);
      }
      clearTraces();
    }
    expect(waits).toBe(0);
    expect(outcomes.map(o => o.outcome)).toEqual(['lapsed_unavailable']);
    expect(readCrossroadsLean(state.graph.getNode(FIRST_ID)?.properties.crossroadsLean)).toBeNull();
    waitFlag.value = undefined;
  }, MULTI_WORLD_SIM_TEST_TIMEOUT_MS);
});

