import type { RegionDetectionState } from '../../types/gameState';
import type { DetectionThresholdBand, EncounterChoiceCost } from '../../types/traces/encounter-traces';
import {
  CHOICE_ESSENCE_COST_DEEP,
  CHOICE_ESSENCE_COST_FULLER,
  CHOICE_ESSENCE_COST_SMALL,
  DETECTION_THRESHOLD_ENCOUNTER,
  DETECTION_THRESHOLD_NOTICE,
  DETECTION_THRESHOLD_TURN,
} from '../../data/encounter-experience-constants';

export const MAX_DETECTION_PRESSURE = 1;
const MIN_DETECTION_PRESSURE = 0;
const DEFAULT_SPHERE_VISIBILITY_MULTIPLIER = 1;

function clampPressure(value: number): number {
  if (!Number.isFinite(value)) return MIN_DETECTION_PRESSURE;
  if (value < MIN_DETECTION_PRESSURE) return MIN_DETECTION_PRESSURE;
  if (value > MAX_DETECTION_PRESSURE) return MAX_DETECTION_PRESSURE;
  return value;
}

export function baseDetectionDeltaForCost(cost: EncounterChoiceCost): number {
  if (cost === 'small_breath') return CHOICE_ESSENCE_COST_SMALL;
  if (cost === 'fuller_breath') return CHOICE_ESSENCE_COST_FULLER;
  return CHOICE_ESSENCE_COST_DEEP;
}

export function resolveSphereVisibilityMultiplier(rawVisibility: number | undefined): number {
  if (!Number.isFinite(rawVisibility)) return DEFAULT_SPHERE_VISIBILITY_MULTIPLIER;
  return Math.max(0, rawVisibility as number);
}

function readPressureEntry(
  pressureByRegion: ReadonlyMap<string, RegionDetectionState>,
  regionId: string,
): RegionDetectionState {
  const existing = pressureByRegion.get(regionId);
  if (existing) return existing;
  return {
    regionId,
    pressure: 0,
    lastUpdatedTick: 0,
  };
}

function toPressureMap(pressure: readonly RegionDetectionState[]): Map<string, RegionDetectionState> {
  const map = new Map<string, RegionDetectionState>();
  for (const entry of pressure) {
    map.set(entry.regionId, entry);
  }
  return map;
}

function fromPressureMap(pressureByRegion: ReadonlyMap<string, RegionDetectionState>): RegionDetectionState[] {
  return [...pressureByRegion.values()].sort((a, b) => a.regionId.localeCompare(b.regionId));
}

export interface DetectionDeltaResult {
  regionalDetectionPressure: RegionDetectionState[];
  fromPressure: number;
  toPressure: number;
  appliedDelta: number;
}

export function applyDetectionDelta(
  current: readonly RegionDetectionState[],
  regionId: string,
  cost: EncounterChoiceCost,
  sphereVisibility: number | undefined,
  tick: number,
): DetectionDeltaResult {
  const pressureByRegion = toPressureMap(current);
  const before = readPressureEntry(pressureByRegion, regionId);
  const fromPressure = clampPressure(before.pressure);
  const multiplier = resolveSphereVisibilityMultiplier(sphereVisibility);
  const appliedDelta = baseDetectionDeltaForCost(cost) * multiplier;
  const toPressure = clampPressure(fromPressure + appliedDelta);

  pressureByRegion.set(regionId, {
    regionId,
    pressure: toPressure,
    lastUpdatedTick: tick,
  });

  return {
    regionalDetectionPressure: fromPressureMap(pressureByRegion),
    fromPressure,
    toPressure,
    appliedDelta,
  };
}

/**
 * Apply a **signed** detection delta directly, bypassing the choice-cost band.
 *
 * THR-885. Every pre-existing writer prices detection by `EncounterChoiceCost`,
 * which only ever *raises* pressure — there was no way to express a reduction, so
 * The Veil (help given unwitnessed) had no channel to write through. This is that
 * channel, added to the module that owns detection pressure rather than beside it:
 * it shares this file's clamp and its map round-trip, so a card-driven change and
 * a choice-driven change land in exactly the same shape.
 *
 * Positive raises pressure, negative lowers it, and the result stays clamped to
 * `[0, MAX_DETECTION_PRESSURE]` — a card cannot drive a region negative any more
 * than a choice can drive it past 1.
 */
export function applyRawDetectionDelta(
  current: readonly RegionDetectionState[],
  regionId: string,
  delta: number,
  tick: number,
): DetectionDeltaResult {
  const pressureByRegion = toPressureMap(current);
  const before = readPressureEntry(pressureByRegion, regionId);
  const fromPressure = clampPressure(before.pressure);
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  const toPressure = clampPressure(fromPressure + safeDelta);

  pressureByRegion.set(regionId, {
    regionId,
    pressure: toPressure,
    lastUpdatedTick: tick,
  });

  return {
    regionalDetectionPressure: fromPressureMap(pressureByRegion),
    fromPressure,
    toPressure,
    // The *effective* delta after clamping, not the requested one — a caller
    // that asked for -0.5 at pressure 0.1 needs to know it only got -0.1.
    appliedDelta: toPressure - fromPressure,
  };
}

export function decayDetectionPressure(
  current: readonly RegionDetectionState[],
  decayRatePerTick: number,
  tick: number,
): RegionDetectionState[] {
  const decayRate = Number.isFinite(decayRatePerTick) ? Math.max(0, decayRatePerTick) : 0;
  const next = current.map((entry) => {
    const decayed = clampPressure(entry.pressure - decayRate);
    return {
      regionId: entry.regionId,
      pressure: decayed,
      lastUpdatedTick: decayed === entry.pressure ? entry.lastUpdatedTick : tick,
    };
  });
  return next.sort((a, b) => a.regionId.localeCompare(b.regionId));
}

export function getDetectionThresholdCrossings(
  fromPressure: number,
  toPressure: number,
): DetectionThresholdBand[] {
  if (toPressure <= fromPressure) return [];

  const crossed: DetectionThresholdBand[] = [];
  if (fromPressure < DETECTION_THRESHOLD_NOTICE && toPressure >= DETECTION_THRESHOLD_NOTICE) {
    crossed.push('notice');
  }
  if (fromPressure < DETECTION_THRESHOLD_TURN && toPressure >= DETECTION_THRESHOLD_TURN) {
    crossed.push('turn');
  }
  if (fromPressure < DETECTION_THRESHOLD_ENCOUNTER && toPressure >= DETECTION_THRESHOLD_ENCOUNTER) {
    crossed.push('encounter');
  }
  return crossed;
}
