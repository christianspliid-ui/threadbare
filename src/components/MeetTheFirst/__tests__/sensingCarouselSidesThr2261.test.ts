/**
 * THR-2261 item 4 (cold playtest round 8) — the portrait carousel's left arrow
 * brings in the face shown on the left. Side portraits are placed relative to the
 * focused one: previous on the left (slot 0), next on the right (slot 1).
 */
import { describe, expect, it } from 'vitest';
import { peripheralSlotFor } from '../SensingBeat';

const LEFT = 0;
const RIGHT = 1;

describe('peripheralSlotFor — previous left, next right (THR-2261)', () => {
  it('for every focus of three candidates, the previous sits left and the next right', () => {
    const count = 3;
    for (let focused = 0; focused < count; focused++) {
      const prev = (focused - 1 + count) % count;
      const next = (focused + 1) % count;
      expect(peripheralSlotFor(prev, focused, count), `focus ${focused}`).toBe(LEFT);
      expect(peripheralSlotFor(next, focused, count), `focus ${focused}`).toBe(RIGHT);
    }
  });

  it('the face the left arrow brings in was the one on the left', () => {
    const count = 3;
    let focused = 0;
    for (let step = 0; step < 6; step++) {
      const onLeft = [0, 1, 2].find((i) => i !== focused && peripheralSlotFor(i, focused, count) === LEFT);
      focused = (focused - 1 + count) % count; // handleNav(-1)
      expect(focused).toBe(onLeft);
    }
  });

  it('more than three candidates put the rest in the third slot; one or two stay in range', () => {
    expect(peripheralSlotFor(2, 0, 5)).toBe(2);
    expect(peripheralSlotFor(1, 0, 2)).toBe(RIGHT);
    expect(peripheralSlotFor(0, 0, 1)).toBe(LEFT);
  });
});
