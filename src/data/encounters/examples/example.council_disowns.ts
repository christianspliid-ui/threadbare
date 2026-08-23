// THR-114 → THR-1206: Gold-standard example — reputation with a party you are not in.
// Demonstrates: `reputation_with` against a faction, plus a faction-wide recent_event.
// This is not a real game encounter — it is the canonical authoring reference.
//
// What changed and why (THR-1206). This file used to teach `reputation_set`, an
// absolute assignment to a one-sided `reputationScore` node property. That effect's
// authoring surface is retired: the director ruled that reputation is the game's one
// social score — *"the social score that modifies interactions between a and b"* — and
// a one-sided renown number is not between a and b. The handler stays live so worlds
// saved before this ticket keep resolving; nothing new should be authored against it.
//
// Which reputation effect to reach for:
//
//   `faction_reputation_gain` — the actor **is** a member. Carries rank, access,
//                               bonuses and expulsion; the only leg with those.
//   `reputation_with`         — everything else: a place, a person, or a faction the
//                               actor does not belong to. This example's case.
//   `reputation_tally`        — what the actor is becoming *known for*, on a
//                               `<reach>.positive|negative` key. Not standing with
//                               anyone; an off-axis key here is rejected at runtime
//                               and fails `check:encounter`.

import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

export const EXAMPLE_COUNCIL_DISOWNS: Partial<UnifiedActionTemplate> = {
  id: 'example.council_disowns',
  name: 'The Council Renders Judgement (example)',

  // @ts-ignore — illustrative shape only, not a real registered template
  reactions: [
    {
      id: 'rx.council_disowns',
      label: 'The Council Publicly Disowns the Accused',
      effects: [
        // The actor's standing WITH the Lorekeepers collapses. `reputation_with`
        // rather than `faction_reputation_gain` because being disowned is precisely
        // the state of no longer being a member — the membership leg no-ops for a
        // non-member (`not_a_member`), so it could not carry this consequence at all.
        //
        // A delta, never an assignment: how far you fall depends on how far you had
        // climbed, which is the thing an absolute write threw away. Capped at
        // REPUTATION_WITH_MAX_DELTA_PER_OUTCOME per outcome.
        {
          kind: 'reputation_with',
          targetFactionId: 'role:lorekeepers',
          delta: -0.15,
        },
        // The council's condemnation is known everywhere
        {
          kind: 'recent_event',
          witnessAgentIds: ['role:council_member_a', 'role:council_member_b', 'role:public'],
          message: 'The Lorekeepers have formally disowned {actorName}. Their name is to be expunged.',
          significance: 0.9,
          eventType: 'narrative',
        },
        // What the world at large now knows them for is a separate axis from what the
        // Lorekeepers think of them — a reach-polarity tally, on a valid key.
        {
          kind: 'reputation_tally',
          key: 'star.negative',
          delta: 1,
        },
      ],
    },
  ],
};
