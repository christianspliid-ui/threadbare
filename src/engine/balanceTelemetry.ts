/**
 * Balance Telemetry — session-owned structured event recording.
 *
 * Owned by SimulationRuntime (not module-global) to prevent cross-session bleed.
 * Separate from traceBuffer (debug-shaped, noisy, session-transient).
 *
 * Storage strategy:
 * - Aggregate counters for the full run (unbounded)
 * - Bounded recent event buffer for diagnostics (BALANCE_RECENT_EVENTS_CAP)
 * - Per-tracked-agent journey buffer for hero analysis (BALANCE_AGENT_EVENTS_CAP per agent)
 *
 * Fail-soft: all public functions catch errors and never crash the caller.
 *
 * Phase 1: 2026-04-02-phase1-balance-eval-foundation-plan.md
 */

// NOTE: import type only to avoid circular module dependency.
// simulationRuntime.ts imports createBalanceTelemetry as a value from this file.
import type { SimulationRuntime } from './simulationRuntime';
import type { BalanceEvent, BalanceEventKind, BalanceThreatBand } from '../types/balanceEval';

// ─── Constants ────────────────────────────────────────────────────

/** Max recent events kept for diagnostics / CLI display. */
export const BALANCE_RECENT_EVENTS_CAP = 500;
/** Max events kept per tracked agent's journey buffer. */
export const BALANCE_AGENT_EVENTS_CAP = 2000;
/** Max number of tracked agents (journey buffer). */
export const BALANCE_MAX_TRACKED_AGENTS = 5;

// ─── Aggregate Counters ───────────────────────────────────────────

export interface BalanceCounters {
  totalStepsAttempted: number;
  totalStepsSucceeded: number;
  totalActionsAttempted: number;
  totalActionsCompleted: number;
  totalEncountersAttempted: number;
  totalEncountersCompleted: number;
  totalEncountersAbandoned: number;
  totalRewardsGranted: number;
  totalRewardsMissed: number;
  totalBadOutcomes: number;
  totalGrowthBeats: number;
  totalDissolutions: number;
  stepSuccessByBand: Partial<Record<BalanceThreatBand, { attempts: number; successes: number }>>;
  completionByBand: Partial<Record<BalanceThreatBand, { attempts: number; completions: number }>>;
  rewardsByCategory: Record<string, number>;
  quintessenceTotalNegativeDelta: number;
  quintessenceTotalPositiveDelta: number;
  quintessenceEventCount: number;
  /** Phase 2: per-band quintessence loss from encounter failures */
  quintessenceLossByBand: Partial<Record<BalanceThreatBand, { totalLoss: number; encounterCount: number }>>;
}

// ─── Milestones ───────────────────────────────────────────────────

export interface BalanceMilestones {
  firstRewardTick: number | null;
  firstSetbackTick: number | null;
  firstGrowthBeatTick: number | null;
  firstEncounterTick: number | null;
}

// ─── Telemetry Object ─────────────────────────────────────────────

export interface BalanceTelemetry {
  meta: {
    seed?: number;
    startTick: number;
    mapSize?: string;
    targetVersion: string;
    createdAt: number;
  };
  counters: BalanceCounters;
  /** Bounded recent event buffer for diagnostics */
  recentEvents: BalanceEvent[];
  /** Monotonic sequence counter for ordering events */
  recentEventSeq: number;
  /** IDs of agents whose full journeys are tracked */
  trackedAgentIds: string[];
  /** Per-agent bounded journey event buffers */
  trackedAgentEvents: Map<string, BalanceEvent[]>;
  /** Run-level first-seen milestones */
  milestones: BalanceMilestones;
}

// ─── Factory ──────────────────────────────────────────────────────

export function createBalanceTelemetry(opts?: {
  seed?: number;
  startTick?: number;
  mapSize?: string;
  targetVersion?: string;
}): BalanceTelemetry {
  return {
    meta: {
      seed: opts?.seed,
      startTick: opts?.startTick ?? 0,
      mapSize: opts?.mapSize,
      targetVersion: opts?.targetVersion ?? 'unknown',
      createdAt: Date.now(),
    },
    counters: createEmptyCounters(),
    recentEvents: [],
    recentEventSeq: 0,
    trackedAgentIds: [],
    trackedAgentEvents: new Map(),
    milestones: {
      firstRewardTick: null,
      firstSetbackTick: null,
      firstGrowthBeatTick: null,
      firstEncounterTick: null,
    },
  };
}

function createEmptyCounters(): BalanceCounters {
  return {
    totalStepsAttempted: 0,
    totalStepsSucceeded: 0,
    totalActionsAttempted: 0,
    totalActionsCompleted: 0,
    totalEncountersAttempted: 0,
    totalEncountersCompleted: 0,
    totalEncountersAbandoned: 0,
    totalRewardsGranted: 0,
    totalRewardsMissed: 0,
    totalBadOutcomes: 0,
    totalGrowthBeats: 0,
    totalDissolutions: 0,
    stepSuccessByBand: {},
    completionByBand: {},
    rewardsByCategory: {},
    quintessenceTotalNegativeDelta: 0,
    quintessenceTotalPositiveDelta: 0,
    quintessenceEventCount: 0,
    quintessenceLossByBand: {},
  };
}

// ─── Record ───────────────────────────────────────────────────────

/**
 * Record a balance event into the runtime's telemetry.
 * Fail-soft: if telemetry is missing or an error occurs, does nothing.
 * Never throws.
 */
export function recordBalanceEvent(
  runtime: SimulationRuntime,
  partialEvent: Omit<BalanceEvent, 'seq'>,
): void {
  try {
    if (!runtime.balanceTelemetry) return;
    const telemetry = runtime.balanceTelemetry;
    const event: BalanceEvent = { ...partialEvent, seq: telemetry.recentEventSeq++ };
    runtime.balanceTelemetryVersion++;

    updateCounters(telemetry.counters, event);
    updateMilestones(telemetry.milestones, event);

    // Append to bounded recent events buffer
    telemetry.recentEvents.push(event);
    if (telemetry.recentEvents.length > BALANCE_RECENT_EVENTS_CAP) {
      telemetry.recentEvents.shift();
    }

    // Append to tracked-agent journey buffer
    if (event.agentId && telemetry.trackedAgentIds.includes(event.agentId)) {
      let agentEvents = telemetry.trackedAgentEvents.get(event.agentId);
      if (!agentEvents) {
        agentEvents = [];
        telemetry.trackedAgentEvents.set(event.agentId, agentEvents);
      }
      agentEvents.push(event);
      if (agentEvents.length > BALANCE_AGENT_EVENTS_CAP) {
        agentEvents.shift();
      }
    }
  } catch {
    // Fail-soft: never crash the tick loop
  }
}

function updateCounters(counters: BalanceCounters, event: BalanceEvent): void {
  switch (event.kind) {
    case 'step_resolved': {
      counters.totalStepsAttempted++;
      const isSuccess = event.result === 'success' || event.result === 'critical_success';
      if (isSuccess) counters.totalStepsSucceeded++;
      const band = event.threatBand ?? 'unknown';
      const bandStats = counters.stepSuccessByBand[band] ?? { attempts: 0, successes: 0 };
      bandStats.attempts++;
      if (isSuccess) bandStats.successes++;
      counters.stepSuccessByBand[band] = bandStats;
      break;
    }
    case 'action_resolved':
      counters.totalActionsAttempted++;
      if (event.finalStatus === 'completed' || event.result === 'success') {
        counters.totalActionsCompleted++;
      }
      break;
    case 'encounter_resolved': {
      counters.totalEncountersAttempted++;
      const band = event.threatBand ?? 'unknown';
      const bandStats = counters.completionByBand[band] ?? { attempts: 0, completions: 0 };
      bandStats.attempts++;
      if (event.finalStatus === 'completed') {
        counters.totalEncountersCompleted++;
        bandStats.completions++;
      } else if (event.finalStatus === 'abandoned') {
        counters.totalEncountersAbandoned++;
      }
      counters.completionByBand[band] = bandStats;
      break;
    }
    case 'quintessence_changed':
      if (event.quintessenceDelta !== undefined) {
        counters.quintessenceEventCount++;
        if (event.quintessenceDelta < 0) {
          counters.quintessenceTotalNegativeDelta += event.quintessenceDelta;
        } else {
          counters.quintessenceTotalPositiveDelta += event.quintessenceDelta;
        }
        // Phase 2: Track per-band quintessence loss for scoped evaluation
        if (event.quintessenceReason === 'encounter_failure_by_band' && event.threatBand && event.quintessenceDelta < 0) {
          const band = event.threatBand;
          const bandStats = counters.quintessenceLossByBand[band] ?? { totalLoss: 0, encounterCount: 0 };
          bandStats.totalLoss += Math.abs(event.quintessenceDelta);
          bandStats.encounterCount++;
          counters.quintessenceLossByBand[band] = bandStats;
        }
      }
      break;
    case 'reward_granted':
      if (event.rewardTemplateId) {
        counters.totalRewardsGranted++;
        if (event.rewardCategory) {
          counters.rewardsByCategory[event.rewardCategory] =
            (counters.rewardsByCategory[event.rewardCategory] ?? 0) + 1;
        }
        if (event.isBadOutcome) counters.totalBadOutcomes++;
      } else {
        counters.totalRewardsMissed++;
      }
      break;
    case 'growth_applied':
      counters.totalGrowthBeats++;
      break;
    case 'state_transition':
      if (event.transitionType === 'dissolved') {
        counters.totalDissolutions++;
      }
      break;
    case 'attachment_changed':
      // No counter yet; captured in event stream for future summary use
      break;
  }
}

function updateMilestones(milestones: BalanceMilestones, event: BalanceEvent): void {
  if (
    (event.kind === 'encounter_resolved' || event.kind === 'step_resolved') &&
    milestones.firstEncounterTick === null
  ) {
    milestones.firstEncounterTick = event.tick;
  }
  if (
    event.kind === 'reward_granted' &&
    event.rewardTemplateId &&
    milestones.firstRewardTick === null
  ) {
    milestones.firstRewardTick = event.tick;
  }
  if (
    event.kind === 'state_transition' &&
    (event.transitionType === 'dissolved' || event.transitionType === 'broken') &&
    milestones.firstSetbackTick === null
  ) {
    milestones.firstSetbackTick = event.tick;
  }
  // Large quintessence drops also count as first setback
  if (
    event.kind === 'quintessence_changed' &&
    (event.quintessenceDelta ?? 0) < -0.05 &&
    milestones.firstSetbackTick === null
  ) {
    milestones.firstSetbackTick = event.tick;
  }
  if (event.kind === 'growth_applied' && milestones.firstGrowthBeatTick === null) {
    milestones.firstGrowthBeatTick = event.tick;
  }
}

// ─── Query ────────────────────────────────────────────────────────

export function getBalanceEvents(
  runtime: SimulationRuntime,
  opts?: { agentId?: string; kind?: BalanceEventKind; limit?: number },
): BalanceEvent[] {
  if (!runtime.balanceTelemetry) return [];
  let events: BalanceEvent[] = [...runtime.balanceTelemetry.recentEvents];
  if (opts?.agentId) events = events.filter(e => e.agentId === opts.agentId);
  if (opts?.kind) events = events.filter(e => e.kind === opts.kind);
  if (opts?.limit && opts.limit > 0) events = events.slice(-opts.limit);
  return events;
}

export function getTrackedAgentIds(runtime: SimulationRuntime): string[] {
  return runtime.balanceTelemetry?.trackedAgentIds ?? [];
}

export function setTrackedAgents(runtime: SimulationRuntime, ids: string[]): void {
  if (!runtime.balanceTelemetry) return;
  runtime.balanceTelemetry.trackedAgentIds = ids.slice(0, BALANCE_MAX_TRACKED_AGENTS);
  // Initialize event arrays for newly tracked agents
  for (const id of runtime.balanceTelemetry.trackedAgentIds) {
    if (!runtime.balanceTelemetry.trackedAgentEvents.has(id)) {
      runtime.balanceTelemetry.trackedAgentEvents.set(id, []);
    }
  }
}

export function getTrackedAgentEvents(runtime: SimulationRuntime, agentId: string): BalanceEvent[] {
  return [...(runtime.balanceTelemetry?.trackedAgentEvents.get(agentId) ?? [])];
}

export function clearBalanceTelemetry(runtime: SimulationRuntime): void {
  if (!runtime.balanceTelemetry) return;
  const { seed, mapSize, targetVersion } = runtime.balanceTelemetry.meta;
  const trackedIds = [...runtime.balanceTelemetry.trackedAgentIds];
  runtime.balanceTelemetry = createBalanceTelemetry({ seed, mapSize, targetVersion });
  setTrackedAgents(runtime, trackedIds);
  runtime.balanceTelemetryVersion++;
}

/**
 * Select the default tracked hero: first individual actor by stable sorted ID.
 * Used when no explicit agent is specified for a run.
 */
export function selectDefaultTrackedHero(actorIds: string[]): string | null {
  if (actorIds.length === 0) return null;
  return [...actorIds].sort()[0];
}

// ─── Export ───────────────────────────────────────────────────────

/**
 * Export telemetry as a JSON-serializable snapshot.
 * Returns null if telemetry is not initialized.
 * Avoids circular refs and large state blobs.
 */
export function exportBalanceTelemetry(runtime: SimulationRuntime): Record<string, unknown> | null {
  if (!runtime.balanceTelemetry) return null;
  const t = runtime.balanceTelemetry;
  return {
    meta: { ...t.meta },
    counters: JSON.parse(JSON.stringify(t.counters)),
    recentEventCount: t.recentEvents.length,
    recentEvents: t.recentEvents.slice(-100), // last 100 for diagnostics
    trackedAgentIds: [...t.trackedAgentIds],
    trackedAgentEventCounts: Object.fromEntries(
      t.trackedAgentIds.map(id => [id, t.trackedAgentEvents.get(id)?.length ?? 0]),
    ),
    milestones: { ...t.milestones },
    version: runtime.balanceTelemetryVersion,
  };
}
