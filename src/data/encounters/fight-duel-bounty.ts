/**
 * `fight.duel.bounty` and `fight.duel.bounty_defence` — a bounty collected in a duel
 * (THR-2072, plan doc `Docs/plans/2026-10-26-thr-2072-bounty-collected-in-a-duel.md`
 * § Encounter templates).
 *
 * The same agent-mode fight block as `fight.duel.grudge` ("Old Blood"), with its own
 * lines. Both are **spawn-only**: no `locationSubtypes`, no cache registration. They
 * arrive through the bounty licence in `grudgeDuelTrigger.ts` and the CLI
 * `spawn duel <hunter> --with <target> --bounty`.
 *
 * - `fight.duel.bounty` — the hunter is the actor (the usual case).
 * - `fight.duel.bounty_defence` — the hunted is the actor, used only when the hunted is
 *   threaded and the hunter is not: the god's hand reaches only the actor.
 *
 * Every result line agrees with whether the bounty was collected. From the hunter's
 * side a beaten target and a fled target both read `overcome`, and only the first
 * collects, so the hunter's `overcome` line does not say whether the price was paid —
 * the chronicle line (`BOUNTY_CHRONICLE_LINE`) or the escaped line says it.
 * `bargained` and `driven_off` are NPC-mode results a duel never reaches; they carry a
 * line so every key resolves.
 */

import type { ActionStep, AftermathVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { FightResult } from '../../types/fight';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../../types/encounter';
import { FIGHT_RESULT_CHOICE_PREFIX } from '../fight-constants';
import { fightBlock, fightResultIndex } from '../fights/fightBlock';

export const FIGHT_DUEL_BOUNTY_ID = 'fight.duel.bounty';
export const FIGHT_DUEL_BOUNTY_DEFENCE_ID = 'fight.duel.bounty_defence';

/** The two bounty-duel template ids (the fight-end branch acts on these only). */
export const FIGHT_DUEL_BOUNTY_IDS: readonly string[] = [FIGHT_DUEL_BOUNTY_ID, FIGHT_DUEL_BOUNTY_DEFENCE_ID];

const CLASHES = [
  { narrativeTemplate: 'Neither of them walks away. The first exchange begins.', purposeLine: 'Land a blow' },
  { narrativeTemplate: 'Both of them are bleeding now. {name} goes at {target} again.', purposeLine: 'Land a blow' },
  { narrativeTemplate: 'One of them has to give. {name} goes in for the last exchange.', purposeLine: 'Land a blow' },
];

function bountySteps(nerve: string): ActionStep[] {
  return fightBlock({
    mode: 'agent',
    // Fights inherit the hand (charter rule 7), as the grudge duel does.
    deal: { count: 4, tags: ['might', 'peril'] },
    nerve: { narrativeTemplate: nerve, purposeLine: 'Stand your ground' },
    clashes: CLASHES,
  });
}

const HUNTER_STEPS = bountySteps(
  '{name} finds {target} near {location}. There is a price on that head, and {name} has come to collect it.',
);
const HUNTED_STEPS = bountySteps(
  '{target} has come for {name} near {location}, for the price on {name}\'s head.',
);

/** The hunter's side (actor = hunter). */
const HUNTER_RESULT_LINES: Readonly<Record<FightResult, string>> = {
  overcome: '{name} got the better of {target}.',
  struck_down: '{target} cut {name} down. The price on {target}\'s head still stands.',
  yielded: '{name} gave way to {target}. The price on {target}\'s head still stands.',
  routed: '{name} ran from {target}. The price on {target}\'s head still stands.',
  broke_off: 'Neither of them was beaten. The price on {target}\'s head still stands.',
  bargained: '{name} and {target} came to terms. The price still stands.',
  driven_off: '{target} backed away from {name}. The price still stands.',
};

/** The hunted's side (actor = hunted). */
const HUNTED_RESULT_LINES: Readonly<Record<FightResult, string>> = {
  overcome: '{name} beat {target} and sent the hunter away unpaid.',
  struck_down: '{target} cut {name} down and collected the price on {name}\'s head.',
  yielded: '{name} gave way to {target}, and the price on {name}\'s head is paid.',
  routed: '{name} ran from {target}, and got away. The price on {name}\'s head still stands.',
  broke_off: 'Neither of them was beaten. The price on {name}\'s head still stands.',
  bargained: '{name} and {target} came to terms. The price still stands.',
  driven_off: '{target} backed away from {name}. The price still stands.',
};

function variants(lines: Readonly<Record<FightResult, string>>): Record<string, AftermathVariant> {
  return Object.fromEntries(
    (Object.keys(lines) as FightResult[]).map(
      (result) => [`${FIGHT_RESULT_CHOICE_PREFIX}${result}`, { overview: lines[result], changes: [] }],
    ),
  );
}

/** What both templates share with the grudge duel. */
const DUEL_SHAPE = {
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'delete',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  sphereAffinity: 'matter',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
} as const satisfies Partial<UnifiedActionTemplate>;

export const FIGHT_DUEL_BOUNTY: UnifiedActionTemplate = {
  ...DUEL_SHAPE,
  actorAffinities: [...DUEL_SHAPE.actorAffinities],
  motivations: [...DUEL_SHAPE.motivations],
  id: FIGHT_DUEL_BOUNTY_ID,
  name: 'The Price on Their Head',
  description: '{name} has come to collect the price on {target}\'s head.',
  stakes: {
    goal: 'collect a price on an old comrade\'s head',
    risk: 'be cut down by the one they came to collect',
    // The stakes builder fills only {actor}/{won}/{lost}, never a token inside them, so
    // these name the price without the target's name (the plan's `{target}` would leak).
    won: 'collected the price on an old comrade\'s head',
    lost: 'let the price on an old comrade\'s head go unpaid',
  },
  steps: HUNTER_STEPS,
  narrativeTemplates: {
    initiation: '{name} finds {target} near {location}. There is a price on that head, and {name} has come to collect it.',
    success: '{name} walked away from the fight the winner, and {target} did not.',
    failure: '{name} walked away from the fight beaten, and the price on {target}\'s head still stands.',
  },
  aftermathConfig: {
    branchOnStep: fightResultIndex(HUNTER_STEPS),
    variants: variants(HUNTER_RESULT_LINES),
    fallback: {
      overview: 'The fight between {name} and {target} near {location} is over.',
      changes: [],
    },
  },
};

export const FIGHT_DUEL_BOUNTY_DEFENCE: UnifiedActionTemplate = {
  ...DUEL_SHAPE,
  actorAffinities: [...DUEL_SHAPE.actorAffinities],
  motivations: [...DUEL_SHAPE.motivations],
  id: FIGHT_DUEL_BOUNTY_DEFENCE_ID,
  name: 'Hunted',
  description: '{target} has come for {name}, for the price on {name}\'s head.',
  stakes: {
    goal: 'send the hunter away unpaid',
    risk: 'be run down by the hunter who came for them',
    won: 'sent the hunter away unpaid',
    lost: 'was run down by the hunter who came for them',
  },
  steps: HUNTED_STEPS,
  narrativeTemplates: {
    initiation: '{target} has come for {name} near {location}, for the price on {name}\'s head.',
    success: '{name} walked away from the fight the winner, and the hunter went away unpaid.',
    failure: '{name} walked away from the fight beaten, and {target} saw it done.',
  },
  aftermathConfig: {
    branchOnStep: fightResultIndex(HUNTED_STEPS),
    variants: variants(HUNTED_RESULT_LINES),
    fallback: {
      overview: 'The fight between {name} and {target} near {location} is over.',
      changes: [],
    },
  },
};
