/**
 * THR-1820 — the gift and offering dialog picks its tier from its card row:
 * S below three cards, M from three (a row of four fits M at the hand's gap).
 */
import { describe, expect, it } from 'vitest';
import { beatModalSize } from '../AscendantBeatModal';
import { CARD_WIDTH_PX } from '../../shared/CardFace';

describe('beatModalSize (THR-1820)', () => {
  it('S below three cards, M from three', () => {
    expect(beatModalSize(0)).toBe('s');
    expect(beatModalSize(1)).toBe('s');
    expect(beatModalSize(2)).toBe('s');
    expect(beatModalSize(3)).toBe('m');
    expect(beatModalSize(4)).toBe('m');
  });

  it('a four-card row at the hand gap fits inside M at 1080p (960 − 2 × 20 padding)', () => {
    const row = 4 * CARD_WIDTH_PX + 3 * 12;
    expect(row).toBeLessThanOrEqual(960 - 2 * 20);
  });
});
