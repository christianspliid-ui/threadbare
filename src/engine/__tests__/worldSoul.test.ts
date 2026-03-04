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

import type { FundamentState } from '../../types/worldSoul';
import {
  createDefaultFundament,
  applyFundamentShift,
  applyBatchShifts,
  blendFundaments,
  clampFoundations,
  normalizeSphereWeights,
} from '../worldSoul';

describe('Fundament engine', () => {
  it('createDefaultFundament returns neutral starting state', () => {
    const f = createDefaultFundament();
    expect(f.foundations.chaos_order).toBe(0.0);
    expect(f.foundations.light_darkness).toBe(0.0);
    expect(f.sphereWeights.force).toBe(0.125);
    expect(f.sphereWeights.entropy).toBe(0.125);
    expect(f.cycleCount).toBe(0);
  });

  it('applyFundamentShift nudges a Foundation axis', () => {
    const f = createDefaultFundament();
    const shifted = applyFundamentShift(f, {
      source: 'resolved_action',
      foundationAxis: 'chaos_order',
      foundationDelta: 0.05,
    });
    expect(shifted.foundations.chaos_order).toBeCloseTo(0.05);
    expect(shifted.foundations.light_darkness).toBe(0.0);
  });

  it('applyFundamentShift nudges sphere weights', () => {
    const f = createDefaultFundament();
    const shifted = applyFundamentShift(f, {
      source: 'doom_escalation',
      sphereDeltas: { entropy: 0.05, life: -0.05 },
    });
    expect(shifted.sphereWeights.entropy).toBeCloseTo(0.175);
    expect(shifted.sphereWeights.life).toBeCloseTo(0.075);
  });

  it('applyFundamentShift clamps Foundation axes to [-1, 1]', () => {
    const f = createDefaultFundament();
    f.foundations.chaos_order = 0.95;
    const shifted = applyFundamentShift(f, {
      source: 'mandate_outcome',
      foundationAxis: 'chaos_order',
      foundationDelta: 0.2,
    });
    expect(shifted.foundations.chaos_order).toBe(1.0);
  });

  it('applyBatchShifts applies multiple shifts in sequence', () => {
    const f = createDefaultFundament();
    const shifts = [
      { source: 'resolved_action' as const, foundationAxis: 'chaos_order' as const, foundationDelta: 0.1 },
      { source: 'resolved_action' as const, foundationAxis: 'chaos_order' as const, foundationDelta: 0.1 },
      { source: 'doom_escalation' as const, sphereDeltas: { entropy: 0.03 } },
    ];
    const result = applyBatchShifts(f, shifts);
    expect(result.foundations.chaos_order).toBeCloseTo(0.2);
    expect(result.sphereWeights.entropy).toBeCloseTo(0.155);
  });

  it('normalizeSphereWeights rescales to sum to 1.0', () => {
    const weights = {
      force: 0.2, matter: 0.2, energy: 0.2, life: 0.2,
      mind: 0.2, spirit: 0.2, time: 0.2, entropy: 0.2,
    };
    const normalized = normalizeSphereWeights(weights);
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
    expect(normalized.force).toBeCloseTo(0.125);
  });

  it('normalizeSphereWeights floors negative values to 0.01 before normalizing', () => {
    const weights = {
      force: -0.5, matter: 0.2, energy: 0.2, life: 0.2,
      mind: 0.2, spirit: 0.2, time: 0.2, entropy: 0.2,
    };
    const normalized = normalizeSphereWeights(weights);
    // After flooring to 0.01 and normalizing, force will be scaled down
    // but all values should be positive and sum to 1.0
    expect(normalized.force).toBeGreaterThan(0);
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('blendFundaments weighted-averages two Fundaments', () => {
    const existing: FundamentState = {
      foundations: { chaos_order: 0.6, light_darkness: -0.4 },
      sphereWeights: {
        force: 0.2, matter: 0.1, energy: 0.1, life: 0.15,
        mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.15,
      },
      cycleCount: 3,
    };
    const current: FundamentState = {
      foundations: { chaos_order: -0.2, light_darkness: 0.8 },
      sphereWeights: {
        force: 0.1, matter: 0.15, energy: 0.15, life: 0.1,
        mind: 0.15, spirit: 0.1, time: 0.15, entropy: 0.1,
      },
      cycleCount: 3,
    };
    const blended = blendFundaments(existing, current, 0.5);
    expect(blended.foundations.chaos_order).toBeCloseTo(0.2);
    expect(blended.foundations.light_darkness).toBeCloseTo(0.2);
    expect(blended.cycleCount).toBe(4);
  });

  it('blendFundaments respects blend weight', () => {
    const existing: FundamentState = {
      foundations: { chaos_order: 1.0, light_darkness: 0.0 },
      sphereWeights: {
        force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
        mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
      },
      cycleCount: 1,
    };
    const current: FundamentState = {
      foundations: { chaos_order: 0.0, light_darkness: 0.0 },
      sphereWeights: {
        force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
        mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
      },
      cycleCount: 1,
    };
    const blended = blendFundaments(existing, current, 0.3);
    expect(blended.foundations.chaos_order).toBeCloseTo(0.7);
  });
});

import {
  createResonanceState,
  captureMemory,
  selectTopMemories,
  degradeMemories,
  pruneMemories,
} from '../worldSoul';

describe('Resonance engine', () => {
  const makeMemory = (id: string, significance: number, degradation = 0): ResonanceMemory => ({
    id,
    cycleOrigin: 1,
    memoryType: 'great_conflict',
    spheres: ['force'],
    summary: `Memory ${id}`,
    significance,
    degradation,
  });

  it('createResonanceState returns empty state with correct max', () => {
    const r = createResonanceState();
    expect(r.memories).toHaveLength(0);
    expect(r.maxMemories).toBe(MAX_RESONANCE_MEMORIES);
  });

  it('captureMemory adds a memory to the state', () => {
    const r = createResonanceState();
    const m = makeMemory('memory_001', 0.9);
    const updated = captureMemory(r, m);
    expect(updated.memories).toHaveLength(1);
    expect(updated.memories[0].id).toBe('memory_001');
  });

  it('captureMemory replaces lowest significance when at max capacity', () => {
    let r = createResonanceState();
    for (let i = 0; i < MAX_RESONANCE_MEMORIES; i++) {
      r = captureMemory(r, makeMemory(`memory_${i}`, 0.3 + i * 0.05));
    }
    expect(r.memories).toHaveLength(MAX_RESONANCE_MEMORIES);
    const highMem = makeMemory('memory_high', 0.99);
    const updated = captureMemory(r, highMem);
    expect(updated.memories).toHaveLength(MAX_RESONANCE_MEMORIES);
    expect(updated.memories.find(m => m.id === 'memory_high')).toBeDefined();
    expect(updated.memories.find(m => m.id === 'memory_0')).toBeUndefined();
  });

  it('captureMemory rejects memory below lowest existing when full', () => {
    let r = createResonanceState();
    for (let i = 0; i < MAX_RESONANCE_MEMORIES; i++) {
      r = captureMemory(r, makeMemory(`memory_${i}`, 0.5 + i * 0.05));
    }
    const lowMem = makeMemory('memory_low', 0.1);
    const updated = captureMemory(r, lowMem);
    expect(updated.memories.find(m => m.id === 'memory_low')).toBeUndefined();
  });

  it('selectTopMemories picks top N by effective significance', () => {
    const memories: ResonanceMemory[] = [
      makeMemory('a', 0.9, 0.0),
      makeMemory('b', 0.8, 0.5),
      makeMemory('c', 0.7, 0.0),
      makeMemory('d', 0.6, 0.1),
    ];
    const top2 = selectTopMemories(memories, 2);
    expect(top2).toHaveLength(2);
    expect(top2[0].id).toBe('a');
    expect(top2[1].id).toBe('c');
  });

  it('degradeMemories increases degradation by the given amount', () => {
    const memories: ResonanceMemory[] = [
      makeMemory('a', 0.9, 0.0),
      makeMemory('b', 0.8, 0.3),
    ];
    const degraded = degradeMemories(memories, 0.15);
    expect(degraded[0].degradation).toBeCloseTo(0.15);
    expect(degraded[1].degradation).toBeCloseTo(0.45);
  });

  it('degradeMemories caps degradation at 1.0', () => {
    const memories: ResonanceMemory[] = [makeMemory('a', 0.9, 0.95)];
    const degraded = degradeMemories(memories, 0.2);
    expect(degraded[0].degradation).toBe(1.0);
  });

  it('pruneMemories removes fully degraded memories', () => {
    const memories: ResonanceMemory[] = [
      makeMemory('a', 0.9, 0.5),
      makeMemory('b', 0.8, 1.0),
      makeMemory('c', 0.7, 0.99),
    ];
    const pruned = pruneMemories(memories);
    expect(pruned).toHaveLength(2);
    expect(pruned.find(m => m.id === 'b')).toBeUndefined();
  });
});

import {
  initiateTwilight,
  tickTwilight,
  isTwilightComplete,
  computeHarvestType,
  computeSuccessPenalty,
  buildHarvestOutcome,
  executeCycleTransition,
} from '../worldSoul';
import type { TwilightState, CycleTransition } from '../../types/worldSoul';

describe('Unmaking engine', () => {
  function mulberry32(seed: number): () => number {
    let s = seed | 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it('initiateTwilight creates a valid TwilightState from doom_expired', () => {
    const rng = mulberry32(42);
    const tw = initiateTwilight('doom_expired', rng);
    expect(tw.active).toBe(true);
    expect(tw.trigger).toBe('doom_expired');
    expect(tw.ticksRemaining).toBeGreaterThanOrEqual(TWILIGHT_TICK_RANGE.min);
    expect(tw.ticksRemaining).toBeLessThanOrEqual(TWILIGHT_TICK_RANGE.max);
    expect(tw.totalTicks).toBe(tw.ticksRemaining);
    expect(tw.successPenalty).toBeGreaterThan(0);
  });

  it('computeSuccessPenalty returns higher penalty for doom_expired', () => {
    const doomPen = computeSuccessPenalty('doom_expired');
    const mandPen = computeSuccessPenalty('mandate_complete');
    const concPen = computeSuccessPenalty('player_concession');
    expect(doomPen).toBeGreaterThan(mandPen);
    expect(concPen).toBeGreaterThan(mandPen);
    expect(doomPen).toBeGreaterThan(0);
    expect(doomPen).toBeLessThan(1);
  });

  it('tickTwilight decrements ticks remaining', () => {
    const tw: TwilightState = {
      active: true,
      trigger: 'doom_expired',
      ticksRemaining: 5,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    const next = tickTwilight(tw);
    expect(next.ticksRemaining).toBe(4);
    expect(next.active).toBe(true);
  });

  it('tickTwilight deactivates when ticks reach 0', () => {
    const tw: TwilightState = {
      active: true,
      trigger: 'doom_expired',
      ticksRemaining: 1,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    const next = tickTwilight(tw);
    expect(next.ticksRemaining).toBe(0);
    expect(next.active).toBe(false);
  });

  it('isTwilightComplete returns true when ticks = 0', () => {
    const tw: TwilightState = {
      active: false,
      trigger: 'doom_expired',
      ticksRemaining: 0,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    expect(isTwilightComplete(tw)).toBe(true);
  });

  it('computeHarvestType maps triggers correctly', () => {
    expect(computeHarvestType('mandate_complete')).toBe('triumphant');
    expect(computeHarvestType('doom_expired')).toBe('somber');
    expect(computeHarvestType('player_concession')).toBe('bittersweet');
  });

  it('buildHarvestOutcome returns correct echo counts for triumphant', () => {
    const worldSoul: WorldSoulState = {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    };
    const candidateIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rng = mulberry32(99);
    const harvest = buildHarvestOutcome(
      'mandate_complete',
      'breach',
      [],
      [],
      candidateIds,
      worldSoul,
      worldSoul.fundament,
      rng
    );
    expect(harvest.harvestType).toBe('triumphant');
    expect(harvest.cosmicEchoIds).toHaveLength(HARVEST_ECHO_COUNTS.triumphant.cosmic);
    expect(harvest.divineEchoIds).toHaveLength(0);
  });

  it('buildHarvestOutcome returns fewer cosmic echoes for somber', () => {
    const worldSoul: WorldSoulState = {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    };
    const candidateIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rng = mulberry32(99);
    const harvest = buildHarvestOutcome(
      'doom_expired',
      'failing',
      [],
      [],
      candidateIds,
      worldSoul,
      worldSoul.fundament,
      rng
    );
    expect(harvest.harvestType).toBe('somber');
    expect(harvest.cosmicEchoIds).toHaveLength(HARVEST_ECHO_COUNTS.somber.cosmic);
  });

  it('executeCycleTransition produces a complete CycleTransition', () => {
    const worldSoul: WorldSoulState = {
      fundament: {
        foundations: { chaos_order: 0.5, light_darkness: -0.3 },
        sphereWeights: {
          force: 0.2, matter: 0.1, energy: 0.1, life: 0.15,
          mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.15,
        },
        cycleCount: 2,
      },
      resonance: createResonanceState(),
    };
    const currentFundament: FundamentState = {
      foundations: { chaos_order: -0.2, light_darkness: 0.6 },
      sphereWeights: {
        force: 0.1, matter: 0.15, energy: 0.15, life: 0.1,
        mind: 0.15, spirit: 0.1, time: 0.15, entropy: 0.1,
      },
      cycleCount: 2,
    };
    const rng = mulberry32(123);
    const transition = executeCycleTransition(
      worldSoul,
      currentFundament,
      'mandate_complete',
      'convergence',
      [],
      [],
      ['a', 'b', 'c', 'd', 'e', 'f'],
      0.4,
      0.15,
      rng
    );
    expect(transition.cycleNumber).toBe(3);
    expect(transition.harvest.harvestType).toBe('triumphant');
    expect(transition.nextWorldSoul.fundament.cycleCount).toBe(3);
    expect(transition.nextWorldSoul.resonance).toBeDefined();
  });
});

describe('World-Soul integration: full cycle lifecycle', () => {
  function mulberry32(seed: number): () => number {
    let s = seed | 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it('simulates a 3-cycle game with Fundament drift, memory accumulation, and degradation', () => {
    const rng = mulberry32(7777);

    let worldSoul: WorldSoulState = {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    };
    expect(worldSoul.fundament.cycleCount).toBe(0);
    expect(worldSoul.resonance.memories).toHaveLength(0);

    // ── Cycle 1: mandate_complete ──
    let cycleFundament = { ...worldSoul.fundament };
    const cycle1Shifts: FundamentShift[] = [
      { source: 'resolved_action', foundationAxis: 'chaos_order', foundationDelta: 0.1 },
      { source: 'resolved_action', foundationAxis: 'chaos_order', foundationDelta: 0.1 },
      { source: 'resolved_action', foundationAxis: 'light_darkness', foundationDelta: -0.05 },
      { source: 'resolved_action', sphereDeltas: { life: 0.03, entropy: -0.02 } },
      { source: 'doom_escalation', foundationAxis: 'chaos_order', foundationDelta: -0.05 },
      { source: 'doom_escalation', sphereDeltas: { entropy: 0.04 } },
    ];
    cycleFundament = applyBatchShifts(cycleFundament, cycle1Shifts);
    expect(cycleFundament.foundations.chaos_order).toBeCloseTo(0.15);
    expect(cycleFundament.foundations.light_darkness).toBeCloseTo(-0.05);

    const twilight1 = initiateTwilight('mandate_complete', rng);
    expect(twilight1.active).toBe(true);
    expect(twilight1.successPenalty).toBe(0.2);

    let tw = twilight1;
    while (!isTwilightComplete(tw)) {
      tw = tickTwilight(tw);
    }
    expect(tw.active).toBe(false);

    const cycle1Memory: ResonanceMemory = {
      id: 'memory_cycle1_a',
      cycleOrigin: 1,
      memoryType: 'mandate_triumph',
      spheres: ['life', 'spirit'],
      summary: 'The garden-priests of Velanthos achieved cosmic harmony.',
      significance: 0.85,
      degradation: 0,
    };

    const transition1 = executeCycleTransition(
      worldSoul, cycleFundament, 'mandate_complete', 'convergence',
      cycle1Shifts, [cycle1Memory],
      ['actor_hero', 'loc_temple', 'artifact_crown', 'actor_sage', 'loc_forest', 'actor_villain'],
      0.5, 0.15, rng
    );

    expect(transition1.cycleNumber).toBe(1);
    expect(transition1.harvest.harvestType).toBe('triumphant');
    expect(transition1.harvest.cosmicEchoIds).toHaveLength(5);
    worldSoul = transition1.nextWorldSoul;
    expect(worldSoul.fundament.cycleCount).toBe(1);
    expect(worldSoul.fundament.foundations.chaos_order).toBeGreaterThan(0);
    expect(worldSoul.fundament.foundations.chaos_order).toBeLessThan(0.15);
    expect(worldSoul.resonance.memories).toHaveLength(1);
    expect(worldSoul.resonance.memories[0].id).toBe('memory_cycle1_a');

    // ── Cycle 2: doom_expired ──
    cycleFundament = { ...worldSoul.fundament };
    const cycle2Shifts: FundamentShift[] = [
      { source: 'resolved_action', foundationAxis: 'light_darkness', foundationDelta: 0.3 },
      { source: 'doom_escalation', sphereDeltas: { entropy: 0.1, force: 0.05 } },
    ];
    cycleFundament = applyBatchShifts(cycleFundament, cycle2Shifts);

    const cycle2Memory: ResonanceMemory = {
      id: 'memory_cycle2_a',
      cycleOrigin: 2,
      memoryType: 'doom_scar',
      spheres: ['entropy', 'force'],
      summary: 'The breach consumed the eastern reaches.',
      significance: 0.92,
      degradation: 0,
    };

    const transition2 = executeCycleTransition(
      worldSoul, cycleFundament, 'doom_expired', 'breach',
      cycle2Shifts, [cycle2Memory],
      ['actor_a', 'actor_b', 'loc_c', 'artifact_d'],
      0.3, 0.15, rng
    );

    expect(transition2.harvest.harvestType).toBe('somber');
    expect(transition2.harvest.cosmicEchoIds).toHaveLength(3);
    worldSoul = transition2.nextWorldSoul;
    expect(worldSoul.fundament.cycleCount).toBe(2);

    const cycle1Mem = worldSoul.resonance.memories.find(m => m.id === 'memory_cycle1_a');
    expect(cycle1Mem).toBeDefined();
    expect(cycle1Mem!.degradation).toBeCloseTo(0.15);
    expect(worldSoul.resonance.memories.find(m => m.id === 'memory_cycle2_a')).toBeDefined();

    // ── Cycle 3: player_concession ──
    cycleFundament = { ...worldSoul.fundament };
    const cycle3Shifts: FundamentShift[] = [
      { source: 'resolved_action', foundationAxis: 'chaos_order', foundationDelta: -0.2 },
    ];
    cycleFundament = applyBatchShifts(cycleFundament, cycle3Shifts);

    const transition3 = executeCycleTransition(
      worldSoul, cycleFundament, 'player_concession', 'failing',
      cycle3Shifts, [],
      ['actor_x', 'actor_y', 'loc_z', 'artifact_w', 'actor_v'],
      0.4, 0.15, rng
    );

    expect(transition3.harvest.harvestType).toBe('bittersweet');
    expect(transition3.harvest.cosmicEchoIds).toHaveLength(4);
    worldSoul = transition3.nextWorldSoul;
    expect(worldSoul.fundament.cycleCount).toBe(3);

    const c1Mem = worldSoul.resonance.memories.find(m => m.id === 'memory_cycle1_a');
    expect(c1Mem).toBeDefined();
    expect(c1Mem!.degradation).toBeCloseTo(0.30);

    const c2Mem = worldSoul.resonance.memories.find(m => m.id === 'memory_cycle2_a');
    expect(c2Mem).toBeDefined();
    expect(c2Mem!.degradation).toBeCloseTo(0.15);

    const weightSum = Object.values(worldSoul.fundament.sphereWeights).reduce((a, b) => a + b, 0);
    expect(weightSum).toBeCloseTo(1.0);

    expect(worldSoul.fundament.foundations.chaos_order).toBeGreaterThanOrEqual(-1);
    expect(worldSoul.fundament.foundations.chaos_order).toBeLessThanOrEqual(1);
    expect(worldSoul.fundament.foundations.light_darkness).toBeGreaterThanOrEqual(-1);
    expect(worldSoul.fundament.foundations.light_darkness).toBeLessThanOrEqual(1);
  });
});
