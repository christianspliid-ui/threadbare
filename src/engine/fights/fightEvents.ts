/**
 * Fight events — the effect-event raises a fight makes (THR-1541, fight block FB5;
 * plan doc `Docs/plans/2026-09-23-fight-block.md` §9, THR-1530 §4).
 *
 * A fight is where items, traits and a monster's powers are supposed to *happen*:
 * a thorned hide that bites whoever strikes it, a blade that grows keener with
 * every exchange won, a trophy charm that stacks on each kill. All of that already
 * exists as reactive / stacking / `until_event` effects; what was missing was a
 * producer. This module is that producer — one function per moment, each a thin
 * call to `raiseEffectEvent`, so the fight handler names the moment and the
 * dispatcher does the rest.
 *
 * | Moment                              | Raise                                   | On |
 * |-------------------------------------|-----------------------------------------|----|
 * | the handler's first run (nerve)     | `combat_started`, before the step's outcome | fighter and opponent |
 * | each fight step resolves            | `encounter_outcome {reach, success, combat: true}` | fighter |
 * | each clash that lands (+≥1)         | `attacked`                              | opponent; the fighter too on near miss / at cost (traded blows) |
 * | the band moves the clock            | `damaged {amount: delta}`               | opponent |
 * | result `overcome`                   | `opponent_overcome` → stack `on_kill`   | fighter |
 * | the fight ends (any result)         | `combat_ended`                          | both |
 *
 * Every raise passes the other side as `counterpartId` (a reactive's
 * `ExecutionContext.targetId`) and `FIGHT_ENCOUNTER_TYPE` (so a reactive's
 * predicate context reads "in combat").
 *
 * **Timing.** `combat_started` is raised when the nerve step resolves, because
 * that is when the handler first runs. A reactive that fires on it — a beast's
 * roar — therefore moves the *first clash*, never the nerve roll it follows.
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * | Failure case                     | Fallback                                  |
 * |----------------------------------|-------------------------------------------|
 * | No opponent (default card)       | Opponent-side raises are skipped; the fighter's still fire |
 * | A raise throws                   | `raiseEffectEvent` swallows it; the fight continues |
 * | A dead / missing agent           | `raiseEffectEvent` returns silently       |
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────────
 * No PRNG of its own. The step's resolution rng is passed through, in raise order,
 * after the step core's draws and before the forks' coin (plan doc PRNG table).
 */

import type { GameState } from '../../types/gameState';
import type { StepOutcome } from '../../types/unifiedAction';
import { isStepSuccess } from '../../types/unifiedAction';
import type { ReachDomain } from '../../types/traits';
import type { EffectEvent } from '../effects/effectEvents';
import { raiseEffectEvent, type EffectEventSite } from '../effects/effectEventDispatch';
import { FIGHT_ENCOUNTER_TYPE, FIGHT_TRADED_BLOW_BANDS } from '../../data/fight-constants';

/** Raise one fight event on `agentId`, with `counterpartId` as the other side. */
function raiseFightEvent(
  state: GameState,
  agentId: string | null,
  counterpartId: string | null,
  event: EffectEvent,
  site: EffectEventSite,
  rng: () => number,
): void {
  if (!agentId) return;
  raiseEffectEvent(state, agentId, event, {
    site,
    rng,
    encounterType: FIGHT_ENCOUNTER_TYPE,
    ...(counterpartId ? { counterpartId } : {}),
  });
}

/** `combat_started` on both sides — the handler's first run, before the step's outcome. */
export function raiseFightStarted(
  state: GameState,
  fighterId: string,
  opponentId: string | null,
  rng: () => number,
): void {
  raiseFightEvent(state, fighterId, opponentId, { type: 'combat_started' }, 'fight_start', rng);
  raiseFightEvent(state, opponentId, fighterId, { type: 'combat_started' }, 'fight_start', rng);
}

/**
 * The fighter's `encounter_outcome` for one fight step — every fight step, nerve
 * and clash alike, including the one that ends the fight. `combat: true` is what
 * lets a reach-swapped exchange still stack `combat_success`.
 */
export function raiseFightStepOutcome(
  state: GameState,
  fighterId: string,
  opponentId: string | null,
  reach: ReachDomain,
  outcome: StepOutcome,
  rng: () => number,
): void {
  raiseFightEvent(
    state, fighterId, opponentId,
    { type: 'encounter_outcome', reach, success: isStepSuccess(outcome), combat: true },
    'fight_step', rng,
  );
}

/**
 * A clash that landed (`clockDelta > 0`): `attacked` on the opponent, and on the
 * fighter too when blows were traded (near miss, at cost); then `damaged` on the
 * opponent for the clock the band moved. A clash that did not land raises nothing
 * here — a failure is not an attack that connected.
 */
export function raiseFightClashLanded(
  state: GameState,
  fighterId: string,
  opponentId: string | null,
  outcome: StepOutcome,
  clockDelta: number,
  rng: () => number,
): void {
  if (clockDelta <= 0) return;
  raiseFightEvent(state, opponentId, fighterId, { type: 'attacked' }, 'fight_clash', rng);
  if (FIGHT_TRADED_BLOW_BANDS.includes(outcome)) {
    raiseFightEvent(state, fighterId, opponentId, { type: 'attacked' }, 'fight_clash', rng);
  }
  raiseFightEvent(state, opponentId, fighterId, { type: 'damaged', amount: clockDelta }, 'fight_clash', rng);
}

/** `opponent_overcome` on the fighter (stack `on_kill`) — the fight was won. */
export function raiseFightOvercome(
  state: GameState,
  fighterId: string,
  opponentId: string | null,
  rng: () => number,
): void {
  raiseFightEvent(state, fighterId, opponentId, { type: 'opponent_overcome' }, 'fight_overcome', rng);
}

/** `combat_ended` on both sides — once per fight whose `combat_started` was raised. */
export function raiseFightEnded(
  state: GameState,
  fighterId: string,
  opponentId: string | null,
  rng: () => number,
): void {
  raiseFightEvent(state, fighterId, opponentId, { type: 'combat_ended' }, 'fight_end', rng);
  raiseFightEvent(state, opponentId, fighterId, { type: 'combat_ended' }, 'fight_end', rng);
}
