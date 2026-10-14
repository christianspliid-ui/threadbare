/**
 * hexContents — one hex → contents index for the whole map (THR-1822 § D6).
 *
 * Every surface that asks "what is on this hex" reads this one answer, so the
 * two rules that answer "who is here" today (HexDetailView's own scan and
 * `useHexZoomData`) collapse into one by construction once those surfaces move.
 *
 * Slice 1 fills people, Locations and Places:
 * - **People:** exactly `buildHexActorIndex`'s rule — living individuals, their
 *   `locationId` resolved to its Location via `resolveToParentLocation`.
 * - **Locations:** `getLocationNodes` (the outer tier), never a bare
 *   `getNodesByType('location')`, which returns both tiers.
 * - **Places:** each Location's `getVisibleSubLocations` (a hidden Place is absent).
 *
 * Armies, artifacts, lair, ruins, halls, resources and covenants join with the
 * land page (plan § D16 step 4).
 */
import { buildHexActorIndex, hexKey as toHexKey, type HexKey } from '../hexActorIndex';
import { getLocationNodes } from '../sublocationShape';
import { getVisibleSubLocations } from '../viewLevel';
import { readView, type ViewSelector } from './readView';
import type { RefRow } from './types';

export interface HexContentsVM {
  hexKey: HexKey;
  col: number;
  row: number;
  /** Living individuals on the hex, in actor order. */
  people: RefRow[];
  /** Locations (outer tier) on the hex. */
  locations: RefRow[];
  /** Visible Places (inner tier) inside those Locations. */
  places: RefRow[];
}

export type HexContentsIndexVM = Record<HexKey, HexContentsVM>;

function parseHexKey(key: HexKey): { col: number; row: number } | null {
  const [c, r] = key.split(',');
  const col = Number(c);
  const row = Number(r);
  return Number.isFinite(col) && Number.isFinite(row) ? { col, row } : null;
}

function emptyHex(key: HexKey): HexContentsVM {
  const at = parseHexKey(key) ?? { col: 0, row: 0 };
  return { hexKey: key, col: at.col, row: at.row, people: [], locations: [], places: [] };
}

/** The whole map's index. World-keyed: people move every tick. */
export const hexContentsIndexSelector: ViewSelector<void, HexContentsIndexVM> = {
  id: 'hexContentsIndex',
  invalidation: 'world',
  key: () => '',
  fallback: () => ({}),
  build(ctx) {
    const graph = ctx.graph;
    const index: HexContentsIndexVM = {};
    const at = (key: HexKey): HexContentsVM => (index[key] ??= emptyHex(key));

    for (const loc of getLocationNodes(graph)) {
      const col = loc.properties.hexCol as number | undefined;
      const row = loc.properties.hexRow as number | undefined;
      if (col == null || row == null) continue;
      const hex = at(toHexKey(col, row));
      hex.locations.push({ ref: { kind: 'location', id: loc.id }, name: loc.name });
      for (const place of getVisibleSubLocations(graph, loc.id)) {
        hex.places.push({ ref: { kind: 'sublocation', id: place.id }, name: place.name });
      }
    }

    for (const [key, ids] of buildHexActorIndex(graph).byHex) {
      const hex = at(key);
      for (const id of ids) {
        const n = graph.getNode(id);
        if (n) hex.people.push({ ref: { kind: 'agent', id }, name: n.name });
      }
    }
    return index;
  },
};

export interface HexContentsArgs {
  /** `col,row` */
  hexKey: HexKey;
}

/** One hex's contents, read off the cached index. An empty hex is an empty row set. */
export const hexContentsSelector: ViewSelector<HexContentsArgs, HexContentsVM> = {
  id: 'hexContents',
  invalidation: 'world',
  key: (args) => args.hexKey,
  fallback: (args) => emptyHex(args.hexKey),
  build(ctx, { hexKey }) {
    const index = readView(ctx.runtime, ctx.state, hexContentsIndexSelector, undefined, ctx.tiles);
    return index[hexKey] ?? emptyHex(hexKey);
  },
};
