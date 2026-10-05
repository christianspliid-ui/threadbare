/**
 * The Leaning Bell Tower's two appointment sequels (THR-1678, batch brief
 * `Docs/plans/encounters/expert-everyday-1-brief.md` § slot 5).
 *
 * `encounter.town.bell_tower_shoring` plants an appointment on a saved tower: the
 * councillor pays the rest of the fee **at the tower, when the bell rings on market
 * day**. The appointment substrate holds that a meeting that cannot be missed is not a
 * promise (THR-1479), so both branches are authored with the parent:
 *
 * - `town.bell_tower_first_peal` — the **kept** branch. The mortal is standing at the
 *   tower in the window; the councillor has the bell rung for the first time since the
 *   crack, and pays if the new courses hold through the peal.
 * - `town.bell_tower_cracked` — the **missed** branch. Nobody from the work was there;
 *   the swing of the bell opened a new crack, and the councillor comes looking with the
 *   fee held back. It fires wherever the mortal stands, so its prose never names the
 *   place and its regard write targets the councillor, never `$here` (which would bind
 *   whatever unrelated place the mortal is standing in — Pass 3 finding).
 *
 * **Seed-only** (`drawable: false`, THR-1526): each opening assumes its parent, so the
 * board never offers them, and no `locationSubtypes` are declared — the seed is the
 * only thing that starts them. They sit outside the factory catalog (no `encounter.`
 * prefix; the `town.` prefix is claimed in `content-objects.ts`), the way
 * `town.well_first_water` / `town.well_gone_foul` do: a sequel is the telling of a
 * promise already made, one short step, not a second encounter held to the
 * Composition Contract. Both inherit the parent's cast (`inheritContext`), so
 * `{cast:councillor}` binds.
 *
 * The kept branch carries the batch's `conditions` system target: a peal that holds
 * puts `trait.condition.location.festival` on the town for the rest of market day and
 * the two after it.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const BELL_TOWER_FIRST_PEAL_ID = 'town.bell_tower_first_peal';
export const BELL_TOWER_CRACKED_ID = 'town.bell_tower_cracked';

/** The first peal: the courses already held once, so this is the councillor's inspection, not a new trial. */
const FIRST_PEAL_DIFFICULTY = 0.35;
/** Talking the held-back fee out of a councillor whose tower cracked again with nobody there. */
const CRACKED_DIFFICULTY = 0.45;
/** How long the town keeps the day as a feast after a peal that holds (three days). */
const FIRST_PEAL_FESTIVAL_TICKS = 36;

export const BELL_TOWER_FIRST_PEAL: UnifiedActionTemplate = {
  id: BELL_TOWER_FIRST_PEAL_ID,
  stakes: {
    goal: 'see the tower hold through the first peal',
    risk: 'watch mortar fall and lose part of the fee',
    won: 'saw the tower hold through the first peal',
    lost: 'watched mortar fall and lost part of the fee',
  },
  // Seed-only: the bell tower shoring's appointment (kept branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The First Peal',
  description: '{name} is at the bell tower on market day, when the bell is rung for the first time since the crack.',
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['preservation_transformation'],
  steps: [
    {
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty: FIRST_PEAL_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Show the tower holds',
      narrativeTemplate:
        '{name} is at the bell tower in {location} on market day. ' +
        '{cast:councillor} has the bell rung for the first time since the crack, while people watch from a distance. ' +
        'If the new courses hold through the peal, the councillor pays the rest of the fee.',
      successAfterimage: 'The bell rang out and the new courses held, and {cast:councillor} paid the rest of the fee at the tower.',
      failureAfterimage: 'The new courses shed a little mortar at the first swing, and {cast:councillor} held back part of the fee.',
      successMetadata: {
        rewardPool: {
          categoryWeights: { possession: 1 },
          tagFilters: ['#trade'],
        },
        effects: [
          { kind: 'reputation_with', targetLocationId: '$here', delta: 0.04 },
          { kind: 'bond_change', withAgentId: '$cast:councillor', sentimentDelta: 0.08, trustDelta: 0.1 },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.location.festival',
            targetLocationId: '$here',
            intensity: 0.5,
            durationTicks: FIRST_PEAL_FESTIVAL_TICKS,
          },
        ],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:councillor', sentimentDelta: -0.03, trustDelta: -0.05 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: '{name} is at the bell tower on market day, when the bell is rung again.',
    success: 'The tower held through the peal, the councillor paid the rest of the fee, and {location} kept the day as a feast.',
    failure: 'The tower shed mortar at the peal, and the councillor held back part of the fee.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{name} kept the day at the bell tower, and the councillor had the bell rung.',
      changes: [],
    },
  },
};

export const BELL_TOWER_CRACKED: UnifiedActionTemplate = {
  id: BELL_TOWER_CRACKED_ID,
  stakes: {
    goal: 'talk the councillor into paying for the cracked tower',
    risk: 'lose the rest of the fee and the councillor\'s trust',
    won: 'talked the councillor into paying part of the fee',
    lost: 'lost the rest of the fee and the councillor\'s trust',
  },
  // Seed-only: the bell tower shoring's appointment (missed branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Crack Reopened',
  description: 'The bell was rung on market day with nobody from the work at the tower, and the tower cracked again.',
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning'],
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: CRACKED_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Talk the fee out',
      narrativeTemplate:
        '{name} was not at the bell tower when the bell rang on market day. ' +
        'A new crack opened above the new courses as the bell swung, and nobody from the work was there to see it. ' +
        '{cast:councillor} has come looking for {name}, and holds back the rest of the fee.',
      successAfterimage: '{cast:councillor} paid part of the fee on {name}\'s word about the new crack.',
      failureAfterimage: '{cast:councillor} kept the rest of the fee, and thinks less of the mason who left before the bell rang.',
      successMetadata: {
        rewardPool: {
          categoryWeights: { possession: 1 },
          tagFilters: ['#trade'],
        },
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:councillor', sentimentDelta: -0.02, trustDelta: 0.02 },
        ],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:councillor', sentimentDelta: -0.1, trustDelta: -0.12 },
          // Never `$here`: the missed branch fires wherever the mortal stands, far from the tower.
          { kind: 'reputation_with', targetAgentId: '$cast:councillor', delta: -0.04 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: 'The bell tower cracked again with nobody from the work there, and the councillor has come looking.',
    success: 'The councillor paid part of the fee on a promise to point the new crack.',
    failure: 'The councillor kept the rest of the fee.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The tower cracked again while nobody from the work was there, and the councillor held the fee back.',
      changes: [],
    },
  },
};

export const BELL_TOWER_SEQUELS: readonly UnifiedActionTemplate[] = [BELL_TOWER_FIRST_PEAL, BELL_TOWER_CRACKED];
