/**
 * THR-1720 — an authored encounter choice is charged all-or-nothing against the
 * one pool that pays for it (`handleEncounterIntervene` in GameView).
 *
 * The handler used to floor the paying pool at zero and apply the choice
 * anyway: with Life at 1, a choice costing 5 Life cost 1 and bought its full
 * effect. `spendAuthoredChoiceEssence` is the gate the handler now asks before
 * it writes anything; a rejection returns before the pool, the choice memory
 * or the notification is touched.
 */
import { describe, expect, it } from 'vitest';
import { spendAuthoredChoiceEssence } from '../nudgeCommit';
import { createEmptyEssencePool } from '../../../../engine/influence';

function poolWith(values: Partial<Record<string, number>>) {
  return { ...createEmptyEssencePool(), ...values } as ReturnType<typeof createEmptyEssencePool>;
}

describe('spendAuthoredChoiceEssence (THR-1720)', () => {
  it('rejects a choice the paying pool cannot cover and leaves the pool untouched', () => {
    const pool = poolWith({ life: 1, force: 40 });
    const spend = spendAuthoredChoiceEssence(pool, 5, 'life');

    expect(spend.ok).toBe(false);
    expect(spend.spent).toBe(0);
    expect(spend.shortfallSphere).toBe('life');
    // The pool is the input, unchanged; nothing floors at zero.
    expect(spend.pool).toBe(pool);
    expect(pool.life).toBe(1);
  });

  it('does not borrow from other spheres to cover the paying pool', () => {
    // Plenty of essence overall, but the choice is billed to Life alone.
    const spend = spendAuthoredChoiceEssence(poolWith({ life: 2, force: 40, darkness: 40 }), 3, 'life');
    expect(spend.ok).toBe(false);
  });

  it('charges exactly the cost when the pool covers it', () => {
    const pool = poolWith({ life: 5, force: 3 });
    const spend = spendAuthoredChoiceEssence(pool, 5, 'life');

    expect(spend.ok).toBe(true);
    expect(spend.spent).toBe(5);
    expect(spend.pool.life).toBe(0);
    expect(spend.pool.force).toBe(3);
    expect(pool.life).toBe(5); // never mutates its input
  });

  it('lets a free choice through on an empty pool', () => {
    const spend = spendAuthoredChoiceEssence(createEmptyEssencePool(), 0, 'life');
    expect(spend.ok).toBe(true);
    expect(spend.spent).toBe(0);
  });
});
