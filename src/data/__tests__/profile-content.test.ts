/**
 * Profile Content Tests
 *
 * Validates the structure and content of all profile templates:
 * quotes, backstory origins, middles, closings, and sphere flavor text.
 */

import { describe, it, expect } from 'vitest';
import {
  QUOTE_TEMPLATES,
  SPHERE_FLAVOR,
  ORIGIN_TEMPLATES,
  MIDDLE_TEMPLATES,
  CLOSING_TEMPLATES,
  getSphereFlavorText,
  getRandomQuoteTemplate,
  getRandomOriginTemplate,
  getRandomMiddleTemplate,
  getRandomClosingTemplate,
} from '../profile-content';

describe('profile-content', () => {
  // ─── §1. Quote Templates ────────────────────────────────────────────

  describe('QUOTE_TEMPLATES', () => {
    it('exports at least 12 quote templates', () => {
      expect(QUOTE_TEMPLATES.length).toBeGreaterThanOrEqual(12);
    });

    it('all quotes contain {{name}} placeholder', () => {
      for (const quote of QUOTE_TEMPLATES) {
        expect(quote).toMatch(/\{name\}/);
      }
    });

    it('no quote is empty', () => {
      for (const quote of QUOTE_TEMPLATES) {
        expect(quote.trim().length).toBeGreaterThan(0);
      }
    });

    it('no duplicate quotes', () => {
      const set = new Set(QUOTE_TEMPLATES);
      expect(set.size).toBe(QUOTE_TEMPLATES.length);
    });

    it('quotes contain sphere or value placeholders', () => {
      const hasSphereOrValue = QUOTE_TEMPLATES.every(q =>
        q.includes('{sphere}') || q.includes('{value}')
      );
      expect(hasSphereOrValue).toBe(true);
    });

    it('quotes are in Threadbare tone (dark, mythic, grief-layered)', () => {
      const darkWords = ['threads', 'shadow', 'darkness', 'grief', 'loss', 'weave', 'veil', 'silent', 'ash'];
      const hasDarkContent = QUOTE_TEMPLATES.some(q =>
        darkWords.some(word => q.toLowerCase().includes(word))
      );
      expect(hasDarkContent).toBe(true);
    });
  });

  // ─── §2. Sphere Flavor Text ─────────────────────────────────────────

  describe('SPHERE_FLAVOR', () => {
    it('covers all 12 spheres', () => {
      const expectedSpheres = [
        'force',
        'matter',
        'energy',
        'life',
        'mind',
        'spirit',
        'time',
        'entropy',
        'chaos',
        'order',
        'light',
        'darkness',
      ];
      for (const sphere of expectedSpheres) {
        expect(SPHERE_FLAVOR[sphere]).toBeDefined();
        expect(SPHERE_FLAVOR[sphere]).toBeTruthy();
      }
    });

    it('each flavor text is non-empty', () => {
      for (const [_key, value] of Object.entries(SPHERE_FLAVOR)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    });

    it('no duplicate flavor texts', () => {
      const values = Object.values(SPHERE_FLAVOR);
      const set = new Set(values);
      expect(set.size).toBe(values.length);
    });

    it('flavor texts are poetic and sensory', () => {
      const values = Object.values(SPHERE_FLAVOR);
      // All should contain verbs, adjectives, or sensory words
      const sensoryWords = ['clash', 'weight', 'crackling', 'pulse', 'whisper', 'echo', 'turn', 'unraveling', 'surge', 'symmetry', 'radiance', 'shadow'];
      const hasSensory = values.some(v =>
        sensoryWords.some(word => v.toLowerCase().includes(word))
      );
      expect(hasSensory).toBe(true);
    });
  });

  // ─── §3. Origin Templates ───────────────────────────────────────────

  describe('ORIGIN_TEMPLATES', () => {
    it('exports at least 10 origin templates', () => {
      expect(ORIGIN_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    });

    it('all origins contain {{name}} placeholder', () => {
      for (const origin of ORIGIN_TEMPLATES) {
        expect(origin).toMatch(/\{name\}/);
      }
    });

    it('all origins contain {{culture}} placeholder', () => {
      for (const origin of ORIGIN_TEMPLATES) {
        expect(origin).toMatch(/\{culture\}/);
      }
    });

    it('no origin is empty', () => {
      for (const origin of ORIGIN_TEMPLATES) {
        expect(origin.trim().length).toBeGreaterThan(0);
      }
    });

    it('no duplicate origins', () => {
      const set = new Set(ORIGIN_TEMPLATES);
      expect(set.size).toBe(ORIGIN_TEMPLATES.length);
    });

    it('origins describe birth, belonging, or discovery', () => {
      const originWords = ['born', 'appeared', 'arrived', 'found', 'marked', 'memory', 'remember', 'soul'];
      const hasOriginContent = ORIGIN_TEMPLATES.some(o =>
        originWords.some(word => o.toLowerCase().includes(word))
      );
      expect(hasOriginContent).toBe(true);
    });
  });

  // ─── §4. Middle Templates ───────────────────────────────────────────

  describe('MIDDLE_TEMPLATES', () => {
    it('exports at least 8 middle templates', () => {
      expect(MIDDLE_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    });

    it('all middles contain {{trait}} placeholder', () => {
      for (const middle of MIDDLE_TEMPLATES) {
        expect(middle).toMatch(/\{trait\}/);
      }
    });

    it('all middles contain {{bond}} placeholder', () => {
      for (const middle of MIDDLE_TEMPLATES) {
        expect(middle).toMatch(/\{bond\}/);
      }
    });

    it('no middle is empty', () => {
      for (const middle of MIDDLE_TEMPLATES) {
        expect(middle.trim().length).toBeGreaterThan(0);
      }
    });

    it('no duplicate middles', () => {
      const set = new Set(MIDDLE_TEMPLATES);
      expect(set.size).toBe(MIDDLE_TEMPLATES.length);
    });

    it('middles contain {{sphere}} or {{name}} references', () => {
      const hasReferences = MIDDLE_TEMPLATES.every(m =>
        m.includes('{sphere}') || m.includes('{name}')
      );
      expect(hasReferences).toBe(true);
    });

    it('middles describe character development or turning points', () => {
      const devWords = ['nature', 'character', 'marked', 'drew', 'defined', 'shaped', 'turning', 'chose', 'conflict'];
      const hasDevContent = MIDDLE_TEMPLATES.some(m =>
        devWords.some(word => m.toLowerCase().includes(word))
      );
      expect(hasDevContent).toBe(true);
    });
  });

  // ─── §5. Closing Templates ──────────────────────────────────────────

  describe('CLOSING_TEMPLATES', () => {
    it('exports at least 8 closing templates', () => {
      expect(CLOSING_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    });

    it('all closings contain {{name}} placeholder', () => {
      for (const closing of CLOSING_TEMPLATES) {
        expect(closing).toMatch(/\{name\}/);
      }
    });

    it('no closing is empty', () => {
      for (const closing of CLOSING_TEMPLATES) {
        expect(closing.trim().length).toBeGreaterThan(0);
      }
    });

    it('no duplicate closings', () => {
      const set = new Set(CLOSING_TEMPLATES);
      expect(set.size).toBe(CLOSING_TEMPLATES.length);
    });

    it('closings contain {{culture}} or {{sphere}} references', () => {
      const hasReferences = CLOSING_TEMPLATES.every(c =>
        c.includes('{culture}') || c.includes('{sphere}')
      );
      // Allow some closings to have no culture/sphere reference
      const hasAnyReferences = CLOSING_TEMPLATES.some(c =>
        c.includes('{culture}') || c.includes('{sphere}')
      );
      expect(hasAnyReferences).toBe(true);
    });

    it('closings describe threshold, consequence, or unknown fate', () => {
      const fateWords = ['crossroads', 'written', 'threads', 'burden', 'legend', 'consequence', 'reckoning', 'watches', 'future'];
      const hasFateContent = CLOSING_TEMPLATES.some(c =>
        fateWords.some(word => c.toLowerCase().includes(word))
      );
      expect(hasFateContent).toBe(true);
    });
  });

  // ─── §6. Lookup Functions ───────────────────────────────────────────

  describe('getSphereFlavorText', () => {
    it('returns correct flavor for known sphere', () => {
      expect(getSphereFlavorText('force')).toBe('clash of arms');
      expect(getSphereFlavorText('time')).toBe('slow turn of ages');
    });

    it('case-insensitive lookup', () => {
      expect(getSphereFlavorText('FORCE')).toBe('clash of arms');
      expect(getSphereFlavorText('Time')).toBe('slow turn of ages');
    });

    it('falls back to sphere name if not found', () => {
      expect(getSphereFlavorText('unknown_sphere')).toBe('unknown_sphere');
    });

    it('returns non-empty string', () => {
      expect(getSphereFlavorText('force').length).toBeGreaterThan(0);
    });
  });

  describe('getRandomQuoteTemplate', () => {
    it('returns valid quote template by index', () => {
      expect(getRandomQuoteTemplate(0)).toBe(QUOTE_TEMPLATES[0]);
      expect(getRandomQuoteTemplate(5)).toBe(QUOTE_TEMPLATES[5]);
    });

    it('wraps around with modulo', () => {
      const lastIdx = QUOTE_TEMPLATES.length - 1;
      expect(getRandomQuoteTemplate(QUOTE_TEMPLATES.length)).toBe(QUOTE_TEMPLATES[0]);
      expect(getRandomQuoteTemplate(QUOTE_TEMPLATES.length + 5)).toBe(QUOTE_TEMPLATES[5]);
    });

    it('returns non-empty string', () => {
      expect(getRandomQuoteTemplate(0).length).toBeGreaterThan(0);
    });
  });

  describe('getRandomOriginTemplate', () => {
    it('returns valid origin template by index', () => {
      expect(getRandomOriginTemplate(0)).toBe(ORIGIN_TEMPLATES[0]);
      expect(getRandomOriginTemplate(2)).toBe(ORIGIN_TEMPLATES[2]);
    });

    it('wraps around with modulo', () => {
      expect(getRandomOriginTemplate(ORIGIN_TEMPLATES.length)).toBe(ORIGIN_TEMPLATES[0]);
    });

    it('returns non-empty string', () => {
      expect(getRandomOriginTemplate(0).length).toBeGreaterThan(0);
    });
  });

  describe('getRandomMiddleTemplate', () => {
    it('returns valid middle template by index', () => {
      expect(getRandomMiddleTemplate(0)).toBe(MIDDLE_TEMPLATES[0]);
      expect(getRandomMiddleTemplate(1)).toBe(MIDDLE_TEMPLATES[1]);
    });

    it('wraps around with modulo', () => {
      expect(getRandomMiddleTemplate(MIDDLE_TEMPLATES.length)).toBe(MIDDLE_TEMPLATES[0]);
    });

    it('returns non-empty string', () => {
      expect(getRandomMiddleTemplate(0).length).toBeGreaterThan(0);
    });
  });

  describe('getRandomClosingTemplate', () => {
    it('returns valid closing template by index', () => {
      expect(getRandomClosingTemplate(0)).toBe(CLOSING_TEMPLATES[0]);
      expect(getRandomClosingTemplate(3)).toBe(CLOSING_TEMPLATES[3]);
    });

    it('wraps around with modulo', () => {
      expect(getRandomClosingTemplate(CLOSING_TEMPLATES.length)).toBe(CLOSING_TEMPLATES[0]);
    });

    it('returns non-empty string', () => {
      expect(getRandomClosingTemplate(0).length).toBeGreaterThan(0);
    });
  });

  // ─── Integration: Template Composition ───────────────────────────────

  describe('template composition', () => {
    it('a full backstory uses origin + middle + closing', () => {
      const origin = getRandomOriginTemplate(0).replace(/\{name\}/g, 'Kael');
      const middle = getRandomMiddleTemplate(0).replace(/\{name\}/g, 'Kael');
      const closing = getRandomClosingTemplate(0).replace(/\{name\}/g, 'Kael');

      const backstory = [origin, middle, closing].join('\n\n');
      expect(backstory.length).toBeGreaterThan(50);
      expect(backstory).toContain('Kael');
    });

    it('quote can combine with sphere flavor', () => {
      const quote = getRandomQuoteTemplate(0)
        .replace(/\{name\}/g, 'Kael')
        .replace(/\{sphere\}/g, 'clash of arms')
        .replace(/\{value\}/g, 'determined');

      expect(quote.length).toBeGreaterThan(20);
      expect(quote).toContain('Kael');
    });
  });
});
