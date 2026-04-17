/**
 * Omen Agenda System — THR-19
 *
 * Omen tracks are short-lived thematic pressure lines (5–15 ticks) that make
 * diffuse world tension into readable atmospheric beats. At most 2 slots are
 * active simultaneously: primary (always doom-echo or seasonal fallback) and
 * secondary (sphere-surge or cultural, optional).
 */

import type { SphereName } from './index';
import type { DoomClockArchetype } from './doomClock';
import type { EncounterType } from './encounter';

// ─── Category ───────────────────────────────────────────────────

export type OmenCategory = 'doom_echo' | 'sphere_surge' | 'cultural' | 'seasonal';

// ─── Trigger Conditions ─────────────────────────────────────────

export type CulturalTriggerType =
  | 'faction_conflict'
  | 'low_prosperity'
  | 'high_prosperity'
  | 'high_unrest'
  | 'mass_death'
  | 'discovery_surge';

export interface CulturalTriggerCondition {
  type: CulturalTriggerType;
  /** Threshold value for the trigger condition (faction count / score 0–100 / etc.) */
  threshold: number;
}

// ─── Vocabulary ─────────────────────────────────────────────────

export interface OmenVocabulary {
  /** Short adjectives injected via {omen_adj} placeholder */
  adjectives: string[];
  /** Verbs injected via {omen_verb} placeholder */
  verbs: string[];
  /** Nouns injected via {omen_noun} placeholder */
  nouns: string[];
  /** Full sentence atmosphere fragments for {omen_atmosphere} and chronicle interludes */
  atmosphere: string[];
}

// ─── Beat Template ──────────────────────────────────────────────

export interface OmenBeatTemplate {
  /** Ticks between beat emissions */
  interval: number;
  /** Prose variants. Supports {location}, {agent}, {sphere} placeholders. */
  prose: string[];
  /** Significance for TickEvent emission (0–1) */
  significance: number;
}

// ─── Omen Track Template (content-authored) ─────────────────────

export interface OmenTrackTemplate {
  id: string;
  name: string;
  category: OmenCategory;
  /** One-line atmospheric description for UI tooltip */
  tagline: string;

  // ── Doom-echo conditions ──────────────────────────────────────
  /** Doom archetypes this track applies to (doom_echo only) */
  doomArchetypes?: DoomClockArchetype[];
  /** Doom stage range [min, max] inclusive (doom_echo only, 0-indexed) */
  doomStageRange?: [number, number];

  // ── Sphere-surge conditions ───────────────────────────────────
  /** Sphere that must exceed dominance threshold (sphere_surge only) */
  sphereTrigger?: { sphere: SphereName; minDominance: number };

  // ── Cultural conditions ───────────────────────────────────────
  culturalTrigger?: CulturalTriggerCondition;

  // ── Duration ─────────────────────────────────────────────────
  /** [min, max] tick duration chosen at selection time via PRNG */
  durationRange: [number, number];

  // ── Mechanical effects ────────────────────────────────────────
  /** Encounter type biases: +0.2 means 20% more likely to score, −0.2 means 20% less */
  encounterBias: Partial<Record<EncounterType, number>>;
  /** Sphere pressure applied per tick while active (sphere_surge only, capped by OMEN_SPHERE_PRESSURE_CAP) */
  spherePressure?: { sphere: SphereName; magnitude: number };

  // ── Narrative ─────────────────────────────────────────────────
  vocabulary: OmenVocabulary;
  beats: OmenBeatTemplate[];

  /** Significance for omen_started / omen_expired TickEvents (0–1) */
  chronicleSignificance: number;
}

// ─── Active Omen (runtime) ──────────────────────────────────────

export interface ActiveOmen {
  templateId: string;
  name: string;
  category: OmenCategory;
  /** Sphere associated with a sphere_surge omen (for UI coloring) */
  sphere?: SphereName;
  startTick: number;
  /** Duration chosen at selection time */
  duration: number;
  slot: 'primary' | 'secondary';
  /** Last tick a beat was emitted — checked against beat.interval */
  lastBeatTick: number;
}

// ─── Completed Omen (history entry) ─────────────────────────────

export interface CompletedOmen {
  templateId: string;
  startTick: number;
  endTick: number;
}

// ─── Omen State (on GameState) ──────────────────────────────────

export interface OmenState {
  primary: ActiveOmen | null;
  secondary: ActiveOmen | null;
  /** History of completed omens for THR-21 pattern detection (capped at OMEN_MAX_HISTORY) */
  history: CompletedOmen[];
}

// ─── Emitted Omens — aftermath-spawned regional/global omen events (THR-115) ──

export type EmittedOmenScope =
  | { readonly kind: 'global' }
  | { readonly kind: 'regional'; readonly regionId: string }
  | { readonly kind: 'local'; readonly hexCol: number; readonly hexRow: number; readonly radius?: number };

export interface EmittedOmen {
  readonly omenId: string;
  readonly sourceEncounterId: string;
  readonly sourceReactionId: string;
  readonly category: OmenCategory;
  readonly intensity: number;
  readonly scope: EmittedOmenScope;
  readonly narrativeHook: string;
  readonly sphereAlignment?: SphereName;
  readonly emittedTick: number;
  readonly expiresTick: number;
}
