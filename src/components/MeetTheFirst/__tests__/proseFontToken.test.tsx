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
 * THR-1879 moved the story face to Alegreya (THR-1833): `--font-prose` now leads
 * with 'Alegreya' and keeps the old Georgia stack only as its fallback, and story
 * prose reaches the surface either as `font-family: var(--font-prose)` or through
 * the prose shorthands `--type-body-prose` / `--type-flavor`, which carry the
 * face, `--text-base` and line-height 1.6 together. A caption set in the serif (a
 * candidate's name and epithet) moved to the body face. The last `it` pins the
 * new stack; the THR-1879 browser evidence covers the layout.
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

/** The stack every migrated component used to spell for itself — now the story face's fallback. */
const REMOVED_STACK = `Georgia, 'Times New Roman', serif`;
/** The story face (THR-1833, THR-1879 § 1). */
const STORY_STACK = `'Alegreya', ${REMOVED_STACK}`;
/** The ways story prose may name its face: the token, or a prose shorthand that reads it. */
const STORY_FONT = /^var\(--font-prose\)$|^var\(--type-(?:body-prose|flavor)\)$/;

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

/** Inline `font` shorthands as authored (the prose tokens arrive this way since THR-1879). */
const fontShorthandsIn = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>('[style]')]
    .map((el) => /(?:^|;)\s*font:\s*([^;]+)/i.exec(el.getAttribute('style') ?? '')?.[1]?.trim())
    .filter((v): v is string => Boolean(v));

/** Every face the rendered tree names: font-family values plus font shorthands. */
const facesIn = (root: HTMLElement): string[] => [...fontFamiliesIn(root), ...fontShorthandsIn(root)];

describe('THR-1081 — the prose serif reaches the surface as a token', () => {
  it('renders the MeetTheFirst sensing beat with var(--font-prose), never a respelled stack', () => {
    const { container } = render(
      <SensingBeat
        candidates={[candidate(0), candidate(1), candidate(2)]}
        openingProse="Something is about to matter."
        onSelect={() => {}}
      />,
    );

    const faces = facesIn(container);
    // The beat styles prose in two places: the opening line and each candidate's
    // vignette. Both arrive through the story face's token; the candidate's name
    // caption is the body face (THR-1879 § 1, "not story").
    expect(faces.filter((f) => STORY_FONT.test(f)).length).toBeGreaterThan(0);
    expect(faces.every((f) => STORY_FONT.test(f) || f === 'var(--font-body)')).toBe(true);
    expect(container.innerHTML).not.toMatch(/Georgia/);

    // The prose itself still reaches the surface — a token migration that blanked
    // the copy would otherwise satisfy every assertion above.
    expect(container.textContent).toContain('Something is about to matter.');
    expect(container.textContent).toContain('Vignette prose for candidate 0.');
  });

  it('renders the Remembrance fragment card through the story face', () => {
    const { container } = render(
      <FragmentCard
        prose="A door you did not close."
        imageAssetPath="/art/placeholder.jpg"
        selected={false}
        onClick={() => {}}
      />,
    );

    expect(facesIn(container).some((f) => STORY_FONT.test(f))).toBe(true);
    expect(container.innerHTML).not.toMatch(/Georgia/);
    expect(container.textContent).toContain('A door you did not close.');
  });

  it('resolves the token to Alegreya, with the old stack as its fallback (THR-1879)', () => {
    const declared = /--font-prose:\s*([^;]+);/.exec(indexCss)?.[1]?.trim();
    const normalise = (stack: string) => stack.replace(/["']/g, '').replace(/\s+/g, ' ');

    expect(declared, '--font-prose is not declared in index.css').toBeTruthy();
    expect(normalise(declared!)).toBe(normalise(STORY_STACK));
    // The prose shorthands read the token, so the face moves with it.
    expect(indexCss).toMatch(/--type-body-prose:[^;]*var\(--font-prose\)/);
    expect(indexCss).toMatch(/--type-flavor:[^;]*var\(--font-prose\)/);
    // The face ships with the game (no CDN): the roman and the italic are declared.
    expect(indexCss).toMatch(/url\('\/fonts\/alegreya-variable\.woff2'\)/);
    expect(indexCss).toMatch(/url\('\/fonts\/alegreya-400-italic\.woff2'\)/);
  });
});
