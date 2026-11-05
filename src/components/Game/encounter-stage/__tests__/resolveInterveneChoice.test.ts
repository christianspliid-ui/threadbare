/**
 * `resolveInterveneChoice` (THR-989, reduced by THR-2161).
 *
 * THR-989 taught it to find authored cards the generic set did not contain.
 * THR-2161 retired authored cards, so it is a plain lookup over the
 * notification's choices again; these pin that it still finds them and stays a
 * no-op on an id nothing offers.
 */
import { describe, expect, it } from 'vitest';
import type { EncounterInterventionChoice } from '../../../../types/encounterVisibility';
import { resolveInterveneChoice } from '../resolveInterveneChoice';

const CHOICES: readonly EncounterInterventionChoice[] = [
  { id: 'intervene_support', text: 'Lend strength', essenceCost: 1, probabilityBoost: 0, interventionType: 'supportive' },
  { id: 'intervene_withdraw', text: 'Step back', essenceCost: 0, probabilityBoost: 0, interventionType: 'withdrawn' },
];

describe('resolveInterveneChoice', () => {
  it('resolves a choice the notification offers', () => {
    expect(resolveInterveneChoice(CHOICES, 'intervene_withdraw')).toBe(CHOICES[1]);
  });

  it('returns undefined for an id nothing offers', () => {
    expect(resolveInterveneChoice(CHOICES, 'steady_their_nerve')).toBeUndefined();
  });

  it('tolerates an empty choice set', () => {
    expect(resolveInterveneChoice([], 'anything')).toBeUndefined();
  });
});
