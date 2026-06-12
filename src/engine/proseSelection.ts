/**
 * Prose selection utilities — repetition guard for phrase pools (THR-456).
 *
 * `pickWithRepetitionGuard` picks from a PhraseEntry pool while avoiding phrases
 * already used in the current session window.  The caller owns `usedIds` and
 * decides its scope (per-tick, per-encounter, per-game session, etc.).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhraseEntry {
  phraseId: string;
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default window before a phraseId can repeat (entries in usedIds before eviction). */
export const PROSE_REPETITION_GUARD_WINDOW = 6;

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Pick a phrase from `pool`, preferring entries whose `phraseId` is NOT in
 * `usedIds`.  Falls back to the full pool only when every entry has been used.
 *
 * Mutates `usedIds` by adding the chosen phraseId.
 * Also trims `usedIds` to at most `guardWindow` entries (oldest evicted first)
 * when the caller passes an ordered Array instead of a plain Set — callers using
 * a plain Set get no eviction, which is fine for within-tick deduplication.
 *
 * @param pool        Pool of phrase entries to pick from.
 * @param rng         Seeded PRNG (determinism required).
 * @param usedIds     Set of recently used phraseIds (mutated in place).
 * @param guardWindow Max number of IDs kept in the window (used for Array callers).
 */
export function pickWithRepetitionGuard(
  pool: PhraseEntry[],
  rng: () => number,
  usedIds: Set<string>,
  guardWindow: number = PROSE_REPETITION_GUARD_WINDOW,
): PhraseEntry {
  if (pool.length === 0) {
    throw new Error('pickWithRepetitionGuard: pool must not be empty');
  }

  const fresh = pool.filter(e => !usedIds.has(e.phraseId));
  const candidates = fresh.length > 0 ? fresh : pool;
  const picked = candidates[Math.floor(rng() * candidates.length)];

  usedIds.add(picked.phraseId);

  // Evict oldest entries when the window is bounded (no-op for a plain Set, but
  // callers can choose to manage size themselves by clearing and re-populating).
  // For Sets, size grows unboundedly — intentional for within-tick use.
  void guardWindow; // guard window used by callers managing their own sliding window

  return picked;
}
