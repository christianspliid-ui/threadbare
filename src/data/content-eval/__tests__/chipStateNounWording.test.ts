/**
 * THR-1472 — a chip's `stateNoun` must be a character-sheet word.
 *
 * Director ruling, 2026-09-12, on the Snow on the Pass aftermath: `SCAR ·
 * EXHAUSTED` works because it is *"generic & self-sufficient in its explanatory
 * power and so works in different contexts"*; `SCAR · THE NERVE THEY CAME DOWN
 * WITH` does not, because reading it requires holding that one encounter in
 * memory. The second is a souvenir wearing a state's clothes.
 *
 * Every rule below is **falsified first** — the pre-fix shape must go red, or the
 * green arm is proving nothing. That matters more than usual here: the previous
 * anchor gate (Law 56 clause 2) passed both of the director's examples, because
 * `$actor` resolves perfectly well. The defect was never resolvability, so a test
 * that only asserts the fixed corpus is green would be re-testing clause 2.
 */

import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { checkCompositionContract, chipStateNounWordingViolations } from '../compositionContract';
import {
  CHIP_STATE_NOUN_MAX_WORDS,
  CHIP_STATE_NOUN_REPUTATION_FORM,
} from '../nudgeAuthoringConstants';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';

/** One authored chip on a template's fallback face. */
function withChip(stateNoun: Record<string, unknown>, category = 'scar'): UnifiedActionTemplate {
  return {
    id: 'encounter.test.thr1472_fixture',
    name: 'THR-1472 fixture',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'They came down the far side.',
        changes: [
          {
            id: 'fixture.the_chip',
            kind: 'trait',
            title: 'The Chip',
            detail: 'Something changed.',
            polarity: 'loss',
            category,
            direction: 'loss',
            stateNoun,
          },
        ],
        reactions: [{ id: 'fixture.walk', label: 'Walk on', intent: 'Go.', effects: [] }],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

describe('THR-1472 — the noun runs long', () => {
  it("flags the director's own counter-example", () => {
    const out = chipStateNounWordingViolations(
      withChip({ text: 'the nerve they came down with', entityId: 'trait.condition.shaken' }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('scene phrase');
    // The message has to carry the count and the cap, or an author cannot act on
    // it without opening the gate's source.
    expect(out[0]).toContain(`runs 6 words (max ${CHIP_STATE_NOUN_MAX_WORDS})`);
  });

  it("passes the director's own positive example", () => {
    expect(
      chipStateNounWordingViolations(
        withChip({ text: 'exhausted', entityId: 'trait.condition.exhausted' }),
      ),
    ).toEqual([]);
  });

  it('is a strict cap, not a floor — the boundary itself is legal', () => {
    // `toBeCloseTo`-style care about the edge: a cap tested only well past its
    // value cannot tell an off-by-one from a correct bound.
    const atCap = 'the causeway lamp'.split(' ');
    expect(atCap).toHaveLength(CHIP_STATE_NOUN_MAX_WORDS);
    expect(
      chipStateNounWordingViolations(withChip({ text: 'the causeway lamp', entityId: '$artifact' })),
    ).toEqual([]);
    expect(
      chipStateNounWordingViolations(withChip({ text: 'the old causeway lamp', entityId: '$artifact' })),
    ).toHaveLength(1);
  });
});

describe('THR-1472 — the anchor is the carrier, not the state', () => {
  for (const anchor of ['$actor', '$target', '$cast:stranger']) {
    it(`flags '${anchor}' on a categorised chip`, () => {
      const out = chipStateNounWordingViolations(
        withChip({ text: 'shaken', entityId: anchor, visualKind: 'agent' }),
      );
      expect(out).toHaveLength(1);
      expect(out[0]).toContain('anchors its noun to the carrier');
    });
  }

  it('accepts an anchor that names a state object', () => {
    expect(
      chipStateNounWordingViolations(
        withChip({ text: 'shaken', entityId: 'trait.condition.shaken', visualKind: 'attachment' }),
      ),
    ).toEqual([]);
  });

  it('accepts `$artifact` — the state object the band mints', () => {
    expect(
      chipStateNounWordingViolations(
        withChip({ text: 'The Causeway Lamp', entityId: '$artifact', visualKind: 'artifact' }),
      ),
    ).toEqual([]);
  });
});

describe('THR-1472 — scope and exemptions', () => {
  it('exempts the reputation form, which the anchor half would otherwise fail', () => {
    // It sits exactly *at* the cap, so the word half never touches it — the
    // exemption is load-bearing only for the anchor half, where its `$target` is
    // the correct referent rather than the tell of a scene phrase. Asserting the
    // width here so a future tightening of the cap cannot silently make the
    // reputation form depend on the exemption for a second reason.
    expect(CHIP_STATE_NOUN_REPUTATION_FORM.split(' ')).toHaveLength(CHIP_STATE_NOUN_MAX_WORDS);
    // Falsify: the identical anchor under any other text is a finding.
    expect(
      chipStateNounWordingViolations(
        withChip({ text: 'standing', entityId: '$target', visualKind: 'location' }),
      ),
    ).toHaveLength(1);
    expect(
      chipStateNounWordingViolations(
        withChip({
          text: CHIP_STATE_NOUN_REPUTATION_FORM,
          entityId: '$target',
          visualKind: 'location',
          tooltipId: 'ui.reputation_with',
        }),
      ),
    ).toEqual([]);
  });

  it('ignores an uncategorised change — it is not drawn as a tag', () => {
    const uncategorised = withChip({ text: 'the nerve they came down with', entityId: '$actor' });
    // Falsify the guard: the identical noun on a *categorised* chip is a finding,
    // so a green result here is the scoping and not an inert predicate.
    expect(chipStateNounWordingViolations(uncategorised)).toHaveLength(1);
    delete (uncategorised.aftermathConfig!.fallback!.changes[0] as unknown as Record<string, unknown>).category;
    expect(chipStateNounWordingViolations(uncategorised)).toEqual([]);
  });

  it('ignores a chip that declares no `stateNoun` at all', () => {
    const none = withChip({ text: 'the nerve they came down with', entityId: '$actor' });
    expect(chipStateNounWordingViolations(none)).toHaveLength(1);
    delete (none.aftermathConfig!.fallback!.changes[0] as unknown as Record<string, unknown>).stateNoun;
    expect(chipStateNounWordingViolations(none)).toEqual([]);
  });
});

describe('THR-1472 — the vertical slice is migrated', () => {
  const sliceTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.slice.'));

  it('finds the slice to measure', () => {
    // A population guard: an empty filter would make the assertion below pass
    // vacuously, which is the failure mode this repo names most often.
    expect(sliceTemplates.length).toBeGreaterThan(5);
  });

  it('leaves no chip in the slice naming a scene phrase or a carrier', () => {
    const offenders = sliceTemplates.flatMap(t =>
      chipStateNounWordingViolations(t).map(v => `${t.id}: ${v}`),
    );
    expect(offenders).toEqual([]);
  });
});

/**
 * THR-1480 — the promotion arm.
 *
 * The rule shipped advisory: `check-encounter.ts` printed these through `[warn]`,
 * which never touches the exit code, because 57 retrofit findings were still
 * standing and gating would have turned a green corpus red for work ticketed here.
 * Both halves of that bargain are now due, so both are asserted — the corpus is
 * drained, *and* a finding actually fails the contract. Asserting only the drained
 * corpus would leave the gate advisory and the corpus free to drift straight back.
 */
describe('THR-1480 — the clamp follows the corpus', () => {
  const encounters = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.'));

  it('finds the corpus to measure', () => {
    // Population guard — an empty filter passes the sweep below vacuously.
    expect(encounters.length).toBeGreaterThan(50);
  });

  it('leaves no chip in the whole encounter corpus naming a scene phrase or a carrier', () => {
    const offenders = encounters.flatMap(t =>
      chipStateNounWordingViolations(t).map(v => `${t.id}: ${v}`),
    );
    expect(offenders).toEqual([]);
  });

  it('reaches `checkCompositionContract` as a gating aftermath violation', () => {
    const offending = withChip({ text: 'the nerve they came down with', entityId: '$actor' });
    const found = checkCompositionContract(offending).violations.filter(
      v => v.block === 'aftermath' && v.message.includes('THR-1472'),
    );
    expect(found).toHaveLength(1);
  });

  it('falsification: the same chip with a character-sheet word raises no such violation', () => {
    // Without this arm the assertion above could be satisfied by any aftermath
    // violation the fixture happens to trip — it is a bare fixture, so it trips
    // several — rather than by this rule firing.
    const compliant = withChip({ text: 'shaken', entityId: 'trait.condition.shaken' });
    const found = checkCompositionContract(compliant).violations.filter(
      v => v.block === 'aftermath' && v.message.includes('THR-1472'),
    );
    expect(found).toEqual([]);
  });
});
