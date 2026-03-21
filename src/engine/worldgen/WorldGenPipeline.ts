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
 *   Plan 02-02: 04-climate, 06-tempReassess, 07-biome, 08-smoothing
 *   Plan 02-03: 05-hydrology, 09-validation
 */
import { runGridPass } from './passes/pass00-grid';
import { runProvincePass } from './passes/pass01-provinces';
import { runElevationPass } from './passes/pass02-elevation';
import { runCoastlinePass } from './passes/pass03-coastline';
import { runClimatePass } from './passes/pass04-climate';
import { runHydrologyPass } from './passes/pass05-hydrology';
import { runTempReassessPass } from './passes/pass06-tempReassess';
import { runBiomePass } from './passes/pass07-biome';
import { runSmoothingPass } from './passes/pass08-smoothing';
import { runValidationPass } from './passes/pass09-validation';
import type { WorldGenContext, WorldGenParams } from './types';

export class WorldGenPipeline {
  /** Per-pass timing from the most recent run (ms) */
  readonly passTiming: Record<string, number> = {};

  run(params: WorldGenParams): WorldGenContext {
    const ctx = runGridPass(params);
    this._runPass('province', () => runProvincePass(ctx, params));
    this._runPass('elevation', () => runElevationPass(ctx, params));
    this._runPass('coastline', () => runCoastlinePass(ctx, params));
    this._runPass('climate', () => runClimatePass(ctx, params));
    this._runPass('hydrology', () => runHydrologyPass(ctx, params));
    this._runPass('tempReassess', () => runTempReassessPass(ctx));
    this._runPass('biome', () => runBiomePass(ctx));
    this._runPass('smoothing', () => runSmoothingPass(ctx));
    this._runPass('validation', () => runValidationPass(ctx, {}));
    return ctx;
  }

  /**
   * Wraps a pass with error handling (NFP #4 Fail-soft).
   * If a pass throws, logs the error and continues — no crash.
   * Records timing for each pass in this.passTiming.
   */
  private _runPass(name: string, fn: () => void): void {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      fn();
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
      this.passTiming[name] = elapsed;
      if (import.meta.env?.DEV) {
        console.debug(`[WorldGen] Pass '${name}' completed in ${elapsed.toFixed(1)}ms`);
      }
    } catch (err) {
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
      this.passTiming[name] = elapsed;
      console.error(`[WorldGen] Pass '${name}' failed after ${elapsed.toFixed(1)}ms:`, err);
      // Continue with degraded context — fail-soft
    }
  }
}
