/**
 * The Mill Lease's two appointment sequels (THR-1680, batch brief
 * `Docs/plans/encounters/expert-everyday-3-brief.md` § slot 1).
 *
 * `encounter.town.mill_lease_auction` plants an appointment on a won bid: the abbey's
 * lease on the water-mill is **sealed at the mill on quarter day, in three days**, with
 * the abbey's cellarer there to seal it. The appointment substrate holds that a meeting
 * that cannot be missed is not a promise (THR-1479), so both branches are authored with
 * the parent:
 *
 * - `town.mill_lease_sealed` — the **kept** branch. The mortal is standing in the town in
 *   the window; the fellowship counts out the first quarter's rent before the cellarer,
 *   and if it counts out to the bid the lease is sealed and the fellowship pays the
 *   mortal's fee (the `#trade` reward pool — the parent's overviews say the fee is paid
 *   at the sealing, and this is the write that makes that true).
 * - `town.mill_lease_forfeit` — the **missed** branch. Nobody from the bid was at the
 *   mill; the cellarer comes looking. It fires wherever the mortal stands, so its prose
 *   never names the place and its regard write targets the cellarer, never `$here`
 *   (which would bind whatever unrelated place the mortal is standing in — the
 *   bell-tower Pass 3 finding, kept by `boundary-survey-sequels.ts`).
 *
 * **Seed-only** (`drawable: false`, THR-1526): each opening assumes its parent, so the
 * board never offers them, and no `locationSubtypes` are declared — the seed is the only
 * thing that starts them. They sit outside the factory catalog (no `encounter.` prefix;
 * the `town.` prefix is claimed in `content-objects.ts`), the way `bell-tower-sequels.ts`
 * and `boundary-survey-sequels.ts` do. Both inherit the parent's cast (`inheritContext`),
 * so `{cast:cellarer}` binds.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const MILL_LEASE_SEALED_ID = 'town.mill_lease_sealed';
export const MILL_LEASE_FORFEIT_ID = 'town.mill_lease_forfeit';

/** The bid was already won once; this is counting out the rent it promised before the abbey. */
const MILL_LEASE_SEALED_DIFFICULTY = 0.35;
/** Answering for a won lease nobody came to seal. */
const MILL_LEASE_FORFEIT_DIFFICULTY = 0.45;

export const MILL_LEASE_SEALED: UnifiedActionTemplate = {
  id: MILL_LEASE_SEALED_ID,
  stakes: {
    goal: 'see the mill lease sealed and the fee paid',
    risk: 'come up short on rent and leave the lease unsealed',
    won: 'saw the mill lease sealed and the fee paid',
    lost: 'came up short on rent and left the lease unsealed',
  },
  // Seed-only: the mill lease auction's appointment (kept branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Lease Sealed',
  description: "{name} is at the mill on quarter day, where the abbey seals the fellowship's lease.",
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'gold',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['asceticism_extravagance'],
  steps: [
    {
      reach: 'gold',
      duration: { min: 1, max: 1 },
      difficulty: MILL_LEASE_SEALED_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Count out the rent',
      narrativeTemplate:
        '{name} is at the mill in {location} on quarter day. ' +
        "{cast:cellarer} brings the abbey's book, and the fellowship brings the first quarter's rent. " +
        "If the rent counts out to what was bid, the cellarer seals the lease and the fellowship pays {name}'s fee.",
      successAfterimage:
        "The rent was all there. {cast:cellarer} sealed the lease, and the fellowship paid {name}'s fee.",
      failureAfterimage: 'The rent came up short of the bid, and {cast:cellarer} would not seal the lease that day.',
      successMetadata: {
        // The fellowship's fee, paid at the sealing.
        rewardPool: {
          categoryWeights: { possession: 1 },
          tagFilters: ['#trade'],
        },
        effects: [
          { kind: 'reputation_with', targetLocationId: '$here', delta: 0.04 },
          { kind: 'bond_change', withAgentId: '$cast:cellarer', sentimentDelta: 0.06, trustDelta: 0.1 },
        ],
      },
      failureMetadata: {
        effects: [{ kind: 'bond_change', withAgentId: '$cast:cellarer', sentimentDelta: -0.03, trustDelta: -0.05 }],
      },
    },
  ],
  narrativeTemplates: {
    initiation: '{name} is at the mill on quarter day, where the lease is sealed.',
    success: "The lease was sealed, and the fellowship paid {name}'s fee.",
    failure: 'The rent came up short, and the lease was not sealed that day.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{name} kept quarter day at the mill, with the cellarer there for the abbey.',
      changes: [],
    },
  },
};

export const MILL_LEASE_FORFEIT: UnifiedActionTemplate = {
  id: MILL_LEASE_FORFEIT_ID,
  stakes: {
    goal: 'get the cellarer to seal the mill lease anyway',
    risk: 'watch the mill go to the merchant',
    won: 'got the cellarer to seal the mill lease anyway',
    lost: 'watched the mill go to the merchant',
  },
  // Seed-only: the mill lease auction's appointment (missed branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Lease Forfeit',
  description: "Nobody from the winning bid was at the mill on quarter day, and the abbey's cellarer has come looking.",
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
      difficulty: MILL_LEASE_FORFEIT_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Answer for the lease',
      // Names no place: the missed branch fires wherever the mortal stands.
      narrativeTemplate:
        '{name} was not at the mill on quarter day, and the lease was not sealed. ' +
        '{cast:cellarer} has come looking for {name}. ' +
        "The abbey's rule lets the mill to the next bidder when a lease is not sealed, and the cellarer keeps the rule to the letter.",
      successAfterimage: "{cast:cellarer} took {name}'s word for the fellowship, and sealed the lease on it.",
      failureAfterimage: '{cast:cellarer} let the mill to the merchant, and thinks less of the expert who stayed away.',
      successMetadata: {
        effects: [{ kind: 'bond_change', withAgentId: '$cast:cellarer', sentimentDelta: -0.02, trustDelta: 0.02 }],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:cellarer', sentimentDelta: -0.1, trustDelta: -0.12 },
          // Never `$here`: the missed branch fires wherever the mortal stands, far from the mill.
          { kind: 'reputation_with', targetAgentId: '$cast:cellarer', delta: -0.04 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: 'The lease was not sealed after nobody from the bid came to the mill on quarter day, and the cellarer has come looking.',
    success: "The cellarer sealed the lease on {name}'s word.",
    failure: 'The cellarer let the mill to the merchant.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'Nobody from the winning bid was at the mill on quarter day, and the lease was not sealed then.',
      changes: [],
    },
  },
};

export const MILL_LEASE_SEQUELS: readonly UnifiedActionTemplate[] = [MILL_LEASE_SEALED, MILL_LEASE_FORFEIT];
