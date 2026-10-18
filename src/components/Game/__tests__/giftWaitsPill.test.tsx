// @vitest-environment jsdom
/**
 * THR-1809 — while a ready opening gift is held, the god is told it waits, and a press
 * opens the gift's modal. THR-1875 (frame plan § F4) moved the offer from its floating
 * pill to a Waiting row in the top bar's Needs you, and the raise above a player surface
 * to the Needs-you pill; these tests follow it there. Pool beats keep their own words.
 */
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AscendantBeatModal, GIFT_PILL_Z, beatOfferWords } from '../AscendantBeatModal';
import { NeedsYou } from '../frame/NeedsYou';
import { SPINE_BEAT_PRESENTATION } from '../../../data/ascendant-beat-content';
import { buildNeedsYou, type NeedsYouSources } from '../../../engine/views/needsYou';
import type { PendingBeat } from '../../../types/ascendantBeat';

const SEAT = 'beat.spine.the_seat';

function pendingFor(beatId: string, kind: PendingBeat['kind']): PendingBeat {
  return { beatId, kind, offeredTurn: 1 } as PendingBeat;
}

function vmFor(pending: PendingBeat, title: string | null = null) {
  const words = beatOfferWords(pending);
  const src: NeedsYouSources = {
    currentTick: 10,
    beatOffer: { kind: words.kind, beatId: pending.beatId, eyebrow: words.eyebrow, title, tick: 10 },
    receipts: [],
    namedPause: null,
    held: [],
    alerts: [],
  };
  return buildNeedsYou(src);
}

/** GameView's two render sites for a pending beat, around `beatEntered`. */
function Harness({ pending, raised = false }: { pending: PendingBeat; raised?: boolean }) {
  const [entered, setEntered] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <>
      {!entered && (
        <NeedsYou
          vm={vmFor(pending)}
          open={open}
          onOpenChange={setOpen}
          guarded={false}
          raised={raised}
          onPressRow={row => { if (row.opens === 'beatOffer') setEntered(true); }}
        />
      )}
      {entered && <AscendantBeatModal open pending={pending} onResolve={() => {}} />}
    </>
  );
}

describe('a held opening gift in Needs you', () => {
  it('reads "A gift waits: <gift eyebrow>" as a Waiting row', () => {
    const vm = vmFor(pendingFor(SEAT, 'spine'));
    expect(vm.groups.waiting[0].line).toBe(`A gift waits: ${SPINE_BEAT_PRESENTATION[SEAT].eyebrow}`);
    expect(vm.groups.waiting[0].opens).toBe('beatOffer');
  });

  it('the raised pill draws above the player surfaces at GIFT_PILL_Z', () => {
    render(<Harness pending={pendingFor(SEAT, 'spine')} raised />);
    const raised = screen.getByTestId('needs-you-pill-raised');
    expect(raised.style.zIndex).toBe(String(GIFT_PILL_Z));
  });

  it('stays in the top bar (no raised copy) when not raised', () => {
    render(<Harness pending={pendingFor(SEAT, 'spine')} />);
    expect(screen.queryByTestId('needs-you-pill-raised')).toBeNull();
    expect(screen.getByTestId('needs-you-pill').getAttribute('data-needs-you-count')).toBe('1');
  });

  it('opens the gift from its row, and no floating offer pill exists', () => {
    render(<Harness pending={pendingFor(SEAT, 'spine')} />);
    expect(screen.queryByTestId('beat-offer-banner')).toBeNull();
    expect(screen.queryByText(SPINE_BEAT_PRESENTATION[SEAT].title)).toBeNull();
    fireEvent.click(screen.getByTestId('needs-you-pill').querySelector('button')!);
    fireEvent.click(document.querySelector('[data-needs-you-row="beat_offer"]')!);
    expect(screen.getByText(SPINE_BEAT_PRESENTATION[SEAT].title)).toBeTruthy();
  });

  it('a pool beat keeps its own words and never its id', () => {
    const vm = vmFor(pendingFor('beat.pool.some_beat', 'introduction'), 'The Riverfolk');
    expect(vm.groups.waiting[0].line).not.toContain('A gift waits');
    expect(vm.groups.waiting[0].line).toContain('The Riverfolk');
    expect(vm.groups.waiting[0].line).not.toContain('some_beat');
  });
});
