/**
 * WorldGenPipeline — orchestrates all generation passes in order.
 *
 * Each pass receives the shared WorldGenContext and mutates it in place.
 * Passes are independent modules with per-pass PRNG streams.
 *
 * NFP #4 Fail-soft: Each pass is wrapped in try/catch. If a pass fails,
 * the pipeline logs the error and continues with a degraded context.
 *
 * Passes added here per plan:
 *   Plan 02-01: 00-grid, 01-provinces, 02-elevation, 03-coastline
 *   Plan 02-02+: 04-climate, 05-hydrology, 06-biome, 07-smoothing
 */
import { runGridPass } from './passes/pass00-grid';
import { runProvincePass } from './passes/pass01-provinces';
import { runElevationPass } from './passes/pass02-elevation';
import { runCoastlinePass } from './passes/pass03-coastline';
import type { WorldGenContext, WorldGenParams } from './types';

export class WorldGenPipeline {
  run(params: WorldGenParams): WorldGenContext {
    const ctx = runGridPass(params);
    this._runPass('province', () => runProvincePass(ctx, params));
    this._runPass('elevation', () => runElevationPass(ctx, params));
    this._runPass('coastline', () => runCoastlinePass(ctx, params));
    // Passes 04-09 will be added in Plans 02-02 and 02-03
    return ctx;
  }

  /**
   * Wraps a pass with error handling (NFP #4 Fail-soft).
   * If a pass throws, logs the error and continues — no crash.
   */
  private _runPass(name: string, fn: () => void): void {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      fn();
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
      if (import.meta.env?.DEV) {
        console.debug(`[WorldGen] Pass '${name}' completed in ${elapsed.toFixed(1)}ms`);
      }
    } catch (err) {
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
      console.error(`[WorldGen] Pass '${name}' failed after ${elapsed.toFixed(1)}ms:`, err);
      // Continue with degraded context — fail-soft
    }
  }
}
