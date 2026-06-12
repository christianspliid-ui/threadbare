/**
 * Thread Story Digest — compose a "story so far" narrative for a bonded agent.
 *
 * Selects the most significant DigestEntries from the rolling buffer,
 * assigns narrative roles (opener / pivot / compound / closer), resolves
 * the current tension thread from graph state, and enriches beat lines
 * via the prose enrichment engine.
 *
 * Design doc: Docs/plans/2026-06-11-thr-455-story-so-far-digest.md
 */

import type { WorldGraph } from './graph';
import type { DigestEntry, TensionKind, ThreadStoryComposedTrace } from '../types/attention';
import type { ReachDomain } from '../types/traits';
import { queryDigest } from './digestBuffer';
import { gatherNarrativeContext, enrichProse } from './proseEnrichment';
import { emitTrace } from './traceBuffer';
import {
  STORY_DIGEST_LOOKBACK_TICKS,
  STORY_DIGEST_MAX_BEATS,
  STORY_DIGEST_MIN_BEATS,
  BEAT_SIG_NOTABLE,
  BEAT_SIG_CAPABILITY,
  BEAT_SIG_ATTACHMENT,
  BEAT_SIG_QUINTESSENCE,
  BEAT_SIG_RECENCY,
  BEAT_SIG_PIVOT_MIN,
  TENSION_DEBT_AGE_TICKS,
} from '../data/attention-constants';
import {
  BEAT_TEMPLATES,
  TRANSITION_PHRASES,
  TENSION_TEMPLATES,
  EMPTY_THREAD_LINES,
} from '../data/thread-digest-content';

// ─── Public Types ─────────────────────────────────────────────────────────────

export type BeatRole = 'opener' | 'pivot' | 'compound' | 'closer';

export interface SelectedBeat {
  entry: DigestEntry;
  significance: number;
  role: BeatRole;
  ticksAgo: number;
}

export interface CurrentTension {
  kind: TensionKind;
  agentId: string;
  reachDomain?: ReachDomain;
  factionName?: string;
  attachmentLabel?: string;
  locationName?: string;
  ticksUntilDue?: number;
}

export interface ThreadStoryComposition {
  agentId: string;
  agentName: string;
  currentTickWhenComposed: number;
  tensionLine: string;
  beatLines: string[];
  lookbackTicks: number;
  beatCount: number;
  isEmpty: boolean;
}

// ─── Seeded Pick ──────────────────────────────────────────────────────────────

function djb2(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  return hash >>> 0;
}

export function seededPickFromPool<T>(pool: T[], ...seeds: (string | number)[]): T {
  const combined = seeds.map(String).join('|');
  const hash = djb2(combined);
  return pool[hash % pool.length];
}

// ─── Beat Significance Scoring ────────────────────────────────────────────────

function scoreSignificance(entry: DigestEntry, currentTick: number, lookbackTicks: number): number {
  let score = 0;

  if (entry.isNotable) {
    score += BEAT_SIG_NOTABLE;
  }

  const capDelta = Object.values(entry.capabilityChanges ?? {}).reduce(
    (sum, v) => sum + Math.abs(v),
    0,
  );
  if (capDelta > 0) {
    score += BEAT_SIG_CAPABILITY * Math.min(1, capDelta / 3);
  }

  const hasAttachmentChange =
    (entry.attachmentsGained?.length ?? 0) > 0 || (entry.attachmentsLost?.length ?? 0) > 0;
  if (hasAttachmentChange) {
    score += BEAT_SIG_ATTACHMENT;
  }

  if (Math.abs(entry.quintessenceDelta ?? 0) > 0.05) {
    score += BEAT_SIG_QUINTESSENCE * Math.min(1, Math.abs(entry.quintessenceDelta) / 0.5);
  }

  const ticksAgo = currentTick - entry.tick;
  const recencyFraction = Math.max(0, 1 - ticksAgo / lookbackTicks);
  score += BEAT_SIG_RECENCY * recencyFraction;

  return Math.min(1, score);
}

// ─── Beat Selection ───────────────────────────────────────────────────────────

export function selectBeats(
  agentId: string,
  buffer: DigestEntry[],
  currentTick: number,
  lookbackTicks: number = STORY_DIGEST_LOOKBACK_TICKS,
): SelectedBeat[] {
  const fromTick = Math.max(0, currentTick - lookbackTicks);
  const entries = queryDigest(buffer, { agentId, fromTick, toTick: currentTick });

  if (entries.length === 0) return [];

  const scored = entries
    .map(e => ({
      entry: e,
      significance: scoreSignificance(e, currentTick, lookbackTicks),
      ticksAgo: currentTick - e.tick,
    }))
    .sort((a, b) => b.significance - a.significance)
    .slice(0, STORY_DIGEST_MAX_BEATS);

  if (scored.length === 0) return [];

  // Re-sort chronologically for narrative ordering
  scored.sort((a, b) => a.entry.tick - b.entry.tick);

  return scored.map((s, i): SelectedBeat => {
    let role: BeatRole;
    if (i === 0) {
      role = 'opener';
    } else if (i === scored.length - 1) {
      role = 'closer';
    } else if (s.significance >= BEAT_SIG_PIVOT_MIN) {
      role = 'pivot';
    } else {
      role = 'compound';
    }
    return { entry: s.entry, significance: s.significance, role, ticksAgo: s.ticksAgo };
  });
}

// ─── Tension Resolution ───────────────────────────────────────────────────────

export function resolveCurrentTension(
  graph: WorldGraph,
  agentId: string,
  currentTick: number,
): CurrentTension {
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return { kind: 'idle', agentId };

  // open_wound: has_trait edges where the trait is a condition
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (traitNode?.properties?.category === 'condition') {
      return {
        kind: 'open_wound',
        agentId,
        attachmentLabel: traitNode.name,
        reachDomain: traitNode.properties?.reach as ReachDomain | undefined,
      };
    }
  }

  // faction_debt: owes_favor edges old enough to become tension
  const debtEdges = graph.getOutgoingEdges(agentId, 'owes_favor');
  for (const edge of debtEdges) {
    const grantedTick = (edge.properties?.grantedTick as number) ?? 0;
    const redeemed = edge.properties?.redeemed as boolean | undefined;
    const broken = edge.properties?.broken as boolean | undefined;
    if (!redeemed && !broken && grantedTick + TENSION_DEBT_AGE_TICKS < currentTick) {
      const creditorNode = graph.getNode(edge.target);
      return {
        kind: 'faction_debt',
        agentId,
        factionName: creditorNode?.name,
      };
    }
  }

  return { kind: 'idle', agentId };
}

// ─── Prose Assembly ───────────────────────────────────────────────────────────

function buildTensionLine(tension: CurrentTension, agentName: string, tick: number): string {
  const templates = TENSION_TEMPLATES[tension.kind] ?? TENSION_TEMPLATES['idle'];
  const variant = seededPickFromPool(templates, tension.agentId, tick);

  let line = variant
    .replace(/\{name\}/g, agentName)
    .replace(/\{attachment\}/g, tension.attachmentLabel ?? 'an affliction')
    .replace(/\{faction\}/g, tension.factionName ?? 'a faction');

  return line;
}

function buildBeatLine(beat: SelectedBeat, agentName: string, graph: WorldGraph): string {
  const reach = beat.entry.reachPrimary ?? 'iron';
  const outcome = beat.entry.success ? 'success' : 'failure';
  const templateKey = `${beat.role}_${reach}_${outcome}` as const;

  const variants =
    BEAT_TEMPLATES[templateKey] ??
    BEAT_TEMPLATES[`compound_${reach}_${outcome}` as keyof typeof BEAT_TEMPLATES] ??
    BEAT_TEMPLATES[`compound_iron_${outcome}` as keyof typeof BEAT_TEMPLATES] ??
    ['Something happened.', 'Events unfolded.', 'The thread continued.'];

  const template = seededPickFromPool([...variants], beat.entry.agentId, beat.entry.tick, beat.role);

  const narrativeCtx = gatherNarrativeContext(graph, beat.entry.agentId);
  const enriched = enrichProse(template, narrativeCtx);

  return enriched;
}

function buildTransitionPrefix(role: BeatRole, beatIndex: number, tick: number): string {
  if (role === 'opener') return '';
  const phrases = TRANSITION_PHRASES[role] ?? TRANSITION_PHRASES['compound'];
  return seededPickFromPool([...phrases], role, beatIndex, tick) + ' ';
}

// ─── Main Composition ─────────────────────────────────────────────────────────

export function composeThreadStory(
  graph: WorldGraph,
  agentId: string,
  digestBuffer: DigestEntry[],
  currentTick: number,
  traceBuffer?: unknown,
): ThreadStoryComposition {
  const agentNode = graph.getNode(agentId);
  const agentName = agentNode?.name ?? 'Unknown';

  const beats = selectBeats(agentId, digestBuffer, currentTick);
  const tension = resolveCurrentTension(graph, agentId, currentTick);

  const tensionLine = buildTensionLine(tension, agentName, currentTick);

  let beatLines: string[] = [];
  let isEmpty = false;

  if (beats.length < STORY_DIGEST_MIN_BEATS) {
    const emptyLine = seededPickFromPool([...EMPTY_THREAD_LINES], agentId, currentTick);
    beatLines = [emptyLine];
    isEmpty = true;
  } else {
    beatLines = beats.map((beat, i) => {
      const prefix = buildTransitionPrefix(beat.role, i, beat.entry.tick);
      const line = buildBeatLine(beat, agentName, graph);
      return prefix + line;
    });
  }

  const trace: Omit<ThreadStoryComposedTrace, 'id' | 'timestamp'> = {
    category: 'thread_story_composed',
    tick: currentTick,
    agentId,
    tensionKind: tension.kind,
    beatCount: isEmpty ? 0 : beats.length,
    lookbackTicks: STORY_DIGEST_LOOKBACK_TICKS,
    emptyState: isEmpty,
    summary: `thread story composed for ${agentName}: ${beats.length} beats, tension=${tension.kind}${isEmpty ? ' (empty)' : ''}`,
  };
  emitTrace(trace);

  return {
    agentId,
    agentName,
    currentTickWhenComposed: currentTick,
    tensionLine,
    beatLines,
    lookbackTicks: STORY_DIGEST_LOOKBACK_TICKS,
    beatCount: isEmpty ? 0 : beats.length,
    isEmpty,
  };
}
