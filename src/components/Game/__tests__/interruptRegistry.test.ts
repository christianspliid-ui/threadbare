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
import { openPlayerSurfaces, resolveGiftDelivery, type PlayerSurfaceFlags } from '../giftDelivery';

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
    // A thread can land in the tick an encounter or a beat opens: the rite never
    // renders under them, and the world stays stopped while it waits.
    const behindOthers = resolveInterrupts(snap({ threadingRitePending: true, encounterOpen: true, ascendantBeatEntered: true }));
    expect(behindOthers.open).toEqual(['EncounterVeil', 'AscendantBeatModal']);
    expect(behindOthers.anyOpen).toBe(true);
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

/**
 * THR-1853 — arrivals wait their turn. Warm round 2: clicks on Rivals, the Chapter
 * Ledger and Doom landed on a premonition, a journey moment or a gift that mounted under
 * the pointer, and a premonition drew on top of a journey moment.
 */
describe('interruptRegistry — arrivals wait their turn (THR-1853)', () => {
  const NO_FLAGS: PlayerSurfaceFlags = {
    settingsPanelOpen: false, readThreadsOpen: false, agendaPickerOpen: false,
    actionDrawerOpen: false, agentProfileOpen: false, stubSheetCategory: null,
    attachmentSheetOpen: false, ascendantSheetOpen: false, doomDetailOpen: false,
    mandateDetailOpen: false, harvestOpen: false, codexOpen: false,
    chapterLedgerOpen: false, scryOpen: false, rivalsOpen: false, notablesOpen: false,
  };
  const PLAYER_SURFACES: Array<[string, Partial<PlayerSurfaceFlags>]> = [
    ['Chapter Ledger', { chapterLedgerOpen: true }],
    ['Rivals', { rivalsOpen: true }],
    ['Notables', { notablesOpen: true }],
    ['Doom', { doomDetailOpen: true }],
  ];
  /** The snapshot GameView builds for one set of open player surfaces. */
  const withSurface = (flags: Partial<PlayerSurfaceFlags>, over: Partial<InterruptSnapshot>): InterruptSnapshot => {
    const open = openPlayerSurfaces({ ...NO_FLAGS, ...flags });
    return snap({
      chapterLedgerOpen: open.includes('ChapterLedger'),
      playerSurfaceOpen: open.some(id => id !== 'ChapterLedger' && id !== 'ScryOverlay'),
      ...over,
    });
  };

  it.each(PLAYER_SURFACES)('a premonition, a journey moment and a gift pending while %s is open wait until it closes', (_name, flags) => {
    const pending = { premonitionPending: true, vignettePending: true };
    const during = resolveInterrupts(withSurface(flags, pending));
    expect(during.open).not.toContain('PremonitionModal');
    expect(during.open).not.toContain('JourneyVignetteModal');
    expect(during.heldArrivals.map(h => h.id)).toEqual(['PremonitionModal', 'JourneyVignetteModal']);

    const surfaces = openPlayerSurfaces({ ...NO_FLAGS, ...flags });
    const gift = resolveGiftDelivery({
      pendingBeatId: 'beat.spine.the_seat', isSpine: true, isArrivalBeat: false,
      suppressed: false, journeyVignettePending: false,
      otherInterruptsOpen: [], playerSurfacesOpen: surfaces,
      msSinceLastInput: 60_000, atResumeBoundary: true,
    });
    expect(gift.enter).toBe(false);
    expect(gift.heldBy).toContain('player_surface');

    // The surface closes: one arrival mounts — the first in priority — never both.
    const after = resolveInterrupts(snap(pending));
    expect(after.open).toEqual(['PremonitionModal']);
    expect(after.heldArrivals).toEqual([{ id: 'JourneyVignetteModal', heldBy: ['interrupt'] }]);
  });

  it('an arrival waits out the quiet window after a click, and the clock runs meanwhile', () => {
    const r = resolveInterrupts(snap({ premonitionPending: true, recentInput: true }));
    expect(r.open).toEqual([]);
    expect(r.anyOpen).toBe(false);
    expect(r.heldArrivals).toEqual([{ id: 'PremonitionModal', heldBy: ['recent_input'] }]);
  });

  it('an arrival already on screen keeps its slot through a click and an opened sheet', () => {
    const r = resolveInterrupts(snap({
      premonitionPending: true, recentInput: true, playerSurfaceOpen: true,
      alreadyShown: ['PremonitionModal'],
    }));
    expect(r.open).toEqual(['PremonitionModal']);
    expect(r.heldArrivals).toEqual([]);
  });

  it('two blocking interrupts never co-render: a premonition and a journey moment queue', () => {
    const shownPremonition = resolveInterrupts(snap({
      premonitionPending: true, vignettePending: true, alreadyShown: ['PremonitionModal'],
    }));
    expect(shownPremonition.open).toEqual(['PremonitionModal']);
    const shownVignette = resolveInterrupts(snap({
      premonitionPending: true, vignettePending: true, alreadyShown: ['JourneyVignetteModal'],
    }));
    expect(shownVignette.open).toEqual(['JourneyVignetteModal']);
  });

  it('an encounter that opens over a showing journey moment takes the screen alone; the moment returns after', () => {
    const over = resolveInterrupts(snap({
      vignettePending: true, encounterOpen: true, alreadyShown: ['JourneyVignetteModal'],
    }));
    expect(over.open).toEqual(['EncounterVeil']);
    expect(over.heldArrivals).toEqual([{ id: 'JourneyVignetteModal', heldBy: ['interrupt'] }]);
    // The veil closes: the moment comes back once the closing click has gone quiet.
    const closing = resolveInterrupts(snap({ vignettePending: true, recentInput: true, alreadyShown: ['EncounterVeil'] }));
    expect(closing.open).toEqual([]);
    expect(resolveInterrupts(snap({ vignettePending: true })).open).toEqual(['JourneyVignetteModal']);
  });

  it('an arrival waits behind an encounter, a gift and the moment card on screen', () => {
    expect(resolveInterrupts(snap({ premonitionPending: true, encounterOpen: true })).open).toEqual(['EncounterVeil']);
    expect(resolveInterrupts(snap({ vignettePending: true, ascendantBeatEntered: true })).open).toEqual(['AscendantBeatModal']);
    const card = resolveInterrupts(snap({ storyBeatPending: true, momentPending: true, alreadyShown: ['MomentCard'] }));
    expect(card.open).toEqual(['MomentCard']);
    expect(card.heldArrivals).toEqual([{ id: 'StoryBeatModal', heldBy: ['interrupt'] }]);
  });

  it('the moment card and the popup hold for the quiet window too, unless already showing', () => {
    const held = resolveInterrupts(snap({ momentPending: true, popupQueued: true, recentInput: true }));
    expect(held.momentMayRender).toBe(false);
    expect(held.popupMayRender).toBe(false);
    expect(held.anyOpen).toBe(false);
    const showing = resolveInterrupts(snap({ popupQueued: true, playerSurfaceOpen: true, alreadyShown: ['EventPopup'] }));
    expect(showing.popupMayRender).toBe(true);
  });

  it("the player's own surfaces are not held: the ledger opens on the first click", () => {
    const r = resolveInterrupts(snap({ chapterLedgerOpen: true, recentInput: true, premonitionPending: true }));
    expect(r.open).toEqual(['ChapterLedger']);
    expect(r.heldArrivals).toEqual([{ id: 'PremonitionModal', heldBy: ['interrupt', 'recent_input'] }]);
  });

  it('every arrival is a surface the world pushes, never one the player opens', () => {
    const arrivals = INTERRUPT_SURFACES.filter(s => s.arrival).map(s => s.id);
    expect(arrivals).toEqual(['PremonitionModal', 'JourneyVignetteModal', 'StoryBeatModal', 'MomentCard', 'EventPopup']);
  });
});
