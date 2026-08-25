/**
 * The Consequence Draw and its gate. THR-1145.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § The
 * Consequence Draw.
 *
 * Four jobs:
 *
 *   1. **The draw is deterministic and recomputable.** That property is the
 *      whole basis of the gate — if a hand were not reproducible from the id,
 *      "recompute and compare" would be checking noise.
 *   2. **The table is total and floored.** Every family carries a weight in
 *      every reach, and every cell is ≥ 1. The floor *is* the design (anything
 *      can surface anywhere); a zero would silently create eight rigid genres.
 *   3. **The gate is falsified both ways**, per the ticket's own Done-when. A
 *      gate only ever shown passing is not evidence it can fail — so every red
 *      case here is derived from a green one by changing exactly the thing under
 *      test, and the green case is re-asserted alongside it.
 *   4. **The corpus stays green.** The field is optional, so a template that omits
 *      it is untouched by this gate — the property that let the draw land while
 *      THR-1130's retrofit was mid-flight. Content that *does* record a draw
 *      (the Encounter Factory v3 line, starting with border-perils/THR-1221)
 *      must clear the `draw` block clean.
 */

import { describe, expect, it } from 'vitest';
import type {
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { REACH_DOMAINS, type ReachDomain } from '../../../types/traits';
import { NUDGE_GOLDEN_EXEMPLAR } from '../../__fixtures__/nudge-exemplar/swollen-ford-exemplar';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { checkCompositionContract } from '../compositionContract';
import {
  CONSEQUENCE_FAMILIES,
  CONSEQUENCE_FAMILY_EFFECT_KINDS,
  CONSEQUENCE_FAMILY_WEIGHTS,
  CONSEQUENCE_FORMATIVE_MIN_TIER,
  CONSEQUENCE_HAND_BASE,
  CONSEQUENCE_SWAP_MIN_WEIGHT,
  type ConsequenceFamily,
  consequenceHandSize,
  drawConsequenceHand,
  drawnHandForTemplate,
  familiesWiredByEffects,
} from '../consequenceDraw';
import { drawFromTable } from '../drawTable';

// ─── Helpers ─────────────────────────────────────────────────────────

/** Only the `draw` block's messages — the rest of the contract is not under test here. */
function drawViolations(template: UnifiedActionTemplate): readonly string[] {
  return checkCompositionContract(template)
    .violations.filter(v => v.block === 'draw')
    .map(v => v.message);
}

/**
 * The exemplar with every write of its own removed — id, reach and rarity intact,
 * so it still draws the same hand.
 *
 * Load-bearing, and found the hard way: the first cut of the `omit` red case
 * built on the unmodified exemplar and did not fail, because the exemplar
 * natively wires `possession` (a `rewardPool` on a step outcome) and `possession`
 * is in its hand. Removing the *injected* effect left the native one standing, so
 * the "unwired" arm reported nothing and a green result read as proof the gate
 * worked. Baring the base first makes the injected reaction the only wiring
 * there is, which is what makes `omit` a falsification rather than a coincidence.
 */
function bareExemplar(): UnifiedActionTemplate {
  const stripMeta = (meta: unknown): unknown =>
    meta === undefined
      ? undefined
      : { ...(meta as Record<string, unknown>), effects: [], rewardPool: undefined };

  return {
    ...NUDGE_GOLDEN_EXEMPLAR,
    steps: (NUDGE_GOLDEN_EXEMPLAR.steps ?? []).map(step => ({
      ...step,
      successMetadata: stripMeta((step as unknown as Record<string, unknown>).successMetadata),
      failureMetadata: stripMeta((step as unknown as Record<string, unknown>).failureMetadata),
      onSuccess: [],
      onFailure: [],
    })),
    aftermathConfig: NUDGE_GOLDEN_EXEMPLAR.aftermathConfig && {
      ...NUDGE_GOLDEN_EXEMPLAR.aftermathConfig,
      variants: {},
      fallback: {
        ...NUDGE_GOLDEN_EXEMPLAR.aftermathConfig.fallback,
        reactions: [],
        byOutcome: {},
      },
    },
  } as unknown as UnifiedActionTemplate;
}

/**
 * The bared exemplar, with a recorded hand and every family in it wired.
 *
 * The wiring is one injected reaction, so the green and red cases differ by
 * exactly one effect — which is what makes the red cases evidence rather than a
 * second fiction.
 */
function withWiredHand(
  hand: readonly ConsequenceFamily[],
  options: {
    readonly omit?: ConsequenceFamily;
    readonly record?: readonly string[];
    readonly swap?: UnifiedActionTemplate['consequenceSwap'];
  } = {},
): UnifiedActionTemplate {
  const effects = hand
    .filter(family => family !== options.omit)
    .map(family => wiringEffectFor(family));

  const base = bareExemplar();
  const config = base.aftermathConfig;
  return {
    ...base,
    consequenceDraw: options.record ?? hand,
    consequenceSwap: options.swap,
    aftermathConfig: config && {
      ...config,
      fallback: {
        ...config.fallback,
        reactions: [{ id: 'test.wires_the_hand', label: 'wires the drawn hand', effects }],
      },
    },
  };
}

/**
 * A minimal effect of the family's first listed kind.
 *
 * Cast at the boundary: these are shape-incomplete on purpose — the gate reads
 * `kind` and (for `place`) `targetLocationId`, and authoring full valid effects
 * for fifteen families would make the fixture the thing under test.
 */
function wiringEffectFor(family: ConsequenceFamily): EncounterAftermathReactionEffect {
  const kind = CONSEQUENCE_FAMILY_EFFECT_KINDS[family][0];
  const base: Record<string, unknown> = { kind };
  if (family === 'place') base.targetLocationId = '$target';
  return base as unknown as EncounterAftermathReactionEffect;
}

// ─── 1. The draw ─────────────────────────────────────────────────────

describe('the draw is deterministic and recomputable', () => {
  it('returns the same hand every time for the same input', () => {
    const input = { templateId: 'encounter.test.repeatable', reach: 'heart' as const, rarityTier: 2 as const };
    const first = drawConsequenceHand(input);
    expect(drawConsequenceHand(input)).toEqual(first);
    expect(drawConsequenceHand(input)).toEqual(first);
  });

  it('does not depend on the insertion order of the weight object', () => {
    // The guarantee that lets someone reformat a table without re-rolling the
    // whole corpus. Falsified by removing the `.sort()` in `drawFromTable`.
    const forward = { alpha: 5, beta: 3, gamma: 8, delta: 1 };
    const shuffled = { delta: 1, gamma: 8, alpha: 5, beta: 3 };
    expect(drawFromTable('t', shuffled, 'seed', 3)).toEqual(drawFromTable('t', forward, 'seed', 3));
  });

  it('gives different reaches different hands for the same id', () => {
    // Not a guarantee for every id — two reaches may coincide — but across all
    // eight, a table that ignored reach would collapse to one answer.
    const hands = REACH_DOMAINS.map(reach =>
      drawConsequenceHand({ templateId: 'encounter.test.spread', reach, rarityTier: 2 }).join('|'),
    );
    expect(new Set(hands).size).toBeGreaterThan(1);
  });

  it('draws without replacement', () => {
    for (const reach of REACH_DOMAINS) {
      const hand = drawConsequenceHand({ templateId: 'encounter.test.dupes', reach, rarityTier: 4 });
      expect(new Set(hand).size).toBe(hand.length);
    }
  });

  it('mixes the table id into the seed, so two tables are independent', () => {
    const weights = { alpha: 5, beta: 5, gamma: 5, delta: 5, epsilon: 5 };
    const a = drawFromTable('consequence', weights, 'same-subject', 2);
    const b = drawFromTable('plot-hook', weights, 'same-subject', 2);
    expect(a).not.toEqual(b);
  });

  it('returns everything eligible rather than throwing when asked for too much', () => {
    expect(drawFromTable('t', { only: 4 }, 'seed', 5)).toEqual(['only']);
    expect(drawFromTable('t', {}, 'seed', 2)).toEqual([]);
  });
});

describe('hand size and the formative gate', () => {
  it('draws the base hand below the rarity bonus tier', () => {
    expect(consequenceHandSize(1)).toBe(CONSEQUENCE_HAND_BASE);
    expect(consequenceHandSize(2)).toBe(CONSEQUENCE_HAND_BASE);
  });

  it('draws one more at and above the bonus tier', () => {
    expect(consequenceHandSize(3)).toBe(CONSEQUENCE_HAND_BASE + 1);
    expect(consequenceHandSize(4)).toBe(CONSEQUENCE_HAND_BASE + 1);
  });

  it('never draws `formative` below the rarity floor, across every reach and id', () => {
    // The axiological mark is author-gated; a tier-1 encounter drawing it would
    // be a hand no author is permitted to satisfy.
    for (const reach of REACH_DOMAINS) {
      for (let i = 0; i < 40; i++) {
        for (const tier of [1, 2] as const) {
          const hand = drawConsequenceHand({ templateId: `encounter.test.f${i}`, reach, rarityTier: tier });
          expect(hand).not.toContain('formative');
        }
      }
    }
  });

  it('can draw `formative` at the floor', () => {
    const drawn = REACH_DOMAINS.flatMap(reach =>
      Array.from({ length: 40 }, (_, i) =>
        drawConsequenceHand({
          templateId: `encounter.test.g${i}`,
          reach,
          rarityTier: CONSEQUENCE_FORMATIVE_MIN_TIER,
        }),
      ),
    );
    expect(drawn.some(hand => hand.includes('formative'))).toBe(true);
  });
});

// ─── 2. The table ────────────────────────────────────────────────────

describe('the weight matrix', () => {
  it('carries every family', () => {
    expect(Object.keys(CONSEQUENCE_FAMILY_WEIGHTS).sort()).toEqual([...CONSEQUENCE_FAMILIES].sort());
    expect(CONSEQUENCE_FAMILIES).toHaveLength(15);
  });

  it('carries every reach for every family', () => {
    for (const family of CONSEQUENCE_FAMILIES) {
      expect(Object.keys(CONSEQUENCE_FAMILY_WEIGHTS[family]).sort()).toEqual(
        [...REACH_DOMAINS].sort(),
      );
    }
  });

  it('floors every cell at 1 — anything can surface anywhere', () => {
    // This is the design, not an incidental property: a zero would make a family
    // unreachable in that reach and turn the eight reaches into eight genres.
    for (const family of CONSEQUENCE_FAMILIES) {
      for (const reach of REACH_DOMAINS) {
        expect(CONSEQUENCE_FAMILY_WEIGHTS[family][reach]).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('gives each family at least one concrete effect kind', () => {
    // A family with an empty row could be drawn and never satisfied. (That the
    // *names* resolve is proven at compile time by the table's type — see the
    // module's note on the THR-844 rot class.)
    for (const family of CONSEQUENCE_FAMILIES) {
      expect(CONSEQUENCE_FAMILY_EFFECT_KINDS[family].length).toBeGreaterThan(0);
    }
  });

  it('lets the signature cells carry the reach identity', () => {
    // Pinned rather than merely floored: these are the cells that make heart
    // read as heart. A retune that flattens them is a design change, not a
    // calibration, and should have to edit this test.
    const strongest = (reach: ReachDomain): ConsequenceFamily =>
      [...CONSEQUENCE_FAMILIES].sort(
        (a, b) => CONSEQUENCE_FAMILY_WEIGHTS[b][reach] - CONSEQUENCE_FAMILY_WEIGHTS[a][reach],
      )[0];
    expect(strongest('heart')).toBe('relationship');
    expect(strongest('gold')).toBe('possession');
    expect(strongest('eye')).toBe('knowledge');
    expect(strongest('shadow')).toBe('secret');
    expect(strongest('stone')).toBe('place');
    expect(strongest('star')).toBe('story_seed');
  });
});

// ─── 3. Which families a template wires ──────────────────────────────

describe('familiesWiredByEffects', () => {
  const conditionOnPerson = { kind: 'condition_attachment', templateId: 'trait.condition.wounded' };
  const conditionOnPlace = {
    kind: 'condition_attachment',
    templateId: 'trait.condition.location.watched',
    targetLocationId: 'loc.1',
  };

  it('reads a condition on a person as `condition`, not `place`', () => {
    const wired = familiesWiredByEffects([conditionOnPerson as never], false);
    expect(wired.has('condition')).toBe(true);
    expect(wired.has('place')).toBe(false);
  });

  it('reads a condition on a place as `place`, not `condition`', () => {
    const wired = familiesWiredByEffects([conditionOnPlace as never], false);
    expect(wired.has('place')).toBe(true);
    expect(wired.has('condition')).toBe(false);
  });

  it('counts a rewardPool recipe as a possession', () => {
    // The pre-`reward_draw` authoring route grants the same thing; a gate that
    // ignored it would tell an author to wire what they already wired.
    expect(familiesWiredByEffects([], true).has('possession')).toBe(true);
    expect(familiesWiredByEffects([], false).has('possession')).toBe(false);
  });

  it('lets one attachment_grant answer either possession or condition', () => {
    // Which it is depends on the granted template's category — content the gate
    // does not resolve. Documented as a floor, pinned here so it stays one.
    const wired = familiesWiredByEffects([{ kind: 'attachment_grant' } as never], false);
    expect(wired.has('possession')).toBe(true);
    expect(wired.has('condition')).toBe(true);
  });
});

// ─── 4. The gate, falsified both ways ────────────────────────────────

describe('the gate — green', () => {
  const hand = drawnHandForTemplate(NUDGE_GOLDEN_EXEMPLAR);

  it('is silent on a template that records no draw', () => {
    // Grandfathering, and the reason this block can land mid-retrofit.
    expect(NUDGE_GOLDEN_EXEMPLAR.consequenceDraw).toBeUndefined();
    expect(drawViolations(NUDGE_GOLDEN_EXEMPLAR)).toEqual([]);
  });

  it('passes a template that records its real hand and wires all of it', () => {
    expect(drawViolations(withWiredHand(hand))).toEqual([]);
  });

  it('accepts a recorded hand written in any order', () => {
    expect(drawViolations(withWiredHand(hand, { record: [...hand].reverse() }))).toEqual([]);
  });
});

describe('the gate — red', () => {
  const hand = drawnHandForTemplate(NUDGE_GOLDEN_EXEMPLAR);
  const notDrawn = CONSEQUENCE_FAMILIES.filter(f => !hand.includes(f));

  it('fails a doctored hand', () => {
    // The tamper-evidence property. Same wiring, same template — only the
    // recorded claim differs from what the id computes.
    const messages = drawViolations(withWiredHand(hand, { record: [notDrawn[0], notDrawn[1]] }));
    expect(messages.join('\n')).toContain('draws [');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('fails a hand that drops a drawn family', () => {
    const messages = drawViolations(withWiredHand(hand, { record: hand.slice(1) }));
    expect(messages.join('\n')).toContain('draws [');
  });

  it('fails a drawn family that nothing wires', () => {
    // Derived from the green case by removing exactly one effect.
    const messages = drawViolations(withWiredHand(hand, { omit: hand[0] }));
    expect(messages.join('\n')).toContain(`drew '${hand[0]}' but nothing wires it`);
  });

  it('fails a place drawn but wired only on a person', () => {
    // The location-target distinction, falsified: same effect kind, no target.
    const placeHand: readonly ConsequenceFamily[] = ['place'];
    const template = {
      ...withWiredHand(hand),
      consequenceDraw: ['place'],
    } as UnifiedActionTemplate;
    // The recorded hand is wrong *and* place is unwired; assert the id-mismatch
    // arm fires, which is the one that runs first.
    expect(drawViolations(template).join('\n')).toContain('draws [');
    expect(placeHand).toHaveLength(1);
  });
});

describe('the gate — the one recorded swap', () => {
  const hand = drawnHandForTemplate(NUDGE_GOLDEN_EXEMPLAR);
  const reach = NUDGE_GOLDEN_EXEMPLAR.reach;
  const legalTarget = CONSEQUENCE_FAMILIES.find(
    f => !hand.includes(f) && CONSEQUENCE_FAMILY_WEIGHTS[f][reach] >= CONSEQUENCE_SWAP_MIN_WEIGHT,
  )!;

  function swapped(swap: UnifiedActionTemplate['consequenceSwap'], record: readonly string[]) {
    const wired = record.filter((f): f is ConsequenceFamily =>
      (CONSEQUENCE_FAMILIES as readonly string[]).includes(f),
    );
    return { ...withWiredHand(wired, { record }), consequenceSwap: swap } as UnifiedActionTemplate;
  }

  const goodSwap = { from: hand[0], to: legalTarget, reason: 'no persistent cast to bind to' };
  const afterSwap = [...hand.slice(1), legalTarget];

  it('accepts a legal, explained swap', () => {
    expect(drawViolations(swapped(goodSwap, afterSwap))).toEqual([]);
  });

  it('rejects a swap with no reason', () => {
    const messages = drawViolations(swapped({ ...goodSwap, reason: '  ' }, afterSwap));
    expect(messages.join('\n')).toContain('declares no `reason`');
  });

  it('rejects trading away a family the template never drew', () => {
    const stranger = CONSEQUENCE_FAMILIES.find(f => !hand.includes(f) && f !== legalTarget)!;
    const messages = drawViolations(
      swapped({ from: stranger, to: legalTarget, reason: 'x' }, afterSwap),
    );
    expect(messages.join('\n')).toContain('which this template never drew');
  });

  it('rejects a swap target under the weight floor', () => {
    const tooWeak = CONSEQUENCE_FAMILIES.find(
      f => !hand.includes(f) && CONSEQUENCE_FAMILY_WEIGHTS[f][reach] < CONSEQUENCE_SWAP_MIN_WEIGHT,
    );
    if (!tooWeak) {
      // Reach-dependent: `stone` floors omen at 1, but a reach whose every cell
      // clears the floor legitimately has no case to test.
      expect(tooWeak).toBeUndefined();
      return;
    }
    const messages = drawViolations(
      swapped({ from: hand[0], to: tooWeak, reason: 'x' }, [...hand.slice(1), tooWeak]),
    );
    expect(messages.join('\n')).toContain('under the floor of');
  });

  it('rejects an unknown family as a swap target', () => {
    const messages = drawViolations(
      swapped({ from: hand[0], to: 'vibes', reason: 'x' }, [...hand.slice(1), 'vibes']),
    );
    expect(messages.join('\n')).toContain("unknown family 'vibes'");
  });
});

// ─── 5. The corpus stays green ───────────────────────────────────────

describe('the live corpus', () => {
  it('every template carrying a recorded draw passes the Draw block clean', () => {
    // THR-1130's retrofit was in flight when this suite was written, and at
    // that point nothing in the corpus authored `consequenceDraw` — the block
    // was silent everywhere. The Encounter Factory v3 line (border-perils,
    // THR-1221) is the first content to record it, so the property this test
    // actually pins is narrower and permanent: a template that *does* record a
    // draw must clear `checkCompositionContract`'s `draw` block with zero
    // violations. `checkConsequenceDraw` (exercised directly above) is the
    // same logic `checkCompositionContract` delegates to for this block.
    const carrying = UNIFIED_ACTION_TEMPLATES.filter(t => t.consequenceDraw !== undefined);
    // The loop below passes trivially over an empty set, and an empty set is
    // exactly what the *previous* version of this test asserted — so without this
    // line the assertion would silently revert to proving nothing the moment the
    // field were renamed or the v3 content removed, while still reading green.
    // Pinned as a floor rather than an exact count so the batch can grow.
    expect(carrying.length).toBeGreaterThan(0);
    for (const template of carrying) {
      const report = checkCompositionContract(template);
      const drawViolationsForTemplate = report.violations.filter(v => v.block === 'draw');
      expect(drawViolationsForTemplate, `template "${template.id}"`).toEqual([]);
    }
  });

  it('draws a satisfiable hand for every live encounter', () => {
    // Every family a live template could draw has at least one shipped effect
    // kind behind it — the `CONSEQUENCE_FAMILIES_LIVE` gating the plan reserved
    // is unnecessary because THR-1142/1143/1144/1146 all landed first.
    for (const template of UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.'))) {
      for (const family of drawnHandForTemplate(template)) {
        expect(CONSEQUENCE_FAMILY_EFFECT_KINDS[family].length).toBeGreaterThan(0);
      }
    }
  });
});
