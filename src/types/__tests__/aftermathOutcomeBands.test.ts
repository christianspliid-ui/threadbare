/**
 * THR-969 — outcome-keyed aftermath variants.
 *
 * The gap this closes: `BranchAwareAftermathConfig` keyed only on the choiceId of
 * one step, so a choice-less encounter (`encounter.slice.unsafe_bridge`) could
 * only ever render its single `fallback` — "crossed clean" and "fell in the river"
 * produced identical aftermath prose by construction.
 *
 * These tests pin the resolution order (choice → outcome band → base variant →
 * fallback), the fail-soft degradation on an unauthored band, and the byte-identical
 * behaviour of every band-less config that shipped before this field existed.
 */

import { describe, it, expect } from 'vitest';
import {
  applyAftermathOutcomeBand,
  resolveAftermathVariant,
  type AftermathVariant,
  type BranchAwareAftermathConfig,
} from '../unifiedAction';
import type { EncounterChoiceMemory } from '../encounter';

/** A choice-less config, the `encounter.slice.unsafe_bridge` shape: fallback only. */
function bridgeShapedConfig(): BranchAwareAftermathConfig {
  return {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The river keeps moving under the bridge.',
      changes: [],
      reactionPrompt: 'Take stock.',
      reactions: [
        { id: 'walk_on', label: 'Walk on', intent: 'The road goes on.', effects: [] },
      ],
      byOutcome: {
        critical_success: {
          overview: 'The planks held without a sound, and the far bank came up dry.',
        },
        critical_failure: {
          overview: 'The third plank went, and the river took the rest of the afternoon.',
          reactionPrompt: 'Count what the water kept.',
          reactions: [
            { id: 'haul_out', label: 'Haul out', intent: 'Wet, but ashore.', effects: [] },
          ],
        },
      },
    },
  };
}

describe('THR-969 — outcome-keyed aftermath variants', () => {
  describe('the ending reflects how it ended', () => {
    it('resolves different overviews for different outcomes on the SAME choice history', () => {
      const config = bridgeShapedConfig();

      const clean = resolveAftermathVariant(config, undefined, 'critical_success');
      const fell = resolveAftermathVariant(config, undefined, 'critical_failure');

      expect(clean.overview).toBe('The planks held without a sound, and the far bank came up dry.');
      expect(fell.overview).toBe('The third plank went, and the river took the rest of the afternoon.');
      // The defect this ticket exists to kill: these were byte-identical before.
      expect(clean.overview).not.toBe(fell.overview);
    });

    it('layers band overrides field by field, keeping un-restated fields from the base variant', () => {
      const config = bridgeShapedConfig();

      // critical_success authors ONLY overview — prompt and reactions must survive.
      const clean = resolveAftermathVariant(config, undefined, 'critical_success');
      expect(clean.reactionPrompt).toBe('Take stock.');
      expect(clean.reactions?.map(r => r.id)).toEqual(['walk_on']);

      // critical_failure authors overview + prompt + reactions — all three replaced.
      const fell = resolveAftermathVariant(config, undefined, 'critical_failure');
      expect(fell.reactionPrompt).toBe('Count what the water kept.');
      expect(fell.reactions?.map(r => r.id)).toEqual(['haul_out']);

      // `changes` was authored by neither band, so both keep the base's.
      expect(clean.changes).toEqual([]);
      expect(fell.changes).toEqual([]);
    });
  });

  describe('fail-soft on an unauthored band (NFP #4)', () => {
    it('degrades to the un-banded variant when the outcome has no authored band', () => {
      const config = bridgeShapedConfig();

      // 'success' is deliberately NOT in byOutcome.
      const plain = resolveAftermathVariant(config, undefined, 'success');

      expect(plain.overview).toBe('The river keeps moving under the bridge.');
      expect(plain.reactionPrompt).toBe('Take stock.');
    });

    it('degrades to the un-banded variant when the outcome is absent entirely', () => {
      const config = bridgeShapedConfig();

      const noOutcome = resolveAftermathVariant(config, undefined, undefined);

      expect(noOutcome.overview).toBe('The river keeps moving under the bridge.');
    });

    it('never throws on an outcome nobody wrote prose for', () => {
      const config = bridgeShapedConfig();
      const everyOutcome = [
        'success',
        'failure',
        'contested_won',
        'contested_lost',
        'critical_success',
        'critical_failure',
        'success_at_cost',
      ] as const;

      for (const outcome of everyOutcome) {
        expect(() => resolveAftermathVariant(config, undefined, outcome)).not.toThrow();
        expect(resolveAftermathVariant(config, undefined, outcome).overview).toBeTruthy();
      }
    });
  });

  describe('resolution order: choice → outcome band → base variant → fallback', () => {
    const choiceKeyed: BranchAwareAftermathConfig = {
      branchOnStep: 1,
      variants: {
        paid: {
          overview: 'Paid the toll.',
          changes: [],
          byOutcome: {
            critical_failure: { overview: 'Paid the toll and lost the purse anyway.' },
          },
        },
        forded: { overview: 'Took the ford.', changes: [] },
      },
      fallback: { overview: 'Crossed somehow.', changes: [] },
    };

    const choseAtStep1 = (choiceId: string): readonly EncounterChoiceMemory[] =>
      [{ stepIndex: 1, choiceId }] as unknown as readonly EncounterChoiceMemory[];

    it('picks the choice variant first, THEN layers the band on that variant', () => {
      const paidBadly = resolveAftermathVariant(choiceKeyed, choseAtStep1('paid'), 'critical_failure');
      expect(paidBadly.overview).toBe('Paid the toll and lost the purse anyway.');
    });

    it('keeps the choice variant when that variant has no band for the outcome', () => {
      const fordedBadly = resolveAftermathVariant(choiceKeyed, choseAtStep1('forded'), 'critical_failure');
      expect(fordedBadly.overview).toBe('Took the ford.');
    });

    it('falls back when the recorded choiceId matches no variant', () => {
      const unknown = resolveAftermathVariant(choiceKeyed, choseAtStep1('swam'), 'success');
      expect(unknown.overview).toBe('Crossed somehow.');
    });

    it('falls back when no choice was recorded at the branch step', () => {
      const noChoice = resolveAftermathVariant(choiceKeyed, choseAtStep1('paid').map(
        c => ({ ...c, stepIndex: 99 }),
      ) as unknown as readonly EncounterChoiceMemory[], 'success');
      expect(noChoice.overview).toBe('Crossed somehow.');
    });
  });

  describe('regression — band-less configs resolve byte-identically to before (NFP #6)', () => {
    /** The shipped `encounter.slice.unsafe_bridge` config, verbatim, with no byOutcome. */
    const shippedBandless: BranchAwareAftermathConfig = {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The river keeps moving under the bridge, and the keeper keeps taking coppers. ' +
          'Every crossing is a vote on how long that lasts.',
        changes: [],
        reactions: [
          {
            id: 'slice.bridge.walk_on',
            label: 'Walk on',
            intent: 'The road goes on from either bank.',
            effects: [],
          },
        ],
      },
    };

    it('returns the fallback object itself — same reference, no spread, no new object', () => {
      for (const outcome of ['success', 'critical_failure', undefined] as const) {
        const resolved = resolveAftermathVariant(shippedBandless, undefined, outcome);
        // Identity, not just deep equality: a band-less config must not even be rebuilt.
        expect(resolved).toBe(shippedBandless.fallback);
      }
    });

    it('returns the choice variant object itself for a band-less choice-keyed config', () => {
      const bandlessChoiceKeyed: BranchAwareAftermathConfig = {
        branchOnStep: 0,
        variants: { a: { overview: 'A.', changes: [] } },
        fallback: { overview: 'F.', changes: [] },
      };
      const resolved = resolveAftermathVariant(
        bandlessChoiceKeyed,
        [{ stepIndex: 0, choiceId: 'a' }] as unknown as readonly EncounterChoiceMemory[],
        'critical_success',
      );
      expect(resolved).toBe(bandlessChoiceKeyed.variants.a);
    });
  });

  describe('applyAftermathOutcomeBand — the layering primitive in isolation', () => {
    const base: AftermathVariant = {
      overview: 'Base.',
      changes: [],
      reactionPrompt: 'Base prompt.',
      byOutcome: { success: { overview: 'Banded.' } },
    };

    it('is a no-op without an outcome', () => {
      expect(applyAftermathOutcomeBand(base, undefined)).toBe(base);
    });

    it('is a no-op for an outcome with no authored band', () => {
      expect(applyAftermathOutcomeBand(base, 'failure')).toBe(base);
    });

    it('overrides only the authored fields', () => {
      const banded = applyAftermathOutcomeBand(base, 'success');
      expect(banded.overview).toBe('Banded.');
      expect(banded.reactionPrompt).toBe('Base prompt.');
    });

    it('does not mutate the variant it layers over', () => {
      applyAftermathOutcomeBand(base, 'success');
      expect(base.overview).toBe('Base.');
    });
  });
});
