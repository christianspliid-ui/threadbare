// src/types/remembrance.ts
import type { SphereName } from './index';
import type { AxiologicalProfile } from './agent';
import type { SphereAlignment } from './influence';
import type { ReachDomain } from './traits';

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

export interface HungerProseVariant {
  driveTag: string;                  // which Drive tag triggers this variant
  prose: string;                     // the Hunger reveal passage
}

export interface CourtOption {
  courtType: 'high_house' | 'circle' | 'web' | 'abyss';
  prose: string;                     // evocative description of this court shape
  isDefault: boolean;
}

export interface HungerDefinition {
  id: string;                        // e.g. 'hunger.witness'
  name: string;                      // e.g. 'Witness'
  imageAssetPath: string;            // cosmic abstract art
  proseVariants: HungerProseVariant[];
  mandateDirection: string;          // one-line mandate summary
  courtOptions: [CourtOption, CourtOption]; // default + alternative
  sphereAlignment: SphereAlignment;
  domainAffinities: Partial<Record<ReachDomain, number>>;
  ascendantLens: {
    perceptionStyle: string;         // how this god sees mortals
    emotionalTone: string;           // what colors their interactions
  };
}

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
  hungerId: string;
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
