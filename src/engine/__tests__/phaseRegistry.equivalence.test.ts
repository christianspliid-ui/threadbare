/**
 * Phase registry equivalence baseline test (THR-238 Land 2).
 *
 * Captures the per-tick sequence of registered-phase ids and asserts:
 *   1. Every registered phase runs exactly once per tick.
 *   2. Per-tick ordering is consistent across ticks.
 *   3. Two runs of the same seed produce identical phase id sequences (determinism).
 *
 * If this test starts failing after a Land 3 migration, *do not* rubber-stamp the
 * baseline update — investigate. A surprise order change usually means a real
 * ordering bug. To deliberately update the baseline, edit `EXPECTED_PHASE_IDS`
 * below and link the rationale in your commit message.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { ENGINE_PHASES } from '../phases';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { TraceEntry } from '../../types/trace';
import type { AscendantArchetype, CosmologyProfile } from '../../types';

const testArchetype: AscendantArchetype = {
  id: 'arch.equivalence',
  title: 'The Witness',
  sphereAlignment: { primary: 'mind', secondary: 'spirit' },
  personalitySeed: {
    courage_prudence: 0.0,
    mercy_ruthlessness: 0.0,
    honesty_cunning: 0.0,
    sacrifice_survival: 0.0,
    loyalty_ambition: 0.0,
    tradition_novelty: 0.0,
    restraint_indulgence: 0.0,
    pragmatism_idealism: 0.0,
    openness_caution: 0.0,
  },
};

const testCosmology: CosmologyProfile = {
  id: 'cosmo.equivalence',
  foundationSpheres: { primary: 'mind', secondary: 'spirit' },
  creationSpheres: {
    force: 0.1, matter: 0.1, energy: 0.1, life: 0.1,
    mind: 0.2, spirit: 0.1, time: 0.1, entropy: 0.1,
  },
};

const TICKS = 10;

/**
 * Expected per-tick sequence of registered-phase ids in execution order.
 *
 * Captured against the seed-42, mind/spirit ascendant world after 10 ticks.
 * Update deliberately — see file header for protocol.
 */
const EXPECTED_PHASE_IDS: readonly string[] = [
  'emitted_omen_decay', // post-doom slot
  'reputation_decay',   // pre-economy slot
];

function captureRegisteredPhaseSequence(seed: number): string[][] {
  resetDecisionCache();
  resetEventCounter();
  enableTracing();
  clearTraces();

  const { state: initialState } = initializeGameState(
    testArchetype,
    'Test Witness',
    testCosmology,
    seed,
  );

  const registeredIds = new Set(ENGINE_PHASES.map(p => p.id));
  const perTick: string[][] = [];

  let state = initialState;
  for (let i = 0; i < TICKS; i++) {
    const before = getTraces().length;
    state = runTick(state);
    const after = getTraces().length;
    const tickProfiles = (getTraces().slice(before, after) as TraceEntry[])
      .filter(t => t.category === 'tick_phase_profile')
      .map(t => (t as TraceEntry & { phase?: string }).phase ?? '')
      .filter(id => registeredIds.has(id));
    perTick.push(tickProfiles);
  }
  return perTick;
}

describe('phaseRegistry equivalence baseline', () => {
  let perTickSequences: string[][];

  beforeAll(() => {
    perTickSequences = captureRegisteredPhaseSequence(42);
  }, 60_000);

  it('every registered phase runs exactly once per tick', () => {
    expect(perTickSequences.length).toBe(TICKS);
    for (let tick = 0; tick < TICKS; tick++) {
      const ids = perTickSequences[tick];
      expect(ids.length, `tick ${tick + 1} phase count`).toBe(ENGINE_PHASES.length);
      const idSet = new Set(ids);
      expect(idSet.size, `tick ${tick + 1} ids unique`).toBe(ENGINE_PHASES.length);
    }
  });

  it('per-tick ordering matches the expected baseline (deterministic across ticks)', () => {
    for (let tick = 0; tick < TICKS; tick++) {
      expect(perTickSequences[tick], `tick ${tick + 1} order`).toEqual(EXPECTED_PHASE_IDS);
    }
  });

  it('two runs of the same seed produce identical phase sequences (determinism)', () => {
    const second = captureRegisteredPhaseSequence(42);
    expect(second).toEqual(perTickSequences);
  }, 60_000);
});
