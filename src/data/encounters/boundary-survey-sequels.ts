/**
 * The Boundary Survey's two appointment sequels (THR-1679, batch brief
 * `Docs/plans/encounters/expert-everyday-2-brief.md` § slot 1).
 *
 * `encounter.town.boundary_survey` plants an appointment on a found line: a new stone is
 * set at **this year's beating of the bounds, in three days**, with the lord's steward as
 * witness. The appointment substrate holds that a meeting that cannot be missed is not a
 * promise (THR-1479), so both branches are authored with the parent:
 *
 * - `town.bounds_beaten` — the **kept** branch. The mortal is standing in the village in
 *   the window; the village walks the line with the steward, the stone goes in where the
 *   surveyor swore the line runs, and the steward seals the survey if it is set true.
 * - `town.bounds_stone_uprooted` — the **missed** branch. Nobody from the survey was
 *   there; the new stone was pulled up in the night, and the steward comes looking. It
 *   fires wherever the mortal stands, so its prose never names the place and its regard
 *   write targets the steward, never `$here` (which would bind whatever unrelated place
 *   the mortal is standing in — the bell-tower Pass 3 finding).
 *
 * **Seed-only** (`drawable: false`, THR-1526): each opening assumes its parent, so the
 * board never offers them, and no `locationSubtypes` are declared — the seed is the only
 * thing that starts them. They sit outside the factory catalog (no `encounter.` prefix;
 * the `town.` prefix is claimed in `content-objects.ts`), the way `bell-tower-sequels.ts`
 * does. Both inherit the parent's cast (`inheritContext`), so `{cast:steward}` binds.
 *
 * The kept branch carries the batch's `conditions` system target: a survey sealed at the
 * beating of the bounds puts `trait.condition.location.festival` on the village for three
 * days.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const BOUNDS_BEATEN_ID = 'town.bounds_beaten';
export const BOUNDS_STONE_UPROOTED_ID = 'town.bounds_stone_uprooted';

/** The line was already found once; this is setting the stone to it before witnesses. */
const BOUNDS_BEATEN_DIFFICULTY = 0.35;
/** Standing by a survey whose new stone was pulled up with nobody there to swear to it. */
const STONE_UPROOTED_DIFFICULTY = 0.45;
/** How long the village keeps the beating of the bounds as a feast (three days). */
const BOUNDS_BEATEN_FEAST_TICKS = 36;

export const BOUNDS_BEATEN: UnifiedActionTemplate = {
  id: BOUNDS_BEATEN_ID,
  // Seed-only: the boundary survey's appointment (kept branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Bounds Beaten',
  description: "{name} is at the beating of the bounds, where the new stone is set against the charter's marks.",
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty'],
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: BOUNDS_BEATEN_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Set the stone true',
      narrativeTemplate:
        '{name} is at the beating of the bounds in {location}. ' +
        'The village walks the line with {cast:steward} as the lord\'s witness, and the new stone goes into the ground where {name} swore the line runs. ' +
        "If the stone is set true to the charter's marks, the steward seals the survey and pays the lord's share of the fee.",
      successAfterimage:
        "The stone went in true to the spring and the cross. {cast:steward} sealed the survey and paid the lord's share of the fee, and the village sat down to its feast.",
      failureAfterimage: "The stone went in a hand's width off the line, and {cast:steward} would not seal the survey that day.",
      successMetadata: {
        // The lord's share of the survey fee.
        rewardPool: {
          categoryWeights: { possession: 1 },
          tagFilters: ['#trade'],
        },
        effects: [
          { kind: 'reputation_with', targetLocationId: '$here', delta: 0.04 },
          { kind: 'bond_change', withAgentId: '$cast:steward', sentimentDelta: 0.06, trustDelta: 0.1 },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.location.festival',
            targetLocationId: '$here',
            intensity: 0.5,
            durationTicks: BOUNDS_BEATEN_FEAST_TICKS,
          },
        ],
      },
      failureMetadata: {
        effects: [{ kind: 'bond_change', withAgentId: '$cast:steward', sentimentDelta: -0.03, trustDelta: -0.05 }],
      },
    },
  ],
  narrativeTemplates: {
    initiation: '{name} is at the beating of the bounds, where the new stone is set.',
    success:
      "The new stone was set true, the steward sealed the survey and paid the lord's share of the fee, and {location} kept the day as a feast.",
    failure: 'The new stone went in off the line, and the steward would not seal the survey that day.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: "{name} kept the day at the beating of the bounds, with {cast:steward} there as the lord's witness.",
      changes: [],
    },
  },
};

export const BOUNDS_STONE_UPROOTED: UnifiedActionTemplate = {
  id: BOUNDS_STONE_UPROOTED_ID,
  // Seed-only: the boundary survey's appointment (missed branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Stone Uprooted',
  description: 'The beating of the bounds went ahead with no surveyor there, and the new stone was pulled up.',
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
      difficulty: STONE_UPROOTED_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Stand by the survey',
      // Names no place: the missed branch fires wherever the mortal stands.
      narrativeTemplate:
        '{name} was not at the beating of the bounds. ' +
        'The new stone went in with no surveyor there to swear to it, and it was pulled up in the night. ' +
        "{cast:steward} has come looking for {name}, and says the lord will not seal the survey without the surveyor's word.",
      successAfterimage: "{cast:steward} took {name}'s word for the line, and sealed the survey without the stone.",
      failureAfterimage: '{cast:steward} left without agreeing to set the stone again, and thinks less of the surveyor who stayed away.',
      successMetadata: {
        effects: [{ kind: 'bond_change', withAgentId: '$cast:steward', sentimentDelta: -0.02, trustDelta: 0.02 }],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:steward', sentimentDelta: -0.1, trustDelta: -0.12 },
          // Never `$here`: the missed branch fires wherever the mortal stands, far from the village.
          { kind: 'reputation_with', targetAgentId: '$cast:steward', delta: -0.04 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: 'The new stone was pulled up after nobody from the survey came to the beating of the bounds, and the steward has come looking.',
    success: "The steward sealed the survey on the surveyor's word.",
    failure: 'The steward left without agreeing to set the stone again.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'Nobody from the survey was at the beating of the bounds, and the new stone did not stay in the ground.',
      changes: [],
    },
  },
};

export const BOUNDARY_SURVEY_SEQUELS: readonly UnifiedActionTemplate[] = [BOUNDS_BEATEN, BOUNDS_STONE_UPROOTED];
