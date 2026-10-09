/**
 * The interrupt registry — the Stellaris clock's one list of what stops the
 * world (THR-1608, plan § S3).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  INTERRUPT_SURFACES,
  resolveInterrupts,
  type InterruptSnapshot,
  type InterruptSurface,
} from '../interruptRegistry';

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

describe('interruptRegistry', () => {
  it('every entry is interrupt-tier with a unique id', () => {
    const ids = INTERRUPT_SURFACES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(INTERRUPT_SURFACES.every(s => s.tier === 'interrupt')).toBe(true);
  });

  it('declares every THR-668 surface plus the three S3 additions', () => {
    const ids = INTERRUPT_SURFACES.map(s => s.id);
    for (const id of [
      'EncounterVeil', 'MeetTheFirstFlow', 'PremonitionModal', 'JourneyVignetteModal',
      'StoryBeatModal', 'AscendantBeatModal', 'ChoiceSetModal', 'EmergenceDilemmaModal',
      'DivineReceiptModal', 'MomentCard',
      // S3: reading the ledger must not leak time; doom stages / the Unmaking ride the popup channel.
      'ChapterLedger', 'EventPopup',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('the warm-start overlay stops the world and holds the moment card (THR-1744)', () => {
    const r = resolveInterrupts(snap({ warmStartRunning: true, momentPending: true }));
    expect(r.open).toEqual(['WarmStartOverlay']);
    expect(r.momentMayRender).toBe(false);
    expect(r.anyOpen).toBe(true);
  });

  it('a pending threading rite stops the world, waits behind the meeting, and holds the moment card (THR-1754)', () => {
    const rite = resolveInterrupts(snap({ threadingRitePending: true, momentPending: true, popupQueued: true }));
    expect(rite.open).toEqual(['ThreadingRite']);
    expect(rite.momentMayRender).toBe(false);
    expect(rite.popupMayRender).toBe(false);
    const behindMeeting = resolveInterrupts(snap({ threadingRitePending: true, meetingPending: true }));
    expect(behindMeeting.open).toEqual(['MeetTheFirstFlow']);
    // An absent field is closed — old snapshot builders keep working.
    expect(resolveInterrupts(snap({})).open).not.toContain('ThreadingRite');
  });

  it('nothing open → the clock is free', () => {
    const r = resolveInterrupts(closed);
    expect(r.anyOpen).toBe(false);
    expect(r.open).toEqual([]);
  });

  it('the chapter ledger stops the world', () => {
    const r = resolveInterrupts(snap({ chapterLedgerOpen: true }));
    expect(r.open).toEqual(['ChapterLedger']);
    expect(r.anyOpen).toBe(true);
  });

  it('the Divine Court stops the world and holds the popup channel (THR-1709)', () => {
    const r = resolveInterrupts(snap({ courtOpen: true, popupQueued: true }));
    expect(r.open).toEqual(['ScryOverlay']);
    expect(r.anyOpen).toBe(true);
    expect(r.popupMayRender).toBe(false);
  });

  it('a doom-stage popup shows and stops the world when nothing else is open', () => {
    const r = resolveInterrupts(snap({ popupQueued: true }));
    expect(r.popupMayRender).toBe(true);
    expect(r.open).toEqual(['EventPopup']);
  });

  it('a popup arriving while a beat is open waits, then shows — never stacks', () => {
    const during = resolveInterrupts(snap({ popupQueued: true, ascendantBeatEntered: true }));
    expect(during.popupMayRender).toBe(false);
    expect(during.open).toEqual(['AscendantBeatModal']);
    // The clock is still stopped by the beat, and the popup is queued behind it.
    expect(during.anyOpen).toBe(true);

    const after = resolveInterrupts(snap({ popupQueued: true }));
    expect(after.popupMayRender).toBe(true);
    expect(after.open).toEqual(['EventPopup']);
  });

  it('the popup yields to the moment card, and the card waits for a showing popup', () => {
    const both = resolveInterrupts(snap({ popupQueued: true, momentPending: true }));
    expect(both.momentMayRender).toBe(true);
    expect(both.popupMayRender).toBe(false);
    expect(both.open).toEqual(['MomentCard']);

    // With a popup already showing, the card's gate reads "something else is open".
    const popupShowing = resolveInterrupts(snap({ popupQueued: true }));
    expect(popupShowing.otherThanMomentOpen).toBe(true);
  });

  it('the moment card never co-renders with a blocking surface (THR-1299)', () => {
    const r = resolveInterrupts(snap({ momentPending: true, encounterOpen: true }));
    expect(r.momentMayRender).toBe(false);
    expect(r.otherThanMomentOpen).toBe(true);
    expect(r.open).toEqual(['EncounterVeil']);
  });

  it('mirrors render conditions: suppressed beats and an identity-less meeting do not stop the world', () => {
    const r = resolveInterrupts(snap({
      interruptsSuppressed: true,
      premonitionPending: true,
      vignettePending: true,
      storyBeatPending: true,
      popupQueued: true,
      meetingPending: true,
      hasAscendantIdentity: false,
    }));
    expect(r.anyOpen).toBe(false);
  });

  it('fail-soft: a surface whose isOpen throws is treated as closed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const throwing: InterruptSurface = {
      id: 'Broken', tier: 'interrupt', isOpen: () => { throw new Error('boom'); },
    };
    const r = resolveInterrupts(snap({ chapterLedgerOpen: true }), [...INTERRUPT_SURFACES, throwing]);
    expect(r.open).toEqual(['ChapterLedger']);
    const none = resolveInterrupts(closed, [throwing]);
    expect(none.anyOpen).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
