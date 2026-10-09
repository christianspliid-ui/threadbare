// @vitest-lane heavy — builds a small seeded world and drives the real elder-essence grant sites into the repertoire (THR-1753)
/**
 * Foundation discovery in a seeded run. THR-1753.
 *
 * Point-buy covers Creation spheres only (THR-1749), so the six Foundation-signed
 * card types — gambit, stumble, favor, whisper, veil, undertow — reach a god only
 * by *finding* elder magic (rulebook §5). This pins that each of the six has a
 * reachable grant path in a seeded world, through the same code the tick runs:
 *
 *   elder grant (`computeElderEssenceReward` / `awardElderEssence`)
 *     → pool edited in place, exactly as `unifiedActionResolution` applies it
 *     → `applyEssenceEarned` banks it on the lifetime ledger
 *     → `buildRepertoire` opens the sphere at the secondary tier.
 *
 * The world is real (seed 42, small map, a few ticks of warm-up) so the ledger
 * and pool are whatever the seeded run produced, not a hand-built fixture.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../orchestrator';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { applyEssenceEarned } from '../essenceEarned';
import { awardElderEssence, computeElderEssenceReward } from '../elderEssenceReward';
import { buildRepertoire, discoveredFoundationSpheres } from '../nudgeCardRepertoire';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types/index';

const SEED = 42;
const WARMUP_TICKS = 3;
const TIMEOUT_MS = 60_000;

/** Written out, not read from `SPHERE_SIGNATURES`, so the test is not the table. */
const FOUNDATION_SIGNED = ['gambit', 'stumble', 'favor', 'whisper', 'veil', 'undertow'];
/** A god as Remembrance's point-buy now makes them: Creation spheres only. */
const CREATION_GOD = { primary: 'mind', secondary: 'life' } as const;

function seededWorld(): GameState {
  resetEventCounter();
  resetDecisionCache();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, SEED)[0];
  let { state } = initializeGameState(archetype, 'Discovery', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  for (let i = 0; i < WARMUP_TICKS; i++) state = runTick(state, [], runtime);
  return state;
}

/** Apply reward deltas the way the reveal path does — in place on the pool — then bank. */
function grant(state: GameState, deltas: Partial<Record<SphereName, number>>): GameState {
  const poolBefore = { ...state.essencePool };
  const next: GameState = { ...state };
  for (const [s, delta] of Object.entries(deltas) as [SphereName, number][]) {
    if (next.essencePool[s] !== undefined) next.essencePool[s] += delta;
  }
  return applyEssenceEarned(state, next, poolBefore);
}

function foundTypes(state: GameState): Set<string> {
  return new Set(
    buildRepertoire({ ...CREATION_GOD, essenceEarnedBySphere: state.essenceEarnedBySphere })
      .filter((e) => e.source === 'discovery')
      .map((e) => e.member.typeId),
  );
}

describe('Foundation discovery in a seeded run (THR-1753)', () => {
  it('nothing in an ordinary seeded run finds a Foundation sphere on its own', () => {
    const state = seededWorld();
    expect(discoveredFoundationSpheres(state.essenceEarnedBySphere)).toEqual([]);
    expect(foundTypes(state).size).toBe(0);
  }, TIMEOUT_MS);

  it('one elder hidden-site reveal opens all six Foundation-signed types', () => {
    let state = seededWorld();
    const reward = computeElderEssenceReward(
      { sublocationId: 'site', sublocationName: 'Sunken Vault', hexCol: 0, hexRow: 0, hasElderMagic: true },
      state.tick,
    );
    state = grant(state, reward.deltas);

    expect(discoveredFoundationSpheres(state.essenceEarnedBySphere)).toEqual([
      'chaos',
      'order',
      'light',
      'darkness',
    ]);
    const found = foundTypes(state);
    for (const t of FOUNDATION_SIGNED) expect(found.has(t), t).toBe(true);
  }, TIMEOUT_MS);

  it('a non-elder hidden site (spirit essence) finds nothing', () => {
    let state = seededWorld();
    const reward = computeElderEssenceReward(
      { sublocationId: 'site', sublocationName: 'Hollow', hexCol: 0, hexRow: 0, hasElderMagic: false },
      state.tick,
    );
    state = grant(state, reward.deltas);
    expect(foundTypes(state).size).toBe(0);
  }, TIMEOUT_MS);

  it('the smallest ruin award (catastrophic quarter, one sphere) still opens that sphere', () => {
    let state = seededWorld();
    for (const sphere of ['chaos', 'darkness'] as const) {
      const reward = awardElderEssence({
        ascendantId: '',
        amount: 5 * 0.25, // ELDER_SITE_ESSENCE_REWARD × CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER
        distributionMode: 'single_sphere',
        sphere,
        source: 'ruin_catastrophic',
        tick: state.tick,
        essencePool: state.essencePool,
      });
      state = grant(state, reward.deltas);
    }
    const found = foundTypes(state);
    for (const t of ['gambit', 'stumble', 'veil', 'undertow']) expect(found.has(t), t).toBe(true);
    for (const t of ['favor', 'whisper']) expect(found.has(t), t).toBe(false);
  }, TIMEOUT_MS);
});
