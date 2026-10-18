/**
 * THR-1809 — a ready opening gift waits for a quiet moment.
 *
 * Pins the delivery rule: a spine gift (beats 1–4) never enters over a player-opened
 * surface, within `GIFT_QUIET_AFTER_INPUT_MS` of an input, or over another interrupt;
 * Beat 0 opens at once; pool beats never auto-enter. Plan:
 * Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md § Done when.
 *
 * THR-1853: a held spine gift opens on its own only at a resume boundary — the moment
 * the interrupt in front of it closes. Off a boundary it waits for its pill.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveGiftDelivery,
  openPlayerSurfaces,
  isGiftHoldExempt,
  type GiftDeliveryInput,
  type PlayerSurfaceFlags,
} from '../giftDelivery';
import { GIFT_HOLD_SURFACES, GIFT_QUIET_AFTER_INPUT_MS } from '../../../data/ascendant-beat-content';

const QUIET = GIFT_QUIET_AFTER_INPUT_MS * 10;

function input(over: Partial<GiftDeliveryInput> = {}): GiftDeliveryInput {
  return {
    pendingBeatId: 'beat.spine.the_seat',
    isSpine: true,
    isArrivalBeat: false,
    suppressed: false,
    journeyVignettePending: false,
    otherInterruptsOpen: [],
    playerSurfacesOpen: [],
    msSinceLastInput: QUIET,
    atResumeBoundary: true,
    ...over,
  };
}

const NO_SURFACES: PlayerSurfaceFlags = {
  settingsPanelOpen: false,
  readThreadsOpen: false,
  agendaPickerOpen: false,
  doomDetailOpen: false,
  mandateDetailOpen: false,
  harvestOpen: false,
  codexOpen: false,
  chapterLedgerOpen: false,
  scryOpen: false,
};

describe('resolveGiftDelivery', () => {
  it('enters at a resume boundary when nothing is open', () => {
    expect(resolveGiftDelivery(input())).toEqual({ enter: true, heldBy: [], heldBySurfaces: [], recheckInMs: null });
  });

  it.each(GIFT_HOLD_SURFACES)('holds a gift behind the player surface %s', (surface) => {
    const d = resolveGiftDelivery(input({ playerSurfacesOpen: [surface] }));
    expect(d.enter).toBe(false);
    expect(d.heldBy).toContain('player_surface');
    expect(d.heldBySurfaces).toEqual([surface]);
    expect(d.recheckInMs).toBeNull();
  });

  it('off a boundary, a quiet screen still waits for the pill (THR-1853)', () => {
    const d = resolveGiftDelivery(input({ atResumeBoundary: false }));
    expect(d).toEqual({ enter: false, heldBy: ['awaiting_boundary'], heldBySurfaces: [], recheckInMs: null });
    // An absent flag is no boundary (fail-soft: the gift keeps its pill).
    const absent = input();
    delete absent.atResumeBoundary;
    expect(resolveGiftDelivery(absent).heldBy).toEqual(['awaiting_boundary']);
  });

  it('off a boundary, a recent input is reported too, with no recheck timer', () => {
    const d = resolveGiftDelivery(input({ atResumeBoundary: false, msSinceLastInput: 500 }));
    expect(d.heldBy).toEqual(['awaiting_boundary', 'recent_input']);
    expect(d.recheckInMs).toBeNull();
  });

  it('at a boundary the click that closed the interrupt never holds', () => {
    expect(resolveGiftDelivery(input({ msSinceLastInput: 0 })).enter).toBe(true);
    expect(resolveGiftDelivery(input({ msSinceLastInput: GIFT_QUIET_AFTER_INPUT_MS - 1 })).enter).toBe(true);
  });

  it('a player surface still holds at a boundary', () => {
    const d = resolveGiftDelivery(input({ msSinceLastInput: 500, playerSurfacesOpen: ['Codex'] }));
    expect(d.heldBy).toEqual(['player_surface']);
    expect(d.recheckInMs).toBeNull();
  });

  it('Beat 0 opens at once over a surface and right after a click (THR-1716)', () => {
    const d = resolveGiftDelivery(input({
      pendingBeatId: 'beat.spine.opening',
      isArrivalBeat: true,
      playerSurfacesOpen: ['Codex'],
      msSinceLastInput: 0,
      atResumeBoundary: false,
    }));
    expect(d.enter).toBe(true);
  });

  it('a pool beat never auto-enters — it keeps its pill', () => {
    const d = resolveGiftDelivery(input({ pendingBeatId: 'beat.pool.x', isSpine: false }));
    expect(d).toEqual({ enter: false, heldBy: [], heldBySurfaces: [], recheckInMs: null });
  });

  it('nothing pending → nothing to enter', () => {
    expect(resolveGiftDelivery(input({ pendingBeatId: null })).enter).toBe(false);
  });

  it('keeps the existing holds: suppression, a pending vignette, another interrupt', () => {
    expect(resolveGiftDelivery(input({ suppressed: true })).heldBy).toEqual(['suppressed']);
    expect(resolveGiftDelivery(input({ journeyVignettePending: true })).heldBy).toEqual(['vignette']);
    expect(resolveGiftDelivery(input({ otherInterruptsOpen: ['EncounterVeil'] })).heldBy).toEqual(['interrupt']);
  });

  it('ignores an unknown surface id (fail-soft)', () => {
    expect(resolveGiftDelivery(input({ playerSurfacesOpen: ['NotASurface'] })).enter).toBe(true);
  });
});

describe('openPlayerSurfaces', () => {
  it('returns nothing when nothing is open', () => {
    expect(openPlayerSurfaces(NO_SURFACES)).toEqual([]);
  });

  it('can return every hold surface, in GIFT_HOLD_SURFACES order', () => {
    const all = openPlayerSurfaces({
      settingsPanelOpen: true,
      readThreadsOpen: true,
      agendaPickerOpen: true,
      doomDetailOpen: true,
      mandateDetailOpen: true,
      harvestOpen: true,
      codexOpen: true,
      chapterLedgerOpen: true,
      scryOpen: true,
      rivalsOpen: true,
      notablesOpen: true,
      inspectorFullOpen: true,
    });
    expect(new Set(all)).toEqual(new Set(GIFT_HOLD_SURFACES));
    expect(all).toEqual(GIFT_HOLD_SURFACES.filter(id => all.includes(id)));
  });
});

describe('isGiftHoldExempt', () => {
  it('exempts Beat 0 only', () => {
    expect(isGiftHoldExempt('beat.spine.opening')).toBe(true);
    expect(isGiftHoldExempt('beat.spine.the_seat')).toBe(false);
  });
});
