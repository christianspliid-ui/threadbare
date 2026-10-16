/**
 * Attachment subcategory glyph lookup table.
 *
 * Unicode glyphs for each attachment subcategory, following the existing
 * glyph lookup pattern (ALERT_GLYPHS, SUBTYPE_GLYPHS, etc.).
 * Readable at --text-xs (16px).
 */

// ─── Subcategory Glyphs ───────────────────────────────────────────

const SUBCATEGORY_GLYPHS: Record<string, string> = {
  // Possessions (7)
  arms: '\u2694',              // ⚔ Crossed swords
  mounts_beasts: '\u25C8',    // ◈ Diamond with inner dot (simpler silhouette)
  vestments: '\u25C7',        // ◇ White diamond
  tomes_scrolls: '\uD83D\uDCDC', // 📜 Scroll
  relics_talismans: '\u25C6', // ◆ Filled diamond
  tools_instruments: '\u2692', // ⚒ Hammer and pick
  provisions: '\u2295',       // ⊕ Circled plus

  // Conditions (4)
  wound: '\u2715',            // ✕ Multiplication X
  injury: '\u2715',           // ✕ Multiplication X (alias)
  disease: '\u2620',          // ☠ Skull and crossbones
  poison: '\u2620',           // ☠ Skull and crossbones (alias)
  blessing: '\u2726',         // ✦ Four-pointed star
  curse: '\u2298',            // ⊘ Circled division slash

  // Other categories
  bestowed_power: '\u27E1',   // ⟡ White concave-sided diamond
  innate_power: '✵',     // ✵ Eight-pointed pinwheel star (THR-1671)
  pact: '\u260D',             // ☍ Opposition
  oath: '\u260D',             // ☍ Opposition (alias)
  debt: '\u2696',             // ⚖ Scales
  favour: '\u2696',           // ⚖ Scales (alias)
  treaty: '\u260D',           // ☍ Opposition (alias)
  bargain: '\u2696',          // ⚖ Scales (alias)
  retainer: '\u265F',         // Chess pawn
  companion: '\u265F',         // ♟ Chess pawn

  // Holdings (THR-1297) — a place the bearer owns. Without a row here it fell to
  // the generic ◈ fallback, which reads as "unclassified item" in a section whose
  // whole point is that a town is not a trinket (Law 1: every concept carries its
  // presentation).
  holding: '⌂',          // ⌂ House

  // Spells
  spell: '\u2728',            // ✨ Sparkles
};

/** Fallback glyph when subcategory has no mapping */
const FALLBACK_GLYPH = '\u25C8'; // ◈ Diamond with inner dot

/**
 * Look up the display glyph for an attachment subcategory.
 * Returns the fallback glyph (◈) for unknown subcategories.
 */
export function getAttachmentGlyph(subcategory: string): string {
  return SUBCATEGORY_GLYPHS[subcategory] ?? FALLBACK_GLYPH;
}

export { SUBCATEGORY_GLYPHS, FALLBACK_GLYPH };
