/**
 * General-purpose adapter that builds an EncounterStageModel from any
 * UnifiedActionTemplate-based encounter. Lightweight and data-driven —
 * unlike the gate-duty adapter, it derives all display content from the
 * template definition rather than hardcoded encounter-specific content.
 *
 * v1: Produces legible rendering for any unified encounter, including
 * branching encounters. Signals, shell state, factions, and illustration
 * are left empty — those are gate-duty-specific features for now.
 */

import type { WorldGraph } from '../../../../engine/graph';
import { autoLinkNarrative, collectSupportBundleEntities } from '../narrativeLinker';
import { resolveStepDefinition } from '../../../../engine/unifiedActionLifecycle';
import type {
  EncounterSupportActorSpec,
  EncounterSupportBinding,
} from '../../../../types/encounter';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import {
  isActionStepBranch,
  isStepSuccess,
  type ActionStep,
  type UnifiedAction,
  type UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import type { ThreadTier } from '../../TieredEncounterModal';
import type {
  EncounterCastRole,
  EncounterStageAftermathChangeModel,
  EncounterStageAftermathReactionModel,
  EncounterStageChoiceModel,
  EncounterStageCastModel,
  EncounterStageFalloutModel,
  EncounterStageHistoryModel,
  EncounterStageModel,
  EncounterStageNarrativeParagraph,
} from '../types';

// ─── Args ─────────────────────────────────────────────────────────

export interface BuildUnifiedEncounterStageModelArgs {
  template: UnifiedActionTemplate;
  activeAction: UnifiedAction;
  notification: EncounterNotification;
  agentName: string;
  threadTier: ThreadTier;
  graph: WorldGraph;
  essence: number;
}

// ─── Helpers ──────────────────────────────────────────────────────

function getNodeName(graph: WorldGraph, nodeId: string | undefined, fallback: string): string {
  if (!nodeId) return fallback;
  const node = graph.getNode(nodeId);
  return node?.name ?? fallback;
}

/** Map 0-1 difficulty to a human-readable threat label. */
function difficultyToThreatLabel(difficulty: number): string {
  if (difficulty <= 0.1) return 'Trivial';
  if (difficulty <= 0.3) return 'Easy';
  if (difficulty <= 0.5) return 'Moderate';
  if (difficulty <= 0.7) return 'Hard';
  return 'Deadly';
}

/** Resolve the location label from the action's target node. */
function resolveLocationLabel(graph: WorldGraph, targetId: string): string {
  const targetNode = graph.getNode(targetId);
  if (!targetNode) return 'Unknown Location';

  // If the target IS a location, use its name directly
  if (targetNode.type === 'location' || targetNode.type === 'sublocation') {
    return targetNode.name ?? 'Unknown Location';
  }

  // Otherwise look for a located_at edge from the target
  const edges = graph.getAllEdgesForNode(targetId);
  const locatedAtEdge = edges.find(e => e.type === 'located_at' && e.source === targetId);
  if (locatedAtEdge) {
    return getNodeName(graph, locatedAtEdge.target, 'Unknown Location');
  }

  return targetNode.name ?? 'Unknown Location';
}

/** Resolve the current step definition for the active action. */
function getCurrentStep(
  template: UnifiedActionTemplate,
  action: UnifiedAction,
): ActionStep {
  return resolveStepDefinition(template, action.currentStep, action.choiceHistory);
}

// ─── Section Builders ─────────────────────────────────────────────

function buildHeader(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageModel['header'] {
  const { template, activeAction, agentName, threadTier, graph } = args;
  const currentStep = getCurrentStep(template, activeAction);

  return {
    title: template.name,
    subtitle: template.description ?? template.narrativeTemplates.initiation,
    locationLabel: resolveLocationLabel(graph, activeAction.targetId),
    threatLabel: difficultyToThreatLabel(currentStep.difficulty),
    threadTier,
    familyLabel: agentName,
  };
}

function buildScene(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageModel['scene'] {
  const { template, activeAction } = args;
  const currentStep = getCurrentStep(template, activeAction);

  return {
    situationProse: template.narrativeTemplates.initiation,
    pressureProse: currentStep.narrativeTemplate ?? '',
    noticeLines: [],
  };
}

function buildNarrative(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageModel['narrative'] {
  const { template, activeAction, graph } = args;
  const currentStep = getCurrentStep(template, activeAction);
  const proseSource = currentStep.narrativeTemplate ?? template.narrativeTemplates.initiation;

  // Collect linkable entities from support bundle
  const bindings = activeAction.supportBindings ?? [];
  const { linkEntries, references } = template.supportBundle
    ? collectSupportBundleEntities(graph, template.supportBundle, bindings)
    : { linkEntries: [], references: [] };

  // Split prose into paragraphs and auto-link entity names
  const rawParagraphs = proseSource.split('\n\n').filter(Boolean);
  const paragraphs = rawParagraphs.map((text, index) =>
    autoLinkNarrative(`para-${index}`, text.trim(), linkEntries),
  );

  // Ensure at least one paragraph
  if (paragraphs.length === 0) {
    paragraphs.push(
      autoLinkNarrative('para-0', template.narrativeTemplates.initiation, linkEntries),
    );
  }

  return {
    paragraphs,
    references,
  };
}

function buildCast(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageCastModel[] {
  const { template, activeAction, graph } = args;
  if (!template.supportBundle) return [];

  const bindings = activeAction.supportBindings ?? [];

  return template.supportBundle
    .filter((spec): spec is EncounterSupportActorSpec => spec.kind === 'actor')
    .map((spec) => {
      const binding = bindings.find(b => b.key === spec.key);
      const resolvedName = binding
        ? getNodeName(graph, binding.nodeId, spec.spawnName)
        : spec.spawnName;

      const role: EncounterCastRole = mapSupportRoleToCastRole(spec.supportRole);

      return {
        id: spec.key,
        name: resolvedName,
        role,
        roleLabel: spec.supportRole,
        reused: binding?.reused ?? false,
      };
    });
}

function mapSupportRoleToCastRole(supportRole: string): EncounterCastRole {
  switch (supportRole) {
    case 'authority':
    case 'captain':
    case 'commander':
      return 'authority';
    case 'witness':
    case 'bystander':
      return 'witness';
    case 'support':
    case 'aide':
    case 'assistant':
      return 'support';
    default:
      return 'subject';
  }
}

function buildChoices(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageChoiceModel[] {
  const { notification, essence } = args;

  return notification.choices.map((choice) => ({
    id: choice.id,
    label: choice.text,
    intent: choice.interventionType,
    essenceCost: choice.essenceCost,
    affordable: choice.essenceCost <= essence,
    costLabel: choice.essenceCost > 0 ? `${choice.essenceCost} essence` : 'Free',
  }));
}

function buildHistory(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageHistoryModel[] {
  const { template, activeAction } = args;

  return template.steps.map((step, index) => {
    const isResolved = index < activeAction.stepOutcomes.length;
    const isCurrent = index === activeAction.currentStep && !activeAction.resolved;

    // Derive a label from the step definition
    let stepLabel: string;
    if (isActionStepBranch(step)) {
      stepLabel = `Step ${index + 1} (branching)`;
    } else {
      stepLabel = step.narrativeTemplate
        ? `Step ${index + 1}: ${step.reach}`
        : `Step ${index + 1}`;
    }

    let afterimage: string | undefined;
    if (isResolved) {
      const outcome = activeAction.stepOutcomes[index];
      afterimage = isStepSuccess(outcome) ? 'Succeeded' : 'Failed';
    }

    return {
      stepId: `step-${index}`,
      stepLabel,
      status: isResolved ? 'resolved' as const : isCurrent ? 'current' as const : 'future' as const,
      afterimage,
    };
  });
}

function buildAftermath(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageModel['aftermath'] {
  const { activeAction } = args;
  const summary = activeAction.aftermathSummary;
  if (!summary) return undefined;

  const changes: EncounterStageAftermathChangeModel[] = summary.changes.map((change) => ({
    id: change.id,
    kind: change.kind,
    title: change.title,
    detail: change.detail,
    polarity: change.polarity,
  }));

  const reactions: EncounterStageAftermathReactionModel[] | undefined = summary.reactions?.map(
    (reaction) => ({
      id: reaction.id,
      label: reaction.label,
      intent: reaction.intent,
    }),
  );

  return {
    title: 'Aftermath',
    overview: summary.overview,
    changes: changes.length > 0 ? changes : undefined,
    reactionPrompt: summary.reactionPrompt,
    reactions: reactions && reactions.length > 0 ? reactions : undefined,
  };
}

function buildFalloutPreview(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageFalloutModel[] {
  const { template, activeAction } = args;
  const currentStep = getCurrentStep(template, activeAction);
  const fallout: EncounterStageFalloutModel[] = [];

  // Extract hints from success/failure metadata
  const metadata = currentStep.successMetadata;
  if (metadata?.reputationDelta && metadata.reputationDelta !== 0) {
    fallout.push({
      kind: 'reputation',
      label: metadata.reputationDelta > 0
        ? 'Reputation may increase on success'
        : 'Reputation may decrease on success',
    });
  }

  const failMeta = currentStep.failureMetadata;
  if (failMeta?.reputationDelta && failMeta.reputationDelta !== 0) {
    fallout.push({
      kind: 'reputation',
      label: failMeta.reputationDelta > 0
        ? 'Reputation may increase on failure'
        : 'Reputation may decrease on failure',
    });
  }

  return fallout;
}

// ─── Main Builder ─────────────────────────────────────────────────

export function buildUnifiedEncounterStageModel(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageModel {
  return {
    header: buildHeader(args),
    scene: buildScene(args),
    narrative: buildNarrative(args),
    cast: buildCast(args),
    factions: [],
    signals: [],
    choices: buildChoices(args),
    falloutPreview: buildFalloutPreview(args),
    history: buildHistory(args),
    aftermath: buildAftermath(args),
  };
}
