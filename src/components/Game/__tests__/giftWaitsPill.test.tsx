// @vitest-environment jsdom
/**
 * THR-1809 — while a ready opening gift is held, the offer pill carries it worded
 * "A gift waits", and a click on the pill opens the gift's modal. Pool beats keep
 * their own pill wording.
 */
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AscendantBeatModal, AscendantBeatOfferBanner, GIFT_PILL_Z } from '../AscendantBeatModal';
import { SPINE_BEAT_PRESENTATION } from '../../../data/ascendant-beat-content';
import { GIFT_WAITS_COPY } from '../../../data/ui-content';
import type { PendingBeat } from '../../../types/ascendantBeat';

const SEAT = 'beat.spine.the_seat';

function pendingFor(beatId: string, kind: PendingBeat['kind']): PendingBeat {
  return { beatId, kind, offeredTurn: 1 } as PendingBeat;
}

/** GameView's two render sites for a pending beat, around `beatEntered`. */
function Harness({ pending }: { pending: PendingBeat }) {
  const [entered, setEntered] = useState(false);
  return (
    <>
      {!entered && <AscendantBeatOfferBanner pending={pending} onEnter={() => setEntered(true)} />}
      {entered && <AscendantBeatModal open pending={pending} onResolve={() => {}} />}
    </>
  );
}

describe('AscendantBeatOfferBanner — a held opening gift', () => {
  it('reads "A gift waits — <gift eyebrow> · Open ▸" above the player surfaces', () => {
    render(<AscendantBeatOfferBanner pending={pendingFor(SEAT, 'spine')} onEnter={() => {}} />);
    const pill = screen.getByTestId('beat-offer-banner');
    expect(pill.textContent).toContain(GIFT_WAITS_COPY.eyebrow);
    expect(pill.textContent).toContain(SPINE_BEAT_PRESENTATION[SEAT].eyebrow);
    expect(pill.textContent).toContain(GIFT_WAITS_COPY.cta);
    expect(pill.getAttribute('data-gift-waits')).toBe('true');
    expect(pill.style.zIndex).toBe(String(GIFT_PILL_Z));
  });

  it('opens the gift when clicked', () => {
    render(<Harness pending={pendingFor(SEAT, 'spine')} />);
    expect(screen.queryByText(SPINE_BEAT_PRESENTATION[SEAT].title)).toBeNull();
    fireEvent.click(screen.getByTestId('beat-offer-banner'));
    expect(screen.queryByTestId('beat-offer-banner')).toBeNull();
    expect(screen.getByText(SPINE_BEAT_PRESENTATION[SEAT].title)).toBeTruthy();
  });

  it('a pool beat keeps its own wording', () => {
    render(<AscendantBeatOfferBanner pending={pendingFor('beat.pool.some_beat', 'introduction')} onEnter={() => {}} />);
    const pill = screen.getByTestId('beat-offer-banner');
    expect(pill.textContent).not.toContain(GIFT_WAITS_COPY.eyebrow);
    expect(pill.textContent).toContain('Enter ▸');
    expect(pill.getAttribute('data-gift-waits')).toBeNull();
  });
});
