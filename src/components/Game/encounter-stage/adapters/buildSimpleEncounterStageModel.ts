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
} from '../types';
import { enrichProse, gatherNarrativeContext } from '../../../../engine/proseEnrichment';
import { resolveEncounterNarrative } from '../../../../data/encounter-content';

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

// ── Main adapter ─────────────────────────────────────────

export function buildSimpleEncounterStageModel(
  args: BuildSimpleEncounterStageModelArgs,
): EncounterStageModel {
  const { notification, encounter, template, agentName, agentId, graph, threadTier, essence } = args;

  const currentIndex = Math.min(encounter.currentStepIndex, template.steps.length - 1);
  const currentStep = template.steps[currentIndex];
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
      : i === currentIndex ? 'current' as const
      : 'future' as const,
  }));

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
  };
}
