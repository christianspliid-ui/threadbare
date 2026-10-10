/**
 * THR-1803 — source guard: no encounter surface receives the cross-sphere sum.
 *
 * THR-1706 removed the summed essence total from the top bar and the hand's
 * budget line; the authored-choice veil footer kept it ("◆ 608 essence" beside
 * per-sphere bars reading 45–55) because GameView fed the veil — and the three
 * encounter adapters — `SPHERE_NAMES.reduce(... essencePool[s] ...)`. GameView is
 * too heavy to mount in a unit test, so this pins the wiring at the source: the
 * veil mount and the adapter calls read the one paying pool.
 *
 * Read the Threads (`essenceAvailable`) is deliberately out of scope: it spends
 * across every pool in a cascade, so its sum is what it can actually spend.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const GAME_VIEW = readFileSync(resolve(__dirname, '../GameView.tsx'), 'utf8');
const SUMMED = /SPHERE_NAMES\.reduce\(\s*\(sum,\s*s\)\s*=>\s*sum\s*\+\s*gameState\.essencePool\[s\]/;

function veilMount(source: string): string {
  const start = source.indexOf('<EncounterVeil');
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf('/>', start);
  return source.slice(start, end);
}

describe('THR-1803 — encounter surfaces read the paying pool, never the sum', () => {
  it('passes the veil the paying pool and names its sphere', () => {
    const mount = veilMount(GAME_VIEW);
    const essenceProp = mount.match(/\n\s*essence=\{([^}]*)\}/);
    expect(essenceProp?.[1]).toBe('encounterPayingEssence');
    expect(mount).toMatch(/\n\s*essenceSphere=\{encounterPayingSphere\}/);
  });

  it('feeds no encounter adapter the twelve pools summed', () => {
    const adapterEssence = [...GAME_VIEW.matchAll(/\n\s*essence: ([^,\n]+),/g)].map(m => m[1]);
    expect(adapterEssence.length).toBeGreaterThanOrEqual(3);
    for (const value of adapterEssence) expect(value).not.toMatch(SUMMED);
  });

  it('derives the paying pool from the sphere the encounter handler bills', () => {
    expect(GAME_VIEW).toMatch(
      /const encounterPayingEssence = gameState\.essencePool\[encounterPayingSphere\]/,
    );
    expect(GAME_VIEW).toMatch(/const encounterPayingSphere = archetype\.sphereAlignment\.primary;/);
  });
});
