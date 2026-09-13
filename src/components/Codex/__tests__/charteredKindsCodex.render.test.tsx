// @vitest-environment jsdom

/**
 * The codex as composed, with THR-1495's four chartered kinds in it.
 *
 * This is the **browser-verify substitution** for an unattended run that cannot start a
 * dev server (`Docs/canon/verification-gates.md` § Browser-verify, the jsdom-render
 * route) — recorded in the commit body as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 *
 * `charteredKindsCodex.test.ts` beside this one pins the *entries*; this one pins the
 * **surface**: that each chartered kind reaches a tab a player can press, that pressing it
 * fills the grid, that a card opens a page whose rows read as words — and the half a unit
 * test cannot show, that the two **withheld** kinds are absent from the sidebar entirely.
 *
 * An absence assertion is the load-bearing one here. Four categories rendering proves the
 * charters; only the absence proves the withholds were withholds rather than work left
 * undone, which is the exact distinction THR-1495 exists to make legible.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Codex from '../Codex';
import { ARTIFACT_TEMPLATES } from '../../../data/artifact-templates';
import { COMPANION_TEMPLATES } from '../../../data/companion-templates';
import { NUDGE_CARD_LIBRARY } from '../../../data/nudge-card-library';
import {
  AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../../../data/ambition-templates';

const AMBITION_COUNT =
  AMBITION_TEMPLATES.length +
  GRIEVANCE_AMBITION_TEMPLATES.length +
  EVENT_MINTED_AMBITION_TEMPLATES.length;

function cardCount(): number {
  return document.querySelectorAll('[data-codex-entry-id]').length;
}

/** Open a category by its sidebar label, as a player would. */
function openCategory(label: string): void {
  fireEvent.click(screen.getAllByText(label)[0]);
}

describe('codex surface — the three chartered categories', () => {
  it('offers Companions, Ambitions and The Repertoire as pressable tabs', () => {
    // Law 21: a concept the game holds reaches a page. Before THR-1495 these three kinds
    // had no tab at all, so their content cards could offer no sheet.
    render(<Codex />);
    for (const label of ['Companions', 'Ambitions', 'The Repertoire']) {
      expect(screen.getAllByText(label).length, `no "${label}" tab in the sidebar`).toBeGreaterThan(0);
    }
  });

  it('fills the Companions grid with every profession, each a person and not a stat line', () => {
    render(<Codex />);
    openCategory('Companions');
    expect(cardCount()).toBe(COMPANION_TEMPLATES.length);
    // The profession is the card's name, and `goodFor` is the line the player reads to
    // know why they would want this person along.
    expect(screen.getByText('Wayfarer')).toBeTruthy();
    expect(
      screen.getByText(/Knows the fords, the passes/),
      'the companion card shows no reason to want them',
    ).toBeTruthy();
  });

  it('fills the Ambitions grid and groups it by the kind of want', () => {
    render(<Codex />);
    openCategory('Ambitions');
    expect(cardCount()).toBe(AMBITION_COUNT);
    expect(screen.getByText('Dominate Regional Trade')).toBeTruthy();
    // The rail resolves the engine's own category spellings to words (Law 14).
    for (const word of ['Dominion', 'Vengeance', 'Devotion']) {
      expect(screen.getAllByText(new RegExp(`^${word}$`)).length, `no "${word}" rail group`).toBeGreaterThan(0);
    }
  });

  it('fills The Repertoire with the whole deck, grouped by how a god comes to hold a card', () => {
    render(<Codex />);
    openCategory('The Repertoire');
    expect(cardCount()).toBe(NUDGE_CARD_LIBRARY.length);
    expect(screen.getByText('Press The Odds')).toBeTruthy();
    for (const group of ['Every God Holds', 'Sphere Signatures', 'Hunger Uniques', 'Earned In Play']) {
      expect(screen.getAllByText(group).length, `no "${group}" rail group`).toBeGreaterThan(0);
    }
  });
});

describe('codex surface — legendary artifacts inside Possessions', () => {
  it('adds a Legendary rail group rather than a tab of three', () => {
    render(<Codex />);
    openCategory('Possessions');
    const legendary = screen.getAllByText('Legendary');
    expect(legendary.length, 'no Legendary group in the Possessions rail').toBeGreaterThan(0);
    fireEvent.click(legendary[0]);
    expect(cardCount(), 'the Legendary group does not narrow to the artifacts').toBe(
      ARTIFACT_TEMPLATES.length,
    );
    expect(screen.getByText('The Worldforge Anvil')).toBeTruthy();
  });
});

describe('codex surface — a chartered card opens a page that reads as words', () => {
  it('opens the companion page with its rows banded, not numbered', () => {
    // Law 13: magnitudes render as words. A companion lends raw capability points, and the
    // page must never show one — this is the assertion that would have caught the borrowed
    // formatter, which banded every value onto a single rung instead.
    render(<Codex />);
    openCategory('Companions');
    fireEvent.click(document.querySelector('[data-codex-entry-id="companion.sellsword-band"]')!);

    expect(screen.getByText('What they are good for')).toBeTruthy();
    const page = document.body.textContent ?? '';
    expect(page).toContain('a commanding edge in Iron');
    // No bare capability numeral anywhere on the page.
    expect(page, 'a raw contribution numeral reached the page').not.toMatch(/\biron[:=]\s*\d/i);
  });

  it('opens a card page saying what it does and the decision it puts to the player', () => {
    render(<Codex />);
    openCategory('The Repertoire');
    fireEvent.click(document.querySelector('[data-codex-entry-id="card.mercy.core"]')!);

    const page = document.body.textContent ?? '';
    expect(page).toContain('Critical failure becomes ordinary failure');
    expect(page).toContain('Cheap disaster-proofing');
    expect(page).toContain('How you hold it');
    // `hostSystem` is a designer's word — `Riders (no_crit_fail)` names an engine symbol.
    expect(page, 'the card page names the engine symbol it is wired to').not.toContain('no_crit_fail');
  });

  it('opens an ambition page with its marks in the prose they are narrated with', () => {
    render(<Codex />);
    openCategory('Ambitions');
    fireEvent.click(document.querySelector('[data-codex-entry-id="ambition_dominate_trade"]')!);

    const page = document.body.textContent ?? '';
    expect(page).toContain('She set her eyes on the trade roads');
    expect(page).toContain('What finishes it');
    // The completion rule as a sentence, never `2 of 3`.
    expect(page).toContain('Two of its three marks');
  });
});

describe('codex surface — the two withheld kinds are absent', () => {
  it('offers no Encounters and no Omens tab', () => {
    // The half that makes the ruling legible. THR-1495 withheld these two on purpose: an
    // encounter catalog is the answer key, and an omen catalog turns dread into a lookup.
    // Falsify: charter either kind — a tab appears and this fails.
    render(<Codex />);
    const sidebar = document.querySelector('nav');
    expect(sidebar).not.toBeNull();
    expect(sidebar!.textContent).not.toMatch(/Encounters/);
    expect(sidebar!.textContent).not.toMatch(/Omens/);
  });

  it('shows the chartered four and the withheld two as different states, not one silence', () => {
    // The defect THR-1495 removed, stated as a test: before it, all six kinds reached the
    // player identically (no tab, no reason). Now four have a tab and two have a recorded
    // ruling — so the sidebar itself distinguishes them.
    render(<Codex />);
    const sidebar = document.querySelector('nav')!.textContent ?? '';
    const chartered = ['Companions', 'Ambitions', 'The Repertoire'].filter(l => sidebar.includes(l));
    const withheld = ['Encounters', 'Omens'].filter(l => sidebar.includes(l));
    expect(chartered).toHaveLength(3);
    expect(withheld).toHaveLength(0);
  });
});
