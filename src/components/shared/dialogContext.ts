/**
 * Dialogue contexts — the single source for which kind of moment each dialog is (THR-1586).
 *
 * The family (Modal / RevealCard / EventPopup) is chosen by what the player must
 * do (Law 26); the palette is chosen by context, on top of the family. A dialog
 * passes `context` to `Modal`, which applies the matching `.dialog-ctx-*` class;
 * that class sets the local `--dlg-*` properties the panel reads. No `context`
 * means neutral — no class, and every `var(--dlg-*)` falls back to today's value.
 *
 * Reference surfaces (sheets, popups, settings) stay neutral so colour on a dialog
 * keeps meaning *this is a moment* (Law 30, amended 2026-10-02).
 */
import { HOMED_SURFACES, type HomedSurfaceEntry, type HomedSurfacePalette } from '../../data/homed-surfaces';

/** The contexts a `Modal` can take. `neutral` is the default and applies no class. */
export type DialogContext = 'neutral' | 'story' | 'elder' | 'gain';

/**
 * Every context in the taxonomy, including the two whose surfaces own their
 * palette outside `Modal`'s prop — the Premonition's dream tones and the veil.
 * The names live on the home list (`HomedSurfacePalette`, THR-1877), so data never
 * imports a component.
 */
export type DialogContextName = HomedSurfacePalette;

/** The two contexts whose surfaces keep their own sanctioned variant set. */
const PALETTE_OWNING_CONTEXTS: ReadonlySet<DialogContextName> = new Set(['divine', 'encounter']);

/** Context → the class in `index.css` that sets its `--dlg-*` properties. */
export const DIALOG_CONTEXT_CLASS: Record<Exclude<DialogContext, 'neutral'>, string> = {
  story: 'dialog-ctx-story',
  elder: 'dialog-ctx-elder',
  gain: 'dialog-ctx-gain',
};

/** The class a context applies, or `undefined` for neutral. */
export function dialogContextClass(context: DialogContext | undefined): string | undefined {
  if (!context || context === 'neutral') return undefined;
  return DIALOG_CONTEXT_CLASS[context];
}

export interface DialogContextSurface {
  /** Component name, e.g. `'StoryBeatModal'`. */
  surface: string;
  context: DialogContextName;
  /** True for surfaces that keep their own sanctioned variant set rather than the `context` prop. */
  ownsPalette: boolean;
}

/**
 * The surface → context map, as data. Surfaces not listed here are neutral.
 * Derived from the home list (`HOMED_SURFACES`, THR-1877): each entry's `palette`.
 * `MeetingEncounterModal` (unmounted) and `MeetTheFirstFlow` (not a `Modal`) carry no
 * palette, so they are absent, as before.
 */
export const DIALOG_CONTEXT_SURFACES: ReadonlyArray<DialogContextSurface> =
  (HOMED_SURFACES as readonly HomedSurfaceEntry[]).flatMap(e => (e.palette
    ? [{ surface: e.surfaceId, context: e.palette, ownsPalette: PALETTE_OWNING_CONTEXTS.has(e.palette) }]
    : []));
