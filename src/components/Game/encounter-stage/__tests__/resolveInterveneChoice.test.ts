/**
 * THR-989: the clicked card must resolve back to the card that was rendered.
 *
 * The defect these pin is a lookup against the wrong producer:
 * `handleEncounterIntervene` searched `notification.choices` — the fixed generic
 * triple `generateInterventionChoices` builds — while `EncounterVeil` had
 * rendered `template.authoredChoices`. Every authored pick missed, returned
 * early, and recorded nothing, so `resolveAftermathVariant` fell back forever on
 * 30 of the 34 templates carrying aftermath variants.
 */

import { describe, expect, it } from 'vitest';
import { resolveInterveneChoice } from '../resolveInterveneChoice';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../data/unified-action-templates';
import type { EncounterInterventionChoice } from '../../../../types/encounterVisibility';

/**
 * The set `generateInterventionChoices` built for The First **before THR-1121
 * retired it**.
 *
 * Kept as a literal rather than regenerated: these tests are about the *lookup*
 * across two producers, and the lookup must still handle a non-empty
 * notification hand — which is exactly what a template's `authoredChoices`
 * arrive as, via `phaseEncounterVisibility`'s override. Calling the retired
 * builder here would fixture an empty array and quietly stop testing the
 * precedence rule this file exists for.
 */
const GENERIC_CHOICES: readonly EncounterInterventionChoice[] = [
  {
    id: 'intervene_support',
    text: 'Tip the scales in their favor',
    essenceCost: 1,
    probabilityBoost: 0.03,
    interventionType: 'supportive',
  },
  {
    id: 'intervene_withdraw',
    text: 'Let it play out',
    essenceCost: 0,
    probabilityBoost: 0,
    interventionType: 'withdrawn',
  },
];

const THE_OFFER = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'mentorship.the-offer')!;

describe('resolveInterveneChoice', () => {
  it('resolves an authored card the generic set does not contain', () => {
    // The falsification the fix turns on: this id is real, rendered, and absent
    // from `notification.choices`. The old lookup returned undefined here.
    expect(GENERIC_CHOICES.some((c) => c.id === 'steady_their_nerve')).toBe(false);

    const resolved = resolveInterveneChoice(THE_OFFER, 1, GENERIC_CHOICES, 'steady_their_nerve');

    expect(resolved).toBeDefined();
    expect(resolved!.id).toBe('steady_their_nerve');
    expect(resolved!.text).toBe('Steady their nerve');
    expect(resolved!.interventionType).toBe('supportive');
  });

  it('carries the authored essence cost through to the recorded choice', () => {
    const free = resolveInterveneChoice(THE_OFFER, 1, GENERIC_CHOICES, 'let_them_choose');
    expect(free!.essenceCost).toBe(0);

    const paid = resolveInterveneChoice(THE_OFFER, 1, GENERIC_CHOICES, 'whisper_the_cost');
    expect(paid!.essenceCost).toBe(1);
  });

  /**
   * THR-1121 — a paid authored card no longer buys odds.
   *
   * It used to convert its price at `BOOST_TO_PROBABILITY_RATIO`, matching the
   * generic triple, and `unifiedActionResolution` added the result to the roll.
   * Both halves are retired. Asserted on the **paid** card specifically: a free
   * card has always been 0, so pinning only that would pass unchanged if the
   * conversion came back.
   */
  it('never buys probability, however expensive the card', () => {
    const paid = resolveInterveneChoice(THE_OFFER, 1, GENERIC_CHOICES, 'whisper_the_cost');
    expect(paid!.essenceCost).toBeGreaterThan(0);
    expect(paid!.probabilityBoost).toBe(0);
  });

  it('still resolves the generic set, so the un-authored path is untouched', () => {
    const resolved = resolveInterveneChoice(THE_OFFER, 1, GENERIC_CHOICES, 'intervene_withdraw');
    expect(resolved).toEqual(GENERIC_CHOICES[1]);
  });

  it('finds an authored card even when the step index is unknown', () => {
    // Fail-soft (NFP #4): no action snapshot in scope must not discard a pick
    // that came from a card the surface rendered.
    const resolved = resolveInterveneChoice(THE_OFFER, undefined, GENERIC_CHOICES, 'whisper_the_cost');
    expect(resolved!.id).toBe('whisper_the_cost');
  });

  it('returns undefined for an id neither producer offers', () => {
    expect(resolveInterveneChoice(THE_OFFER, 1, GENERIC_CHOICES, 'no_such_choice')).toBeUndefined();
  });

  it('tolerates a template with no authored hand at all', () => {
    const resolved = resolveInterveneChoice(undefined, 0, GENERIC_CHOICES, 'intervene_support');
    expect(resolved).toEqual(GENERIC_CHOICES[0]);
  });

  /**
   * The population guard, and the reason this file sits next to the adapter: the
   * authored ids exist to match aftermath variant keys. If that stops being true
   * the resolver still passes while the endings go dark again.
   */
  it('resolves every aftermath variant key on the templates keyed to authored cards', () => {
    const authoredKeyed = UNIFIED_ACTION_TEMPLATES.filter((t) => {
      const cfg = t.aftermathConfig;
      const keys = Object.keys(cfg?.variants ?? {});
      if (!cfg || keys.length === 0) return false;
      const ids = new Set((t.authoredChoices?.[cfg.branchOnStep] ?? []).map((c) => c.id));
      return keys.every((k) => ids.has(k));
    });

    expect(authoredKeyed.length).toBeGreaterThanOrEqual(25);

    for (const template of authoredKeyed) {
      const cfg = template.aftermathConfig!;
      for (const key of Object.keys(cfg.variants)) {
        const resolved = resolveInterveneChoice(template, cfg.branchOnStep, GENERIC_CHOICES, key);
        expect(resolved, `${template.id} variant '${key}' resolves to no card`).toBeDefined();
        expect(resolved!.id).toBe(key);
      }
    }
  });
});
