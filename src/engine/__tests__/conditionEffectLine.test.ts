/**
 * THR-1475 — a condition must say what it does, on both surfaces that name it.
 *
 * Christian, on the THR-1220 slice: *"there is still no information on the tool
 * tips or click throughs on the scars describing their in game effect."* The
 * effect was already in the data; nothing turned it into words. These are the
 * gates on the words.
 *
 * Two of them are deliberately **two-sided**, because the single-sided version is
 * the trap:
 *
 * - The corpus sweep is paired with a falsification arm over
 *   `CONDITION_IDS_WITHOUT_EFFECT`. A sweep that skips an exemption list proves
 *   only that the list is long enough; this one also proves every member of the
 *   list genuinely has no substrate, so the list cannot be grown to make a
 *   failure go away.
 * - The ladder assertion is paired with a perturbed arm. `slightly` is the right
 *   word for every shipped condition, so an assert that the shipped corpus reads
 *   `slightly` would also pass against a function that returned `slightly`
 *   unconditionally. The second arm hands it a magnitude no shipped condition has
 *   and requires a different word.
 */

import { describe, it, expect } from 'vitest';
import type { GraphNode } from '../../types/graph';
import {
  CONDITION_MAGNITUDE_BANDS,
  CONDITION_TERM_UNKNOWN,
  CONDITION_TRAVEL_TAX_BANDS,
  conditionEffectLine,
  containsNumeral,
  magnitudeWord,
} from '../aftermathWords';
import {
  ATTACHMENT_TOOLTIP_MAX_TOTAL_DESC,
  ATTACHMENT_TEMPLATE_SOURCES,
  composeTemplateTooltipBody,
  plainRegisterBody,
  resolveAttachmentTemplateTooltip,
  resolveConditionEffectLine,
} from '../attachmentTemplateIndex';
import {
  CONDITION_DURATIONS,
  CONDITION_IDS_WITHOUT_EFFECT,
  CONDITION_TRAIT_DEFINITIONS,
  LOCATION_CONDITION_MOVEMENT_TAX,
} from '../../data/condition-trait-content';

/** The shipped corpus this ticket's Done-when names: every `trait.condition.*`. */
const CONDITIONS: readonly GraphNode[] = CONDITION_TRAIT_DEFINITIONS.filter(node =>
  node.id.startsWith('trait.condition.'),
);

/** The ones that must yield a reading — the corpus minus the documented exemptions. */
const EFFECTFUL = CONDITIONS.filter(node => !CONDITION_IDS_WITHOUT_EFFECT.includes(node.id));

/** A synthetic condition, so an arm can use a magnitude no shipped template has. */
function syntheticCondition(
  props: Record<string, unknown>,
  id = 'trait.condition.__synthetic',
): GraphNode {
  return {
    id,
    type: 'trait',
    name: 'Synthetic',
    properties: {
      subcategory: 'condition',
      description: 'A condition that exists only in this test.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      tags: ['#condition'],
      flavorText: 'Nothing authored it.',
      ...props,
    },
  } as GraphNode;
}

describe('conditionEffectLine — the shipped corpus', () => {
  it('the corpus is the one this gate claims to sweep', () => {
    // Guards against the sweep going vacuous if the definitions move modules:
    // an empty or near-empty `CONDITIONS` would pass every arm below.
    expect(CONDITIONS.length).toBeGreaterThanOrEqual(15);
    expect(EFFECTFUL.length).toBeGreaterThanOrEqual(12);
  });

  it('every condition outside the exemption list yields a non-empty, digit-free line', () => {
    const problems: string[] = [];

    for (const node of EFFECTFUL) {
      const reading = conditionEffectLine(node);
      if (!reading) {
        problems.push(`${node.id}: no reading at all`);
        continue;
      }
      if (reading.effect.trim().length === 0) problems.push(`${node.id}: empty effect`);
      if (reading.term.trim().length === 0) problems.push(`${node.id}: empty term`);
      if (containsNumeral(reading.line)) problems.push(`${node.id}: numeral in "${reading.line}"`);
      // A reading that names no reach and no travel cost has said nothing.
      if (!/ (lower|higher)\b/.test(reading.effect) && !reading.effect.startsWith('Travel')) {
        problems.push(`${node.id}: effect names neither a reach nor a travel cost — "${reading.effect}"`);
      }
    }

    expect(problems).toEqual([]);
  });

  it('every exempted condition genuinely has no effect substrate', () => {
    // The falsification arm. Without it the exemption list is a way to pass this
    // file rather than a record of a real gap (THR-1483 owns closing the gap).
    const wronglyExempt: string[] = [];

    for (const id of CONDITION_IDS_WITHOUT_EFFECT) {
      const node = CONDITIONS.find(n => n.id === id);
      expect(node, `${id} is exempted but is not a shipped condition`).toBeDefined();

      const contributions = (node!.properties as Record<string, unknown>).domainContributions;
      const hasContribution = Object.values(
        (contributions ?? {}) as Record<string, unknown>,
      ).some(v => typeof v === 'number' && Number.isFinite(v) && v !== 0);
      const hasTax = typeof LOCATION_CONDITION_MOVEMENT_TAX[id] === 'number'
        && LOCATION_CONDITION_MOVEMENT_TAX[id] > 1;

      if (hasContribution || hasTax) {
        wronglyExempt.push(
          `${id}: has ${hasContribution ? 'domainContributions' : 'a movement tax'} — `
          + 'its effect is derivable, so remove it from CONDITION_IDS_WITHOUT_EFFECT',
        );
      }
      // And it must actually read as nothing, not merely be listed as nothing.
      expect(conditionEffectLine(node!), `${id} is exempted but yields a reading`).toBeNull();
    }

    expect(wronglyExempt).toEqual([]);
  });

  it('reads Shaken with a real term, not an open-ended one', () => {
    // The slice Christian reviewed grants this with no override. Before THR-1475 it
    // had no duration row, so it read "Lasts until it lifts" and was permanent.
    const shaken = CONDITIONS.find(n => n.id === 'trait.condition.shaken')!;
    const reading = conditionEffectLine(shaken)!;

    expect(reading.term).toBe('Lasts about two days.');
    expect(reading.term).not.toContain(CONDITION_TERM_UNKNOWN);
  });

  it('reads Exhausted exactly as the player will see it', () => {
    // The example on the ticket, pinned as words rather than as a shape — this is
    // the string Christian hovers.
    const exhausted = CONDITIONS.find(n => n.id === 'trait.condition.exhausted')!;
    const reading = conditionEffectLine(exhausted)!;

    expect(reading.effect).toBe('Iron, Eye and Stone slightly lower.');
    expect(reading.term).toBe('Lasts about one day.');
    expect(reading.line).toBe('Iron, Eye and Stone slightly lower. Lasts about one day.');
  });

  it('puts what a mixed condition gives before what it costs', () => {
    const terrified = CONDITIONS.find(n => n.id === 'trait.condition.terrified')!;
    // { iron: -0.06, shadow: 0.04 } — the riser first.
    expect(conditionEffectLine(terrified)!.effect).toBe(
      'Shadow slightly higher, and Iron slightly lower.',
    );
  });

  it("reads a place's condition from its travel cost", () => {
    const closed = CONDITIONS.find(n => n.id === 'trait.condition.location.pass_closed')!;
    const reading = conditionEffectLine(closed)!;

    expect(reading.effect).toBe('Travel through here costs far more.');
    // 360 ticks — a season, read as weeks rather than as a two-digit day count.
    expect(reading.term).toBe('Lasts about four weeks.');
  });
});

describe('conditionEffectLine — the magnitude ladder', () => {
  it('calls every shipped condition slight, because every shipped condition is', () => {
    // The honest half: raw terms of 0.04…0.10 move capability by about one point
    // in a hundred through `sigmoid(10, 0.4)`. Inflating that would be a lie.
    for (const node of EFFECTFUL) {
      const reading = conditionEffectLine(node)!;
      if (reading.effect.startsWith('Travel')) continue;
      expect(reading.effect, node.id).toContain('slightly');
    }
  });

  it('does NOT call a genuinely large condition slight', () => {
    // The perturbed arm. Without it the assert above passes against a function
    // that returns `slightly` unconditionally. −0.6 is a magnitude no shipped
    // condition has, written as a literal rather than read off the ladder so the
    // threshold is not asserted against itself.
    const heavy = syntheticCondition({ domainContributions: { iron: -0.6 } });
    const reading = conditionEffectLine(heavy)!;

    expect(reading.effect).not.toContain('slightly');
    expect(reading.effect).toBe('Iron markedly lower.');
  });

  it('bands the strongest reach in a group, not an average of it', () => {
    // 0.5 and 0.01 average to a rung neither reach is on.
    const uneven = syntheticCondition({ domainContributions: { iron: -0.5, eye: -0.01 } });
    expect(conditionEffectLine(uneven)!.effect).toBe('Iron and Eye markedly lower.');
  });

  it('spends no numeral at any rung of either ladder', () => {
    for (const band of [...CONDITION_MAGNITUDE_BANDS, ...CONDITION_TRAVEL_TAX_BANDS]) {
      expect(containsNumeral(band.word), band.word).toBe(false);
    }
    // And the ladders are ordered highest-first, which `bandWord` depends on.
    for (const ladder of [CONDITION_MAGNITUDE_BANDS, CONDITION_TRAVEL_TAX_BANDS]) {
      const mins = ladder.map(b => b.min);
      expect(mins).toEqual([...mins].sort((a, b) => b - a));
      expect(mins[mins.length - 1]).toBe(0);
    }
    // Each rung is reachable: a value at its own floor takes its own word.
    for (const band of CONDITION_MAGNITUDE_BANDS) {
      expect(magnitudeWord(band.min, CONDITION_MAGNITUDE_BANDS)).toBe(band.word);
    }
  });
});

describe('conditionEffectLine — the term', () => {
  it("states the grant's term over the template default", () => {
    const wounded = CONDITIONS.find(n => n.id === 'trait.condition.wounded')!;
    // The default is 24 ticks (two days); an encounter may override it.
    expect(conditionEffectLine(wounded)!.term).toBe('Lasts about two days.');
    expect(conditionEffectLine(wounded, { totalTicks: 72 })!.term).toBe('Lasts about six days.');
  });

  it('every personal condition declares a default term', () => {
    // Not a tidiness check — **the fallback is permanence, not a default**.
    // `CONDITION_DEFAULT_DURATION_TICKS` is 0, and 0 means indefinite (the edge
    // omits `ticksRemaining`, the only field `decayConditions` counts down). So a
    // template added without a row here is granted *forever*, silently. THR-1472
    // added `shaken` and its writers without one, and `slice.snow_on_the_pass`
    // granted it with no `durationOverride` — a permanent loss of nerve, found
    // only because this ticket asked the data how long it lasts.
    //
    // Scoped to the personal set: a place's conditions are a separate question
    // (`tended_shrine` has no row either, and that is THR-1483's to settle along
    // with whether it has any effect at all).
    const missing = CONDITIONS.filter(
      node =>
        !node.id.startsWith('trait.condition.location.')
        && typeof CONDITION_DURATIONS[node.id] !== 'number',
    ).map(node => node.id);

    expect(missing).toEqual([]);
  });

  it('says so honestly when nothing declares a term', () => {
    const undeclared = syntheticCondition({ domainContributions: { heart: 0.05 } });
    expect(CONDITION_DURATIONS[undeclared.id]).toBeUndefined();
    expect(conditionEffectLine(undeclared)!.term).toBe(`Lasts ${CONDITION_TERM_UNKNOWN}.`);
  });

  it('ignores a term that is not a usable number', () => {
    const wounded = CONDITIONS.find(n => n.id === 'trait.condition.wounded')!;
    // `readEdgeDuration` returns `undefined` for a missing total, but a null or a
    // zero reaching here must fall back rather than render "about no days".
    for (const totalTicks of [null, 0, Number.NaN] as const) {
      const term = conditionEffectLine(wounded, { totalTicks })!.term;
      expect(containsNumeral(term)).toBe(false);
      expect(term).not.toContain('no day');
    }
  });
});

describe('the hover and the sheet read the one derivation', () => {
  it('every condition tooltip carries its effect line in full', () => {
    // The Law 27 claim, and the reason the body is the half that gets trimmed:
    // the effect line must survive composition intact, never clipped.
    const problems: string[] = [];

    for (const node of EFFECTFUL) {
      const tooltip = resolveAttachmentTemplateTooltip(node.id);
      if (!tooltip) {
        problems.push(`${node.id}: no tooltip resolved`);
        continue;
      }
      // `desc` is optional on `TooltipContent`; an absent one is itself the defect
      // this sweep is looking for, so it is a problem rather than a skip.
      const desc = tooltip.desc;
      if (desc === undefined) {
        problems.push(`${node.id}: tooltip resolved with no desc at all`);
        continue;
      }

      const expected = conditionEffectLine(node)!.line;
      if (!desc.includes(expected)) {
        problems.push(`${node.id}: desc is missing "${expected}" — got "${desc}"`);
      }
      if (desc.length > ATTACHMENT_TOOLTIP_MAX_TOTAL_DESC) {
        problems.push(`${node.id}: desc is ${desc.length} chars, over the Law 18 ceiling`);
      }
      if (containsNumeral(desc)) {
        problems.push(`${node.id}: numeral in tooltip desc — "${desc}"`);
      }
    }

    expect(problems).toEqual([]);
  });

  it('the sheet resolver returns the same reading the hover composed', () => {
    for (const node of EFFECTFUL) {
      expect(resolveConditionEffectLine(node.id), node.id)
        .toEqual(conditionEffectLine(node));
    }
  });

  it('the sheet resolver passes the bearer\'s own term through', () => {
    expect(resolveConditionEffectLine('trait.condition.wounded', { totalTicks: 72 })!.term)
      .toBe('Lasts about six days.');
  });

  it('resolves to nothing rather than guessing, for an id it does not ship', () => {
    expect(resolveConditionEffectLine(undefined)).toBeNull();
    expect(resolveConditionEffectLine('trait.condition.not_a_real_condition')).toBeNull();
    // An exempted condition resolves to nothing on the sheet too, so the row is
    // simply absent rather than blank (Law 14).
    expect(resolveConditionEffectLine(CONDITION_IDS_WITHOUT_EFFECT[0])).toBeNull();
  });

  it('leaves a template with no effect line reading exactly as it did', () => {
    // The no-regression arm: every non-condition attachment keeps the plain
    // register body and nothing else.
    const possession = ATTACHMENT_TEMPLATE_SOURCES.find(n => n.type === 'artifact')!;
    expect(composeTemplateTooltipBody(possession, null)).toBe(plainRegisterBody(possession));
  });
});

describe('composeTemplateTooltipBody — the Law 18 budget', () => {
  // Shipped data does not come near the ceiling (the longest condition reading
  // and the longest condition description sum to ~153 of 200), so these call the
  // composition directly. Asserting the squeeze through the corpus would be a
  // probe that passes because nothing exercised it.
  const longDescription = 'A'.repeat(400);

  it('trims the body, never the effect', () => {
    const node = syntheticCondition({
      description: longDescription,
      domainContributions: { iron: -0.04 },
    });
    const effect = conditionEffectLine(node)!;
    const body = composeTemplateTooltipBody(node, effect);

    expect(body).toContain(effect.line);
    expect(body.length).toBeLessThanOrEqual(ATTACHMENT_TOOLTIP_MAX_TOTAL_DESC);
    // The body was the part that gave way.
    expect(body.length).toBeGreaterThan(effect.line.length);
  });

  it('drops the body entirely when a long reading leaves no room for a sentence', () => {
    const node = syntheticCondition({ description: longDescription });
    // A reading long enough to squeeze the body below `ATTACHMENT_TOOLTIP_MIN_BODY`.
    // Unreachable from the shipped ladder, which is the point of testing it here.
    const effect = { effect: 'E'.repeat(170), term: 'T.', line: 'E'.repeat(170) };

    expect(composeTemplateTooltipBody(node, effect)).toBe(effect.line);
  });

  it('honours a tight budget, at a sentence boundary when one is late enough', () => {
    // The existing rule: a boundary past the halfway mark is worth keeping, and a
    // boundary before it is not — a two-word fragment explains less than an
    // ellipsis does. Both branches, at the same budget, so the rule is pinned
    // rather than one side of it.
    const lateBoundary = syntheticCondition({
      description: 'A sentence of some length that ends here. And then rather more of it.',
    });
    expect(plainRegisterBody(lateBoundary, 50)).toBe('A sentence of some length that ends here.');

    const earlyBoundary = syntheticCondition({
      description: 'Short. And then a great deal more that cannot possibly fit in the budget.',
    });
    const clipped = plainRegisterBody(earlyBoundary, 50);
    expect(clipped.length).toBeLessThanOrEqual(50);
    expect(clipped.endsWith('…')).toBe(true);
  });

  it('leaves room for the ellipsis inside the budget', () => {
    // The off-by-one this ticket found: the clipped branch returned `budget + 1`,
    // which is why the shipped corpus measured a 161-character body against the
    // 160-character ceiling. Swept at every budget in the band, so the fix cannot
    // be true at one width and false at the next.
    const node = syntheticCondition({ description: 'B'.repeat(400) });
    for (let budget = 2; budget <= 200; budget++) {
      expect(plainRegisterBody(node, budget).length, `budget ${budget}`)
        .toBeLessThanOrEqual(budget);
    }
  });

  it('treats a nonsensical budget as zero rather than slicing from the end', () => {
    // `slice(0, -5)` drops the last five characters instead of returning nothing —
    // the foot-gun the clamp exists for.
    const node = syntheticCondition({ description: 'Twelve characters and more.' });
    expect(plainRegisterBody(node, -5)).toBe('');
    expect(plainRegisterBody(node, Number.NaN)).toBe('');
  });
});
