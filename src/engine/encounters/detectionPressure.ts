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
