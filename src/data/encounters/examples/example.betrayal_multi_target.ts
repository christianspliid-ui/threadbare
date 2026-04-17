// THR-114: Gold-standard example — multi-target aftermath effects
// Demonstrates: hidden_mark on non-actor victim, reputation_score on faction,
// witness fan-out via recent_event, apply_condition on victim.
// This is not a real game encounter — it is the canonical authoring reference.

import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

export const EXAMPLE_BETRAYAL_MULTI_TARGET: Partial<UnifiedActionTemplate> = {
  id: 'example.betrayal_multi_target',
  name: 'A Confidence Betrayed (example)',

  // reactions are part of the aftermathSummary / aftermathConfig at runtime;
  // shown here as illustrative raw shape for content-author reference.
  // @ts-ignore — illustrative shape only, not a real registered template
  reactions: [
    {
      id: 'rx.betrayal_revealed',
      label: 'The Betrayal Comes to Light',
      effects: [
        // Mark the victim (not the actor) — their future investigations surface this
        {
          kind: 'hidden_mark',
          targetAgentId: 'role:victim',   // role: prefix = participant substitution
          category: 'betrayal',
          severity: 0.7,
          label: 'betrayed by {actorName}',
          revealFamilies: ['investigation', 'confrontation'],
        },
        // Drop the faction's public standing — not just the actor's standing with them
        {
          kind: 'reputation_score',
          targetFactionId: 'role:guild',
          delta: -0.05,
        },
        // All witnesses remember this — fan-out to multiple agents
        {
          kind: 'recent_event',
          witnessAgentIds: ['role:witness_a', 'role:witness_b', 'role:bystander'],
          message: '{actorName} betrayed {victimName} — many saw it.',
          significance: 0.75,
        },
        // Attach a "grieving" condition to the victim, expiring in ~200 ticks
        {
          kind: 'apply_condition',
          targetAgentId: 'role:victim',
          conditionTraitId: 'trait.condition.grieving',
          durationTicks: 200,
          intensity: 0.6,
        },
      ],
    },
  ],
};
