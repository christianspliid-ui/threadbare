// @vitest-environment jsdom
/**
 * THR-2195 — the bond scene must never open cut off at the top.
 *
 * Cold playtest round 7 (3/3 testers): the bond test stage centred its column
 * with `justify-content: center` inside an `overflow-y-auto` box. When the column
 * (portrait, god voice, setup prose, whole hand) is taller than 1080px, half the
 * overflow spills above the top edge, where scrolling cannot reach it. The fix
 * centres with `margin-block: auto` on a top-aligned box, and fits the test
 * column to the viewport the way FormativeTestBeat does (THR-1804).
 */
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BondBeat, BOND_HAND_ROW_WIDTH_PX, BOND_STAGE_CLASS } from '../BondBeat';
import { CARDS_PER_ROW } from '../../Game/encounter-stage/shells/NudgePhaseShell';
import { CARD_WIDTH_PX } from '../../shared/CardFace';
import { MEETING_BOND_TEST } from '../../../data/meeting-bond-test';
import type { NarrativeCandidate, SparkVision } from '../../../types/meetingEncounter';
import type { StoredHungerId } from '../../../types/hunger';

const CANDIDATE = {
  tempId: 'cand.0',
  name: 'Seren Vale',
  epithet: 'the apprentice',
  sphere: 'life',
  imageAssetPath: '',
  placeholderGradient: 'linear-gradient(#000, #111)',
} as unknown as NarrativeCandidate;

const VISION = {
  portraitAssetPath: '',
  portraitPlaceholder: 'linear-gradient(#000, #111)',
} as unknown as SparkVision;

function renderBond() {
  return render(
    <BondBeat
      candidate={CANDIDATE}
      vision={VISION}
      hungerId={'hunger.witness' as StoredHungerId}
      primarySphere="life"
      bondTest={MEETING_BOND_TEST}
      essencePool={{ life: 500 }}
      seed={7}
      onComplete={() => {}}
    />,
  );
}

/** A flex box that both centres its main axis and scrolls loses its overflow above the top. */
function assertNoUnsafeCentering(el: HTMLElement) {
  const classes = el.className.split(/\s+/);
  expect(classes).not.toContain('justify-center');
  expect(el.style.justifyContent).not.toBe('center');
}

describe('THR-2195 — bond stages centre safely, never spill above the top', () => {
  it('the shared stage class is top-aligned and scrollable, with no bare justify-center', () => {
    expect(BOND_STAGE_CLASS.split(/\s+/)).not.toContain('justify-center');
    expect(BOND_STAGE_CLASS).toContain('overflow-y-auto');
  });

  it('the bond test stage centres its column with auto margins and fits it to the viewport', () => {
    renderBond();
    const stage = screen.getByTestId('bond-test-stage');
    assertNoUnsafeCentering(stage);
    const column = screen.getByTestId('bond-test-column');
    expect(column.parentElement).toBe(stage);
    expect(column.style.marginBlock).toBe('auto');
    // The fit ran (jsdom measures 0px, so it leaves the column at natural size).
    expect(column.dataset.fitScale).toBe('1');
  });

  it('the column holds a full hand row and sets the portrait beside the setup, so 8 cards take two rows', () => {
    expect(BOND_HAND_ROW_WIDTH_PX).toBe(CARDS_PER_ROW * CARD_WIDTH_PX + (CARDS_PER_ROW - 1) * 12);
    renderBond();
    const column = screen.getByTestId('bond-test-column');
    expect(column.style.boxSizing).toBe('content-box');
    expect(column.style.maxWidth).toBe(`${BOND_HAND_ROW_WIDTH_PX}px`);
    const header = screen.getByTestId('bond-test-header');
    expect(header.style.display).toBe('flex');
    expect(header.contains(screen.getByTestId('bond-test-setup'))).toBe(true);
  });

  it('the reveal and naming stages centre safely too', () => {
    renderBond();
    const silent = screen.getAllByRole('button').find((b) => /silent|fate/i.test(b.textContent ?? ''));
    expect(silent).toBeDefined();
    fireEvent.click(silent!);
    const reveal = screen.getByTestId('bond-reveal-stage');
    assertNoUnsafeCentering(reveal);
    expect((reveal.firstElementChild as HTMLElement).style.marginBlock).toBe('auto');

    fireEvent.click(screen.getByTestId('bond-reveal-continue'));
    const naming = screen.getByTestId('bond-naming-stage');
    assertNoUnsafeCentering(naming);
    expect((naming.firstElementChild as HTMLElement).style.marginBlock).toBe('auto');
  });
});
