/**
 * Artifact Category Art Registry (THR-638, artifact batch) — the plate that
 * represents a possession when it has no bespoke art of its own.
 *
 * **Why category art rather than per-item art.** A seeded medium world holds
 * ~143 artifact nodes by tick 60 and exactly 7 of them have a painted plate in
 * `item-art-registry.ts`. Painting the rest is unbounded: the reward catalog
 * mints items procedurally, so per-item coverage can never close. Every
 * possession does, however, carry a `subcategory` — and all 7 canonical
 * `PossessionSubcategory` values are populated in a live world (arms 31,
 * relics_talismans 24, tools_instruments 22, mounts_beasts 19, provisions 18,
 * tomes_scrolls 14, vestments 9). Seven plates therefore cover ~96% of what a
 * player can actually open, and the count does not rot as content grows.
 *
 * Unlike the faction batch, there was no existing generator to activate: the
 * repo has no procedural item-art path (`attachmentGlyphs.ts` supplies text
 * glyphs, not art), and the 7 painted plates already follow STYLE.md's
 * "Attachment (catalog)" spec — 16:9, items-in-action, Remembrance-style clean
 * digital painting. The category plates match that spec and recipe (1376×768
 * JPG q95) so they sit beside the bespoke art without a visible seam.
 *
 * Each plate carries one reach tint so the categories separate at a glance
 * (see `CATEGORY_REACH_TINT` — documentation of what was painted, not a runtime
 * input). Category art is deliberately sphere-agnostic: one plate stands for
 * every item in its category regardless of the item's own sphere, so the magic
 * is restrained and the tint is per-category, not per-item.
 *
 * `getAttachmentArtUrl` is the **single** entry point for "what image
 * represents this possession?" — bespoke plate first, category plate second,
 * null last. `resolveEntityVisual`, the agent Attachments tab, and the Codex
 * all route through it, so the three surfaces cannot drift apart the way two
 * parallel art maps do.
 *
 * NFP #1 (tunability): adding a category means one row here plus one file.
 * NFP #3 (determinism): pure lookup — same id ⇒ same path, every call.
 * NFP #4 (fail-soft): unknown or absent subcategory returns null, and the
 *   caller renders its designed fallback. Never throws.
 */

import type { PossessionSubcategory } from '../types/attachments';
import { POSSESSION_SUBCATEGORIES } from '../types/attachments';
import { getItemArt } from './item-art-registry';

/** Directory holding the category plates. */
const CATEGORY_ART_DIR = '/assets/items/categories';

/**
 * One plate per canonical `PossessionSubcategory`. Exhaustive by type — adding
 * a subcategory to the union makes this object fail to compile until a plate
 * is registered, which is the point.
 */
export const ARTIFACT_CATEGORY_ART: Record<PossessionSubcategory, string> = {
  arms: `${CATEGORY_ART_DIR}/arms.jpg`,
  mounts_beasts: `${CATEGORY_ART_DIR}/mounts-beasts.jpg`,
  vestments: `${CATEGORY_ART_DIR}/vestments.jpg`,
  tomes_scrolls: `${CATEGORY_ART_DIR}/tomes-scrolls.jpg`,
  relics_talismans: `${CATEGORY_ART_DIR}/relics-talismans.jpg`,
  tools_instruments: `${CATEGORY_ART_DIR}/tools-instruments.jpg`,
  provisions: `${CATEGORY_ART_DIR}/provisions.jpg`,
};

/**
 * Reach tint painted into each plate, for art-direction continuity when a
 * plate is regenerated. Documentation only — nothing reads this at runtime.
 * Colours are the STYLE.md sphere/reach hexes.
 */
export const CATEGORY_REACH_TINT: Record<PossessionSubcategory, string> = {
  arms: '#ff4444',              // Force — sharp directional streaks
  mounts_beasts: '#00cc55',     // Life — organic branching
  vestments: '#4a3a8a',         // Darkness — absorbing voids with rim-glow
  tomes_scrolls: '#ffd700',     // Energy/Eye — radiating spikes
  relics_talismans: '#aa44dd',  // Spirit — ascending wisps
  tools_instruments: '#8b6b4a', // Matter — crystalline lattices
  provisions: '#ff9933',        // Time — concentric ripples
};

/**
 * Off-taxonomy `subcategory` values that live content actually writes, mapped
 * to the canonical value whose plate fits.
 *
 * These are real: `reward-attachment-catalog.ts` and one branching encounter
 * write `intelligence`, `talisman` and `charm`, none of which are members of
 * `PossessionSubcategory`. They survive because the catalog entries are not
 * checked against the union, so the strays are invisible to the type system and
 * would otherwise be invisible to this registry too — 5 nodes rendering blank
 * for a reason no one could see from here.
 *
 * Aliasing rather than rewriting the content is deliberate: the raw field stays
 * exactly as authored, so nothing that reads `subcategory` for slotting or
 * scoring changes behavior. Reconciling the vocabulary itself is THR-857.
 */
export const SUBCATEGORY_ART_ALIASES: Record<string, PossessionSubcategory> = {
  talisman: 'relics_talismans',
  charm: 'relics_talismans',
  intelligence: 'tomes_scrolls',
};

/** True when `value` is a canonical `PossessionSubcategory`. */
function isCanonicalSubcategory(value: string): value is PossessionSubcategory {
  return (POSSESSION_SUBCATEGORIES as string[]).includes(value);
}

/**
 * Resolve the category plate for a subcategory, following the alias map.
 * Returns null for an absent or unrecognised subcategory.
 */
export function getArtifactCategoryArtUrl(
  subcategory: string | null | undefined,
): string | null {
  if (typeof subcategory !== 'string' || subcategory === '') return null;
  if (isCanonicalSubcategory(subcategory)) return ARTIFACT_CATEGORY_ART[subcategory];
  const aliased = SUBCATEGORY_ART_ALIASES[subcategory];
  return aliased ? ARTIFACT_CATEGORY_ART[aliased] : null;
}

/**
 * The single answer to "what image represents this possession?".
 *
 * Tiers, in order:
 *   1. bespoke plate for this exact item (`item-art-registry`, template or
 *      instance id),
 *   2. category plate for its subcategory,
 *   3. null — caller renders its own fallback (glyph tile / no image).
 *
 * @param id           attachment template id or instance id
 * @param subcategory  the item's `subcategory` property, if known
 */
export function getAttachmentArtUrl(
  id: string | null | undefined,
  subcategory?: string | null,
): string | null {
  if (typeof id === 'string' && id !== '') {
    const bespoke = getItemArt(id);
    if (bespoke) return bespoke;
  }
  return getArtifactCategoryArtUrl(subcategory);
}
