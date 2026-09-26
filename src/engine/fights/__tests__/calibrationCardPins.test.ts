/**
 * THR-1628 — the calibration card pin is a harness-only seam.
 *
 * Three guards: it is the identity outside a `withCalibrationCardPins` call (so play
 * never sees it), it pins only a derived card and drops its pins even when the
 * wrapped run throws, and nothing outside `src/testing/` and test files can set it.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';
import { describe, expect, it } from 'vitest';
import type { OpponentCard } from '../../../types/fight';
import { applyCalibrationCardPin, withCalibrationCardPins } from '../calibrationCardPins';

function card(overrides: Partial<OpponentCard> = {}): OpponentCard {
  return {
    opponentId: 'duellist', dread: 'fair', might: 'steep', clockSize: 3, clockFilled: 0,
    temper: 'stubborn', persistent: false, source: 'derived', ...overrides,
  };
}

const PINS = new Map([['duellist', { might: 'fair' as const, dread: 'gentle' as const }]]);

describe('calibration card pin (THR-1628)', () => {
  it('is the identity outside a pinned run', () => {
    const c = card();
    expect(applyCalibrationCardPin(c)).toBe(c);
  });

  it('pins a derived card inside a pinned run, and only a derived card', () => {
    withCalibrationCardPins(PINS, () => {
      expect(applyCalibrationCardPin(card())).toMatchObject({ might: 'fair', dread: 'gentle' });
      const monster = card({ source: 'monsterState' });
      expect(applyCalibrationCardPin(monster)).toBe(monster);
      const stranger = card({ opponentId: 'someone.else' });
      expect(applyCalibrationCardPin(stranger)).toBe(stranger);
    });
  });

  it('drops its pins when the run throws', () => {
    expect(() => withCalibrationCardPins(PINS, () => { throw new Error('boom'); })).toThrow('boom');
    const c = card();
    expect(applyCalibrationCardPin(c)).toBe(c);
  });

  it('only the calibration harness can set a pin', () => {
    const srcRoot = join(__dirname, '..', '..', '..');
    const setters: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) { walk(path); continue; }
        if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name)) continue;
        const rel = relative(srcRoot, path).split(sep).join('/');
        if (rel === 'engine/fights/calibrationCardPins.ts') continue;
        if (readFileSync(path, 'utf8').includes('withCalibrationCardPins')) setters.push(rel);
      }
    };
    walk(srcRoot);
    expect(setters.every((rel) => rel.startsWith('testing/')), setters.join(', ')).toBe(true);
    expect(setters).toContain('testing/duelCalibration.ts');
  });
});
