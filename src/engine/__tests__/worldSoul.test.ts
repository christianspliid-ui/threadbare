import { describe, it, expect } from 'vitest';
import {
  type FoundationAxis,
  type FoundationBalances,
  type FundamentState,
  type ResonanceMemory,
  type MemoryType,
  type ResonanceState,
  type WorldSoulState,
  type FundamentShift,
  type ShiftSource,
  type UnmakingTrigger,
  type TwilightState,
  type HarvestOutcome,
  type HarvestType,
  type CycleTransition,
  FOUNDATION_AXES,
  DEFAULT_FOUNDATION_BALANCES,
  MAX_RESONANCE_MEMORIES,
  TWILIGHT_TICK_RANGE,
  HARVEST_ECHO_COUNTS,
} from '../../types/worldSoul';

describe('worldSoul types', () => {
  it('exports FOUNDATION_AXES', () => {
    expect(FOUNDATION_AXES).toEqual(['chaos_order', 'light_darkness']);
  });

  it('exports DEFAULT_FOUNDATION_BALANCES with neutral values', () => {
    expect(DEFAULT_FOUNDATION_BALANCES).toEqual({
      chaos_order: 0.0,
      light_darkness: 0.0,
    });
  });

  it('exports MAX_RESONANCE_MEMORIES', () => {
    expect(MAX_RESONANCE_MEMORIES).toBe(10);
  });

  it('exports TWILIGHT_TICK_RANGE', () => {
    expect(TWILIGHT_TICK_RANGE).toEqual({ min: 5, max: 10 });
  });

  it('exports HARVEST_ECHO_COUNTS for each harvest type', () => {
    expect(HARVEST_ECHO_COUNTS).toEqual({
      triumphant: { cosmic: 5, divine: 3 },
      somber: { cosmic: 3, divine: 1 },
      bittersweet: { cosmic: 4, divine: 2 },
    });
  });

  it('can construct a FundamentState', () => {
    const fundament: FundamentState = {
      foundations: { chaos_order: 0.3, light_darkness: -0.2 },
      sphereWeights: {
        force: 0.15, matter: 0.1, energy: 0.12, life: 0.18,
        mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.15,
      },
      cycleCount: 0,
    };
    expect(fundament.foundations.chaos_order).toBe(0.3);
    expect(fundament.cycleCount).toBe(0);
  });

  it('can construct a ResonanceMemory', () => {
    const memory: ResonanceMemory = {
      id: 'memory_001',
      cycleOrigin: 1,
      memoryType: 'sphere_dominance',
      spheres: ['life'],
      summary: 'Necromantic cultures rose in the shadow of unchecked life magic.',
      significance: 0.85,
      degradation: 0,
    };
    expect(memory.memoryType).toBe('sphere_dominance');
    expect(memory.degradation).toBe(0);
  });

  it('can construct a TwilightState', () => {
    const twilight: TwilightState = {
      active: true,
      trigger: 'doom_expired',
      ticksRemaining: 7,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    expect(twilight.active).toBe(true);
    expect(twilight.trigger).toBe('doom_expired');
  });

  it('can construct a WorldSoulState', () => {
    const soul: WorldSoulState = {
      fundament: {
        foundations: DEFAULT_FOUNDATION_BALANCES,
        sphereWeights: {
          force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
          mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
        },
        cycleCount: 0,
      },
      resonance: {
        memories: [],
        maxMemories: MAX_RESONANCE_MEMORIES,
      },
    };
    expect(soul.fundament.cycleCount).toBe(0);
    expect(soul.resonance.memories).toHaveLength(0);
  });
});
