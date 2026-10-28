/**
 * THR-2080 — a sphere-growth Mandate takes its starting point from the settled world.
 *
 * Init measures the baseline before tick 1, and tick 1 mints ~70 sublocations whose
 * sphere bags first reach the aggregate on tick 2. Read as growth, that filled over
 * half of the seeded world's Mandate by tick 2 and ended the age near tick 41–77
 * with no god acting. The evaluator now counts nothing before
 * `MANDATE_BASELINE_SETTLE_TICK`, re-takes the baseline there, and counts growth
 * from that point on.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { WorldGraph } from '../graph';
import { generateRememberedMandate } from '../mandateGenerator';
import { createMandateStateWith } from '../mandate';
import { phaseMandate, resetMandateCounter } from '../phaseMandate';
import { createDoomClockState } from '../doomClock';
import { MANDATE_BASELINE_SETTLE_TICK } from '../../data/game-config';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { SphereAggregate } from '../../types/worldSoul';

function makeAggregate(mind: number, spirit: number): SphereAggregate {
  const base = 100;
  return {
    totalBySphere: {
      force: base, matter: base, energy: base, life: base,
      mind, spirit,
      time: base, entropy: base, order: base, chaos: base, light: base, darkness: base,
    },
    dominantSphere: 'mind',
    entityCount: 12,
  };
}

function makeState(tick: number, aggregate: SphereAggregate): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  const mandateDefinition = generateRememberedMandate({
    alignment: { primary: 'mind', secondary: 'spirit' },
    aggregate: makeAggregate(100, 100),
  });
  return {
    graph,
    ascendantId: 'asc',
    tick,
    mandateDefinition,
    mandateState: createMandateStateWith(mandateDefinition.id, 0, {
      checkpointResults: [],
      counterOmensEarned: 0,
      doomSeverityPenalties: 0,
    }),
    tickEvents: [],
    pendingSpherePressures: [],
    doomClock: { ...createDoomClockState('breach', 200), currentTick: tick, progress: 0 },
    worldSoul: { aggregate },
  } as unknown as GameState;
}

function step(state: GameState, tick: number, aggregate: SphereAggregate): GameState {
  const at = { ...state, tick, worldSoul: { ...state.worldSoul, aggregate } } as GameState;
  return { ...at, ...phaseMandate(at) } as GameState;
}

describe('THR-2080 — Mandate baseline settles after the first ticks', () => {
  beforeEach(() => {
    resetMandateCounter();
    clearTraces();
    enableTracing();
  });

  it('counts no progress before the settle tick, however much the world has grown', () => {
    const after = step(makeState(1, makeAggregate(100, 100)), 1, makeAggregate(160, 160));
    expect(after.mandateState?.progress).toBe(0);
    expect(after.mandateState?.primaryDelta).toBe(0);
    expect(after.mandateState?.baselineSettledTick).toBeUndefined();
    expect(after.mandateState?.completed).toBe(false);
  });

  it('overwrites a pre-seeded progress value before the settle tick', () => {
    const state = makeState(1, makeAggregate(100, 100));
    state.mandateState = { ...state.mandateState!, progress: 0.67 };
    const after = step(state, 1, makeAggregate(100, 100));
    expect(after.mandateState?.progress).toBe(0);
  });

  it('re-takes the baseline at the settle tick, so tick-1 growth reports progress 0', () => {
    let state = makeState(0, makeAggregate(100, 100));
    state = step(state, 1, makeAggregate(100, 100));
    // The tick-1 mints reach the aggregate on tick 2: +60% Mind, +60% Spirit.
    state = step(state, MANDATE_BASELINE_SETTLE_TICK, makeAggregate(160, 160));

    expect(state.mandateState?.baselineSettledTick).toBe(MANDATE_BASELINE_SETTLE_TICK);
    expect(state.mandateDefinition?.primaryBaseline).toBe(160);
    expect(state.mandateDefinition?.secondaryBaseline).toBe(160);
    expect(state.mandateState?.progress).toBe(0);
    expect(state.mandateState?.completed).toBe(false);

    const traces = getTraces().filter((t) => t.category === 'mandate_baseline_settled');
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({ oldPrimaryBaseline: 100, newPrimaryBaseline: 160, tick: 2 });
  });

  it('counts the god\'s growth after the settle tick against the settled baseline', () => {
    let state = makeState(0, makeAggregate(100, 100));
    state = step(state, MANDATE_BASELINE_SETTLE_TICK, makeAggregate(160, 160));
    const target = state.mandateDefinition!.primaryTargetDelta!;
    // THR-2081: the world growing by itself counts nothing...
    state = step(state, 40, makeAggregate(400, 400));
    expect(state.mandateState?.progress).toBe(0);
    // ...the god's own credits do, as points over the settled baseline.
    const half = state.mandateDefinition!.primaryTargetPoints! / 2;
    state = {
      ...state,
      pendingMandateCredits: [{ entityId: 'town', sphere: 'mind', points: half, cause: 'god', sources: ['claim'] }],
    } as GameState;
    state = step(state, 50, makeAggregate(400, 400));

    expect(state.mandateState?.primaryDelta).toBeCloseTo(target / 2, 6);
    expect(state.mandateState?.godLedger?.primary).toBeCloseTo(half, 6);
    expect(state.mandateState?.progress).toBeGreaterThan(0);
    // The baseline is taken once — a later tick does not move it again.
    expect(state.mandateDefinition?.primaryBaseline).toBe(160);
    expect(getTraces().filter((t) => t.category === 'mandate_baseline_settled')).toHaveLength(1);
  });

  afterAll(() => disableTracing());
});
