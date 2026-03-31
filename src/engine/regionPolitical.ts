/**
 * regionPolitical.ts — Political region grouping (barony/kingdom assignment).
 *
 * Reads geographic regions (from regionDetection.ts) and province data (from worldgen)
 * to assign each land hex to a barony (province-level) and kingdom (culture-group-level).
 *
 * Algorithm:
 *   1. One province = one barony.
 *      For each province, collect geographic regions whose hexes fall in that province
 *      (by provinceIds lookup). The barony's hexes = union of its geographic regions' hexes.
 *   2. Kingdom grouping: baronies with same non-null cultureId form one kingdom.
 *      Wilderness baronies (cultureId=null) have no kingdom parent.
 *   3. Build hexBaronyId and hexKingdomId lookup maps from assignments.
 *   4. Generate placeholder names from seeded PRNG.
 *
 * NFP #1 Tunability: All magic numbers are named constants.
 * NFP #2 Inspectability: hexBaronyId and hexKingdomId maps give O(1) per-hex lookup.
 * NFP #3 Determinism: Uses mulberry32 seeded PRNG for names.
 * NFP #4 Fail-soft: Provinces with no hexes produce empty-hex baronies (still valid).
 */

import type { HexCoord } from '../types';
import type { RegionCluster, BaronyRegion, KingdomRegion } from './regionTypes';
import type { Province } from './worldgen/types';
import { hexKey, hexKeyFromCoord } from '../lib/hexKey';

// ─── Name generation constants (NFP #1: Tunability) ──────────────────────────

const BARONY_ADJECTIVES = [
  'Stone', 'East', 'West', 'North', 'South', 'Grey', 'Black', 'Red', 'Green',
  'Iron', 'High', 'Low', 'Deep', 'Far', 'Old', 'New', 'Wild', 'Great', 'Dark',
  'Bright', 'Silver', 'Gold', 'Swift', 'Slow', 'Storm', 'Frost', 'Sun', 'Moon',
];

const BARONY_NOUNS = [
  'mark', 'march', 'vale', 'ford', 'wick', 'hold', 'keep', 'gate', 'heath',
  'moor', 'field', 'wood', 'ridge', 'crest', 'peak', 'bay', 'shore', 'haven',
  'stead', 'bridge', 'cross', 'hall', 'fen', 'glen', 'mere', 'tor', 'burn',
];

const KINGDOM_NOUNS = [
  'realm', 'dominion', 'throne', 'crown', 'lands', 'hold', 'empire', 'domain',
  'sovereignty', 'principality', 'duchy', 'march',
];

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

/**
 * mulberry32 PRNG — fast, deterministic, 32-bit output.
 * NFP #3: Same seed always produces same sequence.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateBaronyName(id: number, seed: number): string {
  const rng = mulberry32(seed + id * 1777);
  return pickRandom(BARONY_ADJECTIVES, rng) + pickRandom(BARONY_NOUNS, rng);
}

/**
 * Derive a short kingdom-label form from a full culture name.
 * Strips leading articles/phrases ("The ", "Children of the ", "Keepers of the ")
 * and truncates at " of the " for names assembled from the long pattern.
 * Examples:
 *   "The Wild Storm of the Deepwood"      → "Wild Storm"
 *   "Children of the Shadow-Kept Mires"   → "Shadow-Kept Mires"
 *   "The Blade Heights"                    → "Blade Heights"
 *   "Stone-Set Iron"                       → "Stone-Set Iron"
 */
function toKingdomShortName(cultureName: string): string {
  let s = cultureName;
  // Strip leading articles/phrases (order matters — longer first)
  for (const prefix of ['Children of the ', 'Keepers of the ', 'The ']) {
    if (s.startsWith(prefix)) { s = s.slice(prefix.length); break; }
  }
  // Truncate at " of the " (pattern: "{foundation} {sphere} of the {biome}")
  const ofTheIdx = s.indexOf(' of the ');
  if (ofTheIdx > 0) s = s.slice(0, ofTheIdx);
  return s;
}

function generateKingdomName(
  cultureId: string,
  seed: number,
  idx: number,
  cultureName?: string,
): string {
  const rng = mulberry32(seed + idx * 3331 + cultureId.charCodeAt(0) * 17);
  const noun = pickRandom(KINGDOM_NOUNS, rng);
  if (cultureName) {
    const short = toKingdomShortName(cultureName);
    return `${noun} of ${short}`;
  }
  // Fallback: old prefix behaviour (only reached when no cultureNameMap provided)
  const prefix = cultureId.length > 4
    ? cultureId.slice(0, 1).toUpperCase() + cultureId.slice(1, 4)
    : cultureId.slice(0, 1).toUpperCase() + cultureId.slice(1);
  return `${prefix} ${noun}`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Assign land hexes to baronies and kingdoms.
 *
 * @param geographicRegions - Geographic region clusters from detectRegionsBorderCost
 * @param hexRegionId - "col,row" -> geographic region id map (from Plan 01)
 * @param provinces - Province array from WorldGenContext
 * @param provinceCapitalHexes - Capital hex for each province (indexed same as provinces)
 * @param provinceIds - Flat Int16Array: provinceIds[row * cols + col] = province id, -1 = unassigned
 * @param cols - Grid width (for provinceIds index calculation)
 * @param seed - World seed for deterministic name generation
 */
export function assignPoliticalRegions(
  geographicRegions: RegionCluster[],
  _hexRegionId: Map<string, number>,
  provinces: Province[],
  provinceCapitalHexes: HexCoord[],
  provinceIds: Int16Array,
  cols: number,
  seed: number,
  cultureNameMap?: Map<string, string>,
): {
  baronies: BaronyRegion[];
  kingdoms: KingdomRegion[];
  hexBaronyId: Map<string, number>;
  hexKingdomId: Map<string, number>;
} {
  // ── Step 1: Build province hex sets from provinceIds array ──────────────────

  // Map from province id -> set of hex keys owned by that province
  const provinceHexSets = new Map<number, Set<string>>();
  for (let i = 0; i < provinces.length; i++) {
    provinceHexSets.set(i, new Set());
  }

  const totalHexes = provinceIds.length;
  for (let idx = 0; idx < totalHexes; idx++) {
    const provinceId = provinceIds[idx];
    if (provinceId < 0) continue;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    provinceHexSets.get(provinceId)?.add(hexKey(col, row));
  }

  // ── Step 2: Create one barony per province ──────────────────────────────────

  const hexBaronyId = new Map<string, number>();
  const baronies: BaronyRegion[] = [];

  for (let pIdx = 0; pIdx < provinces.length; pIdx++) {
    const province = provinces[pIdx];
    const provinceHexSet = provinceHexSets.get(pIdx) ?? new Set<string>();
    const capitalHex = provinceCapitalHexes[pIdx] ?? province.capitalHex;

    // Collect geographic regions whose hexes are majority in this province
    const geographicRegionIds: number[] = [];
    const baronyHexes: HexCoord[] = [];

    // Assign all hexes in this province's hex set to the barony
    for (const hexKey of provinceHexSet) {
      const commaIdx = hexKey.indexOf(',');
      const col = parseInt(hexKey.slice(0, commaIdx), 10);
      const row = parseInt(hexKey.slice(commaIdx + 1), 10);
      baronyHexes.push({ col, row });
      hexBaronyId.set(hexKey, pIdx);
    }

    // Find geographic regions that are in this province
    for (const cluster of geographicRegions) {
      let inProvince = 0;
      for (const hex of cluster.hexes) {
        if (provinceHexSet.has(hexKeyFromCoord(hex))) inProvince++;
      }
      // Majority of the cluster's hexes in this province
      if (inProvince > 0 && inProvince >= cluster.hexes.length / 2) {
        geographicRegionIds.push(cluster.id);
      }
    }

    // Compute centroid — mean of hex coords snapped to nearest in-barony hex
    let centroid: { col: number; row: number };
    if (baronyHexes.length === 0) {
      centroid = { col: capitalHex.col, row: capitalHex.row };
    } else {
      const sumCol = baronyHexes.reduce((s, h) => s + h.col, 0);
      const sumRow = baronyHexes.reduce((s, h) => s + h.row, 0);
      const rawCol = sumCol / baronyHexes.length;
      const rawRow = sumRow / baronyHexes.length;

      let bestHex = baronyHexes[0];
      let bestDist = Infinity;
      for (const hex of baronyHexes) {
        const d = (hex.col - rawCol) ** 2 + (hex.row - rawRow) ** 2;
        if (d < bestDist) { bestDist = d; bestHex = hex; }
      }
      centroid = { col: bestHex.col, row: bestHex.row };
    }

    baronies.push({
      id: pIdx,
      cultureId: province.cultureId,
      capitalHex,
      geographicRegionIds,
      hexes: baronyHexes,
      centroid,
      name: generateBaronyName(pIdx, seed),
    });
  }

  // ── Step 3: Group baronies by cultureId into kingdoms ──────────────────────

  const hexKingdomId = new Map<string, number>();
  const kingdoms: KingdomRegion[] = [];

  // Group: cultureId -> barony ids
  const cultureGroups = new Map<string, number[]>();
  for (const barony of baronies) {
    if (barony.cultureId === null) continue; // wilderness — no kingdom
    if (!cultureGroups.has(barony.cultureId)) {
      cultureGroups.set(barony.cultureId, []);
    }
    cultureGroups.get(barony.cultureId)!.push(barony.id);
  }

  let kingdomIdx = 0;
  for (const [cultureId, baronyIds] of cultureGroups) {
    // Compute kingdom capital: use barony with the lowest barony id (first province, roughly the "capital")
    const sortedBaronyIds = [...baronyIds].sort((a, b) => a - b);
    const capitalBarony = baronies.find(b => b.id === sortedBaronyIds[0])!;
    const capitalHex = capitalBarony.capitalHex;

    // Compute kingdom centroid: mean of barony centroids
    const centroidCols = sortedBaronyIds.map(bid => baronies.find(b => b.id === bid)!.centroid.col);
    const centroidRows = sortedBaronyIds.map(bid => baronies.find(b => b.id === bid)!.centroid.row);
    const meanCol = Math.round(centroidCols.reduce((s, c) => s + c, 0) / centroidCols.length);
    const meanRow = Math.round(centroidRows.reduce((s, r) => s + r, 0) / centroidRows.length);

    const kingdomId = kingdomIdx++;

    // Build hexKingdomId for all hexes in all baronies of this kingdom
    for (const baronyId of baronyIds) {
      const barony = baronies.find(b => b.id === baronyId)!;
      for (const hex of barony.hexes) {
        hexKingdomId.set(hexKeyFromCoord(hex), kingdomId);
      }
    }

    kingdoms.push({
      id: kingdomId,
      cultureId,
      capitalHex,
      baronyIds: sortedBaronyIds,
      centroid: { col: meanCol, row: meanRow },
      name: generateKingdomName(cultureId, seed, kingdomId, cultureNameMap?.get(cultureId)),
    });
  }

  return { baronies, kingdoms, hexBaronyId, hexKingdomId };
}
