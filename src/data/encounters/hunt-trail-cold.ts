/**
 * `hunt.trail_cold` — "The Trail Went Cold", the hunt's missed sequel (THR-1560, plan
 * doc `Docs/plans/2026-09-23-hunts.md` § Content pillar).
 *
 * The appointment substrate holds that a meeting that cannot be missed is not a
 * promise, so the hunt's confront keeps the rule and authors its missed branch: the
 * `cell.destroy.monster` payoff names `#hunt_trail_cold`, and this is its one bearer.
 * It fires wherever the hunter stands once the window at the den closes — the favour is
 * broken as for any missed appointment, and nothing more is written. A broken promise
 * does not block a new hunt, so the hunter may take the work up again.
 *
 * **Spawn-only**, as `fight.lair.confront` is: `drawable: false`, no
 * `locationSubtypes`, so the draw never offers it and only the appointment's missed
 * branch starts it. `actorAffinities` is declared because the seed's eligibility check
 * drops a template without it.
 *
 * The line is **neutral about why**: a miss can be `unreachable` as well as a lost nerve.
 * One step, no fight — the hunt is over for now, and the step only lets the moment land.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const HUNT_TRAIL_COLD_ID = 'hunt.trail_cold';

/** The trail-cold difficulty: a formality. The miss already happened; this is the telling of it. */
const TRAIL_COLD_DIFFICULTY = 0.2;

export const HUNT_TRAIL_COLD: UnifiedActionTemplate = {
  id: HUNT_TRAIL_COLD_ID,
  // Seed-only: the missed branch of a hunt's appointment is its only planter (THR-1526).
  drawable: false,
  name: 'The Trail Went Cold',
  description: '{name} never reached the den in time.',
  rarityTier: 1,
  intrinsicTier: 'background',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  tags: ['#hunt_trail_cold'],
  steps: [
    {
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: TRAIL_COLD_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Let the trail go',
      narrativeTemplate: '{name} never reached the den, and now the trail has gone cold.',
      successAfterimage: 'The beast is still out there. {name} knows where to begin again.',
      failureAfterimage: 'The beast is still out there, and {name}\'s chance to face it has gone for now.',
    },
  ],
  narrativeTemplates: {
    initiation: '{name} never reached the den, and now the trail has gone cold.',
    success: 'The trail went cold. {name} may take the hunt up again.',
    failure: 'The trail went cold.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{name} never reached the den, and now the trail has gone cold.',
      changes: [],
    },
  },
};
