import type { GameState, PendingChoiceCommit } from '../../types/gameState';
import type { TraceEntry } from '../../types/trace';
import type { ReachDomain } from '../../types/traits';
import type { EncounterChoiceCost, ArchetypePole } from '../../types/traces/encounter-traces';
import {
  CHOICE_PROBABILITY_TILT_SMALL,
  CHOICE_PROBABILITY_TILT_FULLER,
  CHOICE_PROBABILITY_TILT_DEEP,
} from '../../data/encounter-experience-constants';
import { resolveEncounterChoice } from '../encounters/choiceResolution';
import { applyDriftMagnitude } from '../encounters/driftAccumulator';
import { consumeItemForChoice } from '../encounters/itemConsumption';
import { emitTrace } from '../traceBuffer';

export interface ChoiceResolutionPhaseResult {
  archetypeDrift: GameState['archetypeDrift'];
  pendingChoiceCommits: [];
  resolvedCount: number;
}

function probabilityTiltForCost(cost: PendingChoiceCommit['cost']): number {
  if (cost === 'small_breath') return CHOICE_PROBABILITY_TILT_SMALL;
  if (cost === 'fuller_breath') return CHOICE_PROBABILITY_TILT_FULLER;
  return CHOICE_PROBABILITY_TILT_DEEP;
}

/**
 * Processes all pending encounter choice commits queued by the UI.
 *
 * For each commit:
 * 1. Rolls d100 via prng (deterministic, NFP #3).
 * 2. Determines the outcome band.
 * 3. Applies signed drift magnitude to the agent's archetype axis (virtue → positive, flaw → negative).
 * 4. Removes consumed item's possesses edge (fail-soft: missing item → warning + skip).
 * 5. Emits choice_resolved, drift_threshold_crossed, and item_consumed_by_choice traces.
 *
 * Returns updated archetypeDrift and an empty pendingChoiceCommits (commits consumed this tick).
 */
export function phaseChoiceResolution(
  state: GameState,
  prng: () => number,
): ChoiceResolutionPhaseResult {
  const commits = state.pendingChoiceCommits ?? [];
  if (commits.length === 0) {
    return { archetypeDrift: state.archetypeDrift, pendingChoiceCommits: [], resolvedCount: 0 };
  }

  let drift = state.archetypeDrift;
  let resolvedCount = 0;

  for (const commit of commits) {
    const outcome = resolveEncounterChoice(commit, prng);

    // virtue → positive drift, flaw → negative drift.
    const signedMagnitude =
      commit.moralAxisPole === 'virtue' ? commit.driftMagnitude : -commit.driftMagnitude;

    const driftResult = applyDriftMagnitude(
      drift,
      commit.agentId,
      commit.reach,
      signedMagnitude,
      state.tick,
    );
    drift = driftResult.drift;

    // Item consumption (atomic with choice commit, same tick).
    if (commit.consumesItemId) {
      const consumption = consumeItemForChoice(state.graph, commit.agentId, commit.consumesItemId, {
        encounterId: commit.encounterId,
        beatIndex: commit.beatIndex,
        tick: state.tick,
      });
      if (consumption.trace) {
        emitTrace({
          ...consumption.trace,
          summary: `Item consumed by choice: ${consumption.trace.itemId} by ${consumption.trace.agentId}`,
        } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
      }
    }

    emitTrace({
      category: 'choice_resolved',
      tick: state.tick,
      summary: `Choice resolved: ${commit.encounterId} beat ${commit.beatIndex} → ${outcome.outcomeBand} (d100=${outcome.rolledD100}, p=${outcome.effectiveProbability.toFixed(2)})`,
      encounterId: commit.encounterId,
      beatIndex: commit.beatIndex,
      agentId: commit.agentId,
      reach: commit.reach as ReachDomain,
      cost: commit.cost as EncounterChoiceCost,
      probabilityTilt: probabilityTiltForCost(commit.cost),
      driftMagnitude: commit.driftMagnitude,
      moralAxisPole: commit.moralAxisPole as ArchetypePole,
      consumesItem: commit.consumesItemId,
      outcomeBand: outcome.outcomeBand,
      rolledD100: outcome.rolledD100,
      effectiveProbability: outcome.effectiveProbability,
    } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);

    for (const driftTrace of driftResult.traces) {
      emitTrace({
        ...driftTrace,
        summary: `Drift threshold ${driftTrace.thresholdCrossed}: ${driftTrace.axisId} ${driftTrace.fromPosition.toFixed(2)} → ${driftTrace.toPosition.toFixed(2)} (${driftTrace.pole})`,
      } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
    }

    resolvedCount += 1;
  }

  return { archetypeDrift: drift, pendingChoiceCommits: [], resolvedCount };
}
