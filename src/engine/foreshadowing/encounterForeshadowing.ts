/**
 * Encounter Foreshadowing Resolver — unified module (THR-389, THR-631, THR-642).
 *
 * Generates the 2–4 sentence passage representing what an agent believes about
 * an encounter they're moving toward. Click-driven — never per-tick. Results are
 * cached per session on the SimulationRuntime.
 *
 * Two entry points, one internal pipeline (THR-642 collapsed these from two
 * separate modules):
 *
 *  - `getEncounterForeshadowing({ ... })` — panel / debug-bridge path. Holds the
 *    full agent decision + ranked candidate, so signals are derived for real and
 *    the prose is grounded at the candidate's location.
 *  - `getEncounterForeshadowingById(...)` — thread-card tooltip path. Knows only
 *    (agentId, encounterId), so signals fall back to baseline values and there
 *    is no location to ground against.
 *
 * The entry signatures stay distinct because the call sites genuinely hold
 * different inputs. Everything downstream of signal derivation — variant
 * selection, prose composition, cache writes, tracing — is shared.
 */

import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { BalanceEncounterPoolCandidate, BalanceEvent } from '../../types/balanceEval';
import type {
  EncounterForeshadowingVariant,
  EncounterForeshadowingVariantWhen,
  ForeshadowingIntelligenceTier,
  ForeshadowingInterventionAttribution,
  ForeshadowingInterventionKind,
  ForeshadowingResult,
  ForeshadowingSignals,
  ForeshadowingTopMotive,
  MotiveReceipt,
} from '../../types/foreshadowing';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';
import type { ForeshadowingResolutionTrace } from '../../types/trace';
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
import { composeGenericForeshadowing } from './composeGeneric';
import { composeReceiptForeshadowing } from './composeReceipt';
import { readMotiveReceipt } from './receiptRead';
import { resolveForeshadowingPlaceholders } from './genericFallback';
import { attributeRecentInterventions } from './attributeRecentInterventions';
import { mulberry32 } from '../../lib/prng';

const TOP_MOTIVE_PRIORITY: readonly ForeshadowingTopMotive[] = [
  'awareness',
  'visibility',
  'prereqs',
  'threat',
  'capability',
  'cooldown',
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

// ─── Small shared helpers ─────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function isReachDomain(value: unknown): value is ReachDomain {
  return typeof value === 'string' && REACH_DOMAINS.includes(value as ReachDomain);
}

/** Subject pronoun from a graph node's `gender` property. Defaults to they/them. */
function resolveSubjectPronoun(gender: unknown): string {
  if (typeof gender !== 'string') return 'they';
  switch (gender.toLowerCase()) {
    case 'male': case 'm': return 'he';
    case 'female': case 'f': return 'she';
    default: return 'they';
  }
}

// ─── Variant selection ────────────────────────────────────────────────────────

/** Deterministic seed derived from two strings — PRNG tie-breaking in variant selection. */
function stableHashSeed(a: string, b: string): number {
  let hash = 0x5b3d7a9f;
  for (const str of [a, b]) {
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(hash, 31) + str.charCodeAt(i)) | 0;
    }
  }
  return hash >>> 0;
}

/** A `when` clause matches when it is absent, equals the signal, or lists it. */
function matchesCondition<T extends string>(
  condition: T | readonly T[] | undefined,
  value: T,
): boolean {
  if (condition === undefined) return true;
  if (Array.isArray(condition)) return condition.includes(value);
  return condition === value;
}

/** True when every defined clause in `when` is satisfied by `signals`. */
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

/** Count defined clauses — more clauses = a more specific variant. */
function countSpecifiedConditions(when: EncounterForeshadowingVariantWhen): number {
  return (when.intelligenceTier !== undefined ? 1 : 0)
    + (when.topMotive !== undefined ? 1 : 0)
    + (when.dominantReach !== undefined ? 1 : 0);
}

/**
 * Select the best variant for the current signals.
 *
 * Most-specific-wins: a variant matching on two clauses beats one matching on a
 * single clause, so authoring order never silently decides the outcome. Ties at
 * equal specificity break deterministically via seeded PRNG.
 *
 * THR-642: this replaces the panel path's former first-match scan. First-match
 * made the winner depend on array order (a broad `intelligenceTier`-only variant
 * listed early shadowed every narrower one) and its predicate could not match
 * array-valued `when` clauses at all.
 */
function selectVariant(
  variants: readonly EncounterForeshadowingVariant[],
  signals: ForeshadowingSignals,
  agentId: string,
  encounterId: string,
): EncounterForeshadowingVariant | null {
  const candidates = variants.filter(variant => matchesWhen(variant.when, signals));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const topScore = Math.max(...candidates.map(v => countSpecifiedConditions(v.when)));
  const topCandidates = candidates.filter(v => countSpecifiedConditions(v.when) === topScore);
  if (topCandidates.length === 1) return topCandidates[0];

  const rng = mulberry32(stableHashSeed(agentId, encounterId));
  return topCandidates[Math.floor(rng() * topCandidates.length)];
}

// ─── Signal derivation ────────────────────────────────────────────────────────

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

/** Panel path: real signals, derived from the decision funnel and the candidate. */
function deriveCandidateSignals(
  decision: BalanceEvent,
  candidate: BalanceEncounterPoolCandidate,
): ForeshadowingSignals {
  return {
    intelligenceTier: resolveIntelligenceTier(candidate.completionProb),
    topMotive: resolveTopMotive(decision),
    dominantReach: isReachDomain(candidate.reachPrimary)
      ? candidate.reachPrimary
      : DEFAULT_FORESHADOWING_REACH,
  };
}

/**
 * Tooltip path: baseline signals. Only the encounter's own Reach is knowable
 * without a decision record — intel tier and motive have no source here, so they
 * take their neutral values and the composed-generic path hedges accordingly.
 */
function deriveBaselineSignals(encounterId: string): ForeshadowingSignals {
  const template = getUnifiedTemplateById(encounterId);
  return {
    intelligenceTier: 'unknown',
    topMotive: 'awareness',
    dominantReach: isReachDomain(template?.reach) ? template.reach : DEFAULT_FORESHADOWING_REACH,
  };
}

// ─── Intervention attribution (panel path) ───────────────────────────────────

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

// ─── Authored-template rendering ──────────────────────────────────────────────

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

/**
 * Panel path authored render: resolves the agent/pronoun placeholder set, fills
 * the candidate-grounded slots, then runs the graph-walking enrichment pipeline
 * and clamps to the sentence window.
 *
 * THR-642: the agent/pronoun pass was previously only done on the tooltip path,
 * so authored variants rendered here leaked raw `{name.first}` and
 * `{pronoun.*}` tokens into player-facing panel prose. Both entries now share
 * the same placeholder contract.
 */
function renderAuthoredForCandidate(
  graph: WorldGraph,
  agentId: string,
  agentNode: GraphNode | undefined | null,
  template: string,
  candidate: BalanceEncounterPoolCandidate,
  interventionAttribution: ForeshadowingInterventionAttribution | null,
): string {
  const narrativeContext = gatherNarrativeContext(graph, agentId);
  const named = resolveForeshadowingPlaceholders(
    template,
    agentNode?.name ?? agentId,
    candidate.templateName,
    resolveSubjectPronoun(agentNode?.properties?.gender),
  );
  const seeded = named
    .replaceAll('{encounter_location}', candidate.locationName)
    .replaceAll('{encounter}', candidate.templateName)
    .replaceAll('{intervention_summary}', interventionAttribution?.summary ?? '');
  const enriched = enrichProse(seeded, narrativeContext);
  return enforceSentenceWindow(enriched);
}

// ─── Shared composition ───────────────────────────────────────────────────────

interface ForeshadowingCompositionInput {
  agentId: string;
  encounterId: string;
  agentNode: GraphNode | undefined | null;
  signals: ForeshadowingSignals;
  /** Present on the panel path only; scopes the receipt match and grounds prose. */
  locationId?: string;
  locationName?: string;
  /** Authored variant template or per-encounter fallback, when one applies. */
  authoredTemplate: string | null;
  /** Renders `authoredTemplate`. Differs per entry — see the two call sites. */
  renderAuthored: (template: string) => string;
}

interface ForeshadowingComposition {
  prose: string;
  tooltipProse?: string;
  compositionKeys?: string[];
  /** The receipt that drove composition, or null. Surfaced in the trace. */
  receipt: MotiveReceipt | null;
}

/**
 * Resolution order (THR-631), shared by both entries:
 *   1. authored variant / per-encounter fallback,
 *   2. the receipt-driven path — the agent's real decision causality,
 *   3. the composed-generic path — grammatical across he/she/they, and never
 *      routes the encounter title into a place slot.
 */
function composeForeshadowingProse(
  input: ForeshadowingCompositionInput,
): ForeshadowingComposition {
  const {
    agentId, encounterId, agentNode, signals,
    locationId, locationName, authoredTemplate, renderAuthored,
  } = input;

  if (authoredTemplate) {
    return { prose: renderAuthored(authoredTemplate), receipt: null };
  }

  const agentName = agentNode?.name ?? agentId;
  const subjectPronoun = resolveSubjectPronoun(agentNode?.properties?.gender);
  const receipt = readMotiveReceipt(agentNode, encounterId, locationId);

  if (receipt) {
    const composed = composeReceiptForeshadowing(
      { agentId, encounterId, agentName, subjectPronoun, locationName },
      receipt,
    );
    return {
      prose: composed.prose,
      tooltipProse: composed.tooltipProse,
      compositionKeys: composed.compositionKeys,
      receipt,
    };
  }

  const composed = composeGenericForeshadowing({
    agentId,
    encounterId,
    agentName,
    subjectPronoun,
    dominantReach: signals.dominantReach,
    intelTier: signals.intelligenceTier,
    locationName,
  });
  return { prose: composed.prose, compositionKeys: composed.compositionKeys, receipt: null };
}

// ─── Cache ────────────────────────────────────────────────────────────────────

/** Panel key: signals and attribution are derived, so they participate in the key. */
function candidateCacheKey(
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

/** Tooltip key: the (agent, encounter) pair is the whole input. */
function idCacheKey(agentId: string, encounterId: string): string {
  return `${agentId}|${encounterId}`;
}

/** Write-through with LRU recency; evicts oldest entries past the cap. */
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

// ─── Tracing ──────────────────────────────────────────────────────────────────

interface ForeshadowingTraceInput {
  tick: number;
  agentId: string;
  encounterId: string;
  variantsConsidered: string[];
  variantPicked: string | null;
  signals: ForeshadowingSignals;
  interventionAttributionId: string | null;
  cacheHit: boolean;
  compositionKeys?: string[];
  receipt?: MotiveReceipt | null;
  error?: string;
  summary: string;
}

function emitForeshadowingTrace(input: ForeshadowingTraceInput): void {
  // Declared as a typed local first: emitTrace's `Omit<TraceEntry, …>` parameter
  // collapses the trace union to its common fields, which would reject the
  // foreshadowing-only members below.
  const trace: Omit<ForeshadowingResolutionTrace, 'id' | 'timestamp'> = {
    category: 'foreshadowing',
    ...input,
  };
  emitTrace(trace);
}

/** Neutral result for the fail-soft path. Never cached — a transient throw must not stick. */
function failSoftResult(tick: number): ForeshadowingResult {
  return {
    prose: '...',
    variantId: null,
    signals: { intelligenceTier: 'unknown', topMotive: 'awareness', dominantReach: DEFAULT_FORESHADOWING_REACH },
    interventionAttribution: null,
    resolvedAtTick: tick,
  };
}

// ─── Entry point: panel / debug bridge ───────────────────────────────────────

export interface EncounterForeshadowingRequest {
  runtime: SimulationRuntime;
  graph: WorldGraph;
  tick: number;
  agentId: string;
  decision: BalanceEvent;
  candidate: BalanceEncounterPoolCandidate;
}

/**
 * Resolve foreshadowing from a full agent decision + ranked candidate.
 *
 * Used by ThreadDetailView's ranked-pool panel and the debug bridge, both of
 * which hold the decision record the scorer produced.
 */
export function getEncounterForeshadowing({
  runtime,
  graph,
  tick,
  agentId,
  decision,
  candidate,
}: EncounterForeshadowingRequest): ForeshadowingResult {
  try {
    const template = getUnifiedTemplateById(candidate.templateId);
    const variants = template?.foreshadowing?.variants ?? [];
    const signals = deriveCandidateSignals(decision, candidate);
    const interventionAttribution = resolveInterventionAttribution(graph, agentId, tick);
    const key = candidateCacheKey(agentId, candidate, signals, interventionAttribution, tick);

    const cached = runtime.foreshadowingCache.get(key);
    if (cached) {
      emitForeshadowingTrace({
        tick,
        agentId,
        encounterId: candidate.templateId,
        variantsConsidered: variants.map(variant => variant.id),
        variantPicked: cached.variantId,
        signals,
        interventionAttributionId: interventionAttribution?.interventionId ?? null,
        cacheHit: true,
        summary: `foreshadowing resolved for ${candidate.templateId} (cache hit)`,
      });
      return cached;
    }

    const variant = selectVariant(variants, signals, agentId, candidate.templateId);
    const authoredTemplate = variant?.template ?? template?.foreshadowing?.fallback ?? null;
    const agentNode = graph.getNode(agentId);

    const composed = composeForeshadowingProse({
      agentId,
      encounterId: candidate.templateId,
      agentNode,
      signals,
      locationId: candidate.locationId,
      locationName: candidate.locationName,
      authoredTemplate,
      renderAuthored: authored => renderAuthoredForCandidate(
        graph, agentId, agentNode, authored, candidate, interventionAttribution,
      ),
    });

    const result: ForeshadowingResult = {
      prose: composed.prose,
      tooltipProse: composed.tooltipProse,
      variantId: variant?.id ?? null,
      signals,
      interventionAttribution,
      resolvedAtTick: tick,
    };

    writeForeshadowingCache(runtime, key, result);
    emitForeshadowingTrace({
      tick,
      agentId,
      encounterId: candidate.templateId,
      variantsConsidered: variants.map(item => item.id),
      variantPicked: result.variantId,
      signals,
      interventionAttributionId: interventionAttribution?.interventionId ?? null,
      cacheHit: false,
      compositionKeys: composed.compositionKeys,
      receipt: composed.receipt,
      summary: `foreshadowing resolved for ${candidate.templateId}${composed.receipt ? ' (receipt)' : ''}`,
    });

    return result;
  } catch (err) {
    const result = failSoftResult(tick);
    emitForeshadowingTrace({
      tick,
      agentId,
      encounterId: candidate.templateId,
      variantsConsidered: [],
      variantPicked: null,
      signals: result.signals,
      interventionAttributionId: null,
      cacheHit: false,
      error: String(err),
      summary: `foreshadowing resolver error: ${agentId} → ${candidate.templateId}`,
    });
    return result;
  }
}

// ─── Entry point: thread-card tooltip ────────────────────────────────────────

/**
 * Resolve foreshadowing from ids alone.
 *
 * Used by the thread-card tooltip, which has an agent and an encounter but no
 * decision record and no candidate location.
 *
 * @param state       Current game state (read-only).
 * @param agentId     The agent moving toward the encounter.
 * @param encounterId The encounter template ID.
 * @param tick        Current simulation tick.
 * @param runtime     Per-session SimulationRuntime (owns the cache).
 */
export function getEncounterForeshadowingById(
  state: GameState,
  agentId: string,
  encounterId: string,
  tick: number,
  runtime: SimulationRuntime,
): ForeshadowingResult {
  const key = idCacheKey(agentId, encounterId);

  const cached = runtime.foreshadowingCache.get(key);
  if (cached) {
    emitForeshadowingTrace({
      tick,
      agentId,
      encounterId,
      variantsConsidered: [],
      variantPicked: null,
      signals: cached.signals,
      interventionAttributionId: cached.interventionAttribution?.interventionId ?? null,
      cacheHit: true,
      summary: `foreshadowing cache hit: ${agentId} → ${encounterId}`,
    });
    return cached;
  }

  try {
    const agentNode = state.graph.getNode(agentId);
    const signals = deriveBaselineSignals(encounterId);

    const template = getUnifiedTemplateById(encounterId);
    const encounterHeading = template?.name ?? encounterId;
    const variants = template?.foreshadowing?.variants ?? [];

    const variant = selectVariant(variants, signals, agentId, encounterId);
    const authoredTemplate = variant?.template ?? template?.foreshadowing?.fallback ?? null;

    const composed = composeForeshadowingProse({
      agentId,
      encounterId,
      agentNode,
      signals,
      authoredTemplate,
      renderAuthored: authored => resolveForeshadowingPlaceholders(
        authored,
        agentNode?.name ?? agentId,
        encounterHeading,
        resolveSubjectPronoun(agentNode?.properties?.gender),
      ),
    });

    const interventionAttribution = attributeRecentInterventions(state, agentId, encounterId, tick);

    const result: ForeshadowingResult = {
      prose: composed.prose,
      tooltipProse: composed.tooltipProse,
      variantId: variant?.id ?? null,
      signals,
      interventionAttribution,
      resolvedAtTick: tick,
    };

    writeForeshadowingCache(runtime, key, result);
    emitForeshadowingTrace({
      tick,
      agentId,
      encounterId,
      variantsConsidered: variants.map(item => item.id),
      variantPicked: result.variantId,
      signals,
      interventionAttributionId: interventionAttribution?.interventionId ?? null,
      cacheHit: false,
      compositionKeys: composed.compositionKeys,
      receipt: composed.receipt,
      summary: `foreshadowing resolved (${result.variantId ? `variant:${result.variantId}` : composed.receipt ? 'receipt' : 'generic'}): ${agentId} → ${encounterId}`,
    });

    return result;
  } catch (err) {
    const result = failSoftResult(tick);
    emitForeshadowingTrace({
      tick,
      agentId,
      encounterId,
      variantsConsidered: [],
      variantPicked: null,
      signals: result.signals,
      interventionAttributionId: null,
      cacheHit: false,
      error: String(err),
      summary: `foreshadowing resolver error: ${agentId} → ${encounterId}`,
    });
    return result;
  }
}
