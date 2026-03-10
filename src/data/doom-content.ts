/**
 * Doom Content Package — Stage names and thresholds for the doom clock.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit the JSON files in src/data/doom/ to change
 * doom archetype names, stage progression, escalation thresholds,
 * and vocabulary banks. This file is a thin re-export layer.
 * ═══════════════════════════════════════════════════════════════════
 *
 * JSON content files:
 *   src/data/doom/breach.json        — 7 archetype files with stage
 *   src/data/doom/convergence.json     names and thresholds
 *   src/data/doom/changing.json
 *   src/data/doom/sundering.json
 *   src/data/doom/failing.json
 *   src/data/doom/ascension.json
 *   src/data/doom/reckoning.json
 *   src/data/doom/vocabulary.json    — darkening word banks
 */

import { loadArchetypeStageNames, loadDefaultThresholds, loadDoomVocabulary } from './doom-loader';
import type { DoomVocabularyEntry } from './doom-loader';

/** Re-export the DoomVocabulary interface for consumers */
export type DoomVocabulary = DoomVocabularyEntry;

/** Default stage thresholds (fraction of total ticks). Loaded from JSON. */
export const DEFAULT_THRESHOLDS = loadDefaultThresholds();

/** Archetype-specific stage names. Loaded and validated from JSON files. */
export const ARCHETYPE_STAGE_NAMES = loadArchetypeStageNames();

/** Doom stage vocabulary — darkening word banks from whispers to unmaking. Loaded from JSON. */
export const DOOM_VOCABULARY: Record<string, DoomVocabulary> = loadDoomVocabulary();
