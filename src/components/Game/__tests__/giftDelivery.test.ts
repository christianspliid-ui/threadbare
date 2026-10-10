/**
 * THR-1809 — a ready opening gift waits for a quiet moment.
 *
 * Pins the delivery rule: a spine gift (beats 1–4) never enters over a player-opened
 * surface, within `GIFT_QUIET_AFTER_INPUT_MS` of an input, or over another interrupt;
 * Beat 0 opens at once; pool beats never auto-enter. Plan:
 * Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md § Done when.
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
    ...over,
  };
}

const NO_SURFACES: PlayerSurfaceFlags = {
  settingsPanelOpen: false,
  readThreadsOpen: false,
  agendaPickerOpen: false,
  actionDrawerOpen: false,
  agentProfileOpen: false,
  stubSheetCategory: null,
  attachmentSheetOpen: false,
  ascendantSheetOpen: false,
  doomDetailOpen: false,
  mandateDetailOpen: false,
  harvestOpen: false,
  codexOpen: false,
  chapterLedgerOpen: false,
  scryOpen: false,
};

describe('resolveGiftDelivery', () => {
  it('enters when nothing is open and the player has been quiet', () => {
    expect(resolveGiftDelivery(input())).toEqual({ enter: true, heldBy: [], heldBySurfaces: [], recheckInMs: null });
  });

  it.each(GIFT_HOLD_SURFACES)('holds a gift behind the player surface %s', (surface) => {
    const d = resolveGiftDelivery(input({ playerSurfacesOpen: [surface] }));
    expect(d.enter).toBe(false);
    expect(d.heldBy).toContain('player_surface');
    expect(d.heldBySurfaces).toEqual([surface]);
    expect(d.recheckInMs).toBeNull();
  });

  it('holds for the rest of the quiet window after a recent input, and says when to look again', () => {
    const d = resolveGiftDelivery(input({ msSinceLastInput: 500 }));
    expect(d).toEqual({ enter: false, heldBy: ['recent_input'], heldBySurfaces: [], recheckInMs: 1500 });
  });

  it('enters exactly when the quiet window has passed', () => {
    expect(resolveGiftDelivery(input({ msSinceLastInput: GIFT_QUIET_AFTER_INPUT_MS })).enter).toBe(true);
  });

  it('sets no recheck timer while another hold also applies (that hold re-runs it)', () => {
    const d = resolveGiftDelivery(input({ msSinceLastInput: 500, playerSurfacesOpen: ['Codex'] }));
    expect(d.heldBy).toEqual(['player_surface', 'recent_input']);
    expect(d.recheckInMs).toBeNull();
  });

  it('Beat 0 opens at once over a surface and right after a click (THR-1716)', () => {
    const d = resolveGiftDelivery(input({
      pendingBeatId: 'beat.spine.opening',
      isArrivalBeat: true,
      playerSurfacesOpen: ['AgentProfileModal'],
      msSinceLastInput: 0,
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
      actionDrawerOpen: true,
      agentProfileOpen: true,
      stubSheetCategory: null,
      attachmentSheetOpen: true,
      ascendantSheetOpen: true,
      doomDetailOpen: true,
      mandateDetailOpen: true,
      harvestOpen: true,
      codexOpen: true,
      chapterLedgerOpen: true,
      scryOpen: true,
    });
    const sheets = ['location', 'faction', 'army', 'artifact'].map(
      c => openPlayerSurfaces({ ...NO_SURFACES, stubSheetCategory: c })[0],
    );
    const union = new Set([...all, ...sheets]);
    expect(union).toEqual(new Set(GIFT_HOLD_SURFACES));
    expect(all).toEqual(GIFT_HOLD_SURFACES.filter(id => all.includes(id)));
  });

  it('ignores an unknown stub-sheet category', () => {
    expect(openPlayerSurfaces({ ...NO_SURFACES, stubSheetCategory: 'mystery' })).toEqual([]);
  });
});

describe('isGiftHoldExempt', () => {
  it('exempts Beat 0 only', () => {
    expect(isGiftHoldExempt('beat.spine.opening')).toBe(true);
    expect(isGiftHoldExempt('beat.spine.the_seat')).toBe(false);
  });
});
