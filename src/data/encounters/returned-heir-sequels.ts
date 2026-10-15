/**
 * The Returned Heir's (`encounter.town.returned_heir`) two appointment sequels (THR-1840, batch brief
 * `Docs/plans/encounters/master-everyday-3-brief.md` § slot 1).
 *
 * `encounter.town.returned_heir` plants an appointment when the master reaches a finding they
 * can stand behind: it is **sworn before the manor court in the town on court day, in three
 * days**, with the steward there to hear it. The appointment substrate holds that a meeting
 * that cannot be missed is not a promise (THR-1479), so both branches are authored with the
 * parent:
 *
 * - `town.returned_heir_sworn` — the **kept** branch. The mortal is standing in the town in
 *   the window; the court sits, the uncle's side questions the finding, and the steward hears
 *   it sworn. If the finding holds, the court names the man the lord's son.
 * - `town.returned_heir_defaulted` — the **missed** branch. Nobody swore the finding, the court
 *   ruled without it, and the man was turned off the manor; he comes looking for the master who
 *   read him. It fires wherever the mortal stands, so its prose never places them and its
 *   regard write targets the claimant, never `$here` (which would bind whatever unrelated place
 *   the mortal is standing in — the rule `easter-reckoning-sequels.ts` keeps).
 *
 * **Seed-only** (`drawable: false`, THR-1526): each opening assumes its parent, so the board
 * never offers them, and no `locationSubtypes` are declared — the seed is the only thing that
 * starts them. They sit outside the factory catalog (no `encounter.` prefix; the `town.`
 * prefix is claimed in `content-objects.ts`), the way `easter-reckoning-sequels.ts` does. Both
 * inherit the parent's cast (`inheritContext`), so `{cast:steward}` and `{cast:claimant}` bind.
 *
 * Prose: `Docs/plans/encounters/returned-heir-final.md` § Sequels.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const RETURNED_HEIR_SWORN_ID = 'town.returned_heir_sworn';
export const RETURNED_HEIR_DEFAULTED_ID = 'town.returned_heir_defaulted';

/** The reading is already done; this is swearing to it against the uncle's questions. */
const RETURNED_HEIR_SWORN_DIFFICULTY = 0.4;
/** Facing the man who was turned out because the finding was never sworn. */
const RETURNED_HEIR_DEFAULTED_DIFFICULTY = 0.45;

export const RETURNED_HEIR_SWORN: UnifiedActionTemplate = {
  id: RETURNED_HEIR_SWORN_ID,
  stakes: {
    goal: 'swear the finding before the manor court',
    risk: 'see the court put off its ruling on the claim',
    won: 'swore the finding, and the court named the son',
    lost: 'saw the court put off its ruling on the claim',
  },
  // Seed-only: the returned heir's appointment (kept branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Finding Sworn',
  description: '{name} is at the manor court on court day, where the finding on the returned heir is sworn.',
  rarityTier: 2,
  intrinsicTier: 'background',
  reach: 'eye',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning'],
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: RETURNED_HEIR_SWORN_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Swear the finding',
      narrativeTemplate:
        '{name} is at the manor court in {location} on court day. ' +
        "The uncle's side questions the finding, and {cast:steward} is there to hear it sworn. " +
        'If the finding holds, the court names {cast:claimant} the lord\'s son.',
      successAfterimage:
        "The uncle's side could not shake the finding. The court named {cast:claimant} the lord's son, and the manor is his.",
      failureAfterimage:
        "The uncle's side questioned the finding until the court put off its ruling, and the uncle keeps the manor for now.",
      successMetadata: {
        // `$here` is lawful here: the kept branch fires only with the mortal standing in the town.
        effects: [
          { kind: 'reputation_with', targetLocationId: '$here', delta: 0.05 },
          // The new lord knows who read him true before the court.
          { kind: 'bond_change', withAgentId: '$cast:claimant', sentimentDelta: 0.06, trustDelta: 0.04 },
        ],
      },
      failureMetadata: {
        effects: [{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.03 }],
      },
    },
  ],
  narrativeTemplates: {
    initiation: '{name} is at the manor court on court day, where the finding is sworn.',
    success: "The court named the man the lord's son.",
    failure: 'The court put off its ruling.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{name} kept court day at the manor, with the steward there to hear the finding.',
      changes: [],
    },
  },
};

export const RETURNED_HEIR_DEFAULTED: UnifiedActionTemplate = {
  id: RETURNED_HEIR_DEFAULTED_ID,
  stakes: {
    goal: 'answer the man who was turned off the manor',
    risk: 'be blamed for a son turned out of his own house',
    won: 'answered the man who was turned off the manor',
    lost: 'was blamed for a son turned out of his own house',
  },
  // Seed-only: the returned heir's appointment (missed branch) is its only planter (THR-1526).
  drawable: false,
  name: 'The Finding Unsworn',
  description: 'The finding on the returned heir was never sworn, and the man it named has come looking for the master who made it.',
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
      difficulty: RETURNED_HEIR_DEFAULTED_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Answer the man',
      // Names no place: the missed branch fires wherever the mortal stands.
      narrativeTemplate:
        '{name} was not at the manor court on court day, and the finding was never sworn. ' +
        'The court ruled without it, and the uncle had {cast:claimant} turned off the manor. ' +
        '{cast:claimant} has come looking for {name}, to ask why the master who read him stayed away.',
      successAfterimage:
        '{name} gave {cast:claimant} the finding in writing, sealed, for the next court to hear.',
      failureAfterimage:
        '{cast:claimant} blames the master who stayed away, and says so to anyone who will listen.',
      successMetadata: {
        effects: [{ kind: 'bond_change', withAgentId: '$cast:claimant', sentimentDelta: -0.02, trustDelta: 0.04 }],
      },
      failureMetadata: {
        effects: [
          { kind: 'bond_change', withAgentId: '$cast:claimant', sentimentDelta: -0.08, trustDelta: -0.1 },
          // Never `$here`: the missed branch fires wherever the mortal stands, far from the manor.
          { kind: 'reputation_with', targetAgentId: '$cast:claimant', delta: -0.04 },
        ],
      },
    },
  ],
  narrativeTemplates: {
    initiation: 'The finding was not sworn on court day, and the man it named has come looking.',
    success: '{name} gave the man the finding in writing.',
    failure: 'The man blames the master who stayed away.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'Nobody swore the finding on court day, and the uncle keeps the manor.',
      changes: [],
    },
  },
};

export const RETURNED_HEIR_SEQUELS: readonly UnifiedActionTemplate[] = [RETURNED_HEIR_SWORN, RETURNED_HEIR_DEFAULTED];
