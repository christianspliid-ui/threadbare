import { describe, it, expect } from 'vitest';
import { alertBarTestHelpers } from '../AlertBar';

describe('AlertBar helpers', () => {
  it('maps alert icons to unicode glyphs', () => {
    expect(alertBarTestHelpers.getGlyph('death')).toBeTruthy();
    expect(alertBarTestHelpers.getGlyph('doom')).toBeTruthy();
    expect(alertBarTestHelpers.getGlyph('mandate')).toBeTruthy();
    expect(alertBarTestHelpers.getGlyph('birth')).toBeTruthy();
    expect(alertBarTestHelpers.getGlyph('discovery')).toBeTruthy();
    expect(alertBarTestHelpers.getGlyph('rival')).toBeTruthy();
    expect(alertBarTestHelpers.getGlyph('dilemma')).toBeTruthy();
    expect(alertBarTestHelpers.getGlyph('harvest')).toBeTruthy();
  });

  it('returns a fallback glyph for unknown icons', () => {
    expect(alertBarTestHelpers.getGlyph('unknown' as any)).toBeTruthy();
  });
});
