/**
 * Ruin archetype descriptor seeds — short factual descriptors consumed by
 * the Delve prose pipeline (PR 4) when generating chamber-interior prose.
 *
 * Three archetypes cover the full thematic range of elder ruins:
 *   vault      — repositories of wealth, knowledge, or sealed power
 *   temple     — sacred sites of worship, sacrifice, or covenant
 *   battlefield — sites of catastrophic conflict, mass death, or siege
 *
 * These are scaffold descriptors, not final prose. Content authors expand
 * them during the PR 4 prose sprint.
 */

export type RuinArchetype = 'vault' | 'temple' | 'battlefield';

export interface RuinArchetypeDescriptor {
  id: RuinArchetype;
  /** Display label shown in debug panel and UI. */
  label: string;
  /** One-line factual descriptor for prose pipeline lookup. */
  summary: string;
  /** Short physical cues — what an agent would observe on approach. */
  approachCues: readonly string[];
  /** What the interior typically holds — drives chamber archetype selection. */
  interiorType: 'sealed_chamber' | 'nave_and_crypt' | 'open_killing_ground';
}

export const RUIN_ARCHETYPES: Record<RuinArchetype, RuinArchetypeDescriptor> = {
  vault: {
    id: 'vault',
    label: 'Vault',
    summary: 'A sealed repository of the fallen culture — treasure, records, or contained power.',
    approachCues: [
      'Carved threshold stones mark the entrance, worn smooth by ritual touch.',
      'Iron lock-bars, corroded but intact, seal a recessed doorway.',
      'The walls are undamaged — this place was built to last, not abandoned in haste.',
    ],
    interiorType: 'sealed_chamber',
  },
  temple: {
    id: 'temple',
    label: 'Temple',
    summary: 'A sacred site of the fallen culture — altar, covenant stone, or place of invocation.',
    approachCues: [
      'The foundation stones are larger than any quarry nearby could have produced.',
      'Votive niches line the approach path, empty of their offerings for generations.',
      'A central altar stone dominates the ruin, its surface marked by repeated use.',
    ],
    interiorType: 'nave_and_crypt',
  },
  battlefield: {
    id: 'battlefield',
    label: 'Battlefield',
    summary: 'A site of mass catastrophe — siege end, ritual slaughter, or world-wound.',
    approachCues: [
      'The ground is unnaturally flat where buildings once stood, razed to the foundation.',
      'Corroded weapon fragments surface after heavy rain, too numerous to count.',
      'The silence here is different — animals avoid this ground without obvious reason.',
    ],
    interiorType: 'open_killing_ground',
  },
};

/** Weighted archetype distribution for random selection (vault=40%, temple=35%, battlefield=25%) */
export const ARCHETYPE_WEIGHTS: Record<RuinArchetype, number> = {
  vault: 0.40,
  temple: 0.35,
  battlefield: 0.25,
};

/** Pick an archetype from the weighted distribution given a 0..1 RNG roll. */
export function pickRuinArchetype(roll: number): RuinArchetype {
  if (roll < ARCHETYPE_WEIGHTS.vault) return 'vault';
  if (roll < ARCHETYPE_WEIGHTS.vault + ARCHETYPE_WEIGHTS.temple) return 'temple';
  return 'battlefield';
}
