import type { ReachDomain } from './traits';

export type ForecastTier = 'doomed' | 'perilous' | 'uncertain' | 'favorable' | 'fated';

export type OutcomeType = 'critical_success' | 'success' | 'failure' | 'critical_failure';

export interface ResolutionInput {
  actorId: string;
  domain: ReachDomain;
  difficulty: number;          // 0.0–1.0
  sphereFactor: number;        // 0.0–0.2
  actionModifiers: number;     // capped at ±0.20
  influenceNudge?: number;     // ±0.05 to ±0.20 from player
}

export interface FateForecast {
  probability: number;         // 0.05–0.95
  forecastTier: ForecastTier;
  topContributors: Array<{ name: string; contribution: number }>;
}

export interface ResolutionResult {
  outcome: OutcomeType;
  roll: number;                // 1–100
  probability: number;         // what was needed
  margin: number;              // how close (roll - threshold)
  marginalFactor?: string;     // narrative attribution for close outcomes
  forecast: FateForecast;
}

/** For contested actions: two independent rolls */
export interface ContestedResolutionResult {
  attacker: ResolutionResult;
  defender: ResolutionResult;
  contestOutcome: 'attacker_wins' | 'defender_wins' | 'stalemate' | 'mutual_failure';
}
