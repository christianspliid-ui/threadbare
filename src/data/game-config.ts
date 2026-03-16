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
export const DEFAULT_DOOM_TICKS = 2000;

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
