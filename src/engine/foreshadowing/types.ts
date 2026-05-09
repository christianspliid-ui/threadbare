/**
 * Foreshadowing types — shared by the resolver, UI, and debug bridge (THR-389).
 */

import type { ReachDomain } from '../../types/traits';

export type IntelligenceTier = 'unknown' | 'rumor' | 'briefed' | 'expert';
export type TopMotive = 'awareness' | 'visibility' | 'prereqs' | 'threat' | 'capability' | 'cooldown';

export interface ForeshadowingSignals {
  intelligenceTier: IntelligenceTier;
  topMotive: TopMotive;
  dominantReach: ReachDomain;
}

export interface InterventionAttribution {
  interventionId: string;
  interventionKind: 'whisper' | 'nudge' | 'vision' | 'omen' | 'affliction' | 'bless';
  tickPerformed: number;
  /** One-line human-readable description: "you whispered of fever, three days ago." */
  summary: string;
}

export interface ForeshadowingResult {
  /** 2–4 sentences, enriched via graph-walking prose pipeline. */
  prose: string;
  /** Which variant matched, or null when the generic fallback was used. */
  variantId: string | null;
  signals: ForeshadowingSignals;
  interventionAttribution: InterventionAttribution | null;
  /** Tick at which this result was resolved (for cache freshness). */
  resolvedAtTick: number;
}

export interface ForeshadowingVariant {
  /** Stable ID for tracing and debug. */
  id: string;
  /** All defined clauses must be satisfied. Empty object = wildcard. */
  when: {
    intelligenceTier?: IntelligenceTier | IntelligenceTier[];
    topMotive?: TopMotive | TopMotive[];
    dominantReach?: ReachDomain | ReachDomain[];
    /** Mark template ID the agent must hold and be aware of (knownToHolder === true). */
    hasMark?: string;
    hasReputation?: { faction: string; min?: number; max?: number };
  };
  /** Graph-walking template, run through enrichProse(). */
  template: string;
}

export interface EncounterForeshadowing {
  variants: ForeshadowingVariant[];
  /** Used when no variant matches `when` predicates. */
  fallback: string;
}
