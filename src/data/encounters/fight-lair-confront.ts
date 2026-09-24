/**
 * `fight.lair.confront` — "The Beast in Its Den", the first standalone fight
 * template (THR-1543, plan doc `Docs/plans/2026-09-23-fight-block.md` § Content
 * pillar).
 *
 * **Spawn-only.** No `locationSubtypes` and no cache registration, so the draw
 * pipeline never offers it. It arrives through plan doc 3's lair trigger, plan doc
 * 6's hunt (by query: `actorAffinities` is declared because `eligibleAt` drops a
 * template without it), and the `spawnFight` debug lever.
 *
 * The opponent is the action's target (the block carries no `opponentRef`). The
 * opening line is the **nerve step's prose**, not a separate step: `advanceStep`
 * ends an action on any critical failure, so a non-fight opening step would abort
 * about one fight in a hundred before `fightState` exists.
 *
 * The aftermath keys on the fight's result memory at `fightResultIndex(steps)` —
 * one short line per result. The fight's consequence chips are plan doc 4's.
 */

import type { AftermathVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { FightResult } from '../../types/fight';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../../types/encounter';
import { FIGHT_RESULT_CHOICE_PREFIX } from '../fight-constants';
import { fightBlock, fightResultIndex } from '../fights/fightBlock';

export const FIGHT_LAIR_CONFRONT_ID = 'fight.lair.confront';

const STEPS = fightBlock({
  // Fights inherit the hand (charter rule 7): an attended fight deals the god's
  // own cards into every exchange, scored for a scene of strength and danger.
  deal: { count: 4, tags: ['might', 'peril'] },
  nerve: {
    narrativeTemplate:
      '{name} stands at the mouth of the den near {location}. Inside, {target} has heard them, '
      + 'and is waiting.',
    purposeLine: 'Stand your ground',
  },
  clashes: [
    { narrativeTemplate: '{target} comes out of the dark, and the first exchange begins.', purposeLine: 'Land a blow' },
    { narrativeTemplate: 'Both of them are bleeding now. {name} closes again.', purposeLine: 'Land a blow' },
    { narrativeTemplate: 'One of them has to give. {name} goes in for the last exchange.', purposeLine: 'Land a blow' },
  ],
});

/** One short line per fight result (plan doc § Content pillar). */
const RESULT_LINES: Readonly<Record<FightResult, string>> = {
  overcome: '{name} overcame {target} in its den. Whatever lived there is broken.',
  driven_off: '{target} fled its den with {name}\'s marks on it. It will not come back soon.',
  bargained: '{name} and {target} came to terms in the dark. Neither will say what was agreed.',
  broke_off: 'The fight ended with neither side beaten. {target} still holds its den.',
  yielded: '{name} gave ground and backed out of the den. {target} let them go.',
  routed: '{name} broke and ran from {target}\'s den.',
  struck_down: '{target} struck {name} down in the mouth of its den.',
};

function resultVariant(result: FightResult): AftermathVariant {
  return { overview: RESULT_LINES[result], changes: [] };
}

export const FIGHT_LAIR_CONFRONT: UnifiedActionTemplate = {
  id: FIGHT_LAIR_CONFRONT_ID,
  name: 'The Beast in Its Den',
  description: '{name} goes into the den to face {target}.',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'delete',
  scale: 'regional',
  apCost: 1,
  actorAffinities: ['individual'],
  sphereAffinity: 'matter',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  steps: STEPS,
  narrativeTemplates: {
    initiation: '{name} goes into the den near {location} to face {target}.',
    success: '{name} came out of the den the winner.',
    failure: '{name} came out of the den beaten.',
  },
  aftermathConfig: {
    branchOnStep: fightResultIndex(STEPS),
    variants: Object.fromEntries(
      (Object.keys(RESULT_LINES) as FightResult[]).map(
        (result) => [`${FIGHT_RESULT_CHOICE_PREFIX}${result}`, resultVariant(result)],
      ),
    ),
    fallback: {
      overview: 'The fight in the den near {location} is over.',
      changes: [],
    },
  },
};
