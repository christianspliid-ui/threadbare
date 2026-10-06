/**
 * `ruins.lead.visit` — "Where the Lead Points", the visit to a held lead's ruin
 * (THR-1664, seeded things stay alive S3; plan doc
 * `Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md` § Content pillar).
 *
 * The climb runs **hear → survey → visit → delve**. A survey is instant and can only
 * leave a lead `narrowed`, so it arranges this visit: an appointment at the ruin
 * (`UNDERTAKING_CELL_APPOINTMENTS['cell.observe.location']`, the kept branch
 * `#ruin_lead`). This template is where the lead's dice live. The mortal who kept the
 * visit is standing on the ruin's hex, so a `located` lead is admitted by the next
 * tick's delve scan.
 *
 * **Seed-only** (`drawable: false`, THR-1526), as the hunt's confront is: no
 * `locationSubtypes`, so the draw never offers it and only the appointment starts it.
 * The appointment is `requirePlace`, so the kept visit always fires at the ruin.
 * `actorAffinities` is declared because the seed's eligibility check drops a template
 * without it.
 *
 * ─── Mechanical design (before the prose) ───────────────────────────────
 *   Crux            A mortal holds a lead on a ruin and has come to stand on it. Do they
 *                   leave knowing where it lies?
 *   Whose problem?  The mortal's. It is their lead, and it goes cold if they fail.
 *   Reach = theme?  Step 0 tests the Eye and is *about* reading the ground. Step 1 tests
 *                   Stone and is *about* finding a way in through fallen stone.
 *   Consequence     `sharpen_clue` on every step that can end the visit. It keys on the
 *                   encounter's outcome, so the lead always matches the ending read:
 *                   success → knows where it lies (`located`), at cost → the lead holds
 *                   (`narrowed`, fresh), failure → the lead is lost (consumed).
 *   Cool failure?   Nobody is hurt. The trail simply stops making sense.
 *   The god's hand  Each step deals a hand (`insight`/`lore`, then `might`/`peril`), so
 *                   the visit's dice are the god's to bend like any other roll.
 *
 * Chips anchor on **the ruin** through `$here` (Law 56 clause two): the kept visit
 * resolves at the ruin, so the place the mortal stands is the place the lead names.
 * The ending prose names the state the chip reports, in the words the sheet uses
 * ("knows where it lies", `agentDetail.ts`).
 */

import type { EncounterAftermathChange, UnifiedActionTemplate } from '../../types/unifiedAction';

export const RUIN_LEAD_VISIT_ID = 'ruins.lead.visit';

/** Read the ground: a fair test, as a lead that has been narrowed already points somewhere real. */
const READ_THE_GROUND_DIFFICULTY = 0.4;
/** Find the way in: slightly harder — knowing where it lies means finding the door. */
const FIND_THE_WAY_IN_DIFFICULTY = 0.45;

/** The ruin, as a chip anchor: the place the visit is kept at. */
const THE_RUIN = { text: 'this ruin', entityId: '$here', visualKind: 'location' as const };

const LOCATED: EncounterAftermathChange = {
  id: 'ruin_lead.located',
  kind: 'future_hook',
  category: 'path',
  direction: 'opens',
  deltaLabel: 'located',
  stateNoun: THE_RUIN,
  title: 'Knows where it lies',
  causeClause: 'Read the ground and found the way in',
  detail: '{actor} knows where this ruin lies.',
  polarity: 'gain',
  concepts: [THE_RUIN],
};

const NARROWED: EncounterAftermathChange = {
  id: 'ruin_lead.narrowed',
  kind: 'future_hook',
  category: 'path',
  direction: 'opens',
  deltaLabel: 'narrowed',
  stateNoun: THE_RUIN,
  title: 'The lead holds',
  causeClause: 'Came close, and the way in stayed shut',
  detail: '{actor} still has a lead on this ruin, fresh enough to try again.',
  polarity: 'mixed',
  concepts: [THE_RUIN],
};

const LOST: EncounterAftermathChange = {
  id: 'ruin_lead.lost',
  kind: 'future_hook',
  category: 'scar',
  direction: 'loss',
  stateNoun: THE_RUIN,
  title: 'The lead is lost',
  causeClause: 'The ground made no sense',
  detail: '{actor} no longer has a lead on this ruin.',
  polarity: 'loss',
  concepts: [THE_RUIN],
};

export const RUIN_LEAD_VISIT: UnifiedActionTemplate = {
  id: RUIN_LEAD_VISIT_ID,
  stakes: {
    goal: 'find the way down into the ruin',
    risk: 'bury the way in under a slide of stone',
    won: 'found the steps down into the ruin',
    lost: 'found only more stone, and the lead went cold',
    lostBadly: 'buried the way in under a slide of stone',
  },
  // Seed-only: the survey's appointment is its only planter (THR-1526).
  drawable: false,
  name: 'Where the Lead Points',
  description: '{actor} has come to {location} to see where the lead points.',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  // THR-1664 — the ruin visit's kept branch finds this template by tag, and this is its
  // one bearer (`cell.observe.location`'s meeting query reads it).
  tags: ['#ruin_lead'],
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: READ_THE_GROUND_DIFFICULTY,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Read the ground',
      // The god's hand (charter rule 7): reading old ground.
      deal: { count: 4, tags: ['insight', 'lore'] },
      narrativeTemplate:
        '{actor} has come to {location} with a lead and a rough idea of where it points. '
        + 'The ground is broken stone and old cuts. Somewhere in it is a way down.',
      criticalSuccessAfterimage: 'They read the old cuts like a map and knew which way the walls once ran.',
      successAfterimage: 'They found where the old walls ran and followed them to a low place.',
      successAtCostAfterimage: 'They found the line of the walls, after a long time looking at the wrong ones.',
      failureAfterimage: 'The cuts in the stone all looked alike. They picked one and hoped.',
      criticalFailureAfterimage: 'They followed a line that was never a wall and ended where they began.',
      // A first-step critical failure ends the visit here (`advanceStep`), so the lead
      // is judged here too. On a plain failure the visit goes on and this is a no-op.
      failureMetadata: { effects: [{ kind: 'sharpen_clue' }] },
    },
    {
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty: FIND_THE_WAY_IN_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Find the way in',
      // Moving fallen stone over a drop: strength, and the risk of it.
      deal: { count: 4, tags: ['might', 'peril'] },
      narrativeTemplate:
        'The low place is choked with fallen stone. Under it, if the lead is right, is the way in. '
        + '{actor} starts moving stone.',
      criticalSuccessAfterimage: 'A slab came away clean, and under it the steps went down into the dark.',
      successAfterimage: 'They cleared enough stone to see the top of the steps.',
      successAtCostAfterimage: 'They found the steps, but the stone shifted, and the way in is half-buried again.',
      failureAfterimage: 'Under the stone there was only more stone.',
      criticalFailureAfterimage: 'The pile slid and filled the low place. Whatever was under it is gone from reach.',
      successMetadata: { effects: [{ kind: 'sharpen_clue' }] },
      failureMetadata: { effects: [{ kind: 'sharpen_clue' }] },
    },
  ],
  narrativeTemplates: {
    initiation: '{actor} has come to {location} to see where the lead points.',
    success: '{actor} found the way into {location}.',
    failure: '{actor} could not find the way into {location}.',
  },
  aftermathConfig: {
    branchOnStep: 1,
    variants: {},
    fallback: {
      overview: '{actor} came to {location} following a lead.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview: '{actor} found the steps under {location} and knows where the way down lies.',
          changes: [LOCATED],
        },
        success: {
          overview: '{actor} found the top of the steps under {location}. They know where it lies now.',
          changes: [LOCATED],
        },
        success_at_cost: {
          overview: '{actor} came close at {location}, but the way in stayed shut. The lead holds, for now.',
          changes: [NARROWED],
        },
        failure: {
          overview: '{actor} found nothing under the stone at {location}. The lead has gone cold.',
          changes: [LOST],
        },
        critical_failure: {
          // A critical failure can end the visit at either step, so this line names neither.
          overview: '{location} gave {actor} nothing to follow, and now nothing will. {actor} has lost the lead.',
          changes: [LOST],
        },
      },
    },
  },
};
