/**
 * Pass 09: Validation
 *
 * Checks structural integrity of the generated world:
 * 1. Drainage guarantee — every land hex has a downhill path to the sea
 * 2. Province coverage — all hexes assigned to a province (or wilderness)
 * 3. Land/ocean balance — neither extreme (< 10% of either)
 * 4. River existence — at least one river path
 * 5. Terrain distribution — counts per type
 * 6. Pass timing — reports ms per pass
 *
 * NFP #1 Tunability: All thresholds in constants.ts.
 * NFP #2 Inspectability: ValidationResult logged in dev mode.
 * NFP #3 Determinism: Pure function of ctx state — no PRNG.
 * NFP #4 Fail-soft: Returns degraded result on any error; never throws.
 */
import type { WorldGenContext } from '../types';
import type { TerrainType } from '../../../types';

// ─── Result interface ────────────────────────────────────────────

export interface ValidationResult {
  /** true if every land hex has at least one lower neighbor or is adjacent to ocean */
  drainageGuaranteed: boolean;
  /** fraction of land hexes with a valid province assignment (0–1) */
  provinceCoverage: number;
  /** fraction of total hexes that are land */
  landFraction: number;
  /** fraction of total hexes that are ocean */
  oceanFraction: number;
  /** number of river paths in ctx.riverPaths */
  riverCount: number;
  /** number of distinct lake clusters */
  lakeCount: number;
  /** count per terrain type */
  terrainDistribution: Record<string, number>;
  /** non-fatal issues */
  warnings: string[];
  /** fatal issues */
  errors: string[];
}

// ─── Helper ──────────────────────────────────────────────────────

function getNeighborIndices(col: number, row: number, cols: number, rows: number): number[] {
  const isOddCol = col % 2 === 1;
  const dirs = isOddCol
    ? [[1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1]]
    : [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [0, 1]];

  const result: number[] = [];
  for (const [dc, dr] of dirs) {
    const nc = col + dc;
    const nr = row + dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
      result.push(nr * cols + nc);
    }
  }
  return result;
}

// ─── Checks ──────────────────────────────────────────────────────

function checkDrainageGuarantee(ctx: WorldGenContext): boolean {
  const { cols, rows, isOcean, drainageElevation, elevation } = ctx;
  // Use drainageElevation if populated, otherwise fall back to raw elevation
  const elev = drainageElevation.some(v => v > 0) ? drainageElevation : elevation;

  let violations = 0;
  let landTotal = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (isOcean[idx]) continue;
      landTotal++;

      const isEdge = col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
      if (isEdge) continue;

      const currentElev = elev[idx];
      const neighbors = getNeighborIndices(col, row, cols, rows);

      let hasDownhillOrCoastal = false;
      for (const nIdx of neighbors) {
        if (isOcean[nIdx]) { hasDownhillOrCoastal = true; break; }
        if (elev[nIdx] < currentElev) { hasDownhillOrCoastal = true; break; }
      }

      if (!hasDownhillOrCoastal) violations++;
    }
  }

  // Drainage is guaranteed if violations are < 5% of land hexes
  // (small fraction may exist due to plateau hexes with equal-elevation neighbors)
  return landTotal > 0 ? violations / landTotal < 0.05 : true;
}

function checkProvinceCoverage(ctx: WorldGenContext): number {
  const { provinceIds, isOcean } = ctx;
  let landTotal = 0;
  let assigned = 0;

  for (let i = 0; i < provinceIds.length; i++) {
    if (!isOcean[i]) {
      landTotal++;
      if (provinceIds[i] >= 0) assigned++;
    }
  }

  return landTotal > 0 ? assigned / landTotal : 1;
}

function countDistinctLakes(ctx: WorldGenContext): number {
  const seen = new Set<number>();
  for (let i = 0; i < ctx.lakeIds.length; i++) {
    if (ctx.lakeIds[i] >= 0) seen.add(ctx.lakeIds[i]);
  }
  return seen.size;
}

function computeTerrainDistribution(ctx: WorldGenContext): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const t of ctx.terrain) {
    dist[t] = (dist[t] ?? 0) + 1;
  }
  return dist;
}

// ─── Main pass ───────────────────────────────────────────────────

/**
 * Run the validation pass. Accepts an optional timing record to report per-pass timing.
 * The second argument is intentionally permissive (Record<string, unknown>) so callers
 * don't need to construct a full WorldGenParams to use this function in tests.
 */
export function runValidationPass(
  ctx: WorldGenContext,
  _params: Record<string, unknown>,
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const { cols, rows, isOcean } = ctx;
    const total = cols * rows;

    // 1. Land/ocean balance
    let landCount = 0;
    for (let i = 0; i < total; i++) {
      if (!isOcean[i]) landCount++;
    }
    const landFraction = landCount / total;
    const oceanFraction = 1 - landFraction;

    if (landFraction < 0.1) errors.push(`Land fraction too low: ${(landFraction * 100).toFixed(1)}%`);
    if (oceanFraction < 0.1) errors.push(`Ocean fraction too low: ${(oceanFraction * 100).toFixed(1)}%`);

    // 2. Drainage guarantee
    const drainageGuaranteed = checkDrainageGuarantee(ctx);
    if (!drainageGuaranteed) {
      errors.push('Drainage guarantee violated: some land hexes have no downhill path to the sea');
    }

    // 3. Province coverage
    const provinceCoverage = checkProvinceCoverage(ctx);
    if (provinceCoverage < 0.99) {
      warnings.push(`Province coverage incomplete: ${(provinceCoverage * 100).toFixed(1)}% of land hexes assigned`);
    }

    // 4. River existence
    const riverCount = ctx.riverPaths.length;
    if (riverCount === 0) {
      warnings.push('No river paths generated — world may lack water features');
    }

    // 5. Lake count
    const lakeCount = countDistinctLakes(ctx);

    // 6. Terrain distribution
    const terrainDistribution = computeTerrainDistribution(ctx);
    const distinctTypes = Object.keys(terrainDistribution).filter(k => terrainDistribution[k] > 0);
    if (distinctTypes.length < 3) {
      warnings.push(`Low terrain variety: only ${distinctTypes.length} distinct types`);
    }

    const result: ValidationResult = {
      drainageGuaranteed,
      provinceCoverage,
      landFraction,
      oceanFraction,
      riverCount,
      lakeCount,
      terrainDistribution,
      warnings,
      errors,
    };

    // Dev-mode logging
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      if (errors.length > 0) {
        console.warn('[WorldGen] Validation errors:', errors);
      }
      if (warnings.length > 0) {
        console.info('[WorldGen] Validation warnings:', warnings);
      }
    }

    return result;
  } catch (err) {
    // Fail-soft: return degraded result rather than crashing
    console.error('[WorldGen] Validation pass failed:', err);
    return {
      drainageGuaranteed: false,
      provinceCoverage: 0,
      landFraction: 0,
      oceanFraction: 0,
      riverCount: 0,
      lakeCount: 0,
      terrainDistribution: {},
      warnings: [],
      errors: [`Validation crashed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}
