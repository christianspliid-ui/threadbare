// @vitest-environment jsdom
/**
 * The three-tier contract, enforced — THR-1172 (director bug report 2026-08-18).
 *
 * `NarrativeSegments` has stated the rule in its own header since THR-1084: the
 * underline is drawn on what the surface can actually *do*, never on the mere
 * presence of an id. It did not hold to it. The style condition read
 * `seg.referenceId || explains`, and a `referenceId` is the narrative linker's
 * colon-grammar bookkeeping (`cast:<key>`, `location:<key>`) that nothing
 * downstream consumes — only `explains` gets a `Tooltip`, only `open` gets a
 * click. So a segment carrying one drew the mark that promises an answer and
 * then had none. Christian, on the deployed build: *"there is no tooltipping
 * and/or linking to a detail page or explanation of the concept."*
 *
 * **The load-bearing case here is the negative one.** Every tier below is
 * asserted with its underline *and* the text tier is asserted with its absence,
 * because a renderer that underlines everything satisfies all three positive
 * assertions while looking exactly like the bug. Presence-only coverage is what
 * let this ship: the link and explain tiers were always right.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { NarrativeSegments } from '../NarrativeSegments';
import type { NarrativeEntityKind } from '../NarrativeSegments';
import type { EncounterStageNarrativeParagraph } from '../types';
import { resolveTooltip, tooltipResolves } from '../../../../engine/tooltipResolver';

afterEach(cleanup);

/**
 * An id the registry deliberately does not carry.
 *
 * Held in a constant rather than written inline as a quoted `tooltipId` string,
 * because `conceptTooltipIds.test.ts` sweeps every such literal under `src/` —
 * fixtures included, and on purpose: *"a dangling id there teaches the wrong
 * shape to every test that copies it."* That rule is right and stays at full
 * strength; this is the one shape it cannot mean. A negative fixture asserting
 * that danglers get **no** underline needs an id that resolves to nothing, so
 * naming it here states the intent instead of hiding it behind an exclusion.
 */
const DELIBERATELY_UNREGISTERED = 'ui.no_such_concept';

const LINK = 'rgb(212, 175, 55)';
const UNDERLINE = 'rgb(120, 100, 40)';
const PLAIN = 'rgb(200, 200, 200)';

/** Underlined ⇔ the element carries a bottom border. */
function underlined(el: HTMLElement): boolean {
  return el.style.borderBottom !== '' && el.style.borderBottom !== 'none';
}

function renderParagraph(
  segments: EncounterStageNarrativeParagraph['segments'],
  openEntity: (id: string | undefined, kind: NarrativeEntityKind | undefined) => (() => void) | undefined,
) {
  return render(
    <NarrativeSegments
      paragraph={{ id: 'p', segments }}
      openEntity={openEntity}
      linkColor={LINK}
      underlineColor={UNDERLINE}
      plainColor={PLAIN}
      testIdPrefix="seg"
    />,
  );
}

/** Opens anything with an id — so a tier that stays text did so on its own merits. */
const openAnything = (id: string | undefined) => (id ? () => {} : undefined);
/** Opens nothing — the fail-open host. */
const openNothing = () => undefined;

describe('THR-1172 — an underline must earn itself', () => {
  it('text tier: a referenceId-only segment renders WITHOUT an underline', () => {
    // The regression this ticket exists for. `referenceId` is scene bookkeeping;
    // it reaches no tooltip and no click, so it must reach no underline either.
    renderParagraph([{ text: 'the keeper', referenceId: 'cast:keeper' }], openNothing);

    const seg = screen.getByTestId('seg-seg-0');
    expect(seg.textContent).toBe('the keeper');
    expect(underlined(seg)).toBe(false);
    // ...and it is not reachable by keyboard either: a tooltip nobody can open
    // is inert by another name (Laws 17/23).
    expect(seg.getAttribute('tabindex')).toBeNull();
  });

  it('text tier: a bare segment renders WITHOUT an underline', () => {
    renderParagraph([{ text: 'just words' }], openNothing);
    expect(underlined(screen.getByTestId('seg-seg-0'))).toBe(false);
  });

  it('explain tier: a resolving tooltipId underlines, is focusable, and does not click', () => {
    renderParagraph([{ text: 'a favour owed', tooltipId: 'ui.favour_owed' }], openNothing);

    const seg = screen.getByTestId('seg-seg-0');
    expect(underlined(seg)).toBe(true);
    expect(seg.getAttribute('tabindex')).toBe('0');
    expect(seg.tagName).toBe('SPAN');
    expect(seg.getAttribute('role')).toBeNull();
  });

  it('explain tier: a DANGLING tooltipId gets no underline', () => {
    // The gate below refuses to ship one of these, but the renderer must not
    // depend on the gate: styling is decided by whether the registry answers.
    renderParagraph([{ text: 'a favour owed', tooltipId: DELIBERATELY_UNREGISTERED }], openNothing);
    expect(underlined(screen.getByTestId('seg-seg-0'))).toBe(false);
  });

  it('link tier: a routable entity underlines and fires its handler', () => {
    const onOpen = vi.fn();
    renderParagraph(
      [{ text: 'Sacred Grove', entityId: 'loc_grove_1', entityKind: 'location' }],
      (id, kind) => (id && kind === 'location' ? onOpen : undefined),
    );

    const seg = screen.getByTestId('seg-seg-0');
    expect(underlined(seg)).toBe(true);
    fireEvent.click(seg);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('link tier: an entity this host cannot open falls back to text, not a dead link', () => {
    // Law 21's fail-open clause. The id is present and real; the *host* is the
    // one that cannot serve it, and a wrong-surface click is worse than none.
    renderParagraph(
      [{ text: 'Sacred Grove', entityId: 'loc_grove_1', entityKind: 'location' }],
      openNothing,
    );
    expect(underlined(screen.getByTestId('seg-seg-0'))).toBe(false);
  });

  it('every tier at once: exactly the two answerable segments are underlined', () => {
    // The composed assertion — a renderer that underlines everything passes each
    // positive case above and fails here.
    renderParagraph(
      [
        { text: 'Sacred Grove', entityId: 'loc_grove_1', entityKind: 'location' },
        { text: 'a favour owed', tooltipId: 'ui.favour_owed' },
        { text: 'the keeper', referenceId: 'cast:keeper' },
        { text: 'plain words' },
      ],
      openAnything,
    );

    const marks = [0, 1, 2, 3].map(i => underlined(screen.getByTestId(`seg-seg-${i}`)));
    expect(marks).toEqual([true, true, false, false]);
  });
});

describe('THR-1172 — location.* explains itself', () => {
  it('resolves a place KIND with no graph context, which is what Tooltip has', () => {
    // The whole reason this arm leads with the static half. `Tooltip` and
    // `tooltipResolves` both call the resolver with no context, so an arm that
    // could only answer with a graph would be inert at the one call site the
    // player hovers — and Sacred Grove would keep the silence it had.
    const resolved = resolveTooltip('location.grove');
    expect(resolved?.label).toBe('Grove');
    expect(resolved?.desc).toBeTruthy();
    expect(tooltipResolves('location.grove')).toBe(true);
  });

  it('does not invent an answer for an unknown place', () => {
    expect(resolveTooltip('location.not_a_real_kind')).toBeNull();
    expect(tooltipResolves('location.not_a_real_kind')).toBe(false);
  });

  it('the favour concept resolves, so the chip noun can explain itself', () => {
    const resolved = resolveTooltip('ui.favour_owed');
    expect(resolved?.label).toBe('A Favour Owed');
    // Law 18 — a tooltip is a sentence, not an essay.
    expect(resolved?.desc).toBeDefined();
    expect(resolved!.desc!.length).toBeLessThanOrEqual(200);
  });
});
