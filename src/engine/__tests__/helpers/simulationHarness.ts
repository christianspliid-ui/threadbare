// src/engine/__tests__/helpers/simulationHarness.ts

import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import type { MapSizePreset } from '../../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime } from '../../simulationRuntime';
import type { GameState } from '../../../types/gameState';
import type { TickEvent } from '../../../types/gameState';

// ─── Types ───────────────────────────────────────────────────────

export interface SimulationOpts {
  seed: number;
  ticks: number;
  map: MapSizePreset;
}

export interface SimulationMetrics {
  // Encounter activity
  encounterStarts: number;
  encounterCompletions: number;
  encounterAbandons: number;
  uniqueEncounterTypes: Set<string>;
  templateRepetitions: Map<string, Map<string, number>>; // agentId → templateId → count

  // Resolution
  totalResolutions: number;
  successCount: number;
  failureCount: number;
  critSuccessCount: number;
  critFailureCount: number;

  // Movement
  movementEvents: number;
  distinctHexesPerAgent: Map<string, Set<string>>; // agentId → set of "col,row"

  // Agent behavior
  idleTicksPerAgent: Map<string, number>;
  maxConsecutiveIdlePerAgent: Map<string, number>;

  // Growth
  initialRawScores: Map<string, number>; // agentId → raw score at start
  finalRawScores: Map<string, number>;   // agentId → raw score at end

  // Role affinity
  encounterStartsWithRoleMatch: number; // starts where reach matches agent role primary
  encounterStartsWithRole: number;      // starts where agent has a role at all

  // Traces
  decisionTraceCount: number;

  // Convenience
  agentCount: number;
  totalAgentTicks: number;
  ticksRun: number;

  // Final state (for deep inspection)
  finalState: GameState;
}

// ─── Helpers ─────────────────────────────────────────────────────

function countEvents(events: TickEvent[], type: string): number {
  return events.filter(e => e.type === type).length;
}

// ─── Main Harness ────────────────────────────────────────────────

export function runSimulation(opts: SimulationOpts): SimulationMetrics {
  resetDecisionCache();
  resetEventCounter();

  const archetypes = generateArchetypes(4, opts.seed);
  const archetype = archetypes[0];
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[opts.map];
  const runtime = createSimulationRuntime();

  const { state: initialState } = initializeGameState(
    archetype,
    'Test-Runner',
    cosmology,
    opts.seed,
    preset.cols,
    preset.rows,
  );

  let state = initialState;

  // Snapshot initial agent data
  const agents = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');
  const agentIds = agents.map(n => n.id);

  const metrics: SimulationMetrics = {
    encounterStarts: 0,
    encounterCompletions: 0,
    encounterAbandons: 0,
    uniqueEncounterTypes: new Set(),
    templateRepetitions: new Map(),
    totalResolutions: 0,
    successCount: 0,
    failureCount: 0,
    critSuccessCount: 0,
    critFailureCount: 0,
    movementEvents: 0,
    distinctHexesPerAgent: new Map(),
    idleTicksPerAgent: new Map(),
    maxConsecutiveIdlePerAgent: new Map(),
    initialRawScores: new Map(),
    finalRawScores: new Map(),
    encounterStartsWithRoleMatch: 0,
    encounterStartsWithRole: 0,
    decisionTraceCount: 0,
    agentCount: agentIds.length,
    totalAgentTicks: 0,
    ticksRun: opts.ticks,
    finalState: state,
  };

  // Initialize per-agent maps
  const consecutiveIdle = new Map<string, number>();
  for (const id of agentIds) {
    metrics.idleTicksPerAgent.set(id, 0);
    metrics.maxConsecutiveIdlePerAgent.set(id, 0);
    metrics.distinctHexesPerAgent.set(id, new Set());
    metrics.templateRepetitions.set(id, new Map());
    consecutiveIdle.set(id, 0);
  }

  // Run ticks and collect metrics
  for (let t = 0; t < opts.ticks; t++) {
    state = runTick(state, [], runtime);
    const events = state.tickEvents;

    // Encounter starts (agent_encounter = encounter initiated)
    for (const e of events.filter(ev => ev.type === 'agent_encounter')) {
      metrics.encounterStarts++;
      if (e.actorId && e.encounterId) {
        const agentReps = metrics.templateRepetitions.get(e.actorId);
        if (agentReps) {
          agentReps.set(e.encounterId, (agentReps.get(e.encounterId) ?? 0) + 1);
        }
      }
    }

    // Encounter completions and abandons
    metrics.encounterCompletions += countEvents(events, 'encounter_completed');

    // Track abandons from encounterProgress status changes
    for (const ep of state.encounterProgress) {
      if (ep.status === 'abandoned') {
        // Count each abandon once (by checking if it was abandoned this tick)
        const lastHistory = ep.history[ep.history.length - 1];
        if (lastHistory && lastHistory.tick === state.tick) {
          metrics.encounterAbandons++;
        }
      }
    }

    // Step resolutions
    const stepSuccesses = events.filter(e => e.type === 'encounter_step_success');
    const stepFailures = events.filter(e => e.type === 'encounter_step_failure');
    metrics.successCount += stepSuccesses.length;
    metrics.failureCount += stepFailures.length;
    metrics.totalResolutions += stepSuccesses.length + stepFailures.length;

    // Crits — check message text for "critical" as the event type doesn't distinguish
    for (const e of stepSuccesses) {
      if (e.message?.toLowerCase().includes('critical')) metrics.critSuccessCount++;
    }
    for (const e of stepFailures) {
      if (e.message?.toLowerCase().includes('critical')) metrics.critFailureCount++;
    }

    // Movement
    const moveEvents = events.filter(e => e.type === 'agent_movement');
    metrics.movementEvents += moveEvents.length;
    for (const e of moveEvents) {
      if (e.actorId && e.hexCoords) {
        const hexSet = metrics.distinctHexesPerAgent.get(e.actorId);
        if (hexSet) hexSet.add(`${e.hexCoords.col},${e.hexCoords.row}`);
      }
    }

    // Encounter types
    for (const ep of state.encounterProgress) {
      if (ep.status === 'active') {
        metrics.uniqueEncounterTypes.add(ep.encounterId.split('.')[0] ?? ep.encounterId);
      }
    }

    // Idle detection: agents not in encounter and not moving this tick
    const busyAgents = new Set<string>();
    for (const ep of state.encounterProgress) {
      if (ep.status === 'active') busyAgents.add(ep.actorId);
    }
    for (const e of moveEvents) {
      if (e.actorId) busyAgents.add(e.actorId);
    }
    for (const e of events.filter(ev => ev.type === 'agent_encounter')) {
      if (e.actorId) busyAgents.add(e.actorId);
    }

    for (const id of agentIds) {
      if (!busyAgents.has(id)) {
        metrics.idleTicksPerAgent.set(id, (metrics.idleTicksPerAgent.get(id) ?? 0) + 1);
        const consec = (consecutiveIdle.get(id) ?? 0) + 1;
        consecutiveIdle.set(id, consec);
        const maxConsec = metrics.maxConsecutiveIdlePerAgent.get(id) ?? 0;
        if (consec > maxConsec) metrics.maxConsecutiveIdlePerAgent.set(id, consec);
      } else {
        consecutiveIdle.set(id, 0);
      }
    }
  }

  metrics.totalAgentTicks = agentIds.length * opts.ticks;
  metrics.finalState = state;

  return metrics;
}

// ─── Multi-Seed Runner ───────────────────────────────────────────

export function runMultiSeed(
  seeds: number[],
  ticks: number,
  map: MapSizePreset = 'medium',
): SimulationMetrics[] {
  return seeds.map(seed => runSimulation({ seed, ticks, map }));
}

// ─── Statistical Helpers ─────────────────────────────────────────

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function idleRate(m: SimulationMetrics): number {
  let totalIdle = 0;
  for (const count of m.idleTicksPerAgent.values()) totalIdle += count;
  return totalIdle / m.totalAgentTicks;
}

export function successRate(m: SimulationMetrics): number {
  if (m.totalResolutions === 0) return 0;
  return m.successCount / m.totalResolutions;
}

export function critRate(m: SimulationMetrics): number {
  if (m.totalResolutions === 0) return 0;
  return (m.critSuccessCount + m.critFailureCount) / m.totalResolutions;
}

export function completionRate(m: SimulationMetrics): number {
  const total = m.encounterCompletions + m.encounterAbandons;
  if (total === 0) return 0;
  return m.encounterCompletions / total;
}

export function avgDistinctHexes(m: SimulationMetrics): number {
  const counts = Array.from(m.distinctHexesPerAgent.values()).map(s => s.size);
  return mean(counts);
}

export function maxRepetitionsPerAgent(m: SimulationMetrics): number {
  let maxRep = 0;
  for (const agentReps of m.templateRepetitions.values()) {
    for (const count of agentReps.values()) {
      if (count > maxRep) maxRep = count;
    }
  }
  return maxRep;
}

export function maxConsecutiveIdle(m: SimulationMetrics): number {
  let max = 0;
  for (const count of m.maxConsecutiveIdlePerAgent.values()) {
    if (count > max) max = count;
  }
  return max;
}

export function agentsWithGrowth(m: SimulationMetrics): number {
  let count = 0;
  for (const [id, initial] of m.initialRawScores) {
    const final = m.finalRawScores.get(id) ?? initial;
    if (final > initial) count++;
  }
  return count;
}
