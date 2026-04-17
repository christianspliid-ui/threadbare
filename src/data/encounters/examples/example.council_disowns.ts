// THR-114: Gold-standard example — reputation_set (absolute assignment) + faction targeting
// Demonstrates: hard-reset of faction reputation, faction-wide recent_event.
// This is not a real game encounter — it is the canonical authoring reference.

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
        // Hard-reset the faction's public standing — not a delta, an absolute assignment.
        // Use reputation_set only when the fiction demands "it is now literally X",
        // not for ordinary outcome nudges.
        {
          kind: 'reputation_set',
          targetFactionId: 'role:lorekeepers',
          value: 0.1,
        },
        // The council's condemnation is known everywhere
        {
          kind: 'recent_event',
          witnessAgentIds: ['role:council_member_a', 'role:council_member_b', 'role:public'],
          message: 'The Lorekeepers have formally disowned {actorName}. Their name is to be expunged.',
          significance: 0.9,
          eventType: 'narrative',
        },
        // Actor's personal standing with the faction collapses too
        {
          kind: 'reputation_score',
          targetFactionId: 'role:lorekeepers',
          delta: -0.3,
        },
      ],
    },
  ],
};
