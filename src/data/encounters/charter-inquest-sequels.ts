/**
 * The Forged Charter's two appointment sequels (THR-1688, batch brief
 * `Docs/plans/encounters/master-everyday-brief.md` § slot 1).
 *
 * `encounter.town.forged_charter_inquest` plants an appointment when the master names the
 * forger: the findings are **read out at the inquest in the town hall on court day, in
 * three days**, with the count's steward there to answer them. The appointment substrate
 * holds that a meeting that cannot be missed is not a promise (THR-1479), so both branches
 * are authored with the parent:
 *
 * - `town.charter_inquest_heard` — the **kept** branch. The mortal is standing in the town
 *   in the window; the bench sits for the inquest and the steward stands for the count. If
 *   the findings hold against the steward's lawyers, the bench lets the town's charter stand.
 * - `town.charter_inquest_defaulted` — the **missed** branch. Nobody read the findings, and
 *   the steward comes looking with a purse to buy them and burn them. It fires wherever the
 *   mortal stands, so its prose never places them and its regard write targets the steward,
 *   never `$here` (which would bind whatever unrelated place the mortal is standing in — the
 *   bell-tower Pass 3 finding, kept by `boundary-survey-sequels.ts` and `mill-lease-sequels.ts`).
 *
 * **Seed-only** (`drawable: false`, THR-1526): each opening assumes its parent, so the board
 * never offers them, and no `locationSubtypes` are declared — the seed is the only thing that
 * starts them. They sit outside the factory catalog (no `encounter.` prefix; the `town.`
 * prefix is claimed in `content-objects.ts`), the way `mill-lease-sequels.ts` does. Both
 * inherit the parent's cast (`inheritContext`), so `{cast:steward}` binds.
 *
 * Prose: `Docs/plans/encounters/forged-charter-inquest-final.md` § 20, verbatim.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const CHARTER_INQUEST_HEARD_ID = 'town.charter_inquest_heard';
export const CHARTER_INQUEST_DEFAULTED_ID = 'town.charter_inquest_defaulted';

/** The findings are already made; this is holding them against the steward's lawyers before the bench. */
const CHARTER_INQUEST_HEARD_DIFFICULTY = 0.4;
/** Answering the steward for findings nobody came to read. */
const CHARTER_INQUEST_DEFAULTED_DIFFICULTY = 0.45;

export const CHARTER_INQUEST_HEARD: UnifiedActionTemplate = {
  id: CHARTER_INQUEST_HEARD_ID,
  stakes: {
    goal: 'hold the charter findings against the lawyers',
    risk: 'see the bench put off its ruling',
    won: 'held the charter findings and the charter stood',
    lost: 'saw the bench put off its ruling',
  },
  // Seed-only: the forged charter's appointment (kept branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Inquest Heard',
  description: "{name} is in the town hall on court day, where the inquest hears the findings on the town's charter.",
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['revelation_discretion'],
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: CHARTER_INQUEST_HEARD_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Read out the findings',
      narrativeTemplate:
        '{name} is in the town hall in {location} on court day. ' +
        'The bench sits for the inquest, and {cast:steward} stands for the count. ' +
        "If {name}'s findings hold against the steward's lawyers, the bench lets the town's charter stand.",
      successAfterimage:
        "The steward's lawyers found no fault in the findings. The bench let the town's charter stand, and the market stays free of the count's tolls.",
      failureAfterimage: "The steward's lawyers picked at the findings until the bench put off its ruling to the next court.",
      successMetadata: {
        // `$here` is lawful here: the kept branch fires only with the mortal standing in the town.
        effects: [
          { kind: 'reputation_with', targetLocationId: '$here', delta: 0.05 },
          // The steward lost before the bench, and knows who beat the count's claim.
          { kind: 'bond_change', withAgentId: '$cast:steward', sentimentDelta: -0.06, trustDelta: 0.02 },
        ],
      },
      failureMetadata: {
        effects: [{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.03 }],
      },
    },
  ],
  narrativeTemplates: {
    initiation: '{name} is in the town hall on court day, where the inquest hears the findings.',
    success: "The bench let the town's charter stand.",
    failure: 'The bench put off its ruling.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: "{name} kept court day in the town hall, with the count's steward there to answer.",
      changes: [],
    },
  },
};

export const CHARTER_INQUEST_DEFAULTED: UnifiedActionTemplate = {
  id: CHARTER_INQUEST_DEFAULTED_ID,
  stakes: {
    goal: 'swear to the charter findings before witnesses',
    risk: 'be shamed at the count\'s table for staying away',
    won: 'swore to the charter findings before witnesses',
    lost: 'was shamed at the count\'s table for staying away',
  },
  // Seed-only: the forged charter's appointment (missed branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Inquest Defaulted',
  description: "The findings were not read on court day, and the count's steward has come looking for the master who made them.",
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
      difficulty: CHARTER_INQUEST_DEFAULTED_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Answer the steward',
      // Names no place: the missed branch fires wherever the mortal stands.
      narrativeTemplate:
        '{name} was not in the town hall on court day, and the findings were never read. ' +
        "The bench let the count's copy stand. " +
        '{cast:steward} has come looking for {name} with a purse, to buy the written findings and burn them.',
      successAfterimage: '{name} swore to the findings before witnesses, and {cast:steward} left with the purse still full.',
      failureAfterimage: "{cast:steward} thinks less of the master who stayed away, and says so at the count's table.",
      successMetadata: {
        effects: [{ kind: 'bond_change', withAgentId: '$cast:steward', sentimentDelta: -0.04, trustDelta: 0.03 }],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:steward', sentimentDelta: -0.08, trustDelta: -0.1 },
          // Never `$here`: the missed branch fires wherever the mortal stands, far from the town hall.
          { kind: 'reputation_with', targetAgentId: '$cast:steward', delta: -0.04 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: "The findings were not read on court day, and the count's steward has come looking.",
    success: '{name} swore to the findings before witnesses.',
    failure: 'The steward thinks less of the master who stayed away.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: "Nobody read the findings on court day, and the count's copy of the charter stands.",
      changes: [],
    },
  },
};

export const CHARTER_INQUEST_SEQUELS: readonly UnifiedActionTemplate[] = [CHARTER_INQUEST_HEARD, CHARTER_INQUEST_DEFAULTED];
