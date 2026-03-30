// src/types/hexVignette.ts

import type { HexCoord } from './index';
import type { HexVisibilityState } from './visibility';

// ─── Animation Constants ────────────────────────────────────────────
export const WORD_REVEAL_INTERVAL_MS = 80;    // Time between each new word appearing
export const LETTER_STAGGER_MS = 25;           // Delay between letters within a word
export const LETTER_FADE_DURATION_MS = 150;    // Duration of each letter's fade-in
export const MAX_TIER2_SENTENCES = 3;          // Cap on tier 2 sentence count
export const MAX_TIER3_SENTENCES = 4;          // Cap on tier 3 sentence count

// ─── Pipeline Constants ─────────────────────────────────────────────
export const SPHERE_AURA_THRESHOLD = 0.3;      // Minimum sphere influence to trigger aura text
export const MAX_LOCATION_SPOTLIGHTS = 2;      // Max locations mentioned in tier 2

// ─── Temperature/Moisture Bands ─────────────────────────────────────
export type TemperatureBand = 'frigid' | 'cold' | 'temperate' | 'warm' | 'scorching';
export type MoistureBand = 'arid' | 'dry' | 'moderate' | 'damp' | 'saturated';
export type PopulationBand = 'empty' | 'sparse' | 'moderate' | 'bustling';
export type CompassDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';

/** Band breakpoints for GeoParams (0.0–1.0) → 5 bands */
export const TEMPERATURE_THRESHOLDS: number[] = [0.2, 0.4, 0.6, 0.8]; // <0.2=frigid, etc.
export const MOISTURE_THRESHOLDS: number[] = [0.2, 0.4, 0.6, 0.8];

/** Population count → band */
export const POPULATION_THRESHOLDS = { sparse: 1, moderate: 3, bustling: 6 };

// ─── Output Types ───────────────────────────────────────────────────

/** The complete vignette output for a hex. */
export interface HexVignette {
  tier1: string;           // Always-shown sentence (terrain + climate)
  tier2: string[];         // Word-revealed sentences (population + locations)
  tier3: string[];         // Hex zoom only (culture, spheres, factions, encounters)
  clickTarget: HexCoord;   // The hex to navigate to on click
}

/** Visibility voice transforms applied after stage generation. */
export interface VisibilityTransforms {
  wrapTier1: (sentence: string) => string;
  wrapTier2: (sentence: string) => string;
  wrapTier3: (sentence: string) => string;
}
