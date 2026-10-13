/**
 * map-lenses.ts — the map lens registry (THR-1750, lens one of THR-1823).
 *
 * One row per lens: its switch label, its key, its tooltip and its legend.
 * THR-1830 ("Lenses on the map") adds the other rows and may restyle the switch
 * into its bar; it must not build a second Dominion overlay.
 *
 * Keys `1`–`5` are reserved for lenses (THR-1831).
 */

import {
  DOMINION_LENS_LABEL,
  DOMINION_LENS_KEY_HINT,
  DOMINION_LEGEND_LINES,
  DOMINION_TOOLTIP_IDS,
} from './dominion-ui-content';

export type MapLensId = 'dominion';

export interface MapLensDef {
  id: MapLensId;
  label: string;
  /** The keyboard key that toggles this lens. */
  key: string;
  tooltipId: string;
  legend: readonly string[];
}

export const MAP_LENSES: readonly MapLensDef[] = [
  {
    id: 'dominion',
    label: DOMINION_LENS_LABEL,
    key: DOMINION_LENS_KEY_HINT,
    tooltipId: DOMINION_TOOLTIP_IDS.lens,
    legend: DOMINION_LEGEND_LINES,
  },
];

/** The lens a key toggles, or undefined. */
export function mapLensForKey(key: string): MapLensDef | undefined {
  return MAP_LENSES.find(l => l.key === key);
}
