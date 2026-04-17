// THR-114: Gold-standard example — sublocation-targeted apply_condition
// Demonstrates: applying a long-duration condition to a place (not an agent).
// This is not a real game encounter — it is the canonical authoring reference.

import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

export const EXAMPLE_SHRINE_CONSECRATION: Partial<UnifiedActionTemplate> = {
  id: 'example.shrine_consecration',
  name: 'The Rite of Consecration (example)',

  // @ts-ignore — illustrative shape only, not a real registered template
  reactions: [
    {
      id: 'rx.shrine_consecrated',
      label: 'The Shrine is Consecrated',
      effects: [
        // The shrine itself (a sublocation) gains a consecrated condition for 1000 ticks
        {
          kind: 'apply_condition',
          targetSublocationId: 'role:shrine',
          conditionTraitId: 'trait.condition.consecrated',
          durationTicks: 1000,
          intensity: 0.8,
        },
        // All present witness the consecration rite
        {
          kind: 'recent_event',
          witnessAgentIds: ['role:pilgrim_a', 'role:pilgrim_b'],
          message: 'The shrine pulses with renewed light. Something has changed in this place.',
          significance: 0.7,
          eventType: 'narrative',
        },
        // Remove any prior desecrated condition from the shrine
        {
          kind: 'remove_condition',
          targetSublocationId: 'role:shrine',
          conditionTraitId: 'trait.condition.desecrated',
          removeAll: true,
        },
      ],
    },
  ],
};
