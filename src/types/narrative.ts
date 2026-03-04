import type { SphereName } from './index';
import type { ValuePair } from './agent';

// ─── Tiers ───────────────────────────────────────────────────────

export type NarrativeTier = 'routine' | 'notable' | 'chronicle';

export const NARRATIVE_TIERS: NarrativeTier[] = ['routine', 'notable', 'chronicle'];

// ─── Voice ───────────────────────────────────────────────────────

export type VoiceMode =
  | 'second_person'
  | 'third_person_omniscient'
  | 'dramatic_present';

// ─── Events ──────────────────────────────────────────────────────

export type NarrativeEventType =
  | 'action_resolved'
  | 'action_failed'
  | 'action_critical'
  | 'trait_acquired'
  | 'trait_lost'
  | 'tier_transition'
  | 'doom_escalation'
  | 'mandate_stage'
  | 'divine_intervention'
  | 'actor_death'
  | 'contested_action';

export interface NarrativeEvent {
  id: string;
  tier: NarrativeTier;
  eventType: NarrativeEventType;
  actorId?: string;
  targetId?: string;
  description: string;
  tick: number;
  sphere?: SphereName;
  personalityTraits?: ValuePair[];
  tags?: string[];
}

// ─── Prose Output ────────────────────────────────────────────────

export interface ProseFragment {
  text: string;
  voice: VoiceMode;
  tier: NarrativeTier;
  eventId: string;
  sphereColoring?: SphereName;
}

export interface ProseContext {
  actorName?: string;
  targetName?: string;
  locationName?: string;
  sphere?: SphereName;
  dominantValues?: ValuePair[];
  foundationBias?: 'chaos' | 'order' | 'light' | 'darkness' | 'balanced';
}

// ─── Chronicle ───────────────────────────────────────────────────

export interface ChronicleEntry {
  id: string;
  tier: 'chronicle';
  title: string;
  prose: string;
  promptContext: {
    actors: string[];
    location: string;
    sphere: SphereName;
    mood: string;
    previousEvents?: string[];
  };
  tick: number;
}

// ─── Sphere Vocabulary ───────────────────────────────────────────

export interface SphereVocabulary {
  adjectives: string[];
  verbs: string[];
  nouns: string[];
}

export const SPHERE_VOCABULARY: Record<SphereName, SphereVocabulary> = {
  force: {
    adjectives: ['mighty', 'thunderous', 'relentless', 'crushing', 'unyielding'],
    verbs: ['shattered', 'struck', 'overwhelmed', 'battered', 'surged'],
    nouns: ['might', 'fury', 'impact', 'avalanche', 'storm'],
  },
  matter: {
    adjectives: ['solid', 'enduring', 'immovable', 'crystalline', 'dense'],
    verbs: ['forged', 'shaped', 'hardened', 'anchored', 'crystallized'],
    nouns: ['stone', 'iron', 'foundation', 'bulwark', 'bedrock'],
  },
  energy: {
    adjectives: ['crackling', 'luminous', 'volatile', 'radiant', 'searing'],
    verbs: ['blazed', 'surged', 'erupted', 'ignited', 'cascaded'],
    nouns: ['flame', 'lightning', 'pulse', 'arc', 'inferno'],
  },
  life: {
    adjectives: ['verdant', 'flourishing', 'vital', 'blooming', 'fecund'],
    verbs: ['bloomed', 'healed', 'nurtured', 'grew', 'restored'],
    nouns: ['growth', 'renewal', 'bloom', 'vitality', 'spring'],
  },
  mind: {
    adjectives: ['keen', 'piercing', 'calculating', 'lucid', 'insightful'],
    verbs: ['discerned', 'analyzed', 'perceived', 'understood', 'unraveled'],
    nouns: ['thought', 'insight', 'clarity', 'revelation', 'logic'],
  },
  spirit: {
    adjectives: ['ethereal', 'transcendent', 'luminous', 'spectral', 'sacred'],
    verbs: ['resonated', 'sanctified', 'communed', 'invoked', 'channeled'],
    nouns: ['soul', 'essence', 'prayer', 'vision', 'aura'],
  },
  time: {
    adjectives: ['ancient', 'inexorable', 'cyclic', 'fading', 'eternal'],
    verbs: ['aged', 'unwound', 'echoed', 'rippled', 'decayed'],
    nouns: ['epoch', 'moment', 'tide', 'cycle', 'memory'],
  },
  entropy: {
    adjectives: ['decaying', 'consuming', 'inevitable', 'dissolving', 'chaotic'],
    verbs: ['crumbled', 'consumed', 'unraveled', 'corroded', 'scattered'],
    nouns: ['ash', 'ruin', 'void', 'decay', 'dissolution'],
  },
};
