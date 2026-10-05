/**
 * THR-1737 — the `departing` filter prices work at its longest roll.
 *
 * `totalTickCost` sums each step's `duration.min`. On seed 42 a mortal turned departing
 * at tick 40 with 9 ticks left (slack ≈ 2.1) and started `encounter.town.cathedral_loan`
 * — two 1–2-tick steps, priced 2 — which ran 4 ticks and lost the promise.
 */
import { describe, expect, it } from 'vitest';
import { departingTripOverruns, departingWorkTicks } from '../appointments';
import { computeTotalTickCostMaxUnified, computeTotalTickCostUnified } from '../encounterCache';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { APPOINTMENT_DEPARTING_PRICES_LONGEST_ROLL } from '../../data/movement-content';
import type { ActionStep, UnifiedActionTemplate } from '../../types/unifiedAction';

const step = (min: number, max: number): ActionStep => ({ duration: { min, max } }) as unknown as ActionStep;
const tmpl = (steps: UnifiedActionTemplate['steps']): UnifiedActionTemplate => ({ steps }) as unknown as UnifiedActionTemplate;

describe('computeTotalTickCostMaxUnified', () => {
  it('sums each step\'s longest roll', () => {
    expect(computeTotalTickCostMaxUnified(tmpl([step(1, 2), step(1, 2)]))).toBe(4);
    expect(computeTotalTickCostUnified(tmpl([step(1, 2), step(1, 2)]))).toBe(2);
  });

  it('a branch counts its longest arm, fallback or variant', () => {
    const branch = { branchOnStep: 0, fallback: step(1, 2), variants: { a: step(1, 1), b: step(2, 5) } };
    expect(computeTotalTickCostMaxUnified(tmpl([step(1, 1), branch as unknown as ActionStep]))).toBe(6);
  });

  it('a step without a duration counts 1, as the minimum does', () => {
    expect(computeTotalTickCostMaxUnified(tmpl([{} as ActionStep, step(2, 3)]))).toBe(4);
  });
});

describe('departingWorkTicks', () => {
  it('prices at the longest roll, never below the minimum', () => {
    expect(departingWorkTicks({ totalTickCost: 2, totalTickCostMax: 4 })).toBe(4);
    expect(departingWorkTicks({ totalTickCost: 3, totalTickCostMax: 1 })).toBe(3);
  });

  it('an entry without a usable max is priced at its minimum (fail-soft)', () => {
    expect(departingWorkTicks({ totalTickCost: 2 })).toBe(2);
    expect(departingWorkTicks({ totalTickCost: 2, totalTickCostMax: Number.NaN })).toBe(2);
  });

  it('ships on', () => {
    expect(APPOINTMENT_DEPARTING_PRICES_LONGEST_ROLL).toBe(true);
  });
});

describe('the seed-42 reproduction: cathedral_loan at tick 40 is dropped', () => {
  const loan = getUnifiedTemplateById('encounter.town.cathedral_loan');
  // Departing at tick 40, due at 49: 9 ticks left, slack 2.1 — the road on is 6.9 ticks.
  const ticksLeft = 9;
  const travelTicks = 6.9;
  const hexesOnward = 3;
  const rate = travelTicks / hexesOnward;

  it('the template is two 1–2-tick steps', () => {
    expect(loan).toBeDefined();
    expect(computeTotalTickCostUnified(loan!)).toBe(2);
    expect(computeTotalTickCostMaxUnified(loan!)).toBe(4);
  });

  it('priced at its shortest roll it passed; at its longest it is dropped', () => {
    const entry = { totalTickCost: computeTotalTickCostUnified(loan!), totalTickCostMax: computeTotalTickCostMaxUnified(loan!) };
    expect(departingTripOverruns(entry.totalTickCost, 0, hexesOnward, rate, ticksLeft)).toBe(false);
    expect(departingTripOverruns(departingWorkTicks(entry), 0, hexesOnward, rate, ticksLeft)).toBe(true);
  });
});
