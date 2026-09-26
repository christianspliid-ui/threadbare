/**
 * THR-1576 — colocation detection and strategic role fit read the reach share.
 *
 * Both sites used to multiply the raw stored capability (≈ 10–40) by weights written
 * for a 0–1 scale: colocation clamped to 0.01 or 0.95, and role fit saturated at 1.
 * These pin a *spread* of values across mortals of different skill.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { detectionChance } from '../phaseColocationDetection';
import { computeRoleFit, ROLE_FIT_UNKNOWN } from '../strategicActionCandidates';
import {
  ENCOUNTER_BASE_CHANCE_LOCATION,
  DETECTION_CHANCE_FLOOR,
  DETECTION_CHANCE_CEILING,
} from '../../data/colocation-content';
import { REACH_SHARE_FULL_RAW } from '../../data/reach-share-constants';

function mortal(g: WorldGraph, id: string, caps: Record<string, number> | undefined): void {
  g.addNode({
    id, type: 'actor', name: id,
    properties: { actorType: 'individual', ...(caps ? { domainCapabilities: caps } : {}) },
  });
}

describe('THR-1576 colocation detection reads the reach share', () => {
  // A typical protagonist roll is 10–40 raw; 40 raw reads as a full share.
  const RAWS = [0, 10, 20, 30, 40];

  it('spreads across its range for observers of different Eye — no pair pins', () => {
    const g = new WorldGraph();
    mortal(g, 'target', { shadow: 20 });
    const chances = RAWS.map(raw => {
      mortal(g, `eye${raw}`, { eye: raw });
      return detectionChance(g, `eye${raw}`, 'target', ENCOUNTER_BASE_CHANCE_LOCATION);
    });
    // Strictly increasing with Eye: capability decides the chance between the bounds.
    for (let i = 1; i < chances.length; i++) expect(chances[i]).toBeGreaterThan(chances[i - 1]);
    // Protagonist-range observers (raw 10–40) sit strictly inside the clamp.
    for (const c of chances.slice(1)) {
      expect(c).toBeGreaterThan(DETECTION_CHANCE_FLOOR);
      expect(c).toBeLessThan(DETECTION_CHANCE_CEILING);
    }
    // And the spread is real — not a sliver near the base chance.
    expect(chances[chances.length - 1] - chances[1]).toBeGreaterThan(0.25);
  });

  it('falls with the target\'s Shadow', () => {
    const g = new WorldGraph();
    mortal(g, 'observer', { eye: 20 });
    const chances = RAWS.map(raw => {
      mortal(g, `sh${raw}`, { shadow: raw });
      return detectionChance(g, 'observer', `sh${raw}`, ENCOUNTER_BASE_CHANCE_LOCATION);
    });
    for (let i = 1; i < chances.length; i++) expect(chances[i]).toBeLessThanOrEqual(chances[i - 1]);
    expect(chances[0] - chances[chances.length - 1]).toBeGreaterThan(0.15);
  });

  it('a mortal of ordinary skill on both sides is not pinned (the old formula read 0.95 here)', () => {
    const g = new WorldGraph();
    mortal(g, 'o', { eye: 30 });
    mortal(g, 't', { shadow: 15 });
    const c = detectionChance(g, 'o', 't', ENCOUNTER_BASE_CHANCE_LOCATION);
    expect(c).toBeGreaterThan(DETECTION_CHANCE_FLOOR);
    expect(c).toBeLessThan(DETECTION_CHANCE_CEILING);
  });

  it('fails soft: unknown ids read a zero share and return the base chance', () => {
    const g = new WorldGraph();
    expect(detectionChance(g, 'nobody', 'nothing', ENCOUNTER_BASE_CHANCE_LOCATION))
      .toBeCloseTo(ENCOUNTER_BASE_CHANCE_LOCATION, 10);
  });
});

describe('THR-1576 computeRoleFit reads the reach share', () => {
  const profile = { reachProfile: { stone: 0.6, iron: 0.3, eye: 0.1 } };

  it('spreads across 0–1 for mortals of different skill instead of saturating at 1', () => {
    const g = new WorldGraph();
    const fits = [5, 15, 25, 35].map(raw => {
      mortal(g, `m${raw}`, { stone: raw, iron: raw, eye: raw });
      return computeRoleFit(g, g.getNode(`m${raw}`)!, profile);
    });
    for (let i = 1; i < fits.length; i++) expect(fits[i]).toBeGreaterThan(fits[i - 1]);
    for (const f of fits) expect(f).toBeLessThan(1);
    // Uniform raw r reads exactly the share r / REACH_SHARE_FULL_RAW (weighted mean).
    expect(fits[0]).toBeCloseTo(5 / REACH_SHARE_FULL_RAW, 10);
  });

  it('weights the profile: a specialist in the heavy reach outscores one in the light reach', () => {
    const g = new WorldGraph();
    mortal(g, 'mason', { stone: 30 });
    mortal(g, 'scout', { eye: 30 });
    expect(computeRoleFit(g, g.getNode('mason')!, profile))
      .toBeGreaterThan(computeRoleFit(g, g.getNode('scout')!, profile));
  });

  it('a full-share mortal reads 1; no bag or an empty profile reads the unknown default', () => {
    const g = new WorldGraph();
    mortal(g, 'master', { stone: 80, iron: 80, eye: 80 });
    mortal(g, 'ambient', undefined);
    expect(computeRoleFit(g, g.getNode('master')!, profile)).toBe(1);
    expect(computeRoleFit(g, g.getNode('ambient')!, profile)).toBe(ROLE_FIT_UNKNOWN);
    expect(computeRoleFit(g, g.getNode('master')!, { reachProfile: {} })).toBe(ROLE_FIT_UNKNOWN);
  });
});
