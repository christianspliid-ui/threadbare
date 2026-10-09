/**
 * THR-1774 — every world draws its doom.
 *
 * Plan: `Docs/plans/2026-10-08-thr-1774-doom-archetype-draw.md` § Done when.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  selectDoomArchetype,
  parseDoomArchetypeParam,
  DOOM_ARCHETYPE_DRAW_WEIGHTS,
  DOOM_ARCHETYPE_FALLBACK,
} from '../doomArchetypeSelection';
import { DOOM_CLOCK_ARCHETYPES, type DoomClockArchetype } from '../../types/doomClock';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';

/** The stored hunger-id form an `AscendantIdentity` carries (`gameInit.ts` DEV identity). */
const HUNGER_KEYS = HUNGER_CATALOG.map(h => `hunger.${h.id}`);

describe('selectDoomArchetype (THR-1774)', () => {
  it('covers twelve hungers', () => {
    expect(HUNGER_KEYS).toHaveLength(12);
  });

  it('draws at least four distinct dooms across the twelve hungers at seed 42', () => {
    const drawn = new Set(HUNGER_KEYS.map(k => selectDoomArchetype(42, k).archetype));
    expect(drawn.size).toBeGreaterThanOrEqual(4);
  });

  it('is deterministic for a seed and identity', () => {
    for (const seed of [1, 42, 9001, -7]) {
      for (const key of [...HUNGER_KEYS, '']) {
        const a = selectDoomArchetype(seed, key);
        const b = selectDoomArchetype(seed, key);
        expect(b).toEqual(a);
        expect(a.source).toBe('draw');
      }
    }
  });

  it('gives no doom an edge — each lands near one in seven over many worlds', () => {
    const counts = Object.fromEntries(DOOM_CLOCK_ARCHETYPES.map(a => [a, 0])) as Record<DoomClockArchetype, number>;
    let draws = 0;
    for (let seed = 1; seed <= 500; seed++) {
      for (const key of HUNGER_KEYS) {
        counts[selectDoomArchetype(seed, key).archetype]++;
        draws++;
      }
    }
    for (const archetype of DOOM_CLOCK_ARCHETYPES) {
      const share = counts[archetype] / draws;
      expect(share).toBeGreaterThan(0.11);
      expect(share).toBeLessThan(0.175);
    }
  });

  it('honours the weights: a zeroed doom is never drawn, a lone weight always is', () => {
    const noBreach = { ...DOOM_ARCHETYPE_DRAW_WEIGHTS, breach: 0 };
    const onlyReckoning = Object.fromEntries(
      DOOM_CLOCK_ARCHETYPES.map(a => [a, a === 'reckoning' ? 1 : -3]),
    ) as Record<DoomClockArchetype, number>;
    for (let seed = 1; seed <= 200; seed++) {
      expect(selectDoomArchetype(seed, 'hunger.witness', noBreach).archetype).not.toBe('breach');
      expect(selectDoomArchetype(seed, 'hunger.witness', onlyReckoning).archetype).toBe('reckoning');
    }
  });

  it('falls back when every weight is zero or negative', () => {
    const none = Object.fromEntries(DOOM_CLOCK_ARCHETYPES.map(a => [a, 0])) as Record<DoomClockArchetype, number>;
    const draw = selectDoomArchetype(42, 'hunger.witness', none);
    expect(draw.archetype).toBe(DOOM_ARCHETYPE_FALLBACK);
    expect(draw.source).toBe('fallback');
  });
});

describe('parseDoomArchetypeParam (THR-1774 ?doom= lever)', () => {
  it('reads a valid archetype, case-insensitively', () => {
    expect(parseDoomArchetypeParam('?view=game&seeded&doom=reckoning')).toBe('reckoning');
    expect(parseDoomArchetypeParam('?doom=Sundering')).toBe('sundering');
  });

  it('absent → undefined, silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseDoomArchetypeParam('?view=game&seeded')).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('an invalid value is ignored with one warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseDoomArchetypeParam('?doom=apocalypse')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
