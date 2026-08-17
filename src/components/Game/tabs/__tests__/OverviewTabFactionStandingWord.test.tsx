// @vitest-environment jsdom
/**
 * Faction standing renders a word, never a numeral (THR-1138, Law 13).
 *
 * The character sheet's Faction section used to print `62%` beside the standing
 * bar (`{Math.round(card.factionReputation * 100)}%`, `tabular-nums`). Law 13
 * (`Docs/design-system/laws.md`) forbids raw magnitudes on mortal-facing
 * surfaces — the same law removed "auto-resolves in 4 ticks" (THR-1070).
 *
 * The fix keeps the bar and swaps the numeral for the engine's existing absolute
 * standing ladder, `getReputationWord` (Distrusted → Unknown → Accepted →
 * Respected → Revered). The bar itself stays: a *visual* magnitude is sanctioned
 * by the THR-1082 pips/fill idiom, and only the digits were the violation.
 *
 * The expected words are sourced from `getReputationWord` rather than typed as
 * literals, so these assertions exercise ladder → surface → DOM instead of
 * restating the ladder in a second place that could drift from it.
 *
 * Note the deliberate scoping: "no numeral" is asserted against the **Faction
 * section**, not the whole sheet, because other sections legitimately carry
 * digits (quote counts, dates). A card-wide regex would pass or fail for reasons
 * that have nothing to do with this ticket.
 *
 * These stand in for the contractual 1920×1080 capture, which no unattended run
 * can produce (impediments #546, #574 — `preview_start` is refused with nobody
 * present to approve it). They cover that the word reached the surface and the
 * numeral left it; they do not cover what only pixels can (paint, overflow,
 * z-index, off-viewport).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';
import type { KnowledgeLevel } from '../../../../types/familiarity';
import { getReputationWord } from '../../../../data/domain-words';

/** Standing high enough to sit in the top band, so the word is unambiguous. */
const RESPECTED_STANDING = 0.62;

function cardWithFaction(
  knowledgeLevel: KnowledgeLevel,
  factionReputation: number = RESPECTED_STANDING,
): AgentInfoCardData {
  return {
    name: 'Sevrin',
    knowledgeLevel,
    factionName: 'The Ashen Concord',
    factionRank: 'Warden',
    factionReputation,
    factionThemeColor: '#c9a227',
  } as unknown as AgentInfoCardData;
}

/**
 * The Faction `<section>`, located via its heading rather than a class or DOM
 * position — the heading is the part the player reads, so it is the stable
 * handle.
 */
function factionSection(container: HTMLElement): HTMLElement {
  const heading = screen.getByText('Faction');
  const section = heading.closest('section');
  expect(section, 'Faction section should render').not.toBeNull();
  expect(container.contains(section)).toBe(true);
  return section as HTMLElement;
}

describe('OverviewTab — faction standing word (THR-1138)', () => {
  it('renders the standing as a word at `known`', () => {
    const { container } = render(<OverviewTab card={cardWithFaction('known')} />);

    // Sourced from the ladder, not typed literally — this is the link under test.
    const expected = getReputationWord(RESPECTED_STANDING);
    expect(factionSection(container)).toHaveTextContent(expected);
  });

  it('renders no numeral in the Faction section at `known`', () => {
    const { container } = render(<OverviewTab card={cardWithFaction('known')} />);

    const text = factionSection(container).textContent ?? '';
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/%/);
  });

  it('keeps the standing bar — the sanctioned visual magnitude (THR-1082)', () => {
    const { container } = render(<OverviewTab card={cardWithFaction('known')} />);

    // The fill element carries the magnitude as CSS width. A percentage in a
    // style attribute is not a rendered numeral; the player sees a bar length.
    //
    // Selected by test id rather than "first element with an inline width"
    // (THR-1149): the faction heraldry tile now renders earlier in this section
    // and carries its own inline width, so the positional selector would have
    // quietly started measuring the wrong element and still passed a `toBe`.
    const fill = factionSection(container).querySelector<HTMLElement>('[data-testid="faction-standing-fill"]');
    expect(fill, 'standing bar fill should still render').not.toBeNull();
    expect(fill!.style.width).toBe('62%');
    // ...and that width must not have leaked into the visible text.
    expect(fill!.textContent).toBe('');
  });

  it('renders no numeral at any knowledge level that shows the section', () => {
    // 'recognised' shows the faction but not the standing row; 'known' and above
    // show both. All must be numeral-free (the ticket's Done-when).
    for (const level of ['recognised', 'known', 'intimate', 'transparent'] as const) {
      const { container, unmount } = render(<OverviewTab card={cardWithFaction(level)} />);

      const text = factionSection(container).textContent ?? '';
      expect(text, `Faction section at ${level} should carry no digits`).not.toMatch(/\d/);

      unmount();
    }
  });

  it('moves through the ladder with the underlying standing', () => {
    // Two standings that band differently prove the surface reads the value
    // rather than printing one constant word.
    const low = 0.1;
    const high = 0.9;
    expect(getReputationWord(low)).not.toBe(getReputationWord(high));

    const lowRender = render(<OverviewTab card={cardWithFaction('known', low)} />);
    expect(factionSection(lowRender.container)).toHaveTextContent(getReputationWord(low));
    lowRender.unmount();

    const highRender = render(<OverviewTab card={cardWithFaction('known', high)} />);
    expect(factionSection(highRender.container)).toHaveTextContent(getReputationWord(high));
    highRender.unmount();
  });
});
