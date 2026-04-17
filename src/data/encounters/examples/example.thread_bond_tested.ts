// THR-116: Gold-standard example — `when` predicate gating + thread mutation effects.
// Demonstrates: conditional aftermath reactions, thread_strengthen, thread_weaken.
// This is not a real game encounter — it is the canonical authoring reference for THR-116.

import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

export const EXAMPLE_THREAD_BOND_TESTED: Partial<UnifiedActionTemplate> = {
  id: 'example.thread_bond_tested',
  name: 'The Bond Tested (example)',

  // @ts-ignore — illustrative shape only, not a real registered template
  reactions: [
    {
      id: 'rx.bond_held',
      label: 'The mortal held fast',
      effects: [
        // Unconditional: narrative record
        {
          kind: 'recent_event',
          message: '{name} stood firm under pressure. The thread between you quickens.',
          significance: 0.6,
          eventType: 'narrative',
        },
        // Conditional: strengthen the thread only if the mortal's health is not critically low.
        // `when` gates the effect — if the condition fails, the effect is silently skipped
        // and an aftermath_effect_skipped_by_when trace is emitted.
        {
          kind: 'thread_strengthen',
          ascendantId: 'self',
          mortalId: 'actor',
          delta: 0.15,
          reason: 'Proved loyalty under duress',
          when: 'health_high',
        },
        // Strengthen by a smaller amount even when health is low (no when = always fires)
        {
          kind: 'thread_strengthen',
          ascendantId: 'self',
          mortalId: 'actor',
          delta: 0.05,
          reason: 'Loyalty noted, despite wounds',
        },
      ],
    },
    {
      id: 'rx.bond_broken',
      label: 'The mortal faltered',
      effects: [
        {
          kind: 'recent_event',
          message: '{name} cracked under pressure. The thread dims.',
          significance: 0.6,
          eventType: 'narrative',
        },
        // Weaken the thread — fires unconditionally on this branch.
        {
          kind: 'thread_weaken',
          ascendantId: 'self',
          mortalId: 'actor',
          delta: 0.2,
          reason: 'Failed at the critical moment',
        },
        // Seed a follow-up encounter — only if the thread is with someone of reputation.
        // Uses causal prose: {cause:label} and {cause:ticksAgo} can appear in the seeded encounter's prose.
        {
          kind: 'encounter_seed',
          seedLabel: 'Aftermath of the broken pact',
          targetAgentId: 'actor',
          eligibleAfterTicks: 6,
          templateId: 'example.thread_bond_tested',
          when: 'reputation_above:0.5',
        },
      ],
    },
  ],
};
