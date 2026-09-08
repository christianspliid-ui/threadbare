// @vitest-environment jsdom
/**
 * The Agreements rows on the live sheet (THR-1439).
 *
 * The leverage strand has been computed on the card since THR-30 and rendered nowhere
 * a player could reach: its only renderers were `AgentDetailPanel`, which is mounted
 * nowhere (impediment #981), and the debug tab. `BondsTab` — which `AgentProfileModal`
 * actually renders — showed a placeholder. These assertions are that the strand now
 * reaches the surface, in words.
 *
 * Every face carries its absence arm, because a row that rendered unconditionally
 * would pass a presence-only test:
 *   1. a held secret, and a **stolen** one naming who it was taken from;
 *   2. a favour owed to them, and one they owe, distinguished;
 *   3. a called-in favour reading differently from a pressed one;
 *   4. the placeholder surviving on a stranger's sheet and on an empty strand;
 *   5. no numerals anywhere in the section (UI Law 4).
 *
 * These stand in for the contractual 1920×1080 capture, which no unattended run can
 * produce (`preview_start` is refused with nobody present to approve it — impediments
 * #546, #574). They prove the words reached the DOM; they do not cover what only
 * pixels can — paint, overflow, z-index, off-viewport.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BondsTab } from '../BondsTab';
import type { AgentInfoCardData, LeverageSummary } from '../../../../engine/agentDetail';

function card(leverage: LeverageSummary | undefined, knowledgeLevel = 'known'): AgentInfoCardData {
  return { name: 'Old Maerin', knowledgeLevel, leverage } as unknown as AgentInfoCardData;
}

const emptyStrand = { secretsHeld: [], secretsAbout: [], favorsOwed: [], favorsOwedToMe: [] };

function secret(extra: Record<string, unknown> = {}) {
  return {
    subjectId: 'lirik', subjectName: 'Lirik', secretType: 'hidden_debt',
    magnitude: 0.6, revealed: false, ...extra,
  };
}

function favor(extra: Record<string, unknown> = {}) {
  return {
    counterpartyId: 'hask', counterpartyName: 'Hask',
    magnitude: 0.5, context: 'pressed', isDebtor: false, ...extra,
  };
}

describe('BondsTab — Agreements (THR-1439)', () => {
  it('renders a held secret in words, naming the subject', () => {
    render(<BondsTab card={card({ ...emptyStrand, secretsHeld: [secret()] } as LeverageSummary)} />);

    const section = screen.getByTestId('modal-agreements');
    expect(section.textContent).toContain('know something about');
    expect(section.textContent).toContain('Lirik');
  });

  it('says a STOLEN secret was taken, and from whom — the pair is the point', () => {
    const stolen = render(<BondsTab card={card({
      ...emptyStrand,
      secretsHeld: [secret({ source: 'stolen', stolenFromName: 'Hask' })],
    } as LeverageSummary)} />);
    expect(stolen.getByTestId('modal-agreements').textContent).toContain('taken from Hask');
    stolen.unmount();

    // The same row with an ordinary provenance must NOT say it was taken, or the
    // assertion above would pass on a component that said it about everything.
    const cultivated = render(<BondsTab card={card({
      ...emptyStrand,
      secretsHeld: [secret({ source: 'undertaking_cultivation' })],
    } as LeverageSummary)} />);
    expect(cultivated.getByTestId('modal-agreements').textContent).not.toContain('taken from');
  });

  it('distinguishes a favour owed TO them from one they owe', () => {
    const owed = render(<BondsTab card={card({
      ...emptyStrand, favorsOwedToMe: [favor()],
    } as LeverageSummary)} />);
    expect(owed.getByTestId('modal-agreements').textContent).toContain('owes them a favour');
    owed.unmount();

    const owing = render(<BondsTab card={card({
      ...emptyStrand, favorsOwed: [favor({ isDebtor: true })],
    } as LeverageSummary)} />);
    const text = owing.getByTestId('modal-agreements').textContent ?? '';
    expect(text).toContain('They owe');
    expect(text).not.toContain('owes them a favour');
  });

  it('marks a called-in favour as asked for, and a pressed one not', () => {
    const called = render(<BondsTab card={card({
      ...emptyStrand, favorsOwedToMe: [favor({ context: 'called_in' })],
    } as LeverageSummary)} />);
    expect(called.getByTestId('modal-agreements').textContent).toContain('called in');
    called.unmount();

    const pressed = render(<BondsTab card={card({
      ...emptyStrand, favorsOwedToMe: [favor({ context: 'pressed' })],
    } as LeverageSummary)} />);
    expect(pressed.getByTestId('modal-agreements').textContent).not.toContain('called in');
  });

  it('shows no numerals — the magnitudes on the strand never reach the sheet (Law 4)', () => {
    render(<BondsTab card={card({
      secretsHeld: [secret({ magnitude: 0.87 })],
      secretsAbout: [secret({ subjectId: 'bren', subjectName: 'Bren', magnitude: 0.42 })],
      favorsOwed: [favor({ magnitude: 0.31, isDebtor: true })],
      favorsOwedToMe: [favor({ counterpartyId: 'vessa', counterpartyName: 'Vessa', magnitude: 0.95 })],
    } as LeverageSummary)} />);

    expect(screen.getByTestId('modal-agreements').textContent).not.toMatch(/\d/);
  });

  it('keeps the placeholder on a stranger, however much leverage the card carries', () => {
    render(<BondsTab card={card(
      { ...emptyStrand, secretsHeld: [secret()] } as LeverageSummary,
      'stranger',
    )} />);

    const section = screen.getByTestId('modal-agreements');
    expect(section.textContent).toContain('No known agreements');
    expect(section.textContent).not.toContain('Lirik');
  });

  it('keeps the placeholder when the strand is empty or absent', () => {
    const none = render(<BondsTab card={card(undefined)} />);
    expect(none.getByTestId('modal-agreements').textContent).toContain('No known agreements');
    none.unmount();

    const empty = render(<BondsTab card={card(emptyStrand as LeverageSummary)} />);
    expect(empty.getByTestId('modal-agreements').textContent).toContain('No known agreements');
  });
});
