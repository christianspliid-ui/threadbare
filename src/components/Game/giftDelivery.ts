/**
 * THR-1809 — when a ready opening gift may open on screen.
 *
 * The opening's spine gifts (beats 1–4, THR-1647) become due one tick after a player
 * act — usually a cast, i.e. the very click the player just made. Before this module
 * a pending gift mounted its modal on the next render, so round-3 cold testers who
 * clicked Observe, Cast, the Chapter Ledger or a profile got a gift instead (THR-1805).
 *
 * Readiness, spacing and order are the engine's and unchanged. This decides only when
 * the React modal enters (`beatEntered`, UI state): never over a surface the player
 * opened, never within `GIFT_QUIET_AFTER_INPUT_MS` of a click or key press, never over
 * another interrupt. While held, the offer pill shows "A gift waits" and opens it on a
 * click. Pure; GameView supplies the inputs.
 *
 * THR-1853 — a quiet moment was not enough. Warm round-2 testers click every 7–10 s,
 * so a gift that entered 2 s after the last click took the next one. A held spine gift
 * now opens only on a pill click or at a resume boundary: the instant the interrupt in
 * front of it closes, when the player's attention is already on a modal and the click
 * that closed it is spent. Between boundaries it waits behind the pill.
 *
 * Plan: Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md
 */
import {
  ARRIVAL_HOLD_EXEMPT_SURFACES,
  GIFT_HOLD_EXEMPT_BEAT_IDS,
  GIFT_HOLD_SURFACES,
  GIFT_QUIET_AFTER_INPUT_MS,
} from '../../data/ascendant-beat-content';

export interface GiftDeliveryInput {
  pendingBeatId: string | null;
  /** `isSpineBeatId(pendingBeatId)`. Pool beats never auto-enter; they keep their pill. */
  isSpine: boolean;
  /** Beat 0 (`GIFT_HOLD_EXEMPT_BEAT_IDS`) ignores the surface and recent-input holds. */
  isArrivalBeat: boolean;
  /** `interruptsSuppressed` (debug `suppressBeats`). */
  suppressed: boolean;
  /** A journey vignette is pending (THR-1744): two held decisions open one at a time. */
  journeyVignettePending: boolean;
  /** `interruptResolution.open` minus `AscendantBeatModal` and the player surfaces. */
  otherInterruptsOpen: readonly string[];
  /** From {@link openPlayerSurfaces}. */
  playerSurfacesOpen: readonly string[];
  msSinceLastInput: number;
  /**
   * THR-1853 — another interrupt closed under `GIFT_RESUME_BOUNDARY_WINDOW_MS` ago, so
   * the clock would resume now. Optional: absent = false (the gift waits for its pill).
   */
  atResumeBoundary?: boolean;
}

export type GiftHoldReason =
  | 'player_surface'
  | 'recent_input'
  | 'interrupt'
  | 'vignette'
  | 'suppressed'
  /** THR-1853 — no interrupt has just closed; the gift waits for its pill or the next boundary. */
  | 'awaiting_boundary';

export interface GiftDelivery {
  /** The modal may enter now. */
  enter: boolean;
  /** Why it may not; empty when it enters or nothing is pending. */
  heldBy: GiftHoldReason[];
  /** Which player surfaces hold it (members of `GIFT_HOLD_SURFACES` only). */
  heldBySurfaces: string[];
  /** Re-evaluate after this long when the only hold is recent input; otherwise null. */
  recheckInMs: number | null;
}

const NOT_DUE: GiftDelivery = { enter: false, heldBy: [], heldBySurfaces: [], recheckInMs: null };

export function resolveGiftDelivery(input: GiftDeliveryInput): GiftDelivery {
  // Nothing pending, or a pool beat: nothing to auto-enter (pool beats wait behind the pill).
  if (!input.pendingBeatId || !input.isSpine) return NOT_DUE;

  const heldBy: GiftHoldReason[] = [];
  if (input.suppressed) heldBy.push('suppressed');
  if (input.journeyVignettePending) heldBy.push('vignette');
  if (input.otherInterruptsOpen.length > 0) heldBy.push('interrupt');

  // Fail-soft: an unknown id never holds — only listed surfaces do.
  const heldBySurfaces = input.isArrivalBeat
    ? []
    : input.playerSurfacesOpen.filter(id => GIFT_HOLD_SURFACES.includes(id));
  if (heldBySurfaces.length > 0) heldBy.push('player_surface');

  // At a resume boundary the click that closed the interrupt is spent: it never holds.
  const atBoundary = input.atResumeBoundary === true;
  if (!input.isArrivalBeat && !atBoundary) heldBy.push('awaiting_boundary');
  const quietLeft = GIFT_QUIET_AFTER_INPUT_MS - Math.max(0, input.msSinceLastInput);
  const recentInput = !input.isArrivalBeat && !atBoundary && quietLeft > 0;
  if (recentInput) heldBy.push('recent_input');

  return {
    enter: heldBy.length === 0,
    heldBy,
    heldBySurfaces,
    recheckInMs: recentInput && heldBy.length === 1 ? quietLeft : null,
  };
}

/** True for Beat 0 and any other gift that opens at once regardless (THR-1716). */
export function isGiftHoldExempt(beatId: string): boolean {
  return GIFT_HOLD_EXEMPT_BEAT_IDS.includes(beatId);
}

/**
 * The flags GameView already holds, each already resolved to "this surface is on
 * screen" (e.g. the drawer flag is `drawerOpen && !!selectedAgentId`).
 */
export interface PlayerSurfaceFlags {
  settingsPanelOpen: boolean;
  readThreadsOpen: boolean;
  agendaPickerOpen: boolean;
  actionDrawerOpen: boolean;
  agentProfileOpen: boolean;
  /** `stubModalState?.category` — location / faction / army / artifact sheet. */
  stubSheetCategory: string | null;
  attachmentSheetOpen: boolean;
  ascendantSheetOpen: boolean;
  doomDetailOpen: boolean;
  mandateDetailOpen: boolean;
  harvestOpen: boolean;
  codexOpen: boolean;
  chapterLedgerOpen: boolean;
  scryOpen: boolean;
  /** THR-1853 — the top bar's Rivals dropdown. Optional: absent = closed. */
  rivalsOpen?: boolean;
  /** THR-1853 — the top bar's Notables dropdown. Optional: absent = closed. */
  notablesOpen?: boolean;
  /** THR-1911 — the Inspector at its Full size. Optional: absent = closed. */
  inspectorFullOpen?: boolean;
}

const STUB_SHEET_IDS: Readonly<Record<string, string>> = {
  location: 'LocationProfileModal',
  faction: 'FactionSheet',
  army: 'ArmySheet',
  artifact: 'ArtifactSheet',
};

/**
 * The player-opened surfaces on screen, as ids, in `GIFT_HOLD_SURFACES` order. Shared
 * with `getDebugOpenModals` so the debug list and the gift hold cannot drift.
 */
export function openPlayerSurfaces(f: PlayerSurfaceFlags): string[] {
  const open: string[] = [];
  if (f.settingsPanelOpen) open.push('SettingsPanel');
  if (f.readThreadsOpen) open.push('ReadTheThreadsPanel');
  if (f.agendaPickerOpen) open.push('AgendaPicker');
  if (f.actionDrawerOpen) open.push('ActionDrawer');
  if (f.agentProfileOpen) open.push('AgentProfileModal');
  const stub = f.stubSheetCategory ? STUB_SHEET_IDS[f.stubSheetCategory] : undefined;
  if (stub) open.push(stub);
  if (f.attachmentSheetOpen) open.push('AttachmentDetailView');
  if (f.ascendantSheetOpen) open.push('AscendantSheet');
  if (f.doomDetailOpen) open.push('DoomClockDetail');
  if (f.mandateDetailOpen) open.push('MandateDetail');
  if (f.harvestOpen) open.push('HarvestScreen');
  if (f.codexOpen) open.push('Codex');
  if (f.chapterLedgerOpen) open.push('ChapterLedger');
  if (f.scryOpen) open.push('ScryOverlay');
  if (f.rivalsOpen) open.push('RivalsPanel');
  if (f.notablesOpen) open.push('NotablesPanel');
  if (f.inspectorFullOpen) open.push('InspectorFull');
  return open;
}

/** Player surfaces that are also registry interrupts — reported once, as surfaces. */
export const PLAYER_SURFACE_INTERRUPT_IDS: readonly string[] = ['ChapterLedger', 'ScryOverlay'];

/**
 * THR-1853 — the open player surfaces that hold a world-pushed interrupt (an arrival).
 * The ledger and the court hold arrivals as registry interrupts already, and the card
 * hand is exempt (`ARRIVAL_HOLD_EXEMPT_SURFACES`): it stays open through play.
 */
export function arrivalHoldingSurfaces(open: readonly string[]): string[] {
  return open.filter(id => !PLAYER_SURFACE_INTERRUPT_IDS.includes(id) && !ARRIVAL_HOLD_EXEMPT_SURFACES.includes(id));
}
