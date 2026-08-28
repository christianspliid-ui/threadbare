// src/types/remembrance.ts
import type { SphereName } from './index';
import type { AxiologicalProfile } from './agent';
import type { SphereAlignment } from './influence';
import type { ReachDomain } from './traits';
import type { CourtOption, HungerDefinition, HungerProseVariant, StoredHungerId } from './hunger';

/**
 * The Hunger shapes moved to `./hunger` in THR-1213, where the remembrance
 * half and the engine half of a hunger merged into one total definition.
 * Re-exported here so every existing importer keeps working unchanged.
 */
export type { CourtOption, HungerDefinition, HungerProseVariant, StoredHungerId };

// --- Stirring (Beat 1) ---

export interface StirringImage {
  id: string;                        // e.g. 'stirring.tangled-light'
  imageAssetPath: string;            // path to abstract art asset
  fragmentClusters: string[];        // tags that filter which Origins surface
}

// --- Remembrance Fragments (Beats 2 & 3) ---

export interface RemembranceFragment {
  id: string;                        // e.g. 'origin.ancient-scholar'
  beat: 'origin' | 'drive';
  prose: string;                     // 2-3 sentence evocative text
  imageAssetPath: string;            // abstract art reference
  // Filtering
  stirringClusters: string[];        // which Stirring image clusters can lead here
  requiredOriginTags?: string[];     // for Drive fragments: which Origin tags enable this
  // Mechanical seeds (hidden from player)
  tags: string[];                    // e.g. ['ancient', 'scholar', 'loss', 'mind']
  timeSinceAscension?: 'recent' | 'ancient';  // Origin only
  domainLeanings: ReachDomain[];     // reach affinities seeded
  sphereDirection: SphereName[];     // sphere affinities pushed toward
  hungerWeights: Partial<Record<string, number>>; // how much this fragment favors each Hunger
}

// --- Hunger (Beat 4) ---

// `HungerProseVariant`, `CourtOption` and `HungerDefinition` are defined in
// `./hunger` (THR-1213) and re-exported at the top of this file.

// --- Flow State ---

export type RemembranceBeat = 'stirring' | 'origin' | 'drive' | 'transformation' | 'reveal';

export interface RemembranceState {
  currentBeat: RemembranceBeat;
  stirringImageId: string | null;
  originFragment: RemembranceFragment | null;
  mortalName: string | null;
  driveFragment: RemembranceFragment | null;
  hunger: HungerDefinition | null;
  courtType: 'high_house' | 'circle' | 'web' | 'abyss' | null;
}

// --- Final Output ---

export interface AscendantIdentity {
  // Mortal echo
  mortalName: string;
  originFragmentId: string;
  driveFragmentId: string;
  timeSinceAscension: 'recent' | 'ancient';
  mortalTags: string[];              // combined tags from origin + drive
  // Divine transformation
  divineName: string;
  /** The persisted dotted spelling — read back through `toHungerId` (THR-1213). */
  hungerId: StoredHungerId;
  hungerName: string;
  mandateDirection: string;
  courtType: 'high_house' | 'circle' | 'web' | 'abyss';
  sphereAlignment: SphereAlignment;
  domainAffinities: Partial<Record<ReachDomain, number>>;
  personalitySeed: AxiologicalProfile;
  ascendantLens: {
    perceptionStyle: string;
    emotionalTone: string;
  };
}
