/**
 * Mandate Content Package — All data-driven content for the divine mandate system.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit the JSON files in src/data/mandates/ to change
 * mandate templates, conditions, and sphere affinities. This file is a
 * thin re-export layer — do not add content definitions here.
 * ═══════════════════════════════════════════════════════════════════
 *
 * JSON content files:
 *   src/data/mandates/dominion-of-stone.json
 *   src/data/mandates/builders-legacy.json
 *   src/data/mandates/web-of-allegiance.json
 *   src/data/mandates/tide-of-life.json
 *   src/data/mandates/entropic-cascade.json
 *   src/data/mandates/illumination.json
 *   src/data/mandates/ascendants-champion.json
 *   src/data/mandates/devoted-circle.json
 *   src/data/mandates/shadow-sovereign.json
 *   src/data/mandates/threads-of-fate.json
 *   src/data/mandates/the-gathering.json
 *   src/data/mandates/cultural-convergence.json
 */

// Re-export the MandateTemplate type so consumers keep working
export type { MandateTemplate } from './mandate-loader';

// Load, validate, and cache templates + prose from JSON files
import { loadMandateTemplates, loadMandateMilestoneProse } from './mandate-loader';

/**
 * Complete library of 12 mandate templates.
 * Loaded from JSON files at module init, validated at load time.
 */
export const MANDATE_TEMPLATES = loadMandateTemplates();

/**
 * Milestone prose entries for mandate stage transitions.
 * Keys follow the pattern: {mandate_id}.{transition}
 * Loaded from the prose sections co-located in each mandate JSON file.
 */
export const MANDATE_MILESTONE_PROSE: Record<string, string> = loadMandateMilestoneProse();
