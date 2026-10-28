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
import { TWILIGHT_WORDS } from '../data/twilight-content';
import {
  MANDATE_COUNTER_OMEN_MARGIN,
  MANDATE_MILESTONE_EVENT_SIGNIFICANCE,
  MANDATE_FAILURE_EVENT_SIGNIFICANCE,
  MANDATE_BASELINE_SETTLE_TICK,
  MANDATE_GOD_LEDGER_ENABLED,
  MANDATE_PRIMARY_TARGET_POINTS,
  MANDATE_SECONDARY_TARGET_POINTS,
} from '../data/game-config';
import { applyMandateCredits } from './mandateLedger';
import {
  resolveMilestoneProse,
  transitionForStageChange,
  type MandateProseTransition,
} from './mandateMilestoneProse';

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

/**
 * Build the tick event for a mandate transition (THR-1197), preferring the line
 * authored for this mandate in its JSON and falling back to the generated text
 * when none was written (NFP #4 — a missing key narrates, it never throws).
 *
 * Traces the resolution either way so a fallback is inspectable rather than silent:
 * a mandate family with no authored prose is a content gap, and the trace is where
 * it shows up.
 */
function buildMandateProseEvent(
  state: GameState,
  definition: MandateDefinition,
  transition: MandateProseTransition,
  fallback: string,
  significance: number,
  notification: TickEvent['notification'],
): TickEvent {
  const resolved = resolveMilestoneProse(
    definition.id,
    transition,
    fallback,
    definition.primarySphere,
  );

  emitTrace({
    category: 'mandate_milestone_prose',
    tick: state.tick,
    agentId: state.ascendantId,
    summary: resolved.authored
      ? `Mandate "${definition.name}" narrates its ${transition} beat from authored prose (${resolved.key}).`
      : `Mandate "${definition.name}" has no authored ${transition} prose; the generated line stands in.`,
    mandateId: definition.id,
    transition,
    authored: resolved.authored,
    proseKey: resolved.key,
  });

  return {
    id: nextEventId(state.tick),
    tick: state.tick,
    type: 'mandate_progress',
    message: resolved.text,
    significance,
    notification,
  };
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
  const initialDefinition = state.mandateDefinition;
  const initialMandateState = state.mandateState;
  const aggregate = state.worldSoul.aggregate;

  if (
    !initialDefinition ||
    !initialMandateState ||
    initialDefinition.runtimeKind !== 'sphere_growth' ||
    !aggregate ||
    !initialDefinition.primarySphere ||
    !initialDefinition.secondarySphere
  ) {
    return {};
  }

  const primaryCurrent = aggregate.totalBySphere[initialDefinition.primarySphere] ?? 0;
  const secondaryCurrent = aggregate.totalBySphere[initialDefinition.secondarySphere] ?? 0;

  // THR-2080 — the init baseline predates tick 1's sublocation mints, so the world
  // settling read as Mandate growth. Nothing counts until the world has settled.
  if (initialMandateState.baselineSettledTick == null && state.tick < MANDATE_BASELINE_SETTLE_TICK) {
    return {
      mandateState: {
        ...initialMandateState,
        progress: 0,
        primaryCurrent,
        secondaryCurrent,
        primaryDelta: 0,
        secondaryDelta: 0,
      },
      pendingMandateCredits: [],
    };
  }

  let definition = initialDefinition;
  let mandateState = initialMandateState;
  if (mandateState.baselineSettledTick == null) {
    const oldPrimary = definition.primaryBaseline;
    const oldSecondary = definition.secondaryBaseline;
    definition = { ...definition, primaryBaseline: primaryCurrent, secondaryBaseline: secondaryCurrent };
    mandateState = { ...mandateState, baselineSettledTick: state.tick };
    emitTrace({
      category: 'mandate_baseline_settled',
      tick: state.tick,
      agentId: state.ascendantId,
      summary:
        `Mandate "${definition.name}" takes its starting point from the settled world: ` +
        `${definition.primarySphere} ${(oldPrimary ?? 0).toFixed(1)} → ${primaryCurrent.toFixed(1)}, ` +
        `${definition.secondarySphere} ${(oldSecondary ?? 0).toFixed(1)} → ${secondaryCurrent.toFixed(1)}.`,
      mandateId: definition.id,
      oldPrimaryBaseline: oldPrimary,
      newPrimaryBaseline: primaryCurrent,
      oldSecondaryBaseline: oldSecondary,
      newSecondaryBaseline: secondaryCurrent,
    });
  }
  // THR-2081 — only the god's own hand fills the Mandate. The targets become points of
  // the god's making, written once (at the settle, or the first tick a pre-build save is
  // read); the relative target and checkpoint deltas are rescaled to them so every
  // reader of `primaryDelta` / `primaryTargetDelta` stays correct.
  if (MANDATE_GOD_LEDGER_ENABLED && definition.primaryTargetPoints == null) {
    const primaryTargetDelta = MANDATE_PRIMARY_TARGET_POINTS / Math.max(1, definition.primaryBaseline ?? 0);
    const secondaryTargetDelta = MANDATE_SECONDARY_TARGET_POINTS / Math.max(1, definition.secondaryBaseline ?? 0);
    definition = {
      ...definition,
      primaryTargetPoints: MANDATE_PRIMARY_TARGET_POINTS,
      secondaryTargetPoints: MANDATE_SECONDARY_TARGET_POINTS,
      primaryTargetDelta,
      secondaryTargetDelta,
      checkpoints: definition.checkpoints?.map((checkpoint) => ({
        ...checkpoint,
        requiredPrimaryDelta: primaryTargetDelta * checkpoint.doomProgressThreshold,
        requiredSecondaryDelta: secondaryTargetDelta * checkpoint.doomProgressThreshold,
      })),
    };
  }

  let primaryDelta: number;
  let secondaryDelta: number;
  if (MANDATE_GOD_LEDGER_ENABLED) {
    const folded = applyMandateCredits(
      mandateState.godLedger ?? { primary: 0, secondary: 0 },
      mandateState.godHeld ?? {},
      state.pendingMandateCredits ?? [],
      definition.primarySphere!,
      definition.secondarySphere!,
    );
    for (const credit of folded.applied) {
      emitTrace({
        category: 'mandate_ledger_credit',
        tick: state.tick,
        agentId: state.ascendantId,
        summary:
          `Mandate ${credit.sphere} ${credit.applied >= 0 ? '+' : ''}${credit.applied.toFixed(2)} ` +
          `(${credit.cause}) at ${credit.entityId} from ${[...new Set(credit.sources)].join(', ')}; ` +
          `ledger ${credit.ledgerAfter.toFixed(2)}`,
        entityId: credit.entityId,
        sphere: credit.sphere,
        points: credit.applied,
        cause: credit.cause,
        sources: credit.sources,
        ledgerAfter: credit.ledgerAfter,
      });
    }
    mandateState = { ...mandateState, godLedger: folded.ledger, godHeld: folded.held };
    primaryDelta = folded.ledger.primary / Math.max(1, definition.primaryBaseline ?? 0);
    secondaryDelta = folded.ledger.secondary / Math.max(1, definition.secondaryBaseline ?? 0);
  } else {
    primaryDelta = computeSphereDelta(primaryCurrent, definition.primaryBaseline ?? 0);
    secondaryDelta = computeSphereDelta(secondaryCurrent, definition.secondaryBaseline ?? 0);
  }
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
      // alert-chronicle: mandate_progress
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

  // THR-1197 — the spine used to turn in silence here: a milestone advance emitted
  // sphere pressure and no tick event at all. Not gated on primarySphere: the beat
  // is worth narrating whether or not the mandate carries a sphere to press on.
  if (milestoneReached) {
    const transition = transitionForStageChange(mandateState.currentStage, currentStage);
    if (transition) {
      events.push(
        buildMandateProseEvent(
          state,
          definition,
          transition,
          `Mandate "${definition.name}" enters its next stage.`,
          MANDATE_MILESTONE_EVENT_SIGNIFICANCE,
          // alert-chronicle: mandate_progress
          { channel: 'alert', icon: 'mandate' },
        ),
      );
    }
  }

  if (completed && !mandateState.completed && definition.primarySphere) {
    pressures.push({
      targetEntityId: state.ascendantId,
      sphere: definition.primarySphere,
      magnitude: MANDATE_PRESSURE_COMPLETION,
      source: 'mandate',
      sourceId: definition.id,
    });
    events.push(
      buildMandateProseEvent(
        state,
        definition,
        'completed',
        // THR-1381 Decided 6 — the age ends on this line; the ceremony says the rest.
        TWILIGHT_WORDS.chronicleMandate(definition.name),
        1.0,
        // alert-chronicle: mandate_progress
        { channel: 'alert', icon: 'mandate' },
      ),
    );
  }

  if (failed && !mandateState.failed) {
    events.push(
      buildMandateProseEvent(
        state,
        definition,
        'failed',
        `Mandate failed. ${definition.name} did not crest before doom expired.`,
        MANDATE_FAILURE_EVENT_SIGNIFICANCE,
        {
          channel: 'popup',
          popup: {
            title: 'Mandate Failed',
            body: `${definition.name} fell short before the doom clock expired.`,
          },
        },
      ),
    );
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
    pendingMandateCredits: [],
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

  // THR-1197 — a non-completing stage advance narrated nothing here either.
  if (wasStageAdvanced && !advanced.completed) {
    const transition = transitionForStageChange(
      state.mandateState.currentStage,
      advanced.currentStage,
    );
    if (transition) {
      events.push(
        buildMandateProseEvent(
          state,
          state.mandateDefinition,
          transition,
          `Mandate "${state.mandateDefinition.name}" enters its next stage.`,
          MANDATE_MILESTONE_EVENT_SIGNIFICANCE,
          // alert-chronicle: mandate_progress
          { channel: 'alert', icon: 'mandate' },
        ),
      );
    }
  }

  if (advanced.completed && !state.mandateState.completed) {
    events.push(
      buildMandateProseEvent(
        state,
        state.mandateDefinition,
        'completed',
        TWILIGHT_WORDS.chronicleMandate(state.mandateDefinition.name),
        1.0,
        // alert-chronicle: mandate_progress
        { channel: 'alert', icon: 'mandate' },
      ),
    );
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
