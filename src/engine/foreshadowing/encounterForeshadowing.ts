import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { BalanceEncounterPoolCandidate, BalanceEvent } from '../../types/balanceEval';
import type {
  EncounterForeshadowingVariantWhen,
  ForeshadowingIntelligenceTier,
  ForeshadowingInterventionAttribution,
  ForeshadowingInterventionKind,
  ForeshadowingResult,
  ForeshadowingSignals,
  ForeshadowingTopMotive,
} from '../../types/foreshadowing';
import type { ReachDomain } from '../../types/traits';
import { emitTrace } from '../traceBuffer';
import { gatherNarrativeContext, enrichProse } from '../proseEnrichment';
import type { WorldGraph } from '../graph';
import type { SimulationRuntime } from '../simulationRuntime';
import {
  FORESHADOWING_CACHE_MAX_ENTRIES,
  FORESHADOWING_MAX_SENTENCES,
  FORESHADOWING_MIN_SENTENCES,
  INTEL_TIER_BRIEFED_BELOW,
  INTEL_TIER_RUMOR_BELOW,
  INTEL_TIER_UNKNOWN_BELOW,
  INTERVENTION_ATTRIBUTION_WINDOW,
} from './constants';
import { GLOBAL_FORESHADOWING_FALLBACK_TEMPLATE } from './genericFallback';

const TOP_MOTIVE_PRIORITY: readonly ForeshadowingTopMotive[] = [
  'awareness',
  'visibility',
  'prereqs',
  'threat',
  'capability',
  'cooldown',
];

const REACH_DOMAINS: readonly ReachDomain[] = [
  'iron',
  'gold',
  'shadow',
  'veil',
  'heart',
  'eye',
  'stone',
  'star',
  'flesh',
];

const DEFAULT_FORESHADOWING_REACH: ReachDomain = 'eye';
const DEFAULT_SENTENCE_FILLER = 'The signs are incomplete, but the pull remains.';

type InterventionLikeRecord = {
  tick?: unknown;
  encounterId?: unknown;
  sphereUsed?: unknown;
  interventionType?: unknown;
  essenceSpent?: unknown;
  probabilityBonus?: unknown;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function isReachDomain(value: string): value is ReachDomain {
  return REACH_DOMAINS.includes(value as ReachDomain);
}

function resolveDominantReach(candidate: BalanceEncounterPoolCandidate): ReachDomain {
  return isReachDomain(candidate.reachPrimary) ? candidate.reachPrimary : DEFAULT_FORESHADOWING_REACH;
}

function resolveIntelligenceTier(completionProb: number): ForeshadowingIntelligenceTier {
  const normalized = clamp(completionProb, 0, 1) * 100;
  if (normalized < INTEL_TIER_UNKNOWN_BELOW) return 'unknown';
  if (normalized < INTEL_TIER_RUMOR_BELOW) return 'rumor';
  if (normalized < INTEL_TIER_BRIEFED_BELOW) return 'briefed';
  return 'expert';
}

function computeDrop(before: number | null, after: number | null): number {
  if (before === null || after === null) return 0;
  return Math.max(0, before - after);
}

function resolveTopMotive(decision: BalanceEvent): ForeshadowingTopMotive {
  const drops: Record<ForeshadowingTopMotive, number> = {
    awareness: computeDrop(asFiniteNumber(decision.filterCacheSize), asFiniteNumber(decision.filterAfterAwareness)),
    visibility: computeDrop(asFiniteNumber(decision.filterAfterAwareness), asFiniteNumber(decision.filterAfterVisibility)),
    prereqs: computeDrop(asFiniteNumber(decision.filterAfterVisibility), asFiniteNumber(decision.filterAfterPrerequisites)),
    threat: computeDrop(asFiniteNumber(decision.filterAfterPrerequisites), asFiniteNumber(decision.filterAfterThreat)),
    capability: computeDrop(asFiniteNumber(decision.filterAfterThreat), asFiniteNumber(decision.filterAfterCap)),
    cooldown: computeDrop(asFiniteNumber(decision.candidatesBeforeCooldown), asFiniteNumber(decision.candidatesAfterCooldown)),
  };

  let selected: ForeshadowingTopMotive = 'capability';
  let maxDrop = -1;
  for (const motive of TOP_MOTIVE_PRIORITY) {
    const drop = drops[motive];
    if (drop > maxDrop) {
      maxDrop = drop;
      selected = motive;
    }
  }
  return selected;
}

function mapInterventionTypeToKind(type: string | null): ForeshadowingInterventionKind | null {
  switch (type) {
    case 'dream': return 'vision';
    case 'omen': return 'omen';
    case 'persuade': return 'whisper';
    case 'deceive': return 'nudge';
    case 'intimidate': return 'affliction';
    case 'inspire_intervention': return 'bless';
    case 'coincidence': return 'nudge';
    case 'afflict_bless': return 'affliction';
    case 'supportive': return 'bless';
    case 'coercive': return 'affliction';
    case 'withdrawn': return 'nudge';
    default: return null;
  }
}

function mapSphereToInterventionKind(sphere: string | null): ForeshadowingInterventionKind {
  switch (sphere) {
    case 'mind': return 'whisper';
    case 'spirit': return 'vision';
    case 'time': return 'omen';
    case 'entropy': return 'affliction';
    case 'life': return 'bless';
    case 'light': return 'bless';
    default: return 'nudge';
  }
}

function resolveInterventionAttribution(
  graph: WorldGraph,
  agentId: string,
  tick: number,
): ForeshadowingInterventionAttribution | null {
  const node = graph.getNode(agentId);
  if (!node) return null;

  const rawHistory = (node.properties?.interventionHistory as unknown) ?? [];
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) return null;

  const minTick = tick - INTERVENTION_ATTRIBUTION_WINDOW;
  const recent = rawHistory
    .map(entry => entry as InterventionLikeRecord)
    .map(entry => ({
      tick: asFiniteNumber(entry.tick),
      encounterId: asString(entry.encounterId),
      interventionType: asString(entry.interventionType),
      sphereUsed: asString(entry.sphereUsed),
    }))
    .filter(entry => entry.tick !== null && entry.tick <= tick && entry.tick >= minTick)
    .sort((left, right) => (right.tick ?? 0) - (left.tick ?? 0));

  const chosen = recent[0];
  if (!chosen || chosen.tick === null) return null;

  const kind = mapInterventionTypeToKind(chosen.interventionType) ?? mapSphereToInterventionKind(chosen.sphereUsed);
  const interventionId = chosen.encounterId ?? `intervention.${agentId}.${chosen.tick}`;
  const summary = `${kind} influence still lingers around this thread.`;

  return {
    interventionId,
    interventionKind: kind,
    tickPerformed: chosen.tick,
    summary,
  };
}

function matchesCondition<T extends string>(
  condition: T | readonly T[] | undefined,
  value: T,
): boolean {
  if (condition === undefined) return true;
  if (Array.isArray(condition)) return condition.includes(value);
  return condition === value;
}

function matchesWhen(
  when: EncounterForeshadowingVariantWhen,
  signals: ForeshadowingSignals,
): boolean {
  return (
    matchesCondition(when.intelligenceTier, signals.intelligenceTier)
    && matchesCondition(when.topMotive, signals.topMotive)
    && matchesCondition(when.dominantReach, signals.dominantReach)
  );
}

function cleanWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

function enforceSentenceWindow(raw: string): string {
  const sentences = splitIntoSentences(cleanWhitespace(raw));
  const trimmed = sentences.slice(0, FORESHADOWING_MAX_SENTENCES);
  while (trimmed.length < FORESHADOWING_MIN_SENTENCES) {
    trimmed.push(DEFAULT_SENTENCE_FILLER);
  }
  return trimmed.join(' ').trim();
}

function formatProse(
  graph: WorldGraph,
  agentId: string,
  template: string,
  candidate: BalanceEncounterPoolCandidate,
  interventionAttribution: ForeshadowingInterventionAttribution | null,
): string {
  const narrativeContext = gatherNarrativeContext(graph, agentId);
  const seeded = template
    .replaceAll('{encounter_location}', candidate.locationName)
    .replaceAll('{encounter}', candidate.templateName)
    .replaceAll('{intervention_summary}', interventionAttribution?.summary ?? '');
  const enriched = enrichProse(seeded, narrativeContext);
  return enforceSentenceWindow(enriched);
}

function makeCacheKey(
  agentId: string,
  candidate: BalanceEncounterPoolCandidate,
  signals: ForeshadowingSignals,
  intervention: ForeshadowingInterventionAttribution | null,
  tick: number,
): string {
  const attributionWindow = Math.floor(tick / INTERVENTION_ATTRIBUTION_WINDOW);
  return [
    agentId,
    candidate.templateId,
    candidate.locationId,
    signals.intelligenceTier,
    signals.topMotive,
    signals.dominantReach,
    intervention?.interventionId ?? 'none',
    String(attributionWindow),
  ].join('|');
}

function writeForeshadowingCache(
  runtime: SimulationRuntime,
  key: string,
  result: ForeshadowingResult,
): void {
  runtime.foreshadowingCache.delete(key);
  runtime.foreshadowingCache.set(key, result);
  while (runtime.foreshadowingCache.size > FORESHADOWING_CACHE_MAX_ENTRIES) {
    const oldest = runtime.foreshadowingCache.keys().next().value as string | undefined;
    if (!oldest) break;
    runtime.foreshadowingCache.delete(oldest);
  }
}

export interface EncounterForeshadowingRequest {
  runtime: SimulationRuntime;
  graph: WorldGraph;
  tick: number;
  agentId: string;
  decision: BalanceEvent;
  candidate: BalanceEncounterPoolCandidate;
}

export function getEncounterForeshadowing({
  runtime,
  graph,
  tick,
  agentId,
  decision,
  candidate,
}: EncounterForeshadowingRequest): ForeshadowingResult {
  const template = getUnifiedTemplateById(candidate.templateId);
  const signals: ForeshadowingSignals = {
    intelligenceTier: resolveIntelligenceTier(candidate.completionProb),
    topMotive: resolveTopMotive(decision),
    dominantReach: resolveDominantReach(candidate),
  };
  const interventionAttribution = resolveInterventionAttribution(graph, agentId, tick);
  const cacheKey = makeCacheKey(agentId, candidate, signals, interventionAttribution, tick);
  const cached = runtime.foreshadowingCache.get(cacheKey);
  if (cached) {
    emitTrace({
      category: 'foreshadowing',
      tick,
      agentId,
      encounterId: candidate.templateId,
      variantsConsidered: template?.foreshadowing?.variants.map(variant => variant.id) ?? [],
      variantPicked: cached.variantId,
      signals,
      interventionAttributionId: interventionAttribution?.interventionId ?? null,
      cacheHit: true,
      summary: `foreshadowing resolved for ${candidate.templateId} (cache hit)`,
    });
    return cached;
  }

  const definition = template?.foreshadowing;
  const variants = definition?.variants ?? [];
  const variant = variants.find(item => matchesWhen(item.when, signals)) ?? null;
  const resolvedTemplate = variant?.template
    ?? definition?.fallback
    ?? GLOBAL_FORESHADOWING_FALLBACK_TEMPLATE;

  const result: ForeshadowingResult = {
    prose: formatProse(graph, agentId, resolvedTemplate, candidate, interventionAttribution),
    variantId: variant?.id ?? null,
    signals,
    interventionAttribution,
    resolvedAtTick: tick,
  };

  writeForeshadowingCache(runtime, cacheKey, result);
  emitTrace({
    category: 'foreshadowing',
    tick,
    agentId,
    encounterId: candidate.templateId,
    variantsConsidered: variants.map(item => item.id),
    variantPicked: result.variantId,
    signals,
    interventionAttributionId: interventionAttribution?.interventionId ?? null,
    cacheHit: false,
    summary: `foreshadowing resolved for ${candidate.templateId}`,
  });

  return result;
}
