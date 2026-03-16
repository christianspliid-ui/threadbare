// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getAttachmentGlyph, SUBCATEGORY_GLYPHS, FALLBACK_GLYPH } from '../attachmentGlyphs';

describe('getAttachmentGlyph', () => {
  it('returns correct glyph for each possession subcategory', () => {
    expect(getAttachmentGlyph('arms')).toBe('\u2694');
    expect(getAttachmentGlyph('mounts_beasts')).toBe('\u25C8');
    expect(getAttachmentGlyph('vestments')).toBe('\u25C7');
    expect(getAttachmentGlyph('relics_talismans')).toBe('\u25C6');
    expect(getAttachmentGlyph('tools_instruments')).toBe('\u2692');
    expect(getAttachmentGlyph('provisions')).toBe('\u2295');
  });

  it('returns correct glyph for condition subcategories', () => {
    expect(getAttachmentGlyph('wound')).toBe('\u2715');
    expect(getAttachmentGlyph('blessing')).toBe('\u2726');
    expect(getAttachmentGlyph('curse')).toBe('\u2298');
    expect(getAttachmentGlyph('disease')).toBe('\u2620');
  });

  it('returns correct glyph for other categories', () => {
    expect(getAttachmentGlyph('bestowed_power')).toBe('\u27E1');
    expect(getAttachmentGlyph('pact')).toBe('\u260D');
    expect(getAttachmentGlyph('debt')).toBe('\u2696');
    expect(getAttachmentGlyph('retainer')).toBe('\u265F');
  });

  it('returns fallback glyph for unknown subcategory', () => {
    expect(getAttachmentGlyph('unknown_thing')).toBe(FALLBACK_GLYPH);
    expect(getAttachmentGlyph('')).toBe(FALLBACK_GLYPH);
  });

  it('SUBCATEGORY_GLYPHS has no undefined values', () => {
    for (const [key, value] of Object.entries(SUBCATEGORY_GLYPHS)) {
      expect(value, `glyph for ${key}`).toBeTruthy();
    }
  });
});
