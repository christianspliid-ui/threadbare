import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types/index';
import type { EncounterNotification } from '../../types/encounterVisibility';
import type { TargetCategory } from '../../types/targetContext';
import type { TraceEntry } from '../../types/trace';
import type { ForecastTier } from '../../types/traces/encounter-traces';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import { adaptUnifiedActionTemplateToEncounterContract } from '../encounter-contract-adapter';
import { filterAscendantHand } from '../encounters/handFilter';
import { computeForecast, type ForecastModifier } from '../encounters/outcomeForecast';
import { computeCapability } from '../domainCapability';
import type { WorldGraph } from '../graph';
import { computeResolutionModifiers } from '../resolutionModifiers';
import { emitTrace } from '../traceBuffer';
import { resolveStepDefinition } from '../unifiedActionLifecycle';

const ASCENDANT_ONLY_AFFINITY = 'ascendant';
const PROBABILITY_FLOOR = 0.05;
const PROBABILITY_CEILING = 0.95;

interface EncounterNotificationWithForecast {
  outcomeForecast?: {
    actionId?: string;
    stepIndex: number;
    baseProbability: number;
    finalProbability: number;
    finalTier: ForecastTier;
    factors: string[];
    modifiers: ForecastModifier[];
  };
}

export interface AscendantHandFilterPhaseStats {
  filteredCount: number;
}

function resolveAscendantDeck(deckOverride?: readonly UnifiedActionTemplate[]): readonly UnifiedActionTemplate[] {
  if (deckOverride) return deckOverride;
  return UNIFIED_ACTION_TEMPLATES.filter((template) =>
    (template.actorAffinities ?? []).some((affinity) => affinity === ASCENDANT_ONLY_AFFINITY)
  );
}

function resolveEncounterTemplate(templateId: string): UnifiedActionTemplate | null {
  const found = UNIFIED_ACTION_TEMPLATES.find((template) => template.id === templateId);
  return found ?? null;
}

function resolveAccessibleSpheres(state: GameState): SphereName[] {
  const fromIdentity = state.ascendantIdentity?.sphereAlignment;
  if (fromIdentity) return [fromIdentity.primary, fromIdentity.secondary];

  const ascNode = state.graph.getNode(state.ascendantId);
  const raw = ascNode?.properties?.sphereAlignment;
  if (!raw || typeof raw !== 'object') return [];

  const primary = (raw as { primary?: unknown }).primary;
  const secondary = (raw as { secondary?: unknown }).secondary;
  const result: SphereName[] = [];
  if (typeof primary === 'string') result.push(primary as SphereName);
  if (typeof secondary === 'string') result.push(secondary as SphereName);
  return result;
}

function resolveBondTier(graph: WorldGraph, ascendantId: string, targetAgentId: string | undefined): number {
  if (!targetAgentId) return 0;
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  const thread = threadEdges.find((edge) => edge.target === targetAgentId);
  const tier = thread?.properties?.tier;
  return typeof tier === 'number' && Number.isFinite(tier) ? Math.max(0, Math.floor(tier)) : 0;
}

function resolveLocationNodeForAction(state: GameState, actionTargetId: string | undefined) {
  if (!actionTargetId) return null;
  const target = state.graph.getNode(actionTargetId);
  if (!target) return null;

  if (target.type === 'location' || target.type === 'sublocation') {
    return target;
  }

  const locatedAt = state.graph.getOutgoingEdges(target.id, 'located_at')[0];
  if (!locatedAt) return null;
  const locationNode = state.graph.getNode(locatedAt.target);
  return locationNode ?? null;
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return PROBABILITY_FLOOR;
  if (value < PROBABILITY_FLOOR) return PROBABILITY_FLOOR;
  if (value > PROBABILITY_CEILING) return PROBABILITY_CEILING;
  return value;
}

function resolveLocationId(graph: WorldGraph, actorId: string): string {
  const edge = graph.getOutgoingEdges(actorId, 'located_at')[0];
  return edge?.target ?? '';
}

function buildForecastModifiers(
  modifierBreakdown: ReturnType<typeof computeResolutionModifiers>,
): ForecastModifier[] {
  const parts: ForecastModifier[] = [
    { source: 'sphere_alignment', delta: modifierBreakdown.sphereAlignmentBonus },
    { source: 'equipment', delta: modifierBreakdown.equipmentModifier },
    { source: 'terrain', delta: modifierBreakdown.terrainModifier },
    { source: 'traits', delta: modifierBreakdown.traitBonus },
    { source: 'divine_intervention', delta: modifierBreakdown.divineInterventionModifier },
    { source: 'effect_system', delta: modifierBreakdown.effectModifier },
    { source: 'rule_override', delta: modifierBreakdown.ruleModifier },
  ];
  return parts.filter((part) => part.delta !== 0);
}

function maybeComputeEncounterForecast(
  state: GameState,
  action: UnifiedActionTemplate | null,
  actionState: UnifiedAction | undefined,
  notification: EncounterNotification,
): void {
  if (!action || !actionState) return;
  if (notification.stepIndex === undefined) return;

  const notificationWithForecast = notification as typeof notification & EncounterNotificationWithForecast;
  const existing = notificationWithForecast.outcomeForecast;
  if (
    existing
    && existing.actionId === notification.actionId
    && existing.stepIndex === notification.stepIndex
  ) {
    return;
  }

  const resolvedStep = resolveStepDefinition(action, notification.stepIndex, actionState.choiceHistory);
  const capability = computeCapability(state.graph, actionState.actorId, resolvedStep.reach);
  const locationId = resolveLocationId(state.graph, actionState.actorId);
  const modifierBreakdown = computeResolutionModifiers(
    state.graph,
    actionState.actorId,
    locationId,
    resolvedStep.reach,
    action.sphereAffinity,
    state.effectStates,
  );
  const modifiers = buildForecastModifiers(modifierBreakdown);
  const baseProbability = clampProbability(capability - resolvedStep.difficulty);

  const contract = adaptUnifiedActionTemplateToEncounterContract(action);
  const beat = contract.encounter.beats[notification.stepIndex];
  const forecast = computeForecast(
    { forecastFactors: beat?.forecast_factors },
    { baseProbability, modifiers },
  );

  notificationWithForecast.outcomeForecast = {
    actionId: notification.actionId,
    stepIndex: notification.stepIndex,
    baseProbability: forecast.baseProbability,
    finalProbability: forecast.finalProbability,
    finalTier: forecast.finalTier,
    factors: [...forecast.factors],
    modifiers: [...modifiers],
  };

  emitTrace({
    tick: state.tick,
    category: 'forecast_computed',
    summary: `Forecast computed ${notification.encounterId} step ${notification.stepIndex + 1}: ${forecast.finalTier}`,
    encounterId: notification.encounterId,
    beatIndex: notification.stepIndex,
    baseProbability: forecast.baseProbability,
    modifiers,
    finalTier: forecast.finalTier,
    factors: forecast.factors,
  } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
}

function resolvePlaceSphere(locationNode: ReturnType<typeof resolveLocationNodeForAction>): SphereName | null {
  if (!locationNode) return null;
  const raw = locationNode.properties?.sphereAlignment;
  if (typeof raw === 'string') return raw as SphereName;
  if (raw && typeof raw === 'object') {
    const primary = (raw as { primary?: unknown }).primary;
    if (typeof primary === 'string') return primary as SphereName;
  }
  return null;
}

function resolveSceneTargets(
  hasEncounterActor: boolean,
  hasPlaceLocation: boolean,
  hasSublocation: boolean,
  hasRelevantItems: boolean,
): TargetCategory[] {
  const targets = new Set<TargetCategory>();
  if (hasEncounterActor) targets.add('actor');
  if (hasPlaceLocation) targets.add('location');
  if (hasSublocation) targets.add('sublocation');
  if (hasRelevantItems) targets.add('artifact');
  return [...targets];
}

export function phaseAscendantHandFilter(
  state: GameState,
  deckOverride?: readonly UnifiedActionTemplate[],
): AscendantHandFilterPhaseStats {
  const encounterNotifications = state.encounterNotifications ?? [];
  const deck = resolveAscendantDeck(deckOverride);
  const accessibleSpheres = resolveAccessibleSpheres(state);
  let filteredCount = 0;

  for (const notification of encounterNotifications) {
    if (notification.resolved) continue;
    if (notification.kind === 'aftermath') continue;
    if (notification.sourceSystem !== 'unified_action') continue;

    const encounterTemplate = resolveEncounterTemplate(notification.encounterId);
    if (!encounterTemplate) continue;

    const action = (state.unifiedActions ?? []).find((entry) => entry.actionId === notification.actionId);
    maybeComputeEncounterForecast(state, encounterTemplate, action, notification);
    const encounterContract = adaptUnifiedActionTemplateToEncounterContract(encounterTemplate);
    const pinnedEligible = encounterContract.encounter.ascendant_hand_filter.eligible;
    const pinnedRarePulse = encounterContract.encounter.ascendant_hand_filter.rare_pulse;

    const locationNode = resolveLocationNodeForAction(state, action?.targetId);
    const placeSphere = resolvePlaceSphere(locationNode);
    const targetBondTier = resolveBondTier(state.graph, state.ascendantId, action?.actorId);
    const sceneTargets = resolveSceneTargets(
      Boolean(action?.actorId),
      Boolean(encounterContract.encounter.place.location),
      Boolean(encounterContract.encounter.place.sublocation),
      encounterContract.encounter.protagonist_view.items_relevant.length > 0,
    );

    const partition = filterAscendantHand(deck, {
      sceneTargetCategories: sceneTargets,
      essencePool: state.essencePool,
      accessibleSpheres,
      targetBondTier,
      placeContext: { placeSphere },
      authorPinnedEligibleTemplateIds: pinnedEligible,
      authorPinnedRarePulseTemplateIds: pinnedRarePulse,
    });

    emitTrace({
      tick: state.tick,
      category: 'hand_filtered',
      summary: `Hand filter ${notification.encounterId}: ${partition.playable.length} playable / ${partition.dimmed.length} dimmed / ${partition.hidden.length} hidden`,
      encounterId: notification.encounterId,
      totalDeckSize: deck.length,
      playableCount: partition.playable.length,
      dimmedCount: partition.dimmed.length,
      hiddenCount: partition.hidden.length,
      rarePulses: partition.rarePulses,
      playableTemplateIds: partition.playable.map((entry) => entry.template.id),
      dimmedTemplateIds: partition.dimmed.map((entry) => ({
        templateId: entry.template.id,
        prereq: entry.prereq.code,
      })),
      hiddenTemplateIds: partition.hidden.map((entry) => entry.template.id),
    } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);

    filteredCount += 1;
  }

  return { filteredCount };
}
