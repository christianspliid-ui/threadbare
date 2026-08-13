// @vitest-environment jsdom

/**
 * proseFontToken — surface evidence for THR-1081's `--font-prose` migration.
 *
 * The contractual 1920×1080 browser capture is unavailable in an unattended run
 * (impediment #546: `preview_start` is refused with nobody present to approve
 * it), so requirement 1 of the Browser-verify clause is discharged here by
 * substitution, per THR-754. These assertions render the **real** components and
 * read the DOM they produce — not the constants they read — because a gate on the
 * constant would pass unchanged if a component computed the right value and
 * rendered something else, which is the whole failure class this migration could
 * introduce.
 *
 * On the scope test impediment #546 asks for: this change cannot move layout, and
 * the reason is assertable rather than arguable. `--font-prose` in `index.css`
 * holds the *same* stack the components spelled inline, so the resolved typeface
 * is byte-identical before and after — the last `it` in this file pins that
 * equality. A migration that swapped the stack for a different one would fail
 * there, which is exactly when a pixel pass would be owed.
 */

import { describe, expect, it } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { SensingBeat } from '../SensingBeat';
import { FragmentCard } from '../../Remembrance/FragmentCard';
import type { NarrativeCandidate } from '../../../types/meetingEncounter';

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const indexCss = readFileSync(resolve(here, '../../../index.css'), 'utf8');

/** The stack every migrated component used to spell for itself. */
const REMOVED_STACK = `Georgia, 'Times New Roman', serif`;

const candidate = (i: number): NarrativeCandidate =>
  ({
    tempId: `cand-${i}`,
    name: `Candidate ${i}`,
    archetypeId: 'archetype.wanderer',
    cultureId: 'culture.vale',
    primaryReach: 'stone',
    secondaryReach: 'heart',
    sphere: 'mind',
    vignetteText: `Vignette prose for candidate ${i}.`,
    epithet: 'a stranger at the ford',
    imageAssetPath: '/art/placeholder.jpg',
    placeholderGradient: 'linear-gradient(#000, #111)',
  }) as unknown as NarrativeCandidate;

/** Inline font-family as authored, read off the style attribute. */
const fontFamiliesIn = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>('[style]')]
    .map((el) => /font-family:\s*([^;]+)/i.exec(el.getAttribute('style') ?? '')?.[1]?.trim())
    .filter((v): v is string => Boolean(v));

describe('THR-1081 — the prose serif reaches the surface as a token', () => {
  it('renders the MeetTheFirst sensing beat with var(--font-prose), never a respelled stack', () => {
    const { container } = render(
      <SensingBeat
        candidates={[candidate(0), candidate(1), candidate(2)]}
        openingProse="Something is about to matter."
        onSelect={() => {}}
      />,
    );

    const families = fontFamiliesIn(container);
    // The beat styles prose in two places: the opening line and each candidate's
    // vignette. Both must arrive as the token.
    expect(families.length).toBeGreaterThan(0);
    expect(families.every((f) => f === 'var(--font-prose)')).toBe(true);
    expect(container.innerHTML).not.toMatch(/Georgia/);

    // The prose itself still reaches the surface — a token migration that blanked
    // the copy would otherwise satisfy every assertion above.
    expect(container.textContent).toContain('Something is about to matter.');
    expect(container.textContent).toContain('Vignette prose for candidate 0.');
  });

  it('renders the Remembrance fragment card with var(--font-prose)', () => {
    const { container } = render(
      <FragmentCard
        prose="A door you did not close."
        imageAssetPath="/art/placeholder.jpg"
        selected={false}
        onClick={() => {}}
      />,
    );

    expect(fontFamiliesIn(container)).toContain('var(--font-prose)');
    expect(container.innerHTML).not.toMatch(/Georgia/);
    expect(container.textContent).toContain('A door you did not close.');
  });

  it('resolves the token to the exact stack the components stopped spelling', () => {
    // The layout claim, asserted rather than argued: same stack in, same stack
    // out, so no glyph metric changes and no text can reflow.
    const declared = /--font-prose:\s*([^;]+);/.exec(indexCss)?.[1]?.trim();
    const normalise = (stack: string) => stack.replace(/["']/g, '').replace(/\s+/g, ' ');

    expect(declared, '--font-prose is not declared in index.css').toBeTruthy();
    expect(normalise(declared!)).toBe(normalise(REMOVED_STACK));
  });
});
