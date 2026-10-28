/**
 * THR-2081 — the Mandate counts only the god's own hand, behind
 * `MANDATE_GOD_LEDGER_ENABLED`. Flag on: the settle tick writes the point targets and
 * rescales the relative target and checkpoint deltas to them. Flag off: today's
 * world-total rule.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldGraph } from '../graph';
import { generateRememberedMandate } from '../mandateGenerator';
import { createMandateStateWith } from '../mandate';
import { createDoomClockState } from '../doomClock';
import type { GameState } from '../../types/gameState';
import type { SphereAggregate } from '../../types/worldSoul';

const flag = vi.hoisted(() => ({ on: true }));
vi.mock('../../data/game-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/game-config')>();
  return {
    ...actual,
    get MANDATE_GOD_LEDGER_ENABLED() {
      return flag.on;
    },
  };
});

import { phaseMandate, resetMandateCounter } from '../phaseMandate';
import {
  MANDATE_BASELINE_SETTLE_TICK,
  MANDATE_CHECKPOINT_THRESHOLDS,
  MANDATE_PRIMARY_TARGET_POINTS,
  MANDATE_SECONDARY_TARGET_POINTS,
} from '../../data/game-config';

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

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  const mandateDefinition = generateRememberedMandate({
    alignment: { primary: 'mind', secondary: 'spirit' },
    aggregate: makeAggregate(100, 100),
  });
  return {
    graph,
    ascendantId: 'asc',
    tick: 0,
    mandateDefinition,
    mandateState: createMandateStateWith(mandateDefinition.id, 0, {
      checkpointResults: [],
      counterOmensEarned: 0,
      doomSeverityPenalties: 0,
    }),
    tickEvents: [],
    pendingSpherePressures: [],
    doomClock: { ...createDoomClockState('breach', 200), currentTick: 0, progress: 0 },
    worldSoul: { aggregate: makeAggregate(100, 100) },
  } as unknown as GameState;
}

function step(state: GameState, tick: number, aggregate: SphereAggregate): GameState {
  const at = { ...state, tick, worldSoul: { ...state.worldSoul, aggregate } } as GameState;
  return { ...at, ...phaseMandate(at) } as GameState;
}

describe('THR-2081 — phaseMandate god ledger', () => {
  beforeEach(() => {
    resetMandateCounter();
    flag.on = true;
  });

  it('flag off: progress follows the world-total rule, as before', () => {
    flag.on = false;
    let state = step(makeState(), MANDATE_BASELINE_SETTLE_TICK, makeAggregate(160, 160));
    expect(state.mandateDefinition?.primaryTargetPoints).toBeUndefined();
    const target = state.mandateDefinition!.primaryTargetDelta!;
    state = step(state, 50, makeAggregate(160 * (1 + target / 2), 160));
    expect(state.mandateState?.primaryDelta).toBeCloseTo(target / 2, 6);
    expect(state.mandateState?.progress).toBeCloseTo(0.25, 6);
    expect(state.mandateState?.godLedger).toBeUndefined();
  });

  it('flag on: the settle tick writes the point targets and rescales the deltas', () => {
    const state = step(makeState(), MANDATE_BASELINE_SETTLE_TICK, makeAggregate(160, 200));
    const def = state.mandateDefinition!;
    expect(def.primaryTargetPoints).toBe(MANDATE_PRIMARY_TARGET_POINTS);
    expect(def.secondaryTargetPoints).toBe(MANDATE_SECONDARY_TARGET_POINTS);
    expect(def.primaryTargetDelta).toBeCloseTo(MANDATE_PRIMARY_TARGET_POINTS / 160, 9);
    expect(def.secondaryTargetDelta).toBeCloseTo(MANDATE_SECONDARY_TARGET_POINTS / 200, 9);
    def.checkpoints!.forEach((checkpoint, i) => {
      expect(checkpoint.requiredPrimaryDelta).toBeCloseTo(def.primaryTargetDelta! * MANDATE_CHECKPOINT_THRESHOLDS[i], 9);
      expect(checkpoint.requiredSecondaryDelta).toBeCloseTo(def.secondaryTargetDelta! * MANDATE_CHECKPOINT_THRESHOLDS[i], 9);
    });
  });

  it('flag on: the world growing by itself never moves the Mandate', () => {
    let state = step(makeState(), MANDATE_BASELINE_SETTLE_TICK, makeAggregate(160, 160));
    state = step(state, 300, makeAggregate(1000, 1000));
    expect(state.mandateState?.progress).toBe(0);
    expect(state.mandateState?.completed).toBe(false);
  });

  it('flag on: the god\'s points fill it, and the full targets complete it', () => {
    let state = step(makeState(), MANDATE_BASELINE_SETTLE_TICK, makeAggregate(160, 160));
    state = {
      ...state,
      pendingMandateCredits: [
        { entityId: 'a', sphere: 'mind', points: MANDATE_PRIMARY_TARGET_POINTS, cause: 'god', sources: ['claim'] },
        { entityId: 'b', sphere: 'spirit', points: MANDATE_SECONDARY_TARGET_POINTS, cause: 'god', sources: ['claim'] },
      ],
    } as GameState;
    state = step(state, 100, makeAggregate(160, 160));
    expect(state.mandateState?.progress).toBeCloseTo(1, 6);
    expect(state.mandateState?.completed).toBe(true);
    expect(state.pendingMandateCredits).toEqual([]);
  });

  it('flag on: credits that land before the settle are dropped, not banked', () => {
    let state = makeState();
    state = {
      ...state,
      pendingMandateCredits: [{ entityId: 'a', sphere: 'mind', points: 50, cause: 'god', sources: ['claim'] }],
    } as GameState;
    state = step(state, 1, makeAggregate(100, 100));
    expect(state.pendingMandateCredits).toEqual([]);
    state = step(state, MANDATE_BASELINE_SETTLE_TICK, makeAggregate(160, 160));
    expect(state.mandateState?.godLedger?.primary ?? 0).toBe(0);
  });
});
