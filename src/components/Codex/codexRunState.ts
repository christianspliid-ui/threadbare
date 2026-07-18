/**
 * Codex run-state grammar — the three legible states of an ascendant's card, for the
 * current run/incarnation (THR-613 Slice 3b-tail, plan §5.B).
 *
 * The design gate for §5.B (2026-07-18, human-reviewed) resolved *against* putting
 * "acquirable this run" ghost cards in the live ActionDrawer — the flood-control risk
 * under the empty THR-501 starter floor, and the blast radius of touching the
 * `getTargetActionSlots` filter cascade. Instead the full three-state catalog lives in
 * the Codex (already a browsable catalog of divine actions), reachable pre-filtered from
 * the ascendant's character sheet. The live drawer's card population is unchanged.
 *
 * One source of truth: this reuses the shipped `SignaturePathState` grammar + copy the
 * Reaches/Signatures readouts already use (Slices 3a/3b), so the character-sheet readout
 * and the Codex can never drift on what counts as "yours" vs. "another incarnation's".
 *
 * Pure + deterministic (NFP #3); no PRNG, no side effects. Memoize on worldVersion.
 */

import type { GameState } from '../../types/gameState';
import { getAscendantProgress } from '../../engine/phaseAscendantProgression';
import type { SignaturePathState } from '../../data/ascendant-bar-content';
import type { CodexEntry } from './codexRegistry';

// Re-export the shipped grammar so Codex call-sites import it from one place.
export type { SignaturePathState } from '../../data/ascendant-bar-content';
export { SIGNATURE_STATE_COPY } from '../../data/ascendant-bar-content';

/** The three legible states a card can hold this incarnation (alias of the shipped type). */
export type CodexRunState = SignaturePathState;

/**
 * Compact badge label per state, for the Codex card pill. Plain register (THR-609),
 * prose-first, never a number. The longer one-line hint lives in `SIGNATURE_STATE_COPY`.
 */
export const CODEX_RUN_STATE_BADGE: Record<CodexRunState, string> = {
  available: 'Yours',
  acquirable: 'Within reach',
  locked_incarnation: 'Another life',
};

/** Filter options for the Codex state control. `all` shows every entry regardless of state. */
export type CodexRunStateFilter = CodexRunState | 'all';

/** Ordered filter chips + their labels (the character-sheet deep-link targets `acquirable`). */
export const CODEX_RUN_STATE_FILTERS: { id: CodexRunStateFilter; label: string }[] = [
  { id: 'all', label: 'All paths' },
  { id: 'available', label: 'Yours' },
  { id: 'acquirable', label: 'Within reach' },
  { id: 'locked_incarnation', label: 'Another life' },
];

export interface CodexRunContext {
  /**
   * The god's permanent reaches — the exact set `getAscendantProgress` reports, the same
   * read the Reaches/Signatures readouts use, so the three surfaces cannot disagree on
   * what counts as "your reach".
   */
  domains: ReadonlySet<string>;
  /** Ids revealed into this run's palette (Ascendant Beat `unlock_action` grants + starters). */
  unlockedActionIds: ReadonlySet<string>;
}

/**
 * Build the run context from live game state. Returns `null` when there is no readable
 * ascendant (legacy save / pre-remembrance / standalone `?view=codex` with no game) — the
 * caller then renders the plain catalog with no incarnation badges.
 */
export function buildCodexRunContext(gameState: GameState): CodexRunContext | null {
  const progress = getAscendantProgress(gameState);
  if (!progress) return null;
  return {
    domains: new Set(progress.reaches.map((r) => r.reach)),
    unlockedActionIds: new Set(gameState.unlockedActionIds ?? []),
  };
}

/**
 * The three-state grammar for one Codex entry against the current incarnation.
 *
 * Returns `null` for entries that are not the god's own reach-gated/earnable cards
 * (mortal actions, possessions, conditions, agreements) — those carry no incarnation
 * state and render without a badge.
 *
 * The lock predicate keys on `requiresReach` — the *actual* reach gate
 * (`getTargetActionSlots`, THR-503) — never on the card's `reach` classification tag. A
 * universal card (no `requiresReach`, e.g. a `reach: 'star'` divine action) is playable by
 * any incarnation and is therefore never "locked this incarnation"; keying on the flavor
 * reach would wrongly grey it out. This mirrors exactly what the live drawer hides.
 */
export function codexEntryRunState(
  entry: CodexEntry,
  ctx: CodexRunContext,
): CodexRunState | null {
  if (!entry.isAscendantAction) return null;
  // Locked this incarnation: the card's *gate* reach is outside the god's permanent domains.
  if (entry.requiresReach && !ctx.domains.has(entry.requiresReach)) {
    return 'locked_incarnation';
  }
  // Held ("available"): already revealed into this run's palette — a starter (none today,
  // THR-501) or an earned Ascendant Beat grant.
  if (entry.isStarter === true || ctx.unlockedActionIds.has(entry.id)) {
    return 'available';
  }
  // Acquirable this run: in-domain (or universal) but not yet earned — "not yet".
  return 'acquirable';
}
