/**
 * The Well Sinking's two appointment sequels (THR-1677, batch brief
 * `Docs/plans/encounters/journeyman-everyday-2-brief.md` § slot 5).
 *
 * `encounter.town.well_sinking` plants an appointment on a lined well: the reeve pays
 * the second half of the fee **at the well, on the day its water runs clear**. The
 * appointment substrate holds that a meeting that cannot be missed is not a promise
 * (THR-1479), so both branches are authored with the parent:
 *
 * - `town.well_first_water` — the **kept** branch. The mortal is standing at the new
 *   well in the window; the reeve draws the first bucket and pays.
 * - `town.well_gone_foul` — the **missed** branch. Nobody from the work was there; the
 *   untended well silted and soured, and the reeve comes looking with the money held
 *   back. It fires wherever the mortal stands, so its prose never names the place.
 *
 * **Seed-only** (`drawable: false`, THR-1526): each opening assumes its parent, so the
 * board never offers them, and no `locationSubtypes` are declared — the seed is the
 * only thing that starts them. They sit outside the factory catalog (no `encounter.`
 * prefix), the way `hunt.trail_cold` does: a sequel is the telling of a promise already
 * made, one short step, not a second encounter held to the Composition Contract.
 * Both inherit the parent's cast (`inheritContext`), so `{cast:reeve}` binds.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const WELL_FIRST_WATER_ID = 'town.well_first_water';
export const WELL_GONE_FOUL_ID = 'town.well_gone_foul';

/** The first bucket: the lining already held, so this is the reeve's inspection, not a new trial. */
const FIRST_WATER_DIFFICULTY = 0.3;
/** Talking the held-back fee out of a reeve whose well went foul. */
const GONE_FOUL_DIFFICULTY = 0.4;

export const WELL_FIRST_WATER: UnifiedActionTemplate = {
  id: WELL_FIRST_WATER_ID,
  // Seed-only: the well sinking's appointment (kept branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The First Water',
  description: '{name} is at the new well on the day its water runs clear.',
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  steps: [
    {
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty: FIRST_WATER_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Show the water clear',
      narrativeTemplate:
        '{name} is at the new well in {location} on the day its water runs clear. ' +
        '{cast:reeve} lowers the first bucket while the people who paid for it watch. ' +
        'The reeve checks the lining and the water, and pays the second half of the fee if both are good.',
      successAfterimage: 'The bucket came up clean, and {cast:reeve} paid the rest of the fee at the well.',
      failureAfterimage: 'The bucket came up cloudy, and {cast:reeve} held back part of the fee until the silt settles.',
      successMetadata: {
        rewardPool: {
          categoryWeights: { possession: 1 },
          tagFilters: ['#trade'],
        },
        effects: [
          { kind: 'reputation_with', targetLocationId: '$here', delta: 0.04 },
          { kind: 'bond_change', withAgentId: '$cast:reeve', sentimentDelta: 0.08, trustDelta: 0.1 },
        ],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:reeve', sentimentDelta: -0.03, trustDelta: -0.05 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: '{name} is at the new well on the day its water runs clear.',
    success: 'The well ran clear, and the reeve paid the rest of the fee.',
    failure: 'The well ran cloudy, and the reeve held back part of the fee.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{name} kept the day at the new well, and the reeve drew the first bucket.',
      changes: [],
    },
  },
};

export const WELL_GONE_FOUL: UnifiedActionTemplate = {
  id: WELL_GONE_FOUL_ID,
  // Seed-only: the well sinking's appointment (missed branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Well Gone Foul',
  description: 'The new well ran clear with nobody from the work there, and it went foul.',
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
      difficulty: GONE_FOUL_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Talk the fee out',
      narrativeTemplate:
        'Nobody from the work was at the new well when its water ran clear. ' +
        'An untended new well silts up and sours, and this one went foul. ' +
        '{cast:reeve} has found {name} with the second half of the fee held back, and wants the well cleared before any of it is paid.',
      successAfterimage: '{cast:reeve} paid part of the fee and took {name}\'s word that the well will be cleared.',
      failureAfterimage: '{cast:reeve} kept the second half of the fee, and the people who paid for the well think less of the one who sank it.',
      successMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:reeve', sentimentDelta: -0.02, trustDelta: 0.02 },
        ],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:reeve', sentimentDelta: -0.1, trustDelta: -0.12 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: 'The new well went foul with nobody from the work there, and the reeve has come looking.',
    success: 'The reeve paid part of the fee on a promise to clear the well.',
    failure: 'The reeve kept the rest of the fee.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The well went foul while nobody from the work was there, and the reeve held the fee back.',
      changes: [],
    },
  },
};

export const WELL_SINKING_SEQUELS: readonly UnifiedActionTemplate[] = [WELL_FIRST_WATER, WELL_GONE_FOUL];
