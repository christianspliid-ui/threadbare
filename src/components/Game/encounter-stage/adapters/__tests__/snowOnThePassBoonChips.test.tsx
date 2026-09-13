// @vitest-environment jsdom
/**
 * THR-1467 — the two `BOON · STONE` rows, and the underline on a boon's noun.
 *
 * **Browser-verify substitution: jsdom-render — unattended run, no startable dev
 * server** (`Docs/canon/verification-gates.md` § Browser-verify). `preview_start`
 * is refused by design in a scheduled run, which shuts the Playwright route with
 * it. What is owed instead is render assertions on the real components for every
 * face the change produces, plus absence where a row should *not* render — which
 * is what the two describes below are.
 *
 * Both findings on the ticket are answered here, and they are answered
 * differently, because only one of them was a defect:
 *
 *  1. **The duplicate chips were real, and are gone.** Snow on the Pass has two
 *     steps and both are `stone`, so the engine grew one reach twice and minted
 *     one change per step. The ending drew them as two rows identical down to
 *     the cluster. The fold in `unifiedActionResolution` now reports the reach's
 *     net movement, so the census below sees one row where it used to see two.
 *
 *  2. **The underline on `STONE` is the hover tier, and it is live.** The
 *     reporting sweep read the noun as inert because it is a `span` rather than
 *     a `button`. That is the settled THR-1172 rule, not a defect: the underline
 *     is drawn on what the word can *do*, and a reach-backed noun can explain
 *     itself even though no Reach page exists to open. The arms below hold that
 *     rule to its own promise in both directions — underlined ⇒ it answers and
 *     is keyboard-reachable, and a noun that answers nothing is not underlined.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { buildAftermathConsequences } from '../buildAftermathConsequences';
import { NarrativeSegments } from '../../NarrativeSegments';
import { growthSentence } from '../../../../../engine/aftermathWords';
import { tooltipResolves } from '../../../../../engine/tooltipResolver';
import type { EncounterAftermathChange } from '../../../../../types/unifiedAction';

afterEach(cleanup);

const passthrough = {
  enrich: (text: string) => text,
  link: (id: string, text: string) => ({ id, segments: [{ text }] }),
};

/** A growth change as the engine mints one, for `domain` grown by `applied`. */
function growthChange(id: string, domain: string, applied: number): EncounterAftermathChange {
  const sentence = growthSentence({
    actorName: 'Kael Thornweaver',
    domain,
    applied,
    tierCrossed: false,
  });
  return {
    id,
    kind: 'growth',
    title: 'Stone grew',
    detail: sentence.detail,
    concepts: sentence.concepts,
    stateNoun: sentence.stateNoun,
    direction: sentence.direction,
    magnitude: sentence.magnitude,
    storyWeight: sentence.storyWeight,
    polarity: 'gain',
    actorId: 'agent.kael',
    actorName: 'Kael Thornweaver',
  };
}

/** `CATEGORY · NOUN` for each chip the adapter draws, in render order. */
const tagsFor = (changes: readonly EncounterAftermathChange[]) =>
  buildAftermathConsequences({ changes, ...passthrough })
    .map(c => `${c.categoryLabel} · ${(c.nounLabel ?? '').toUpperCase()}`);

describe('THR-1467 · the chip census', () => {
  it('draws one BOON · STONE row for the folded encounter', () => {
    // What the engine now hands the surface after both Stone steps resolve:
    // one change, carrying the summed amount.
    const folded = [growthChange('ua_1:growth:stone', 'stone', 0.08)];
    expect(tagsFor(folded)).toEqual(['BOON · STONE']);
  });

  it('would have drawn the reported duplicate had the fold not happened', () => {
    // The pre-fix shape, asserted so the census above is a *change* rather than
    // a fact about the adapter. This is the row pair the DOM sweep found
    // byte-identical — reproduced here, and no longer reachable from the engine.
    const perStep = [
      growthChange('ua_1:step:0:growth:stone', 'stone', 0.04),
      growthChange('ua_1:step:1:growth:stone', 'stone', 0.04),
    ];
    const tags = tagsFor(perStep);
    expect(tags).toEqual(['BOON · STONE', 'BOON · STONE']);
    expect(new Set(tags).size).toBe(1); // indistinguishable — the defect, in one line
  });

  it('still draws two rows when two different reaches grew', () => {
    const twoReaches = [
      growthChange('ua_1:step:0:growth:stone', 'stone', 0.04),
      growthChange('ua_1:step:1:growth:eye', 'eye', 0.04),
    ];
    expect(tagsFor(twoReaches)).toEqual(['BOON · STONE', 'BOON · EYE']);
  });
});

describe('THR-1467 · the boon noun is the hover tier, and the hover tier is live', () => {
  const opensNothing = () => undefined;

  /** Render one noun segment exactly as the chip block passes it. */
  function renderNoun(text: string, tooltipId: string | undefined) {
    render(
      <NarrativeSegments
        paragraph={{ id: 'chip-noun', segments: [{ text, emphasis: 'accent', tooltipId }] }}
        openEntity={opensNothing}
        linkColor="#d9a441"
        underlineColor="#7a5c22"
        plainColor="#e8ddc9"
        testIdPrefix="consequence-chip-noun-mark"
      />,
    );
    return screen.getByTestId('consequence-chip-noun-mark-seg-0');
  }

  it('backs the reach noun with a tooltip the registry can actually answer', () => {
    // The premise the tier rule turns on, asserted rather than assumed: if
    // `reach.stone` ever stopped resolving, the noun below would silently drop
    // to plain text and the arm after this one would pass for the wrong reason.
    expect(tooltipResolves('reach.stone')).toBe(true);
  });

  it('renders STONE underlined, focusable, and not a button', () => {
    const noun = renderNoun('Stone', 'reach.stone');
    // A span, not a button — there is no Reach page to open, so Law 21 is
    // satisfied by *not* promising a click.
    expect(noun.tagName).toBe('SPAN');
    expect(noun).not.toHaveAttribute('role', 'link');
    // ...and the underline it does carry is earned: the word answers on hover
    // and is reachable from the keyboard, so it is not the dead-chip class.
    // jsdom normalises the authored hex to `rgb()`, so the underline colour is
    // matched in the form the DOM actually reports rather than the form it was
    // written in — `#7a5c22` is `rgb(122, 92, 34)`.
    expect(noun.style.borderBottom).toBe('1px solid rgb(122, 92, 34)');
    expect(noun).toHaveAttribute('tabindex', '0');
  });

  it('drops the underline from a noun that answers nothing', () => {
    // The falsification arm. If the underline were drawn unconditionally, the
    // report's reading would be right and this would fail.
    const noun = renderNoun('Stone', undefined);
    expect(noun.tagName).toBe('SPAN');
    expect(noun.style.borderBottom).toBe('');
    expect(noun).not.toHaveAttribute('tabindex');
  });
});
