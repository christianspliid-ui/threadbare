import { CEREMONY_HOMED_KINDS, homedSurfaceFor, type HomeId, type HomedSurfaceKind } from '../../data/homed-surfaces';
import type { OverlayProps } from './Overlay';

/**
 * A surface's home, as Overlay props (THR-1884, plan THR-1821 § Overlay; UI Law 58:
 * the UI grows by adding entries, not by writing screens).
 *
 * Where a surface plays is one list — `HOMED_SURFACES` in `src/data/homed-surfaces.ts`
 * (THR-1877). This module derives from it and keeps no list of its own: a surface
 * mounts `<Overlay {...surfaceHomeProps(kind)}>`, so moving it between ceremony and
 * dialog is one `home` edit in that list (plus its dialog size tier), never a
 * rewrite of the surface.
 */

/** The surfaces that take the full-screen ceremony home (THR-1829's third home; Christian, chat 2026-10-14, adds the cycle harvest). */
export const CEREMONY_SURFACES = CEREMONY_HOMED_KINDS;

export type SurfaceHomeProps = Pick<OverlayProps, 'band' | 'backdrop' | 'placement' | 'inset'>;

/** The Overlay each home mounts. */
export const HOME_OVERLAY_PROPS: Record<HomeId, SurfaceHomeProps> = {
  ceremony: { band: 'focused', backdrop: 'void', placement: 'fill', inset: 'viewport' },
  dialog: { band: 'modal', backdrop: 'dim', placement: 'top', inset: 'viewport' },
  // The Stage dims the map itself and keeps the top bar in view (THR-1829, Law 52).
  stage: { band: 'stage', backdrop: 'none', placement: 'fill', inset: 'belowTopBar' },
};

/** The Overlay props a homed surface mounts with; a kind the list does not hold falls back to a dialog (fail-soft). */
export function surfaceHomeProps(kind: HomedSurfaceKind): SurfaceHomeProps {
  return HOME_OVERLAY_PROPS[homedSurfaceFor(kind)?.home ?? 'dialog'];
}
