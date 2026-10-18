/**
 * lens — the map lens's view models (THR-1822 § D11; THR-1878 plan § D1).
 *
 * `LENS_SELECTORS` is a total record over `MapLensId`: a lens with a `MAP_LENSES` row
 * and no selector here is a compile error naming the record (Law 58). Each entry says
 * which layer family draws it and how its view model is built.
 *
 * The Dominion arm calls `ensureDominionProjection` + `dominionLensVM` unchanged —
 * the seam reuses THR-1750's projection, it never forks it. Every other lens is a
 * `HexLensVM` drawn by the one generic hex layer; it is read through
 * `hexLensViewSelector` (world-keyed, so it rebuilds at most once per tick).
 */
import type { HexTile } from '../../../types';
import type { MapLensId, MapLensLayerKind } from '../../../data/map-lenses';
import { THREADS_LENS_WORDS, LENS_VIEW_WORDS } from '../../../data/view-content';
import { ensureDominionProjection } from '../../simulationRuntime';
import { dominionLensVM, godPrimarySphere, type DominionLensVM } from '../../dominionViewModels';
import type { ViewSelector } from '../readView';
import type { ViewContext } from '../viewContext';
import { emptyHexLensVM, type HexLensVM } from './lensTypes';
import { buildThreadsLens } from './threadsLens';

export type LensViewId = 'dominion';

export type HexLensId = Exclude<MapLensId, 'dominion'>;

export interface LensViewArgs {
  lensId: LensViewId;
  /**
   * The projection's build stamp (`builtAtTick`, `builtAtStructure`, band
   * fingerprint) plus the god's sphere. Everything the view model reads changes
   * the stamp, so the entry is structure-keyed: the lens keeps the same arrays
   * across ticks until the projection refreshes, and the map's lens layer is not
   * torn down every tick.
   */
  stamp: string;
}

export const lensViewSelector: ViewSelector<LensViewArgs, DominionLensVM> = {
  id: 'lens',
  invalidation: 'structure',
  key: (args) => `${args.lensId}|${args.stamp}`,
  fallback: () => dominionLensVM(null, null, [], false),
  build(ctx) {
    return buildDominionLens(ctx);
  },
};

function buildDominionLens(ctx: ViewContext): DominionLensVM {
  if (!ctx.runtime || !ctx.ascendantId) return dominionLensVM(null, null, [], false);
  const projection = ensureDominionProjection(
    ctx.runtime, ctx.graph, ctx.tiles as HexTile[], ctx.ascendantId, ctx.tick,
  );
  return dominionLensVM(projection, godPrimarySphere(ctx.graph, ctx.ascendantId), [], true);
}

/** The stamp `lensViewSelector`'s key reads, from a projection (or none). */
export function dominionProjectionStamp(
  projection: { builtAtTick: number; builtAtStructure: number; placeBandFingerprint: string } | null,
  godSphere: string | null,
): string {
  const p = projection
    ? `${projection.builtAtTick}:${projection.builtAtStructure}:${projection.placeBandFingerprint}`
    : 'none';
  return `${p}|${godSphere ?? ''}`;
}

// ─── The total lens record (Law 58) ──────────────────────────────────

/** A hex lens's builder and its fallback legend words. */
export interface HexLensEntry {
  layer: 'hex';
  build: (ctx: ViewContext) => HexLensVM;
  /** Legend head and lines for the typed fallback. */
  head: string;
  lines: readonly string[];
}

export interface DominionLensEntry {
  layer: 'dominion';
  build: (ctx: ViewContext) => DominionLensVM;
}

export type LensSelectorEntry = DominionLensEntry | HexLensEntry;

/** Every hex lens's builder — total over the hex lens ids. */
export const HEX_LENS_SELECTORS: Record<HexLensId, HexLensEntry> = {
  threads: {
    layer: 'hex',
    build: buildThreadsLens,
    head: THREADS_LENS_WORDS.legendHead,
    lines: THREADS_LENS_WORDS.legend,
  },
};

/** Every lens's view model and layer family — total over `MapLensId`. */
export const LENS_SELECTORS: { dominion: DominionLensEntry } & Record<HexLensId, HexLensEntry> = {
  dominion: { layer: 'dominion', build: buildDominionLens },
  ...HEX_LENS_SELECTORS,
};

/** The layer family a lens id is drawn by. */
export function lensLayerOf(id: MapLensId): MapLensLayerKind {
  return LENS_SELECTORS[id].layer;
}

/** The typed fallback for a hex lens: nothing lit, the legend says so in words. */
export function hexLensFallback(lensId: HexLensId): HexLensVM {
  const entry = HEX_LENS_SELECTORS[lensId];
  return emptyHexLensVM(lensId, entry?.head ?? '', entry?.lines ?? [], LENS_VIEW_WORDS.unavailable);
}

export interface HexLensViewArgs {
  lensId: HexLensId;
}

/** A hex lens's view model, on the seam (`getView('lens.hex', { lensId })`). */
export const hexLensViewSelector: ViewSelector<HexLensViewArgs, HexLensVM> = {
  id: 'lens.hex',
  invalidation: 'world',
  key: (args) => args.lensId,
  fallback: (args) => hexLensFallback(args.lensId),
  build(ctx, { lensId }) {
    const entry = HEX_LENS_SELECTORS[lensId];
    if (!entry) return hexLensFallback(lensId);
    return entry.build(ctx);
  },
};

/** One lens's view model, whichever family draws it (tests and the debug bridge). */
export function selectLensView(
  ctx: ViewContext,
  lensId: MapLensId,
): { layer: 'dominion'; vm: DominionLensVM } | { layer: 'hex'; vm: HexLensVM } {
  if (lensId === 'dominion') return { layer: 'dominion', vm: LENS_SELECTORS.dominion.build(ctx) };
  return { layer: 'hex', vm: LENS_SELECTORS[lensId].build(ctx) };
}
