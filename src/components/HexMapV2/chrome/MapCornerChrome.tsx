/**
 * MapCornerChrome — the map canvas's bottom-right corner: one mount for the control cluster
 * and the minimap above it (THR-1900 / THR-1901, plan THR-1878 D6, D10).
 *
 * One wrapper so the Stage build (THR-1877 / THR-1892) can hide both with one condition
 * while a moment holds the map still (Law 25: controls that would do nothing are not shown).
 * Anchored to the map canvas, `MAP_CHROME_INSET_PX` in from both edges, in the `hud` band
 * (Law 35); it moves with the canvas when a panel docks beside it.
 */
import type { ReactNode } from 'react';
import { Z_BAND } from '../../shared/zBands';

/** Bar, legend, cluster and minimap inset from the map canvas edges (THR-1831 § 1). */
export const MAP_CHROME_INSET_PX = 16;

export interface MapCornerChromeProps {
  /** False while the Stage holds the map; the whole corner hides. */
  visible?: boolean;
  children: ReactNode;
}

export function MapCornerChrome({ visible = true, children }: MapCornerChromeProps) {
  if (!visible) return null;
  return (
    <div
      data-testid="map-corner-chrome"
      style={{
        position: 'absolute',
        right: MAP_CHROME_INSET_PX,
        bottom: MAP_CHROME_INSET_PX,
        zIndex: Z_BAND.hud,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
}
