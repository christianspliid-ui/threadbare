/**
 * The aftermath is inside the detector walk — THR-1083.
 *
 * `collectClassedTemplateProse` is the single function every prose detector
 * reads through, and until THR-1083 its walk stopped before `aftermathConfig`.
 * The last screen the player reads was therefore outside every gate we own:
 * measured at the time, 295 templates carried an aftermath holding ~59k words
 * of authored prose that no detector had ever scored — 36% of the corpus.
 *
 * The proof it mattered is one shipped line. `encounter.slice.unsafe_bridge`
 * authored *"The bridge spent something on this crossing that it will not get
 * back."* — `something` is the canonical outcome-hider and the first term in
 * `EVASIVE_VAGUENESS_TERMS` — and it went through THR-973's re-authoring pass,
 * past THR-883's format lock, onto production, and into the director's review
 * of the vertical slice, with every gate reporting clean the whole way.
 *
 * These assertions pin the walk, the field classes, and the one regression that
 * started it. A future edit that narrows the walk fails here rather than in a
 * director review six weeks later.
 */
import { describe, expect, it } from 'vitest';
import {
  ABSTRACT_DENSITY_WARN,
  auditTemplate,
  collectClassedTemplateProse,
  collectTemplateTextByClass,
  countVagueness,
} from '../content-eval/nudgeAuditDetectors';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

/** The offending line, verbatim as it shipped. */
const SHIPPED_DEFECT = 'The bridge spent something on this crossing that it will not get back.';

/**
 * A template carrying only an aftermath, so any hit can have come from nowhere
 * else. Cast because the walk reads optional fields exclusively — a full
 * template here would test the fixture, not the walk.
 */
function templateWithAftermath(): UnifiedActionTemplate {
  return {
    id: 'test.aftermath.walk',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {
        took_the_coin: {
          overview: 'The keeper counted it twice and said nothing either time.',
          changes: [
            {
              id: 'c.variant',
              kind: 'shell_state',
              title: 'Coin Counted',
              detail: 'The toll was paid in full and the ledger closed on it.',
              polarity: 'gain',
            },
          ],
        },
      },
      fallback: {
        overview: 'They crossed, and the bridge held, and that was the whole of it.',
        changes: [
          {
            id: 'c.fallback',
            kind: 'shell_state',
            title: 'A Plank Short',
            detail: SHIPPED_DEFECT,
            polarity: 'loss',
          },
        ],
        reactionPrompt: 'The keeper is still standing there.',
        reactions: [
          { id: 'r.walk_on', label: 'Walk on', intent: 'The road goes on.', effects: [] },
        ],
        byOutcome: {
          critical_failure: {
            overview: 'The beam went at the worst step of the worst stride.',
            changes: [
              {
                id: 'c.band',
                kind: 'trait',
                title: 'Ford-Worn',
                detail: 'The half day the bridge saved is a half day the river took back.',
                polarity: 'loss',
              },
            ],
          },
        },
      },
    },
  } as unknown as UnifiedActionTemplate;
}

describe('the walk reaches aftermathConfig (THR-1083)', () => {
  it('catches the evasive term in an aftermath detail — the line that shipped', () => {
    // The Done-when, stated as an assertion: this exact string, reached through
    // the walk rather than passed to the detector by hand.
    const byClass = collectTemplateTextByClass(templateWithAftermath());
    expect(byClass.outcome).toContain('spent something');
    expect(countVagueness(byClass.outcome, 'outcome')).toBeGreaterThan(0);
  });

  it('sweeps both keyed variants and the fallback', () => {
    const text = collectClassedTemplateProse(templateWithAftermath()).map(p => p.text);
    expect(text).toContain('The keeper counted it twice and said nothing either time.');
    expect(text).toContain('They crossed, and the bridge held, and that was the whole of it.');
  });

  it('sweeps outcome-band overrides layered on a variant', () => {
    const text = collectClassedTemplateProse(templateWithAftermath()).map(p => p.text);
    expect(text).toContain('The beam went at the worst step of the worst stride.');
    expect(text).toContain('The half day the bridge saved is a half day the river took back.');
  });

  it('classes detail as outcome, overview as scene, and labels as interactive', () => {
    // Not cosmetic: the class decides whether the natural indefinites are
    // enforced, and getting `overview` wrong flags 165 fields of ordinary
    // English across the population. See the module docstring for the split.
    const parts = collectClassedTemplateProse(templateWithAftermath());
    const classOf = (text: string): string | undefined =>
      parts.find(p => p.text === text)?.fieldClass;

    expect(classOf(SHIPPED_DEFECT)).toBe('outcome');
    expect(classOf('They crossed, and the bridge held, and that was the whole of it.')).toBe('scene');
    expect(classOf('A Plank Short')).toBe('interactive');
    expect(classOf('Walk on')).toBe('interactive');
    expect(classOf('The road goes on.')).toBe('interactive');
    expect(classOf('The keeper is still standing there.')).toBe('interactive');
  });

  it('leaves a template without an aftermath scoring exactly as before', () => {
    // The walk appends, so every pre-THR-1083 batch score stays comparable for
    // the templates it was actually measured on. A regression here would
    // invalidate quoted WS5 evidence rather than merely widen coverage.
    const noAftermath = {
      id: 'test.aftermath.absent',
      name: 'A Quiet Crossing',
      description: 'The bridge is sound and the keeper is asleep.',
    } as unknown as UnifiedActionTemplate;

    expect(collectClassedTemplateProse(noAftermath).map(p => p.text)).toEqual([
      'A Quiet Crossing',
      'The bridge is sound and the keeper is asleep.',
    ]);
  });
});

describe('the vertical slice reads clean on the widened walk (THR-1083)', () => {
  const slice = (UNIFIED_ACTION_TEMPLATES as readonly UnifiedActionTemplate[]).filter(
    t => t.id.startsWith('encounter.slice.') && t.aftermathConfig,
  );

  it('finds the slice templates it means to guard', () => {
    // An empty population would let every assertion below pass while proving
    // nothing — the vacuous-probe shape.
    expect(slice.length).toBeGreaterThanOrEqual(8);
  });

  it('carries no evasive term in any aftermath prose', () => {
    // Evasive terms are enforced at zero in every field class, so this holds
    // regardless of how each field is classed. The natural indefinites are
    // deliberately NOT asserted here: "he shorted them nothing" states its
    // consequence exactly, and banning it would be the contortion THR-899 split
    // the lexicon to end.
    //
    // Scoped to the aftermath by taking the walk's tail — the aftermath is
    // appended last, so everything past the no-aftermath length is it. That
    // keeps the assertion honest about what THR-1083 owns (a `the moment` in a
    // nudge `effectLine` is a real hit, but it is step prose and predates this)
    // and pins the append-last property at the same time.
    const offenders: string[] = [];
    for (const template of slice) {
      const { aftermathConfig: _omitted, ...withoutAftermath } = template;
      const headLength = collectClassedTemplateProse(
        withoutAftermath as UnifiedActionTemplate,
      ).length;
      const full = collectClassedTemplateProse(template);
      expect(full.length, `${template.id} — aftermath must append, not interleave`)
        .toBeGreaterThan(headLength);

      for (const part of full.slice(headLength)) {
        if (countVagueness(part.text, 'scene') > 0) {
          offenders.push(`${template.id}: "${part.text}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('trips no vagueness threshold', () => {
    for (const template of slice) {
      const failures = auditTemplate(template).failures.filter(f => f.startsWith('vagueness'));
      expect(failures, template.id).toEqual([]);
    }
  });

  /**
   * Abstraction moved from `failures` to `warnings` in THR-1092, so the filter
   * above would have gone vacuous if it had kept its `abstraction` clause —
   * silently asserting nothing while still reading as a two-detector guard.
   *
   * It is repointed rather than dropped because the slice is the
   * director-reviewed vertical slice: whatever the corpus-wide base rate is
   * (129 of 683 templates warn), *these* templates are the worked examples and
   * are expected to sit under the threshold. Asserted against `warnings` so a
   * regression here is still caught, without the detector gating the other 683.
   */
  it('stays under the abstraction warn threshold, now that it no longer gates', () => {
    for (const template of slice) {
      const scores = auditTemplate(template);
      expect(
        scores.failures.filter(f => f.startsWith('abstraction')),
        `${template.id} — abstraction must not gate; it is a warning (THR-1092)`,
      ).toEqual([]);
      expect(
        scores.warnings.filter(w => w.startsWith('abstraction')),
        `${template.id} — abstraction density ${scores.abstractDensity}/100w crossed ` +
          `${ABSTRACT_DENSITY_WARN}. Advisory corpus-wide, but the reviewed slice is the exemplar.`,
      ).toEqual([]);
    }
  });
});

/**
 * The three templates the widening *diluted* out of the failure list — THR-1083.
 *
 * Vagueness is a density (hits per 100 words), so bringing ~59k words of
 * aftermath prose into the denominator lowered every template's score whether
 * or not its prose improved. For most that is harmless. For three it crossed
 * the 2.0/100w threshold downward while their **absolute** hit counts did not
 * move at all:
 *
 * ```
 * cg.social.citizen_petition   218 → 312 words   5 → 5 hits   2.29 → 1.92   FAIL → pass
 * social.rob                   275 → 367 words   3 → 3 hits   2.18 → 1.63   FAIL → pass
 * tavern.the_warning           317 → 422 words   6 → 6 hits   2.52 → 1.90   FAIL → pass
 * ```
 *
 * Not one word of their prose was touched. They are THR-1067's population
 * (evasive terms in outcome prose), and THR-1067's body instructs its executor
 * to **re-derive** the predicate rather than trust its filed list — which,
 * after this change, would return 15 and silently drop these three.
 *
 * So they were pinned by id here rather than left to a density that no longer
 * sees them. That was deliberately a *defect* assertion: it passed while the
 * defect existed and failed once someone fixed the prose.
 *
 * **THR-1067 fixed all three** (2026-08-12), so the defect assertion has been
 * inverted rather than deleted. The polarity flipped; the coverage must not.
 * These three remain the corpus's clearest case of a template whose outcome
 * prose the density gate **cannot see** — all three sit near 1.6–1.9/100w
 * against a 2.0 threshold, so re-introducing `something` into any of their
 * afterimages would trip no gate at all. Deleting the block on the grounds that
 * the list "may only shrink" would restore exactly the blind spot THR-1083
 * opened and this block was written to cover.
 *
 * The general problem — a density denominator that grows when coverage widens
 * can only ever weaken the gate — remains open under its own ticket.
 */
describe('the density-invisible three stay clean (THR-1083 → THR-1067)', () => {
  const DENSITY_INVISIBLE = ['cg.social.citizen_petition', 'social.rob', 'tavern.the_warning'] as const;

  it.each(DENSITY_INVISIBLE)(
    '%s carries no outcome-class vagueness hit, which its density alone would not catch',
    id => {
      const template = (UNIFIED_ACTION_TEMPLATES as readonly UnifiedActionTemplate[]).find(
        t => t.id === id,
      );
      expect(template, `${id} no longer exists — update this list`).toBeDefined();

      const scores = auditTemplate(template as UnifiedActionTemplate);
      expect(
        scores.vaguenessByClass.outcome,
        `${id} regressed: an evasive or indefinite term is back in its outcome prose. ` +
          'Its vagueness density is below the failure threshold, so no other gate will catch this.',
      ).toBe(0);
    },
  );
});
