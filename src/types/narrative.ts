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
  | 'contested_action'
  | 'dilemma_mutual_trust'
  | 'dilemma_betrayed'
  | 'dilemma_exploitation'
  | 'dilemma_mutual_distrust'
  | 'encounter_step_success'
  | 'encounter_step_failure'
  | 'encounter_completed'
  | 'encounter_abandoned';

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
  contextObjects?: ContextObject[];
  historicalFragments?: string[];
  oppositionSummary?: OppositionSummary;
}

// ─── Insider Beat Summary ───────────────────────────────────────

export interface InsiderBeatSummary {
  beatId: string;
  name: string;
  minStrength: number;
}

// ─── Context Builder Types ──────────────────────────────────────

export type ContextCategory = 'artifact' | 'faction' | 'character' | 'location' | 'event';

export interface ContextObject {
  nodeId: string;
  name: string;
  category: ContextCategory;
  relevanceScore: number;
  tensionType?: string;
  briefDescription: string;
}

export interface OpposingPair {
  sourceId: string;
  targetId: string;
  tensionType: string;
  score: number;
}

export interface OppositionSummary {
  dominantTension?: string;
  tensionScore: number;
  opposingPairs: OpposingPair[];
}

export interface NarrativeContext {
  event: NarrativeEvent;
  archetype?: string;
  contextObjects: ContextObject[];
  historicalFragments: string[];
  oppositionSummary: OppositionSummary;
  culturalStrength: number;           // 0-1, how strongly to apply cultural voice
  culturalTension?: {
    type: 'mismatch' | 'conquest' | 'dual' | 'fanaticism';
    cultureIds: string[];
    severity: number;
  };
  availableInsiderBeats: InsiderBeatSummary[];
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
