/**
 * Pass 01: Province Seeding + Flood-fill
 *
 * Seeds province centers — one per living culture, N for lost cultures, M for wilderness —
 * then uses a priority-queue weighted flood-fill to assign every hex to a province.
 *
 * NFP #1 Tunability: All growth weights and biome-temp-band tables are named constants.
 * NFP #2 Inspectability: ctx.provinces records seedHex, capitalHex, cultureId, isLost.
 * NFP #3 Determinism: All randomness via mulberry32(seed + PASS_SEED_PROVINCES).
 * NFP #4 Fail-soft: If a culture can't find a valid seed, falls back to random placement.
 */
import { mulberry32 } from '../../../lib/prng';
import { hexNeighbors, hexDistance } from '../../../lib/hexMath';
import {
  PASS_SEED_PROVINCES,
  PROVINCE_MAX_HEXES,
  PROVINCE_MIN_SEED_DISTANCE,
  WILDERNESS_PROVINCE_COUNT,
  PROVINCE_CAPITAL_RADIUS,
  PROVINCE_HEARTLAND_RADIUS,
  BIOME_TEMP_BANDS,
} from '../constants';
import {
  PROVINCE_ROLE_CAPITAL,
  PROVINCE_ROLE_HEARTLAND,
  PROVINCE_ROLE_BORDERLAND,
} from '../types';
import type { Province, WorldGenContext, WorldGenParams, CultureForWorldgen } from '../types';
import type { HexCoord } from '../../../types';

// ─── Internal types ───────────────────────────────────────────────

interface SeedCandidate {
  hex: HexCoord;
  provinceId: number;
  priority: number; // lower = expand first
}

// Simple min-heap priority queue
class MinHeap<T extends { priority: number }> {
  private data: T[] = [];

  push(item: T): void {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size(): number { return this.data.length; }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent].priority <= this.data[i].priority) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private _sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].priority < this.data[smallest].priority) smallest = left;
      if (right < n && this.data[right].priority < this.data[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Latitude temperature estimate: 1.0 at equator (mid-row), 0.0 at poles */
function estimatedTemp(row: number, rows: number): number {
  return 1 - Math.abs(row - rows / 2) / (rows / 2);
}

/** Get the [minTemp, maxTemp] band for a set of biomes (broadest compatible band) */
function tempBandForBiomes(biomes: string[]): [number, number] {
  let min = 1.0;
  let max = 0.0;
  for (const b of biomes) {
    const band = BIOME_TEMP_BANDS[b] ?? BIOME_TEMP_BANDS['_default']!;
    min = Math.min(min, band[0]);
    max = Math.max(max, band[1]);
  }
  return [min, max];
}

/** Check if a hex is too close to any already-placed seed */
function tooClose(hex: HexCoord, seeds: HexCoord[], minDist: number): boolean {
  for (const seed of seeds) {
    if (hexDistance(hex, seed) < minDist) return true;
  }
  return false;
}

/** Find a seed hex compatible with a culture's biome temperature band */
function findSeed(
  culture: CultureForWorldgen,
  rng: () => number,
  cols: number,
  rows: number,
  placedSeeds: HexCoord[],
  maxAttempts: number = 200,
): HexCoord | null {
  const [tMin, tMax] = tempBandForBiomes(culture.preferredBiomes);

  // Try to find a hex in the right latitude band
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const col = Math.floor(rng() * cols);
    const row = Math.floor(rng() * rows);
    const t = estimatedTemp(row, rows);

    if (t >= tMin && t <= tMax) {
      const hex = { col, row };
      if (!tooClose(hex, placedSeeds, PROVINCE_MIN_SEED_DISTANCE)) {
        return hex;
      }
    }
  }

  // Fallback: try any hex not too close (fail-soft NFP #4)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const col = Math.floor(rng() * cols);
    const row = Math.floor(rng() * rows);
    const hex = { col, row };
    if (!tooClose(hex, placedSeeds, PROVINCE_MIN_SEED_DISTANCE)) {
      return hex;
    }
  }

  // Cannot find a valid hex — fail gracefully (NFP #4)
  return null;
}

// ─── Main pass ───────────────────────────────────────────────────

export function runProvincePass(ctx: WorldGenContext, params: WorldGenParams): void {
  const { cols, rows, seed, livingCultures, lostCultures } = params;
  const rng = mulberry32(seed + PASS_SEED_PROVINCES);

  const provinces: Province[] = [];
  const placedSeeds: HexCoord[] = [];

  // Helper to add a province
  function addProvince(
    cultureId: string | null,
    isLost: boolean,
    seedHex: HexCoord,
    preferredBiomes: string[],
    maxHexes: number = PROVINCE_MAX_HEXES,
  ): number {
    const id = provinces.length;
    provinces.push({
      id,
      cultureId,
      isLost,
      seedHex,
      capitalHex: seedHex, // refined after flood-fill
      terrainIdentity: preferredBiomes as import('../../../types').TerrainType[],
      maxHexes,
    });
    placedSeeds.push(seedHex);
    return id;
  }

  // 1. Place living culture seeds
  for (const culture of livingCultures) {
    const seedHex = findSeed(culture, rng, cols, rows, placedSeeds);
    if (seedHex) {
      addProvince(culture.id, false, seedHex, culture.preferredBiomes);
    }
  }

  // 2. Place lost culture seeds
  for (const culture of lostCultures) {
    const seedHex = findSeed(culture, rng, cols, rows, placedSeeds);
    if (seedHex) {
      addProvince(culture.id, true, seedHex, culture.preferredBiomes);
    }
  }

  // 3. Place wilderness seeds
  const wildernessCount = WILDERNESS_PROVINCE_COUNT;
  for (let w = 0; w < wildernessCount; w++) {
    const wildCulture: CultureForWorldgen = {
      id: `wilderness_${w}`,
      preferredBiomes: [],
      toleratedBiomes: [],
    };
    const seedHex = findSeed(wildCulture, rng, cols, rows, placedSeeds);
    if (seedHex) {
      addProvince(null, false, seedHex, []);
    }
  }

  // 4. Weighted flood-fill from all seeds simultaneously
  const hexCounts = new Int32Array(provinces.length); // count per province
  const heap = new MinHeap<SeedCandidate>();

  // Seed the heap with all province seeds at priority 0
  for (const p of provinces) {
    const idx = p.seedHex.row * cols + p.seedHex.col;
    ctx.provinceIds[idx] = p.id;
    heap.push({ hex: p.seedHex, provinceId: p.id, priority: 0 });
    hexCounts[p.id] = 1;
  }

  while (heap.size > 0) {
    const { hex, provinceId, priority } = heap.pop()!;
    const p = provinces[provinceId];

    // Skip if this province is full
    if (hexCounts[provinceId] >= p.maxHexes) continue;

    // Expand to neighbors
    const neighbors = hexNeighbors(hex);
    for (const neighbor of neighbors) {
      // Bounds check
      if (neighbor.col < 0 || neighbor.col >= cols || neighbor.row < 0 || neighbor.row >= rows) continue;

      const nIdx = neighbor.row * cols + neighbor.col;

      // Skip already claimed hexes
      if (ctx.provinceIds[nIdx] >= 0) continue;

      // Claim this hex
      ctx.provinceIds[nIdx] = provinceId;
      hexCounts[provinceId]++;

      // Growth cost: base + small random noise for organic shapes
      const cost = priority + 1.0 + rng() * 0.5;
      heap.push({ hex: neighbor, provinceId, priority: cost });
    }
  }

  // 5. Assign any remaining unclaimed hexes to nearest province (fail-soft)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (ctx.provinceIds[idx] < 0) {
        // Find nearest province seed
        let nearestId = 0;
        let nearestDist = Infinity;
        const hex = { col, row };
        for (const p of provinces) {
          const d = hexDistance(hex, p.seedHex);
          if (d < nearestDist) {
            nearestDist = d;
            nearestId = p.id;
          }
        }
        ctx.provinceIds[idx] = nearestId;
      }
    }
  }

  // 6. Assign province roles per-province using hex count fractions
  // This avoids the fixed-radius problem on small grids where absolute distances
  // might cover the entire province.
  // Role thresholds: innermost 15% of hexes (by distance) = capital, next 50% = heartland, rest = borderland.

  // For each province, compute the max distance of any assigned hex from seed
  const provinceMaxDist = new Int32Array(provinces.length);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const provinceId = ctx.provinceIds[idx];
      if (provinceId < 0 || provinceId >= provinces.length) continue;
      const p = provinces[provinceId];
      const dist = hexDistance({ col, row }, p.seedHex);
      if (dist > provinceMaxDist[provinceId]) provinceMaxDist[provinceId] = dist;
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const provinceId = ctx.provinceIds[idx];
      if (provinceId < 0 || provinceId >= provinces.length) continue;

      const p = provinces[provinceId];
      const dist = hexDistance({ col, row }, p.seedHex);
      const maxDist = Math.max(provinceMaxDist[provinceId], 1);

      // Apply absolute limits capped by province extent
      const effectiveCapital = Math.min(PROVINCE_CAPITAL_RADIUS, Math.max(1, Math.floor(maxDist * 0.15)));
      const effectiveHeartland = Math.min(PROVINCE_HEARTLAND_RADIUS, Math.max(effectiveCapital + 1, Math.floor(maxDist * 0.55)));

      if (dist <= effectiveCapital) {
        ctx.provinceRoles[idx] = PROVINCE_ROLE_CAPITAL;
      } else if (dist <= effectiveHeartland) {
        ctx.provinceRoles[idx] = PROVINCE_ROLE_HEARTLAND;
      } else {
        ctx.provinceRoles[idx] = PROVINCE_ROLE_BORDERLAND;
      }
    }
  }

  // 7. Record province capital hexes (nearest capital-role hex to seed)
  const provinceCapitalHexes: HexCoord[] = provinces.map(p => p.seedHex);
  for (const p of provinces) {
    let bestHex = p.seedHex;
    let bestDist = Infinity;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (ctx.provinceIds[idx] === p.id && ctx.provinceRoles[idx] === PROVINCE_ROLE_CAPITAL) {
          const d = hexDistance({ col, row }, p.seedHex);
          if (d < bestDist) {
            bestDist = d;
            bestHex = { col, row };
          }
        }
      }
    }
    p.capitalHex = bestHex;
    provinceCapitalHexes[p.id] = bestHex;
  }

  // 8. Store results in context
  ctx.provinces = provinces;
  ctx.provinceCapitalHexes = provinceCapitalHexes;
}
