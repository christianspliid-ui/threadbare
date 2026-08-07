/**
 * buildSimpleEncounterStageModel
 *
 * Adapter for legacy encounters that TieredEncounterModal handled directly.
 * Converts raw encounter data (notification + template + graph) into
 * EncounterStageModel so EncounterVeil can render them.
 *
 * Prose enrichment logic ported from TieredEncounterModal lines 699-722.
 */

import type { ActionStep, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { isActionStepBranch, isStepSuccess } from '../../../../types/unifiedAction';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import type { ActiveEncounterDisplay } from '../../encounterNotificationRuntime';
import type { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { EncounterResolutionSnapshot } from '../../../../types/encounter';
import type { ThreadTier } from '../types';
import type {
  EncounterStageModel,
  EncounterStageChoiceModel,
  EncounterStageHistoryModel,
  EncounterStageNarrativeParagraph,
  EncounterStageResolutionCheckModel,
} from '../types';
import { enrichProse, gatherNarrativeContext } from '../../../../engine/proseEnrichment';
import type { NarrativeContext } from '../../../../engine/proseEnrichment';
import { computeCapability } from '../../../../engine/domainCapability';
import { computeResolutionModifiers } from '../../../../engine/resolutionModifiers';
import { forecastAction } from '../../../../engine/resolutionService';
import { RARITY_TO_THREAT } from '../../../../engine/encounterCache';
import { stepOutcomeToOutcomeBand, stepOutcomeWord } from '../../../../data/outcome-band-content';
import { getAgentPortraitUrlFromProperties } from '../../../../data/portrait-assets';
import type { RarityTier } from '../../../../types/rarity';

// ── Types ────────────────────────────────────────────────

export interface BuildSimpleEncounterStageModelArgs {
  notification: EncounterNotification;
  encounter: ActiveEncounterDisplay;
  template: UnifiedActionTemplate;
  agentName: string;
  agentId: string;
  graph: WorldGraph;
  threadTier: ThreadTier;
  essence: number;
  tick: number;
  /** GameState for intelligence consumption (THR-113). When omitted, `{intel:*}`
   * placeholders silently strip. */
  gameState?: GameState;
  /** Effective rarity tier after Focus buff was applied (THR-416). */
  effectiveRarityTier?: RarityTier;
}

// ── Prose depth ──────────────────────────────────────────

function proseDepthForTier(tier: ThreadTier): 'full' | 'medium' | 'peek' {
  switch (tier) {
    case 'strong': return 'full';
    case 'light': return 'medium';
    case 'watched': return 'peek';
  }
}

function buildProseParagraphs(
  enriched: string,
  depth: 'full' | 'medium' | 'peek',
): string[] {
  const parts = enriched.split(/\n\n+/).filter(Boolean);
  switch (depth) {
    case 'full': return parts.length > 0 ? parts : [enriched];
    case 'medium': return parts.length > 1 ? parts.slice(0, 2) : [enriched];
    case 'peek': {
      const first = parts[0] ?? enriched;
      const sentences = first.split('.').filter(Boolean);
      const truncated = sentences.slice(0, 2).join('.').trimEnd();
      return [truncated.endsWith('.') ? truncated : truncated + '.'];
    }
  }
}

function titleCaseWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatOutcomeLabel(raw: string): string {
  return raw
    .split('_')
    .map(titleCaseWord)
    .join(' ');
}

function formatForecastLabel(raw: string): string {
  return titleCaseWord(raw);
}

/**
 * Flatten the step at `index` to a concrete definition.
 *
 * The fallback path has no `choiceHistory` to resolve a branch with, so a
 * branching step reads through its declared fallback — the same reading
 * `buildCurrentResolutionCheck` has always used, lifted out so the header and
 * the history rows cannot disagree with it.
 */
function stepAt(template: UnifiedActionTemplate, index: number): ActionStep | undefined {
  const stepOrBranch = template.steps[index];
  if (!stepOrBranch) return undefined;
  return isActionStepBranch(stepOrBranch) ? stepOrBranch.fallback : stepOrBranch;
}

/**
 * Label for wherever the focal agent currently stands (THR-994).
 *
 * The unified adapter resolves this from its action's `targetId`; the fallback
 * path has no action, so the agent's own `located_at` edge is the equivalent
 * anchor. Returns `''` rather than a placeholder when nothing resolves —
 * `ContextStrip` hides the element on an empty string and rejects the literal
 * 'Unknown Location' by name, so an honest gap is both the truthful and the
 * better-rendering answer.
 */
function resolveAgentLocationLabel(graph: WorldGraph, agentId: string): string {
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locEdges.length === 0) return '';
  return graph.getNode(locEdges[0].target)?.name ?? '';
}

function buildCurrentResolutionCheck(
  graph: WorldGraph,
  agentId: string,
  template: UnifiedActionTemplate,
  currentStepIndex: number,
): EncounterStageResolutionCheckModel | undefined {
  const currentStep = stepAt(template, currentStepIndex);
  if (!currentStep) return undefined;
  const stepLabel = `Step ${currentStepIndex + 1}`;

  const capability = computeCapability(graph, agentId, currentStep.reach);
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  const locationId = locEdges.length > 0 ? locEdges[0].target : '';
  const modifiers = computeResolutionModifiers(
    graph,
    agentId,
    locationId,
    currentStep.reach,
    template.sphereAffinity,
  );
  const summary = forecastAction({
    actorId: agentId,
    domain: currentStep.reach,
    capability,
    difficulty: currentStep.difficulty,
    sphereFactor: 0,
    actionModifiers: modifiers.totalModifier,
    testShapers: modifiers.testShapers,
  });

  return {
    id: `current:step-${currentStepIndex}`,
    stepId: `step-${currentStepIndex}`,
    stepLabel,
    state: 'pending',
    reach: currentStep.reach,
    reachLabel: titleCaseWord(currentStep.reach),
    difficulty: currentStep.difficulty,
    difficultyLabel: `${Math.round(currentStep.difficulty * 100)}/100`,
    capability,
    modifierTotal: modifiers.totalModifier,
    probability: summary.successProbability,
    threshold: summary.threshold,
    forecastLabel: formatForecastLabel(summary.forecastTier),
  };
}

function buildResolvedResolutionChecks(
  encounter: ActiveEncounterDisplay,
  template: UnifiedActionTemplate,
): EncounterStageResolutionCheckModel[] {
  return (encounter.resolutionHistory ?? []).map((entry) => ({
    id: `resolved:${entry.stepIndex}:${entry.stepId}:${entry.tick}`,
    stepId: entry.stepId,
    stepLabel: entry.stepName || `Step ${entry.stepIndex + 1}`,
    state: 'resolved',
    reach: entry.reach,
    reachLabel: titleCaseWord(entry.reach),
    difficulty: entry.difficulty,
    difficultyLabel: `${entry.difficulty}/100`,
    capability: entry.capability,
    modifierTotal: entry.modifierTotal,
    probability: entry.probability,
    threshold: entry.threshold,
    roll: entry.roll,
    margin: entry.rollBreakdown?.margin,
    outcomeLabel: formatOutcomeLabel(entry.outcomeType),
    nearMiss: entry.rollBreakdown?.nearMiss,
    critLabel: entry.rollBreakdown?.critClassification && entry.rollBreakdown.critClassification !== 'none'
      ? formatOutcomeLabel(entry.rollBreakdown.critClassification)
      : undefined,
  }));
}

/**
 * Step-navigator rows, including the replay record for each resolved step (THR-994).
 *
 * Until this filled them in, every row carried nothing but a status, so clicking
 * a resolved dot entered replay over an empty body — the navigator worked and
 * had nothing to show. There is no frozen `stepProseHistory` on this path (that
 * record belongs to a live `UnifiedAction`), so the replay text is the step's
 * own authored prose re-enriched under that step's outcome band. That is the
 * documented fallback the unified adapter already uses when a record is absent.
 */
function buildHistory(
  template: UnifiedActionTemplate,
  encounter: ActiveEncounterDisplay,
  ctx: NarrativeContext,
  currentIndex: number,
  isEncounterFinished: boolean,
): EncounterStageHistoryModel[] {
  const snapshotByIndex = new Map<number, EncounterResolutionSnapshot>(
    (encounter.resolutionHistory ?? []).map((entry) => [entry.stepIndex, entry]),
  );

  return template.steps.map((_step, i) => {
    const status = i < currentIndex ? 'resolved' as const
      : i === currentIndex ? (isEncounterFinished ? 'resolved' as const : 'current' as const)
      : 'future' as const;

    const entry: EncounterStageHistoryModel = {
      stepId: snapshotByIndex.get(i)?.stepId ?? `step-${i}`,
      stepLabel: snapshotByIndex.get(i)?.stepName || `Step ${i + 1}`,
      status,
    };
    if (status !== 'resolved') return entry;

    // Outcome, preferring the resolution snapshot and falling back to the
    // coarser success flag the display record always carries.
    const snapshot = snapshotByIndex.get(i);
    const success = snapshot ? isStepSuccess(snapshot.outcomeType) : encounter.history[i]?.success;
    if (success === undefined) return entry;

    const step = stepAt(template, i);
    const outcome = snapshot?.outcomeType;
    const stepCtx = outcome ? { ...ctx, outcomeBand: stepOutcomeToOutcomeBand(outcome) } : ctx;
    const rawAfterimage = success
      ? (step?.successAfterimage ?? 'Succeeded')
      : (step?.failureAfterimage ?? 'Failed');

    return {
      ...entry,
      outcome,
      outcomeWord: outcome ? stepOutcomeWord(outcome) : undefined,
      reachLabel: step ? titleCaseWord(step.reach) : undefined,
      afterimage: enrichProse(rawAfterimage, stepCtx),
      replayNarrative: step?.narrativeTemplate
        ? enrichProse(step.narrativeTemplate, stepCtx)
        : undefined,
    };
  });
}

// ── Main adapter ─────────────────────────────────────────

export function buildSimpleEncounterStageModel(
  args: BuildSimpleEncounterStageModelArgs,
): EncounterStageModel {
  const { notification, encounter, template, agentId, graph, threadTier, essence, effectiveRarityTier } = args;

  const currentIndex = Math.min(encounter.currentStepIndex, template.steps.length - 1);
  const isEncounterFinished = encounter.status === 'completed' || encounter.status === 'abandoned';
  const narrativeCtx = gatherNarrativeContext(
    graph,
    agentId,
    undefined,
    undefined,
    null,
    args.gameState,
    args.tick,
    {
      // THR-932 — same threading gap as the unified adapter: without the template's
      // fragment tables, `{frag:*}` in this surface's prose resolves to nothing. The
      // enricher only enters that branch when a token is present, so this is a no-op
      // for every template that declares no fragments.
      contextFragments: template.contextFragments,
      contextFragmentTemplateId: template.id,
    },
  );
  const depth = proseDepthForTier(threadTier);

  // ── Prose enrichment ──
  const rawNarrative = notification.prose;
  const enriched = enrichProse(rawNarrative, narrativeCtx);
  const proseTexts = buildProseParagraphs(enriched, depth);

  // ── Narrative paragraphs ──
  const paragraphs: EncounterStageNarrativeParagraph[] = proseTexts.map((text, i) => ({
    id: `p-${i}`,
    segments: [{ text, emphasis: 'default' as const }],
  }));

  // ── Choices ──
  const choices: EncounterStageChoiceModel[] = notification.choices.map(c => ({
    id: c.id,
    label: c.text,
    intent: c.text,
    essenceCost: c.essenceCost,
    affordable: c.essenceCost <= essence,
    costLabel: c.essenceCost > 0 ? `${c.essenceCost.toFixed(2)} essence` : undefined,
    interventionType: c.interventionType,
    godVoice: c.godVoice,
    probabilityBoost: c.probabilityBoost,
  }));

  // ── History ──
  const history = buildHistory(template, encounter, narrativeCtx, currentIndex, isEncounterFinished);
  const previousChecks = buildResolvedResolutionChecks(encounter, template);
  const currentCheck = isEncounterFinished
    ? undefined
    : buildCurrentResolutionCheck(graph, agentId, template, currentIndex);

  // ── Illustration ──
  const illustration = template.illustrationUrl
    ? {
        src: template.illustrationUrl,
        alt: template.illustrationAlt ?? `Scene from ${template.name}`,
      }
    : undefined;

  // ── Context strip (THR-994) ──
  // THR-636's strip gates every element on these fields, and this adapter
  // supplied none of them — so the fallback path, which is what a normal
  // threaded encounter lands on once its unified action has been reaped,
  // rendered the strip as a zero-height box with no children. Each field below
  // is read from data the adapter already receives; nothing new is threaded in.
  const currentStep = stepAt(template, currentIndex);
  const focalName = args.agentName || notification.agentName;

  return {
    header: {
      title: template.name,
      locationLabel: resolveAgentLocationLabel(graph, agentId),
      threatLabel: RARITY_TO_THREAT[effectiveRarityTier ?? template.rarityTier] ?? 'moderate',
      threadTier,
      agentName: focalName,
      familyLabel: focalName,
      focalActorId: agentId,
      portraitUrl: getAgentPortraitUrlFromProperties(graph.getNode(agentId)?.properties),
      hexCol: notification.hexCol,
      hexRow: notification.hexRow,
      reachLabel: currentStep ? titleCaseWord(currentStep.reach) : undefined,
    },
    illustration,
    scene: {
      situationProse: enriched,
      pressureProse: '',
      noticeLines: [],
    },
    narrative: {
      paragraphs,
      references: [],
    },
    cast: [],
    factions: [],
    signals: [],
    choices,
    falloutPreview: [],
    history,
    resourceSummary: { quintessence: essence },
    resolutionReadout: {
      heading: 'Resolution Readout',
      current: currentCheck,
      previous: previousChecks,
    },
  };
}
