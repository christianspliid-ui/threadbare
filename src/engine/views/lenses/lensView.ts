/**
 * lens — the map lens's view model (THR-1822 § D11; slice 1 builds the Dominion arm).
 *
 * The Dominion arm calls `ensureDominionProjection` + `dominionLensVM` unchanged —
 * the seam reuses THR-1750's projection, it never forks it. Threads, Trouble and
 * Trade join with the lens build (plan § D16 step 3), each as one more arm here.
 */
import type { HexTile } from '../../../types';
import { ensureDominionProjection } from '../../simulationRuntime';
import { dominionLensVM, godPrimarySphere, type DominionLensVM } from '../../dominionViewModels';
import type { ViewSelector } from '../readView';

export type LensViewId = 'dominion';

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
    if (!ctx.runtime || !ctx.ascendantId) return dominionLensVM(null, null, [], false);
    const projection = ensureDominionProjection(
      ctx.runtime, ctx.graph, ctx.tiles as HexTile[], ctx.ascendantId, ctx.tick,
    );
    return dominionLensVM(projection, godPrimarySphere(ctx.graph, ctx.ascendantId), [], true);
  },
};

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
