/**
 * THR-1978 — no surface offers a "Meet The First" card the flow cannot open.
 * The flow mounts only with an ascendant identity.
 */
import { describe, it, expect } from 'vitest';
import { canOpenMeetTheFirst, offersMeetTheFirstCard } from '../meetTheFirstCard';

const OPEN = {
  viewLevel: 'location',
  meetTheFirstAvailable: true,
  hasFocusedLocation: true,
  hasAscendantIdentity: true,
};

describe('THR-1978 — Meet The First card offer', () => {
  it('offers the card on a location view when the flow can open', () => {
    expect(canOpenMeetTheFirst(OPEN)).toBe(true);
    expect(offersMeetTheFirstCard(OPEN)).toBe(true);
  });

  it('offers nothing on a run without an ascendant identity', () => {
    const noIdentity = { ...OPEN, hasAscendantIdentity: false };
    expect(canOpenMeetTheFirst(noIdentity)).toBe(false);
    expect(offersMeetTheFirstCard(noIdentity)).toBe(false);
  });

  it('offers nothing when the world does not allow a meeting', () => {
    expect(offersMeetTheFirstCard({ ...OPEN, meetTheFirstAvailable: false })).toBe(false);
  });

  it('offers the slot only on a focused location view', () => {
    expect(offersMeetTheFirstCard({ ...OPEN, viewLevel: 'world' })).toBe(false);
    expect(offersMeetTheFirstCard({ ...OPEN, hasFocusedLocation: false })).toBe(false);
  });
});
