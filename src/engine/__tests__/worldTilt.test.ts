/**
 * THR-2028 — the world tilt reaches a place. The THR-1843 tilt census
 * (`Docs/audits/2026-10-25-thr-1843-echo-tilt-census.md`) found the account's
 * fundament left every place's sphere scores unchanged; Decided 8 says the tilt
 * shapes a world's spheres. Census: seeds 42 / 99 / 7, `--map medium`, a Life/Spirit god.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { AccountRecord } from '../../types/account';
import type { AscendantIdentity } from '../../types/remembrance';
import type { FundamentState } from '../../types/worldSoul';
import { SPHERE_NAMES } from '../../types';
import { DEV_ASCENDANT_IDENTITY, initializeGameStateFromIdentity } from '../gameInit';
import { sampleAccount } from '../accountStore';

import { blendFundaments, createDefaultFundament } from '../worldSoul';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { dominionOf } from '../dominion';
import { getLocationNodes } from '../sublocationShape';
import { tiltSphereAffinity } from '../sphereAffinity';
import { createDefaultSphereAffinity, MAX_SPHERE_SCORE } from '../../types/sphereAffinity';
import { DOMINION_BAND_RANK } from '../../data/dominion-content';
import { FUNDAMENT_BLEND_PER_RUN, FUNDAMENT_REVERT } from '../../data/account-content';

const KIN: AscendantIdentity = {
  ...DEV_ASCENDANT_IDENTITY,
  sphereAlignment: { primary: 'life', secondary: 'spirit' },
  spherePoints: { life: 3, spirit: 2 },
};
const SEEDS = [42, 99, 7];
/** The census kill criterion: the tilt may add at most this many Touched-or-better places. */
const KILL_EXTRA_PLACES = 5;

function world(seed: number, account?: AccountRecord): GameState {
  resetEventCounter();
  resetDecisionCache();
  return initializeGameStateFromIdentity(KIN, seed, undefined, 'medium', undefined, account).state;
}

/** `runs` run ends toward Life 0.6 / Spirit 0.4, as `concludeRun` blends them. */
function tiltedFundament(runs: number): FundamentState {
  const even = createDefaultFundament();
  const earned = createDefaultFundament();
  for (const s of SPHERE_NAMES) earned.sphereWeights[s] = 0;
  earned.sphereWeights.life = 0.6;
  earned.sphereWeights.spirit = 0.4;
  let f = createDefaultFundament();
  for (let i = 0; i < runs; i++) f = blendFundaments(blendFundaments(f, earned, FUNDAMENT_BLEND_PER_RUN), even, FUNDAMENT_REVERT);
  return { ...f, cycleCount: runs };
}

function withFundament(fundament: FundamentState): AccountRecord {
  return { ...sampleAccount(), fundament };
}

function census(state: GameState): { touched: number; life: number; spirit: number } {
  const god = state.graph.getNodesByType('actor').find(n => n.properties.actorType === 'ascendant')!.id;
  let touched = 0;
  let life = 0;
  let spirit = 0;
  for (const p of getLocationNodes(state.graph)) {
    if (DOMINION_BAND_RANK[dominionOf(state.graph, god, p.id).band] >= DOMINION_BAND_RANK.touched) touched++;
    const scores = (p.properties.sphereAffinity as { scores: Record<string, number> } | undefined)?.scores;
    life += scores?.life ?? 0;
    spirit += scores?.spirit ?? 0;
  }
  return { touched, life, spirit };
}

describe('THR-2028 — tiltSphereAffinity', () => {
  it('leaves scores untouched under even factors', () => {
    const a = createDefaultSphereAffinity();
    a.scores.life = 3;
    a.scores.order = 2;
    const ones = Object.fromEntries(SPHERE_NAMES.map(s => [s, 1])) as Record<(typeof SPHERE_NAMES)[number], number>;
    expect(tiltSphereAffinity(a, ones).scores).toEqual(a.scores);
  });

  it('rounds to whole points and clamps to the scale', () => {
    const a = createDefaultSphereAffinity();
    a.scores.life = 3;
    a.scores.spirit = 9;
    a.scores.order = 1;
    const f = Object.fromEntries(SPHERE_NAMES.map(s => [s, 1])) as Record<(typeof SPHERE_NAMES)[number], number>;
    f.life = 1.6;
    f.spirit = 1.6;
    f.order = 0.4;
    const out = tiltSphereAffinity(a, f).scores;
    expect(out.life).toBe(5);
    expect(out.spirit).toBe(MAX_SPHERE_SCORE);
    expect(out.order).toBe(0);
  });
});

describe('THR-2028 — the tilt census (tick 0)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it.each(SEEDS)('seed %i: the place life sum moves with the tilt, inside the kill criterion', seed => {
    const evenEchoes = census(world(seed, withFundament({ ...createDefaultFundament(), cycleCount: 2 })));
    const sample = census(world(seed, sampleAccount()));
    const oneRun = census(world(seed, withFundament(tiltedFundament(1))));
    const fiveRuns = census(world(seed, withFundament(tiltedFundament(5))));
    // eslint-disable-next-line no-console
    console.log(`[THR-2028 census] seed ${seed}: touched even=${evenEchoes.touched} sample=${sample.touched} 1run=${oneRun.touched} 5run=${fiveRuns.touched}; life even=${evenEchoes.life} sample=${sample.life} 1run=${oneRun.life} 5run=${fiveRuns.life}`);

    // The sample record is one faint run: its lift may round to nothing on a given seed.
    expect(sample.life).toBeGreaterThanOrEqual(evenEchoes.life);
    expect(oneRun.life).toBeGreaterThan(evenEchoes.life);
    expect(fiveRuns.life).toBeGreaterThanOrEqual(oneRun.life);
    expect(fiveRuns.life + fiveRuns.spirit).toBeGreaterThan(evenEchoes.life + evenEchoes.spirit);
    expect(fiveRuns.touched - evenEchoes.touched).toBeLessThanOrEqual(KILL_EXTRA_PLACES);
    expect(fiveRuns.touched).toBeGreaterThanOrEqual(evenEchoes.touched);
  });

  it('traces the places the tilt shifted, and nothing without an account', () => {
    world(42, withFundament(tiltedFundament(1)));
    const t = getTraces().find(e => e.category === 'account.places_tilted') as { placesTilted: number; places: number } | undefined;
    expect(t).toBeDefined();
    expect(t!.placesTilted).toBeGreaterThan(0);
    expect(t!.placesTilted).toBeLessThanOrEqual(t!.places);
    clearTraces();
    world(42);
    expect(getTraces().some(e => e.category === 'account.places_tilted')).toBe(false);
  });
});
