/**
 * Profile Generator Tests
 *
 * Tests for template-based quote, backstory, and portrait prompt generation
 * using seeded PRNG.
 */

import { describe, it, expect } from 'vitest';
import {
  generateQuotes,
  generateBackstory,
  generatePortraitPrompt,
  type AgentGeneratedContent,
} from '../profileGenerator';

// Simple seeded PRNG for deterministic tests
function testPrng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('profileGenerator', () => {
  describe('generateQuotes', () => {
    it('returns 2-3 quotes', () => {
      const prng = testPrng(42);
      const quotes = generateQuotes(
        {
          archetypeId: 'tragic_hero',
          dominantValues: ['Deeply Ambitious', 'Courageous'],
          primarySphere: 'force',
          name: 'Kael',
        },
        prng
      );
      expect(quotes.length).toBeGreaterThanOrEqual(2);
      expect(quotes.length).toBeLessThanOrEqual(3);
      for (const q of quotes) {
        expect(typeof q).toBe('string');
        expect(q.length).toBeGreaterThan(10);
      }
    });

    it('contains agent name in quotes', () => {
      const prng = testPrng(42);
      const quotes = generateQuotes(
        {
          archetypeId: 'tragic_hero',
          dominantValues: ['Deeply Ambitious'],
          primarySphere: 'force',
          name: 'Kael',
        },
        prng
      );
      const hasName = quotes.some(q => q.includes('Kael'));
      expect(hasName).toBe(true);
    });

    it('references sphere in quotes', () => {
      const prng = testPrng(42);
      const quotes = generateQuotes(
        {
          archetypeId: 'tragic_hero',
          dominantValues: ['Deeply Ambitious'],
          primarySphere: 'force',
          name: 'Kael',
        },
        prng
      );
      const allQuotes = quotes.join(' ');
      expect(allQuotes.toLowerCase()).toMatch(/force|clash/i);
    });

    it('produces deterministic output with same seed', () => {
      const params = {
        archetypeId: 'tragic_hero',
        dominantValues: ['Deeply Ambitious'],
        primarySphere: 'force',
        name: 'Kael',
      };
      const q1 = generateQuotes(params, testPrng(42));
      const q2 = generateQuotes(params, testPrng(42));
      expect(q1).toEqual(q2);
    });

    it('produces different output with different seeds', () => {
      const params = {
        archetypeId: 'tragic_hero',
        dominantValues: ['Deeply Ambitious'],
        primarySphere: 'force',
        name: 'Kael',
      };
      const q1 = generateQuotes(params, testPrng(42));
      const q2 = generateQuotes(params, testPrng(99));
      expect(q1).not.toEqual(q2);
    });

    it('handles unknown sphere gracefully', () => {
      const prng = testPrng(42);
      const quotes = generateQuotes(
        {
          archetypeId: 'tragic_hero',
          dominantValues: ['Ambitious'],
          primarySphere: 'unknown_sphere',
          name: 'Kael',
        },
        prng
      );
      expect(quotes.length).toBeGreaterThanOrEqual(2);
      expect(quotes.length).toBeLessThanOrEqual(3);
    });

    it('substitutes value correctly', () => {
      const prng = testPrng(42);
      const quotes = generateQuotes(
        {
          archetypeId: 'tragic_hero',
          dominantValues: ['Deeply Ambitious'],
          primarySphere: 'force',
          name: 'Kael',
        },
        prng
      );
      const allQuotes = quotes.join(' ').toLowerCase();
      expect(allQuotes).toMatch(/deeply ambitious|ambitious/i);
    });
  });

  describe('generateBackstory', () => {
    it('returns multi-paragraph backstory string', () => {
      const prng = testPrng(42);
      const story = generateBackstory(
        {
          archetypeId: 'tragic_hero',
          cultureName: 'The Thornwall',
          traitNames: ['Fearless', 'Proud'],
          bondNames: ['Mirael', 'Dren'],
          name: 'Kael',
          primarySphere: 'force',
        },
        prng
      );
      expect(typeof story).toBe('string');
      expect(story.length).toBeGreaterThan(100);
      expect(story).toContain('Kael');
    });

    it('contains name multiple times', () => {
      const prng = testPrng(42);
      const story = generateBackstory(
        {
          archetypeId: 'tragic_hero',
          cultureName: 'The Thornwall',
          traitNames: ['Fearless', 'Proud'],
          bondNames: ['Mirael', 'Dren'],
          name: 'Kael',
          primarySphere: 'force',
        },
        prng
      );
      const nameCount = (story.match(/Kael/g) || []).length;
      expect(nameCount).toBeGreaterThanOrEqual(2);
    });

    it('references culture', () => {
      const prng = testPrng(42);
      const story = generateBackstory(
        {
          archetypeId: 'tragic_hero',
          cultureName: 'The Thornwall',
          traitNames: ['Fearless'],
          bondNames: ['Mirael'],
          name: 'Kael',
          primarySphere: 'force',
        },
        prng
      );
      expect(story).toContain('The Thornwall');
    });

    it('references trait', () => {
      const prng = testPrng(42);
      const story = generateBackstory(
        {
          archetypeId: 'tragic_hero',
          cultureName: 'The Thornwall',
          traitNames: ['Fearless'],
          bondNames: ['Mirael'],
          name: 'Kael',
          primarySphere: 'force',
        },
        prng
      );
      expect(story.toLowerCase()).toMatch(/fearless|resolute/i);
    });

    it('references bond', () => {
      const prng = testPrng(42);
      const story = generateBackstory(
        {
          archetypeId: 'tragic_hero',
          cultureName: 'The Thornwall',
          traitNames: ['Fearless'],
          bondNames: ['Mirael'],
          name: 'Kael',
          primarySphere: 'force',
        },
        prng
      );
      expect(story).toMatch(/Mirael|bond/);
    });

    it('is deterministic', () => {
      const params = {
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        traitNames: ['Fearless'],
        bondNames: ['Mirael'],
        name: 'Kael',
        primarySphere: 'force',
      };
      const s1 = generateBackstory(params, testPrng(42));
      const s2 = generateBackstory(params, testPrng(42));
      expect(s1).toBe(s2);
    });

    it('differs with different seeds', () => {
      const params = {
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        traitNames: ['Fearless'],
        bondNames: ['Mirael'],
        name: 'Kael',
        primarySphere: 'force',
      };
      const s1 = generateBackstory(params, testPrng(42));
      const s2 = generateBackstory(params, testPrng(99));
      expect(s1).not.toBe(s2);
    });

    it('handles missing traits with fallback', () => {
      const prng = testPrng(42);
      const story = generateBackstory(
        {
          archetypeId: 'tragic_hero',
          cultureName: 'The Thornwall',
          traitNames: [],
          bondNames: ['Mirael'],
          name: 'Kael',
          primarySphere: 'force',
        },
        prng
      );
      expect(story.length).toBeGreaterThan(100);
      expect(story).toContain('Kael');
    });

    it('handles missing bonds with fallback', () => {
      const prng = testPrng(42);
      const story = generateBackstory(
        {
          archetypeId: 'tragic_hero',
          cultureName: 'The Thornwall',
          traitNames: ['Fearless'],
          bondNames: [],
          name: 'Kael',
          primarySphere: 'force',
        },
        prng
      );
      expect(story.length).toBeGreaterThan(100);
      expect(story).toContain('Kael');
    });
  });

  describe('generatePortraitPrompt', () => {
    it('returns a prompt string', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      });
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(20);
    });

    it('references archetype', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      });
      expect(prompt.toLowerCase()).toMatch(/tragic|hero/i);
    });

    it('references culture', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      });
      expect(prompt).toContain('The Thornwall');
    });

    it('references sphere', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      });
      expect(prompt.toLowerCase()).toMatch(/force|clash/i);
    });

    it('includes Threadbare style reference', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      });
      expect(prompt.toLowerCase()).toContain('threadbare');
    });

    it('is deterministic (no PRNG needed)', () => {
      const params = {
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      };
      const p1 = generatePortraitPrompt(params);
      const p2 = generatePortraitPrompt(params);
      expect(p1).toBe(p2);
    });

    it('handles unknown archetype gracefully', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'nonexistent_archetype',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      });
      expect(prompt.length).toBeGreaterThan(20);
      expect(prompt.toLowerCase()).toContain('threadbare');
    });

    it('handles unknown sphere gracefully', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'unknown_sphere',
        name: 'Kael',
      });
      expect(prompt.length).toBeGreaterThan(20);
      expect(prompt.toLowerCase()).toContain('threadbare');
    });
  });
});
