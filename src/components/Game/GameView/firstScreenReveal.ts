/**
 * A quiet first screen (THR-1648, opening plan S5).
 *
 * Round-1 cold testers met rival war toasts, a climbing doom bar, rotating omens
 * and a ledger badge in the hundreds inside their first minute. Law 53 — the HUD
 * is a budget: until the player has bonded The First, the pressure surfaces stay
 * off the screen and arrive one at a time with the thing that earns them.
 *
 * - **At the bond:** the doom bar, the mandate and the notables. The doom wake
 *   line (THR-1646) already arrives as a toast-tier toast on the same tick.
 * - **Rivals:** with the first rival action.
 * - **Omens:** with the first omen (`omenState.primary`, as before).
 *
 * `?seeded` pre-bonds The First, so every dev URL shows the full HUD unchanged.
 *
 * Pure selector here; {@link useFirstScreenReveal} latches it so a surface, once
 * shown, never disappears again (a First who dies does not re-quiet the screen).
 */

import { useRef } from 'react';
import { isFirstBonded } from '../../../engine/meetingEncounter';
import type { GameState } from '../../../types/gameState';

export interface FirstScreenReveal {
  /** The ascendant holds a `thread` edge at `the_first`. */
  readonly bonded: boolean;
  readonly doom: boolean;
  readonly mandate: boolean;
  readonly notables: boolean;
  readonly rivals: boolean;
  readonly omens: boolean;
}

/** True once any rival has acted — an intervention landed or a scheme launched. */
export function hasRivalActed(gameState: GameState): boolean {
  const states = gameState.rivalStates ?? [];
  return states.some(
    s => (s.interventionCount ?? 0) > 0 || (s.schemes?.length ?? 0) > 0 || s.lastSchemeLaunchTick != null,
  );
}

export function selectFirstScreenReveal(gameState: GameState): FirstScreenReveal {
  let bonded = false;
  try {
    bonded = !!gameState.ascendantId && isFirstBonded(gameState.graph, gameState.ascendantId);
  } catch {
    // Fail-soft (NFP #4): an unreadable graph shows the full HUD rather than hiding it.
    bonded = true;
  }
  return {
    bonded,
    doom: bonded,
    mandate: bonded,
    notables: bonded,
    rivals: bonded && hasRivalActed(gameState),
    omens: bonded && !!gameState.omenState?.primary,
  };
}

/**
 * Latching wrapper: each flag turns on at most once and stays on for the session.
 * Omens are the exception — the indicator still hides between omens, exactly as
 * it did before this slice, because it has nothing to show without a primary.
 */
export function useFirstScreenReveal(gameState: GameState): FirstScreenReveal {
  const latch = useRef({ bonded: false, doom: false, mandate: false, notables: false, rivals: false });
  const live = selectFirstScreenReveal(gameState);
  const l = latch.current;
  l.bonded ||= live.bonded;
  l.doom ||= live.doom;
  l.mandate ||= live.mandate;
  l.notables ||= live.notables;
  l.rivals ||= live.rivals;
  return {
    bonded: l.bonded,
    doom: l.doom,
    mandate: l.mandate,
    notables: l.notables,
    rivals: l.rivals,
    omens: l.bonded && !!gameState.omenState?.primary,
  };
}

/**
 * Unread chapters for the Chapter Ledger launcher badge: threaded chapters that
 * appeared since the ledger was last opened. `seenCount` is UI-local and resets
 * on reload, which the plan accepts.
 */
export function unreadChapterCount(currentCount: number, seenCount: number): number {
  return Math.max(0, currentCount - seenCount);
}
