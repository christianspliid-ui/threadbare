/**
 * THR-1130 — the two rules the batch-1 sample play produced.
 *
 * Both come from Christian playing The Grateful Kin on 2026-08-17, and both are
 * the same class of defect: a chip that renders, passes every gate, and tells
 * the player nothing they can act on.
 *
 *   1. **`$target` is an anchor sentinel.** Several aftermath effects write
 *      their durable fact onto the agent the encounter was *aimed at* rather
 *      than the actor — `favor_creation` mints `owes_favor` with **debtor =
 *      target, creditor = actor**. A chip reporting that write is a sentence
 *      about the target, and until this ticket the chip-side vocabulary had no
 *      way to say so, so the shipped content anchored `$actor`: the other end of
 *      the edge. The effect side has had the sentinel since THR-695.
 *   2. **A `reputation_tally` chip is a parity violation.** Per-Reach tallies
 *      render only in `TalliesDebugTab`, so a chip naming one reports a quantity
 *      with no player surface (Law 13, THR-1136 §5).
 *
 * Each rule is tested by **falsifying it first** — the pre-fix shape must go red
 * — because a gate that has never been shown failing is not evidence. Rule 2's
 * red arm matters most: the rule shipped as prose in `laws.md` on 2026-08-16 and
 * nothing enforced it, so fifteen tally chips sat in the vertical slice reading
 * green through every gate, including on the two encounters handed to the
 * director to sample.
 */

import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { WorldGraph } from '../../../engine/graph';
import {
  checkCompositionContract,
  chipAnchorViolations,
  chipVisibilityParityViolations,
} from '../compositionContract';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import {
  ANCHOR_SENTINEL_TARGET,
  classifyAnchorDeclaration,
  resolveAnchorDeclaration,
} from '../chipAnchorDeclarations';

/** A template carrying one authored chip on its fallback, plus a real write. */
function chipShape(
  change: Record<string, unknown>,
  effects: readonly Record<string, unknown>[] = [
    { kind: 'favor_creation', magnitudeRange: [0.2, 0.4], context: 'a kindness repaid' },
  ],
): UnifiedActionTemplate {
  return {
    id: 'encounter.test.thr1130_fixture',
    name: 'THR-1130 fixture',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The bowl arrives unasked.',
        changes: [change],
        reactions: [{ id: 'fixture.accept', label: 'Accept', intent: 'Take it.', effects }],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

const FAVOUR_CHIP = {
  id: 'fixture.a_favour_owed',
  kind: 'reputation',
  title: 'A Favour Owed',
  detail: '{target} owes them a favour now.',
  polarity: 'gain',
  category: 'bond',
  direction: 'gain',
  stateNoun: { text: 'a favour owed', entityId: ANCHOR_SENTINEL_TARGET, visualKind: 'agent' },
};

describe('THR-1130 rule 1 — `$target` is a chip anchor sentinel', () => {
  const noCastKeys = { supportKeys: new Set<string>() };

  it('classifies as its own form, not as a literal id', () => {
    // The pre-fix behaviour: `$target` fell through every sentinel branch to the
    // literal-id arm, which rejected it as "resolves to no shipped attachment
    // template". An author following the error message would have been told to
    // pick a different anchor, not that the right one was missing.
    expect(classifyAnchorDeclaration(ANCHOR_SENTINEL_TARGET, noCastKeys)).toEqual({
      ok: true,
      form: 'target',
    });
  });

  it('is offered by name when an unknown sentinel is rejected', () => {
    const verdict = classifyAnchorDeclaration('$debtor', noCastKeys);
    expect(verdict.ok).toBe(false);
    // The error enumerates the legal forms, so a stale list silently hides the
    // one sentinel that would have solved the author's problem.
    expect(verdict.ok === false && verdict.reason).toContain('$target');
  });

  it('resolves to the action target at render, and only to it', () => {
    const graph = {} as WorldGraph;
    const context = {
      graph,
      actorId: 'agent_traveler',
      targetId: 'agent_innkeeper',
      castNodeIdByKey: new Map<string, string>(),
    };
    expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_TARGET, context)).toBe('agent_innkeeper');
    // The whole point of the ticket: the two ends of the edge stay distinct.
    expect(resolveAnchorDeclaration('$actor', context)).toBe('agent_traveler');
  });

  it('fails soft to undefined when the encounter targeted nobody', () => {
    // Plenty of encounters target a place or nothing at all. The chip then
    // renders as plain text — the tier it had before it declared anything —
    // rather than a link to nowhere (NFP #4).
    expect(
      resolveAnchorDeclaration(ANCHOR_SENTINEL_TARGET, {
        graph: {} as WorldGraph,
        actorId: 'agent_traveler',
        targetId: undefined,
        castNodeIdByKey: new Map<string, string>(),
      }),
    ).toBeUndefined();
  });

  it('raises no anchor violation on a chip that uses it', () => {
    // Scoped to the anchor rule on purpose. The bare fixture also trips the
    // byOutcome floor and the `concepts` rule, which are real and unrelated —
    // asserting "no aftermath violations at all" would make this test a
    // referendum on the whole contract and it would break on any future rule.
    expect(chipAnchorViolations(chipShape(FAVOUR_CHIP))).toEqual([]);
  });
});

describe('THR-1130 rule 2 — a `reputation_tally` chip fails visibility parity', () => {
  /** The shipped shape: `slice.kin.the_room_carries_it`, rebuilt not copied. */
  const TALLY_CHIP = {
    id: 'fixture.the_room_carries_it',
    kind: 'reputation_tally',
    title: 'The Room Carries It',
    detail: 'By morning their name is in three more taprooms.',
    polarity: 'gain',
    category: 'bond',
    direction: 'gain',
    stateNoun: { text: 'their name on this road', tooltipId: 'ui.standing' },
  };

  it('goes red on the shape that shipped', () => {
    const violations = chipVisibilityParityViolations(chipShape(TALLY_CHIP));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("change 'fixture.the_room_carries_it'");
    expect(violations[0]).toContain('no player surface');
  });

  it('names the fold route, and says the effect survives', () => {
    // An author who reads "delete the chip" without "the effect keeps running"
    // deletes the write too, and the threshold traits stop minting.
    const [message] = chipVisibilityParityViolations(chipShape(TALLY_CHIP));
    expect(message).toContain('fold its sentence into the band overview');
    expect(message).toMatch(/tally effect keeps running/u);
  });

  it('surfaces through the composition contract, not only the helper', () => {
    // The helper being right is worth nothing if it is not wired into the gate
    // `check:encounter` actually runs.
    const messages = checkCompositionContract(chipShape(TALLY_CHIP))
      .violations.filter(v => v.block === 'aftermath')
      .map(v => v.message);
    expect(messages.some(m => m.includes('Law 13 visibility parity'))).toBe(true);
  });

  it('leaves a `reputation_tally` *effect* alone — only the chip is banned', () => {
    // The distinction the rule turns on. The tally keeps steering scoring and
    // gating and keeps minting the Whispered/Known/Legendary traits; a minted
    // trait is sheet-visible and reports normally. Banning the effect would be a
    // different and much larger rule, and not the one Christian gave.
    const tallyEffectOnly = chipShape(FAVOUR_CHIP, [
      { kind: 'reputation_tally', key: 'slice.road_repute', delta: 1 },
      { kind: 'favor_creation', magnitudeRange: [0.2, 0.4], context: 'a kindness repaid' },
    ]);
    expect(chipVisibilityParityViolations(tallyEffectOnly)).toEqual([]);
  });

  it('holds across the shipped corpus of retrofitted encounters', () => {
    // The sweep's own assertion. `check:encounter` ratchets un-retrofitted
    // templates, so this pins the set that is actually held to the contract —
    // the batch-1 six — against the fifteen-chip regression this ticket fixed.
    const retrofitted = ['unsafe_bridge', 'bargain_at_crossroads', 'swindled_family',
      'swindler_found', 'grateful_kin', 'full_moon_collection'];
    const offenders: string[] = [];
    for (const suffix of retrofitted) {
      const template = UNIFIED_ACTION_TEMPLATES
        .find(t => t.id === `encounter.slice.${suffix}`);
      // Asserted, not assumed: a renamed or dropped template would otherwise
      // make this sweep pass over an empty set and report the corpus clean.
      expect(template, `encounter.slice.${suffix} is in the catalog`).toBeDefined();
      offenders.push(...chipVisibilityParityViolations(template!));
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

/**
 * Ids the registry deliberately does not carry — see the twin note in
 * `narrativeSegmentTiers.test.tsx`. Constants, not quoted `tooltipId` strings,
 * so the corpus sweep in `conceptTooltipIds.test.ts` keeps its full strength
 * over genuinely authored ids while these stay readable as what they are.
 */
const UNREGISTERED_CONCEPT = 'ui.no_such_concept';
const UNREGISTERED_REACH = 'reach.not_a_reach';
const UNREGISTERED_ON_CONCEPTS = 'ui.nothing_here';

describe('THR-1172 — an anchored noun must be provably answerable', () => {
  // The clause already proved the `entityId` half (THR-1164). The `tooltipId`
  // half was accepted on **presence** alone, so a dangling concept id satisfied
  // the rule and shipped a noun that underlines and explains nothing — the
  // director's report, reduced to one field. Falsified first, per this file's
  // standing rule: the pre-fix shape must go red.

  it('passes a noun whose tooltip resolves', () => {
    expect(
      chipAnchorViolations(
        chipShape({ ...FAVOUR_CHIP, stateNoun: { ...FAVOUR_CHIP.stateNoun, tooltipId: 'ui.favour_owed' } }),
      ),
    ).toEqual([]);
  });

  it('FAILS a noun pointed at a tooltip that resolves to nothing', () => {
    const violations = chipAnchorViolations(
      chipShape({ ...FAVOUR_CHIP, stateNoun: { ...FAVOUR_CHIP.stateNoun, tooltipId: UNREGISTERED_CONCEPT } }),
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain(UNREGISTERED_CONCEPT);
    expect(violations[0]).toContain('resolves to nothing');
  });

  it('FAILS a tooltip-only noun with a dangling id — the anchor half cannot cover for it', () => {
    // Without an `entityId` the tooltip is the *whole* of what the noun offers,
    // so a dangling one is the entire promise broken rather than half of it.
    const { entityId: _dropped, ...nounWithoutAnchor } = FAVOUR_CHIP.stateNoun;
    const violations = chipAnchorViolations(
      chipShape({ ...FAVOUR_CHIP, stateNoun: { ...nounWithoutAnchor, tooltipId: UNREGISTERED_REACH } }),
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('resolves to nothing');
  });

  it('holds the same rule on a decorated `concepts` entry, not just the stateNoun', () => {
    const violations = chipAnchorViolations(
      chipShape({
        ...FAVOUR_CHIP,
        concepts: [{ text: 'a bed and a hearing', tooltipId: UNREGISTERED_ON_CONCEPTS }],
      }),
    );
    expect(violations.some(v => v.includes(UNREGISTERED_ON_CONCEPTS))).toBe(true);
  });

  it('the whole shipped catalog satisfies the stricter rule', () => {
    // The sweep, in-suite rather than only at the CLI: a future chip that adds a
    // dangling concept id fails here as well as in `check:chip-anchors`.
    const failing = UNIFIED_ACTION_TEMPLATES
      .map(t => ({ id: t.id, violations: chipAnchorViolations(t) }))
      .filter(r => r.violations.length > 0);
    expect(failing).toEqual([]);
  });
});
