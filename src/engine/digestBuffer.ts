/**
 * Digest Buffer — append, prune, and query the encounter digest.
 *
 * The digest buffer is a flat array of DigestEntry records accumulated from
 * background-tier encounter resolutions. It is pruned each tick to keep only
 * entries within the rolling retention window.
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import type { DigestEntry } from '../types/attention';
import type { UnifiedActionOutcome } from '../types/unifiedAction';
import { DIGEST_BUFFER_RETENTION } from '../data/attention-constants';
import { outcomePhrase } from './aftermathWords';

// ─── THR-2055: who, and how it went ──────────────────────────────────────────

/** Fallback when an entry's agent has no node left to name it. */
export const DIGEST_UNNAMED_AGENT = 'Someone';

/** Fallback chapter name when the action or its template is gone. */
export const MISSED_CHAPTER_NAME = 'A chapter';

/** What Read the Threads says of a chapter that left the world without resolving. */
export const DIGEST_ENDED_UNSEEN = 'Ended out of sight';

/**
 * The name a digest entry files under. Agents carry it on `node.name`;
 * `properties.name` is checked first for the few writers that set it there.
 */
export function digestAgentName(
  node: { name?: string; properties?: Record<string, unknown> } | undefined,
): string {
  const fromProps = node?.properties?.name;
  if (typeof fromProps === 'string' && fromProps.length > 0) return fromProps;
  return node?.name || DIGEST_UNNAMED_AGENT;
}

/** Bands the aftermath tells as lost (`aftermathWords` OUTCOME_SENTENCE_SHAPES: "lost"). */
const LOST_BANDS: ReadonlySet<UnifiedActionOutcome> = new Set<UnifiedActionOutcome>([
  'failure', 'critical_failure', 'contested_lost',
]);

/**
 * Did this entry's chapter go the mortal's way? The band wins over `success`,
 * so the digest line agrees with the aftermath's word for the same chapter.
 */
export function digestEntryWon(entry: Pick<DigestEntry, 'success' | 'outcomeBand'>): boolean {
  if (entry.outcomeBand) return !LOST_BANDS.has(entry.outcomeBand);
  return entry.success;
}

/**
 * How the chapter went, for a player surface: the aftermath's own phrase when
 * the band is known ("It faltered", "Won, at a price"), "Still unfolding" when
 * the entry was filed before it resolved.
 */
export function digestOutcomeLabel(
  entry: Pick<DigestEntry, 'success' | 'outcomeBand' | 'unresolved' | 'ended'>,
): string {
  if (entry.unresolved) return 'Still unfolding';
  if (entry.ended) return DIGEST_ENDED_UNSEEN;
  const phrase = outcomePhrase(entry.outcomeBand);
  if (phrase) return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  return digestEntryWon(entry) ? 'Success' : 'Failed';
}

/**
 * Fill in the outcome of every entry written for `encounterId` before it
 * resolved. Replaces those entries with settled copies (the buffer is the
 * caller's own working copy; the entry objects may still be shared with the
 * previous state). Returns how many it settled.
 */
export function settleDigestOutcome(
  buffer: DigestEntry[],
  encounterId: string,
  outcome: UnifiedActionOutcome,
  /** Legacy encounters key by template id, which many mortals share — match the actor too. */
  agentId?: string,
): number {
  let settled = 0;
  for (let i = 0; i < buffer.length; i++) {
    const e = buffer[i];
    if (!e.unresolved || e.encounterId !== encounterId) continue;
    if (agentId !== undefined && e.agentId !== agentId) continue;
    buffer[i] = { ...e, unresolved: false, outcomeBand: outcome, success: !LOST_BANDS.has(outcome) };
    settled++;
  }
  return settled;
}

/**
 * Close every unresolved entry whose chapter can no longer resolve (`isLive`
 * false): the mortal died, or the action left the world before resolving. Such
 * an entry would otherwise say "Still unfolding" for good. Replaces entries
 * with copies, like `settleDigestOutcome`. Returns how many it closed.
 */
export function endStrandedDigestEntries(
  buffer: DigestEntry[],
  isLive: (entry: DigestEntry) => boolean,
): number {
  let ended = 0;
  for (let i = 0; i < buffer.length; i++) {
    const e = buffer[i];
    if (!e.unresolved || isLive(e)) continue;
    buffer[i] = { ...e, unresolved: false, ended: true, success: false };
    ended++;
  }
  return ended;
}

/** One entry per agent, newest kept — a list that names mortals names each once. */
export function oneEntryPerAgent(entries: readonly DigestEntry[]): DigestEntry[] {
  const byAgent = new Map<string, DigestEntry>();
  for (const e of entries) {
    const prev = byAgent.get(e.agentId);
    if (!prev || e.tick >= prev.tick) byAgent.set(e.agentId, e);
  }
  return [...byAgent.values()];
}

// ─── Query interface ──────────────────────────────────────────────────────────

export interface DigestQuery {
  /** If set, only return entries for this agent. */
  agentId?: string;
  /** Inclusive lower tick bound. */
  fromTick: number;
  /** Inclusive upper tick bound. */
  toTick: number;
  /** If true, only return entries where isNotable is true. */
  notableOnly?: boolean;
  /** If set, only return entries with this sourceType. */
  sourceType?: 'agent' | 'location';
}

// ─── append ──────────────────────────────────────────────────────────────────

/**
 * Append a DigestEntry to the buffer in place.
 * Mutates the buffer array directly for performance (no copy needed on hot path).
 */
export function appendDigestEntry(buffer: DigestEntry[], entry: DigestEntry): void {
  buffer.push(entry);
}

// ─── prune ───────────────────────────────────────────────────────────────────

/**
 * Return a new array with all entries older than `currentTick - retention` removed.
 *
 * Default retention is DIGEST_BUFFER_RETENTION (48 ticks = 4 game days).
 * Does not mutate the original buffer.
 */
export function pruneDigestBuffer(
  buffer: DigestEntry[],
  currentTick: number,
  retention: number = DIGEST_BUFFER_RETENTION,
): DigestEntry[] {
  const cutoff = currentTick - retention;
  return buffer.filter(e => e.tick > cutoff);
}

// ─── query ───────────────────────────────────────────────────────────────────

/**
 * Filter buffer by query options and return matching entries.
 * All filters are AND-combined. Only `fromTick` / `toTick` are required.
 */
export function queryDigest(buffer: DigestEntry[], query: DigestQuery): DigestEntry[] {
  return buffer.filter(e => {
    if (e.tick < query.fromTick || e.tick > query.toTick) return false;
    if (query.agentId && e.agentId !== query.agentId) return false;
    if (query.notableOnly && !e.isNotable) return false;
    if (query.sourceType && e.sourceType !== query.sourceType) return false;
    return true;
  });
}
