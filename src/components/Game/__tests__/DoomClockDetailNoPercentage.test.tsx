// @vitest-environment jsdom
//
// THR-1424 — the Law 15 ruling of 2026-09-10 on player-facing unitless proportions.
//
// `DoomClockDetail` was one of the two sites the ticket named. It rendered the doom's progress
// as `${pct}%` in the ring centre — a THIRD rendering of a quantity the surface already states
// twice, as the ring arc itself and as `Current Chapter N of 5`. Two sibling percentages sat on
// the same surface: the next-beat label (`Signs @ 20%`) and the per-stage threshold column.
//
// The ruling: a unitless proportion is DROPPED, and its reading is whatever the surface already
// renders non-numerically. It is explicitly NOT banded to a word ladder — the Law 13 amendment
// of 2026-08-12 rules an adverb the wrong answer to "how much?" (`grew steadily`), so banding
// here would re-derive exactly the turn that amendment exists to forbid.
//
// Each arm below pairs `not.toMatch(/%/)` with a positive assertion on the surviving reading,
// so a surface that dropped the numeral AND its replacement would fail rather than pass.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoomClockDetail } from '../DoomClockDetail';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';

const definition: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 100,
  stages: [
    { stage: 1, name: 'Whispers', tickThreshold: 0.0, events: [] },
    { stage: 2, name: 'Signs', tickThreshold: 0.2, events: [] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
  ],
};

const state: DoomClockState = {
  definitionArchetype: 'breach',
  currentTick: 25,
  totalTicks: 100,
  currentStage: 2,
  progress: 0.25,
  stageTransitions: [0, 20, 40, 60, 80],
  expired: false,
  tickModifier: 1.0,
  // These three are REQUIRED on `DoomClockState`. Spelling them out rather than casting the
  // fixture keeps it honest: a fixture that invents its own shape verifies fiction, and the
  // first draft of this file omitted them and crashed the component at its real `.filter`.
  nextEscalationSeverityModifier: 0,
  counterOmens: 0,
  resolvedEvents: [],
};

describe('DoomClockDetail — no player-facing percentage (Law 13 / Law 15, THR-1424)', () => {
  it('renders no percentage numeral anywhere on the surface', () => {
    const { baseElement } = render(
      <DoomClockDetail open onClose={() => {}} definition={definition} state={state} />
    );
    expect(baseElement.textContent).not.toMatch(/%/);
  });

  it('keeps the chapter line as the reading the dropped ring numeral duplicated', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state} />);
    // Falsification: this is the non-numeric rendering the ruling points the player at. If it
    // ever stops rendering, the arm above would be passing on a surface with no reading at all.
    expect(screen.getByText('2 of 5')).toBeInTheDocument();
  });

  it('reads the next beat as a stage name, not a threshold percentage', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state} />);
    // Previously `Tremors @ 40%`. The name alone survives; the stage list below carries where
    // it sits, through its own order and its past/current/future styling.
    // Two matches, and that is the point: the name reads in the next-beat label AND in the
    // stage list, which is the ordered non-numeric rendering the dropped threshold pointed at.
    expect(screen.getAllByText('Tremors').length).toBeGreaterThanOrEqual(2);
  });

  it('still renders the terminal state, which is not a proportion', () => {
    const expired: DoomClockState = { ...state, expired: true, progress: 1 };
    const { baseElement } = render(
      <DoomClockDetail open onClose={() => {}} definition={definition} state={expired} />
    );
    // `∞ / UNMADE` names an end state rather than answering "how much?", so the ruling leaves
    // it alone — and the surface is still free of percentages.
    expect(screen.getByText('UNMADE')).toBeInTheDocument();
    expect(baseElement.textContent).not.toMatch(/%/);
  });
});
