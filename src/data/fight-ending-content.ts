/**
 * What a fight's ending hands out and how the chronicle tells it (THR-1549, plan doc
 * `Docs/plans/2026-09-23-defeat-and-victory.md` §4–5 and Content pillar, slice D2).
 *
 * - `FIGHT_TROPHY_RECIPE` / `FIGHT_TROPHY_OUTCOME`: the trophy draw's recipe and tier
 *   curve per result and lair tier. The draw goes through `drawSeededReward`, the one
 *   draw path, so a `reward_tier_bonus` blessing improves a trophy with no fight code.
 *   No reward-pool entry is retagged and no trophy catalog exists (THR-1270's guard).
 * - `FIGHT_CHRONICLE_LINES`: one chronicle line per ending face. `{fighter}`,
 *   `{opponent}` and `{place}` are the fight-ending branch's own three slots, filled
 *   from names it already holds — not enrichment tokens, since `phaseNarrative` copies
 *   the message verbatim. GAME register, GM narration.
 * - `FIGHT_CHRONICLE_LINES_PLAIN`: the plain variants for the two lines that name a
 *   write. A line never claims a write that did not happen.
 */

import type { RewardPoolRecipe } from '../types/attachments';
import type { OutcomeType } from '../types/resolution';
import type { FightEndingFace } from '../types/fight';

/**
 * The trophy recipe. `categoryWeights` is keyed by attachment *category*
 * (`possession`), not by possession subcategory: v1 does not narrow to arms, relics or
 * hides. A beast's den holds whatever the pool holds.
 */
export const FIGHT_TROPHY_RECIPE: RewardPoolRecipe = {
  categoryWeights: { possession: 1 },
};

/** The lair tiers that hold a trophy. A minor lair, or none, yields nothing. */
export type FightTrophyLairTier = 'major' | 'legendary';

/**
 * The reward outcome band per result and lair tier — it selects the pool's existing
 * `TIER_CURVE_*`. At a major lair a bargain pays like a kill; at a legendary lair the
 * kill draws on the `critical_success` curve and the bargain on `success`.
 */
export const FIGHT_TROPHY_OUTCOME: Readonly<Record<'overcome' | 'bargained', Readonly<Record<FightTrophyLairTier, OutcomeType>>>> = {
  overcome: { major: 'success', legendary: 'critical_success' },
  bargained: { major: 'success', legendary: 'success' },
};

/** The chronicle line per ending face. */
export const FIGHT_CHRONICLE_LINES: Readonly<Record<FightEndingFace, string>> = {
  overcome_monster: '{fighter} felled {opponent} at {place}.',
  overcome_mortal: '{fighter} beat {opponent} at {place}.',
  driven_off: '{fighter} drove {opponent} out of {place}.',
  bargained: '{fighter} let {opponent} live at {place}, and walked away with something.',
  mauled: '{opponent} struck {fighter} down at {place}; {fighter} will carry the scar.',
  spared: '{opponent} beat {fighter} at {place}, and let them live.',
  slain: '{opponent} killed {fighter} at {place}.',
  yielded_to_mortal: '{fighter} yielded to {opponent} at {place}, and everyone at home will hear of it.',
  yielded_to_monster: '{fighter} gave ground to {opponent} at {place}.',
  routed: '{fighter} fled from {opponent} at {place}.',
  broke_off: '{fighter} and {opponent} broke off at {place}, both bloodied.',
};

/**
 * The plain lines, used when the write a line names was skipped: a bargain with no
 * prize, a mauling with no new scar.
 */
export const FIGHT_CHRONICLE_LINES_PLAIN: Readonly<Partial<Record<FightEndingFace, string>>> = {
  bargained: '{fighter} let {opponent} live at {place}.',
  mauled: '{opponent} struck {fighter} down at {place}.',
};

/** The name a line gives a foe with no node (a default card). */
export const FIGHT_CHRONICLE_NAMELESS_FOE = 'its foe';

/** The name a line gives a place it cannot resolve. */
export const FIGHT_CHRONICLE_NAMELESS_PLACE = 'the wilds';
