/**
 * `fight.duel.grudge` — "Old Blood", the systemic duel (THR-1556, duels plan doc
 * `Docs/plans/2026-09-23-mortal-duels.md` § Content pillar).
 *
 * An **agent-mode** fight block alone: both sides are mortals and both roll (plan
 * doc §1–4). The opponent is the action's target (the block carries no
 * `opponentRef`).
 *
 * **Spawn-only.** No `locationSubtypes` and no cache registration, so the draw
 * pipeline never offers it. It arrives through plan doc 5's grudge trigger (E3,
 * colocation), and the `spawnDuel` debug lever and CLI `spawn duel`.
 *
 * The opening line is the **nerve step's prose**, not a step of its own: a
 * separate non-fight step can roll a critical failure, which `advanceStep` turns
 * into the action's end, so about one duel in a hundred would abort before
 * `fightState` exists and fall into no calibration class.
 *
 * Why the opening does not name the grudge's cause: enrichment has no grudge-clause
 * token, and the cause is already named where it lives — the sheet's Blood section
 * and the chronicle line. The faces (spared, slain, mauled) reach the player
 * through plan doc 1's chronicle lines and plan doc 4's chips, keyed on
 * `fightState.ending` / `opponentEnding`; this aftermath keys only on the result.
 */

import type { AftermathVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { FightResult } from '../../types/fight';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../../types/encounter';
import { FIGHT_RESULT_CHOICE_PREFIX } from '../fight-constants';
import { fightBlock, fightResultIndex } from '../fights/fightBlock';

export const FIGHT_DUEL_GRUDGE_ID = 'fight.duel.grudge';

const STEPS = fightBlock({
  mode: 'agent',
  // Fights inherit the hand (charter rule 7): an attended duel deals the god's own
  // cards to the god's own mortal, who is always the duel's actor.
  deal: { count: 4, tags: ['might', 'peril'] },
  nerve: {
    narrativeTemplate: '{name} sees {target} across the square, and the old wound opens.',
    purposeLine: 'Stand your ground',
  },
  clashes: [
    { narrativeTemplate: 'Neither of them walks away. The first exchange begins.', purposeLine: 'Land a blow' },
    { narrativeTemplate: 'Both of them are bleeding now. {name} goes at {target} again.', purposeLine: 'Land a blow' },
    { narrativeTemplate: 'One of them has to give. {name} goes in for the last exchange.', purposeLine: 'Land a blow' },
  ],
});

/**
 * One short line per fight result, read from the actor's side (plan doc §3's
 * matrix). `bargained` and `driven_off` are NPC-mode results a duel never reaches;
 * they carry a line so every result key resolves.
 */
const RESULT_LINES: Readonly<Record<FightResult, string>> = {
  overcome: '{name} beat {target}. The old wound between them is paid for, for now.',
  struck_down: '{target} cut {name} down. The feud has a new wound to remember.',
  yielded: '{name} gave way to {target}, in front of everyone who saw.',
  routed: '{name} ran from {target}. Nobody who saw it will forget.',
  broke_off: 'The fight ended with neither of them beaten. The feud is not over.',
  bargained: '{name} and {target} came to terms. Neither will say what was agreed.',
  driven_off: '{target} backed away from {name}, and did not come back.',
};

function resultVariant(result: FightResult): AftermathVariant {
  return { overview: RESULT_LINES[result], changes: [] };
}

export const FIGHT_DUEL_GRUDGE: UnifiedActionTemplate = {
  id: FIGHT_DUEL_GRUDGE_ID,
  name: 'Old Blood',
  description: '{name} and {target} settle an old grudge with blades.',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'delete',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  sphereAffinity: 'matter',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  steps: STEPS,
  narrativeTemplates: {
    initiation: '{name} sees {target} across the square near {location}, and the old wound opens.',
    success: '{name} walked away from the fight with {target} the winner.',
    failure: '{name} walked away from the fight with {target} beaten.',
  },
  aftermathConfig: {
    branchOnStep: fightResultIndex(STEPS),
    variants: Object.fromEntries(
      (Object.keys(RESULT_LINES) as FightResult[]).map(
        (result) => [`${FIGHT_RESULT_CHOICE_PREFIX}${result}`, resultVariant(result)],
      ),
    ),
    fallback: {
      overview: 'The fight between {name} and {target} near {location} is over.',
      changes: [],
    },
  },
};
