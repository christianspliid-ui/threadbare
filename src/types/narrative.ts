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

// Re-export SPHERE_VOCABULARY from content package for backward compatibility
export { SPHERE_VOCABULARY } from '../data/narrative-content';
