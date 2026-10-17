/**
 * Dialog size tiers (THR-1820, Law 57) — every dialog picks one of four sizes
 * that scale with the 1440p contract, never a free width.
 *
 * - **S** one message or one decision (notices, receipts, reveals, short forms).
 * - **M** one column of structured content (a ladder, a clock, a row of up to four cards).
 * - **L** a subject and its record side by side (`SheetColumns`).
 * - **XL** a work surface with its own panes; the only tier with a fixed height.
 *
 * The widths live in `src/index.css` (`--dialog-<t>-w`; S and M in rem, declared
 * once; L and XL in px per tier) and in `layoutContract.ts`. Every `var()` here
 * carries its `:root` value as a fallback, so a test without the stylesheet still
 * lays out (fail-soft). Plan: Docs/plans/2026-10-14-thr-1820-dialog-size-tiers.md.
 */

import type { CSSProperties } from 'react';

export type DialogSize = 's' | 'm' | 'l' | 'xl';

export const DIALOG_SIZES: readonly DialogSize[] = ['s', 'm', 'l', 'xl'];

/** The tier when a caller passes neither `size` nor `maxWidth` — today's 600 px default. */
export const DIALOG_SIZE_DEFAULT: DialogSize = 's';

/** The width custom property each tier reads. */
export const DIALOG_SIZE_WIDTH_VAR: Record<DialogSize, string> = {
  s: '--dialog-s-w',
  m: '--dialog-m-w',
  l: '--dialog-l-w',
  xl: '--dialog-xl-w',
};

/** `var()` fallbacks: the `:root` values in `index.css` (pinned by `dialogSize.test.ts`). */
export const DIALOG_SIZE_FALLBACK: Record<DialogSize, string> = {
  s: '37.5rem',
  m: '60rem',
  l: '1280px',
  xl: '1760px',
};

/** `--dialog-gutter`'s `:root` value — the least space between a panel and the viewport edge. */
export const DIALOG_GUTTER_FALLBACK = '24px';

/** Debug report: a panel within this many px of its height cap counts as at its cap. */
export const DIALOG_CAP_TOLERANCE_PX = 2;

/** Narrow an unknown value to a tier; anything else reads as the default (fail-soft). */
export function isDialogSize(value: unknown): value is DialogSize {
  return typeof value === 'string' && (DIALOG_SIZES as readonly string[]).includes(value);
}

/** The tier's width expression, clamped to the viewport less two gutters. */
export function dialogSizeWidth(size: DialogSize): string {
  const tier = isDialogSize(size) ? size : DIALOG_SIZE_DEFAULT;
  return `min(var(${DIALOG_SIZE_WIDTH_VAR[tier]}, ${DIALOG_SIZE_FALLBACK[tier]}), calc(100vw - 2 * var(--dialog-gutter, ${DIALOG_GUTTER_FALLBACK})))`;
}

/**
 * Width, the one 85vh height cap, and (XL only) a fixed height so its panes have
 * a height to fill. For `Modal`'s panel and for any owner-drawn panel on an
 * `Overlay` (never a free width there either).
 */
export function dialogSizeStyle(size: DialogSize): CSSProperties {
  const tier = isDialogSize(size) ? size : DIALOG_SIZE_DEFAULT;
  const style: CSSProperties = {
    width: dialogSizeWidth(tier),
    maxWidth: 'none',
    maxHeight: 'var(--modal-max-h, 85vh)',
  };
  if (tier === 'xl') style.height = 'var(--modal-max-h, 85vh)';
  return style;
}

/** Gift and offering dialogs take M from this many cards up, S below (THR-1820 § 7). */
export const BEAT_MODAL_M_MIN_CARDS = 3;

/** One dialog-home surface, the file that mounts it, and the tiers it may take. */
export interface DialogSizeSurface {
  /**
   * The surface id. For a surface on the home list it is that entry's `surfaceId`
   * (`HOMED_SURFACES`, THR-1877): `homedSurfaces.test.ts` checks every dialog-home
   * entry has a row here and no Stage or ceremony entry does.
   */
  surface: string;
  /** Path under `src/components/`. */
  file: string;
  sizes: readonly DialogSize[];
  /**
   * The ticket that moves this surface onto its tier, while it is still a hand-built
   * panel (slice 2, THR-1880). Absent once the surface passes `size`.
   */
  pending?: string;
}

/**
 * Every surface that keeps a dialog home, with the tiers it may take (THR-1820 § 7
 * table A). `dialogSize.test.ts` reads each non-pending file and checks it passes a
 * `size` from its registered tiers and no `maxWidth`. Slice 2 (THR-1880) clears the
 * `pending` rows; THR-1827 / THR-1829 retire the free-width surfaces not listed here.
 */
export const DIALOG_SIZE_SURFACES: ReadonlyArray<DialogSizeSurface> = [
  { surface: 'EventPopup', file: 'Game/EventPopup.tsx', sizes: ['s'] },
  { surface: 'DivineReceiptModal', file: 'Game/DivineReceiptModal.tsx', sizes: ['s'] },
  { surface: 'OmenDetail', file: 'Game/OmenDetail.tsx', sizes: ['s'] },
  { surface: 'DoomClockDetail', file: 'Game/DoomClockDetail.tsx', sizes: ['m'] },
  { surface: 'MandateDetail', file: 'Game/MandateDetail.tsx', sizes: ['m'] },
  { surface: 'AscendantBeatModal', file: 'Game/AscendantBeatModal.tsx', sizes: ['s', 'm'] },
  // The bond-only reveal stays a dialog; the rite's full and short shapes are a ceremony.
  { surface: 'ThreadingRiteBondOnly', file: 'ThreadingRite/ThreadingRite.tsx', sizes: ['m'] },
  { surface: 'ChapterLedger', file: 'Game/ChapterLedger.tsx', sizes: ['l'] },
  { surface: 'ReadTheThreadsPanel', file: 'Game/ReadTheThreadsPanel.tsx', sizes: ['m'] },
  { surface: 'SettingsModal', file: 'StartPage/SettingsModal.tsx', sizes: ['s'] },
  { surface: 'CreditsModal', file: 'StartPage/CreditsModal.tsx', sizes: ['s'] },
  { surface: 'HomedSurfaceFallback', file: 'Game/hosts/HomedSurfaceFallback.tsx', sizes: ['s'] },
  // Slice 2 — hand-built today; THR-1880 moves each onto its tier.
  { surface: 'WarmStartOverlay', file: 'Game/WarmStartOverlay.tsx', sizes: ['s'], pending: 'THR-1880' },
  { surface: 'ChoiceSetModal', file: 'Game/ChoiceSetModal.tsx', sizes: ['s'], pending: 'THR-1880' },
  { surface: 'ScryOverlay', file: 'Game/ScryOverlay.tsx', sizes: ['l'], pending: 'THR-1880' },
  { surface: 'SettingsPanel', file: 'Game/SettingsPanel.tsx', sizes: ['m'], pending: 'THR-1880' },
  { surface: 'Codex', file: 'Game/GameView.tsx', sizes: ['xl'], pending: 'THR-1880' },
];
