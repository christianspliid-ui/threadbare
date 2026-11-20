/**
 * THR-2259 — popups no longer open over the player's moment.
 *
 * (a) A chapter's live answering card holds a due gift (the Seat). The step from the
 *     chapter's veil to the answering card is no resume boundary; the gift enters only
 *     once the chapter's Aftermath has closed.
 * (b) An armed card holds every arrival (vision, premonition, story beat, moment,
 *     popup), a world-opened chapter and a due gift until it is cast or set down.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveInterrupts,
  worldOpenedEncounterHeldBy,
  type InterruptSnapshot,
} from '../interruptRegistry';
import {
  ANSWERING_CARD_SURFACE_ID,
  giftHoldingInterrupts,
  resolveGiftDelivery,
  type GiftDeliveryInput,
} from '../giftDelivery';
import { GIFT_QUIET_AFTER_INPUT_MS } from '../../../data/ascendant-beat-content';

const closed: InterruptSnapshot = {
  interruptsSuppressed: false,
  encounterOpen: false,
  meetingPending: false,
  hasAscendantIdentity: true,
  premonitionPending: false,
  vignettePending: false,
  storyBeatPending: false,
  ascendantBeatEntered: false,
  choiceSetPending: false,
  emergenceDecisionPending: false,
  divineReceiptPending: false,
  momentPending: false,
  chapterLedgerOpen: false,
  courtOpen: false,
  popupQueued: false,
};
const snap = (over: Partial<InterruptSnapshot>): InterruptSnapshot => ({ ...closed, ...over });

const QUIET = GIFT_QUIET_AFTER_INPUT_MS * 10;
function gift(over: Partial<GiftDeliveryInput> = {}): GiftDeliveryInput {
  return {
    pendingBeatId: 'beat.spine.the_seat',
    isSpine: true,
    isArrivalBeat: false,
    suppressed: false,
    journeyVignettePending: false,
    otherInterruptsOpen: [],
    playerSurfacesOpen: [],
    msSinceLastInput: QUIET,
    atResumeBoundary: false,
    ...over,
  };
}

/** The gift's interrupt list for one snapshot, as GameView builds it. */
function giftInterruptsFor(s: InterruptSnapshot): string[] {
  const r = resolveInterrupts(s);
  return giftHoldingInterrupts(r.open, r.rendering);
}

/**
 * GameView's boundary rule, replayed over a sequence of snapshots: a boundary is the
 * render where the gift's interrupt list goes from non-empty to empty. Returns, per
 * step, whether the gift would enter on that render.
 */
function replay(steps: InterruptSnapshot[]): { key: string; enter: boolean }[] {
  let prev = '';
  return steps.map(s => {
    const list = giftInterruptsFor(s);
    const key = list.join('|');
    const atBoundary = prev !== '' && key === '';
    prev = key;
    const d = resolveGiftDelivery(gift({ otherInterruptsOpen: list, atResumeBoundary: atBoundary, msSinceLastInput: 0 }));
    return { key, enter: d.enter };
  });
}

describe('THR-2259 (a) — the answering card holds a due gift', () => {
  const chapter = snap({ encounterOpen: true });
  const answering = snap({ encounterOpen: true, encounterAnsweringLive: true });
  const aftermath = snap({ encounterOpen: true });
  const done = snap({});

  it('the answering card stops no time, yet counts as an interrupt for the gift', () => {
    const r = resolveInterrupts(answering);
    expect(r.open).toEqual([]);
    expect(r.rendering).toContain('encounter-answering');
    expect(giftHoldingInterrupts(r.open, r.rendering)).toEqual([ANSWERING_CARD_SURFACE_ID]);
  });

  it('with the chapter answering, a due Seat is held by the interrupt, even at a boundary', () => {
    const d = resolveGiftDelivery(gift({ otherInterruptsOpen: giftInterruptsFor(answering), atResumeBoundary: true }));
    expect(d.enter).toBe(false);
    expect(d.heldBy).toContain('interrupt');
  });

  it('Play is no resume boundary: the Seat enters only once the Aftermath closes', () => {
    const run = replay([chapter, answering, answering, aftermath, done]);
    expect(run.map(s => s.enter)).toEqual([false, false, false, false, true]);
    expect(run[1].key).toBe(ANSWERING_CARD_SURFACE_ID);
  });

  it('a card that ends with nothing to open still lets the gift in when it closes', () => {
    const run = replay([chapter, answering, done]);
    expect(run.map(s => s.enter)).toEqual([false, false, true]);
  });

  it('the gift modal and the player surfaces still never hold the gift as interrupts', () => {
    expect(giftHoldingInterrupts(['AscendantBeatModal', 'ChapterLedger', 'ScryOverlay'], [])).toEqual([]);
  });
});

describe('THR-2259 (b) — an armed card holds every arrival', () => {
  const arrivals: Array<[string, Partial<InterruptSnapshot>]> = [
    ['JourneyVignetteModal', { vignettePending: true }],
    ['PremonitionModal', { premonitionPending: true }],
    ['StoryBeatModal', { storyBeatPending: true }],
    ['MomentCard', { momentPending: true }],
    ['EventPopup', { popupQueued: true }],
  ];

  for (const [id, over] of arrivals) {
    it(`${id} waits while a card is armed and mounts once it is cast or set down`, () => {
      const armed = resolveInterrupts(snap({ ...over, cardArmed: true }));
      expect(armed.open).not.toContain(id);
      expect(armed.heldArrivals.find(h => h.id === id)?.heldBy).toContain('card_armed');
      // Held, it still stops the world.
      expect(armed.anyOpen).toBe(true);

      const disarmed = resolveInterrupts(snap({ ...over, cardArmed: false }));
      expect(disarmed.open).toContain(id);
    });
  }

  it('an arrival already on screen keeps its slot when a card is armed', () => {
    const r = resolveInterrupts(snap({ vignettePending: true, cardArmed: true, alreadyShown: ['JourneyVignetteModal'] }));
    expect(r.open).toContain('JourneyVignetteModal');
  });

  it('a chapter the world opens waits for the armed card', () => {
    expect(worldOpenedEncounterHeldBy({ playerSurfaceOpen: false, recentInput: false, cardArmed: true })).toEqual(['card_armed']);
    expect(worldOpenedEncounterHeldBy({ playerSurfaceOpen: false, recentInput: false, cardArmed: false })).toEqual([]);
    expect(worldOpenedEncounterHeldBy({ playerSurfaceOpen: false, recentInput: false })).toEqual([]);
  });

  it('a due gift waits for the armed card, even at a resume boundary', () => {
    const held = resolveGiftDelivery(gift({ cardArmed: true, atResumeBoundary: true }));
    expect(held.enter).toBe(false);
    expect(held.heldBy).toEqual(['card_armed']);
    expect(held.recheckInMs).toBeNull();
    expect(resolveGiftDelivery(gift({ cardArmed: false, atResumeBoundary: true })).enter).toBe(true);
  });

  it('the arrival beat (Beat 0) is exempt, as from every other quiet hold', () => {
    const d = resolveGiftDelivery(gift({ pendingBeatId: 'beat.spine.arrival', isArrivalBeat: true, cardArmed: true }));
    expect(d.heldBy).not.toContain('card_armed');
  });

  it('a player-opened surface (the chapter itself) still mounts at once while a card is armed', () => {
    const r = resolveInterrupts(snap({ encounterOpen: true, cardArmed: true }));
    expect(r.rendering).toContain('encounter');
  });
});
