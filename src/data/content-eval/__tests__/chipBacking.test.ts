/**
 * UI Law 56 — every consequence chip is backed by a write. THR-1141.
 *
 * Christian's ruling, 2026-08-16: *"the chips specifically show only things that
 * have updated the game state … we do not show prose in this section."* This file
 * is the machine half of that rule, and it has two jobs the corpus itself cannot
 * do:
 *
 *   1. **Falsify the gate.** The shipped Unsafe Bridge shape — an authored chip
 *      on a face whose one reaction carries `effects: []` — must go red. A gate
 *      that has never been shown failing is not evidence (the `live_layer`
 *      lesson); the fixture below is that exact shape, rebuilt rather than
 *      described, so a future refactor that quietly stops detecting it fails
 *      here rather than shipping.
 *   2. **Hold the whole pool, not the `encounter.*` slice.** `check:encounter`
 *      scopes itself to ids beginning `encounter.` (its `ENCOUNTER_ID_PREFIXES`),
 *      which is 191 of the 683 live templates. Eleven of the corpus's Law 56
 *      violations at filing sat *outside* that prefix — `healer.quest.*`,
 *      `mentorship.*` — where the gate could never have seen them. Vitest has no
 *      such prefix, so the corpus assertion lives here and covers everything the
 *      player can actually be shown.
 *
 * The gate is a **floor**, deliberately: it asks whether the ending carrying a
 * chip performs any qualifying write, never whether that write is the one the
 * chip's sentence describes. No machine reads the sentence. Per-chip semantic
 * verdicts are the author's, recorded in the sweep's PR table.
 */

import { describe, expect, it } from 'vitest';
import type {
  AftermathVariant,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { checkCompositionContract } from '../compositionContract';

/** The Law 56 violations a template reports, as `changeId@face` strings. */
function law56Violations(template: UnifiedActionTemplate): readonly string[] {
  return checkCompositionContract(template)
    .violations.filter(v => v.block === 'aftermath' && v.message.includes('Law 56'))
    .map(v => {
      const match = /change '([^']+)' on (\S+)/u.exec(v.message);
      return `${match?.[1] ?? '?'}@${match?.[2] ?? '?'}`;
    });
}

/**
 * The shipped shape, rebuilt: one authored chip, one reaction, no effects.
 *
 * Deliberately minimal and deliberately *not* a copy of the live template — the
 * live one is now fixed, so copying it would test nothing, and a red-baseline
 * fixture copy imports type errors besides.
 */
function unsafeBridgeShape(overrides: Partial<AftermathVariant> = {}): UnifiedActionTemplate {
  return {
    id: 'encounter.test.law56_fixture',
    name: 'Law 56 fixture',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The river keeps moving under the bridge.',
        changes: [
          {
            id: 'fixture.the_planking',
            kind: 'shell_state',
            title: 'The Bridge, Measured',
            detail: 'The ford upstream is a real option, not a rumour.',
            polarity: 'info',
            category: 'path',
            direction: 'opens',
          },
        ],
        reactions: [
          {
            id: 'fixture.walk_on',
            label: 'Walk on',
            intent: 'The road goes on from either bank.',
            effects: [],
          },
        ],
        ...overrides,
      },
    },
  } as unknown as UnifiedActionTemplate;
}

describe('Law 56 — the gate goes red on the shipped shape', () => {
  it('flags an authored chip whose ending performs no write', () => {
    expect(law56Violations(unsafeBridgeShape())).toEqual(['fixture.the_planking@fallback']);
  });

  it('the message names the chip, the face, and both fix routes', () => {
    const [message] = checkCompositionContract(unsafeBridgeShape())
      .violations.filter(v => v.message.includes('Law 56'))
      .map(v => v.message);
    expect(message).toContain("change 'fixture.the_planking'");
    expect(message).toContain('fallback');
    // Route 1 (back it) and route 2 (fold it) both offered — a violation that
    // names only one route pushes every author toward that one.
    expect(message).toMatch(/Back it/u);
    expect(message).toMatch(/fold the/u);
  });

  it('goes green once the same ending carries a real write', () => {
    const backed = unsafeBridgeShape({
      reactions: [
        {
          id: 'fixture.walk_on',
          label: 'Walk on',
          intent: 'The road goes on from either bank.',
          effects: [
            {
              kind: 'intelligence',
              category: 'trade_route',
              label: 'The river crossing, measured',
              detail: 'The ford lies half a day upstream.',
              targetAgentId: '$actor',
            },
          ],
        },
      ],
    } as Partial<AftermathVariant>);
    expect(law56Violations(backed)).toEqual([]);
  });

  it('a printing-only effect does not back a chip', () => {
    // `recent_event` is the anti-pattern in effect form: it emits a line and
    // leaves nothing. If this ever passes, the backing set has been widened to
    // include scene dressing and the law has quietly stopped meaning anything.
    const dressing = unsafeBridgeShape({
      reactions: [
        {
          id: 'fixture.walk_on',
          label: 'Walk on',
          intent: 'The road goes on from either bank.',
          effects: [{ kind: 'recent_event', message: 'The bridge held.' }],
        },
      ],
    } as Partial<AftermathVariant>);
    expect(law56Violations(dressing)).toEqual(['fixture.the_planking@fallback']);
  });

  it('a write on a different band does not back this one', () => {
    // `applyAftermathOutcomeBand` substitutes reactions *wholesale*, so a seed on
    // `critical_success` is unreachable from the base face. A gate that unioned
    // the levels — as `allAftermathChanges` deliberately does for other
    // questions — would credit it and pass the exact defect this exists to catch.
    const elsewhere = unsafeBridgeShape({
      byOutcome: {
        critical_success: {
          overview: 'They read the boards.',
          reactions: [
            {
              id: 'fixture.crit',
              label: 'Go on',
              intent: 'Onward.',
              effects: [
                {
                  kind: 'encounter_seed',
                  templateId: 'encounter.slice.unsafe_bridge',
                  targetAgentId: '$actor',
                  delayTicks: 12,
                  seedLabel: 'Back at the crossing.',
                },
              ],
            },
          ],
        },
      },
    } as Partial<AftermathVariant>);
    expect(law56Violations(elsewhere)).toContain('fixture.the_planking@fallback');
  });
});

describe('Law 56 — the shipped corpus', () => {
  it('no live template renders a chip its ending did not write', () => {
    const offenders = UNIFIED_ACTION_TEMPLATES.flatMap(template =>
      law56Violations(template).map(v => `${template.id} → ${v}`),
    );
    // Listed, not counted: a count regression says only that the number moved,
    // and the whole point of the sweep was that every chip has a named verdict.
    expect(offenders).toEqual([]);
  });

  it('covers more than `check:encounter` can reach', () => {
    // Guards the reason this assertion lives in vitest at all. If the pool ever
    // becomes all-`encounter.*`, this test is redundant and should be deleted
    // rather than left as decoration.
    const outsidePrefix = UNIFIED_ACTION_TEMPLATES.filter(
      t => !t.id.startsWith('encounter.') && t.aftermathConfig !== undefined,
    );
    expect(outsidePrefix.length).toBeGreaterThan(0);
  });
});
