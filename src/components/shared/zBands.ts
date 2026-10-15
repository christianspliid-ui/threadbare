/**
 * The stacking table as data (Law 35, THR-1884 / plan THR-1821 § Overlay).
 *
 * `Docs/design-system/layout-zones.md` states the stacking order; this module is
 * that table in code. A z-index anywhere else in the UI tree is Law 35 debt:
 * surfaces name a band (`Z_BAND.modal`), never a number.
 *
 * The older per-surface constants (`MODAL_Z_DEFAULT`, `MODAL_Z_ABOVE_INTERRUPT`,
 * `ESCAPE_LAYER_Z_PANEL`, `ENCOUNTER_VEIL_Z`) are re-exports of these values, so
 * nothing that imports them changes.
 *
 * This module imports nothing, so any primitive can depend on it without a cycle.
 */
export const Z_BAND = {
  /** HTML overlays over the map canvas, and in-map detail panels. */
  mapOverlay: 10,
  hud: 20,
  topBar: 30,
  drawer: 40,
  debug: 45,
  /** Full-screen focused layers: the ceremonies (Meet the First, the Threading Rite, the cycle harvest). */
  focused: 50,
  /** The encounter Stage — the same height as `focused`; later registration wins a tie. */
  stage: 50,
  modal: 60,
  /**
   * The one sanctioned step above a modal-tier interrupt (a sheet opened from an
   * interrupt that renders later in GameView, THR-1139). Stays below `tooltip` so
   * the sheet's own tooltips still draw above it.
   */
  modalAboveInterrupt: 65,
  /** Tooltips start here and add their nesting depth. */
  tooltip: 70,
  /** Portalled menus (Dropdown). */
  menu: 9999,
} as const;

export type ZBandName = keyof typeof Z_BAND;

/** The bands an `Overlay` may sit in. Anchored menus and tooltips are not Overlays. */
export type OverlayBand = 'focused' | 'stage' | 'modal' | 'modalAboveInterrupt';
