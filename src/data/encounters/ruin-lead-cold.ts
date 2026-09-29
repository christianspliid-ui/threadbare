/**
 * `ruins.lead.cold` — "The Lead Went Cold", the ruin visit's missed sequel (THR-1664,
 * seeded things stay alive S3; plan doc
 * `Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md` § Content pillar).
 *
 * The `cell.observe.location` appointment names `#lead_gone_cold` as its missed branch,
 * and this is its one bearer. It fires wherever the mortal stands once the window at
 * the ruin closes, placeless-tolerant like the hunt's `hunt.trail_cold`. Its one effect
 * is `sharpen_clue` with `missed: true`: the lead goes cold whatever the roll.
 *
 * **Seed-only** (`drawable: false`, THR-1526), no `locationSubtypes`. The line is neutral
 * about why: a miss can be `unreachable` as well as a changed mind.
 *
 * The chip anchors on **the mortal** (`$actor`), not the ruin: the mortal is not at the
 * ruin, so `$here` would name the wrong place, and no sentinel reaches a lead's ruin from
 * elsewhere. The lead is the mortal's own knowledge, which is where the sheet shows it.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export const RUIN_LEAD_COLD_ID = 'ruins.lead.cold';

/** A formality: the miss already happened; this is the telling of it. */
const LEAD_COLD_DIFFICULTY = 0.2;

const LEAD_GONE_COLD = {
  id: 'ruin_lead.gone_cold',
  kind: 'future_hook' as const,
  category: 'scar' as const,
  direction: 'loss' as const,
  stateNoun: { text: '{actor}', entityId: '$actor', visualKind: 'agent' as const },
  title: 'The lead went cold',
  causeClause: 'Never made it to the ruin in time',
  detail: '{actor} no longer has that lead.',
  polarity: 'loss' as const,
};

export const RUIN_LEAD_COLD: UnifiedActionTemplate = {
  id: RUIN_LEAD_COLD_ID,
  // Seed-only: the missed branch of a ruin visit is its only planter (THR-1526).
  drawable: false,
  name: 'The Lead Went Cold',
  description: '{actor} never reached the ruin in time.',
  rarityTier: 1,
  intrinsicTier: 'background',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  tags: ['#lead_gone_cold'],
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: LEAD_COLD_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      purposeLine: 'Let the lead go',
      narrativeTemplate: '{actor} never reached the ruin, and the lead has gone cold.',
      successAfterimage: 'The ruin is still out there. {actor} would have to hear of it again.',
      failureAfterimage: 'The ruin is still out there, and {actor} has lost the thread of it.',
      successMetadata: { effects: [{ kind: 'sharpen_clue', missed: true }] },
      failureMetadata: { effects: [{ kind: 'sharpen_clue', missed: true }] },
    },
  ],
  narrativeTemplates: {
    initiation: '{actor} never reached the ruin, and the lead has gone cold.',
    success: 'The lead went cold.',
    failure: 'The lead went cold.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{actor} never reached the ruin, and the lead has gone cold.',
      changes: [LEAD_GONE_COLD],
    },
  },
};
