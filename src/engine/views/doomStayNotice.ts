/**
 * THR-2207 — what the Doom notice adds for Stay the Unmaking.
 *
 * A pure read of the game state, so the popup component holds no rule. Three cases:
 *  - the god does not hold the card → nothing (no button, no hint line);
 *  - the god holds it and it is not active → the hint line and the "Stay it" button;
 *  - it is already active → one line, "You are holding it back.", and no button.
 *
 * "Held" means the card is in the god's hand (`unlockedActionIds`, written by the
 * first-stage milestone's grant). "Active" means an active Stay control effect the
 * god owns, or a cast of it still in flight (it is already paid for).
 */
import type { GameState } from '../../types/gameState';
import {
  DOOM_STAY_ACTIVE_LINE,
  DOOM_STAY_BUTTON,
  DOOM_STAY_TEMPLATE_ID,
  doomStayHint,
} from '../../data/doom-stay-content';
import { sphereWord } from '../../data/essence-format';
import { findHeldNonStackingEffect, findPendingNonStackingCast } from '../controlEffectSpawn';
import { getSpherePoints, rankSpherePoints } from '../spherePoints';

/** The popup event type this notice decorates. */
export const DOOM_STAY_NOTICE_EVENT_TYPE = 'doom_escalation';

export interface DoomStayNotice {
  /** The extra body line, or undefined when the card is not held. */
  readonly line?: string;
  /** The second button's label, present only while the card is held and not active. */
  readonly button?: string;
}

export function doomStayNotice(
  state: Pick<GameState, 'ascendantId' | 'unlockedActionIds' | 'controlEffects' | 'unifiedActions' | 'graph'>,
): DoomStayNotice {
  const ascendantId = state.ascendantId;
  if (!ascendantId || !(state.unlockedActionIds ?? []).includes(DOOM_STAY_TEMPLATE_ID)) return {};

  const active = findHeldNonStackingEffect(state.controlEffects, DOOM_STAY_TEMPLATE_ID, ascendantId, ascendantId)
    ?? findPendingNonStackingCast(state.unifiedActions, DOOM_STAY_TEMPLATE_ID, ascendantId, ascendantId);
  if (active) return { line: DOOM_STAY_ACTIVE_LINE };

  // The upkeep is charged to the god's primary (`perTickCostFromPrimary`), resolved
  // the same way the control effect resolves it.
  const primary = rankSpherePoints(getSpherePoints(state.graph?.getNode(ascendantId)?.properties))[0];
  return {
    line: doomStayHint(primary ? sphereWord(primary) : undefined),
    button: DOOM_STAY_BUTTON,
  };
}
