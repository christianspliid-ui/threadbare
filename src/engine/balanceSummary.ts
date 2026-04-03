/**
 * Balance Summary — reducers that collapse raw telemetry into machine-readable summaries.
 *
 * One-way transforms: telemetry data → summary structs.
 * Pure functions — no side effects, no runtime mutations.
 *
 * Phase 1: 2026-04-02-phase1-balance-eval-foundation-plan.md
 */

import type { SimulationRuntime } from './simulationRuntime';
import type { BalanceCounters } from './balanceTelemetry';
import type {
  BalanceRunSummary,
  BalanceAgentJourneySummary,
  BalanceCohortSummary,
  BalanceThreatBand,
  BalanceEvent,
} from '../types/balanceEval';
import { getTrackedAgentEvents } from './balanceTelemetry';

// ─── Run Summary ──────────────────────────────────────────────────

/**
 * Build a BalanceRunSummary from the runtime's current telemetry.
 * Call this at the end of a run (after the last tick).
 */
export function buildBalanceRunSummary(
  runtime: SimulationRuntime,
  endTick: number,
): BalanceRunSummary | null {
  const t = runtime.balanceTelemetry;
  if (!t) return null;

  const c = t.counters;
  const m = t.milestones;
  const startTick = t.meta.startTick ?? 0;

  // ── Step success rates per band ──
  const stepSuccessRates: BalanceRunSummary['stepSuccessRates'] = {};
  for (const [band, stats] of Object.entries(c.stepSuccessByBand)) {
    if (stats && stats.attempts > 0) {
      stepSuccessRates[band as BalanceThreatBand] = {
        attempts: stats.attempts,
        successes: stats.successes,
        rate: stats.successes / stats.attempts,
      };
    }
  }

  // ── Encounter completion rates per band ──
  const completionRates: BalanceRunSummary['completionRates'] = {};
  for (const [band, stats] of Object.entries(c.completionByBand)) {
    if (stats && stats.attempts > 0) {
      completionRates[band as BalanceThreatBand] = {
        attempts: stats.attempts,
        completions: stats.completions,
        rate: stats.completions / stats.attempts,
      };
    }
  }

  // ── Fail-forward share (proxy: completion rate across all bands) ──
  const totalEncounters = c.totalEncountersAttempted;
  const failForwardShare = totalEncounters > 0
    ? c.totalEncountersCompleted / totalEncounters
    : 0;

  // ── Crit failure share by band (computed from bounded recent events) ──
  // NOTE: approximate for long runs (bounded at BALANCE_RECENT_EVENTS_CAP events)
  const critFailShareByBand = computeCritFailShareByBand(t.recentEvents);

  // ── Quintessence summary ──
  const avgQlossPerEncounter = totalEncounters > 0
    ? Math.abs(c.quintessenceTotalNegativeDelta) / totalEncounters
    : 0;

  // ── Reward breakdown ──
  const durableCount = c.rewardsByCategory['possession'] ?? 0;
  const consumableCount = c.rewardsByCategory['consumable'] ?? 0;

  return {
    seed: t.meta.seed,
    startTick,
    endTick,
    totalTicks: endTick - startTick,
    targetVersion: t.meta.targetVersion ?? 'unknown',
    mapSize: t.meta.mapSize,

    totals: {
      actionsAttempted: c.totalActionsAttempted,
      stepsAttempted: c.totalStepsAttempted,
      encountersAttempted: c.totalEncountersAttempted,
      encountersCompleted: c.totalEncountersCompleted,
      encountersAbandoned: c.totalEncountersAbandoned,
      rewardsGranted: c.totalRewardsGranted,
      rewardsMissed: c.totalRewardsMissed,
      growthBeatsApplied: c.totalGrowthBeats,
      dissolutions: c.totalDissolutions,
    },

    stepSuccessRates,
    completionRates,
    failForwardShare,
    critFailShareByBand,

    quintessence: {
      totalDeltaFromEvents: c.quintessenceTotalNegativeDelta + c.quintessenceTotalPositiveDelta,
      totalNegativeDelta: c.quintessenceTotalNegativeDelta,
      totalPositiveDelta: c.quintessenceTotalPositiveDelta,
      eventCount: c.quintessenceEventCount,
      averageLossPerEncounter: avgQlossPerEncounter,
      dissolutions: c.totalDissolutions,
      // Phase 2: threshold transition counts from recent events
      ...computeQuintessenceThresholdSummary(t.recentEvents),
      // Phase 2: per-band quintessence loss from encounter failures
      lossPerEncounterByBand: computeQuintessenceLossByBand(c),
    },

    rewards: {
      byCategory: { ...c.rewardsByCategory },
      durable: durableCount,
      consumable: consumableCount,
      badOutcomes: c.totalBadOutcomes,
    },

    pacing: {
      firstRewardTick: m.firstRewardTick,
      firstSetbackTick: m.firstSetbackTick,
      firstGrowthBeatTick: m.firstGrowthBeatTick,
    },

    // Phase 3: outcome distribution
    outcomeDistribution: { ...c.outcomeDistribution },
    actionOutcomeDistribution: { ...c.actionOutcomeDistribution },

    // Phase 3: push/resist usage
    pushResist: {
      pushCount: c.pushCount,
      pushTotalQuintessenceSpent: c.pushTotalQuintessenceSpent,
      resistCount: c.resistCount,
      resistSuccessCount: c.resistSuccessCount,
      resistSuccessRate: c.resistCount > 0 ? c.resistSuccessCount / c.resistCount : 0,
      resistTotalQuintessenceSpent: c.resistTotalQuintessenceSpent,
    },

    // Phase 4: forecast drift
    forecastDrift: computeForecastDriftSummary(c, t.recentEvents),
  };
}

function computeCritFailShareByBand(
  events: BalanceEvent[],
): Partial<Record<BalanceThreatBand, number>> {
  const byBand = new Map<BalanceThreatBand, { attempts: number; crits: number }>();
  for (const e of events) {
    if (e.kind !== 'step_resolved') continue;
    const band = (e.threatBand ?? 'unknown') as BalanceThreatBand;
    const stats = byBand.get(band) ?? { attempts: 0, crits: 0 };
    stats.attempts++;
    if (e.result === 'critical_failure') stats.crits++;
    byBand.set(band, stats);
  }
  const result: Partial<Record<BalanceThreatBand, number>> = {};
  for (const [band, stats] of byBand) {
    if (stats.attempts > 0) {
      result[band] = stats.crits / stats.attempts;
    }
  }
  return result;
}

/**
 * Phase 2: Compute per-band average quintessence loss per encounter failure.
 * Returns null for bands with no data.
 */
function computeQuintessenceLossByBand(
  counters: BalanceCounters,
): Partial<Record<BalanceThreatBand, number>> {
  const result: Partial<Record<BalanceThreatBand, number>> = {};
  for (const [band, stats] of Object.entries(counters.quintessenceLossByBand)) {
    if (stats && stats.encounterCount > 0) {
      result[band as BalanceThreatBand] = stats.totalLoss / stats.encounterCount;
    }
  }
  return result;
}

/**
 * Phase 2: Count threshold transitions from recent events.
 * Returns a record of transition types to counts, e.g. { threshold_healthy_to_strained: 3 }.
 */
function computeQuintessenceThresholdSummary(
  events: BalanceEvent[],
): { thresholdTransitions: Record<string, number> } {
  const transitions: Record<string, number> = {};
  for (const e of events) {
    if (e.kind !== 'state_transition') continue;
    if (!e.transitionType?.startsWith('threshold_')) continue;
    transitions[e.transitionType] = (transitions[e.transitionType] ?? 0) + 1;
  }
  return { thresholdTransitions: transitions };
}

// ─── Agent Journey Summary ────────────────────────────────────────

/**
 * Build a BalanceAgentJourneySummary from the tracked agent's event buffer.
 * Returns null if the agent is not tracked or has no events.
 */
export function buildBalanceAgentJourneySummary(
  runtime: SimulationRuntime,
  agentId: string,
  agentName?: string,
): BalanceAgentJourneySummary | null {
  const events = getTrackedAgentEvents(runtime, agentId);
  if (events.length === 0) return null;

  let firstSeenTick: number | null = null;
  let firstEncounterTick: number | null = null;
  let firstRewardTick: number | null = null;
  let firstMajorSetbackTick: number | null = null;
  let firstGrowthBeatTick: number | null = null;

  let totalActions = 0;
  let totalEncounters = 0;
  let totalRewards = 0;
  let totalSetbacks = 0;
  let stepAttempts = 0;
  let stepSuccesses = 0;
  let encounterAttempts = 0;
  let encounterCompletions = 0;

  // Streak tracking
  let currentFailStreak = 0;
  let longestSetbackStreak = 0;

  for (const e of events) {
    if (firstSeenTick === null || e.tick < firstSeenTick) firstSeenTick = e.tick;

    switch (e.kind) {
      case 'step_resolved': {
        stepAttempts++;
        const isSuccess = e.result === 'success' || e.result === 'critical_success';
        if (isSuccess) {
          stepSuccesses++;
          currentFailStreak = 0;
        } else {
          currentFailStreak++;
          if (currentFailStreak > longestSetbackStreak) {
            longestSetbackStreak = currentFailStreak;
          }
        }
        if (firstEncounterTick === null) firstEncounterTick = e.tick;
        break;
      }
      case 'action_resolved':
        totalActions++;
        break;
      case 'encounter_resolved':
        encounterAttempts++;
        if (e.finalStatus === 'completed') encounterCompletions++;
        if (firstEncounterTick === null) firstEncounterTick = e.tick;
        break;
      case 'reward_granted':
        if (e.rewardTemplateId) {
          totalRewards++;
          if (firstRewardTick === null) firstRewardTick = e.tick;
        }
        break;
      case 'growth_applied':
        if (firstGrowthBeatTick === null) firstGrowthBeatTick = e.tick;
        break;
      case 'state_transition':
        if (e.transitionType === 'dissolved' || e.transitionType === 'broken') {
          totalSetbacks++;
          if (firstMajorSetbackTick === null) firstMajorSetbackTick = e.tick;
        }
        break;
      case 'quintessence_changed':
        if ((e.quintessenceDelta ?? 0) < -0.05) {
          totalSetbacks++;
          if (firstMajorSetbackTick === null) firstMajorSetbackTick = e.tick;
        }
        break;
    }
  }

  return {
    agentId,
    agentName,
    firstSeenTick,
    firstEncounterTick,
    firstRewardTick,
    firstMajorSetbackTick,
    firstGrowthBeatTick,
    totalActions,
    totalEncounters: encounterAttempts,
    totalRewards,
    totalSetbacks,
    longestSetbackStreak,
    durableAttachments: 0, // Phase 2: will track via attachment_changed events
    stepSuccessRate: stepAttempts > 0 ? stepSuccesses / stepAttempts : 0,
    encounterCompletionRate: encounterAttempts > 0 ? encounterCompletions / encounterAttempts : 0,
  };
}

// ─── Cohort Summary ───────────────────────────────────────────────

/**
 * Aggregate multiple run summaries into a cohort summary.
 * Rates are averaged; counts are summed.
 */
export function buildBalanceCohortSummary(
  perRunSummaries: BalanceRunSummary[],
): BalanceCohortSummary {
  if (perRunSummaries.length === 0) {
    return {
      runCount: 0,
      seeds: [],
      aggregated: makeEmptyRunSummary(),
      perRunSummaries: [],
    };
  }

  const seeds = perRunSummaries.map(s => s.seed ?? 0);
  const aggregated = aggregateRunSummaries(perRunSummaries);

  return {
    runCount: perRunSummaries.length,
    seeds,
    aggregated,
    perRunSummaries,
  };
}

function makeEmptyRunSummary(): BalanceRunSummary {
  return {
    startTick: 0,
    endTick: 0,
    totalTicks: 0,
    targetVersion: 'unknown',
    totals: {
      actionsAttempted: 0,
      stepsAttempted: 0,
      encountersAttempted: 0,
      encountersCompleted: 0,
      encountersAbandoned: 0,
      rewardsGranted: 0,
      rewardsMissed: 0,
      growthBeatsApplied: 0,
      dissolutions: 0,
    },
    stepSuccessRates: {},
    completionRates: {},
    failForwardShare: 0,
    critFailShareByBand: {},
    quintessence: { totalDeltaFromEvents: 0, averageLossPerEncounter: 0, dissolutions: 0 },
    rewards: { byCategory: {}, durable: 0, consumable: 0, badOutcomes: 0 },
    pacing: { firstRewardTick: null, firstSetbackTick: null, firstGrowthBeatTick: null },
  };
}

function aggregateRunSummaries(summaries: BalanceRunSummary[]): BalanceRunSummary {
  const n = summaries.length;

  // Sum totals
  const totals: BalanceRunSummary['totals'] = {
    actionsAttempted: 0,
    stepsAttempted: 0,
    encountersAttempted: 0,
    encountersCompleted: 0,
    encountersAbandoned: 0,
    rewardsGranted: 0,
    rewardsMissed: 0,
    growthBeatsApplied: 0,
    dissolutions: 0,
  };
  for (const s of summaries) {
    for (const k of Object.keys(totals) as Array<keyof typeof totals>) {
      totals[k] += s.totals[k];
    }
  }

  // Aggregate step success rates per band
  const stepSuccessRates = aggregateBandRates(
    summaries.map(s => s.stepSuccessRates),
  );

  // Aggregate completion rates per band
  const completionRates = aggregateBandRates(
    summaries.map(s => s.completionRates),
  );

  // Average failForwardShare
  const failForwardShare = summaries.reduce((sum, s) => sum + s.failForwardShare, 0) / n;

  // Average crit fail share per band
  const critFailShareByBand = averageBandValues(
    summaries.map(s => s.critFailShareByBand),
  );

  // Aggregate quintessence
  const quintessence = {
    totalDeltaFromEvents: summaries.reduce((sum, s) => sum + s.quintessence.totalDeltaFromEvents, 0),
    averageLossPerEncounter: summaries.reduce((sum, s) => sum + s.quintessence.averageLossPerEncounter, 0) / n,
    dissolutions: summaries.reduce((sum, s) => sum + s.quintessence.dissolutions, 0),
  };

  // Aggregate rewards
  const byCategory: Record<string, number> = {};
  for (const s of summaries) {
    for (const [cat, count] of Object.entries(s.rewards.byCategory)) {
      byCategory[cat] = (byCategory[cat] ?? 0) + count;
    }
  }
  const rewards = {
    byCategory,
    durable: summaries.reduce((sum, s) => sum + s.rewards.durable, 0),
    consumable: summaries.reduce((sum, s) => sum + s.rewards.consumable, 0),
    badOutcomes: summaries.reduce((sum, s) => sum + s.rewards.badOutcomes, 0),
  };

  // Pacing: average of non-null values
  const firstRewardTicks = summaries.map(s => s.pacing.firstRewardTick).filter(t => t !== null) as number[];
  const firstSetbackTicks = summaries.map(s => s.pacing.firstSetbackTick).filter(t => t !== null) as number[];
  const firstGrowthTicks = summaries.map(s => s.pacing.firstGrowthBeatTick).filter(t => t !== null) as number[];

  return {
    startTick: Math.min(...summaries.map(s => s.startTick)),
    endTick: Math.max(...summaries.map(s => s.endTick)),
    totalTicks: summaries.reduce((sum, s) => sum + s.totalTicks, 0) / n,
    targetVersion: summaries[0].targetVersion,
    totals,
    stepSuccessRates,
    completionRates,
    failForwardShare,
    critFailShareByBand,
    quintessence,
    rewards,
    pacing: {
      firstRewardTick: firstRewardTicks.length > 0
        ? Math.round(firstRewardTicks.reduce((a, b) => a + b, 0) / firstRewardTicks.length)
        : null,
      firstSetbackTick: firstSetbackTicks.length > 0
        ? Math.round(firstSetbackTicks.reduce((a, b) => a + b, 0) / firstSetbackTicks.length)
        : null,
      firstGrowthBeatTick: firstGrowthTicks.length > 0
        ? Math.round(firstGrowthTicks.reduce((a, b) => a + b, 0) / firstGrowthTicks.length)
        : null,
    },
  };
}

type BandRateMap = Partial<Record<BalanceThreatBand, { attempts: number; [key: string]: number }>>;

/** Aggregate per-band rate maps: sum attempts+successes/completions, recompute rate. */
function aggregateBandRates(
  maps: Array<Partial<Record<BalanceThreatBand, { attempts: number; successes?: number; completions?: number; rate: number }>>>,
): BalanceRunSummary['stepSuccessRates'] {
  const combined = new Map<BalanceThreatBand, { attempts: number; successes: number }>();
  for (const map of maps) {
    for (const [band, stats] of Object.entries(map)) {
      if (!stats) continue;
      const b = band as BalanceThreatBand;
      const existing = combined.get(b) ?? { attempts: 0, successes: 0 };
      existing.attempts += stats.attempts;
      existing.successes += (stats.successes ?? stats.completions ?? 0);
      combined.set(b, existing);
    }
  }
  const result: BalanceRunSummary['stepSuccessRates'] = {};
  for (const [band, stats] of combined) {
    result[band] = {
      attempts: stats.attempts,
      successes: stats.successes,
      rate: stats.attempts > 0 ? stats.successes / stats.attempts : 0,
    };
  }
  return result;
}

// ─── Phase 4: Forecast Drift Summary ─────────────────────────────

/**
 * Compute forecast drift metrics from counters and recent events.
 * Compares planner predictions (forecast_recorded events) with actual outcomes.
 */
function computeForecastDriftSummary(
  counters: BalanceCounters,
  events: BalanceEvent[],
): BalanceRunSummary['forecastDrift'] {
  if (counters.forecastCount === 0) return undefined;

  const avgForecastedCompletionProb = counters.forecastedCompletionProbSum / counters.forecastCount;
  const avgForecastedUtility = counters.forecastedUtilitySum / counters.forecastCount;

  // Compute actual completion rate from encounter_resolved events
  let encounterAttempts = 0;
  let encounterCompletions = 0;
  for (const e of events) {
    if (e.kind !== 'encounter_resolved') continue;
    encounterAttempts++;
    if (e.finalStatus === 'completed') encounterCompletions++;
  }
  const avgActualCompletionRate = encounterAttempts > 0
    ? encounterCompletions / encounterAttempts
    : 0;

  // Mean absolute error: |forecasted - actual| for completion probability
  const completionDriftMAE = Math.abs(avgForecastedCompletionProb - avgActualCompletionRate);

  return {
    forecastCount: counters.forecastCount,
    avgForecastedCompletionProb,
    avgActualCompletionRate,
    completionDriftMAE,
    avgForecastedUtility,
    pushRecommendedCount: counters.forecastPushRecommendedCount,
    resistValuableCount: counters.forecastResistValuableCount,
  };
}

/** Average a partial band → number map across multiple runs. */
function averageBandValues(
  maps: Array<Partial<Record<BalanceThreatBand, number>>>,
): Partial<Record<BalanceThreatBand, number>> {
  const sums = new Map<BalanceThreatBand, { total: number; count: number }>();
  for (const map of maps) {
    for (const [band, val] of Object.entries(map)) {
      if (val === undefined) continue;
      const b = band as BalanceThreatBand;
      const existing = sums.get(b) ?? { total: 0, count: 0 };
      existing.total += val;
      existing.count++;
      sums.set(b, existing);
    }
  }
  const result: Partial<Record<BalanceThreatBand, number>> = {};
  for (const [band, s] of sums) {
    result[band] = s.count > 0 ? s.total / s.count : 0;
  }
  return result;
}
