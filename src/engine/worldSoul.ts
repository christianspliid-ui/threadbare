import type {
  FundamentState,
  FundamentShift,
  FoundationBalances,
  ResonanceMemory,
  ResonanceState,
  TwilightState,
  UnmakingTrigger,
  HarvestType,
  HarvestOutcome,
  CycleTransition,
  WorldSoulState,
} from '../types/worldSoul';
import type { SphereName } from '../types/index';
import type { DoomClockArchetype } from '../types/doomClock';
import { SPHERE_NAMES } from '../types/index';
import {
  DEFAULT_FOUNDATION_BALANCES,
  MAX_RESONANCE_MEMORIES,
  TWILIGHT_TICK_RANGE,
  HARVEST_ECHO_COUNTS,
} from '../types/worldSoul';

// ── Fundament helpers ───────────────────────────────────────────

/** Create a perfectly neutral Fundament (all axes 0, equal sphere weights) */
export function createDefaultFundament(): FundamentState {
  const sphereWeights = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    sphereWeights[s] = 1.0 / SPHERE_NAMES.length;
  }
  return {
    foundations: { ...DEFAULT_FOUNDATION_BALANCES },
    sphereWeights,
    cycleCount: 0,
  };
}

/** Clamp a Foundation axis value to [-1.0, 1.0] */
export function clampFoundations(balances: FoundationBalances): FoundationBalances {
  return {
    chaos_order: Math.max(-1, Math.min(1, balances.chaos_order)),
    light_darkness: Math.max(-1, Math.min(1, balances.light_darkness)),
  };
}

/** Normalize sphere weights: floor negatives to 0.01, then scale to sum to 1.0 */
export function normalizeSphereWeights(
  weights: Record<SphereName, number>
): Record<SphereName, number> {
  const floored = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    floored[s] = Math.max(0.01, weights[s]);
  }
  const sum = SPHERE_NAMES.reduce((acc, s) => acc + floored[s], 0);
  const normalized = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    normalized[s] = floored[s] / sum;
  }
  return normalized;
}

/** Apply a single shift to a Fundament (immutable — returns new state) */
export function applyFundamentShift(
  fundament: FundamentState,
  shift: FundamentShift
): FundamentState {
  const newFoundations = { ...fundament.foundations };
  if (shift.foundationAxis && shift.foundationDelta !== undefined) {
    newFoundations[shift.foundationAxis] += shift.foundationDelta;
  }

  const newWeights = { ...fundament.sphereWeights };
  if (shift.sphereDeltas) {
    for (const [sphere, delta] of Object.entries(shift.sphereDeltas)) {
      newWeights[sphere as SphereName] += delta!;
    }
  }

  return {
    foundations: clampFoundations(newFoundations),
    sphereWeights: newWeights,
    cycleCount: fundament.cycleCount,
  };
}

/** Apply multiple shifts in sequence */
export function applyBatchShifts(
  fundament: FundamentState,
  shifts: FundamentShift[]
): FundamentState {
  return shifts.reduce(
    (state, shift) => applyFundamentShift(state, shift),
    fundament
  );
}

/** Weighted-average blend of existing (persistent) and current (this cycle) Fundaments.
 *  blendWeight is the proportion of the CURRENT cycle (0.0 = all existing, 1.0 = all current).
 *  Increments cycleCount. Normalizes sphere weights. */
export function blendFundaments(
  existing: FundamentState,
  current: FundamentState,
  blendWeight: number
): FundamentState {
  const w = Math.max(0, Math.min(1, blendWeight));
  const ew = 1 - w;

  const foundations: FoundationBalances = {
    chaos_order: existing.foundations.chaos_order * ew + current.foundations.chaos_order * w,
    light_darkness: existing.foundations.light_darkness * ew + current.foundations.light_darkness * w,
  };

  const rawWeights = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    rawWeights[s] = existing.sphereWeights[s] * ew + current.sphereWeights[s] * w;
  }

  return {
    foundations: clampFoundations(foundations),
    sphereWeights: normalizeSphereWeights(rawWeights),
    cycleCount: existing.cycleCount + 1,
  };
}

// ── Resonance helpers ───────────────────────────────────────────

/** Effective significance = raw significance × (1 - degradation) */
function effectiveSignificance(m: ResonanceMemory): number {
  return m.significance * (1 - m.degradation);
}

/** Create an empty Resonance state */
export function createResonanceState(): ResonanceState {
  return { memories: [], maxMemories: MAX_RESONANCE_MEMORIES };
}

/** Add a memory. If at capacity, replaces the lowest-effective-significance memory
 *  (only if the new memory is more significant). Immutable. */
export function captureMemory(
  state: ResonanceState,
  memory: ResonanceMemory
): ResonanceState {
  if (state.memories.length < state.maxMemories) {
    return { ...state, memories: [...state.memories, memory] };
  }
  let lowestIdx = 0;
  let lowestSig = effectiveSignificance(state.memories[0]);
  for (let i = 1; i < state.memories.length; i++) {
    const sig = effectiveSignificance(state.memories[i]);
    if (sig < lowestSig) {
      lowestSig = sig;
      lowestIdx = i;
    }
  }
  if (effectiveSignificance(memory) <= lowestSig) {
    return state;
  }
  const newMemories = [...state.memories];
  newMemories[lowestIdx] = memory;
  return { ...state, memories: newMemories };
}

/** Select top N memories by effective significance, sorted descending */
export function selectTopMemories(
  memories: ResonanceMemory[],
  count: number
): ResonanceMemory[] {
  return [...memories]
    .sort((a, b) => effectiveSignificance(b) - effectiveSignificance(a))
    .slice(0, count);
}

/** Increase degradation of all memories by given amount, cap at 1.0 */
export function degradeMemories(
  memories: ResonanceMemory[],
  amount: number
): ResonanceMemory[] {
  return memories.map(m => ({
    ...m,
    degradation: Math.min(1.0, m.degradation + amount),
  }));
}

/** Remove fully degraded memories (degradation >= 1.0) */
export function pruneMemories(memories: ResonanceMemory[]): ResonanceMemory[] {
  return memories.filter(m => m.degradation < 1.0);
}

// ── Unmaking / Twilight helpers ─────────────────────────────────

/** Success penalty by trigger type (higher = harder interventions) */
const TRIGGER_PENALTY: Record<UnmakingTrigger, number> = {
  doom_expired: 0.4,
  player_concession: 0.3,
  mandate_complete: 0.2,
};

export function computeSuccessPenalty(trigger: UnmakingTrigger): number {
  return TRIGGER_PENALTY[trigger];
}

/** Start a Twilight Phase. rng() returns [0,1). */
export function initiateTwilight(
  trigger: UnmakingTrigger,
  rng: () => number
): TwilightState {
  const range = TWILIGHT_TICK_RANGE.max - TWILIGHT_TICK_RANGE.min + 1;
  const ticks = TWILIGHT_TICK_RANGE.min + Math.floor(rng() * range);
  return {
    active: true,
    trigger,
    ticksRemaining: ticks,
    totalTicks: ticks,
    successPenalty: computeSuccessPenalty(trigger),
  };
}

/** Advance the Twilight Phase by one tick */
export function tickTwilight(state: TwilightState): TwilightState {
  const remaining = state.ticksRemaining - 1;
  return {
    ...state,
    ticksRemaining: remaining,
    active: remaining > 0,
  };
}

/** Check if the Twilight Phase is done */
export function isTwilightComplete(state: TwilightState): boolean {
  return state.ticksRemaining <= 0;
}

// ── Harvest ─────────────────────────────────────────────────────

export function computeHarvestType(trigger: UnmakingTrigger): HarvestType {
  switch (trigger) {
    case 'mandate_complete': return 'triumphant';
    case 'doom_expired': return 'somber';
    case 'player_concession': return 'bittersweet';
  }
}

/** Build the harvest outcome. Divine echoes are player-chosen (stub: empty array). */
export function buildHarvestOutcome(
  trigger: UnmakingTrigger,
  doomArchetype: DoomClockArchetype,
  totalShifts: FundamentShift[],
  capturedMemories: ResonanceMemory[],
  candidateEchoIds: string[],
  currentWorldSoul: WorldSoulState,
  currentFundament: FundamentState,
  _rng: () => number
): HarvestOutcome {
  const harvestType = computeHarvestType(trigger);
  const echoCounts = HARVEST_ECHO_COUNTS[harvestType];

  const cosmicEchoIds = candidateEchoIds.slice(0, echoCounts.cosmic);
  const divineEchoIds: string[] = [];

  const blendWeight = harvestType === 'triumphant' ? 0.5 : harvestType === 'somber' ? 0.3 : 0.4;
  const blendedFundament = blendFundaments(currentWorldSoul.fundament, currentFundament, blendWeight);

  const updatedWorldSoul: WorldSoulState = {
    fundament: blendedFundament,
    resonance: {
      ...currentWorldSoul.resonance,
      memories: [
        ...pruneMemories(degradeMemories(currentWorldSoul.resonance.memories, 0.15)),
        ...capturedMemories,
      ].slice(0, MAX_RESONANCE_MEMORIES),
    },
  };

  return {
    harvestType,
    trigger,
    doomArchetype,
    totalShifts,
    capturedMemories,
    cosmicEchoIds,
    divineEchoIds,
    updatedWorldSoul,
  };
}

/** Execute the full cycle transition sequence */
export function executeCycleTransition(
  existingWorldSoul: WorldSoulState,
  currentFundament: FundamentState,
  trigger: UnmakingTrigger,
  doomArchetype: DoomClockArchetype,
  totalShifts: FundamentShift[],
  newMemories: ResonanceMemory[],
  candidateEchoIds: string[],
  blendWeightOverride: number,
  degradationAmount: number,
  _rng: () => number
): CycleTransition {
  const harvestType = computeHarvestType(trigger);
  const echoCounts = HARVEST_ECHO_COUNTS[harvestType];

  const degraded = degradeMemories(existingWorldSoul.resonance.memories, degradationAmount);
  const surviving = pruneMemories(degraded);
  const allMemories = [...surviving, ...newMemories].slice(0, MAX_RESONANCE_MEMORIES);
  const cosmicEchoIds = candidateEchoIds.slice(0, echoCounts.cosmic);
  const blendedFundament = blendFundaments(
    existingWorldSoul.fundament,
    currentFundament,
    blendWeightOverride
  );

  const nextWorldSoul: WorldSoulState = {
    fundament: blendedFundament,
    resonance: {
      memories: allMemories,
      maxMemories: MAX_RESONANCE_MEMORIES,
    },
  };

  const harvest: HarvestOutcome = {
    harvestType,
    trigger,
    doomArchetype,
    totalShifts,
    capturedMemories: newMemories,
    cosmicEchoIds,
    divineEchoIds: [],
    updatedWorldSoul: nextWorldSoul,
  };

  return {
    cycleNumber: existingWorldSoul.fundament.cycleCount + 1,
    harvest,
    nextWorldSoul,
  };
}
