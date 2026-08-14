/**
 * THR-1075 — an unimplemented-verb disclaimer must survive contact with the code.
 *
 * `ACTION_TECHNICAL_EFFECTS` entries for genuine no-ops state the *intended*
 * effect and say so ("INTENDED: … NOT YET WIRED"), per the authoring contract at
 * the head of `action-technical-effects.ts`: the text plus the catalog's `none`
 * badge are honest together. That pairing only holds while the verb really is a
 * no-op. When the verb gets wired the badge re-derives itself — `effectSourceFor`
 * reads the template — but the string does not, and it then tells the player the
 * exact opposite of what the action does.
 *
 * That is what happened to artifact.attune/nullify/curse: THR-605 shipped their
 * GraphOps and the disclaimers stayed behind for months.
 *
 * The invariant is a predicate, not a list, so the next verb that gets wired
 * cannot leave its description behind.
 */

import { describe, it, expect } from 'vitest';
import { ACTION_TECHNICAL_EFFECTS } from '../action-technical-effects';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { effectSourceFor } from '../actionEffectSource';

/**
 * The disclaimer markers the authoring contract uses for a genuine no-op.
 * Either marker claims "this verb does not change world state yet".
 */
const UNWIRED_DISCLAIMER = /NOT YET WIRED|INTENDED:/;

describe('ACTION_TECHNICAL_EFFECTS — unwired disclaimers match the code', () => {
  it('no entry claims NOT YET WIRED for a template that is actually wired', () => {
    const byId = new Map(UNIFIED_ACTION_TEMPLATES.map((t) => [t.id, t]));

    const liars = Object.entries(ACTION_TECHNICAL_EFFECTS)
      .filter(([, text]) => UNWIRED_DISCLAIMER.test(text))
      .map(([id]) => ({ id, template: byId.get(id) }))
      // An id with no template is a different defect (a dangling entry) and is
      // not this invariant's business — it cannot mis-describe a live verb.
      .filter(
        (e): e is { id: string; template: NonNullable<typeof e.template> } =>
          e.template != null,
      )
      .map(({ id, template }) => ({ id, source: effectSourceFor(template) }))
      .filter(({ source }) => source !== 'none');

    expect(
      liars,
      'These entries carry an "INTENDED / NOT YET WIRED" disclaimer while ' +
        'effectSourceFor() classifies the template as wired. Rewrite each string ' +
        'to describe what the verb now actually does (see the authoring contract ' +
        'at the head of action-technical-effects.ts).',
    ).toEqual([]);
  });

  /**
   * The mechanism guard. The test above catches one *wording* of a stale entry;
   * this one catches the condition that let it go stale at all, whatever it says.
   *
   * `UNIFIED_ACTION_TEMPLATES` assembles with `t.technicalEffect != null ? t : …`,
   * so a template that authors its own string never reads this map. Such an entry
   * reaches no consumer — and being invisible, nothing corrects it when the verb's
   * behaviour changes. Measured at THR-1075: 171 entries, 6 shadowed, and those 6
   * were exactly the 6 carrying a false "NOT YET WIRED" claim. Perfect overlap —
   * shadowing is not correlated with the rot, it is the mechanism of it.
   */
  it('no entry is shadowed by a template that authors its own technicalEffect', () => {
    const shadowed = UNIFIED_ACTION_TEMPLATES.filter(
      (t) =>
        ACTION_TECHNICAL_EFFECTS[t.id] != null &&
        t.technicalEffect !== ACTION_TECHNICAL_EFFECTS[t.id],
    ).map((t) => t.id);

    expect(
      shadowed,
      'These templates author their own technicalEffect AND have an entry in ' +
        'ACTION_TECHNICAL_EFFECTS. The template field wins, so the map entry is ' +
        'dead text that no surface renders and no reviewer sees. Keep exactly one: ' +
        'delete the map entry, or drop the field from the template.',
    ).toEqual([]);
  });
});
