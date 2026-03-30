/**
 * Tests for phaseControlEffects — TB-041 ControlEffect runtime & tick phase.
 *
 * Covers: payment ordering, threshold checks, LIFO lapse, income crediting,
 * mutation queueing, and fail-soft behavior.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { phaseControlEffects, computeControlEffectIncome } from '../phaseControlEffects';
import type { GameState } from '../../types/gameState';
import type { ControlEffect } from '../../types/controlEffect';
import type { EssencePool } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyPool(): EssencePool {
  const pool = {} as EssencePool;
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool;
}

function makeEffect(overrides: Partial<ControlEffect> = {}): ControlEffect {
  return {
    effectId: 'eff_1',
    templateId: 'tpl_test',
    ownerId: 'asc_1',
    targetHexCol: 3,
    targetHexRow: 5,
    establishedTick: 10,
    ritualEssenceInvested: 5,
    perTickCost: { force: 0.5 },
    perTickMutations: [],
    perTickGraphOps: [],
    active: true,
    ticksActive: 0,
    narrativeTemplates: {
      established: 'Established.',
      active: 'Active.',
      lapsed: 'Lapsed.',
    },
    ...overrides,
  };
}

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  const pool = createEmptyPool();
  pool.force = 10;
  return {
    tick: 20,
    essencePool: pool,
    controlEffects: [],
    tiles: [
      {
        coord: { col: 3, row: 5 },
        terrain: 'grassland',
        divineInfluence: 0.5,
        corruption: 0.1,
        biome: 'temperate',
      },
    ],
    tickEvents: [],
    pendingHexMutations: [],
    // Minimal stubs for other required GameState fields
    cycle: 1,
    phase: 'playing',
    seed: 42,
    graph: {
      getNode: (id: string) => id === 'asc_1' ? { id: 'asc_1', type: 'ascendant', category: 'ascendant', name: 'Test', properties: {} } : null,
      getOutgoingEdges: () => [],
      getIncomingEdges: () => [],
    } as any,
    cosmology: {} as any,
    clock: { currentTick: 20, season: 0, year: 0 } as any,
    ascendantId: 'asc_1',
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
    ...overrides,
  } as GameState;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('phaseControlEffects', () => {
  it('returns empty partial when no control effects exist', () => {
    const state = makeMinimalState({ controlEffects: [] });
    const result = phaseControlEffects(state);
    expect(result).toEqual({});
  });

  it('returns empty partial when controlEffects is undefined', () => {
    const state = makeMinimalState({ controlEffects: undefined });
    const result = phaseControlEffects(state);
    expect(result).toEqual({});
  });

  it('debits per-tick cost from essence pool', () => {
    const effect = makeEffect({ perTickCost: { force: 0.5 } });
    const state = makeMinimalState({ controlEffects: [effect] });
    state.essencePool.force = 10;

    const result = phaseControlEffects(state);
    expect(result.essencePool!.force).toBeCloseTo(9.5);
  });

  it('increments ticksActive on each tick', () => {
    const effect = makeEffect({ ticksActive: 5 });
    const state = makeMinimalState({ controlEffects: [effect] });

    const result = phaseControlEffects(state);
    const active = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(active?.ticksActive).toBe(6);
  });

  it('credits per-tick income to essence pool', () => {
    const effect = makeEffect({
      perTickCost: { force: 0.2 },
      perTickIncome: { mind: 0.8 },
    });
    const state = makeMinimalState({ controlEffects: [effect] });
    state.essencePool.force = 10;
    state.essencePool.mind = 0;

    const result = phaseControlEffects(state);
    expect(result.essencePool!.mind).toBeCloseTo(0.8);
    expect(result.essencePool!.force).toBeCloseTo(9.8);
  });

  it('lapses effect when essence is insufficient', () => {
    const effect = makeEffect({ perTickCost: { force: 5 } });
    const state = makeMinimalState({ controlEffects: [effect] });
    state.essencePool.force = 3; // Not enough

    const result = phaseControlEffects(state);
    const eff = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(eff?.active).toBe(false);
    expect(eff?.lapseReason).toBe('essence_depleted');
    // Essence should NOT be debited for lapsed effect
    expect(result.essencePool!.force).toBeCloseTo(3);
  });

  it('uses LIFO ordering for lapse (newest lapse first)', () => {
    const older = makeEffect({
      effectId: 'eff_old',
      establishedTick: 5,
      perTickCost: { force: 3 },
    });
    const newer = makeEffect({
      effectId: 'eff_new',
      establishedTick: 15,
      perTickCost: { force: 3 },
    });
    const state = makeMinimalState({ controlEffects: [older, newer] });
    state.essencePool.force = 4; // Can only pay one (3 each, only 4 available)

    const result = phaseControlEffects(state);
    const oldEff = result.controlEffects!.find(e => e.effectId === 'eff_old');
    const newEff = result.controlEffects!.find(e => e.effectId === 'eff_new');

    // Oldest pays first, so old should be active and new should lapse
    expect(oldEff?.active).toBe(true);
    expect(newEff?.active).toBe(false);
    expect(newEff?.lapseReason).toBe('essence_depleted');
  });

  it('lapses effect when sustain threshold fails', () => {
    const effect = makeEffect({
      sustainThreshold: {
        field: 'divineInfluence',
        target: 'hex',
        operator: '>=',
        value: 0.9, // Current value is 0.5, below threshold
      },
      perTickCost: { force: 0.1 },
    });
    const state = makeMinimalState({ controlEffects: [effect] });

    const result = phaseControlEffects(state);
    const eff = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(eff?.active).toBe(false);
    expect(eff?.lapseReason).toBe('threshold_failed');
    // No essence should be debited for threshold-failed effects
    expect(result.essencePool!.force).toBeCloseTo(10);
  });

  it('queues hex mutations from active control effects', () => {
    const effect = makeEffect({
      perTickMutations: [
        { field: 'divineInfluence', delta: 0.05, source: 'test' },
      ],
    });
    const state = makeMinimalState({ controlEffects: [effect] });

    const result = phaseControlEffects(state);
    expect(result.pendingHexMutations).toHaveLength(1);
    expect(result.pendingHexMutations![0]).toMatchObject({
      col: 3,
      row: 5,
      field: 'divineInfluence',
      delta: 0.05,
    });
  });

  it('emits control_effect_lapsed tick event', () => {
    const effect = makeEffect({ perTickCost: { force: 100 } });
    const state = makeMinimalState({ controlEffects: [effect] });
    state.essencePool.force = 1;

    const result = phaseControlEffects(state);
    const lapseEvent = result.tickEvents!.find(e => e.type === 'control_effect_lapsed');
    expect(lapseEvent).toBeDefined();
    expect(lapseEvent!.hexCoords).toEqual({ col: 3, row: 5 });
  });

  it('preserves already-lapsed effects unchanged', () => {
    const lapsed = makeEffect({
      effectId: 'eff_lapsed',
      active: false,
      lapseReason: 'usurped',
    });
    const active = makeEffect({ effectId: 'eff_active' });
    const state = makeMinimalState({ controlEffects: [lapsed, active] });

    const result = phaseControlEffects(state);
    const found = result.controlEffects!.find(e => e.effectId === 'eff_lapsed');
    expect(found?.active).toBe(false);
    expect(found?.lapseReason).toBe('usurped');
  });

  it('lapses when owner no longer exists in graph (fail-soft)', () => {
    const effect = makeEffect({ ownerId: 'nonexistent_owner' });
    const state = makeMinimalState({ controlEffects: [effect] });

    const result = phaseControlEffects(state);
    const eff = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(eff?.active).toBe(false);
    expect(eff?.lapseReason).toBe('voluntarily_released');
  });

  it('checks location threshold against graph node property', () => {
    const graph = {
      getNode: (id: string) => {
        if (id === 'asc_1') return { id: 'asc_1', type: 'ascendant', name: 'Test', properties: {} };
        if (id === 'loc_1') return { id: 'loc_1', type: 'location', name: 'Village', properties: { magicalSaturation: 0.6 } };
        return null;
      },
      getOutgoingEdges: () => [],
      getIncomingEdges: () => [],
    } as any;

    const effect = makeEffect({
      targetNodeId: 'loc_1',
      sustainThreshold: {
        field: 'magicalSaturation',
        target: 'location',
        operator: '>=',
        value: 0.5,
      },
    });
    const state = makeMinimalState({ graph, controlEffects: [effect] });

    const result = phaseControlEffects(state);
    const eff = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(eff?.active).toBe(true);
  });

  it('lapses when location threshold fails', () => {
    const graph = {
      getNode: (id: string) => {
        if (id === 'asc_1') return { id: 'asc_1', type: 'ascendant', name: 'Test', properties: {} };
        if (id === 'loc_1') return { id: 'loc_1', type: 'location', name: 'Village', properties: { magicalSaturation: 0.2 } };
        return null;
      },
      getOutgoingEdges: () => [],
      getIncomingEdges: () => [],
    } as any;

    const effect = makeEffect({
      targetNodeId: 'loc_1',
      sustainThreshold: {
        field: 'magicalSaturation',
        target: 'location',
        operator: '>=',
        value: 0.5,
      },
    });
    const state = makeMinimalState({ graph, controlEffects: [effect] });

    const result = phaseControlEffects(state);
    const eff = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(eff?.active).toBe(false);
    expect(eff?.lapseReason).toBe('threshold_failed');
  });

  it('refunds partial multi-sphere payment on failure', () => {
    const effect = makeEffect({
      perTickCost: { force: 1, matter: 100 }, // Can afford force, not matter
    });
    const state = makeMinimalState({ controlEffects: [effect] });
    state.essencePool.force = 5;
    state.essencePool.matter = 2;

    const result = phaseControlEffects(state);
    // Force should be refunded since matter couldn't pay
    expect(result.essencePool!.force).toBe(5);
    expect(result.essencePool!.matter).toBe(2);
    const eff = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(eff?.active).toBe(false);
  });

  it('lapses when target hex does not exist (fail-soft)', () => {
    const effect = makeEffect({
      targetHexCol: 99,
      targetHexRow: 99,
      sustainThreshold: {
        field: 'divineInfluence',
        target: 'hex',
        operator: '>=',
        value: 0.1,
      },
    });
    const state = makeMinimalState({ controlEffects: [effect] });

    const result = phaseControlEffects(state);
    const eff = result.controlEffects!.find(e => e.effectId === 'eff_1');
    expect(eff?.active).toBe(false);
    expect(eff?.lapseReason).toBe('threshold_failed');
  });
});

describe('computeControlEffectIncome', () => {
  it('returns empty object for no active effects', () => {
    const result = computeControlEffectIncome([]);
    expect(result).toEqual({});
  });

  it('sums income across multiple active effects', () => {
    const effects: ControlEffect[] = [
      makeEffect({ effectId: 'a', perTickIncome: { force: 0.5, mind: 0.3 } }),
      makeEffect({ effectId: 'b', perTickIncome: { force: 0.2 } }),
    ];

    const result = computeControlEffectIncome(effects);
    expect(result.force).toBeCloseTo(0.7);
    expect(result.mind).toBeCloseTo(0.3);
  });

  it('ignores inactive effects', () => {
    const effects: ControlEffect[] = [
      makeEffect({ active: false, perTickIncome: { force: 1.0 } }),
    ];

    const result = computeControlEffectIncome(effects);
    expect(result).toEqual({});
  });
});
