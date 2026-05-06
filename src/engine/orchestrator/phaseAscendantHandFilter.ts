import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types/index';
import type { TargetCategory } from '../../types/targetContext';
import type { TraceEntry } from '../../types/trace';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { adaptUnifiedActionTemplateToEncounterContract } from '../encounter-contract-adapter';
import { filterAscendantHand } from '../encounters/handFilter';
import type { WorldGraph } from '../graph';
import { emitTrace } from '../traceBuffer';

const ASCENDANT_ONLY_AFFINITY = 'ascendant';

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
