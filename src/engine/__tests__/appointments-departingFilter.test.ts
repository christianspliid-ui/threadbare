/**
 * THR-1736 — the `departing` filter prices travel the way the slack does.
 *
 * The slack is `dueTick − tick − travelTicks` with `travelTicks` the priced path; the
 * filter used to price the same walk at one tick a hex, so local work longer than the
 * slack passed and a departing mortal started a chain it could not fit.
 */
import { describe, expect, it } from 'vitest';
import { appointmentTicksPerHex, departingTripOverruns, rerankForAppointmentRegime } from '../appointments';
import { APPOINTMENT_DEPARTING_PRICED_TRAVEL, APPOINTMENT_HEX_TICKS_PER_HEX } from '../../data/movement-content';

describe('appointmentTicksPerHex', () => {
  it('is the priced path over the hexes it covers', () => {
    expect(appointmentTicksPerHex(13.6, 4)).toBeCloseTo(3.4);
  });

  it('falls back to the hex-priced rate where the ratio means nothing', () => {
    expect(appointmentTicksPerHex(10, 0)).toBe(APPOINTMENT_HEX_TICKS_PER_HEX);
    expect(appointmentTicksPerHex(Infinity, 3)).toBe(APPOINTMENT_HEX_TICKS_PER_HEX);
    expect(appointmentTicksPerHex(0, 3)).toBe(APPOINTMENT_HEX_TICKS_PER_HEX);
    expect(appointmentTicksPerHex(Number.NaN, 3)).toBe(APPOINTMENT_HEX_TICKS_PER_HEX);
  });
});

describe('departingTripOverruns', () => {
  // A mortal 4 hexes from the place on a 13.6-tick road, 20 ticks before the due tick:
  // slack = 20 − 13.6 = 6.4.
  const rate = appointmentTicksPerHex(13.6, 4);
  const ticksLeft = 20;

  it('local work overruns exactly when it outlasts the slack', () => {
    expect(departingTripOverruns(6, 0, 4, rate, ticksLeft)).toBe(false);
    expect(departingTripOverruns(7, 0, 4, rate, ticksLeft)).toBe(true);
  });

  it('the seed-42 shape: a 7-tick local chain passed the one-tick-a-hex proxy and fails the priced test', () => {
    expect(departingTripOverruns(7, 0, 4, 1, ticksLeft)).toBe(false); // the old proxy: 7 + 4 ≤ 20
    expect(departingTripOverruns(7, 0, 4, rate, ticksLeft)).toBe(true);
  });

  it('a trip off the mortal\'s hex pays both legs at the road rate', () => {
    // 1 hex there, 3 hexes on: 4 hexes × 3.4 = 13.6, plus 6 ticks of work = 19.6.
    expect(departingTripOverruns(6, 1, 3, rate, ticksLeft)).toBe(false);
    expect(departingTripOverruns(6, 1, 4, rate, ticksLeft)).toBe(true);
  });

  it('a fast road never makes a detour off the mortal hex cheaper than one tick a hex', () => {
    // 10 hexes on a major road priced at 4 ticks: 0.4 a hex. An off-road encounter 3 hexes
    // away and 13 from the place, 3 ticks of work, 10 ticks left: at 0.4 it would read 9.4.
    const fast = appointmentTicksPerHex(4, 10);
    expect(fast).toBeCloseTo(0.4);
    expect(departingTripOverruns(3, 3, 13, fast, 10)).toBe(true); // 3 + 16 × 1 = 19
    // Local work keeps the exact road rate: 3 + 10 × 0.4 = 7 ≤ 10.
    expect(departingTripOverruns(3, 0, 10, fast, 10)).toBe(false);
  });

  it('an unknown distance always overruns', () => {
    expect(departingTripOverruns(0, Infinity, 1, rate, 1000)).toBe(true);
    expect(departingTripOverruns(0, 0, Infinity, rate, 1000)).toBe(true);
  });

  it('at a rate of one tick a hex it is THR-1479\'s proxy, unchanged (leaning uses it)', () => {
    expect(departingTripOverruns(5, 2, 3, 1, 10)).toBe(false);
    expect(departingTripOverruns(5, 2, 4, 1, 10)).toBe(true);
  });

  it('drops what overruns from a departing board', () => {
    const list = [
      { finalScore: 0.9, hexDistanceToEntry: 0, work: 9 },
      { finalScore: 0.5, hexDistanceToEntry: 0, work: 3 },
    ];
    const kept = rerankForAppointmentRegime(list, 'departing', c => departingTripOverruns(c.work, 0, 4, rate, ticksLeft));
    expect(kept.map(c => c.work)).toEqual([3]);
  });

  it('ships on', () => {
    expect(APPOINTMENT_DEPARTING_PRICED_TRAVEL).toBe(true);
  });
});
