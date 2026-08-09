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
import type { GameState } from '../../../../types/gameState';
import { enrichProse, gatherNarrativeContext } from '../../../../engine/proseEnrichment';
import type { NarrativeContext } from '../../../../engine/proseEnrichment';
import type { SimulationRuntime } from '../../../../engine/simulationRuntime';
import { stepOutcomeToOutcomeBand, stepOutcomeWord } from '../../../../data/outcome-band-content';
import { autoLinkNarrative, collectSupportBundleEntities } from '../narrativeLinker';
import { buildAftermathConsequences } from './buildAftermathConsequences';
import { resolveEntityVisual } from '../../../shared/entityVisualResolver';
import { getFamiliarity, getKnowledgeLevel } from '../../../../engine/familiarity';
import { supportRoleWord } from '../../../../engine/supportRoleWords';
import { buildNudgePhaseModel } from './buildNudgePhaseModel';
import { resolveStepDefinition } from '../../../../engine/unifiedActionLifecycle';
import {
  getAgentPortraitUrlFromProperties,
  getPortraitUrl,
} from '../../../../data/portrait-assets';
import { getAttachmentGlyph } from '../../attachmentGlyphs';
import type {
  EncounterChoiceMemory,
  EncounterSupportActorSpec,
  EncounterSupportBinding,
} from '../../../../types/encounter';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import type { StepProseRecord } from '../../../../types/stepProseRecord';
import {
  afterimageForOutcome,
  isActionStepBranch,
  isStepSuccess,
  resolveAftermathVariant,
  type ActionStep,
  type AftermathVariant,
  type BranchAwareAftermathConfig,
  type EncounterAftermathChange,
  type UnifiedAction,
  type UnifiedActionOutcome,
  type UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import type { ThreadTier } from '../types';
import type { DoomIdentityMatrix } from '../../../../types/doomIdentity';
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
  /** Optional doom identity matrix for prose vocabulary enrichment (THR-21) */
  doomIdentityMatrix?: DoomIdentityMatrix | null;
  /** GameState for intelligence consumption (THR-113). When omitted, `{intel:*}`
   * placeholders silently strip. */
  gameState?: GameState;
  /** Current tick — paired with `gameState` for intelligence trace emission. */
  tick?: number;
  /** SimulationRuntime for outcome-band phrase dedup history (THR-460).
   * When omitted, {outcome_phrase} / {q_flavor} use pool[0] deterministically. */
  runtime?: SimulationRuntime;
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

/** Last-resort opening line when a template carries neither template-level nor
 *  step-level prose. Named rather than inlined so the fallback copy is tunable
 *  in one place (NFP #1) instead of drifting across four call sites. */
const MISSING_INITIATION_PROSE = 'The moment arrives.';

/**
 * The template's opening prose, fail-soft (THR-1040).
 *
 * `narrativeTemplates` is declared *required* on `UnifiedActionTemplate`, but
 * the 15 `mc.*` mercenary templates omit it and type-check anyway only because
 * of the red baseline (THR-489). Reading `.initiation` off it unguarded threw
 * during render, so those encounters could never be driven to the aftermath
 * THR-1038 authored for them — a crash, not a degradation, which NFP #4
 * forbids.
 *
 * The fallback order is honest rather than merely non-throwing: these templates
 * *do* carry prose, on their steps, so the step's own `narrativeTemplate` is
 * the right second choice and the constant above is reached only by a template
 * carrying no prose at all.
 */
function resolveInitiationProse(
  template: UnifiedActionTemplate,
  currentStep: ActionStep | undefined,
): string {
  // `steps[0]` is an `ActionStepOrBranch` — a branch carries no prose of its
  // own, hence the `in` narrowing rather than a bare optional chain.
  const firstStep = template.steps?.[0];
  const firstStepProse =
    firstStep && 'narrativeTemplate' in firstStep ? firstStep.narrativeTemplate : undefined;

  return (
    template.narrativeTemplates?.initiation ??
    currentStep?.narrativeTemplate ??
    firstStepProse ??
    MISSING_INITIATION_PROSE
  );
}

// ─── Section Builders ─────────────────────────────────────────────

/** Plain keyword label for a reach domain (e.g. 'shadow' → 'Shadow'). */
function reachLabelFor(reach: string): string {
  return reach.length > 0 ? reach.charAt(0).toUpperCase() + reach.slice(1) : reach;
}

function buildHeader(
  args: BuildUnifiedEncounterStageModelArgs,
  ctx: NarrativeContext,
): EncounterStageModel['header'] {
  const { template, activeAction, agentName, threadTier, graph, notification } = args;
  const currentStep = getCurrentStep(template, activeAction);
  const rawSubtitle = template.description ?? resolveInitiationProse(template, currentStep);

  // Portrait for the focal agent — same resolution the aftermath actor-moments use.
  //
  // THR-972: this read `getPortraitUrl(narrativeArchetype)`, which covers only the
  // generic archetype registry. An agent carrying a bespoke `portraitAssetPath`
  // — every meeting-generated mortal, The First included — resolved to null and
  // fell to a gradient tile, which is what made the test panel's portrait slot
  // read as an unfilled placeholder rather than as the acting agent. The helper
  // below is the superset the resolver itself uses: bespoke path first, archetype
  // second, null only when the agent genuinely has neither.
  const actorNode = graph.getNode(activeAction.actorId);

  return {
    title: template.name,
    subtitle: enrichProse(rawSubtitle, ctx),
    locationLabel: resolveLocationLabel(graph, activeAction.targetId),
    threatLabel: difficultyToThreatLabel(currentStep.difficulty),
    threadTier,
    familyLabel: agentName,
    agentName,
    focalActorId: activeAction.actorId,
    portraitUrl: getAgentPortraitUrlFromProperties(actorNode?.properties),
    hexCol: notification.hexCol,
    hexRow: notification.hexRow,
    reachLabel: reachLabelFor(currentStep.reach),
  };
}

function buildScene(
  args: BuildUnifiedEncounterStageModelArgs,
  ctx: NarrativeContext,
): EncounterStageModel['scene'] {
  const { template, activeAction } = args;
  const currentStep = getCurrentStep(template, activeAction);

  return {
    situationProse: enrichProse(resolveInitiationProse(template, currentStep), ctx),
    pressureProse: enrichProse(currentStep.narrativeTemplate ?? '', ctx),
    noticeLines: [],
  };
}

function buildNarrative(
  args: BuildUnifiedEncounterStageModelArgs,
  ctx: NarrativeContext,
): EncounterStageModel['narrative'] {
  const { template, activeAction, graph } = args;
  const currentStep = getCurrentStep(template, activeAction);
  const rawSource = currentStep.narrativeTemplate ?? resolveInitiationProse(template, currentStep);
  const proseSource = enrichProse(rawSource, ctx);

  // Collect linkable entities from the support bundle plus the scene target (THR-696).
  // Runs even for a bundle-less template, because the target link does not depend on one.
  const bindings = activeAction.supportBindings ?? [];
  const { linkEntries, references } = collectSupportBundleEntities(
    graph,
    template.supportBundle ?? [],
    bindings,
    activeAction.targetId,
  );

  // Split prose into paragraphs and auto-link entity names
  const rawParagraphs = proseSource.split('\n\n').filter(Boolean);
  const paragraphs = rawParagraphs.map((text, index) =>
    autoLinkNarrative(`para-${index}`, text.trim(), linkEntries),
  );

  // Ensure at least one paragraph
  if (paragraphs.length === 0) {
    paragraphs.push(
      autoLinkNarrative('para-0', enrichProse(resolveInitiationProse(template, currentStep), ctx), linkEntries),
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
  const { template, activeAction, graph, gameState } = args;
  if (!template.supportBundle) return [];

  const bindings = activeAction.supportBindings ?? [];

  return template.supportBundle
    .filter((spec): spec is EncounterSupportActorSpec => spec.kind === 'actor')
    .map((spec) => {
      const binding = bindings.find(b => b.key === spec.key);
      // `spawnName` is optional on the spec, so the placeholder key is the last
      // resort — a chip with no name at all would be worse than one wearing the
      // author's binding key (NFP #4).
      const specName = spec.spawnName ?? spec.key;
      const resolvedName = binding
        ? getNodeName(graph, binding.nodeId, specName)
        : specName;

      const role: EncounterCastRole = mapSupportRoleToCastRole(spec.supportRole);

      // THR-1041: resolve the chip's art here, where the graph and the
      // familiarity map are both in hand. Same call the aftermath's actor
      // moments make, plus the knowledge gate — a scene actor the ascendant has
      // never met shows the authored fallback tile, not their face (Law 8).
      // No gameState ⇒ no gate ⇒ the resolver fails open, which is the
      // documented behaviour and keeps graph-free callers (tests, styleguide)
      // rendering art rather than nothing.
      let portraitUrl: string | undefined;
      if (binding?.nodeId) {
        const descriptor = resolveEntityVisual(
          { id: binding.nodeId, kind: 'agent', name: resolvedName },
          graph,
          gameState
            ? { knowledgeLevel: getKnowledgeLevel(getFamiliarity(gameState.familiarityMap, binding.nodeId)) }
            : undefined,
        );
        portraitUrl = descriptor.src;
      }

      return {
        id: spec.key,
        name: resolvedName,
        role,
        // Law 14: `supportRole` is an authoring key (`mct_ledger_clerk`).
        // Banded here at the source rather than at the surface, so any future
        // consumer of the cast model gets the player-facing form too.
        roleLabel: supportRoleWord(spec.supportRole),
        reused: binding?.reused ?? false,
        nodeId: binding?.nodeId,
        portraitUrl,
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
  ctx: NarrativeContext,
): EncounterStageChoiceModel[] {
  const { template, activeAction, notification, essence } = args;

  // Check for authored choices on the template for the current step
  const authoredForStep = template.authoredChoices?.[activeAction.currentStep];

  if (authoredForStep && authoredForStep.length > 0) {
    // Use authored choice cards with full prose bodies
    return authoredForStep.map((card) => ({
      id: card.id,
      label: enrichProse(card.label, ctx),
      intent: enrichProse(card.intent, ctx),
      targetLabel: card.targetLabel,
      essenceCost: card.essenceCost,
      affordable: essence + 1e-9 >= card.essenceCost,
      costLabel: card.essenceCost > 0 ? `${card.essenceCost.toFixed(2)} essence` : undefined,
      likelyBurden: card.likelyBurden != null ? enrichProse(card.likelyBurden, ctx) : undefined,
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
  ctx: NarrativeContext,
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
    let complication: { prose: string; name: string; severity: 'minor' | 'standard' | 'severe'; category: string } | undefined;
    // THR-636 replay fields
    let outcome: import('../../../../types/unifiedAction').StepOutcome | undefined;
    let outcomeWord: string | undefined;
    let reachLabel: string | undefined;
    let replayNarrative: string | undefined;
    let choiceText: string | undefined;
    if (isResolved) {
      outcome = activeAction.stepOutcomes[index];
      const success = isStepSuccess(outcome);
      // Use authored afterimage text if available, otherwise fall back to bare status
      const resolvedStep = resolveStepDefinition(template, index, activeAction.choiceHistory);
      // THR-1041: resolve the band the step actually landed on, not just
      // success-vs-failure. A `critical_failure` afterimage an author wrote was
      // reaching the chapter ledger and never reaching Scene So Far, because
      // this line asked a coarser question than `chapterArchive` did. Both now
      // call the same helper; the bare words stay as the last resort for a step
      // that authored no prose at all (NFP #4 — never blank).
      const rawAfterimage =
        (outcome !== undefined ? afterimageForOutcome(resolvedStep, outcome) : undefined)
        ?? (success ? 'Succeeded' : 'Failed');
      // Spread ctx to inject per-step outcomeBand without mutating the shared context (THR-460)
      const stepCtx = { ...ctx, outcomeBand: stepOutcomeToOutcomeBand(outcome) };
      afterimage = enrichProse(rawAfterimage, stepCtx, { runtime: args.runtime });

      // Attach complication prose if a complication fired on this step (THR-20)
      const complicationSlot = activeAction.stepComplications?.[index];
      if (complicationSlot) {
        complication = {
          prose: complicationSlot.prose,
          name: complicationSlot.name,
          severity: complicationSlot.severity,
          category: complicationSlot.category,
        };
      }

      // Prefer the frozen replay record captured at resolution (THR-636); fall back
      // to the re-rendered afterimage summary when no record exists (old saves,
      // legacy path, cap overflow) — never blank, never re-enriched-into-a-wrong-past.
      outcomeWord = stepOutcomeWord(outcome);
      reachLabel = reachLabelFor(resolvedStep.reach);
      const record = (activeAction.stepProseHistory as readonly StepProseRecord[] | undefined)?.find(
        (r) => r.index === index,
      );
      replayNarrative = record?.narrativeProse || undefined;
      choiceText = record?.choiceText
        ?? activeAction.choiceHistory?.find((c) => c.stepIndex === index)?.choiceText;
    }

    return {
      stepId: `step-${index}`,
      stepLabel,
      status: isResolved ? 'resolved' as const : isCurrent ? 'current' as const : 'future' as const,
      afterimage,
      complication,
      outcome,
      outcomeWord,
      reachLabel,
      replayNarrative,
      choiceText,
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
 *
 * Delegates to the shared resolver in `types/unifiedAction` (THR-969) so this
 * surface and the engine's aftermath assembly cannot disagree about which variant
 * — or which outcome band — an encounter ended on.
 */
function resolveAuthoredAftermath(
  config: BranchAwareAftermathConfig,
  choiceHistory?: readonly EncounterChoiceMemory[],
  outcome?: UnifiedActionOutcome,
): AftermathVariant {
  return resolveAftermathVariant(config, choiceHistory, outcome);
}

/**
 * Structured identity of the game concepts a change declares (THR-1004).
 *
 * Deliberately never the English of `detail` — two sentences can state the same
 * fact in different words, and prose-matching would both miss those and collide
 * on unrelated changes that happen to share a phrase.
 */
function aftermathConceptKeys(change: EncounterAftermathChange): Set<string> {
  const keys = new Set<string>();
  for (const concept of change.concepts ?? []) {
    keys.add((concept.entityId ?? concept.tooltipId ?? concept.text).toLowerCase());
  }
  return keys;
}

/**
 * THR-1042 — an authored variant overrides the *prose*, it never erases the *facts*.
 *
 * The engine already assembles `summary.changes` as `[...engine-derived, ...authored]`
 * (`unifiedActionResolution.ts`), so a prize the reward pool actually rolled, a growth
 * shift, or a reputation move is on the summary the moment it happened. This surface
 * used to replace that whole set with the authored variant's changes alone, which
 * dropped every derived fact: the world changed and the ending did not say so.
 *
 * The merge keeps every fact and still lets the author lead:
 *   - authored changes first (the curated statement), derived facts beneath them;
 *   - identical ids collapse, so the engine's own merge is not double-counted — and a
 *     summary that never went through it (old save, non-engine path) still gains the
 *     authored half rather than losing it;
 *   - a derived change is suppressed only when an authored change *declares* the same
 *     concepts. Authored changes normally carry none, so this fires rarely and by
 *     design (NFP #4): stating a fact twice is recoverable, hiding it is the defect.
 */
function mergeAftermathChanges(
  summaryChanges: readonly EncounterAftermathChange[],
  authoredChanges: readonly EncounterAftermathChange[],
): readonly EncounterAftermathChange[] {
  const authoredIds = new Set(authoredChanges.map(change => change.id));
  const authoredConceptSets = authoredChanges
    .map(aftermathConceptKeys)
    .filter(keys => keys.size > 0);

  const derived = summaryChanges.filter(change => {
    // Already present as an authored entry — the engine merged it in for us.
    if (authoredIds.has(change.id)) return false;
    const keys = aftermathConceptKeys(change);
    // Nothing structured to match on: keep it. Never fall back to prose-matching.
    if (keys.size === 0) return true;
    return !authoredConceptSets.some(authored =>
      Array.from(keys).every(key => authored.has(key)),
    );
  });

  return [...authoredChanges, ...derived];
}

function buildAftermath(
  args: BuildUnifiedEncounterStageModelArgs,
  ctx: NarrativeContext,
): EncounterStageModel['aftermath'] {
  const { activeAction, template, graph } = args;
  const summary = activeAction.aftermathSummary;
  if (!summary) return undefined;

  // When the template has an aftermathConfig, the authored variant supplies the
  // curated prose — but the engine-derived changes stay (THR-1042). See
  // `mergeAftermathChanges` for why suppressing them was the defect.
  const authoredVariant = template.aftermathConfig
    ? resolveAuthoredAftermath(
        template.aftermathConfig,
        activeAction.choiceHistory,
        activeAction.outcome,
      )
    : undefined;
  const displayChanges = authoredVariant
    ? mergeAftermathChanges(summary.changes, authoredVariant.changes)
    : summary.changes;
  const rawOverview = authoredVariant?.overview ?? summary.overview;
  const displayOverview = enrichProse(rawOverview, ctx);

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
    const enrichedDetail = enrichProse(change.detail, ctx);
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
      moment.summaryLines.push(enrichedDetail);

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
        detail: enrichedDetail,
        tone: change.polarity === 'gain' ? 'gain' : change.polarity === 'loss' ? 'loss' : 'info',
      });
    } else if (change.kind === 'item' || change.kind === 'reputation_tally') {
      // Trait/condition — try to find actor, add as mark
      // Fall through to highlight if no actor match
      highlights.push({
        id: change.id,
        title: change.title,
        detail: enrichedDetail,
        tone: change.polarity === 'gain' ? 'gain' : change.polarity === 'loss' ? 'loss' : 'mixed',
      });
    } else {
      // Other changes — highlight
      highlights.push({
        id: change.id,
        title: change.title,
        detail: enrichedDetail,
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

  // THR-971 — the mockup's consequence chips. Built from the same authored
  // change set the highlights above use, plus the seeds the ending actually
  // plants (reachable only through the reaction effects). The stage renders
  // these instead of highlights/changes; both are kept on the model so a
  // consumer that has not adopted chips still gets the old shape.
  const { linkEntries: aftermathLinkEntries } = collectSupportBundleEntities(
    graph,
    template.supportBundle ?? [],
    bindings,
    activeAction.targetId,
  );
  const consequences = buildAftermathConsequences({
    changes: displayChanges,
    reactions: displayReactions,
    enrich: (text) => enrichProse(text, ctx),
    link: (id, text) => autoLinkNarrative(id, text, aftermathLinkEntries),
    // THR-1004 — the UI Law's image half. Resolved here because this is the
    // layer that holds the graph; the veil renders what comes out and stays
    // graph-free. A concept whose entity has no art resolves to the designed
    // fallback tile rather than nothing (NFP #4).
    resolveIcon: (concept) => {
      const kind = concept.visualKind;
      if (!kind) return undefined;
      const entityId = concept.entityId ?? concept.visualName ?? concept.text;
      const name = concept.visualName ?? concept.text;
      const descriptor = resolveEntityVisual({ id: entityId, kind, name }, graph);
      return { entityId, kind, name, src: descriptor.src };
    },
  });

  return {
    title: 'Aftermath',
    overview: displayOverview,
    // Use actorMoments + highlights instead of raw changes — suppresses mechanical deltas
    actorMoments: actorMomentArray.length > 0 ? actorMomentArray : undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
    consequences: consequences.length > 0 ? consequences : undefined,
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
  const { graph, activeAction } = args;

  // Build enrichment context once — shared by all section builders
  const ctx = gatherNarrativeContext(
    graph,
    activeAction.actorId,
    undefined,
    undefined,
    args.doomIdentityMatrix,
    args.gameState,
    args.tick,
    {
      targetId: activeAction.targetId, // THR-694 — name the scene's other party in prose
      // THR-696 — name the scene's cast. The bundle supplies the declared keys, the
      // action's bindings supply who each key actually resolved to.
      supportBundle: args.template.supportBundle,
      supportBindings: activeAction.supportBindings,
      // THR-932 — the attended stage never threaded these, so every `{frag:*}` token
      // in step prose stripped to an empty string here while the same template
      // rendered correctly on the resolution path (`unifiedActionResolution.ts`).
      // That is the second half of the missing-opening bug: compiling the envelope is
      // not enough if the surface that shows it cannot resolve the token.
      contextFragments: args.template.contextFragments,
      contextFragmentTemplateId: args.template.id,
    },
  );

  // Show illustration at step 0 only (opening scene), not during aftermath
  const isAftermath = activeAction.resolved;
  const isOpeningStep = activeAction.currentStep === 0;
  const illustration = !isAftermath && isOpeningStep && args.template.illustrationUrl
    ? {
        src: args.template.illustrationUrl,
        alt: args.template.illustrationAlt ?? `Scene from ${args.template.name}`,
        caption: 'Some encounters arrive with a remembered image already clinging to them.',
      }
    : undefined;

  // THR-775 — the nudge phase is present only when the *current* step carries an
  // authored hand. A template with `authoredChoices` and no hand gets
  // `undefined` here and keeps the legacy choice screen untouched, which is what
  // makes the rollout per-template and reversible (remove the nudges, get the
  // old screen back). Never built during aftermath: the hand is a pre-roll
  // surface, and offering it after the roll would be a lie.
  const nudgePhase = isAftermath
    ? undefined
    : buildNudgePhaseModel({
        template: args.template,
        activeAction,
        step: getCurrentStep(args.template, activeAction),
        graph,
        gameState: args.gameState,
        // THR-923 — hand the nudge adapter the context this builder already
        // gathered, so card fiction and factor lines resolve their placeholders
        // against the same actor/target/cast the header above them does, at no
        // extra traversal cost.
        narrativeContext: ctx,
        runtime: args.runtime,
      });

  return {
    header: buildHeader(args, ctx),
    illustration,
    scene: buildScene(args, ctx),
    narrative: buildNarrative(args, ctx),
    cast: buildCast(args),
    factions: [],
    signals: [],
    choices: buildChoices(args, ctx),
    falloutPreview: buildFalloutPreview(args),
    history: buildHistory(args, ctx),
    aftermath: buildAftermath(args, ctx),
    nudgePhase,
  };
}
