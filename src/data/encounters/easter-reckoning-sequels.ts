/**
 * The Wrong Feast Day's (`encounter.town.easter_reckoning`) two appointment sequels (THR-1757, batch brief
 * `Docs/plans/encounters/master-everyday-2-brief.md` § slot 6).
 *
 * `encounter.town.easter_reckoning` plants an appointment when the master proves the
 * reckoning before the canons: it is **read before the whole synod in the chapter house on
 * synod day, in three days**, with the dean there to answer it. The appointment substrate
 * holds that a meeting that cannot be missed is not a promise (THR-1479), so both branches
 * are authored with the parent:
 *
 * - `town.easter_reckoning_heard` — the **kept** branch. The mortal is standing in the town
 *   in the window; the synod sits to hear the reckoning and the dean answers for the
 *   cathedral's tables. If the reckoning holds, the synod moves the feast to its true day.
 * - `town.easter_reckoning_defaulted` — the **missed** branch. Nobody read the reckoning, the
 *   synod kept the tables, and the dean comes looking to have the reckoning signed away as a
 *   mistake. It fires wherever the mortal stands, so its prose never places them and its
 *   regard write targets the dean, never `$here` (which would bind whatever unrelated place
 *   the mortal is standing in — the rule `charter-inquest-sequels.ts` keeps).
 *
 * **Seed-only** (`drawable: false`, THR-1526): each opening assumes its parent, so the board
 * never offers them, and no `locationSubtypes` are declared — the seed is the only thing that
 * starts them. They sit outside the factory catalog (no `encounter.` prefix; the `town.`
 * prefix is claimed in `content-objects.ts`), the way `charter-inquest-sequels.ts` does. Both
 * inherit the parent's cast (`inheritContext`), so `{cast:dean}` binds.
 *
 * Prose: `Docs/plans/encounters/easter-reckoning-final.md` § Sequels (critic pass: the real-world feast name removed).
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const EASTER_RECKONING_HEARD_ID = 'town.easter_reckoning_heard';
export const EASTER_RECKONING_DEFAULTED_ID = 'town.easter_reckoning_defaulted';

/** The reckoning is already proved; this is holding it against the dean before the synod. */
const EASTER_RECKONING_HEARD_DIFFICULTY = 0.4;
/** Answering the dean for a reckoning nobody came to read. */
const EASTER_RECKONING_DEFAULTED_DIFFICULTY = 0.45;

export const EASTER_RECKONING_HEARD: UnifiedActionTemplate = {
  id: EASTER_RECKONING_HEARD_ID,
  stakes: {
    goal: 'hold the reckoning against the dean before the synod',
    risk: 'see the synod put off its ruling on the feast',
    won: 'held the reckoning, and the synod moved the feast',
    lost: 'saw the synod put off its ruling on the feast',
  },
  // Seed-only: the feast reckoning's appointment (kept branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Reckoning Heard',
  description: '{name} is in the chapter house on synod day, where the synod hears the reckoning of the spring feast.',
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'star',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty'],
  steps: [
    {
      reach: 'star',
      duration: { min: 1, max: 1 },
      difficulty: EASTER_RECKONING_HEARD_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Read the reckoning to the synod',
      narrativeTemplate:
        '{name} is in the chapter house in {location} on synod day. ' +
        "The synod sits to hear the reckoning, and {cast:dean} answers for the cathedral's tables. " +
        'If the reckoning holds against the dean, the synod moves the spring feast to its true day.',
      successAfterimage:
        'The dean could not fault the reckoning. The synod moved the spring feast to its true day, and every parish in the diocese will keep it there.',
      failureAfterimage: 'The dean questioned the reckoning line by line until the synod put off its ruling, and the feast stays where the tables put it.',
      successMetadata: {
        // `$here` is lawful here: the kept branch fires only with the mortal standing in the town.
        effects: [
          { kind: 'reputation_with', targetLocationId: '$here', delta: 0.05 },
          // The dean lost before the synod, and knows who beat the cathedral's tables.
          { kind: 'bond_change', withAgentId: '$cast:dean', sentimentDelta: -0.06, trustDelta: 0.02 },
        ],
      },
      failureMetadata: {
        effects: [{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.03 }],
      },
    },
  ],
  narrativeTemplates: {
    initiation: '{name} is in the chapter house on synod day, where the synod hears the reckoning.',
    success: 'The synod moved the spring feast to its true day.',
    failure: 'The synod put off its ruling.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{name} kept synod day in the chapter house, with the dean there to answer.',
      changes: [],
    },
  },
};

export const EASTER_RECKONING_DEFAULTED: UnifiedActionTemplate = {
  id: EASTER_RECKONING_DEFAULTED_ID,
  stakes: {
    goal: 'refuse to sign the reckoning away as a mistake',
    risk: "be shamed at the bishop's table for staying away",
    won: 'refused to sign the reckoning away as a mistake',
    lost: "was shamed at the bishop's table for staying away",
  },
  // Seed-only: the feast reckoning's appointment (missed branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Reckoning Defaulted',
  description: 'The reckoning was not read on synod day, and the dean has come looking for the master who made it.',
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition'],
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: EASTER_RECKONING_DEFAULTED_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Answer the dean',
      // Names no place: the missed branch fires wherever the mortal stands.
      narrativeTemplate:
        '{name} was not in the chapter house on synod day, and the reckoning was never read. ' +
        "The synod kept the cathedral's tables, and the spring feast will be kept a week late. " +
        '{cast:dean} has come looking for {name} with a paper, to have the reckoning signed away as a mistake.',
      successAfterimage: '{name} would not sign, and {cast:dean} left with the paper still blank.',
      failureAfterimage: "{cast:dean} thinks less of the master who stayed away, and says so at the bishop's table.",
      successMetadata: {
        effects: [{ kind: 'bond_change', withAgentId: '$cast:dean', sentimentDelta: -0.04, trustDelta: 0.03 }],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:dean', sentimentDelta: -0.08, trustDelta: -0.1 },
          // Never `$here`: the missed branch fires wherever the mortal stands, far from the chapter house.
          { kind: 'reputation_with', targetAgentId: '$cast:dean', delta: -0.04 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: 'The reckoning was not read on synod day, and the dean has come looking.',
    success: '{name} would not sign the reckoning away.',
    failure: 'The dean thinks less of the master who stayed away.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: "Nobody read the reckoning on synod day, and the cathedral's tables stand.",
      changes: [],
    },
  },
};

export const EASTER_RECKONING_SEQUELS: readonly UnifiedActionTemplate[] = [EASTER_RECKONING_HEARD, EASTER_RECKONING_DEFAULTED];
