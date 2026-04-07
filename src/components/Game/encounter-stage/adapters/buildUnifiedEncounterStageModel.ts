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
import { getPortraitUrl } from '../../../../data/portrait-assets';
import { getAttachmentGlyph } from '../../attachmentGlyphs';
import type {
  EncounterSupportActorSpec,
  EncounterSupportBinding,
} from '../../../../types/encounter';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import {
  isActionStepBranch,
  isStepSuccess,
  type ActionStep,
  type AftermathVariant,
  type BranchAwareAftermathConfig,
  type UnifiedAction,
  type UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import type { ThreadTier } from '../types';
import type {
  EncounterCastRole,
  EncounterStageAftermathActorModel,
  EncounterStageAftermathHighlightModel,
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
  const { template, activeAction, notification, essence } = args;

  // Check for authored choices on the template for the current step
  const authoredForStep = template.authoredChoices?.[activeAction.currentStep];

  if (authoredForStep && authoredForStep.length > 0) {
    // Use authored choice cards with full prose bodies
    return authoredForStep.map((card) => ({
      id: card.id,
      label: card.label,
      intent: card.intent,
      targetLabel: card.targetLabel,
      essenceCost: card.essenceCost,
      affordable: essence + 1e-9 >= card.essenceCost,
      costLabel: card.essenceCost > 0 ? `${card.essenceCost.toFixed(2)} essence` : undefined,
      likelyBurden: card.likelyBurden,
    }));
  }

  // Fall back to generic notification choices
  return notification.choices.map((choice) => ({
    id: choice.id,
    label: choice.text,
    intent: choice.interventionType,
    essenceCost: choice.essenceCost,
    affordable: choice.essenceCost <= essence,
    costLabel: choice.essenceCost > 0 ? `${choice.essenceCost} essence` : 'Free',
    interventionType: choice.interventionType,
    godVoice: choice.godVoice,
    probabilityBoost: choice.probabilityBoost,
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
      const success = isStepSuccess(outcome);
      // Use authored afterimage text if available, otherwise fall back to bare status
      const resolvedStep = resolveStepDefinition(template, index, activeAction.choiceHistory);
      afterimage = success
        ? (resolvedStep.successAfterimage ?? 'Succeeded')
        : (resolvedStep.failureAfterimage ?? 'Failed');
    }

    return {
      stepId: `step-${index}`,
      stepLabel,
      status: isResolved ? 'resolved' as const : isCurrent ? 'current' as const : 'future' as const,
      afterimage,
    };
  });
}

/** Map polarity to mark tone */
function polarityToTone(polarity: string): 'gain' | 'loss' | 'info' {
  if (polarity === 'gain') return 'gain';
  if (polarity === 'loss') return 'loss';
  return 'info';
}

/** Glyph for non-attachment change kinds */
const KIND_GLYPHS: Record<string, string> = {
  future_hook: '◇',
  reputation: '◈',
  reputation_tally: '◈',
  faction_reputation: '◈',
  growth: '↑',
  shell_state: '⬡',
};

/**
 * Resolve the authored aftermath variant from the template's aftermathConfig,
 * bypassing the engine-merged summary.changes which includes raw mechanical deltas.
 */
function resolveAuthoredAftermath(
  config: BranchAwareAftermathConfig,
  choiceHistory?: readonly { stepIndex: number; choiceId: string }[],
): AftermathVariant {
  const branchChoice = choiceHistory?.find(c => c.stepIndex === config.branchOnStep);
  if (!branchChoice) return config.fallback;
  return config.variants[branchChoice.choiceId] ?? config.fallback;
}

function buildAftermath(
  args: BuildUnifiedEncounterStageModelArgs,
): EncounterStageModel['aftermath'] {
  const { activeAction, template, graph } = args;
  const summary = activeAction.aftermathSummary;
  if (!summary) return undefined;

  // When the template has an aftermathConfig, use ONLY its authored changes.
  // The engine-merged summary.changes includes raw mechanical deltas (growth,
  // reputation shifts) that we want to suppress in favor of curated content.
  const authoredVariant = template.aftermathConfig
    ? resolveAuthoredAftermath(template.aftermathConfig, activeAction.choiceHistory)
    : undefined;
  const displayChanges = authoredVariant?.changes ?? summary.changes;
  const displayOverview = authoredVariant?.overview ?? summary.overview;

  // Build actor name → support binding lookup from support bundle
  const bindings = activeAction.supportBindings ?? [];
  const actorNameToBinding = new Map<string, EncounterSupportBinding>();
  const actorNameToSpec = new Map<string, EncounterSupportActorSpec>();
  if (template.supportBundle) {
    for (const spec of template.supportBundle) {
      if (spec.kind !== 'actor') continue;
      const actorSpec = spec as EncounterSupportActorSpec;
      const binding = bindings.find(b => b.key === spec.key);
      if (!binding) continue;
      const node = graph.getNode(binding.nodeId);
      const name = node?.name ?? actorSpec.spawnName ?? spec.key;
      actorNameToBinding.set(name, binding);
      actorNameToBinding.set(name.toLowerCase(), binding);
      actorNameToSpec.set(name, actorSpec);
      actorNameToSpec.set(name.toLowerCase(), actorSpec);
      if (actorSpec.spawnName && actorSpec.spawnName !== name) {
        actorNameToBinding.set(actorSpec.spawnName, binding);
        actorNameToBinding.set(actorSpec.spawnName.toLowerCase(), binding);
        actorNameToSpec.set(actorSpec.spawnName, actorSpec);
        actorNameToSpec.set(actorSpec.spawnName.toLowerCase(), actorSpec);
      }
    }
  }

  // Group authored changes into actor moments and highlights
  const actorMoments = new Map<string, EncounterStageAftermathActorModel>();
  const highlights: EncounterStageAftermathHighlightModel[] = [];

  for (const change of displayChanges) {
    // Check if this change's title matches an actor name
    const binding = actorNameToBinding.get(change.title) ?? actorNameToBinding.get(change.title.toLowerCase());

    if (binding && change.kind === 'reputation') {
      // Actor-centered change — group under actor moment
      const key = binding.nodeId;
      if (!actorMoments.has(key)) {
        const node = graph.getNode(binding.nodeId);
        const archetypeId = node?.properties?.narrativeArchetype as string | undefined;
        actorMoments.set(key, {
          id: key,
          actorName: change.title,
          portraitUrl: getPortraitUrl(archetypeId),
          summaryLines: [],
          marks: [],
        });
      }
      const moment = actorMoments.get(key)!;
      moment.summaryLines.push(change.detail);

      // Add a mark with icon glyph
      moment.marks!.push({
        id: change.id,
        label: change.polarity === 'gain' ? 'Favorable' : change.polarity === 'loss' ? 'Damaged' : 'Changed',
        iconGlyph: KIND_GLYPHS[change.kind] ?? '◈',
        tone: polarityToTone(change.polarity),
      });
    } else if (change.kind === 'future_hook') {
      // Future hook — highlight
      highlights.push({
        id: change.id,
        title: change.title,
        detail: change.detail,
        tone: change.polarity === 'gain' ? 'gain' : change.polarity === 'loss' ? 'loss' : 'info',
      });
    } else if (change.kind === 'item' || change.kind === 'reputation_tally') {
      // Trait/condition — try to find actor, add as mark
      // Fall through to highlight if no actor match
      highlights.push({
        id: change.id,
        title: change.title,
        detail: change.detail,
        tone: change.polarity === 'gain' ? 'gain' : change.polarity === 'loss' ? 'loss' : 'mixed',
      });
    } else {
      // Other changes — highlight
      highlights.push({
        id: change.id,
        title: change.title,
        detail: change.detail,
        tone: change.polarity === 'gain' ? 'gain' : change.polarity === 'loss' ? 'loss' : 'info',
      });
    }
  }

  const displayReactions = authoredVariant?.reactions ?? summary.reactions;
  const reactions: EncounterStageAftermathReactionModel[] | undefined = displayReactions?.map(
    (reaction) => ({
      id: reaction.id,
      label: reaction.label,
      intent: reaction.intent,
    }),
  );

  const actorMomentArray = Array.from(actorMoments.values());

  return {
    title: 'Aftermath',
    overview: displayOverview,
    // Use actorMoments + highlights instead of raw changes — suppresses mechanical deltas
    actorMoments: actorMomentArray.length > 0 ? actorMomentArray : undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
    reactionPrompt: authoredVariant?.reactionPrompt ?? summary.reactionPrompt,
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
  // Show illustration at step 0 only (opening scene), not during aftermath
  const isAftermath = args.activeAction.resolved;
  const isOpeningStep = args.activeAction.currentStep === 0;
  const illustration = !isAftermath && isOpeningStep && args.template.illustrationUrl
    ? {
        src: args.template.illustrationUrl,
        alt: args.template.illustrationAlt ?? `Scene from ${args.template.name}`,
        caption: 'Some encounters arrive with a remembered image already clinging to them.',
      }
    : undefined;

  return {
    header: buildHeader(args),
    illustration,
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
