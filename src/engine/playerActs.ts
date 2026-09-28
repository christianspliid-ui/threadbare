/**
 * Player acts (THR-1647, plan `Docs/plans/2026-09-27-thr-1605-the-opening.md` S4).
 *
 * `GameState.playerActCount` is a monotonic engine counter of the player's own
 * acts: a committed cast (`commitPlayerCast`), an avatar move command, and a
 * Follow. The ascendant beat director spaces the opening's spine gifts 1–4 by it,
 * so the god's gifts arrive between the player's own acts rather than on a timer.
 *
 * It is never a player-facing word, so it owes no UL entry.
 */
import type { GameState } from '../types/gameState';

/** The patch that records one player act. Pure; spread it into the next state. */
export function recordPlayerAct(state: Pick<GameState, 'playerActCount'>): Pick<GameState, 'playerActCount'> {
  return { playerActCount: (state.playerActCount ?? 0) + 1 };
}
