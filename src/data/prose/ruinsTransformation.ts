/**
 * Transformation prose — fired when a delve's Emergence resolves into either a
 * PlaceOfPower (transformed) or a Scar (consumed). Keyed by (archetype, fate).
 *
 * Each entry has a Poet's Voice (italic narrative) and Witness facts
 * (mechanical bullets). Uses enrichment placeholders: {name}, {their},
 * {artifact}. NO hardcoded character names.
 */

import type { RuinArchetype } from '../../engine/ruins/delveTypes';

export type TransformationFate = 'transformed' | 'consumed';

export interface TransformationProseEntry {
  poet: string;
  witness: string[];
}

type Lookup = Record<RuinArchetype, Record<TransformationFate, TransformationProseEntry>>;

export const RUINS_TRANSFORMATION_PROSE: Lookup = {
  vault: {
    transformed: {
      poet: 'The alcoves unseal one by one along the length of the hall, each releasing a measured breath of something older than language. {name} stands at the centre as the vault relearns what it is — not a tomb, but a wellspring that has finally remembered how to pour.',
      witness: [
        'Ruin promoted to Place of Power (vault).',
        'Essence stream initialised; holder bound.',
        'Cache invalidated — map signifier swapped.',
      ],
    },
    consumed: {
      poet: 'The last seal gives and the vault exhales its full length at once, taking its records with it. When the dust settles, what remains is only the shape of the hollow — a scar in the earth where knowledge used to live.',
      witness: [
        'Ruin consumed; ruins.scar sublocation formed.',
        'Elder-essence reward credited at reduced rate.',
        'Delve contract cleared.',
      ],
    },
  },
  temple: {
    transformed: {
      poet: 'The altar accepts {name} the way water accepts a stone dropped from a great height — an instant of resistance, then a widening circle of consequence. When the echoes still, the temple\'s patron has spoken, and the ground is warmer than before.',
      witness: [
        'Ruin promoted to Place of Power (temple).',
        'Passive essence stream active.',
        'Holder edge seeded on the new Place.',
      ],
    },
    consumed: {
      poet: 'The rite finishes and the idol does not. Something in the stone refuses to return to mere stone. {name} walks out of the temple shorter than {they} walked in — and the temple walks out too, carried away as a burden in the shape of a silence.',
      witness: [
        'Ruin consumed; scar retains temple-resonance.',
        'Essence reward halved.',
        'Agent marked by the consumed rite.',
      ],
    },
  },
  battlefield: {
    transformed: {
      poet: 'The old grief in the ground rearranges itself around {name}. Rusted standards realign. The hum of old iron remembers its purpose and chooses, finally, a new one. The field is no longer a grave. It is a forge waiting for its first strike.',
      witness: [
        'Ruin promoted to Place of Power (battlefield).',
        'Essence stream aligned to founding sphere.',
        'Holder edge seeded.',
      ],
    },
    consumed: {
      poet: 'Every soldier the field had kept in its long memory dies a second time at once. {name} feels the tide of it pass through {their} chest like a migration. What was a battlefield is now a wound that will not close — but it will not kill either.',
      witness: [
        'Ruin consumed; ruins.scar persists on the field.',
        'Fractional essence credited.',
        'Agent carries haunted-by-scar condition seed.',
      ],
    },
  },
};

export function resolveTransformationProse(
  archetype: RuinArchetype,
  fate: TransformationFate,
): TransformationProseEntry {
  return RUINS_TRANSFORMATION_PROSE[archetype][fate];
}
