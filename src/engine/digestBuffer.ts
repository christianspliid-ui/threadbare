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
import { DIGEST_BUFFER_RETENTION } from '../data/attention-constants';

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
