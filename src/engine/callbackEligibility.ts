import type { GraphNode } from '../types/graph';
import { WorldGraph } from './graph';

const MAX_CALLBACK_CANDIDATES = 3;
const MIN_CALLBACK_CANDIDATES = 1;
const DERIVED_HISTORY_LIMIT = 24;
const RECENCY_DECAY_TICK_THRESHOLD = 50;
const RECENCY_DECAY_MULTIPLIER = 0.5;
const RECENCY_FRESH_MULTIPLIER = 1;
const STRUCTURAL_EVENT_MULTIPLIER = 1.5;
const INCIDENTAL_EVENT_MULTIPLIER = 1;
const RELEVANCE_BASELINE_SCORE = 1;
const HISTORY_EVENT_TYPE = 'encounter_outcome';

export interface CallbackBeatContext {
  readonly castMemberIds?: readonly string[];
  readonly placeType?: string;
  readonly factionIds?: readonly string[];
  readonly sphere?: string;
}

export interface CallbackEligibilityInput {
  readonly graph: WorldGraph;
  readonly agentId: string;
  readonly currentTick: number;
  readonly currentBeat: CallbackBeatContext;
  readonly authorPinnedEventIds?: readonly string[];
  readonly maxCandidates?: number;
}

interface ScoredEvent {
  readonly event: GraphNode;
  readonly score: number;
  readonly overlapCount: number;
  readonly eventTick: number;
}

function clampMaxCandidates(value: number | undefined): number {
  if (!Number.isFinite(value)) return MAX_CALLBACK_CANDIDATES;
  return Math.max(
    MIN_CALLBACK_CANDIDATES,
    Math.min(MAX_CALLBACK_CANDIDATES, Math.floor(value as number)),
  );
}

function normalizeStringArray(values: readonly string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  const deduped = new Set<string>();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    deduped.add(trimmed);
  }
  return [...deduped];
}

function isEncounterEventNode(node: GraphNode | undefined): node is GraphNode {
  return node?.type === 'event' && node.properties.eventType === HISTORY_EVENT_TYPE;
}

function resolveEventTick(eventNode: GraphNode): number {
  const tick = eventNode.properties.tick;
  if (typeof tick !== 'number' || !Number.isFinite(tick)) return 0;
  return tick;
}

function computeRecencyMultiplier(eventTick: number, currentTick: number): number {
  const ticksAgo = Math.max(0, currentTick - eventTick);
  if (ticksAgo >= RECENCY_DECAY_TICK_THRESHOLD) return RECENCY_DECAY_MULTIPLIER;
  return RECENCY_FRESH_MULTIPLIER;
}

function resolveEmotionalMultiplier(eventNode: GraphNode): number {
  const explicitWeight = eventNode.properties.callbackWeight;
  if (explicitWeight === 'structural') return STRUCTURAL_EVENT_MULTIPLIER;
  if (explicitWeight === 'incidental') return INCIDENTAL_EVENT_MULTIPLIER;

  const outcome = eventNode.properties.outcome;
  if (outcome === 'critical_success' || outcome === 'critical_failure') {
    return STRUCTURAL_EVENT_MULTIPLIER;
  }
  if (eventNode.properties.tierPromotionOccurred === true) {
    return STRUCTURAL_EVENT_MULTIPLIER;
  }
  return INCIDENTAL_EVENT_MULTIPLIER;
}

function collectBeatTags(beat: CallbackBeatContext): Set<string> {
  const tags = new Set<string>();
  for (const actorId of normalizeStringArray(beat.castMemberIds)) {
    tags.add(`actor:${actorId}`);
  }
  for (const factionId of normalizeStringArray(beat.factionIds)) {
    tags.add(`faction:${factionId}`);
  }
  if (typeof beat.placeType === 'string' && beat.placeType.trim().length > 0) {
    tags.add(`place:${beat.placeType.trim()}`);
  }
  if (typeof beat.sphere === 'string' && beat.sphere.trim().length > 0) {
    tags.add(`sphere:${beat.sphere.trim()}`);
  }
  return tags;
}

function collectEventTags(graph: WorldGraph, eventNode: GraphNode): Set<string> {
  const tags = new Set<string>();

  for (const edge of graph.getIncomingEdges(eventNode.id, 'participated_in')) {
    tags.add(`actor:${edge.source}`);
    for (const factionEdge of graph.getOutgoingEdges(edge.source, 'member_of')) {
      tags.add(`faction:${factionEdge.target}`);
    }
  }

  for (const occurredAtEdge of graph.getOutgoingEdges(eventNode.id, 'occurred_at')) {
    const location = graph.getNode(occurredAtEdge.target);
    const locationSubtype = location?.properties.locationSubtype;
    if (typeof locationSubtype === 'string' && locationSubtype.trim().length > 0) {
      tags.add(`place:${locationSubtype.trim()}`);
    }
  }

  const sphereAffinity = eventNode.properties.sphereAffinity;
  if (typeof sphereAffinity === 'string' && sphereAffinity.trim().length > 0) {
    tags.add(`sphere:${sphereAffinity.trim()}`);
  }

  return tags;
}

function countOverlap(a: Set<string>, b: Set<string>): number {
  let overlap = 0;
  for (const value of a) {
    if (b.has(value)) overlap++;
  }
  return overlap;
}

function compareScoredEvents(a: ScoredEvent, b: ScoredEvent): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.overlapCount !== b.overlapCount) return b.overlapCount - a.overlapCount;
  if (a.eventTick !== b.eventTick) return b.eventTick - a.eventTick;
  return a.event.id.localeCompare(b.event.id);
}

function getAgentEncounterEvents(graph: WorldGraph, agentId: string): GraphNode[] {
  const participatedEdges = graph.getOutgoingEdges(agentId, 'participated_in');
  const unique = new Map<string, GraphNode>();
  for (const edge of participatedEdges) {
    const node = graph.getNode(edge.target);
    if (isEncounterEventNode(node)) {
      unique.set(node.id, node);
    }
  }

  return [...unique.values()].sort((a, b) => resolveEventTick(b) - resolveEventTick(a));
}

function scoreDerivedCandidates(
  graph: WorldGraph,
  candidateEvents: readonly GraphNode[],
  currentTick: number,
  currentBeat: CallbackBeatContext,
): ScoredEvent[] {
  const beatTags = collectBeatTags(currentBeat);

  const scored: ScoredEvent[] = [];
  for (const eventNode of candidateEvents) {
    const eventTick = resolveEventTick(eventNode);
    const recencyMultiplier = computeRecencyMultiplier(eventTick, currentTick);
    const emotionalMultiplier = resolveEmotionalMultiplier(eventNode);
    const eventTags = collectEventTags(graph, eventNode);
    const overlapCount = countOverlap(beatTags, eventTags);
    const score = (RELEVANCE_BASELINE_SCORE + overlapCount) * recencyMultiplier * emotionalMultiplier;

    scored.push({
      event: eventNode,
      score,
      overlapCount,
      eventTick,
    });
  }

  scored.sort(compareScoredEvents);
  return scored;
}

/**
 * Resolve callback-eligible event nodes for the current encounter beat.
 *
 * Rules:
 * - Author-pinned event IDs are always taken first (in authored order).
 * - If author-pinned list has fewer than max candidates, engine fills slack
 *   with graph-derived history candidates ranked by recency/relevance/weight.
 * - Returns between 0 and maxCandidates events (default 3).
 */
export function getCallbackCandidates(input: CallbackEligibilityInput): GraphNode[] {
  const maxCandidates = clampMaxCandidates(input.maxCandidates);
  const history = getAgentEncounterEvents(input.graph, input.agentId);
  if (history.length === 0) return [];

  const historyById = new Map(history.map(eventNode => [eventNode.id, eventNode]));
  const selected: GraphNode[] = [];
  const selectedIds = new Set<string>();

  for (const pinnedId of normalizeStringArray(input.authorPinnedEventIds)) {
    const pinned = historyById.get(pinnedId);
    if (!pinned || selectedIds.has(pinned.id)) continue;
    selected.push(pinned);
    selectedIds.add(pinned.id);
    if (selected.length >= maxCandidates) return selected;
  }

  const derivedPool = history
    .filter(eventNode => !selectedIds.has(eventNode.id))
    .slice(0, DERIVED_HISTORY_LIMIT);
  const rankedDerived = scoreDerivedCandidates(
    input.graph,
    derivedPool,
    input.currentTick,
    input.currentBeat,
  );

  for (const scored of rankedDerived) {
    if (selected.length >= maxCandidates) break;
    selected.push(scored.event);
  }

  return selected;
}
