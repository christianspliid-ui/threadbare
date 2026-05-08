import {
  FORECAST_TIER_DOOMED_MAX,
  FORECAST_TIER_PERILOUS_MAX,
  FORECAST_TIER_UNCERTAIN_MAX,
  FORECAST_TIER_FAVORABLE_MAX,
} from '../../data/encounter-experience-constants';
import type { ForecastTier } from '../../types/traces/encounter-traces';

const PROBABILITY_MIN = 0;
const PROBABILITY_MAX = 1;
const MIN_FACTOR_COUNT = 1;
const MAX_FACTOR_COUNT = 3;
const TWO_FACTOR_MIN_PROBABILITY = 0.34;
const THREE_FACTOR_MIN_PROBABILITY = 0.67;

export interface ForecastModifier {
  source: string;
  delta: number;
}

export interface ForecastBeatInput {
  forecastFactors: readonly string[] | undefined;
}

export interface ForecastComputationInput {
  baseProbability: number;
  modifiers: readonly ForecastModifier[];
}

export interface OutcomeForecast {
  baseProbability: number;
  finalProbability: number;
  finalTier: ForecastTier;
  factors: string[];
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return PROBABILITY_MIN;
  if (value < PROBABILITY_MIN) return PROBABILITY_MIN;
  if (value > PROBABILITY_MAX) return PROBABILITY_MAX;
  return value;
}

export function classifyForecastTier(probability: number): ForecastTier {
  const clamped = clampProbability(probability);
  if (clamped <= FORECAST_TIER_DOOMED_MAX) return 'doomed';
  if (clamped <= FORECAST_TIER_PERILOUS_MAX) return 'perilous';
  if (clamped <= FORECAST_TIER_UNCERTAIN_MAX) return 'uncertain';
  if (clamped <= FORECAST_TIER_FAVORABLE_MAX) return 'favorable';
  return 'fated';
}

function sanitizeFactorPool(rawFactors: readonly string[] | undefined): string[] {
  if (!rawFactors || rawFactors.length === 0) return [];
  const unique = new Set<string>();
  for (const factor of rawFactors) {
    if (typeof factor !== 'string') continue;
    const trimmed = factor.trim();
    if (!trimmed) continue;
    unique.add(trimmed);
  }
  return [...unique];
}

function resolveFactorCount(probability: number, poolSize: number): number {
  if (poolSize <= 0) return 0;
  if (probability >= THREE_FACTOR_MIN_PROBABILITY) return Math.min(MAX_FACTOR_COUNT, poolSize);
  if (probability >= TWO_FACTOR_MIN_PROBABILITY) return Math.min(2, poolSize);
  return Math.min(MIN_FACTOR_COUNT, poolSize);
}

export function computeForecast(
  beat: ForecastBeatInput,
  input: ForecastComputationInput,
): OutcomeForecast {
  const baseProbability = clampProbability(input.baseProbability);
  const modifierTotal = input.modifiers.reduce((sum, modifier) => sum + modifier.delta, 0);
  const finalProbability = clampProbability(baseProbability + modifierTotal);
  const finalTier = classifyForecastTier(finalProbability);

  const factorPool = sanitizeFactorPool(beat.forecastFactors);
  const factorCount = resolveFactorCount(finalProbability, factorPool.length);
  const factors = factorPool.slice(0, factorCount);

  return {
    baseProbability,
    finalProbability,
    finalTier,
    factors,
  };
}
