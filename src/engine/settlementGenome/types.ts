import type { ReachDomain } from '../../types/traits';
import type { NpcRole } from '../../types/npc';
import type { SphereName } from '../../types/index';

export type SettlementTier = 'hamlet' | 'town' | 'city' | 'capital';

export type SublocationTag =
  | 'military' | 'scholarly' | 'arcane' | 'commerce'
  | 'religious' | 'cultural' | 'underworld' | 'nature'
  | 'authority' | 'borderlands';

export interface SublocationContribution {
  id: string;             // sublocation type ID (e.g. 'sublocation-type.barracks')
  minTier: SettlementTier;
  tags: SublocationTag[];
  condition?: 'high-prosperity' | 'trade-route' | 'coastal-hex' | 'borderlands';
}

export interface NpcContribution {
  role: NpcRole;
  minTier: SettlementTier;
}

export interface SphereContributionDef {
  sublocations: SublocationContribution[];
  npcRoles: NpcContribution[];
}

export interface ReachContributionDef {
  sublocations: SublocationContribution[];
  npcRoles: NpcContribution[];
}

export interface ArchetypeDef {
  id: string;
  name: string;
  requiredTags: { tag: SublocationTag; count: number }[];
  capstoneSublocations: string[];
  capstoneNpcs: NpcRole[];
  proseFlavor: string;
  priority: number;
}

export interface GenomeResult {
  sublocations: { id: string; sourcePass: 'infrastructure' | 'culture' | 'sphere' | 'reach' | 'archetype'; tags: SublocationTag[] }[];
  npcs: { role: NpcRole; sourcePass: string; preferredSublocation?: string }[];
  archetypeId: string | null;
  archetypeName: string | null;
  archetypeProseFlavor: string | null;
  settlementReachProfile: Record<ReachDomain, number>;
}

// Suppress unused import warnings — these types are used as constraints in data tables
export type { SphereName };
