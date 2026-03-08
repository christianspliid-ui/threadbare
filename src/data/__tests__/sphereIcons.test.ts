import { describe, it, expect } from 'vitest';
import {
  SPHERE_ICONS,
  FOUNDATION_SPHERE_ICONS,
  WHEEL_SLOT_GLYPHS,
  getSphereColor,
  getSphereSymbol,
  getWheelSlotGlyph,
  type SphereIconDef,
} from '../sphereIcons';

describe('sphereIcons data', () => {
  describe('SPHERE_ICONS', () => {
    it('exports all 8 creation spheres', () => {
      const expected = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
      expected.forEach((sphere) => {
        expect(SPHERE_ICONS[sphere as keyof typeof SPHERE_ICONS]).toBeDefined();
      });
    });

    it('each sphere has color, symbol, and formLanguage', () => {
      Object.values(SPHERE_ICONS).forEach((def: SphereIconDef) => {
        expect(def.color).toBeDefined();
        expect(def.symbol).toBeDefined();
        expect(def.formLanguage).toBeDefined();
        expect(typeof def.color).toBe('string');
        expect(typeof def.symbol).toBe('string');
        expect(typeof def.formLanguage).toBe('string');
      });
    });

    it('colors are valid hex strings', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      Object.values(SPHERE_ICONS).forEach((def) => {
        expect(hexRegex.test(def.color)).toBe(true);
      });
    });

    it('symbols are Unicode geometric characters (non-emoji)', () => {
      const symbols = Object.values(SPHERE_ICONS).map((def) => def.symbol);
      // Check that symbols are single characters and don't contain emoji flags
      symbols.forEach((symbol) => {
        expect(symbol.length).toBe(1);
        // Emoji typically use specific Unicode ranges; geometric symbols don't
        expect(/\uFE0F|\uD83D|\uD83C/.test(symbol)).toBe(false);
      });
    });

    it('force sphere has correct definition', () => {
      const force = SPHERE_ICONS.force;
      expect(force.color).toBe('#ff6b6b');
      expect(force.symbol).toBe('✦');
      expect(force.formLanguage).toContain('directional');
    });

    it('matter sphere uses hexagon symbol', () => {
      const matter = SPHERE_ICONS.matter;
      expect(matter.symbol).toBe('⬡');
    });

    it('energy sphere has radiant symbol', () => {
      const energy = SPHERE_ICONS.energy;
      expect(energy.symbol).toBe('⊙');
    });

    it('life sphere has organic symbol', () => {
      const life = SPHERE_ICONS.life;
      expect(life.symbol).toBe('∿');
    });

    it('mind sphere has neural symbol', () => {
      const mind = SPHERE_ICONS.mind;
      expect(mind.symbol).toBe('◉');
    });

    it('spirit sphere has ethereal symbol', () => {
      const spirit = SPHERE_ICONS.spirit;
      expect(spirit.symbol).toBe('⟡');
    });

    it('time sphere has ripple symbol', () => {
      const time = SPHERE_ICONS.time;
      expect(time.symbol).toBe('◈');
    });

    it('entropy sphere has fractured symbol', () => {
      const entropy = SPHERE_ICONS.entropy;
      expect(entropy.symbol).toBe('◆');
    });
  });

  describe('FOUNDATION_SPHERE_ICONS', () => {
    it('exports all 4 foundation spheres', () => {
      const expected = ['chaos', 'order', 'light', 'darkness'];
      expected.forEach((sphere) => {
        expect(FOUNDATION_SPHERE_ICONS[sphere as keyof typeof FOUNDATION_SPHERE_ICONS]).toBeDefined();
      });
    });

    it('each foundation sphere has valid definition', () => {
      Object.values(FOUNDATION_SPHERE_ICONS).forEach((def) => {
        expect(def.color).toBeDefined();
        expect(def.symbol).toBeDefined();
        expect(def.formLanguage).toBeDefined();
      });
    });

    it('colors are valid hex strings', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      Object.values(FOUNDATION_SPHERE_ICONS).forEach((def) => {
        expect(hexRegex.test(def.color)).toBe(true);
      });
    });
  });

  describe('WHEEL_SLOT_GLYPHS', () => {
    it('exports glyphs for all main slot types', () => {
      const expected = ['scry', 'dream', 'persuade', 'deceive', 'intimidate', 'inspire', 'coincidence', 'omen', 'afflict_bless'];
      expected.forEach((slot) => {
        expect(WHEEL_SLOT_GLYPHS[slot]).toBeDefined();
      });
    });

    it('each glyph is a single non-emoji Unicode character', () => {
      Object.values(WHEEL_SLOT_GLYPHS).forEach((glyph) => {
        expect(glyph.length).toBeLessThanOrEqual(1); // May be 0 or 1 char
        if (glyph.length > 0) {
          expect(/\uFE0F|\uD83D|\uD83C/.test(glyph)).toBe(false);
        }
      });
    });

    it('scry slot uses observation glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.scry).toBe('●');
    });

    it('dream slot uses vision glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.dream).toBe('◇');
    });

    it('persuade slot uses influence glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.persuade).toBe('◆');
    });

    it('deceive slot uses illusion glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.deceive).toBe('≋');
    });

    it('intimidate slot uses threat glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.intimidate).toBe('⚔');
    });

    it('inspire slot uses uplift glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.inspire).toBe('⬆');
    });

    it('coincidence slot uses fate glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.coincidence).toBe('⊙');
    });

    it('omen slot uses mystical glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.omen).toBe('⬟');
    });

    it('afflict_bless slot uses magic glyph', () => {
      expect(WHEEL_SLOT_GLYPHS.afflict_bless).toBe('★');
    });
  });

  describe('getSphereColor', () => {
    it('returns color for creation spheres', () => {
      expect(getSphereColor('force')).toBe('#ff6b6b');
      expect(getSphereColor('mind')).toBe('#44aaff');
    });

    it('returns color for foundation spheres', () => {
      expect(getSphereColor('chaos')).toBeDefined();
      expect(getSphereColor('order')).toBeDefined();
      expect(getSphereColor('light')).toBeDefined();
      expect(getSphereColor('darkness')).toBeDefined();
    });

    it('returns fallback for unknown sphere', () => {
      expect(getSphereColor('unknown-sphere')).toBe('#d4a574');
    });

    it('all returned colors are valid hex', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      ['force', 'mind', 'chaos', 'order', 'unknown'].forEach((sphere) => {
        const color = getSphereColor(sphere);
        expect(hexRegex.test(color)).toBe(true);
      });
    });
  });

  describe('getSphereSymbol', () => {
    it('returns symbol for creation spheres', () => {
      expect(getSphereSymbol('force')).toBe('✦');
      expect(getSphereSymbol('mind')).toBe('◉');
    });

    it('returns symbol for foundation spheres', () => {
      expect(getSphereSymbol('chaos')).toBeDefined();
      expect(getSphereSymbol('order')).toBeDefined();
    });

    it('returns fallback for unknown sphere', () => {
      expect(getSphereSymbol('unknown-sphere')).toBe('●');
    });

    it('all returned symbols are single characters', () => {
      ['force', 'mind', 'chaos', 'unknown'].forEach((sphere) => {
        const symbol = getSphereSymbol(sphere);
        expect(symbol.length).toBe(1);
      });
    });
  });

  describe('getWheelSlotGlyph', () => {
    it('returns glyph for known slot IDs', () => {
      expect(getWheelSlotGlyph('scry')).toBe('●');
      expect(getWheelSlotGlyph('dream')).toBe('◇');
    });

    it('returns fallback for unknown slot IDs', () => {
      expect(getWheelSlotGlyph('unknown-slot')).toBe('◯');
    });

    it('all returned glyphs are single characters', () => {
      ['scry', 'dream', 'unknown'].forEach((slot) => {
        const glyph = getWheelSlotGlyph(slot);
        expect(glyph.length).toBe(1);
      });
    });
  });
});
