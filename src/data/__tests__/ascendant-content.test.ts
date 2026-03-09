import { describe, it, expect } from 'vitest';
import { ARCHETYPE_TITLES } from '../ascendant-content';
import { SPHERE_NAMES } from '../../types/index';

describe('ascendant-content', () => {
  describe('ARCHETYPE_TITLES', () => {
    it('contains exactly 8 spheres (one per Creation Sphere)', () => {
      expect(Object.keys(ARCHETYPE_TITLES).sort()).toEqual(SPHERE_NAMES.sort());
    });

    it('each sphere has at least 3 title options', () => {
      for (const sphere of SPHERE_NAMES) {
        const titles = ARCHETYPE_TITLES[sphere];
        expect(titles.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('all titles are non-empty strings', () => {
      for (const sphere of SPHERE_NAMES) {
        const titles = ARCHETYPE_TITLES[sphere];
        for (const title of titles) {
          expect(typeof title).toBe('string');
          expect(title.length).toBeGreaterThan(0);
        }
      }
    });

    it('force sphere has expected titles', () => {
      const forceTitles = ARCHETYPE_TITLES.force;
      expect(forceTitles).toContain('The Warlord Ascendant');
      expect(forceTitles).toContain('The Iron Sovereign');
      expect(forceTitles).toContain('The Storm Marshal');
    });

    it('matter sphere has expected titles', () => {
      const matterTitles = ARCHETYPE_TITLES.matter;
      expect(matterTitles).toContain('The Stone Architect');
      expect(matterTitles).toContain('The Foundation Lord');
    });

    it('energy sphere has expected titles', () => {
      const energyTitles = ARCHETYPE_TITLES.energy;
      expect(energyTitles).toContain('The Flame Herald');
      expect(energyTitles).toContain('The Lightning Weaver');
    });

    it('life sphere has expected titles', () => {
      const lifeTitles = ARCHETYPE_TITLES.life;
      expect(lifeTitles).toContain('The Verdant One');
      expect(lifeTitles).toContain('The Bloom Shepherd');
    });

    it('mind sphere has expected titles', () => {
      const mindTitles = ARCHETYPE_TITLES.mind;
      expect(mindTitles).toContain('The Dream Architect');
      expect(mindTitles).toContain('The Thought Weaver');
    });

    it('spirit sphere has expected titles', () => {
      const spiritTitles = ARCHETYPE_TITLES.spirit;
      expect(spiritTitles).toContain('The Veil Walker');
      expect(spiritTitles).toContain('The Soul Shepherd');
    });

    it('time sphere has expected titles', () => {
      const timeTitles = ARCHETYPE_TITLES.time;
      expect(timeTitles).toContain('The Chronicler');
      expect(timeTitles).toContain('The Moment Keeper');
    });

    it('entropy sphere has expected titles', () => {
      const entropyTitles = ARCHETYPE_TITLES.entropy;
      expect(entropyTitles).toContain('The Unraveler');
      expect(entropyTitles).toContain('The Ash Herald');
    });

    it('titles follow Threadbare naming conventions (capitalized, mystical)', () => {
      for (const sphere of SPHERE_NAMES) {
        const titles = ARCHETYPE_TITLES[sphere];
        for (const title of titles) {
          // Each word in title should start with capital letter
          const words = title.split(' ');
          for (const word of words) {
            if (word === 'of' || word === 'the') continue; // Articles may be lowercase in some traditions
            expect(word[0]).toBe(word[0].toUpperCase());
          }
        }
      }
    });

    it('no title is duplicated within a sphere', () => {
      for (const sphere of SPHERE_NAMES) {
        const titles = ARCHETYPE_TITLES[sphere];
        const uniqueTitles = new Set(titles);
        expect(uniqueTitles.size).toBe(titles.length);
      }
    });

    it('titles evoke sphere thematic identity', () => {
      // Force: martial/strength language
      expect(ARCHETYPE_TITLES.force.some(t => t.toLowerCase().includes('war') || t.toLowerCase().includes('marshal') || t.toLowerCase().includes('storm'))).toBe(true);

      // Matter: stone/foundation language
      expect(ARCHETYPE_TITLES.matter.some(t => t.toLowerCase().includes('stone') || t.toLowerCase().includes('foundation') || t.toLowerCase().includes('earth'))).toBe(true);

      // Energy: fire/light language
      expect(ARCHETYPE_TITLES.energy.some(t => t.toLowerCase().includes('flame') || t.toLowerCase().includes('light') || t.toLowerCase().includes('radiant'))).toBe(true);

      // Life: growth/bloom language
      expect(ARCHETYPE_TITLES.life.some(t => t.toLowerCase().includes('verdant') || t.toLowerCase().includes('bloom') || t.toLowerCase().includes('green'))).toBe(true);

      // Mind: thought/dream language
      expect(ARCHETYPE_TITLES.mind.some(t => t.toLowerCase().includes('dream') || t.toLowerCase().includes('thought') || t.toLowerCase().includes('knowing'))).toBe(true);

      // Spirit: ethereal/veil language
      expect(ARCHETYPE_TITLES.spirit.some(t => t.toLowerCase().includes('veil') || t.toLowerCase().includes('ethereal') || t.toLowerCase().includes('soul'))).toBe(true);

      // Time: chronicle/moment language
      expect(ARCHETYPE_TITLES.time.some(t => t.toLowerCase().includes('chronicler') || t.toLowerCase().includes('moment') || t.toLowerCase().includes('tide'))).toBe(true);

      // Entropy: unraveling/ash language
      expect(ARCHETYPE_TITLES.entropy.some(t => t.toLowerCase().includes('unravel') || t.toLowerCase().includes('ash') || t.toLowerCase().includes('void'))).toBe(true);
    });
  });
});
