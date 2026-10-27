/**
 * THR-2072 — the fight-end branch that collects a bounty (plan doc
 * `Docs/plans/2026-10-26-thr-2072-bounty-collected-in-a-duel.md` § Systems design).
 *
 * Runs after `fighterEndingBranch`, so both sides' faces are already on the action.
 * Acts only on the two bounty-duel templates. The loser is the side whose face is
 * `yielded_to_mortal`, `spared`, `mauled` or `slain`; if the winner can hunt an open
 * bounty on the loser (`huntableBounty`), it is collected and one notable chronicle
 * event says so. When a side ran (`routed`) from a hunter who holds a bounty on them,
 * one routine event says the price still stands. Any other end leaves the bounty open;
 * the pair's fight cooldown stops a rematch inside the window.
 *
 * Fail-soft: a throw is caught here and the fight's own ending goes on.
 */

import type { TickEvent } from '../../types/gameState';
import type { FightEndingFace } from '../../types/fight';
import type { FightEndBranch } from './fightOutcome';
import { FIGHT_DUEL_BOUNTY_IDS } from '../../data/encounters/fight-duel-bounty';
import { BOUNTY_ESCAPED_LINE } from '../../data/fight-ending-content';
import { FIGHT_EVENT_SIGNIFICANCE } from '../../data/fight-constants';
import { FACTION_BOUNTIES_ENABLED } from '../../types/factionAction';
import { bountyLineNames, collectBounty, fillBountyLine, huntableBounty } from '../factionBounties';

/** The faces that mean a side was beaten, and so pay a bounty on them. */
const COLLECTING_FACES: ReadonlySet<FightEndingFace> = new Set<FightEndingFace>(['yielded_to_mortal', 'spared', 'mauled', 'slain']);

export const bountyCollectBranch: FightEndBranch = (state, action, ctx) => {
  if (!FACTION_BOUNTIES_ENABLED || !FIGHT_DUEL_BOUNTY_IDS.includes(action.templateId)) return;
  const fight = action.fightState;
  if (!fight?.result) return;
  const actorId = action.actorId;
  const opponentId = fight.opponentId ?? action.targetId;
  if (!opponentId) return;
  const actorFace = fight.ending?.face;
  const opponentFace = fight.opponentEnding?.face;
  const graph = state.graph;
  try {
    const events: TickEvent[] = [];
    const sides: Array<[string, string, FightEndingFace | undefined]> = [
      [actorId, opponentId, opponentFace],
      [opponentId, actorId, actorFace],
    ];
    // A beaten side pays the bounty on them to the side that beat them.
    for (const [winnerId, loserId, loserFace] of sides) {
      if (!loserFace || !COLLECTING_FACES.has(loserFace)) continue;
      const bounty = huntableBounty(graph, winnerId, loserId, ctx.tick);
      if (!bounty) continue;
      const collected = collectBounty(state, bounty.id, winnerId, ctx.tick);
      if (!collected) continue;
      events.push({
        id: `bounty_collected_${action.actionId}_${ctx.tick}`,
        tick: ctx.tick,
        type: 'fight_ended',
        message: collected.line,
        significance: FIGHT_EVENT_SIGNIFICANCE.notable,
        actorId: winnerId,
      });
      return { events };
    }
    // A side that ran from the hunter got away: the price still stands.
    for (const [chaserId, runnerId, runnerFace] of sides) {
      if (runnerFace !== 'routed') continue;
      if (!huntableBounty(graph, chaserId, runnerId, ctx.tick)) continue;
      events.push({
        id: `bounty_escaped_${action.actionId}_${ctx.tick}`,
        tick: ctx.tick,
        type: 'fight_ended',
        message: fillBountyLine(BOUNTY_ESCAPED_LINE, bountyLineNames(graph, chaserId, runnerId)),
        significance: FIGHT_EVENT_SIGNIFICANCE.routine,
        actorId: runnerId,
      });
      return { events };
    }
    return;
  } catch (err) {
    console.warn('[bountyCollect] branch failed:', err);
    return;
  }
};
