/**
 * Phase Mandate — evaluate mandate progress and feed checkpoint outcomes back into doom.
 *
 * Legacy graph mandates still use the older 3-stage evaluator.
 * Remembrance-shaped mandates use sphere-growth progress tied to the global aggregate.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type {
  MandateDefinition,
  MandateSecondaryObjectiveDefinition,
  MandateStage,
  MandateState,
} from '../types/mandate';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { MANDATE_PRESSURE_MILESTONE, MANDATE_PRESSURE_COMPLETION } from '../types/sphereAffinity';
import { evaluateMandate, advanceMandateStage } from './mandate';
import { emitTrace } from './traceBuffer';
import { MANDATE_COUNTER_OMEN_MARGIN } from '../data/game-config';

const STAGE_ORDER: MandateStage[] = ['setup', 'escalation', 'culmination'];
const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);
const ABYSS_LOCATION_SUBTYPES = new Set([
  'corruption_zone',
  'ruins',
  'ruined_tower',
  'ruined_city',
  'ruined_village',
]);

let eventCounter = 0;
export function resetMandateCounter(): void {
  eventCounter = 0;
}

function nextEventId(tick: number): string {
  return `mandate_evt_${tick}_${eventCounter++}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function computeSphereDelta(current: number, baseline: number): number {
  if (!Number.isFinite(current)) return 0;
  const safeBaseline = Math.max(1, baseline);
  return (current - baseline) / safeBaseline;
}

function getSecondaryObjectiveProgress(
  state: GameState,
  secondaryObjective: MandateSecondaryObjectiveDefinition | undefined,
): number {
  if (!secondaryObjective) return 0;

  const threadEdges = state.graph.getOutgoingEdges(state.ascendantId, 'thread');

  switch (secondaryObjective.type) {
    case 'web_relationships':
      return threadEdges.length;

    case 'circle_retinue':
      return threadEdges.filter((edge) => {
        const targetNode = state.graph.getNode(edge.target);
        return targetNode?.type === 'actor' && targetNode.properties.actorType === 'individual';
      }).length;

    case 'high_house_settlements':
      return threadEdges.filter((edge) => {
        const targetNode = state.graph.getNode(edge.target);
        return (
          targetNode?.type === 'location' &&
          SETTLEMENT_SUBTYPES.has((targetNode.properties.locationSubtype as string | undefined) ?? '')
        );
      }).length;

    case 'abyss_anomalies':
      return threadEdges.filter((edge) => {
        const targetNode = state.graph.getNode(edge.target);
        if (targetNode?.type !== 'location') return false;
        const subtype = (targetNode.properties.locationSubtype as string | undefined) ?? '';
        return targetNode.properties.isAnomalyLocation === true || ABYSS_LOCATION_SUBTYPES.has(subtype);
      }).length;

    default:
      return 0;
  }
}

function checkpointPassed(
  results: MandateState['checkpointResults'],
  index: number,
): boolean {
  return results?.some((result) => result.index === index && result.passed) ?? false;
}

function hydrateSphereGrowthDefinition(
  definition: MandateDefinition,
  state: MandateState,
): MandateDefinition {
  const checkpoints = definition.checkpoints ?? [];
  if (definition.runtimeKind !== 'sphere_growth' || checkpoints.length < 4) {
    return definition;
  }

  return {
    ...definition,
    stages: [
      {
        ...definition.stages[0],
        conditions: definition.stages[0].conditions.map((condition, index) => ({
          ...condition,
          met: index === 0
            ? (state.primaryDelta ?? 0) >= checkpoints[0].requiredPrimaryDelta
            : (state.secondaryDelta ?? 0) >= checkpoints[0].requiredSecondaryDelta,
        })),
      },
      {
        ...definition.stages[1],
        conditions: definition.stages[1].conditions.map((condition, index) => ({
          ...condition,
          met: checkpointPassed(state.checkpointResults, index + 1),
        })),
      },
      {
        ...definition.stages[2],
        conditions: definition.stages[2].conditions.map((condition, index) => ({
          ...condition,
          met: index === 0
            ? (state.primaryDelta ?? 0) >= (definition.primaryTargetDelta ?? 0)
            : (state.secondaryDelta ?? 0) >= (definition.secondaryTargetDelta ?? 0),
        })),
      },
    ],
  };
}

function evaluateSphereGrowthMandate(state: GameState): Partial<GameState> {
  const definition = state.mandateDefinition;
  const mandateState = state.mandateState;
  const aggregate = state.worldSoul.aggregate;

  if (
    !definition ||
    !mandateState ||
    definition.runtimeKind !== 'sphere_growth' ||
    !aggregate ||
    !definition.primarySphere ||
    !definition.secondarySphere
  ) {
    return {};
  }

  const primaryCurrent = aggregate.totalBySphere[definition.primarySphere] ?? 0;
  const secondaryCurrent = aggregate.totalBySphere[definition.secondarySphere] ?? 0;
  const primaryDelta = computeSphereDelta(primaryCurrent, definition.primaryBaseline ?? 0);
  const secondaryDelta = computeSphereDelta(secondaryCurrent, definition.secondaryBaseline ?? 0);
  const primaryTargetDelta = definition.primaryTargetDelta ?? 0;
  const secondaryTargetDelta = definition.secondaryTargetDelta ?? 0;
  const primaryRatio = primaryTargetDelta > 0 ? primaryDelta / primaryTargetDelta : 0;
  const secondaryRatio = secondaryTargetDelta > 0 ? secondaryDelta / secondaryTargetDelta : 0;
  const progress = clamp01((clamp01(primaryRatio) + clamp01(secondaryRatio)) / 2);

  const checkpointResults = [...(mandateState.checkpointResults ?? [])];
  const events: TickEvent[] = [];
  const pressures: SpherePressureEvent[] = [...(state.pendingSpherePressures ?? [])];
  let counterOmensDelta = 0;
  let severityPenaltyDelta = 0;

  for (const checkpoint of definition.checkpoints ?? []) {
    if (state.doomClock.progress < checkpoint.doomProgressThreshold) continue;
    if (checkpointResults.some((result) => result.index === checkpoint.index)) continue;

    const passed =
      primaryDelta >= checkpoint.requiredPrimaryDelta &&
      secondaryDelta >= checkpoint.requiredSecondaryDelta;
    const exceeded =
      passed &&
      primaryDelta >= checkpoint.requiredPrimaryDelta + MANDATE_COUNTER_OMEN_MARGIN &&
      secondaryDelta >= checkpoint.requiredSecondaryDelta + MANDATE_COUNTER_OMEN_MARGIN;

    checkpointResults.push({
      index: checkpoint.index,
      doomProgressThreshold: checkpoint.doomProgressThreshold,
      passed,
      exceeded,
      evaluatedTick: state.tick,
      requiredPrimaryDelta: checkpoint.requiredPrimaryDelta,
      observedPrimaryDelta: primaryDelta,
    });

    if (passed && exceeded) {
      counterOmensDelta += 1;
    } else if (!passed) {
      severityPenaltyDelta += 1;
    }

    emitTrace({
      category: 'mandate_checkpoint',
      tick: state.tick,
      agentId: state.ascendantId,
      summary: passed
        ? `${checkpoint.label} held. ${exceeded ? 'A counter-omen is banked.' : 'The pace is maintained.'}`
        : `${checkpoint.label} was missed. Doom gathers force.`,
      checkpointIndex: checkpoint.index,
      doomProgressThreshold: checkpoint.doomProgressThreshold,
      requiredPrimaryDelta: checkpoint.requiredPrimaryDelta,
      observedPrimaryDelta: primaryDelta,
      passed,
      exceeded,
      counterOmensDelta: passed && exceeded ? 1 : 0,
      severityPenaltyDelta: passed ? 0 : 1,
    });

    events.push({
      id: nextEventId(state.tick),
      tick: state.tick,
      type: 'mandate_progress',
      message: passed
        ? exceeded
          ? `${checkpoint.label} held. A counter-omen gathers around your mandate.`
          : `${checkpoint.label} held. Your mandate stays on pace.`
        : `${checkpoint.label} missed. Doom will strike harder at the next escalation.`,
      significance: passed ? 0.65 : 0.8,
      notification: {
        channel: passed ? 'alert' : 'popup',
        icon: 'mandate',
      },
    });
  }

  const secondaryObjectiveCurrent = getSecondaryObjectiveProgress(state, definition.secondaryObjective);
  const secondaryObjectiveCompleted = definition.secondaryObjective
    ? secondaryObjectiveCurrent >= definition.secondaryObjective.target
    : false;
  const passedCount = checkpointResults.filter((result) => result.passed).length;
  const completed =
    primaryDelta >= primaryTargetDelta &&
    secondaryDelta >= secondaryTargetDelta;
  const failed = !completed && state.doomClock.expired;

  let currentStage: MandateStage = 'setup';
  if (completed || passedCount >= 3) {
    currentStage = 'culmination';
  } else if (passedCount >= 1) {
    currentStage = 'escalation';
  }

  const stageCompletedTicks = { ...(mandateState.stageCompletedTicks ?? {}) };
  if (passedCount >= 1 && stageCompletedTicks.setup == null) {
    stageCompletedTicks.setup = state.tick;
  }
  if (passedCount >= 3 && stageCompletedTicks.escalation == null) {
    stageCompletedTicks.escalation = state.tick;
  }
  if (completed && stageCompletedTicks.culmination == null) {
    stageCompletedTicks.culmination = state.tick;
  }

  const milestoneReached =
    !mandateState.completed &&
    !completed &&
    currentStage !== mandateState.currentStage;

  if (milestoneReached && definition.primarySphere) {
    pressures.push({
      targetEntityId: state.ascendantId,
      sphere: definition.primarySphere,
      magnitude: MANDATE_PRESSURE_MILESTONE,
      source: 'mandate',
      sourceId: definition.id,
    });
  }

  if (completed && !mandateState.completed && definition.primarySphere) {
    pressures.push({
      targetEntityId: state.ascendantId,
      sphere: definition.primarySphere,
      magnitude: MANDATE_PRESSURE_COMPLETION,
      source: 'mandate',
      sourceId: definition.id,
    });
    events.push({
      id: nextEventId(state.tick),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Victory! Mandate "${definition.name}" fulfilled before the final doom closes.`,
      significance: 1.0,
      notification: {
        channel: 'alert',
        icon: 'mandate',
      },
    });
  }

  if (failed && !mandateState.failed) {
    events.push({
      id: nextEventId(state.tick),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Mandate failed. ${definition.name} did not crest before doom expired.`,
      significance: 0.95,
      notification: {
        channel: 'popup',
        popup: {
          title: 'Mandate Failed',
          body: `${definition.name} fell short before the doom clock expired.`,
        },
      },
    });
  }

  const updatedState: MandateState = {
    ...mandateState,
    currentStage,
    progress,
    completed,
    failed,
    primaryCurrent,
    secondaryCurrent,
    primaryDelta,
    secondaryDelta,
    secondaryObjectiveCurrent,
    secondaryObjectiveCompleted,
    checkpointResults,
    counterOmensEarned: (mandateState.counterOmensEarned ?? 0) + counterOmensDelta,
    doomSeverityPenalties: (mandateState.doomSeverityPenalties ?? 0) + severityPenaltyDelta,
    stageCompletedTicks,
  };

  return {
    mandateDefinition: hydrateSphereGrowthDefinition(definition, updatedState),
    mandateState: updatedState,
    doomClock: {
      ...state.doomClock,
      counterOmens: state.doomClock.counterOmens + counterOmensDelta,
      nextEscalationSeverityModifier:
        state.doomClock.nextEscalationSeverityModifier + severityPenaltyDelta,
    },
    tickEvents: [...state.tickEvents, ...events],
    pendingSpherePressures: pressures,
  };
}

function evaluateLegacyMandate(state: GameState): Partial<GameState> {
  if (!state.mandateDefinition || !state.mandateState) return {};

  const evaluated: MandateState = evaluateMandate(
    state.graph,
    state.mandateDefinition as any,
    state.mandateState,
    state.ascendantId,
    state.tick,
  );

  const wasStageAdvanced = evaluated.progress >= 1.0 && !state.mandateState.completed;
  const advanced: MandateState = wasStageAdvanced
    ? advanceMandateStage(evaluated, state.tick)
    : evaluated;

  const events: TickEvent[] = [];
  const pressures: SpherePressureEvent[] = [...(state.pendingSpherePressures ?? [])];
  const mandateSphere = state.mandateDefinition.targetSphere;

  if (wasStageAdvanced && mandateSphere) {
    if (advanced.completed) {
      pressures.push({
        targetEntityId: state.ascendantId,
        sphere: mandateSphere,
        magnitude: MANDATE_PRESSURE_COMPLETION,
        source: 'mandate',
        sourceId: state.mandateDefinition.id,
      });
    } else {
      pressures.push({
        targetEntityId: state.ascendantId,
        sphere: mandateSphere,
        magnitude: MANDATE_PRESSURE_MILESTONE,
        source: 'mandate',
        sourceId: state.mandateDefinition.id,
      });
    }
  }

  if (advanced.completed && !state.mandateState.completed) {
    events.push({
      id: nextEventId(state.tick),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Victory! Mandate "${state.mandateDefinition.name}" fulfilled!`,
      significance: 1.0,
      notification: {
        channel: 'alert',
        icon: 'mandate',
      },
    });
  }

  return {
    mandateState: advanced,
    tickEvents: [...state.tickEvents, ...events],
    pendingSpherePressures: pressures,
  };
}

export function phaseMandate(state: GameState): Partial<GameState> {
  if (
    !state.mandateState ||
    !state.mandateDefinition ||
    state.mandateState.completed ||
    state.mandateState.failed
  ) {
    return {};
  }

  if (state.mandateDefinition.runtimeKind === 'sphere_growth') {
    return evaluateSphereGrowthMandate(state);
  }

  return evaluateLegacyMandate(state);
}
