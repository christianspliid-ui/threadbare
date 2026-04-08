/**
 * Game Configuration — Tunable constants for game pacing and feel.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change game length,
 * pacing, and difficulty. Every number here is a design lever.
 * See also: Obsidian vault → "Doom Clock" and "Victory Mandate"
 * ═══════════════════════════════════════════════════════════════════
 *
 * For mandate difficulty (how hard each mandate is to complete),
 * edit the JSON files in src/data/mandates/ — specifically the
 * conditions.params.minCount values in each stage.
 */

import type { DoomClockArchetype } from '../types/doomClock';

// ─── Doom Clock Pacing ──────────────────────────────────────────

/**
 * Default doom clock length in ticks.
 *
 * This is the single biggest lever on game length.
 * Obsidian design spec suggests three tiers:
 *   Short  ~30–50   ticks  (fast, tight)
 *   Medium ~80–120  ticks  (balanced, allows planning)
 *   Long   ~150–200 ticks  (epic scope, multiple escalation cycles)
 *
 * Current default: 200 (Long tier).
 */
export const DEFAULT_DOOM_TICKS = 200;

/**
 * Journey pacing is intentionally aligned to the doom chapters:
 * - Chapter 1 (0-20%): Call
 * - Chapters 2-3 (20-55%): Road of Trials
 * - Late chapter 3 / early chapter 4 (55-70%): Crisis
 * - End of chapter 4 (70-80%): Ordeal
 * - Chapter 5 (80-100%): Return has resolved, the Climax plays out
 */
export const JOURNEY_CALL_PHASE_END = 0.20;
export const JOURNEY_TRIALS_PHASE_END = 0.55;
export const JOURNEY_CRISIS_PHASE_END = 0.70;
export const JOURNEY_ORDEAL_PHASE_END = 0.80;
export const DOOM_CLIMAX_START = JOURNEY_ORDEAL_PHASE_END;

// ─── Mandate Pacing ─────────────────────────────────────────────

/** Required increase to the primary remembrance sphere before doom expires. */
export const MANDATE_PRIMARY_TARGET_DELTA = 0.18;

/** Softer supporting target shown for the secondary remembrance sphere. */
export const MANDATE_SECONDARY_TARGET_DELTA = 0.10;

/** Doom progress checkpoints where the mandate feeds back into omen severity. */
export const MANDATE_CHECKPOINT_THRESHOLDS = [0.40, 0.60, 0.80, 1.00] as const;

/** How far ahead of a checkpoint target the player must be to earn a counter-omen. */
export const MANDATE_COUNTER_OMEN_MARGIN = 0.02;

/** Default secondary-objective targets by court shape. */
export const MANDATE_WEB_SECONDARY_TARGET = 8;
export const MANDATE_CIRCLE_SECONDARY_TARGET = 3;
export const MANDATE_HIGH_HOUSE_SECONDARY_TARGET = 4;
export const MANDATE_ABYSS_SECONDARY_TARGET = 5;

// ─── Doom Card Effects ──────────────────────────────────────────

/** Base count of hexes affected by a corruption/drain doom card. */
export const DOOM_CARD_HEX_TARGET_COUNT = 6;

/** Base count of settlements affected by an unrest or prosperity doom card. */
export const DOOM_CARD_LOCATION_TARGET_COUNT = 4;

/** Base count of threaded agents affected by a personal doom card. */
export const DOOM_CARD_AGENT_TARGET_COUNT = 2;

/** Base corruption/drain delta applied by doom cards before severity scaling. */
export const DOOM_CARD_HEX_DELTA = 0.18;

/** Base unrest delta applied by doom cards before severity scaling. */
export const DOOM_CARD_UNREST_DELTA = 12;

/** Base prosperity shock applied by doom cards before severity scaling. */
export const DOOM_CARD_PROSPERITY_DELTA = -8;

/** Base sphere-pressure magnitude applied by doom cards before severity scaling. */
export const DOOM_CARD_PRESSURE_MAGNITUDE = 3;

/** Minimum severity multiplier for a resolved doom beat after counter-omens soften it. */
export const DOOM_MIN_SEVERITY = 0.5;

/** How much one counter-omen softens the next doom beat's severity. */
export const DOOM_COUNTER_OMEN_SOFTENING = 0.5;

/**
 * Doom archetypes available for selection at run start.
 * Each archetype has its own JSON file in src/data/doom/
 * defining stage names and thresholds.
 */
export const DOOM_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning',
];

// ─── Twilight Phase ─────────────────────────────────────────────

/**
 * Number of wind-down ticks after doom expires (the Twilight phase).
 * During Twilight the world is collapsing — free Influence Essence,
 * reduced success rates, last-chance actions.
 *
 * Obsidian spec: 5–10 playable ticks.
 */
export const TWILIGHT_TICKS = 7;

// ─── Mandate Weights (selection probability) ────────────────────

/**
 * Weight multiplier when a mandate template matches the ascendant's
 * primary sphere. Higher = more likely to be selected.
 */
export const MANDATE_PRIMARY_WEIGHT = 3;

/**
 * Weight multiplier for secondary sphere match.
 */
export const MANDATE_SECONDARY_WEIGHT = 2;

/**
 * Base weight when no sphere match (every mandate is always eligible).
 */
export const MANDATE_BASE_WEIGHT = 1;

/**
 * Extra multiplier for simulation_achievable mandate type.
 */
export const MANDATE_ACHIEVABLE_MULTIPLIER = 2;
