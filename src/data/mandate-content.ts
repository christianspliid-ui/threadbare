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

// Load, validate, and cache templates from JSON files
import { loadMandateTemplates } from './mandate-loader';
import { REMEMBRANCE_MILESTONE_PROSE } from './mandate-remembrance-prose';

/**
 * Complete library of 12 mandate templates.
 * Loaded from JSON files at module init, validated at load time.
 *
 * These are a **catalogue**, not a source of live mandates (THR-1198): the run's
 * spine is what the god remembers, so every live mandate is minted by
 * `generateRememberedMandate` and no code path instantiates a template. They are
 * read by the CMS browser (`?view=cms`) and the `mandate.*` tooltip resolver.
 */
export const MANDATE_TEMPLATES = loadMandateTemplates();

/**
 * Milestone prose entries for mandate stage transitions.
 * Keys follow the pattern `{mandate_id}.{transition}`, the id without its
 * `mandate.` namespace.
 *
 * Authored against the two remembrance id shapes a live game actually mints
 * (THR-1198). The template JSONs carried a co-located `prose` block until that
 * ticket; it was retired with `generateMandate` rather than left as data with no
 * reader, because a template's prose describes that template's own region-count
 * conditions and could not be re-keyed onto a sphere-delta mandate without being
 * rewritten.
 */
export const MANDATE_MILESTONE_PROSE: Record<string, string> = REMEMBRANCE_MILESTONE_PROSE;
