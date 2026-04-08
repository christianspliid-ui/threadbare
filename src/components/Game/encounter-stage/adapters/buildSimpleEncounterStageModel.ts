/**
 * buildSimpleEncounterStageModel
 *
 * Adapter for legacy encounters that TieredEncounterModal handled directly.
 * Converts raw encounter data (notification + template + graph) into
 * EncounterStageModel so EncounterVeil can render them.
 *
 * Prose enrichment logic ported from TieredEncounterModal lines 699-722.
 */

import type { EncounterTemplate } from '../../../../types/encounter';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import type { ActiveEncounterDisplay } from '../../encounterNotificationRuntime';
import type { WorldGraph } from '../../../../engine/graph';
import type { ThreadTier } from '../types';
import type {
  EncounterStageModel,
  EncounterStageChoiceModel,
  EncounterStageHistoryModel,
  EncounterStageNarrativeParagraph,
  EncounterStageResolutionCheckModel,
} from '../types';
import { enrichProse, gatherNarrativeContext } from '../../../../engine/proseEnrichment';
import { resolveEncounterNarrative } from '../../../../data/encounter-content';
import { computeCapability } from '../../../../engine/domainCapability';
import { computeResolutionModifiers } from '../../../../engine/resolutionModifiers';
import {
  forecastAction,
  normalizeLegacyDifficulty,
} from '../../../../engine/resolutionService';

// ── Types ────────────────────────────────────────────────

export interface BuildSimpleEncounterStageModelArgs {
  notification: EncounterNotification;
  encounter: ActiveEncounterDisplay;
  template: EncounterTemplate;
  agentName: string;
  agentId: string;
  graph: WorldGraph;
  threadTier: ThreadTier;
  essence: number;
  tick: number;
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

function buildCurrentResolutionCheck(
  graph: WorldGraph,
  agentId: string,
  template: EncounterTemplate,
  currentStepIndex: number,
): EncounterStageResolutionCheckModel | undefined {
  const currentStep = template.steps[currentStepIndex];
  if (!currentStep) return undefined;

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
  const normalizedDifficulty = normalizeLegacyDifficulty(currentStep.difficulty);
  const summary = forecastAction({
    actorId: agentId,
    domain: currentStep.reach,
    capability,
    difficulty: normalizedDifficulty,
    sphereFactor: 0,
    actionModifiers: modifiers.totalModifier,
    testShapers: modifiers.testShapers,
  });

  return {
    id: `current:${currentStep.id}`,
    stepId: currentStep.id,
    stepLabel: currentStep.name,
    state: 'pending',
    reach: currentStep.reach,
    reachLabel: titleCaseWord(currentStep.reach),
    difficulty: currentStep.difficulty,
    difficultyLabel: `${currentStep.difficulty}/100`,
    capability,
    modifierTotal: modifiers.totalModifier,
    probability: summary.successProbability,
    threshold: summary.threshold,
    forecastLabel: formatForecastLabel(summary.forecastTier),
  };
}

function buildResolvedResolutionChecks(
  encounter: ActiveEncounterDisplay,
  template: EncounterTemplate,
): EncounterStageResolutionCheckModel[] {
  return (encounter.resolutionHistory ?? []).map((entry) => ({
    id: `resolved:${entry.stepIndex}:${entry.stepId}:${entry.tick}`,
    stepId: entry.stepId,
    stepLabel: entry.stepName || template.steps[entry.stepIndex]?.name || entry.stepId,
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

// ── Main adapter ─────────────────────────────────────────

export function buildSimpleEncounterStageModel(
  args: BuildSimpleEncounterStageModelArgs,
): EncounterStageModel {
  const { notification, encounter, template, agentName, agentId, graph, threadTier, essence } = args;

  const currentIndex = Math.min(encounter.currentStepIndex, template.steps.length - 1);
  const currentStep = template.steps[currentIndex];
  const isEncounterFinished = encounter.status === 'completed' || encounter.status === 'abandoned';
  const narrativeCtx = gatherNarrativeContext(graph, agentId);
  const depth = proseDepthForTier(threadTier);

  // ── Prose enrichment (ported from TieredEncounterModal) ──
  const rawNarrative = currentStep
    ? resolveEncounterNarrative(currentStep.narrative, agentName, currentStep.id, template.threatRating)
    : notification.prose;
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
  const history: EncounterStageHistoryModel[] = template.steps.map((step, i) => ({
    stepId: step.id,
    stepLabel: step.name,
    status: i < currentIndex ? 'resolved' as const
      : i === currentIndex ? (isEncounterFinished ? 'resolved' as const : 'current' as const)
      : 'future' as const,
  }));
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

  return {
    header: {
      title: template.name,
      locationLabel: '',
      threatLabel: template.threatRating,
      threadTier,
    },
    illustration,
    scene: {
      situationProse: enriched,
      pressureProse: currentStep?.narrative ?? '',
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
