/**
 * map-lenses.ts — the map lens registry (THR-1750 lens one; THR-1878 plan § D1).
 *
 * One row per lens: its bar label, its key, its tooltip, its fixed legend lines and
 * the layer family that draws it. Everything else is derived from this list or keyed
 * on its union (Law 58): the lens bar maps over it, the key handler reads `key`, the
 * view model comes from `LENS_SELECTORS` (`src/engine/views/lenses/lensView.ts`, a
 * total record), the layer from `LENS_LAYER_FACTORIES` (HexMapV2, keyed on `layer`),
 * and a lens's marks are `MAP_MARKERS` rows naming it. A new hex lens is one row
 * here, one selector and its marker rows — it writes no layer code.
 *
 * Keys `1`–`5` are reserved for lenses (THR-1831); `5` stays unbound. Trouble (`3`)
 * and Trade (`4`) joined in Lenses II (THR-1898).
 *
 * THR-2060: each lens names the opening-reveal surface that brings its button (a
 * staged run grows the bar one lens at a time); a `lens_*` surface belongs to the
 * lens bar alone, any other is shared with the panel it travels with.
 *
 * Named test: `src/data/__tests__/mapLenses.coverage.test.ts`.
 */

import {
  DOMINION_LENS_LABEL,
  DOMINION_LENS_KEY_HINT,
  DOMINION_LEGEND_LINES,
  DOMINION_TOOLTIP_IDS,
} from './dominion-ui-content';
import { THREADS_LENS_WORDS, TROUBLE_LENS_WORDS, TRADE_LENS_WORDS } from './view-content';
import type { OpeningRevealSurfaceId } from './opening-reveal-table';

/** The closed union of lens ids — grows one member per row. */
export type MapLensId = 'dominion' | 'threads' | 'trouble' | 'trade';

/**
 * Which layer family draws a lens. `'dominion'` is THR-1750's own layer, reused
 * unchanged; `'hex'` is the one generic hex-lens layer every new lens uses (D3).
 */
export type MapLensLayerKind = 'dominion' | 'hex';

export interface MapLensDef {
  id: MapLensId;
  /** "Dominion", "Threads". */
  label: string;
  /** The keyboard key that toggles this lens ('1'..'4'; '5' reserved). */
  key: string;
  tooltipId: string;
  /** The lens's fixed legend lines (Dominion: as built). */
  legend: readonly string[];
  /** Which layer family draws it. */
  layer: MapLensLayerKind;
  /** THR-2060: the opening-reveal surface whose arrival puts this lens on the bar. */
  revealSurface: OpeningRevealSurfaceId;
}

/** The keys a lens may take. `5` is reserved and unbound. */
export const MAP_LENS_KEYS: readonly string[] = ['1', '2', '3', '4', '5'];

export const MAP_LENSES: readonly MapLensDef[] = [
  {
    id: 'dominion',
    label: DOMINION_LENS_LABEL,
    key: DOMINION_LENS_KEY_HINT,
    tooltipId: DOMINION_TOOLTIP_IDS.lens,
    legend: DOMINION_LEGEND_LINES,
    layer: 'dominion',
    revealSurface: 'dominion',
  },
  {
    id: 'threads',
    label: THREADS_LENS_WORDS.label,
    key: '2',
    tooltipId: 'ui.lens.threads',
    legend: THREADS_LENS_WORDS.legend,
    layer: 'hex',
    revealSurface: 'lens_threads',
  },
  {
    id: 'trouble',
    label: TROUBLE_LENS_WORDS.label,
    key: '3',
    tooltipId: 'ui.lens.trouble',
    legend: TROUBLE_LENS_WORDS.legend,
    layer: 'hex',
    revealSurface: 'doom',
  },
  {
    id: 'trade',
    label: TRADE_LENS_WORDS.label,
    key: '4',
    tooltipId: 'ui.lens.trade',
    legend: TRADE_LENS_WORDS.legend,
    layer: 'hex',
    revealSurface: 'lens_trade',
  },
];

/** The lens a key toggles, or undefined. */
export function mapLensForKey(key: string): MapLensDef | undefined {
  return MAP_LENSES.find(l => l.key === key);
}

/** The row for an id, or undefined for an id with no row (Law 58's plain fallback). */
export function mapLensById(id: string | null | undefined): MapLensDef | undefined {
  if (!id) return undefined;
  return MAP_LENSES.find(l => l.id === id);
}

/** Whether a string names a lens in the list. */
export function isMapLensId(id: unknown): id is MapLensId {
  return typeof id === 'string' && MAP_LENSES.some(l => l.id === id);
}
