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
  pact: '\u260D',             // ☍ Opposition
  oath: '\u260D',             // ☍ Opposition (alias)
  debt: '\u2696',             // ⚖ Scales
  favour: '\u2696',           // ⚖ Scales (alias)
  treaty: '\u260D',           // ☍ Opposition (alias)
  bargain: '\u2696',          // ⚖ Scales (alias)
  retainer: '\u265F',         // ♟ Chess pawn

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

// ─── Effect Type Glyphs ──────────────────────────────────────────

const EFFECT_TYPE_GLYPHS: Record<string, string> = {
  passive: '\u2795',           // ➕ Plus (always-on bonus)
  consumable_charge: '\u26A1', // ⚡ Lightning bolt (limited uses)
  duration: '\u23F3',          // ⏳ Hourglass (temporary)
  permanent: '\u221E',         // ∞ Infinity
  cooldown: '\u21BA',          // ↺ Cycle
  conditional: '\u2753',       // ❓ Question mark (context-dependent)
  trait_grant: '\u2606',       // ☆ Star outline (capability unlock)
  transform: '\u21C4',         // ⇄ Arrows (evolution)
  stacking: '\u25B2',          // ▲ Triangle up (accumulating)
  aura: '\u25CE',              // ◎ Bullseye (proximity)
  reactive: '\u21A9',          // ↩ Return arrow (counter)
  decay: '\u25BD',             // ▽ Triangle down (weakening)
  tradeoff: '\u2696',          // ⚖ Scales (cost/benefit)
  until_event: '\u23F0',       // ⏰ Alarm clock (event-based)
  teleport: '\u2727',          // ✧ Sparkle (movement)
  forced_move: '\u27A1',       // ➡ Arrow right (push)
  reveal: '\u1F441',           // 👁 Eye (scry)
  spawn: '\u2728',             // ✨ Sparkles (summon)
  dispel: '\u2718',            // ✘ Cross (negate)
  suppress: '\u23F8',          // ⏸ Pause (suppress)
  auto_succeed: '\u2714',      // ✔ Check (auto-win)
  reroll: '\u1F3B2',           // 🎲 Die (reroll)
  swap_reach: '\u21C5',        // ⇅ Up-down arrows (swap)
  outcome_shift: '\u2B06',     // ⬆ Up arrow (improve)
  alter_terrain: '\u26F0',     // ⛰ Mountain (terrain)
  create_barrier: '\u2588',    // █ Block (barrier)
  transfer: '\u21C6',          // ⇆ Left-right arrows (move between)
  haste: '\u23E9',             // ⏩ Fast forward
  slow: '\u23EA',              // ⏪ Rewind
  freeze_duration: '\u2744',   // ❄ Snowflake (freeze)
  compel: '\u1F9FF',           // 🧿 Eye (mind control)
  create_structure: '\u1F3D7', // 🏗 Crane (build)
  destroy_structure: '\u1F4A5', // 💥 Explosion (destroy)
  modify_rules: '\u2699',     // ⚙ Gear (change rules)
  faction_manipulate: '\u1F451', // 👑 Crown (faction power)
  cascade: '\u1F30A',          // 🌊 Wave (ripple effects)
};

const EFFECT_FALLBACK_GLYPH = '\u2B24'; // ⬤ Circle

/**
 * Look up the display glyph for an effect type.
 */
export function getEffectTypeGlyph(effectType: string): string {
  return EFFECT_TYPE_GLYPHS[effectType] ?? EFFECT_FALLBACK_GLYPH;
}

export { SUBCATEGORY_GLYPHS, FALLBACK_GLYPH, EFFECT_TYPE_GLYPHS };
