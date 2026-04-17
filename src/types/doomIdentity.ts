/**
 * Doom Identity Matrix — THR-21 Doom Archetype Identity Pass
 *
 * A per-archetype configuration bundle that shapes every layer of the
 * simulation to match the active doom's character. One matrix is loaded at
 * game-init from the active DoomClockArchetype and stored on GameState.
 *
 * The matrix drives eight integration points:
 *   1. Encounter pool bias   — tilts scoreAndSelect toward archetype encounters
 *   2. Rival behavior bias   — weights rival action types toward archetype flavour
 *   3. Location pressure     — shifts frontier / centre prosperity each tick
 *   4. Social strain         — multiplies proximity familiarity gain
 *   5. Complication bias     — scores archetype-relevant complications higher
 *   6. Prose tone            — seeds {doom_verb}, {doom_adj}, {doom_atmosphere}
 *   7. Chronicle themes      — per-stage chapter titles replace generic ones
 *   8. Identity milestones   — debug-visible narrative thresholds
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────────────
 * | Name                               | Default | Purpose                                               |
 * |------------------------------------|---------|-------------------------------------------------------|
 * | IDENTITY_ENCOUNTER_BIAS_CAP        | 0.3     | Max encounter bias magnitude per archetype (±)       |
 * | IDENTITY_RIVAL_BIAS_WEIGHT         | 0.4     | Scale factor applied to rival action weight deltas   |
 * | IDENTITY_PROSPERITY_MODIFIER_CAP   | 2.0     | Max |delta| clamped on identity prosperity pressure    |
 * | IDENTITY_TRUST_DECAY_MODIFIER      | 0.2     | Multiplier for scar-complication trust decay modifier|
 * | IDENTITY_COMPLICATION_BIAS_CAP     | 0.3     | Max complication score bias added per category       |
 * | IDENTITY_MILESTONE_CHECK_INTERVAL  | 5       | Doom ticks between milestone condition checks        |
 * | BREACH_FRONTIER_PROSPERITY_PENALTY | -1      | Prosperity delta applied to frontier hexes (Breach)  |
 * | CONVERGENCE_CENTER_PROSPERITY_BONUS| 1       | Prosperity delta applied to centre hexes (Convergence)|
 */

import type { DoomClockArchetype } from './doomClock';
import type { ComplicationCategory } from './complication';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum absolute bias score added to encounter candidates (±). */
export const IDENTITY_ENCOUNTER_BIAS_CAP = 0.3;

/** Scale factor applied when blending identity rival-action weight deltas. */
export const IDENTITY_RIVAL_BIAS_WEIGHT = 0.4;

/** Maximum identity-derived prosperity delta magnitude (clamped before accumulation). */
export const IDENTITY_PROSPERITY_MODIFIER_CAP = 2.0;

/** Multiplier on scar-complication trust decay driven by doom identity.
 * @todo(THR-122) Wire this into complicationEffects.ts trust_decay handler so
 * doom identity amplifies relationship damage from scar-type complications.
 */
export const IDENTITY_TRUST_DECAY_MODIFIER = 0.2;

/** Maximum additive score bonus applied to complication candidates per category. */
export const IDENTITY_COMPLICATION_BIAS_CAP = 0.3;

/** Interval (doom ticks) between milestone condition evaluations. */
export const IDENTITY_MILESTONE_CHECK_INTERVAL = 5;

/** Prosperity delta applied each tick to frontier-adjacent hexes under Breach. */
export const BREACH_FRONTIER_PROSPERITY_PENALTY = -1;

/** Prosperity bonus applied each tick to centre hexes under Convergence. */
export const CONVERGENCE_CENTER_PROSPERITY_BONUS = 1;

// ─── Supporting types ────────────────────────────────────────────────────────

/**
 * Defines prosperity pressure applied to location tiers each tick.
 * Positive = prosperity boost; negative = prosperity drain.
 */
export interface IdentityLocationPressure {
  /** Applied to settlements near the frontier edge (high hex distance from centre). */
  frontierDelta: number;
  /** Applied to settlements near the map centre. */
  centerDelta: number;
  /**
   * Additional unrest applied each tick to locations where agents have died (deathCount > 0).
   * Consumed by phaseProsperity; deathCount is incremented by phaseAgentLifecycle.
   */
  deathSiteUnrestBonus?: number;
}

/**
 * A named milestone in the doom arc that fires when conditions are met.
 * Debug-only: displayed in the Debug Panel Omens tab.
 */
export interface IdentityMilestone {
  /** Short label shown in debug view. */
  label: string;
  /** Doom clock progress fraction (0–1) at which to check the condition. */
  progressThreshold: number;
  /** Human-readable description of what this milestone represents. */
  description: string;
  /** Whether this milestone has already fired (set at runtime). */
  triggered?: boolean;
}

/**
 * Prose vocabulary bank used to populate {doom_verb}, {doom_adj}, {doom_atmosphere}
 * enrichment placeholders. One value is chosen per NarrativeContext construction.
 */
export interface IdentityProseTone {
  /** Present-tense verbs evoking the archetype's motion (e.g. "fractures", "seeps"). */
  verbs: string[];
  /** Atmospheric adjectives (e.g. "fractured", "hollow", "smothering"). */
  adjectives: string[];
  /** Short atmospheric phrases (e.g. "the boundary thins", "silence accumulates"). */
  atmospheres: string[];
}

// ─── Core interface ──────────────────────────────────────────────────────────

/**
 * Complete configuration bundle for one DoomClockArchetype.
 * Loaded once at game-init, referenced throughout the tick pipeline.
 */
export interface DoomIdentityMatrix {
  /** The archetype this matrix belongs to. */
  archetype: DoomClockArchetype;

  /**
   * Encounter type → additive bias score (capped at ±IDENTITY_ENCOUNTER_BIAS_CAP).
   * Keys must match encounterType values used in EncounterCacheEntry.
   * Passed to scoreAndSelect() alongside omen bias.
   */
  encounterPoolBias: Partial<Record<string, number>>;

  /**
   * Rival action type → weight delta applied before normalisation.
   * Keys should match strings in rival ACTION_TYPES constant.
   * Scaled by IDENTITY_RIVAL_BIAS_WEIGHT before application.
   */
  rivalBehaviorBias: Partial<Record<string, number>>;

  /** Per-location-tier prosperity pressure applied each tick via phaseProsperity. */
  locationPressure: IdentityLocationPressure;

  /**
   * Multiplier on proximity familiarity gain in phaseFamiliarityGain.
   * 1.0 = no change; >1 = bonds form faster; <1 = harder to form bonds.
   */
  familiarityGainModifier: number;

  /**
   * Complication category → additive score bonus (capped at ±IDENTITY_COMPLICATION_BIAS_CAP).
   * Applied during scoreCandidate() in complicationSelection.ts.
   */
  complicationBias: Partial<Record<ComplicationCategory, number>>;

  /** Vocabulary pools for doom-flavoured enrichment placeholders. */
  proseTone: IdentityProseTone;

  /**
   * Per-stage chapter titles for the chronicle (5 stages).
   * Index corresponds to doom stage index (0–4). Falls back to generic
   * getVolumeTitle() if fewer than the current stage count are supplied.
   */
  chronicleChapterTitles: string[];

  /** Narrative milestones checked periodically; debug-panel display only. */
  identityMilestones: IdentityMilestone[];
}
